const db = require('./db');

(async () => {
    try {
        console.log('--- STARTING DATABASE MIGRATION ---\n');

        // 1. Add 'status' column to users if missing
        try {
            console.log('Checking "users" table for "status" column...');
            await db.query(`SELECT status FROM users LIMIT 1`);
            console.log('✅ "status" column already exists.');
        } catch (e) {
            if (e.code === 'ER_BAD_FIELD_ERROR') {
                console.log('⚠️ "status" column missing. Adding it now...');
                await db.query(`ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'`);
                console.log('✅ "status" column added successfully.');
            } else {
                throw e;
            }
        }

        // 2. Create 'audit_logs' table if missing
        try {
            console.log('\nChecking for "audit_logs" table...');
            await db.query(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    admin_id INT,
                    action VARCHAR(50),
                    target VARCHAR(100),
                    details TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (admin_id) REFERENCES users(id)
                )
            `);
            console.log('✅ "audit_logs" table verified/created.');
        } catch (e) {
            console.error('❌ Failed to create audit_logs:', e);
        }

        console.log('\n--- MIGRATION COMPLETE ---');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Migration Failed:', err);
        process.exit(1);
    }
})();
