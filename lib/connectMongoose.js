const mongoose = require('mongoose');
const { Advert } = require('../models');

mongoose.set('strictQuery', false);

mongoose.connection.on('error', err => {
  console.log('connection error', err);
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB in', mongoose.connection.name);
});

mongoose.connect(process.env.MONGODB_CONNECTION_STR);

// Configura la emisión de eventos de cambio
const changeStream = Advert.watch();

changeStream.on('change', change => {
  console.log('Cambio detectado:', change);
  // Aquí puedes manejar el cambio como desees
});

module.exports = mongoose.connection;
