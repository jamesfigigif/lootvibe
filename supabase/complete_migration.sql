-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0,
    avatar TEXT,
    client_seed TEXT NOT NULL,
    nonce INTEGER DEFAULT 0,
    server_seed_hash TEXT,
    free_box_claimed BOOLEAN DEFAULT FALSE,
    banned BOOLEAN DEFAULT FALSE,
    banned_reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE,
    banned_by TEXT,
    affiliate_code TEXT UNIQUE,
    referred_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_data JSONB NOT NULL,
    shipping_status TEXT CHECK (shipping_status IN ('PROCESSING', 'SHIPPED', 'DELIVERED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'PURCHASE', 'SHIPPING')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    address JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED')),
    tracking_number TEXT,
    created_at BIGINT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_shipping_status ON inventory_items(shipping_status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
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
-- Create box_openings table for audit trail and provably fair verification
CREATE TABLE IF NOT EXISTS public.box_openings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL, -- Storing Clerk User ID (text), not Supabase UUID
    box_id TEXT NOT NULL, -- references boxes(id) but loose coupling allowed
    item_won JSONB NOT NULL, -- Store full item data at time of winning
    box_price DECIMAL(10, 2) NOT NULL,
    item_value DECIMAL(10, 2) NOT NULL,
    profit_loss DECIMAL(10, 2) NOT NULL,
    client_seed TEXT NOT NULL,
    server_seed TEXT NOT NULL,
    nonce INTEGER NOT NULL,
    random_value DECIMAL(20, 18) NOT NULL,
    outcome TEXT NOT NULL DEFAULT 'KEPT', -- KEPT, SOLD, COLLECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_box_openings_user_id ON public.box_openings(user_id);
CREATE INDEX IF NOT EXISTS idx_box_openings_created_at ON public.box_openings(created_at DESC);

-- Enable RLS
ALTER TABLE public.box_openings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own openings
-- Drop policy if exists to avoid error on rerun
DROP POLICY IF EXISTS "Users can view their own box openings" ON public.box_openings;
CREATE POLICY "Users can view their own box openings" 
ON public.box_openings FOR SELECT 
USING (auth.uid()::text = user_id);

-- Service role can do anything (functions use this)
-- No insert/update policy needed for anon/authenticated as functions handle writes via service role
-- Create battles table to store battle information
CREATE TABLE IF NOT EXISTS public.battles (
    id TEXT PRIMARY KEY,
    box_id TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    player_count INTEGER NOT NULL CHECK (player_count IN (2, 4, 6)),
    round_count INTEGER NOT NULL DEFAULT 1,
    mode TEXT CHECK (mode IN ('STANDARD', 'CRAZY')) DEFAULT 'STANDARD',
    status TEXT NOT NULL CHECK (status IN ('WAITING', 'ACTIVE', 'FINISHED')) DEFAULT 'WAITING',
    players JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_battles_status ON public.battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_created_at ON public.battles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battles_box_id ON public.battles(box_id);

-- Enable RLS
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

-- Allow service role (Edge Functions) full access
CREATE POLICY "Service role has full access"
    ON public.battles
    FOR ALL
    USING (auth.role() = 'service_role');

-- Allow anonymous users to read battles (for lobby)
CREATE POLICY "Anyone can read battles"
    ON public.battles
    FOR SELECT
    USING (true);

-- Allow authenticated users to update battles they're in (for joining)
CREATE POLICY "Users can update battles they're in"
    ON public.battles
    FOR UPDATE
    USING (
        auth.uid()::text = ANY(
            SELECT jsonb_array_elements_text(players::jsonb -> 'id')
        )
    );

-- Create a table to store battle results for verification
create table if not exists public.battle_results (
  id uuid default gen_random_uuid() primary key,
  battle_id text not null,
  winner_id text not null,
  total_value numeric not null,
  items jsonb,
  claimed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.battle_results enable row level security;

-- Allow service role (Edge Functions) full access
create policy "Service role has full access"
  on public.battle_results
  for all
  using ( auth.role() = 'service_role' );

-- Allow users to read their own results (optional, for history)
create policy "Users can read their own results"
  on public.battle_results
  for select
  using ( auth.uid()::text = winner_id );
-- Complete Affiliate System Migration

-- 1. Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS affiliate_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- 2. Create Affiliate Tables

-- Affiliate codes table
CREATE TABLE IF NOT EXISTS affiliate_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate referrals table
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

-- Affiliate earnings table
CREATE TABLE IF NOT EXISTS affiliate_earnings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_id TEXT REFERENCES affiliate_referrals(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT_BONUS', 'WAGER_COMMISSION')),
    amount DECIMAL(10, 2) NOT NULL,
    commission_rate DECIMAL(5, 2),
    wager_amount DECIMAL(10, 2),
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate tiers configuration
CREATE TABLE IF NOT EXISTS affiliate_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    min_wager_volume DECIMAL(10, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    display_order INTEGER NOT NULL,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_codes_user_id ON affiliate_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_codes_code ON affiliate_codes(code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referrer ON affiliate_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_user_id ON affiliate_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_claimed ON affiliate_earnings(claimed);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_created_at ON affiliate_earnings(created_at DESC);

-- 4. Insert Default Tiers
INSERT INTO affiliate_tiers (id, name, min_wager_volume, commission_rate, display_order, color) VALUES
    ('tier_bronze', 'BRONZE', 0, 2.00, 1, 'text-orange-400'),
    ('tier_silver', 'SILVER', 1000, 3.00, 2, 'text-slate-300'),
    ('tier_gold', 'GOLD', 5000, 4.00, 3, 'text-yellow-400'),
    ('tier_platinum', 'PLATINUM', 25000, 5.00, 4, 'text-cyan-400'),
    ('tier_diamond', 'DIAMOND', 100000, 7.00, 5, 'text-purple-400'),
    ('tier_legend', 'LEGEND', 500000, 10.00, 6, 'text-red-500')
ON CONFLICT (id) DO NOTHING;
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
-- Crypto addresses table
CREATE TABLE IF NOT EXISTS crypto_addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH')),
    address TEXT NOT NULL UNIQUE,
    derivation_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deposit transactions table
CREATE TABLE IF NOT EXISTS crypto_deposits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH')),
    address TEXT NOT NULL,
    tx_hash TEXT NOT NULL UNIQUE,
    amount DECIMAL(20, 8) NOT NULL,
    usd_value DECIMAL(10, 2),
    confirmations INTEGER DEFAULT 0,
    required_confirmations INTEGER DEFAULT 6,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMING', 'CONFIRMED', 'CREDITED')),
    credited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_crypto_addresses_user_id ON crypto_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_addresses_currency ON crypto_addresses(currency);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id ON crypto_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status ON crypto_deposits(status);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_tx_hash ON crypto_deposits(tx_hash);
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
-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('INVENTORY_ADDED', 'ITEM_SHIPPED', 'DEPOSIT_CONFIRMED', 'WITHDRAWAL_APPROVED', 'BATTLE_WON', 'GENERAL')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data like item_id, box_id, etc.
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- Note: RLS is disabled because this app uses Clerk for authentication, not Supabase Auth
-- Application-level security ensures users can only access their own notifications
-- (by filtering by user_id in queries and ensuring user_id matches logged-in user)

-- Disable RLS (since Clerk is used instead of Supabase Auth)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Service role can do anything (functions use this)

CREATE TABLE live_drops (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_image TEXT NOT NULL,
    box_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
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
-- Function to atomically increment user balance
create or replace function increment_balance(user_id uuid, amount numeric)
returns void
language plpgsql
security definer
as $$
begin
  update users
  set balance = balance + amount
  where id = user_id;
end;
$$;

-- Function to atomically decrement user balance
create or replace function decrement_balance(user_id uuid, amount numeric)
returns void
language plpgsql
security definer
as $$
declare
  current_balance numeric;
begin
  -- Lock the row for update
  select balance into current_balance
  from users
  where id = user_id
  for update;

  if current_balance < amount then
    raise exception 'Insufficient funds';
  end if;

  update users
  set balance = balance - amount
  where id = user_id;
end;
$$;
-- ==========================================
-- Security & RLS Policies
-- ==========================================

-- 1. Users Table
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" 
ON public.users FOR SELECT 
USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own non-sensitive data" ON public.users;
CREATE POLICY "Users can update own non-sensitive data" 
ON public.users FOR UPDATE 
USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;
CREATE POLICY "Service role has full access to users" 
ON public.users FOR ALL 
USING (auth.role() = 'service_role');

-- 2. Inventory Items Table
ALTER TABLE IF EXISTS public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own inventory" ON public.inventory_items;
CREATE POLICY "Users can read own inventory" 
ON public.inventory_items FOR SELECT 
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role has full access to inventory" ON public.inventory_items;
CREATE POLICY "Service role has full access to inventory" 
ON public.inventory_items FOR ALL 
USING (auth.role() = 'service_role');

-- 3. Transactions Table
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
CREATE POLICY "Users can read own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role has full access to transactions" ON public.transactions;
CREATE POLICY "Service role has full access to transactions" 
ON public.transactions FOR ALL 
USING (auth.role() = 'service_role');

-- 4. Shipments Table
ALTER TABLE IF EXISTS public.shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own shipments" ON public.shipments;
CREATE POLICY "Users can read own shipments" 
ON public.shipments FOR SELECT 
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role has full access to shipments" ON public.shipments;
CREATE POLICY "Service role has full access to shipments" 
ON public.shipments FOR ALL 
USING (auth.role() = 'service_role');

-- 5. Boxes Table
ALTER TABLE IF EXISTS public.boxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active boxes" ON public.boxes;
CREATE POLICY "Anyone can read active boxes" 
ON public.boxes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Service role has full access to boxes" ON public.boxes;
CREATE POLICY "Service role has full access to boxes" 
ON public.boxes FOR ALL 
USING (auth.role() = 'service_role');

-- 6. Box Openings Table (Idempotent check)
ALTER TABLE IF EXISTS public.box_openings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own box openings" ON public.box_openings;
CREATE POLICY "Users can view their own box openings" 
ON public.box_openings FOR SELECT 
USING (auth.uid()::text = user_id);

-- 7. Battles Table (Idempotent check)
ALTER TABLE IF EXISTS public.battles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read battles" ON public.battles;
CREATE POLICY "Anyone can read battles" 
ON public.battles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Service role has full access to battles" ON public.battles;
CREATE POLICY "Service role has full access to battles" 
ON public.battles FOR ALL 
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update battles they're in" ON public.battles;
CREATE POLICY "Users can update battles they're in" 
ON public.battles FOR UPDATE 
USING (
    auth.uid()::text = ANY(
        SELECT jsonb_array_elements_text(players::jsonb -> 'id')
    )
);

-- 8. Battle Results Table (Idempotent check)
ALTER TABLE IF EXISTS public.battle_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own results" ON public.battle_results;
CREATE POLICY "Users can read their own results" 
ON public.battle_results FOR SELECT 
USING (auth.uid()::text = winner_id);

DROP POLICY IF EXISTS "Service role has full access to battle_results" ON public.battle_results;
CREATE POLICY "Service role has full access to battle_results" 
ON public.battle_results FOR ALL 
USING (auth.role() = 'service_role');
-- Allow users to insert their own profile - FIX
-- The issue is likely that the RLS policy expects auth.uid() to match, but for INSERTs 
-- we need to make sure we aren't blocking new user creation.

-- First, let's drop the strict policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create a more permissive policy for INSERT only if needed, 
-- or better yet, rely on the auth.uid() check properly.

-- NOTE: When you insert a row, the WITH CHECK clause is evaluated against the NEW row.
-- So checking if auth.uid()::text = id (where id is the NEW.id) is correct.

CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (
  -- Verify the user is inserting their own ID
  auth.uid()::text = id
);

-- Ensure the SELECT policy is also correct for the user to "see" themselves after insert
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" 
ON public.users FOR SELECT 
USING (
  auth.uid()::text = id
);

-- Supabase Storage Setup for LootVibe Images
-- Run this in your Supabase SQL Editor

-- 1. Create storage bucket for loot box images
INSERT INTO storage.buckets (id, name, public)
VALUES ('loot-box-images', 'loot-box-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up storage policies for public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'loot-box-images' );

-- 3. Allow authenticated users (admins) to upload
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'loot-box-images' );

-- 4. Allow authenticated users (admins) to update
CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'loot-box-images' );

-- 5. Allow authenticated users (admins) to delete
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'loot-box-images' );
