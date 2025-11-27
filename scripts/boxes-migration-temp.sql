-- Boxes table for storing loot boxes
CREATE TABLE IF NOT EXISTS boxes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2),
    image TEXT NOT NULL,
    color TEXT NOT NULL, -- Tailwind gradient classes
    category TEXT NOT NULL CHECK (category IN ('ALL', 'STREETWEAR', 'TECH', 'POKEMON', 'GIFT_CARDS', 'GAME_CODES', 'FOOD', 'SUBSCRIPTIONS', 'CRYPTO')),
    tags TEXT[], -- Array of tags: HOT, NEW, FEATURED, SALE
    items JSONB NOT NULL, -- Array of LootItem objects
    enabled BOOLEAN DEFAULT TRUE,
    featured_order INTEGER, -- For sorting featured boxes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT, -- Admin user ID
    updated_by TEXT
);

-- Box opening history table
CREATE TABLE IF NOT EXISTS box_openings (
    id TEXT PRIMARY KEY,
    box_id TEXT NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_won JSONB NOT NULL, -- The LootItem that was won
    box_price DECIMAL(10, 2) NOT NULL,
    item_value DECIMAL(10, 2) NOT NULL,
    profit_loss DECIMAL(10, 2) NOT NULL, -- item_value - box_price
    client_seed TEXT NOT NULL,
    server_seed TEXT NOT NULL,
    nonce INTEGER NOT NULL,
    random_value DECIMAL(20, 16) NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('KEPT', 'SOLD', 'SHIPPED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_boxes_category ON boxes(category);
CREATE INDEX IF NOT EXISTS idx_boxes_enabled ON boxes(enabled);
CREATE INDEX IF NOT EXISTS idx_boxes_created_at ON boxes(created_at);
CREATE INDEX IF NOT EXISTS idx_box_openings_user_id ON box_openings(user_id);
CREATE INDEX IF NOT EXISTS idx_box_openings_box_id ON box_openings(box_id);
CREATE INDEX IF NOT EXISTS idx_box_openings_created_at ON box_openings(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_boxes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on box updates
CREATE TRIGGER boxes_updated_at_trigger
BEFORE UPDATE ON boxes
FOR EACH ROW
EXECUTE FUNCTION update_boxes_updated_at();
