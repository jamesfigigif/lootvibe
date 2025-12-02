-- Allow public read access to inventory_items (users can see their own items)
DROP POLICY IF EXISTS "Users can view own inventory" ON public.inventory_items;
CREATE POLICY "Anyone can view inventory" 
ON public.inventory_items FOR SELECT 
USING (true);

-- Keep insert policy strict (must match user_id or sub)
DROP POLICY IF EXISTS "Users can insert own inventory" ON public.inventory_items;
CREATE POLICY "Users can insert own inventory" 
ON public.inventory_items FOR INSERT 
WITH CHECK (
    (auth.jwt() ->> 'user_id') = user_id 
    OR 
    (auth.jwt() ->> 'sub') = user_id
);

-- Allow public read access to transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Anyone can view transactions" 
ON public.transactions FOR SELECT 
USING (true);

-- Keep insert policy strict
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (
    (auth.jwt() ->> 'user_id') = user_id 
    OR 
    (auth.jwt() ->> 'sub') = user_id
);

-- Allow public read access to box_openings
DROP POLICY IF EXISTS "Users can view own box openings" ON public.box_openings;
CREATE POLICY "Anyone can view box openings" 
ON public.box_openings FOR SELECT 
USING (true);

-- Keep insert policy strict
DROP POLICY IF EXISTS "Users can insert own box openings" ON public.box_openings;
CREATE POLICY "Users can insert own box openings" 
ON public.box_openings FOR INSERT 
WITH CHECK (
    (auth.jwt() ->> 'user_id') = user_id 
    OR 
    (auth.jwt() ->> 'sub') = user_id
);
