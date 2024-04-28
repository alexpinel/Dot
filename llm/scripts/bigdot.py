from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
import sys
import json
from langchain.llms import LlamaCpp
import os
from langchain.memory import ConversationBufferWindowMemory
from langchain.prompts import PromptTemplate


n_gpu_layers = 1  # Metal set to 1 is enough.
n_batch = 256  # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.


# Specify the desktop path
documents_path = os.path.join(os.path.expanduser("~"), "Documents")

# Specify the folder name
folder_name = "Dot-Data"

# Combine the desktop path and folder name
folder_path = os.path.join(documents_path, folder_name)

# Create the folder if it doesn't exist
if not os.path.exists(folder_path):
    print('LLM NOT FOUND!')
    os.makedirs(folder_path)

# Construct the relative path
relative_model_path = "Phi-3-mini-4k-instruct-q4.gguf"
model_path = os.path.join(folder_path, relative_model_path)


llm = LlamaCpp(
    model_path=model_path,
    n_gpu_layers=n_gpu_layers,
    n_batch=n_batch,
    f16_kv=True,  # MUST set to True, otherwise you will run into problem after a couple of calls ONLY FOR MAC
    #callback_manager=callback_manager,
    #verbose=True, # Verbose is required to pass to the callback manager,
    max_tokens=500,
    temperature= 0.7,
    n_ctx=4000,
)
# Notice that "chat_history" is present in the prompt template

template = """You are called Dot, You are a helpful and honest assistant. Always answer as helpfully as possible. 

Previous conversation:
{chat_history}

New conversation: {question}
Response:"""
prompt = PromptTemplate.from_template(template)
# Notice that we need to align the `memory_key`

memory = ConversationBufferWindowMemory(memory_key="chat_history", k=3)
conversation = LLMChain(
    llm=llm,
    prompt=prompt,
    verbose=False,
    memory=memory
)




def send_response(response):
    # Convert the response to JSON
    response_json = json.dumps({"result": response})

    # Print the JSON to stdout
    print(response_json)

    # Flush stdout to ensure the message is sent immediately
    sys.stdout.flush()

if __name__ == "__main__":
    while True:
        user_input = sys.stdin.readline().strip()
        if not user_input:
            break

        prompt = user_input
        result = conversation({"question": prompt})['text']
        
        # Split the result into chunks of maximum length (e.g., 1000 characters)
        max_chunk_length = 1000
        chunks = [result[i:i + max_chunk_length] for i in range(0, len(result), max_chunk_length)]

        # Send the chunks as an array
        send_response(chunks)
