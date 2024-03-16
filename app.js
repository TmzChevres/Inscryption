const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

class SessionStore {
    constructor() {
        this.sessions = new Map();
    }

    findSession(id) {
        return this.sessions.get(""+id);
    }

    saveSession(id, session) {
        this.sessions.set(""+id, session);
    }

    findAllSessions() {
        return [...this.sessions.values()];
    }

    updateSessionUsername(id, username){
        this.sessions.get(""+id).username = username;
    }

    removeSession(id){
        return this.sessions.delete(""+id)
    }
}

const port = 5000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessionStore = new SessionStore();

const randomId = () => Math.floor(100000 * Math.random()); //placeholder algorithm

// app.get('/', function (req, res) {
//     res.sendFile(__dirname + '/index.html')
// })

app.use(express.static(__dirname + "/public"));

io.use((socket, next) => {
    // console.log("User Connecting: ");

    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
        // console.log("\tsessionID: "+sessionID)
        // find existing session
        const session = sessionStore.findSession(sessionID);
        if (session) {
            // console.log("\tExisting session found")
            // check if connection is already live or need to reconnect
            for (let [id, socket] of io.of("/").sockets) {
                if(socket.sessionID == session.sessionID){
                    // console.log("\tSession already connected")
                    // console.log("\tConnection failed")
                    return next(new Error("duplicate connection"));
                }
            }
            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.username = session.username;
            return next();
        }
        // console.log("\tSession not found")
    }
    const username = socket.handshake.auth.username;
    if (!username) {
        // console.log("\tInvalid username")
        // console.log("\tConnection failed")
        return next(new Error("invalid username"));
    }
    // create new session
    socket.sessionID = randomId();
    socket.userID = socket.id;
    socket.username = username;
    next();
});

io.on('connection', (socket) => {
    console.log(`${socket.username} connected (${socket.userID}, ${socket.sessionID})`)

    //persist session
    sessionStore.saveSession(socket.sessionID, {
        socketID: socket.id,
        userID: socket.userID,
        username: socket.username,
        sessionID: socket.sessionID
    });
    // console.log(sessionStore.sessions)

    //emit session details
    socket.emit("session", {
        sessionID: socket.sessionID,
        userID: socket.userID,
        username: socket.username
    });

    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        users.push({
            socketId: id,
            userID: socket.userID,
            username: socket.username,
        });
    }
    socket.emit("users", users);


    //listening
    socket.on("update username", ({ sessionID, newUsername }) => {
        console.log(`${newUsername} updated their username (${socket.username} -> ${newUsername})`);
        socket.username = newUsername;
        sessionStore.updateSessionUsername(sessionID, newUsername);
    });

    socket.on("manual disconnect", ( sessionID ) => {
        let session = sessionStore.findSession(sessionID);
        console.log(`${session.username} disconnected (${session.userID}, ${session.sessionID})`)
        sessionStore.removeSession(sessionID)
    });
});

server.listen(port, () => {
    console.log(`Now listening on port ${port}\nPress ^C to stop`);
});

