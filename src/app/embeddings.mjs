import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { NotionLoader } from "@langchain/community/document_loaders/fs/notion";
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

export const processDirectory = async (directory, updateProgress) => {
  const configPath = path.join(__dirname, 'config.json');
  const config = await readConfig(configPath);
  const chunkSize = config.chunk_length || 4000;
  const chunkOverlap = config.chunk_overlap || 2000;

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const desktopPath = path.join(os.homedir(), "Documents", "Dot-Data");

  try {
    await fs.mkdir(desktopPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
  }

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

  const batchSize = 10;
  let batch = [];
  let Vittorio;

  for (let i = 0; i < Documentato.length; i++) {
    batch.push(Documentato[i]);

    if (batch.length === batchSize || i === Documentato.length - 1) {
      const tempStore = await FaissStore.fromDocuments(batch, embeddings);

      if (Vittorio) {
        Vittorio.mergeFrom(tempStore);
      } else {
        Vittorio = tempStore;
      }

      batch = [];
    }

    const progress = ((i + 1) / Documentato.length) * 100;
    updateProgress(progress);
  }

  await Vittorio.save(desktopPath);
  console.log({ Documentato });
};
