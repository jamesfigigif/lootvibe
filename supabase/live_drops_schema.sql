CREATE TABLE live_drops (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_image TEXT NOT NULL,
    box_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
