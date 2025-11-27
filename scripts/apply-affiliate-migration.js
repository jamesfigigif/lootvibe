const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

async function migrate() {
    console.log('🔌 Connecting to database...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in environment variables');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase
    });

    try {
        await client.connect();
        console.log('✅ Connected!');

        const sqlPath = path.join(__dirname, '../../supabase/affiliate_schema.sql');
        console.log(`📖 Reading SQL from ${sqlPath}...`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Executing migration...');
        await client.query(sql);

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await client.end();
    }
}

migrate();
