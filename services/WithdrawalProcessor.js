const bitcoin = require('bitcoinjs-lib');
const { ethers } = require('ethers');

/**
 * WithdrawalProcessor - Handles automated crypto withdrawal processing
 *
 * Features:
 * - Automatic processing of approved withdrawals
 * - Transaction signing and broadcasting
 * - Fee estimation and optimization
 * - Hot wallet balance management
 * - Transaction retry logic
 * - Comprehensive error handling
 */
class WithdrawalProcessor {
    constructor(supabase, btcWallet, ethWallet, options = {}) {
        this.supabase = supabase;
        this.btcWallet = btcWallet;
        this.ethWallet = ethWallet;

        // Configuration
        this.config = {
            processingInterval: options.processingInterval || 30000, // 30 seconds
            maxRetries: options.maxRetries || 3,
            minHotWalletBalance: {
                BTC: options.minBTCBalance || 0.1,
                ETH: options.minETHBalance || 1.0
            },
            testMode: options.testMode || false,
            alertWebhookUrl: options.alertWebhookUrl || null
        };

        this.isRunning = false;
        this.processingTimer = null;

        console.log('💸 WithdrawalProcessor initialized');
        console.log(`   Test Mode: ${this.config.testMode ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   Processing Interval: ${this.config.processingInterval}ms`);
    }

    /**
     * Start automatic processing
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  WithdrawalProcessor already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 WithdrawalProcessor started');

        // Initial check
        this.processApprovedWithdrawals();

        // Set up recurring processing
        this.processingTimer = setInterval(() => {
            this.processApprovedWithdrawals();
        }, this.config.processingInterval);
    }

    /**
     * Stop automatic processing
     */
    stop() {
        if (!this.isRunning) return;

        clearInterval(this.processingTimer);
        this.isRunning = false;
        console.log('🛑 WithdrawalProcessor stopped');
    }

    /**
     * Main processing loop - handles all approved withdrawals
     */
    async processApprovedWithdrawals() {
        try {
            // Fetch all APPROVED withdrawals
            const { data: withdrawals, error } = await this.supabase
                .from('withdrawals')
                .select('*')
                .eq('status', 'APPROVED')
                .order('created_at', { ascending: true })
                .limit(10); // Process 10 at a time

            if (error) {
                console.error('❌ Error fetching approved withdrawals:', error);
                return;
            }

            if (!withdrawals || withdrawals.length === 0) {
                return; // No withdrawals to process
            }

            console.log(`📋 Found ${withdrawals.length} approved withdrawal(s) to process`);

            // Check hot wallet balances before processing
            const balances = await this.checkHotWalletBalances();

            // Process each withdrawal
            for (const withdrawal of withdrawals) {
                await this.processSingleWithdrawal(withdrawal, balances);
            }

        } catch (err) {
            console.error('❌ Error in processApprovedWithdrawals:', err);
        }
    }

    /**
     * Process a single withdrawal
     */
    async processSingleWithdrawal(withdrawal, balances) {
        const { id, currency, amount, withdrawal_address, net_amount } = withdrawal;

        try {
            console.log(`\n💰 Processing withdrawal ${id}`);
            console.log(`   Currency: ${currency}`);
            console.log(`   Amount: ${amount}`);
            console.log(`   Address: ${withdrawal_address}`);

            // Validate address format
            if (!this.validateAddress(withdrawal_address, currency)) {
                throw new Error(`Invalid ${currency} address format`);
            }

            // Check hot wallet has sufficient balance
            const requiredAmount = parseFloat(net_amount || amount);
            const available = balances[currency];

            if (available < requiredAmount) {
                console.error(`⚠️  Insufficient hot wallet balance for ${currency}`);
                console.error(`   Required: ${requiredAmount}, Available: ${available}`);

                await this.alertLowBalance(currency, available, requiredAmount);
                return; // Skip this withdrawal, try again later
            }

            // Update status to PROCESSING
            await this.updateWithdrawalStatus(id, 'PROCESSING');

            // Send transaction based on currency
            let txResult;
            if (currency === 'BTC') {
                txResult = await this.sendBTCTransaction(withdrawal_address, requiredAmount);
            } else if (currency === 'ETH') {
                txResult = await this.sendETHTransaction(withdrawal_address, requiredAmount);
            } else {
                throw new Error(`Unsupported currency: ${currency}`);
            }

            // Update withdrawal with transaction details
            await this.updateWithdrawalStatus(id, 'COMPLETED', {
                tx_hash: txResult.txHash,
                tx_url: txResult.txUrl,
                completed_at: new Date().toISOString(),
                actual_fee: txResult.fee
            });

            console.log(`✅ Withdrawal ${id} completed`);
            console.log(`   TX Hash: ${txResult.txHash}`);
            console.log(`   Fee: ${txResult.fee} ${currency}`);

            // Send notification to user
            await this.notifyWithdrawalCompleted(withdrawal, txResult);

        } catch (err) {
            console.error(`❌ Error processing withdrawal ${id}:`, err.message);

            // Update to FAILED status
            await this.updateWithdrawalStatus(id, 'FAILED', {
                rejection_reason: err.message,
                notes: `Failed: ${err.message}`
            });

            // Refund user balance
            await this.refundWithdrawal(withdrawal);
        }
    }

    /**
     * Send BTC transaction
     */
    async sendBTCTransaction(toAddress, amount) {
        console.log(`🔐 Signing BTC transaction...`);

        if (this.config.testMode) {
            // Simulate transaction in test mode
            return {
                txHash: `test_btc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                txUrl: `https://mempool.space/testnet/tx/test`,
                fee: 0.00001
            };
        }

        try {
            // Get hot wallet key pair
            const keyPair = this.btcWallet.getHotWalletKeyPair();
            const hotWalletAddress = this.btcWallet.getHotWalletAddress();

            // Fetch UTXOs for hot wallet
            const utxos = await this.btcWallet.getUTXOs(hotWalletAddress);

            if (!utxos || utxos.length === 0) {
                throw new Error('No UTXOs available in hot wallet');
            }

            // Estimate fee (using mempool.space recommended fees)
            const feeRate = await this.estimateBTCFee(); // sats/vByte

            // Build transaction
            const network = this.config.testMode ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
            const psbt = new bitcoin.Psbt({ network });

            // Add inputs
            let inputValue = 0;
            for (const utxo of utxos) {
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: Buffer.from(utxo.scriptPubKey, 'hex'),
                        value: utxo.value
                    }
                });
                inputValue += utxo.value;

                // Add enough inputs to cover amount + fee
                const amountSats = Math.floor(amount * 100000000);
                const estimatedFee = feeRate * 250; // Rough estimate
                if (inputValue >= amountSats + estimatedFee) break;
            }

            const amountSats = Math.floor(amount * 100000000);

            // Add output (recipient)
            psbt.addOutput({
                address: toAddress,
                value: amountSats
            });

            // Calculate actual fee and change
            const txSize = this.estimateBTCTransactionSize(psbt.txInputs.length, 2);
            const fee = feeRate * txSize;
            const change = inputValue - amountSats - fee;

            // Add change output if significant
            if (change > 546) { // Dust limit
                psbt.addOutput({
                    address: hotWalletAddress,
                    value: change
                });
            }

            // Sign all inputs
            for (let i = 0; i < psbt.txInputs.length; i++) {
                psbt.signInput(i, keyPair);
            }

            // Finalize and extract transaction
            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();
            const txHash = tx.getId();

            // Broadcast transaction
            await this.broadcastBTCTransaction(txHex);

            return {
                txHash,
                txUrl: `https://mempool.space/${this.config.testMode ? 'testnet/' : ''}tx/${txHash}`,
                fee: fee / 100000000
            };

        } catch (err) {
            console.error('❌ BTC transaction error:', err);
            throw new Error(`BTC transaction failed: ${err.message}`);
        }
    }

    /**
     * Send ETH transaction
     */
    async sendETHTransaction(toAddress, amount) {
        console.log(`🔐 Signing ETH transaction...`);

        if (this.config.testMode) {
            // Simulate transaction in test mode
            return {
                txHash: `0xtest${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
                txUrl: `https://etherscan.io/tx/0xtest`,
                fee: 0.001
            };
        }

        try {
            // Get provider and wallet
            const provider = this.ethWallet.getProvider();
            const wallet = this.ethWallet.getHotWallet();

            // Get current gas price
            const gasPrice = await provider.getGasPrice();
            const gasLimit = 21000; // Standard ETH transfer

            // Build transaction
            const tx = {
                to: toAddress,
                value: ethers.utils.parseEther(amount.toString()),
                gasLimit,
                gasPrice
            };

            // Send transaction
            const txResponse = await wallet.sendTransaction(tx);
            console.log(`📡 Broadcasting ETH transaction: ${txResponse.hash}`);

            // Wait for confirmation
            await txResponse.wait(1);

            const fee = ethers.utils.formatEther(gasPrice.mul(gasLimit));

            return {
                txHash: txResponse.hash,
                txUrl: `https://${this.config.testMode ? 'sepolia.' : ''}etherscan.io/tx/${txResponse.hash}`,
                fee: parseFloat(fee)
            };

        } catch (err) {
            console.error('❌ ETH transaction error:', err);
            throw new Error(`ETH transaction failed: ${err.message}`);
        }
    }

    /**
     * Broadcast BTC transaction to network
     */
    async broadcastBTCTransaction(txHex) {
        const url = this.config.testMode
            ? 'https://mempool.space/testnet/api/tx'
            : 'https://mempool.space/api/tx';

        const response = await fetch(url, {
            method: 'POST',
            body: txHex
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Broadcast failed: ${error}`);
        }

        return await response.text(); // Returns txid
    }

    /**
     * Estimate BTC fee rate
     */
    async estimateBTCFee() {
        try {
            const url = this.config.testMode
                ? 'https://mempool.space/testnet/api/v1/fees/recommended'
                : 'https://mempool.space/api/v1/fees/recommended';

            const response = await fetch(url);
            const fees = await response.json();

            // Use "halfHour" target (moderate speed)
            return fees.halfHourFee || 20; // Default 20 sats/vByte

        } catch (err) {
            console.error('⚠️  Fee estimation failed, using default');
            return 20;
        }
    }

    /**
     * Estimate BTC transaction size
     */
    estimateBTCTransactionSize(inputs, outputs) {
        // P2WPKH: ~68 vBytes per input, ~31 vBytes per output, ~10.5 vBytes overhead
        return Math.ceil((inputs * 68) + (outputs * 31) + 10.5);
    }

    /**
     * Check hot wallet balances
     */
    async checkHotWalletBalances() {
        const balances = {};

        try {
            // BTC balance
            const btcAddress = this.btcWallet.getHotWalletAddress();
            const btcUtxos = await this.btcWallet.getUTXOs(btcAddress);
            balances.BTC = btcUtxos.reduce((sum, utxo) => sum + utxo.value, 0) / 100000000;

            // ETH balance
            const ethWallet = this.ethWallet.getHotWallet();
            const ethBalance = await ethWallet.getBalance();
            balances.ETH = parseFloat(ethers.utils.formatEther(ethBalance));

            console.log('💰 Hot Wallet Balances:');
            console.log(`   BTC: ${balances.BTC.toFixed(8)}`);
            console.log(`   ETH: ${balances.ETH.toFixed(6)}`);

            // Check if below minimums
            for (const [currency, balance] of Object.entries(balances)) {
                const min = this.config.minHotWalletBalance[currency];
                if (balance < min) {
                    console.warn(`⚠️  ${currency} balance (${balance}) below minimum (${min})`);
                    await this.alertLowBalance(currency, balance, min);
                }
            }

            return balances;

        } catch (err) {
            console.error('❌ Error checking balances:', err);
            return { BTC: 0, ETH: 0 };
        }
    }

    /**
     * Validate crypto address
     */
    validateAddress(address, currency) {
        if (currency === 'BTC') {
            // Bitcoin address validation
            const btcRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,90}$/;
            return btcRegex.test(address);
        } else if (currency === 'ETH') {
            // Ethereum address validation
            return /^0x[a-fA-F0-9]{40}$/.test(address);
        }
        return false;
    }

    /**
     * Update withdrawal status
     */
    async updateWithdrawalStatus(id, status, additionalFields = {}) {
        const updates = {
            status,
            updated_at: new Date().toISOString(),
            ...additionalFields
        };

        const { error } = await this.supabase
            .from('withdrawals')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error(`❌ Error updating withdrawal ${id}:`, error);
        } else {
            console.log(`📝 Withdrawal ${id} status updated to ${status}`);
        }
    }

    /**
     * Refund withdrawal to user balance
     */
    async refundWithdrawal(withdrawal) {
        try {
            console.log(`💸 Refunding withdrawal ${withdrawal.id}`);

            // Increment user balance
            const { error: refundError } = await this.supabase
                .rpc('increment_balance', {
                    user_id: withdrawal.user_id,
                    amount: parseFloat(withdrawal.amount)
                });

            if (refundError) {
                console.error('❌ Refund error:', refundError);
                return;
            }

            // Create refund transaction record
            await this.supabase
                .from('transactions')
                .insert({
                    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    user_id: withdrawal.user_id,
                    type: 'DEPOSIT',
                    amount: withdrawal.amount,
                    description: `Withdrawal ${withdrawal.id} failed - refund`,
                    timestamp: Date.now()
                });

            console.log(`✅ Withdrawal ${withdrawal.id} refunded`);

        } catch (err) {
            console.error(`❌ Error refunding withdrawal ${withdrawal.id}:`, err);
        }
    }

    /**
     * Alert on low balance
     */
    async alertLowBalance(currency, currentBalance, requiredBalance) {
        const message = `🚨 HOT WALLET LOW BALANCE ALERT\n` +
                       `Currency: ${currency}\n` +
                       `Current: ${currentBalance}\n` +
                       `Required: ${requiredBalance || this.config.minHotWalletBalance[currency]}\n` +
                       `Action: Refill hot wallet immediately`;

        console.error(message);

        // Send webhook alert if configured
        if (this.config.alertWebhookUrl) {
            try {
                await fetch(this.config.alertWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'LOW_BALANCE_ALERT',
                        currency,
                        currentBalance,
                        requiredBalance,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.error('Failed to send alert webhook:', err);
            }
        }
    }

    /**
     * Notify user of completed withdrawal
     */
    async notifyWithdrawalCompleted(withdrawal, txResult) {
        try {
            // Create in-app notification
            const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await this.supabase
                .from('notifications')
                .insert({
                    id: notificationId,
                    user_id: withdrawal.user_id,
                    type: 'WITHDRAWAL_COMPLETED',
                    title: 'Withdrawal Completed',
                    message: `Your ${withdrawal.currency} withdrawal of $${withdrawal.amount.toFixed(2)} has been sent!`,
                    data: {
                        currency: withdrawal.currency,
                        amount: withdrawal.amount,
                        address: withdrawal.address,
                        tx_hash: txResult.txHash,
                        tx_url: txResult.txUrl
                    },
                    read: false,
                    created_at: new Date().toISOString()
                });
            console.log(`  🔔 Notification created for withdrawal completion`);
        } catch (notifError) {
            console.error(`  ⚠️  Failed to create notification:`, notifError.message);
            // Don't fail the withdrawal if notification fails
        }

        // TODO: Integrate with email service
        console.log(`📧 Notification: Withdrawal ${withdrawal.id} completed for user ${withdrawal.user_id}`);
        console.log(`   TX: ${txResult.txUrl}`);
    }
}

module.exports = WithdrawalProcessor;
