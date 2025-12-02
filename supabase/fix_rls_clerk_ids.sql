    -- Fix RLS to support non-UUID IDs from Clerk by using raw JWT sub claim
    -- This bypasses potential UUID casting issues in the built-in auth.uid() function

    -- 1. Users Table SELECT
    DROP POLICY IF EXISTS "Users can read own data" ON public.users;
    CREATE POLICY "Users can read own data" 
    ON public.users FOR SELECT 
    USING (
    (auth.jwt() ->> 'sub') = id
    );

    -- 2. Users Table INSERT
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
    CREATE POLICY "Users can insert own profile" 
    ON public.users FOR INSERT 
    WITH CHECK (
    (auth.jwt() ->> 'sub') = id
    );

    -- 3. Users Table UPDATE
    DROP POLICY IF EXISTS "Users can update own non-sensitive data" ON public.users;
    CREATE POLICY "Users can update own non-sensitive data" 
    ON public.users FOR UPDATE 
    USING (
    (auth.jwt() ->> 'sub') = id
    );

    -- 4. Update other tables to match this pattern if they rely on auth.uid() checking against a text column
    -- Inventory
    DROP POLICY IF EXISTS "Users can read own inventory" ON public.inventory_items;
    CREATE POLICY "Users can read own inventory" 
    ON public.inventory_items FOR SELECT 
    USING (
    (auth.jwt() ->> 'sub') = user_id
    );

    -- Transactions
    DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
    CREATE POLICY "Users can read own transactions" 
    ON public.transactions FOR SELECT 
    USING (
    (auth.jwt() ->> 'sub') = user_id
    );

