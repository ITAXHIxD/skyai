const socket = io();

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
}

function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        appendMessage('user', message);
        socket.emit('message', message);
        userInput.value = ''; // Clear input
    }
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

// Listen for bot response
socket.on('response', (response) => {
    appendMessage('bot', response);
});
