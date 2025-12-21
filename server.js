const express = require('express');
const WebSocket = require('ws');

const app = express();
// This line tells Express to serve static files (files that don’t change on the server) from a folder named public.
// Makes the public folder accessible to the browser 
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', (ws) => {
    clients.push(ws);
    console.log('New client connected');
    // When a message is received from a client
    ws.on('message', (message) =>{
        // Broadcast the message to all other clients
        clients.forEach(client => {
            if(client !== ws && client.readyState === WebSocket.OPEN){
                client.send(message);
            }
        });
    });
    // When a client disconnects
    ws.on('close', () => {
        clients = clients.filter((client) => client !== ws);
    });
});