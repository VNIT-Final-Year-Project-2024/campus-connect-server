const WebSocket = require('ws');
const http = require('http');

// Object to store WebSocket connections
const clients = {};

// Function to initialize WebSocket server
const initWebSocketServer = (server) => {
    const wss = new WebSocket.Server({ server, path: '/updates' });

    wss.on('connection', (ws, req) => {
        const groupId = req.url.split('?')[1].split('=')[1];

        ws.groupId = groupId;
        clients[groupId] = clients[groupId] || [];
        clients[groupId].push(ws);

        console.log(`Client connected to group: ${groupId}`);

        ws.on('close', () => {
            clients[groupId] = clients[groupId].filter(client => client !== ws);
            console.log(`Client disconnected from group: ${groupId}`);
        });
    });
};

// Function to run the WebSocket server
const run = (port, callback) => {
    const server = http.createServer();
    initWebSocketServer(server);

    // Start the server and listen on the specified port
    server.listen(port, callback);
};

// Function to send message to all clients in a group
const sendUpdateToGroup = (groupId, message) => {
    if (clients[groupId]) {
        clients[groupId].forEach(ws => {
            ws.send(JSON.stringify({ type: 'message', message }));
        });
    }
    console.log(`Update to ${groupId} sent to all connected clients`);
};

module.exports = { 
    run, 
    sendUpdateToGroup 
};
