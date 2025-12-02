# Simple Image Upload Guide

## ✅ Setup Complete!

The storage bucket is already set up (that's why you got the "policy already exists" error - it's good!).

---

## 🎨 How to Upload Images

### Step 1: Go to Upload Page
1. Open your browser to: **http://localhost:3000/upload**
2. You'll see two upload areas: "Box Image" and "Prize Item Image"

### Step 2: Upload Image
1. Click the upload area
2. Select your image (jpg, png, webp, svg - max 5MB)
3. Image uploads automatically
4. URL appears below the preview

### Step 3: Copy URL
1. Click the "Copy" button next to the URL
2. URL is now in your clipboard!

### Step 4: Update constants.ts
1. Open `constants.ts`
2. Find your box or item definition
3. Paste the URL into the `image` field
4. Save the file

**Example:**
```typescript
// Before
createItem('p1', 'Charizard', 250000, Rarity.LEGENDARY, 0.01, 'https://placehold.co/200x200/...'),

// After (with your uploaded image)
createItem('p1', 'Charizard', 250000, Rarity.LEGENDARY, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/loot-box-images/items/1732599123_abc123.png'),
```

### Step 5: Refresh
1. Save `constants.ts`
2. Your app will hot-reload
3. Your custom image now appears!

---

## 📂 Where Images Are Stored

All images are stored in Supabase Storage:
- **Bucket:** `loot-box-images`
- **Box images:** `boxes/` folder
- **Item images:** `items/` folder
- **View in Supabase:** https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd/storage/buckets/loot-box-images

---

## 💡 Tips

- **Recommended size:** 512x512px for items, 800x600px for boxes
- **Format:** PNG with transparent background looks best
- **File size:** Keep under 500KB for fast loading
- **Naming:** Use descriptive names before uploading (e.g., `charizard-psa10.png`)

---

## 🔧 Troubleshooting

**Upload button doesn't work**
- Make sure you ran `storage_setup.sql` in Supabase
- Check browser console for errors

**Image doesn't appear after pasting URL**
- Make sure you saved `constants.ts`
- Check that the URL starts with `https://cbjdasfnwzizfphnwxfd.supabase.co/`
- Verify the image uploaded successfully in Supabase dashboard
