-- Fix RLS policies to allow anon users to query all tables (temporary workaround)
-- This is needed because Clerk JWT validation is not set up properly
-- In production, configure Supabase to accept Clerk JWTs or use backend with service role

-- Shipments table
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shipments_select_any" ON public.shipments;
CREATE POLICY "shipments_select_any"
ON public.shipments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "shipments_update_any" ON public.shipments;
CREATE POLICY "shipments_update_any"
ON public.shipments FOR UPDATE
USING (true);

GRANT ALL ON public.shipments TO anon;
GRANT ALL ON public.shipments TO authenticated;

-- Transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_any" ON public.transactions;
CREATE POLICY "transactions_select_any"
ON public.transactions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "transactions_insert_any" ON public.transactions;
CREATE POLICY "transactions_insert_any"
ON public.transactions FOR INSERT
WITH CHECK (true);

GRANT ALL ON public.transactions TO anon;
GRANT ALL ON public.transactions TO authenticated;

-- Box openings table
ALTER TABLE public.box_openings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "box_openings_select_any" ON public.box_openings;
CREATE POLICY "box_openings_select_any"
ON public.box_openings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "box_openings_insert_any" ON public.box_openings;
CREATE POLICY "box_openings_insert_any"
ON public.box_openings FOR INSERT
WITH CHECK (true);

GRANT ALL ON public.box_openings TO anon;
GRANT ALL ON public.box_openings TO authenticated;

-- Boxes table
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boxes_select_any" ON public.boxes;
CREATE POLICY "boxes_select_any"
ON public.boxes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "boxes_update_any" ON public.boxes;
CREATE POLICY "boxes_update_any"
ON public.boxes FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "boxes_insert_any" ON public.boxes;
CREATE POLICY "boxes_insert_any"
ON public.boxes FOR INSERT
WITH CHECK (true);

GRANT ALL ON public.boxes TO anon;
GRANT ALL ON public.boxes TO authenticated;

-- Inventory items table
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_select_any" ON public.inventory_items;
CREATE POLICY "inventory_select_any"
ON public.inventory_items FOR SELECT
USING (true);

DROP POLICY IF EXISTS "inventory_update_any" ON public.inventory_items;
CREATE POLICY "inventory_update_any"
ON public.inventory_items FOR UPDATE
USING (true);

GRANT ALL ON public.inventory_items TO anon;
GRANT ALL ON public.inventory_items TO authenticated;
