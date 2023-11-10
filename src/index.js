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

function getRandomImage() {
  const imagesFolder = path.join(__dirname, './Assets/wallpapers'); // Replace with your folder path
  const files = fs.readdirSync(imagesFolder);
  const randomIndex = Math.floor(Math.random() * files.length);
  const randomImage = path.join(imagesFolder, files[randomIndex]);

  return randomImage;
}

ipcMain.handle('get-random-image', () => {
  return getRandomImage();
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
