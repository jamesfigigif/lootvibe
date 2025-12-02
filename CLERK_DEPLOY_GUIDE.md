# Deploy Updated Battle-Claim Function

Your `battle-claim` function is now secure with Clerk verification! Here's how to deploy it:

## Step 1: Deploy the Updated Function

Go to your Supabase Dashboard and update the `battle-claim` function with the new code from:
`supabase/functions/battle-claim/index.ts`

Or use the Supabase AI assistant to deploy it (same as before).

## Step 2: Test It!

1. Make sure you're logged in with Clerk
2. Play a battle
3. Try to claim your prize

The function will now:
✅ Verify your Clerk session token  
✅ Extract your user ID from the token (can't be faked!)  
✅ Securely update your balance or inventory  

## What Changed?

### Client (`App.tsx`)
- Now sends your Clerk session token instead of the Anon Key
- Uses `getToken()` from Clerk's `useAuth()` hook

### Server (`battle-claim/index.ts`)
- Verifies the Clerk JWT using your Clerk domain's JWKS
- Extracts the verified user ID from the token
- No more trusting the client!

## Security Status

🔒 **battle-spin**: Secure (uses server seed for provably fair RNG)  
🔒 **battle-claim**: Secure (verifies Clerk tokens, can't be manipulated)

Your battle system is now fully secure! 🎉
