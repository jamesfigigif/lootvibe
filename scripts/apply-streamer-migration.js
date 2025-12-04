const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hpflcuyxmwzrknxjgavd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
    try {
        console.log('📝 Reading migration file...');
        const migrationSQL = fs.readFileSync(
            './supabase/migrations/20251205000000_add_streamer_system.sql',
            'utf8'
        );

        console.log('🚀 Applying streamer system migration...');

        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: migrationSQL
        });

        if (error) {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }

        console.log('✅ Streamer system migration applied successfully!');
        console.log('\nNew features added:');
        console.log('  • is_streamer flag');
        console.log('  • can_withdraw permission');
        console.log('  • streamer_odds_multiplier (1.00-10.00x)');
        console.log('  • streamer_note for admin notes');
        console.log('  • streamer_activity_log table');
        console.log('  • Admin functions for streamer management');

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

applyMigration();
