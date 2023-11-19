import sys
import json
from langchain.llms import LlamaCpp
import textwrap

n_gpu_layers = 40  # Metal set to 1 is enough.
n_batch = 512  # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.

#callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])         #THIS MAKES THE TEXT STREAM LIKE CHATGPT, OTHERWISE IT JUST POPS OUT

llm = LlamaCpp(
    model_path="mistral-7b-instruct-v0.1.Q4_K_M.gguf",
    n_gpu_layers=n_gpu_layers,
    n_batch=n_batch,
    #f16_kv=True,  # MUST set to True, otherwise you will run into problem after a couple of calls ONLY FOR MAC
    #callback_manager=callback_manager,
    #verbose=True, # Verbose is required to pass to the callback manager,
    max_tokens=2048,
    temperature= 0.01,
    n_ctx=2048,
)

def qa(text: str, full=False):
    text = textwrap.dedent(f"""\
        You are a helpful, respectful, slightly sarcastic, and honest assistant. Always answer as helpfully as possible, while being safe. Your answers should not include any harmful, unethical, sexist, racist, and otherwise offensive content.
        If a question does not make any sense or is not factually coherent, explain why instead of answering something not correct. If you do not know the answer to a question, make it clear you do not know the answer instead of making up false information.
                                
        ### Instruction:
        {text}

        ### Response:
        """)

    result = llm(user_input)
    return result

def chat(input_text):
    user_input = str(input_text)
    result = qa(user_input)
    
    if isinstance(result, str):
        return result
    elif isinstance(result, dict) and 'result' in result:
        return result['result']
    else:
        return "Invalid result format from the language model."

if __name__ == "__main__":
    while True:
        line = sys.stdin.readline().strip()
        if not line:
            break

        user_input = line
        result = chat(user_input)

        result_json = json.dumps({"result": result})
        print(result_json)
        sys.stdout.flush()