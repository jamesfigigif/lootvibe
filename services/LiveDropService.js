// LiveDropService.js
// Generates mock live drop entries for the sidebar feed.
// Uses a static list of fake usernames and loot items.

const faker = require('faker'); // lightweight faker for random names

const mockUsers = [
    'CryptoWhale',
    'LuckyLuke',
    'PixelArt',
    'GamerGirl99',
    'SatoshiFan',
    'NoScope',
    'HypeBeast',
    'SpeedyGonz',
    'BudgetKing',
    'MillionaireBox'
];

const mockItems = [
    { name: 'Rolex Submariner Date', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=300&q=80', box: 'Luxury Box' },
    { name: 'Steam Key: Indie', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=300&q=80', box: 'Budget Box' },
    { name: 'Yeezy Slide "Onyx"', image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=300&q=80', box: 'Hypebeast Box' },
    { name: 'Logitech G Pro X', image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=300&q=80', box: 'Dream Setup' },
    { name: 'Satoshi Stack ($10)', image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=300&q=80', box: 'Satoshi Stash' },
    { name: 'Discord Nitro', image: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=300&q=80', box: 'Budget King' },
    { name: 'Supreme Hanes Socks', image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=300&q=80', box: 'Hypebeast Box' },
    { name: 'Travis Scott x Jordan', image: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=300&q=80', box: 'Hypebeast Box' }
];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomValue(itemName) {
    // Rough value estimation based on item name keywords
    if (itemName.includes('Rolex') || itemName.includes('Travis')) return Math.floor(Math.random() * 15000) + 5000;
    if (itemName.includes('Discord')) return Math.floor(Math.random() * 200) + 100;
    if (itemName.includes('Steam') || itemName.includes('Satoshi')) return Math.floor(Math.random() * 150) + 25;
    if (itemName.includes('Yeezy') || itemName.includes('Supreme')) return Math.floor(Math.random() * 300) + 50;
    return Math.floor(Math.random() * 200) + 20;
}

function createLiveDrop() {
    const user = getRandomElement(mockUsers);
    const item = getRandomElement(mockItems);
    const value = generateRandomValue(item.name);
    return {
        id: `live_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        user_name: user,
        item_name: item.name,
        item_image: item.image,
        box_name: item.box,
        value,
        created_at: new Date().toISOString()
    };
}

module.exports = {
    generateRandomDrop: createLiveDrop
};
