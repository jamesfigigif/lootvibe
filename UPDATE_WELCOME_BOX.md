# Update Welcome Box Odds in Supabase

Since the CLI isn't connecting properly, please run this SQL directly in your Supabase dashboard:

## Steps:

1. Go to https://supabase.com/dashboard/project/hpflcuyxmwzrknxjgavd/sql/new
2. Paste the SQL below
3. Click "Run"

```sql
UPDATE boxes
SET items = '[
  {
    "id": "pc12",
    "name": "LootVibe $10 Voucher",
    "value": 10,
    "rarity": "COMMON",
    "odds": 99.999,
    "image": "https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc12.webp"
  },
  {
    "id": "p1",
    "name": "PSA 10 Charizard Base Set 1st Edition",
    "value": 250000,
    "rarity": "LEGENDARY",
    "odds": 0.00025,
    "image": "https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p1.webp"
  },
  {
    "id": "rtx1",
    "name": "Gigabyte Nvidia GeForce RTX 5090 Aorus Master",
    "value": 2970,
    "rarity": "LEGENDARY",
    "odds": 0.00025,
    "image": "https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx1.webp"
  },
  {
    "id": "son1",
    "name": "Supreme Meissen Hand-Painted Porcelain Cupid",
    "value": 6393.6,
    "rarity": "LEGENDARY",
    "odds": 0.00025,
    "image": "https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son1.webp"
  },
  {
    "id": "cz1",
    "name": "Charizard ex 151 SIR PSA 10",
    "value": 200,
    "rarity": "EPIC",
    "odds": 0.0001,
    "image": "https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/cz1.webp"
  },
  {
    "id": "t3",
    "name": "iPhone 15 Pro 256GB",
    "value": 999,
    "rarity": "EPIC",
    "odds": 0.0001,
    "image": "https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t3.webp"
  },
  {
    "id": "t4",
    "name": "iPad Pro 11\" M2",
    "value": 799,
    "rarity": "EPIC",
    "odds": 0.0001,
    "image": "https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t4.webp"
  },
  {
    "id": "su3",
    "name": "Supreme x TNF Nuptse Jacket",
    "value": 800,
    "rarity": "EPIC",
    "odds": 0.0001,
    "image": "https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/su3.webp"
  },
  {
    "id": "su4",
    "name": "Supreme x Nike SB Dunk Low",
    "value": 600,
    "rarity": "EPIC",
    "odds": 0.0001,
    "image": "https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/su4.webp"
  },
  {
    "id": "t7",
    "name": "Apple Watch Series 9 GPS",
    "value": 399,
    "rarity": "RARE",
    "odds": 0.0001,
    "image": "https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t7.webp"
  }
]'::jsonb
WHERE id = 'welcome_gift';
```

## Verify:

After running, you should see: `UPDATE 1` 

Then refresh your browser and check the Welcome Gift box - the odds should now show 99.999% for the voucher!
