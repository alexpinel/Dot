<p align="center">
  <img src="https://github.com/alexpinel/Dot/assets/93524949/9ab51fa9-3471-427f-b932-c001bac35346" alt="Dot App Banner">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-GPL3.0-brightgreen.svg?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/v/release/alexpinel/Dot?style=flat-square" alt="GitHub release (latest by date)">
  <img src="https://img.shields.io/github/commits-since/alexpinel/Dot/latest.svg?style=flat-square" alt="GitHub commits">
  <img src="https://img.shields.io/github/stars/alexpinel/Dot.svg?style=social&label=Star&style=flat-square" alt="GitHub stars">
</p>

<p align="center">
  <strong><a href="https://dotapp.uk/">Visit the Dot Website</a></strong>
</p>

---

# README NOT UP TO DATE, WILL UPDATE SOON!

## 🚀 About Dot

Dot is a standalone, open-source application designed for seamless interaction with documents and files using local LLMs and Retrieval Augmented Generation (RAG). It is inspired by solutions like Nvidia's Chat with RTX, providing a user-friendly interface for those without a programming background. Pre-packaged with Mistral 7B, Dot ensures accessibility and simplicity right out of the box.

https://github.com/alexpinel/Dot/assets/93524949/242ef635-b9f5-4263-8f9e-07bc040e3113


### 📜 What does it do?

Dot allows you to load multiple documents into an LLM and interact with them in a fully local environment. Supported document types include PDF, DOCX, PPTX, XLSX, and Markdown. Users can also engage with Big Dot for inquiries not directly related to their documents, similar to interacting with ChatGPT.

### 🔧 How does it work?

Built with Electron JS, Dot encapsulates a comprehensive Python environment that includes all necessary libraries. The application leverages libraries such as FAISS for creating local vector stores, Langchain, llama.cpp & Huggingface for setting up conversation chains, and additional tools for document management and interaction.

## 📥 Install

**To use Dot:**
- Visit the [Dot website](https://dotapp.uk/) to download the application for Apple Silicon or Windows.

**For developers:**
- Clone the repository `$ https://github.com/alexpinel/Dot.git`
- Install Node js and then run `npm install` inside the project repository, you can run `npm install --force` if you face any issues at this stage

Now, it is time to add a full python bundle to the app. The purpose of this is to create a distributable environment with all necessary libraries, if you only plan on using Dot from the console you might not need to follow this particular step but then make sure to replace the python path locations specified in `src/index.js`. Creating the python bundle is covered in detail here: [https://til.simonwillison.net/electron/python-inside-electron](https://til.simonwillison.net/electron/python-inside-electron) , the bundles can also be installed from here: [https://github.com/indygreg/python-build-standalone/releases/tag/20240224](https://github.com/indygreg/python-build-standalone/releases/tag/20240224)

Having created the bundle, please rename it to 'python' and place it inside the `llm` directory. It is now time to get all necessary libraries, keep in mind that running a simple `pip install` will not work without specifying the actual path of the bundle so use this instead: `path/to/python/.bin/or/.exe -m pip install` 

Required python libraries:
- pytorch [link](https://pytorch.org/get-started/locally/) (CPU version recommended as it is lighter than GPU)
- langchain [link](https://python.langchain.com/docs/get_started/quickstart)
- FAISS [link](https://python.langchain.com/docs/integrations/vectorstores/faiss)
- HuggingFace [link](https://python.langchain.com/docs/integrations/platforms/huggingface)
- llama.cpp [link](https://github.com/abetlen/llama-cpp-python) (Use CUDA implementation if you have an Nvidia GPU!)
- pypdf [link](https://python.langchain.com/docs/modules/data_connection/document_loaders/pdf)
- docx2txt [link](https://python.langchain.com/docs/integrations/document_loaders/microsoft_word)
- Unstructured [link](https://github.com/Unstructured-IO/unstructured) (Use `pip install "unstructured[pptx, md, xlsx]` for the file formats)

Now python should be setup and running! However, there is still a few more steps left, now is the time to add the final magic to Dot! First, create a folder inside the `llm` directory and name it `mpnet`, there you will need to install sentence-transformers to use for the document embeddings, fetch all the files from the following link and place them inside the new folder: [sentence-transformers/all-mpnet-base-v2](https://huggingface.co/sentence-transformers/all-mpnet-base-v2/tree/main)

Finally, download the Mistral 7B LLM from the following link and place it inside the `llm/scripts` directory alongside the python scripts used by Dot: [TheBloke/Mistral-7B-Instruct-v0.2-GGUF](https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/blob/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf)

That's it! If you follow these steps you should be able to get it all running, please let me know if you are facing any issues :)


## 🌟 Future Features I'd Like to Add

- Linux support
- Choice of LLM
- Image file support
- Enhanced document awareness beyond content
- Simplified file loading (select individual files, not just folders)
- Increased security measures for using local LLMs
- Support for additional document types
- Efficient file database management for quicker access to groups of files

## 🤝 Want to Help?

Contributions are highly encouraged! As a student managing this project on the side, any help is greatly appreciated. Whether it's coding, documentation, or feature suggestions, please feel free to get involved!

---

<div align="center">
  <strong><a href="#top">Back to top</a></strong>
</div>

