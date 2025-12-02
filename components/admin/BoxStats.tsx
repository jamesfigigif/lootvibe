import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, DollarSign, Package, PieChart, Calendar } from 'lucide-react';

interface BoxStatsProps {
    token: string;
    boxId: string;
    onBack: () => void;
}

interface Stats {
    totalOpenings: number;
    totalRevenue: number;
    totalPayout: number;
    netProfit: number;
    profitMargin: string;
    outcomeDistribution: {
        KEPT: number;
        SOLD: number;
        SHIPPED: number;
    };
    recentOpenings: number;
    lastOpened: string | null;
}

interface Box {
    id: string;
    name: string;
    price: number;
    sale_price?: number;
    image: string;
    color: string;
    category: string;
}

export const BoxStats: React.FC<BoxStatsProps> = ({ token, boxId, onBack }) => {
    const [box, setBox] = useState<Box | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchData();
    }, [boxId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch box details
            const boxResponse = await fetch(`${BACKEND_URL}/api/admin/boxes/${boxId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (boxResponse.ok) {
                const boxData = await boxResponse.json();
                setBox(boxData);
            }

            // Fetch stats
            const statsResponse = await fetch(`${BACKEND_URL}/api/admin/boxes/${boxId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
            }
        } catch (error) {
            console.error('Error fetching box stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="text-slate-400">Loading statistics...</div>
            </div>
        );
    }

    if (!box || !stats) {
        return (
            <div className="p-8">
                <div className="text-slate-400">Failed to load statistics</div>
            </div>
        );
    }

    const effectivePrice = box.sale_price || box.price;
    const totalOutcomes = stats.outcomeDistribution.KEPT + stats.outcomeDistribution.SOLD + stats.outcomeDistribution.SHIPPED;

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 bg-[#131b2e] border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex items-center gap-4 flex-1">
                    <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${box.color} flex items-center justify-center flex-shrink-0`}>
                        {box.image ? (
                            <img src={box.image} alt={box.name} className="w-12 h-12 object-contain" />
                        ) : (
                            <Package className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">{box.name}</h1>
                        <p className="text-slate-400">Box Performance Statistics</p>
                    </div>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                        <Package className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.totalOpenings.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">Total Openings</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                        <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.totalRevenue.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Total Revenue</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                        <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.netProfit.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Net Profit</div>
                    <div className={`text-xs mt-1 font-bold ${parseFloat(stats.profitMargin) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.profitMargin}% margin
                    </div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                        <Calendar className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.recentOpenings}</div>
                    <div className="text-sm text-slate-400">Last 30 Days</div>
                    {stats.lastOpened && (
                        <div className="text-xs text-slate-500 mt-1">
                            Last: {new Date(stats.lastOpened).toLocaleDateString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Financial Breakdown */}
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <h2 className="text-xl font-bold text-white">Financial Breakdown</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Box Price</span>
                            <span className="text-white font-bold">${effectivePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Total Revenue</span>
                            <span className="text-green-400 font-bold">${stats.totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Total Payout</span>
                            <span className="text-red-400 font-bold">-${stats.totalPayout.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-white font-bold">Net Profit</span>
                                <span className={`font-bold text-xl ${stats.netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${stats.netProfit.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Profit Margin</span>
                            <span className={`font-bold ${parseFloat(stats.profitMargin) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stats.profitMargin}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Avg Revenue per Opening</span>
                            <span className="text-white font-bold">
                                ${stats.totalOpenings > 0 ? (stats.totalRevenue / stats.totalOpenings).toFixed(2) : '0.00'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Outcome Distribution */}
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-5 h-5 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">Item Outcomes</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400">Items Kept</span>
                                <span className="text-white font-bold">{stats.outcomeDistribution.KEPT}</span>
                            </div>
                            <div className="w-full bg-[#0b0f19] rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full rounded-full"
                                    style={{ width: totalOutcomes > 0 ? `${(stats.outcomeDistribution.KEPT / totalOutcomes) * 100}%` : '0%' }}
                                />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {totalOutcomes > 0 ? ((stats.outcomeDistribution.KEPT / totalOutcomes) * 100).toFixed(1) : 0}%
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400">Items Sold</span>
                                <span className="text-white font-bold">{stats.outcomeDistribution.SOLD}</span>
                            </div>
                            <div className="w-full bg-[#0b0f19] rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-green-500 h-full rounded-full"
                                    style={{ width: totalOutcomes > 0 ? `${(stats.outcomeDistribution.SOLD / totalOutcomes) * 100}%` : '0%' }}
                                />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {totalOutcomes > 0 ? ((stats.outcomeDistribution.SOLD / totalOutcomes) * 100).toFixed(1) : 0}%
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400">Items Shipped</span>
                                <span className="text-white font-bold">{stats.outcomeDistribution.SHIPPED}</span>
                            </div>
                            <div className="w-full bg-[#0b0f19] rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-purple-500 h-full rounded-full"
                                    style={{ width: totalOutcomes > 0 ? `${(stats.outcomeDistribution.SHIPPED / totalOutcomes) * 100}%` : '0%' }}
                                />
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {totalOutcomes > 0 ? ((stats.outcomeDistribution.SHIPPED / totalOutcomes) * 100).toFixed(1) : 0}%
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-white font-bold">Total Outcomes</span>
                                <span className="text-white font-bold text-xl">{totalOutcomes}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Box Details */}
            <div className="mt-6 bg-[#131b2e] border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Box Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <span className="text-slate-400 text-sm">Category</span>
                        <div className="text-white font-bold mt-1">{box.category}</div>
                    </div>
                    <div>
                        <span className="text-slate-400 text-sm">Regular Price</span>
                        <div className="text-white font-bold mt-1">${box.price.toFixed(2)}</div>
                    </div>
                    {box.sale_price && (
                        <div>
                            <span className="text-slate-400 text-sm">Sale Price</span>
                            <div className="text-green-400 font-bold mt-1">${box.sale_price.toFixed(2)}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
