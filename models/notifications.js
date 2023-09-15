const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  userId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  advertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advert',
    index: true,
  },
  message: { type: String, index: true },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
});

const Notifications = mongoose.model('Notifications', notificationSchema);

module.exports = Notifications;
