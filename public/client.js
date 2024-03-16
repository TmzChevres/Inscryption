var socket = io({ autoConnect: false });
usernameAlreadySelected = false;

//pull preexisting sessionID (if it exists)
if(sessionStorage.getItem("sessionID")){
    const sessionID=sessionStorage.getItem("sessionID");
    console.log("Preexisting sessionID: "+sessionID);
    usernameAlreadySelected = true;
    socket.auth = { sessionID };
    socket.connect();
}

var form = document.getElementById('username-form');
var input = document.getElementById('username-input');
//opening screen input
form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value && !usernameAlreadySelected) {
        onUsernameSelection(input.value);
    }
});
//main username display - update username on change
document.getElementById("username").addEventListener('change', (event) =>{
    socket.username = document.getElementById("username").value;
    socket.emit("update username", {
        sessionID: socket.sessionID,
        newUsername: socket.username
    });
    console.log("Username updated")
});
document.getElementById("manual-disconnect").addEventListener('click', (event) => {
    socket.emit("manual disconnect", socket.sessionID);
    sessionStorage.clear();
    location.reload();
});


function onUsernameSelection(username) {
    usernameAlreadySelected = true;
    socket.auth = { username };
    socket.connect();
}

socket.on("connect_error", (err) => {
    console.log(err);
    if (err.message === "invalid username" || err.message === "duplicate connection") {
        usernameAlreadySelected = false;
        document.getElementById('username-screen').style.display = "block";
    }
});

socket.on("users", (users) => {
    console.log(users);
});

//recieve sessionID and userID after connection
socket.on("session", ({ sessionID, userID, username }) => {
    // attach the session ID to the next reconnection attempts
    socket.auth = { sessionID };
    // store it in the localStorage
    sessionStorage.setItem("sessionID", sessionID);
    // save the ID of the user
    socket.userID = userID;
    socket.sessionID = sessionID;
    socket.username = username;

    document.getElementById("username").value = username;
    console.log("userID: "+socket.userID+"\nsessionID: "+socket.auth.sessionID+"\nusername: "+socket.username);
    
    //hide or show elements
    document.getElementById('username-screen').style.display = "none";
    document.getElementById("navbar").style.display = "flex";
    
});