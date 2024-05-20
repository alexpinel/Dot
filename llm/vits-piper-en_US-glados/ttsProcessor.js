const path = require('path');

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
const tar = requireLocalModule('tar');
const sherpa_onnx = requireLocalModule('sherpa-onnx');

function createOfflineTts() {
    try {
        console.log("Creating offline TTS...");

        const currentDirectory = __dirname;

        let offlineTtsVitsModelConfig = {
            model: path.join(currentDirectory, 'en_US-glados.onnx'),
            tokens: path.join(currentDirectory, 'tokens.txt'),
            dataDir: path.join(currentDirectory, 'espeak-ng-data'),
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

process.on('message', async (data) => {
    try {
        console.log(`Received message to process: ${data.cmd}`);
        const userDataPath = data.userDataPath;
        const filePath = path.join(userDataPath, 'output.wav');

        const tts = createOfflineTts();
        console.log("TTS engine created, generating audio...");
        const audio = tts.generate({
            text: data.message,
            sid: 0,
            speed: 1.0
        });
        console.log(`Audio generated, saving to ${filePath}...`);
        tts.save(filePath, audio);
        tts.free();

        console.log(`Posting back filePath: ${filePath}`);
        process.send({ filePath: filePath });
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
