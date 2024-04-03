# HELLO!

![ezgif-4-b96c0b5548](https://github.com/alexpinel/Dot/assets/93524949/e5983c61-d59c-45ac-86f6-9d62cffaf37b)

This is Dot, a standalone open source app meant for easy use of local LLMs and RAG in particular to interact with documents and files similarly to Nvidia's Chat with RTX. Dot itself is completely standalone and is packaged with all dependencies including a copy of Mistral 7B, this is to ensure the app is as accessible as possible and no prior knowledge of programming or local LLMs is required to use it. You can install the app (available for Apple Silicon and Windows) here: [Dot website ](https://dotapp.uk/)

### What does it do?

Dot can be used to load multiple documents into an llm and interact with them in a fully local environment through Retrieval Augmented Generation (RAG), supported documents are: pdf, docx, pptx, xlsx, and markdown. Apart from RAG, users can also switch to Big Dot for any interactions unrelated to their documents similarly to ChatGPT.

<div style="text-align: center;">
  <img src="https://github.com/alexpinel/Dot/assets/93524949/8c9ee23e-c9d2-413e-9c38-ab7a143b8060" alt="dot_desktop" width="600">
</div>

### How does it work?

Dot is built with Electron JS, but its main functionalities come from a bundled install of Python that contains all libraries and necessary files. A multitude of libraries are used to make everything work, but perhaps the most important to be aware of are: llama-cpp to run the LLM, FAISS to create local vector stores, and Langchain & Huggingface to setup the conversation chains and embedding process.

### Install

You can either install the packaged app in the [Dot website ](https://dotapp.uk/) or can set up the project for development, to do so follow these steps:

- Clone the repository `$ https://github.com/alexpinel/Dot.git`
- Install Node js and then run `npm install` inside the project repository, you can run `npm install --force` if you face any issues at this stage

Now, it is time to add a full python bundle to the app. The purpose of this is to create a distributable environment with all necessary libraries, if you only plan on using Dot from the console you might not need to follow this particular step but then make sure to replace the python path locations specified in `src/index.js`. Creating the python bundle is covered in detail here: [https://til.simonwillison.net/electron/python-inside-electron](https://til.simonwillison.net/electron/python-inside-electron) , the bundles can also be installed from here: [https://github.com/indygreg/python-build-standalone/releases/tag/20240224](https://github.com/indygreg/python-build-standalone/releases/tag/20240224)

Having created the bundle, please rename it to 'python' and place it inside the `llm` directory. It is now time to get all necessary libraries, keep in mind that running a simple `pip install` will not work without specifying the actual path of the bundle so use this instead: `path/to/python/.bin/or/.exe -m pip install` 

Required python libraries:
- pytorch [link](https://pytorch.org/get-started/locally/) (CPU version recommended as it is lighter than GPU)
- langchain [link](https://python.langchain.com/docs/get_started/quickstart)
- FAISS [link](https://python.langchain.com/docs/integrations/vectorstores/faiss)
- HuggingFace [link](https://python.langchain.com/docs/integrations/platforms/huggingface)
- llama-cpp [link](https://github.com/abetlen/llama-cpp-python) (Use CUDA implementation if you have an Nvidia GPU!)
- pypdf [link](https://python.langchain.com/docs/modules/data_connection/document_loaders/pdf)
- docx2txt [link](https://python.langchain.com/docs/integrations/document_loaders/microsoft_word)
- Unstructured [link](https://github.com/Unstructured-IO/unstructured) (Use `pip install "unstructured[pptx, md, xlsx]` for the file formats)

Now python should be setup and running! However, there is still a few more steps left, now is the time to add the final magic to Dot! First, create a folder inside the `llm` directory and name it `mpnet`, there you will need to install sentence-transformers to use for the document embeddings, fetch all the files from the following link and place them inside the new folder: [sentence-transformers/all-mpnet-base-v2](https://huggingface.co/sentence-transformers/all-mpnet-base-v2/tree/main)

Finally, download the Mistral 7B LLM from the following link and place it inside the `llm/scripts` directory alongside the python scripts used by Dot: [TheBloke/Mistral-7B-Instruct-v0.2-GGUF](https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/blob/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf)

That's it! If you follow these steps you should be able to get it all running, please let me know if you are facing any issues :)

### Future features I'd like to add:

- Linux support
- Ability to choose LLM
- Image support would be cool
- Increased awarnes of documents apart from merely their content
- Loading individual files instead of selecting a folder  (This is really needed, some users get confused by this and I cannot blame them at all)
- Increased security considerations, after all this is the whole point of using a local LLM
- Support for more docs
- Storing file databases, allowing users to quickly switch between groups of files without having to load them all again
- idk, will find out along the way

# Want to help?

Please do! I am a busy student working on this as a side project so help is more than welcome!


