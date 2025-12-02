import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, ArrowLeft, AlertCircle, Package } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { supabase } from '../../services/supabaseClient';

interface LootItem {
    id: string;
    name: string;
    image: string;
    value: number;
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    odds: number;
}

interface BoxFormProps {
    token: string;
    boxId?: string; // If provided, edit mode
    onBack: () => void;
    onSuccess: () => void;
}

export const BoxForm: React.FC<BoxFormProps> = ({ token, boxId, onBack, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Box fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [image, setImage] = useState('');
    const [color, setColor] = useState('from-purple-600 to-purple-900');
    const [category, setCategory] = useState('ALL');
    const [tags, setTags] = useState<string[]>([]);
    const [items, setItems] = useState<LootItem[]>([]);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    const categories = ['ALL', 'STREETWEAR', 'TECH', 'POKEMON', 'GIFT_CARDS', 'GAME_CODES', 'FOOD', 'SUBSCRIPTIONS', 'CRYPTO'];
    const availableTags = ['HOT', 'NEW', 'FEATURED', 'SALE'];
    const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
    const gradients = [
        'from-purple-600 to-purple-900',
        'from-blue-600 to-blue-900',
        'from-red-600 to-red-900',
        'from-green-600 to-green-900',
        'from-yellow-600 to-yellow-900',
        'from-pink-600 to-pink-900',
        'from-indigo-600 to-indigo-900',
        'from-orange-600 to-orange-900'
    ];

    useEffect(() => {
        if (boxId) {
            fetchBox();
        } else {
            // Add default item for new boxes
            addItem();
        }
    }, [boxId]);

    const fetchBox = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Try backend API first
            const response = await fetch(`${BACKEND_URL}/api/admin/boxes/${boxId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const box = await response.json();
                populateForm(box);
            } else {
                // Fallback to Supabase
                console.log('Backend API failed, fetching from Supabase...');
                await fetchBoxFromSupabase();
            }
        } catch (error) {
            console.error('Error fetching box from backend:', error);
            // Fallback to Supabase
            await fetchBoxFromSupabase();
        } finally {
            setLoading(false);
        }
    };

    const fetchBoxFromSupabase = async () => {
        try {
            const { data: box, error } = await supabase
                .from('boxes')
                .select('*')
                .eq('id', boxId)
                .single();

            if (error) throw error;

            if (box) {
                populateForm(box);
            } else {
                setError('Box not found');
            }
        } catch (error: any) {
            console.error('Error fetching box from Supabase:', error);
            setError(`Failed to load box: ${error.message || 'Unknown error'}`);
        }
    };

    const populateForm = (box: any) => {
        // Normalize box data - handle both 'image'/'image_url' and 'enabled'/'active' fields
        const normalizedBox = {
            ...box,
            image: box.image || box.image_url || '',
            enabled: box.enabled !== undefined ? box.enabled : (box.active !== undefined ? box.active : true)
        };

        setName(normalizedBox.name || '');
        setDescription(normalizedBox.description || '');
        setPrice(normalizedBox.price ? normalizedBox.price.toString() : '');
        setSalePrice(normalizedBox.sale_price ? normalizedBox.sale_price.toString() : '');
        setImage(normalizedBox.image || '');
        setColor(normalizedBox.color || 'from-purple-600 to-purple-900');
        setCategory(normalizedBox.category || 'ALL');
        setTags(normalizedBox.tags || []);
        setItems(normalizedBox.items || []);
    };

    const addItem = () => {
        const newItem: LootItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: '',
            image: '',
            value: 0,
            rarity: 'COMMON',
            odds: 0
        };
        setItems([...items, newItem]);
    };

    const updateItem = (index: number, field: keyof LootItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const distributeOddsEvenly = () => {
        if (items.length === 0) return;
        const evenOdds = 100 / items.length;
        setItems(items.map(item => ({ ...item, odds: evenOdds })));
    };

    const getTotalOdds = () => {
        return items.reduce((sum, item) => sum + (parseFloat(item.odds.toString()) || 0), 0);
    };

    const toggleTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!name || !price || !image || !category) {
            setError('Please fill in all required fields');
            return;
        }

        if (items.length === 0) {
            setError('Please add at least one item');
            return;
        }

        const totalOdds = getTotalOdds();
        if (Math.abs(totalOdds - 100) > 0.1) {
            setError(`Item odds must sum to 100% (current: ${totalOdds.toFixed(2)}%)`);
            return;
        }

        const hasEmptyItems = items.some(item => !item.name || !item.image || item.value <= 0);
        if (hasEmptyItems) {
            setError('All items must have a name, image, and value greater than 0');
            return;
        }

        try {
            setSaving(true);

            const boxData = {
                name,
                description,
                price: parseFloat(price),
                sale_price: salePrice ? parseFloat(salePrice) : undefined,
                image,
                color,
                category,
                tags,
                items
            };

            // Try backend API first
            const url = boxId
                ? `${BACKEND_URL}/api/admin/boxes/${boxId}`
                : `${BACKEND_URL}/api/admin/boxes`;

            const method = boxId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(boxData)
            });

            if (response.ok) {
                onSuccess();
            } else {
                // Fallback to Supabase if backend fails
                const errorData = await response.json().catch(() => ({}));
                console.warn('Backend API failed, saving to Supabase:', errorData);
                await saveBoxToSupabase(boxData, boxId);
            }
        } catch (error: any) {
            console.error('Error saving box:', error);
            // Try Supabase fallback
            try {
                await saveBoxToSupabase(boxData, boxId);
            } catch (supabaseError: any) {
                setError(`Failed to save box: ${supabaseError.message || 'Unknown error'}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const saveBoxToSupabase = async (boxData: any, existingBoxId?: string) => {
        try {
            // Prepare data for Supabase - handle both schema variations
            const dbBox: any = {
                name: boxData.name,
                description: boxData.description || '',
                price: boxData.price,
                sale_price: boxData.sale_price || null,
                image_url: boxData.image || '', // Use image_url (most common)
                color: boxData.color,
                category: boxData.category,
                tags: boxData.tags || [],
                items: boxData.items || [],
                enabled: true,
                updated_at: new Date().toISOString()
            };

            let result;
            if (existingBoxId) {
                // Update existing box
                result = await supabase
                    .from('boxes')
                    .update(dbBox)
                    .eq('id', existingBoxId)
                    .select();
            } else {
                // Create new box
                const boxId = `box_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                result = await supabase
                    .from('boxes')
                    .insert({
                        ...dbBox,
                        id: boxId,
                        created_at: new Date().toISOString()
                    })
                    .select();
            }

            if (result.error) {
                // Try with 'image' instead of 'image_url'
                if (result.error.message?.includes('image_url') || result.error.message?.includes('image')) {
                    delete dbBox.image_url;
                    dbBox.image = boxData.image || '';
                    
                    if (existingBoxId) {
                        result = await supabase
                            .from('boxes')
                            .update(dbBox)
                            .eq('id', existingBoxId)
                            .select();
                    } else {
                        const boxId = `box_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        result = await supabase
                            .from('boxes')
                            .insert({
                                ...dbBox,
                                id: boxId,
                                created_at: new Date().toISOString()
                            })
                            .select();
                    }
                }

                // Try with 'active' instead of 'enabled'
                if (result.error && (result.error.message?.includes('enabled') || result.error.code === 'PGRST116')) {
                    delete dbBox.enabled;
                    dbBox.active = true;
                    
                    if (existingBoxId) {
                        result = await supabase
                            .from('boxes')
                            .update(dbBox)
                            .eq('id', existingBoxId)
                            .select();
                    } else {
                        const boxId = `box_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        result = await supabase
                            .from('boxes')
                            .insert({
                                ...dbBox,
                                id: boxId,
                                created_at: new Date().toISOString()
                            })
                            .select();
                    }
                }

                if (result.error) {
                    throw result.error;
                }
            }

            console.log('✅ Box saved to Supabase successfully');
            onSuccess();
        } catch (error: any) {
            console.error('Error saving box to Supabase:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="text-slate-400">Loading box...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 bg-[#131b2e] border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        {boxId ? 'Edit Box' : 'Create New Box'}
                    </h1>
                    <p className="text-slate-400">
                        {boxId ? 'Modify box configuration' : 'Configure a new loot box'}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Box Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                placeholder="e.g., Hypebeast Box"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Category *
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                required
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Price (USD) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                placeholder="9.99"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Sale Price (Optional)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={salePrice}
                                onChange={(e) => setSalePrice(e.target.value)}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                placeholder="7.99"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none resize-none"
                                rows={3}
                                placeholder="Brief description of the box..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <ImageUpload
                                currentImage={image}
                                onImageChange={setImage}
                                folder="boxes"
                                label="Box Image *"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Color Gradient
                            </label>
                            <select
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                            >
                                {gradients.map(grad => (
                                    <option key={grad} value={grad}>{grad}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Tags
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={`px-3 py-2 rounded-lg font-bold text-sm transition-colors ${tags.includes(tag)
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-[#0b0f19] border border-white/10 text-slate-400 hover:border-orange-500'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Configuration */}
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">Items & Odds</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Total odds: <span className={getTotalOdds() === 100 ? 'text-green-400' : 'text-red-400'}>
                                    {getTotalOdds().toFixed(2)}%
                                </span> / 100%
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={distributeOddsEvenly}
                                className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold rounded-lg transition-colors text-sm"
                            >
                                Distribute Evenly
                            </button>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-bold rounded-lg transition-colors text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={item.id} className="bg-[#0b0f19] border border-white/10 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-400 mb-1">
                                            Item Name
                                        </label>
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                                            className="w-full bg-[#131b2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                                            placeholder="e.g., iPhone 15 Pro"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <ImageUpload
                                            currentImage={item.image}
                                            onImageChange={(url) => updateItem(index, 'image', url)}
                                            folder="items"
                                            label="Item Image"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1">
                                            Value ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.value}
                                            onChange={(e) => updateItem(index, 'value', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-[#131b2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                                            placeholder="999"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1">
                                            Odds (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.odds}
                                            onChange={(e) => updateItem(index, 'odds', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-[#131b2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                                            placeholder="25"
                                        />
                                    </div>
                                    <div className="md:col-span-5">
                                        <label className="block text-xs font-bold text-slate-400 mb-1">
                                            Rarity
                                        </label>
                                        <div className="flex gap-2">
                                            {rarities.map(rarity => (
                                                <button
                                                    key={rarity}
                                                    type="button"
                                                    onClick={() => updateItem(index, 'rarity', rarity)}
                                                    className={`px-3 py-2 rounded-lg font-bold text-xs transition-colors ${item.rarity === rarity
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-[#131b2e] border border-white/10 text-slate-400'
                                                        }`}
                                                >
                                                    {rarity}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="w-full p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                                            title="Remove item"
                                        >
                                            <Trash2 className="w-4 h-4 mx-auto" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Saving...' : (boxId ? 'Update Box' : 'Create Box')}
                    </button>
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-6 py-3 bg-[#131b2e] border border-white/10 text-white font-bold rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};
