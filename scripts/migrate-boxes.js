const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    console.log('🔄 Starting boxes schema migration...\n');

    // Initialize Supabase client
    const supabase = createClient(
        'https://cbjdasfnwzizfphnwxfd.supabase.co',
        process.env.VITE_SUPABASE_ANON_KEY || ''
    );

    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, '../../supabase/boxes_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Read boxes_schema.sql');
        console.log('📊 Executing SQL commands...\n');

        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let errorCount = 0;

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';

            // Skip pure comment lines
            if (statement.trim().startsWith('--')) continue;

            try {
                const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

                if (error) {
                    // Try direct execution for DDL statements
                    console.log(`⚠️  RPC method not available, using direct execution...`);

                    // For tables, indexes, functions, and triggers, we'll use a workaround
                    // by calling Supabase's REST API directly
                    const result = await fetch(`https://cbjdasfnwzizfphnwxfd.supabase.co/rest/v1/rpc/exec_sql`, {
                        method: 'POST',
                        headers: {
                            'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
                            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ sql_query: statement })
                    });

                    if (!result.ok) {
                        throw new Error(`HTTP ${result.status}: ${await result.text()}`);
                    }
                }

                successCount++;
                console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
            } catch (err) {
                errorCount++;
                console.error(`❌ Error in statement ${i + 1}:`, err.message);
                console.error(`Statement: ${statement.substring(0, 100)}...`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log('='.repeat(50) + '\n');

        if (errorCount === 0) {
            console.log('🎉 Migration completed successfully!');
            console.log('\n📋 Created tables:');
            console.log('  - boxes (loot box configurations)');
            console.log('  - box_openings (opening history & analytics)');
            console.log('\n🔍 Created indexes for performance');
            console.log('⚡ Created triggers for automatic timestamps');
            console.log('\n✨ Your box management system is ready to use!');
        } else {
            console.log('⚠️  Migration completed with some errors.');
            console.log('   Please check the errors above and run manually if needed.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
runMigration();
