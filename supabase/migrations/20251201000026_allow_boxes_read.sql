-- Allow public read access to boxes (anyone can see available boxes)
DROP POLICY IF EXISTS "Anyone can view boxes" ON public.boxes;
CREATE POLICY "Anyone can view boxes" 
ON public.boxes FOR SELECT 
USING (true);
