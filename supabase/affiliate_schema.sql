-- Affiliate System Schema

-- Affiliate codes table - stores unique referral codes for each user
CREATE TABLE IF NOT EXISTS affiliate_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate referrals table - tracks which users were referred by whom
CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id TEXT PRIMARY KEY,
    referrer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    deposit_bonus_paid BOOLEAN DEFAULT FALSE,
    deposit_bonus_amount DECIMAL(10, 2) DEFAULT 0,
    first_deposit_amount DECIMAL(10, 2) DEFAULT 0,
    first_deposit_at TIMESTAMP WITH TIME ZONE,
    total_wagers DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate earnings table - records all earnings (deposit bonuses + commissions)
CREATE TABLE IF NOT EXISTS affiliate_earnings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_id TEXT REFERENCES affiliate_referrals(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT_BONUS', 'WAGER_COMMISSION')),
    amount DECIMAL(10, 2) NOT NULL,
    commission_rate DECIMAL(5, 2), -- Only for WAGER_COMMISSION type
    wager_amount DECIMAL(10, 2), -- Only for WAGER_COMMISSION type
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate tiers configuration - defines tier thresholds and commission rates
CREATE TABLE IF NOT EXISTS affiliate_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    min_wager_volume DECIMAL(10, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    display_order INTEGER NOT NULL,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_affiliate_codes_user_id ON affiliate_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_codes_code ON affiliate_codes(code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referrer ON affiliate_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_user_id ON affiliate_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_claimed ON affiliate_earnings(claimed);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_created_at ON affiliate_earnings(created_at DESC);

-- Insert default tier configuration
INSERT INTO affiliate_tiers (id, name, min_wager_volume, commission_rate, display_order, color) VALUES
    ('tier_bronze', 'BRONZE', 0, 2.00, 1, 'text-orange-400'),
    ('tier_silver', 'SILVER', 1000, 3.00, 2, 'text-slate-300'),
    ('tier_gold', 'GOLD', 5000, 4.00, 3, 'text-yellow-400'),
    ('tier_platinum', 'PLATINUM', 25000, 5.00, 4, 'text-cyan-400'),
    ('tier_diamond', 'DIAMOND', 100000, 7.00, 5, 'text-purple-400'),
    ('tier_legend', 'LEGEND', 500000, 10.00, 6, 'text-red-500')
ON CONFLICT (id) DO NOTHING;
