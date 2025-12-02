    -- Allow users to insert their own profile - FIX
    -- The issue is likely that the RLS policy expects auth.uid() to match, but for INSERTs 
    -- we need to make sure we aren't blocking new user creation.

    -- First, let's drop the strict policy
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

    -- Create a more permissive policy for INSERT only if needed, 
    -- or better yet, rely on the auth.uid() check properly.

    -- NOTE: When you insert a row, the WITH CHECK clause is evaluated against the NEW row.
    -- So checking if auth.uid()::text = id (where id is the NEW.id) is correct.

    CREATE POLICY "Users can insert own profile" 
    ON public.users FOR INSERT 
    WITH CHECK (
    -- Verify the user is inserting their own ID
    auth.uid()::text = id
    );

    -- Ensure the SELECT policy is also correct for the user to "see" themselves after insert
    DROP POLICY IF EXISTS "Users can read own data" ON public.users;
    CREATE POLICY "Users can read own data" 
    ON public.users FOR SELECT 
    USING (
    auth.uid()::text = id
    );

