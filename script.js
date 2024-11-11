const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (e.g., your HTML, JS, CSS)
app.use(express.static('public'));

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listening for messages from the client
    socket.on('message', (msg) => {
        console.log('Message from user:', msg);
        
        // Respond to the user (echo back the message)
        socket.emit('response', `Echo: ${msg}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Set the port and start the server
const port = 3000;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
