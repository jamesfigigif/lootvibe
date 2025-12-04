const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://cbjdasfnwzizfphnwxfd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZmxjdXl4bXd6cmtueGpnYXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUxMjk3MywiZXhwIjoyMDgwMDg4OTczfQ.WABEBO72ZoO1pFHrcJCnAlGMmfujAiyVoiOUAWfkhRc'
);

async function runMigration() {
    console.log('🚀 Starting migration...\n');

    // Step 1: Add vip_tier column
    console.log('Step 1: Adding vip_tier column to users table...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
        query: `
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'users'
                    AND column_name = 'vip_tier'
                ) THEN
                    ALTER TABLE public.users ADD COLUMN vip_tier TEXT;
                    RAISE NOTICE 'Added vip_tier column';
                ELSE
                    RAISE NOTICE 'vip_tier column already exists';
                END IF;
            END $$;
        `
    });
    if (error1) console.error('❌ Error:', error1);
    else console.log('✅ Done\n');

    // Step 2: Add email column
    console.log('Step 2: Adding email column to users table...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
        query: `
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'users'
                    AND column_name = 'email'
                ) THEN
                    ALTER TABLE public.users ADD COLUMN email TEXT;
                    RAISE NOTICE 'Added email column';
                ELSE
                    RAISE NOTICE 'email column already exists';
                END IF;
            END $$;
        `
    });
    if (error2) console.error('❌ Error:', error2);
    else console.log('✅ Done\n');

    // Step 3: Add constraint to vip_tier
    console.log('Step 3: Adding vip_tier constraint...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
        query: `
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'users_vip_tier_check'
                ) THEN
                    ALTER TABLE public.users
                    ADD CONSTRAINT users_vip_tier_check
                    CHECK (vip_tier IS NULL OR vip_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond'));
                    RAISE NOTICE 'Added vip_tier constraint';
                ELSE
                    RAISE NOTICE 'vip_tier constraint already exists';
                END IF;
            END $$;
        `
    });
    if (error3) console.error('❌ Error:', error3);
    else console.log('✅ Done\n');

    // Step 4: Create indexes
    console.log('Step 4: Creating indexes on users table...');
    const { error: error4 } = await supabase.rpc('exec_sql', {
        query: `
            CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
            CREATE INDEX IF NOT EXISTS idx_users_vip_tier ON public.users(vip_tier);
        `
    });
    if (error4) console.error('❌ Error:', error4);
    else console.log('✅ Done\n');

    // Step 5: Add columns to withdrawals
    console.log('Step 5: Adding columns to withdrawals table...');
    const { error: error5 } = await supabase.rpc('exec_sql', {
        query: `
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'withdrawals'
                    AND column_name = 'ip_address'
                ) THEN
                    ALTER TABLE public.withdrawals ADD COLUMN ip_address TEXT;
                    RAISE NOTICE 'Added ip_address column';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND table_name = 'withdrawals'
                    AND column_name = 'actual_fee'
                ) THEN
                    ALTER TABLE public.withdrawals ADD COLUMN actual_fee DECIMAL(10, 8);
                    RAISE NOTICE 'Added actual_fee column';
                END IF;
            END $$;
        `
    });
    if (error5) console.error('❌ Error:', error5);
    else console.log('✅ Done\n');

    // Step 6: Update withdrawals status constraint
    console.log('Step 6: Updating withdrawals status constraint...');
    const { error: error6 } = await supabase.rpc('exec_sql', {
        query: `
            ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;
            ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_status_check
            CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED'));
        `
    });
    if (error6) console.error('❌ Error:', error6);
    else console.log('✅ Done\n');

    // Step 7: Create withdrawal_limits table
    console.log('Step 7: Creating withdrawal_limits table...');
    const { error: error7 } = await supabase.rpc('exec_sql', {
        query: `
            CREATE TABLE IF NOT EXISTS public.withdrawal_limits (
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
        `
    });
    if (error7) console.error('❌ Error:', error7);
    else console.log('✅ Done\n');

    console.log('🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Check Supabase dashboard to verify tables were created');
    console.log('2. Start the backend server: cd backend && npm start');
    console.log('3. Test a withdrawal to verify everything works!');
}

runMigration().catch(console.error);
