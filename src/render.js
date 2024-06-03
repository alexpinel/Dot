const { ipcRenderer } = require('electron')

// renderer
window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    ipcRenderer.send('show-context-menu')
})

ipcRenderer.on('context-menu-command', (e, command) => {
    // ...
})


function formatLaTeX(inputString) {
    // This regular expression finds all LaTeX expressions within brackets
    const regex = /\[([^\]]+)\]/g;
    return inputString.replace(regex, (match, equation) => {
        // Replace brackets with MathJax delimiters for display math
        return `$$ ${equation.trim()} $$`;
    });
}



// Ensure MathJax is loaded and ready before calling any functions
document.addEventListener("DOMContentLoaded", function () {
    if (window.MathJax) {
        MathJax.startup.promise.then(() => {
            console.log("MathJax is fully loaded and ready!");
        }).catch((err) => console.error("Error loading MathJax:", err));
    } else {
        console.error("MathJax not found!");
    }
});


let autoTtsEnabled = false; // Default value to ensure it's always defined


//// CHATTY CHAT CHAT STUFF!!!!
function appendMessage(sender, message, isMarkdown) {
    console.log('Appending message from', sender);
    const chatContainer = document.getElementById('bot-message');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.style.position = 'relative';

    if (sender === 'User') {
        const userContentContainer = document.createElement('div');
        userContentContainer.classList.add('user-content-container');

        const userIcon = document.createElement('div');
        userIcon.classList.add('user-icon');
        userIcon.style.marginTop = '10px';

        const userBubble = document.createElement('div');
        userBubble.classList.add('user-bubble');
        userBubble.innerHTML = `<strong>${message}</strong>`;

        userContentContainer.appendChild(userIcon);
        userContentContainer.appendChild(userBubble);
        messageDiv.appendChild(userContentContainer);
    } else if (sender === 'Bot') {
        const botIcon = document.createElement('div');
        botIcon.classList.add('bot-icon');
        botIcon.style.marginTop = '10px';

        const botContentContainer = document.createElement('div');
        botContentContainer.classList.add('bot-content-container');
        botContentContainer.appendChild(botIcon);

        const botBubble = document.createElement('div');
        botBubble.classList.add('bot-bubble');
        if (isMarkdown) {
            botBubble.innerHTML = marked.parse(message);
            // Check if MathJax is loaded and then typeset
            if (window.MathJax) {
                MathJax.typesetPromise([botBubble]).then(() => {
                    console.log("MathJax has finished processing!");
                }).catch((err) => console.error('MathJax processing error:', err));
            } else {
                console.log("MathJax is not available to process the content.");
            }
        } else {
            botBubble.innerText = message;
        }

        const ttsButton = document.createElement('button');
        ttsButton.classList.add('tts-button');
        ttsButton.style.position = 'relative';
        ttsButton.style.zIndex = '1000'; // Set sufficiently high within context

        const speakerIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        speakerIcon.setAttribute('class', 'tts-icon');
        speakerIcon.setAttribute('viewBox', '0 0 24 24');
        speakerIcon.style.width = '16px';
        speakerIcon.style.height = '16px';
        speakerIcon.style.stroke = 'currentColor';
        speakerIcon.style.strokeWidth = '1.5';
        speakerIcon.style.strokeLinecap = 'round';
        speakerIcon.style.strokeLinejoin = 'round';
        speakerIcon.style.marginLeft = '-18px';
        speakerIcon.style.marginTop = '-10px'; // Moves the icon 3 pixels up
        speakerIcon.innerHTML = `<path d="M19 6C20.5 7.5 21 10 21 12C21 14 20.5 16.5 19 18M16 8.99998C16.5 9.49998 17 10.5 17 12C17 13.5 16.5 14.5 16 15M3 10.5V13.5C3 14.6046 3.5 15.5 5.5 16C7.5 16.5 9 21 12 21C14 21 14 3 12 3C9 3 7.5 7.5 5.5 8C3.5 8.5 3 9.39543 3 10.5Z" fill="none" stroke="#424242" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>`;

        ttsButton.appendChild(speakerIcon);

        function showSpinner() {
            // Change to spinner
            speakerIcon.innerHTML = `<svg class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>`;
            speakerIcon.style.width = '16px'; // Adjust size for spinner if needed
            speakerIcon.style.height = '16px';
        };
        // Call the sendMessage function with a callback to reset the icon
        function showErrorIcon() {
            // Reset back to speaker icon
            speakerIcon.innerHTML = `<path d="M19 6C20.5 7.5 21 10 21 12C21 14 20.5 16.5 19 18M16 8.99998C16.5 9.49998 17 10.5 17 12C17 13.5 16.5 14.5 16 15M3 10.5V13.5C3 14.6046 3.5 15.5 5.5 16C7.5 16.5 9 21 12 21C14 21 14 3 12 3C9 3 7.5 7.5 5.5 8C3.5 8.5 3 9.39543 3 10.5Z" fill="none" stroke="#424242" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>`;
            speakerIcon.style.width = '16px'; // Reset size for speaker icon
            speakerIcon.style.height = '16px';
        };

        ttsButton.onclick = () => {
            // Change to spinner or other "processing" indicator
            showSpinner();

            // Start the TTS request
            sendMessageToMainForTTS(message, resetSpeakerIcon, handleTtsError);
        };

        function resetSpeakerIcon() {
            // Reset the speaker icon
            speakerIcon.innerHTML = `<path d="M19 6C20.5 7.5 21 10 21 12C21 14 20.5 16.5 19 18M16 8.99998C16.5 9.49998 17 10.5 17 12C17 13.5 16.5 14.5 16 15M3 10.5V13.5C3 14.6046 3.5 15.5 5.5 16C7.5 16.5 9 21 12 21C14 21 14 3 12 3C9 3 7.5 7.5 5.5 8C3.5 8.5 3 9.39543 3 10.5Z" fill="none" stroke="#424242" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>`;
            // Additional UI reset logic if necessary
        }

        function handleTtsError(error) {
            // Update the UI to reflect the error state
            console.error('Error during TTS:', error);
            showErrorIcon(); // Function to change the icon or display an error message
        }

        console.log("Auto TTS Enabled:", autoTtsEnabled); // Log when checking autoTTS
        if (autoTtsEnabled) {
            console.log("Attempting to click TTS button for automatic TTS");
            ttsButton.click();
        }

        botContentContainer.appendChild(botBubble);
        botContentContainer.appendChild(ttsButton);
        messageDiv.appendChild(botContentContainer);
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageDiv; // Return the message div for further manipulation
}

ipcRenderer.on('update-auto-tts', (event, isEnabled) => {
    console.log("Received updated auto TTS state:", isEnabled); // Check the incoming state
    autoTtsEnabled = isEnabled;
});
ipcRenderer.on('get-auto-tts-state', (event, isEnabled) => {
    console.log("Received auto TTS state:", isEnabled);
    document.getElementById('auto-tts-toggle').checked = isEnabled;
});

function sendMessageToMainForTTS(message, onComplete, onError) {
    console.log('TTS Requested for:', message);

    // Check if the message contains "Result:" and extract the relevant part
    const resultKeyword = "Result:";
    let ttsMessage = message;
    if (message.includes(resultKeyword)) {
        const startIndex = message.indexOf(resultKeyword) + resultKeyword.length;
        ttsMessage = message.substring(startIndex).trim();
    }

    // Send the processed message to the TTS engine in the main process
    ipcRenderer.invoke('run-tts', ttsMessage)
        .then(filePath => {
            console.log('TTS audio file generated:', filePath);
            // Play the audio file using the main process
            return ipcRenderer.invoke('play-audio', filePath);
        })
        .then(() => {
            console.log('TTS playback successful.');
            onComplete();  // Reset the icon or perform other UI updates
        })
        .catch(error => {
            console.error('Error during TTS generation or playback:', error);
            onError(error);  // Perform error handling UI updates
        });
}


function showTypingIndicator() {
    const chatContainer = document.getElementById('chat-container')

    // Display "Bot is typing..."
    setTimeout(() => {
        hideTypingIndicator() // Remove any existing typing indicator

        const typingIndicatorDiv = document.createElement('div')
        typingIndicatorDiv.className = 'typing-indicator'

        // Create three spans for each dot in the ellipsis
        typingIndicatorDiv.innerHTML =
            '<em> Dot is typing <span>.</span><span>.</span><span>.</span> </em>'

        // Append the typing indicator at the end of the chat container
        chatContainer.appendChild(typingIndicatorDiv)

        // Scroll to the bottom after adding the typing indicator
        chatContainer.scrollTop = chatContainer.scrollHeight
    }, 0) // Adjust the delay time as needed
}

function hideTypingIndicator() {
    const chatContainer = document.getElementById('chat-container')
    const typingIndicator = chatContainer.querySelector('.typing-indicator')

    if (typingIndicator) {
        chatContainer.removeChild(typingIndicator)
    }

    chatContainer.scrollTop = chatContainer.scrollHeight
}

const { marked } = require('marked')

ipcRenderer.on('python-reply', (event, reply) => {
    const chatContainer = document.getElementById('chat-container')

    try {
        const resultObject = JSON.parse(reply)
        const resultChunks = resultObject.result

        hideTypingIndicator() // Remove typing indicator

        // Join the chunks back together
        const resultMessageMarkdown = resultChunks.join('')

        // Append the joined Markdown content to bot-content-container
        appendMessage('Bot', resultMessageMarkdown.trim(), true)

        chatContainer.scrollTop = chatContainer.scrollHeight
    } catch (error) {
        console.error('Error parsing JSON:', error)
    }
})




//WHISPER
//This logic loads in whisper.cpp to enable live transcription of messages
//whisper.cpp is loaded in the llm folder, from which the stream executable is accessed

let isTranscribing = false;
let streamProcess = null;

/*
document.getElementById('runStreamBtn').addEventListener('click', () => {
    const micIcon = document.getElementById('mic-icon');
    if (!isTranscribing) {
        isTranscribing = true;
        runStreamModel();
        micIcon.classList.add('mic-active');
    } else {
        if (streamProcess !== null) {
            ipcRenderer.send('kill-stream-process');
        }
        isTranscribing = false;
        micIcon.classList.remove('mic-active');
    }
});

function runStreamModel() {
    ipcRenderer.send('run-stream-model');

    ipcRenderer.on('stream-data', (event, data) => {
        console.log(data);
        data = data.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '').trim();
        if (data !== '' && data !== '[BLANK_AUDIO]') {
            document.getElementById('user-input').value = data;
        }
    });

    ipcRenderer.on('stream-error', (event, data) => {
        console.error(`stderr: ${data}`);
    });

    ipcRenderer.on('stream-close', (event, code) => {
        console.log(`child process exited with code ${code}`);
        streamProcess = null;
        document.getElementById('mic-icon').classList.remove('mic-active');
    });

    ipcRenderer.on('stream-terminated', () => {
        isTranscribing = false;
        document.getElementById('mic-icon').classList.remove('mic-active');
    });
}
*/

function sendMessage(buttonClicked) {
    const userInput = document.getElementById('user-input').value;

    if (userInput.trim() !== '') {
        appendMessage('User', userInput);
        showTypingIndicator();
        ipcRenderer.send('run-python-script', { userInput, buttonClicked });
        //document.getElementById('user-input').value = ''; // Clear input after sending
        //if (streamProcess !== null) {
        //    ipcRenderer.send('kill-stream-process');
        //}
        //isTranscribing = false; // Stop transcribing after sending the message
        //document.getElementById('mic-icon').classList.remove('mic-active'); // Turn off animation immediately after sending
        //ipcRenderer.send('kill-stream-process');
    }
}

// ENTER == SEND
let accumulatedTokens = ''; // Variable to store accumulated tokens

document.getElementById('send-button').addEventListener('click', async () => {
    const userInput = document.getElementById('user-input').value;
    console.log('Send button clicked, user input:', userInput);
    if (userInput.trim() !== '') {
        appendMessage('User', userInput);
        showTypingIndicator();
        try {
            appendMessage('Bot', '', true); // Create a new message div for the bot response
            accumulatedTokens = ''; // Reset accumulated tokens
            await ipcRenderer.invoke('run-chat', userInput);
            console.log('IPC call made: run-chat');
        } catch (error) {
            console.error('Error initiating chat1:', error);
            appendMessage('Bot', 'There was an error processing your request.', false);
        } finally {
            hideTypingIndicator();
        }
    }
});
// Handle tokens received from the main process
ipcRenderer.on('chat-token', (event, token) => {
    console.log('Received token:', token);
    accumulatedTokens += token; // Append the new token to the accumulated tokens
    appendTokenToLastMessage();
});

function appendTokenToLastMessage() {
    const chatContainer = document.getElementById('bot-message');
    const lastMessage = chatContainer.lastElementChild;
    if (lastMessage && lastMessage.classList.contains('message')) {
        const botBubble = lastMessage.querySelector('.bot-bubble');
        if (botBubble) {
            // Process the accumulated tokens for markdown and MathJax
            botBubble.innerHTML = marked(accumulatedTokens);
            // Check if MathJax is loaded and then typeset
            if (window.MathJax) {
                MathJax.typesetPromise([botBubble]).then(() => {
                    console.log("MathJax has finished processing!");
                }).catch((err) => console.error('MathJax processing error:', err));
            } else {
                console.log("MathJax is not available to process the content.");
            }
        }
    }
}
//document.getElementById('mic-icon').addEventListener('click', () => {
    //ipcRenderer.send('kill-stream-process');
//});




// SIDEBAR AND FILE TREE!!!!

const { dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const $ = require('jquery') // Make sure to import jQuery
const defaultDirectory = './src/mystuff'

const $fileTree = $('#fileTree')
const $loadingSpinner = $('#loadingSpinner')

$(document).ready(() => {
    // Define a path for the file where you will store the last opened directory
    const { ipcRenderer } = require('electron')
    const userDataPath = ipcRenderer.sendSync('get-user-data-path') // You'll need to implement this in your main process
    const lastOpenedDirPath = path.join(userDataPath, 'lastOpenedDir.txt')
    const $fileTree = $('#fileTree')

    function truncateText(textContainer, maxWidth) {
        const text = textContainer.text()
        const originalText = textContainer.data('original-text')

        if (!originalText) {
            textContainer.data('original-text', text)
        }

        const isTruncated = textContainer[0].scrollWidth > maxWidth

        if (isTruncated) {
            const truncatedText = originalText.slice(0, -1)
            textContainer.text(truncatedText)
        } else {
            textContainer.text(originalText)
        }

        return isTruncated
    }

    function populateTree(rootPath, parentElement) {
        fs.promises
            .readdir(rootPath)
            .then((files) => {
                const ul = $('<ul>').css('list-style-type', 'none')

                files.forEach((file) => {
                    // Skip .DS_Store files
                    if (file === '.DS_Store') {
                        return
                    }
                    const fullPath = path.join(rootPath, file)
                    const li = $('<li>')
                        .addClass('folder flex flex-col mb-2')
                        .css({
                            'list-style-type': 'none',
                            'padding-left': '20px',
                        })
                    const shit = $('<div>').addClass(
                        'folder flex flex-row items-center'
                    ) // Changed from div to li
                    const icon = $('<div>') // Container for the icon
                    const arrow = $('<div>') // Container for the arrow
                    const textContainer = $('<div>').addClass(
                        'text-container mx-1 text-gray-500 file-name'
                    ) // Container for text

                    // Append li to shit
                    li.append(shit)
                    // Append items to li
                    shit.append(arrow, icon, textContainer)
                    // Append li to ul
                    ul.append(li)

                    fs.promises
                        .stat(fullPath)
                        .then((stats) => {
                            if (stats.isDirectory()) {
                                li.addClass(
                                    'folder rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition align-center'
                                )
                                // SVG for arrow icon
                                arrow
                                    .html(
                                        `<svg class="w-3 h-3 text-black dark:text-gray-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 14">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 13 5.7-5.326a.909.909 0 0 0 0-1.348L1 1"/>
                                    </svg>`
                                    )
                                    .addClass(
                                        'inline-block transition mr-1 rotate-0'
                                    ) // Added rotate-0 class
                                    .click(() => {
                                        if (!subUl.children().length) {
                                            populateTree(fullPath, subUl)
                                        }
                                        subUl.slideToggle()

                                        // Toggle the rotate class
                                        arrow.toggleClass('rotate-90')
                                    })

                                // Create a nested ul for subdirectories
                                const subUl = $('<ul>')
                                    .css({
                                        'list-style-type': 'none',
                                        'padding-left': '20px',
                                    })
                                    .hide()
                                li.append(subUl) // Append nested ul to li

                                // Text
                                // Text for folders
                                textContainer.text(file)
                                const isTruncated = truncateText(
                                    textContainer,
                                    textContainer.width()
                                )
                                if (isTruncated) {
                                    textContainer.attr('title', file)
                                } else {
                                    textContainer.removeAttr('title')
                                }
                            } else if (stats.isFile()) {
                                li.addClass(
                                    'file flex flex-row hover:bg-gray-200 dark:hover:bg-slate-700 transition '
                                )

                                // SVG for document icon
                                icon.html(
                                    `<svg class="w-3 h-3 text-gray-800 dark:text-gray-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 20">
                                    <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M6 1v4a1 1 0 0 1-1 1H1m14-4v16a.97.97 0 0 1-.933 1H1.933A.97.97 0 0 1 1 18V5.828a2 2 0 0 1 .586-1.414l2.828-2.828A2 2 0 0 1 5.828 1h8.239A.97.97 0 0 1 15 2Z"/>
                                  </svg>`
                                ).addClass('icon  inline-block ml-1')

                                // Text for files
                                // Text for folders
                                textContainer.text(file)
                                const isTruncated = truncateText(
                                    textContainer,
                                    textContainer.width()
                                )
                                if (isTruncated) {
                                    textContainer.attr('title', file)
                                } else {
                                    textContainer.removeAttr('title')
                                }
                            }
                        })
                        .catch((err) => {
                            console.error(err)
                        })
                })

                parentElement.append(ul)
            })
            .catch((err) => {
                console.error(err)
            })
    }

    async function executePythonScript(directory) {
        $loadingSpinner.show()

        try {
            // Invoke IPC event to execute the Python script
            const result = await ipcRenderer.invoke(
                'execute-python-script',
                directory
            )

            // Process the result if needed

            // Update the file tree
            $fileTree.empty()
            await populateTree(directory, $fileTree)
        } catch (err) {
            console.error(err)
        } finally {
            $loadingSpinner.hide()
            //RESETTING SCRIPT
            const selectedScript = scriptToggle.checked
                ? 'bigdot.mjs'
                : 'docdot.mjs'
            ipcRenderer.send('switch-script', selectedScript)
            ipcRenderer.send('switch-script', selectedScript)
        }
    }

    try {
        // Check if the lastOpenedDir.txt file exists
        if (fs.existsSync(lastOpenedDirPath)) {
            const lastOpenedDir = fs.readFileSync(lastOpenedDirPath, 'utf8')

            // If the directory exists, display its file tree
            if (fs.existsSync(lastOpenedDir)) {
                $fileTree.empty()
                populateTree(lastOpenedDir, $fileTree)
            }
        }
    } catch (err) {
        console.error('Error loading the last opened directory:', err)
    }

    function selectDirectory() {
        ipcRenderer
            .invoke('open-dialog')
            .then((result) => {
                if (!result.canceled && result.filePaths.length > 0) {
                    const selectedDirectory = result.filePaths[0]

                    document.getElementById('fileTree').innerHTML = ''
                    // Show the loading animation after the directory has been selected

                    document.getElementById('loadingAnimation').style.display =
                        'block'

                    // Now call the function to process the directory
                    executePythonScript(selectedDirectory)
                        .then(() => {
                            // Hide the loading animation after the folder is loaded and displayed
                            document.getElementById(
                                'loadingAnimation'
                            ).style.display = 'none'
                        })
                        .catch((err) => {
                            // Hide the loading animation also in case of error
                            document.getElementById(
                                'loadingAnimation'
                            ).style.display = 'none'
                            console.error(err)
                        })
                }
            })
            .catch((err) => {
                console.error(err)
            })
    }

    $('#selectDirectoryButton').click(selectDirectory)
})

// GALLERY VIEW!!!!
ipcRenderer.on('update-background', (event, imagePath) => {
    // Update the background of the chat-container div with the selected image
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
        chatContainer.style.backgroundImage = `url('file://${imagePath}')`
    }
})

// BIG DOT TOGGLE!!!!!

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded')

    const scriptToggle = document.getElementById('scriptToggle')

    if (scriptToggle) {
        scriptToggle.addEventListener('change', function () {
            const selectedScript = scriptToggle.checked ? 'bigdot.mjs' : 'docdot.mjs';
            ipcRenderer.send('switch-script', selectedScript);
        });

    } else {
        console.error('Element with ID "scriptToggle" not found.')
    }

    console.log('Renderer Process Loaded')
    ipcRenderer.send('start-download', 'Initiate Download')

    ipcRenderer.on('download-progress', (event, progress) => {
        console.log('Download Progress:', progress)
    })

    ipcRenderer.on('download-complete', () => {
        console.log('Download Complete')
    })

    ipcRenderer.on('download-error', (error) => {
        console.error('Download Error:', error)
    })
})

document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('dropdown')
    const optionsMenu = document.getElementById('options-menu')

    if (
        !dropdown.contains(event.target) &&
        !optionsMenu.contains(event.target)
    ) {
        // Click is outside of the dropdown and the options menu button
        dropdown.classList.add('hidden')
    }
})

function toggleDropdown() {
    const dropdown = document.getElementById('dropdown')
    dropdown.classList.toggle('hidden')
}

function selectOption(option) {
    document.getElementById('selected-option').textContent = option
    const selectedScript = option === 'Doc Dot' ? 'docdot.mjs' : 'bigdot.mjs'
    ipcRenderer.send('switch-script', selectedScript)
    document.getElementById('dropdown').classList.add('hidden')
}



let progressMessageExists = false // This will track if the progress message is already displayed

function appendMessageAuto(sender, message, isMarkdown) {
    const chatContainer = document.getElementById('bot-message') // Ensure this is the correct container

    const messageDiv = document.createElement('div')
    messageDiv.classList.add('message')

    if (sender === 'User') {
        const userContentContainer = document.createElement('div')
        userContentContainer.classList.add('user-content-container')

        const userIcon = document.createElement('div')
        userIcon.classList.add('user-icon')
        userIcon.style.marginTop = '10px'

        const userBubble = document.createElement('div')
        userBubble.classList.add('user-bubble')
        userBubble.innerHTML = `<strong>${message}</strong>`

        userContentContainer.appendChild(userIcon)
        userContentContainer.appendChild(userBubble)
        messageDiv.appendChild(userContentContainer)
    } else if (sender === 'Bot') {
        const botIcon = document.createElement('div')
        botIcon.classList.add('bot-icon')
        botIcon.style.marginTop = '10px'

        const botContentContainer = document.createElement('div')
        botContentContainer.classList.add('bot-content-container')
        botContentContainer.appendChild(botIcon)

        const botBubble = document.createElement('div')
        botBubble.classList.add('bot-bubble')

        if (isMarkdown) {
            botBubble.innerHTML = marked(message)
        } else {
            // Directly set innerHTML for HTML content
            botBubble.innerHTML = message
        }

        botContentContainer.appendChild(botBubble)
        messageDiv.appendChild(botContentContainer)
    }

    chatContainer.appendChild(messageDiv)
    chatContainer.scrollTop = chatContainer.scrollHeight
}

function showDownloadProgress(progress) {
    const chatContainer = document.getElementById('chat-container')
    let progressMessage = chatContainer.querySelector('.download-progress')

    if (!progressMessage) {
        let progressHTML = `
        <div class="intro-message">
            <h1>Hello!</h1>
            <p>Welcome to Dot. Before you can get started, the Phi-3 Large Language Model must be installed. This process should only take a few minutes, depending on your connection speed. Please wait while the necessary files are downloaded and set up for your use.</p>
        </div>
    
        <div class="download-progress">
            <div>Downloading LLM...</div>
            <div class="progress-bar">
                <span class="progress-bar-text">0%</span>
            </div>
        </div>
        `
        appendMessageAuto('Bot', progressHTML, false)
    }

    const progressBar = document.querySelector('.progress-bar')
    const progressBarText = document.querySelector('.progress-bar-text')
    if (progressBar && progressBarText) {
        progressBar.style.width = `${progress}%`
        progressBarText.innerText = `${progress}%` // Update text to reflect current progress

        // Check if the progress is 100% and update the text accordingly
        if (progress >= 100) {
            progressBarText.innerText = 'Complete!'
            progressBar.style.backgroundColor = '#4CAF50' // Optional: change color to indicate completion
        }
    }
}

function removeDownloadProgress() {
    const chatContainer = document.getElementById('chat-container')
    const progressMessage = chatContainer.querySelector('.download-progress')

    if (progressMessage) {
        // Optionally fade out or just leave the message as-is
        // const messageDiv = progressMessage.closest('.message');
        // chatContainer.removeChild(messageDiv);
        // Or you can leave it to display the complete status
    }
    chatContainer.scrollTop = chatContainer.scrollHeight
}

ipcRenderer.on('download-progress', (event, progress) => {
    console.log('Download Progress:', progress)
    showDownloadProgress(progress)
})

ipcRenderer.on('download-complete', () => {
    console.log('Download Complete') // Check if this log appears in the console
    removeDownloadProgress()
    appendMessage('Bot', 'Download completed successfully.', false)
})

ipcRenderer.on('download-error', (event, error) => {
    console.log('Download Error:', error)
    removeDownloadProgress()
    appendMessage('Bot', `Download failed: ${error}`, false)
})







// SETTINGS BUTTON
// THIS IS FOR THE SETTINGS BUTTON

document.getElementById('settingsButton').addEventListener('click', () => {
    ipcRenderer.send('open-settings-window');
    document.querySelector('body').classList.add('blur-sm'); // Adding blur using Tailwind CSS
});

ipcRenderer.on('settings-closed', () => {
    document.querySelector('body').classList.remove('blur-sm'); // Removing blur
});

// This listens for the 'settings-closed' event
ipcRenderer.on('settings-closed', () => {
    document.body.classList.remove('blur-sm'); // Assuming 'blur-sm' is the blur class
});

// In both settings.js and index.js
ipcRenderer.on('dark-mode-toggled', (event, isEnabled) => {
    document.documentElement.classList.toggle('dark', isEnabled);
});

// Add this in both settings.js and index.js
document.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.send('request-dark-mode-state'); // Ask main process for current dark mode state
});

ipcRenderer.on('current-dark-mode-state', (event, isEnabled) => {
    document.documentElement.classList.toggle('dark', isEnabled);
});






/*
//KILL TTS WHEN:

// Add event listener for microphone icon
document.getElementById('mic-icon').addEventListener('click', () => {
    ipcRenderer.send('kill-tts-process');
});

// Assuming the TTS spinner is a button with class 'tts-button'
document.querySelectorAll('.tts-button').forEach(button => {
    button.addEventListener('click', () => {
        ipcRenderer.send('kill-tts-process');
    });
});

*/