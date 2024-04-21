import { pipeline } from '@xenova/transformers';
import wavefile from 'wavefile';
const { WaveFile } = wavefile;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import wavPlayer from 'node-wav-player';

async function runTTS(message) {
    try {
        const runtimeOptions = {
            logSeverityLevel: 'ERROR'
        };
          
        const synthesizer = await pipeline('text-to-speech', 'Xenova/mms-tts-eng', { quantized: false, runtimeOptions });
        const speaker_embeddings = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin';
        const result = await synthesizer(message, { speaker_embeddings });

        if (result && result.audio && result.sampling_rate) {
            const wav = new WaveFile();
            wav.fromScratch(1, result.sampling_rate, '32f', result.audio);
            const audioBuffer = wav.toBuffer();

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const filePath = path.join(__dirname, 'result.wav');
            fs.writeFileSync(filePath, audioBuffer);

            // Play the .wav file using node-wav-player
            await wavPlayer.play({
                path: filePath,
                loop: false
            });

            console.log('Audio playback successful.');
            return true; // Indicate success
        } else {
            console.error('Invalid TTS output:', result);
            return false; // Indicate failure
        }
    } catch (error) {
        console.error('Error in TTS function:', error);
        return false; // Indicate failure
    }
}

const args = process.argv.slice(2);
if (args.length > 0) {
    runTTS(args[0]).then(success => {
        if (success) {
            console.log('TTS playback successful.');
        } else {
            console.error('TTS playback failed.');
        }
    });
}
