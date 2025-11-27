const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const bip39 = require('bip39');

const bip32 = BIP32Factory(ecc);

class BTCWalletService {
    constructor() {
        // IMPORTANT: In production, this should be stored securely (env variable, HSM, etc.)
        // For now, we'll generate a new one or use from env
        this.mnemonic = process.env.BTC_MASTER_SEED || bip39.generateMnemonic();
        this.network = bitcoin.networks.bitcoin; // Use bitcoin.networks.testnet for testing

        // Generate master key from mnemonic
        const seed = bip39.mnemonicToSeedSync(this.mnemonic);
        this.masterKey = bip32.fromSeed(seed, this.network);

        console.log('⚠️  BTC Wallet initialized');
        if (!process.env.BTC_MASTER_SEED) {
            console.log('⚠️  WARNING: No BTC_MASTER_SEED found. Generated new mnemonic:');
            console.log('⚠️  SAVE THIS SECURELY:', this.mnemonic);
        }
    }

    /**
     * Generate a unique BTC address for a user
     * Uses BIP44 derivation path: m/44'/0'/0'/0/index
     */
    generateAddress(userIndex) {
        // BIP44 path for Bitcoin: m/44'/0'/0'/0/index
        const path = `m/44'/0'/0'/0/${userIndex}`;
        const child = this.masterKey.derivePath(path);

        // Generate P2WPKH (native segwit) address
        const { address } = bitcoin.payments.p2wpkh({
            pubkey: child.publicKey,
            network: this.network
        });

        return {
            address,
            derivationPath: path,
            publicKey: child.publicKey.toString('hex')
        };
    }

    /**
     * Verify if an address belongs to this wallet
     */
    verifyAddress(address, derivationPath) {
        try {
            const child = this.masterKey.derivePath(derivationPath);
            const { address: generatedAddress } = bitcoin.payments.p2wpkh({
                pubkey: child.publicKey,
                network: this.network
            });
            return generatedAddress === address;
        } catch (error) {
            return false;
        }
    }
}

module.exports = BTCWalletService;
