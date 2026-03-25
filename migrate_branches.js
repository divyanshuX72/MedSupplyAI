const db = require('./backend/db');

async function runMigration() {
    const conn = await db.pool.getConnection();
    try {
        // Disable FK checks for schema operations
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.beginTransaction();
        console.log('🚀 Starting Database Migration (FK Checks Disabled)...');

        // 1. DROP UNUSED TABLES
        const tablesToDrop = [
            'procurement_queue',
            'invoices',
            'invoice_items',
            'procurement_invoices',
            'procurement_invoice_items',
            'purchase_orders',
            'login_logs',
            'medicine_registration_requests'
        ];

        console.log('🗑️ Dropping unused tables...');
        for (const table of tablesToDrop) {
            await conn.query(`DROP TABLE IF EXISTS ${table}`);
            console.log(`   - Dropped ${table}`);
        }

        // 2. CREATE BRANCHES TABLE
        console.log('🏢 Creating branches table...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS branches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                branch_code VARCHAR(50) UNIQUE NOT NULL,
                branch_name VARCHAR(100) NOT NULL,
                address VARCHAR(200),
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. INSERT DEFAULT BRANCH
        console.log('🌱 Inserting default branch...');
        await conn.query(`
            INSERT IGNORE INTO branches (id, branch_code, branch_name) 
            VALUES (1, 'MAIN', 'Main Hospital Branch')
        `);

        // 4. UPDATE MEDICINES TABLE
        console.log('💊 Updating medicines table schema...');

        // Check if branch_id exists
        const [cols] = await conn.query("SHOW COLUMNS FROM medicines LIKE 'branch_id'");
        if (cols.length === 0) {
            await conn.query(`
                ALTER TABLE medicines 
                ADD COLUMN branch_id INT DEFAULT 1,
                ADD FOREIGN KEY (branch_id) REFERENCES branches(id)
            `);
            console.log('   - Added branch_id column');
        }

        // Update existing records to have branch_id = 1 (redundant if DEFAULT 1 used, but safe)
        await conn.query('UPDATE medicines SET branch_id = 1 WHERE branch_id IS NULL');

        // Add constraints
        // Check if unique index exists to avoid error
        const [indexes] = await conn.query("SHOW INDEX FROM medicines WHERE Key_name = 'uq_barcode_branch'");
        if (indexes.length === 0) {
            try {
                // If barcode is not unique globally anymore (might have duplicates if we ran this multiple times?), 
                // we might need to be careful. But for now assuming clean state or single branch data.

                // First, drop the old unique constraint on batch_number if it interferes? 
                // Schema says batch_number is UNIQUE. 
                // We are adding (barcode, branch_id). 

                await conn.query(`
                    ALTER TABLE medicines ADD UNIQUE KEY uq_barcode_branch (barcode, branch_id)
                `);
                console.log('   - Added unique constraint (barcode, branch_id)');
            } catch (e) {
                console.log('   - Note: Could not add unique constraint (might be data duplicates)', e.message);
            }
        } else {
            console.log('   - Unique constraint (barcode, branch_id) already exists');
        }

        await conn.commit();
        console.log('✅ Migration Completed Successfully!');

    } catch (err) {
        await conn.rollback();
        console.error('❌ Migration Failed:', err);
    } finally {
        await conn.query('SET FOREIGN_KEY_CHECKS = 1'); // Re-enable
        conn.release();
        process.exit();
    }
}

runMigration();
