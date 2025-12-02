const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function createAdminUser() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const email = 'admin@lootvibe.com';
    const password = 'admin123';

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    console.log('Creating admin user...');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Hash:', passwordHash);

    // Try to insert
    const { data, error } = await supabase
        .from('admin_users')
        .upsert({
            id: 'admin_default',
            email: email,
            password_hash: passwordHash,
            role: 'SUPER_ADMIN'
        }, {
            onConflict: 'email'
        });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('✅ Admin user created/updated successfully!');
        console.log('\nLogin credentials:');
        console.log('Email: admin@lootvibe.com');
        console.log('Password: admin123');
    }
}

createAdminUser();
