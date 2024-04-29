const { ipcRenderer } = require('electron');


document.addEventListener('DOMContentLoaded', () => {
    // Your existing code here

    document.getElementById('closeButton').addEventListener('click', () => {
        ipcRenderer.send('close-settings');
    });
    // Add event listener to the button
    document.getElementById('toggleDarkMode').addEventListener('click', () => {
        // Send message to main process to toggle dark mode
        ipcRenderer.send('toggle-dark-mode')
    })


    // Listen for message from main process indicating the new dark mode state
    ipcRenderer.on('dark-mode-toggled', (event, isEnabled) => {
        // Apply or remove 'dark' class based on the new state
        document.documentElement.classList.toggle('dark', isEnabled)
    })

    // JavaScript code
    document.getElementById('toggleDarkMode').addEventListener('click', () => {
        const iconMoon = document.getElementById('iconMoon')
        const iconSun = document.getElementById('iconSun')
        const isDarkMode = document.documentElement.classList.toggle('dark')

        // Toggle between moon and sun icons
        //iconMoon.classList.toggle('hidden', isDarkMode)
        //iconSun.classList.toggle('hidden', !isDarkMode)
    })

    // Add this in both settings.js and index.js
    document.addEventListener('DOMContentLoaded', () => {
        ipcRenderer.send('request-dark-mode-state'); // Ask main process for current dark mode state
    });

    ipcRenderer.on('current-dark-mode-state', (event, isEnabled) => {
        document.documentElement.classList.toggle('dark', isEnabled);
    });

});




//TEXT TO SPEECH SETTING
//This will make TTS activate for EACH message automatically
document.getElementById('auto-tts-toggle').addEventListener('change', function () {
    ipcRenderer.send('set-auto-tts', this.checked);
});

// When the settings window is opened, load the current state
ipcRenderer.on('get-auto-tts-state', (event, isEnabled) => {
    document.getElementById('auto-tts-toggle').checked = isEnabled;
});

document.addEventListener('DOMContentLoaded', () => {
    // Request the current auto-TTS state from main process
    ipcRenderer.send('request-auto-tts-state');
});

