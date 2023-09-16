const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  userId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  advertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advert',
    index: true,
  },
  message: { type: String, index: true },
  name: { type: String, index: true },
  status: { type: String, index: true },
  coin: { type: String, index: true },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.statics.userNotification = function (id) {
  const notifications = Notifications.find({ userId: id });
  return notifications;
};

const Notifications = mongoose.model('Notifications', notificationSchema);

module.exports = Notifications;
