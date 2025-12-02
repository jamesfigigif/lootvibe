-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('game-assets', 'game-assets', true),
  ('avatars', 'avatars', true),
  ('box-images', 'box-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to these buckets
DROP POLICY IF EXISTS "Public Access game-assets" ON storage.objects;
CREATE POLICY "Public Access game-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'game-assets' );

DROP POLICY IF EXISTS "Public Access avatars" ON storage.objects;
CREATE POLICY "Public Access avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Public Access box-images" ON storage.objects;
CREATE POLICY "Public Access box-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'box-images' );

-- Allow Service Role to upload (INSERT/UPDATE)
-- (Service Role bypasses RLS anyway, but good to be explicit if using authenticated role later)
