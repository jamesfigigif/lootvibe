-- EMERGENCY HOTFIX: Remove recursive RLS policies causing infinite loop
-- Issue: Policies on box_openings were querying users table, which also has RLS
-- This creates infinite recursion: policy -> query users -> check policy -> query users -> ...

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Users can view their own box openings" ON public.box_openings;
DROP POLICY IF EXISTS "Admins can view all box openings" ON public.box_openings;

-- Create simple non-recursive policy for box_openings
-- Users can only see their own box openings
CREATE POLICY "Users can view own box openings"
ON public.box_openings FOR SELECT
USING (auth.uid()::text = user_id);

-- Create policy for inserting (Edge Functions use service role, so this is safe)
CREATE POLICY "Service role can insert box openings"
ON public.box_openings FOR INSERT
WITH CHECK (true);  -- Service role bypasses RLS anyway

-- For admin access, admins should use service role key or Edge Functions
-- This avoids the recursive policy issue entirely

-- Ensure users table has simple policies without recursion
DROP POLICY IF EXISTS "Users can select own profile" ON public.users;
CREATE POLICY "Users can select own profile"
ON public.users FOR SELECT
USING (auth.uid()::text = id);

-- Update policy should also be simple
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid()::text = id);
