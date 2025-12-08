const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const BTCWalletService = require('./services/BTCWalletService');
const ETHWalletService = require('./services/ETHWalletService');
const BlockchainMonitor = require('./services/BlockchainMonitor');
const AdminAuthService = require('./services/AdminAuthService');
const LiveDropService = require('./services/LiveDropService');
const WithdrawalProcessor = require('./services/WithdrawalProcessor');
const HotWalletMonitor = require('./services/HotWalletMonitor');
const WithdrawalLimits = require('./services/WithdrawalLimits');
const EmailService = require('./services/EmailService');
const { authenticateAdmin, requirePermission } = require('./middleware/adminAuth');
const { authenticateUser } = require('./middleware/auth');
const { validateWithdrawalAddress } = require('./middleware/addressValidation');
const createAdminRoutes = require('./routes/admin');
const createBoxRoutes = require('./routes/boxes');
const createAffiliateRoutes = require('./routes/affiliates');
const createBattleRoutes = require('./routes/battles');
const createStreamerRoutes = require('./routes/streamers');

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;

// Middleware - Configure CORS to allow production and development origins
app.use((req, res, next) => {
    // Debug log for CORS
    const origin = req.headers.origin;
    if (origin) {
        console.log(`[CORS] Request from origin: ${origin}`);
    }
    next();
});

const allowedOrigins = [
    'https://www.lootvibe.com',
    'https://lootvibe.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.lootvibe.com')) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            // Don't error, just don't return the header (standard security)
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey']
}));

// Enable pre-flight for all routes
app.options(/(.*)/, cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://hpflcuyxmwzrknxjgavd.supabase.co',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Make supabase available to routes
app.use((req, res, next) => {
    req.supabase = supabase;
    next();
});

// Initialize wallet services
const btcWallet = new BTCWalletService();
const ethWallet = new ETHWalletService();

// Initialize blockchain monitor
const monitor = new BlockchainMonitor(supabase);
monitor.start();

// Initialize email service
const emailService = new EmailService({
    provider: 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY,
    enabled: process.env.EMAIL_ENABLED !== 'false',
    testMode: process.env.NODE_ENV === 'development'
});

// Initialize withdrawal limits service
const withdrawalLimits = new WithdrawalLimits(supabase, {
    dailyLimit: parseFloat(process.env.DAILY_WITHDRAWAL_LIMIT) || 10000,
    monthlyLimit: parseFloat(process.env.MONTHLY_WITHDRAWAL_LIMIT) || 100000
});

// Initialize hot wallet monitor
const hotWalletMonitor = new HotWalletMonitor(supabase, btcWallet, ethWallet, {
    checkInterval: 60000, // 1 minute
    btcCritical: 0.05,
    btcWarning: 0.1,
    ethCritical: 0.5,
    ethWarning: 1.0,
    alertWebhookUrl: process.env.ALERT_WEBHOOK_URL,
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL
});
hotWalletMonitor.start();

// Initialize withdrawal processor
const withdrawalProcessor = new WithdrawalProcessor(supabase, btcWallet, ethWallet, {
    processingInterval: 30000, // 30 seconds
    maxRetries: 3,
    minBTCBalance: 0.1,
    minETHBalance: 1.0,
    testMode: process.env.NODE_ENV === 'development',
    alertWebhookUrl: process.env.ALERT_WEBHOOK_URL
});
withdrawalProcessor.start();

// Schedule automatic live drops generation
scheduleLiveDrop();
function scheduleLiveDrop() {
    const delay = 60000 + Math.random() * 120000; // 1‑3 minutes
    setTimeout(async () => {
        try {
            const drop = LiveDropService.generateRandomDrop();
            const { error } = await supabase.from('live_drops').insert(drop);
            if (error) console.error('Live drop insert error:', error);
        } catch (e) {
            console.error('Live drop generation error:', e);
        }
        scheduleLiveDrop(); // recurse for next drop
    }, delay);
}

scheduleLiveDrop();

/**
 * Generate deposit address for a user
 * POST /api/deposits/generate-address
 * Body: { currency }
 * ✅ SECURITY FIX: Added authentication - userId now comes from verified token
 */
app.post('/api/deposits/generate-address', authenticateUser(supabase), async (req, res) => {
    try {
        const userId = req.user.id; // ✅ Get userId from authenticated user, not request body
        const { currency } = req.body;

        if (!currency) {
            return res.status(400).json({ error: 'Missing currency' });
        }

        if (!['BTC', 'ETH'].includes(currency)) {
            return res.status(400).json({ error: 'Invalid currency. Must be BTC or ETH' });
        }

        // Check if user already has an address for this currency
        const { data: existingAddress } = await supabase
            .from('crypto_addresses')
            .select('*')
            .eq('user_id', userId)
            .eq('currency', currency)
            .single();

        if (existingAddress) {
            return res.json({
                address: existingAddress.address,
                currency: existingAddress.currency
            });
        }

        // Generate new address
        // Use user ID hash as index for deterministic address generation
        const userIndex = parseInt(userId.split('-').pop() || '0', 36) % 1000000;

        let addressData;
        if (currency === 'BTC') {
            addressData = btcWallet.generateAddress(userIndex);
        } else {
            addressData = ethWallet.generateAddress(userIndex);
        }

        // Save to database
        const { error } = await supabase
            .from('crypto_addresses')
            .insert({
                id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: userId,
                currency,
                address: addressData.address,
                derivation_path: addressData.derivationPath
            });

        if (error) throw error;

        res.json({
            address: addressData.address,
            currency
        });

    } catch (error) {
        console.error('Error generating address:', error);
        res.status(500).json({ error: 'Failed to generate address' });
    }
});

/**
 * Submit a deposit transaction
 * POST /api/deposits/submit
 * Body: { currency, txHash, amount }
 * ✅ SECURITY FIX: Added authentication - userId now comes from verified token
 */
app.post('/api/deposits/submit', authenticateUser(supabase), async (req, res) => {
    try {
        const userId = req.user.id; // ✅ Get userId from authenticated user, not request body
        const { currency, txHash, amount } = req.body;

        if (!currency || !txHash || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get user's deposit address
        const { data: addressRecord } = await supabase
            .from('crypto_addresses')
            .select('*')
            .eq('user_id', userId)
            .eq('currency', currency)
            .single();

        if (!addressRecord) {
            return res.status(404).json({ error: 'No deposit address found for this user' });
        }

        // Check if transaction already exists
        const { data: existingDeposit } = await supabase
            .from('crypto_deposits')
            .select('*')
            .eq('tx_hash', txHash)
            .single();

        if (existingDeposit) {
            return res.json({
                depositId: existingDeposit.id,
                status: existingDeposit.status
            });
        }

        // Create deposit record
        const depositId = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error } = await supabase
            .from('crypto_deposits')
            .insert({
                id: depositId,
                user_id: userId,
                currency,
                address: addressRecord.address,
                tx_hash: txHash,
                amount: parseFloat(amount),
                status: 'PENDING'
            });

        if (error) throw error;

        res.json({
            depositId,
            status: 'PENDING',
            message: 'Deposit submitted. Waiting for confirmations...'
        });

    } catch (error) {
        console.error('Error submitting deposit:', error);
        res.status(500).json({ error: 'Failed to submit deposit' });
    }
});

// Public live drops endpoint
app.get('/api/live-drops', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('live_drops')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        if (error) throw error;
        res.json({ drops: data });
    } catch (err) {
        console.error('Public live drops fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch live drops' });
    }
});

// Live drops endpoint (admin only)
app.get('/api/admin/live-drops', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('live_drops')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        if (error) throw error;
        res.json({ drops: data });
    } catch (err) {
        console.error('Live drops fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch live drops' });
    }
});
/**
 * Get deposit status
 * GET /api/deposits/status/:depositId
 * ✅ SECURITY FIX: Added authentication and ownership verification
 */
app.get('/api/deposits/status/:depositId', authenticateUser(supabase), async (req, res) => {
    try {
        const { depositId } = req.params;
        const userId = req.user.id; // ✅ Get userId from authenticated user

        const { data: deposit, error } = await supabase
            .from('crypto_deposits')
            .select('*')
            .eq('id', depositId)
            .eq('user_id', userId) // ✅ Verify user owns this deposit
            .single();

        if (error || !deposit) {
            return res.status(404).json({ error: 'Deposit not found' });
        }

        res.json({
            depositId: deposit.id,
            currency: deposit.currency,
            amount: deposit.amount,
            status: deposit.status,
            confirmations: deposit.confirmations,
            requiredConfirmations: deposit.required_confirmations,
            txHash: deposit.tx_hash
        });

    } catch (error) {
        console.error('Error getting deposit status:', error);
        res.status(500).json({ error: 'Failed to get deposit status' });
    }
});

/**
 * Get user's deposit history
 * GET /api/deposits/history
 * ✅ SECURITY FIX: Added authentication - userId from verified token, not URL param
 */
app.get('/api/deposits/history', authenticateUser(supabase), async (req, res) => {
    try {
        const userId = req.user.id; // ✅ Get userId from authenticated user, not URL param

        const { data: deposits, error } = await supabase
            .from('crypto_deposits')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ deposits: deposits || [] });

    } catch (error) {
        console.error('Error getting deposit history:', error);
        res.status(500).json({ error: 'Failed to get deposit history' });
    }
});

/**
 * Get all crypto deposits with user info (for admin panel)
 * GET /api/admin/crypto-deposits
 */
app.get('/api/admin/crypto-deposits', async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const { data: deposits, error } = await supabase
            .from('crypto_deposits')
            .select('*, users(username)')
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;

        res.json({ deposits: deposits || [] });

    } catch (error) {
        console.error('Error getting crypto deposits:', error);
        res.status(500).json({ error: 'Failed to get crypto deposits' });
    }
});

/**
 * Get platform settings (for admin panel)
 * GET /api/admin/settings/public
 */
app.get('/api/admin/settings/public', async (req, res) => {
    try {
        const { data: settings, error } = await supabase
            .from('platform_settings')
            .select('key, value')
            .in('key', ['auto_approve_withdrawals', 'manual_approval_threshold'])
            .single();

        if (error) {
            // Return defaults if settings don't exist yet
            return res.json({
                auto_approve_withdrawals: false,
                manual_approval_threshold: 100
            });
        }

        res.json({
            auto_approve_withdrawals: settings?.auto_approve_withdrawals || false,
            manual_approval_threshold: parseFloat(settings?.manual_approval_threshold) || 100
        });

    } catch (error) {
        console.error('Error getting settings:', error);
        res.json({
            auto_approve_withdrawals: false,
            manual_approval_threshold: 100
        });
    }
});

/**
 * Update platform settings (for admin panel)
 * POST /api/admin/settings/update
 */
app.post('/api/admin/settings/update', async (req, res) => {
    try {
        const { auto_approve_withdrawals, manual_approval_threshold } = req.body;

        // Update or insert settings
        const { error: upsertError } = await supabase
            .from('platform_settings')
            .upsert({
                id: 'default',
                auto_approve_withdrawals: auto_approve_withdrawals !== undefined ? auto_approve_withdrawals : false,
                manual_approval_threshold: manual_approval_threshold !== undefined ? parseFloat(manual_approval_threshold) : 100,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });

        if (upsertError) throw upsertError;

        res.json({ success: true, message: 'Settings updated successfully' });

    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Initialize admin auth service
const adminAuthService = new AdminAuthService(supabase);

// Admin routes
app.use('/api/admin', createAdminRoutes(supabase));

// Box management routes (admin only)
app.use('/api/admin/boxes', createBoxRoutes(supabase, adminAuthService, authenticateAdmin, requirePermission));

// Streamer management routes (admin only)
app.use('/api/admin/streamers', createStreamerRoutes(supabase));

// Affiliate routes
app.use('/api/affiliates', createAffiliateRoutes(supabase));

// Battle routes
app.use('/api/battles', createBattleRoutes(supabase));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        monitor: monitor.isRunning ? 'running' : 'stopped'
    });
});

/**
 * Request withdrawal
 * POST /api/withdrawals/request
 * Body: { amount, currency, address }
 */
app.post('/api/withdrawals/request', authenticateUser(supabase), validateWithdrawalAddress, async (req, res) => {
    try {
        const { amount, currency, address } = req.body;
        const userId = req.user.id; // From auth middleware

        // Validation
        if (!amount || !currency || !address) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (amount < 25) {
            return res.status(400).json({ error: 'Minimum withdrawal amount is $25' });
        }

        // ✅ NEW: Check withdrawal limits
        const limitsCheck = await withdrawalLimits.checkWithdrawalLimit(userId, amount);
        if (!limitsCheck.allowed) {
            return res.status(400).json({
                error: limitsCheck.message,
                reason: limitsCheck.reason,
                limit: limitsCheck.limit,
                withdrawn: limitsCheck.withdrawn,
                remaining: limitsCheck.remaining,
                resetTime: limitsCheck.resetTime
            });
        }

        // ✅ NEW: Check hot wallet has sufficient balance
        if (!hotWalletMonitor.hasSufficientBalance(currency, amount)) {
            return res.status(503).json({
                error: 'Insufficient hot wallet funds. Please try again later or contact support.',
                reason: 'HOT_WALLET_LOW'
            });
        }

        // Check platform settings for auto-approval
        let autoApprove = false;
        let manualApprovalThreshold = 1000;
        try {
            const { data: settings } = await supabase
                .from('platform_settings')
                .select('auto_approve_withdrawals, manual_approval_threshold')
                .eq('id', 'default')
                .single();

            if (settings) {
                const isAutoApproveEnabled = settings.auto_approve_withdrawals || false;
                manualApprovalThreshold = parseFloat(settings.manual_approval_threshold) || 1000;

                if (isAutoApproveEnabled && amount < manualApprovalThreshold) {
                    autoApprove = true;
                }
            }
        } catch (e) {
            console.log('Platform settings not found, defaulting to manual approval');
        }

        // Atomically decrement balance
        const { error: balanceError } = await supabase
            .rpc('decrement_balance', {
                user_id: userId,
                amount: amount
            });

        if (balanceError) {
            console.error('Balance update error:', balanceError);
            return res.status(400).json({ error: balanceError.message || 'Insufficient balance or error updating funds' });
        }

        // ✅ NEW: Record withdrawal against limits
        await withdrawalLimits.recordWithdrawal(userId, amount);

        // Create withdrawal record
        const withdrawalId = `wd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const status = autoApprove ? 'APPROVED' : 'PENDING';

        const { error: withdrawalError } = await supabase
            .from('withdrawals')
            .insert({
                id: withdrawalId,
                user_id: userId,
                currency,
                amount,
                usd_value: amount,
                withdrawal_address: address,
                status,
                processed_at: autoApprove ? new Date().toISOString() : null,
                net_amount: amount,
                ip_address: req.ip || req.connection.remoteAddress
            });

        if (withdrawalError) {
            // Rollback balance and limits
            await supabase.rpc('increment_balance', {
                user_id: userId,
                amount: amount
            });
            await withdrawalLimits.refundWithdrawal(userId, amount);

            console.error('Withdrawal creation error:', withdrawalError);
            return res.status(500).json({ error: 'Failed to create withdrawal request' });
        }

        // ✅ NEW: Send email notification
        try {
            const { data: user } = await supabase
                .from('users')
                .select('email, username')
                .eq('id', userId)
                .single();

            if (user?.email) {
                await emailService.sendWithdrawalSubmitted(user.email, {
                    currency,
                    amount,
                    withdrawalAddress: address,
                    status
                });
            }
        } catch (emailErr) {
            console.error('Email notification failed:', emailErr);
            // Don't fail the withdrawal if email fails
        }

        console.log(`💸 Withdrawal request created: ${withdrawalId} - ${amount} ${currency} (${status})`);

        res.json({
            success: true,
            withdrawalId,
            status,
            message: autoApprove
                ? `Withdrawal approved automatically (below $${manualApprovalThreshold} threshold) and will be processed shortly`
                : amount >= manualApprovalThreshold
                    ? `Withdrawal request submitted. Amount exceeds $${manualApprovalThreshold} threshold and requires manual approval.`
                    : 'Withdrawal request submitted. Awaiting admin approval.',
            dailyRemaining: limitsCheck.dailyRemaining,
            monthlyRemaining: limitsCheck.monthlyRemaining
        });

    } catch (error) {
        console.error('Withdrawal request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Crypto Deposit Backend running on port ${PORT}`);
    console.log(`📡 Blockchain monitor: ${monitor.isRunning ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`\n💡 API Endpoints:`);
    console.log(`   POST /api/deposits/generate-address`);
    console.log(`   POST /api/deposits/submit`);
    console.log(`   GET  /api/deposits/status/:depositId`);
    console.log(`   GET  /api/deposits/history/:userId`);
    console.log(`\n⚠️  Make sure to set these environment variables:`);
    console.log(`   - VITE_SUPABASE_ANON_KEY`);
    console.log(`   - BTC_MASTER_SEED (optional, will generate if not set)`);
    console.log(`   - ETH_MASTER_SEED (optional, will generate if not set)`);
    console.log(`   - BLOCKCHAIR_API_KEY (optional, for higher rate limits)`);
    console.log(`   - ETHERSCAN_API_KEY (optional, for higher rate limits)\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    monitor.stop();
    process.exit(0);
});
