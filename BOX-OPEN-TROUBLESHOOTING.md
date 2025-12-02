# 🔧 Box-Open Function Troubleshooting

## Error: 400 Status Code

The function is running but returning an error. Here's how to debug:

### Step 1: Check Supabase Function Logs

1. Go to: https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd/functions
2. Click on `box-open`
3. Click "Logs" tab
4. Look for error messages (they'll show what's failing)

### Step 2: Common Issues & Fixes

#### Issue 1: `box_openings` table doesn't exist

**Error in logs**: `relation "box_openings" does not exist`

**Fix**: Run the migration:
```sql
-- Go to Supabase SQL Editor and run:
-- Copy contents of supabase/boxes_schema.sql
```

Or via CLI:
```bash
# Make sure you have the SQL file
cat supabase/boxes_schema.sql

# Then run it in Supabase SQL Editor
```

#### Issue 2: `boxes` table doesn't exist

**Error in logs**: `relation "boxes" does not exist`

**Fix**: Same as above - run `supabase/boxes_schema.sql`

#### Issue 3: User not found

**Error in logs**: `User not found: user_xxx`

**Fix**: 
- Make sure the user exists in the `users` table
- The `userId` should be the Clerk user ID
- Check: `SELECT * FROM users WHERE id = 'user_35z1mpMoYq6sc94KHXzcq7X9OSP';`

#### Issue 4: Invalid nonce

**Error in logs**: `Invalid nonce. Expected X, got Y`

**Fix**:
- The nonce in the database must match what's sent
- Check: `SELECT nonce, client_seed FROM users WHERE id = 'user_35z1mpMoYq6sc94KHXzcq7X9OSP';`
- The app should be sending the current nonce from the user object

#### Issue 5: Box not found

**Error in logs**: `Box not found: box_xxx`

**Fix**:
- Make sure the box exists in the `boxes` table
- Check: `SELECT * FROM boxes WHERE id = 'your-box-id';`
- Make sure the box is enabled: `SELECT enabled FROM boxes WHERE id = 'your-box-id';`

#### Issue 6: Missing environment variables

**Error in logs**: `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is undefined

**Fix**:
- These are automatically set by Supabase
- If missing, check your Supabase project settings
- The function should have access to these automatically

### Step 3: Test the Function Manually

You can test the function directly:

```bash
# Get your anon key
ANON_KEY="your-anon-key"

# Test with curl
curl -X POST \
  'https://cbjdasfnwzizfphnwxfd.supabase.co/functions/v1/box-open' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "boxId": "test-box-id",
    "userId": "user_35z1mpMoYq6sc94KHXzcq7X9OSP",
    "clientSeed": "check-database-for-this",
    "nonce": 0
  }'
```

### Step 4: Check Database Schema

Run these queries in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('boxes', 'box_openings', 'users');

-- Check user exists
SELECT id, username, balance, client_seed, nonce 
FROM users 
WHERE id = 'user_35z1mpMoYq6sc94KHXzcq7X9OSP';

-- Check boxes exist
SELECT id, name, enabled, 
       jsonb_array_length(items) as item_count
FROM boxes 
LIMIT 5;
```

### Step 5: Verify Request Data

Add this to your `App.tsx` before calling the function:

```typescript
console.log('📤 Sending to edge function:', {
    boxId: selectedBox.id,
    userId: user.id,
    clientSeed: user.clientSeed,
    nonce: user.nonce
});
```

Make sure:
- ✅ `boxId` matches a box in your database
- ✅ `userId` matches a user in your database
- ✅ `clientSeed` matches `users.client_seed`
- ✅ `nonce` matches `users.nonce`

### Step 6: Check Function Logs for Detailed Errors

The updated function now logs:
- 📥 Request received
- 🔍 User lookup
- 🔍 Box lookup
- ✅ Success messages
- ❌ Error details

Look for these in the Supabase function logs to see exactly where it's failing.

---

## Quick Fix Checklist

- [ ] `box_openings` table exists (run `supabase/boxes_schema.sql`)
- [ ] `boxes` table exists and has data
- [ ] User exists in `users` table
- [ ] User's `client_seed` and `nonce` match what's being sent
- [ ] Box exists and is enabled
- [ ] Function is deployed: `supabase functions deploy box-open`
- [ ] Check Supabase function logs for specific error

---

## Most Likely Issue

Based on the error, the most likely issue is:

**The `box_openings` table doesn't exist yet.**

**Quick Fix:**
1. Go to: https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd/sql/new
2. Copy the contents of `supabase/boxes_schema.sql`
3. Paste and run it
4. Try opening a box again

The function will now log more detailed errors, so check the Supabase function logs to see exactly what's failing!

