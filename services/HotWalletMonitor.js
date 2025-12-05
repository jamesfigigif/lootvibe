const { ethers } = require('ethers');

/**
 * HotWalletMonitor - Monitors hot wallet balances and alerts when low
 *
 * Features:
 * - Real-time balance tracking for BTC and ETH
 * - Configurable alert thresholds
 * - Webhook notifications
 * - Balance history tracking
 * - Automatic cold wallet transfer recommendations
 */
class HotWalletMonitor {
    constructor(supabase, btcWallet, ethWallet, options = {}) {
        this.supabase = supabase;
        this.btcWallet = btcWallet;
        this.ethWallet = ethWallet;

        // Configuration
        this.config = {
            checkInterval: options.checkInterval || 60000, // 1 minute
            alertThresholds: {
                BTC: {
                    critical: options.btcCritical || 0.05,  // 0.05 BTC
                    warning: options.btcWarning || 0.1,     // 0.1 BTC
                    target: options.btcTarget || 0.5        // 0.5 BTC ideal
                },
                ETH: {
                    critical: options.ethCritical || 0.5,   // 0.5 ETH
                    warning: options.ethWarning || 1.0,     // 1.0 ETH
                    target: options.ethTarget || 5.0        // 5.0 ETH ideal
                }
            },
            alertWebhookUrl: options.alertWebhookUrl || null,
            discordWebhookUrl: options.discordWebhookUrl || null
        };

        this.isRunning = false;
        this.monitorTimer = null;
        this.lastBalances = { BTC: 0, ETH: 0 };
        this.lastAlertTime = {};

        console.log('🔍 HotWalletMonitor initialized');
        console.log(`   BTC Thresholds: Critical=${this.config.alertThresholds.BTC.critical}, Warning=${this.config.alertThresholds.BTC.warning}`);
        console.log(`   ETH Thresholds: Critical=${this.config.alertThresholds.ETH.critical}, Warning=${this.config.alertThresholds.ETH.warning}`);
    }

    /**
     * Start monitoring
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  HotWalletMonitor already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 HotWalletMonitor started');

        // Initial check
        this.checkBalances();

        // Set up recurring checks
        this.monitorTimer = setInterval(() => {
            this.checkBalances();
        }, this.config.checkInterval);
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (!this.isRunning) return;

        clearInterval(this.monitorTimer);
        this.isRunning = false;
        console.log('🛑 HotWalletMonitor stopped');
    }

    /**
     * Check all wallet balances
     */
    async checkBalances() {
        try {
            const balances = await this.getAllBalances();

            // Check each currency for alerts
            for (const [currency, balance] of Object.entries(balances)) {
                await this.checkThresholds(currency, balance);
            }

            // Log balance changes
            this.logBalanceChanges(balances);

            // Store in database for historical tracking
            await this.recordBalances(balances);

            this.lastBalances = balances;

        } catch (err) {
            console.error('❌ Error checking balances:', err);
        }
    }

    /**
     * Get all wallet balances
     */
    async getAllBalances() {
        const balances = {};

        try {
            // BTC Balance
            const btcAddress = this.btcWallet.getHotWalletAddress();
            if (btcAddress) {
                const btcBalance = await this.getBTCBalance(btcAddress);
                balances.BTC = btcBalance;
            } else {
                balances.BTC = 0;
            }

            // ETH Balance
            const ethBalance = await this.ethWallet.getBalance();
            balances.ETH = parseFloat(ethBalance);

            return balances;

        } catch (err) {
            console.error('❌ Error fetching balances:', err);
            return { BTC: 0, ETH: 0 };
        }
    }

    /**
     * Get BTC balance from blockchain
     */
    async getBTCBalance(address) {
        try {
            const testnet = process.env.NODE_ENV === 'development';
            const baseUrl = testnet ? 'https://mempool.space/testnet' : 'https://mempool.space';

            // Get UTXOs
            const response = await fetch(`${baseUrl}/api/address/${address}/utxo`);
            if (!response.ok) {
                throw new Error(`Failed to fetch BTC UTXOs: ${response.statusText}`);
            }

            const utxos = await response.json();

            // Sum up all UTXO values
            const totalSatoshis = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
            const btcBalance = totalSatoshis / 100000000;

            return btcBalance;

        } catch (err) {
            console.error('❌ Error fetching BTC balance:', err);
            return 0;
        }
    }

    /**
     * Check balance thresholds and trigger alerts
     */
    async checkThresholds(currency, balance) {
        const thresholds = this.config.alertThresholds[currency];
        if (!thresholds) return;

        const now = Date.now();
        const lastAlert = this.lastAlertTime[currency] || 0;
        const alertCooldown = 3600000; // 1 hour

        // Critical threshold
        if (balance <= thresholds.critical) {
            if (now - lastAlert > alertCooldown) {
                await this.sendAlert({
                    level: 'CRITICAL',
                    currency,
                    balance,
                    threshold: thresholds.critical,
                    message: `🚨 CRITICAL: ${currency} hot wallet balance critically low!`,
                    action: 'IMMEDIATE ACTION REQUIRED: Refill hot wallet'
                });
                this.lastAlertTime[currency] = now;
            }
        }
        // Warning threshold
        else if (balance <= thresholds.warning) {
            if (now - lastAlert > alertCooldown) {
                await this.sendAlert({
                    level: 'WARNING',
                    currency,
                    balance,
                    threshold: thresholds.warning,
                    message: `⚠️  WARNING: ${currency} hot wallet balance low`,
                    action: 'Consider refilling hot wallet soon'
                });
                this.lastAlertTime[currency] = now;
            }
        }
    }

    /**
     * Send alert via multiple channels
     */
    async sendAlert(alert) {
        const { level, currency, balance, threshold, message, action } = alert;

        console.error(`\n${'='.repeat(60)}`);
        console.error(message);
        console.error(`Currency: ${currency}`);
        console.error(`Current Balance: ${balance.toFixed(8)} ${currency}`);
        console.error(`Threshold: ${threshold} ${currency}`);
        console.error(`Action: ${action}`);
        console.error(`${'='.repeat(60)}\n`);

        // Send webhook alert
        if (this.config.alertWebhookUrl) {
            try {
                await fetch(this.config.alertWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'HOT_WALLET_ALERT',
                        level,
                        currency,
                        balance,
                        threshold,
                        message,
                        action,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch (err) {
                console.error('Failed to send webhook alert:', err);
            }
        }

        // Send Discord alert
        if (this.config.discordWebhookUrl) {
            await this.sendDiscordAlert(alert);
        }

        // Store alert in database
        await this.recordAlert(alert);
    }

    /**
     * Send Discord notification
     */
    async sendDiscordAlert(alert) {
        const { level, currency, balance, threshold, message, action } = alert;

        const color = level === 'CRITICAL' ? 0xFF0000 : 0xFFA500; // Red or Orange
        const emoji = level === 'CRITICAL' ? '🚨' : '⚠️';

        const embed = {
            title: `${emoji} Hot Wallet ${level} Alert`,
            description: message,
            color,
            fields: [
                {
                    name: 'Currency',
                    value: currency,
                    inline: true
                },
                {
                    name: 'Current Balance',
                    value: `${balance.toFixed(8)} ${currency}`,
                    inline: true
                },
                {
                    name: 'Threshold',
                    value: `${threshold} ${currency}`,
                    inline: true
                },
                {
                    name: 'Action Required',
                    value: action,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'LootVibe Hot Wallet Monitor'
            }
        };

        try {
            await fetch(this.config.discordWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] })
            });
        } catch (err) {
            console.error('Failed to send Discord alert:', err);
        }
    }

    /**
     * Log balance changes
     */
    logBalanceChanges(newBalances) {
        for (const [currency, balance] of Object.entries(newBalances)) {
            const lastBalance = this.lastBalances[currency] || 0;
            const change = balance - lastBalance;

            if (Math.abs(change) > 0.00000001) { // Significant change
                const direction = change > 0 ? '📈' : '📉';
                console.log(`${direction} ${currency} balance changed: ${lastBalance.toFixed(8)} → ${balance.toFixed(8)} (${change > 0 ? '+' : ''}${change.toFixed(8)})`);
            }
        }
    }

    /**
     * Record balances in database for historical tracking
     */
    async recordBalances(balances) {
        try {
            const record = {
                btc_balance: balances.BTC || 0,
                eth_balance: balances.ETH || 0,
                recorded_at: new Date().toISOString()
            };

            await this.supabase
                .from('hot_wallet_balances')
                .insert(record);

        } catch (err) {
            // Table might not exist, that's okay
            if (!err.message?.includes('relation "hot_wallet_balances" does not exist')) {
                console.error('Error recording balances:', err);
            }
        }
    }

    /**
     * Record alert in database
     */
    async recordAlert(alert) {
        try {
            const record = {
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                level: alert.level,
                currency: alert.currency,
                balance: alert.balance,
                threshold: alert.threshold,
                message: alert.message,
                action: alert.action,
                created_at: new Date().toISOString()
            };

            await this.supabase
                .from('hot_wallet_alerts')
                .insert(record);

        } catch (err) {
            // Table might not exist, that's okay
            if (!err.message?.includes('relation "hot_wallet_alerts" does not exist')) {
                console.error('Error recording alert:', err);
            }
        }
    }

    /**
     * Get current balances (non-async, cached)
     */
    getCurrentBalances() {
        return this.lastBalances;
    }

    /**
     * Get balance for specific currency
     */
    getBalance(currency) {
        return this.lastBalances[currency] || 0;
    }

    /**
     * Check if balance is sufficient for withdrawal
     */
    hasSufficientBalance(currency, amount) {
        const balance = this.getBalance(currency);
        return balance >= amount;
    }

    /**
     * Get recommended refill amount
     */
    getRefillRecommendation(currency) {
        const balance = this.getBalance(currency);
        const target = this.config.alertThresholds[currency].target;
        const needed = Math.max(0, target - balance);

        return {
            currency,
            currentBalance: balance,
            targetBalance: target,
            recommendedRefill: needed,
            urgent: balance <= this.config.alertThresholds[currency].critical
        };
    }

    /**
     * Get all refill recommendations
     */
    getAllRefillRecommendations() {
        return {
            BTC: this.getRefillRecommendation('BTC'),
            ETH: this.getRefillRecommendation('ETH')
        };
    }
}

module.exports = HotWalletMonitor;
