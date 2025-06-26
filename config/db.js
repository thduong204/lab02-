const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'Demo'
});

db.connect(err => {
  if (err) console.error('Failed to connect to DB:', err);
  else console.log('Connected to MySQL database: Demo');
});

module.exports = db;
