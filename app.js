var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var path = require('path');
var logger = require('morgan');

const app = express();

// enable CORS for all routes
app.use(cors());

// set up middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// mount user router
const userRoute = require('./routes/userRoute');
app.use('/users', userRoute);

module.exports = app;