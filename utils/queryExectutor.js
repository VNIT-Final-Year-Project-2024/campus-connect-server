const mysql = require('mysql2');

require('dotenv').config();

// create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.SQL_DB_HOST,
  user: process.env.SQL_DB_USER,
  password: process.env.SQL_DB_PASSWORD,
  database: process.env.STUDENT_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to execute SQL queries
const executeQuery = (query, callback) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting MySQL connection: ', err);
      callback({ error: 'Internal Server Error' });
      return;
    }

    console.log(`Connected to MySQL user DB with con ${connection.threadId}`);

    connection.query(query, (queryError, results) => {
      connection.release();

      if (queryError) {
        console.error('Error executing query: ', queryError);
        callback({ error: 'Internal Server Error' });
        return;
      }

      callback(null, results);
    });
  });
};

module.exports = {
    executeQuery
}