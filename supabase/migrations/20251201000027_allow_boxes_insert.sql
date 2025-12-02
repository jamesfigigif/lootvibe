-- Temporarily allow INSERT on boxes table for data import
-- This can be restricted later to admin-only
DROP POLICY IF EXISTS "Anyone can insert boxes" ON public.boxes;
CREATE POLICY "Anyone can insert boxes" 
ON public.boxes FOR INSERT 
WITH CHECK (true);
