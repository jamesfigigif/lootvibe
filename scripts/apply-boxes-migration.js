#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('📦 BOXES SCHEMA MIGRATION');
console.log('='.repeat(60) + '\n');

console.log('📝 Reading boxes_schema.sql...\n');

const sqlPath = path.join(__dirname, '../../supabase/boxes_schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('✅ SQL file loaded successfully!\n');
console.log('📋 This migration will create:');
console.log('   • boxes table (loot box configurations)');
console.log('   • box_openings table (opening history & analytics)');
console.log('   • Performance indexes');
console.log('   • Auto-update triggers\n');

console.log('🔗 To apply this migration, follow these steps:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd/sql/new');
console.log('2. Copy the SQL below');
console.log('3. Paste it into the SQL Editor');
console.log('4. Click "Run" or press Cmd/Ctrl + Enter\n');

console.log('─'.repeat(60));
console.log('📄 SQL TO COPY:');
console.log('─'.repeat(60) + '\n');

console.log(sql);

console.log('\n' + '─'.repeat(60));
console.log('💡 Or save to a file:');
console.log('─'.repeat(60) + '\n');

// Also save to a temporary file for easy copying
const tempFile = path.join(__dirname, 'boxes-migration-temp.sql');
fs.writeFileSync(tempFile, sql);

console.log(`✅ SQL saved to: ${tempFile}`);
console.log('   You can copy this file content and paste it into Supabase SQL Editor\n');

console.log('🚀 After running the migration:');
console.log('   • Restart your backend server');
console.log('   • Login to admin panel');
console.log('   • Navigate to "Boxes" section');
console.log('   • Start creating loot boxes!\n');

console.log('='.repeat(60) + '\n');
