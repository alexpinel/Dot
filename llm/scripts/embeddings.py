import sys
import torch
from langchain_community.embeddings.huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores.faiss import FAISS

from langchain_community.document_loaders.pdf import PyPDFLoader
from langchain_community.document_loaders.directory import DirectoryLoader
from langchain_community.document_loaders.excel import UnstructuredExcelLoader
from langchain_community.document_loaders.text import TextLoader
from langchain_community.document_loaders.powerpoint import UnstructuredPowerPointLoader
from langchain_community.document_loaders.markdown import UnstructuredMarkdownLoader
from langchain_community.document_loaders.word_document import Docx2txtLoader
from langchain_text_splitters.character import RecursiveCharacterTextSplitter

from .file_io.readers import ReadFile

import os
import json

reader = ReadFile()
config_filepath = "config.ini"
config = reader.read_config(config_filepath)
EMB_MODEL_CONFIG_SECTION = "EMBEDDING MODEL CONFIG"
EMB_MODEL_NAME = config[EMB_MODEL_CONFIG_SECTION]


def read_config(config_path):
    try:
        with open(config_path, "r") as file:
            config = json.load(file)
        return config
    except FileNotFoundError:
        print(f"Configuration file not found at {config_path}.")
        return {}
    except json.JSONDecodeError:
        print("Error decoding JSON from configuration file.")
        return {}


if __name__ == "__main__":
    print(
        "Arguments received:", sys.argv
    )  # This helps to debug the actual input received

    device_type = (
        "cuda"
        if torch.cuda.is_available()
        else "mps" if torch.backends.mps.is_available() else "cpu"
    )

    if len(sys.argv) > 2:
        quotedDirectory = sys.argv[1]
        config_path = sys.argv[2].strip(
            '"'
        )  # Correctly reference config path as the second argument
        config = read_config(config_path)
    else:
        print("Not enough arguments provided.")

    chunk_size = config.get(
        "chunk_length", 4000
    )  # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.
    chunk_overlap = config.get(
        "chunk_overlap", 2000
    )  # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.

    print(chunk_size, chunk_overlap)

    def embeddings(chosen_directory):

        current_directory = os.path.dirname(os.path.realpath(__file__))
        # model_directory = os.path.join(current_directory, "..", "baai")

        # print("Model Directory:", os.path.abspath(model_directory))

        ### LOAD EMBEDDING SETTINGS
        embeddings = HuggingFaceEmbeddings(
            model_name=EMB_MODEL_NAME, model_kwargs={"device": device_type}
        )  # SET TO 'cpu' for PC

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )

        victor = FAISS.from_texts(["foo"], embeddings)

        ###LOCATE DIRECTORY
        # Specify the desktop path
        desktop_path = os.path.join(os.path.expanduser("~"), "Documents")

        # Specify the folder name
        folder_name = "Dot-Data"

        # Combine the desktop path and folder name
        folder_path = os.path.join(desktop_path, folder_name)

        # Create the folder if it doesn't exist
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)

        directory = str(chosen_directory)

        ### PDF
        try:
            # **Step 1: Load the PDF File from Data Path****
            loader1 = DirectoryLoader(
                directory,
                glob="*.pdf",
                loader_cls=PyPDFLoader,
                show_progress=True,
                use_multithreading=True,
                recursive=True,
            )

            documents_pdf = loader1.load()
            text_chunks_pdf = text_splitter.split_documents(documents_pdf)

            print(len(text_chunks_pdf))

            # **Step 4: Convert the Text Chunks into Embeddings and Create a FAISS Vector Store***
            vector_store_pdf = FAISS.from_documents(text_chunks_pdf, embeddings)
            # vector_store_pdf.save_local(os.path.join(folder_path, "Dot-data-pdf"))
            victor.merge_from(vector_store_pdf)

        except Exception as error:
            print("NO PDFs FOUND" + str(error))

        ### WORD
        try:
            loader2 = DirectoryLoader(
                directory,
                glob="*.docx",
                loader_cls=Docx2txtLoader,
                show_progress=True,
                use_multithreading=True,
                recursive=True,
            )

            documents_word = loader2.load()
            text_chunks_word = text_splitter.split_documents(documents_word)

            print(len(text_chunks_word))

            # **Step 4: Convert the Text Chunks into Embeddings and Create a FAISS Vector Store***
            vector_store_word = FAISS.from_documents(text_chunks_word, embeddings)
            # vector_store_word.save_local(os.path.join(folder_path, "Dot-data-word"))
            victor.merge_from(vector_store_word)

        except Exception as error:
            print("NO WORD DOCUMENTS FOUND" + str(error))

        ### POWER POINT
        try:
            loader3 = DirectoryLoader(
                directory,
                glob="*.pptx",
                loader_cls=UnstructuredPowerPointLoader,
                show_progress=True,
                use_multithreading=True,
                recursive=True,
            )

            documents_ppt = loader3.load()
            text_chunks_ppt = text_splitter.split_documents(documents_ppt)

            print(len(text_chunks_ppt))

            # **Step 4: Convert the Text Chunks into Embeddings and Create a FAISS Vector Store***
            vector_store_ppt = FAISS.from_documents(text_chunks_ppt, embeddings)
            # vector_store_ppt.save_local(os.path.join(folder_path, "Dot-data-ppt"))
            victor.merge_from(vector_store_ppt)

        except Exception as error:
            print("NO POWER POINTS FOUND" + str(error))

        ### EXCEL
        try:
            loader4 = DirectoryLoader(
                directory,
                glob="*.xlsx",
                loader_cls=UnstructuredExcelLoader,
                show_progress=True,
                use_multithreading=True,
                recursive=True,
            )

            documents_xlsx = loader4.load()
            text_chunks_xlsx = text_splitter.split_documents(documents_xlsx)

            print(len(text_chunks_ppt))

            # **Step 4: Convert the Text Chunks into Embeddings and Create a FAISS Vector Store***
            vector_store_xlsx = FAISS.from_documents(text_chunks_xlsx, embeddings)
            # vector_store_ppt.save_local(os.path.join(folder_path, "Dot-data-ppt"))
            victor.merge_from(vector_store_xlsx)

        except Exception as error:
            print("NO EXCEL FOUND" + str(error))

        # MARKDOWN
        try:
            loader5 = DirectoryLoader(
                directory,
                glob="*.md",
                loader_cls=UnstructuredMarkdownLoader,
                show_progress=True,
                use_multithreading=True,
                recursive=True,
            )

            documents_md = loader5.load()
            text_chunks_md = text_splitter.split_documents(documents_md)

            print(len(text_chunks_md))

            # **Step 4: Convert the Text Chunks into Embeddings and Create a FAISS Vector Store***
            vector_store_md = FAISS.from_documents(text_chunks_md, embeddings)
            # vector_store_ppt.save_local(os.path.join(folder_path, "Dot-data-ppt"))
            victor.merge_from(vector_store_md)

        except Exception as error:
            print("NO MARKDOWN FOUND" + str(error))

        victor.save_local(os.path.join(folder_path, "Dot-data"))

    print("Usage: python your_script.py <directory_path>")

    # Get the directory path from the command-line argument
    directory_path = sys.argv[1]

    # Now, you can use the directory_path variable in your script
    print(f"Processing directory: {directory_path}")
    embeddings(directory_path)
    print("LESGOOOOOO")
