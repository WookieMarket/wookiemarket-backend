var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

require('./lib/connectMongoose');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

//NOTE Configure CORS options to allow requests from localhost:3000
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200, // Some older browsers (IE11, various SmartTVs) will interpret 204 as 'no content'
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.locals.title = "Wookie Market";
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

console.log('Ruta de acceso a la imagen:', path.join(__dirname, 'public', 'Death_Star_III.webp'))

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));

/**
 * API routes
 */
//app.post("/api/login", loginControllerApi.authApi);
app.use(
  "/api/auth/signup",
  require("./routes/api/auth/signup"),
  require("./routes/api/auth/login"),
);
app.use("/api/auth/login", require("./routes/api/auth/login"));
app.use("/api/users", require("./routes/api/users"));
app.use("/api/ads/adverts", require("./routes/api/ads/adverts"));

const advertsRouter = require('./routes/api/adverts');
app.use('/adverts', advertsRouter);

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
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);

  // si lo que ha fallado es una petición al API
  // devuelvo el error en formato JSON
  if (req.originalUrl.startsWith("/api/")) {
    res.json({ error: err.message });
    return;
  }

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.render("error");
});

// const port = 3001;
// app.listen(port, () => {
//   console.log(`Servidor backend funcionando en http://localhost:${port}`);
// });

module.exports = app;
