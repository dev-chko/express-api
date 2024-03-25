const mysql = require('mysql');

var connection = mysql.createPool({
  host: process.env.Cloud_DB_HOST,
  user: process.env.Cloud_DB_USER,
  password: process.env.Cloud_DB_PASSWORD,
  database: process.env.Cloud_DB_DATABASE,
  dateStrings: 'date',
  timeout: 30000,
  charset: 'utf8',
});

module.exports = connection;
