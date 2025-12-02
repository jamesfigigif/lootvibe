const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://postgres:Fuckgambling123@db.cbjdasfnwzizfphnwxfd.supabase.co:5432/postgres'
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase via Postgres');

    const schemaPath = path.join(__dirname, '../supabase/live_drops_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schema);
    console.log('✅ Live Drops schema created successfully');

    // Verify table creation
    const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'live_drops';
        `);

    if (result.rows.length > 0) {
      console.log('📋 Verified table: live_drops');
    } else {
      console.error('❌ Table live_drops not found after creation');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
