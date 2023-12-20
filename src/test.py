from langchain import PromptTemplate
from langchain.chains import RetrievalQA
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.llms import CTransformers
import sys
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.llms import LlamaCpp
from langchain import PromptTemplate, LLMChain
from langchain.callbacks.manager import CallbackManager


#from art import *

#tprint("BLUEPOINT")
#tprint("Shart v0.01")

device = "mps" 

# FUNCTION 1: Runs the embedding process and saves data in a folder called 'vectors'

def embeddings():

    #**Step 1: Load the PDF File from Data Path****
    loader=DirectoryLoader('./src/mystuff/aurora',
                        glob="*.pdf",
                        loader_cls=PyPDFLoader,
                        show_progress=True,
                        use_multithreading=True,
                        recursive=True)
    
    documents=loader.load()

    #***Step 2: Split Text into Chunks***

    text_splitter=RecursiveCharacterTextSplitter(
                                                chunk_size=500,
                                                chunk_overlap=50)


    text_chunks=text_splitter.split_documents(documents)

    print(len(text_chunks))
    #**Step 3: Load the Embedding Model***


    embeddings=HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2', model_kwargs={'device': device})


    #**Step 4: Convert the Text Chunks into Embeddings and  Create a FAISS Vector Store***
    vector_store=FAISS.from_documents(text_chunks, embeddings)
    vector_store.save_local("./src/vectors")
embeddings()


# FUNCTION 2: Loads the 'vectors' folder data and activates llm, the inner 'chat' function runs the conversation with the llm
