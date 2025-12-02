import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, DollarSign, Edit, Ban, Eye } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface User {
    id: string;
    username: string;
    email?: string;
    balance: number;
    created_at: string;
    banned?: boolean;
    banned_reason?: string;
    // These might not exist in the database
}

interface UserManagementProps {
    token: string;
    onViewUser: (userId: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ token, onViewUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Backend URL - check environment variable first, then try to detect Heroku
    // Set VITE_BACKEND_URL in your .env.local file with your Heroku URL
    // Example: VITE_BACKEND_URL=https://your-app.herokuapp.com
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchUsers();
    }, [page, search, sortBy, sortOrder]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search,
                sortBy,
                sortOrder
            });

            let response;
            try {
                if (!token) {
                    console.warn('No admin token available, using Supabase directly');
                    throw new Error('No token');
                }
                
                response = await fetch(`${BACKEND_URL}/api/admin/users?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    console.warn(`Backend API returned ${response.status}: ${response.statusText}`);
                    if (response.status === 401) {
                        console.warn('Authentication failed - token may be invalid or expired');
                    }
                    throw new Error(`Backend returned ${response.status}`);
                }
            } catch (fetchError) {
                console.warn('Backend API request failed:', fetchError);
                response = null;
            }

            if (response && response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
                setTotalPages(data.pagination?.pages || 1);
            } else {
                // If backend fails (401 or any error), try querying Supabase directly
                console.warn('Backend API failed, trying direct Supabase query...');
                console.log('Backend URL was:', BACKEND_URL, 'Response status:', response?.status);
                
                try {
                    const { supabase } = await import('../../services/supabaseClient');
                    
                    // Query users - only select columns that exist
                    let query = supabase
                        .from('users')
                        .select('id, username, balance, created_at', { count: 'exact' });
                    
                    if (search) {
                        query = query.ilike('username', `%${search}%`);
                    }
                    
                    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
                    query = query.range((page - 1) * 20, page * 20 - 1);
                    
                    const { data: usersData, error, count } = await query;
                    
                    if (error) {
                        console.error('Supabase query error:', error);
                        // Don't throw - just set empty array so UI doesn't break
                        setUsers([]);
                        setTotalPages(1);
                    } else {
                        setUsers(usersData || []);
                        setTotalPages(Math.ceil((count || 0) / 20));
                        console.log(`✅ Loaded ${usersData?.length || 0} users from Supabase`);
                    }
                } catch (supabaseError) {
                    console.error('Supabase fallback failed:', supabaseError);
                    // Keep existing users if available, don't clear them
                    if (users.length === 0) {
                        setUsers([]);
                        setTotalPages(1);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            // Show error to user
            setUsers([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                <p className="text-slate-400">Manage and monitor all platform users</p>
            </div>

            {/* Search and Filters */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by username, email, or ID..."
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#0b0f19] border-b border-white/10">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">
                                    <button
                                        onClick={() => handleSort('username')}
                                        className="flex items-center gap-2 hover:text-white transition-colors"
                                    >
                                        User
                                        <ChevronDown className={`w-4 h-4 transition-transform ${sortBy === 'username' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                                    </button>
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">ID</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">
                                    <button
                                        onClick={() => handleSort('balance')}
                                        className="flex items-center gap-2 hover:text-white transition-colors"
                                    >
                                        Balance
                                        <ChevronDown className={`w-4 h-4 transition-transform ${sortBy === 'balance' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                                    </button>
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">
                                    <button
                                        onClick={() => handleSort('created_at')}
                                        className="flex items-center gap-2 hover:text-white transition-colors"
                                    >
                                        Joined
                                        <ChevronDown className={`w-4 h-4 transition-transform ${sortBy === 'created_at' && sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                                    </button>
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-slate-400 uppercase">Status</th>
                                <th className="text-right px-6 py-4 text-sm font-bold text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                                    <span className="text-white font-bold">{user.username[0].toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{user.username}</div>
                                                    {user.email && <div className="text-xs text-slate-400">{user.email}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-400 font-mono">{user.id.slice(0, 12)}...</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white font-bold">${parseFloat(user.balance.toString()).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-400">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(user as any).banned ? (
                                                <div className="flex items-center gap-2">
                                                    <Ban className="w-4 h-4 text-red-400" />
                                                    <span className="text-red-400 font-bold text-sm">Banned</span>
                                                </div>
                                            ) : (
                                                <span className="text-green-400 font-medium text-sm">Active</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => onViewUser(user.id)}
                                                    className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
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
