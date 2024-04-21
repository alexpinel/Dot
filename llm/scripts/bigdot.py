from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
import sys
import json
from langchain_community.llms import LlamaCpp
import os
from langchain.memory import ConversationBufferWindowMemory
from langchain.prompts import PromptTemplate

from transformers import pipeline
from datasets import load_dataset
import sounddevice
import torch
import time

device = "cuda:0" if torch.cuda.is_available() else "cpu"


n_gpu_layers = -1  # Metal set to 1 is enough.
n_batch = 256   # Should be between 1 and n_ctx, consider the amount of RAM of your Apple Silicon Chip.


# Specify the desktop path
desktop_path = os.path.join(os.path.expanduser("~"), "Documents")

# Specify the folder name
folder_name = "Dot-Data"

# Combine the desktop path and folder name
folder_path = os.path.join(desktop_path, folder_name)

# Create the folder if it doesn't exist
if not os.path.exists(folder_path):
    print('LLM NOT FOUND!')
    os.makedirs(folder_path)

# Construct the relative path
relative_model_path = "mistral-7b-instruct-v0.2.Q4_K_M.gguf"
model_path = os.path.join(folder_path, relative_model_path)



llm = LlamaCpp(
    model_path=model_path,
    n_gpu_layers=n_gpu_layers,
    n_batch=n_batch,
    #f16_kv=True,  # MUST set to True, otherwise you will run into problem after a couple of calls ONLY FOR MAC
    #callback_manager=callback_manager,
    #verbose=True, # Verbose is required to pass to the callback manager,
    max_tokens=2000,
    temperature= 0.6,
    n_ctx=8000,
)
# Notice that "chat_history" is present in the prompt template
template = """You are called Dot, You are a helpful and honest assistant. Always answer as helpfully as possible. You cannot continue writing the new conversation.

Previous conversation:
{chat_history}

New conversation: {question}
Response:"""
prompt = PromptTemplate.from_template(template)
# Notice that we need to align the `memory_key`
memory = ConversationBufferWindowMemory(memory_key="chat_history", k=2)
conversation = LLMChain(
    llm=llm,
    prompt=prompt,
    verbose=False,
    memory=memory
)


import sys
import json

def send_response(response):
    # Convert the response to JSON
    response_json = json.dumps({"result": response})

    # Print the JSON to stdout
    print(response_json)

    # Flush stdout to ensure the message is sent immediately
    sys.stdout.flush()


class SpeechGenerator:
    def __init__(self, device, model_id="microsoft/speecht5_tts", speaker=3000):
        try:
            self.synthesiser = pipeline("text-to-speech", model=model_id, device=device)
            self.embeddings_dataset = load_dataset("Matthijs/cmu-arctic-xvectors", split="validation")
            self.speaker_embedding = torch.tensor(self.embeddings_dataset[speaker]["xvector"]).unsqueeze(0)
            #print("Initialization successful.")
        except Exception as e:
            #print(f"Failed during initialization: {e}")
            pass
    def synthesize_audio(self, result):
        try:
            speech = self.synthesiser(result, 
                                forward_params={"speaker_embeddings": self.speaker_embedding})
            #print("Audio synthesis successful.")
            return speech
        except Exception as e:
            #print(f"Failed to synthesize audio: {e}")
            return None

    def play_audio(self, audio, sample_rate):
        try:
            sounddevice.play(audio, sample_rate)
            time.sleep(len(audio) / float(sample_rate))  # Ensure the audio is played completely
            #print("Playback successful.")
        except Exception as e:
            #print(f"Failed to play audio: {e}")
            pass
# Initialize SpeechGenerator

speech_gen = SpeechGenerator(device)


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

"""
        # Synthesize audio
        try:
            speech = speech_gen.synthesize_audio(result)
            if speech is not None:
                # Play back the synthesized audio
                speech_gen.play_audio(speech["audio"], speech["sampling_rate"])
            else:
                #Sprint("Audio synthesis failed, skipping playback.")
                pass
        except Exception as e:
            #print(f"Error during synthesis or playback: {e}")
            pass


"""




