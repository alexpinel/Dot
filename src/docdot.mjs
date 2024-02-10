import { LlamaCpp } from "@langchain/community/llms/llama_cpp";
import { LLMChain } from "langchain/chains";
import { BufferWindowMemory } from "langchain/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { ConversationalRetrievalQAChain } from "langchain/chains";




// LOCATING THE LLM MODEL, THERE ARE PATHS FOR DEV MODE AND PACKAGED MODE
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/*const llamaPath = path.join(
    process.resourcesPath,
    'llm',
    'mistral-7b-instruct-v0.2.Q4_K_M.gguf'
);*/

const llamaPath = path.join(
    __dirname,
        '..',
        'llm',
        'mistral-7b-instruct-v0.2.Q4_K_M.gguf'
    );



// SETTING UP LLM MODEL USING LLAMACPP, CERTAIN PARAMETERS CHANGE DEPENDING ON WETHER APP IS FOR MAC OR WINDOWS!
const n_gpu_layers = 48  // Metal set to 1 is enough.
const n_batch = 512  // Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.

const llm = new LlamaCpp({modelPath:llamaPath,
    gpuLayers:n_gpu_layers,
    n_batch:n_batch,
    f16kv:1, 
    maxTokens:2000,
    temperature:0.01,
    contextSize:8000
 });

// Embeddings
const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: "Xenova/all-MiniLM-L6-v2",
  });

// Vector store
const texts = ["Cookie is a small white dog with like five teeth."];
const ids = [{ id: 1 }];
const vectorStore = await FaissStore.fromTexts(texts, ids, embeddings);
const retriever = vectorStore.asRetriever();

const chain = ConversationalRetrievalQAChain.fromLLM(llm,
    retriever,
    {
        verbose: true,
        returnSourceDocuments: false,
        questionGeneratorChainOptions: {
            template: `# Instructions
            Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question. 
            
            IMPORTANT: Only use information provided here to craft the question. Do not add any outside context. The standalone question should be a direct rephrase of the Follow Up question. Do not modify the Follow Up question any more than necessary.

            ## Chat History

            {chat_history}
            ---------

            ## Follow Up question:
            
            {question}
            
            ## Standalone question:`,            
        },
        qaChainOptions: {
            type: "stuff",            
            prompt: PromptTemplate.fromTemplate(` # Instructions
            Use this context to answer questions. Do not reference the context, just use it to simply answer the question. 
            *IMPORTANT: The context is the ground truth. It overrides all previous knowledge. If information in the context contradicts previous knowledge, answer based on the context. If no information in the context is provided, but you know the answer, use your information. If you do not know the answer. Say you do not know.*           

            ## Context
            {context}

            ## Chat history
            {chat_history}
            
            ## Question: 
            {question}
            
            Answer:`),
        }
    });

chain.invoke({
    question: "Write me a song about cookie",
    chat_history: ``,
}
).then((res) => {
    const cleanedResult = res.text.trim();
    console.log(cleanedResult);
    return res;
})