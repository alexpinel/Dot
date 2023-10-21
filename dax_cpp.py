from langchain import PromptTemplate
from langchain.chains import RetrievalQA
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import sys
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.llms import LlamaCpp
from langchain import PromptTemplate
from langchain.callbacks.manager import CallbackManager


from art import *

tprint("BLUEPOINT")
tprint("Shart v2.k")


def embeddings():
    #**Step 1: Load the PDF File from Data Path****
    loader=DirectoryLoader('mystuff',
                        glob="*.pdf",
                        loader_cls=PyPDFLoader,
                        show_progress=True,
                        use_multithreading=True,
                        recursive=True)

    documents=loader.load()


    #print(documents)

    #***Step 2: Split Text into Chunks***

    text_splitter=RecursiveCharacterTextSplitter(
                                                chunk_size=2048,
                                                chunk_overlap=256)


    text_chunks=text_splitter.split_documents(documents)

    print(len(text_chunks))
    #**Step 3: Load the Embedding Model***


    embeddings=HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2', model_kwargs={'device':'cuda:0'})


    #**Step 4: Convert the Text Chunks into Embeddings and Create a FAISS Vector Store***
    vector_store=FAISS.from_documents(text_chunks, embeddings)
    vector_store.save_local("vectors")
embeddings()


# Callbacks support token-wise streaming
def loadllm():

    embeddings=HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2', model_kwargs={'device': 'cuda:0'})
    vector_store = FAISS.load_local('vectors', embeddings)
    n_gpu_layers = 40  # Metal set to 1 is enough.
    n_batch = 512  # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.

    callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])

    llm = LlamaCpp(
        model_path="mistral-7b-instruct-v0.1.Q4_K_M.gguf",
        n_gpu_layers=n_gpu_layers,
        n_batch=n_batch,
        #f16_kv=True,  # MUST set to True, otherwise you will run into problem after a couple of calls ONLY FOR MAC
        callback_manager=callback_manager,
        verbose=True, # Verbose is required to pass to the callback manager,
        max_tokens=2048,
        temperature= 0.01,
        n_ctx=2048
    )

    DEFAULT_SYSTEM_PROMPT ="""
    You are a helpful, respectful, and honest assistant. Always answer as helpfully as possible, while being safe. 

    If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you do not know the answer to a question, make it clear you do not know the answer instead of making up false information.
    """.strip()

    def generate_prompt(prompt: str, system_prompt: str = DEFAULT_SYSTEM_PROMPT) -> str:
        return f"""
        [INST] <<SYS>>
        {system_prompt}
        <</SYS>>

        {prompt} [/INST]
        """.strip()

    SYSTEM_PROMPT ="Use the following pieces of conext to answer the question at the end. If you do not know the answer, just say you don't know, don't try to make up an answer"

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


    def chat():
        while True:
            user_input=input(f"prompt:")
            query = 'ass'
            if query=='exit':
                print('Exiting')
                sys.exit()
            if query=='':
                continue
            result=chain({'query':user_input})
            print(f"MESSAGE_START")
        #    print(f"Answer:{result['result']}")

    chat()
loadllm()


if __name__ == "__main__":
    # Check if input is provided
    if len(sys.argv) > 1:
        user_input = sys.argv[1]
        result = process_input(user_input)
        print(result)
    else:
        print("Error: No input provided.")