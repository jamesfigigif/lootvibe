import { Order, LootItem, LootBox } from '../types';
import { addTransaction } from './walletService';

let orders: Order[] = [];

import { supabase } from './supabaseClient';

export const createOrder = async (userId: string, box: LootBox, items: LootItem[], userName?: string, userAvatar?: string): Promise<Order> => {
    // 1. Deduct funds
    await addTransaction(userId, 'PURCHASE', box.price, `Opened box: ${box.name}`);

    // 2. Create Order
    const order: Order = {
        id: Math.random().toString(36).substring(7),
        userId: userId,
        boxId: box.id,
        items: items,
        totalPrice: box.price,
        timestamp: Date.now(),
    };

    orders.unshift(order);

    // 3. Track Affiliate Commission
    try {
        // Import dynamically to avoid circular dependencies
        const { trackWager } = await import('./affiliateService');
        await trackWager(userId, box.price);
    } catch (e) {
        console.error('Failed to track affiliate wager:', e);
    }

    // 4. Add to Live Drops (Realtime)
    if (userName && items.length > 0) {
        // Find the most valuable item to show
        const bestItem = items.reduce((prev, current) => (prev.value > current.value) ? prev : current);

        try {
            await supabase.from('live_drops').insert({
                user_name: userName,
                item_name: bestItem.name,
                item_image: bestItem.image,
                box_name: box.name,
                value: bestItem.value
            });
        } catch (e) {
            console.error('Failed to add live drop:', e);
        }
    }

    return order;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
    return orders.filter(o => o.userId === userId);
};
