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

// mount routers
const userRoute = require('./routes/userRoute');
const messageRoute = require('./routes/messageRoute');
const groupRoute = require('./routes/groupRoute');
app.use('/users', userRoute);
app.use('/messages', messageRoute);
app.use('/groups', groupRoute);

module.exports = app;