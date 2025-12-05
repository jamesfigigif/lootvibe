const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
    connectionString: 'postgresql://postgres.hpflcuyxmwzrknxjgavd:Fuckgambling123!@aws-1-ca-central-1.pooler.supabase.com:6543/postgres'
});

(async () => {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        const sql = fs.readFileSync('./fix_affiliate_rls.sql', 'utf8');
        await client.query(sql);

        console.log('✅ Affiliate RLS policies fixed successfully');
        console.log('   - affiliate_codes: Public read access enabled');
        console.log('   - affiliate_referrals: Public insert access enabled');
        console.log('   - affiliate_earnings: User-scoped access enabled');
        console.log('   - affiliate_tiers: Public read access enabled');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await client.end();
    }
})();
