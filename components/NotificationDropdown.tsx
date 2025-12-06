import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Package, Truck, Check, DollarSign, Trophy, Info, Trash2 } from 'lucide-react';
import { Notification, getNotifications, markNotificationAsRead, markAllAsRead, deleteNotification, getUnreadCount, deleteAllReadNotifications } from '../services/notificationService';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface NotificationDropdownProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ user, isOpen, onClose }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Define fetch functions BEFORE using them in useEffect
    const fetchNotifications = useCallback(async (showLoading = false) => {
        if (!user || !user.id) {
            return;
        }
        if (showLoading) {
            setLoading(true);
        }
        try {
            const data = await getNotifications(user.id);
            setNotifications(data);
            // Always set loading to false after fetch completes
            setLoading(false);
        } catch (error) {
            console.error('NotificationDropdown: Error fetching notifications:', error);
            // Always set loading to false even on error
            setLoading(false);
        }
    }, [user]);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const count = await getUnreadCount(user.id);
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, [user]);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (!user) {
            console.warn('NotificationDropdown: No user provided', { isOpen, user });
            return;
        }
        
        if (isOpen) {
            // Reset loading state when opening
            setLoading(true);
            
            // Initial fetch with loading indicator
            fetchNotifications(true);
            fetchUnreadCount();
            
            // Debounce function to prevent rapid refreshes (silent refresh, no loading spinner)
            let debounceTimer: NodeJS.Timeout;
            let isRefreshing = false; // Prevent multiple simultaneous refreshes
            const debouncedRefresh = () => {
                // Skip if already refreshing or if dropdown closed
                if (isRefreshing || !isOpen) return;
                
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(async () => {
                    if (!isOpen) return; // Double check dropdown is still open
                    isRefreshing = true;
                    try {
                        await fetchNotifications(false); // Silent refresh, no loading spinner
                        await fetchUnreadCount();
                    } finally {
                        isRefreshing = false;
                    }
                }, 15000); // Debounce by 15 seconds to reduce polling frequency
            };
            
            // Set up real-time subscription ONLY for new notifications (INSERT events)
            // We don't need UPDATE events since we handle read/delete optimistically
            const channel = supabase
                .channel('notifications-dropdown')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    debouncedRefresh
                )
                .subscribe();

            return () => {
                clearTimeout(debounceTimer);
                supabase.removeChannel(channel);
            };
        } else if (!isOpen) {
            // Reset loading state when closing
            setLoading(false);
        }
    }, [isOpen, user, fetchNotifications, fetchUnreadCount]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onClose]);

    const handleMarkAsRead = async (notificationId: string) => {
        if (!user) return;
        // Optimistically update UI first
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Then update in database (fire and forget, no refresh needed)
        markNotificationAsRead(notificationId, user.id).catch(error => {
            console.error('Error marking notification as read:', error);
            // Revert on error
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
            );
            setUnreadCount(prev => prev + 1);
        });
    };

    const handleMarkAllAsRead = async () => {
        if (!user || markingAllAsRead) return;
        setMarkingAllAsRead(true);
        
        // If all notifications are already read, delete them all
        if (unreadCount === 0 && notifications.length > 0) {
            // Store original state before optimistic update
            const originalNotifications = [...notifications];
            
            // Optimistically remove all notifications and ensure loading is false
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false); // Ensure loading is false when clearing
            
            // Then delete from database
            const success = await deleteAllReadNotifications(user.id);
            if (!success) {
                // Revert on error - restore previous state
                setNotifications(originalNotifications);
                setLoading(false);
            }
            setMarkingAllAsRead(false);
            return;
        }
        
        // Otherwise, mark all as read
        // Store original state before optimistic update
        const originalNotifications = [...notifications];
        const currentUnread = unreadCount;
        
        // Optimistically update UI first
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        
        // Then update in database
        const success = await markAllAsRead(user.id);
        if (!success) {
            // Revert on error - restore previous state
            setNotifications(originalNotifications);
            setUnreadCount(currentUnread);
        }
        setMarkingAllAsRead(false);
    };

    const handleDelete = async (notificationId: string) => {
        if (!user) return;
        // Optimistically update UI first
        const notification = notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.read;
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        // Then delete from database (fire and forget, no refresh needed)
        deleteNotification(notificationId, user.id).catch(error => {
            console.error('Error deleting notification:', error);
            // Revert on error
            if (notification) {
                setNotifications(prev => [...prev, notification].sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ));
                if (wasUnread) {
                    setUnreadCount(prev => prev + 1);
                }
            }
        });
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'INVENTORY_ADDED':
                return <Package className="w-5 h-5 text-purple-400" />;
            case 'ITEM_SHIPPED':
                return <Truck className="w-5 h-5 text-blue-400" />;
            case 'DEPOSIT_CONFIRMED':
                return <DollarSign className="w-5 h-5 text-emerald-400" />;
            case 'WITHDRAWAL_APPROVED':
                return <Check className="w-5 h-5 text-green-400" />;
            case 'BATTLE_WON':
                return <Trophy className="w-5 h-5 text-yellow-400" />;
            default:
                return <Info className="w-5 h-5 text-slate-400" />;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="fixed sm:absolute top-20 right-4 sm:right-0 w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-6rem)] bg-[#131b2e] border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            disabled={markingAllAsRead}
                            className="text-xs text-purple-400 hover:text-purple-300 font-medium disabled:opacity-50"
                        >
                            {markingAllAsRead 
                                ? (unreadCount === 0 ? 'Deleting...' : 'Marking...')
                                : (unreadCount === 0 ? 'Clear all' : 'Mark all read')
                            }
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">
                        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-white/5 transition-colors ${
                                    !notification.read ? 'bg-purple-500/5' : ''
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-bold mb-1 ${
                                                    !notification.read ? 'text-white' : 'text-slate-300'
                                                }`}>
                                                    {notification.title}
                                                </h4>
                                                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                {notification.data?.item_image && (
                                                    <div className="mb-2">
                                                        <img
                                                            src={notification.data.item_image}
                                                            alt={notification.data.item_name || 'Item'}
                                                            loading="lazy"
                                                            className="w-16 h-16 object-contain rounded-lg bg-[#0b0f19] border border-white/10"
                                                        />
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-slate-500">
                                                    {formatTimeAgo(notification.created_at)}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(notification.id)}
                                                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

