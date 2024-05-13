

/*// Calculate __dirname based on the ES Module URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import sherpa-onnx library for TTS
import sherpa_onnx from 'sherpa-onnx'; // Changed to import from require

// Function to create and configure the offline TTS model
function createOfflineTts() {
    let offlineTtsVitsModelConfig = {
        //model: path.join(__dirname, '..', 'llm', 'vits-piper-en_US-glados', 'en_US-glados.onnx'),
        lexicon: '',
        //tokens: path.join(__dirname, '..', 'llm', 'vits-piper-en_US-glados', 'tokens.txt'),
        //dataDir: path.join(__dirname, '..', 'llm', 'vits-piper-en_US-glados', 'espeak-ng-data'),
        model: path.join(process.resourcesPath, 'llm', 'vits-piper-en_US-glados', 'en_US-glados.onnx'),
        tokens: path.join(process.resourcesPath, 'llm', 'vits-piper-en_US-glados', 'tokens.txt'),
        dataDir: path.join(process.resourcesPath, 'llm', 'vits-piper-en_US-glados', 'espeak-ng-data'),

        dictDir: '',
        noiseScale: 0.667,
        noiseScaleW: 0.9,
        lengthScale: 1.0,
    };
    let offlineTtsModelConfig = {
        offlineTtsVitsModelConfig: offlineTtsVitsModelConfig,
        numThreads: 1,
        debug: 1,
        provider: 'gpu',
    };

    let offlineTtsConfig = {
        offlineTtsModelConfig: offlineTtsModelConfig,
        ruleFsts: '',
        ruleFars: '',
        maxNumSentences: 10,
    };

    return sherpa_onnx.createOfflineTts(offlineTtsConfig);
}

// Function to generate and save audio using the sherpa_onnx TTS
function runTTS(message) {
    return new Promise((resolve, reject) => {
        const tts = createOfflineTts();
        const speakerId = 0;
        const speed = 1.0;
        const audio = tts.generate({
            text: message,
            sid: speakerId,
            speed: speed
        });

        const filePath = path.join(__dirname, 'test-en.wav');
        tts.save(filePath, audio);
        console.log('Saved to', filePath, 'successfully.');
        tts.free();

        resolve(filePath);
    });
}

// Function to play audio using macOS's built-in 'afplay'
function playAudio(filePath) {
    return new Promise((resolve, reject) => {
        exec(`afplay "${filePath}"`, (err) => {
            if (err) {
                console.error('Error during audio playback:', err);
                reject(false);
            } else {
                console.log('Audio playback successful.');
                resolve(true);
            }
        });
    });
}

// Handling command line arguments and execution flow
const args = process.argv.slice(2);
if (args.length > 0) {
    runTTS(args[0])
        .then(playAudio)
        .then(success => {
            if (success) {
                console.log('TTS playback successful.');
            } else {
                console.error('TTS playback failed.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

*/

const { parentPort } = require('worker_threads');
const fs = require('fs');
const sherpa_onnx = require('sherpa-onnx');
const path = require('path');

function createOfflineTts() {
    try {
        console.log("Creating offline TTS...");
        const modelPath = path.join(__dirname, '..', 'llm', 'vits-piper-en_US-glados', 'en_US-glados.onnx');
        //const modelPath = path.join(process.resourcesPath, 'llm', 'vits-piper-en_US-glados', 'en_US-glados.onnx');

        if (!fs.existsSync(modelPath)) {
            throw new Error(`Model file does not exist at path: ${modelPath}`);
        }

        // Additional checks and logs for tokens and dataDirPath as needed
        const tokensPath = path.join(__dirname, '..', 'llm', 'vits-piper-en_US-glados', 'tokens.txt');
        const dataDirPath = path.join(__dirname, '..', 'llm', 'vits-piper-en_US-glados', 'espeak-ng-data');
        //const tokensPath = path.join(process.resourcesPath, 'llm', 'vits-piper-en_US-glados', 'tokens.txt');
        //const dataDirPath = path.join(process.resourcesPath, 'llm', 'vits-piper-en_US-glados', 'espeak-ng-data');

        let offlineTtsVitsModelConfig = {
            model: modelPath,
            tokens: tokensPath,
            dataDir: dataDirPath,
            lexicon: '',
            dictDir: '',
            noiseScale: 0.667,
            noiseScaleW: 0.9,
            lengthScale: 1.0,
        };

        let offlineTtsModelConfig = {
            offlineTtsVitsModelConfig: offlineTtsVitsModelConfig,
            numThreads: 1,
            debug: 1,
            provider: 'gpu',
        };

        let offlineTtsConfig = {
            offlineTtsModelConfig: offlineTtsModelConfig,
            ruleFsts: '',
            ruleFars: '',
            maxNumSentences: 2,
        };

        return sherpa_onnx.createOfflineTts(offlineTtsConfig);
    } catch (error) {
        console.error('Failed to create TTS:', error, error.stack);
        process.exit(1);
    }
}

parentPort.on('message', async (data) => {
    try {
        console.log(`Received message to process: ${data.cmd}`);
        if (data.cmd === 'run-tts') {
            const tts = createOfflineTts();
            console.log("TTS engine created, generating audio...");
            const audio = tts.generate({
                text: data.message,
                sid: 0,
                speed: 1.0
            });
            const filePath = path.join(__dirname, 'output.wav');
            console.log(`Audio generated, saving to ${filePath}...`);
            tts.save(filePath, audio);
            tts.free();

            console.log(`Posting back filePath: ${filePath}`);
            parentPort.postMessage({ filePath: filePath });
        }
    } catch (error) {
        console.error('Error processing TTS request:', error);
        parentPort.postMessage({ error: error.message });
        process.exit(1);
    }
});



process.on('uncaughtException', error => {
    console.error('Unhandled Exception:', error);
    process.exit(1); // Ensure the worker exits with a specific code for unhandled exceptions
});

process.on('unhandledRejection', reason => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1); // Ensure the worker exits with a specific code for unhandled promises
});





