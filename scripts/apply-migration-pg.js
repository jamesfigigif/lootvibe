const { Client } = require('pg');
const fs = require('fs');

// Use connection pooler for better reliability
const connectionString = 'postgresql://postgres.hpflcuyxmwzrknxjgavd:Fuckgambling123!@aws-1-ca-central-1.pooler.supabase.com:6543/postgres';

async function main() {
    const client = new Client({ connectionString });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected!\n');

        // Step 1: Read current schema
        console.log('📊 Reading current schema...\n');

        const columnsQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'users'
            ORDER BY ordinal_position;
        `;

        const columnsResult = await client.query(columnsQuery);
        console.log('Current users table columns:');
        columnsResult.rows.forEach(col => {
            console.log(`  • ${col.column_name} (${col.data_type})`);
        });
        console.log();

        // Check which streamer columns exist
        const existingColumns = columnsResult.rows.map(r => r.column_name);
        const neededColumns = {
            'is_streamer': !existingColumns.includes('is_streamer'),
            'can_withdraw': !existingColumns.includes('can_withdraw'),
            'streamer_odds_multiplier': !existingColumns.includes('streamer_odds_multiplier'),
            'streamer_note': !existingColumns.includes('streamer_note')
        };

        console.log('Columns needed:');
        Object.entries(neededColumns).forEach(([col, needed]) => {
            console.log(`  ${needed ? '❌' : '✅'} ${col}`);
        });
        console.log();

        // Check if activity log table exists
        const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'streamer_activity_log';
        `;

        const tablesResult = await client.query(tablesQuery);
        const activityLogExists = tablesResult.rows.length > 0;
        console.log(`${activityLogExists ? '✅' : '❌'} streamer_activity_log table\n`);

        // Step 2: Apply migration
        console.log('🚀 Applying streamer system migration...\n');

        const migrationSQL = fs.readFileSync(
            './supabase/migrations/20251205000000_add_streamer_system.sql',
            'utf8'
        );

        console.log('   Executing migration SQL...');
        await client.query(migrationSQL);
        console.log('   ✅ Migration executed successfully!\n');

        // Step 3: Verify changes
        console.log('🔍 Verifying changes...\n');

        const verifyColumns = await client.query(columnsQuery);
        const newColumns = verifyColumns.rows.map(r => r.column_name);

        console.log('Verification:');
        console.log(`  ${newColumns.includes('is_streamer') ? '✅' : '❌'} is_streamer`);
        console.log(`  ${newColumns.includes('can_withdraw') ? '✅' : '❌'} can_withdraw`);
        console.log(`  ${newColumns.includes('streamer_odds_multiplier') ? '✅' : '❌'} streamer_odds_multiplier`);
        console.log(`  ${newColumns.includes('streamer_note') ? '✅' : '❌'} streamer_note`);

        const verifyTable = await client.query(tablesQuery);
        console.log(`  ${verifyTable.rows.length > 0 ? '✅' : '❌'} streamer_activity_log table`);

        // Check functions
        const functionsQuery = `
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name IN (
                'set_user_as_streamer',
                'remove_streamer_status',
                'edit_streamer_balance',
                'toggle_user_withdrawal'
            );
        `;

        const functionsResult = await client.query(functionsQuery);
        console.log(`  ${functionsResult.rows.length === 4 ? '✅' : '⚠️'} Management functions (${functionsResult.rows.length}/4)`);

        if (functionsResult.rows.length < 4) {
            console.log('    Found:', functionsResult.rows.map(r => r.routine_name).join(', '));
        }

        console.log('\n🎉 Streamer system migration completed!\n');

        console.log('✨ Features now available:');
        console.log('   • Mark users as streamers from admin panel');
        console.log('   • Set odds multiplier (1.00x - 10.00x)');
        console.log('   • Edit streamer balances easily');
        console.log('   • Control withdrawal permissions');
        console.log('   • Full audit logging of all changes\n');

        console.log('🎯 Ready to use in Admin Panel → Streamers tab');

        await client.end();

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        if (error.detail) {
            console.error('   Detail:', error.detail);
        }
        if (error.hint) {
            console.error('   Hint:', error.hint);
        }
        if (error.position) {
            console.error('   Position:', error.position);
        }

        // Show some context if available
        if (error.message.includes('column') && error.message.includes('already exists')) {
            console.log('\n💡 Some columns already exist - this might be okay.');
            console.log('   The migration checks for existing columns before adding them.');
        }

        await client.end();
        process.exit(1);
    }
}

main();
