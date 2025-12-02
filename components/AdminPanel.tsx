import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, DollarSign, Package, TrendingUp, Shield, Settings, FileText, LogOut, Search, Ban, CheckCircle, XCircle, Eye, Edit } from 'lucide-react';

export const AdminPanel: React.FC = () => {
    const [authenticated, setAuthenticated] = useState(false);
    const [admin, setAdmin] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'deposits' | 'shipments' | 'withdrawals' | 'transactions' | 'logs' | 'settings'>('dashboard');
    
    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState<string | null>(null);
    
    // Data states
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [deposits, setDeposits] = useState<any[]>([]);
    const [shipments, setShipments] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);

    // Get backend URL from environment variable
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (authenticated) {
            fetchData();
        }
    }, [authenticated, activeTab]);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${backendUrl}/api/admin/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAdmin(data.admin);
                setAuthenticated(true);
            } else {
                localStorage.removeItem('admin_token');
            }
        } catch (err) {
            console.error('Auth check error:', err);
            localStorage.removeItem('admin_token');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);

        try {
            const response = await fetch(`${backendUrl}/api/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }

            const data = await response.json();
            localStorage.setItem('admin_token', data.token);
            setAdmin(data.admin);
            setAuthenticated(true);
            setEmail('');
            setPassword('');
        } catch (err) {
            setLoginError(err instanceof Error ? err.message : 'Login failed');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        setAuthenticated(false);
        setAdmin(null);
        setActiveTab('dashboard');
    };

    const fetchData = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            switch (activeTab) {
                case 'dashboard':
                    const statsRes = await fetch(`${backendUrl}/api/admin/stats`, { headers });
                    if (statsRes.ok) {
                        const statsData = await statsRes.json();
                        setStats(statsData);
                    }
                    break;
                case 'users':
                    const usersRes = await fetch(`${backendUrl}/api/admin/users?limit=100`, { headers });
                    if (usersRes.ok) {
                        const usersData = await usersRes.json();
                        setUsers(usersData.users || []);
                    }
                    break;
                case 'deposits':
                    const depositsRes = await fetch(`${backendUrl}/api/admin/deposits?limit=100`, { headers });
                    if (depositsRes.ok) {
                        const depositsData = await depositsRes.json();
                        setDeposits(depositsData.deposits || []);
                    }
                    break;
                case 'shipments':
                    const shipmentsRes = await fetch(`${backendUrl}/api/admin/shipments?limit=100`, { headers });
                    if (shipmentsRes.ok) {
                        const shipmentsData = await shipmentsRes.json();
                        setShipments(shipmentsData.shipments || []);
                    }
                    break;
                case 'withdrawals':
                    const withdrawalsRes = await fetch(`${backendUrl}/api/admin/withdrawals?limit=100`, { headers });
                    if (withdrawalsRes.ok) {
                        const withdrawalsData = await withdrawalsRes.json();
                        setWithdrawals(withdrawalsData.withdrawals || []);
                    }
                    break;
                case 'transactions':
                    const transactionsRes = await fetch(`${backendUrl}/api/admin/transactions?limit=100`, { headers });
                    if (transactionsRes.ok) {
                        const transactionsData = await transactionsRes.json();
                        setTransactions(transactionsData.transactions || []);
                    }
                    break;
                case 'logs':
                    const logsRes = await fetch(`${backendUrl}/api/admin/logs?limit=100`, { headers });
                    if (logsRes.ok) {
                        const logsData = await logsRes.json();
                        setLogs(logsData.logs || []);
                    }
                    break;
            }
        } catch (err) {
            console.error('Fetch data error:', err);
            setError('Failed to fetch data');
        }
    };

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        'Content-Type': 'application/json',
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0f19] text-white p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-[#0b0f19] text-white p-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-[#131b2e] rounded-2xl border border-white/5 p-8">
                    <div className="text-center mb-8">
                        <Shield className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
                        <p className="text-slate-400">Enter your admin credentials</p>
                    </div>

                    {loginError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                            <p className="text-red-400 text-sm">{loginError}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Login
                        </button>
                    </form>
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
                        <h1 className="text-2xl font-bold">Admin Panel</h1>
                        <p className="text-slate-400 text-sm">{admin?.email} • {admin?.role}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'deposits', label: 'Deposits', icon: DollarSign },
                        { id: 'shipments', label: 'Shipments', icon: Package },
                        { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
                        { id: 'transactions', label: 'Transactions', icon: FileText },
                        { id: 'logs', label: 'Activity Logs', icon: FileText },
                        { id: 'settings', label: 'Settings', icon: Settings },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                                activeTab === tab.id
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
                    {activeTab === 'dashboard' && stats && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold">Dashboard Overview</h2>
                            
                            {/* User Statistics */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-slate-300">User Statistics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Total Users</p>
                                        <p className="text-2xl font-bold">{stats.users?.total || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Active Users</p>
                                        <p className="text-2xl font-bold">{stats.users?.active || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Banned</p>
                                        <p className="text-2xl font-bold text-red-400">{stats.users?.banned || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">New Today</p>
                                        <p className="text-2xl font-bold text-green-400">{stats.users?.newToday || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">New This Week</p>
                                        <p className="text-2xl font-bold text-blue-400">{stats.users?.newThisWeek || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Statistics */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-slate-300">Revenue Statistics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Today</p>
                                        <p className="text-2xl font-bold text-green-400">${(stats.revenue?.today || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">This Week</p>
                                        <p className="text-2xl font-bold">${(stats.revenue?.thisWeek || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">This Month</p>
                                        <p className="text-2xl font-bold">${(stats.revenue?.thisMonth || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">All Time</p>
                                        <p className="text-2xl font-bold text-purple-400">${(stats.revenue?.allTime || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Box Statistics */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-slate-300">Box Statistics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Total Boxes</p>
                                        <p className="text-2xl font-bold">{stats.boxes?.total || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Enabled</p>
                                        <p className="text-2xl font-bold text-green-400">{stats.boxes?.enabled || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Openings Today</p>
                                        <p className="text-2xl font-bold">{stats.boxes?.openingsToday || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Openings This Week</p>
                                        <p className="text-2xl font-bold">{stats.boxes?.openingsThisWeek || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Total Openings</p>
                                        <p className="text-2xl font-bold">{stats.boxes?.totalOpenings || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Box Revenue Today</p>
                                        <p className="text-2xl font-bold text-green-400">${(stats.boxes?.revenueToday || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Battle Statistics */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-slate-300">Battle Statistics</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Total Battles</p>
                                        <p className="text-2xl font-bold">{stats.battles?.total || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Active</p>
                                        <p className="text-2xl font-bold text-green-400">{stats.battles?.active || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Waiting</p>
                                        <p className="text-2xl font-bold text-yellow-400">{stats.battles?.waiting || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Items */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-slate-300">Pending Items</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <div className="flex items-center gap-3 mb-2">
                                            <DollarSign className="w-5 h-5 text-yellow-400" />
                                            <p className="text-xs text-slate-400">Pending Deposits</p>
                                        </div>
                                        <p className="text-2xl font-bold">{stats.pending?.deposits || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Package className="w-5 h-5 text-blue-400" />
                                            <p className="text-xs text-slate-400">Pending Shipments</p>
                                        </div>
                                        <p className="text-2xl font-bold">{stats.pending?.shipments || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <div className="flex items-center gap-3 mb-2">
                                            <DollarSign className="w-5 h-5 text-red-400" />
                                            <p className="text-xs text-slate-400">Pending Withdrawals</p>
                                        </div>
                                        <p className="text-2xl font-bold">{stats.pending?.withdrawals || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Stats */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-slate-300">Additional Statistics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Total Inventory Items</p>
                                        <p className="text-2xl font-bold">{stats.inventory?.totalItems || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Total Affiliates</p>
                                        <p className="text-2xl font-bold">{stats.affiliates?.totalAffiliates || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Total Referrals</p>
                                        <p className="text-2xl font-bold">{stats.affiliates?.totalReferrals || 0}</p>
                                    </div>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 mb-1">Withdrawals Today</p>
                                        <p className="text-2xl font-bold">${(stats.withdrawals?.amountToday || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            {stats.recentActivity && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-slate-300">Recent Activity</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                            <p className="text-sm font-semibold mb-3">Recent Users</p>
                                            <div className="space-y-2">
                                                {stats.recentActivity.users?.slice(0, 3).map((user: any) => (
                                                    <div key={user.id} className="text-xs text-slate-400">
                                                        <p className="font-medium text-white">{user.username}</p>
                                                        <p>${parseFloat(user.balance || 0).toFixed(2)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                            <p className="text-sm font-semibold mb-3">Recent Deposits</p>
                                            <div className="space-y-2">
                                                {stats.recentActivity.deposits?.slice(0, 3).map((deposit: any) => (
                                                    <div key={deposit.id} className="text-xs text-slate-400">
                                                        <p className="font-medium text-white">${parseFloat(deposit.usd_value || 0).toFixed(2)}</p>
                                                        <p>{deposit.currency} • {deposit.status}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                            <p className="text-sm font-semibold mb-3">Recent Box Openings</p>
                                            <div className="space-y-2">
                                                {stats.recentActivity.boxOpenings?.slice(0, 3).map((opening: any) => (
                                                    <div key={opening.id} className="text-xs text-slate-400">
                                                        <p className="font-medium text-white">Box {opening.box_id?.substring(0, 8)}...</p>
                                                        <p>{new Date(opening.created_at).toLocaleTimeString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Top Users */}
                            {stats.topUsers && stats.topUsers.byBalance && stats.topUsers.byBalance.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-slate-300">Top Users by Balance</h3>
                                    <div className="bg-[#0b0f19] rounded-lg p-4 border border-white/5">
                                        <div className="space-y-2">
                                            {stats.topUsers.byBalance.map((user: any, index: number) => (
                                                <div key={user.id} className="flex items-center justify-between p-2 bg-[#131b2e] rounded">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-slate-500 font-bold">#{index + 1}</span>
                                                        <div>
                                                            <p className="text-sm font-medium">{user.username}</p>
                                                            <p className="text-xs text-slate-400">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-lg font-bold text-green-400">${parseFloat(user.balance || 0).toFixed(2)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">Users</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-3 text-slate-400">ID</th>
                                            <th className="text-left p-3 text-slate-400">Username</th>
                                            <th className="text-left p-3 text-slate-400">Email</th>
                                            <th className="text-left p-3 text-slate-400">Balance</th>
                                            <th className="text-left p-3 text-slate-400">Status</th>
                                            <th className="text-left p-3 text-slate-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b border-white/5">
                                                <td className="p-3 font-mono text-xs">{user.id.substring(0, 8)}...</td>
                                                <td className="p-3">{user.username}</td>
                                                <td className="p-3 text-slate-400">{user.email}</td>
                                                <td className="p-3">${parseFloat(user.balance || 0).toFixed(2)}</td>
                                                <td className="p-3">
                                                    {user.banned ? (
                                                        <span className="text-red-400 flex items-center gap-1">
                                                            <Ban className="w-4 h-4" />
                                                            Banned
                                                        </span>
                                                    ) : (
                                                        <span className="text-green-400 flex items-center gap-1">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <button className="text-purple-400 hover:text-purple-300">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'deposits' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">Deposits</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-3 text-slate-400">ID</th>
                                            <th className="text-left p-3 text-slate-400">User</th>
                                            <th className="text-left p-3 text-slate-400">Amount</th>
                                            <th className="text-left p-3 text-slate-400">Currency</th>
                                            <th className="text-left p-3 text-slate-400">Status</th>
                                            <th className="text-left p-3 text-slate-400">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deposits.map((deposit) => (
                                            <tr key={deposit.id} className="border-b border-white/5">
                                                <td className="p-3 font-mono text-xs">{deposit.id.substring(0, 8)}...</td>
                                                <td className="p-3 font-mono text-xs">{deposit.user_id.substring(0, 8)}...</td>
                                                <td className="p-3">${parseFloat(deposit.usd_value || 0).toFixed(2)}</td>
                                                <td className="p-3">{deposit.currency}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        deposit.status === 'CREDITED' ? 'bg-green-500/20 text-green-400' :
                                                        deposit.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {deposit.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-400 text-sm">
                                                    {new Date(deposit.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'shipments' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">Shipments</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-3 text-slate-400">ID</th>
                                            <th className="text-left p-3 text-slate-400">User</th>
                                            <th className="text-left p-3 text-slate-400">Status</th>
                                            <th className="text-left p-3 text-slate-400">Tracking</th>
                                            <th className="text-left p-3 text-slate-400">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shipments.map((shipment) => (
                                            <tr key={shipment.id} className="border-b border-white/5">
                                                <td className="p-3 font-mono text-xs">{shipment.id.substring(0, 8)}...</td>
                                                <td className="p-3 font-mono text-xs">{shipment.user_id.substring(0, 8)}...</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        shipment.status === 'SHIPPED' ? 'bg-green-500/20 text-green-400' :
                                                        shipment.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {shipment.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-400">{shipment.tracking_number || 'N/A'}</td>
                                                <td className="p-3 text-slate-400 text-sm">
                                                    {new Date(shipment.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'withdrawals' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">Withdrawals</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-3 text-slate-400">ID</th>
                                            <th className="text-left p-3 text-slate-400">User</th>
                                            <th className="text-left p-3 text-slate-400">Amount</th>
                                            <th className="text-left p-3 text-slate-400">Status</th>
                                            <th className="text-left p-3 text-slate-400">Date</th>
                                            <th className="text-left p-3 text-slate-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {withdrawals.map((withdrawal) => (
                                            <tr key={withdrawal.id} className="border-b border-white/5">
                                                <td className="p-3 font-mono text-xs">{withdrawal.id.substring(0, 8)}...</td>
                                                <td className="p-3 font-mono text-xs">{withdrawal.user_id.substring(0, 8)}...</td>
                                                <td className="p-3">${parseFloat(withdrawal.amount || 0).toFixed(2)}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        withdrawal.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                                        withdrawal.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {withdrawal.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-400 text-sm">
                                                    {new Date(withdrawal.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-3">
                                                    {withdrawal.status === 'PENDING' && (
                                                        <div className="flex gap-2">
                                                            <button className="text-green-400 hover:text-green-300">
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button className="text-red-400 hover:text-red-300">
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'transactions' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">Transactions</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-3 text-slate-400">ID</th>
                                            <th className="text-left p-3 text-slate-400">User</th>
                                            <th className="text-left p-3 text-slate-400">Type</th>
                                            <th className="text-left p-3 text-slate-400">Amount</th>
                                            <th className="text-left p-3 text-slate-400">Description</th>
                                            <th className="text-left p-3 text-slate-400">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="border-b border-white/5">
                                                <td className="p-3 font-mono text-xs">{tx.id.substring(0, 8)}...</td>
                                                <td className="p-3 font-mono text-xs">{tx.user_id.substring(0, 8)}...</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        tx.type === 'DEPOSIT' ? 'bg-green-500/20 text-green-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="p-3">${parseFloat(tx.amount || 0).toFixed(2)}</td>
                                                <td className="p-3 text-slate-400 text-sm">{tx.description}</td>
                                                <td className="p-3 text-slate-400 text-sm">
                                                    {new Date(tx.created_at || tx.timestamp).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">Activity Logs</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left p-3 text-slate-400">Admin</th>
                                            <th className="text-left p-3 text-slate-400">Action</th>
                                            <th className="text-left p-3 text-slate-400">Target</th>
                                            <th className="text-left p-3 text-slate-400">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log, idx) => (
                                            <tr key={idx} className="border-b border-white/5">
                                                <td className="p-3 text-slate-400">{log.admin_users?.email || 'N/A'}</td>
                                                <td className="p-3">{log.action}</td>
                                                <td className="p-3 text-slate-400">{log.target_type}: {log.target_id?.substring(0, 8)}...</td>
                                                <td className="p-3 text-slate-400 text-sm">
                                                    {new Date(log.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">Settings</h2>
                            <p className="text-slate-400">Settings management coming soon...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

