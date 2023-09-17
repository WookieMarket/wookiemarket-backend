const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
  messageSent: { type: String, index: true },
  messageReceived: { type: String, index: true },
});

const Chat = mongoose.model('Notifications', chatSchema);

module.exports = Chat;
