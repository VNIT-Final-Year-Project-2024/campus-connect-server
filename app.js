var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');

const app = express();

// setting up middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// mount user router
const userRoute = require('./routes/userRoute');
app.use('/users', userRoute);

module.exports = app;