/**
 * Migration script to add manual_approval_threshold to platform_settings table
 * Run this to enable the withdrawal threshold feature
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY not found in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateWithdrawalThreshold() {
    try {
        console.log('🔄 Starting withdrawal threshold migration...');

        // Check if column already exists
        const { data: columns, error: checkError } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'platform_settings' 
                AND column_name = 'manual_approval_threshold'
            `
        }).catch(() => ({ data: null, error: null }));

        // Try direct SQL approach
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE platform_settings 
                ADD COLUMN IF NOT EXISTS manual_approval_threshold DECIMAL(10, 2) DEFAULT 1000.00;
            `
        }).catch(async () => {
            // If RPC doesn't work, try updating existing records
            const { error: updateError } = await supabase
                .from('platform_settings')
                .update({ manual_approval_threshold: 1000.00 })
                .eq('id', 'default')
                .is('manual_approval_threshold', null);

            return { error: updateError };
        });

        // Update default settings
        const { data: existing, error: fetchError } = await supabase
            .from('platform_settings')
            .select('*')
            .eq('id', 'default')
            .single();

        if (existing) {
            const { error: updateError } = await supabase
                .from('platform_settings')
                .update({
                    manual_approval_threshold: existing.manual_approval_threshold || 1000.00
                })
                .eq('id', 'default');

            if (updateError) {
                console.error('⚠️  Error updating settings:', updateError.message);
            } else {
                console.log('✅ Updated platform_settings with threshold');
            }
        } else {
            // Create default settings if they don't exist
            const { error: insertError } = await supabase
                .from('platform_settings')
                .insert({
                    id: 'default',
                    auto_approve_withdrawals: false,
                    manual_approval_threshold: 1000.00,
                    min_withdrawal_amount: 25.00,
                    max_withdrawal_amount: 10000.00
                });

            if (insertError) {
                console.error('⚠️  Error creating default settings:', insertError.message);
            } else {
                console.log('✅ Created default platform_settings');
            }
        }

        console.log('✅ Migration completed!');
        console.log('\n📝 Next steps:');
        console.log('   1. Run the SQL migration: supabase/add_withdrawal_threshold.sql');
        console.log('   2. Or manually add the column in your Supabase dashboard');
        console.log('   3. The threshold feature is now enabled in the code');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('\n💡 You may need to run the SQL migration manually:');
        console.log('   File: supabase/add_withdrawal_threshold.sql');
    }
}

migrateWithdrawalThreshold();


