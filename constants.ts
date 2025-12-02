
import { LootBox, LootItem, Rarity, LiveDrop, BoxCategory, Battle } from './types';
import { getItemsForBox } from './data/itemDatabase';

export const RARITY_COLORS = {
  [Rarity.COMMON]: 'border-slate-500 text-slate-400 shadow-none',
  [Rarity.UNCOMMON]: 'border-blue-500 text-blue-400 shadow-blue-500/20',
  [Rarity.RARE]: 'border-purple-500 text-purple-400 shadow-purple-500/30',
  [Rarity.EPIC]: 'border-pink-500 text-pink-400 shadow-pink-500/40',
  [Rarity.LEGENDARY]: 'border-yellow-400 text-yellow-400 shadow-yellow-400/50',
};

export const RARITY_BG = {
  [Rarity.COMMON]: 'bg-slate-500',
  [Rarity.UNCOMMON]: 'bg-blue-600',
  [Rarity.RARE]: 'bg-purple-600',
  [Rarity.EPIC]: 'bg-pink-600',
  [Rarity.LEGENDARY]: 'bg-yellow-500',
};

export const RARITY_GRADIENTS = {
  [Rarity.COMMON]: 'from-slate-700 to-slate-900',
  [Rarity.UNCOMMON]: 'from-blue-600 to-blue-900',
  [Rarity.RARE]: 'from-purple-600 to-purple-900',
  [Rarity.EPIC]: 'from-pink-600 to-pink-900',
  [Rarity.LEGENDARY]: 'from-yellow-500 to-orange-700',
};

// --- Helper to create items ---
const createItem = (id: string, name: string, value: number, rarity: Rarity, odds: number, image: string): LootItem => ({
  id, name, value, rarity, odds, image
});

// --- NEW BOX ITEMS ---

const POKEMON_ITEMS: LootItem[] = [
  // GRAILS (0.1% - 1%)
  createItem('p1', 'PSA 10 Charizard Base Set 1st Edition', 250000, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p1.webp'),
  createItem('p2', 'PSA 10 Moonbreon (Umbreon VMAX Alt)', 1100, Rarity.LEGENDARY, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p2.webp'),
  createItem('p3', 'Sealed Team Up Booster Box', 2100, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p3.webp'),
  createItem('p4', 'PSA 10 Giratina V Alt Art', 800, Rarity.LEGENDARY, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p4.webp'),

  // HIGH TIER (1% - 5%)
  createItem('p5', 'Sealed Evolving Skies Booster Box', 750, Rarity.EPIC, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p5.webp'),
  createItem('p6', 'Pokemon 151 Ultra Premium Collection', 130, Rarity.EPIC, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p6.webp'),
  createItem('p7', 'Charizard ex (151 SIR)', 110, Rarity.EPIC, 4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p7.webp'),
  createItem('p8', 'Iono Special Illustration Rare', 85, Rarity.EPIC, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p8.webp'),

  // MID TIER (5% - 20%)
  createItem('p9', 'Crown Zenith Elite Trainer Box', 55, Rarity.RARE, 8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p9.webp'),
  createItem('p10', 'Lost Origin Booster Box', 140, Rarity.RARE, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p10.webp'),
  createItem('p11', 'Charizard UPC Promo Card', 25, Rarity.RARE, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p11.webp'),
  createItem('p12', 'Arceus VSTAR Gold Card', 60, Rarity.RARE, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p12.webp'),

  // LOW TIER (Common)
  createItem('p13', 'Sleeved Booster Pack (Latest Set)', 5, Rarity.COMMON, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p13.webp'),
  createItem('p14', '3-Pack Blister (Random)', 15, Rarity.COMMON, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p14.webp'),
  createItem('p15', 'Pokemon Sticker Pack', 2, Rarity.COMMON, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p15.webp'),
  createItem('p16', 'Single Holo Rare Card', 1, Rarity.COMMON, 8.64, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p16.webp'),
];

// CHARIZARD CHASE BOX - $50 box, ~$30 EV (60% profitability)
const CHARIZARD_ITEMS: LootItem[] = [
  createItem('cz1', 'Charizard ex 151 SIR PSA 10', 200, Rarity.LEGENDARY, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/cz1.webp'),
  createItem('cz2', 'Charizard VMAX Rainbow Rare', 85, Rarity.LEGENDARY, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/cz2.webp'),
  createItem('cz3', 'Charizard V Alt Art (Brilliant Stars)', 65, Rarity.EPIC, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/cz3.webp'),
  createItem('cz4', 'Charizard ex 151 Regular', 35, Rarity.EPIC, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/cz4.webp'),
  createItem('cz5', 'Charizard VSTAR', 12, Rarity.RARE, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/cz5.webp'),
  createItem('cz6', 'Charizard Holo (Base Set Reprint)', 8, Rarity.RARE, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/cz6.webp'),
  createItem('cz7', 'Charizard V (Regular)', 5, Rarity.COMMON, 30, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/cz7.webp'),
  createItem('cz8', 'Charizard Reverse Holo', 2, Rarity.COMMON, 36.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/cz8.webp'),
];

// POKEMON BUDGET BOX - $8 box, ~$3.20 EV (60% profitability)
const POKEMON_BUDGET_ITEMS: LootItem[] = [
  // High tier from Treasure Box
  createItem('pb1', 'Charizard UPC Promo Card', 25, Rarity.LEGENDARY, 0.3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p11.webp'),
  createItem('pb2', 'Pokemon 151 ETB', 65, Rarity.LEGENDARY, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb1.webp'),
  createItem('pb3', 'Iono Full Art', 18, Rarity.LEGENDARY, 0.8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb2.webp'),
  // Mid tier
  createItem('pb4', '3-Pack Blister (Random)', 15, Rarity.EPIC, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p14.webp'),
  createItem('pb5', 'Booster Bundle (3 Packs)', 12, Rarity.EPIC, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb3.webp'),
  createItem('pb6', 'Holo Rare (Random)', 5, Rarity.EPIC, 7, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb4.webp'),
  // Low tier
  createItem('pb7', 'Single Booster Pack', 4, Rarity.RARE, 18, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb5.webp'),
  createItem('pb8', 'Pokemon Sticker Pack', 2, Rarity.COMMON, 25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p15.webp'),
  createItem('pb9', 'Reverse Holo Rare', 2, Rarity.COMMON, 28, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pb6.webp'),
  createItem('pb10', 'Single Holo Rare Card', 1, Rarity.COMMON, 15.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p16.webp'),
];

// MODERN HITS BOX - $35 box, ~$21 EV (60% profitability)
const MODERN_HITS_ITEMS: LootItem[] = [
  createItem('mh1', 'Iono Special Illustration Rare', 90, Rarity.LEGENDARY, 0.3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/mh1.webp'),
  createItem('mh2', 'Giratina V Alt Art', 75, Rarity.LEGENDARY, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/mh2.webp'),
  createItem('mh3', 'Umbreon VMAX (Evolving Skies)', 55, Rarity.EPIC, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/mh3.webp'),
  createItem('mh4', 'Rayquaza VMAX Alt Art', 180, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/mh4.webp'),
  createItem('mh5', 'Crown Zenith ETB', 50, Rarity.EPIC, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/mh5.webp'),
  createItem('mh6', 'Booster Box (Latest Set)', 110, Rarity.RARE, 0.8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/mh6.webp'),
  createItem('mh7', 'Elite Trainer Box', 45, Rarity.RARE, 8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/mh7.webp'),
  createItem('mh8', '3-Pack Blister', 12, Rarity.COMMON, 35, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/mh8.webp'),
  createItem('mh9', 'Single Pack', 4, Rarity.COMMON, 51.7, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/mh9.webp'),
];

// VINTAGE VAULT BOX - $150 box, ~$90 EV (60% profitability)
const VINTAGE_VAULT_ITEMS: LootItem[] = [
  createItem('vv1', 'Base Set Booster Box (Unlimited)', 4500, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/vv1.webp'),
  createItem('vv2', 'Fossil Booster Box (1st Edition)', 3200, Rarity.LEGENDARY, 0.08, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/vv2.webp'),
  createItem('vv3', 'Team Rocket Booster Box', 2800, Rarity.LEGENDARY, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/vv3.webp'),
  createItem('vv4', 'Neo Genesis Booster Box', 1900, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/vv4.webp'),
  createItem('vv5', 'Gym Heroes Booster Box', 1400, Rarity.EPIC, 0.3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/vv5.webp'),
  createItem('vv6', 'Base Set 2 Booster Box', 900, Rarity.EPIC, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/vv6.webp'),
  createItem('vv7', 'Jungle Booster Pack (Heavy)', 180, Rarity.RARE, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/vv7.webp'),
  createItem('vv8', 'Vintage Holo Lot (5 cards)', 85, Rarity.RARE, 8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/vv8.webp'),
  createItem('vv9', 'WOTC Common/Uncommon Lot', 25, Rarity.COMMON, 35, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/vv9.webp'),
  createItem('vv10', 'Vintage Energy Cards (10x)', 8, Rarity.COMMON, 52.77, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/vv10.webp'),
];

const FOOD_ITEMS: LootItem[] = [
  createItem('f1', '$500 DoorDash Gift Card', 500, Rarity.LEGENDARY, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/f1.webp'),
  createItem('f2', '$200 Uber Eats Credit', 200, Rarity.EPIC, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/f2.webp'),
  createItem('f3', '$100 Grubhub Gift Card', 100, Rarity.EPIC, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/f3.webp'),
  createItem('f4', '$75 Multi-Restaurant Card', 75, Rarity.EPIC, 7, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/f4.webp'),
  createItem('f5', '$50 DoorDash Card', 50, Rarity.RARE, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/f5.webp'),
  createItem('f6', '$30 Restaurant.com eGift', 30, Rarity.RARE, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/f6.webp'),
  createItem('f7', '$20 Fast Food Gift Card', 20, Rarity.COMMON, 20, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/f7.webp'),
  createItem('f8', '$10 Coffee Shop Card', 10, Rarity.COMMON, 25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/f8.webp'),
  createItem('f9', '$5 Snack Credit', 5, Rarity.COMMON, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/f9.webp'),
];

const SNEAKER_ITEMS: LootItem[] = [
  createItem('s1', 'Dior x Jordan 1 High', 5000, Rarity.LEGENDARY, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/s1.webp'),
  createItem('s2', 'Travis Scott Jordan 1 Low', 1200, Rarity.LEGENDARY, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/s2.webp'),
  createItem('s3', 'Off-White Dunk Low Pine Green', 900, Rarity.EPIC, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/s3.webp'),
  createItem('s4', 'Jordan 4 Military Black', 350, Rarity.EPIC, 6, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/s4.webp'),
  createItem('s5', 'Jordan 1 High University Blue', 280, Rarity.RARE, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/s5.webp'),
  createItem('s6', 'Yeezy 350 V2 Beluga', 250, Rarity.RARE, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/s6.webp'),
  createItem('s7', 'Nike Dunk Low Panda', 180, Rarity.RARE, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/s7.webp'),
  createItem('s8', 'New Balance 550 White Green', 140, Rarity.COMMON, 30, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/s8.webp'),
  createItem('s9', 'Nike Air Force 1 White', 110, Rarity.COMMON, 30, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/s9.webp'),
];

const STEAM_ITEMS: LootItem[] = [
  createItem('st1', 'Steam Deck OLED 1TB', 649, Rarity.LEGENDARY, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/st1.webp'),
  createItem('st2', 'ASUS ROG Ally', 399, Rarity.LEGENDARY, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/st2.webp'),
  createItem('st3', '$200 Steam Gift Card', 200, Rarity.EPIC, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/st3.webp'),
  createItem('st4', '$100 Steam Gift Card', 100, Rarity.EPIC, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/st4.webp'),
  createItem('st5', 'Premium Game Bundle (5 AAA)', 150, Rarity.EPIC, 4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/st5.webp'),
  createItem('st6', '$50 Steam Gift Card', 50, Rarity.RARE, 18, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/st6.webp'),
  createItem('st7', 'AAA Game Key (Elden Ring/BG3)', 60, Rarity.RARE, 9, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/st7.webp'),
  createItem('st8', 'Indie Game Bundle (10 games)', 30, Rarity.COMMON, 30, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/st8.webp'),
  createItem('st9', '$10 Steam Gift Card', 10, Rarity.COMMON, 30, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/st9.webp'),
];

const TECH_ITEMS: LootItem[] = [
  createItem('t1', 'MacBook Pro 14" M3 Pro', 1999, Rarity.LEGENDARY, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t1.webp'),
  createItem('t2', 'MacBook Air 15" M2', 1099, Rarity.LEGENDARY, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t2.webp'),
  createItem('t3', 'iPhone 15 Pro 256GB', 999, Rarity.EPIC, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t3.webp'),
  createItem('t4', 'iPad Pro 11" M2', 799, Rarity.EPIC, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t4.webp'),
  createItem('t5', 'iPhone 15 128GB', 799, Rarity.EPIC, 4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t5.webp'),
  createItem('t6', 'iPad Air M1 256GB', 599, Rarity.RARE, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t6.webp'),
  createItem('t7', 'Apple Watch Series 9 GPS', 399, Rarity.RARE, 8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t7.webp'),
  createItem('t8', 'AirPods Pro 2nd Gen', 249, Rarity.RARE, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t8.webp'),
  createItem('t9', 'Apple Magic Keyboard + Mouse', 99, Rarity.COMMON, 60, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t9.webp'),
];

const SUPREME_ITEMS: LootItem[] = [
  createItem('su1', 'Supreme x Louis Vuitton Box Logo', 5000, Rarity.LEGENDARY, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/su1.webp'),
  createItem('su2', 'Supreme Box Logo Hoodie (Red)', 1500, Rarity.LEGENDARY, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/su2.webp'),
  createItem('su3', 'Supreme x TNF Nuptse Jacket', 800, Rarity.EPIC, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/su3.webp'),
  createItem('su4', 'Supreme x Nike SB Dunk Low', 600, Rarity.EPIC, 4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/su4.webp'),
  createItem('su5', 'Supreme Box Logo Tee', 250, Rarity.RARE, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/su5.webp'),
  createItem('su6', 'Supreme Hoodie (Season Drop)', 180, Rarity.RARE, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/su6.webp'),
  createItem('su7', 'Supreme Accessories (Belt/Bag)', 150, Rarity.RARE, 12, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/su7.webp'),
  createItem('su8', 'Supreme Camp Cap', 80, Rarity.COMMON, 30, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/su8.webp'),
  createItem('su9', 'Supreme Sticker Pack + Keychain', 10, Rarity.COMMON, 30, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/su9.webp'),
];


const APPLE_BUDGET_ITEMS: LootItem[] = [
  createItem('ab1', 'iPhone 12 (Refurbished)', 350, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ab1.webp'),
  createItem('ab2', 'iPad 9th Gen', 250, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ab2.webp'),
  createItem('ab3', 'AirPods 2nd Gen', 99, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ab3.webp'),
  createItem('ab4', 'Apple Pencil 2nd Gen', 89, Rarity.EPIC, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ab4.webp'),
  createItem('ab5', 'AirTag 4-Pack', 85, Rarity.EPIC, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ab5.webp'),
  createItem('ab6', 'MagSafe Charger', 39, Rarity.RARE, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ab6.webp'),
  createItem('ab7', 'Apple AirTag (Single)', 29, Rarity.RARE, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ab7.webp'),
  createItem('ab8', 'Apple Polishing Cloth', 19, Rarity.COMMON, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ab8.webp'),
  createItem('ab9', 'USB-C to Lightning Cable', 15, Rarity.COMMON, 20, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ab9.webp'),
  createItem('ab10', 'Apple Logo Sticker', 2, Rarity.COMMON, 60.24, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ab10.webp'),
];

const SAMSUNG_BUDGET_ITEMS: LootItem[] = [
  createItem('sb1', 'Samsung Galaxy A54', 350, Rarity.LEGENDARY, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sb1.webp'),
  createItem('sb2', 'Galaxy Watch 6', 250, Rarity.LEGENDARY, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sb2.webp'),
  createItem('sb3', 'Galaxy Buds 2 Pro', 150, Rarity.EPIC, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sb3.webp'),
  createItem('sb4', 'Samsung T7 SSD 1TB', 89, Rarity.EPIC, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sb4.webp'),
  createItem('sb5', 'Wireless Charger Trio', 60, Rarity.EPIC, 7, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sb5.webp'),
  createItem('sb6', 'SmartTag2 4-Pack', 50, Rarity.RARE, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sb6.webp'),
  createItem('sb7', '45W Power Adapter', 35, Rarity.RARE, 20, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sb7.webp'),
  createItem('sb8', 'SmartTag2 (Single)', 25, Rarity.COMMON, 25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sb8.webp'),
  createItem('sb9', 'USB-C Cable', 10, Rarity.COMMON, 23.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sb9.webp'),
];

// GAMER BUDGET BOX - $10 box, ~$4.00 EV (60% profitability)
const GAMER_BUDGET_ITEMS: LootItem[] = [
  // Ultra rare tech items from TECH PREMIUM BOX (very low odds)
  createItem('gb1', 'iPhone 15 Pro 256GB', 999, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t3.webp'),
  createItem('gb2', 'iPad Pro 11" M2', 799, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t4.webp'),
  createItem('gb3', 'AirPods Pro 2nd Gen', 249, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t8.webp'),
  createItem('gb4', 'Apple Watch Series 9 GPS', 399, Rarity.EPIC, 0.02, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/t7.webp'),
  // Gaming peripherals (reduced odds for profitability)
  createItem('gb5', 'Razer Huntsman Mini', 120, Rarity.LEGENDARY, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gb1.webp'),
  createItem('gb6', 'Logitech G502 Hero', 50, Rarity.EPIC, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gb2.webp'),
  createItem('gb7', 'HyperX Cloud Stinger 2', 40, Rarity.EPIC, 0.8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gb3.webp'),
  createItem('gb8', 'Xbox Wireless Controller', 60, Rarity.EPIC, 0.4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gb4.webp'),
  // Budget items
  createItem('gb9', 'Steam Gift Card $20', 20, Rarity.RARE, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gb5.webp'),
  createItem('gb10', 'Razer Gigantus V2 (Large)', 15, Rarity.RARE, 4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gb6.webp'),
  createItem('gb11', 'Steam Gift Card $10', 10, Rarity.COMMON, 8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gb7.webp'),
  createItem('gb12', 'Random Steam Key (Indie)', 5, Rarity.COMMON, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gb8.webp'),
  createItem('gb13', 'Cat 6 Ethernet Cable', 5, Rarity.COMMON, 68.89, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gb9.webp'),
];

// 2025 APPLE BOX - $75.99 box, ~$45.60 EV (40% profitability)
const APPLE_2025_ITEMS: LootItem[] = [
  createItem('ap25_1', 'iPhone 17 Pro Max Cosmic Orange', 1599, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_1.webp'),
  createItem('ap25_2', 'iPhone 17 Pro Deep Blue', 1499, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_2.webp'),
  createItem('ap25_3', 'iPhone 17 Pro Silver', 1499, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_3.webp'),
  createItem('ap25_4', 'iPhone Air Cloud White', 1399, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_4.webp'),
  createItem('ap25_5', 'iPhone Air Space Light Gold', 1399, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_5.webp'),
  createItem('ap25_6', 'iPhone Air Space Sky Blue', 1399, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_6.webp'),
  createItem('ap25_7', 'iPhone Air Space Black', 1399, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_7.webp'),
  createItem('ap25_8', 'iPhone 17 Black', 1029, Rarity.LEGENDARY, 0.08, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_8.webp'),
  createItem('ap25_9', 'iPhone 17 Mist Blue', 1029, Rarity.LEGENDARY, 0.08, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_9.webp'),
  createItem('ap25_10', 'iPhone 17 Sage', 1029, Rarity.LEGENDARY, 0.08, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_10.webp'),
  createItem('ap25_11', 'iPhone 17 White', 1029, Rarity.LEGENDARY, 0.08, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_11.webp'),
  createItem('ap25_12', 'iPhone 17 Lavender', 1029, Rarity.LEGENDARY, 0.08, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_12.webp'),
  createItem('ap25_13', 'Watch Ultra 3 Titanium Milanese Loop Black', 899, Rarity.EPIC, 0.15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_13.webp'),
  createItem('ap25_14', 'Watch Ultra 3 Titanium Milanese Loop Natural', 899, Rarity.EPIC, 0.15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_14.webp'),
  createItem('ap25_15', 'Watch Ultra 3 Natural Ocean Band Neon Green', 799, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_15.webp'),
  createItem('ap25_16', 'Watch Ultra 3 Alpine Loop Black', 799, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_16.webp'),
  createItem('ap25_17', 'Watch Series 11 Titanium Milanese Loop Slate', 774, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_17.webp'),
  createItem('ap25_18', 'Watch Series 11 Titanium Milanese Loop Gold', 774, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_18.webp'),
  createItem('ap25_19', 'Watch Series 11 Titanium Milanese Loop Natural', 774, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_19.webp'),
  createItem('ap25_20', 'Watch Series 11 Aluminum Jet Black Sport Band', 414, Rarity.EPIC, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_20.webp'),
  createItem('ap25_21', 'Watch Series 11 Aluminum Rose Gold Pride Edition', 414, Rarity.EPIC, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_21.webp'),
  createItem('ap25_22', 'Watch Series 11 Aluminum Silver Nike Veiled Grey', 414, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_22.webp'),
  createItem('ap25_23', 'Watch Series 11 Aluminum Space Gray Anchor Blue', 414, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_23.webp'),
  createItem('ap25_24', 'Watch SE 3 Rubber Sport Band Light Blush', 279, Rarity.RARE, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_24.webp'),
  createItem('ap25_25', 'Watch SE 3 Rubber Sport Band Midnight', 279, Rarity.RARE, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_25.webp'),
  createItem('ap25_26', 'AirPods Pro 3', 249, Rarity.RARE, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_26.webp'),
  createItem('ap25_27', 'Apple Gift Card $250', 229.99, Rarity.RARE, 3.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_27.webp'),
  createItem('ap25_28', 'Red Delicious Apple', 0.99, Rarity.COMMON, 88.45, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ap25_28.webp'),
];

// PC COMPONENTS BOX
const PC_COMPONENTS_ITEMS: LootItem[] = [
  createItem('pc1', 'AMD Radeon RX 6900 XT', 915, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc1.webp'),
  createItem('pc2', 'AMD Radeon RX 6800', 850, Rarity.LEGENDARY, 0.025, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc2.webp'),
  createItem('pc3', 'AMD Radeon RX 6800 XT', 530, Rarity.LEGENDARY, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc3.webp'),
  createItem('pc4', 'AMD Radeon RX 6700 XT', 510, Rarity.EPIC, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc4.webp'),
  createItem('pc5', 'ASUS TUF Gaming X570-Plus (Wi-Fi)', 210, Rarity.EPIC, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc5.webp'),
  createItem('pc6', 'Corsair RM850x ATX 3.1', 150, Rarity.EPIC, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc6.webp'),
  createItem('pc7', 'Corsair Vengeance RGB Pro', 80, Rarity.RARE, 6, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc7.webp'),
  createItem('pc8', 'Corsair Vengeance LPX', 35, Rarity.RARE, 23, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc8.webp'),
  createItem('pc9', 'SanDisk SSD Plus', 32.5, Rarity.RARE, 21, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc9.webp'),
  createItem('pc10', 'Noctua NF-F12 PWM', 22, Rarity.RARE, 20.55, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc10.webp'),
  createItem('pc11', 'Corsair AF140', 20, Rarity.COMMON, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc11.webp'),
  createItem('pc12', 'LootVibe $10 Voucher', 10, Rarity.COMMON, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc12.webp'),
  createItem('pc13', 'LootVibe $9 Voucher', 9, Rarity.COMMON, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc13.webp'),
];

// NINTENDO SWITCH 2 BOX
const SWITCH_2_ITEMS: LootItem[] = [
  createItem('sw2_1', 'Switch 2 - Mario Kart World Bundle', 449.99, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_1.webp'),
  createItem('sw2_2', 'Nintendo Switch 2', 449.96, Rarity.LEGENDARY, 0.02, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_2.webp'),
  createItem('sw2_3', 'Switch 2 Dock Set', 389, Rarity.LEGENDARY, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_3.webp'),
  createItem('sw2_4', 'Gamecube Controller', 180, Rarity.LEGENDARY, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_4.webp'),
  createItem('sw2_5', 'Switch 2 All-In-One Carrying Case', 109, Rarity.LEGENDARY, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_5.webp'),
  createItem('sw2_6', 'Joy-Con 2 Pair', 95.39, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_6.webp'),
  createItem('sw2_7', 'Switch 2 Pro Controller', 89.99, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_7.webp'),
  createItem('sw2_8', 'Donkey Kong Bananza - Switch 2', 71.99, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_8.webp'),
  createItem('sw2_9', 'Nintendo x SanDisk microSDXC Express Card', 71.99, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_9.webp'),
  createItem('sw2_10', 'Mario Kart World - Nintendo Switch 2', 71.09, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_10.webp'),
  createItem('sw2_11', 'Switch 2 Camera', 68.39, Rarity.EPIC, 0.3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_11.webp'),
  createItem('sw2_12', 'Zelda Tears Of The Kingdom Switch 2 Edition', 62.99, Rarity.RARE, 0.3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_12.webp'),
  createItem('sw2_13', 'Cyberpunk 2077 Ultimate Edition - Switch 2', 62.99, Rarity.RARE, 0.4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_13.webp'),
  createItem('sw2_14', 'Civilization VII – Switch 2 Edition', 58.49, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_14.webp'),
  createItem('sw2_15', 'Zelda: Breath of the Wild - Switch 2 Edition', 58.49, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_15.webp'),
  createItem('sw2_16', 'Joy-Con 2 - Right Hand', 53.99, Rarity.RARE, 0.6, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_16.webp'),
  createItem('sw2_17', 'Joy-Con 2 - Left Hand', 53.99, Rarity.RARE, 0.6, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_17.webp'),
  createItem('sw2_18', 'Hori x Nintendo Piranha Plant Camera', 53.99, Rarity.RARE, 0.6, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_18.webp'),
  createItem('sw2_19', 'Hogwarts Legacy - Nintendo Switch 2', 52.19, Rarity.RARE, 0.6, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_19.webp'),
  createItem('sw2_20', 'Hitman: World of Assassination - Switch 2', 52.19, Rarity.RARE, 0.6, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_20.webp'),
  createItem('sw2_21', 'Street Fighter 6 Years 1-2 - Switch 2', 47.69, Rarity.RARE, 0.8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_21.webp'),
  createItem('sw2_22', 'Split Fiction - Nintendo Switch 2', 44.99, Rarity.RARE, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_22.webp'),
  createItem('sw2_23', 'Raidou: Remastered - Switch 2', 44.09, Rarity.RARE, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_23.webp'),
  createItem('sw2_24', 'Yakuza 0: Director\'s Cut - Switch 2', 44.09, Rarity.RARE, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_24.webp'),
  createItem('sw2_25', 'Sonic x Shadow Generations - Switch 2', 44.09, Rarity.RARE, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_25.webp'),
  createItem('sw2_26', 'eShop Gift Card €50', 41.77, Rarity.RARE, 0.9, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_26.webp'),
  createItem('sw2_27', 'Joy-Con 2 Charging Grip', 39.59, Rarity.COMMON, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_27.webp'),
  createItem('sw2_28', 'Nintendo Switch 2 AC Adapter', 35.99, Rarity.COMMON, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_28.webp'),
  createItem('sw2_29', 'Switch 2 Carrying Case and Screen Protector', 31.49, Rarity.COMMON, 8.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_29.webp'),
  createItem('sw2_30', 'Joy-Con 2 Wheel Pair', 23.39, Rarity.COMMON, 22, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_30.webp'),
  createItem('sw2_31', 'LootVibe Squeaky Duck', 18, Rarity.COMMON, 22, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_31.webp'),
  createItem('sw2_32', 'Joy-Con 2 Strap', 17.99, Rarity.COMMON, 23.47, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/sw2_32.webp'),
];

// RTX 1% BOX
const RTX_1_PERCENT_ITEMS: LootItem[] = [
  createItem('rtx1', 'Gigabyte Nvidia GeForce RTX 5090 Aorus Master', 2970, Rarity.LEGENDARY, 0.002, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx1.webp'),
  createItem('rtx2', 'Gigabyte Nvidia GeForce RTX 4090 Gaming OC', 1980, Rarity.LEGENDARY, 0.004, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx2.webp'),
  createItem('rtx3', 'Gigabyte Nvidia GeForce RTX 4080 OC', 1305, Rarity.LEGENDARY, 0.008, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx3.webp'),
  createItem('rtx4', 'Asus Nvidia GeForce RTX 4080 TUF OC', 1305, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx4.webp'),
  createItem('rtx5', 'Zotac Nvidia GeForce RTX 5080 Extreme Infinity', 1296, Rarity.LEGENDARY, 0.006, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx5.webp'),
  createItem('rtx6', 'Yeston Sakura Sugar Nvidia GeForce RTX 4080 Super', 1080, Rarity.LEGENDARY, 0.025, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx6.webp'),
  createItem('rtx7', 'Yeston Sakura Nvidia GeForce RTX 4070 TI Super', 900, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx7.webp'),
  createItem('rtx8', 'Zotac Nvidia GeForce RTX 4070 Ti Trinity OC', 855, Rarity.EPIC, 0.295, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx8.webp'),
  createItem('rtx9', 'Gigabyte Nvidia GeForce RTX 5070 Ti WINDFORCE OC', 836.1, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx9.webp'),
  createItem('rtx10', 'Asus Nvidia GeForce RTX 4070 TUF OC', 720, Rarity.EPIC, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx10.webp'),
  createItem('rtx11', 'LootVibe €0.02 Voucher', 0.02, Rarity.COMMON, 99, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx11.webp'),
];

// FREE BOX ITEMS (Rigged for Welcome Bonus)
const FREE_BOX_ITEMS: LootItem[] = [
  // Tease items (High Value, High Visual Odds for Reel)
  createItem('p1', 'PSA 10 Charizard Base Set 1st Edition', 250000, Rarity.LEGENDARY, 20, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/p1.webp'),
  createItem('rtx1', 'Gigabyte Nvidia GeForce RTX 5090 Aorus Master', 2970, Rarity.LEGENDARY, 20, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rtx1.webp'),
  createItem('son1', 'Supreme Meissen Hand-Painted Porcelain Cupid', 6393.6, Rarity.LEGENDARY, 20, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son1.webp'),
  createItem('cz1', 'Charizard ex 151 SIR PSA 10', 200, Rarity.LEGENDARY, 20, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/cz1.webp'),

  // The Guaranteed Win (Hidden low odds but forced by logic)
  createItem('pc12', 'LootVibe $10 Voucher', 10, Rarity.COMMON, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pc12.webp'),
];

// SUPREME OR NOT BOX
const SUPREME_OR_NOT_ITEMS: LootItem[] = [
  createItem('son1', 'Supreme Meissen Hand-Painted Porcelain Cupid', 6393.6, Rarity.LEGENDARY, 0.001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son1.webp'),
  createItem('son2', 'Supreme x RIMOWA Topas Multiwheel 45L', 3412.8, Rarity.LEGENDARY, 0.001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son2.webp'),
  createItem('son3', 'Supreme x RIMOWA Cabin Plus Black', 1836, Rarity.LEGENDARY, 0.00125, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son3.webp'),
  createItem('son4', 'Supreme x Louis Vuitton Monogram Scarf Brown', 1674, Rarity.LEGENDARY, 0.00125, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son4.webp'),
  createItem('son5', 'Supreme x Stone Island Painted Camo Down Jacket', 1206, Rarity.LEGENDARY, 0.00125, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son5.webp'),
  createItem('son6', 'Supreme x The North Face RTG Jacket + Vest', 1080, Rarity.LEGENDARY, 0.00375, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son6.webp'),
  createItem('son7', 'Supreme x The North Face S Logo Mountain Jacket', 888, Rarity.LEGENDARY, 0.00125, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son7.webp'),
  createItem('son8', 'Supreme x The North Face S Logo Mountain Jacket', 834, Rarity.LEGENDARY, 0.005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son8.webp'),
  createItem('son9', 'Supreme x The North Face Cargo Jacket', 834, Rarity.LEGENDARY, 0.005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son9.webp'),
  createItem('son10', 'Supreme Numark PT01 Portable Turntable', 626.4, Rarity.LEGENDARY, 0.005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son10.webp'),
  createItem('son11', 'Supreme x The North Face RTG Backpack', 561.6, Rarity.EPIC, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son11.webp'),
  createItem('son12', 'Nike x Supreme SB Dunk Low Stars', 582, Rarity.EPIC, 0.005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son12.webp'),
  createItem('son13', 'Supreme Cross Box Logo Hooded Sweatshirt', 528, Rarity.EPIC, 0.0075, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son13.webp'),
  createItem('son14', 'Nike x Supreme SB Dunk Low Stars Hyper Royal', 462, Rarity.EPIC, 0.00125, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son14.webp'),
  createItem('son15', 'Supreme Backpack (SS20)', 388.8, Rarity.EPIC, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son15.webp'),
  createItem('son16', 'Supreme Diamond Plate Tool Box', 378, Rarity.EPIC, 0.0125, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son16.webp'),
  createItem('son17', 'Supreme x Nike Half Zip Hooded Sweatshirt', 323, Rarity.EPIC, 0.0125, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son17.webp'),
  createItem('son18', 'Supreme x Takashi Murakami COVID-19 Relief Tee', 330, Rarity.EPIC, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son18.webp'),
  createItem('son19', 'Supreme Smurfs Skateboard', 217.8, Rarity.RARE, 0.175, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son19.webp'),
  createItem('son20', 'Supreme Seiko Marathon Clock', 199.8, Rarity.RARE, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son20.webp'),
  createItem('son21', 'Supreme Pyle Waterproof Megaphone', 186.3, Rarity.RARE, 0.0125, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son21.webp'),
  createItem('son22', 'Supreme Wavian 5L Jerry Can', 135, Rarity.RARE, 2.15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son22.webp'),
  createItem('son23', 'Supreme Metal Folding Chair', 129.6, Rarity.RARE, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son23.webp'),
  createItem('son24', 'Supreme Futura Logo 5-Panel', 117, Rarity.RARE, 0.4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son24.webp'),
  createItem('son25', 'Supreme Distorted Logo Skateboard Deck', 100.8, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son25.webp'),
  createItem('son26', 'Supreme x Kaws Chalk Logo Skateboard Deck', 94.5, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son26.webp'),
  createItem('son27', 'Supreme Watch Plate', 53.1, Rarity.COMMON, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son27.webp'),
  createItem('son28', 'Supreme x Ty Beanie Baby Plush', 43.2, Rarity.COMMON, 4.568, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son28.webp'),
  createItem('son29', 'LootVibe Voucher', 0.01, Rarity.COMMON, 90, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/son29.webp'),
];

// BIG MIX BOX
const BIG_MIX_ITEMS: LootItem[] = [
  createItem('bm1', 'Nike x Dior Jordan 1 Retro High', 9050, Rarity.LEGENDARY, 0.0001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm1.webp'),
  createItem('bm2', 'Apple Macbook M4 Max 16"', 4149, Rarity.LEGENDARY, 0.0001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm2.webp'),
  createItem('bm3', 'Nike x Off-White Jordan 1 Retro High Chicago', 4205, Rarity.LEGENDARY, 0.0001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm3.webp'),
  createItem('bm4', 'ASUS Nvidia GeForce RTX 4090 ROG Strix OC', 2200, Rarity.LEGENDARY, 0.0004, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm4.webp'),
  createItem('bm5', 'Dior x Jordan Wings Messenger Bag', 1925, Rarity.LEGENDARY, 0.0001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm5.webp'),
  createItem('bm6', 'Supreme x Stone Island Painted Camo Down Jacket', 1785, Rarity.LEGENDARY, 0.0008, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm6.webp'),
  createItem('bm7', 'Dior B23 High Top Logo Oblique', 1542.5, Rarity.LEGENDARY, 0.0001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm7.webp'),
  createItem('bm8', 'Nike x Union LA Jordan 1 Retro High Black Toe', 1222.5, Rarity.LEGENDARY, 0.0003, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm8.webp'),
  createItem('bm9', 'AMD Radeon RX 6900 XT', 915, Rarity.LEGENDARY, 0.0001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm9.webp'),
  createItem('bm10', 'Gigabyte Z590 AORUS Xtreme', 850, Rarity.LEGENDARY, 0.0005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm10.webp'),
  createItem('bm11', 'Zotac Nvidia GeForce RTX 4070 Ti Trinity OC', 750, Rarity.EPIC, 0.0004, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm11.webp'),
  createItem('bm12', 'Nike SB Dunk Low Sean Cliver', 562.5, Rarity.EPIC, 0.00055, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm12.webp'),
  createItem('bm13', 'Sony PS5 Slim Blue-ray Edition (US Plug)', 550, Rarity.EPIC, 0.00035, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm13.webp'),
  createItem('bm14', 'AMD Radeon RX 6800 XT', 530, Rarity.EPIC, 0.0001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm14.webp'),
  createItem('bm15', 'Microsoft Xbox Series S (US Plug)', 405, Rarity.EPIC, 0.0005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm15.webp'),
  createItem('bm16', 'Logitech G923 Xbox|PC', 400, Rarity.EPIC, 0.00155, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm16.webp'),
  createItem('bm17', 'adidas Yeezy Boost 350 V2 Tail Light', 365, Rarity.EPIC, 0.0003, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm17.webp'),
  createItem('bm18', 'Nike Jordan 4 Retro SE Sashiko', 345, Rarity.EPIC, 0.00075, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm18.webp'),
  createItem('bm19', 'Nike Jordan 1 Low Spades', 300, Rarity.EPIC, 0.0018, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm19.webp'),
  createItem('bm20', 'Nike Jordan 1 Retro High', 265, Rarity.EPIC, 0.0003, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm20.webp'),
  createItem('bm21', 'Nike Dunk Low Bordeaux (W)', 275, Rarity.RARE, 0.00075, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm21.webp'),
  createItem('bm22', 'Nike SB Dunk High Carpet Company', 252.5, Rarity.RARE, 0.0006, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm22.webp'),
  createItem('bm23', 'Valve Steam 250 USD Gift Card', 245, Rarity.RARE, 0.00375, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm23.webp'),
  createItem('bm24', 'Nike Jordan 1 Retro High 85', 225, Rarity.RARE, 0.0003, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm24.webp'),
  createItem('bm25', 'Travis Scott x Jordan Cactus Jack Highest Hoodie', 227.5, Rarity.RARE, 0.00075, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm25.webp'),
  createItem('bm26', 'adidas Yeezy Foam RNNR', 197.5, Rarity.RARE, 0.0003, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm26.webp'),
  createItem('bm27', 'Samsung SSD 870 QVO', 182.5, Rarity.RARE, 0.0015, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm27.webp'),
  createItem('bm28', 'Sony PS5 Pulse 3D Wireless', 175, Rarity.RARE, 0.0085, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm28.webp'),
  createItem('bm29', 'Nike Dunk Low SP Champ Colors', 180, Rarity.RARE, 0.00075, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm29.webp'),
  createItem('bm30', 'Nike Jordan 1 Retro High Patina', 180, Rarity.RARE, 0.001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm30.webp'),
  createItem('bm31', 'Nike Dunk Low Medium Curry', 135, Rarity.RARE, 0.0023, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm31.webp'),
  createItem('bm32', 'Nike Jordan 1 Retro High CO Japan', 127.5, Rarity.RARE, 0.0045, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm32.webp'),
  createItem('bm33', 'Razer Ornata V3', 70, Rarity.RARE, 0.006, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm33.webp'),
  createItem('bm34', 'Travis Scott Cactus Jack Face Mask', 50, Rarity.COMMON, 0.6735, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm34.webp'),
  createItem('bm35', 'Corsair LL120 RGB', 40, Rarity.COMMON, 4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm35.webp'),
  createItem('bm36', '505 Games Control Ultimate Edition Steam Code', 14, Rarity.COMMON, 3.4878, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm36.webp'),
  createItem('bm37', 'Capcom Resident Evil 3 Steam Digital Code', 10, Rarity.COMMON, 1.7985, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm37.webp'),
  createItem('bm38', 'LootVibe Voucher', 0.01, Rarity.COMMON, 90, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bm38.webp'),
];

// 1% RICH CLUB BOX
const RICH_CLUB_ITEMS: LootItem[] = [
  createItem('rc1', 'Porsche 2023 Taycan Turbo S', 188850, Rarity.LEGENDARY, 0.003, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc1.webp'),
  createItem('rc2', 'Icebox Solitaire Diamond Stud Earrings 3.50ctw', 54339.99, Rarity.LEGENDARY, 0.013, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc2.webp'),
  createItem('rc3', 'Rolex Day-Date 40 - 228239 Blue Dial', 49999.99, Rarity.LEGENDARY, 0.004, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc3.webp'),
  createItem('rc4', 'Icebox 8mm Miami Cuban 14k Chain', 29699, Rarity.LEGENDARY, 0.068, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc4.webp'),
  createItem('rc5', 'Icebox 2pt Miracle Set Necklace 4.00ctw', 24379.99, Rarity.LEGENDARY, 0.03, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc5.webp'),
  createItem('rc6', 'Apmex 5 oz Gold Bar - Secondary Market', 20589.99, Rarity.LEGENDARY, 0.04, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc6.webp'),
  createItem('rc7', 'Apmex 10 oz Platinum Bar - Credit Suisse', 17339.99, Rarity.LEGENDARY, 0.034, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc7.webp'),
  createItem('rc8', 'Icebox Large Nail Bangle Bracelet 3.25ctw', 12749.99, Rarity.LEGENDARY, 0.058, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc8.webp'),
  createItem('rc9', 'Yamaha 2024 R7', 12500, Rarity.LEGENDARY, 0.03, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc9.webp'),
  createItem('rc10', 'Icebox Cuban Bangle Bracelet 1.65ctw', 11249.99, Rarity.EPIC, 0.17, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc8.webp'),
  createItem('rc11', 'Tudor Black Bay', 8841, Rarity.EPIC, 0.04, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb2.webp'),
  createItem('rc12', 'Rolex x Icebox Datejust 0.75ctw', 7255, Rarity.EPIC, 0.11, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc12.webp'),
  createItem('rc13', 'Axel Crieger No Body Digital C-Print', 6400, Rarity.EPIC, 0.4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc13.webp'),
  createItem('rc14', 'LootVibe $0.01 Voucher', 0.01, Rarity.COMMON, 99, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/rc14.webp'),
];

// POKER BOX
const POKER_ITEMS: LootItem[] = [
  createItem('pk1', 'WSOP Main Event Package Ticket', 20000, Rarity.LEGENDARY, 0.005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk1.webp'),
  createItem('pk2', 'Monte Carlo $5000 Poker Chip', 5000, Rarity.LEGENDARY, 0.001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk15.webp'),
  createItem('pk3', 'Smythson Panama Poker Set', 4559.99, Rarity.LEGENDARY, 0.001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk5.webp'),
  createItem('pk4', 'Jacks Prestige Series XL 10 Seater Poker Table', 3830, Rarity.LEGENDARY, 0.002, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk7.webp'),
  createItem('pk5', 'Triton Complete Poker Room Set', 3200, Rarity.LEGENDARY, 0.002, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk5.webp'),
  createItem('pk6', 'Triton Poker Table Chair Combo', 2900, Rarity.LEGENDARY, 0.0025, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk6.webp'),
  createItem('pk7', 'Jacks Prestige Series 9 Seater Poker Table', 2550, Rarity.LEGENDARY, 0.0025, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk7.webp'),
  createItem('pk8', 'Triton 90" Premium Folding Poker Table', 1700, Rarity.LEGENDARY, 0.005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk8.webp'),
  createItem('pk9', 'Hector Saxe x Brown Zebra Poker Set', 1179.99, Rarity.EPIC, 0.005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk9.webp'),
  createItem('pk10', 'Shuffletech EPT Playing Cards - Single Deck', 925, Rarity.EPIC, 0.005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk4.webp'),
  createItem('pk11', 'Jacks Heavy Duty Pedestal Table', 640, Rarity.EPIC, 0.02, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk11.webp'),
  createItem('pk12', 'Lucky Luciano $500 Poker Chip', 500, Rarity.EPIC, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk12.webp'),
  createItem('pk13', 'Shinola Lacquered Wood Poker Set', 495, Rarity.EPIC, 0.02, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk13.webp'),
  createItem('pk14', 'The Ivey Fleur De Lys 10 Seater Poker Table', 447.12, Rarity.EPIC, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk14.webp'),
  createItem('pk15', 'Shuffletech MDS 6 Deck Automatic Shuffler', 335, Rarity.EPIC, 0.0685, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk15.webp'),
  createItem('pk16', 'Port Royal 500 Chip Poker Set', 302, Rarity.RARE, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk16.webp'),
  createItem('pk17', 'League Series 8 Seater Round Poker Table', 223, Rarity.RARE, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk17.webp'),
  createItem('pk18', 'True Rocks Vegas 7 Poker Chip Necklace', 212, Rarity.RARE, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk18.webp'),
  createItem('pk19', 'Monte Carlo 500 Chip Poker Set', 124, Rarity.RARE, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk19.webp'),
  createItem('pk20', 'Prestige 8 Deck Dealer Shoe', 109, Rarity.RARE, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk20.webp'),
  createItem('pk21', 'Monte Carlo $100 Poker Chip', 100, Rarity.RARE, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk21.webp'),
  createItem('pk22', 'JPT Poker Games Mat', 70, Rarity.COMMON, 7.4735, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk22.webp'),
  createItem('pk23', 'Fournier EPT Playing Cards', 25.50, Rarity.COMMON, 7, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk23.webp'),
  createItem('pk24', 'Lucky Luciano $25 Poker Chip', 25, Rarity.COMMON, 4.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk24.webp'),
  createItem('pk25', 'Copag 1546 Elite Jumbo Playing Cards', 23.50, Rarity.COMMON, 4.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk25.webp'),
  createItem('pk26', 'Bicycle Prestige Playing Cards', 19, Rarity.COMMON, 4.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk26.webp'),
  createItem('pk27', 'Fournier EPT Playing Cards - Single Deck', 16, Rarity.COMMON, 5.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk27.webp'),
  createItem('pk28', 'Copag Texas Hold Em', 15, Rarity.COMMON, 5.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk28.webp'),
  createItem('pk29', 'Jacks Pro Playing Cards - Black & Gold', 13.99, Rarity.COMMON, 5.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk14.webp'),
  createItem('pk30', 'Jacks Pro All In Triangle', 8.37, Rarity.COMMON, 7.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk30.webp'),
  createItem('pk31', 'Jacks Dealer Button', 3.50, Rarity.COMMON, 11.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk31.webp'),
  createItem('pk32', 'Jacks Signature Cut Card', 1.92, Rarity.COMMON, 12.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk32.webp'),
  createItem('pk33', 'Monte Carlo $1 Poker Chip', 1, Rarity.COMMON, 17.375, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk33.webp'),
  createItem('pk34', 'Monte Carlo $0.50 Poker Chip', 0.50, Rarity.COMMON, 0, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/pk34.webp'),
];

// GOLF BOX - $79.99 box, ~$48.00 EV (40% profitability)
const GOLF_ITEMS: LootItem[] = [
  createItem('gf1', 'Titleist TSR4 Driver', 649, Rarity.LEGENDARY, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf1.webp'),
  createItem('gf2', 'TaylorMade Stealth 2 Plus Driver', 599, Rarity.LEGENDARY, 0.15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf2.webp'),
  createItem('gf3', 'Callaway Paradym Ai Smoke Driver', 599, Rarity.LEGENDARY, 0.15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf3.webp'),
  createItem('gf4', 'Titleist T200 Iron Set (4-PW)', 1599, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf4.webp'),
  createItem('gf5', 'Scotty Cameron Phantom X Putter', 499, Rarity.EPIC, 0.3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf5.webp'),
  createItem('gf6', 'Ping G430 Max Driver', 549, Rarity.EPIC, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf6.webp'),
  createItem('gf7', 'TaylorMade Spider Tour X Putter', 449, Rarity.EPIC, 0.4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf7.webp'),
  createItem('gf8', 'Titleist Pro V1 Golf Balls (4 Dozen)', 219.96, Rarity.RARE, 3.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf8.webp'),
  createItem('gf9', 'FootJoy Pro SL Carbon Golf Shoes', 199, Rarity.RARE, 4.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf9.webp'),
  createItem('gf10', 'Callaway Chrome Soft Golf Balls (3 Dozen)', 164.97, Rarity.RARE, 6, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf10.webp'),
  createItem('gf11', 'Bushnell Pro XE Rangefinder', 499, Rarity.RARE, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf11.webp'),
  createItem('gf12', 'LootVibe Golf Tees Pack', 5, Rarity.COMMON, 82.6, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/gf12.webp'),
];

// BIG BALLER BOX
const BIG_BALLER_ITEMS: LootItem[] = [
  createItem('bb1', 'Rolex Daytona - 116509 Silver Dial', 49999.99, Rarity.LEGENDARY, 0.0002, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb1.webp'),
  createItem('bb2', 'Rolex Datejust 36 - 126200 Blue Dial', 14999.99, Rarity.LEGENDARY, 0.0005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb2.webp'),
  createItem('bb3', 'Tudor Black Bay', 5544, Rarity.LEGENDARY, 0.001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb3.webp'),
  createItem('bb4', 'Louis Vuitton x Nigo Monogram Patchwork Denim Hoodie', 3690, Rarity.LEGENDARY, 0.001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb4.webp'),
  createItem('bb5', 'Gucci x The North Face Down Vest', 3615, Rarity.LEGENDARY, 0.001, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb5.webp'),
  createItem('bb6', 'Louis Vuitton x Murakami Neverfull MM Bag', 2960, Rarity.LEGENDARY, 0.002, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb6.webp'),
  createItem('bb7', 'Louis Vuitton Speedy Bandouliere Monogram 25', 2210, Rarity.LEGENDARY, 0.002, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb7.webp'),
  createItem('bb8', 'Dior Zipped Pouch with Strap', 1700, Rarity.LEGENDARY, 0.002, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb8.webp'),
  createItem('bb9', 'Dior Oblique Short-Sleeved Shirt Silk Twill', 1650, Rarity.EPIC, 0.005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb9.webp'),
  createItem('bb10', 'Apple Watch Series 10 Titanium (GPS+Cellular)', 770, Rarity.EPIC, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb10.webp'),
  createItem('bb11', 'Dolce & Gabbana Logo-print T-shirt', 599.99, Rarity.EPIC, 0.15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb11.webp'),
  createItem('bb12', 'Nike Jordan 4 Retro University Blue', 487.5, Rarity.EPIC, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb12.webp'),
  createItem('bb13', 'Saint Laurent Crocodile-embossed Cardholder', 349.99, Rarity.EPIC, 0.45, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb13.webp'),
  createItem('bb14', 'Nike Jordan 1 Retro High Shadow (2018)', 310, Rarity.RARE, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb14.webp'),
  createItem('bb15', 'Off-White x Jordan T-Shirt Black', 277.5, Rarity.RARE, 0.3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb15.webp'),
  createItem('bb16', 'CDG x Nike T-shirt White', 215, Rarity.RARE, 0.95, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb16.webp'),
  createItem('bb17', 'Fear of God Essentials Pull-Over Hoodie (SS21)', 177.5, Rarity.RARE, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb17.webp'),
  createItem('bb18', 'Seletti Sitting Mouse Lamp', 149.99, Rarity.RARE, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb18.webp'),
  createItem('bb19', 'Travis Scott x McDonald\'s All American 92\' Basketball', 125, Rarity.RARE, 0.7, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb19.webp'),
  createItem('bb20', 'Supreme Nalgene 32 oz. Bottle', 85, Rarity.RARE, 2.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb20.webp'),
  createItem('bb21', 'Aston Martin x PLAYMOBIL James Bond Goldfinger DB5', 79, Rarity.RARE, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb21.webp'),
  createItem('bb22', 'Pokémon x Van Gogh Museum Pikachu Plush', 75, Rarity.COMMON, 2.2753, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb22.webp'),
  createItem('bb23', 'Supreme Nerf Rival Takedown Blaster', 60, Rarity.COMMON, 2.3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb23.webp'),
  createItem('bb24', 'StockX Tag', 1.50, Rarity.COMMON, 35, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb24.webp'),
  createItem('bb25', 'Squid Game Ddakji', 0.50, Rarity.COMMON, 50, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bb25.webp'),
];

// MIXED SPORTS BOX
const MIXED_SPORTS_ITEMS: LootItem[] = [
  createItem('ms1', 'Brunswick Gold Crown VI Pool Table', 12500, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms1.webp'),
  createItem('ms2', 'Michael Jordan Signed Basketball UDA', 8500, Rarity.LEGENDARY, 0.02, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk1.webp'),
  createItem('ms3', 'Olhausen Grand Champion Pool Table', 7800, Rarity.LEGENDARY, 0.03, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms1.webp'),
  createItem('ms4', 'LeBron James Signed Jersey Fanatics', 4200, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk2.webp'),
  createItem('ms5', 'Tom Brady Signed Football PSA/DNA', 3500, Rarity.LEGENDARY, 0.08, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb10.webp'),
  createItem('ms6', 'Spalding The Beast Portable Basketball Hoop', 1599, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms6.webp'),
  createItem('ms7', 'Patrick Mahomes Signed Mini Helmet', 1200, Rarity.EPIC, 0.3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms7.webp'),
  createItem('ms8', 'Kobe Bryant Signed Photo PSA/DNA', 2800, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms8.webp'),
  createItem('ms9', 'Wilson Evolution Basketball (Official)', 79.99, Rarity.EPIC, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms9.webp'),
  createItem('ms10', 'Predator Throne Pool Cue', 899, Rarity.EPIC, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms14.webp'),
  createItem('ms11', 'NFL Official Game Football Wilson', 149.99, Rarity.RARE, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms11.webp'),
  createItem('ms12', 'Aramith Tournament Pool Ball Set', 299, Rarity.RARE, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms12.webp'),
  createItem('ms13', 'Lifetime 90" Portable Basketball Hoop', 399, Rarity.RARE, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms13.webp'),
  createItem('ms14', 'McDermott Lucky Pool Cue', 449, Rarity.RARE, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms14.webp'),
  createItem('ms15', 'Spalding NBA Street Basketball', 39.99, Rarity.RARE, 8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms15.webp'),
  createItem('ms16', 'Nike Elite Basketball Socks (3-Pack)', 24.99, Rarity.COMMON, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms16.webp'),
  createItem('ms17', 'Wilson NCAA Football', 34.99, Rarity.COMMON, 12, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms17.webp'),
  createItem('ms18', 'Champion Sports Pool Cue Rack', 89.99, Rarity.COMMON, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms18.webp'),
  createItem('ms19', 'Spalding TF-1000 Basketball', 69.99, Rarity.COMMON, 8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms19.webp'),
  createItem('ms20', 'LootVibe Sports Water Bottle', 9.99, Rarity.COMMON, 29.42, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ms20.webp'),
];

// FOOTBALL BOX
const FOOTBALL_ITEMS: LootItem[] = [
  createItem('fb1', 'Tom Brady Signed Authentic Jersey PSA/DNA', 8500, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb1.webp'),
  createItem('fb2', 'Patrick Mahomes Signed Helmet Fanatics', 3200, Rarity.LEGENDARY, 0.03, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb2.webp'),
  createItem('fb3', 'Joe Burrow Signed Football PSA/DNA', 1800, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb3.webp'),
  createItem('fb4', 'Travis Kelce Signed Jersey Fanatics', 1200, Rarity.LEGENDARY, 0.08, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb4.webp'),
  createItem('fb5', 'Josh Allen Signed Mini Helmet', 950, Rarity.EPIC, 0.15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb5.webp'),
  createItem('fb6', 'Lamar Jackson Signed Photo 16x20', 750, Rarity.EPIC, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb6.webp'),
  createItem('fb7', 'Justin Jefferson Signed Jersey', 850, Rarity.EPIC, 0.2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb7.webp'),
  createItem('fb8', 'Riddell SpeedFlex Helmet (Authentic)', 449, Rarity.EPIC, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb8.webp'),
  createItem('fb9', 'Nike Vapor Elite Jersey (Custom)', 325, Rarity.EPIC, 0.8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb9.webp'),
  createItem('fb10', 'Wilson Official NFL Game Ball', 179.99, Rarity.RARE, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb10.webp'),
  createItem('fb11', 'Oakley NFL Visor (Prizm)', 129.99, Rarity.RARE, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb11.webp'),
  createItem('fb12', 'Nike Vapor Edge Pro Cleats', 159.99, Rarity.RARE, 4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb12.webp'),
  createItem('fb13', 'Under Armour Highlight Gloves', 89.99, Rarity.RARE, 8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb13.webp'),
  createItem('fb14', 'Schutt F7 Facemask', 119.99, Rarity.RARE, 6, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb14.webp'),
  createItem('fb15', 'Wilson NFL Duke Replica Football', 49.99, Rarity.RARE, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb15.webp'),
  createItem('fb16', 'Nike Pro Combat Padded Shirt', 69.99, Rarity.COMMON, 12, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb16.webp'),
  createItem('fb17', 'Under Armour Compression Shorts', 44.99, Rarity.COMMON, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb17.webp'),
  createItem('fb18', 'Nike Dri-FIT Training Shirt', 39.99, Rarity.COMMON, 18, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb18.webp'),
  createItem('fb19', 'Wilson NCAA Football', 34.99, Rarity.COMMON, 20, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb19.webp'),
  createItem('fb20', 'LootVibe Football Kicking Tee', 12.99, Rarity.COMMON, 24.49, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/fb20.webp'),
];

// BASKETBALL BOX
const BASKETBALL_ITEMS: LootItem[] = [
  createItem('bk1', 'Michael Jordan Signed Basketball UDA', 9500, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk1.webp'),
  createItem('bk2', 'LeBron James Signed Jersey Upper Deck', 5200, Rarity.LEGENDARY, 0.02, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk2.webp'),
  createItem('bk3', 'Kobe Bryant Signed Photo 16x20 PSA/DNA', 4800, Rarity.LEGENDARY, 0.03, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk3.webp'),
  createItem('bk4', 'Stephen Curry Signed Basketball Fanatics', 2400, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk4.webp'),
  createItem('bk5', 'Giannis Antetokounmpo Signed Jersey', 1800, Rarity.LEGENDARY, 0.08, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk5.webp'),
  createItem('bk6', 'Luka Doncic Signed Basketball', 1500, Rarity.EPIC, 0.12, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk6.webp'),
  createItem('bk7', 'Victor Wembanyama Signed Photo', 1200, Rarity.EPIC, 0.15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk7.webp'),
  createItem('bk8', 'Spalding The Beast Portable Hoop', 1599, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk8.webp'),
  createItem('bk9', 'Nike LeBron 21 Basketball Shoes', 199.99, Rarity.EPIC, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk9.webp'),
  createItem('bk10', 'Wilson Evolution Basketball (Official)', 79.99, Rarity.EPIC, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk10.webp'),
  createItem('bk11', 'Spalding NBA Official Game Ball', 169.99, Rarity.RARE, 4, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk11.webp'),
  createItem('bk12', 'Nike Kobe 6 Protro', 189.99, Rarity.RARE, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk12.webp'),
  createItem('bk13', 'Under Armour Curry Flow 11', 159.99, Rarity.RARE, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk13.webp'),
  createItem('bk14', 'Lifetime 54" Portable Basketball Hoop', 499, Rarity.RARE, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk14.webp'),
  createItem('bk15', 'Nike Elite Crew Basketball Socks (6-Pack)', 49.99, Rarity.RARE, 8, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk15.webp'),
  createItem('bk16', 'Spalding TF-1000 Basketball', 69.99, Rarity.RARE, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk16.webp'),
  createItem('bk17', 'Nike Dri-FIT Basketball Shorts', 44.99, Rarity.COMMON, 15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk17.webp'),
  createItem('bk18', 'Wilson NCAA Basketball', 39.99, Rarity.COMMON, 18, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk18.webp'),
  createItem('bk19', 'Spalding Street Basketball', 29.99, Rarity.COMMON, 20, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk19.webp'),
  createItem('bk20', 'LootVibe Basketball Pump', 9.99, Rarity.COMMON, 26.86, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/bk20.webp'),
];

// ARTSY HUSTLE BOX
const ARTSY_HUSTLE_ITEMS: LootItem[] = [
  createItem('ah1', 'Louis Vuitton Louis Buffalo', 8850, Rarity.LEGENDARY, 0.005, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah1.webp'),
  createItem('ah2', 'Kaws Resting Place Vinyl Figure', 2910, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah2.webp'),
  createItem('ah3', 'Virgil Abloh x IKEA "KEEP OFF" Rug', 2815, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah3.webp'),
  createItem('ah4', 'MediCom Toy x Pokémon Bearbrick Pikachu Flocky 1000%', 2170, Rarity.LEGENDARY, 0.01, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah4.webp'),
  createItem('ah5', 'Pokémon TCG XY Evolutions Kanto Power Collection', 1240, Rarity.LEGENDARY, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah5.webp'),
  createItem('ah6', 'Pokémon TCG Sword & Shield 25th Anniversary Golden', 1180, Rarity.LEGENDARY, 0.35, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah6.webp'),
  createItem('ah7', 'Virgil Abloh x IKEA MARKERAD "WET GRASS" Rug', 1050, Rarity.LEGENDARY, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah7.webp'),
  createItem('ah8', 'MediCom Toy x Pokémon Bearbrick Pikachu', 1030, Rarity.LEGENDARY, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah8.webp'),
  createItem('ah9', 'Kaws THE PROMISE Vinyl Figure', 970, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah9.webp'),
  createItem('ah10', 'Medicom Toy Bearbrick Clear Red Heart', 930, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah10.webp'),
  createItem('ah11', 'Kaws Family Figure', 915, Rarity.EPIC, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah11.webp'),
  createItem('ah12', 'Pokémon TCG Sword & Shield Special Box Kanazawa', 915, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah12.webp'),
  createItem('ah13', 'MediCom Toy Bearbrick My First Baby Marble', 755, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah13.webp'),
  createItem('ah14', 'Pokémon TCG Sword & Shield High Class Pack VMAX', 755, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah14.webp'),
  createItem('ah15', 'Pokémon TCG x Van Gogh Museum Pikachu PSA 9', 670, Rarity.EPIC, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah15.webp'),
  createItem('ah16', 'Kaws Holiday Shanghai Vinyl Figure', 595, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah16.webp'),
  createItem('ah17', 'MediCom Toy Bearbrick Andy Warhol x Basquiat #4', 545, Rarity.EPIC, 0.35, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah17.webp'),
  createItem('ah18', 'Virgil Abloh x IKEA MARKERAD "RECEIPT" Rug', 545, Rarity.EPIC, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah18.webp'),
  createItem('ah19', 'Kaws KAWS Holiday UK Vinyl Figure', 525, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah19.webp'),
  createItem('ah20', 'Pokémon Center x Van Gogh Pikachu Canvas', 520, Rarity.EPIC, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah20.webp'),
  createItem('ah21', 'MediCom Toy Bearbrick Marble', 510, Rarity.EPIC, 0.35, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah21.webp'),
  createItem('ah22', 'BigBuy Home Ethereal Horizon Canvas', 510, Rarity.EPIC, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah22.webp'),
  createItem('ah23', 'Kaws Holiday Changbai Mountain Vinyl Figure', 505, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah23.webp'),
  createItem('ah24', 'DKD Home Decor Mystic Flow Abstract Canvas', 470, Rarity.RARE, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah24.webp'),
  createItem('ah25', 'Virgil Abloh x IKEA Markerad "Mona Lisa" Artwork', 460, Rarity.RARE, 0.15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah25.webp'),
  createItem('ah26', 'Medicom Toy x Van Gogh Bearbrick Self Portrait', 410, Rarity.RARE, 0.35, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah26.webp'),
  createItem('ah27', 'MediCom Toy x Nike Bearbrick SB 2020 Set', 395, Rarity.RARE, 0.15, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah27.webp'),
  createItem('ah28', 'MediCom Toy Bearbrick The Starry Night Set', 360, Rarity.RARE, 0.35, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah28.webp'),
  createItem('ah29', 'Kaws x Hirake! Ponkikki KACHAMUKKU', 315, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah29.webp'),
  createItem('ah30', 'MediCom Toy x Clot x Nike Bearbrick Set', 290, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah30.webp'),
  createItem('ah31', 'MediCom Toy Bearbrick Series 42 Sealed Case', 280, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah31.webp'),
  createItem('ah32', 'Pokémon TCG Vivid Voltage Booster Box', 242.99, Rarity.RARE, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah32.webp'),
  createItem('ah33', 'MediCom Toy Bearbrick Jean-Michel Basquiat Set', 245, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah33.webp'),
  createItem('ah34', 'Pokémon TCG 25th Anniversary Charizard', 240, Rarity.RARE, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah34.webp'),
  createItem('ah35', 'MediCom Toy Bearbrick Series 43 Sealed Case', 235, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah35.webp'),
  createItem('ah36', 'Kaws x Human Made Duck Plush Down Doll', 230, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah36.webp'),
  createItem('ah37', 'Pokémon Center x Van Gogh Pikachu & Eevee Canvas', 220, Rarity.RARE, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah37.webp'),
  createItem('ah38', 'MediCom Toy Bearbrick Superman', 185, Rarity.RARE, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah38.webp'),
  createItem('ah39', 'Pokémon Center x Van Gogh Eevee Canvas', 170, Rarity.RARE, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah39.webp'),
  createItem('ah40', 'MediCom Toy x Public Image Bearbrick Set', 169.99, Rarity.RARE, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah40.webp'),
  createItem('ah41', 'Kaws Brooklyn Museum TIDE Poster', 155, Rarity.RARE, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah41.webp'),
  createItem('ah42', 'Medicom Toy x Van Gogh Bearbrick Museum', 150, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah42.webp'),
  createItem('ah43', 'Pokémon Center x Van Gogh Sunflora Canvas', 150, Rarity.RARE, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah43.webp'),
  createItem('ah44', 'MediCom Toy Bearbrick Warhol x Basquiat', 145, Rarity.RARE, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah44.webp'),
  createItem('ah45', 'Pokémon Center x Van Gogh 6 Pack Posters', 140, Rarity.RARE, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah45.webp'),
  createItem('ah46', 'Pokémon TCG Sword & Shield Expansion Pack S7D', 130, Rarity.COMMON, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah46.webp'),
  createItem('ah47', 'Kaws x Uniqlo Cookie Monster Plush Toy', 125, Rarity.COMMON, 1.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah47.webp'),
  createItem('ah48', 'Pokémon Center x Van Gogh Pin Box Set', 120, Rarity.COMMON, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah48.webp'),
  createItem('ah49', 'Pokémon Center x Van Gogh 12 Pack Postcards', 120, Rarity.COMMON, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah49.webp'),
  createItem('ah50', 'Bearbrick x Care Bears Cheer Bear 400%', 90, Rarity.COMMON, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah50.webp'),
  createItem('ah51', 'Kaws x Uniqlo Elmo Plush Toy', 90, Rarity.COMMON, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah51.webp'),
  createItem('ah52', 'Pokémon TCG Shining Fates Elite Trainer Box', 80.99, Rarity.COMMON, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah52.webp'),
  createItem('ah53', 'MediCom Toy Bearbrick BAPE 28th Anniversary', 85, Rarity.COMMON, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah53.webp'),
  createItem('ah54', 'Virgil Abloh x Nike ICONS Book', 85, Rarity.COMMON, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah54.webp'),
  createItem('ah55', 'Pokémon Center x Van Gogh Bedroom Playmat', 80, Rarity.COMMON, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah55.webp'),
  createItem('ah56', 'Kaws x Uniqlo Bert Plush Toy', 80, Rarity.COMMON, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah56.webp'),
  createItem('ah57', 'Pokémon TCG Squishmallow 20" Pikachu Plush', 75, Rarity.COMMON, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah57.webp'),
  createItem('ah58', 'Pokémon Center x Van Gogh Deck 65 Card', 75, Rarity.COMMON, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah58.webp'),
  createItem('ah59', 'Kaws Phaidon Uniqlo Book', 70, Rarity.COMMON, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah59.webp'),
  createItem('ah60', 'Fruugo Aztec Death Whistle Loud', 47, Rarity.COMMON, 10, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah60.webp'),
  createItem('ah61', 'Lego Amelia Earhart Tribute', 45, Rarity.COMMON, 5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah61.webp'),
  createItem('ah62', 'Funko x Pokémon Pop! Eevee Diamond Figure', 40, Rarity.COMMON, 2.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah62.webp'),
  createItem('ah63', 'Montegrappa Harry Potter Thestral Ink Bottle', 33, Rarity.COMMON, 6.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah63.webp'),
  createItem('ah64', 'Werthers Original Classic Vanilla Caramels', 6, Rarity.COMMON, 16.315, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ah64.webp'),
];

// LUXURY SNEAKERS BOX
const LUXURY_SNEAKERS_ITEMS: LootItem[] = [
  createItem('ls1', 'Louis Vuitton Trainer Maxi Sneaker', 6050, Rarity.LEGENDARY, 0.02, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls1.webp'),
  createItem('ls2', 'Dolce & Gabbana Rome Crocodile Leather', 3109.99, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls2.webp'),
  createItem('ls3', 'Zegna Monte Sneakers', 1489.99, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls3.webp'),
  createItem('ls4', 'Amiri Skel Top Sneakers', 1359.99, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls4.webp'),
  createItem('ls5', 'Zegna Triple Stitch Calf Leather Sneakers', 1350, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls5.webp'),
  createItem('ls6', 'Balenciaga Track Sneakers', 1100, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls6.webp'),
  createItem('ls7', 'Prada Downtown Sneakers', 1049.99, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls7.webp'),
  createItem('ls8', 'TOM FORD Crocodile Effect Sneakers', 1010, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls8.webp'),
  createItem('ls9', 'Zegna Triple Stitch Suede Sneakers', 989.99, Rarity.LEGENDARY, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls9.webp'),
  createItem('ls10', 'Amiri Shimmer Skel-top Low', 879.99, Rarity.LEGENDARY, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls10.webp'),
  createItem('ls11', 'Maison Margiela New Evolution Layered Sneakers', 860, Rarity.EPIC, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls11.webp'),
  createItem('ls12', 'Dolce & Gabbana Crown Sneakers', 799.99, Rarity.EPIC, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls12.webp'),
  createItem('ls13', 'Balenciaga Triple S Sneaker', 795, Rarity.EPIC, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls13.webp'),
  createItem('ls14', 'Philipp Plein Nappa Leather Lo-Top Sneakers', 779.99, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls14.webp'),
  createItem('ls15', 'TOM FORD Leather Sneakers', 770, Rarity.EPIC, 0.05, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls15.webp'),
  createItem('ls16', 'Valentino Rockstud Low Top', 769.99, Rarity.EPIC, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls16.webp'),
  createItem('ls17', 'Philipp Plein Predator', 760, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls17.webp'),
  createItem('ls18', 'Dolce & Gabbana Portofino Jacquard Sneakers', 745, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls18.webp'),
  createItem('ls19', 'Philipp Plein Lace-up Leather Trainers', 739.99, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls19.webp'),
  createItem('ls20', 'Burberry Vintage Check Low-top Sneakers', 659.99, Rarity.EPIC, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls20.webp'),
  createItem('ls21', 'Amiri Skel Top Hi Sneakers', 650, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls21.webp'),
  createItem('ls22', 'Saint Laurent Court Classic SL/06', 619.99, Rarity.EPIC, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls22.webp'),
  createItem('ls23', 'Tom Ford Velvet Sneakers', 609.99, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls23.webp'),
  createItem('ls24', 'Gucci Ace Supreme', 600, Rarity.EPIC, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls24.webp'),
  createItem('ls25', 'Jimmy Choo Palma/M', 595, Rarity.EPIC, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls25.webp'),
  createItem('ls26', 'Golden Goose Super-Star Low-top Sneakers', 579.99, Rarity.EPIC, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls26.webp'),
  createItem('ls27', 'Golden Goose Dad-Star Sneakers', 570, Rarity.RARE, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls27.webp'),
  createItem('ls28', 'Alexander McQueen Oversized Sneakers', 560, Rarity.RARE, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls28.webp'),
  createItem('ls29', 'Amiri Court High-stop Sneakers', 559.99, Rarity.RARE, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls29.webp'),
  createItem('ls30', 'Maison Mihara Yasuhiro Blakey Low-top Sneakers', 565, Rarity.RARE, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls30.webp'),
  createItem('ls31', 'Versace Greca Embroidered Sneakers', 504.99, Rarity.RARE, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls31.webp'),
  createItem('ls32', 'Golden Goose Super-Star Sneakers', 489.99, Rarity.RARE, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls32.webp'),
  createItem('ls33', 'Maison Mihara Hank OG Sole Canvas Low', 437.5, Rarity.RARE, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls33.webp'),
  createItem('ls34', 'Dolce & Gabbana CUSHION Sneakers', 439.99, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls34.webp'),
  createItem('ls35', 'Maison MIHARA YASUHIRO HANK Sneakers', 435, Rarity.RARE, 0.1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls35.webp'),
  createItem('ls36', 'Off-white Low Vulcanized Sneakers', 395, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls36.webp'),
  createItem('ls37', 'Common Projects Tennis Classic Sneakers', 380, Rarity.RARE, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls37.webp'),
  createItem('ls38', 'Golden Goose Matchstar Sneakers', 370, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls38.webp'),
  createItem('ls39', 'Palm Angels University Sneakers', 365, Rarity.RARE, 0.25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls39.webp'),
  createItem('ls40', 'Hackett Hackney Sneakers', 300, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls40.webp'),
  createItem('ls41', 'Hackett Leather Sneakers', 300, Rarity.RARE, 0.5, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls41.webp'),
  createItem('ls42', 'Axel Arigato Dice Lo Leather Sneakers', 299.99, Rarity.RARE, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls42.webp'),
  createItem('ls43', 'Autry Medalist Sneakers', 299.99, Rarity.RARE, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls43.webp'),
  createItem('ls44', 'Autry Action low-top Sneakers', 279.99, Rarity.RARE, 1, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls44.webp'),
  createItem('ls45', 'GUESS USA Monogram-panel Sneakers', 239.99, Rarity.COMMON, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls45.webp'),
  createItem('ls46', 'Levi\'s Chunky Sole Sneakers', 225, Rarity.COMMON, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls46.webp'),
  createItem('ls47', 'Autry Medalist Suede-panel Sneakers', 219.99, Rarity.COMMON, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls47.webp'),
  createItem('ls48', 'VEJA V10 ChromeFree Sneakers', 177.5, Rarity.COMMON, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls48.webp'),
  createItem('ls49', 'Hugo Panelled Sneakers', 164, Rarity.COMMON, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls49.webp'),
  createItem('ls50', 'VEJA Campo Low-top Sneakers', 169.99, Rarity.COMMON, 2, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls50.webp'),
  createItem('ls51', 'GUESS USA Logo-plaque Sneakers', 160, Rarity.COMMON, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls51.webp'),
  createItem('ls52', 'Veja Super-Star Sneakers', 114, Rarity.COMMON, 3, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls52.webp'),
  createItem('ls53', 'Kappa Chossuni Socks', 17, Rarity.COMMON, 25, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls53.webp'),
  createItem('ls54', 'Shoelace', 1, Rarity.COMMON, 43.83, 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/items/ls54.webp'),
];

// --- BOX DEFINITIONS ---

export const INITIAL_BOXES: LootBox[] = [
  {
    id: 'pokemon_box',
    name: 'POKEMON TREASURE BOX',
    category: 'POKEMON',
    price: 75.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/pokemon_box.webp',
    description: 'Graded cards, booster boxes, and rare Pokemon collectibles',
    tags: ['HOT', 'FEATURED'],
    color: 'from-yellow-500 to-yellow-700',
    items: POKEMON_ITEMS
  },
  {
    id: 'food_box',
    name: 'FOOD DELIVERY BOX',
    category: 'GIFT_CARDS',
    price: 30.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/food_box.webp',
    description: 'DoorDash, Uber Eats, and restaurant gift cards',
    tags: ['FEATURED'],
    color: 'from-orange-500 to-red-600',
    items: FOOD_ITEMS
  },
  {
    id: 'sneaker_box',
    name: 'SNEAKER GRAILS BOX',
    category: 'STREETWEAR',
    price: 300.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/sneaker_box.webp',
    description: 'Jordan 1s, Dunks, Yeezys - authentic heat only',
    tags: ['HOT', 'FEATURED'],
    color: 'from-purple-600 to-indigo-900',
    items: SNEAKER_ITEMS
  },
  {
    id: 'steam_box',
    name: 'STEAM VAULT BOX',
    category: 'TECH',
    price: 50.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/steam_box.webp',
    description: 'Steam gift cards, game keys, and gaming gear',
    tags: ['FEATURED', 'HOT'],
    color: 'from-blue-800 to-slate-900',
    items: STEAM_ITEMS
  },
  {
    id: 'tech_box',
    name: 'TECH PREMIUM BOX',
    category: 'TECH',
    price: 500.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/tech_box.webp',
    description: 'iPhone, iPad, MacBook, AirPods - latest Apple & tech',
    tags: ['FEATURED'],
    color: 'from-slate-700 to-slate-900',
    items: TECH_ITEMS
  },
  {
    id: 'supreme_box',
    name: 'SUPREME LEGACY BOX',
    category: 'STREETWEAR',
    price: 200.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/supreme_box.webp',
    description: 'Supreme Box Logo, accessories, and rare drops',
    tags: ['HOT', 'FEATURED', 'NEW'],
    color: 'from-red-600 to-red-900',
    items: SUPREME_ITEMS
  },
  {
    id: 'apple_budget',
    name: 'APPLE BUDGET BOX',
    category: 'TECH',
    price: 15.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/apple_budget.webp',
    description: 'Chance for iPhones and AirPods at a budget price',
    tags: ['NEW', 'HOT'],
    color: 'from-gray-200 to-gray-400',
    items: APPLE_BUDGET_ITEMS
  },
  {
    id: 'samsung_budget',
    name: 'SAMSUNG BUDGET BOX',
    category: 'TECH',
    price: 15.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/samsung_budget.webp',
    description: 'Galaxy gear, buds, and accessories for less',
    tags: ['NEW'],
    color: 'from-blue-400 to-blue-600',
    items: SAMSUNG_BUDGET_ITEMS
  },
  {
    id: 'gamer_budget',
    name: 'GAMER BUDGET BOX',
    category: 'TECH',
    price: 10.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/gamer_budget.webp',
    description: 'Peripherals, steam keys, and gaming essentials',
    tags: ['NEW'],
    color: 'from-green-400 to-emerald-600',
    items: GAMER_BUDGET_ITEMS
  },
  {
    id: 'charizard_chase',
    name: 'CHARIZARD CHASE BOX',
    category: 'POKEMON',
    price: 50.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/charizard_chase.webp',
    description: 'Hunt for rare Charizard cards - PSA 10s, Alt Arts, and more',
    tags: ['HOT', 'FEATURED'],
    color: 'from-red-500 to-orange-600',
    items: CHARIZARD_ITEMS
  },
  {
    id: 'pokemon_budget',
    name: 'POKEMON BUDGET BOX',
    category: 'POKEMON',
    price: 8.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/pokemon_budget.webp',
    description: 'Affordable Pokemon packs and cards for everyone',
    tags: ['NEW'],
    color: 'from-yellow-400 to-yellow-600',
    items: POKEMON_BUDGET_ITEMS
  },
  {
    id: 'modern_hits',
    name: 'MODERN HITS BOX',
    category: 'POKEMON',
    price: 35.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/modern_hits.webp',
    description: 'Latest sets - Iono, Giratina, Umbreon, and more modern chase cards',
    tags: ['FEATURED'],
    color: 'from-purple-500 to-indigo-600',
    items: MODERN_HITS_ITEMS
  },
  {
    id: 'vintage_vault',
    name: 'VINTAGE VAULT BOX',
    category: 'POKEMON',
    price: 150.00,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/vintage_vault.webp',
    description: 'WOTC era sealed product - Base Set, Fossil, Jungle, and more',
    tags: ['HOT'],
    color: 'from-slate-600 to-slate-800',
    items: VINTAGE_VAULT_ITEMS
  },
  {
    id: 'apple_2025',
    name: '2025 APPLE BOX',
    category: 'TECH',
    price: 75.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/apple_2025.webp',
    description: 'iPhone 17 lineup, Watch Ultra 3, and latest Apple tech',
    tags: ['NEW', 'HOT'],
    color: 'from-slate-400 to-slate-600',
    items: APPLE_2025_ITEMS
  },
  {
    id: 'pc_components',
    name: 'CRYPTO MINER BOX',
    category: 'CRYPTO',
    price: 49.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/pc_components.webp',
    description: 'High-end GPUs, motherboards, and mining components',
    tags: ['FEATURED'],
    color: 'from-red-600 to-orange-600',
    items: PC_COMPONENTS_ITEMS
  },
  {
    id: 'switch_2',
    name: 'NINTENDO SWITCH 2 BOX',
    category: 'TECH',
    price: 59.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/switch_2.webp',
    description: 'Switch 2 consoles, games, and accessories',
    tags: ['NEW', 'HOT', 'FEATURED'],
    color: 'from-red-500 to-red-700',
    items: SWITCH_2_ITEMS
  },
  {
    id: 'rtx_1_percent',
    name: 'RTX 1% BOX',
    category: 'TECH',
    price: 99.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/rtx_1_percent.webp',
    description: 'RTX 5090, 4090, and high-end graphics cards',
    tags: ['HOT'],
    color: 'from-green-500 to-emerald-700',
    items: RTX_1_PERCENT_ITEMS
  },
  {
    id: 'supreme_or_not',
    name: 'SUPREME OR NOT BOX',
    category: 'STREETWEAR',
    price: 149.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/supreme_or_not.webp',
    description: 'Rare Supreme collabs and grails',
    tags: ['FEATURED', 'HOT'],
    color: 'from-red-600 to-red-800',
    items: SUPREME_OR_NOT_ITEMS
  },
  {
    id: 'big_mix',
    name: 'BIG MIX BOX',
    category: 'GIFT_CARDS',
    price: 199.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/big_mix.webp',
    description: 'Ultimate mix: Sneakers, Tech, Supreme, and more',
    tags: ['FEATURED', 'HOT'],
    color: 'from-purple-600 to-pink-600',
    items: BIG_MIX_ITEMS
  },
  {
    id: 'rich_club',
    name: '1% RICH CLUB BOX',
    category: 'CRYPTO',
    price: 999.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/rich_club.webp',
    description: 'Porsche, Rolex, diamonds - for the 1%',
    tags: ['HOT', 'FEATURED'],
    color: 'from-yellow-400 to-yellow-600',
    items: RICH_CLUB_ITEMS
  },
  {
    id: 'poker_box',
    name: 'POKER BOX',
    category: 'SPORTS',
    price: 89.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/poker_box.webp',
    description: 'WSOP tickets, poker tables, and premium poker gear',
    tags: ['NEW', 'FEATURED'],
    color: 'from-green-600 to-emerald-800',
    items: POKER_ITEMS
  },
  {
    id: 'golf_box',
    name: 'GOLF BOX',
    category: 'SPORTS',
    price: 79.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/golf_box.webp',
    description: 'Titleist, TaylorMade, Callaway - premium golf equipment',
    tags: ['NEW'],
    color: 'from-green-500 to-green-700',
    items: GOLF_ITEMS
  },
  {
    id: 'big_baller',
    name: 'BIG BALLER BOX',
    category: 'STREETWEAR',
    price: 299.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/big_baller.webp',
    description: 'Rolex, Louis Vuitton, Dior - luxury lifestyle',
    tags: ['HOT', 'FEATURED'],
    color: 'from-purple-500 to-pink-600',
    items: BIG_BALLER_ITEMS
  },
  {
    id: 'mixed_sports',
    name: 'MIXED SPORTS BOX',
    category: 'SPORTS',
    price: 149.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/mixed_sports.webp',
    description: 'Pool tables, signed memorabilia, and sports equipment',
    tags: ['NEW', 'HOT'],
    color: 'from-orange-500 to-red-600',
    items: MIXED_SPORTS_ITEMS
  },
  {
    id: 'football_box',
    name: 'FOOTBALL BOX',
    category: 'SPORTS',
    price: 99.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/football_box.webp',
    description: 'NFL signed jerseys, helmets, and premium football gear',
    tags: ['NEW', 'FEATURED'],
    color: 'from-green-700 to-green-900',
    items: FOOTBALL_ITEMS
  },
  {
    id: 'basketball_box',
    name: 'BASKETBALL BOX',
    category: 'SPORTS',
    price: 99.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/basketball_box.webp',
    description: 'NBA signed memorabilia, hoops, and basketball equipment',
    tags: ['NEW', 'FEATURED'],
    color: 'from-orange-600 to-orange-800',
    items: BASKETBALL_ITEMS
  },
  {
    id: 'artsy_hustle',
    name: 'ARTSY HUSTLE BOX',
    category: 'STREETWEAR',
    price: 179.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/artsy_hustle.webp',
    description: 'Kaws, Bearbricks, Virgil Abloh - art collectibles & designer toys',
    tags: ['NEW', 'FEATURED', 'HOT'],
    color: 'from-pink-500 to-purple-600',
    items: ARTSY_HUSTLE_ITEMS
  },
  {
    id: 'luxury_sneakers',
    name: 'LUXURY SNEAKERS BOX',
    category: 'STREETWEAR',
    price: 249.99,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/luxury_sneakers.webp',
    description: 'Louis Vuitton, Balenciaga, Gucci - high-end designer sneakers',
    tags: ['NEW', 'FEATURED'],
    color: 'from-indigo-500 to-purple-700',
    items: LUXURY_SNEAKERS_ITEMS
  },
  {
    id: 'welcome_gift',
    name: 'WELCOME GIFT',
    category: 'GIFT_CARDS',
    price: 0,
    image: 'https://hpflcuyxmwzrknxjgavd.supabase.co/storage/v1/object/public/game-assets/boxes/free_box.webp',
    description: 'Free welcome gift for new users',
    tags: ['NEW', 'FEATURED'],
    color: 'from-emerald-400 to-cyan-500',
    items: FREE_BOX_ITEMS
  }
];

export const MOCK_LIVE_DROPS: LiveDrop[] = [
  { id: 'ld1', username: 'TechNinja', itemName: 'iPhone 15 Pro', itemImage: 'https://ui-avatars.com/api/?name=I&background=eab308&color=fff', boxName: 'TECH PREMIUM BOX', value: 999.00, rarity: Rarity.EPIC, timeAgo: 'just now' },
  { id: 'ld2', username: 'GamerPro', itemName: 'Steam Deck OLED', itemImage: 'https://ui-avatars.com/api/?name=S&background=3b82f6&color=fff', boxName: 'STEAM VAULT BOX', value: 649.00, rarity: Rarity.LEGENDARY, timeAgo: '12s ago' },
  { id: 'ld3', username: 'BudgetKing', itemName: 'AirPods 2nd Gen', itemImage: 'https://ui-avatars.com/api/?name=A&background=a855f7&color=fff', boxName: 'APPLE BUDGET BOX', value: 99.00, rarity: Rarity.EPIC, timeAgo: '20s ago' },
  { id: 'ld4', username: 'TreasureTom', itemName: 'Charizard Base Set', itemImage: 'https://ui-avatars.com/api/?name=C&background=a855f7&color=fff', boxName: 'POKEMON TREASURE BOX', value: 3000.00, rarity: Rarity.LEGENDARY, timeAgo: '45s ago' },
  { id: 'ld5', username: 'HypeBeast', itemName: 'Supreme Box Logo', itemImage: 'https://ui-avatars.com/api/?name=S&background=f43f5e&color=fff', boxName: 'SUPREME LEGACY BOX', value: 1500.00, rarity: Rarity.LEGENDARY, timeAgo: '1m ago' },
  { id: 'ld6', username: 'SamsungFan', itemName: 'Galaxy Buds 2 Pro', itemImage: 'https://ui-avatars.com/api/?name=G&background=3b82f6&color=fff', boxName: 'SAMSUNG BUDGET BOX', value: 150.00, rarity: Rarity.EPIC, timeAgo: '1m ago' },
];

export const REALISTIC_DROPS: LiveDrop[] = [
  { id: 'r1', username: 'CryptoWhale', itemName: 'MacBook Pro 14"', itemImage: 'https://ui-avatars.com/api/?name=M&background=eab308&color=fff', boxName: 'TECH PREMIUM BOX', value: 1999.00, rarity: Rarity.LEGENDARY, timeAgo: 'Just now' },
  { id: 'r2', username: 'SpeedyGonz', itemName: '$10 Steam Gift Card', itemImage: 'https://ui-avatars.com/api/?name=S&background=94a3b8&color=fff', boxName: 'STEAM VAULT BOX', value: 10.00, rarity: Rarity.COMMON, timeAgo: 'Just now' },
  { id: 'r3', username: 'LuckyLuke', itemName: 'Supreme Sticker Pack', itemImage: 'https://ui-avatars.com/api/?name=S&background=3b82f6&color=fff', boxName: 'SUPREME LEGACY BOX', value: 10.00, rarity: Rarity.COMMON, timeAgo: '2s ago' },
  { id: 'r4', username: 'PixelArt', itemName: 'Pokemon Sticker Pack', itemImage: 'https://ui-avatars.com/api/?name=P&background=94a3b8&color=fff', boxName: 'POKEMON TREASURE BOX', value: 1.00, rarity: Rarity.COMMON, timeAgo: '4s ago' },
  { id: 'r5', username: 'GamerGirl99', itemName: '$20 Fast Food Card', itemImage: 'https://ui-avatars.com/api/?name=F&background=3b82f6&color=fff', boxName: 'FOOD DELIVERY BOX', value: 20.00, rarity: Rarity.COMMON, timeAgo: '6s ago' },
  { id: 'r6', username: 'BudgetHunter', itemName: 'Apple Polishing Cloth', itemImage: 'https://ui-avatars.com/api/?name=A&background=94a3b8&color=fff', boxName: 'APPLE BUDGET BOX', value: 19.00, rarity: Rarity.COMMON, timeAgo: '8s ago' },
  { id: 'r7', username: 'AndroidUser', itemName: 'USB-C Cable', itemImage: 'https://ui-avatars.com/api/?name=U&background=94a3b8&color=fff', boxName: 'SAMSUNG BUDGET BOX', value: 10.00, rarity: Rarity.COMMON, timeAgo: '10s ago' },
  { id: 'r8', username: 'PCGamer', itemName: 'Random Steam Key', itemImage: 'https://ui-avatars.com/api/?name=R&background=94a3b8&color=fff', boxName: 'GAMER BUDGET BOX', value: 5.00, rarity: Rarity.COMMON, timeAgo: '12s ago' },
];

export const MOCK_BATTLES: Battle[] = [
  {
    id: 'b1',
    boxId: 'supreme_box',
    price: 200,
    playerCount: 2,
    players: [
      { id: 'u1', username: 'HypeBeast', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HypeBeast' },
      null
    ],
    status: 'WAITING',
    roundCount: 1
  },
  {
    id: 'b2',
    boxId: 'tech_box',
    price: 500,
    playerCount: 2,
    players: [
      { id: 'u2', username: 'PCMaster', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PCMaster' },
      null
    ],
    status: 'WAITING',
    roundCount: 3
  },
  {
    id: 'b3',
    boxId: 'pokemon_box',
    price: 75,
    playerCount: 4,
    players: [
      { id: 'u3', username: 'AshK', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AshK' },
      { id: 'u4', username: 'Misty', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Misty' },
      null,
      null
    ],
    status: 'WAITING',
    roundCount: 1
  },
  {
    id: 'b5',
    boxId: 'steam_box',
    price: 50,
    playerCount: 2,
    players: [
      { id: 'u6', username: 'Gamer1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gamer1' },
      { id: 'u7', username: 'Gamer2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gamer2' },
    ],
    status: 'ACTIVE',
    roundCount: 1
  },
  {
    id: 'b6',
    boxId: 'apple_budget',
    price: 15,
    playerCount: 2,
    players: [
      { id: 'u8', username: 'AppleFan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AppleFan' },
      null
    ],
    status: 'WAITING',
    roundCount: 1
  }
];
