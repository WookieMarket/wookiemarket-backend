var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const LoginControllerApi = require('./controllers/loginControllerApi');
const jwtAuthApiMiddlewar = require('./lib/jwtAuthApiMiddleware');
const MongoStore = require('connect-mongo');

require('./lib/connectMongoose');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));

const loginControllerApi = new LoginControllerApi();

/**
 * API routes
 */

app.post('/api/login', loginControllerApi.authApi);
app.use('/api/users', require('./routes/api/users'));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // check if it is a validation error
    if (err.array) {
        const errorInfo = err.errors[0];
        err.message = `Error en ${errorInfo.location}, parámetro ${errorInfo.param} ${errorInfo.msg}`;
        err.status = 422;
    }

    // if what has failed is a request to the API
    // I return the error in JSON format
    if (req.originalUrl.startsWith('/api/')) {
        res.json({ error: err.message });
        return;
    }

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
