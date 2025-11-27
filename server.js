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
const { authenticateAdmin, requirePermission } = require('./middleware/adminAuth');
const createAdminRoutes = require('./routes/admin');
const createBoxRoutes = require('./routes/boxes');
const createAffiliateRoutes = require('./routes/affiliates');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
    'https://cbjdasfnwzizfphnwxfd.supabase.co',
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
 * Body: { userId, currency }
 */
app.post('/api/deposits/generate-address', async (req, res) => {
    try {
        const { userId, currency } = req.body;

        if (!userId || !currency) {
            return res.status(400).json({ error: 'Missing userId or currency' });
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
 * Body: { userId, currency, txHash, amount }
 */
app.post('/api/deposits/submit', async (req, res) => {
    try {
        const { userId, currency, txHash, amount } = req.body;

        if (!userId || !currency || !txHash || !amount) {
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
 */
app.get('/api/deposits/status/:depositId', async (req, res) => {
    try {
        const { depositId } = req.params;

        const { data: deposit, error } = await supabase
            .from('crypto_deposits')
            .select('*')
            .eq('id', depositId)
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
 * GET /api/deposits/history/:userId
 */
app.get('/api/deposits/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

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

// Initialize admin auth service
const adminAuthService = new AdminAuthService(supabase);

// Admin routes
app.use('/api/admin', createAdminRoutes(supabase));

// Box management routes (admin only)
app.use('/api/admin/boxes', createBoxRoutes(supabase, adminAuthService, authenticateAdmin, requirePermission));

// Affiliate routes
app.use('/api/affiliates', createAffiliateRoutes(supabase));

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
 * Body: { userId, amount, currency, address }
 */
app.post('/api/withdrawals/request', async (req, res) => {
    try {
        const { userId, amount, currency, address } = req.body;

        // Validation
        if (!userId || !amount || !currency || !address) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (amount < 25) {
            return res.status(400).json({ error: 'Minimum withdrawal amount is $25' });
        }

        // Get user balance
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (parseFloat(user.balance) < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Check platform settings for auto-approval
        let autoApprove = false;
        try {
            const { data: settings } = await supabase
                .from('platform_settings')
                .select('auto_approve_withdrawals')
                .eq('id', 'default')
                .single();

            autoApprove = settings?.auto_approve_withdrawals || false;
        } catch (e) {
            // If platform_settings doesn't exist, default to manual approval
            console.log('Platform settings not found, defaulting to manual approval');
        }

        // Deduct balance
        const newBalance = parseFloat(user.balance) - amount;
        const { error: balanceError } = await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', userId);

        if (balanceError) {
            return res.status(500).json({ error: 'Failed to update balance' });
        }

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
                net_amount: amount
            });

        if (withdrawalError) {
            // Rollback balance
            await supabase
                .from('users')
                .update({ balance: user.balance })
                .eq('id', userId);

            console.error('Withdrawal creation error:', withdrawalError);
            return res.status(500).json({ error: 'Failed to create withdrawal request' });
        }

        res.json({
            success: true,
            withdrawalId,
            status,
            message: autoApprove
                ? 'Withdrawal approved automatically and will be processed shortly'
                : 'Withdrawal request submitted. Awaiting admin approval.'
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
