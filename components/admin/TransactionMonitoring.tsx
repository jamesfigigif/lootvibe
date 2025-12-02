import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, DollarSign, Download, Calendar } from 'lucide-react';

interface Transaction {
    id: string;
    user_id: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET' | 'WIN' | 'PURCHASE';
    amount: number;
    description: string;
    timestamp: number;
    created_at: string;
}

interface TransactionMonitoringProps {
    token: string;
}

export const TransactionMonitoring: React.FC<TransactionMonitoringProps> = ({ token }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [dateRange, setDateRange] = useState('7'); // days
    const [stats, setStats] = useState({
        totalVolume: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalPurchases: 0,
        transactionCount: 0
    });

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchTransactions();
    }, [typeFilter, dateRange, search]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (typeFilter) params.append('type', typeFilter);
            if (search) params.append('search', search);
            params.append('limit', '100'); // Get more for stats calculation

            const response = await fetch(`${BACKEND_URL}/api/admin/transactions?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }

            const data = await response.json();
            const txs = data.transactions || [];

            setTransactions(txs);

            // Calculate stats
            const totalVolume = txs.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
            const totalDeposits = txs.filter((tx: Transaction) => tx.type === 'DEPOSIT').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
            const totalWithdrawals = txs.filter((tx: Transaction) => tx.type === 'WITHDRAWAL').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
            const totalPurchases = txs.filter((tx: Transaction) => tx.type === 'PURCHASE').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

            setStats({
                totalVolume,
                totalDeposits,
                totalWithdrawals,
                totalPurchases,
                transactionCount: txs.length
            });
        } catch (error) {
            console.error('Error fetching transactions:', error);
            alert('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type: string) => {
        const colors = {
            'DEPOSIT': 'text-green-400 bg-green-500/20',
            'WITHDRAWAL': 'text-red-400 bg-red-500/20',
            'BET': 'text-orange-400 bg-orange-500/20',
            'WIN': 'text-emerald-400 bg-emerald-500/20',
            'PURCHASE': 'text-purple-400 bg-purple-500/20'
        };
        return colors[type as keyof typeof colors] || 'text-slate-400 bg-slate-500/20';
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'DEPOSIT':
            case 'WIN':
                return <TrendingUp className="w-4 h-4" />;
            case 'WITHDRAWAL':
            case 'PURCHASE':
            case 'BET':
                return <TrendingDown className="w-4 h-4" />;
            default:
                return <DollarSign className="w-4 h-4" />;
        }
    };

    const exportTransactions = () => {
        const csvContent = [
            ['Transaction ID', 'User ID', 'Type', 'Amount', 'Description', 'Date'],
            ...transactions.map(tx => [
                tx.id,
                tx.user_id,
                tx.type,
                tx.amount.toFixed(2),
                tx.description,
                new Date(tx.timestamp).toLocaleString()
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Transaction Monitoring</h1>
                    <p className="text-slate-400">Monitor all platform transactions in real-time</p>
                </div>
                <button
                    onClick={exportTransactions}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                        <DollarSign className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.transactionCount}</div>
                    <div className="text-sm text-slate-400">Total Transactions</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                        <DollarSign className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.totalVolume.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Total Volume</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                        <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.totalDeposits.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Deposits</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                        <TrendingDown className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.totalWithdrawals.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Withdrawals</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                        <DollarSign className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">${stats.totalPurchases.toFixed(2)}</div>
                    <div className="text-sm text-slate-400">Purchases</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-white">Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search user ID or description..."
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All Types</option>
                            <option value="DEPOSIT">Deposits</option>
                            <option value="WITHDRAWAL">Withdrawals</option>
                            <option value="PURCHASE">Purchases</option>
                            <option value="BET">Bets</option>
                            <option value="WIN">Wins</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="1">Last 24 hours</option>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="all">All time</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#0b0f19] border-b border-white/10">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">Type</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">Amount</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">Description</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">User ID</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">Date</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">Transaction ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        Loading transactions...
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-bold text-sm ${getTypeColor(tx.type)}`}>
                                                {getTypeIcon(tx.type)}
                                                {tx.type}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${
                                                tx.type === 'DEPOSIT' || tx.type === 'WIN' ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {tx.type === 'DEPOSIT' || tx.type === 'WIN' ? '+' : '-'}${tx.amount.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white text-sm">{tx.description}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-400 font-mono text-xs">
                                                {tx.user_id.slice(0, 12)}...
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-400">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-400 font-mono text-xs">
                                                {tx.id}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
