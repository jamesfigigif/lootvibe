-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0,
    avatar TEXT,
    client_seed TEXT NOT NULL,
    nonce INTEGER DEFAULT 0,
    server_seed_hash TEXT,
    free_box_claimed BOOLEAN DEFAULT FALSE,
    banned BOOLEAN DEFAULT FALSE,
    banned_reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE,
    banned_by TEXT,
    affiliate_code TEXT UNIQUE,
    referred_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_data JSONB NOT NULL,
    shipping_status TEXT CHECK (shipping_status IN ('PROCESSING', 'SHIPPED', 'DELIVERED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'PURCHASE', 'SHIPPING')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    address JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED')),
    tracking_number TEXT,
    created_at BIGINT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_shipping_status ON inventory_items(shipping_status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
