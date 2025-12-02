-- Supabase Storage Setup for LootVibe Images
-- Run this in your Supabase SQL Editor

-- 1. Create storage bucket for loot box images
INSERT INTO storage.buckets (id, name, public)
VALUES ('loot-box-images', 'loot-box-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up storage policies for public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'loot-box-images' );

-- 3. Allow authenticated users (admins) to upload
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'loot-box-images' );

-- 4. Allow authenticated users (admins) to update
CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'loot-box-images' );

-- 5. Allow authenticated users (admins) to delete
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'loot-box-images' );
