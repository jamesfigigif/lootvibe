import { User, LootItem, ShippingAddress, Shipment } from '../types';
import { supabase } from './supabaseClient';
import { addTransaction } from './walletService';

const SHIPPING_FEE = 15;

export const validateAddress = (address: ShippingAddress): boolean => {
    return (
        address.fullName.length > 0 &&
        address.streetAddress.length > 0 &&
        address.city.length > 0 &&
        address.state.length > 0 &&
        address.zipCode.length > 0 &&
        address.country.length > 0
    );
};

export const createShipment = async (userId: string, items: LootItem[], address: ShippingAddress): Promise<Shipment> => {
    if (!validateAddress(address)) {
        throw new Error("Invalid shipping address");
    }

    // Check user balance for shipping fee
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

    if (userError) throw userError;
    
    const currentBalance = parseFloat(userData.balance);
    if (currentBalance < SHIPPING_FEE) {
        throw new Error(`Insufficient balance. Shipping fee is $${SHIPPING_FEE}.`);
    }

    // Deduct shipping fee from user balance
    await addTransaction(
        userId,
        'SHIPPING',
        SHIPPING_FEE,
        `Shipping fee for ${items.length} item(s)`
    );

    const newShipment: Shipment = {
        id: `ship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        items: items,
        address: address,
        status: 'PENDING',
        createdAt: Date.now(),
    };

    // Insert shipment into database
    const { error: shipmentError } = await supabase
        .from('shipments')
        .insert({
            id: newShipment.id,
            user_id: userId,
            items: newShipment.items,
            address: newShipment.address,
            status: newShipment.status,
            created_at: newShipment.createdAt,
        });

    if (shipmentError) throw shipmentError;

    // Mark items as PROCESSING instead of deleting them
    // Find inventory items by matching item_data->>'id' with the item IDs
    const itemIds = items.map(i => i.id);
    
    // Get all inventory items for this user
    const { data: inventoryItems, error: fetchError } = await supabase
        .from('inventory_items')
        .select('id, item_data, shipping_status')
        .eq('user_id', userId);

    if (fetchError) throw fetchError;

    // Find matching inventory items by comparing item_data.id and ensure they're not already processing
    const itemsToUpdate = inventoryItems?.filter(invItem => {
        const itemData = invItem.item_data as LootItem;
        return itemIds.includes(itemData.id) && !invItem.shipping_status;
    }) || [];

    if (itemsToUpdate.length !== items.length) {
        throw new Error('Some items are already being processed or not found in inventory.');
    }

    // Update each matching inventory item to PROCESSING status
    for (const invItem of itemsToUpdate) {
        const { error: updateError } = await supabase
            .from('inventory_items')
            .update({ shipping_status: 'PROCESSING' })
            .eq('id', invItem.id)
            .eq('user_id', userId);

        if (updateError) {
            console.error('Error updating inventory item status:', updateError);
            throw updateError;
        }
    }

    return newShipment;
};

export const getShipments = async (userId: string): Promise<Shipment[]> => {
    const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(s => ({
        id: s.id,
        items: s.items,
        address: s.address,
        status: s.status,
        trackingNumber: s.tracking_number,
        createdAt: s.created_at,
    }));
};
