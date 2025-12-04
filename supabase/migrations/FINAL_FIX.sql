-- ============================================
-- FINAL FIX - Run this complete migration
-- ============================================

-- First, drop the old function if it exists
DROP FUNCTION IF EXISTS run_withdrawal_migration();

-- Create a better version that checks table existence properly
CREATE OR REPLACE FUNCTION run_withdrawal_migration_v2()
RETURNS TABLE(step TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- STEP 1: Add vip_tier to users
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'vip_tier'
        ) THEN
            ALTER TABLE public.users ADD COLUMN vip_tier TEXT;
            RETURN QUERY SELECT 'users.vip_tier'::TEXT, 'Added'::TEXT;
        ELSE
            RETURN QUERY SELECT 'users.vip_tier'::TEXT, 'Already exists'::TEXT;
        END IF;
    END;

    -- STEP 2: Add email to users
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
        ) THEN
            ALTER TABLE public.users ADD COLUMN email TEXT;
            RETURN QUERY SELECT 'users.email'::TEXT, 'Added'::TEXT;
        ELSE
            RETURN QUERY SELECT 'users.email'::TEXT, 'Already exists'::TEXT;
        END IF;
    END;

    -- STEP 3: Add vip_tier constraint
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_vip_tier_check') THEN
            ALTER TABLE public.users ADD CONSTRAINT users_vip_tier_check
            CHECK (vip_tier IS NULL OR vip_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond'));
            RETURN QUERY SELECT 'users.vip_tier_check'::TEXT, 'Added'::TEXT;
        ELSE
            RETURN QUERY SELECT 'users.vip_tier_check'::TEXT, 'Already exists'::TEXT;
        END IF;
    END;

    -- STEP 4: Create indexes on users
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
        CREATE INDEX IF NOT EXISTS idx_users_vip_tier ON public.users(vip_tier);
        RETURN QUERY SELECT 'users indexes'::TEXT, 'Created'::TEXT;
    END;

    -- STEP 5: Add ip_address to withdrawals
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'ip_address'
        ) THEN
            ALTER TABLE public.withdrawals ADD COLUMN ip_address TEXT;
            RETURN QUERY SELECT 'withdrawals.ip_address'::TEXT, 'Added'::TEXT;
        ELSE
            RETURN QUERY SELECT 'withdrawals.ip_address'::TEXT, 'Already exists'::TEXT;
        END IF;
    END;

    -- STEP 6: Add actual_fee to withdrawals
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'withdrawals' AND column_name = 'actual_fee'
        ) THEN
            ALTER TABLE public.withdrawals ADD COLUMN actual_fee DECIMAL(10, 8);
            RETURN QUERY SELECT 'withdrawals.actual_fee'::TEXT, 'Added'::TEXT;
        ELSE
            RETURN QUERY SELECT 'withdrawals.actual_fee'::TEXT, 'Already exists'::TEXT;
        END IF;
    END;

    -- STEP 7: Update withdrawals status constraint
    BEGIN
        ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;
        ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_status_check
        CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED'));
        RETURN QUERY SELECT 'withdrawals.status_check'::TEXT, 'Updated'::TEXT;
    END;

    -- STEP 8: Drop withdrawal_limits if it exists (to recreate properly)
    BEGIN
        DROP TABLE IF EXISTS public.withdrawal_limits CASCADE;
        RETURN QUERY SELECT 'withdrawal_limits'::TEXT, 'Dropped old table'::TEXT;
    END;

    -- STEP 9: Create withdrawal_limits table fresh
    BEGIN
        CREATE TABLE public.withdrawal_limits (
            user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
            daily_limit DECIMAL(10, 2) DEFAULT 10000 NOT NULL,
            monthly_limit DECIMAL(10, 2) DEFAULT 100000 NOT NULL,
            daily_withdrawn DECIMAL(10, 2) DEFAULT 0 NOT NULL,
            monthly_withdrawn DECIMAL(10, 2) DEFAULT 0 NOT NULL,
            last_daily_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            last_monthly_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            vip_tier TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        RETURN QUERY SELECT 'withdrawal_limits'::TEXT, 'Created'::TEXT;
    END;

    -- STEP 10: Create indexes on withdrawal_limits
    BEGIN
        CREATE INDEX idx_withdrawal_limits_user_id ON public.withdrawal_limits(user_id);
        CREATE INDEX idx_withdrawal_limits_vip_tier ON public.withdrawal_limits(vip_tier);
        RETURN QUERY SELECT 'withdrawal_limits indexes'::TEXT, 'Created'::TEXT;
    END;

    -- STEP 11: Enable RLS on withdrawal_limits
    BEGIN
        ALTER TABLE public.withdrawal_limits ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view their own limits" ON public.withdrawal_limits;
        CREATE POLICY "Users can view their own limits"
        ON public.withdrawal_limits FOR SELECT
        USING (auth.uid()::text = user_id);

        DROP POLICY IF EXISTS "Service role has full access to limits" ON public.withdrawal_limits;
        CREATE POLICY "Service role has full access to limits"
        ON public.withdrawal_limits FOR ALL
        USING (auth.role() = 'service_role');

        GRANT SELECT ON public.withdrawal_limits TO authenticated;
        GRANT ALL ON public.withdrawal_limits TO service_role;
        RETURN QUERY SELECT 'withdrawal_limits RLS'::TEXT, 'Configured'::TEXT;
    END;

    -- STEP 12: Create hot_wallet_balances
    BEGIN
        CREATE TABLE IF NOT EXISTS public.hot_wallet_balances (
            id SERIAL PRIMARY KEY,
            btc_balance DECIMAL(10, 8) DEFAULT 0 NOT NULL,
            eth_balance DECIMAL(18, 8) DEFAULT 0 NOT NULL,
            recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_hot_wallet_balances_recorded_at ON public.hot_wallet_balances(recorded_at DESC);
        ALTER TABLE public.hot_wallet_balances ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Only service role can access balances" ON public.hot_wallet_balances;
        CREATE POLICY "Only service role can access balances"
        ON public.hot_wallet_balances FOR ALL
        USING (auth.role() = 'service_role');
        GRANT ALL ON public.hot_wallet_balances TO service_role;
        GRANT USAGE, SELECT ON SEQUENCE hot_wallet_balances_id_seq TO service_role;
        RETURN QUERY SELECT 'hot_wallet_balances'::TEXT, 'Created'::TEXT;
    END;

    -- STEP 13: Create hot_wallet_alerts
    BEGIN
        CREATE TABLE IF NOT EXISTS public.hot_wallet_alerts (
            id TEXT PRIMARY KEY,
            level TEXT NOT NULL CHECK (level IN ('CRITICAL', 'WARNING', 'INFO')),
            currency TEXT NOT NULL CHECK (currency IN ('BTC', 'ETH')),
            balance DECIMAL(18, 8) NOT NULL,
            threshold DECIMAL(18, 8) NOT NULL,
            message TEXT NOT NULL,
            action TEXT,
            resolved BOOLEAN DEFAULT FALSE,
            resolved_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_hot_wallet_alerts_created_at ON public.hot_wallet_alerts(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_hot_wallet_alerts_level ON public.hot_wallet_alerts(level);
        CREATE INDEX IF NOT EXISTS idx_hot_wallet_alerts_resolved ON public.hot_wallet_alerts(resolved);
        ALTER TABLE public.hot_wallet_alerts ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Only service role can access alerts" ON public.hot_wallet_alerts;
        CREATE POLICY "Only service role can access alerts"
        ON public.hot_wallet_alerts FOR ALL
        USING (auth.role() = 'service_role');
        GRANT ALL ON public.hot_wallet_alerts TO service_role;
        RETURN QUERY SELECT 'hot_wallet_alerts'::TEXT, 'Created'::TEXT;
    END;

    -- STEP 14: Create platform_settings
    BEGIN
        CREATE TABLE IF NOT EXISTS public.platform_settings (
            id TEXT PRIMARY KEY DEFAULT 'default',
            auto_approve_withdrawals BOOLEAN DEFAULT FALSE,
            manual_approval_threshold DECIMAL(10, 2) DEFAULT 1000,
            min_withdrawal_amount DECIMAL(10, 2) DEFAULT 25,
            max_withdrawal_amount DECIMAL(10, 2) DEFAULT 100000,
            btc_withdrawal_fee DECIMAL(10, 8) DEFAULT 0.0001,
            eth_withdrawal_fee DECIMAL(18, 8) DEFAULT 0.001,
            withdrawal_processing_enabled BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        INSERT INTO public.platform_settings (id, auto_approve_withdrawals, manual_approval_threshold)
        VALUES ('default', FALSE, 100)
        ON CONFLICT (id) DO NOTHING;
        ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Anyone can view settings" ON public.platform_settings;
        CREATE POLICY "Anyone can view settings"
        ON public.platform_settings FOR SELECT
        USING (true);
        DROP POLICY IF EXISTS "Only service role can modify settings" ON public.platform_settings;
        CREATE POLICY "Only service role can modify settings"
        ON public.platform_settings FOR ALL
        USING (auth.role() = 'service_role');
        GRANT SELECT ON public.platform_settings TO authenticated, anon;
        GRANT ALL ON public.platform_settings TO service_role;
        RETURN QUERY SELECT 'platform_settings'::TEXT, 'Created'::TEXT;
    END;

    -- STEP 15: Create helper functions
    BEGIN
        CREATE OR REPLACE FUNCTION reset_daily_withdrawal_limits()
        RETURNS void LANGUAGE plpgsql SECURITY DEFINER
        AS $func$
        BEGIN
            UPDATE public.withdrawal_limits
            SET daily_withdrawn = 0, last_daily_reset = NOW(), updated_at = NOW()
            WHERE DATE(last_daily_reset) < CURRENT_DATE;
        END;
        $func$;

        CREATE OR REPLACE FUNCTION reset_monthly_withdrawal_limits()
        RETURNS void LANGUAGE plpgsql SECURITY DEFINER
        AS $func$
        BEGIN
            UPDATE public.withdrawal_limits
            SET monthly_withdrawn = 0, last_monthly_reset = NOW(), updated_at = NOW()
            WHERE DATE_TRUNC('month', last_monthly_reset) < DATE_TRUNC('month', NOW());
        END;
        $func$;

        CREATE OR REPLACE FUNCTION update_withdrawal_limits_updated_at()
        RETURNS TRIGGER LANGUAGE plpgsql
        AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$;

        DROP TRIGGER IF EXISTS trigger_withdrawal_limits_updated_at ON public.withdrawal_limits;
        CREATE TRIGGER trigger_withdrawal_limits_updated_at
            BEFORE UPDATE ON public.withdrawal_limits
            FOR EACH ROW
            EXECUTE FUNCTION update_withdrawal_limits_updated_at();

        RETURN QUERY SELECT 'helper functions'::TEXT, 'Created'::TEXT;
    END;

END;
$$;

-- Now run the migration
SELECT * FROM run_withdrawal_migration_v2();
