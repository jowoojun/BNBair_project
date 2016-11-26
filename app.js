// 익스프레스
var express = require('express');
// 경로설정?
var path = require('path');
// 파비콘
var favicon = require('serve-favicon');
var logger = require('morgan');
// post라우터
var bodyParser = require('body-parser');
// 쿠키
var cookieParser = require('cookie-parser');
// 세션
var session = require('express-session');
var methodOverride = require('method-override');
// 플레시
var flash = require('connect-flash');
// mongodb
var mongoose   = require('mongoose');
// passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// 라우터 나누기
var routes = require('./routes/index');
var users = require('./routes/users');
var rooms = require('./routes/rooms');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
// html예쁘게 출력
if (app.get('env') === 'development') {
  app.locals.pretty = true;
}
app.locals.moment = require('moment');

// 몽고 디비 연결
mongoose.connect('mongodb://airBNB:whdnwnsBNB@ds047305.mlab.com:47305/bnbair');
mongoose.connection.on('error', console.log);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride('_method', {methods: ['POST', 'GET']}));

// 세션 설정
app.use(session({
  secure: true,
  resave: true,
  saveUninitialized: true,
  secret: 'long-long-long-long-secret-string-sadfjkb14346235lknvs8',
  
}));

// flash
app.use(flash());

// passport
app.use(passport.initialize());
app.use(passport.session());

// bower 설정
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(path.join(__dirname, '/bower_components')));

// 세션및 플레시 지역변수 설정
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.flashMessages = req.flash();
  next();
});

// 라우터 경로 설정
app.use('/', routes);
app.use('/users', users);
app.use('/rooms', rooms);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;