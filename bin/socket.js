const socketIo = require('socket.io');
const { Advert } = require('../models');

let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      optionsSuccessStatus: 200,
    },
  });

  // Configura Socket.io para escuchar cambios en la base de datos
  io.on('connection', socket => {
    console.log('Cliente conectado');

    // Cuando un cliente se conecta, se une a una sala específica
    socket.join('anuncios');

    // Escucha cambios en el campo "price" de la base de datos y emite notificaciones a la sala
    Advert.watch().on('change', change => {
      if (
        change.operationType === 'insert' &&
        change.updateDescription.updatedFields.hasOwnProperty('price')
      ) {
        // Emitir notificación cuando se actualiza el campo "price" de un anuncio
        io.to('anuncios').emit('priceActualizado', {
          advertId: change.documentKey._id,
        });
        console.log('Precio actualizado:', change.documentKey._id);
      }
    });

    socket.on('joinRoom', roomName => {
      // Unir al cliente a la sala especificada
      socket.join(roomName);
      console.log(`Cliente unido a la sala: ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado');
    });
  });
}

// Exporta tanto la función como el objeto io
module.exports = { initializeSocket };
