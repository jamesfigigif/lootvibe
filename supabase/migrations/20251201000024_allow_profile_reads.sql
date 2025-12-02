-- Allow public read access to user profiles (fixes 406 errors)
-- User profiles are not sensitive, so we can allow anyone to read them
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;
CREATE POLICY "Anyone can view profiles" 
ON public.users FOR SELECT 
USING (true);

-- Keep insert policy strict (must match user_id or sub)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (
    (auth.jwt() ->> 'user_id') = id 
    OR 
    (auth.jwt() ->> 'sub') = id
);

-- Keep update policy strict (must match user_id or sub)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (
    (auth.jwt() ->> 'user_id') = id 
    OR 
    (auth.jwt() ->> 'sub') = id
);
