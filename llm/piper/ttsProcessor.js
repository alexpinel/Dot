const path = require('path');
const { spawn } = require('child_process');
const Speaker = require('speaker');
const fs = require('fs');
const tar = require('tar');
const sherpa_onnx = require('sherpa-onnx');


// Function to dynamically resolve the module paths from the local node_modules
function requireLocalModule(moduleName) {
    try {
        // Attempt to require the module from the local node_modules directory
        const modulePath = path.resolve(__dirname, 'node_modules', moduleName);
        return require(modulePath);
    } catch (error) {
        console.error(`Error requiring module ${moduleName} from local node_modules directory:`, error);
        throw error;
    }
}

// Require the modules from the local node_modules directory


// Function to create the TTS using Piper
function createOfflineTts() {
    // Piper TTS does not need a specific creation step in this context
    return true;
}

// Function to generate and play audio using Piper TTS
function playAudioWithPiper(text) {
    return new Promise((resolve, reject) => {
        const piperPath = path.resolve(__dirname, 'piper.exe');
        if (!fs.existsSync(piperPath)) {
            return reject(new Error(`Piper executable not found at path: ${piperPath}`));
        }

        const modelPath = path.resolve(__dirname, 'en_US-hfc_female-medium.onnx');
        const configPath = path.resolve(__dirname, 'en_en_US_kathleen_low_en_US-kathleen-low.onnx.json');

        const piper = spawn(piperPath, ['-m', modelPath, '-c', configPath, '--output-raw']);

        piper.stdin.write(text);
        piper.stdin.end();

        const speaker = new Speaker({
            channels: 1,          // 1 channel
            bitDepth: 16,         // 16-bit samples
            sampleRate: 22050     // 22,050 Hz sample rate
        });

        piper.stdout.pipe(speaker);

        speaker.on('close', () => {
            resolve();
        });

        piper.on('error', (error) => {
            reject(new Error(`Piper process error: ${error.message}`));
        });

        speaker.on('error', (error) => {
            reject(new Error(`Speaker error: ${error.message}`));
        });
    });
}

process.on('message', async (data) => {
    try {
        console.log(`Received message to process: ${data.cmd}`);
        const userDataPath = data.userDataPath;

        createOfflineTts();
        console.log("TTS engine created, generating and playing audio...");

        await playAudioWithPiper(data.message);

        console.log(`Audio playback completed`);
        process.send({ status: 'completed' });
    } catch (error) {
        console.error('Error processing TTS request:', error);
        process.send({ error: error.message });
    }
});

process.on('uncaughtException', error => {
    console.error('Unhandled Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', reason => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});
