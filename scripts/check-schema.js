const { Client } = require('pg');

const connectionString = 'postgresql://postgres.hpflcuyxmwzrknxjgavd:Fuckgambling123!@aws-1-ca-central-1.pooler.supabase.com:6543/postgres';

async function checkSchema() {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check boxes table schema
        const { rows: columns } = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'boxes'
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);

        console.log('\n📦 Boxes table schema:');
        columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });

        // Get sample box
        const { rows: boxes } = await client.query('SELECT * FROM boxes LIMIT 1');
        if (boxes.length > 0) {
            console.log('\n📦 Sample box:');
            console.log(JSON.stringify(boxes[0], null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkSchema();
