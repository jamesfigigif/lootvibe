# Backend CORS Issue - Deposit Address Generation

## Problem
The Heroku backend at `https://lootvibe-backend-12913253d7a4.herokuapp.com` is not responding with CORS headers, blocking deposit address generation.

## Error
```
Access to fetch at 'https://lootvibe-backend-12913253d7a4.herokuapp.com/api/deposits/generate-address'
from origin 'https://www.lootvibe.com' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Causes
1. **Heroku Free Tier Sleeping**: Backend sleeps after 30min inactivity (~30s wake time)
2. **CORS Configuration**: May not be properly configured for production domain
3. **Backend may need redeployment**

## Solutions

### Immediate Fix (Wake Backend)
1. Visit the backend URL to wake it: `https://lootvibe-backend-12913253d7a4.herokuapp.com`
2. Wait 30 seconds for it to wake up
3. Try generating deposit address again

### Short-term Fix (Check CORS Config)
In your backend `app.js` or `server.js`, ensure CORS allows your production domain:

```javascript
const cors = require('cors');

app.use(cors({
    origin: ['https://www.lootvibe.com', 'https://lootvibe.com', 'http://localhost:5173'],
    credentials: true
}));
```

### Long-term Solutions

**Option A: Keep Heroku Backend**
- Upgrade from free tier to prevent sleeping
- Ensure CORS properly configured
- Add health check endpoint to keep it awake

**Option B: Migrate to Supabase Edge Functions**
- Create edge functions for:
  - `generate-deposit-address`
  - `check-deposit-status`
- Use environment variables for HD wallet seeds
- Benefits: No cold starts, better integration, no extra cost

**Option C: Hybrid Approach**
- Keep backend for complex crypto operations (HD wallets, withdrawals)
- Use Supabase for everything else (already done for most features)
- Deploy backend to a platform that doesn't sleep (Railway, Render, etc.)

## For Testing (Testnet)
If you have `VITE_CRYPTO_TESTNET=true`, you can use testnet faucets:
- **Bitcoin Testnet**: https://testnet-faucet.mempool.co/
- **Ethereum Sepolia**: https://sepoliafaucet.com/

## Current Status
✅ **FULLY RESOLVED!** (Heroku v25 - deployed and running)
✅ Backend now explicitly allows production domains (www.lootvibe.com, lootvibe.com)
✅ CORS preflight requests working correctly
✅ Health endpoint responding: {"status":"ok","monitor":"running"}
✅ All dependencies installed (jsonwebtoken, faker)
✅ All files deployed (ProvablyFairService, streamers route)

## What Was Fixed
1. **CORS Configuration** (`server.js`)
   - Added explicit origins: `www.lootvibe.com`, `lootvibe.com`, localhost
   - Added credentials support for authenticated requests
   - Specified allowed methods (GET, POST, PUT, DELETE, OPTIONS)
   - Added proper CORS headers for preflight requests

2. **Missing Dependencies**
   - Added `jsonwebtoken@^9.0.2` (required by AdminAuthService)
   - Added `faker@^5.5.3` (required by LiveDropService)

3. **Missing Files**
   - Added `services/ProvablyFairService.js` (required by battles)
   - Added `routes/streamers.js` (required by server)
   - Updated ETHWalletService, HotWalletMonitor, types.ts

## Verification
✅ CORS Preflight Test:
```
curl -X OPTIONS https://lootvibe-backend-12913253d7a4.herokuapp.com/api/deposits/generate-address \
  -H "Origin: https://www.lootvibe.com"

Response:
  HTTP/1.1 204 No Content
  Access-Control-Allow-Origin: https://www.lootvibe.com
  Access-Control-Allow-Credentials: true
  Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
  Access-Control-Allow-Headers: Content-Type,Authorization,x-client-info,apikey
```

## Next Steps
1. **Test deposits on production** - Try generating a deposit address at https://www.lootvibe.com
2. **Verify no CORS errors** - Check browser console to confirm smooth operation

## Long-term Recommendations
- Consider upgrading from Heroku free tier to prevent sleeping
- Or migrate to a platform that doesn't sleep (Railway, Render, etc.)
- Or move deposit generation to Supabase Edge Functions
