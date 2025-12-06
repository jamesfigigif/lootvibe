import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Ban, Check, Star, TrendingUp, Edit, Save, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface Streamer {
    id: string;
    username: string;
    email: string;
    balance: number;
    is_streamer: boolean;
    can_withdraw: boolean;
    streamer_odds_multiplier: number;
    streamer_note: string;
    avatar: string;
}

interface StreamerManagementProps {
    adminUser: any;
}

export const StreamerManagement: React.FC<StreamerManagementProps> = ({ adminUser }) => {
    const [streamers, setStreamers] = useState<Streamer[]>([]);
    const [allUsers, setAllUsers] = useState<Streamer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingBalance, setEditingBalance] = useState<{ [key: string]: string }>({});
    const [showAddStreamer, setShowAddStreamer] = useState(false);

    const [newStreamerForm, setNewStreamerForm] = useState({
        userId: '',
        oddsMultiplier: 2.00,
        allowWithdrawals: false,
        note: ''
    });

    useEffect(() => {
        fetchStreamers();
        fetchAllUsers();
    }, []);

    const fetchStreamers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, username, email, balance, is_streamer, can_withdraw, streamer_odds_multiplier, streamer_note, avatar')
                .eq('is_streamer', true)
                .order('username');

            if (error) throw error;
            setStreamers(data || []);
        } catch (error) {
            console.error('Failed to fetch streamers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, username, email, balance, is_streamer, can_withdraw, streamer_odds_multiplier, streamer_note, avatar')
                .order('username');

            if (error) throw error;
            setAllUsers(data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleMakeStreamer = async () => {
        if (!newStreamerForm.userId) {
            alert('Please select a user');
            return;
        }

        try {
            const { data, error } = await supabase.rpc('set_user_as_streamer', {
                target_user_id: newStreamerForm.userId,
                admin_user_id: adminUser.id,
                odds_multiplier: newStreamerForm.oddsMultiplier,
                allow_withdrawals: newStreamerForm.allowWithdrawals,
                admin_note: newStreamerForm.note
            });

            if (error) throw error;

            alert('User successfully made streamer!');
            setShowAddStreamer(false);
            setNewStreamerForm({ userId: '', oddsMultiplier: 2.00, allowWithdrawals: false, note: '' });
            fetchStreamers();
            fetchAllUsers();
        } catch (error) {
            console.error('Failed to make streamer:', error);
            alert(`Failed to make streamer: ${error.message}`);
        }
    };

    const handleRemoveStreamer = async (userId: string) => {
        if (!confirm('Remove streamer status from this user?')) return;

        try {
            const { data, error } = await supabase.rpc('remove_streamer_status', {
                target_user_id: userId,
                admin_user_id: adminUser.id
            });

            if (error) throw error;

            alert('Streamer status removed');
            fetchStreamers();
            fetchAllUsers();
        } catch (error) {
            console.error('Failed to remove streamer:', error);
            alert(`Failed to remove streamer: ${error.message}`);
        }
    };

    const handleUpdateBalance = async (userId: string, newBalance: string) => {
        const balance = parseFloat(newBalance);
        if (isNaN(balance) || balance < 0) {
            alert('Invalid balance');
            return;
        }

        try {
            const { data, error } = await supabase.rpc('edit_streamer_balance', {
                target_user_id: userId,
                admin_user_id: adminUser.id,
                new_balance: balance
            });

            if (error) throw error;

            alert('Balance updated!');
            setEditingBalance(prev => ({ ...prev, [userId]: '' }));
            fetchStreamers();
        } catch (error) {
            console.error('Failed to update balance:', error);
            alert(`Failed to update balance: ${error.message}`);
        }
    };

    const handleToggleWithdrawals = async (userId: string, canWithdraw: boolean) => {
        try {
            const { data, error } = await supabase.rpc('toggle_user_withdrawal', {
                target_user_id: userId,
                admin_user_id: adminUser.id,
                allow_withdraw: !canWithdraw
            });

            if (error) throw error;

            alert(`Withdrawals ${!canWithdraw ? 'enabled' : 'disabled'}`);
            fetchStreamers();
        } catch (error) {
            console.error('Failed to toggle withdrawals:', error);
            alert(`Failed to toggle withdrawals: ${error.message}`);
        }
    };

    const filteredStreamers = streamers.filter(s =>
        s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const nonStreamers = allUsers.filter(u => !u.is_streamer);

    if (loading) {
        return <div className="flex items-center justify-center p-12"><div className="text-slate-400">Loading...</div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Streamer Management</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage promotional streamer accounts with boosted odds</p>
                </div>
                <button
                    onClick={() => setShowAddStreamer(!showAddStreamer)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                    <Star className="w-4 h-4" />
                    Add Streamer
                </button>
            </div>

            {/* Add Streamer Form */}
            {showAddStreamer && (
                <div className="bg-[#1a2332] border border-purple-500/20 rounded-xl p-6 space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-400" />
                        Make User a Streamer
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-slate-400 block mb-2">Select User</label>
                            <select
                                value={newStreamerForm.userId}
                                onChange={(e) => setNewStreamerForm({ ...newStreamerForm, userId: e.target.value })}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2 text-white"
                            >
                                <option value="">Choose a user...</option>
                                {nonStreamers.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.username} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-slate-400 block mb-2">Odds Multiplier</label>
                            <input
                                type="number"
                                step="0.1"
                                min="1.0"
                                max="10.0"
                                value={newStreamerForm.oddsMultiplier}
                                onChange={(e) => setNewStreamerForm({ ...newStreamerForm, oddsMultiplier: parseFloat(e.target.value) })}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2 text-white"
                            />
                            <p className="text-xs text-slate-500 mt-1">1.0 = normal, 2.0 = 2x better odds</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 block mb-2">Admin Note</label>
                        <input
                            type="text"
                            value={newStreamerForm.note}
                            onChange={(e) => setNewStreamerForm({ ...newStreamerForm, note: e.target.value })}
                            placeholder="e.g., Twitch partner, Discord promo"
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2 text-white"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={newStreamerForm.allowWithdrawals}
                            onChange={(e) => setNewStreamerForm({ ...newStreamerForm, allowWithdrawals: e.target.checked })}
                            className="rounded"
                        />
                        <label className="text-sm text-white">Allow withdrawals (usually disabled for promotional accounts)</label>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleMakeStreamer}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Create Streamer
                        </button>
                        <button
                            onClick={() => setShowAddStreamer(false)}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Search */}
            <input
                type="text"
                placeholder="Search streamers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2 text-white"
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#1a2332] border border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-slate-400 text-sm">Total Streamers</div>
                            <div className="text-2xl font-bold text-white">{streamers.length}</div>
                        </div>
                        <Star className="w-8 h-8 text-purple-400" />
                    </div>
                </div>

                <div className="bg-[#1a2332] border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-slate-400 text-sm">Can Withdraw</div>
                            <div className="text-2xl font-bold text-white">{streamers.filter(s => s.can_withdraw).length}</div>
                        </div>
                        <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                </div>

                <div className="bg-[#1a2332] border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-slate-400 text-sm">Blocked from Withdrawal</div>
                            <div className="text-2xl font-bold text-white">{streamers.filter(s => !s.can_withdraw).length}</div>
                        </div>
                        <Ban className="w-8 h-8 text-red-400" />
                    </div>
                </div>
            </div>

            {/* Streamers List */}
            <div className="bg-[#0b0f19] border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead className="bg-[#1a2332] border-b border-white/5">
                        <tr>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm">User</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm">Balance</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm">Odds Boost</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm">Withdrawals</th>
                            <th className="text-left p-4 text-slate-400 font-medium text-sm hidden sm:table-cell">Note</th>
                            <th className="text-right p-4 text-slate-400 font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStreamers.map(streamer => (
                            <tr key={streamer.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={streamer.avatar} alt="" loading="lazy" className="w-10 h-10 rounded-full" />
                                        <div>
                                            <div className="text-white font-medium flex items-center gap-2">
                                                {streamer.username}
                                                <Star className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div className="text-slate-400 text-xs">{streamer.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {editingBalance[streamer.id] !== undefined ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={editingBalance[streamer.id]}
                                                onChange={(e) => setEditingBalance({ ...editingBalance, [streamer.id]: e.target.value })}
                                                className="w-24 bg-[#1a2332] border border-white/10 rounded px-2 py-1 text-white text-sm"
                                            />
                                            <button
                                                onClick={() => handleUpdateBalance(streamer.id, editingBalance[streamer.id])}
                                                className="text-emerald-400 hover:text-emerald-300"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditingBalance(prev => ({ ...prev, [streamer.id]: undefined }))}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-400 font-mono">${streamer.balance.toFixed(2)}</span>
                                            <button
                                                onClick={() => setEditingBalance({ ...editingBalance, [streamer.id]: streamer.balance.toString() })}
                                                className="text-slate-400 hover:text-white"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm font-mono flex items-center gap-1 w-fit">
                                        <TrendingUp className="w-3 h-3" />
                                        {streamer.streamer_odds_multiplier.toFixed(2)}x
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleToggleWithdrawals(streamer.id, streamer.can_withdraw)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium ${streamer.can_withdraw
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}
                                    >
                                        {streamer.can_withdraw ? 'Enabled' : 'Disabled'}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <span className="text-slate-400 text-sm">{streamer.streamer_note || '—'}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleRemoveStreamer(streamer.id)}
                                        className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded-lg text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredStreamers.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        No streamers found
                    </div>
                )}
            </div>
        </div>
    );
};
