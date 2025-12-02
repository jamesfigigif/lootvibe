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

        const schema = fs.readFileSync(path.join(__dirname, '../supabase/admin_schema.sql'), 'utf8');
        await client.query(schema);
        console.log('✅ Admin schema created successfully');

        // Verify tables were created
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('admin_users', 'admin_logs', 'platform_settings')
            ORDER BY table_name;
        `);

        console.log('\n📋 Created tables:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        console.log('\n🔐 Default admin created:');
        console.log('  Email: admin@lootvibe.com');
        console.log('  Password: admin123');
        console.log('  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
