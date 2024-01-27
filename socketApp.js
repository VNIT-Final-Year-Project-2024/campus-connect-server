const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

require('dotenv').config();

// object to store Socket.IO connections
const clients = {};

// function to initialize Socket.IO server
const initSocketIOServer = (server) => {
    const io = new Server(server);

    // Socket.IO auth middleware
    io.use((socket, next) => {
        if (socket.handshake.headers && socket.handshake.headers.authorization) {
            // Extract the token from the 'Authorization' header
            const token = socket.handshake.headers.authorization
            jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
                if (err) return next(new Error('Auth token invalid'));
                socket.user = decoded.user;
                next();
            });
        } else {
            next(new Error('Auth token missing'));
        }
    })

    io.on('connection', (socket) => {
        const { groupId } = socket.handshake.query;

        socket.join(groupId);
        clients[groupId] = clients[groupId] || [];
        clients[groupId].push(socket);

        console.log(`User: ${socket.user.name} connected to group: ${groupId}`);

        socket.on('disconnect', () => {
            clients[groupId] = clients[groupId].filter(client => client !== socket);
            console.log(`User: ${socket.user.name} disconnected from group: ${groupId}`);
        });
    });
};

// function to run the Socket.IO server
const run = (port, callback) => {
    const server = http.createServer();
    initSocketIOServer(server);

    // Start the server and listen on the specified port
    server.listen(port, callback);
};

// function to send message to all clients in a group
const sendUpdateToGroup = (groupId, message) => {
    if (clients[groupId]) {
        clients[groupId].forEach(socket => {
            socket.emit('message', { type: 'message', message });
        });
    }
    console.log(`Update to ${groupId} sent to all connected clients`);
};

module.exports = {
    run,
    sendUpdateToGroup
};
