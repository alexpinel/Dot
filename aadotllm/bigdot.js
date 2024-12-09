const fs = require('fs');
const path = require('path');
const { homedir } = require('os');
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");

async function readConfig(configPath) {
  try {
    const configFile = await fs.promises.readFile(configPath, 'utf8');
    const config = JSON.parse(configFile);

    config.n_batch = Number(config.n_batch);
    config.max_tokens = Number(config.max_tokens);
    config.big_dot_temperature = Number(config.big_dot_temperature);
    config.n_ctx = Number(config.n_ctx);

    return config;
  } catch (error) {
    console.error(`Error reading or parsing configuration file at ${configPath}:`, error);
    return {};
  }
}

// Helper function to check for INST tokens
function containsInstToken(text) {
  // Check for various forms of INST tokens
  const instPatterns = ['[INST]', '[/INST]', 'INST]', '[INST', '/INST', 'INST', '[/'];
  return instPatterns.some(pattern => text.includes(pattern));
}

async function runChat(input, sendToken, configPath) {
  if (!configPath) {
    throw new Error("Configuration path is required");
  }

  const config = await readConfig(configPath);

  const documentsPath = path.join(homedir(), "Documents");
  const folderName = "Dot-Data";
  const folderPath = path.join(documentsPath, folderName);
  if (!fs.existsSync(folderPath)) {
    console.log('LLM NOT FOUND!');
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const defaultModelPath = path.join(folderPath, "Phi-3.5-mini-instruct-Q6_K.gguf");

  const nBatch = config.n_batch || 256;
  const maxTokens = config.max_tokens || 500;
  const temperature = config.big_dot_temperature || 0.7;
  const contextSize = config.n_ctx || 4000;
  const initialPrompt = config.big_dot_prompt || "You are called Dot, You are a helpful and honest assistant.";

  if ('ggufFilePath' in config && config['ggufFilePath'] === null) {
    delete config['ggufFilePath'];
  }
  const modelPath = config.ggufFilePath || defaultModelPath;

  const promptTemplate = PromptTemplate.fromTemplate(`${initialPrompt} {input}`);

  async function initializeLlamaModel() {
    const { ChatLlamaCpp } = await import("@langchain/community/chat_models/llama_cpp");
    return new ChatLlamaCpp({
      modelPath: modelPath,
      temperature: temperature,
      gpuLayers: 1024,
      batchSize: nBatch,
      f16kv: 1,
      maxTokens: maxTokens,
      contextSize: contextSize,
    });
  }

  const llamaCpp = await initializeLlamaModel();
  const prompt = `${initialPrompt} ${input}`;
  const parser = new StringOutputParser();

  const chain = promptTemplate
    .pipe(llamaCpp.bind({ stop: [] }, ["User:", "AI:"], { maxTokens: maxTokens }))
    .pipe(parser);

  let stream;
  try {
    stream = await chain.stream({ input: prompt });
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }

  let completeResponse = '';
  try {
    for await (const chunk of stream) {
      // Check for INST tokens before adding the chunk
      if (containsInstToken(chunk)) {
        console.log("INST token detected, stopping generation");
        break;
      }

      completeResponse += chunk;
      sendToken(chunk);

      // Check token count
      if (completeResponse.split(' ').length >= maxTokens) {
        break;
      }
    }
  } catch (error) {
    console.error("Error reading stream:", error);
    throw error;
  }

  console.log("Generated response:", completeResponse);
  return completeResponse;
}

module.exports = runChat;