-- Add stats tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_wagered NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_profit NUMERIC DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_stats ON users(total_wagered, total_profit);

-- Update existing users to have 0 values
UPDATE users 
SET total_wagered = 0, total_profit = 0 
WHERE total_wagered IS NULL OR total_profit IS NULL;
