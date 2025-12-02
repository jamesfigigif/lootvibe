-- 1. Drop policies on ALL tables that reference user_id
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own non-sensitive data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;

DROP POLICY IF EXISTS "Users can read own inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Service role has full access to inventory" ON public.inventory_items;

DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Service role has full access to transactions" ON public.transactions;

DROP POLICY IF EXISTS "Users can read own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Service role has full access to shipments" ON public.shipments;

DROP POLICY IF EXISTS "Users can view their own box openings" ON public.box_openings;

-- 2. Drop foreign key constraints
ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_user_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_user_id_fkey;
ALTER TABLE public.box_openings DROP CONSTRAINT IF EXISTS box_openings_user_id_fkey;

-- 3. Alter columns to TEXT
ALTER TABLE public.users ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.inventory_items ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.transactions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.shipments ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.box_openings ALTER COLUMN user_id TYPE TEXT;

-- 4. Re-add foreign key constraints
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.box_openings ADD CONSTRAINT box_openings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5. Fix decrement_balance function
DROP FUNCTION IF EXISTS decrement_balance(uuid, numeric);
CREATE OR REPLACE FUNCTION decrement_balance(user_id TEXT, amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  -- Lock the row for update
  SELECT balance INTO current_balance
  FROM users
  WHERE id = user_id
  FOR UPDATE;

  IF current_balance < amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  UPDATE users
  SET balance = balance - amount
  WHERE id = user_id;
END;
$$;

-- 6. Recreate policies

-- Users
CREATE POLICY "Users can read own data" 
ON public.users FOR SELECT 
USING (auth.uid()::text = id);

CREATE POLICY "Users can update own non-sensitive data" 
ON public.users FOR UPDATE 
USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Service role has full access to users" 
ON public.users FOR ALL 
USING (auth.role() = 'service_role');

-- Inventory
CREATE POLICY "Users can read own inventory" 
ON public.inventory_items FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Service role has full access to inventory" 
ON public.inventory_items FOR ALL 
USING (auth.role() = 'service_role');

-- Transactions
CREATE POLICY "Users can read own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Service role has full access to transactions" 
ON public.transactions FOR ALL 
USING (auth.role() = 'service_role');

-- Shipments
CREATE POLICY "Users can read own shipments" 
ON public.shipments FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Service role has full access to shipments" 
ON public.shipments FOR ALL 
USING (auth.role() = 'service_role');

-- Box Openings
CREATE POLICY "Users can view their own box openings" 
ON public.box_openings FOR SELECT 
USING (auth.uid()::text = user_id);
