const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection on startup
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully (MySQL)');
        connection.release();
    } catch (err) {
        console.error('Database connection error:', err);
    }
})();

module.exports = {
    // Wrapper to adapt mysql2 results to roughly match pg's output format style if needed,
    // or at least provide a consistent Promise-based API.
    query: async (sql, params) => {
        try {
            const [results, fields] = await pool.execute(sql, params);
            // pg returns object with .rows, so we emulate that for compatibility
            return { rows: results, fields, rowCount: results.length, insertId: results.insertId };
        } catch (error) {
            console.error('Query Error:', error.message);
            throw error;
        }
    },
    pool: pool
};
