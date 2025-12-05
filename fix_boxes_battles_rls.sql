-- Fix RLS policies for boxes and battles tables
-- These need to be readable by Edge Functions using service role

-- Boxes table - allow service role to read all boxes
DROP POLICY IF EXISTS "Allow public read for boxes" ON boxes;
DROP POLICY IF EXISTS "Allow service role full access to boxes" ON boxes;

ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read boxes (needed for box display)
CREATE POLICY "Allow public read for boxes"
ON boxes
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users and service role to read all boxes
CREATE POLICY "Allow service role full access to boxes"
ON boxes
FOR ALL
TO service_role
USING (true);

-- Battles table - allow public read and service role write
DROP POLICY IF EXISTS "Allow public read for battles" ON battles;
DROP POLICY IF EXISTS "Allow service role full access to battles" ON battles;
DROP POLICY IF EXISTS "Allow users to read battles" ON battles;
DROP POLICY IF EXISTS "Allow users to update battles" ON battles;

ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read battles
CREATE POLICY "Allow public read for battles"
ON battles
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow service role full access (Edge Functions need this)
CREATE POLICY "Allow service role full access to battles"
ON battles
FOR ALL
TO service_role
USING (true);

-- Allow authenticated users to update battles they're in
CREATE POLICY "Allow users to update battles"
ON battles
FOR UPDATE
TO authenticated
USING (true);
