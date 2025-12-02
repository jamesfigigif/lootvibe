-- Re-add the missing INSERT policy for users
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'sub') = id);
