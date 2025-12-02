-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USD')),
    amount DECIMAL(10, 8) NOT NULL,
    usd_value DECIMAL(10, 2),
    withdrawal_address TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED')),

    -- Fee information
    fee_amount DECIMAL(10, 8) DEFAULT 0,
    net_amount DECIMAL(10, 8), -- amount - fee_amount

    -- Transaction details
    tx_hash TEXT,
    tx_url TEXT,

    -- Processing info
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Rejection info
    rejection_reason TEXT,

    -- Metadata
    notes TEXT,
    ip_address TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawal limits table (per user, configurable)
CREATE TABLE IF NOT EXISTS withdrawal_limits (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    daily_limit DECIMAL(10, 2) DEFAULT 10000,
    monthly_limit DECIMAL(10, 2) DEFAULT 100000,
    daily_withdrawn DECIMAL(10, 2) DEFAULT 0,
    monthly_withdrawn DECIMAL(10, 2) DEFAULT 0,
    last_daily_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_monthly_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_currency ON withdrawals(currency);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_processed_by ON withdrawals(processed_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_withdrawals_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_withdrawals_updated_at();

-- Insert default withdrawal settings into platform_settings
INSERT INTO platform_settings (key, value, description) VALUES
    ('require_manual_withdrawal_approval', '{"enabled": true}', 'Require manual admin approval for withdrawals'),
    ('min_withdrawal_amount', '{"btc": 0.001, "eth": 0.01, "usd": 10}', 'Minimum withdrawal amounts'),
    ('max_withdrawal_amount', '{"btc": 10, "eth": 100, "usd": 50000}', 'Maximum withdrawal amounts'),
    ('withdrawal_fee_percentage', '{"percentage": 2}', 'Withdrawal fee percentage'),
    ('auto_withdrawal_threshold', '{"usd_value": 1000}', 'Auto-approve withdrawals below this USD value (if manual approval disabled)')
ON CONFLICT (key) DO NOTHING;

-- Add withdrawal permission to admin roles
COMMENT ON TABLE withdrawals IS 'Tracks all user withdrawal requests and their processing status';
COMMENT ON COLUMN withdrawals.status IS 'PENDING: Awaiting approval, APPROVED: Admin approved, PROCESSING: Being sent, COMPLETED: Successfully sent, REJECTED: Admin rejected, FAILED: Technical failure';
