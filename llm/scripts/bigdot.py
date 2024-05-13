from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.llms import LlamaCpp
from langchain.memory import ConversationBufferWindowMemory
import sys
import json
import os

def read_config(config_path):
    try:
        with open(config_path, 'r') as file:
            config = json.load(file)
        return config
    except FileNotFoundError:
        print(f"Configuration file not found at {config_path}.")
        return {}
    except json.JSONDecodeError:
        print("Error decoding JSON from configuration file.")
        return {}

if __name__ == "__main__":
    if len(sys.argv) > 1:

        # Folder paths and model initialization
        documents_path = os.path.join(os.path.expanduser("~"), "Documents")
        folder_name = "Dot-Data"
        folder_path = os.path.join(documents_path, folder_name)
        if not os.path.exists(folder_path):
            print('LLM NOT FOUND!')
            os.makedirs(folder_path)
        model_path = os.path.join(folder_path, "Phi-3-mini-4k-instruct-q4.gguf")

        config_path = sys.argv[1].strip('"')  # Remove any surrounding quotes
        config = read_config(config_path)
        #print("Current Configuration:", config)

        # Setup configuration with defaults in case some settings are missing
        n_gpu_layers = -1  # Metal set to 1 is typically enough for Apple Silicon
        n_batch = config.get('n_batch', 256)
        max_tokens = config.get('max_tokens', 500)
        temperature = config.get('big_dot_temperature', 0.7)
        n_ctx = config.get('n_ctx', 4000)
        initial_prompt = config.get('big_dot_prompt', "You are called Dot, You are a helpful and honest assistant.")
        if 'ggufFilePath' in config and config['ggufFilePath'] is None:
            del config['ggufFilePath']  # Removes the key if it's explicitly None
        llm_model = config.get('ggufFilePath', model_path)

        # Initialize the LLM with the configuration
        llm = LlamaCpp(
            model_path=llm_model,
            n_gpu_layers=n_gpu_layers,
            n_batch=n_batch,
            f16_kv=True,  # Must be True for Apple Silicon to prevent issues
            max_tokens=max_tokens,
            temperature=temperature,
            n_ctx=n_ctx,
        )

        # Setup the prompt template
        template = f"""{initial_prompt}
        Previous conversation:
        {{chat_history}}
        
        Instruction: 
        {{question}}

        Response:"""
        prompt = PromptTemplate.from_template(template)
        memory = ConversationBufferWindowMemory(memory_key="chat_history", k=2)
        conversation = LLMChain(
            llm=llm,
            prompt=prompt,
            verbose=False,
            memory=memory
        )

        def send_response(response):
            response_json = json.dumps({"result": response})
            print(response_json)
            sys.stdout.flush()

        # Process input and generate responses
        while True:
            user_input = sys.stdin.readline().strip()
            if not user_input:
                break

            result = conversation({"question": user_input})['text']
            max_chunk_length = 1000  # Define max length for output chunks
            chunks = [result[i:i + max_chunk_length] for i in range(0, len(result), max_chunk_length)]
            send_response(chunks)


