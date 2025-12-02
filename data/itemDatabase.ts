import { LootItem, Rarity } from '../types';

export interface RealItem {
    name: string;
    value: number;
    category: 'TECH' | 'CLOTHING' | 'LUXURY' | 'CRYPTO' | 'CARS' | 'GAMING' | 'OTHER';
    brand?: string;
}

export const REAL_ITEMS_DB: RealItem[] = [
    // TECH - APPLE
    { name: 'iPhone 15 Pro Max', value: 1199, category: 'TECH', brand: 'Apple' },
    { name: 'iPhone 15', value: 799, category: 'TECH', brand: 'Apple' },
    { name: 'iPhone 14', value: 699, category: 'TECH', brand: 'Apple' },
    { name: 'iPhone 13', value: 599, category: 'TECH', brand: 'Apple' },
    { name: 'MacBook Pro 16" M3 Max', value: 3499, category: 'TECH', brand: 'Apple' },
    { name: 'MacBook Air M2', value: 1099, category: 'TECH', brand: 'Apple' },
    { name: 'iPad Pro 12.9"', value: 1099, category: 'TECH', brand: 'Apple' },
    { name: 'iPad Air', value: 599, category: 'TECH', brand: 'Apple' },
    { name: 'AirPods Pro 2nd Gen', value: 249, category: 'TECH', brand: 'Apple' },
    { name: 'AirPods Max', value: 549, category: 'TECH', brand: 'Apple' },
    { name: 'Apple Watch Ultra 2', value: 799, category: 'TECH', brand: 'Apple' },
    { name: 'Apple Polishing Cloth', value: 19, category: 'TECH', brand: 'Apple' },
    { name: 'Apple AirTag', value: 29, category: 'TECH', brand: 'Apple' },

    // TECH - GAMING & PC
    { name: 'NVIDIA RTX 4090', value: 1599, category: 'GAMING', brand: 'NVIDIA' },
    { name: 'NVIDIA RTX 4080', value: 1199, category: 'GAMING', brand: 'NVIDIA' },
    { name: 'NVIDIA RTX 4070', value: 599, category: 'GAMING', brand: 'NVIDIA' },
    { name: 'NVIDIA RTX 3060', value: 299, category: 'GAMING', brand: 'NVIDIA' },
    { name: 'Intel Core i9-14900K', value: 589, category: 'GAMING', brand: 'Intel' },
    { name: 'AMD Ryzen 9 7950X3D', value: 699, category: 'GAMING', brand: 'AMD' },
    { name: 'PlayStation 5 Pro', value: 699, category: 'GAMING', brand: 'Sony' },
    { name: 'Xbox Series X', value: 499, category: 'GAMING', brand: 'Microsoft' },
    { name: 'Nintendo Switch OLED', value: 349, category: 'GAMING', brand: 'Nintendo' },
    { name: 'Steam Deck OLED', value: 549, category: 'GAMING', brand: 'Valve' },
    { name: 'Logitech G Pro X Superlight 2', value: 159, category: 'GAMING', brand: 'Logitech' },
    { name: 'Razer DeathAdder V3', value: 149, category: 'GAMING', brand: 'Razer' },
    { name: 'Wooting 60HE Keyboard', value: 175, category: 'GAMING', brand: 'Wooting' },
    { name: 'Alienware 34" QD-OLED Monitor', value: 899, category: 'GAMING', brand: 'Alienware' },

    // CLOTHING - STREETWEAR & SNEAKERS
    { name: 'Nike Air Jordan 1 High "Chicago"', value: 1800, category: 'CLOTHING', brand: 'Jordan' },
    { name: 'Nike Dunk Low "Panda"', value: 110, category: 'CLOTHING', brand: 'Nike' },
    { name: 'Nike Air Force 1 White', value: 90, category: 'CLOTHING', brand: 'Nike' },
    { name: 'Adidas Yeezy Slide "Onyx"', value: 140, category: 'CLOTHING', brand: 'Yeezy' },
    { name: 'Adidas Yeezy Boost 350 V2 "Zebra"', value: 350, category: 'CLOTHING', brand: 'Yeezy' },
    { name: 'Supreme Box Logo Hoodie', value: 450, category: 'CLOTHING', brand: 'Supreme' },
    { name: 'Supreme T-Shirt', value: 48, category: 'CLOTHING', brand: 'Supreme' },
    { name: 'Supreme Hanes Socks (Pack)', value: 30, category: 'CLOTHING', brand: 'Supreme' },
    { name: 'BAPE Shark Hoodie', value: 499, category: 'CLOTHING', brand: 'BAPE' },
    { name: 'BAPE T-Shirt', value: 99, category: 'CLOTHING', brand: 'BAPE' },
    { name: 'Essentials Hoodie', value: 90, category: 'CLOTHING', brand: 'Fear of God' },
    { name: 'Travis Scott x Jordan 1 Low "Mocha"', value: 1500, category: 'CLOTHING', brand: 'Jordan' },
    { name: 'Off-White x Nike Air Jordan 1', value: 4500, category: 'CLOTHING', brand: 'Off-White' },

    // LUXURY - WATCHES & BAGS
    { name: 'Rolex Submariner Date', value: 14500, category: 'LUXURY', brand: 'Rolex' },
    { name: 'Rolex Daytona Panda', value: 35000, category: 'LUXURY', brand: 'Rolex' },
    { name: 'Rolex Datejust 41', value: 10500, category: 'LUXURY', brand: 'Rolex' },
    { name: 'Audemars Piguet Royal Oak', value: 55000, category: 'LUXURY', brand: 'AP' },
    { name: 'Patek Philippe Nautilus', value: 120000, category: 'LUXURY', brand: 'Patek' },
    { name: 'Richard Mille RM 011', value: 250000, category: 'LUXURY', brand: 'Richard Mille' },
    { name: 'Louis Vuitton Keepall 55', value: 2100, category: 'LUXURY', brand: 'Louis Vuitton' },
    { name: 'Gucci Marmont Bag', value: 2500, category: 'LUXURY', brand: 'Gucci' },
    { name: 'Hermès Birkin 30', value: 25000, category: 'LUXURY', brand: 'Hermès' },
    { name: 'Gucci Card Holder', value: 290, category: 'LUXURY', brand: 'Gucci' },
    { name: 'Louis Vuitton Wallet', value: 550, category: 'LUXURY', brand: 'Louis Vuitton' },

    // CARS
    { name: 'Lamborghini Huracán', value: 250000, category: 'CARS', brand: 'Lamborghini' },
    { name: 'Ferrari F8 Tributo', value: 280000, category: 'CARS', brand: 'Ferrari' },
    { name: 'Porsche 911 GT3 RS', value: 220000, category: 'CARS', brand: 'Porsche' },
    { name: 'Mercedes-AMG G63', value: 180000, category: 'CARS', brand: 'Mercedes' },
    { name: 'BMW M4 Competition', value: 85000, category: 'CARS', brand: 'BMW' },
    { name: 'Tesla Model S Plaid', value: 110000, category: 'CARS', brand: 'Tesla' },
    { name: 'Honda Civic Type R', value: 45000, category: 'CARS', brand: 'Honda' },
    { name: 'Toyota Supra MK5', value: 55000, category: 'CARS', brand: 'Toyota' },

    // CRYPTO
    { name: '1 Bitcoin (BTC)', value: 65000, category: 'CRYPTO', brand: 'Bitcoin' },
    { name: '0.1 Bitcoin (BTC)', value: 6500, category: 'CRYPTO', brand: 'Bitcoin' },
    { name: '1 Ethereum (ETH)', value: 3500, category: 'CRYPTO', brand: 'Ethereum' },
    { name: '10 Solana (SOL)', value: 1500, category: 'CRYPTO', brand: 'Solana' },
    { name: 'Ledger Nano X', value: 149, category: 'CRYPTO', brand: 'Ledger' },
    { name: 'Trezor Model T', value: 219, category: 'CRYPTO', brand: 'Trezor' },

    // OTHER / BUDGET
    { name: 'Amazon Gift Card $50', value: 50, category: 'OTHER', brand: 'Amazon' },
    { name: 'Amazon Gift Card $10', value: 10, category: 'OTHER', brand: 'Amazon' },
    { name: 'Netflix Subscription (1 Year)', value: 150, category: 'OTHER', brand: 'Netflix' },
    { name: 'Spotify Premium (1 Year)', value: 120, category: 'OTHER', brand: 'Spotify' },
    { name: 'Discord Nitro (1 Month)', value: 10, category: 'OTHER', brand: 'Discord' },
    { name: 'Steam Key: Random AAA Game', value: 60, category: 'OTHER', brand: 'Steam' },
    { name: 'Steam Key: Random Indie Game', value: 15, category: 'OTHER', brand: 'Steam' },
    { name: 'Monster Energy Case', value: 40, category: 'OTHER', brand: 'Monster' },
    { name: 'Supreme Sticker', value: 5, category: 'CLOTHING', brand: 'Supreme' },
    { name: 'Apple Sticker', value: 2, category: 'TECH', brand: 'Apple' },
];

export const getItemsForBox = (boxName: string, boxPrice: number): LootItem[] => {
    const items: LootItem[] = [];

    // 1. Filter items based on box name keywords
    let relevantItems = REAL_ITEMS_DB.filter(item => {
        const nameLower = boxName.toLowerCase();
        const itemLower = item.name.toLowerCase();
        const brandLower = item.brand?.toLowerCase() || '';
        const catLower = item.category.toLowerCase();

        if (nameLower.includes('apple') || nameLower.includes('iphone')) return item.brand === 'Apple';
        if (nameLower.includes('gaming') || nameLower.includes('pc')) return item.category === 'GAMING' || item.category === 'TECH';
        if (nameLower.includes('sneaker') || nameLower.includes('kicks') || nameLower.includes('jordan') || nameLower.includes('yeezy')) return item.category === 'CLOTHING';
        if (nameLower.includes('luxury') || nameLower.includes('watch') || nameLower.includes('gucci') || nameLower.includes('louis')) return item.category === 'LUXURY';
        if (nameLower.includes('car') || nameLower.includes('ferrari') || nameLower.includes('lambo')) return item.category === 'CARS';
        if (nameLower.includes('crypto') || nameLower.includes('bitcoin')) return item.category === 'CRYPTO';

        return true; // Default to all if no specific match
    });

    // Fallback if no relevant items found
    if (relevantItems.length < 5) relevantItems = REAL_ITEMS_DB;

    // 2. Categorize items by value relative to box price
    const lossItems = relevantItems.filter(i => i.value < boxPrice * 0.5);
    const breakEvenItems = relevantItems.filter(i => i.value >= boxPrice * 0.5 && i.value <= boxPrice * 1.5);
    const profitItems = relevantItems.filter(i => i.value > boxPrice * 1.5 && i.value <= boxPrice * 10);
    const jackpotItems = relevantItems.filter(i => i.value > boxPrice * 10);

    // Helper to get random item from array
    const getRandom = (arr: RealItem[]) => arr[Math.floor(Math.random() * arr.length)];

    // 3. Construct the loot table
    // Check for specific odds in box name (e.g., "1% iPhone", "50-50")
    const percentMatch = boxName.match(/(\d+)%/);
    const targetOdds = percentMatch ? parseFloat(percentMatch[1]) : 0.1; // Default jackpot odds 0.1%

    // Identify the "Target" item (usually the highest value one matching the box theme)
    // For "1% iPhone", we want an iPhone as the jackpot/target.
    let targetItem = jackpotItems[0] || profitItems[0] || relevantItems.sort((a, b) => b.value - a.value)[0];

    // If box name mentions a specific item type, try to find it
    if (boxName.toLowerCase().includes('iphone')) {
        targetItem = REAL_ITEMS_DB.find(i => i.name.includes('iPhone 15 Pro Max')) || targetItem;
    }

    // Calculate remaining odds
    const remainingOdds = 100 - targetOdds;

    // Distribute remaining odds: mostly loss, some break even
    const lossOdds = remainingOdds * 0.8; // 80% of remainder
    const breakOdds = remainingOdds * 0.15; // 15% of remainder
    const profitOdds = remainingOdds * 0.05; // 5% of remainder

    // Ensure we have at least one of each if possible, otherwise fallback
    const lossItem = getRandom(lossItems) || { name: 'Consolation Sticker', value: boxPrice * 0.1, category: 'OTHER' };
    const breakEvenItem = getRandom(breakEvenItems) || { name: 'Mystery Gift', value: boxPrice * 0.9, category: 'OTHER' };
    const profitItem = getRandom(profitItems) || { name: 'Bonus Prize', value: boxPrice * 2.5, category: 'OTHER' };

    // Add items with calculated odds
    items.push({
        id: `${boxName}_loss`,
        name: lossItem.name,
        value: lossItem.value,
        rarity: Rarity.COMMON,
        odds: Number(lossOdds.toFixed(2)),
        image: `https://ui-avatars.com/api/?name=${lossItem.name.replace(/ /g, '+')}&background=random`
    });

    items.push({
        id: `${boxName}_break`,
        name: breakEvenItem.name,
        value: breakEvenItem.value,
        rarity: Rarity.UNCOMMON,
        odds: Number(breakOdds.toFixed(2)),
        image: `https://ui-avatars.com/api/?name=${breakEvenItem.name.replace(/ /g, '+')}&background=random`
    });

    items.push({
        id: `${boxName}_profit`,
        name: profitItem.name,
        value: profitItem.value,
        rarity: Rarity.RARE,
        odds: Number(profitOdds.toFixed(2)),
        image: `https://ui-avatars.com/api/?name=${profitItem.name.replace(/ /g, '+')}&background=random`
    });

    items.push({
        id: `${boxName}_target`,
        name: targetItem.name,
        value: targetItem.value,
        rarity: Rarity.LEGENDARY,
        odds: Number(targetOdds.toFixed(2)),
        image: `https://ui-avatars.com/api/?name=${targetItem.name.replace(/ /g, '+')}&background=random`
    });

    return items;
};
