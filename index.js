const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static(__dirname + '/views'))
app.get('/chat', (req, res) => {
    //res.render('chat.ejs');
    res.sendFile(__dirname + '/views/chat.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

io.on('connection', function(socket) {
    console.log('a user connected');
    socket.broadcast.emit("chat message", "a user connected", "system");

    socket.on('chat message', function(msg, username){
        console.log(username + ": " + msg);
        socket.broadcast.emit("chat message", msg, username);
    });

    socket.on('typing indicator', function(username, isTyping){
        socket.broadcast.emit("typing indicator", username, isTyping);
    })

    socket.on('disconnect', function() {
        console.log('a user disconnected');
        })
});

server.listen(8080, function() {
    console.log('listening on port 8080');
});