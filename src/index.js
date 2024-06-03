const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const path = require('path')
const { spawn, fork } = require('child_process')
const { exec } = require('child_process');
const fs = require('fs')
const fetch = require('node-fetch'); // Using CommonJS
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');
const { Worker } = require('worker_threads');


const isMac = process.platform === 'darwin'

let galleryViewInterval // Declare galleryViewInterval globally
let ttsProcess; // Declare ttsProcess globally
const childProcesses = new Set(); // Declare childProcesses as a Set


const template = [
    // { role: 'appMenu' }
    ...(isMac
        ? [
            {
                label: app.name,
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideOthers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' },
                ],
            },
        ]
        : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac
                ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startSpeaking' },
                            { role: 'stopSpeaking' },
                        ],
                    },
                ]
                : [
                    { role: 'delete' },
                    { type: 'separator' },
                    { role: 'selectAll' },
                ]),
        ],
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { label: 'Gallery View', click: () => toggleGalleryView() },
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' },
        ],
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...(isMac
                ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' },
                ]
                : [{ role: 'close' }]),
        ],
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Dot Website',
                click: async () => {
                    const { shell } = require('electron')
                    await shell.openExternal('https://dotapp.uk/')
                },
            },
        ],
    },
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

let mainWindow

let currentScript = 'docdot.mjs'; // Default script
let activeChatModule; // To hold the currently active chat module



const loadScriptModule = async (scriptName) => {
    try {
        const modulePath = path.join(__dirname, 'app', scriptName);
        const module = await import(`file://${modulePath}`);
        if (!module.default) {
            throw new Error(`No default export found in ${scriptName}`);
        }
        return module.default;
    } catch (error) {
        console.error(`Error loading module ${scriptName}:`, error);
        throw error;
    }
};

ipcMain.on('switch-script', async (event, selectedScript) => {
    console.log('Switching script to:', selectedScript);
    currentScript = selectedScript; // Set the selected script
    try {
        activeChatModule = await loadScriptModule(currentScript);
        console.log(`Switched to ${currentScript} module`);
        mainWindow.webContents.send('script-switched', currentScript);
    } catch (error) {
        console.error(`Error switching to script ${currentScript}:`, error);
    }
});

ipcMain.handle('run-chat', async (event, userInput) => {
    console.log(`IPC call received to run ${currentScript}`);
    try {
        const sendToken = (token) => {
            console.log('Sending token:', token);
            event.sender.send('chat-token', token);
        };
        if (activeChatModule) {
            const response = await activeChatModule(userInput, sendToken, configPath);
            console.log('Final response:', response);
            return response;
        } else {
            throw new Error(`Module ${currentScript} is not loaded.`);
        }
    } catch (error) {
        console.error(`Error running ${currentScript}:`, error);
        throw error;
    }
});


//OPEN FOLDER THING!!!!

// Define a path for the file where you will store the last opened directory
const lastOpenedDirPath = path.join(userDataPath, 'lastOpenedDir.txt');

ipcMain.on('get-user-data-path', (event) => {
    event.returnValue = app.getPath('userData');
});

ipcMain.handle('open-dialog', async (event) => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Directory',
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const chosenDirectory = result.filePaths[0];
        console.log('Chosen Directory:', chosenDirectory);

        // Save the chosen directory to the file
        fs.writeFileSync(lastOpenedDirPath, chosenDirectory, 'utf8');
    } else {
        console.log('No directory selected.');
    }
    return result;
});

// ELECTRON STUFF, CREATE THE WINDOW BLA BLA !!!!


// Flag to track whether dark mode is enabled or not


const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1250,
        height: 700,
        minWidth: 1250,
        minHeight: 700,
        autoHideMenuBar: true, // FOR WINDOWS
        //titleBarStyle: 'hidden', // REMOVE FOR WINDOWS
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            icon: path.join(__dirname, 'Assets', 'icon.ico'), // Provide the correct path
        },
    })

    mainWindow.loadFile(path.join(__dirname, 'index.html'))

    //mainWindow.webContents.openDevTools();
    //TEXT TO SPEECH 
    // Setup TTS child process

    //let ttsProcessorPath;  // Use let instead of const


    function createTtsProcess() {
        //let ttsProcessorPath = path.join(process.resourcesPath, 'llm', 'vits-piper-en_US-glados', 'ttsProcessor.js');
        let ttsProcessorPath = path.join(__dirname, '..', 'llm', 'vits-piper-en_US-glados', 'ttsProcessor.js');
        return fork(ttsProcessorPath);
    }

    ipcMain.handle('run-tts', async (event, message) => {
        return new Promise((resolve, reject) => {
            const ttsProcess = createTtsProcess();
            const userDataPath = app.getPath('userData');
            childProcesses.add(ttsProcess);


            ttsProcess.on('message', (response) => {
                if (response.filePath) {
                    resolve(response.filePath);
                } else {
                    reject(new Error(response.error));
                }
            });

            ttsProcess.on('error', (error) => {
                console.error('Error from TTS process:', error);
                reject(new Error('TTS process error'));
            });

            ttsProcess.on('exit', (code) => {
                console.log(`TTS process exited with code ${code}`);
                if (code !== 0) {
                    reject(new Error('TTS process exited unexpectedly'));
                }
            });

            ttsProcess.send({ cmd: 'run-tts', message, userDataPath });

            // Timeout to handle cases where the process might not respond
            setTimeout(() => {
                ttsProcess.kill();
                reject(new Error('TTS process did not respond in time'));
            }, 100000); // Adjust timeout duration as needed
        }).finally(() => {
            if (ttsProcess) {
                ttsProcess.kill();
            }
        });
    });

    ipcMain.handle('play-audio', async (event, filePath) => {
        const { exec } = require('child_process');
        return new Promise((resolve, reject) => {
            exec(`afplay "${filePath}"`, (err) => {
                if (err) {
                    console.error('Error during audio playback:', err);
                    reject(new Error('Audio playback failed'));
                } else {
                    //ttsProcess.kill(); // Kill the process instead of terminate
                    console.log('Audio playback successful.');
                    resolve('Playback success');
                }
            });
        });
    });



    //mainWindow.webContents.openDevTools();
}


// GALLERY VIEW!!!!

function toggleGalleryView() {
    if (!galleryViewInterval) {
        // Start the image rotation
        galleryViewInterval = setInterval(() => {
            const imagePath = getRandomImage()
            mainWindow.webContents.send('update-background', imagePath)
        }, 60000) // Change image every 20 seconds

        // Send the first image immediately
        const firstImagePath = getRandomImage()
        mainWindow.webContents.send('update-background', firstImagePath)
    } else {
        // Stop the image rotation
        clearInterval(galleryViewInterval)
        galleryViewInterval = null
    }
}

function getRandomImage() {
    const imagesFolder = path.join(__dirname, 'Assets', 'wallpapers')
    const imageFiles = fs.readdirSync(imagesFolder)
    const randomIndex = Math.floor(Math.random() * imageFiles.length)
    return path.join(imagesFolder, imageFiles[randomIndex])
}


ipcMain.on('show-context-menu', (event) => {
    const template = [
        {
            label: 'Menu Item 1',
            click: () => {
                event.sender.send('context-menu-command', 'menu-item-1')
            },
        },
        { type: 'separator' },
        { label: 'Menu Item 2', type: 'checkbox', checked: true },
    ]
    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) })
})

ipcMain.on('toggle-gallery-view', () => {
    toggleGalleryView()
})

ipcMain.on('update-background', (event, imagePath) => {
    mainWindow.webContents.send('update-background', imagePath)

    // MOAR ELECTRON STUFF!!!! TINKER AT RISK LMAO

    const pythonPath = findPython()
    console.log('Python Path:', pythonPath)

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    childProcesses.forEach(process => {
        if (!process.killed) {
            process.kill();  // Forcefully terminate each child process
            console.log('Child process killed');
        }
    });
    childProcesses.clear();  // Clear the set after killing all processes

    if (ttsProcess) {
        ttsProcess.kill();
    }

    if (process.platform !== 'darwin') {
        app.quit();  // Optionally quit the app on non-macOS platforms
    }
});

const appPath = app.getAppPath()


ipcMain.handle('execute-python-script', async (event, directory) => {
    try {
        // Construct paths relative to the script's location

        /*const pythonScriptPath = path.join(
            process.resourcesPath,
            'llm',
            'scripts',
            'embeddings.py'
        )*/
        const pythonScriptPath = path.join(
            __dirname,
            '..',
            'llm',
            'scripts',
            'embeddings.py'
        )

        // Quote the directory path to handle spaces
        const quotedDirectory = `"${directory}"`
        // Spawn the Python process
        const pythonProcess = spawn(
            pythonPath,
            [pythonScriptPath, quotedDirectory, `"${configPath}"`],
            { shell: true }
        )

        // Handle the output and errors if needed
        pythonProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`)
        })

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`)
        })

        // Wait for the Python process to exit
        await new Promise((resolve) => {
            pythonProcess.on('close', (code) => {
                console.log(`child process exited with code ${code}`)
                resolve()
            })
        })
    } catch (err) {
        console.error(err)
    }
})

// DOWNLOAD LLM AND SUCH!


console.log("IPC Setup Starting");
ipcMain.on('start-download', (event, data) => {
    console.log("IPC Message Received:", data);
    ensureAndDownloadDependencies(event.sender)
        .catch(error => {
            console.error('Download Initiation Failed:', error);
            event.sender.send('download-error', error.toString());
        });
});



// Function to get the Dot-data directory path
function getDotDataPath() {
    const documentsPath = app.getPath('documents');
    return path.join(documentsPath, 'Dot-Data');
}

// Function to check if the required file exists
function checkFileExists(filePath) {
    return fs.existsSync(filePath);
}

// Function to download files

async function downloadFile(url, outputPath, event) {
    try {
        //const fetch = (await import('node-fetch')).default; // Using dynamic import

        const response = await fetch(url);

        // Check if the response is ok (status 200)
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }

        const fileStream = fs.createWriteStream(outputPath);

        // Total bytes received and the content length (if available)
        const totalBytes = parseInt(response.headers.get('content-length'), 10);
        let receivedBytes = 0;

        // Handle data events and pipe to file stream
        response.body.on('data', (chunk) => {
            receivedBytes += chunk.length;
            const progress = totalBytes ? Math.round((receivedBytes / totalBytes) * 100) : 0;
            if (event && event.sender) {
                event.sender.send('download-progress', progress);
            }
        });

        // Pipe the response body directly to the file stream
        response.body.pipe(fileStream);

        return new Promise((resolve, reject) => {
            fileStream.on('finish', () => {
                resolve();
            });

            // Handle file and response stream errors
            fileStream.on('error', (err) => {
                fileStream.close();
                fs.unlink(outputPath, () => { }); // Attempt to delete the file
                reject(err);
            });

            response.body.on('error', (err) => {
                fileStream.close();
                fs.unlink(outputPath, () => { }); // Attempt to delete the file
                reject(err);
            });
        });
    } catch (error) {
        console.error('Download error:', error.message);
        if (event && event.sender) {
            event.sender.send('download-error', error.message);
        }
        throw error;
    }
}


// Ensure directory exists and download dependencies if necessary
async function ensureAndDownloadDependencies(event) {
    const dotDataDir = getDotDataPath();
    if (!fs.existsSync(dotDataDir)) {
        fs.mkdirSync(dotDataDir, { recursive: true });
    }

    const filePath = path.join(dotDataDir, 'Phi-3-mini-4k-instruct-q4.gguf');
    if (!checkFileExists(filePath)) {
        try {
            await downloadFile('https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf?download=true', filePath, event); console.log('Download completed');
            console.log('Download completed');
        } catch (error) {
            console.error('Download failed:', error);
            if (event) {
                event.sender.send('download-error', error.message);
            }
        }
    } else {
        console.log('File already exists, no download needed.');
    }
}


app.on('ready', async () => {
    mainWindow = createWindow(); // This should now correctly create and return the window

    if (mainWindow) {
        mainWindow.on('ready-to-show', async () => {
            try {
                await ensureAndDownloadDependencies(mainWindow.webContents);
                ttsWorker = setupTtsWorker();
                initializeHandlers();
                await switchScript(currentScript); // Ensure the module is loaded
            } catch (error) {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('download-error', error.message);
                }
            }
        });
    } else {
        console.error('Failed to create main window');
    }
});

// IPC event handler
ipcMain.on('start-download', (event, { url, outputPath }) => {
    if (event.sender && !event.sender.isDestroyed()) {
        ensureAndDownloadDependencies(event)
            .catch(error => {
                if (event.sender && !event.sender.isDestroyed()) {
                    event.sender.send('download-error', error.message);
                }
            });
    }
});







// SETTINGS BUTTON
// THIS WILL OPEN A SETTINGS BUTTON
let settingsWindow;

let isDarkModeEnabled = false; // Maintain dark mode state

ipcMain.on('toggle-dark-mode', (event) => {
    isDarkModeEnabled = !isDarkModeEnabled;
    // Update all renderer processes
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('dark-mode-toggled', isDarkModeEnabled);
    });
});

// In your main process file (main.js)
ipcMain.on('request-dark-mode-state', (event) => {
    event.sender.send('current-dark-mode-state', isDarkModeEnabled);
});



ipcMain.on('open-settings-window', () => {
    if (!settingsWindow) {
        settingsWindow = new BrowserWindow({
            width: 600,
            height: 500,
            parent: mainWindow,
            titleBarStyle: 'hidden',            
            modal: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            }
        });

        const settingsPath = path.join(__dirname, 'settings.html');
        settingsWindow.loadFile(settingsPath);

        settingsWindow.on('closed', () => {
            settingsWindow = null;
            mainWindow.webContents.send('settings-closed');
        });
    }
});

ipcMain.on('close-settings', () => {
    if (settingsWindow) {
        settingsWindow.close();
    }
});


//AUTO TTS
//This will make TTS activate for EACH message automatically
let autoTtsEnabled = false; // Default state

// index.js in your main process
ipcMain.on('set-auto-tts', (event, isEnabled) => {
    console.log("Setting auto TTS to", isEnabled); // Confirm this logs correctly
    autoTtsEnabled = isEnabled;

    // Update all renderer processes
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('update-auto-tts', autoTtsEnabled);
    });
});

ipcMain.on('request-auto-tts-state', (event) => {
    console.log("Sending auto TTS state:", autoTtsEnabled); // Confirm state before sending
    event.sender.send('get-auto-tts-state', autoTtsEnabled);
});








//CONFIG FOR USER SETTINGS
//THIS FILE WILL STORE USER SETTINGS FOR THE LLM. THESE SETTINGS WILL BE READ BY PYTHON.


// Check if config exists, if not, create it
if (!fs.existsSync(configPath)) {
    const defaultConfig = {
        n_ctx: 4000,
        n_gpu_layers: -1,
        n_batch: 256,
        max_tokens: 500,
        big_dot_temperature: 0.7,
        big_dot_promt: "You are called Dot, You are a helpful and honest assistant."
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
}


// Listener to get the current configuration
ipcMain.handle('getConfig', async () => {
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return null;
});

// Listener to save the configuration
ipcMain.handle('setConfig', async (event, newConfig) => {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
});



ipcMain.handle('open-file-dialog', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'GGUF Files', extensions: ['gguf'] }]
    });
    if (canceled) {
        return { filePaths: [] };
    } else {
        return { filePaths };
    }
});







// WHISPER CPP


let streamProcess = null;

ipcMain.on('run-stream-model', (event) => {
    const modelPath = path.join(__dirname, '..', 'llm', 'whisper', 'models', 'ggml-model-whisper-base.bin');
    //const modelPath = path.join(process.resourcesPath, 'llm', 'whisper', 'models', 'ggml-model-whisper-base.bin');
    const args = [
        '-m', modelPath,
        '-t', '8',
        '--step', '500',
        '--length', '5000'
    ];

    const streamPath = path.join(__dirname, '..', 'llm', 'whisper', 'stream');
    //const streamPath = path.join(process.resourcesPath, 'llm', 'whisper', 'stream');

    streamProcess = spawn(streamPath, args, { shell: true });

    streamProcess.stdout.on('data', (data) => {
        event.sender.send('stream-data', data.toString());
    });

    streamProcess.stderr.on('data', (data) => {
        event.sender.send('stream-error', data.toString());
    });

    streamProcess.on('close', (code) => {
        event.sender.send('stream-close', code);
        streamProcess = null; // Reset the streamProcess variable
        console.log(`Stream process closed with code ${code}`);
    });
});

ipcMain.on('kill-stream-process', (event) => {
    if (streamProcess) {
        streamProcess.kill('SIGINT'); // Send an interrupt signal to terminate the process
        streamProcess = null; // Reset the streamProcess variable
        event.sender.send('stream-terminated'); // Notify renderer process
    }
});

