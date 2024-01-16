const mongoose = require('mongoose');

require('dotenv').config();

// MongoDB database URI
const dbURI = process.env.MONGO_DB_URI;

mongoose.connect(dbURI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = mongoose;
