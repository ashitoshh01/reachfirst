const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
    console.log('Connecting to database...');
    console.log('Host:', process.env.DB_HOST);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            multipleStatements: true
        });

        console.log('Connected! Initializing database...');

        // Read setup file
        const fs = require('fs');
        const path = require('path');
        const sql = fs.readFileSync(path.join(__dirname, 'setup_db.sql'), 'utf8');

        // Execute SQL
        await connection.query(sql);
        console.log('Database initialized successfully! All tables created.');

        await connection.end();
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

initDB();
