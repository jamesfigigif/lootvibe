-- Create boxes table in Supabase
CREATE TABLE IF NOT EXISTS boxes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2),
    image_url TEXT,
    color TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[],
    items JSONB NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_boxes_category ON boxes(category);
CREATE INDEX IF NOT EXISTS idx_boxes_active ON boxes(active);

-- Add comment for documentation
COMMENT ON TABLE boxes IS 'Loot boxes configuration with items and probabilities';
COMMENT ON COLUMN boxes.image_url IS 'Public URL of the box image from Supabase Storage';
COMMENT ON COLUMN boxes.items IS 'Array of items with {id, name, image, value, rarity, odds}';
