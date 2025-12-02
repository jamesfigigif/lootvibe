const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Fuckgambling123@db.cbjdasfnwzizfphnwxfd.supabase.co:5432/postgres'
});

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0,
    avatar TEXT,
    client_seed TEXT NOT NULL,
    nonce INTEGER DEFAULT 0,
    server_seed_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'PURCHASE')),
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
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
`;

async function createSchema() {
    try {
        await client.connect();
        console.log('✅ Connected to Supabase');

        await client.query(schema);
        console.log('✅ Schema created successfully');

        // Verify tables were created
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'inventory_items', 'transactions', 'shipments')
            ORDER BY table_name;
        `);

        console.log('\n📋 Created tables:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

createSchema();
