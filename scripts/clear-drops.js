const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDrops() {
    const { error } = await supabase.from('live_drops').delete().neq('id', '0');
    if (error) console.error('Error clearing drops:', error);
    else console.log('✅ Cleared all old live drops');
}

clearDrops();
