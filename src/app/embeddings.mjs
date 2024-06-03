import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { PPTXLoader } from "langchain/document_loaders/fs/pptx";
import { NotionLoader } from "langchain/document_loaders/fs/notion";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import fs from 'fs/promises';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const readConfig = async (configPath) => {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading config file: ${error.message}`);
    return {};
  }
};

const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 4000,
  chunkOverlap: 2000,
});

export const processDirectory = async (directory, configPath) => {
  const config = await readConfig(configPath);
  const chunkSize = config.chunk_length || 4000;
  const chunkOverlap = config.chunk_overlap || 2000;

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: "Xenova/all-MiniLM-L6-v2",
  });


  const desktopPath = path.join(os.homedir(), "Documents", "Dot-Data");

  try {
    await fs.mkdir(desktopPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
  }


  // Save the vector store to a directory
  const loader = new DirectoryLoader(
    directory,
    {
      ".pdf": (path) => new PDFLoader(path),
      ".docx": (path) => new DocxLoader(path),
      ".pptx": (path) => new PPTXLoader(path),
      ".md": (path) => new NotionLoader(path),
    },
    { recursive: true }
  );
  const docs = await loader.load();



  const Documentato = await textSplitter.splitDocuments(docs);

  const Vittorio = await FaissStore.fromDocuments(
    Documentato,
    embeddings,
  ); console.log({ Documentato });


  // Merging vector stores

  // Save the merged vector store
  await Vittorio.save(desktopPath);
};
