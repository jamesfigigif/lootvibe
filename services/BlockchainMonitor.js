const axios = require('axios');

class BlockchainMonitor {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.isRunning = false;

        // API keys - should be in environment variables
        this.blockchairApiKey = process.env.BLOCKCHAIR_API_KEY || '';
        this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';

        // Confirmation requirements
        this.BTC_REQUIRED_CONFIRMATIONS = 3; // Reduced for faster testing (6 in production)
        this.ETH_REQUIRED_CONFIRMATIONS = 12;

        // Polling interval (30 seconds)
        this.POLL_INTERVAL = 30000;

        // Address scanning interval (60 seconds - less frequent to avoid rate limits)
        this.ADDRESS_SCAN_INTERVAL = 60000;

        // Track last scanned block/transaction to avoid duplicates
        this.lastScannedBlocks = {
            BTC: null,
            ETH: null
        };
    }

    /**
     * Start monitoring blockchain for new transactions
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  Monitor already running');
            return;
        }

        this.isRunning = true;
        console.log('🔍 Starting blockchain monitor...');

        // Start polling for pending deposits
        this.pollInterval = setInterval(() => {
            this.checkPendingDeposits();
        }, this.POLL_INTERVAL);

        // Start scanning addresses for new deposits
        this.addressScanInterval = setInterval(() => {
            this.scanAddressesForDeposits();
        }, this.ADDRESS_SCAN_INTERVAL);

        // Run immediately
        this.checkPendingDeposits();
        this.scanAddressesForDeposits();
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        if (this.addressScanInterval) {
            clearInterval(this.addressScanInterval);
        }
        this.isRunning = false;
        console.log('🛑 Blockchain monitor stopped');
    }

    /**
     * Check all pending deposits
     */
    async checkPendingDeposits() {
        try {
            // Get all pending/confirming deposits
            const { data: deposits, error } = await this.supabase
                .from('crypto_deposits')
                .select('*')
                .in('status', ['PENDING', 'CONFIRMING']);

            if (error) throw error;

            if (!deposits || deposits.length === 0) {
                console.log('✓ No pending deposits');
                return;
            }

            console.log(`🔍 Checking ${deposits.length} pending deposits...`);

            for (const deposit of deposits) {
                if (deposit.currency === 'BTC') {
                    await this.checkBTCTransaction(deposit);
                } else if (deposit.currency === 'ETH') {
                    await this.checkETHTransaction(deposit);
                }
            }
        } catch (error) {
            console.error('❌ Error checking deposits:', error.message);
        }
    }

    /**
     * Check BTC transaction status using Mempool.space API
     */
    async checkBTCTransaction(deposit) {
        try {
            // Get transaction details
            const url = `https://mempool.space/api/tx/${deposit.tx_hash}`;
            const response = await axios.get(url);

            if (response.data) {
                const tx = response.data;

                if (tx.status && tx.status.confirmed) {
                    // Get current block height
                    const heightUrl = 'https://mempool.space/api/blocks/tip/height';
                    const heightResponse = await axios.get(heightUrl);
                    const currentHeight = heightResponse.data;

                    const confirmations = currentHeight - tx.status.block_height + 1;
                    console.log(`  BTC ${deposit.tx_hash.slice(0, 10)}...: ${confirmations} confirmations`);

                    await this.updateDepositStatus(deposit, confirmations);
                } else {
                    console.log(`  BTC ${deposit.tx_hash.slice(0, 10)}...: Unconfirmed`);
                    await this.updateDepositStatus(deposit, 0);
                }
            }
        } catch (error) {
            console.error(`  ❌ Error checking BTC tx ${deposit.tx_hash}:`, error.message);
        }
    }

    /**
     * Check ETH transaction status using Etherscan API
     */
    async checkETHTransaction(deposit) {
        try {
            const url = `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${deposit.tx_hash}&apikey=${this.etherscanApiKey}`;
            const response = await axios.get(url);

            if (response.data.result) {
                const tx = response.data.result;

                // Get current block number
                const blockUrl = `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${this.etherscanApiKey}`;
                const blockResponse = await axios.get(blockUrl);
                const currentBlock = parseInt(blockResponse.data.result, 16);

                // Calculate confirmations
                const txBlock = parseInt(tx.blockNumber, 16);
                const confirmations = tx.blockNumber ? (currentBlock - txBlock + 1) : 0;

                console.log(`  ETH ${deposit.tx_hash.slice(0, 10)}...: ${confirmations} confirmations`);

                // Update deposit status
                await this.updateDepositStatus(deposit, confirmations);
            }
        } catch (error) {
            console.error(`  ❌ Error checking ETH tx ${deposit.tx_hash}:`, error.message);
        }
    }

    /**
     * Update deposit status based on confirmations
     */
    async updateDepositStatus(deposit, confirmations) {
        const requiredConfirmations = deposit.currency === 'BTC' ?
            this.BTC_REQUIRED_CONFIRMATIONS : this.ETH_REQUIRED_CONFIRMATIONS;

        let newStatus = deposit.status;

        if (confirmations === 0) {
            newStatus = 'PENDING';
        } else if (confirmations < requiredConfirmations) {
            newStatus = 'CONFIRMING';
        } else if (confirmations >= requiredConfirmations && deposit.status !== 'CREDITED') {
            newStatus = 'CONFIRMED';
            // Credit the user's balance
            await this.creditUserBalance(deposit);
        }

        // Update deposit record
        if (newStatus !== deposit.status || confirmations !== deposit.confirmations) {
            await this.supabase
                .from('crypto_deposits')
                .update({
                    confirmations,
                    status: newStatus,
                    required_confirmations: requiredConfirmations
                })
                .eq('id', deposit.id);

            console.log(`  ✓ Updated ${deposit.currency} deposit to ${newStatus} (${confirmations}/${requiredConfirmations})`);
        }
    }

    /**
     * Credit user balance when deposit is confirmed
     */
    async creditUserBalance(deposit) {
        try {
            // Check if already credited (idempotency)
            const { data: existingDeposit } = await this.supabase
                .from('crypto_deposits')
                .select('status, credited_at')
                .eq('id', deposit.id)
                .single();

            if (existingDeposit && existingDeposit.status === 'CREDITED') {
                console.log(`  ⏭️  Deposit ${deposit.id} already credited, skipping`);
                return;
            }

            // Get current user balance
            const { data: user } = await this.supabase
                .from('users')
                .select('balance')
                .eq('id', deposit.user_id)
                .single();

            if (!user) {
                console.error(`  ❌ User ${deposit.user_id} not found`);
                return;
            }

            // Get USD value (use stored value or fetch current price)
            let usdValue = deposit.usd_value;
            if (!usdValue || usdValue === 0) {
                usdValue = await this.getUSDValue(deposit.currency, deposit.amount);
                // Update deposit with calculated USD value
                await this.supabase
                    .from('crypto_deposits')
                    .update({ usd_value: usdValue })
                    .eq('id', deposit.id);
            }

            // Update user balance atomically
            const { error: balanceError } = await this.supabase
                .rpc('increment_balance', {
                    user_id: deposit.user_id,
                    amount: parseFloat(usdValue)
                });

            if (balanceError) {
                throw balanceError;
            }

            // Mark deposit as credited
            const { error: creditError } = await this.supabase
                .from('crypto_deposits')
                .update({
                    status: 'CREDITED',
                    credited_at: new Date().toISOString(),
                    usd_value: usdValue
                })
                .eq('id', deposit.id);

            if (creditError) {
                throw creditError;
            }

            // Create transaction record (check for duplicates)
            const { data: existingTx } = await this.supabase
                .from('transactions')
                .select('id')
                .eq('user_id', deposit.user_id)
                .eq('type', 'DEPOSIT')
                .eq('description', `${deposit.currency} deposit: ${deposit.amount} (${deposit.tx_hash.slice(0, 10)}...)`)
                .single();

            if (!existingTx) {
                await this.supabase
                    .from('transactions')
                    .insert({
                        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        user_id: deposit.user_id,
                        type: 'DEPOSIT',
                        amount: usdValue,
                        description: `${deposit.currency} deposit: ${deposit.amount} (${deposit.tx_hash.slice(0, 10)}...)`,
                        timestamp: Date.now()
                    });
            }

            // Create in-app notification
            try {
                const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await this.supabase
                    .from('notifications')
                    .insert({
                        id: notificationId,
                        user_id: deposit.user_id,
                        type: 'DEPOSIT_CREDITED',
                        title: 'Deposit Received',
                        message: `Your ${deposit.currency} deposit of $${usdValue.toFixed(2)} has been credited to your account!`,
                        data: {
                            currency: deposit.currency,
                            amount: deposit.amount,
                            usd_value: usdValue,
                            tx_hash: deposit.tx_hash
                        },
                        read: false,
                        created_at: new Date().toISOString()
                    });
                console.log(`  🔔 Notification created for deposit`);
            } catch (notifError) {
                console.error(`  ⚠️  Failed to create notification:`, notifError.message);
                // Don't fail the deposit if notification fails
            }

            console.log(`  💰 Credited $${usdValue.toFixed(2)} to user ${deposit.user_id}`);
        } catch (error) {
            console.error(`  ❌ Error crediting balance:`, error.message);
        }
    }

    /**
     * Scan all deposit addresses for new incoming transactions
     * This is the key method that makes deposits work automatically
     */
    async scanAddressesForDeposits() {
        try {
            // Get all active deposit addresses
            const { data: addresses, error } = await this.supabase
                .from('crypto_addresses')
                .select('*');

            if (error) throw error;

            if (!addresses || addresses.length === 0) {
                return; // No addresses to monitor
            }

            console.log(`🔍 Scanning ${addresses.length} addresses for new deposits...`);

            // Group by currency for batch processing
            const btcAddresses = addresses.filter(a => a.currency === 'BTC');
            const ethAddresses = addresses.filter(a => a.currency === 'ETH');

            // Scan BTC addresses
            if (btcAddresses.length > 0) {
                await this.scanBTCAddresses(btcAddresses);
            }

            // Scan ETH addresses
            if (ethAddresses.length > 0) {
                await this.scanETHAddresses(ethAddresses);
            }

        } catch (error) {
            console.error('❌ Error scanning addresses:', error.message);
        }
    }

    /**
     * Scan BTC addresses for new transactions using Mempool.space API
     */
    async scanBTCAddresses(addresses) {
        try {
            // Mempool.space doesn't support batching, so we scan one by one
            for (const addressRecord of addresses) {
                try {
                    const url = `https://mempool.space/api/address/${addressRecord.address}/txs`;
                    const response = await axios.get(url);

                    if (!response.data || !Array.isArray(response.data)) continue;

                    // Get existing deposits for this address
                    const { data: existingDeposits } = await this.supabase
                        .from('crypto_deposits')
                        .select('tx_hash')
                        .eq('address', addressRecord.address);

                    const existingTxHashes = new Set(existingDeposits?.map(d => d.tx_hash) || []);

                    // Check recent transactions
                    for (const tx of response.data) {
                        if (existingTxHashes.has(tx.txid)) continue;

                        // Verify this transaction sends funds TO our address
                        let amountReceived = 0;
                        if (tx.vout) {
                            for (const output of tx.vout) {
                                if (output.scriptpubkey_address === addressRecord.address) {
                                    amountReceived += output.value / 100000000; // Convert satoshis to BTC
                                }
                            }
                        }

                        if (amountReceived > 0) {
                            await this.createDepositRecord({
                                user_id: addressRecord.user_id,
                                currency: 'BTC',
                                address: addressRecord.address,
                                tx_hash: tx.txid,
                                amount: amountReceived
                            });
                        }
                    }

                    // Polite delay between requests
                    await new Promise(resolve => setTimeout(resolve, 200));

                } catch (err) {
                    console.error(`  ❌ Error scanning BTC address ${addressRecord.address}:`, err.message);
                }
            }
        } catch (error) {
            console.error('❌ Error scanning BTC addresses:', error.message);
        }
    }

    /**
     * Scan ETH addresses for new transactions using Etherscan API
     */
    async scanETHAddresses(addresses) {
        try {
            for (const addressRecord of addresses) {
                // Get existing deposits to avoid duplicates
                const { data: existingDeposits } = await this.supabase
                    .from('crypto_deposits')
                    .select('tx_hash')
                    .eq('address', addressRecord.address.toLowerCase());

                const existingTxHashes = new Set(existingDeposits?.map(d => d.tx_hash.toLowerCase()) || []);

                // Get recent transactions for this address
                const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${addressRecord.address}&startblock=0&endblock=99999999&sort=desc&apikey=${this.etherscanApiKey}`;
                const response = await axios.get(url);

                if (!response.data.result || !Array.isArray(response.data.result)) {
                    continue;
                }

                // Process transactions (only incoming, not outgoing)
                for (const tx of response.data.result) {
                    const txHash = tx.hash.toLowerCase();

                    // Skip if already processed
                    if (existingTxHashes.has(txHash)) continue;

                    // Only process incoming transactions (to our address)
                    const toAddress = tx.to?.toLowerCase();
                    if (toAddress !== addressRecord.address.toLowerCase()) continue;

                    // Skip failed transactions
                    if (tx.isError === '1') continue;

                    // Calculate amount in ETH
                    const amountReceived = parseFloat(tx.value) / 1e18;

                    // Only process if funds were received
                    if (amountReceived > 0) {
                        await this.createDepositRecord({
                            user_id: addressRecord.user_id,
                            currency: 'ETH',
                            address: addressRecord.address,
                            tx_hash: tx.hash, // Keep original case
                            amount: amountReceived
                        });
                    }
                }

                // Rate limit: Etherscan free tier allows 5 calls/second
                await new Promise(resolve => setTimeout(resolve, 250));
            }
        } catch (error) {
            console.error('❌ Error scanning ETH addresses:', error.message);
        }
    }

    /**
     * Create a new deposit record when a transaction is detected
     */
    async createDepositRecord({ user_id, currency, address, tx_hash, amount }) {
        try {
            // Check if deposit already exists
            const { data: existing } = await this.supabase
                .from('crypto_deposits')
                .select('id')
                .eq('tx_hash', tx_hash)
                .single();

            if (existing) {
                return; // Already exists
            }

            // Get current crypto price for USD conversion
            const usdValue = await this.getUSDValue(currency, amount);

            // Create deposit record
            const depositId = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const { error } = await this.supabase
                .from('crypto_deposits')
                .insert({
                    id: depositId,
                    user_id,
                    currency,
                    address,
                    tx_hash,
                    amount,
                    usd_value: usdValue,
                    status: 'PENDING',
                    confirmations: 0,
                    required_confirmations: currency === 'BTC' ? this.BTC_REQUIRED_CONFIRMATIONS : this.ETH_REQUIRED_CONFIRMATIONS
                });

            if (error) {
                // Ignore duplicate key errors (race condition)
                if (error.code !== '23505') {
                    throw error;
                }
                return;
            }

            console.log(`  ✅ Detected new ${currency} deposit: ${amount} ${currency} ($${usdValue.toFixed(2)}) for user ${user_id.slice(0, 8)}...`);

            // Immediately check the transaction status
            const depositRecord = {
                id: depositId,
                tx_hash: tx_hash,
                currency: currency,
                status: 'PENDING',
                confirmations: 0,
                required_confirmations: currency === 'BTC' ? this.BTC_REQUIRED_CONFIRMATIONS : this.ETH_REQUIRED_CONFIRMATIONS
            };

            if (currency === 'BTC') {
                await this.checkBTCTransaction(depositRecord);
            } else {
                await this.checkETHTransaction(depositRecord);
            }

        } catch (error) {
            console.error(`  ❌ Error creating deposit record:`, error.message);
        }
    }

    /**
     * Get USD value for crypto amount using CoinGecko API (free, no API key needed)
     */
    async getUSDValue(currency, amount) {
        try {
            const coinId = currency === 'BTC' ? 'bitcoin' : 'ethereum';
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;

            const response = await axios.get(url, {
                timeout: 5000 // 5 second timeout
            });

            if (response.data && response.data[coinId] && response.data[coinId].usd) {
                return amount * response.data[coinId].usd;
            }
        } catch (error) {
            console.warn(`  ⚠️  Failed to fetch ${currency} price, using fallback`);
        }

        // Fallback prices (will be updated on next scan)
        const fallbackPrices = {
            BTC: 50000,
            ETH: 3000
        };
        return amount * fallbackPrices[currency];
    }
}

module.exports = BlockchainMonitor;
