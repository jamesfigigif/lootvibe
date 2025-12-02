
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
  createItem('p1', 'PSA 10 Charizard Base Set 1st Edition', 250000, Rarity.LEGENDARY, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p1.png'),
  createItem('p2', 'PSA 10 Moonbreon (Umbreon VMAX Alt)', 1100, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p2.png'),
  createItem('p3', 'Sealed Team Up Booster Box', 2100, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p3.png'),
  createItem('p4', 'PSA 10 Giratina V Alt Art', 800, Rarity.LEGENDARY, 0.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p4.png'),

  // HIGH TIER (1% - 5%)
  createItem('p5', 'Sealed Evolving Skies Booster Box', 750, Rarity.EPIC, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p5.png'),
  createItem('p6', 'Pokemon 151 Ultra Premium Collection', 130, Rarity.EPIC, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p6.png'),
  createItem('p7', 'Charizard ex (151 SIR)', 110, Rarity.EPIC, 4, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p7.png'),
  createItem('p8', 'Iono Special Illustration Rare', 85, Rarity.EPIC, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p8.png'),

  // MID TIER (5% - 20%)
  createItem('p9', 'Crown Zenith Elite Trainer Box', 55, Rarity.RARE, 8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p9.png'),
  createItem('p10', 'Lost Origin Booster Box', 140, Rarity.RARE, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p10.png'),
  createItem('p11', 'Charizard UPC Promo Card', 25, Rarity.RARE, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p11.png'),
  createItem('p12', 'Arceus VSTAR Gold Card', 60, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p12.png'),

  // LOW TIER (Common)
  createItem('p13', 'Sleeved Booster Pack (Latest Set)', 5, Rarity.COMMON, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p13.png'),
  createItem('p14', '3-Pack Blister (Random)', 15, Rarity.COMMON, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p14.png'),
  createItem('p15', 'Pokemon Sticker Pack', 2, Rarity.COMMON, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p15.png'),
  createItem('p16', 'Single Holo Rare Card', 1, Rarity.COMMON, 8.64, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/p16.png'),
];

// CHARIZARD CHASE BOX - $50 box, ~$30 EV (60% profitability)
const CHARIZARD_ITEMS: LootItem[] = [
  createItem('cz1', 'Charizard ex 151 SIR PSA 10', 200, Rarity.LEGENDARY, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/cz1.png'),
  createItem('cz2', 'Charizard VMAX Rainbow Rare', 85, Rarity.LEGENDARY, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/cz2.png'),
  createItem('cz3', 'Charizard V Alt Art (Brilliant Stars)', 65, Rarity.EPIC, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/cz3.png'),
  createItem('cz4', 'Charizard ex 151 Regular', 35, Rarity.EPIC, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/cz4.png'),
  createItem('cz5', 'Charizard VSTAR', 12, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/cz5.png'),
  createItem('cz6', 'Charizard Holo (Base Set Reprint)', 8, Rarity.RARE, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/cz6.png'),
  createItem('cz7', 'Charizard V (Regular)', 5, Rarity.COMMON, 30, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/cz7.png'),
  createItem('cz8', 'Charizard Reverse Holo', 2, Rarity.COMMON, 36.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/cz8.png'),
];

// POKEMON BUDGET BOX - $8 box, ~$4.80 EV (60% profitability)
const POKEMON_BUDGET_ITEMS: LootItem[] = [
  createItem('pb1', 'Pokemon 151 ETB', 65, Rarity.LEGENDARY, 0.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pb1.png'),
  createItem('pb2', 'Iono Full Art', 18, Rarity.LEGENDARY, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pb2.png'),
  createItem('pb3', 'Booster Bundle (3 Packs)', 12, Rarity.EPIC, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pb3.png'),
  createItem('pb4', 'Holo Rare (Random)', 5, Rarity.EPIC, 8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pb4.png'),
  createItem('pb5', 'Single Booster Pack', 4, Rarity.RARE, 20, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pb5.png'),
  createItem('pb6', 'Reverse Holo Rare', 2, Rarity.COMMON, 30, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pb6.png'),
  createItem('pb7', 'Pokemon Coin', 1, Rarity.COMMON, 37.8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pb7.png'),
];

// MODERN HITS BOX - $35 box, ~$21 EV (60% profitability)
const MODERN_HITS_ITEMS: LootItem[] = [
  createItem('mh1', 'Iono Special Illustration Rare', 90, Rarity.LEGENDARY, 0.3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/mh1.png'),
  createItem('mh2', 'Giratina V Alt Art', 75, Rarity.LEGENDARY, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/mh2.png'),
  createItem('mh3', 'Umbreon VMAX (Evolving Skies)', 55, Rarity.EPIC, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/mh3.png'),
  createItem('mh4', 'Rayquaza VMAX Alt Art', 180, Rarity.EPIC, 0.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/mh4.png'),
  createItem('mh5', 'Crown Zenith ETB', 50, Rarity.EPIC, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/mh5.png'),
  createItem('mh6', 'Booster Box (Latest Set)', 110, Rarity.RARE, 0.8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/mh6.png'),
  createItem('mh7', 'Elite Trainer Box', 45, Rarity.RARE, 8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/mh7.png'),
  createItem('mh8', '3-Pack Blister', 12, Rarity.COMMON, 35, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/mh8.png'),
  createItem('mh9', 'Single Pack', 4, Rarity.COMMON, 51.7, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/mh9.png'),
];

// VINTAGE VAULT BOX - $150 box, ~$90 EV (60% profitability)
const VINTAGE_VAULT_ITEMS: LootItem[] = [
  createItem('vv1', 'Base Set Booster Box (Unlimited)', 4500, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/vv1.png'),
  createItem('vv2', 'Fossil Booster Box (1st Edition)', 3200, Rarity.LEGENDARY, 0.08, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/vv2.png'),
  createItem('vv3', 'Team Rocket Booster Box', 2800, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/vv3.png'),
  createItem('vv4', 'Neo Genesis Booster Box', 1900, Rarity.EPIC, 0.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/vv4.png'),
  createItem('vv5', 'Gym Heroes Booster Box', 1400, Rarity.EPIC, 0.3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/vv5.png'),
  createItem('vv6', 'Base Set 2 Booster Box', 900, Rarity.EPIC, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/vv6.png'),
  createItem('vv7', 'Jungle Booster Pack (Heavy)', 180, Rarity.RARE, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/vv7.png'),
  createItem('vv8', 'Vintage Holo Lot (5 cards)', 85, Rarity.RARE, 8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/vv8.png'),
  createItem('vv9', 'WOTC Common/Uncommon Lot', 25, Rarity.COMMON, 35, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/vv9.png'),
  createItem('vv10', 'Vintage Energy Cards (10x)', 8, Rarity.COMMON, 52.77, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/vv10.png'),
];

const FOOD_ITEMS: LootItem[] = [
  createItem('f1', '$500 DoorDash Gift Card', 500, Rarity.LEGENDARY, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/f1.png'),
  createItem('f2', '$200 Uber Eats Credit', 200, Rarity.EPIC, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/f2.png'),
  createItem('f3', '$100 Grubhub Gift Card', 100, Rarity.EPIC, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/f3.png'),
  createItem('f4', '$75 Multi-Restaurant Card', 75, Rarity.EPIC, 7, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/f4.png'),
  createItem('f5', '$50 DoorDash Card', 50, Rarity.RARE, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/f5.png'),
  createItem('f6', '$30 Restaurant.com eGift', 30, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/f6.png'),
  createItem('f7', '$20 Fast Food Gift Card', 20, Rarity.COMMON, 20, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/f7.png'),
  createItem('f8', '$10 Coffee Shop Card', 10, Rarity.COMMON, 25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/f8.png'),
  createItem('f9', '$5 Snack Credit', 5, Rarity.COMMON, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/f9.png'),
];

const SNEAKER_ITEMS: LootItem[] = [
  createItem('s1', 'Dior x Jordan 1 High', 5000, Rarity.LEGENDARY, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/s1.png'),
  createItem('s2', 'Travis Scott Jordan 1 Low', 1200, Rarity.LEGENDARY, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/s2.png'),
  createItem('s3', 'Off-White Dunk Low Pine Green', 900, Rarity.EPIC, 2.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/s3.png'),
  createItem('s4', 'Jordan 4 Military Black', 350, Rarity.EPIC, 6, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/s4.png'),
  createItem('s5', 'Jordan 1 High University Blue', 280, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/s5.png'),
  createItem('s6', 'Yeezy 350 V2 Beluga', 250, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/s6.png'),
  createItem('s7', 'Nike Dunk Low Panda', 180, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/s7.png'),
  createItem('s8', 'New Balance 550 White Green', 140, Rarity.COMMON, 30, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/s8.png'),
  createItem('s9', 'Nike Air Force 1 White', 110, Rarity.COMMON, 30, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/s9.png'),
];

const STEAM_ITEMS: LootItem[] = [
  createItem('st1', 'Steam Deck OLED 1TB', 649, Rarity.LEGENDARY, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/st1.png'),
  createItem('st2', 'ASUS ROG Ally', 399, Rarity.LEGENDARY, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/st2.png'),
  createItem('st3', '$200 Steam Gift Card', 200, Rarity.EPIC, 2.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/st3.png'),
  createItem('st4', '$100 Steam Gift Card', 100, Rarity.EPIC, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/st4.png'),
  createItem('st5', 'Premium Game Bundle (5 AAA)', 150, Rarity.EPIC, 4, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/st5.png'),
  createItem('st6', '$50 Steam Gift Card', 50, Rarity.RARE, 18, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/st6.png'),
  createItem('st7', 'AAA Game Key (Elden Ring/BG3)', 60, Rarity.RARE, 9, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/st7.png'),
  createItem('st8', 'Indie Game Bundle (10 games)', 30, Rarity.COMMON, 30, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/st8.png'),
  createItem('st9', '$10 Steam Gift Card', 10, Rarity.COMMON, 30, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/st9.png'),
];

const TECH_ITEMS: LootItem[] = [
  createItem('t1', 'MacBook Pro 14" M3 Pro', 1999, Rarity.LEGENDARY, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t1.png'),
  createItem('t2', 'MacBook Air 15" M2', 1099, Rarity.LEGENDARY, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t2.png'),
  createItem('t3', 'iPhone 15 Pro 256GB', 999, Rarity.EPIC, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t3.png'),
  createItem('t4', 'iPad Pro 11" M2', 799, Rarity.EPIC, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t4.png'),
  createItem('t5', 'iPhone 15 128GB', 799, Rarity.EPIC, 4, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t5.png'),
  createItem('t6', 'iPad Air M1 256GB', 599, Rarity.RARE, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t6.png'),
  createItem('t7', 'Apple Watch Series 9 GPS', 399, Rarity.RARE, 8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t7.png'),
  createItem('t8', 'AirPods Pro 2nd Gen', 249, Rarity.RARE, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t8.png'),
  createItem('t9', 'Apple Magic Keyboard + Mouse', 99, Rarity.COMMON, 60, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/t9.png'),
];

const SUPREME_ITEMS: LootItem[] = [
  createItem('su1', 'Supreme x Louis Vuitton Box Logo', 5000, Rarity.LEGENDARY, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/su1.png'),
  createItem('su2', 'Supreme Box Logo Hoodie (Red)', 1500, Rarity.LEGENDARY, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/su2.png'),
  createItem('su3', 'Supreme x TNF Nuptse Jacket', 800, Rarity.EPIC, 2.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/su3.png'),
  createItem('su4', 'Supreme x Nike SB Dunk Low', 600, Rarity.EPIC, 4, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/su4.png'),
  createItem('su5', 'Supreme Box Logo Tee', 250, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/su5.png'),
  createItem('su6', 'Supreme Hoodie (Season Drop)', 180, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/su6.png'),
  createItem('su7', 'Supreme Accessories (Belt/Bag)', 150, Rarity.RARE, 12, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/su7.png'),
  createItem('su8', 'Supreme Camp Cap', 80, Rarity.COMMON, 30, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/su8.png'),
  createItem('su9', 'Supreme Sticker Pack + Keychain', 10, Rarity.COMMON, 30, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/su9.png'),
];


const APPLE_BUDGET_ITEMS: LootItem[] = [
  createItem('ab1', 'iPhone 12 (Refurbished)', 350, Rarity.LEGENDARY, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab1.png'),
  createItem('ab2', 'iPad 9th Gen', 250, Rarity.LEGENDARY, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab2.png'),
  createItem('ab3', 'AirPods 2nd Gen', 99, Rarity.EPIC, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab3.png'),
  createItem('ab4', 'Apple Pencil 2nd Gen', 89, Rarity.EPIC, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab4.png'),
  createItem('ab5', 'AirTag 4-Pack', 85, Rarity.EPIC, 6, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab5.png'),
  createItem('ab6', 'MagSafe Charger', 39, Rarity.RARE, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab6.png'),
  createItem('ab7', 'Apple AirTag (Single)', 29, Rarity.RARE, 20, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab7.png'),
  createItem('ab8', 'Apple Polishing Cloth', 19, Rarity.COMMON, 25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab8.png'),
  createItem('ab9', 'USB-C to Lightning Cable', 15, Rarity.COMMON, 24.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ab9.png'),
];

const SAMSUNG_BUDGET_ITEMS: LootItem[] = [
  createItem('sb1', 'Samsung Galaxy A54', 350, Rarity.LEGENDARY, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sb1.png'),
  createItem('sb2', 'Galaxy Watch 6', 250, Rarity.LEGENDARY, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sb2.png'),
  createItem('sb3', 'Galaxy Buds 2 Pro', 150, Rarity.EPIC, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sb3.png'),
  createItem('sb4', 'Samsung T7 SSD 1TB', 89, Rarity.EPIC, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sb4.png'),
  createItem('sb5', 'Wireless Charger Trio', 60, Rarity.EPIC, 7, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sb5.png'),
  createItem('sb6', 'SmartTag2 4-Pack', 50, Rarity.RARE, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sb6.png'),
  createItem('sb7', '45W Power Adapter', 35, Rarity.RARE, 20, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sb7.png'),
  createItem('sb8', 'SmartTag2 (Single)', 25, Rarity.COMMON, 25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sb8.png'),
  createItem('sb9', 'USB-C Cable', 10, Rarity.COMMON, 23.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sb9.png'),
];

const GAMER_BUDGET_ITEMS: LootItem[] = [
  createItem('gb1', 'Razer Huntsman Mini', 120, Rarity.LEGENDARY, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb1.png'),
  createItem('gb2', 'Logitech G502 Hero', 50, Rarity.LEGENDARY, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb2.png'),
  createItem('gb3', 'HyperX Cloud Stinger 2', 40, Rarity.EPIC, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb3.png'),
  createItem('gb4', 'Xbox Wireless Controller', 60, Rarity.EPIC, 4, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb4.png'),
  createItem('gb5', 'Steam Gift Card $20', 20, Rarity.RARE, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb5.png'),
  createItem('gb6', 'Razer Gigantus V2 (Large)', 15, Rarity.RARE, 20, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb6.png'),
  createItem('gb7', 'Steam Gift Card $10', 10, Rarity.COMMON, 25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb7.png'),
  createItem('gb8', 'Random Steam Key (Indie)', 5, Rarity.COMMON, 20, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb8.png'),
  createItem('gb9', 'Cat 6 Ethernet Cable', 5, Rarity.COMMON, 8.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gb9.png'),
];

// 2025 APPLE BOX - $75.99
const APPLE_2025_ITEMS: LootItem[] = [
  createItem('ap25_1', 'iPhone 17 Pro Max Cosmic Orange', 1599, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_1.png'),
  createItem('ap25_2', 'iPhone 17 Pro Deep Blue', 1499, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_2.png'),
  createItem('ap25_3', 'iPhone 17 Pro Silver', 1499, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_3.png'),
  createItem('ap25_4', 'iPhone Air Cloud White', 1399, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_4.png'),
  createItem('ap25_5', 'iPhone Air Space Light Gold', 1399, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_5.png'),
  createItem('ap25_6', 'iPhone Air Space Sky Blue', 1399, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_6.png'),
  createItem('ap25_7', 'iPhone Air Space Black', 1399, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_7.png'),
  createItem('ap25_8', 'iPhone 17 Black', 1029, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_8.png'),
  createItem('ap25_9', 'iPhone 17 Mist Blue', 1029, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_9.png'),
  createItem('ap25_10', 'iPhone 17 Sage', 1029, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_10.png'),
  createItem('ap25_11', 'iPhone 17 White', 1029, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_11.png'),
  createItem('ap25_12', 'iPhone 17 Lavender', 1029, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_12.png'),
  createItem('ap25_13', 'Watch Ultra 3 Titanium Milanese Loop Black', 899, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_13.png'),
  createItem('ap25_14', 'Watch Ultra 3 Titanium Milanese Loop Natural', 899, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_14.png'),
  createItem('ap25_15', 'Watch Ultra 3 Natural Ocean Band Neon Green', 799, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_15.png'),
  createItem('ap25_16', 'Watch Ultra 3 Alpine Loop Black', 799, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_16.png'),
  createItem('ap25_17', 'Watch Series 11 Titanium Milanese Loop Slate', 774, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_17.png'),
  createItem('ap25_18', 'Watch Series 11 Titanium Milanese Loop Gold', 774, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_18.png'),
  createItem('ap25_19', 'Watch Series 11 Titanium Milanese Loop Natural', 774, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_19.png'),
  createItem('ap25_20', 'Watch Series 11 Aluminum Jet Black Sport Band', 414, Rarity.EPIC, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_20.png'),
  createItem('ap25_21', 'Watch Series 11 Aluminum Rose Gold Pride Edition', 414, Rarity.EPIC, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_21.png'),
  createItem('ap25_22', 'Watch Series 11 Aluminum Silver Nike Veiled Grey', 414, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_22.png'),
  createItem('ap25_23', 'Watch Series 11 Aluminum Space Gray Anchor Blue', 414, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_23.png'),
  createItem('ap25_24', 'Watch SE 3 Rubber Sport Band Light Blush', 279, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_24.png'),
  createItem('ap25_25', 'Watch SE 3 Rubber Sport Band Midnight', 279, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_25.png'),
  createItem('ap25_26', 'AirPods Pro 3', 249, Rarity.RARE, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_26.png'),
  createItem('ap25_27', 'Apple Gift Card $250', 229.99, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_27.png'),
  createItem('ap25_28', 'Red Delicious Apple', 0.99, Rarity.COMMON, 82.3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ap25_28.png'),
];

// PC COMPONENTS BOX
const PC_COMPONENTS_ITEMS: LootItem[] = [
  createItem('pc1', 'AMD Radeon RX 6900 XT', 915, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc1.png'),
  createItem('pc2', 'AMD Radeon RX 6800', 850, Rarity.LEGENDARY, 0.025, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc2.png'),
  createItem('pc3', 'AMD Radeon RX 6800 XT', 530, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc3.png'),
  createItem('pc4', 'AMD Radeon RX 6700 XT', 510, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc4.png'),
  createItem('pc5', 'ASUS TUF Gaming X570-Plus (Wi-Fi)', 210, Rarity.EPIC, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc5.png'),
  createItem('pc6', 'Corsair RM850x ATX 3.1', 150, Rarity.EPIC, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc6.png'),
  createItem('pc7', 'Corsair Vengeance RGB Pro', 80, Rarity.RARE, 6, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc7.png'),
  createItem('pc8', 'Corsair Vengeance LPX', 35, Rarity.RARE, 23, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc8.png'),
  createItem('pc9', 'SanDisk SSD Plus', 32.5, Rarity.RARE, 21, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc9.png'),
  createItem('pc10', 'Noctua NF-F12 PWM', 22, Rarity.RARE, 20.55, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc10.png'),
  createItem('pc11', 'Corsair AF140', 20, Rarity.COMMON, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc11.png'),
  createItem('pc12', 'LootVibe $10 Voucher', 10, Rarity.COMMON, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc12.png'),
  createItem('pc13', 'LootVibe $9 Voucher', 9, Rarity.COMMON, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pc13.png'),
];

// NINTENDO SWITCH 2 BOX
const SWITCH_2_ITEMS: LootItem[] = [
  createItem('sw2_1', 'Switch 2 - Mario Kart World Bundle', 449.99, Rarity.LEGENDARY, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_1.png'),
  createItem('sw2_2', 'Nintendo Switch 2', 449.96, Rarity.LEGENDARY, 0.02, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_2.png'),
  createItem('sw2_3', 'Switch 2 Dock Set', 389, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_3.png'),
  createItem('sw2_4', 'Gamecube Controller', 180, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_4.png'),
  createItem('sw2_5', 'Switch 2 All-In-One Carrying Case', 109, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_5.png'),
  createItem('sw2_6', 'Joy-Con 2 Pair', 95.39, Rarity.EPIC, 0.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_6.png'),
  createItem('sw2_7', 'Switch 2 Pro Controller', 89.99, Rarity.EPIC, 0.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_7.png'),
  createItem('sw2_8', 'Donkey Kong Bananza - Switch 2', 71.99, Rarity.EPIC, 0.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_8.png'),
  createItem('sw2_9', 'Nintendo x SanDisk microSDXC Express Card', 71.99, Rarity.EPIC, 0.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_9.png'),
  createItem('sw2_10', 'Mario Kart World - Nintendo Switch 2', 71.09, Rarity.EPIC, 0.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_10.png'),
  createItem('sw2_11', 'Switch 2 Camera', 68.39, Rarity.EPIC, 0.3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_11.png'),
  createItem('sw2_12', 'Zelda Tears Of The Kingdom Switch 2 Edition', 62.99, Rarity.RARE, 0.3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_12.png'),
  createItem('sw2_13', 'Cyberpunk 2077 Ultimate Edition - Switch 2', 62.99, Rarity.RARE, 0.4, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_13.png'),
  createItem('sw2_14', 'Civilization VII – Switch 2 Edition', 58.49, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_14.png'),
  createItem('sw2_15', 'Zelda: Breath of the Wild - Switch 2 Edition', 58.49, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_15.png'),
  createItem('sw2_16', 'Joy-Con 2 - Right Hand', 53.99, Rarity.RARE, 0.6, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_16.png'),
  createItem('sw2_17', 'Joy-Con 2 - Left Hand', 53.99, Rarity.RARE, 0.6, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_17.png'),
  createItem('sw2_18', 'Hori x Nintendo Piranha Plant Camera', 53.99, Rarity.RARE, 0.6, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_18.png'),
  createItem('sw2_19', 'Hogwarts Legacy - Nintendo Switch 2', 52.19, Rarity.RARE, 0.6, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_19.png'),
  createItem('sw2_20', 'Hitman: World of Assassination - Switch 2', 52.19, Rarity.RARE, 0.6, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_20.png'),
  createItem('sw2_21', 'Street Fighter 6 Years 1-2 - Switch 2', 47.69, Rarity.RARE, 0.8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_21.png'),
  createItem('sw2_22', 'Split Fiction - Nintendo Switch 2', 44.99, Rarity.RARE, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_22.png'),
  createItem('sw2_23', 'Raidou: Remastered - Switch 2', 44.09, Rarity.RARE, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_23.png'),
  createItem('sw2_24', 'Yakuza 0: Director\'s Cut - Switch 2', 44.09, Rarity.RARE, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_24.png'),
  createItem('sw2_25', 'Sonic x Shadow Generations - Switch 2', 44.09, Rarity.RARE, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_25.png'),
  createItem('sw2_26', 'eShop Gift Card €50', 41.77, Rarity.RARE, 0.9, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_26.png'),
  createItem('sw2_27', 'Joy-Con 2 Charging Grip', 39.59, Rarity.COMMON, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_27.png'),
  createItem('sw2_28', 'Nintendo Switch 2 AC Adapter', 35.99, Rarity.COMMON, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_28.png'),
  createItem('sw2_29', 'Switch 2 Carrying Case and Screen Protector', 31.49, Rarity.COMMON, 8.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_29.png'),
  createItem('sw2_30', 'Joy-Con 2 Wheel Pair', 23.39, Rarity.COMMON, 22, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_30.png'),
  createItem('sw2_31', 'LootVibe Squeaky Duck', 18, Rarity.COMMON, 22, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_31.png'),
  createItem('sw2_32', 'Joy-Con 2 Strap', 17.99, Rarity.COMMON, 23.47, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/sw2_32.png'),
];

// RTX 1% BOX
const RTX_1_PERCENT_ITEMS: LootItem[] = [
  createItem('rtx1', 'Gigabyte Nvidia GeForce RTX 5090 Aorus Master', 2970, Rarity.LEGENDARY, 0.002, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rtx1.png'),
  createItem('rtx2', 'Gigabyte Nvidia GeForce RTX 4090 Gaming OC', 1980, Rarity.LEGENDARY, 0.004, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rtx2.png'),
  createItem('rtx3', 'Gigabyte Nvidia GeForce RTX 4080 OC', 1305, Rarity.LEGENDARY, 0.008, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rtx3.png'),
  createItem('rtx4', 'Asus Nvidia GeForce RTX 4080 TUF OC', 1305, Rarity.LEGENDARY, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rtx4.png'),
  createItem('rtx5', 'Zotac Nvidia GeForce RTX 5080 Extreme Infinity', 1296, Rarity.LEGENDARY, 0.006, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rtx5.png'),
  createItem('rtx6', 'Yeston Sakura Sugar Nvidia GeForce RTX 4080 Super', 1080, Rarity.LEGENDARY, 0.025, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rtx6.png'),
  createItem('rtx7', 'Yeston Sakura Nvidia GeForce RTX 4070 TI Super', 900, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rtx7.png'),
  createItem('rtx8', 'Zotac Nvidia GeForce RTX 4070 Ti Trinity OC', 855, Rarity.EPIC, 0.295, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rtx8.png'),
  createItem('rtx9', 'Gigabyte Nvidia GeForce RTX 5070 Ti WINDFORCE OC', 836.1, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rtx9.png'),
  createItem('rtx10', 'Asus Nvidia GeForce RTX 4070 TUF OC', 720, Rarity.EPIC, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rtx10.png'),
  createItem('rtx11', 'LootVibe €0.02 Voucher', 0.02, Rarity.COMMON, 99, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rtx11.png'),
];

// SUPREME OR NOT BOX
const SUPREME_OR_NOT_ITEMS: LootItem[] = [
  createItem('son1', 'Supreme Meissen Hand-Painted Porcelain Cupid', 6393.6, Rarity.LEGENDARY, 0.001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son1.png'),
  createItem('son2', 'Supreme x RIMOWA Topas Multiwheel 45L', 3412.8, Rarity.LEGENDARY, 0.001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son2.png'),
  createItem('son3', 'Supreme x RIMOWA Cabin Plus Black', 1836, Rarity.LEGENDARY, 0.00125, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son3.png'),
  createItem('son4', 'Supreme x Louis Vuitton Monogram Scarf Brown', 1674, Rarity.LEGENDARY, 0.00125, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son4.png'),
  createItem('son5', 'Supreme x Stone Island Painted Camo Down Jacket', 1206, Rarity.LEGENDARY, 0.00125, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son5.png'),
  createItem('son6', 'Supreme x The North Face RTG Jacket + Vest', 1080, Rarity.LEGENDARY, 0.00375, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son6.png'),
  createItem('son7', 'Supreme x The North Face S Logo Mountain Jacket', 888, Rarity.LEGENDARY, 0.00125, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son7.png'),
  createItem('son8', 'Supreme x The North Face S Logo Mountain Jacket', 834, Rarity.LEGENDARY, 0.005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son8.png'),
  createItem('son9', 'Supreme x The North Face Cargo Jacket', 834, Rarity.LEGENDARY, 0.005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son9.png'),
  createItem('son10', 'Supreme Numark PT01 Portable Turntable', 626.4, Rarity.LEGENDARY, 0.005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son10.png'),
  createItem('son11', 'Supreme x The North Face RTG Backpack', 561.6, Rarity.EPIC, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son11.png'),
  createItem('son12', 'Nike x Supreme SB Dunk Low Stars', 582, Rarity.EPIC, 0.005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son12.png'),
  createItem('son13', 'Supreme Cross Box Logo Hooded Sweatshirt', 528, Rarity.EPIC, 0.0075, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son13.png'),
  createItem('son14', 'Nike x Supreme SB Dunk Low Stars Hyper Royal', 462, Rarity.EPIC, 0.00125, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son14.png'),
  createItem('son15', 'Supreme Backpack (SS20)', 388.8, Rarity.EPIC, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son15.png'),
  createItem('son16', 'Supreme Diamond Plate Tool Box', 378, Rarity.EPIC, 0.0125, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son16.png'),
  createItem('son17', 'Supreme x Nike Half Zip Hooded Sweatshirt', 323, Rarity.EPIC, 0.0125, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son17.png'),
  createItem('son18', 'Supreme x Takashi Murakami COVID-19 Relief Tee', 330, Rarity.EPIC, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son18.png'),
  createItem('son19', 'Supreme Smurfs Skateboard', 217.8, Rarity.RARE, 0.175, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son19.png'),
  createItem('son20', 'Supreme Seiko Marathon Clock', 199.8, Rarity.RARE, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son20.png'),
  createItem('son21', 'Supreme Pyle Waterproof Megaphone', 186.3, Rarity.RARE, 0.0125, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son21.png'),
  createItem('son22', 'Supreme Wavian 5L Jerry Can', 135, Rarity.RARE, 2.15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son22.png'),
  createItem('son23', 'Supreme Metal Folding Chair', 129.6, Rarity.RARE, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son23.png'),
  createItem('son24', 'Supreme Futura Logo 5-Panel', 117, Rarity.RARE, 0.4, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son24.png'),
  createItem('son25', 'Supreme Distorted Logo Skateboard Deck', 100.8, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son25.png'),
  createItem('son26', 'Supreme x Kaws Chalk Logo Skateboard Deck', 94.5, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son26.png'),
  createItem('son27', 'Supreme Watch Plate', 53.1, Rarity.COMMON, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son27.png'),
  createItem('son28', 'Supreme x Ty Beanie Baby Plush', 43.2, Rarity.COMMON, 4.568, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son28.png'),
  createItem('son29', 'LootVibe Voucher', 0.01, Rarity.COMMON, 90, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/son29.png'),
];

// BIG MIX BOX
const BIG_MIX_ITEMS: LootItem[] = [
  createItem('bm1', 'Nike x Dior Jordan 1 Retro High', 9050, Rarity.LEGENDARY, 0.0001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm1.png'),
  createItem('bm2', 'Apple Macbook M4 Max 16"', 4149, Rarity.LEGENDARY, 0.0001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm2.png'),
  createItem('bm3', 'Nike x Off-White Jordan 1 Retro High Chicago', 4205, Rarity.LEGENDARY, 0.0001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm3.png'),
  createItem('bm4', 'ASUS Nvidia GeForce RTX 4090 ROG Strix OC', 2200, Rarity.LEGENDARY, 0.0004, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm4.png'),
  createItem('bm5', 'Dior x Jordan Wings Messenger Bag', 1925, Rarity.LEGENDARY, 0.0001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm5.png'),
  createItem('bm6', 'Supreme x Stone Island Painted Camo Down Jacket', 1785, Rarity.LEGENDARY, 0.0008, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm6.png'),
  createItem('bm7', 'Dior B23 High Top Logo Oblique', 1542.5, Rarity.LEGENDARY, 0.0001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm7.png'),
  createItem('bm8', 'Nike x Union LA Jordan 1 Retro High Black Toe', 1222.5, Rarity.LEGENDARY, 0.0003, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm8.png'),
  createItem('bm9', 'AMD Radeon RX 6900 XT', 915, Rarity.LEGENDARY, 0.0001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm9.png'),
  createItem('bm10', 'Gigabyte Z590 AORUS Xtreme', 850, Rarity.LEGENDARY, 0.0005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm10.png'),
  createItem('bm11', 'Zotac Nvidia GeForce RTX 4070 Ti Trinity OC', 750, Rarity.EPIC, 0.0004, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm11.png'),
  createItem('bm12', 'Nike SB Dunk Low Sean Cliver', 562.5, Rarity.EPIC, 0.00055, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm12.png'),
  createItem('bm13', 'Sony PS5 Slim Blue-ray Edition (US Plug)', 550, Rarity.EPIC, 0.00035, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm13.png'),
  createItem('bm14', 'AMD Radeon RX 6800 XT', 530, Rarity.EPIC, 0.0001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm14.png'),
  createItem('bm15', 'Microsoft Xbox Series S (US Plug)', 405, Rarity.EPIC, 0.0005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm15.png'),
  createItem('bm16', 'Logitech G923 Xbox|PC', 400, Rarity.EPIC, 0.00155, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm16.png'),
  createItem('bm17', 'adidas Yeezy Boost 350 V2 Tail Light', 365, Rarity.EPIC, 0.0003, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm17.png'),
  createItem('bm18', 'Nike Jordan 4 Retro SE Sashiko', 345, Rarity.EPIC, 0.00075, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm18.png'),
  createItem('bm19', 'Nike Jordan 1 Low Spades', 300, Rarity.EPIC, 0.0018, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm19.png'),
  createItem('bm20', 'Nike Jordan 1 Retro High', 265, Rarity.EPIC, 0.0003, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm20.png'),
  createItem('bm21', 'Nike Dunk Low Bordeaux (W)', 275, Rarity.RARE, 0.00075, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm21.png'),
  createItem('bm22', 'Nike SB Dunk High Carpet Company', 252.5, Rarity.RARE, 0.0006, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm22.png'),
  createItem('bm23', 'Valve Steam 250 USD Gift Card', 245, Rarity.RARE, 0.00375, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm23.png'),
  createItem('bm24', 'Nike Jordan 1 Retro High 85', 225, Rarity.RARE, 0.0003, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm24.png'),
  createItem('bm25', 'Travis Scott x Jordan Cactus Jack Highest Hoodie', 227.5, Rarity.RARE, 0.00075, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm25.png'),
  createItem('bm26', 'adidas Yeezy Foam RNNR', 197.5, Rarity.RARE, 0.0003, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm26.png'),
  createItem('bm27', 'Samsung SSD 870 QVO', 182.5, Rarity.RARE, 0.0015, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm27.png'),
  createItem('bm28', 'Sony PS5 Pulse 3D Wireless', 175, Rarity.RARE, 0.0085, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm28.png'),
  createItem('bm29', 'Nike Dunk Low SP Champ Colors', 180, Rarity.RARE, 0.00075, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm29.png'),
  createItem('bm30', 'Nike Jordan 1 Retro High Patina', 180, Rarity.RARE, 0.001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm30.png'),
  createItem('bm31', 'Nike Dunk Low Medium Curry', 135, Rarity.RARE, 0.0023, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm31.png'),
  createItem('bm32', 'Nike Jordan 1 Retro High CO Japan', 127.5, Rarity.RARE, 0.0045, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm32.png'),
  createItem('bm33', 'Razer Ornata V3', 70, Rarity.RARE, 0.006, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm33.png'),
  createItem('bm34', 'Travis Scott Cactus Jack Face Mask', 50, Rarity.COMMON, 0.6735, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm34.png'),
  createItem('bm35', 'Corsair LL120 RGB', 40, Rarity.COMMON, 4, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm35.png'),
  createItem('bm36', '505 Games Control Ultimate Edition Steam Code', 14, Rarity.COMMON, 3.4878, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm36.png'),
  createItem('bm37', 'Capcom Resident Evil 3 Steam Digital Code', 10, Rarity.COMMON, 1.7985, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm37.png'),
  createItem('bm38', 'LootVibe Voucher', 0.01, Rarity.COMMON, 90, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bm38.png'),
];

// 1% RICH CLUB BOX
const RICH_CLUB_ITEMS: LootItem[] = [
  createItem('rc1', 'Porsche 2023 Taycan Turbo S', 188850, Rarity.LEGENDARY, 0.003, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc1.png'),
  createItem('rc2', 'Icebox Solitaire Diamond Stud Earrings 3.50ctw', 54339.99, Rarity.LEGENDARY, 0.013, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc2.png'),
  createItem('rc3', 'Rolex Day-Date 40 - 228239 Blue Dial', 49999.99, Rarity.LEGENDARY, 0.004, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc3.png'),
  createItem('rc4', 'Icebox 8mm Miami Cuban 14k Chain', 29699, Rarity.LEGENDARY, 0.068, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc4.png'),
  createItem('rc5', 'Icebox 2pt Miracle Set Necklace 4.00ctw', 24379.99, Rarity.LEGENDARY, 0.03, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc5.png'),
  createItem('rc6', 'Apmex 5 oz Gold Bar - Secondary Market', 20589.99, Rarity.LEGENDARY, 0.04, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc6.png'),
  createItem('rc7', 'Apmex 10 oz Platinum Bar - Credit Suisse', 17339.99, Rarity.LEGENDARY, 0.034, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc7.png'),
  createItem('rc8', 'Icebox Large Nail Bangle Bracelet 3.25ctw', 12749.99, Rarity.LEGENDARY, 0.058, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc8.png'),
  createItem('rc9', 'Yamaha 2024 R7', 12500, Rarity.LEGENDARY, 0.03, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc9.png'),
  createItem('rc10', 'Icebox Cuban Bangle Bracelet 1.65ctw', 11249.99, Rarity.EPIC, 0.17, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc10.png'),
  createItem('rc11', 'Tudor Black Bay', 8841, Rarity.EPIC, 0.04, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc11.png'),
  createItem('rc12', 'Rolex x Icebox Datejust 0.75ctw', 7255, Rarity.EPIC, 0.11, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc12.png'),
  createItem('rc13', 'Axel Crieger No Body Digital C-Print', 6400, Rarity.EPIC, 0.4, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc13.png'),
  createItem('rc14', 'LootVibe $0.01 Voucher', 0.01, Rarity.COMMON, 99, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/rc14.png'),
];

// POKER BOX
const POKER_ITEMS: LootItem[] = [
  createItem('pk1', 'WSOP Main Event Package Ticket', 20000, Rarity.LEGENDARY, 0.005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk1.png'),
  createItem('pk2', 'Monte Carlo $5000 Poker Chip', 5000, Rarity.LEGENDARY, 0.001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk2.png'),
  createItem('pk3', 'Smythson Panama Poker Set', 4559.99, Rarity.LEGENDARY, 0.001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk3.png'),
  createItem('pk4', 'Jacks Prestige Series XL 10 Seater Poker Table', 3830, Rarity.LEGENDARY, 0.002, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk4.png'),
  createItem('pk5', 'Triton Complete Poker Room Set', 3200, Rarity.LEGENDARY, 0.002, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk5.png'),
  createItem('pk6', 'Triton Poker Table Chair Combo', 2900, Rarity.LEGENDARY, 0.0025, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk6.png'),
  createItem('pk7', 'Jacks Prestige Series 9 Seater Poker Table', 2550, Rarity.LEGENDARY, 0.0025, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk7.png'),
  createItem('pk8', 'Triton 90" Premium Folding Poker Table', 1700, Rarity.LEGENDARY, 0.005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk8.png'),
  createItem('pk9', 'Hector Saxe x Brown Zebra Poker Set', 1179.99, Rarity.EPIC, 0.005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk9.png'),
  createItem('pk10', 'Shuffletech EPT Playing Cards - Single Deck', 925, Rarity.EPIC, 0.005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk10.png'),
  createItem('pk11', 'Jacks Heavy Duty Pedestal Table', 640, Rarity.EPIC, 0.02, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk11.png'),
  createItem('pk12', 'Lucky Luciano $500 Poker Chip', 500, Rarity.EPIC, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk12.png'),
  createItem('pk13', 'Shinola Lacquered Wood Poker Set', 495, Rarity.EPIC, 0.02, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk13.png'),
  createItem('pk14', 'The Ivey Fleur De Lys 10 Seater Poker Table', 447.12, Rarity.EPIC, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk14.png'),
  createItem('pk15', 'Shuffletech MDS 6 Deck Automatic Shuffler', 335, Rarity.EPIC, 0.0685, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk15.png'),
  createItem('pk16', 'Port Royal 500 Chip Poker Set', 302, Rarity.RARE, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk16.png'),
  createItem('pk17', 'League Series 8 Seater Round Poker Table', 223, Rarity.RARE, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk17.png'),
  createItem('pk18', 'True Rocks Vegas 7 Poker Chip Necklace', 212, Rarity.RARE, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk18.png'),
  createItem('pk19', 'Monte Carlo 500 Chip Poker Set', 124, Rarity.RARE, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk19.png'),
  createItem('pk20', 'Prestige 8 Deck Dealer Shoe', 109, Rarity.RARE, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk20.png'),
  createItem('pk21', 'Monte Carlo $100 Poker Chip', 100, Rarity.RARE, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk21.png'),
  createItem('pk22', 'JPT Poker Games Mat', 70, Rarity.COMMON, 7.4735, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk22.png'),
  createItem('pk23', 'Fournier EPT Playing Cards', 25.50, Rarity.COMMON, 7, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk23.png'),
  createItem('pk24', 'Lucky Luciano $25 Poker Chip', 25, Rarity.COMMON, 4.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk24.png'),
  createItem('pk25', 'Copag 1546 Elite Jumbo Playing Cards', 23.50, Rarity.COMMON, 4.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk25.png'),
  createItem('pk26', 'Bicycle Prestige Playing Cards', 19, Rarity.COMMON, 4.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk26.png'),
  createItem('pk27', 'Fournier EPT Playing Cards - Single Deck', 16, Rarity.COMMON, 5.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk27.png'),
  createItem('pk28', 'Copag Texas Hold Em', 15, Rarity.COMMON, 5.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk28.png'),
  createItem('pk29', 'Jacks Pro Playing Cards - Black & Gold', 13.99, Rarity.COMMON, 5.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk29.png'),
  createItem('pk30', 'Jacks Pro All In Triangle', 8.37, Rarity.COMMON, 7.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk30.png'),
  createItem('pk31', 'Jacks Dealer Button', 3.50, Rarity.COMMON, 11.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk31.png'),
  createItem('pk32', 'Jacks Signature Cut Card', 1.92, Rarity.COMMON, 12.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk32.png'),
  createItem('pk33', 'Monte Carlo $1 Poker Chip', 1, Rarity.COMMON, 17.375, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk33.png'),
  createItem('pk34', 'Monte Carlo $0.50 Poker Chip', 0.50, Rarity.COMMON, 0, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/pk34.png'),
];

// GOLF BOX
const GOLF_ITEMS: LootItem[] = [
  createItem('gf1', 'Titleist TSR4 Driver', 649, Rarity.LEGENDARY, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf1.png'),
  createItem('gf2', 'TaylorMade Stealth 2 Plus Driver', 599, Rarity.LEGENDARY, 0.8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf2.png'),
  createItem('gf3', 'Callaway Paradym Ai Smoke Driver', 599, Rarity.LEGENDARY, 0.8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf3.png'),
  createItem('gf4', 'Titleist T200 Iron Set (4-PW)', 1599, Rarity.LEGENDARY, 0.3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf4.png'),
  createItem('gf5', 'Scotty Cameron Phantom X Putter', 499, Rarity.EPIC, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf5.png'),
  createItem('gf6', 'Ping G430 Max Driver', 549, Rarity.EPIC, 1.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf6.png'),
  createItem('gf7', 'TaylorMade Spider Tour X Putter', 449, Rarity.EPIC, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf7.png'),
  createItem('gf8', 'Titleist Pro V1 Golf Balls (4 Dozen)', 219.96, Rarity.RARE, 8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf8.png'),
  createItem('gf9', 'FootJoy Pro SL Carbon Golf Shoes', 199, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf9.png'),
  createItem('gf10', 'Callaway Chrome Soft Golf Balls (3 Dozen)', 164.97, Rarity.RARE, 12, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf10.png'),
  createItem('gf11', 'Bushnell Pro XE Rangefinder', 499, Rarity.RARE, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf11.png'),
  createItem('gf12', 'LootVibe Golf Tees Pack', 5, Rarity.COMMON, 57.92, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/gf12.png'),
];

// BIG BALLER BOX
const BIG_BALLER_ITEMS: LootItem[] = [
  createItem('bb1', 'Rolex Daytona - 116509 Silver Dial', 49999.99, Rarity.LEGENDARY, 0.0002, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb1.png'),
  createItem('bb2', 'Rolex Datejust 36 - 126200 Blue Dial', 14999.99, Rarity.LEGENDARY, 0.0005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb2.png'),
  createItem('bb3', 'Tudor Black Bay', 5544, Rarity.LEGENDARY, 0.001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb3.png'),
  createItem('bb4', 'Louis Vuitton x Nigo Monogram Patchwork Denim Hoodie', 3690, Rarity.LEGENDARY, 0.001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb4.png'),
  createItem('bb5', 'Gucci x The North Face Down Vest', 3615, Rarity.LEGENDARY, 0.001, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb5.png'),
  createItem('bb6', 'Louis Vuitton x Murakami Neverfull MM Bag', 2960, Rarity.LEGENDARY, 0.002, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb6.png'),
  createItem('bb7', 'Louis Vuitton Speedy Bandouliere Monogram 25', 2210, Rarity.LEGENDARY, 0.002, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb7.png'),
  createItem('bb8', 'Dior Zipped Pouch with Strap', 1700, Rarity.LEGENDARY, 0.002, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb8.png'),
  createItem('bb9', 'Dior Oblique Short-Sleeved Shirt Silk Twill', 1650, Rarity.EPIC, 0.005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb9.png'),
  createItem('bb10', 'Apple Watch Series 10 Titanium (GPS+Cellular)', 770, Rarity.EPIC, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb10.png'),
  createItem('bb11', 'Dolce & Gabbana Logo-print T-shirt', 599.99, Rarity.EPIC, 0.15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb11.png'),
  createItem('bb12', 'Nike Jordan 4 Retro University Blue', 487.5, Rarity.EPIC, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb12.png'),
  createItem('bb13', 'Saint Laurent Crocodile-embossed Cardholder', 349.99, Rarity.EPIC, 0.45, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb13.png'),
  createItem('bb14', 'Nike Jordan 1 Retro High Shadow (2018)', 310, Rarity.RARE, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb14.png'),
  createItem('bb15', 'Off-White x Jordan T-Shirt Black', 277.5, Rarity.RARE, 0.3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb15.png'),
  createItem('bb16', 'CDG x Nike T-shirt White', 215, Rarity.RARE, 0.95, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb16.png'),
  createItem('bb17', 'Fear of God Essentials Pull-Over Hoodie (SS21)', 177.5, Rarity.RARE, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb17.png'),
  createItem('bb18', 'Seletti Sitting Mouse Lamp', 149.99, Rarity.RARE, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb18.png'),
  createItem('bb19', 'Travis Scott x McDonald\'s All American 92\' Basketball', 125, Rarity.RARE, 0.7, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb19.png'),
  createItem('bb20', 'Supreme Nalgene 32 oz. Bottle', 85, Rarity.RARE, 2.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb20.png'),
  createItem('bb21', 'Aston Martin x PLAYMOBIL James Bond Goldfinger DB5', 79, Rarity.RARE, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb21.png'),
  createItem('bb22', 'Pokémon x Van Gogh Museum Pikachu Plush', 75, Rarity.COMMON, 2.2753, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb22.png'),
  createItem('bb23', 'Supreme Nerf Rival Takedown Blaster', 60, Rarity.COMMON, 2.3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb23.png'),
  createItem('bb24', 'StockX Tag', 1.50, Rarity.COMMON, 35, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb24.png'),
  createItem('bb25', 'Squid Game Ddakji', 0.50, Rarity.COMMON, 50, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bb25.png'),
];

// MIXED SPORTS BOX
const MIXED_SPORTS_ITEMS: LootItem[] = [
  createItem('ms1', 'Brunswick Gold Crown VI Pool Table', 12500, Rarity.LEGENDARY, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms1.png'),
  createItem('ms2', 'Michael Jordan Signed Basketball UDA', 8500, Rarity.LEGENDARY, 0.02, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms2.png'),
  createItem('ms3', 'Olhausen Grand Champion Pool Table', 7800, Rarity.LEGENDARY, 0.03, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms3.png'),
  createItem('ms4', 'LeBron James Signed Jersey Fanatics', 4200, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms4.png'),
  createItem('ms5', 'Tom Brady Signed Football PSA/DNA', 3500, Rarity.LEGENDARY, 0.08, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms5.png'),
  createItem('ms6', 'Spalding The Beast Portable Basketball Hoop', 1599, Rarity.EPIC, 0.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms6.png'),
  createItem('ms7', 'Patrick Mahomes Signed Mini Helmet', 1200, Rarity.EPIC, 0.3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms7.png'),
  createItem('ms8', 'Kobe Bryant Signed Photo PSA/DNA', 2800, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms8.png'),
  createItem('ms9', 'Wilson Evolution Basketball (Official)', 79.99, Rarity.EPIC, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms9.png'),
  createItem('ms10', 'Predator Throne Pool Cue', 899, Rarity.EPIC, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms10.png'),
  createItem('ms11', 'NFL Official Game Football Wilson', 149.99, Rarity.RARE, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms11.png'),
  createItem('ms12', 'Aramith Tournament Pool Ball Set', 299, Rarity.RARE, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms12.png'),
  createItem('ms13', 'Lifetime 90" Portable Basketball Hoop', 399, Rarity.RARE, 2.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms13.png'),
  createItem('ms14', 'McDermott Lucky Pool Cue', 449, Rarity.RARE, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms14.png'),
  createItem('ms15', 'Spalding NBA Street Basketball', 39.99, Rarity.RARE, 8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms15.png'),
  createItem('ms16', 'Nike Elite Basketball Socks (3-Pack)', 24.99, Rarity.COMMON, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms16.png'),
  createItem('ms17', 'Wilson NCAA Football', 34.99, Rarity.COMMON, 12, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms17.png'),
  createItem('ms18', 'Champion Sports Pool Cue Rack', 89.99, Rarity.COMMON, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms18.png'),
  createItem('ms19', 'Spalding TF-1000 Basketball', 69.99, Rarity.COMMON, 8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms19.png'),
  createItem('ms20', 'LootVibe Sports Water Bottle', 9.99, Rarity.COMMON, 29.42, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ms20.png'),
];

// FOOTBALL BOX
const FOOTBALL_ITEMS: LootItem[] = [
  createItem('fb1', 'Tom Brady Signed Authentic Jersey PSA/DNA', 8500, Rarity.LEGENDARY, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb1.png'),
  createItem('fb2', 'Patrick Mahomes Signed Helmet Fanatics', 3200, Rarity.LEGENDARY, 0.03, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb2.png'),
  createItem('fb3', 'Joe Burrow Signed Football PSA/DNA', 1800, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb3.png'),
  createItem('fb4', 'Travis Kelce Signed Jersey Fanatics', 1200, Rarity.LEGENDARY, 0.08, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb4.png'),
  createItem('fb5', 'Josh Allen Signed Mini Helmet', 950, Rarity.EPIC, 0.15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb5.png'),
  createItem('fb6', 'Lamar Jackson Signed Photo 16x20', 750, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb6.png'),
  createItem('fb7', 'Justin Jefferson Signed Jersey', 850, Rarity.EPIC, 0.2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb7.png'),
  createItem('fb8', 'Riddell SpeedFlex Helmet (Authentic)', 449, Rarity.EPIC, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb8.png'),
  createItem('fb9', 'Nike Vapor Elite Jersey (Custom)', 325, Rarity.EPIC, 0.8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb9.png'),
  createItem('fb10', 'Wilson Official NFL Game Ball', 179.99, Rarity.RARE, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb10.png'),
  createItem('fb11', 'Oakley NFL Visor (Prizm)', 129.99, Rarity.RARE, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb11.png'),
  createItem('fb12', 'Nike Vapor Edge Pro Cleats', 159.99, Rarity.RARE, 4, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb12.png'),
  createItem('fb13', 'Under Armour Highlight Gloves', 89.99, Rarity.RARE, 8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb13.png'),
  createItem('fb14', 'Schutt F7 Facemask', 119.99, Rarity.RARE, 6, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb14.png'),
  createItem('fb15', 'Wilson NFL Duke Replica Football', 49.99, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb15.png'),
  createItem('fb16', 'Nike Pro Combat Padded Shirt', 69.99, Rarity.COMMON, 12, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb16.png'),
  createItem('fb17', 'Under Armour Compression Shorts', 44.99, Rarity.COMMON, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb17.png'),
  createItem('fb18', 'Nike Dri-FIT Training Shirt', 39.99, Rarity.COMMON, 18, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb18.png'),
  createItem('fb19', 'Wilson NCAA Football', 34.99, Rarity.COMMON, 20, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb19.png'),
  createItem('fb20', 'LootVibe Football Kicking Tee', 12.99, Rarity.COMMON, 24.49, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/fb20.png'),
];

// BASKETBALL BOX
const BASKETBALL_ITEMS: LootItem[] = [
  createItem('bk1', 'Michael Jordan Signed Basketball UDA', 9500, Rarity.LEGENDARY, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk1.png'),
  createItem('bk2', 'LeBron James Signed Jersey Upper Deck', 5200, Rarity.LEGENDARY, 0.02, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk2.png'),
  createItem('bk3', 'Kobe Bryant Signed Photo 16x20 PSA/DNA', 4800, Rarity.LEGENDARY, 0.03, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk3.png'),
  createItem('bk4', 'Stephen Curry Signed Basketball Fanatics', 2400, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk4.png'),
  createItem('bk5', 'Giannis Antetokounmpo Signed Jersey', 1800, Rarity.LEGENDARY, 0.08, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk5.png'),
  createItem('bk6', 'Luka Doncic Signed Basketball', 1500, Rarity.EPIC, 0.12, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk6.png'),
  createItem('bk7', 'Victor Wembanyama Signed Photo', 1200, Rarity.EPIC, 0.15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk7.png'),
  createItem('bk8', 'Spalding The Beast Portable Hoop', 1599, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk8.png'),
  createItem('bk9', 'Nike LeBron 21 Basketball Shoes', 199.99, Rarity.EPIC, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk9.png'),
  createItem('bk10', 'Wilson Evolution Basketball (Official)', 79.99, Rarity.EPIC, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk10.png'),
  createItem('bk11', 'Spalding NBA Official Game Ball', 169.99, Rarity.RARE, 4, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk11.png'),
  createItem('bk12', 'Nike Kobe 6 Protro', 189.99, Rarity.RARE, 2.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk12.png'),
  createItem('bk13', 'Under Armour Curry Flow 11', 159.99, Rarity.RARE, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk13.png'),
  createItem('bk14', 'Lifetime 54" Portable Basketball Hoop', 499, Rarity.RARE, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk14.png'),
  createItem('bk15', 'Nike Elite Crew Basketball Socks (6-Pack)', 49.99, Rarity.RARE, 8, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk15.png'),
  createItem('bk16', 'Spalding TF-1000 Basketball', 69.99, Rarity.RARE, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk16.png'),
  createItem('bk17', 'Nike Dri-FIT Basketball Shorts', 44.99, Rarity.COMMON, 15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk17.png'),
  createItem('bk18', 'Wilson NCAA Basketball', 39.99, Rarity.COMMON, 18, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk18.png'),
  createItem('bk19', 'Spalding Street Basketball', 29.99, Rarity.COMMON, 20, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk19.png'),
  createItem('bk20', 'LootVibe Basketball Pump', 9.99, Rarity.COMMON, 26.86, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/bk20.png'),
];

// ARTSY HUSTLE BOX
const ARTSY_HUSTLE_ITEMS: LootItem[] = [
  createItem('ah1', 'Louis Vuitton Louis Buffalo', 8850, Rarity.LEGENDARY, 0.005, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah1.png'),
  createItem('ah2', 'Kaws Resting Place Vinyl Figure', 2910, Rarity.LEGENDARY, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah2.png'),
  createItem('ah3', 'Virgil Abloh x IKEA "KEEP OFF" Rug', 2815, Rarity.LEGENDARY, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah3.png'),
  createItem('ah4', 'MediCom Toy x Pokémon Bearbrick Pikachu Flocky 1000%', 2170, Rarity.LEGENDARY, 0.01, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah4.png'),
  createItem('ah5', 'Pokémon TCG XY Evolutions Kanto Power Collection', 1240, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah5.png'),
  createItem('ah6', 'Pokémon TCG Sword & Shield 25th Anniversary Golden', 1180, Rarity.LEGENDARY, 0.35, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah6.png'),
  createItem('ah7', 'Virgil Abloh x IKEA MARKERAD "WET GRASS" Rug', 1050, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah7.png'),
  createItem('ah8', 'MediCom Toy x Pokémon Bearbrick Pikachu', 1030, Rarity.LEGENDARY, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah8.png'),
  createItem('ah9', 'Kaws THE PROMISE Vinyl Figure', 970, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah9.png'),
  createItem('ah10', 'Medicom Toy Bearbrick Clear Red Heart', 930, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah10.png'),
  createItem('ah11', 'Kaws Family Figure', 915, Rarity.EPIC, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah11.png'),
  createItem('ah12', 'Pokémon TCG Sword & Shield Special Box Kanazawa', 915, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah12.png'),
  createItem('ah13', 'MediCom Toy Bearbrick My First Baby Marble', 755, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah13.png'),
  createItem('ah14', 'Pokémon TCG Sword & Shield High Class Pack VMAX', 755, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah14.png'),
  createItem('ah15', 'Pokémon TCG x Van Gogh Museum Pikachu PSA 9', 670, Rarity.EPIC, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah15.png'),
  createItem('ah16', 'Kaws Holiday Shanghai Vinyl Figure', 595, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah16.png'),
  createItem('ah17', 'MediCom Toy Bearbrick Andy Warhol x Basquiat #4', 545, Rarity.EPIC, 0.35, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah17.png'),
  createItem('ah18', 'Virgil Abloh x IKEA MARKERAD "RECEIPT" Rug', 545, Rarity.EPIC, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah18.png'),
  createItem('ah19', 'Kaws KAWS Holiday UK Vinyl Figure', 525, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah19.png'),
  createItem('ah20', 'Pokémon Center x Van Gogh Pikachu Canvas', 520, Rarity.EPIC, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah20.png'),
  createItem('ah21', 'MediCom Toy Bearbrick Marble', 510, Rarity.EPIC, 0.35, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah21.png'),
  createItem('ah22', 'BigBuy Home Ethereal Horizon Canvas', 510, Rarity.EPIC, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah22.png'),
  createItem('ah23', 'Kaws Holiday Changbai Mountain Vinyl Figure', 505, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah23.png'),
  createItem('ah24', 'DKD Home Decor Mystic Flow Abstract Canvas', 470, Rarity.RARE, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah24.png'),
  createItem('ah25', 'Virgil Abloh x IKEA Markerad "Mona Lisa" Artwork', 460, Rarity.RARE, 0.15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah25.png'),
  createItem('ah26', 'Medicom Toy x Van Gogh Bearbrick Self Portrait', 410, Rarity.RARE, 0.35, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah26.png'),
  createItem('ah27', 'MediCom Toy x Nike Bearbrick SB 2020 Set', 395, Rarity.RARE, 0.15, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah27.png'),
  createItem('ah28', 'MediCom Toy Bearbrick The Starry Night Set', 360, Rarity.RARE, 0.35, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah28.png'),
  createItem('ah29', 'Kaws x Hirake! Ponkikki KACHAMUKKU', 315, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah29.png'),
  createItem('ah30', 'MediCom Toy x Clot x Nike Bearbrick Set', 290, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah30.png'),
  createItem('ah31', 'MediCom Toy Bearbrick Series 42 Sealed Case', 280, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah31.png'),
  createItem('ah32', 'Pokémon TCG Vivid Voltage Booster Box', 242.99, Rarity.RARE, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah32.png'),
  createItem('ah33', 'MediCom Toy Bearbrick Jean-Michel Basquiat Set', 245, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah33.png'),
  createItem('ah34', 'Pokémon TCG 25th Anniversary Charizard', 240, Rarity.RARE, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah34.png'),
  createItem('ah35', 'MediCom Toy Bearbrick Series 43 Sealed Case', 235, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah35.png'),
  createItem('ah36', 'Kaws x Human Made Duck Plush Down Doll', 230, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah36.png'),
  createItem('ah37', 'Pokémon Center x Van Gogh Pikachu & Eevee Canvas', 220, Rarity.RARE, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah37.png'),
  createItem('ah38', 'MediCom Toy Bearbrick Superman', 185, Rarity.RARE, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah38.png'),
  createItem('ah39', 'Pokémon Center x Van Gogh Eevee Canvas', 170, Rarity.RARE, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah39.png'),
  createItem('ah40', 'MediCom Toy x Public Image Bearbrick Set', 169.99, Rarity.RARE, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah40.png'),
  createItem('ah41', 'Kaws Brooklyn Museum TIDE Poster', 155, Rarity.RARE, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah41.png'),
  createItem('ah42', 'Medicom Toy x Van Gogh Bearbrick Museum', 150, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah42.png'),
  createItem('ah43', 'Pokémon Center x Van Gogh Sunflora Canvas', 150, Rarity.RARE, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah43.png'),
  createItem('ah44', 'MediCom Toy Bearbrick Warhol x Basquiat', 145, Rarity.RARE, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah44.png'),
  createItem('ah45', 'Pokémon Center x Van Gogh 6 Pack Posters', 140, Rarity.RARE, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah45.png'),
  createItem('ah46', 'Pokémon TCG Sword & Shield Expansion Pack S7D', 130, Rarity.COMMON, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah46.png'),
  createItem('ah47', 'Kaws x Uniqlo Cookie Monster Plush Toy', 125, Rarity.COMMON, 1.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah47.png'),
  createItem('ah48', 'Pokémon Center x Van Gogh Pin Box Set', 120, Rarity.COMMON, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah48.png'),
  createItem('ah49', 'Pokémon Center x Van Gogh 12 Pack Postcards', 120, Rarity.COMMON, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah49.png'),
  createItem('ah50', 'Bearbrick x Care Bears Cheer Bear 400%', 90, Rarity.COMMON, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah50.png'),
  createItem('ah51', 'Kaws x Uniqlo Elmo Plush Toy', 90, Rarity.COMMON, 2.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah51.png'),
  createItem('ah52', 'Pokémon TCG Shining Fates Elite Trainer Box', 80.99, Rarity.COMMON, 2.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah52.png'),
  createItem('ah53', 'MediCom Toy Bearbrick BAPE 28th Anniversary', 85, Rarity.COMMON, 2.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah53.png'),
  createItem('ah54', 'Virgil Abloh x Nike ICONS Book', 85, Rarity.COMMON, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah54.png'),
  createItem('ah55', 'Pokémon Center x Van Gogh Bedroom Playmat', 80, Rarity.COMMON, 2.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah55.png'),
  createItem('ah56', 'Kaws x Uniqlo Bert Plush Toy', 80, Rarity.COMMON, 2.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah56.png'),
  createItem('ah57', 'Pokémon TCG Squishmallow 20" Pikachu Plush', 75, Rarity.COMMON, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah57.png'),
  createItem('ah58', 'Pokémon Center x Van Gogh Deck 65 Card', 75, Rarity.COMMON, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah58.png'),
  createItem('ah59', 'Kaws Phaidon Uniqlo Book', 70, Rarity.COMMON, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah59.png'),
  createItem('ah60', 'Fruugo Aztec Death Whistle Loud', 47, Rarity.COMMON, 10, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah60.png'),
  createItem('ah61', 'Lego Amelia Earhart Tribute', 45, Rarity.COMMON, 5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah61.png'),
  createItem('ah62', 'Funko x Pokémon Pop! Eevee Diamond Figure', 40, Rarity.COMMON, 2.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah62.png'),
  createItem('ah63', 'Montegrappa Harry Potter Thestral Ink Bottle', 33, Rarity.COMMON, 6.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah63.png'),
  createItem('ah64', 'Werthers Original Classic Vanilla Caramels', 6, Rarity.COMMON, 16.315, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ah64.png'),
];

// LUXURY SNEAKERS BOX
const LUXURY_SNEAKERS_ITEMS: LootItem[] = [
  createItem('ls1', 'Louis Vuitton Trainer Maxi Sneaker', 6050, Rarity.LEGENDARY, 0.02, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls1.png'),
  createItem('ls2', 'Dolce & Gabbana Rome Crocodile Leather', 3109.99, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls2.png'),
  createItem('ls3', 'Zegna Monte Sneakers', 1489.99, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls3.png'),
  createItem('ls4', 'Amiri Skel Top Sneakers', 1359.99, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls4.png'),
  createItem('ls5', 'Zegna Triple Stitch Calf Leather Sneakers', 1350, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls5.png'),
  createItem('ls6', 'Balenciaga Track Sneakers', 1100, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls6.png'),
  createItem('ls7', 'Prada Downtown Sneakers', 1049.99, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls7.png'),
  createItem('ls8', 'TOM FORD Crocodile Effect Sneakers', 1010, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls8.png'),
  createItem('ls9', 'Zegna Triple Stitch Suede Sneakers', 989.99, Rarity.LEGENDARY, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls9.png'),
  createItem('ls10', 'Amiri Shimmer Skel-top Low', 879.99, Rarity.LEGENDARY, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls10.png'),
  createItem('ls11', 'Maison Margiela New Evolution Layered Sneakers', 860, Rarity.EPIC, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls11.png'),
  createItem('ls12', 'Dolce & Gabbana Crown Sneakers', 799.99, Rarity.EPIC, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls12.png'),
  createItem('ls13', 'Balenciaga Triple S Sneaker', 795, Rarity.EPIC, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls13.png'),
  createItem('ls14', 'Philipp Plein Nappa Leather Lo-Top Sneakers', 779.99, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls14.png'),
  createItem('ls15', 'TOM FORD Leather Sneakers', 770, Rarity.EPIC, 0.05, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls15.png'),
  createItem('ls16', 'Valentino Rockstud Low Top', 769.99, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls16.png'),
  createItem('ls17', 'Philipp Plein Predator', 760, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls17.png'),
  createItem('ls18', 'Dolce & Gabbana Portofino Jacquard Sneakers', 745, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls18.png'),
  createItem('ls19', 'Philipp Plein Lace-up Leather Trainers', 739.99, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls19.png'),
  createItem('ls20', 'Burberry Vintage Check Low-top Sneakers', 659.99, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls20.png'),
  createItem('ls21', 'Amiri Skel Top Hi Sneakers', 650, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls21.png'),
  createItem('ls22', 'Saint Laurent Court Classic SL/06', 619.99, Rarity.EPIC, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls22.png'),
  createItem('ls23', 'Tom Ford Velvet Sneakers', 609.99, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls23.png'),
  createItem('ls24', 'Gucci Ace Supreme', 600, Rarity.EPIC, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls24.png'),
  createItem('ls25', 'Jimmy Choo Palma/M', 595, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls25.png'),
  createItem('ls26', 'Golden Goose Super-Star Low-top Sneakers', 579.99, Rarity.EPIC, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls26.png'),
  createItem('ls27', 'Golden Goose Dad-Star Sneakers', 570, Rarity.RARE, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls27.png'),
  createItem('ls28', 'Alexander McQueen Oversized Sneakers', 560, Rarity.RARE, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls28.png'),
  createItem('ls29', 'Amiri Court High-stop Sneakers', 559.99, Rarity.RARE, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls29.png'),
  createItem('ls30', 'Maison Mihara Yasuhiro Blakey Low-top Sneakers', 565, Rarity.RARE, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls30.png'),
  createItem('ls31', 'Versace Greca Embroidered Sneakers', 504.99, Rarity.RARE, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls31.png'),
  createItem('ls32', 'Golden Goose Super-Star Sneakers', 489.99, Rarity.RARE, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls32.png'),
  createItem('ls33', 'Maison Mihara Hank OG Sole Canvas Low', 437.5, Rarity.RARE, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls33.png'),
  createItem('ls34', 'Dolce & Gabbana CUSHION Sneakers', 439.99, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls34.png'),
  createItem('ls35', 'Maison MIHARA YASUHIRO HANK Sneakers', 435, Rarity.RARE, 0.1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls35.png'),
  createItem('ls36', 'Off-white Low Vulcanized Sneakers', 395, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls36.png'),
  createItem('ls37', 'Common Projects Tennis Classic Sneakers', 380, Rarity.RARE, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls37.png'),
  createItem('ls38', 'Golden Goose Matchstar Sneakers', 370, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls38.png'),
  createItem('ls39', 'Palm Angels University Sneakers', 365, Rarity.RARE, 0.25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls39.png'),
  createItem('ls40', 'Hackett Hackney Sneakers', 300, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls40.png'),
  createItem('ls41', 'Hackett Leather Sneakers', 300, Rarity.RARE, 0.5, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls41.png'),
  createItem('ls42', 'Axel Arigato Dice Lo Leather Sneakers', 299.99, Rarity.RARE, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls42.png'),
  createItem('ls43', 'Autry Medalist Sneakers', 299.99, Rarity.RARE, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls43.png'),
  createItem('ls44', 'Autry Action low-top Sneakers', 279.99, Rarity.RARE, 1, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls44.png'),
  createItem('ls45', 'GUESS USA Monogram-panel Sneakers', 239.99, Rarity.COMMON, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls45.png'),
  createItem('ls46', 'Levi\'s Chunky Sole Sneakers', 225, Rarity.COMMON, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls46.png'),
  createItem('ls47', 'Autry Medalist Suede-panel Sneakers', 219.99, Rarity.COMMON, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls47.png'),
  createItem('ls48', 'VEJA V10 ChromeFree Sneakers', 177.5, Rarity.COMMON, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls48.png'),
  createItem('ls49', 'Hugo Panelled Sneakers', 164, Rarity.COMMON, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls49.png'),
  createItem('ls50', 'VEJA Campo Low-top Sneakers', 169.99, Rarity.COMMON, 2, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls50.png'),
  createItem('ls51', 'GUESS USA Logo-plaque Sneakers', 160, Rarity.COMMON, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls51.png'),
  createItem('ls52', 'Veja Super-Star Sneakers', 114, Rarity.COMMON, 3, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls52.png'),
  createItem('ls53', 'Kappa Chossuni Socks', 17, Rarity.COMMON, 25, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls53.png'),
  createItem('ls54', 'Shoelace', 1, Rarity.COMMON, 43.83, 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/items/ls54.png'),
];

// --- BOX DEFINITIONS ---

export const INITIAL_BOXES: LootBox[] = [
  {
    id: 'pokemon_box',
    name: 'POKEMON TREASURE BOX',
    category: 'POKEMON',
    price: 75.00,
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/pokemon_box.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/food_box.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/sneaker_box.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/steam_box.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/tech_box.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/supreme_box.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/apple_budget.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/samsung_budget.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/gamer_budget.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/charizard_chase.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/pokemon_budget.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/modern_hits.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/vintage_vault.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/apple_2025.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/pc_components.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/switch_2.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/rtx_1_percent.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/supreme_or_not.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/big_mix.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/rich_club.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/poker_box.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/golf_box.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/big_baller.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/mixed_sports.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/football_box.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/basketball_box.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/artsy_hustle.png',
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
    image: 'https://cbjdasfnwzizfphnwxfd.supabase.co/storage/v1/object/public/game-assets/boxes/luxury_sneakers.png',
    description: 'Louis Vuitton, Balenciaga, Gucci - high-end designer sneakers',
    tags: ['NEW', 'FEATURED'],
    color: 'from-indigo-500 to-purple-700',
    items: LUXURY_SNEAKERS_ITEMS
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
