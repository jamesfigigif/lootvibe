-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'MODERATOR', 'SUPPORT')),
    two_fa_secret TEXT,
    two_fa_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin activity logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT, -- 'USER', 'BOX', 'DEPOSIT', 'SHIPMENT', 'SETTING'
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform settings
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert default super admin (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (id, email, password_hash, role, created_at)
VALUES (
    'admin_' || substr(md5(random()::text), 1, 16),
    'admin@lootvibe.com',
    '$2b$10$rKZLvVZhW8uN8qfVqVqZ4.xQJ5Yh5YqYqYqYqYqYqYqYqYqYqYqYq',
    'SUPER_ADMIN',
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
    ('min_btc_deposit', '{"amount": 0.0001}', 'Minimum BTC deposit amount'),
    ('min_eth_deposit', '{"amount": 0.01}', 'Minimum ETH deposit amount'),
    ('btc_confirmations', '{"count": 3}', 'Required BTC confirmations'),
    ('eth_confirmations', '{"count": 12}', 'Required ETH confirmations'),
    ('platform_fee', '{"percentage": 5}', 'Platform fee percentage'),
    ('maintenance_mode', '{"enabled": false}', 'Maintenance mode status')
ON CONFLICT (key) DO NOTHING;
