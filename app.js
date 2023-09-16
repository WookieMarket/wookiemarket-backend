const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const socketIo = require('socket.io');

require('./lib/connectMongoose');

const indexRouter = require('./routes/index');
const app = express();
const cors = require('cors');

//Configure Socket.io to manejar conexiones del socket
const server = http.createServer(app);
const io = socketIo(server);
io.on('connection', socket => {
  console.log('Un cliente se ha conectado');

  // Escucha el evento para crear una sala de chat
  socket.on('createRoom', ({ userId, recipientUsername }) => {
    const roomName = `${userId}-${recipientUsername}`;

    // Une al usuario y al destinatario a la sala
    socket.join(roomName);

    // Notifica a los clientes que la sala se ha creado
    io.to(roomName).emit('roomCreated', roomName);

    // Manejar eventos específicos
  socket.on('chat message', (msg) => {
    console.log(`Mensaje recibido: ${msg}`);
    io.emit('chat message', msg); // Reenviar el mensaje a todos los clientes conectados
  });

  });

  // ... (otros eventos)
});

// Configure CORS options to allow requests from localhost:3000
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200, // Some older browsers (IE11, various SmartTVs) will interpret 204 as 'no content'
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.locals.title = 'Wookie Market';

app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * API routes
 */
app.use('/api/auth/signup', require('./routes/api/auth/signup'));
app.use('/api/auth/login', require('./routes/api/auth/login'));
app.use('/api/users', require('./routes/api/users/users'));
app.use('/api/ads/adverts', require('./routes/api/ads/adverts'));
app.use('/api/chat', require('./routes/api/chat/chat'));  

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // comprobar si es un error de validación
  if (err.array) {
    // const errorInfo = err.array({ onlyFirstError: true })[0];
    const errorInfo = err.errors[0];
    err.message = `Error en ${errorInfo.location}, parámetro ${errorInfo.param} ${errorInfo.msg}`;
    err.status = 422;
  }

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);

  // si lo que ha fallado es una petición al API
  // devuelvo el error en formato JSON
  if (req.originalUrl.startsWith('/api/')) {
    res.json({ error: err.message });
    return;
  }

  // render the error page
  res.render('error');
});

module.exports = app;
