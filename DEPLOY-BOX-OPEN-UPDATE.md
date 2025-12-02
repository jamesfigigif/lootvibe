# 🚀 Deploy Updated Box-Open Function

## Critical Changes Made

We made **two critical fixes** to the `box-open` edge function:

1. **Fixed Nonce Issue**: Now properly increments and returns the incremented nonce (fixes "same item every time" bug)
2. **Enhanced Provably Fair**: Server seed hash is now calculated and verified BEFORE generating outcomes

## Quick Deploy (Using Supabase CLI)

```bash
# Navigate to project root
cd /Users/luke/Downloads/lootvibe

# Deploy the updated box-open function
supabase functions deploy box-open
```

That's it! The function will be updated with all the fixes.

## Alternative: Using npx (if Supabase CLI not in PATH)

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && npx supabase functions deploy box-open
```

## Verify Deployment

1. **Test in your app**: Open a box and verify:
   - ✅ Nonce increments properly (no more same item repeats)
   - ✅ Different items on each spin

2. **Check logs**: 
   - Go to Supabase Dashboard > Edge Functions > box-open > Logs
   - Look for: `✅ Secure box opening: User...`

## What Was Fixed

### Issue 1: Nonce Not Incrementing
- **Problem**: Client was overwriting the incremented nonce
- **Fix**: Removed nonce from client-side update, edge function now returns incremented nonce

### Issue 2: Provably Fair Verification
- **Problem**: Server seed hash wasn't verified before outcome generation
- **Fix**: 
  - Calculate server seed hash BEFORE generating outcome
  - Verify it matches user's stored hash
  - Store hash in user profile for verification

## No Database Changes Needed

The existing `users` table already has `server_seed_hash` column, so no schema migration is needed.

## Rollback (if needed)

If something goes wrong, you can view the previous version in Supabase Dashboard under Edge Functions > box-open > Versions.

---

**Status**: Ready to deploy! 🚀

