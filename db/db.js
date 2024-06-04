const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Dregonl1',
    port: '3306',
    database: 'presglobal'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        throw err;
    }
    console.log('Connected to database');
});

module.exports = db;
