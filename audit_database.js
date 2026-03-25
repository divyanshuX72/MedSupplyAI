const db = require('./backend/db');

(async () => {
    try {
        console.log('='.repeat(80));
        console.log('DATABASE AUDIT REPORT');
        console.log('='.repeat(80));

        // Get all tables
        const [tables] = await db.pool.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        console.log(`\nTotal Tables: ${tableNames.length}\n`);

        // Check each table
        for (const tableName of tableNames) {
            const [count] = await db.pool.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            const [desc] = await db.pool.query(`DESC \`${tableName}\``);

            console.log(`\n${'='.repeat(80)}`);
            console.log(`TABLE: ${tableName}`);
            console.log(`Records: ${count[0].count}`);
            console.log(`Columns: ${desc.length}`);

            // Check for branch-related columns
            const branchCols = desc.filter(col =>
                col.Field.toLowerCase().includes('branch')
            );
            if (branchCols.length > 0) {
                console.log(`⚠️  BRANCH COLUMNS FOUND:`, branchCols.map(c => c.Field).join(', '));
            }

            // Check for barcode columns
            const barcodeCols = desc.filter(col =>
                col.Field.toLowerCase().includes('barcode')
            );
            if (barcodeCols.length > 0) {
                console.log(`📊 BARCODE COLUMNS:`, barcodeCols.map(c => c.Field).join(', '));
            }
        }

        console.log(`\n${'='.repeat(80)}`);
        console.log('BARCODE LOOKUP ANALYSIS');
        console.log('='.repeat(80));

        // Check medicines table structure
        const [medicinesDesc] = await db.pool.query('DESC medicines');
        console.log('\nMEDICINES TABLE STRUCTURE:');
        console.table(medicinesDesc);

        // Check for duplicate/unused tables
        console.log(`\n${'='.repeat(80)}`);
        console.log('TABLE USAGE ANALYSIS');
        console.log('='.repeat(80));

        const emptyTables = [];
        const usedTables = [];

        for (const tableName of tableNames) {
            const [count] = await db.pool.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            if (count[0].count === 0) {
                emptyTables.push(tableName);
            } else {
                usedTables.push({ table: tableName, records: count[0].count });
            }
        }

        console.log('\n✅ TABLES WITH DATA:');
        usedTables.forEach(t => console.log(`  - ${t.table}: ${t.records} records`));

        console.log('\n❌ EMPTY TABLES (Candidates for deletion):');
        emptyTables.forEach(t => console.log(`  - ${t}`));

        await db.pool.end();

    } catch (err) {
        console.error('Audit failed:', err);
        process.exit(1);
    }
})();
