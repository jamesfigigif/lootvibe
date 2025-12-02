-- Add shipping_status column to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS shipping_status TEXT CHECK (shipping_status IN ('PROCESSING', 'SHIPPED', 'DELIVERED'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_shipping_status ON inventory_items(shipping_status);


