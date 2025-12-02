-- Add 'enabled' column to boxes table if it doesn't exist
-- This handles the case where boxes table was created with 'active' instead of 'enabled'

-- Add enabled column if it doesn't exist
ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;

-- If enabled column was just added and active column exists, copy values
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'boxes' AND column_name = 'active'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'boxes' AND column_name = 'enabled'
    ) THEN
        -- Copy active values to enabled
        UPDATE boxes SET enabled = active WHERE enabled IS NULL;
    END IF;
END $$;

-- Create index on enabled if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_boxes_enabled ON boxes(enabled);

