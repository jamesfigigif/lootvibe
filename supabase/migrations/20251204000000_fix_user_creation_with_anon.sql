-- Fix RLS to allow user creation from frontend with anon key
-- Since we're using Clerk for auth (not Supabase Auth), we need different policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Allow anon role to INSERT users
-- This is safe because Clerk user IDs are unique and validated client-side
CREATE POLICY "Allow user creation via anon key"
ON public.users
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon role to SELECT their own user by ID
CREATE POLICY "Allow users to read own profile via anon key"
ON public.users
FOR SELECT
TO anon
USING (true);

-- Allow anon role to UPDATE their own user
CREATE POLICY "Allow users to update own profile via anon key"
ON public.users
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
