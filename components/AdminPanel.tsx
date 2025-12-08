import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../services/supabaseClient';
import { ArrowLeft, Users, DollarSign, Package, TrendingUp, Shield, Settings, FileText, LogOut, Search, Ban, CheckCircle, XCircle, Eye, Edit, AlertTriangle, Box, Plus, Trash2, BarChart3, Video, Save, X, ChevronDown, ChevronUp, Calculator, Wand2 } from 'lucide-react';
import { StreamerManagement } from './StreamerManagement';

export const AdminPanel: React.FC = () => {
    const { user: clerkUser, isLoaded } = useUser();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'streamers' | 'deposits' | 'shipments' | 'withdrawals' | 'transactions' | 'boxes' | 'settings'>('dashboard');

    // Data states
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [deposits, setDeposits] = useState<any[]>([]);
    const [shipments, setShipments] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [boxes, setBoxes] = useState<any[]>([]);

    // Settings states
    const [autoWithdrawEnabled, setAutoWithdrawEnabled] = useState(false);
    const [autoWithdrawLimit, setAutoWithdrawLimit] = useState(100);
    const [savingSettings, setSavingSettings] = useState(false);

    // Item management states
    const [selectedBox, setSelectedBox] = useState<any>(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemValue, setNewItemValue] = useState('');
    const [newItemOdds, setNewItemOdds] = useState('');
    const [savingItem, setSavingItem] = useState(false);

    // User balance editing state
    const [editingUserBalance, setEditingUserBalance] = useState<{ [key: string]: string }>({});

    // Improved Box Management States
    const [expandedBoxes, setExpandedBoxes] = useState<{ [key: string]: boolean }>({});
    const [addItemMode, setAddItemMode] = useState<'new' | 'existing'>('existing');
    const [existingItems, setExistingItems] = useState<any[]>([]);
    const [selectedExistingItem, setSelectedExistingItem] = useState<string>('');

    useEffect(() => {
        checkAdminStatus();
    }, [isLoaded, clerkUser]);

    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [isAdmin, activeTab]);

    const checkAdminStatus = async () => {
        if (!isLoaded) return;

        if (!clerkUser) {
            setLoading(false);
            return;
        }

        try {
            // Check if user has admin role in public.users table
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', clerkUser.id)
                .single();

            if (error) {
                console.error('Error checking admin status:', error);
                // If column doesn't exist, this will error. We'll handle that.
                if (error.message?.includes('column "role" does not exist')) {
                    setError('Database schema out of date. Please run the admin migration.');
                }
                setLoading(false);
                return;
            }

            if (data?.role === 'admin') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } catch (err) {
            console.error('Admin check error:', err);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            setError(null);

            switch (activeTab) {
                case 'dashboard':
                    await fetchDashboardStats();
                    break;
                case 'users':
                    const { data: usersData, error: usersError } = await supabase
                        .from('users')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(50);
                    if (usersError) throw usersError;
                    setUsers(usersData || []);
                    break;
                case 'deposits':
                    // Fetch both transaction deposits and crypto deposits
                    const [
                        { data: txDepositsData, error: depositsError },
                        { data: cryptoDepositsData, error: cryptoError }
                    ] = await Promise.all([
                        supabase
                            .from('transactions')
                            .select('*, users(username)')
                            .eq('type', 'DEPOSIT')
                            .order('created_at', { ascending: false })
                            .limit(50),
                        supabase
                            .from('crypto_deposits')
                            .select('*, users(username)')
                            .order('created_at', { ascending: false })
                            .limit(50)
                    ]);

                    if (depositsError) console.error('Transaction deposits error:', depositsError);
                    if (cryptoError) console.error('Crypto deposits error:', cryptoError);

                    // Combine both types of deposits
                    const allDeposits = [
                        ...(txDepositsData || []),
                        ...(cryptoDepositsData || []).map((cd: any) => ({
                            id: cd.id,
                            user_id: cd.user_id,
                            users: cd.users || { username: 'Unknown' },
                            amount: cd.usd_value || cd.amount,
                            type: `DEPOSIT (${cd.currency})`,
                            created_at: cd.created_at,
                            status: cd.status,
                            tx_hash: cd.tx_hash
                        }))
                    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                    setDeposits(allDeposits);
                    break;
                case 'shipments':
                    const { data: shipmentsData, error: shipmentsError } = await supabase
                        .from('shipments')
                        .select('*, users(username)')
                        .order('created_at', { ascending: false })
                        .limit(50);
                    if (shipmentsError) throw shipmentsError;
                    setShipments(shipmentsData || []);
                    break;
                case 'withdrawals':
                    const { data: withdrawalsData, error: withdrawalsError } = await supabase
                        .from('transactions')
                        .select('*, users(username)')
                        .eq('type', 'WITHDRAWAL')
                        .order('created_at', { ascending: false })
                        .limit(50);
                    if (withdrawalsError) throw withdrawalsError;
                    setWithdrawals(withdrawalsData || []);
                    break;
                case 'transactions':
                    const { data: txData, error: txError } = await supabase
                        .from('transactions')
                        .select('*, users(username)')
                        .order('created_at', { ascending: false })
                        .limit(50);
                    if (txError) throw txError;
                    setTransactions(txData || []);
                    break;
                case 'boxes':
                    await fetchBoxesAnalytics();
                    break;
                case 'settings':
                    // Fetch current settings from backend
                    const settingsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/admin/settings`);
                    if (settingsResponse.ok) {
                        const settingsData = await settingsResponse.json();
                        setAutoWithdrawEnabled(settingsData.settings?.auto_approve_withdrawals || false);
                        setAutoWithdrawLimit(parseFloat(settingsData.settings?.manual_approval_threshold) || 100);
                    }
                    break;
            }
        } catch (err: any) {
            console.error('Fetch data error:', err);
            setError(err.message || 'Failed to fetch data');
        }
    };

    const fetchDashboardStats = async () => {
        // Parallelize these queries for speed
        const [
            { count: userCount },
            { count: boxCount },
            { count: battleCount },
            { data: revenueData }
        ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('boxes').select('*', { count: 'exact', head: true }),
            supabase.from('battles').select('*', { count: 'exact', head: true }),
            supabase.from('transactions').select('amount').eq('type', 'DEPOSIT')
        ]);

        const totalRevenue = revenueData?.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0) || 0;

        setStats({
            users: { total: userCount || 0 },
            boxes: { total: boxCount || 0 },
            battles: { total: battleCount || 0 },
            revenue: { allTime: totalRevenue }
        });
    };

    const saveSettings = async () => {
        try {
            setSavingSettings(true);
            setError(null);

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/admin/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    settings: {
                        auto_approve_withdrawals: autoWithdrawEnabled,
                        manual_approval_threshold: autoWithdrawLimit
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save settings');
            }

            // Show success message (you can add a toast/notification here)
            console.log('Settings saved successfully');

        } catch (err: any) {
            console.error('Save settings error:', err);
            setError(err.message || 'Failed to save settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleUpdateOdds = async (box: any, itemIndex: number, newOdds: string) => {
        const odds = parseFloat(newOdds);
        if (isNaN(odds) || odds < 0) return;

        try {
            const updatedItems = [...box.items];
            updatedItems[itemIndex] = { ...updatedItems[itemIndex], odds: odds };

            const { error: updateError } = await supabase
                .from('boxes')
                .update({ items: updatedItems })
                .eq('id', box.id);

            if (updateError) throw updateError;

            // Optimistic update
            const updatedBoxes = boxes.map(b =>
                b.id === box.id ? { ...b, items: updatedItems } : b
            );
            setBoxes(updatedBoxes);

            console.log('✅ Odds updated successfully');
        } catch (err) {
            console.error('Failed to update odds:', err);
            alert('Failed to update odds');
        }
    };

    const prepareAddItem = (box: any) => {
        // Collect all unique items from all boxes
        const uniqueItems = new Map();
        boxes.forEach(b => {
            // Handle items whether they are string (JSON) or array
            const items = Array.isArray(b.items) ? b.items : (typeof b.items === 'string' ? JSON.parse(b.items) : []);
            items.forEach((i: any) => {
                // Key by name + image to distinguish unique items
                const key = `${i.name}-${i.image}`;
                if (!uniqueItems.has(key)) {
                    uniqueItems.set(key, i);
                }
            });
        });

        // Filter out items already in this box
        const currentBoxItemNames = new Set(box.items.map((i: any) => i.name));
        const availableItems = Array.from(uniqueItems.values()).filter((i: any) => !currentBoxItemNames.has(i.name));

        setExistingItems(availableItems);
        setSelectedBox(box);
        setAddItemMode('existing');
        setShowAddItemModal(true);
        setSelectedExistingItem('');
    };

    const handleOptimizeOdds = async (box: any) => {
        if (!confirm('This will automatically adjust ALL item odds to achieve a ~45% Profit Margin for the house. Continue?')) return;

        try {
            const boxPrice = parseFloat(box.sale_price || box.price);
            if (!boxPrice || boxPrice <= 0) {
                alert('Box must have a valid price to optimize.');
                return;
            }

            // Target EV = Box Price * (1 - House Edge)
            // Target House Edge = 0.45 (45%)
            // Target EV = Box Price * 0.55
            const targetEV = boxPrice * 0.55;

            // Calculate current EV contribution sum (Value * Odds) WITHOUT the percentage division yet
            // actually, let's look at raw weights.
            // Expected Value = Sum(Value * (Odds/100))
            // We want Sum(Value * (NewOdds/100)) = TargetEV
            // Let NewOdds = OldOdds * k
            // Sum(Value * OldOdds * k / 100) = TargetEV
            // k * Sum(Value * OldOdds / 100) = TargetEV
            // k * CurrentEV = TargetEV
            // k = TargetEV / CurrentEV

            const currentEV = box.items.reduce((sum: number, item: any) => {
                return sum + (parseFloat(item.value) * (parseFloat(item.odds) / 100));
            }, 0);

            if (currentEV === 0) {
                alert('Current odds are zero. Cannot optimize. Please set initial odds.');
                return;
            }

            const k = targetEV / currentEV;

            const updatedItems = box.items.map((item: any) => {
                let newOdds = parseFloat(item.odds) * k;
                // Cap max odds at 100% and min at 0.00001%
                if (newOdds > 100) newOdds = 100;
                if (newOdds < 0.00001) newOdds = 0.00001;

                return {
                    ...item,
                    odds: newOdds
                };
            });

            // Normalize to ensure sum is <= 100% (optional, but good practice if sum > 100)
            const totalOdds = updatedItems.reduce((sum: number, item: any) => sum + item.odds, 0);
            if (totalOdds > 100) {
                // Rescale down to 100
                updatedItems.forEach((item: any) => {
                    item.odds = (item.odds / totalOdds) * 100;
                });
            }

            const { error: updateError } = await supabase
                .from('boxes')
                .update({ items: updatedItems })
                .eq('id', box.id);

            if (updateError) throw updateError;

            // Optimistic update
            const updatedBoxes = boxes.map(b =>
                b.id === box.id ? { ...b, items: updatedItems } : b
            );
            await fetchBoxesAnalytics(); // Re-fetch to get fresh analytics

            console.log('✅ Odds optimized for 45% House Edge');
            alert(`Odds updated! New Estimated Profit Margin: ~${(100 - (targetEV / boxPrice) * 100).toFixed(2)}%`);

        } catch (err) {
            console.error('Failed to optimize odds:', err);
            alert('Failed to optimize odds');
        }
    };

    const handleAddItem = async () => {
        if (!selectedBox) return;

        try {
            setSavingItem(true);
            setError(null);

            let newItem;

            if (addItemMode === 'existing') {
                if (!selectedExistingItem) {
                    setError('Please select an item');
                    setSavingItem(false);
                    return;
                }
                const existing = existingItems.find(i => i.id === selectedExistingItem);
                if (!existing) return;

                // Create a clone of the existing item with a new unique ID for this box instance
                newItem = {
                    ...existing,
                    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    odds: 0 // Default odds to 0, user must set them
                };
            } else {
                if (!newItemName || !newItemValue || !newItemOdds) {
                    setError('Please fill in all fields');
                    setSavingItem(false);
                    return;
                }

                newItem = {
                    id: `item_${Date.now()}`,
                    name: newItemName,
                    value: parseFloat(newItemValue),
                    odds: parseFloat(newItemOdds),
                    image: 'https://via.placeholder.com/150?text=' + encodeURIComponent(newItemName),
                    rarity: parseFloat(newItemValue) >= 1000 ? 'LEGENDARY' : parseFloat(newItemValue) >= 500 ? 'EPIC' : parseFloat(newItemValue) >= 100 ? 'RARE' : parseFloat(newItemValue) >= 50 ? 'UNCOMMON' : 'COMMON'
                };
            }

            // Add item to box's items array
            const updatedItems = [...selectedBox.items, newItem];

            // Update box in database
            const { error: updateError } = await supabase
                .from('boxes')
                .update({ items: updatedItems })
                .eq('id', selectedBox.id);

            if (updateError) throw updateError;

            // Refresh boxes data
            await fetchBoxesAnalytics();

            // Reset form and close modal
            setNewItemName('');
            setNewItemValue('');
            setNewItemOdds('');
            setShowAddItemModal(false);
            setSelectedBox(null);

            console.log('✅ Item added successfully');
        } catch (err: any) {
            console.error('Add item error:', err);
            setError(err.message || 'Failed to add item');
        } finally {
            setSavingItem(false);
        }
    };

    const handleDeleteItem = async (box: any, itemIndex: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            setError(null);

            // Remove item from box's items array
            const updatedItems = box.items.filter((_: any, idx: number) => idx !== itemIndex);

            // Update box in database
            const { error: updateError } = await supabase
                .from('boxes')
                .update({ items: updatedItems })
                .eq('id', box.id);

            if (updateError) throw updateError;

            // Refresh boxes data
            await fetchBoxesAnalytics();

            console.log('✅ Item deleted successfully');
        } catch (err: any) {
            console.error('Delete item error:', err);
            setError(err.message || 'Failed to delete item');
        }
    };

    const handleUpdateUserBalance = async (userId: string, newBalance: string) => {
        const balance = parseFloat(newBalance);
        if (isNaN(balance) || balance < 0) {
            alert('Invalid balance');
            return;
        }

        try {
            const { error } = await supabase
                .from('users')
                .update({ balance })
                .eq('id', userId);

            if (error) throw error;

            alert('Balance updated successfully!');
            setEditingUserBalance(prev => {
                const newState = { ...prev };
                delete newState[userId];
                return newState;
            });

            // Refresh users data
            const { data: usersData } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (usersData) setUsers(usersData);

        } catch (err: any) {
            console.error('Update balance error:', err);
            alert(`Failed to update balance: ${err.message}`);
        }
    };

    const fetchBoxesAnalytics = async () => {
        // Fetch all boxes with their items
        const { data: boxesData, error: boxesError } = await supabase
            .from('boxes')
            .select('*')
            .order('created_at', { ascending: false });

        if (boxesError) throw boxesError;

        // Fetch box openings for analytics
        const { data: openings, error: openingsError } = await supabase
            .from('box_openings')
            .select('box_id, item_won');

        if (openingsError) throw openingsError;

        // Calculate analytics for each box
        const boxesWithAnalytics = boxesData?.map(box => {
            const boxOpenings = openings?.filter(o => o.box_id === box.id) || [];
            const totalOpens = boxOpenings.length;

            // Parse items
            const items = typeof box.items === 'string' ? JSON.parse(box.items) : box.items;

            // Calculate total value of items won
            const totalValueWon = boxOpenings.reduce((sum, opening) => {
                const item = items.find((i: any) => i.name === opening.item_won);
                return sum + (item ? parseFloat(item.value) : 0);
            }, 0);

            // Calculate revenue (box price * opens) - payouts
            const boxPrice = parseFloat(box.sale_price || box.price) || 0;
            const revenue = (boxPrice * totalOpens) - totalValueWon;
            const houseEdge = (totalOpens > 0 && boxPrice > 0) ? ((revenue / (boxPrice * totalOpens)) * 100) : 0;

            // Calculate expected value
            const expectedValue = items.reduce((sum: number, item: any) => {
                const itemValue = parseFloat(item.value) || 0;
                const itemOdds = parseFloat(item.odds) || 0;
                return sum + (itemValue * (itemOdds / 100));
            }, 0);

            const theoreticalHouseEdge = (boxPrice > 0) ? ((boxPrice - expectedValue) / boxPrice) * 100 : 0;

            return {
                ...box,
                items,
                analytics: {
                    totalOpens,
                    totalValueWon,
                    revenue,
                    houseEdge,
                    theoreticalHouseEdge,
                    expectedValue
                }
            };
        }) || [];

        setBoxes(boxesWithAnalytics);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0f19] text-white p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Verifying admin privileges...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#0b0f19] text-white p-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-[#131b2e] rounded-2xl border border-white/5 p-8 text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
                    <p className="text-slate-400 mb-6">You do not have permission to view this area.</p>

                    {error && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6 text-left">
                            <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1">
                                <AlertTriangle className="w-4 h-4" />
                                <span>System Notice</span>
                            </div>
                            <p className="text-yellow-200/80 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="text-xs text-slate-500 mb-4">
                        User ID: {clerkUser?.id}
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-white text-black font-bold py-2 px-6 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0f19] text-white">
            {/* Header */}
            <div className="bg-[#131b2e] border-b border-white/5 p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <Shield className="w-6 h-6 text-purple-500" />
                            Admin Panel
                        </h1>
                        <p className="text-slate-400 text-sm">Logged in as {clerkUser?.fullName || clerkUser?.username}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'streamers', label: 'Streamers', icon: Video },
                        { id: 'boxes', label: 'Boxes', icon: Box },
                        { id: 'deposits', label: 'Deposits', icon: DollarSign },
                        { id: 'shipments', label: 'Shipments', icon: Package },
                        { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
                        { id: 'transactions', label: 'Transactions', icon: FileText },
                        { id: 'settings', label: 'Settings', icon: Settings },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-purple-600 text-white'
                                : 'bg-[#131b2e] text-slate-400 hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-[#131b2e] rounded-xl border border-white/5 p-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400">
                            {error}
                        </div>
                    )}

                    {activeTab === 'dashboard' && stats && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold">Dashboard Overview</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                    <p className="text-xs text-slate-400 mb-1">Total Users</p>
                                    <p className="text-2xl font-bold">{stats.users?.total || 0}</p>
                                </div>
                                <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                    <p className="text-xs text-slate-400 mb-1">Total Revenue</p>
                                    <p className="text-2xl font-bold text-green-400">${(stats.revenue?.allTime || 0).toFixed(2)}</p>
                                </div>
                                <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                    <p className="text-xs text-slate-400 mb-1">Total Boxes</p>
                                    <p className="text-2xl font-bold">{stats.boxes?.total || 0}</p>
                                </div>
                                <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                    <p className="text-xs text-slate-400 mb-1">Total Battles</p>
                                    <p className="text-2xl font-bold">{stats.battles?.total || 0}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">Recent Users</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-3 text-slate-400">ID</th>
                                            <th className="text-left p-3 text-slate-400">Username</th>
                                            <th className="text-left p-3 text-slate-400">Email</th>
                                            <th className="text-left p-3 text-slate-400">Balance</th>
                                            <th className="text-left p-3 text-slate-400">Role</th>
                                            <th className="text-left p-3 text-slate-400 hidden md:table-cell">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="p-3 font-mono text-xs">{user.id.substring(0, 8)}...</td>
                                                <td className="p-3">{user.username}</td>
                                                <td className="p-3 text-sm text-slate-400">{user.email || '—'}</td>
                                                <td className="p-3">
                                                    {editingUserBalance[user.id] !== undefined ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={editingUserBalance[user.id]}
                                                                onChange={(e) => setEditingUserBalance({ ...editingUserBalance, [user.id]: e.target.value })}
                                                                className="w-24 bg-[#1a2332] border border-white/10 rounded px-2 py-1 text-white text-sm"
                                                                step="0.01"
                                                            />
                                                            <button
                                                                onClick={() => handleUpdateUserBalance(user.id, editingUserBalance[user.id])}
                                                                className="text-emerald-400 hover:text-emerald-300 transition-colors"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingUserBalance(prev => {
                                                                    const newState = { ...prev };
                                                                    delete newState[user.id];
                                                                    return newState;
                                                                })}
                                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-emerald-400 font-mono">${parseFloat(user.balance || 0).toFixed(2)}</span>
                                                            <button
                                                                onClick={() => setEditingUserBalance({ ...editingUserBalance, [user.id]: user.balance.toString() })}
                                                                className="text-slate-400 hover:text-white transition-colors"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700/50 text-slate-400'}`}>
                                                        {user.role || 'user'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-400 text-sm hidden md:table-cell">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'streamers' && clerkUser && (
                        <StreamerManagement adminUser={{ id: clerkUser.id }} />
                    )}

                    {/* Deposits tab with crypto transaction details */}
                    {activeTab === 'deposits' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">Deposits</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-3 text-slate-400">ID</th>
                                            <th className="text-left p-3 text-slate-400">User</th>
                                            <th className="text-left p-3 text-slate-400">Amount</th>
                                            <th className="text-left p-3 text-slate-400">Type</th>
                                            <th className="text-left p-3 text-slate-400">Status</th>
                                            <th className="text-left p-3 text-slate-400">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deposits.map((item) => (
                                            <tr key={item.id} className="border-b border-white/5">
                                                <td className="p-3 font-mono text-xs">
                                                    {item.id.substring(0, 8)}...
                                                    {item.tx_hash && (
                                                        <div className="text-xs text-slate-500 mt-1">
                                                            TX: {item.tx_hash.substring(0, 10)}...
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3 text-sm">{item.users?.username || item.user_id.substring(0, 8)}</td>
                                                <td className="p-3 font-bold">${parseFloat(item.amount || 0).toFixed(2)}</td>
                                                <td className="p-3 text-sm text-slate-400">{item.type}</td>
                                                <td className="p-3">
                                                    {item.status && (
                                                        <span className={`px-2 py-1 rounded text-xs ${item.status === 'CREDITED' ? 'bg-green-500/20 text-green-400' :
                                                            item.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                item.status === 'CONFIRMING' ? 'bg-blue-500/20 text-blue-400' :
                                                                    'bg-slate-500/20 text-slate-400'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-slate-400 text-sm">
                                                    {new Date(item.created_at || item.timestamp).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Other tabs can be implemented similarly using the fetched data */}
                    {(activeTab === 'withdrawals' || activeTab === 'transactions') && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-3 text-slate-400">ID</th>
                                            <th className="text-left p-3 text-slate-400">User</th>
                                            <th className="text-left p-3 text-slate-400">Amount</th>
                                            <th className="text-left p-3 text-slate-400">Type</th>
                                            <th className="text-left p-3 text-slate-400">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(activeTab === 'withdrawals' ? withdrawals : transactions).map((item) => (
                                            <tr key={item.id} className="border-b border-white/5">
                                                <td className="p-3 font-mono text-xs">{item.id.substring(0, 8)}...</td>
                                                <td className="p-3 text-sm">{item.users?.username || item.user_id.substring(0, 8)}</td>
                                                <td className="p-3 font-bold">${parseFloat(item.amount || 0).toFixed(2)}</td>
                                                <td className="p-3 text-sm text-slate-400">{item.type}</td>
                                                <td className="p-3 text-slate-400 text-sm">
                                                    {new Date(item.created_at || item.timestamp).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'boxes' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Boxes Analytics</h2>
                                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                    <Plus className="w-4 h-4" />
                                    Add New Box
                                </button>
                            </div>

                            {boxes.map((box) => (
                                <div key={box.id} className="bg-[#0b0f19] rounded-lg border border-white/5 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            {box.image_url ? (
                                                <img src={box.image_url} alt={box.name} loading="lazy" className="w-20 h-20 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-20 h-20 rounded-lg bg-[#131b2e] flex items-center justify-center border border-white/10">
                                                    <Box className="w-8 h-8 text-slate-600" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="text-lg font-bold">{box.name}</h3>
                                                <p className="text-slate-400 text-sm">{box.description}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-purple-400 font-bold">${parseFloat(box.sale_price || box.price).toFixed(2)}</span>
                                                    <span className="text-xs text-slate-500">ID: {box.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Analytics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        <div className="bg-[#131b2e] rounded-lg p-3">
                                            <p className="text-xs text-slate-400 mb-1">Total Opens</p>
                                            <p className="text-lg font-bold">{box.analytics.totalOpens}</p>
                                        </div>
                                        <div className="bg-[#131b2e] rounded-lg p-3">
                                            <p className="text-xs text-slate-400 mb-1">Revenue</p>
                                            <p className="text-lg font-bold text-green-400">${box.analytics.revenue.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-[#131b2e] rounded-lg p-3">
                                            <p className="text-xs text-slate-400 mb-1">Profit Margin</p>
                                            <p className="text-lg font-bold text-blue-400">{box.analytics.theoreticalHouseEdge.toFixed(2)}%</p>
                                        </div>
                                        <div className="bg-[#131b2e] rounded-lg p-3">
                                            <p className="text-xs text-slate-400 mb-1">Avg Return</p>
                                            <p className="text-lg font-bold text-yellow-400">${box.analytics.expectedValue.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <button
                                                onClick={() => setExpandedBoxes(prev => ({ ...prev, [box.id]: !prev[box.id] }))}
                                                className="font-bold flex items-center gap-2 hover:text-white transition-colors"
                                            >
                                                <BarChart3 className="w-4 h-4" />
                                                Items ({box.items.length})
                                                {expandedBoxes[box.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleOptimizeOdds(box)}
                                                className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center gap-1 bg-yellow-500/10 px-3 py-1.5 rounded-lg hover:bg-yellow-500/20 transition-colors mr-2"
                                                title="Auto-adjust odds for 45% Profit Margin"
                                            >
                                                <Wand2 className="w-4 h-4" />
                                                Auto-Profit (45%)
                                            </button>
                                            <button
                                                onClick={() => prepareAddItem(box)}
                                                className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 bg-purple-500/10 px-3 py-1.5 rounded-lg hover:bg-purple-500/20 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Item
                                            </button>
                                        </div>

                                        {expandedBoxes[box.id] && (
                                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                {box.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="bg-[#131b2e] rounded-lg p-3 flex items-center justify-between group hover:border-white/10 border border-transparent transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative w-12 h-12">
                                                                <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full rounded object-cover bg-black/20" />
                                                                <div className={`absolute inset-0 rounded ring-1 ring-inset ${item.rarity === 'LEGENDARY' ? 'ring-yellow-500/50' :
                                                                    item.rarity === 'EPIC' ? 'ring-purple-500/50' :
                                                                        item.rarity === 'RARE' ? 'ring-blue-500/50' :
                                                                            'ring-slate-500/20'
                                                                    }`}></div>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{item.name}</p>
                                                                <div className="flex items-center gap-3 text-xs mt-1">
                                                                    <span className="text-green-400 font-mono">${parseFloat(item.value).toFixed(2)}</span>
                                                                    <div className="flex items-center gap-1 bg-[#0b0f19] px-2 py-0.5 rounded border border-white/5">
                                                                        <span className="text-slate-400">Odds:</span>
                                                                        <input
                                                                            type="number"
                                                                            defaultValue={item.odds}
                                                                            className="bg-transparent w-16 text-right focus:outline-none text-white font-mono font-bold"
                                                                            onBlur={(e) => handleUpdateOdds(box, idx, e.target.value)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    e.currentTarget.blur();
                                                                                }
                                                                            }}
                                                                        />
                                                                        <span className="text-slate-500">%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleDeleteItem(box, idx)}
                                                                className="text-slate-600 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {boxes.length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <Box className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>No boxes found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold">Settings</h2>

                            {/* Auto-Withdraw Settings */}
                            <div className="bg-[#0b0f19] rounded-lg border border-white/5 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <DollarSign className="w-6 h-6 text-purple-500" />
                                    <div>
                                        <h3 className="text-lg font-bold">Auto-Withdraw Settings</h3>
                                        <p className="text-sm text-slate-400">Configure automatic withdrawal approval</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-[#131b2e] rounded-lg">
                                        <div>
                                            <p className="font-medium">Enable Auto-Withdraw</p>
                                            <p className="text-sm text-slate-400">Automatically approve withdrawals under the specified limit</p>
                                        </div>
                                        <button
                                            onClick={() => setAutoWithdrawEnabled(!autoWithdrawEnabled)}
                                            className={`relative w-14 h-7 rounded-full transition-colors ${autoWithdrawEnabled ? 'bg-purple-600' : 'bg-slate-600'
                                                }`}
                                        >
                                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${autoWithdrawEnabled ? 'translate-x-7' : ''
                                                }`} />
                                        </button>
                                    </div>

                                    <div className="p-4 bg-[#131b2e] rounded-lg">
                                        <label className="block mb-2">
                                            <span className="font-medium">Auto-Withdraw Limit</span>
                                            <p className="text-sm text-slate-400 mb-3">Withdrawals over this amount require manual approval</p>
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-400">$</span>
                                            <input
                                                type="number"
                                                value={autoWithdrawLimit}
                                                onChange={(e) => setAutoWithdrawLimit(parseFloat(e.target.value) || 0)}
                                                className="flex-1 bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                                                placeholder="100.00"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            {autoWithdrawEnabled
                                                ? `Withdrawals under $${autoWithdrawLimit.toFixed(2)} will be automatically approved`
                                                : 'All withdrawals require manual approval'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={saveSettings}
                                        disabled={savingSettings}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {savingSettings ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add Item Modal */}
                {showAddItemModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-[#131b2e] rounded-2xl border border-white/10 overflow-hidden max-w-md w-full">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="text-xl font-bold">Add Item to {selectedBox?.name}</h3>
                            </div>

                            <div className="flex border-b border-white/5">
                                <button
                                    onClick={() => setAddItemMode('existing')}
                                    className={`flex-1 py-3 text-sm font-bold transition-colors ${addItemMode === 'existing'
                                        ? 'bg-purple-600/10 text-purple-400 border-b-2 border-purple-500'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    Select Existing
                                </button>
                                <button
                                    onClick={() => setAddItemMode('new')}
                                    className={`flex-1 py-3 text-sm font-bold transition-colors ${addItemMode === 'new'
                                        ? 'bg-purple-600/10 text-purple-400 border-b-2 border-purple-500'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    Create New
                                </button>
                            </div>

                            <div className="p-6">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}

                                {addItemMode === 'existing' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Select Item</label>
                                            {existingItems.length > 0 ? (
                                                <div className="relative">
                                                    <select
                                                        value={selectedExistingItem}
                                                        onChange={(e) => setSelectedExistingItem(e.target.value)}
                                                        className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white appearance-none focus:border-purple-500 focus:outline-none"
                                                    >
                                                        <option value="">-- Click to choose item --</option>
                                                        {existingItems.map((item: any) => (
                                                            <option key={item.id} value={item.id}>
                                                                {item.name} (${parseFloat(item.value).toFixed(2)})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                                </div>
                                            ) : (
                                                <div className="text-center p-4 bg-[#0b0f19] rounded-lg border border-white/5 border-dashed text-slate-400 text-sm">
                                                    No other items found available to add.
                                                </div>
                                            )}
                                        </div>
                                        {selectedExistingItem && (
                                            <div className="bg-[#0b0f19] p-3 rounded-lg flex items-center gap-3 border border-white/5">
                                                {(() => {
                                                    const item = existingItems.find(i => i.id === selectedExistingItem);
                                                    return item ? (
                                                        <>
                                                            <img src={item.image} className="w-10 h-10 rounded object-cover" />
                                                            <div>
                                                                <div className="font-bold text-sm">{item.name}</div>
                                                                <div className="text-green-400 text-xs">${item.value}</div>
                                                            </div>
                                                        </>
                                                    ) : null;
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Item Name</label>
                                            <input
                                                type="text"
                                                value={newItemName}
                                                onChange={(e) => setNewItemName(e.target.value)}
                                                placeholder="e.g., Rare Pokemon Card"
                                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Value ($)</label>
                                            <input
                                                type="number"
                                                value={newItemValue}
                                                onChange={(e) => setNewItemValue(e.target.value)}
                                                placeholder="e.g., 100.00"
                                                step="0.01"
                                                min="0"
                                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Start Odds (%)</label>
                                            <input
                                                type="number"
                                                value={newItemOdds}
                                                onChange={(e) => setNewItemOdds(e.target.value)}
                                                placeholder="e.g., 5.00"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>

                                        <p className="text-xs text-slate-400 bg-[#0b0f19] rounded-lg p-3">
                                            <strong>Note:</strong> A placeholder image will be used initially.
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={() => {
                                            setShowAddItemModal(false);
                                            setSelectedBox(null);
                                            setNewItemName('');
                                            setNewItemValue('');
                                            setNewItemOdds('');
                                            setError(null);
                                        }}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 px-4 rounded-lg font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddItem}
                                        disabled={savingItem}
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                                    >
                                        {savingItem ? 'Adding...' : 'Add Item'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
