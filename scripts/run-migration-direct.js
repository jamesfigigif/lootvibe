const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://hpflcuyxmwzrknxjgavd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZmxjdXl4bXd6cmtueGpnYXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzE1MTM4NywiZXhwIjoyMDQ4NzI3Mzg3fQ.EQo4Q8vTpDz7tTpZQe9BuqD0jXPyQfgL5QjKGMvR3qo',
    {
        db: {
            schema: 'public'
        }
    }
);

async function runMigration() {
    console.log('🚀 Starting streamer system migration...\n');

    try {
        console.log('📝 Creating migration function...');

        // Create a function that will execute all the streamer migration DDL
        const migrationFunction = `
CREATE OR REPLACE FUNCTION run_streamer_migration()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result TEXT := '';
BEGIN
    -- Add is_streamer flag
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'is_streamer'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_streamer BOOLEAN DEFAULT FALSE NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_users_is_streamer ON public.users(is_streamer);
        result := result || 'Added is_streamer; ';
    END IF;

    -- Add can_withdraw flag
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'can_withdraw'
    ) THEN
        ALTER TABLE public.users ADD COLUMN can_withdraw BOOLEAN DEFAULT TRUE NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_users_can_withdraw ON public.users(can_withdraw);
        result := result || 'Added can_withdraw; ';
    END IF;

    -- Add streamer_odds_multiplier
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'streamer_odds_multiplier'
    ) THEN
        ALTER TABLE public.users ADD COLUMN streamer_odds_multiplier DECIMAL(3, 2) DEFAULT 1.00 NOT NULL
        CHECK (streamer_odds_multiplier >= 1.00 AND streamer_odds_multiplier <= 10.00);
        result := result || 'Added streamer_odds_multiplier; ';
    END IF;

    -- Add streamer_note
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'streamer_note'
    ) THEN
        ALTER TABLE public.users ADD COLUMN streamer_note TEXT;
        result := result || 'Added streamer_note; ';
    END IF;

    -- Create streamer_activity_log table
    CREATE TABLE IF NOT EXISTS public.streamer_activity_log (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        action TEXT NOT NULL CHECK (action IN ('MADE_STREAMER', 'REMOVED_STREAMER', 'BALANCE_EDITED', 'WITHDRAWAL_ENABLED', 'WITHDRAWAL_DISABLED', 'ODDS_CHANGED')),
        admin_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        old_value TEXT,
        new_value TEXT,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_streamer_activity_log_user_id ON public.streamer_activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_streamer_activity_log_admin_id ON public.streamer_activity_log(admin_id);
    CREATE INDEX IF NOT EXISTS idx_streamer_activity_log_created_at ON public.streamer_activity_log(created_at DESC);
    result := result || 'Created streamer_activity_log; ';

    -- Enable RLS
    ALTER TABLE public.streamer_activity_log ENABLE ROW LEVEL SECURITY;

    -- RLS policies for streamer_activity_log
    DROP POLICY IF EXISTS "Admins can view streamer activity log" ON public.streamer_activity_log;
    CREATE POLICY "Admins can view streamer activity log"
    ON public.streamer_activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()::text
            AND role = 'admin'
        )
    );

    DROP POLICY IF EXISTS "Admins can insert streamer activity log" ON public.streamer_activity_log;
    CREATE POLICY "Admins can insert streamer activity log"
    ON public.streamer_activity_log FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()::text
            AND role = 'admin'
        )
    );

    GRANT SELECT, INSERT ON public.streamer_activity_log TO authenticated;
    GRANT ALL ON public.streamer_activity_log TO service_role;
    result := result || 'Set up RLS; ';

    -- Update admin RLS policy for users table
    DROP POLICY IF EXISTS "Admins can update user streamer status" ON public.users;
    CREATE POLICY "Admins can update user streamer status"
    ON public.users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()::text
            AND role = 'admin'
        )
    );
    result := result || 'Updated admin policies; ';

    RETURN 'Streamer migration completed: ' || result;
END;
$$;
`;

        console.log('✅ Function definition ready. Executing...\n');

        const { data, error } = await supabase.rpc('run_streamer_migration');

        if (error) {
            console.error('❌ Error running migration:', error);
            console.log('\n💡 This might be the first time running this. Creating the function first...\n');

            // Try to create the function first
            const { error: createError } = await supabase.rpc('exec_sql', {
                sql_query: migrationFunction
            });

            if (createError) {
                console.error('❌ Could not create function:', createError);
                console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
                console.log('────────────────────────────────────────────────────────');
                console.log(migrationFunction);
                console.log('────────────────────────────────────────────────────────');
                console.log('\nThen run: SELECT run_streamer_migration();');
            } else {
                console.log('✅ Function created! Running it now...\n');
                const { data: data2, error: error2 } = await supabase.rpc('run_streamer_migration');
                if (error2) {
                    console.error('❌ Still failed:', error2);
                } else {
                    console.log('✅ Success:', data2);
                    console.log('\n🎉 Streamer system migration completed successfully!');
                    printFeatures();
                }
            }
        } else {
            console.log('✅ Success:', data);
            console.log('\n🎉 Streamer system migration completed successfully!');
            printFeatures();
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
        console.log('\n💡 You may need to apply the migration manually through Supabase SQL Editor.');
        console.log('   File: supabase/migrations/20251205000000_add_streamer_system.sql');
    }
}

function printFeatures() {
    console.log('\n✨ Streamer system features added:');
    console.log('   • is_streamer - Flag to mark users as streamers');
    console.log('   • can_withdraw - Control withdrawal permissions');
    console.log('   • streamer_odds_multiplier - Odds boost (1.00x - 10.00x)');
    console.log('   • streamer_note - Admin notes for streamers');
    console.log('   • streamer_activity_log - Complete audit trail');
    console.log('\n📚 Admin functions available:');
    console.log('   • set_user_as_streamer()');
    console.log('   • remove_streamer_status()');
    console.log('   • edit_streamer_balance()');
    console.log('   • toggle_user_withdrawal()');
    console.log('\n🎯 Next step: Integrate StreamerManagement into AdminPanel');
}

runMigration();
