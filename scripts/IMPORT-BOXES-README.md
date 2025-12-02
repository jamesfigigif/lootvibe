# 📦 Import Boxes from constants.ts

This guide explains how to import all boxes from `constants.ts` into your Supabase database.

## 🚀 Quick Start (Recommended)

The easiest way is to use `npx tsx` (no installation needed):

```bash
npx tsx scripts/import-boxes-tsx.js
```

This will:
1. Import all boxes from `constants.ts`
2. Include all items, descriptions, images, etc.
3. Ask if you want to delete existing boxes first

## 📋 Alternative Methods

### Method 1: Two-Step Process (If tsx doesn't work)

```bash
# Step 1: Export boxes to JSON
npx tsx scripts/export-boxes-json.js

# Step 2: Import from JSON
node scripts/import-boxes-from-json.js
```

### Method 2: Install tsx Globally

```bash
# Install tsx
npm install -g tsx

# Run import
tsx scripts/import-boxes-tsx.js
```

### Method 3: Manual Import (Simplified)

```bash
node scripts/import-boxes-manual.js
```

⚠️ **Note:** This only imports basic box info (name, price, category) without items or descriptions. You'll need to edit boxes in the admin panel to add items.

## 🔧 Prerequisites

1. **Environment Variables**: Make sure `.env.local` has:
   ```
   VITE_SUPABASE_ANON_KEY=your_key_here
   ```

2. **Database Schema**: Ensure the `boxes` table exists:
   ```sql
   -- Run this in Supabase SQL Editor if needed
   -- File: supabase/boxes_schema.sql
   ```

## 📊 What Gets Imported

- ✅ Box ID, name, description
- ✅ Price, category, tags
- ✅ Image URLs
- ✅ Color gradients
- ✅ All items with odds, rarities, values
- ✅ Enabled status

## 🛠️ Troubleshooting

### Error: "Cannot import TypeScript file"
- Install tsx: `npm install -g tsx`
- Or use: `npx tsx scripts/import-boxes-tsx.js`

### Error: "boxes table doesn't exist"
- Run the schema migration: `supabase/boxes_schema.sql`
- Or use: `node backend_legacy/scripts/migrate-boxes.js`

### Error: "Invalid token" or "Unauthorized"
- Check your `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Make sure the key has proper permissions

### Error: "enabled column doesn't exist"
- The script automatically handles both `enabled` and `active` fields
- If you see this error, check your database schema

## 📝 Scripts Overview

| Script | Description | Requires |
|--------|-------------|----------|
| `import-boxes-tsx.js` | **Recommended** - Full import with items | tsx (or npx) |
| `export-boxes-json.js` | Export boxes to JSON | tsx (or npx) |
| `import-boxes-from-json.js` | Import from JSON file | Node.js only |
| `import-boxes-manual.js` | Basic import (no items) | Node.js only |

## ✅ After Import

1. Refresh your admin panel
2. Go to Boxes tab
3. You should see all imported boxes
4. Verify items are included by editing a box

## 🎯 Next Steps

After importing:
- Review boxes in admin panel
- Edit any boxes that need adjustments
- Test box opening functionality
- Verify items and odds are correct


