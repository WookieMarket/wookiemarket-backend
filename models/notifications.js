const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  advert: { type: mongoose.Schema.Types.ObjectId, ref: 'Advert', index: true },
  status: { type: String, index: true },
  price: { type: Number, min: 0.01, max: Infinity, index: true },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.statics.oneNotification = function (id) {
  const notifications = Notifications.findById(id);
  return notifications;
};

const Notifications = mongoose.model('Notifications', notificationSchema);

module.exports = Notifications;
