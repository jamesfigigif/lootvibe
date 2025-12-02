import React, { useState, useEffect } from 'react';
import { Search, Filter, TruckIcon, Package, Edit, Save, X, MapPin, User } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface Shipment {
    id: string;
    user_id: string;
    items: any[];
    address: {
        fullName: string;
        street?: string;
        streetAddress?: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
    tracking_number?: string;
    created_at: number;
    username?: string; // Optional username for display
}

interface ShipmentManagementProps {
    token: string;
}

export const ShipmentManagement: React.FC<ShipmentManagementProps> = ({ token }) => {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [editTracking, setEditTracking] = useState('');
    const [saving, setSaving] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchShipments();
    }, [page, statusFilter]);

    const fetchShipments = async () => {
        try {
            setLoading(true);
            
            // Try backend API first if token is available
            let success = false;
            if (token) {
                try {
                    const params = new URLSearchParams({
                        page: page.toString(),
                        limit: '50'
                    });

                    if (statusFilter) params.append('status', statusFilter);

                    const response = await fetch(`${BACKEND_URL}/api/admin/shipments?${params}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setShipments(data.shipments);
                        setTotalPages(data.pagination.pages);
                        success = true;
                    } else {
                        console.warn(`Backend API failed with status ${response.status}, trying Supabase fallback...`);
                    }
                } catch (apiError) {
                    console.warn('Backend API request failed, trying Supabase fallback...', apiError);
                }
            }

            // Fallback to Supabase direct query
            if (!success) {
                console.log('Fetching shipments from Supabase...');
                
                let query = supabase
                    .from('shipments')
                    .select('id, user_id, items, address, status, tracking_number, created_at', { count: 'exact' })
                    .order('created_at', { ascending: false });

                if (statusFilter) {
                    query = query.eq('status', statusFilter);
                }

                // Apply pagination
                const limit = 50;
                const offset = (page - 1) * limit;
                query = query.range(offset, offset + limit - 1);

                const { data: shipmentsData, error: shipmentsError, count } = await query;

                if (shipmentsError) {
                    console.error('Supabase query error:', shipmentsError);
                    setShipments([]);
                    setTotalPages(1);
                    return;
                }

                // Fetch user information for each shipment
                const userIds = [...new Set(shipmentsData?.map(s => s.user_id) || [])];
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, username')
                    .in('id', userIds);

                const usersMap = new Map(usersData?.map(u => [u.id, u.username]) || []);

                // Format shipments to match expected structure
                const formattedShipments: Shipment[] = (shipmentsData || []).map(s => ({
                    id: s.id,
                    user_id: s.user_id,
                    items: s.items,
                    address: s.address,
                    status: s.status,
                    tracking_number: s.tracking_number || undefined,
                    created_at: s.created_at,
                    username: usersMap.get(s.user_id) || undefined
                }));

                setShipments(formattedShipments);
                setTotalPages(Math.ceil((count || 0) / limit));
            }
        } catch (error) {
            console.error('Error fetching shipments:', error);
            setShipments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (shipment: Shipment) => {
        setEditingId(shipment.id);
        setEditStatus(shipment.status);
        setEditTracking(shipment.tracking_number || '');
    };

    const handleSave = async (shipmentId: string) => {
        if (!editStatus) return;

        setSaving(true);
        try {
            // Try backend API first if token is available
            let success = false;
            if (token) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/admin/shipments/${shipmentId}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            status: editStatus,
                            tracking_number: editTracking || null
                        })
                    });

                    if (response.ok) {
                        success = true;
                    } else {
                        console.warn(`Backend API failed with status ${response.status}, trying Supabase fallback...`);
                    }
                } catch (apiError) {
                    console.warn('Backend API request failed, trying Supabase fallback...', apiError);
                }
            }

            // Fallback to Supabase direct update
            if (!success) {
                const updateData: any = { status: editStatus };
                if (editTracking) {
                    updateData.tracking_number = editTracking;
                } else {
                    updateData.tracking_number = null;
                }

                const { error: updateError } = await supabase
                    .from('shipments')
                    .update(updateData)
                    .eq('id', shipmentId);

                if (updateError) {
                    throw new Error('Failed to update shipment: ' + updateError.message);
                }
                success = true;
            }

            if (success) {
                setEditingId(null);
                setEditStatus('');
                setEditTracking('');
                await fetchShipments(); // Refresh the list
            }
        } catch (error) {
            console.error('Error saving shipment:', error);
            alert(`Failed to save shipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditStatus('');
        setEditTracking('');
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'PENDING': 'text-yellow-400 bg-yellow-500/20',
            'PROCESSING': 'text-blue-400 bg-blue-500/20',
            'SHIPPED': 'text-purple-400 bg-purple-500/20',
            'DELIVERED': 'text-green-400 bg-green-500/20'
        };
        return colors[status as keyof typeof colors] || 'text-slate-400 bg-slate-500/20';
    };

    const formatAddress = (address: Shipment['address']) => {
        const street = address.street || address.streetAddress || '';
        return `${street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
    };

    const getTotalValue = (items: any[]) => {
        return items.reduce((sum, item) => sum + (item.value || 0), 0);
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Shipment Management</h1>
                <p className="text-slate-400">Manage and track physical item shipments</p>
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
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Shipments List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-[#131b2e] border border-white/10 rounded-xl p-12 text-center text-slate-400">
                        Loading shipments...
                    </div>
                ) : shipments.length === 0 ? (
                    <div className="bg-[#131b2e] border border-white/10 rounded-xl p-12 text-center">
                        <TruckIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No shipments found</p>
                    </div>
                ) : (
                    shipments.map((shipment) => (
                        <div key={shipment.id} className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left: Shipment Info */}
                                <div className="lg:col-span-2">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-white">Shipment #{shipment.id.slice(0, 12)}</h3>
                                                <span className={`px-3 py-1 rounded-lg font-bold text-sm ${getStatusColor(shipment.status)}`}>
                                                    {shipment.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400">
                                                Created: {new Date(shipment.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        {editingId !== shipment.id && (
                                            <button
                                                onClick={() => handleEdit(shipment)}
                                                className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
                                                title="Edit Shipment"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Shipping Address */}
                                    <div className="bg-[#0b0f19] rounded-lg p-4 mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-bold text-slate-300">Shipping Address</span>
                                        </div>
                                        <div className="text-white">
                                            <div className="font-bold">{shipment.address.fullName}</div>
                                            <div className="text-sm text-slate-400 mt-1">
                                                {formatAddress(shipment.address)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="bg-[#0b0f19] rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Package className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-bold text-slate-300">
                                                Items ({shipment.items.length})
                                            </span>
                                            <span className="ml-auto text-green-400 font-bold">
                                                Total: ${getTotalValue(shipment.items).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {shipment.items.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between text-sm">
                                                    <span className="text-white">{item.name}</span>
                                                    <span className="text-slate-400">${item.value.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                                        <User className="w-4 h-4" />
                                        {shipment.username ? (
                                            <>
                                                <span>User: </span>
                                                <span className="text-white font-medium">{shipment.username}</span>
                                                <span className="text-slate-500">({shipment.user_id.slice(0, 12)}...)</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>User ID: </span>
                                                <span className="font-mono">{shipment.user_id.slice(0, 20)}...</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Edit Form or Tracking */}
                                <div>
                                    {editingId === shipment.id ? (
                                        <div className="bg-[#0b0f19] rounded-lg p-4">
                                            <h4 className="text-sm font-bold text-white mb-4">Update Shipment</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 mb-2">
                                                        Status
                                                    </label>
                                                    <select
                                                        value={editStatus}
                                                        onChange={(e) => setEditStatus(e.target.value)}
                                                        className="w-full bg-[#131b2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="PROCESSING">Processing</option>
                                                        <option value="SHIPPED">Shipped</option>
                                                        <option value="DELIVERED">Delivered</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 mb-2">
                                                        Tracking Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editTracking}
                                                        onChange={(e) => setEditTracking(e.target.value)}
                                                        className="w-full bg-[#131b2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                                                        placeholder="1Z999AA10123456784"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSave(shipment.id)}
                                                        disabled={saving}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors text-sm disabled:opacity-50"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg transition-colors text-sm"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[#0b0f19] rounded-lg p-4">
                                            <h4 className="text-sm font-bold text-white mb-3">Tracking Info</h4>
                                            {shipment.tracking_number ? (
                                                <div>
                                                    <div className="text-xs text-slate-400 mb-1">Tracking Number</div>
                                                    <div className="text-sm font-mono text-white bg-[#131b2e] px-3 py-2 rounded">
                                                        {shipment.tracking_number}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-400 text-center py-4">
                                                    No tracking number yet
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-[#131b2e] border border-white/10 rounded-lg text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-[#131b2e] border border-white/10 rounded-lg text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
