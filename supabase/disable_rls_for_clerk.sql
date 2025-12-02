-- DISABLE RLS for Clerk-based authentication
-- Since we're using Clerk (not Supabase Auth), RLS policies won't work properly
-- Authorization is handled in Edge Functions instead

-- Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies on users
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own non-sensitive data" ON public.users;

-- Disable RLS on related tables (since they depend on users)
ALTER TABLE public.inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments DISABLE ROW LEVEL SECURITY;

-- Drop policies on related tables
DROP POLICY IF EXISTS "Users can read own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can read own shipments" ON public.shipments;

-- NOTE: Security is now enforced via:
-- 1. Edge Functions that verify Clerk JWTs
-- 2. Service role key used server-side only
-- 3. Client uses anon key but all critical operations go through Edge Functions
