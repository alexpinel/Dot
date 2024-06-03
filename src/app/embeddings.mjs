import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { PPTXLoader } from "langchain/document_loaders/fs/pptx";
import { NotionLoader } from "langchain/document_loaders/fs/notion";
//import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: "Xenova/all-MiniLM-L6-v2",
  });

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4000,
    chunkOverlap: 2000,
  });


// Save the vector store to a directory
const loader = new DirectoryLoader(
    "C:\\Users\\alexp\\Desktop\\UCL\\",
    {
      ".pdf": (path) => new PDFLoader(path),
      ".docx": (path) => new DocxLoader(path),
      ".pptx": (path) => new PPTXLoader(path),
      ".md": (path) => new NotionLoader(path),
    },
    {recursive: true}
  );
const docs = await loader.load();



const Documentato = await textSplitter.splitDocuments(docs);

const Vittorio = await FaissStore.fromDocuments(
    Documentato,
    embeddings,
  );console.log({ Documentato });

// Save the vector store to a directory
const directory = "C:\\Users\\alexp\\Desktop\\Dot-data\\";

await Vittorio.save(directory);