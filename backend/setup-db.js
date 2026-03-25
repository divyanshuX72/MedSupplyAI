const fs = require('fs');
const path = require('path');
const db = require('./db');

async function setupDatabase() {
    try {
        console.log('📖 Reading schema...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('⚡ Executing schema...');
        await db.query(sql);

        console.log('✅ Database setup complete! "medicines" table created and populated.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database setup failed:', err);
        process.exit(1);
    }
}

setupDatabase();
