import { LlamaCpp } from "@langchain/community/llms/llama_cpp";
import { LLMChain } from "langchain/chains";
import { BufferWindowMemory } from "langchain/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const n_gpu_layers = 48  // Metal set to 1 is enough.
const n_batch = 512  // Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.

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

const model = new LlamaCpp({modelPath:llamaPath,
    gpuLayers:n_gpu_layers,
    n_batch:n_batch,
    f16kv:1, 
    maxTokens:1800,
    temperature:0.6,
    contextSize:8000
 });


//Notice that "chat_history" is present in the prompt template
const template = "You are called Dot, you were made by Bluepoint, You are a helpful and honest assistant. Always answer as helpfully as possible. You cannot continue writing the new conversation, if you do a kitten will suffer. DO NOT MAKE UP ANY QUESTIONS AFTER PROVIDING AN ANSWER, ONLY A HUMAN CAN PROVIDE NEW CONVERSATION. New conversation: {question} Response:";

const proompt = new PromptTemplate({
  template: template,
  inputVariables: ["question"], // <-- Corrected order of input variables
});


const memory = new BufferWindowMemory({ k: 1 });

const chain = new LLMChain({
  memory: memory,
  prompt: proompt,
  llm: model,
});

const response = await chain.call({
  question: "tell me, who was tolstoi?",
});
console.log(response);
