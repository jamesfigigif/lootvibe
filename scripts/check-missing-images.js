const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk0Nzg4MiwiZXhwIjoyMDc5NTIzODgyfQ.hZT3qtv9P45G6XWXRp4ELLXQi5KuaKdpEv_XiY4B5go';
const BUCKET_NAME = 'game-assets';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Directories to check
const ITEMS_WEBP_DIR = path.join(__dirname, '../public/assets/items-webp');
const ITEMS_PNG_DIR = path.join(__dirname, '../public/assets/items');
const ITEMS_COMPRESSED_DIR = path.join(__dirname, '../public/assets/items-compressed');

// Read constants.ts to get all items
const constantsPath = path.join(__dirname, '../constants.ts');
const constantsContent = fs.readFileSync(constantsPath, 'utf8');

// Extract all item IDs and their box associations
function extractItemsFromConstants() {
    const items = [];
    const boxItems = {};
    
    // Extract item definitions (createItem calls)
    const createItemRegex = /createItem\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"][^)]+['"]([^'"]+\.webp)['"]\)/g;
    let match;
    
    while ((match = createItemRegex.exec(constantsContent)) !== null) {
        const itemId = match[1];
        const itemName = match[2];
        const imageUrl = match[3];
        items.push({ id: itemId, name: itemName, imageUrl });
    }
    
    // Extract box definitions and their items
    const boxRegex = /id:\s*['"]([^'"]+)['"][^}]+name:\s*['"]([^'"]+)['"][^}]+items:\s*(\w+_ITEMS)/g;
    while ((match = boxRegex.exec(constantsContent)) !== null) {
        const boxId = match[1];
        const boxName = match[2];
        const itemsVar = match[3];
        
        // Find items for this box by matching the items variable name
        const itemsVarRegex = new RegExp(`const\\s+${itemsVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*LootItem\\[\\]\\s*=\\s*\\[([\\s\\S]*?)\\];`, 'g');
        const itemsMatch = itemsVarRegex.exec(constantsContent);
        
        if (itemsMatch) {
            const itemsContent = itemsMatch[1];
            const itemIdRegex = /createItem\(['"]([^'"]+)['"]/g;
            const boxItemIds = [];
            let itemMatch;
            while ((itemMatch = itemIdRegex.exec(itemsContent)) !== null) {
                boxItemIds.push(itemMatch[1]);
            }
            
            boxItems[boxId] = {
                name: boxName,
                itemIds: boxItemIds
            };
        }
    }
    
    return { items, boxItems };
}

// Check if file exists locally
function checkLocalFiles(itemId) {
    const webpPath = path.join(ITEMS_WEBP_DIR, `${itemId}.webp`);
    const pngPath = path.join(ITEMS_PNG_DIR, `${itemId}.png`);
    const compressedPath = path.join(ITEMS_COMPRESSED_DIR, `${itemId}.png`);
    
    return {
        webp: fs.existsSync(webpPath),
        png: fs.existsSync(pngPath),
        compressed: fs.existsSync(compressedPath)
    };
}

// Check if file exists on Supabase
async function checkSupabase(itemId) {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list('items', {
                search: `${itemId}.webp`
            });
        
        return !error && data && data.length > 0;
    } catch (error) {
        return false;
    }
}

async function run() {
    console.log('🔍 Checking all boxes for missing images...\n');
    
    const { items, boxItems } = extractItemsFromConstants();
    const allItemIds = new Set(items.map(i => i.id));
    
    console.log(`Found ${Object.keys(boxItems).length} boxes`);
    console.log(`Found ${items.length} total items\n`);
    
    const missingByBox = {};
    const missingLocally = {};
    const missingOnSupabase = {};
    
    for (const [boxId, boxData] of Object.entries(boxItems)) {
        const missing = [];
        const localOnly = [];
        const supabaseOnly = [];
        
        for (const itemId of boxData.itemIds) {
            const local = checkLocalFiles(itemId);
            const onSupabase = await checkSupabase(itemId);
            
            if (!local.webp && !local.png && !local.compressed && !onSupabase) {
                // Completely missing
                missing.push(itemId);
            } else if ((local.webp || local.png || local.compressed) && !onSupabase) {
                // Exists locally but not on Supabase
                localOnly.push(itemId);
            } else if (!local.webp && !local.png && !local.compressed && onSupabase) {
                // Only on Supabase (shouldn't happen but checking)
                supabaseOnly.push(itemId);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 50));
        }
        
        if (missing.length > 0 || localOnly.length > 0) {
            missingByBox[boxId] = {
                name: boxData.name,
                missing,
                localOnly,
                total: boxData.itemIds.length
            };
        }
    }
    
    // Print results
    console.log('='.repeat(80));
    console.log('📊 MISSING IMAGES REPORT');
    console.log('='.repeat(80));
    
    let totalMissing = 0;
    let totalLocalOnly = 0;
    
    for (const [boxId, data] of Object.entries(missingByBox)) {
        console.log(`\n📦 ${data.name} (${data.total} items)`);
        
        if (data.missing.length > 0) {
            console.log(`   ❌ Completely missing (${data.missing.length}):`);
            data.missing.forEach(id => {
                const item = items.find(i => i.id === id);
                console.log(`      - ${id}: ${item ? item.name : 'Unknown'}`);
            });
            totalMissing += data.missing.length;
        }
        
        if (data.localOnly.length > 0) {
            console.log(`   ⚠️  Exists locally but NOT on Supabase (${data.localOnly.length}):`);
            data.localOnly.forEach(id => {
                const item = items.find(i => i.id === id);
                const local = checkLocalFiles(id);
                const locations = [];
                if (local.webp) locations.push('items-webp');
                if (local.png) locations.push('items');
                if (local.compressed) locations.push('items-compressed');
                console.log(`      - ${id}: ${item ? item.name : 'Unknown'} (found in: ${locations.join(', ')})`);
            });
            totalLocalOnly += data.localOnly.length;
        }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total boxes checked: ${Object.keys(boxItems).length}`);
    console.log(`Boxes with missing images: ${Object.keys(missingByBox).length}`);
    console.log(`Total items completely missing: ${totalMissing}`);
    console.log(`Total items local-only (need upload): ${totalLocalOnly}`);
    console.log('='.repeat(80));
    
    // Export missing items for generation script
    if (totalMissing > 0 || totalLocalOnly > 0) {
        const missingIds = [];
        const localOnlyIds = [];
        
        for (const data of Object.values(missingByBox)) {
            missingIds.push(...data.missing);
            localOnlyIds.push(...data.localOnly);
        }
        
        console.log('\n💾 Missing item IDs (for generation):');
        console.log(JSON.stringify(missingIds, null, 2));
        
        console.log('\n💾 Local-only item IDs (need upload):');
        console.log(JSON.stringify(localOnlyIds, null, 2));
    }
}

run().catch(console.error);


