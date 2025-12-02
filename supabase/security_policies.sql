-- ==========================================
-- Security & RLS Policies
-- ==========================================

-- 1. Users Table
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" 
ON public.users FOR SELECT 
USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own non-sensitive data" ON public.users;
CREATE POLICY "Users can update own non-sensitive data" 
ON public.users FOR UPDATE 
USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;
CREATE POLICY "Service role has full access to users" 
ON public.users FOR ALL 
USING (auth.role() = 'service_role');

-- 2. Inventory Items Table
ALTER TABLE IF EXISTS public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own inventory" ON public.inventory_items;
CREATE POLICY "Users can read own inventory" 
ON public.inventory_items FOR SELECT 
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role has full access to inventory" ON public.inventory_items;
CREATE POLICY "Service role has full access to inventory" 
ON public.inventory_items FOR ALL 
USING (auth.role() = 'service_role');

-- 3. Transactions Table
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
CREATE POLICY "Users can read own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role has full access to transactions" ON public.transactions;
CREATE POLICY "Service role has full access to transactions" 
ON public.transactions FOR ALL 
USING (auth.role() = 'service_role');

-- 4. Shipments Table
ALTER TABLE IF EXISTS public.shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own shipments" ON public.shipments;
CREATE POLICY "Users can read own shipments" 
ON public.shipments FOR SELECT 
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role has full access to shipments" ON public.shipments;
CREATE POLICY "Service role has full access to shipments" 
ON public.shipments FOR ALL 
USING (auth.role() = 'service_role');

-- 5. Boxes Table
ALTER TABLE IF EXISTS public.boxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active boxes" ON public.boxes;
CREATE POLICY "Anyone can read active boxes" 
ON public.boxes FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Service role has full access to boxes" ON public.boxes;
CREATE POLICY "Service role has full access to boxes" 
ON public.boxes FOR ALL 
USING (auth.role() = 'service_role');

-- 6. Box Openings Table (Idempotent check)
ALTER TABLE IF EXISTS public.box_openings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own box openings" ON public.box_openings;
CREATE POLICY "Users can view their own box openings" 
ON public.box_openings FOR SELECT 
USING (auth.uid()::text = user_id);

-- 7. Battles Table (Idempotent check)
ALTER TABLE IF EXISTS public.battles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read battles" ON public.battles;
CREATE POLICY "Anyone can read battles" 
ON public.battles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Service role has full access to battles" ON public.battles;
CREATE POLICY "Service role has full access to battles" 
ON public.battles FOR ALL 
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update battles they're in" ON public.battles;
CREATE POLICY "Users can update battles they're in" 
ON public.battles FOR UPDATE 
USING (
    auth.uid()::text = ANY(
        SELECT jsonb_array_elements_text(players::jsonb -> 'id')
    )
);

-- 8. Battle Results Table (Idempotent check)
ALTER TABLE IF EXISTS public.battle_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own results" ON public.battle_results;
CREATE POLICY "Users can read their own results" 
ON public.battle_results FOR SELECT 
USING (auth.uid()::text = winner_id);

DROP POLICY IF EXISTS "Service role has full access to battle_results" ON public.battle_results;
CREATE POLICY "Service role has full access to battle_results" 
ON public.battle_results FOR ALL 
USING (auth.role() = 'service_role');
