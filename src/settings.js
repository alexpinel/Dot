const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the form values and add event listeners
    initializeSettings();
    addEventListeners();
});

function initializeSettings() {
    // Load the current configuration settings
    ipcRenderer.invoke('getConfig').then(config => {
        if (config) {
            document.getElementById('n_ctx').value = config.n_ctx;
            document.getElementById('n_batch').value = config.n_batch;
            document.getElementById('max_tokens').value = config.max_tokens;
            document.getElementById('chunk_length').value = config.chunk_length;
            document.getElementById('chunk_overlap').value = config.chunk_overlap;
            document.getElementById('sources').value = config.sources;
            document.getElementById('big_dot_temperature').value = config.big_dot_temperature;
            document.getElementById('big_dot_prompt').value = config.big_dot_prompt;
            if (config.ggufFilePath && config.ggufFilePath !== null) {
                document.getElementById('filePathDisplay').textContent = config.ggufFilePath;
            } else {
                document.getElementById('filePathDisplay').textContent = 'No file selected';
            }
            updateSliders(); // Update sliders after loading values
        }
    }).catch(error => {
        console.error('Failed to load config:', error);
    });

    // Request the current dark mode and auto-TTS state from main process
    ipcRenderer.send('request-dark-mode-state');
    ipcRenderer.send('request-auto-tts-state');
}

function addEventListeners() {
    // Event listeners for UI elements
    document.getElementById('closeButton').addEventListener('click', () => {
        ipcRenderer.send('close-settings');
    });

    document.getElementById('toggleDarkMode').addEventListener('click', () => {
        ipcRenderer.send('toggle-dark-mode');
    });

    ipcRenderer.on('dark-mode-toggled', (event, isEnabled) => {
        document.documentElement.classList.toggle('dark', isEnabled);
    });

    document.getElementById('auto-tts-toggle').addEventListener('change', function () {
        ipcRenderer.send('set-auto-tts', this.checked);
    });

    ipcRenderer.on('get-auto-tts-state', (event, isEnabled) => {
        document.getElementById('auto-tts-toggle').checked = isEnabled;
    });

    document.getElementById('configForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const filePathText = document.getElementById('filePathDisplay').textContent;
        const ggufFilePath = filePathText !== 'No file selected' ? filePathText : null;

        const newConfig = {
            n_ctx: document.getElementById('n_ctx').value,
            n_batch: parseInt(document.getElementById('n_batch').value, 10),
            max_tokens: parseInt(document.getElementById('max_tokens').value, 10),
            chunk_length: parseInt(document.getElementById('chunk_length').value, 10),
            chunk_overlap: parseInt(document.getElementById('chunk_overlap').value, 10),
            sources: parseInt(document.getElementById('sources').value, 10),
            big_dot_temperature: parseFloat(document.getElementById('big_dot_temperature').value),
            big_dot_prompt: document.getElementById('big_dot_prompt').value,
            ggufFilePath: ggufFilePath  // Save the file path if not the default message
        };

        const scriptToggle = document.getElementById('scriptToggle')

        if (scriptToggle) {
            console.log('scriptToggle found:', scriptToggle)

            scriptToggle.addEventListener('change', function () {
                console.log('Script toggle changed')

                const selectedScript = scriptToggle.checked
                    ? 'bigdot.js'
                    : 'docdot.js'
                console.log('Selected script:', selectedScript)

                ipcRenderer.send('switch-script', selectedScript)
            })
        } else {
            console.error('Element with ID "scriptToggle" not found.')
        }
        try {
            await ipcRenderer.invoke('setConfig', newConfig);
            alert('Settings saved successfully!');
            const selectedScript = scriptToggle.checked
                ? 'bigdot.js'
                : 'docdot.js'
            ipcRenderer.send('switch-script', selectedScript)
            ipcRenderer.send('switch-script', selectedScript)
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    });
}

function updateSliders() {
    // Set the initial slider positions and output values correctly
    const sliders = [
        { id: 'n_ctx', value: document.getElementById('n_ctx').value },
        { id: 'n_batch', value: document.getElementById('n_batch').value },
        { id: 'max_tokens', value: document.getElementById('max_tokens').value },
        { id: 'chunk_length', value: document.getElementById('chunk_length').value },
        { id: 'chunk_overlap', value: document.getElementById('chunk_overlap').value },
        { id: 'sources', value: document.getElementById('sources').value },
        { id: 'big_dot_temperature', value: document.getElementById('big_dot_temperature').value }
    ];

    sliders.forEach(slider => {
        const sliderElement = document.getElementById(slider.id);
        const outputElement = document.getElementById(slider.id + '_output');
        if (sliderElement && outputElement) {
            outputElement.textContent = slider.value; // Update the output display
        }
    });
}


//THESE ARE THE DEFAULT VALUES FOR THE SETTINGS!
const defaultSettings = {
    n_ctx: 4000,
    n_batch: 256,
    max_tokens: 128,
    chunk_length: 4000,
    chunk_overlap: 2000,
    sources: 1,
    big_dot_temperature: 0.7,
    big_dot_prompt: "You are called Dot, You are a helpful and honest assistant. Always answer as helpfully as possible."
};


document.getElementById('resetButton').addEventListener('click', function () {
    // Update the UI elements with default values
    document.getElementById('n_ctx').value = defaultSettings.n_ctx;
    document.getElementById('n_batch').value = defaultSettings.n_batch;
    document.getElementById('max_tokens').value = defaultSettings.max_tokens;
    document.getElementById('chunk_length').value = defaultSettings.chunk_length;
    document.getElementById('chunk_overlap').value = defaultSettings.chunk_overlap;
    document.getElementById('sources').value = defaultSettings.sources;
    document.getElementById('big_dot_temperature').value = defaultSettings.big_dot_temperature;
    document.getElementById('big_dot_prompt').value = defaultSettings.big_dot_prompt;
    document.getElementById('filePathDisplay').textContent = "Default (Phi-3)";  // Explicitly setting to no file selected


    updateSliders(); // If you have a function to update slider displays

    // Optionally, send the default settings back to the main process to save them
    ipcRenderer.invoke('setConfig', defaultSettings).then(() => {
        alert('Settings have been reset to default.');
    }).catch(error => {
        console.error('Failed to reset config:', error);
    });
});


document.getElementById('fileSelector').addEventListener('click', () => {
    ipcRenderer.invoke('open-file-dialog').then((result) => {
        if (result.filePaths && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            document.getElementById('filePathDisplay').textContent = filePath; // Display selected file path
            // Optionally save the file path in your config here or during form submission
            // Assuming you add a property to your config object for storing the file path
        }
    }).catch(err => {
        console.error('File selection failed:', err);
    });
});

