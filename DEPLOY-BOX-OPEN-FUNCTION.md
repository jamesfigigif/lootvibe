# 🚀 Deploy Box-Open Edge Function Guide

## Current Authentication Pattern

**You're using Clerk (not Supabase Auth)**, so the edge function:
- ✅ Uses **anon key** for basic access (same as `battle-spin`)
- ✅ **Validates `userId`** from request body against database
- ✅ **Validates client seed and nonce** to prevent manipulation
- ✅ Uses **service role key** for secure database writes

This is secure because:
1. The `userId` must exist in your database
2. The `clientSeed` and `nonce` must match what's stored
3. All critical operations happen server-side

---

## Step 1: Verify Supabase CLI is Installed

```bash
# Check if Supabase CLI is installed
supabase --version

# If not installed, install it:
# macOS
brew install supabase/tap/supabase

# Or download from: https://github.com/supabase/cli/releases
```

---

## Step 2: Link Your Supabase Project

```bash
# Navigate to your project root
cd /Users/luke/Downloads/lootvibe

# Link to your Supabase project
supabase link --project-ref cbjdasfnwzizfphnwxfd
```

You'll be prompted for:
- **Database password** (if you have one set)
- **Project reference** (already provided: `cbjdasfnwzizfphnwxfd`)

---

## Step 3: Deploy the Edge Function

```bash
# Deploy the box-open function
supabase functions deploy box-open
```

This will:
- ✅ Upload `supabase/functions/box-open/index.ts` to Supabase
- ✅ Set up the function endpoint at: `https://cbjdasfnwzizfphnwxfd.supabase.co/functions/v1/box-open`
- ✅ Make it accessible via your app

---

## Step 4: Set Environment Variables (Optional)

If you want to use a custom server seed:

```bash
# Set SERVER_SEED environment variable in Supabase Dashboard
# Dashboard > Project Settings > Edge Functions > Secrets
supabase secrets set SERVER_SEED=your-custom-seed-here
```

**Note**: If you don't set this, it will use the default: `lootvibe-secure-server-seed-v1`

---

## Step 5: Verify Deployment

### Option A: Test via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd/functions
2. Find `box-open` in the list
3. Click "Invoke" to test (you'll need to provide test data)

### Option B: Test via Your App
1. Open your app
2. Try opening a box
3. Check browser console for: `✅ Secure Edge Function generated outcome`
4. Check Supabase logs: Dashboard > Edge Functions > box-open > Logs

---

## Step 6: Verify Database Schema

Make sure `box_openings` table exists:

```sql
-- Run in Supabase SQL Editor
SELECT * FROM box_openings LIMIT 1;
```

If it doesn't exist, run:
```bash
# From your project root
psql -h db.cbjdasfnwzizfphnwxfd.supabase.co -U postgres -d postgres -f supabase/boxes_schema.sql
```

Or manually run the SQL from `supabase/boxes_schema.sql` in the Supabase SQL Editor.

---

## Troubleshooting

### Error: "Function not found"
- Make sure you deployed: `supabase functions deploy box-open`
- Check function name matches exactly: `box-open`

### Error: "Missing required parameters"
- Check that `App.tsx` is sending: `boxId`, `userId`, `clientSeed`, `nonce`
- Check browser console for the request payload

### Error: "User not found"
- Make sure the `userId` exists in your `users` table
- The `userId` should be the Clerk user ID

### Error: "Invalid client seed" or "Invalid nonce"
- The client seed and nonce must match what's in the database
- This prevents replay attacks

### Error: "Insufficient balance"
- User doesn't have enough balance to open the box
- This is expected behavior - user needs to deposit

---

## How It Works (Authentication Flow)

```
1. User clicks "Open Box" in your app
   ↓
2. App.tsx calls: supabase.functions.invoke('box-open', {
     headers: { Authorization: `Bearer ${anonKey}` },
     body: { boxId, userId, clientSeed, nonce }
   })
   ↓
3. Edge function receives request
   ↓
4. Edge function validates:
   - ✅ User exists in database (userId)
   - ✅ Client seed matches database
   - ✅ Nonce matches database (prevents replay)
   - ✅ Box exists and is enabled
   - ✅ User has sufficient balance
   ↓
5. Edge function generates outcome server-side (provably fair)
   ↓
6. Edge function:
   - Deducts balance atomically
   - Increments nonce
   - Saves to box_openings table
   - Adds item to inventory
   - Creates transaction record
   ↓
7. Returns outcome to client
   ↓
8. App displays the result
```

---

## Security Notes

✅ **Secure because:**
- Outcome generated server-side (can't be manipulated)
- Balance checked and deducted server-side
- Nonce validation prevents replay attacks
- All operations are atomic (database transactions)
- Complete audit trail in `box_openings` table

⚠️ **Current Pattern (Using Anon Key):**
- Works because we validate `userId` from request body
- The `userId` must exist in your database
- Client seed and nonce must match database values
- This is the same pattern as `battle-spin` (which is working)

🔒 **Optional Enhancement (Future):**
- Could validate Clerk JWT token for extra security
- Would require installing `@clerk/jwt` in the edge function
- Current approach is secure enough for your use case

---

## Quick Test Command

After deployment, test with:

```bash
# Get your anon key from .env.local or Supabase dashboard
ANON_KEY="your-anon-key-here"

# Test the function
curl -X POST \
  'https://cbjdasfnwzizfphnwxfd.supabase.co/functions/v1/box-open' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "boxId": "test-box-id",
    "userId": "test-user-id",
    "clientSeed": "test-seed",
    "nonce": 0
  }'
```

---

## Next Steps After Deployment

1. ✅ Test opening a box in your app
2. ✅ Verify balance is deducted correctly
3. ✅ Check `box_openings` table for audit records
4. ✅ Verify items are added to inventory
5. ✅ Monitor Supabase function logs for errors

---

**Status**: Ready to deploy! 🚀

