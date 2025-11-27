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

        // Start polling
        this.pollInterval = setInterval(() => {
            this.checkPendingDeposits();
        }, this.POLL_INTERVAL);

        // Run immediately
        this.checkPendingDeposits();
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.isRunning = false;
            console.log('🛑 Blockchain monitor stopped');
        }
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
     * Check BTC transaction status using Blockchair API
     */
    async checkBTCTransaction(deposit) {
        try {
            const url = `https://api.blockchair.com/bitcoin/dashboards/transaction/${deposit.tx_hash}`;
            const response = await axios.get(url);

            if (response.data.data && response.data.data[deposit.tx_hash]) {
                const txData = response.data.data[deposit.tx_hash];
                const transaction = txData.transaction;

                // Get confirmations (current block height - tx block height + 1)
                const confirmations = transaction.block_id ?
                    (response.data.context.state - transaction.block_id + 1) : 0;

                console.log(`  BTC ${deposit.tx_hash.slice(0, 10)}...: ${confirmations} confirmations`);

                // Update deposit status
                await this.updateDepositStatus(deposit, confirmations);
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

            // Calculate USD value (you'd want to use real-time prices here)
            const usdValue = deposit.usd_value || (deposit.amount * 50000); // Placeholder conversion

            // Update user balance
            const newBalance = parseFloat(user.balance) + parseFloat(usdValue);
            await this.supabase
                .from('users')
                .update({ balance: newBalance })
                .eq('id', deposit.user_id);

            // Mark deposit as credited
            await this.supabase
                .from('crypto_deposits')
                .update({
                    status: 'CREDITED',
                    credited_at: new Date().toISOString()
                })
                .eq('id', deposit.id);

            // Create transaction record
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

            console.log(`  💰 Credited $${usdValue} to user ${deposit.user_id}`);
        } catch (error) {
            console.error(`  ❌ Error crediting balance:`, error.message);
        }
    }
}

module.exports = BlockchainMonitor;
