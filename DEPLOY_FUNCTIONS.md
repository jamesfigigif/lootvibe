# Deploy Supabase Edge Functions

I've set up everything you need! Now you just need to authenticate and deploy.

## Step 1: Authenticate with Supabase

Run this command in your terminal:

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && npx supabase login
```

This will open your browser to authenticate with Supabase.

## Step 2: Deploy the Functions

After logging in, run these commands:

```bash
# Load nvm and deploy battle-spin
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && npx supabase functions deploy battle-spin --no-verify-jwt

# Deploy battle-claim
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && npx supabase functions deploy battle-claim --no-verify-jwt
```

## Step 3: Set Environment Variables (Optional but Recommended)

Set a secure server seed for the battle-spin function:

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && npx supabase secrets set SERVER_SEED="your-very-secure-random-string-here"
```

## What I've Done

✅ Installed Node.js v25.2.1 and npm v11.6.2 via nvm  
✅ Set up Supabase CLI v2.63.1 via npx  
✅ Created the Edge Functions (`battle-spin` and `battle-claim`)  
✅ Created the SQL schema for `battle_results`  

## Next Steps

Once you've deployed the functions, your battle system will be secure! The client code is already updated to use these functions.
