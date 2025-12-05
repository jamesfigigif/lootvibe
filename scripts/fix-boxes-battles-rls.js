const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
    connectionString: 'postgresql://postgres.hpflcuyxmwzrknxjgavd:Fuckgambling123!@aws-1-ca-central-1.pooler.supabase.com:6543/postgres'
});

(async () => {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        const sql = fs.readFileSync('./fix_boxes_battles_rls.sql', 'utf8');
        await client.query(sql);

        console.log('✅ Boxes and Battles RLS policies fixed successfully');
        console.log('   - boxes: Public read + service role full access');
        console.log('   - battles: Public read + service role full access');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await client.end();
    }
})();
