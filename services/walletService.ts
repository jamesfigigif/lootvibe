import { Transaction, User } from '../types';
import { supabase } from './supabaseClient';
import { generateClientSeed } from './provablyFairService';
import { createClient } from '@supabase/supabase-js';

// Get or create user
export const getUser = async (userId: string = 'user-1', clerkToken?: string, email?: string): Promise<User> => {
    try {
        // Try to fetch existing user with all related data in parallel
        const [userResult, inventoryResult, shipmentsResult] = await Promise.all([
            supabase.from('users').select('*').eq('id', userId).single(),
            supabase.from('inventory_items').select('*').eq('user_id', userId),
            supabase.from('shipments').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        ]);

        const existingUser = userResult.data;
        const fetchError = userResult.error;

        if (existingUser && !fetchError) {
            return {
                id: existingUser.id,
                username: existingUser.username,
                balance: parseFloat(existingUser.balance),
                inventory: inventoryResult.data?.map(item => ({
                    ...item.item_data,
                    shippingStatus: item.shipping_status || undefined
                })) || [],
                shipments: shipmentsResult.data?.map(s => ({
                    id: s.id,
                    items: s.items,
                    address: s.address,
                    status: s.status,
                    trackingNumber: s.tracking_number,
                    createdAt: s.created_at
                })) || [],
                avatar: existingUser.avatar,
                clientSeed: existingUser.client_seed,
                nonce: existingUser.nonce,
                serverSeedHash: existingUser.server_seed_hash,
                freeBoxClaimed: existingUser.free_box_claimed || false,
                role: existingUser.role || 'user',
            };
        }

        // Create new user if not found
        // Generate a unique username by adding timestamp to avoid conflicts
        const uniqueUsername = `User_${userId.slice(-8)}_${Date.now().toString().slice(-4)}`;

        const newUser: User = {
            id: userId,
            username: uniqueUsername,
            balance: 1000, // Starting balance
            inventory: [],
            shipments: [],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            clientSeed: generateClientSeed(),
            nonce: 0,
        };

        try {
            // Create authenticated client if we have a Clerk token
            let clientToUse = supabase;
            if (clerkToken) {
                console.log('🔑 Creating user with Clerk token');
                const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://hpflcuyxmwzrknxjgavd.supabase.co';
                const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

                clientToUse = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    global: {
                        headers: {
                            Authorization: `Bearer ${clerkToken}`
                        }
                    }
                });
            }

            const { error: insertError } = await clientToUse
                .from('users')
                .insert({
                    id: newUser.id,
                    username: newUser.username,
                    email: email || null,
                    balance: newUser.balance,
                    avatar: newUser.avatar,
                    client_seed: newUser.clientSeed,
                    nonce: newUser.nonce,
                    free_box_claimed: false,
                });

            if (insertError) {
                // Ignore duplicate key errors (race condition)
                if (insertError.code !== '23505') {
                    console.error('❌ Error creating user:', insertError);
                }
            } else {
                console.log('✅ User created successfully:', newUser.id);
            }
        } catch (dbError) {
            console.error('❌ Database error during user creation:', dbError);
        }

        return newUser;
    } catch (error) {
        console.error('Error in getUser:', error);

        // Fallback: return a default user if database is unavailable
        console.warn('⚠️  Database unavailable, using fallback user');
        return {
            id: userId,
            username: `User_${userId.slice(0, 6)}`,
            balance: 1000,
            inventory: [],
            shipments: [],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            clientSeed: generateClientSeed(),
            nonce: 0,
        };
    }
};

export const getBalance = async (userId: string = 'user-1'): Promise<number> => {
    const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return parseFloat(data.balance);
};

export const addTransaction = async (
    userId: string = 'user-1',
    type: Transaction['type'],
    amount: number,
    description: string
): Promise<Transaction> => {
    // @deprecated SECURITY WARNING: This function updates the database directly from the client.
    // For critical financial operations (like battle wins), use Supabase Edge Functions (e.g., 'battle-claim') instead.
    console.warn('⚠️ addTransaction called from client. Prefer server-side logic for security.');
    const tx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type,
        amount,
        timestamp: Date.now(),
        description,
    };

    try {
        // Insert transaction
        const { error: txError } = await supabase
            .from('transactions')
            .insert({
                id: tx.id,
                user_id: userId,
                type: tx.type,
                amount: tx.amount,
                description: tx.description,
                timestamp: tx.timestamp,
            });

        if (txError) {
            console.error('Error inserting transaction:', txError);
        }

        // Update balance
        const currentBalance = await getBalance(userId);
        let newBalance = currentBalance;

        if (type === 'DEPOSIT' || type === 'WIN') {
            newBalance = currentBalance + amount;
        } else if (type === 'WITHDRAWAL' || type === 'BET' || type === 'PURCHASE') {
            if (currentBalance < amount) {
                throw new Error('Insufficient funds');
            }
            newBalance = currentBalance - amount;
        }

        const { error: balanceError } = await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', userId);

        if (balanceError) {
            console.error('Error updating balance:', balanceError);
        }

        // Track affiliate deposit bonus
        if (type === 'DEPOSIT') {
            try {
                // Import dynamically to avoid circular dependencies
                const { trackDeposit } = await import('./affiliateService');
                await trackDeposit(userId, amount);
            } catch (e) {
                console.error('Failed to track affiliate deposit:', e);
            }
        }
    } catch (error) {
        console.warn('⚠️  Transaction not saved to database:', error);
    }

    return tx;
};

export const getTransactions = async (userId: string = 'user-1'): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

    if (error) throw error;

    return data.map(tx => ({
        id: tx.id,
        userId: tx.user_id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        timestamp: tx.timestamp,
        description: tx.description,
    }));
};

// Helper to update user state directly (for other services)
// @deprecated SECURITY WARNING: This function updates the database directly from the client.
// For critical state changes, use Supabase Edge Functions instead.
export const updateUserState = async (userId: string = 'user-1', updates: Partial<Omit<User, 'id' | 'shipments'>>) => {
    try {
        const dbUpdates: any = {};

        if (updates.username !== undefined) dbUpdates.username = updates.username;
        if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
        if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
        if (updates.clientSeed !== undefined) dbUpdates.client_seed = updates.clientSeed;
        if (updates.nonce !== undefined) dbUpdates.nonce = updates.nonce;
        if (updates.serverSeedHash !== undefined) dbUpdates.server_seed_hash = updates.serverSeedHash;

        // Update user table
        if (Object.keys(dbUpdates).length > 0) {
            const { error } = await supabase
                .from('users')
                .update(dbUpdates)
                .eq('id', userId);

            if (error) {
                console.error('Error updating user:', error);
            }
        }

        // Handle inventory updates
        if (updates.inventory !== undefined) {
            // Delete all existing inventory items
            await supabase
                .from('inventory_items')
                .delete()
                .eq('user_id', userId);

            // Insert new inventory items
            if (updates.inventory.length > 0) {
                const inventoryInserts = updates.inventory.map(item => ({
                    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    user_id: userId,
                    item_data: item,
                }));

                const { error: invError } = await supabase
                    .from('inventory_items')
                    .insert(inventoryInserts);

                if (invError) {
                    console.error('Error updating inventory:', invError);
                }
            }
        }
    } catch (error) {
        console.warn('⚠️  User state not saved to database:', error);
    }
};

// Mark user's free box as claimed
export const markFreeBoxClaimed = async (userId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ free_box_claimed: true })
            .eq('id', userId);

        if (error) {
            console.error('Error marking free box as claimed:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in markFreeBoxClaimed:', error);
        throw error;
    }
};
