import React, { useState } from 'react';
import { X, Wallet, AlertCircle } from 'lucide-react';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: { id: string; username: string; balance: number };
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, user }) => {
    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [currency, setCurrency] = useState<'BTC' | 'ETH'>('BTC');
    const [loading, setLoading] = useState(false);

    const MIN_WITHDRAWAL = 25;

    const handleSubmit = async () => {
        const withdrawAmount = parseFloat(amount);

        if (!amount || withdrawAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (withdrawAmount < MIN_WITHDRAWAL) {
            alert(`Minimum withdrawal is $${MIN_WITHDRAWAL}`);
            return;
        }

        if (withdrawAmount > user.balance) {
            alert('Insufficient balance');
            return;
        }

        if (!address) {
            alert('Please enter a withdrawal address');
            return;
        }

        setLoading(true);
        try {
            const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';
            const response = await fetch(`${BACKEND_URL}/api/withdrawals/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    amount: withdrawAmount,
                    currency,
                    address
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Withdrawal request failed');
            }

            alert('Withdrawal request submitted! It will be processed by our team shortly.');
            onClose();
            setAmount('');
            setAddress('');
        } catch (error: any) {
            console.error('Withdrawal error:', error);
            alert(error.message || 'Failed to submit withdrawal request');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="relative bg-[#0b0f19] rounded-3xl w-full max-w-lg overflow-hidden border border-white/10">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 border-b border-white/10">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Withdraw Funds
                    </h2>
                    <p className="text-sm text-slate-400">
                        Request a withdrawal to your crypto wallet
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Balance */}
                    <div className="bg-[#131b2e] border border-white/10 rounded-lg p-4">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Available Balance</div>
                        <div className="text-2xl font-bold text-emerald-400">${user.balance.toFixed(2)}</div>
                    </div>

                    {/* Currency Selection */}
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Currency</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setCurrency('BTC')}
                                className={`p-4 rounded-lg border transition-all ${currency === 'BTC'
                                        ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                                        : 'bg-[#131b2e] border-white/10 text-slate-400 hover:border-white/20'
                                    }`}
                            >
                                <div className="font-bold">Bitcoin</div>
                                <div className="text-xs">BTC</div>
                            </button>
                            <button
                                onClick={() => setCurrency('ETH')}
                                className={`p-4 rounded-lg border transition-all ${currency === 'ETH'
                                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                        : 'bg-[#131b2e] border-white/10 text-slate-400 hover:border-white/20'
                                    }`}
                            >
                                <div className="font-bold">Ethereum</div>
                                <div className="text-xs">ETH</div>
                            </button>
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">
                            Amount (USD)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Min: $${MIN_WITHDRAWAL}`}
                            className="w-full bg-[#131b2e] border border-white/10 rounded-lg p-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">
                            {currency} Address
                        </label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={`Your ${currency} wallet address`}
                            className="w-full bg-[#131b2e] border border-white/10 rounded-lg p-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none font-mono text-sm"
                        />
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <h3 className="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Important
                        </h3>
                        <ul className="text-xs text-slate-300 space-y-1">
                            <li>• Minimum withdrawal: ${MIN_WITHDRAWAL}</li>
                            <li>• Withdrawals are processed manually within 24-48 hours</li>
                            <li>• Double-check your {currency} address before submitting</li>
                            <li>• Funds cannot be recovered if sent to wrong address</li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Wallet className="w-5 h-5" />
                                Submit Withdrawal Request
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
