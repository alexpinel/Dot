import sys
import json
from langchain import PromptTemplate
from langchain.chains import RetrievalQA
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.llms import LlamaCpp
from langchain import PromptTemplate
from langchain.callbacks.manager import CallbackManager
import os



def read_config(config_path):
    try:
        with open(config_path, 'r') as file:
            config = json.load(file)
        return config
    except FileNotFoundError:
        print(f"Configuration file not found at {config_path}.")
        return {}
    except json.JSONDecodeError:
        print("Error decoding JSON from configuration file.")
        return {}



if __name__ == "__main__":
    if len(sys.argv) > 1:

        # Folder paths and model initialization
        documents_path = os.path.join(os.path.expanduser("~"), "Documents")
        folder_name = "Dot-Data"
        folder_path = os.path.join(documents_path, folder_name)
        if not os.path.exists(folder_path):
            print('LLM NOT FOUND!')
            os.makedirs(folder_path)
        model_path = os.path.join(folder_path, "Phi-3-mini-4k-instruct-q4.gguf")

        config_path = sys.argv[1].strip('"')  # Remove any surrounding quotes
        config = read_config(config_path)
        #print("Current Configuration:", config)

        # Setup configuration with defaults in case some settings are missing
        n_gpu_layers = -1  # Metal set to 1 is typically enough for Apple Silicon
        n_batch = config.get('n_batch', 256) # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.
        max_tokens = config.get('max_tokens', 500)
        temperature = config.get('big_dot_temperature', 0.7)
        n_ctx = config.get('n_ctx', 4000)
        initial_prompt = config.get('big_dot_prompt', "You are called Dot, You are a helpful and honest assistant.")
        if 'ggufFilePath' in config and config['ggufFilePath'] is None:
            del config['ggufFilePath']  # Removes the key if it's explicitly None

        llm_model = config.get('ggufFilePath', model_path)  # This now only falls back to model_path if 'ggufFilePath' is not in config


        current_directory = os.path.dirname(os.path.realpath(__file__))
        model_directory = os.path.join(current_directory, '..', 'baai')

        #print("Model Directory:", os.path.abspath(model_directory))

        ### LOAD EMBEDDING SETTINGS
        embeddings=HuggingFaceEmbeddings(model_name=model_directory, model_kwargs={'device':'mps'}) # SET TO 'cpu' for PC
        vector_store = FAISS.load_local(os.path.join(folder_path, "Dot-data"), embeddings)


        # Find the current script's directory
        script_dir = os.path.dirname(__file__)


        llm = LlamaCpp(
            model_path=llm_model,
            n_gpu_layers=n_gpu_layers,
            n_batch=n_batch,
            f16_kv=True,  # MUST set to True, otherwise you will run into problem after a couple of calls ONLY FOR MAC
            max_tokens=max_tokens,
            temperature= 0.01,
            n_ctx=n_ctx,
        )

        DEFAULT_SYSTEM_PROMPT ="""
        You are a good, honest assistant. 

        If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you do not know the answer to a question, make it clear you do not know the answer instead of making up false information.
        """.strip()

        def generate_prompt(prompt: str, system_prompt: str = DEFAULT_SYSTEM_PROMPT) -> str:
            return f"""
            [INST] <<SYS>>
            {system_prompt}
            <</SYS>>

            {prompt} [/INST]
            """.strip()

        SYSTEM_PROMPT ="Use the following pieces of context to answer the question at the end. If you do not know the answer, just say you don't know, don't try to make up an answer."

        template = generate_prompt(
            """
            {context}

            Question: {question}
            """,
                system_prompt = SYSTEM_PROMPT,
        )


        qa_prompt=PromptTemplate(template=template, input_variables=['context', 'question'])

        #start=timeit.default_timer()

        chain = RetrievalQA.from_chain_type(llm=llm,
                                        chain_type='stuff',
                                        retriever=vector_store.as_retriever(search_kwargs={'k': 2}),
                                        return_source_documents=True,
                                        chain_type_kwargs={'prompt': qa_prompt})


        def format_response(dictionary):
            """
            Formats the response dictionary to:
            - Print metadata for each document.
            - Embed an iframe for PDF documents, attempting to open it at a specified page.
            - Display page_content text for Word, Excel, or PowerPoint documents.
            - Display the overall result after the document details.
            Assumes each document in source_documents is an instance of a Document class.
            """
            # Correctly define source_documents from the dictionary
            source_documents = dictionary["source_documents"]
            
            sources = "### Source Documents:\n"
            for doc in source_documents:
                # Safely get the 'source' and 'page' from metadata, default if not found
                source_path = doc.metadata.get("source", "Source path not available.")
                page_number = doc.metadata.get("page", "Page number not available.")
                file_extension = source_path.split('.')[-1].lower() if source_path else ""
                
                # Metadata information
                metadata_info = f"**Source**: {source_path}\n**Page**: {page_number}\n"

                if file_extension == 'pdf' and source_path != "Source path not available.":
                    source_path_with_page = f"{source_path}#page={page_number}"
                    iframe_html = f'<iframe src="{source_path_with_page}" style="width:100%; height:300px; border: 1px solid #ccc; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 10px 0;" frameborder="0"></iframe>'
                    sources += f"\n\n{metadata_info}\n{iframe_html}\n\n"
                elif file_extension in ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']:
                    # For Word, Excel, PowerPoint, display page_content text
                    page_content_text = doc.page_content.replace('\n', ' ') if doc.page_content else "Page content not available."
                    sources += f"\n\n{metadata_info}\n{page_content_text}\n\n"
                else:
                    # Fallback for other file types or if page_content should be displayed by default
                    page_content_text = doc.page_content.replace('\n', ' ') if doc.page_content else "Page content not available."
                    sources += f"\n\n{metadata_info}\n{page_content_text}\n\n"
            
            # Now appending the formatted result at the end
            formatted_result = dictionary["result"]
            complete_response = sources + "\n\n---\n\n### Result:\n" + formatted_result
            
            return complete_response






        def chat(input_text):
            while True:
                user_input=str(input_text)
                query='ass'
                if query=='exit':
                    print('Exiting')
                    sys.exit()
                if query=='':
                    continue
                result = chain({'query': user_input})
                formatted_response = format_response(result)
                return formatted_response



        def send_response(response):
            # Convert the response to JSON
            response_json = json.dumps({"result": response})

            # Print the JSON to stdout
            print(response_json)

            # Flush stdout to ensure the message is sent immediately
            sys.stdout.flush()


        while True:
            # Read input continuously from stdin
            line = sys.stdin.readline().strip()
            if not line:
                break

            # Use the entire line as user input
            user_input = line

            # Perform your processing on user_input
            result = chat(user_input)
            
            # Split the result into chunks of maximum length (e.g., 1000 characters)
            max_chunk_length = 1000
            chunks = [result[i:i + max_chunk_length] for i in range(0, len(result), max_chunk_length)]

            # Send the chunks as an array
            send_response(chunks)

