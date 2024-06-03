import { LlamaCpp } from "@langchain/community/llms/llama_cpp";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { PromptTemplate } from "@langchain/core/prompts";
import { formatDocumentsAsString } from "langchain/util/document";
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableMap,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Initialize embeddings
const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
});

// Load vector store from a specified directory
const directory = "C:\\Users\\alexp\\Desktop\\Dot-data\\";
const VectorStore = await FaissStore.load(directory, embeddings);

// Define the retriever
const retriever = VectorStore.asRetriever(1, { });

// Define the prompt template
const prompt = PromptTemplate.fromTemplate(`
You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Keep the answer concise.
Question: {input}

Context: {context}

Answer:
`);

// Initialize the language model
const llm = new LlamaCpp({
  modelPath: "C://Users//alexp//Documents//Dot-Data//Phi-3-mini-4k-instruct-q4.gguf",
  gpuLayers: 1024,
  f16kv: 1,
  maxTokens: 128,
  temperature: 0.0,
  contextSize: 4000,
  //batchSize: 4000,
});

// Check the structure of the prompt template
console.log(prompt);

// Set up the RAG chain
const ragChainFromDocs = RunnableSequence.from([
  RunnablePassthrough.assign({
    context: (input) => formatDocumentsAsString(input.context),
  }),
  prompt,
  llm,
  new StringOutputParser(),
]);



let ragChainWithSource = new RunnableMap({
  steps: { context: retriever, input: new RunnablePassthrough() },
});
ragChainWithSource = ragChainWithSource.assign({ answer: ragChainFromDocs });

// Execute the chain and handle the output
const output = {};
let currentKey = null;

for await (const chunk of await ragChainWithSource.stream("what is the thrust of the leros engine?")) {
  for (const key of Object.keys(chunk)) {
    if (output[key] === undefined) {
      output[key] = chunk[key];
    } else {
      output[key] += chunk[key];
    }

    if (key !== currentKey) {
      console.log(`\n\n${key}: ${JSON.stringify(chunk[key])}`);
    } else {
      console.log(chunk[key]);
    }
    currentKey = key;
  }
}




