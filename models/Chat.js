const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    user: {type: String, required: true},
    message: String,
    timestamp: {type: Date, immutable: true}
});

module.exports = mongoose.model("Chats", chatSchema);