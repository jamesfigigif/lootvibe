-- Add image_url column to boxes table
ALTER TABLE boxes 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN boxes.image_url IS 'Public URL of the box image from Supabase Storage';
