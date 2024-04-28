import { exec } from 'child_process';
import { fileURLToPath } from 'url';  // Ensure this is correctly imported
import path from 'path';

// Function to run TTS
function runTTS(message) {
    return new Promise((resolve, reject) => {
        // Importing meta.url from the import object
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const filePath = path.join(__dirname, 'result.aiff');  // macOS 'say' outputs AIFF by default

        exec(`say "${message}" -o "${filePath}"`, (err) => {
            if (err) {
                console.error('Error executing TTS:', err);
                reject(err);
            } else {
                console.log('Speech execution successful');
                resolve(filePath); // Optionally return the file path
            }
        });
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
