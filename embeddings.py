import sys
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter



def embeddings(chosen_directory):
    directory = str(chosen_directory)
    #**Step 1: Load the PDF File from Data Path****
    loader=DirectoryLoader(directory,
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
#embeddings()


if __name__ == "__main__":
    # Check if the correct number of command-line arguments is provided
    if len(sys.argv) != 2:
        print("Usage: python your_script.py <directory_path>")
        sys.exit(1)

    # Get the directory path from the command-line argument
    directory_path = sys.argv[1]

    # Now, you can use the directory_path variable in your script
    print(f"Processing directory: {directory_path}")
    embeddings(directory_path)
    print("LESGOOOOOO")