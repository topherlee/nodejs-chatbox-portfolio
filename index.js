const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const cors = require('cors');
//const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const Chat = require('./models/Chat');

const uri = "mongodb+srv://topherlee:kulibangunas@cluster0.zpirvch.mongodb.net/ChatApp?retryWrites=true&w=majority";
mongoose.connect(uri);
//const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
/* const newMessage = Chat.create({
    user:"topah",
    message:"123",
    timestamp:new Date()
}); */

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
    console.log('A User Connected');
    socket.broadcast.emit("chat message", "A User Connected", "system");

    socket.on('chat message', function(msg, username){
        console.log(username + ": " + msg);
        const msgToStore = Chat.create({
            user: username,
            message: msg,
            timestamp: new Date()
        });
        socket.broadcast.emit("chat message", msg, username);
    });

    socket.on('typing indicator', function(username, isTyping){
        socket.broadcast.emit("typing indicator", username, isTyping);
    })

    socket.on('disconnect', function() {
        console.log('User Disconnected');
        })
});

server.listen(8080, async function(){
    console.log(`Listening on port: ${server.address().port}`)
    db.on("error", console.error.bind(console, "MongoDB connection error:"));
    /* try {
        await client.connect();
        collection = client.db("chatApp").collection("chats");
    } catch (e) {console.error(e)}; */
});