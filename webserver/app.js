const express = require('express'),
      path = require('path'),
//      favicon = require('serve-favicon'),
	    logger = require('morgan'),
	    cookieParser = require('cookie-parser'),
	    bodyParser = require('body-parser');

const apiRouter = require('../routes/api/api.js');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /assets
//app.use(favicon(path.join(__dirname, 'assets', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// catch 404 and forward to error handler
//app.use(function(req, res, next) {
//	next();
//});

// error handler
//app.use(function(err, req, res) {
//	// set locals, only providing error in development
//	res.locals.message = err.message;
//	res.locals.error = req.app.get('env') === 'development' ? err : {};/

	// render the error page
//	res.status(err.status || 500);
//	res.render('error');
//});

module.exports = app;
