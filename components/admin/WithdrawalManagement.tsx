import React, { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface Withdrawal {
    id: string;
    user_id: string;
    currency: string;
    amount: number;
    usd_value: number;
    withdrawal_address: string;
    status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
    fee_amount: number;
    net_amount: number;
    tx_hash?: string;
    tx_url?: string;
    processed_at?: string;
    processed_by?: string;
    rejection_reason?: string;
    notes?: string;
    created_at: string;
    users?: {
        id: string;
        email: string;
        username: string;
    };
}

interface WithdrawalManagementProps {
    token: string;
}

export const WithdrawalManagement: React.FC<WithdrawalManagementProps> = ({ token }) => {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [currencyFilter, setCurrencyFilter] = useState('');
    const [search, setSearch] = useState('');
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchWithdrawals();
    }, [statusFilter, currencyFilter]);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (currencyFilter) params.append('currency', currencyFilter);
            params.append('limit', '100');

            const response = await fetch(`${BACKEND_URL}/api/admin/withdrawals?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch withdrawals');
            }

            const data = await response.json();
            setWithdrawals(data.withdrawals || []);
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            alert('Failed to load withdrawals');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedWithdrawal) return;

        try {
            setProcessing(true);

            const response = await fetch(`${BACKEND_URL}/api/admin/withdrawals/${selectedWithdrawal.id}/approve`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to approve withdrawal');
            }

            alert('Withdrawal approved successfully!');
            setShowApproveModal(false);
            setSelectedWithdrawal(null);
            setNotes('');
            fetchWithdrawals();
        } catch (error: any) {
            console.error('Error approving withdrawal:', error);
            alert(error.message || 'Failed to approve withdrawal');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedWithdrawal || !rejectionReason) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            setProcessing(true);

            const response = await fetch(`${BACKEND_URL}/api/admin/withdrawals/${selectedWithdrawal.id}/reject`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: rejectionReason })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reject withdrawal');
            }

            alert('Withdrawal rejected and balance refunded!');
            setShowRejectModal(false);
            setSelectedWithdrawal(null);
            setRejectionReason('');
            fetchWithdrawals();
        } catch (error: any) {
            console.error('Error rejecting withdrawal:', error);
            alert(error.message || 'Failed to reject withdrawal');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'PENDING': 'text-yellow-400 bg-yellow-500/20',
            'APPROVED': 'text-blue-400 bg-blue-500/20',
            'PROCESSING': 'text-purple-400 bg-purple-500/20',
            'COMPLETED': 'text-green-400 bg-green-500/20',
            'REJECTED': 'text-red-400 bg-red-500/20',
            'FAILED': 'text-orange-400 bg-orange-500/20'
        };
        return colors[status] || 'text-slate-400 bg-slate-500/20';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Clock className="w-4 h-4" />;
            case 'APPROVED':
            case 'COMPLETED':
                return <CheckCircle className="w-4 h-4" />;
            case 'REJECTED':
            case 'FAILED':
                return <XCircle className="w-4 h-4" />;
            case 'PROCESSING':
                return <AlertCircle className="w-4 h-4" />;
            default:
                return <DollarSign className="w-4 h-4" />;
        }
    };

    const getCurrencyExplorer = (currency: string, address: string) => {
        if (currency === 'BTC') {
            return `https://blockchair.com/bitcoin/address/${address}`;
        } else if (currency === 'ETH') {
            return `https://etherscan.io/address/${address}`;
        }
        return null;
    };

    const filteredWithdrawals = withdrawals.filter(w => {
        if (!search) return true;
        return (
            w.users?.email?.toLowerCase().includes(search.toLowerCase()) ||
            w.users?.username?.toLowerCase().includes(search.toLowerCase()) ||
            w.id.toLowerCase().includes(search.toLowerCase()) ||
            w.withdrawal_address.toLowerCase().includes(search.toLowerCase())
        );
    });

    const pendingCount = withdrawals.filter(w => w.status === 'PENDING').length;
    const approvedCount = withdrawals.filter(w => w.status === 'APPROVED').length;
    const completedCount = withdrawals.filter(w => w.status === 'COMPLETED').length;
    const rejectedCount = withdrawals.filter(w => w.status === 'REJECTED').length;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Management</h1>
                <p className="text-slate-400">Approve or reject user withdrawal requests</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                        <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{pendingCount}</div>
                    <div className="text-sm text-slate-400">Pending Approval</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                        <CheckCircle className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{approvedCount}</div>
                    <div className="text-sm text-slate-400">Approved</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{completedCount}</div>
                    <div className="text-sm text-slate-400">Completed</div>
                </div>

                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                        <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{rejectedCount}</div>
                    <div className="text-sm text-slate-400">Rejected</div>
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
                            placeholder="Search user or address..."
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={currencyFilter}
                            onChange={(e) => setCurrencyFilter(e.target.value)}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All Currencies</option>
                            <option value="BTC">Bitcoin (BTC)</option>
                            <option value="ETH">Ethereum (ETH)</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Withdrawals List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-[#131b2e] border border-white/10 rounded-xl p-12 text-center text-slate-400">
                        Loading withdrawals...
                    </div>
                ) : filteredWithdrawals.length === 0 ? (
                    <div className="bg-[#131b2e] border border-white/10 rounded-xl p-12 text-center text-slate-400">
                        No withdrawals found
                    </div>
                ) : (
                    filteredWithdrawals.map((withdrawal) => (
                        <div key={withdrawal.id} className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-bold text-sm ${getStatusColor(withdrawal.status)}`}>
                                            {getStatusIcon(withdrawal.status)}
                                            {withdrawal.status}
                                        </div>
                                        <span className="text-slate-500 text-sm">#{withdrawal.id.slice(0, 12)}...</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <div className="text-sm text-slate-400 mb-1">User</div>
                                            <div className="text-white font-medium">
                                                {withdrawal.users?.email || withdrawal.user_id}
                                            </div>
                                            {withdrawal.users?.username && (
                                                <div className="text-sm text-slate-500">@{withdrawal.users.username}</div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="text-sm text-slate-400 mb-1">Amount</div>
                                            <div className="text-white font-bold text-xl">
                                                {withdrawal.amount} {withdrawal.currency}
                                            </div>
                                            {withdrawal.usd_value && (
                                                <div className="text-sm text-slate-500">≈ ${withdrawal.usd_value.toFixed(2)} USD</div>
                                            )}
                                            {withdrawal.fee_amount > 0 && (
                                                <div className="text-xs text-orange-400">
                                                    Fee: {withdrawal.fee_amount} {withdrawal.currency}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="text-sm text-slate-400 mb-1">Withdrawal Address</div>
                                            <div className="text-white font-mono text-sm break-all">
                                                {withdrawal.withdrawal_address}
                                            </div>
                                            {getCurrencyExplorer(withdrawal.currency, withdrawal.withdrawal_address) && (
                                                <a
                                                    href={getCurrencyExplorer(withdrawal.currency, withdrawal.withdrawal_address)!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1"
                                                >
                                                    View on Explorer <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>

                                        <div>
                                            <div className="text-sm text-slate-400 mb-1">Created</div>
                                            <div className="text-white text-sm">
                                                {new Date(withdrawal.created_at).toLocaleString()}
                                            </div>
                                            {withdrawal.processed_at && (
                                                <div className="text-xs text-slate-500">
                                                    Processed: {new Date(withdrawal.processed_at).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {withdrawal.rejection_reason && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
                                            <div className="text-sm font-bold text-red-400 mb-1">Rejection Reason:</div>
                                            <div className="text-sm text-red-300">{withdrawal.rejection_reason}</div>
                                        </div>
                                    )}

                                    {withdrawal.notes && (
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3">
                                            <div className="text-sm font-bold text-blue-400 mb-1">Notes:</div>
                                            <div className="text-sm text-blue-300">{withdrawal.notes}</div>
                                        </div>
                                    )}

                                    {withdrawal.tx_hash && (
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                            <div className="text-sm font-bold text-green-400 mb-1">Transaction Hash:</div>
                                            <div className="text-sm text-green-300 font-mono break-all">{withdrawal.tx_hash}</div>
                                            {withdrawal.tx_url && (
                                                <a
                                                    href={withdrawal.tx_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 mt-1"
                                                >
                                                    View Transaction <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {withdrawal.status === 'PENDING' && (
                                    <div className="flex flex-col gap-2 ml-4">
                                        <button
                                            onClick={() => {
                                                setSelectedWithdrawal(withdrawal);
                                                setShowApproveModal(true);
                                            }}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedWithdrawal(withdrawal);
                                                setShowRejectModal(true);
                                            }}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Approve Modal */}
            {showApproveModal && selectedWithdrawal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#131b2e] border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Approve Withdrawal</h2>

                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                            <div className="text-sm text-green-300 mb-2">
                                <strong>User:</strong> {selectedWithdrawal.users?.email}
                            </div>
                            <div className="text-sm text-green-300 mb-2">
                                <strong>Amount:</strong> {selectedWithdrawal.amount} {selectedWithdrawal.currency}
                            </div>
                            <div className="text-sm text-green-300">
                                <strong>Address:</strong> {selectedWithdrawal.withdrawal_address.slice(0, 20)}...
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                rows={3}
                                placeholder="Add any notes about this approval..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Approving...' : 'Confirm Approval'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setNotes('');
                                }}
                                disabled={processing}
                                className="px-6 py-3 bg-[#0b0f19] border border-white/10 text-white font-bold rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedWithdrawal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#131b2e] border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Reject Withdrawal</h2>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                            <div className="text-sm text-red-300 mb-2">
                                <strong>User:</strong> {selectedWithdrawal.users?.email}
                            </div>
                            <div className="text-sm text-red-300 mb-2">
                                <strong>Amount:</strong> {selectedWithdrawal.amount} {selectedWithdrawal.currency}
                            </div>
                            <div className="text-sm text-yellow-400 font-bold mt-3">
                                ⚠️ The user's balance will be refunded
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Rejection Reason *
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                rows={3}
                                placeholder="Explain why this withdrawal is being rejected..."
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleReject}
                                disabled={processing || !rejectionReason}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                disabled={processing}
                                className="px-6 py-3 bg-[#0b0f19] border border-white/10 text-white font-bold rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
