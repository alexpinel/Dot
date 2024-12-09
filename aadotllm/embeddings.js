const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Wrap the problematic imports in a dynamic import function
async function importESModules() {
  const { FaissStore } = await import("@langchain/community/vectorstores/faiss");
  const { RecursiveCharacterTextSplitter } = await import("langchain/text_splitter");
  const { PDFLoader } = await import("@langchain/community/document_loaders/fs/pdf");
  const { DocxLoader } = await import("@langchain/community/document_loaders/fs/docx");
  const { PPTXLoader } = await import("@langchain/community/document_loaders/fs/pptx");
  const { NotionLoader } = await import("@langchain/community/document_loaders/fs/notion");
  const { TextLoader } = await import("langchain/document_loaders/fs/text");
  const { DirectoryLoader } = await import("langchain/document_loaders/fs/directory");
  const { HuggingFaceTransformersEmbeddings } = await import("@langchain/community/embeddings/hf_transformers");
  return { FaissStore, RecursiveCharacterTextSplitter, PDFLoader, DocxLoader, PPTXLoader, NotionLoader, TextLoader, DirectoryLoader, HuggingFaceTransformersEmbeddings };
}

const readConfig = async (configPath) => {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading config file: ${error.message}`);
    return {};
  }
};

const processDirectory = async (directory, updateProgress) => {
  const { FaissStore, RecursiveCharacterTextSplitter, PDFLoader, DocxLoader, PPTXLoader, NotionLoader, TextLoader, DirectoryLoader, HuggingFaceTransformersEmbeddings } = await importESModules();

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

  const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: "Xenova/all-MiniLM-L6-v2",
  });

  const loader = new DirectoryLoader(
    directory,
    {
      ".pdf": (path) => new PDFLoader(path),
      ".docx": (path) => new DocxLoader(path),
      ".pptx": (path) => new PPTXLoader(path),
      ".md": (path) => new NotionLoader(path),
      ".js": (path) => new TextLoader(path),
      ".py": (path) => new TextLoader(path),
      ".ts": (path) => new TextLoader(path),
      ".mjs": (path) => new TextLoader(path),
      ".c": (path) => new TextLoader(path),
      ".cpp": (path) => new TextLoader(path),
      ".cs": (path) => new TextLoader(path),
      ".java": (path) => new TextLoader(path),
      ".go": (path) => new TextLoader(path),
      ".rb": (path) => new TextLoader(path),
      ".swift": (path) => new TextLoader(path),
      ".kt": (path) => new TextLoader(path),
      ".php": (path) => new TextLoader(path),
      ".html": (path) => new TextLoader(path),
      ".css": (path) => new TextLoader(path),
      ".xml": (path) => new TextLoader(path),
      ".json": (path) => new TextLoader(path),
      ".yaml": (path) => new TextLoader(path),
      ".yml": (path) => new TextLoader(path),
      ".r": (path) => new TextLoader(path),
      ".sh": (path) => new TextLoader(path),
      ".bat": (path) => new TextLoader(path),
      ".pl": (path) => new TextLoader(path),
      ".rs": (path) => new TextLoader(path),
      ".scala": (path) => new TextLoader(path),
      ".sql": (path) => new TextLoader(path),
    },
    {
      recursive: true,
      ignoreFiles: (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        return !this[ext];  // Ignore files whose extensions aren't in our loader object
      }
    }
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

module.exports = { processDirectory };