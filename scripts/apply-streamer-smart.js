const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hpflcuyxmwzrknxjgavd.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZmxjdXl4bXd6cmtueGpnYXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzE1MTM4NywiZXhwIjoyMDQ4NzI3Mzg3fQ.EQo4Q8vTpDz7tTpZQe9BuqD0jXPyQfgL5QjKGMvR3qo';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkColumn(tableName, columnName) {
    const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .eq('column_name', columnName)
        .maybeSingle();

    if (error) {
        console.log(`   ⚠️  Error checking ${columnName}:`, error.message);
        return false;
    }
    return !!data;
}

async function checkTable(tableName) {
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .maybeSingle();

    if (error) {
        console.log(`   ⚠️  Error checking table ${tableName}:`, error.message);
        return false;
    }
    return !!data;
}

async function getCurrentSchema() {
    console.log('📊 Reading current database schema...\n');

    const usersColumns = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', 'users');

    console.log('✅ Users table columns:',
        usersColumns.data?.map(c => c.column_name).join(', ') || 'none'
    );

    const tables = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    console.log('✅ Tables:',
        tables.data?.map(t => t.table_name).join(', ') || 'none'
    );
    console.log();
}

async function createMigrationFunctions() {
    console.log('🔧 Creating migration helper functions...\n');

    // Function to add is_streamer column
    const addIsStreamerFunc = `
CREATE OR REPLACE FUNCTION add_is_streamer_column()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'is_streamer'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_streamer BOOLEAN DEFAULT FALSE NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_users_is_streamer ON public.users(is_streamer);
        RETURN 'Added is_streamer column';
    ELSE
        RETURN 'is_streamer column already exists';
    END IF;
END;
$$;
`;

    const addCanWithdrawFunc = `
CREATE OR REPLACE FUNCTION add_can_withdraw_column()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'can_withdraw'
    ) THEN
        ALTER TABLE public.users ADD COLUMN can_withdraw BOOLEAN DEFAULT TRUE NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_users_can_withdraw ON public.users(can_withdraw);
        RETURN 'Added can_withdraw column';
    ELSE
        RETURN 'can_withdraw column already exists';
    END IF;
END;
$$;
`;

    const addOddsMultiplierFunc = `
CREATE OR REPLACE FUNCTION add_streamer_odds_multiplier_column()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'streamer_odds_multiplier'
    ) THEN
        ALTER TABLE public.users ADD COLUMN streamer_odds_multiplier DECIMAL(3, 2) DEFAULT 1.00 NOT NULL;
        ALTER TABLE public.users ADD CONSTRAINT streamer_odds_multiplier_check
            CHECK (streamer_odds_multiplier >= 1.00 AND streamer_odds_multiplier <= 10.00);
        RETURN 'Added streamer_odds_multiplier column';
    ELSE
        RETURN 'streamer_odds_multiplier column already exists';
    END IF;
END;
$$;
`;

    const addStreamerNoteFunc = `
CREATE OR REPLACE FUNCTION add_streamer_note_column()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'streamer_note'
    ) THEN
        ALTER TABLE public.users ADD COLUMN streamer_note TEXT;
        RETURN 'Added streamer_note column';
    ELSE
        RETURN 'streamer_note column already exists';
    END IF;
END;
$$;
`;

    const createActivityLogFunc = `
CREATE OR REPLACE FUNCTION create_streamer_activity_log_table()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

    ALTER TABLE public.streamer_activity_log ENABLE ROW LEVEL SECURITY;

    RETURN 'Created streamer_activity_log table';
END;
$$;
`;

    const setupRLSFunc = `
CREATE OR REPLACE FUNCTION setup_streamer_rls()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Activity log policies
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

    -- Users table policy for streamer management
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

    RETURN 'Setup RLS policies';
END;
$$;
`;

    // Create all helper functions
    const functions = [
        { name: 'add_is_streamer_column', sql: addIsStreamerFunc },
        { name: 'add_can_withdraw_column', sql: addCanWithdrawFunc },
        { name: 'add_streamer_odds_multiplier_column', sql: addOddsMultiplierFunc },
        { name: 'add_streamer_note_column', sql: addStreamerNoteFunc },
        { name: 'create_streamer_activity_log_table', sql: createActivityLogFunc },
        { name: 'setup_streamer_rls', sql: setupRLSFunc },
    ];

    for (const func of functions) {
        try {
            // Use raw SQL query through postgREST
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${func.name}`, {
                method: 'POST',
                headers: {
                    'apikey': SERVICE_KEY,
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });

            // Function might not exist yet, that's okay
            console.log(`   Creating function: ${func.name}...`);
        } catch (err) {
            // Expected - function doesn't exist yet
        }
    }

    return functions;
}

async function applyMigration() {
    try {
        await getCurrentSchema();

        console.log('🚀 Starting streamer system migration...\n');

        // Step 1: Create the management functions
        console.log('Step 1: Creating database functions for streamer management...\n');

        const managementFunctions = `
-- Set user as streamer
CREATE OR REPLACE FUNCTION set_user_as_streamer(
    target_user_id TEXT,
    admin_user_id TEXT,
    odds_multiplier DECIMAL DEFAULT 2.00,
    allow_withdrawals BOOLEAN DEFAULT FALSE,
    admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    UPDATE public.users
    SET
        is_streamer = TRUE,
        can_withdraw = allow_withdrawals,
        streamer_odds_multiplier = odds_multiplier,
        streamer_note = admin_note
    WHERE id = target_user_id;

    INSERT INTO public.streamer_activity_log (user_id, action, admin_id, new_value, note)
    VALUES (
        target_user_id,
        'MADE_STREAMER',
        admin_user_id,
        json_build_object(
            'odds_multiplier', odds_multiplier,
            'can_withdraw', allow_withdrawals
        )::text,
        admin_note
    );

    result := json_build_object('success', true, 'message', 'User successfully set as streamer');
    RETURN result;
END;
$$;

-- Remove streamer status
CREATE OR REPLACE FUNCTION remove_streamer_status(
    target_user_id TEXT,
    admin_user_id TEXT,
    admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    UPDATE public.users
    SET
        is_streamer = FALSE,
        can_withdraw = TRUE,
        streamer_odds_multiplier = 1.00,
        streamer_note = NULL
    WHERE id = target_user_id;

    INSERT INTO public.streamer_activity_log (user_id, action, admin_id, note)
    VALUES (target_user_id, 'REMOVED_STREAMER', admin_user_id, admin_note);

    result := json_build_object('success', true, 'message', 'Streamer status removed');
    RETURN result;
END;
$$;

-- Edit streamer balance
CREATE OR REPLACE FUNCTION edit_streamer_balance(
    target_user_id TEXT,
    admin_user_id TEXT,
    new_balance DECIMAL,
    admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_balance DECIMAL;
    result JSON;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    SELECT balance INTO old_balance FROM public.users WHERE id = target_user_id;

    UPDATE public.users
    SET balance = new_balance
    WHERE id = target_user_id;

    INSERT INTO public.streamer_activity_log (user_id, action, admin_id, old_value, new_value, note)
    VALUES (
        target_user_id,
        'BALANCE_EDITED',
        admin_user_id,
        old_balance::text,
        new_balance::text,
        admin_note
    );

    result := json_build_object(
        'success', true,
        'message', 'Balance updated successfully',
        'old_balance', old_balance,
        'new_balance', new_balance
    );
    RETURN result;
END;
$$;

-- Toggle withdrawal permission
CREATE OR REPLACE FUNCTION toggle_user_withdrawal(
    target_user_id TEXT,
    admin_user_id TEXT,
    allow_withdraw BOOLEAN,
    admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    UPDATE public.users
    SET can_withdraw = allow_withdraw
    WHERE id = target_user_id;

    INSERT INTO public.streamer_activity_log (user_id, action, admin_id, new_value, note)
    VALUES (
        target_user_id,
        CASE WHEN allow_withdraw THEN 'WITHDRAWAL_ENABLED' ELSE 'WITHDRAWAL_DISABLED' END,
        admin_user_id,
        allow_withdraw::text,
        admin_note
    );

    result := json_build_object(
        'success', true,
        'message', CASE WHEN allow_withdraw THEN 'Withdrawals enabled' ELSE 'Withdrawals disabled' END
    );
    RETURN result;
END;
$$;
`;

        console.log('   Creating management functions via file...');
        const fs = require('fs');
        const funcFile = './scripts/temp_streamer_functions.sql';
        fs.writeFileSync(funcFile, managementFunctions);
        console.log(`   ✅ Saved to ${funcFile}\n`);

        // Step 2: Apply the migration using a combined approach
        console.log('Step 2: Applying schema changes...\n');
        console.log('   📋 Please run these commands in Supabase SQL Editor:\n');
        console.log('   1. First, run the entire migration file:');
        console.log('      supabase/migrations/20251205000000_add_streamer_system.sql\n');
        console.log('   2. Then run the management functions file:');
        console.log('      scripts/temp_streamer_functions.sql\n');
        console.log('   OR copy and paste the combined SQL from the migration file directly.\n');

        console.log('✨ Once applied, you will have:');
        console.log('   • is_streamer flag on users');
        console.log('   • can_withdraw permission control');
        console.log('   • streamer_odds_multiplier (1.00x - 10.00x)');
        console.log('   • streamer_note for admin notes');
        console.log('   • streamer_activity_log audit table');
        console.log('   • Full management functions\n');

        console.log('🎯 The admin panel is ready - just apply the migration!');
        console.log('   URL: https://supabase.com/dashboard/project/hpflcuyxmwzrknxjgavd/sql/new');

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

applyMigration();
