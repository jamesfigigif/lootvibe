import React, { useState, useEffect } from 'react';
import { Filter, Clock, User, Target, FileText, ChevronDown } from 'lucide-react';

interface ActivityLog {
    id: string;
    admin_id: string;
    action: string;
    target_type: string;
    target_id: string;
    details: any;
    ip_address: string;
    created_at: string;
    admin_users?: {
        email: string;
    };
}

interface ActivityLogsProps {
    token: string;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ token }) => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionFilter, setActionFilter] = useState('');
    const [targetTypeFilter, setTargetTypeFilter] = useState('');

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, targetTypeFilter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50'
            });

            if (actionFilter) params.append('action', actionFilter);
            if (targetTypeFilter) params.append('target_type', targetTypeFilter);

            const response = await fetch(`${BACKEND_URL}/api/admin/logs?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        const colors: Record<string, string> = {
            'USER_BANNED': 'text-red-400 bg-red-500/10',
            'USER_UNBANNED': 'text-green-400 bg-green-500/10',
            'BALANCE_ADJUSTMENT': 'text-blue-400 bg-blue-500/10',
            'SHIPMENT_UPDATE': 'text-purple-400 bg-purple-500/10',
            'LOGIN': 'text-slate-400 bg-slate-500/10'
        };
        return colors[action] || 'text-slate-400 bg-slate-500/10';
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const getActionIcon = (action: string) => {
        if (action.includes('BAN')) return '🚫';
        if (action.includes('BALANCE')) return '💰';
        if (action.includes('SHIPMENT')) return '📦';
        if (action.includes('LOGIN')) return '🔐';
        return '📝';
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Activity Logs</h1>
                <p className="text-slate-400">View and monitor all admin actions</p>
            </div>

            {/* Filters */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-white">Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Action Type</label>
                        <select
                            value={actionFilter}
                            onChange={(e) => {
                                setActionFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All Actions</option>
                            <option value="LOGIN">Login</option>
                            <option value="USER_BANNED">User Banned</option>
                            <option value="USER_UNBANNED">User Unbanned</option>
                            <option value="BALANCE_ADJUSTMENT">Balance Adjustment</option>
                            <option value="SHIPMENT_UPDATE">Shipment Update</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Target Type</label>
                        <select
                            value={targetTypeFilter}
                            onChange={(e) => {
                                setTargetTypeFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All Types</option>
                            <option value="USER">User</option>
                            <option value="SHIPMENT">Shipment</option>
                            <option value="DEPOSIT">Deposit</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        Loading activity logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        No activity logs found
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {logs.map((log) => (
                            <div key={log.id} className="p-6 hover:bg-white/5 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="text-2xl">{getActionIcon(log.action)}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getActionColor(log.action)}`}>
                                                {formatAction(log.action)}
                                            </span>
                                            <span className="text-slate-400 text-sm font-mono">
                                                {log.admin_users?.email || log.admin_id}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Target className="w-4 h-4" />
                                                <span>
                                                    <span className="text-slate-500">Target:</span> {log.target_type} ({log.target_id.slice(0, 12)}...)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <User className="w-4 h-4" />
                                                <span>
                                                    <span className="text-slate-500">IP:</span> {log.ip_address}
                                                </span>
                                            </div>
                                        </div>
                                        {log.details && Object.keys(log.details).length > 0 && (
                                            <div className="mt-3 p-3 bg-[#0b0f19] rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FileText className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-300">Details</span>
                                                </div>
                                                <pre className="text-xs text-slate-400 font-mono overflow-x-auto">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
