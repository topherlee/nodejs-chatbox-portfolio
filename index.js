require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const { auth } = require('express-openid-connect');
const Chat = require('./models/Chat');
const { requiresAuth } = require('express-openid-connect');

//auth0 config
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.auth0ClientSecret,
    baseURL: 'https://mixermarble-storechariot-8080.codio-box.uk',
    clientID: process.env.auth0ClientId,
    issuerBaseURL: 'https://christopher-lee.eu.auth0.com'
};

//MongoDB connection
const uri = "mongodb+srv://topherlee:testing123@cluster0.zpirvch.mongodb.net/ChatApp?retryWrites=true&w=majority";
mongoose.connect(uri);
const db = mongoose.connection;

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static(__dirname + '/views'));
app.use(auth(config));

app.get('/chat', requiresAuth(), (req, res) => {
    res.render('chat.ejs', {
        user: req.oidc.user,
    });
    //res.sendFile(__dirname + '/views/chat.html');
});

app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
    //res.sendFile(__dirname + '/views/index.html');
});

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});


io.on('connection', function(socket) {
    const users = [];

    //retrieve all chats
    Chat.find().then(function(result){
        //console.log(result)
        for (var msg of result){
            //console.log(msg)
            socket.emit('output history', msg["message"], msg["user"], msg["timestamp"]);
        }
    })

    console.log('A User Connected');
    socket.broadcast.emit("chat message", "A User Connected", "system");
 
    socket.on('chat message', function(msg, username, timestamp){
        console.log(`<${timestamp}> ` + username + ": " + msg);
        const msgToStore = Chat.create({
            user: username,
            message: msg,
            timestamp: timestamp
        }).then(() => {
        socket.broadcast.emit("chat message", msg, username, timestamp);
        });
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