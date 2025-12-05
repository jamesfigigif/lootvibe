const { ethers } = require('ethers');

class ETHWalletService {
    constructor() {
        // IMPORTANT: In production, this should be stored securely (env variable, HSM, etc.)
        // For now, we'll generate a new one or use from env
        const mnemonic = process.env.ETH_MASTER_SEED || ethers.Wallet.createRandom().mnemonic.phrase;
        this.hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);

        console.log('⚠️  ETH Wallet initialized');
        if (!process.env.ETH_MASTER_SEED) {
            console.log('⚠️  WARNING: No ETH_MASTER_SEED found. Generated new mnemonic:');
            console.log('⚠️  SAVE THIS SECURELY:', mnemonic);
        }
    }

    /**
     * Generate a unique ETH address for a user
     * Uses BIP44 derivation path: m/44'/60'/0'/0/index
     */
    generateAddress(userIndex) {
        // Derive the account path step by step
        // m/44'/60'/0'/0/index
        const wallet = this.hdNode
            .deriveChild(44 + 0x80000000)  // 44' (hardened)
            .deriveChild(60 + 0x80000000)  // 60' (hardened, ETH coin type)
            .deriveChild(0 + 0x80000000)   // 0' (hardened, account)
            .deriveChild(0)                 // 0 (external chain)
            .deriveChild(userIndex);        // index (address index)

        const path = `m/44'/60'/0'/0/${userIndex}`;

        return {
            address: wallet.address,
            derivationPath: path,
            publicKey: wallet.publicKey
        };
    }

    /**
     * Verify if an address belongs to this wallet
     */
    verifyAddress(address, userIndex) {
        try {
            const wallet = this.hdNode
                .deriveChild(44 + 0x80000000)
                .deriveChild(60 + 0x80000000)
                .deriveChild(0 + 0x80000000)
                .deriveChild(0)
                .deriveChild(userIndex);
            return wallet.address.toLowerCase() === address.toLowerCase();
        } catch (error) {
            return false;
        }
    }

    /**
     * Get hot wallet (index 0)
     */
    getHotWallet() {
        const wallet = this.hdNode
            .deriveChild(44 + 0x80000000)  // 44' (hardened)
            .deriveChild(60 + 0x80000000)  // 60' (hardened, ETH coin type)
            .deriveChild(0 + 0x80000000)   // 0' (hardened, account)
            .deriveChild(0)                 // 0 (external chain)
            .deriveChild(0);                // index 0 = hot wallet

        // Connect to provider
        const provider = this.getProvider();
        return wallet.connect(provider);
    }

    /**
     * Get Ethereum provider
     */
    getProvider() {
        const rpcUrl = process.env.ETH_RPC_URL || process.env.NODE_ENV === 'development'
            ? 'https://sepolia.infura.io/v3/' + (process.env.INFURA_API_KEY || '')
            : 'https://mainnet.infura.io/v3/' + (process.env.INFURA_API_KEY || '');

        return new ethers.JsonRpcProvider(rpcUrl);
    }
    /**
     * Get balance of hot wallet
     */
    async getBalance() {
        try {
            const wallet = this.getHotWallet();
            const balance = await this.getProvider().getBalance(wallet.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Error getting ETH balance:', error);
            return '0.0';
        }
    }
}

module.exports = ETHWalletService;
