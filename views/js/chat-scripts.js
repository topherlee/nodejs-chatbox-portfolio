var socket = io();
var form = document.getElementById("inputForm");
var chatField = document.getElementById("inputMessage");
var username = document.getElementById("username");

var typing = false,
    timeout = undefined;

//use timeout to wait before user actually stops typing
function timeoutFunction(){
    typing = false;
    socket.emit("typing indicator", username.value, false);
};

function typingNow(){
    if (typing == false){
        typing = true;
        socket.emit("typing indicator", username.value, true);
        timeout = setTimeout(timeoutFunction, 5000);
    } else {
        clearTimeout(timeout);
        timeout = setTimeout(timeoutFunction, 5000);
    }
};

chatField.addEventListener("keydown", function(e){
    if (username.value){
        typingNow();
    }
});

chatField.addEventListener("keyup", function(e){
    if (username.value){
        typing = true;
        socket.emit("typing indicator", username.value, true);
        clearTimeout(timeout);
        timeout = setTimeout(timeoutFunction, 2000);
    }
});

//logic for transmitting messages to other sockets and displaying it on sender's client
function sendText(){
    var timeNow = new Date();
    if (chatField.value && username.value) {
        socket.emit("chat message", chatField.value, username.value, timeNow);

        var messageLine = document.createElement("div");
        messageLine.className = "myMessage";
        messageLine.textContent = username.value + ": " + chatField.value;
        chatMessages.appendChild(messageLine);

        var timeIndicator = document.createElement("div");
        timeIndicator.className = "timestamp";
        var newTime = timeNow.toLocaleString("en-GB", { timeZone: 'UTC', hour: 'numeric', minute:'numeric', day:'numeric', month:'short', year:'numeric'});
        timeIndicator.textContent = newTime;
        messageLine.appendChild(timeIndicator);
        
        //const chatContent = document.getElementById("contents");
        contents.scrollTo(0, contents.scrollHeight);
        chatField.value = "";
    } else if (chatField.value && username.value == "") {
        username.style.backgroundColor = "red";
        username.setAttribute("placeholder","Username is required!");
    }
}

form.addEventListener("submit", function(e){
    e.preventDefault();
    sendText();
});

username.addEventListener("input", function(){
    username.style.backgroundColor = "#ffffff";
});

document.getElementById("inputMessage").addEventListener("keypress", function(e){
    if (e.keyCode === 13) {
        e.preventDefault();
        sendText();
    }
});

//sends notification to the backend that user has actually successfully connected to the chat page
if (user) {
    socket.emit("connected", "has connected to the chat", `${user.nickname}`);
    socket.emit("new user", `${user.nickname}`);
}

//logic for showing chat message to the client upon receiving broadcast from backend
socket.on("chat message", function(msg, username, timestamp){
    var messageLine = document.createElement("div");
    messageLine.className = "incomingMessage";
    messageLine.textContent = username + ": " + msg;
    chatMessages.appendChild(messageLine);

    var timeIndicator = document.createElement("div");
    timeIndicator.className = "timestamp";
    const time = new Date(timestamp);
    var newTime = time.toLocaleString("en-GB", { timeZone: 'UTC', hour: 'numeric', minute:'numeric', day:'numeric', month:'short', year:'numeric'});
    timeIndicator.textContent = newTime;
    messageLine.appendChild(timeIndicator);
    contents.scrollTo(0, contents.scrollHeight);
});

//retrieve chat history from backend and show it to the client
socket.on("output history", function(msg, username, timestamp){
    var messageLine = document.createElement("div");
    if (username == "<%= user.nickname %>") {
        messageLine.className = "myMessage";
    } else {
        messageLine.className = "incomingMessage";
    } 
    messageLine.textContent = username + ": " + msg;
    chatMessages.appendChild(messageLine);

    var timeIndicator = document.createElement("div");
    timeIndicator.className = "timestamp";
    const time = new Date(timestamp);
    var newTime = time.toLocaleString("en-GB", { timeZone: 'UTC', hour: 'numeric', minute:'numeric', day:'numeric', month:'short', year:'numeric'});
    timeIndicator.textContent = newTime;
    messageLine.appendChild(timeIndicator);

    contents.scrollTo(0, contents.scrollHeight);
})

//show notification message upon user connection
socket.on("connected", function(msg, username, timestamp){
    var messageLine = document.createElement("div");
    messageLine.className = "incomingMessage"; 
    messageLine.textContent = username + ": " + msg;
    chatMessages.appendChild(messageLine);

    var timeIndicator = document.createElement("div");
    timeIndicator.className = "timestamp";
    timeIndicator.textContent = timestamp;
    messageLine.appendChild(timeIndicator);
    contents.scrollTo(0, contents.scrollHeight);
})

//show a typing indicator when other users are typing
socket.on("typing indicator", function(username, isTyping){
    var typing = document.getElementById("typingIndicator");
    if (isTyping) {
        document.getElementById("typingIndicator").style.display = "block";
        typing.innerHTML = username + " is typing...";
    } else {
        typing.innerHTML = "";
        document.getElementById("typingIndicator").style.display = "none";
    }
});

//shows a list of active users currently connected to the chat server
socket.on("active users", function(users){
    var ul = document.getElementById("memberList");
    while(ul.firstChild) {
        ul.removeChild(ul.firstChild);
    }

    for (const user of users) {
        var li = document.createElement("li");
        li.className = "members";
        li.textContent = user;
        ul.appendChild(li);
    }
});