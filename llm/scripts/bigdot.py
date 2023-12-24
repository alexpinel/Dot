import sys
import json
from langchain.llms import LlamaCpp
import os
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
#print("Current working directory:", os.getcwd())

n_gpu_layers = 1  # Metal set to 1 is enough.
n_batch = 512  # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.


# Find the current script's directory
script_dir = os.path.dirname(__file__)

# Construct the relative path
relative_model_path = "llama-2-7b-chat.Q4_K_M.gguf"
model_path = os.path.join(script_dir, relative_model_path)

#callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])         #THIS MAKES THE TEXT STREAM LIKE CHATGPT, OTHERWISE IT JUST POPS OUT

llm = LlamaCpp(
    model_path=model_path,
    n_gpu_layers=n_gpu_layers,
    n_batch=n_batch,
    f16_kv=True,  # MUST set to True, otherwise you will run into problem after a couple of calls ONLY FOR MAC
    #callback_manager=callback_manager,
    #verbose=True, # Verbose is required to pass to the callback manager,
    max_tokens=2048,
    temperature= 0.6,
    n_ctx=2048,
)

#Sets the template globally
template = """
System: You are a helpful, respectful and honest assistant. Always answer as helpfully as possible, while being safe.  Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature. If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information.
User: {prompt}
Assistant:
"""

#Also sets prompt template globally using the module above
prompt = PromptTemplate(template=template, input_variables=["prompt"])

# More direct method of fetching information from stdin, processing with llm function and dumping the json into stdout
if __name__ == "__main__":
    while True:
        user_input = sys.stdin.readline().strip()
        if not user_input:
            break

        prompt = user_input
        result = llm(prompt)

        result_json = json.dumps({"result": result})
        print(result_json)
        sys.stdout.flush()