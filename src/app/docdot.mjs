import { LlamaCpp } from "@langchain/community/llms/llama_cpp";
import { PromptTemplate } from "@langchain/core/prompts";
import path from "path";
import { homedir } from "os";
import os from 'os';
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import fs from "fs";
import { formatDocumentsAsString } from "langchain/util/document";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableMap,
} from "@langchain/core/runnables";

// Function to read configuration from a file
async function readConfig(configPath) {
  try {
    const configFile = await fs.promises.readFile(configPath, "utf8");
    const config = JSON.parse(configFile);

    // Ensure numeric values are correctly parsed
    config.n_batch = Number(config.n_batch);
    config.max_tokens = Number(config.max_tokens);
    config.big_dot_temperature = Number(config.big_dot_temperature);
    config.n_ctx = Number(config.n_ctx);
    config.sources = Number(config.sources);


    return config;
  } catch (error) {
    console.error(
      `Error reading or parsing configuration file at ${configPath}:`,
      error
    );
    return {};
  }
}

// Main function to handle chat completion
async function runChat(input, sendToken, configPath) {
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
    console.log("LLM NOT FOUND!");
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const defaultModelPath = path.join(
    folderPath,
    "Phi-3-mini-4k-instruct-q4.gguf"
  );
  const maxTokens = config.max_tokens || 500;
  const contextSize = config.n_ctx || 4000;
  const sources = config.sources || 1;

  // Handle model path with possible null value in config
  if ("ggufFilePath" in config && config["ggufFilePath"] === null) {
    delete config["ggufFilePath"]; // Removes the key if it's explicitly None
  }
  const modelPath = config.ggufFilePath || defaultModelPath;

  const llm = new LlamaCpp({
    modelPath: modelPath,
    gpuLayers: 1024,
    f16kv: 1,
    maxTokens: maxTokens,
    temperature: 0.01,
    contextSize: contextSize,
  });

  // Embeddings
  const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: "Xenova/all-MiniLM-L6-v2",
  });

  // Load vector store from a specified directory
  const directory = path.join(os.homedir(), "Documents", "Dot-Data");

  const VectorStore = await FaissStore.load(directory, embeddings);

  // Equivalent to kwargs in python, 2 indicates the 2 closest documents will be provided
  const retriever = VectorStore.asRetriever(sources, {});

  const prompt = PromptTemplate.fromTemplate(`
  You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Keep the answer concise.
  Question: {input}
  
  Context: {context}
  
  Answer:
  `);

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

  // Define stop conditions
  const stopConditions = ["[/INST]", "<|eot_id|>", "[response]", "<|end|>", "<|assistant|> "];

  // Generate the response
  let stream;
  try {
    stream = await ragChainWithSource.stream(input);
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }

  let completeResponse = "";
  const output = {};
  let currentKey = null;
  let processTokens = false; // Flag to start processing tokens only after context key is detected
  let tokenCount = 0; // Initialize token count

  try {
    outerLoop:
    for await (const chunk of stream) {
      if (tokenCount >= maxTokens) {
        console.log(`Max token count of ${maxTokens} reached, stopping stream.`);
        break; // Break the outer loop immediately if max tokens reached
      }

      // Assuming chunk is an object similar to the original script
      for (const key of Object.keys(chunk)) {
        if (output[key] === undefined) {
          output[key] = chunk[key];
        } else {
          output[key] += chunk[key];
        }

        // Check if the key is 'context' to start processing tokens
        if (key === 'context') {
          processTokens = true;
          // Send "Source" token before processing context
          sendToken("Source:");
        }

        if (processTokens) {
          if (key !== currentKey) {
            console.log(`\n\n${key}: ${JSON.stringify(chunk[key])}`);
          } else {
            console.log(chunk[key]);
          }
          currentKey = key;

          // Process and format the context into iframe HTML if the source is a PDF
          if (key === 'context') {
            let context;
            try {
              // Assuming chunk[key] is already a valid JSON string
              context = chunk[key];

              const sources = context.map(doc => {
                const sourcePath = doc.metadata.source;
                const pageNumber = doc.metadata.loc?.pageNumber; // Use optional chaining to safely access pageNumber
                const fileExtension = sourcePath.split('.').pop().toLowerCase();

                if (fileExtension === 'pdf') {
                  const sourcePathWithPage = pageNumber ? `${sourcePath}#page=${pageNumber}` : sourcePath;
                  return `<iframe src="${sourcePathWithPage}" style="width:100%; height:300px; border: 1px solid #ccc; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 10px 0;" frameborder="0"></iframe>`;
                }
                return `<p>${sourcePath}</p>`;
              }).join('\n');

              sendToken(sources);
            } catch (error) {
              console.error("Error parsing context:", error);
              throw error;
            }
          } else {
            // Check for stop condition before adding the chunk to the response and sending it
            let chunkContent = chunk[key];
            let stopConditionFound = false;
            for (const condition of stopConditions) {
              if (chunkContent.includes(condition)) {
                chunkContent = chunkContent.split(condition)[0].trim(); // Remove the stop condition and everything after it
                stopConditionFound = true;
                break;
              }
            }

            // Concatenate chunk to completeResponse without the stop condition
            completeResponse += chunkContent;

            // Update token count based on the chunk content
            const chunkTokens = chunkContent.split(" ").length;
            tokenCount += chunkTokens;
            console.log(`Current token count: ${tokenCount}`);

            // Send chunk content to the renderer process (assuming sendToken is defined)
            sendToken(chunkContent);

            // Manually check token count to stop generating if maxTokens is reached
            if (tokenCount >= maxTokens) {
              console.log(`Max token count of ${maxTokens} reached, stopping stream.`);
              return completeResponse; // Return immediately if max tokens reached
            }

            if (stopConditionFound) {
              console.log(`Stop condition encountered, stopping stream.`);
              return completeResponse; // Return immediately if stop condition is met
            }
          }
        }
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

export default runChat;
