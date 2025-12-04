const { Client } = require('pg');

const connectionString = 'postgresql://postgres.hpflcuyxmwzrknxjgavd:Fuckgambling123!@aws-1-ca-central-1.pooler.supabase.com:6543/postgres';

async function checkBoxes() {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check boxes
        const { rows: boxes } = await client.query('SELECT id, name, image, items FROM boxes LIMIT 3');

        console.log('\n📦 Sample Boxes:');
        boxes.forEach((box, i) => {
            console.log(`\n${i + 1}. ${box.name} (${box.id})`);
            console.log(`   Image: ${box.image || 'NO IMAGE'}`);

            if (box.items) {
                const items = typeof box.items === 'string' ? JSON.parse(box.items) : box.items;
                console.log(`   Items: ${items.length}`);

                if (items.length > 0) {
                    const firstItem = items[0];
                    console.log(`   First item:`);
                    console.log(`     - Name: ${firstItem.name}`);
                    console.log(`     - Value: $${firstItem.value}`);
                    console.log(`     - Odds: ${firstItem.odds}%`);
                    console.log(`     - Image: ${firstItem.image || 'NO IMAGE'}`);
                }
            }
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkBoxes();
