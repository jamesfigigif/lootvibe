const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Fuckgambling123@db.cbjdasfnwzizfphnwxfd.supabase.co:5432/postgres'
});

const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        await client.connect();
        console.log('✅ Connected to Supabase');

        const schema = fs.readFileSync(path.join(__dirname, '../supabase/crypto_schema.sql'), 'utf8');
        await client.query(schema);
        console.log('✅ Crypto schema created successfully');

        // Verify tables were created
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('crypto_addresses', 'crypto_deposits')
            ORDER BY table_name;
        `);

        console.log('\n📋 Created tables:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
