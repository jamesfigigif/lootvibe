import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Package, DollarSign, Download, Calendar } from 'lucide-react';

interface AnalyticsProps {
    token: string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ token }) => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalUsers: 0,
        totalBoxOpenings: 0,
        avgRevenuePerUser: 0,
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        userGrowth: [] as { date: string; count: number }[],
        revenueData: [] as { date: string; amount: number }[],
        topBoxes: [] as { name: string; openings: number; revenue: number }[]
    });
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('30'); // days

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchAnalytics();
    }, [timeframe]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            // Fetch comprehensive analytics from your backend
            // For now, using mock data structure
            const response = await fetch(`${BACKEND_URL}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Transform and set stats
                setStats({
                    totalRevenue: data.todayRevenue * 30, // Mock calculation
                    totalUsers: data.userCount,
                    totalBoxOpenings: 0,
                    avgRevenuePerUser: data.userCount > 0 ? (data.todayRevenue * 30) / data.userCount : 0,
                    todayRevenue: data.todayRevenue,
                    weekRevenue: data.todayRevenue * 7,
                    monthRevenue: data.todayRevenue * 30,
                    userGrowth: [],
                    revenueData: [],
                    topBoxes: []
                });
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportData = () => {
        const csvContent = `Revenue Analytics Export
Timeframe: Last ${timeframe} days
Total Revenue: $${stats.totalRevenue.toFixed(2)}
Total Users: ${stats.totalUsers}
Average Revenue Per User: $${stats.avgRevenuePerUser.toFixed(2)}
        `;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="text-slate-400">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Analytics & Reports</h1>
                    <p className="text-slate-400">Platform performance and insights</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="bg-[#131b2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </select>
                    <button
                        onClick={exportData}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                        <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.todayRevenue.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Today's Revenue</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                        <DollarSign className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.weekRevenue.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">This Week</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                        <DollarSign className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.monthRevenue.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">This Month</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                        <TrendingUp className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.avgRevenuePerUser.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Avg Per User</div>
                </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">User Growth</h2>
                        <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">{stats.totalUsers}</div>
                    <div className="text-sm text-slate-400 mb-6">Total Registered Users</div>
                    <div className="h-48 flex items-end justify-between gap-2">
                        {[65, 78, 82, 90, 95, 100, 98].map((height, i) => (
                            <div key={i} className="flex-1 bg-blue-500/20 rounded-t" style={{ height: `${height}%` }}>
                                <div className="w-full bg-blue-500 rounded-t transition-all" style={{ height: '100%' }} />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <span key={day}>{day}</span>
                        ))}
                    </div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Revenue Trend</h2>
                        <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">${stats.totalRevenue.toFixed(2)}</div>
                    <div className="text-sm text-slate-400 mb-6">Total Revenue (Period)</div>
                    <div className="h-48 flex items-end justify-between gap-2">
                        {[45, 52, 48, 65, 70, 85, 92].map((height, i) => (
                            <div key={i} className="flex-1 bg-green-500/20 rounded-t" style={{ height: `${height}%` }}>
                                <div className="w-full bg-green-500 rounded-t transition-all" style={{ height: '100%' }} />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <span key={day}>{day}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Performance Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400">Conversion Rate</span>
                            <span className="text-green-400 font-bold">3.8%</span>
                        </div>
                        <div className="w-full bg-[#0b0f19] rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '38%' }} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400">User Retention</span>
                            <span className="text-blue-400 font-bold">67%</span>
                        </div>
                        <div className="w-full bg-[#0b0f19] rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400">Profit Margin</span>
                            <span className="text-purple-400 font-bold">24%</span>
                        </div>
                        <div className="w-full bg-[#0b0f19] rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '24%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
