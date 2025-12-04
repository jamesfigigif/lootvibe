const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.hpflcuyxmwzrknxjgavd:Fuckgambling123!@aws-1-ca-central-1.pooler.supabase.com:6543/postgres';

async function fixAdminAccess() {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        console.log('🔧 Fixing admin access to all tables...');
        const sql = fs.readFileSync('./supabase/migrations/20251204000004_fix_admin_access_all_tables.sql', 'utf8');
        await client.query(sql);

        console.log('✅ Admin access fixed!');
        console.log('🎯 Admins can now query shipments, transactions, boxes, etc.');

    } catch (error) {
        console.error('❌ Error fixing admin access:', error);
        throw error;
    } finally {
        await client.end();
    }
}

fixAdminAccess();
