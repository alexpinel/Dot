import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatLlamaCpp } from "@langchain/community/chat_models/llama_cpp";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Function to read configuration from a file
async function readConfig(configPath) {
  try {
    const configFile = await fs.promises.readFile(configPath, 'utf8');
    const config = JSON.parse(configFile);

    // Ensure numeric values are correctly parsed
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

// Main function to handle chat completion
async function runChat1(input, sendToken, configPath) {
  if (!configPath) {
    throw new Error("Configuration path is required");
  }

  // Read configuration from the provided path
  const config = await readConfig(configPath);

  // Setup configuration with defaults in case some settings are missing
  const documentsPath = path.join(homedir(), "Documents");
  const folderName = "Dot-Data";
  const folderPath = path.join(documentsPath, folderName);
  if (!fs.existsSync(folderPath)) {
    console.log('LLM NOT FOUND!');
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const defaultModelPath = path.join(folderPath, "Phi-3-mini-4k-instruct-q4.gguf");

  const nBatch = config.n_batch || 256;
  const maxTokens = config.max_tokens || 500;
  const temperature = config.big_dot_temperature || 0.7;
  const contextSize = config.n_ctx || 4000;
  const initialPrompt = config.big_dot_prompt || "You are called Dot, You are a helpful and honest assistant.";

  // Handle model path with possible null value in config
  if ('ggufFilePath' in config && config['ggufFilePath'] === null) {
    delete config['ggufFilePath'];  // Removes the key if it's explicitly None
  }
  const modelPath = config.ggufFilePath || defaultModelPath;

  // Define the prompt template based on config or default to pirate prompt
  const promptTemplate = PromptTemplate.fromTemplate(`${initialPrompt} {input}`);

  // Function to initialize the ChatLlamaCpp model
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

  // Initialize a new instance of the LlamaCpp model for each input
  const llamaCpp = await initializeLlamaModel();

  // Use only the current user input for the prompt
  const prompt = `${initialPrompt} ${input}`;

  // Initialize the output parser
  const parser = new StringOutputParser();

  // Create a new instance of the chain for each input to avoid context carryover
  const chain = promptTemplate
    .pipe(llamaCpp.bind({ stop: [] }, ["User:", "AI:"], { maxTokens: maxTokens })) // Ensure maxTokens is set here
    .pipe(parser);

  // Generate the response
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
      completeResponse += chunk;
      sendToken(chunk); // Send token to the renderer process

      // Manually check for stop condition based on the content
      if (completeResponse.includes('[/INST]')) {
        completeResponse = completeResponse.replace('[/INST]', '').trim();
        break;
      }

      // Manually check token count to stop generating if maxTokens is reached
      if (completeResponse.split(' ').length >= maxTokens) {
        break;
      }
    }
  } catch (error) {
    console.error("Error reading stream:", error);
    throw error;
  }

  // Log the generated response
  console.log("Generated response:", completeResponse);

  return completeResponse;
}

// Export the function for use
export default runChat1;
