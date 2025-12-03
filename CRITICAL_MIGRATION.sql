-- ============================================
-- CRITICAL MIGRATION: Add Missing Columns
-- ============================================
-- Run this in Supabase SQL Editor ASAP
-- https://supabase.com/dashboard/project/hpflcuyxmwzrknxjgavd/sql/new

-- 1. Add email column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
COMMENT ON COLUMN public.users.email IS 'User email from Clerk authentication';

-- 2. Add role column to users table (if it doesn't exist)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
COMMENT ON COLUMN public.users.role IS 'User role: user (default), admin, or moderator';

-- 3. Fix boxes RLS for anonymous access
DROP POLICY IF EXISTS "Anyone can view boxes" ON public.boxes;
DROP POLICY IF EXISTS "Anyone can read active boxes" ON public.boxes;
CREATE POLICY "Anyone can view boxes" ON public.boxes FOR SELECT USING (true);
GRANT SELECT ON public.boxes TO anon;
GRANT SELECT ON public.boxes TO authenticated;
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;

-- 4. Verify user creation policy works with Clerk JWT
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (
    -- Allow if the ID matches the authenticated user's ID from Clerk JWT
    (auth.jwt() ->> 'sub') = id
    OR
    (auth.jwt() ->> 'user_id') = id
);

-- Done! Your database is now ready.
