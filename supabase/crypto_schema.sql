-- Crypto addresses table
CREATE TABLE IF NOT EXISTS crypto_addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH')),
    address TEXT NOT NULL UNIQUE,
    derivation_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deposit transactions table
CREATE TABLE IF NOT EXISTS crypto_deposits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH')),
    address TEXT NOT NULL,
    tx_hash TEXT NOT NULL UNIQUE,
    amount DECIMAL(20, 8) NOT NULL,
    usd_value DECIMAL(10, 2),
    confirmations INTEGER DEFAULT 0,
    required_confirmations INTEGER DEFAULT 6,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMING', 'CONFIRMED', 'CREDITED')),
    credited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_crypto_addresses_user_id ON crypto_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_addresses_currency ON crypto_addresses(currency);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status ON crypto_deposits(status);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON crypto_deposits(tx_hash);
