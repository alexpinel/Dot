from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
import sys
import json
from langchain.llms import LlamaCpp
import os
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate


n_gpu_layers = 1  # Metal set to 1 is enough.
n_batch = 512  # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.


# Find the current script's directory
script_dir = os.path.dirname(__file__)

# Construct the relative path
relative_model_path = "llama-2-7b-chat.Q4_K_M.gguf"
model_path = os.path.join(script_dir, relative_model_path)


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
# Notice that "chat_history" is present in the prompt template
template = """You are a chatbot called Dot and you are having a conversation with a human.

Previous conversation:
{chat_history}

New human question: {question}
Response:"""
prompt = PromptTemplate.from_template(template)
# Notice that we need to align the `memory_key`
memory = ConversationBufferMemory(memory_key="chat_history")
conversation = LLMChain(
    llm=llm,
    prompt=prompt,
    verbose=False,
    memory=memory
)


if __name__ == "__main__":
    while True:
        user_input = sys.stdin.readline().strip()
        if not user_input:
            break

        prompt = user_input
        result = conversation({"question": prompt})['text']
        #print(result["text"])

        result_json = json.dumps({"result": result})

        # Print the result to stdout
        print(result_json)
        # Make sure to flush stdout to ensure the message is sent immediately
        sys.stdout.flush()

