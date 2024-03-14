const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const port = 5000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
})

io.on('connection', (socket) => {
    //user connects
    console.log('a user connected');

    //user disconnects event
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
});

server.listen(port, () => {
    console.log(`Now listening on port ${port}\nPress ^C to stop`);
}); 