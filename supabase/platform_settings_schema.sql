-- Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    auto_approve_withdrawals BOOLEAN DEFAULT FALSE,
    manual_approval_threshold DECIMAL(10, 2) DEFAULT 1000.00,
    min_withdrawal_amount DECIMAL(10, 2) DEFAULT 25.00,
    max_withdrawal_amount DECIMAL(10, 2) DEFAULT 10000.00,
    withdrawal_fee_percentage DECIMAL(5, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT
);

-- Insert default settings
INSERT INTO platform_settings (id, auto_approve_withdrawals, manual_approval_threshold, min_withdrawal_amount, max_withdrawal_amount)
VALUES ('default', FALSE, 1000.00, 25.00, 10000.00)
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON COLUMN platform_settings.manual_approval_threshold IS 'Withdrawals above this USD amount require manual approval even if auto-approve is enabled. Helps prevent large fraudulent withdrawals.';
