import React, { useState } from 'react';
import { LootItem, ShippingAddress } from '../types';
import { X, Package, Truck, MapPin, User, Home, Globe } from 'lucide-react';

interface ShippingModalProps {
    items: LootItem[];
    onClose: () => void;
    onSubmit: (address: ShippingAddress) => Promise<void>;
}

export const ShippingModal: React.FC<ShippingModalProps> = ({ items, onClose, onSubmit }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [address, setAddress] = useState<ShippingAddress>({
        fullName: '',
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};

        if (!address.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!address.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
        if (!address.city.trim()) newErrors.city = 'City is required';
        if (!address.state.trim()) newErrors.state = 'State is required';
        if (!address.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
        if (!address.country.trim()) newErrors.country = 'Country is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(address);
            onClose();
        } catch (error) {
            console.error('Shipping error:', error);
            alert('Failed to create shipment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalValue = items.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#0b0f19] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">

                {/* Gradient Background Effects */}
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-pink-600/20 rounded-full blur-[100px]"></div>

                {/* Header */}
                <div className="relative z-10 p-6 border-b border-white/5 flex justify-between items-center bg-[#0b0f19]/80 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl">
                            <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold font-display">Ship Your Items</h2>
                            <p className="text-sm text-slate-400">Enter your shipping details</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Items Summary */}
                    <div className="bg-[#131b2e] border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Package className="w-5 h-5 text-purple-400" />
                            <h3 className="font-bold text-lg">Items to Ship ({items.length})</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {items.map((item, idx) => (
                                <div key={idx} className="bg-[#0b0f19] border border-white/5 rounded-xl p-3 flex flex-col items-center text-center">
                                    <img src={item.image} className="w-16 h-16 object-contain mb-2" alt={item.name} />
                                    <div className="text-xs font-bold truncate w-full">{item.name}</div>
                                    <div className="text-xs text-emerald-400 font-mono">${item.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-white/5 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Total Value</span>
                                <span className="text-lg font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                    ${totalValue.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Shipping Fee</span>
                                <span className="text-lg font-mono font-bold text-amber-400">
                                    $15.00
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <span className="text-slate-300 text-sm font-bold">Total</span>
                                <span className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                    ${(totalValue + 15).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                <User className="w-4 h-4 text-purple-400" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={address.fullName}
                                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                                className={`w-full bg-[#131b2e] border ${errors.fullName ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors`}
                                placeholder="John Doe"
                            />
                            {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                        </div>

                        {/* Street Address */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                <Home className="w-4 h-4 text-purple-400" />
                                Street Address
                            </label>
                            <input
                                type="text"
                                value={address.streetAddress}
                                onChange={(e) => setAddress({ ...address, streetAddress: e.target.value })}
                                className={`w-full bg-[#131b2e] border ${errors.streetAddress ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors`}
                                placeholder="123 Main St, Apt 4B"
                            />
                            {errors.streetAddress && <p className="text-red-400 text-xs mt-1">{errors.streetAddress}</p>}
                        </div>

                        {/* City, State, ZIP */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-purple-400" />
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={address.city}
                                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                    className={`w-full bg-[#131b2e] border ${errors.city ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors`}
                                    placeholder="New York"
                                />
                                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">State</label>
                                <input
                                    type="text"
                                    value={address.state}
                                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                    className={`w-full bg-[#131b2e] border ${errors.state ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors`}
                                    placeholder="NY"
                                />
                                {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">ZIP Code</label>
                                <input
                                    type="text"
                                    value={address.zipCode}
                                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                                    className={`w-full bg-[#131b2e] border ${errors.zipCode ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors`}
                                    placeholder="10001"
                                />
                                {errors.zipCode && <p className="text-red-400 text-xs mt-1">{errors.zipCode}</p>}
                            </div>
                        </div>

                        {/* Country */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-purple-400" />
                                Country
                            </label>
                            <input
                                type="text"
                                value={address.country}
                                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                                className={`w-full bg-[#131b2e] border ${errors.country ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors`}
                                placeholder="United States"
                            />
                            {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(147,51,234,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Truck className="w-5 h-5" />
                                    Ship {items.length} Item{items.length > 1 ? 's' : ''}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
