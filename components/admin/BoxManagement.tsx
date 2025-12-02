import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, BarChart3, Eye, Power, Trash2, Filter, Package, AlertCircle, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface Box {
    id: string;
    name: string;
    description: string;
    price: number;
    sale_price?: number;
    image: string;
    color: string;
    category: string;
    tags?: string[];
    items: any[];
    enabled: boolean;
    created_at: string;
}

interface BoxManagementProps {
    token: string;
    onCreateBox: () => void;
    onEditBox: (boxId: string) => void;
    onViewStats: (boxId: string) => void;
}

export const BoxManagement: React.FC<BoxManagementProps> = ({ token, onCreateBox, onEditBox, onViewStats }) => {
    const [boxes, setBoxes] = useState<Box[]>([]);

    // Calculate profitability for a box
    const calculateProfitability = (box: Box): number => {
        if (!box.items || box.items.length === 0 || !box.price) return 0;
        
        // Calculate expected value: sum of (item.value * item.odds / 100)
        const expectedValue = box.items.reduce((sum: number, item: any) => {
            const value = item.value || 0;
            const odds = item.odds || 0;
            return sum + (value * odds / 100);
        }, 0);
        
        // Profitability = (box price - expected value) / box price * 100
        const profitability = ((box.price - expectedValue) / box.price) * 100;
        return profitability;
    };

    // Get profitability color based on value
    const getProfitabilityColor = (profitability: number): string => {
        if (profitability >= 50) return 'text-green-400 bg-green-500/20 border-green-500/30';
        if (profitability >= 30) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
        if (profitability >= 0) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
        return 'text-red-400 bg-red-500/20 border-red-500/30';
    };
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [enabledFilter, setEnabledFilter] = useState<string>('');
    const [expandedBoxes, setExpandedBoxes] = useState<Set<string>>(new Set());
    const [editingOdds, setEditingOdds] = useState<string | null>(null);
    const [tempOdds, setTempOdds] = useState<{ [itemId: string]: number }>({});
    const [addingItem, setAddingItem] = useState<string | null>(null);
    const [newItem, setNewItem] = useState<{
        name: string;
        image: string;
        value: number;
        rarity: string;
        odds: number;
    }>({
        name: '',
        image: '',
        value: 0,
        rarity: 'COMMON',
        odds: 0
    });

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    const categories = ['ALL', 'STREETWEAR', 'TECH', 'POKEMON', 'GIFT_CARDS', 'GAME_CODES', 'FOOD', 'SUBSCRIPTIONS', 'CRYPTO'];

    useEffect(() => {
        fetchBoxes();
    }, [page, search, categoryFilter, enabledFilter]);

    // Test Supabase connection on mount
    useEffect(() => {
        const testConnection = async () => {
            try {
                console.log('🔍 [BoxManagement] Testing Supabase connection...');
                const { count, error } = await supabase
                    .from('boxes')
                    .select('*', { count: 'exact', head: true });
                
                if (error) {
                    console.error('❌ [BoxManagement] Supabase boxes table access error:', error);
                    console.error('Error details:', JSON.stringify(error, null, 2));
                } else {
                    console.log(`✅ [BoxManagement] Supabase connection OK. Total boxes in database: ${count || 0}`);
                    if (count === 0) {
                        console.warn('⚠️ [BoxManagement] No boxes found in database. You may need to create boxes first.');
                    }
                }
            } catch (err) {
                console.error('❌ [BoxManagement] Supabase connection test failed:', err);
            }
        };
        testConnection();
    }, []);

    const fetchBoxesFromSupabase = async () => {
        try {
            console.log('🔍 [BoxManagement] Fetching boxes from Supabase...', { page, search, categoryFilter, enabledFilter });
            const limit = 20;
            const offset = (page - 1) * limit;

            // First, try a simple query without filters to see if we can access the table
            console.log('🔍 [BoxManagement] Testing basic Supabase access...');
            const { count: totalCount, error: countError } = await supabase
                .from('boxes')
                .select('*', { count: 'exact', head: true });
            
            if (countError) {
                console.error('❌ [BoxManagement] Cannot access boxes table:', countError);
                setError(`Database access error: ${countError.message}`);
                setBoxes([]);
                return;
            }
            
            console.log(`✅ [BoxManagement] Found ${totalCount || 0} total boxes in database`);

            // Now build the filtered query
            let query = supabase
                .from('boxes')
                .select('*', { count: 'exact' });

            // Search by name or ID
            if (search) {
                query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
            }

            // Filter by category
            if (categoryFilter && categoryFilter !== 'ALL') {
                query = query.eq('category', categoryFilter);
            }

            // Filter by enabled status - try both 'enabled' and 'active' fields
            if (enabledFilter !== '') {
                const enabledValue = enabledFilter === 'true';
                // Try 'enabled' first, but if that fails, we'll handle it
                query = query.eq('enabled', enabledValue);
            }

            // Sort and paginate
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            console.log('🔍 [BoxManagement] Executing filtered query...');
            const { data, error: queryError, count } = await query;

            if (queryError) {
                console.error('❌ [BoxManagement] Supabase query error:', queryError);
                // If 'enabled' field doesn't exist, try 'active' instead
                if (queryError.message?.includes('enabled') || queryError.code === 'PGRST116' || queryError.message?.includes('column') && queryError.message?.includes('enabled')) {
                    console.log('🔄 [BoxManagement] Retrying with "active" field instead of "enabled"...');
                    let retryQuery = supabase
                        .from('boxes')
                        .select('*', { count: 'exact' });

                    if (search) {
                        retryQuery = retryQuery.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
                    }

                    if (categoryFilter && categoryFilter !== 'ALL') {
                        retryQuery = retryQuery.eq('category', categoryFilter);
                    }

                    if (enabledFilter !== '') {
                        retryQuery = retryQuery.eq('active', enabledFilter === 'true');
                    }

                    retryQuery = retryQuery
                        .order('created_at', { ascending: false })
                        .range(offset, offset + limit - 1);

                    const { data: retryData, error: retryError, count: retryCount } = await retryQuery;
                    
                    if (retryError) {
                        throw retryError;
                    }

                    const normalizedBoxes = (retryData || []).map((box: any) => ({
                        ...box,
                        image: box.image || box.image_url || '',
                        enabled: box.enabled !== undefined ? box.enabled : (box.active !== undefined ? box.active : true)
                    }));

                    console.log(`✅ [BoxManagement] Found ${normalizedBoxes.length} boxes (using 'active' field, total: ${retryCount || 0})`);
                    setBoxes(normalizedBoxes);
                    setTotalPages(Math.ceil((retryCount || 0) / limit));
                    setError('');
                    return;
                }
                console.error('❌ [BoxManagement] Query failed and cannot retry:', queryError);
                setError(`Failed to load boxes: ${queryError.message || 'Database query error'}`);
                setBoxes([]);
                return;
            }

            // Normalize box data - handle both 'image'/'image_url' and 'enabled'/'active' fields
            const normalizedBoxes = (data || []).map((box: any) => ({
                ...box,
                image: box.image || box.image_url || '',
                enabled: box.enabled !== undefined ? box.enabled : (box.active !== undefined ? box.active : true)
            }));

            console.log(`✅ [BoxManagement] Successfully loaded ${normalizedBoxes.length} boxes (total in DB: ${count || 0}, page ${page} of ${Math.ceil((count || 0) / limit)})`);
            if (normalizedBoxes.length === 0 && (count || 0) > 0) {
                console.warn('⚠️ [BoxManagement] No boxes on this page, but there are boxes in the database');
            }
            setBoxes(normalizedBoxes);
            setTotalPages(Math.ceil((count || 0) / limit));
            setError('');
        } catch (err: any) {
            console.error('❌ [BoxManagement] Error fetching boxes from Supabase:', err);
            setError(`Failed to load boxes: ${err.message || 'Unknown error'}`);
            setBoxes([]);
        }
    };

    const fetchBoxes = async () => {
        try {
            setLoading(true);
            setError('');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search
            });

            if (categoryFilter) params.append('category', categoryFilter);
            if (enabledFilter) params.append('enabled', enabledFilter);

            const response = await fetch(`${BACKEND_URL}/api/admin/boxes?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Normalize box data - handle both 'image'/'image_url' and 'enabled'/'active' fields
                const normalizedBoxes = (data.boxes || []).map((box: any) => ({
                    ...box,
                    image: box.image || box.image_url || '',
                    enabled: box.enabled !== undefined ? box.enabled : (box.active !== undefined ? box.active : true)
                }));
                setBoxes(normalizedBoxes);
                setTotalPages(data.pagination?.pages || 1);
                setError('');
            } else {
                // If backend fails, try fetching directly from Supabase
                const errorData = await response.json().catch(() => ({}));
                console.warn('Backend API failed, falling back to Supabase:', errorData);
                await fetchBoxesFromSupabase();
            }
        } catch (error: any) {
            console.error('Error fetching boxes from backend:', error);
            // Fallback to Supabase if backend is unavailable
            console.log('Attempting to fetch boxes directly from Supabase...');
            await fetchBoxesFromSupabase();
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEnabled = async (boxId: string) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/boxes/${boxId}/toggle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchBoxes();
            } else {
                // Fallback: update directly in Supabase
                const box = boxes.find(b => b.id === boxId);
                if (box) {
                    const { error } = await supabase
                        .from('boxes')
                        .update({ enabled: !box.enabled })
                        .eq('id', boxId);
                    
                    if (!error) {
                        fetchBoxes();
                    } else {
                        console.error('Error toggling box:', error);
                        setError('Failed to toggle box status');
                    }
                }
            }
        } catch (error) {
            console.error('Error toggling box:', error);
            // Fallback: update directly in Supabase
            const box = boxes.find(b => b.id === boxId);
            if (box) {
                const { error } = await supabase
                    .from('boxes')
                    .update({ enabled: !box.enabled })
                    .eq('id', boxId);
                
                if (!error) {
                    fetchBoxes();
                } else {
                    setError('Failed to toggle box status');
                }
            }
        }
    };

    const handleDeleteBox = async (boxId: string, boxName: string) => {
        if (!confirm(`Are you sure you want to delete "${boxName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/boxes/${boxId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchBoxes();
            } else {
                // Fallback: delete directly from Supabase
                const { error } = await supabase
                    .from('boxes')
                    .delete()
                    .eq('id', boxId);
                
                if (!error) {
                    fetchBoxes();
                } else {
                    console.error('Error deleting box:', error);
                    setError('Failed to delete box');
                }
            }
        } catch (error) {
            console.error('Error deleting box:', error);
            // Fallback: delete directly from Supabase
            const { error: deleteError } = await supabase
                .from('boxes')
                .delete()
                .eq('id', boxId);
            
            if (!deleteError) {
                fetchBoxes();
            } else {
                setError('Failed to delete box');
            }
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Box Management</h1>
                    <p className="text-slate-400">Create and manage loot boxes</p>
                    {boxes.length === 0 && !loading && (
                        <p className="text-yellow-400 text-sm mt-2">
                            ⚠️ No boxes found. Click "Create Box" to add your first box, or check if boxes need to be migrated from constants.ts
                        </p>
                    )}
                </div>
                <button
                    onClick={onCreateBox}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Create Box
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-white">Search & Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by name or ID..."
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={enabledFilter}
                            onChange={(e) => {
                                setEnabledFilter(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="true">Enabled Only</option>
                            <option value="false">Disabled Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400">{error}</p>
                    <button
                        onClick={() => setError('')}
                        className="ml-auto text-red-400 hover:text-red-300"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Boxes Grid */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        Loading boxes...
                    </div>
                ) : boxes.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 mb-2">No boxes found</p>
                        {error && (
                            <p className="text-red-400 text-sm mb-4">{error}</p>
                        )}
                        {!error && (
                            <p className="text-slate-500 text-sm mb-4">
                                {search || categoryFilter || enabledFilter 
                                    ? 'No boxes match your filters. Try adjusting your search criteria.'
                                    : 'Your database appears to be empty. Create your first box to get started!'}
                            </p>
                        )}
                        <button
                            onClick={onCreateBox}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
                        >
                            Create Your First Box
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
                        {boxes.map((box) => (
                            <div
                                key={box.id}
                                className={`bg-[#0b0f19] border rounded-xl overflow-hidden transition-all ${
                                    box.enabled ? 'border-white/10 hover:border-purple-500/50' : 'border-red-500/30 opacity-60'
                                }`}
                            >
                                <div className="flex gap-4 p-4">
                                    {/* Box Image */}
                                    <div className={`w-24 h-24 rounded-lg bg-gradient-to-br ${box.color} flex items-center justify-center flex-shrink-0`}>
                                        {box.image ? (
                                            <img src={box.image} alt={box.name} className="w-16 h-16 object-contain" />
                                        ) : (
                                            <Package className="w-12 h-12 text-white" />
                                        )}
                                    </div>

                                    {/* Box Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-white truncate">{box.name}</h3>
                                                <p className="text-sm text-slate-400 truncate">{box.description || 'No description'}</p>
                                            </div>
                                            {!box.enabled && (
                                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded">
                                                    DISABLED
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mb-3 text-sm">
                                            <div>
                                                <span className="text-slate-400">Price: </span>
                                                <span className="text-white font-bold">
                                                    ${box.price.toFixed(2)}
                                                    {box.sale_price && (
                                                        <span className="ml-2 text-green-400">${box.sale_price.toFixed(2)}</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Items: </span>
                                                <span className="text-white font-bold">{box.items?.length || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Total Odds: </span>
                                                <span className={`font-bold ${
                                                    (box.items || []).reduce((sum: number, item: any) => sum + (item.odds || 0), 0) === 100 
                                                        ? 'text-green-400' 
                                                        : 'text-red-400'
                                                }`}>
                                                    {((box.items || []).reduce((sum: number, item: any) => sum + (item.odds || 0), 0)).toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Profitability Label */}
                                        {box.items && box.items.length > 0 && (
                                            <div className="mb-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${getProfitabilityColor(calculateProfitability(box))}`}>
                                                    Profitability: {calculateProfitability(box).toFixed(1)}%
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded">
                                                {box.category}
                                            </span>
                                            {box.tags?.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Items Dropdown Toggle */}
                                <div className="border-t border-white/10 px-4 py-2">
                                    <button
                                        onClick={() => {
                                            const newExpanded = new Set(expandedBoxes);
                                            if (newExpanded.has(box.id)) {
                                                newExpanded.delete(box.id);
                                                setEditingOdds(null);
                                                setAddingItem(null);
                                            } else {
                                                newExpanded.add(box.id);
                                            }
                                            setExpandedBoxes(newExpanded);
                                        }}
                                        className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-white transition-colors"
                                    >
                                        <span className="font-bold">
                                            {expandedBoxes.has(box.id) ? 'Hide' : 'Show'} Items ({box.items?.length || 0})
                                        </span>
                                        {expandedBoxes.has(box.id) ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {/* Items List (Expanded) */}
                                {expandedBoxes.has(box.id) && (
                                    <div className="border-t border-white/10 p-4 bg-[#0a0e17] max-h-96 overflow-y-auto">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-white">Items & Odds</h4>
                                            <div className="flex gap-2">
                                                {!addingItem && (
                                                    <button
                                                        onClick={() => {
                                                            setAddingItem(box.id);
                                                            setEditingOdds(null); // Close odds editor if open
                                                            setNewItem({
                                                                name: '',
                                                                image: '',
                                                                value: 0,
                                                                rarity: 'COMMON',
                                                                odds: 0
                                                            });
                                                        }}
                                                        className="text-xs px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded transition-colors flex items-center gap-1"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add Item
                                                    </button>
                                                )}
                                                {editingOdds === box.id && (
                                                    <button
                                                        onClick={() => {
                                                            // Distribute odds evenly
                                                            const evenOdds = 100 / box.items.length;
                                                            const newOdds: { [key: string]: number } = {};
                                                            box.items.forEach((item: any) => {
                                                                newOdds[item.id || item.name] = evenOdds;
                                                            });
                                                            setTempOdds(newOdds);
                                                        }}
                                                        className="text-xs px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-colors"
                                                        title="Distribute odds evenly"
                                                    >
                                                        Distribute Evenly
                                                    </button>
                                                )}
                                                {!addingItem && box.items && box.items.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingOdds(editingOdds === box.id ? null : box.id);
                                                            if (editingOdds !== box.id) {
                                                                // Initialize temp odds
                                                                const odds: { [key: string]: number } = {};
                                                                box.items.forEach((item: any) => {
                                                                    odds[item.id || item.name] = item.odds || 0;
                                                                });
                                                                setTempOdds(odds);
                                                            } else {
                                                                setTempOdds({});
                                                            }
                                                        }}
                                                        className="text-xs px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded transition-colors"
                                                    >
                                                        {editingOdds === box.id ? 'Cancel Edit' : 'Edit Odds'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Add Item Form */}
                                        {addingItem === box.id && (
                                            <div className="mb-4 p-4 bg-[#0b0f19] border-2 border-green-500/30 rounded-lg">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h5 className="text-sm font-bold text-white">Add New Item</h5>
                                                    <button
                                                        onClick={() => {
                                                            setAddingItem(null);
                                                            setNewItem({
                                                                name: '',
                                                                image: '',
                                                                value: 0,
                                                                rarity: 'COMMON',
                                                                odds: 0
                                                            });
                                                        }}
                                                        className="text-slate-400 hover:text-white"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 mb-1">Item Name *</label>
                                                        <input
                                                            type="text"
                                                            value={newItem.name}
                                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                                            className="w-full bg-[#131b2e] border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none"
                                                            placeholder="e.g., iPhone 15 Pro"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 mb-1">Image URL</label>
                                                        <input
                                                            type="text"
                                                            value={newItem.image}
                                                            onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                                                            className="w-full bg-[#131b2e] border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none"
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 mb-1">Value ($) *</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={newItem.value}
                                                            onChange={(e) => setNewItem({ ...newItem, value: parseFloat(e.target.value) || 0 })}
                                                            className="w-full bg-[#131b2e] border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none"
                                                            placeholder="999.99"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 mb-1">Odds (%) *</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={newItem.odds}
                                                            onChange={(e) => setNewItem({ ...newItem, odds: parseFloat(e.target.value) || 0 })}
                                                            className="w-full bg-[#131b2e] border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none"
                                                            placeholder="25.00"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-slate-400 mb-1">Rarity</label>
                                                        <div className="flex gap-2">
                                                            {['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'].map(rarity => (
                                                                <button
                                                                    key={rarity}
                                                                    type="button"
                                                                    onClick={() => setNewItem({ ...newItem, rarity })}
                                                                    className={`px-3 py-2 rounded-lg font-bold text-xs transition-colors ${
                                                                        newItem.rarity === rarity
                                                                            ? 'bg-green-600 text-white'
                                                                            : 'bg-[#131b2e] border border-white/10 text-slate-400'
                                                                    }`}
                                                                >
                                                                    {rarity}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            if (!newItem.name || newItem.value <= 0 || newItem.odds <= 0) {
                                                                setError('Please fill in all required fields (name, value > 0, odds > 0)');
                                                                return;
                                                            }

                                                            try {
                                                                const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                                                                const newItemData = {
                                                                    id: itemId,
                                                                    name: newItem.name,
                                                                    image: newItem.image,
                                                                    value: newItem.value,
                                                                    rarity: newItem.rarity,
                                                                    odds: newItem.odds
                                                                };

                                                                const updatedItems = [...box.items, newItemData];

                                                                const { error } = await supabase
                                                                    .from('boxes')
                                                                    .update({ items: updatedItems })
                                                                    .eq('id', box.id);

                                                                if (error) throw error;

                                                                // Update local state
                                                                setBoxes(boxes.map(b => 
                                                                    b.id === box.id 
                                                                        ? { ...b, items: updatedItems }
                                                                        : b
                                                                ));
                                                                setAddingItem(null);
                                                                setNewItem({
                                                                    name: '',
                                                                    image: '',
                                                                    value: 0,
                                                                    rarity: 'COMMON',
                                                                    odds: 0
                                                                });
                                                                setError('');
                                                            } catch (err: any) {
                                                                console.error('Error adding item:', err);
                                                                setError(`Failed to add item: ${err.message}`);
                                                            }
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-sm font-bold"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add Item
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {(!box.items || box.items.length === 0) && !addingItem && (
                                            <div className="text-center py-8 text-slate-500 text-sm">
                                                <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                                                <p>No items in this box</p>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {box.items && box.items.map((item: any, idx: number) => {
                                                const itemKey = item.id || item.name || idx;
                                                const isEditing = editingOdds === box.id;
                                                const currentOdds = isEditing ? (tempOdds[itemKey] ?? item.odds ?? 0) : (item.odds ?? 0);
                                                
                                                return (
                                                    <div
                                                        key={itemKey}
                                                        className="bg-[#0b0f19] border border-white/5 rounded-lg p-3 flex items-center gap-3"
                                                    >
                                                        {/* Item Image */}
                                                        <div className="w-12 h-12 rounded-lg bg-[#131b2e] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                                            ) : (
                                                                <Package className="w-6 h-6 text-slate-600" />
                                                            )}
                                                        </div>
                                                        
                                                        {/* Item Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-bold text-white truncate">{item.name || 'Unnamed Item'}</span>
                                                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                                                    item.rarity === 'LEGENDARY' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                    item.rarity === 'EPIC' ? 'bg-pink-500/20 text-pink-400' :
                                                                    item.rarity === 'RARE' ? 'bg-purple-500/20 text-purple-400' :
                                                                    item.rarity === 'UNCOMMON' ? 'bg-blue-500/20 text-blue-400' :
                                                                    'bg-slate-500/20 text-slate-400'
                                                                }`}>
                                                                    {item.rarity || 'COMMON'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                                <span>Value: <span className="text-green-400 font-bold">${(item.value || 0).toFixed(2)}</span></span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Odds Display/Editor */}
                                                        <div className="flex items-center gap-2">
                                                            {isEditing ? (
                                                                <>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        max="100"
                                                                        value={currentOdds}
                                                                        onChange={(e) => {
                                                                            const newOdds = parseFloat(e.target.value) || 0;
                                                                            setTempOdds({ ...tempOdds, [itemKey]: newOdds });
                                                                        }}
                                                                        className="w-20 bg-[#131b2e] border border-white/10 rounded px-2 py-1 text-white text-sm focus:border-purple-500 focus:outline-none"
                                                                        placeholder="0.00"
                                                                    />
                                                                    <span className="text-xs text-slate-500">%</span>
                                                                </>
                                                            ) : (
                                                                <div className="text-right">
                                                                    <div className="text-lg font-bold text-purple-400">{currentOdds.toFixed(2)}%</div>
                                                                    <div className="text-xs text-slate-500">odds</div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Delete Item Button (when editing odds) */}
                                                        {isEditing && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (!confirm(`Delete "${item.name}"?`)) return;

                                                                    try {
                                                                        const updatedItems = box.items.filter((it: any) => {
                                                                            const itKey = it.id || it.name;
                                                                            return itKey !== itemKey;
                                                                        });

                                                                        const { error } = await supabase
                                                                            .from('boxes')
                                                                            .update({ items: updatedItems })
                                                                            .eq('id', box.id);

                                                                        if (error) throw error;

                                                                        // Update local state
                                                                        setBoxes(boxes.map(b => 
                                                                            b.id === box.id 
                                                                                ? { ...b, items: updatedItems }
                                                                                : b
                                                                        ));
                                                                        
                                                                        // Update temp odds
                                                                        const newTempOdds = { ...tempOdds };
                                                                        delete newTempOdds[itemKey];
                                                                        setTempOdds(newTempOdds);
                                                                    } catch (err: any) {
                                                                        console.error('Error deleting item:', err);
                                                                        setError(`Failed to delete item: ${err.message}`);
                                                                    }
                                                                }}
                                                                className="p-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
                                                                title="Delete item"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Save Odds Button */}
                                        {editingOdds === box.id && (
                                            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                                <div className="text-sm">
                                                    <span className="text-slate-400">Total: </span>
                                                    <span className={`font-bold ${
                                                        Object.values(tempOdds).reduce((sum: number, odds: number) => sum + odds, 0) === 100
                                                            ? 'text-green-400'
                                                            : 'text-red-400'
                                                    }`}>
                                                        {Object.values(tempOdds).reduce((sum: number, odds: number) => sum + odds, 0).toFixed(2)}%
                                                    </span>
                                                    <span className="text-slate-500"> / 100%</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            // Save odds
                                                            const updatedItems = box.items.map((item: any) => {
                                                                const itemKey = item.id || item.name;
                                                                return {
                                                                    ...item,
                                                                    odds: tempOdds[itemKey] ?? item.odds ?? 0
                                                                };
                                                            });

                                                            try {
                                                                const { error } = await supabase
                                                                    .from('boxes')
                                                                    .update({ items: updatedItems })
                                                                    .eq('id', box.id);

                                                                if (error) throw error;

                                                                // Update local state
                                                                setBoxes(boxes.map(b => 
                                                                    b.id === box.id 
                                                                        ? { ...b, items: updatedItems }
                                                                        : b
                                                                ));
                                                                setEditingOdds(null);
                                                                setTempOdds({});
                                                            } catch (err: any) {
                                                                console.error('Error updating odds:', err);
                                                                setError(`Failed to update odds: ${err.message}`);
                                                            }
                                                        }}
                                                        disabled={Math.abs(Object.values(tempOdds).reduce((sum: number, odds: number) => sum + odds, 0) - 100) > 0.1}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Save className="w-3 h-3" />
                                                        Save Odds
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingOdds(null);
                                                            setTempOdds({});
                                                        }}
                                                        className="px-3 py-1.5 bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 rounded-lg transition-colors text-sm font-bold"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="border-t border-white/10 p-3 flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onViewStats(box.id)}
                                        className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                                        title="View Statistics"
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onEditBox(box.id)}
                                        className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
                                        title="Edit Box"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleEnabled(box.id)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            box.enabled
                                                ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                                                : 'bg-slate-600/20 hover:bg-slate-600/30 text-slate-400'
                                        }`}
                                        title={box.enabled ? 'Disable Box' : 'Enable Box'}
                                    >
                                        <Power className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBox(box.id, box.name)}
                                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                                        title="Delete Box"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
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
