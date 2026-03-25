const mysql = require('mysql2/promise');

async function createDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
        });

        await connection.query('CREATE DATABASE IF NOT EXISTS medicinesupply_ai');
        console.log('Database medicinesupply_ai created or already exists.');
        await connection.end();
    } catch (err) {
        console.error('Failed to create database:', err);
    }
}

createDatabase();
