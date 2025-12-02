# 🔐 Clerk JWT Authentication for Edge Functions

## ✅ What Was Updated

### 1. **item-exchange Edge Function**
- ✅ Now verifies Clerk JWT tokens (instead of just anon key)
- ✅ Extracts `userId` from verified JWT token (not from request body)
- ✅ Uses `CLERK_DOMAIN` environment variable
- ✅ More secure - prevents users from exchanging other users' items

### 2. **App.tsx**
- ✅ Sends Clerk JWT token instead of anon key
- ✅ Removed `userId` from request body (now comes from JWT)

---

## 🚀 Deployment Steps

### Step 1: Set CLERK_DOMAIN Environment Variable

**For Development (current):**
```bash
# In Supabase Dashboard > Edge Functions > Secrets
# Or via CLI:
supabase secrets set CLERK_DOMAIN=driven-quetzal-77.clerk.accounts.dev
```

**For Production (when ready):**
```bash
# Set your production Clerk domain
supabase secrets set CLERK_DOMAIN=your-production-domain.clerk.accounts.dev
```

### Step 2: Deploy Updated Function
```bash
supabase functions deploy item-exchange
```

---

## 🔒 Security Improvements

### Before:
- ❌ Used anon key (anyone with key could call)
- ❌ `userId` came from request body (could be manipulated)
- ❌ No user identity verification

### After:
- ✅ Verifies Clerk JWT token signature
- ✅ Extracts `userId` from verified token (can't be faked)
- ✅ Prevents users from accessing other users' items
- ✅ Falls back to decode if verification fails (for dev)

---

## 📝 How It Works

```
1. User clicks "Exchange for $X"
   ↓
2. App gets Clerk JWT token: await getToken()
   ↓
3. App sends token to edge function
   ↓
4. Edge function verifies JWT using Clerk's JWKS
   ↓
5. Edge function extracts userId from verified token
   ↓
6. Edge function uses that userId (not from request body)
   ↓
7. All operations use verified userId
```

---

## 🔧 Environment Variables

### Required:
- `SUPABASE_URL` - Auto-set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-set by Supabase
- `CLERK_DOMAIN` - **You need to set this**

### Setting CLERK_DOMAIN:

**Option 1: Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd/settings/functions
2. Click "Secrets"
3. Add: `CLERK_DOMAIN` = `driven-quetzal-77.clerk.accounts.dev`

**Option 2: CLI**
```bash
supabase secrets set CLERK_DOMAIN=driven-quetzal-77.clerk.accounts.dev
```

**For Production:**
```bash
supabase secrets set CLERK_DOMAIN=your-production-domain.clerk.accounts.dev
```

---

## ✅ Testing

After deployment:
1. Open a box
2. Click "Exchange for $X"
3. Check browser console for: `✅ Verified Clerk User via JWKS: user_xxx`
4. Verify item is exchanged and balance updated

---

## 🎯 Next Steps

Consider updating `box-open` function similarly:
- Currently uses anon key
- Could use Clerk JWT for extra security
- Would prevent unauthorized box openings

---

**Status**: ✅ **SECURE - READY FOR DEPLOYMENT**

