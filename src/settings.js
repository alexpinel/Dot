const { ipcRenderer } = require('electron');

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
    iconMoon.classList.toggle('hidden', isDarkMode)
    iconSun.classList.toggle('hidden', !isDarkMode)
})