const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateFreeBoxClaim() {
    console.log('🔄 Adding free_box_claimed column to users table...');

    try {
        // Use Supabase RPC to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS free_box_claimed BOOLEAN DEFAULT FALSE;
                
                UPDATE users 
                SET free_box_claimed = FALSE 
                WHERE free_box_claimed IS NULL;
            `
        });

        if (error) {
            console.error('❌ Migration failed:', error);
            console.log('⚠️  You may need to run this SQL manually in Supabase dashboard:');
            console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS free_box_claimed BOOLEAN DEFAULT FALSE;');
            console.log('UPDATE users SET free_box_claimed = FALSE WHERE free_box_claimed IS NULL;');
            return;
        }

        console.log('✅ Successfully added free_box_claimed column');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('⚠️  You may need to run this SQL manually in Supabase dashboard:');
        console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS free_box_claimed BOOLEAN DEFAULT FALSE;');
        console.log('UPDATE users SET free_box_claimed = FALSE WHERE free_box_claimed IS NULL;');
    }
}

migrateFreeBoxClaim();
