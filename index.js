require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const cors = require('cors');
const jsdom = require('jsdom');
const dom = new jsdom.JSDOM("");
const jquery = require('jquery')(dom.window);
const mongoose = require('mongoose');
const Chat = require('./models/Chat');
const { auth, requiresAuth } = require('express-openid-connect');

//Auth0 configuration for login and signup authorizations
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.auth0ClientSecret,
    baseURL: 'https://mixermarble-storechariot-8080.codio-box.uk',
    clientID: process.env.auth0ClientId,
    issuerBaseURL: 'https://christopher-lee.eu.auth0.com',
};

//MongoDB connection
const uri = 'mongodb+srv://topherlee:' + process.env.MONGO_PASSWORD + '@cluster0.zpirvch.mongodb.net/ChatApp?retryWrites=true&w=majority';
mongoose.connect(uri);
const db = mongoose.connection;

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static(__dirname + '/views'));
app.use(auth(config));

app.get('/', (req, res) => {
    res.render('index.ejs', {
        user: req.oidc.user,        //retrieve logged in user's username
    });
});

app.get('/chat', requiresAuth(), (req, res) => {
    res.render('chat.ejs', {
        user: req.oidc.user,
    });
});

app.get('/about', (req, res) => {
    res.render('about.ejs', {
        user: req.oidc.user,
    });
});

const activeUsers = new Set();
io.on('connection', function(socket) {
    //retrieve 200 of the newest chat messages to be displayed upon connecting to chat server
    Chat.find().then(function(result){
        var i = 0;
        for (var msg of result){
            i++
            if (i <= 200) {
                socket.emit('output history', msg["message"], msg["user"], msg["timestamp"]);
            }
        }
    });

    //keeps a set of active logged in users in the chat
    socket.on("new user", function(username){
        activeUsers.add(username);
        socket.username = username;
        //send users list to front end client
        io.emit("active users", [...activeUsers]);
    });

    //notifies everyone when a new user connects to the chat server
    socket.on('connected', function(msg, username, timestamp){
        console.log(`${username} Connected`)
        io.emit("connected", msg, username, timestamp);
    });

    //broadcasts chat messages to other sockets
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

    //broadcast typing indicator 
    socket.on('typing indicator', function(username, isTyping){
        socket.broadcast.emit("typing indicator", username, isTyping);
    });

    //notifies everyone when a user disconnects from the chat server
    socket.on('disconnect', function() {
        activeUsers.delete(socket.username);
        console.log(`${socket.username} Disconnected`);
        io.emit("active users", [...activeUsers]);
        io.emit("connected", `${socket.username} has disconnected from the chat`, socket.username);
    });
});

server.listen(8080, async function(){
    console.log(`Listening on port: ${server.address().port}`)
    db.on("error", console.error.bind(console, "MongoDB connection error:"));
});