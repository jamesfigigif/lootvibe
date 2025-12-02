const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateWithdrawalSystem() {
    console.log('🔄 Setting up withdrawal system...');

    try {
        // Check if platform_settings table exists and has the auto_approve_withdrawals column
        const { data: settings, error: selectError } = await supabase
            .from('platform_settings')
            .select('*')
            .eq('id', 'default')
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            console.log('⚠️  Platform settings table may not exist. Creating default settings...');
        }

        if (!settings) {
            // Insert default platform settings
            const { error: insertError } = await supabase
                .from('platform_settings')
                .insert({
                    id: 'default',
                    auto_approve_withdrawals: false,
                    min_withdrawal_amount: 25.00,
                    max_withdrawal_amount: 10000.00,
                    withdrawal_fee_percentage: 0.00
                });

            if (insertError) {
                console.log('⚠️  Could not insert platform settings:', insertError.message);
                console.log('💡 You may need to run this SQL manually in Supabase dashboard:');
                console.log(`
CREATE TABLE IF NOT EXISTS platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    auto_approve_withdrawals BOOLEAN DEFAULT FALSE,
    min_withdrawal_amount DECIMAL(10, 2) DEFAULT 25.00,
    max_withdrawal_amount DECIMAL(10, 2) DEFAULT 10000.00,
    withdrawal_fee_percentage DECIMAL(5, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT
);

INSERT INTO platform_settings (id, auto_approve_withdrawals, min_withdrawal_amount, max_withdrawal_amount)
VALUES ('default', FALSE, 25.00, 10000.00)
ON CONFLICT (id) DO NOTHING;
                `);
            } else {
                console.log('✅ Platform settings created successfully');
            }
        } else {
            console.log('✅ Platform settings already exist');
        }

        console.log('✅ Withdrawal system setup complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

migrateWithdrawalSystem();
