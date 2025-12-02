import React, { useState, useEffect } from 'react';
import { Search, Filter, Bitcoin, DollarSign, CheckCircle, Clock, XCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface Deposit {
    id: string;
    user_id: string;
    currency: string;
    address: string;
    tx_hash: string;
    amount: string;
    usd_value: string;
    confirmations: number;
    required_confirmations: number;
    status: 'PENDING' | 'CONFIRMING' | 'CONFIRMED' | 'CREDITED';
    credited_at?: string;
    created_at: string;
}

interface DepositManagementProps {
    token: string;
}

export const DepositManagement: React.FC<DepositManagementProps> = ({ token }) => {
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [currencyFilter, setCurrencyFilter] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchDeposits();

        // Auto-refresh every 30 seconds if enabled
        const interval = autoRefresh ? setInterval(fetchDeposits, 30000) : null;
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [page, statusFilter, currencyFilter, autoRefresh]);

    const fetchDeposits = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50'
            });

            if (statusFilter) params.append('status', statusFilter);
            if (currencyFilter) params.append('currency', currencyFilter);

            const response = await fetch(`${BACKEND_URL}/api/admin/deposits?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDeposits(data.deposits);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching deposits:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'PENDING': 'text-yellow-400 bg-yellow-500/20',
            'CONFIRMING': 'text-blue-400 bg-blue-500/20',
            'CONFIRMED': 'text-green-400 bg-green-500/20',
            'CREDITED': 'text-emerald-400 bg-emerald-500/20'
        };
        return colors[status as keyof typeof colors] || 'text-slate-400 bg-slate-500/20';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Clock className="w-4 h-4" />;
            case 'CONFIRMING':
                return <RefreshCw className="w-4 h-4 animate-spin" />;
            case 'CONFIRMED':
                return <CheckCircle className="w-4 h-4" />;
            case 'CREDITED':
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <XCircle className="w-4 h-4" />;
        }
    };

    const getExplorerUrl = (currency: string, txHash: string) => {
        if (currency === 'BTC') {
            return `https://blockchair.com/bitcoin/transaction/${txHash}`;
        } else if (currency === 'ETH') {
            return `https://etherscan.io/tx/${txHash}`;
        }
        return '';
    };

    const formatAmount = (amount: string, currency: string) => {
        const num = parseFloat(amount);
        if (currency === 'BTC') {
            return `${num.toFixed(8)} BTC`;
        } else if (currency === 'ETH') {
            return `${num.toFixed(6)} ETH`;
        }
        return `${num} ${currency}`;
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Deposit Management</h1>
                    <p className="text-slate-400">Monitor and manage crypto deposits</p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-white/10"
                        />
                        Auto-refresh (30s)
                    </label>
                    <button
                        onClick={fetchDeposits}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-bold rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-white">Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMING">Confirming</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CREDITED">Credited</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Currency</label>
                        <select
                            value={currencyFilter}
                            onChange={(e) => {
                                setCurrencyFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All Currencies</option>
                            <option value="BTC">Bitcoin (BTC)</option>
                            <option value="ETH">Ethereum (ETH)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Deposits Table */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#0b0f19] border-b border-white/10">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">Currency</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">Amount</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">USD Value</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">Confirmations</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">User ID</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">Date</th>
                                <th className="text-right px-6 py-4 text-sm font-bold text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                        Loading deposits...
                                    </td>
                                </tr>
                            ) : deposits.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                        No deposits found
                                    </td>
                                </tr>
                            ) : (
                                deposits.map((deposit) => (
                                    <tr key={deposit.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {deposit.currency === 'BTC' ? (
                                                    <Bitcoin className="w-5 h-5 text-orange-400" />
                                                ) : (
                                                    <DollarSign className="w-5 h-5 text-blue-400" />
                                                )}
                                                <span className="text-white font-bold">{deposit.currency}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white font-mono text-sm">
                                                {formatAmount(deposit.amount, deposit.currency)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-green-400 font-bold">
                                                ${parseFloat(deposit.usd_value).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <span className={`font-bold ${
                                                    deposit.confirmations >= deposit.required_confirmations
                                                        ? 'text-green-400'
                                                        : 'text-yellow-400'
                                                }`}>
                                                    {deposit.confirmations}
                                                </span>
                                                <span className="text-slate-400"> / {deposit.required_confirmations}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-bold text-sm ${getStatusColor(deposit.status)}`}>
                                                {getStatusIcon(deposit.status)}
                                                {deposit.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-400 font-mono text-xs">
                                                {deposit.user_id.slice(0, 12)}...
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-400">
                                                {new Date(deposit.created_at).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end">
                                                <a
                                                    href={getExplorerUrl(deposit.currency, deposit.tx_hash)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                                                    title="View on Explorer"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                            Page {page} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-[#0b0f19] border border-white/10 rounded-lg text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-[#0b0f19] border border-white/10 rounded-lg text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
