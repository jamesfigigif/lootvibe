import React from 'react';
import { Users, DollarSign, Package, TruckIcon, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardStats {
    userCount: number;
    pendingDeposits: number;
    pendingShipments: number;
    todayRevenue: number;
}

interface AdminDashboardProps {
    stats: DashboardStats;
    onNavigate: (page: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats, onNavigate }) => {
    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-slate-400">Overview of your platform</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Users */}
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-400" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.userCount.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">Total Users</div>
                </div>

                {/* Today's Revenue */}
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-emerald-400" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.todayRevenue.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Today's Revenue</div>
                </div>

                {/* Pending Deposits */}
                <button
                    onClick={() => onNavigate('deposits')}
                    className="bg-[#131b2e] border border-white/10 rounded-xl p-6 text-left hover:border-purple-500/50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-orange-400" />
                        </div>
                        {stats.pendingDeposits > 0 && (
                            <AlertCircle className="w-5 h-5 text-orange-400" />
                        )}
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.pendingDeposits}</div>
                    <div className="text-sm text-slate-400">Pending Deposits</div>
                </button>

                {/* Pending Shipments */}
                <button
                    onClick={() => onNavigate('shipments')}
                    className="bg-[#131b2e] border border-white/10 rounded-xl p-6 text-left hover:border-purple-500/50 transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <TruckIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        {stats.pendingShipments > 0 && (
                            <AlertCircle className="w-5 h-5 text-purple-400" />
                        )}
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.pendingShipments}</div>
                    <div className="text-sm text-slate-400">Pending Shipments</div>
                </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => onNavigate('users')}
                        className="bg-[#0b0f19] border border-white/10 hover:border-purple-500/50 rounded-lg p-4 text-left transition-colors"
                    >
                        <Users className="w-6 h-6 text-purple-400 mb-2" />
                        <div className="font-bold text-white">Manage Users</div>
                        <div className="text-sm text-slate-400">View and edit users</div>
                    </button>
                    <button
                        onClick={() => onNavigate('deposits')}
                        className="bg-[#0b0f19] border border-white/10 hover:border-purple-500/50 rounded-lg p-4 text-left transition-colors"
                    >
                        <Package className="w-6 h-6 text-orange-400 mb-2" />
                        <div className="font-bold text-white">Review Deposits</div>
                        <div className="text-sm text-slate-400">Verify crypto deposits</div>
                    </button>
                    <button
                        onClick={() => onNavigate('shipments')}
                        className="bg-[#0b0f19] border border-white/10 hover:border-purple-500/50 rounded-lg p-4 text-left transition-colors"
                    >
                        <TruckIcon className="w-6 h-6 text-purple-400 mb-2" />
                        <div className="font-bold text-white">Process Shipments</div>
                        <div className="text-sm text-slate-400">Update tracking info</div>
                    </button>
                </div>
            </div>
        </div>
    );
};
