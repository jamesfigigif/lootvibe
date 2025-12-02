-- Add manual approval threshold to platform_settings table
-- This allows auto-approval for withdrawals below a certain amount
-- Withdrawals above this threshold require manual approval even if auto-approve is enabled

-- First, ensure the column doesn't exist before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platform_settings' 
        AND column_name = 'manual_approval_threshold'
    ) THEN
        ALTER TABLE platform_settings 
        ADD COLUMN manual_approval_threshold DECIMAL(10, 2) DEFAULT 1000.00;
    END IF;
END $$;

-- Update default settings to include threshold
UPDATE platform_settings 
SET manual_approval_threshold = 1000.00
WHERE id = 'default' 
AND manual_approval_threshold IS NULL;

-- Add comment
COMMENT ON COLUMN platform_settings.manual_approval_threshold IS 'Withdrawals above this USD amount require manual approval even if auto-approve is enabled';


