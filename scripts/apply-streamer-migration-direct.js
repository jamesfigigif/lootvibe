const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hpflcuyxmwzrknxjgavd.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZmxjdXl4bXd6cmtueGpnYXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzE1MTM4NywiZXhwIjoyMDQ4NzI3Mzg3fQ.EQo4Q8vTpDz7tTpZQe9BuqD0jXPyQfgL5QjKGMvR3qo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
    try {
        console.log('📝 Reading migration file...');
        const migrationSQL = fs.readFileSync(
            './supabase/migrations/20251205000000_add_streamer_system.sql',
            'utf8'
        );

        console.log('🚀 Applying streamer system migration...');
        console.log('   This will add streamer functionality to your database.\n');

        // Split SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let skipCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Skip comments and DO blocks that are just checks
            if (statement.startsWith('--') || statement.length < 10) {
                continue;
            }

            try {
                process.stdout.write(`   [${i + 1}/${statements.length}] Executing statement... `);

                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: statement + ';'
                });

                if (error) {
                    // Check if it's a "already exists" error - these are safe to skip
                    if (error.message && (
                        error.message.includes('already exists') ||
                        error.message.includes('duplicate')
                    )) {
                        console.log('⏭️  (already exists, skipping)');
                        skipCount++;
                    } else {
                        console.log('❌');
                        console.error('   Error:', error.message);
                        // Continue with other statements
                    }
                } else {
                    console.log('✅');
                    successCount++;
                }
            } catch (err) {
                console.log('❌');
                console.error('   Error:', err.message);
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Success: ${successCount} statements`);
        console.log(`   ⏭️  Skipped: ${skipCount} statements (already exist)`);

        console.log('\n✨ Streamer system features:');
        console.log('   • is_streamer flag - Mark users as streamers');
        console.log('   • can_withdraw permission - Control withdrawal access');
        console.log('   • streamer_odds_multiplier - Boost odds from 1.00x to 10.00x');
        console.log('   • streamer_note - Admin notes for each streamer');
        console.log('   • streamer_activity_log - Full audit trail');
        console.log('   • Admin functions - Secure management functions');

        console.log('\n🎉 Ready to manage streamers from the admin panel!');

    } catch (err) {
        console.error('❌ Fatal error:', err);
        process.exit(1);
    }
}

applyMigration();
