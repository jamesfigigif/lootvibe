import { supabase } from './supabaseClient';

export interface Notification {
    id: string;
    user_id: string;
    type: 'INVENTORY_ADDED' | 'ITEM_SHIPPED' | 'DEPOSIT_CONFIRMED' | 'WITHDRAWAL_APPROVED' | 'BATTLE_WON' | 'GENERAL';
    title: string;
    message: string;
    data?: {
        item_id?: string;
        item_name?: string;
        item_image?: string;
        item_value?: number;
        box_id?: string;
        box_name?: string;
        [key: string]: any;
    };
    read: boolean;
    created_at: string;
}

/**
 * Fetch all notifications for a user, ordered by most recent first
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50); // Limit to 50 most recent notifications

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', userId); // Security check: ensure user owns the notification

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', userId); // Security check

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
}

/**
 * Create a notification for a user
 */
export async function createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: Notification['data']
): Promise<boolean> {
    try {
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error } = await supabase
            .from('notifications')
            .insert({
                id: notificationId,
                user_id: userId,
                type,
                title,
                message,
                data: data || null,
                read: false,
                created_at: new Date().toISOString()
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
}

/**
 * Delete all read notifications for a user
 */
export async function deleteAllReadNotifications(userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId)
            .eq('read', true);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting read notifications:', error);
        return false;
    }
}

