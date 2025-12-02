# Image Upload Setup Guide

## ✅ What's Been Done

I've added custom image upload functionality to your admin panel:

1. **Created Upload Service** - Handles file validation and Supabase Storage integration
2. **Created ImageUpload Component** - Drag-and-drop UI with preview
3. **Integrated into BoxForm** - Upload images for boxes and prizes
4. **Database Schema** - Added `image_url` column to boxes table

---

## 🚀 Setup Steps (5 minutes)

### Step 1: Run SQL in Supabase

1. Go to: https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd/sql/new
2. Copy and paste the contents of `supabase/storage_setup.sql`
3. Click **Run**
4. Copy and paste the contents of `supabase/add_image_url_column.sql`
5. Click **Run**

### Step 2: Test Locally

1. **Refresh** your browser at http://localhost:3000
2. **Go to** `/admin` page
3. **Create/Edit a box**
4. **Click** the image upload area
5. **Upload** a test image (jpg/png)
6. **Verify** the image appears in the preview
7. **Save** the box

### Step 3: Verify Upload

1. Go to: https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd/storage/buckets/loot-box-images
2. You should see your uploaded image in the `boxes/` folder
3. Click the image to get the public URL

---

## 📝 How to Use

### Upload Box Image
1. Go to Admin → Create/Edit Box
2. Click "Box Image" upload area
3. Select image (max 5MB, jpg/png/webp/svg)
4. Image uploads automatically
5. Preview appears immediately
6. Save the box

### Upload Prize Images
1. In the same form, scroll to "Items & Odds"
2. For each item, click "Item Image" upload area
3. Upload image for that prize
4. Repeat for all prizes

### Replace Image
1. Hover over existing image
2. Click the red X button
3. Upload new image

---

## 🔍 Troubleshooting

**Upload fails with "Invalid file type"**
- Only jpg, png, webp, svg allowed
- Check file extension

**Upload fails with "File too large"**
- Maximum size: 5MB
- Compress image before uploading

**Image doesn't appear after upload**
- Check browser console for errors
- Verify Supabase Storage bucket was created
- Check that SQL scripts ran successfully

**Images don't load on live site**
- Supabase Storage bucket must be set to `public: true`
- Check storage policies allow public read access

---

## 📂 File Locations

- **Upload Service:** `services/uploadService.ts`
- **ImageUpload Component:** `components/admin/ImageUpload.tsx`
- **BoxForm (updated):** `components/admin/BoxForm.tsx`
- **Storage Setup SQL:** `supabase/storage_setup.sql`
- **Schema Update SQL:** `supabase/add_image_url_column.sql`
