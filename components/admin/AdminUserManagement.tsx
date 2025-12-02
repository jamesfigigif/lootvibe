import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, Mail, Calendar, Key } from 'lucide-react';

interface AdminUser {
    id: string;
    email: string;
    role: 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT';
    two_fa_enabled: boolean;
    last_login?: string;
    created_at: string;
}

interface AdminUserManagementProps {
    token: string;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ token }) => {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        email: '',
        password: '',
        role: 'MODERATOR' as AdminUser['role']
    });

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BACKEND_URL}/api/admin/admins`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch admin users');
            }

            const data = await response.json();
            setAdmins(data.admins || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
            alert('Failed to load admin users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async () => {
        if (!newAdmin.email || !newAdmin.password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/admins`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: newAdmin.email,
                    password: newAdmin.password,
                    role: newAdmin.role
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create admin');
            }

            alert('Admin user created successfully!');
            setShowCreateModal(false);
            setNewAdmin({ email: '', password: '', role: 'MODERATOR' });
            fetchAdmins();
        } catch (error: any) {
            console.error('Error creating admin:', error);
            alert(error.message || 'Failed to create admin user');
        }
    };

    const handleDeleteAdmin = async (adminId: string, email: string) => {
        if (!confirm(`Are you sure you want to delete admin account: ${email}?`)) {
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/admins/${adminId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete admin');
            }

            alert('Admin user deleted successfully');
            fetchAdmins();
        } catch (error: any) {
            console.error('Error deleting admin:', error);
            alert(error.message || 'Failed to delete admin user');
        }
    };

    const getRoleColor = (role: string) => {
        const colors = {
            'SUPER_ADMIN': 'text-purple-400 bg-purple-500/20',
            'MODERATOR': 'text-blue-400 bg-blue-500/20',
            'SUPPORT': 'text-green-400 bg-green-500/20'
        };
        return colors[role as keyof typeof colors] || 'text-slate-400 bg-slate-500/20';
    };

    const getRoleBadgeIcon = (role: string) => {
        if (role === 'SUPER_ADMIN') return '👑';
        if (role === 'MODERATOR') return '🛡️';
        return '💬';
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Users</h1>
                    <p className="text-slate-400">Manage admin accounts and permissions</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Create Admin
                </button>
            </div>

            {/* Admins List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-[#131b2e] border border-white/10 rounded-xl p-12 text-center text-slate-400">
                        Loading admin users...
                    </div>
                ) : (
                    admins.map((admin) => (
                        <div key={admin.id} className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">
                                            {admin.email[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-white">{admin.email}</h3>
                                            <span className={`px-3 py-1 rounded-lg font-bold text-sm ${getRoleColor(admin.role)}`}>
                                                {getRoleBadgeIcon(admin.role)} {admin.role}
                                            </span>
                                            {admin.two_fa_enabled && (
                                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg font-bold text-sm flex items-center gap-1">
                                                    <Shield className="w-3 h-3" />
                                                    2FA
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Joined {new Date(admin.created_at).toLocaleDateString()}
                                            </div>
                                            {admin.last_login && (
                                                <div className="flex items-center gap-1">
                                                    <Key className="w-4 h-4" />
                                                    Last login {new Date(admin.last_login).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
                                        title="Edit Admin"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    {admin.role !== 'SUPER_ADMIN' && (
                                        <button
                                            onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                                            title="Delete Admin"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Admin Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#131b2e] border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Create Admin Account</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-white transition-colors text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="admin@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                    className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                    placeholder="Min 8 characters"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">
                                    Role
                                </label>
                                <select
                                    value={newAdmin.role}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as AdminUser['role'] })}
                                    className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                >
                                    <option value="SUPPORT">Support (Limited access)</option>
                                    <option value="MODERATOR">Moderator (Most features)</option>
                                    <option value="SUPER_ADMIN">Super Admin (Full access)</option>
                                </select>
                                <div className="mt-2 text-xs text-slate-500">
                                    {newAdmin.role === 'SUPER_ADMIN' && '⚠️ Full access to all features including settings'}
                                    {newAdmin.role === 'MODERATOR' && '✓ Can manage users, boxes, deposits, and shipments'}
                                    {newAdmin.role === 'SUPPORT' && '✓ Can view and assist with user issues'}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={handleCreateAdmin}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-lg transition-all"
                                >
                                    Create Admin
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-3 bg-[#0b0f19] border border-white/10 text-white font-bold rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Permissions Info */}
            <div className="mt-8 bg-[#131b2e] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Role Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">👑</span>
                            <div className="text-white font-bold">SUPER_ADMIN</div>
                        </div>
                        <ul className="space-y-1 text-sm text-slate-400">
                            <li>• Full system access</li>
                            <li>• Manage all users & admins</li>
                            <li>• Configure platform settings</li>
                            <li>• View all analytics</li>
                            <li>• Cannot be deleted</li>
                        </ul>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">🛡️</span>
                            <div className="text-white font-bold">MODERATOR</div>
                        </div>
                        <ul className="space-y-1 text-sm text-slate-400">
                            <li>• Manage users & boxes</li>
                            <li>• Process deposits</li>
                            <li>• Update shipments</li>
                            <li>• View analytics</li>
                            <li>• No settings access</li>
                        </ul>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">💬</span>
                            <div className="text-white font-bold">SUPPORT</div>
                        </div>
                        <ul className="space-y-1 text-sm text-slate-400">
                            <li>• View users</li>
                            <li>• Verify deposits</li>
                            <li>• Update shipments</li>
                            <li>• Limited access</li>
                            <li>• Read-only analytics</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
