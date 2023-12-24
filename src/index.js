const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let pythonProcess; // Declare pythonProcess globally



// FIND PYTHON VENV, WORKS IN DEVELOPMENT MODE AND **SHOULD** WORK IN PACKAGED APP



function findPython() {
  const possibilities = [
    // In packaged app
    path.join(process.resourcesPath, "app", "llm", "python", "bin", "python3"),
    // In development
    path.join(__dirname, '..', 'llm', "python", "bin", "python3"),
  ];
  for (const path_to_python of possibilities) {
    if (fs.existsSync(path_to_python)) {
      return path_to_python;
    }
  }
  console.log("Could not find python3, checked", possibilities);
  app.quit();
}

const pythonPath = findPython();
console.log('Python Path:', pythonPath);





// RUNS DOT THROUGHT  script.py



let currentScript = path.join(__dirname,  '..', 'llm', 'scripts', 'docdot.py');
//let currentScript = path.join(process.resourcesPath, 'app', 'llm', 'scripts', 'script.py'); // Default script

ipcMain.on('run-python-script', (event, { userInput, buttonClicked }) => {
  // Check if the Python process is already running
  if (pythonProcess) {
    // Send the new input to the existing process
    pythonProcess.stdin.write(`${userInput} ${buttonClicked}\n`);
  } else {
    // If the Python process is not running, spawn a new one with the default script
    console.log(`Current working directory: ${process.cwd()}`);
    pythonProcess = spawn(pythonPath, [currentScript], { shell: true });

    pythonProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      mainWindow.webContents.send('python-reply', message);
      console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Script Error: ${data}`);
      console.error(`stderr: ${data}`);
    });

    // Send the initial input to the new process
    pythonProcess.stdin.write(`${userInput} ${buttonClicked}\n`);
  }
});


//BIG DOT TOGGLE!!!!


// Switch between the two scripts
ipcMain.on('switch-script', (event) => {
  // Toggle between 'script.py' and 'normalchat.py'
  
  //currentScript = currentScript.endsWith('script.py') ? path.join(process.resourcesPath, 'app', 'llm', 'scripts', 'normalchat.py') : path.join(process.resourcesPath, 'app', 'llm', 'scripts', 'script.py');
  currentScript = currentScript.endsWith('docdot.py') ? path.join(__dirname,  '..', 'llm', 'scripts', 'bigdot.py') : path.join(__dirname,  '..', 'llm', 'scripts', 'docdot.py');

  // If the Python process is running, kill it and spawn a new one with the updated script
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = spawn(pythonPath, [currentScript], { shell: true });

    pythonProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      mainWindow.webContents.send('python-reply', message);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Script Error: ${data}`);
    });
  }

  // Optionally, you can inform the renderer process about the script switch
  mainWindow.webContents.send('script-switched', currentScript);
});



//OPEN FOLDER THING!!!!

ipcMain.handle('open-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Directory',
  });

  return result;
});





// ELECTRON STUFF, CREATE THE WINDOW BLA BLA !!!!

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


// GALLERY VIEW!!!!

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



// MOAR ELECTRON STUFF!!!! TINKER AT RISK LMAO


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
  createWindow();

  const pythonPath = findPython();
  console.log('Python Path:', pythonPath);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});



const appPath = app.getAppPath();

ipcMain.handle('execute-python-script', async (event, directory) => {
  try {
    // Construct paths relative to the script's location
    // const pythonExecutablePath = path.join(__dirname, 'python', 'bin', 'python3');

    //const pythonScriptPath = path.join(process.resourcesPath, 'app', 'llm', 'scripts', 'embeddings.py');
    const pythonScriptPath = path.join(__dirname, '..', 'llm', 'scripts', 'embeddings.py');

    // Spawn the Python process
    const pythonProcess = spawn(pythonPath, [pythonScriptPath, directory], { shell: true });

    // Handle the output and errors if needed
    pythonProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    // Wait for the Python process to exit
    await new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        resolve();
      });
    });
  } catch (err) {
    console.error(err);
  }
});




