# 🗄️ Database Migration Instructions

## Boxes Schema Migration (Required for Phase 3)

### Quick Start

Run this command to see instructions:
```bash
cd /Users/luke/Downloads/lootvibe
node backend/scripts/apply-boxes-migration.js
```

### Manual Steps

1. **Go to Supabase SQL Editor**
   - URL: https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd/sql/new

2. **Copy the SQL**
   - File location: `/Users/luke/Downloads/lootvibe/supabase/boxes_schema.sql`
   - Or use the temp file: `backend/scripts/boxes-migration-temp.sql`

3. **Run in SQL Editor**
   - Paste the SQL content
   - Click "Run" or press `Cmd/Ctrl + Enter`

4. **Verify**
   ```sql
   SELECT COUNT(*) FROM boxes;
   SELECT COUNT(*) FROM box_openings;
   ```

### What This Creates

- ✅ `boxes` table - Stores loot box configurations
- ✅ `box_openings` table - Tracks opening history & analytics
- ✅ Performance indexes
- ✅ Auto-update triggers

### After Migration

1. Restart backend server (if running)
2. Login to admin panel: admin@lootvibe.com / admin123
3. Click "Boxes" in sidebar
4. Create your first loot box!

---

## All Schema Files (In Order)

If starting fresh, run these in order:

1. `supabase/schema.sql` - Core tables (users, inventory, transactions, shipments)
2. `supabase/admin_schema.sql` - Admin system (admin_users, admin_logs, platform_settings)
3. `supabase/crypto_schema.sql` - Crypto deposits (crypto_addresses, crypto_deposits)
4. `supabase/boxes_schema.sql` - Box management (boxes, box_openings) **← NEW**

---

## Troubleshooting

**Error: "relation already exists"**
- This is fine! It means the table is already created.

**Error: "permission denied"**
- Make sure you're logged in to the correct Supabase project
- Use the service role key if using CLI

**Error: "foreign key constraint"**
- Make sure core schema (users table) exists first
- Run migrations in order above

---

## Quick Reference

**Your Supabase Project ID:** cbjdasfnwzizfphnwxfd
**Dashboard:** https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd
**SQL Editor:** https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd/sql/new
