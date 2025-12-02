# Production Setup Commands

Quick reference for setting up production Clerk authentication.

## 1. Vercel Environment Variables

Go to Vercel Dashboard → Settings → Environment Variables and add:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsubG9vdHZpYmUuY29tJA
VITE_SUPABASE_URL=https://cbjdasfnwzizfphnwxfd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiamRhc2Zud3ppemZwaG53eGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNTk1NzQsImV4cCI6MjA0NzkzNTU3NH0.9bLYe3Pu2gJGPqNqJYnFdqhLYLZDqLZhqLZhqLZhqLY
VITE_BACKEND_URL=https://lootvibe-backend-12913253d7a4.herokuapp.com
```

Then redeploy from Vercel dashboard.

## 2. Clerk Dashboard Setup

### Get Your PEM Public Key
1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → API Keys
2. Click "Show JWT public key"
3. Copy the PEM format (starts with `-----BEGIN PUBLIC KEY-----`)

### Configure Allowed Origins
Go to API Keys → Allowed origins and add:
- `https://lootvibe.com`
- `https://www.lootvibe.com`
- `https://cbjdasfnwzizfphnwxfd.supabase.co`

### Configure Domains
Go to Configure → Domains:
- Set production domain to your custom domain if using one
- Or note the default Clerk domain (e.g., `clerk.lootvibe.com`)

## 3. Supabase Secrets

Run these commands in your terminal:

```bash
# Set Clerk domain (use the domain from Clerk dashboard)
supabase secrets set CLERK_DOMAIN=clerk.lootvibe.com

# Set PEM public key (replace with your actual key from step 2)
supabase secrets set CLERK_PEM_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
YOUR_ACTUAL_PEM_KEY_HERE
-----END PUBLIC KEY-----"
```

**Important:** The PEM key must:
- Be enclosed in double quotes
- Include the `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----` lines
- Be on multiple lines (paste exactly as shown in Clerk dashboard)

## 4. Deploy Supabase Functions

```bash
# Navigate to project
cd /Users/luke/Downloads/lootvibe

# Deploy all functions
./deploy-functions.sh
```

Or deploy individually:
```bash
supabase functions deploy box-open
supabase functions deploy claim-free-box
supabase functions deploy item-exchange
supabase functions deploy battle-claim
supabase functions deploy battle-spin
supabase functions deploy create-random-battle
```

## 5. Verification

### Test Authentication
```bash
# Visit your site
open https://lootvibe.com

# Check browser console for errors
# Try signing in/up
# Test opening a box
```

### Check Function Logs
```bash
# View logs for specific function
supabase functions logs box-open --tail

# Or check all recent logs
supabase functions logs --tail
```

## Troubleshooting

### If authentication fails:
1. Check Vercel env vars are set correctly
2. Verify Clerk allowed origins include your domain
3. Check browser console for specific errors

### If Edge Functions return 401:
1. Verify `CLERK_DOMAIN` secret matches your Clerk domain
2. Check `CLERK_PEM_PUBLIC_KEY` is set correctly (with quotes and line breaks)
3. View function logs: `supabase functions logs <function-name>`

### If CORS errors:
1. Add your domain to Clerk allowed origins
2. Ensure functions have proper CORS headers (already configured)

## DNS Setup (Porkbun)

If you haven't set up DNS yet:

### For Vercel:
| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 600 |
| CNAME | www | cname.vercel-dns.com | 600 |

### For Clerk Custom Domain (if using):
Follow instructions in Clerk Dashboard → Domains section
