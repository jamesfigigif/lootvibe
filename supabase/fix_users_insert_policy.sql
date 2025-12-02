-- Allow users to insert their own profile
-- This is necessary for new user registration when RLS is enabled on the users table
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid()::text = id);
