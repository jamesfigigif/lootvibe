# Withdrawal System Deployment Guide

## Overview

This guide covers the deployment of the complete withdrawal system with blockchain integration, automated processing, hot wallet monitoring, withdrawal limits, and email notifications.

## What Was Implemented

### 1. **WithdrawalProcessor Service** (`backend/services/WithdrawalProcessor.js`)
- Automatically processes APPROVED withdrawals every 30 seconds
- Signs and broadcasts Bitcoin transactions using PSBT
- Signs and broadcasts Ethereum transactions using ethers.js
- Updates withdrawal status to COMPLETED with transaction hash
- Automatically refunds users on transaction failures
- Tracks failed attempts with retry logic

### 2. **HotWalletMonitor Service** (`backend/services/HotWalletMonitor.js`)
- Monitors BTC and ETH hot wallet balances every 60 seconds
- Three-tier alert system (CRITICAL, WARNING, INFO)
- Sends alerts via console, Discord webhooks, and database logging
- Historical balance tracking for analytics
- Prevents approvals when hot wallet balance is insufficient

### 3. **WithdrawalLimits Service** (`backend/services/WithdrawalLimits.js`)
- Enforces daily ($10,000) and monthly ($100,000) withdrawal limits
- VIP tier multipliers (Bronze 1.5x, Silver 2x, Gold 3x, Platinum 5x, Diamond 10x)
- Automatic daily and monthly limit resets
- Returns detailed error messages with remaining amounts
- Records all withdrawals against user limits

### 4. **EmailService** (`backend/services/EmailService.js`)
- SendGrid integration for transactional emails
- Professional HTML email templates
- Supports all withdrawal lifecycle events:
  - Withdrawal submitted
  - Withdrawal approved
  - Withdrawal completed (with tx hash and block explorer link)
  - Withdrawal rejected
- Deposit confirmation emails with transaction details

### 5. **Address Validation Middleware** (`backend/middleware/addressValidation.js`)
- Bitcoin address validation (P2PKH, P2SH, Bech32)
- Ethereum address validation with EIP-55 checksum verification
- Prevents fund loss from invalid addresses
- Returns 400 error before processing invalid withdrawals

### 6. **Enhanced Wallet Services**
- **BTCWalletService**: Added `getHotWalletAddress()`, `getHotWalletKeyPair()`, `getUTXOs()`
- **ETHWalletService**: Added `getHotWallet()`, `getProvider()`
- Both use BIP44 derivation: index 0 = hot wallet, indexes 1+ = user deposits

### 7. **Database Migration** (`supabase/migrations/20251203000007_withdrawal_system_enhancements.sql`)
- `withdrawal_limits` table for user limits tracking
- `hot_wallet_balances` table for historical balance tracking
- `hot_wallet_alerts` table for alert logging
- `platform_settings` table for auto-withdrawal configuration
- Enhanced `withdrawals` table with `ip_address` and `actual_fee` columns
- Added `vip_tier` and `email` columns to `users` table
- Helper functions for automatic limit resets
- Row-level security policies for all tables

## Deployment Steps

### Step 1: Apply Database Migration

You need to run the SQL migration to create all the new tables and functions.

**Option A: Using Supabase SQL Editor (Recommended)**
1. Go to https://supabase.com/dashboard/project/hpflcuyxmwzrknxjgavd/sql/new
2. Copy the entire contents of `supabase/migrations/20251203000007_withdrawal_system_enhancements.sql`
3. Paste into the SQL editor
4. Click "Run" to execute

**Option B: Using Supabase CLI (if you fix the connection)**
```bash
cd /Users/luke/Downloads/lootvibe
supabase db push
```

### Step 2: Configure Environment Variables

Add these to your `.env.local` or production environment:

```env
# Bitcoin Wallet (CRITICAL - Keep secret!)
BTC_MASTER_SEED=your_bitcoin_mnemonic_phrase_here

# Ethereum Wallet (CRITICAL - Keep secret!)
ETH_MASTER_SEED=your_ethereum_mnemonic_phrase_here

# Blockchain RPC URLs
INFURA_API_KEY=your_infura_api_key_here
ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY  # or sepolia for testnet

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_ENABLED=true
EMAIL_FROM=noreply@lootvibe.com

# Alert Webhooks (Optional but recommended)
DISCORD_WEBHOOK_URL=your_discord_webhook_url
ALERT_WEBHOOK_URL=your_alert_webhook_url

# Withdrawal Limits (Optional - defaults shown)
DAILY_WITHDRAWAL_LIMIT=10000
MONTHLY_WITHDRAWAL_LIMIT=100000

# Database
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_ANON_KEY=your_anon_key

# Mode
NODE_ENV=production  # or 'development' for testing
```

### Step 3: Install Dependencies

The required npm packages have already been installed:
- `@sendgrid/mail` - Email notifications
- `tiny-secp256k1` - Bitcoin elliptic curve operations
- `bitcoinjs-lib`, `bip32`, `bip39` - Bitcoin wallet operations
- `ethers` - Ethereum operations

If deploying to a new server, run:
```bash
cd backend
npm install
```

### Step 4: Generate or Import Wallet Seeds

**CRITICAL SECURITY WARNING**: These seeds control your crypto funds. Never commit them to git, never share them, and keep secure backups.

**Option A: Generate New Wallets (Testnet)**
1. Start the server once without seeds in .env
2. The system will generate new mnemonics and log them
3. Copy these mnemonics to your .env file
4. NEVER use these for mainnet production

**Option B: Import Existing Wallets (Production)**
1. Use your existing BIP39 mnemonics
2. Add to .env as shown in Step 2
3. Verify derivation paths match:
   - Bitcoin: `m/44'/0'/0'/0/0` (hot wallet)
   - Ethereum: `m/44'/60'/0'/0/0` (hot wallet)

### Step 5: Test in Development Mode

Before going to production, test with testnet:

```bash
cd backend
NODE_ENV=development npm start
```

Test scenarios:
1. Request a small withdrawal
2. Verify address validation rejects invalid addresses
3. Verify withdrawal limits are enforced
4. Check hot wallet monitoring logs
5. Verify withdrawal processor picks up APPROVED withdrawals
6. Check transaction appears on testnet block explorer
7. Verify email notifications are sent (if enabled)

### Step 6: Configure Platform Settings

Set the auto-withdrawal threshold in the database:

```sql
UPDATE platform_settings
SET
  auto_approve_withdrawals = true,
  manual_approval_threshold = 1000.00,  -- Auto-approve under $1000
  min_withdrawal_amount = 25.00,
  max_withdrawal_amount = 100000.00
WHERE id = 'default';
```

Or use the Admin Panel UI (Settings tab).

### Step 7: Fund Hot Wallets

Before enabling withdrawals in production:

1. **Check hot wallet addresses**:
   - Bitcoin: Displayed in server logs on startup
   - Ethereum: Displayed in server logs on startup

2. **Send initial funds**:
   - Recommended: BTC >= 0.5, ETH >= 5.0
   - WARNING thresholds: BTC = 0.1, ETH = 1.0
   - CRITICAL thresholds: BTC = 0.05, ETH = 0.5

3. **Set up alerts**:
   - Configure Discord webhook for low balance notifications
   - Monitor hot wallet balances daily

### Step 8: Deploy Backend

Deploy your backend with the new services running:

```bash
cd backend
npm start
```

Or use your production deployment method (PM2, Docker, etc.):

```bash
# Using PM2
pm2 start npm --name "lootvibe-backend" -- start
pm2 save
pm2 startup

# Or using Docker
docker-compose up -d --build
```

### Step 9: Monitor Services

Check that all services are running:

```bash
# Check logs for service initialization
tail -f backend/logs/app.log

# Look for these startup messages:
# ✅ BTC Wallet initialized
# ✅ ETH Wallet initialized
# ✅ Hot Wallet Monitor started
# ✅ Withdrawal Processor started
# ✅ Email Service initialized
```

### Step 10: Test Production Withdrawal Flow

1. **Request a small test withdrawal** ($25-50)
2. **Check admin panel** - Should appear in withdrawals tab
3. **Approve withdrawal** (if auto-approve is disabled)
4. **Wait 30 seconds** - Withdrawal processor should pick it up
5. **Check transaction on blockchain**:
   - Bitcoin: https://mempool.space/tx/YOUR_TX_HASH
   - Ethereum: https://etherscan.io/tx/YOUR_TX_HASH
6. **Verify email sent** to user with transaction details
7. **Check database** - Status should be COMPLETED with tx_hash

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Request                         │
│                  POST /api/withdrawals/request               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Address Validation Middleware               │
│         ✓ BTC: P2PKH, P2SH, Bech32                           │
│         ✓ ETH: EIP-55 Checksum                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  WithdrawalLimits Service                    │
│         ✓ Check daily/monthly limits                         │
│         ✓ Apply VIP tier multipliers                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 HotWalletMonitor Service                     │
│         ✓ Verify sufficient balance                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Create Withdrawal (PENDING or APPROVED)          │
│         • Deduct user balance                                │
│         • Record against limits                              │
│         • Send "submitted" email                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           WithdrawalProcessor (runs every 30s)               │
│         ✓ Fetch APPROVED withdrawals                         │
│         ✓ Sign transactions (BTC: PSBT, ETH: ethers)         │
│         ✓ Broadcast to blockchain                            │
│         ✓ Update status to COMPLETED                         │
│         ✓ Send "completed" email with tx hash                │
└─────────────────────────────────────────────────────────────┘
```

## Security Best Practices

1. **Hot Wallet Security**:
   - Keep hot wallet balances minimal (only what's needed for daily withdrawals)
   - Store most funds in cold storage
   - Never commit wallet seeds to git
   - Use environment variables or secret management systems
   - Consider using HSM (Hardware Security Module) for production

2. **Rate Limiting**:
   - Add rate limiting to withdrawal endpoints (5 requests/hour per user)
   - Monitor for suspicious withdrawal patterns

3. **Two-Factor Approval**:
   - Consider requiring 2FA for withdrawals over certain thresholds
   - Implement multi-sig for very large withdrawals

4. **Transaction Monitoring**:
   - Monitor all outgoing transactions for anomalies
   - Set up alerts for large withdrawals
   - Keep audit logs of all admin actions

5. **Email Security**:
   - Use SPF, DKIM, and DMARC for email authentication
   - Never include sensitive data in emails
   - Use transaction hashes only, not private keys or seeds

## Monitoring and Alerts

### Hot Wallet Monitoring
The system automatically monitors hot wallet balances and sends alerts:

- **CRITICAL** (BTC < 0.05, ETH < 0.5): Immediate action required
- **WARNING** (BTC < 0.1, ETH < 1.0): Refill soon
- **INFO**: Balance recorded for analytics

### Withdrawal Processing
Monitor these metrics:
- Average processing time (should be ~30 seconds)
- Failed withdrawal rate (should be < 1%)
- Hot wallet refill frequency
- Daily/monthly withdrawal volume

### Email Delivery
Monitor SendGrid dashboard for:
- Email delivery rate (should be > 99%)
- Bounce rate (should be < 1%)
- Spam complaints (should be 0%)

## Troubleshooting

### Withdrawals Stuck in APPROVED Status
- Check withdrawal processor logs: `tail -f backend/logs/withdrawal-processor.log`
- Verify hot wallet has sufficient balance
- Check blockchain RPC connectivity (Infura, mempool.space)
- Verify withdrawal processor service is running

### Transaction Broadcast Failures
- Check RPC endpoint health
- Verify hot wallet has sufficient balance for fees
- Check gas prices (ETH) - may need to increase
- Review transaction construction logs

### Email Not Sending
- Verify SENDGRID_API_KEY is set correctly
- Check SendGrid account is active and verified
- Review email service logs
- Verify EMAIL_ENABLED=true in environment

### Hot Wallet Alerts Not Working
- Check Discord webhook URL is valid
- Verify hot wallet monitor service is running
- Check console logs for balance check errors

## Next Steps

1. **Admin Approval UI**: Add UI buttons to approve/reject withdrawals in admin panel
2. **Item Management**: Wire up add/edit/delete buttons for box items
3. **Transaction History**: Add detailed transaction history page for users
4. **Analytics Dashboard**: Show withdrawal volume, success rates, average processing time
5. **Automatic Hot Wallet Refill**: Implement automatic transfers from cold storage
6. **Multi-Signature**: Add multi-sig for large withdrawals (>$10,000)
7. **KYC Integration**: Add KYC verification for withdrawals over regulatory thresholds

## Support

If you encounter issues:
1. Check the logs in `backend/logs/`
2. Review environment variables in `.env.local`
3. Verify database migration was applied successfully
4. Test with small amounts on testnet first

---

**Generated with Claude Code** 🤖
Last Updated: December 3, 2024
