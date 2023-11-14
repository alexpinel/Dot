const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let pythonProcess; // Declare pythonProcess globally

ipcMain.on('run-python-script', (event, { userInput, buttonClicked }) => {
  // Check if the Python process is already running
  if (pythonProcess) {
    // Send the new input to the existing process
    pythonProcess.stdin.write(`${userInput} ${buttonClicked}\n`);
  } else {
    // If the Python process is not running, spawn a new one
    pythonProcess = spawn('python', ['script.py']);

    pythonProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      mainWindow.webContents.send('python-reply', message);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Script Error: ${data}`);
    });

    // Send the initial input to the new process
    pythonProcess.stdin.write(`${userInput} ${buttonClicked}\n`);
  }
});

//OPEN FOLDER THING
ipcMain.handle('open-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Directory',
  });

  return result;
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      icon: path.join(__dirname, 'Assets', 'icon.ico'), // Provide the correct path
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.openDevTools();
};

let galleryViewInterval;

ipcMain.handle('toggle-gallery-view', (event, toggle) => {
  if (toggle) {
    // Start the image rotation
    galleryViewInterval = setInterval(() => {
      const imagePath = getRandomImage();
      mainWindow.webContents.send('update-background', imagePath);
    }, 20000); // Change image every 20 seconds

    // Send the first image immediately
    const firstImagePath = getRandomImage();
    mainWindow.webContents.send('update-background', firstImagePath);
  } else {
    // Stop the image rotation
    clearInterval(galleryViewInterval);
  }
});

function getRandomImage() {
  const imagesFolder = path.join(__dirname, 'Assets', 'wallpapers');
  const imageFiles = fs.readdirSync(imagesFolder);
  const randomIndex = Math.floor(Math.random() * imageFiles.length);
  return path.join(imagesFolder, imageFiles[randomIndex]);
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});