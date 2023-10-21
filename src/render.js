const { ipcRenderer } = require('electron');

function appendMessage(sender, message) {
  const chatContainer = document.getElementById('bot-message');

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');

  if (sender === 'User') {
    const userContentContainer = document.createElement('div');
    userContentContainer.classList.add('user-content-container');

    const userIcon = document.createElement('div');
    userIcon.classList.add('user-icon');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('bold-text');
    contentDiv.innerHTML = `<strong>${message}</strong>`; // Wrap user's message in <strong> tag for bold text

    userContentContainer.appendChild(userIcon);
    userContentContainer.appendChild(contentDiv);

    messageDiv.appendChild(userContentContainer);
  } else if (sender === 'Bot') {
    const botIcon = document.createElement('div');
    botIcon.classList.add('bot-icon');

    const botContentContainer = document.createElement('div');
    botContentContainer.classList.add('bot-content-container');

    botContentContainer.appendChild(botIcon);

    const contentDiv = document.createElement('div');
    contentDiv.innerText = message;
    botContentContainer.appendChild(contentDiv);

    messageDiv.appendChild(botContentContainer);
  }

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}



function showTypingIndicator() {
  const chatContainer = document.getElementById('chat-container');

  // Display "Bot is typing..." with a 1-second delay
  setTimeout(() => {
    const typingIndicatorDiv = document.createElement('div');
    typingIndicatorDiv.className = 'typing-indicator';
    typingIndicatorDiv.innerHTML = '<em>  Dot is typing...</em>';
    chatContainer.appendChild(typingIndicatorDiv);

    chatContainer.scrollTop = chatContainer.scrollHeight;
  }, 2000); // Adjust the delay time as needed
}

function hideTypingIndicator() {
  const chatContainer = document.getElementById('chat-container');
  const typingIndicator = chatContainer.querySelector('.typing-indicator');

  if (typingIndicator) {
    chatContainer.removeChild(typingIndicator);
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

ipcRenderer.on('python-reply', (event, reply) => {
  const chatContainer = document.getElementById('chat-container');

  try {
    const resultObject = JSON.parse(reply);
    const resultMessage = resultObject.result;

    hideTypingIndicator(); // Remove typing indicator
    appendMessage('Bot', resultMessage.trim());

    chatContainer.scrollTop = chatContainer.scrollHeight;
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
});

function sendMessage(buttonClicked) {
  const userInput = document.getElementById('user-input').value;

  if (userInput.trim() !== '') {
    appendMessage('User', userInput);

    // Show typing indicator before sending the message to Python script
    showTypingIndicator();

    // Sending an object with userInput and buttonClicked properties
    ipcRenderer.send('run-python-script', { userInput, buttonClicked });

    document.getElementById('user-input').value = ''; // Clear input after sending
  }
}

const fs = require('fs');
const path = require('path');

const sidebar = document.getElementById('sidebar');

function createFolderItem(folderPath, isOpenByDefault = false) {
  const folderName = path.basename(folderPath);
  const listItem = document.createElement('div');
  listItem.className = 'folder';
  listItem.textContent = folderName;

  // Check if the folder is the root folder; if yes, don't attach click event
  if (folderPath !== rootDir) {
    // Add a click event listener to toggle visibility of folder contents with a short animation
    listItem.addEventListener('click', () => {
      const contents = listItem.querySelector('.contents');
      contents.style.display = contents.style.display === 'none' ? 'block' : 'none';
    });
  }

  const contents = document.createElement('div');
  contents.className = 'contents';

  // Set the initial display style based on isOpenByDefault
  contents.style.display = isOpenByDefault ? 'block' : 'none';

  // Recursively add subfolders and files
  const items = fs.readdirSync(folderPath);
  items.forEach(item => {
    const itemPath = path.join(folderPath, item);
    if (fs.statSync(itemPath).isDirectory()) {
      contents.appendChild(createFolderItem(itemPath));
    } else {
      // Create a list item for files
      const fileItem = document.createElement('div');
      fileItem.className = 'file';
      fileItem.textContent = item;
      contents.appendChild(fileItem);
    }
  });

  listItem.appendChild(contents);
  return listItem;
}

// Specify the directory path you want to display
const rootDir = path.join(__dirname, 'mystuff');

// Create the sidebar by adding folder items
const rootFolderItem = createFolderItem(rootDir, true); // Set isOpenByDefault to true
sidebar.appendChild(rootFolderItem);
