const mysql = require('mysql');

var connection = mysql.createPool({
  host: process.env.CMS_DB_HOST,
  user: process.env.CMS_DB_USER,
  password: process.env.CMS_DB_PASSWORD,
  database: process.env.CMS_DB_DATABASE,
  dateStrings: 'date',
  timeout: 30000,
});

module.exports = connection;
