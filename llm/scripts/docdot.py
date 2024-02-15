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


# Specify the desktop path
desktop_path = os.path.join(os.path.expanduser("~"), "Documents")

# Specify the folder name
folder_name = "Dot-data"

# Combine the desktop path and folder name
folder_path = os.path.join(desktop_path, folder_name)

# Create the folder if it doesn't exist
if not os.path.exists(folder_path):
    os.makedirs(folder_path)




current_directory = os.path.dirname(os.path.realpath(__file__))
model_directory = os.path.join(current_directory, '..', 'mpnet')

#print("Model Directory:", os.path.abspath(model_directory))

### LOAD EMBEDDING SETTINGS
embeddings=HuggingFaceEmbeddings(model_name=model_directory, model_kwargs={'device':'mps'})
vector_store = FAISS.load_local(os.path.join(folder_path, "Dot-data"), embeddings)
n_gpu_layers = 1  # Metal set to 1 is enough.
n_batch = 512  # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.


# Find the current script's directory
script_dir = os.path.dirname(__file__)

# Construct the relative path
relative_model_path = "mistral-7b-instruct-v0.2.Q4_K_M.gguf"
model_path = os.path.join(script_dir, relative_model_path)


#callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])         #THIS MAKES THE TEXT STREAM LIKE CHATGPT, OTHERWISE IT JUST POPS OUT

llm = LlamaCpp(
    model_path=model_path,
    n_gpu_layers=n_gpu_layers,
    n_batch=n_batch,
    f16_kv=True,  # MUST set to True, otherwise you will run into problem after a couple of calls ONLY FOR MAC
    #callback_manager=callback_manager,
    #verbose=True, # Verbose is required to pass to the callback manager,
    max_tokens=2000,
    temperature= 0.01,
    n_ctx=8000,
)

#print('llm loaded')

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


def chat(input_text):
    while True:
        user_input=str(input_text)
        query='ass'
        if query=='exit':
            print('Exiting')
            sys.exit()
        if query=='':
            continue
        result = chain({'query': user_input})['result']
        return result

def send_response(response):
    # Convert the response to JSON
    response_json = json.dumps({"result": response})

    # Print the JSON to stdout
    print(response_json)

    # Flush stdout to ensure the message is sent immediately
    sys.stdout.flush()

if __name__ == "__main__":
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

        # Send each chunk individually
        for chunk in chunks:
            send_response(chunk)

