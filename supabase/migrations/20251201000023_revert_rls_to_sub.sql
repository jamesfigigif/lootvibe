-- Update RLS policies to support both 'user_id' (custom claim) and 'sub' (standard claim)
-- This ensures compatibility with both custom JWT templates and the standard Clerk Integration.

-- Users Table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (
    (auth.jwt() ->> 'user_id') = id 
    OR 
    (auth.jwt() ->> 'sub') = id
);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (
    (auth.jwt() ->> 'user_id') = id 
    OR 
    (auth.jwt() ->> 'sub') = id
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (
    (auth.jwt() ->> 'user_id') = id 
    OR 
    (auth.jwt() ->> 'sub') = id
);

-- Inventory Items
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory_items;
CREATE POLICY "Users can view own inventory" 
ON public.inventory_items FOR SELECT 
USING (
    (auth.jwt() ->> 'user_id') = user_id 
    OR 
    (auth.jwt() ->> 'sub') = user_id
);

DROP POLICY IF EXISTS "Users can insert own inventory" ON public.inventory_items;
CREATE POLICY "Users can insert own inventory" 
ON public.inventory_items FOR INSERT 
WITH CHECK (
    (auth.jwt() ->> 'user_id') = user_id 
    OR 
    (auth.jwt() ->> 'sub') = user_id
);

-- Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" 
ON public.transactions FOR SELECT 
USING (
    (auth.jwt() ->> 'user_id') = user_id 
    OR 
    (auth.jwt() ->> 'sub') = user_id
);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (
    (auth.jwt() ->> 'user_id') = user_id 
    OR 
    (auth.jwt() ->> 'sub') = user_id
);

-- Shipments
DROP POLICY IF EXISTS "Users can view own shipments" ON public.shipments;
CREATE POLICY "Users can view own shipments" 
ON public.shipments FOR SELECT 
USING (
    (auth.jwt() ->> 'user_id') = user_id 
    OR 
    (auth.jwt() ->> 'sub') = user_id
);

DROP POLICY IF EXISTS "Users can insert own shipments" ON public.shipments;
CREATE POLICY "Users can insert own shipments" 
ON public.shipments FOR INSERT 
WITH CHECK (
    (auth.jwt() ->> 'user_id') = user_id 
    OR 
    (auth.jwt() ->> 'sub') = user_id
);

-- Box Openings
DROP POLICY IF EXISTS "Users can view own box openings" ON public.box_openings;
CREATE POLICY "Users can view own box openings" 
ON public.box_openings FOR SELECT 
USING (
    (auth.jwt() ->> 'user_id') = user_id 
    OR 
    (auth.jwt() ->> 'sub') = user_id
);

DROP POLICY IF EXISTS "Users can insert own box openings" ON public.box_openings;
CREATE POLICY "Users can insert own box openings" 
ON public.box_openings FOR INSERT 
WITH CHECK (
    (auth.jwt() ->> 'user_id') = user_id 
    OR 
    (auth.jwt() ->> 'sub') = user_id
);

-- Battles
DROP POLICY IF EXISTS "Users can view own battles" ON public.battles;
CREATE POLICY "Users can view own battles" 
ON public.battles FOR SELECT 
USING (
    (auth.jwt() ->> 'user_id') = creator_id 
    OR 
    (auth.jwt() ->> 'sub') = creator_id
);

DROP POLICY IF EXISTS "Users can insert own battles" ON public.battles;
CREATE POLICY "Users can insert own battles" 
ON public.battles FOR INSERT 
WITH CHECK (
    (auth.jwt() ->> 'user_id') = creator_id 
    OR 
    (auth.jwt() ->> 'sub') = creator_id
);

-- Battle Results
DROP POLICY IF EXISTS "Users can view own battle results" ON public.battle_results;
CREATE POLICY "Users can view own battle results" 
ON public.battle_results FOR SELECT 
USING (
    (auth.jwt() ->> 'user_id') = winner_id 
    OR 
    (auth.jwt() ->> 'sub') = winner_id
);
