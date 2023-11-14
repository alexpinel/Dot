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


const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const $ = require('jquery'); // Make sure to import jQuery
const defaultDirectory = './src/mystuff';

$(document).ready(() => {
  const $fileTree = $('#fileTree');

  function truncateText(text, maxLength) {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }

  function populateTree(rootPath, parentElement) {
    // Use fs.promises to work with promises for file system operations
    fs.promises.readdir(rootPath)
      .then((files) => {
        const ul = $('<ul>').css('list-style-type', 'none'); // Explicitly set list-style-type to none

        files.forEach((file) => {
          const fullPath = path.join(rootPath, file);
          const li = $('<li>');
          const icon = $('<img>');
          const arrow = $('<img>');
          const textContainer = $('<div>'); // Container for text to be vertically centered

          fs.promises.stat(fullPath)
            .then((stats) => {
              if (stats.isDirectory()) {
                li.addClass('folder');

                // Add folder icon and arrow icon
                icon.attr('src', './Assets/icons/folder LM.png'); // Adjust the path to your folder icon
                icon.addClass('icon');
                arrow.attr('src', './Assets/icons/arrow LM.png'); // Adjust the path to your arrow icon
                arrow.addClass('arrow-icon');
                textContainer.text(truncateText(file, 15)); // Adjust the maximum length as needed
                textContainer.addClass('text-container');

                li.append(arrow, icon, textContainer);

                arrow.click(() => {
                  if (li.children('ul').length === 0) {
                    populateTree(fullPath, li);
                  }
                  li.children('ul').slideToggle();
                  arrow.toggleClass('rotate'); // Toggle the rotate class
                });
              } else if (stats.isFile()) {
                li.addClass('file');

                // Add document icon
                icon.attr('src', './Assets/icons/document1 LM.png'); // Adjust the path to your document icon
                icon.addClass('icon');
                textContainer.text(truncateText(file, 20)); // Adjust the maximum length as needed
                textContainer.addClass('text-container');

                li.append(icon, textContainer);
              }

              ul.append(li);
            })
            .catch((err) => {
              console.error(err);
            });
        });

        parentElement.append(ul);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  // Initial call to populate the tree with the root directory




  // Wrap the main logic in an async function for cleaner error handling
  async function initialize() {
    try {
      // Clear the existing tree and populate with the default directory
      $fileTree.empty();
      await populateTree(defaultDirectory, $fileTree);
    } catch (err) {
      console.error(err);
    }
  }

  initialize();

  const { ipcRenderer } = require('electron');

  function selectDirectory() {
    ipcRenderer.invoke('open-dialog')
      .then((result) => {
        if (!result.canceled && result.filePaths.length > 0) {
          const selectedDirectory = result.filePaths[0];
          $fileTree.empty();
          populateTree(selectedDirectory, $fileTree);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
  
  $('#selectDirectoryButton').click(selectDirectory);
});

ipcRenderer.on('update-background', (event, imagePath) => {
  const backgroundOverlay = document.getElementById('backgroundOverlay');
  backgroundOverlay.style.backgroundImage = `url(${imagePath.replace(/\\/g, '/')})`;
});

function toggleGalleryView(isGalleryView) {
  ipcRenderer.invoke('toggle-gallery-view', isGalleryView).then(() => {
    console.log('Gallery view toggled:', isGalleryView);
  }).catch((err) => {
    console.error(err);
  });
}

document.getElementById('galleryToggle').addEventListener('change', function () {
  toggleGalleryView(this.checked);
});