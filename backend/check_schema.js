const db = require('./db');

async function checkSchema() {
    try {
        console.log("Checking 'medicines' table schema...");
        const result = await db.query("SHOW COLUMNS FROM medicines");
        console.log("Columns:", result.rows.map(r => r.Field).join(', '));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSchema();
