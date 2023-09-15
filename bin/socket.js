const socketIo = require('socket.io');
const { Advert } = require('../models');
const app = require('../app');

function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      optionsSuccessStatus: 200,
    },
  });
  console.log('cors', process.env.CORS_ORIGIN);
  app.set('io', io); // Pasar 'io' como parámetro

  // Configura Socket.io para escuchar cambios en la base de datos
  io.on('connection', socket => {
    console.log('Cliente conectado', socket.id);

    // Emitir un mensaje desde el servidor al cliente
    socket.emit('mensajeDesdeServidor', '¡Hola desde el servidor!');

    // Cuando un cliente se conecta, se une a una sala específica
    //socket.join('anuncios');

    socket.on('joinRoom', roomName => {
      // Unir al cliente a la sala especificada
      socket.join(roomName);
      console.log(`Cliente unido a la sala: ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado', socket.id);
    });
  });
}

// Exporta tanto la función como el objeto io
module.exports = { initializeSocket };
