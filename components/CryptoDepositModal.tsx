import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Loader2, Wallet, Sparkles, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '@clerk/clerk-react';

interface CryptoDepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    currency: 'BTC' | 'ETH';
    onDepositCredited?: () => void; // Optional callback when deposit is credited
}

export const CryptoDepositModal: React.FC<CryptoDepositModalProps> = ({ isOpen, onClose, userId, currency, onDepositCredited }) => {
    const { getToken } = useAuth();
    const [address, setAddress] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [depositId, setDepositId] = useState<string | null>(null);
    const [depositStatus, setDepositStatus] = useState<any>(null);

    const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';
    const IS_TESTNET = (import.meta as any).env.VITE_CRYPTO_TESTNET === 'true';

    // Generate deposit address
    useEffect(() => {
        if (isOpen && userId) {
            generateAddress();
            setDepositStatus(null);
            setDepositId(null);
        }
    }, [isOpen, userId, currency]);

    // Poll for recent deposits (automatically detects new deposits)
    useEffect(() => {
        if (!isOpen || !userId || !address) return;

        const checkForDeposits = async () => {
            try {
                // ✅ SECURITY FIX: Added authentication header
                const token = await getToken({ template: 'supabase' });
                if (!token) {
                    console.error('No auth token available');
                    return;
                }

                // Get recent deposits for this user and currency
                // ✅ SECURITY FIX: Removed userId from URL (comes from auth token now)
                const response = await fetch(`${BACKEND_URL}/api/deposits/history`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();

                if (data.deposits && data.deposits.length > 0) {
                    // Find the most recent deposit for this currency that's not yet credited
                    const recentDeposit = data.deposits.find((d: any) =>
                        d.currency === currency &&
                        d.status !== 'CREDITED' &&
                        d.address.toLowerCase() === address.toLowerCase()
                    );

                    if (recentDeposit) {
                        const wasCredited = depositStatus?.status === 'CREDITED';
                        setDepositId(recentDeposit.id);
                        setDepositStatus({
                            depositId: recentDeposit.id,
                            currency: recentDeposit.currency,
                            amount: recentDeposit.amount,
                            status: recentDeposit.status,
                            confirmations: recentDeposit.confirmations || 0,
                            requiredConfirmations: recentDeposit.required_confirmations || (currency === 'BTC' ? 3 : 12),
                            txHash: recentDeposit.tx_hash,
                            usdValue: recentDeposit.usd_value
                        });

                        // If deposit just got credited, trigger callback
                        if (recentDeposit.status === 'CREDITED' && !wasCredited && onDepositCredited) {
                            setTimeout(() => {
                                onDepositCredited();
                            }, 1000); // Small delay for visual feedback
                        }
                    } else {
                        // Check if there's a credited deposit to show success state
                        const creditedDeposit = data.deposits.find((d: any) =>
                            d.currency === currency &&
                            d.status === 'CREDITED' &&
                            d.address.toLowerCase() === address.toLowerCase()
                        );
                        if (creditedDeposit && !depositStatus) {
                            setDepositStatus({
                                ...creditedDeposit,
                                status: 'CREDITED'
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking for deposits:', error);
            }
        };

        // Check immediately
        checkForDeposits();

        // Poll every 10 seconds for new deposits
        const interval = setInterval(checkForDeposits, 10000);

        return () => clearInterval(interval);
    }, [isOpen, userId, currency, address]);

    const [error, setError] = useState<string | null>(null);

    const generateAddress = async () => {
        try {
            setLoading(true);
            setError(null);
            setAddress('');

            // ✅ SECURITY FIX: Added authentication header
            const token = await getToken({ template: 'supabase' });
            if (!token) {
                throw new Error('Not authenticated - Please sign in again');
            }

            // ✅ SECURITY FIX: Removed userId from body (comes from auth token now)
            const response = await fetch(`${BACKEND_URL}/api/deposits/generate-address`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currency, testnet: IS_TESTNET })
            }).catch(networkError => {
                // Catch network errors (like CORS or offline)
                console.error('Fetch error:', networkError);
                throw new Error('Network Error: Could not connect to backend. Please check your internet connection.');
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate address');
            }

            setAddress(data.address);
        } catch (error: any) {
            console.error('Error generating address:', error);

            // Helpful error messages
            let errorMessage = error.message;
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                errorMessage = 'Backend Connection Failed. The server might be restarting or blocking the request (CORS).';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getExplorerUrl = (txHash: string) => {
        if (IS_TESTNET) {
            if (currency === 'BTC') {
                return `https://blockchair.com/bitcoin/testnet/transaction/${txHash}`;
            } else {
                return `https://sepolia.etherscan.io/tx/${txHash}`;
            }
        } else {
            if (currency === 'BTC') {
                return `https://blockchair.com/bitcoin/transaction/${txHash}`;
            } else {
                return `https://etherscan.io/tx/${txHash}`;
            }
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'CREDITED':
                return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            case 'CONFIRMING':
                return <Clock className="w-5 h-5 text-amber-400 animate-pulse" />;
            case 'CONFIRMED':
                return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
            default:
                return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CREDITED':
                return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'CONFIRMING':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'CONFIRMED':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default:
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    if (!isOpen) return null;

    const currencyIcon = currency === 'BTC' ? '₿' : 'Ξ';
    const currencyName = currency === 'BTC' ? 'Bitcoin' : 'Ethereum';
    const minDeposit = currency === 'BTC' ? '0.0001 BTC' : '0.01 ETH';
    const requiredConfirmations = currency === 'BTC' ? 3 : 12;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative bg-[#0b0f19] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">

                {/* Gradient Background Effects */}
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-pink-600/20 rounded-full blur-[100px]"></div>

                {/* Header */}
                <div className="relative z-10 p-6 border-b border-white/5 flex justify-between items-center bg-[#0b0f19]/80 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold font-display text-white">Deposit {currencyName}</h2>
                                {IS_TESTNET && (
                                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md uppercase">
                                        Testnet
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-400">
                                {IS_TESTNET ? `Send ${currency} on testnet` : `Send ${currency} to your unique address`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative z-10 p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                                <Sparkles className="w-8 h-8 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <p className="text-slate-400 mt-4 font-bold">Generating your deposit address...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Connection Error</h3>
                            <p className="text-red-400 text-sm max-w-xs mb-6">{error}</p>

                            <button
                                onClick={generateAddress}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-red-900/20"
                            >
                                Retry Connection
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* QR Code Section */}
                            <div className="bg-[#131b2e] border border-white/5 rounded-2xl p-6 flex flex-col items-center">
                                <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                                    <QRCodeCanvas value={address} size={180} />
                                </div>
                                <p className="text-xs text-slate-500 font-bold uppercase mb-2">Scan to Deposit</p>
                            </div>

                            {/* Address Section */}
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-2 block flex items-center gap-2">
                                    <span className="text-lg">{currencyIcon}</span>
                                    Your {currencyName} Address
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-[#131b2e] border border-white/10 rounded-xl p-4 font-mono text-sm text-white break-all hover:border-purple-500/50 transition-colors">
                                        {address}
                                    </div>
                                    <button
                                        onClick={copyAddress}
                                        className={`p-4 rounded-xl transition-all ${copied
                                            ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                            : 'bg-purple-600/20 border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/30 hover:border-purple-500'
                                            }`}
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                                {copied && (
                                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Address copied!
                                    </p>
                                )}
                            </div>

                            {/* How It Works */}
                            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-5">
                                <h3 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Automatic Detection
                                </h3>
                                <ul className="text-xs text-slate-300 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-400 mt-0.5">•</span>
                                        <span>Send <strong className="text-white">{currency}</strong> to the address above from your wallet</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-400 mt-0.5">•</span>
                                        <span>Your deposit will be <strong className="text-white">automatically detected</strong> within 60 seconds</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-400 mt-0.5">•</span>
                                        <span>No transaction hash needed - we handle everything!</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Deposit Status */}
                            {depositStatus ? (
                                <div className="bg-[#131b2e] border border-white/5 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(depositStatus.status)}
                                            <div>
                                                <h3 className="text-sm font-bold text-white">Deposit Detected</h3>
                                                <p className="text-xs text-slate-400">Transaction found on blockchain</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${getStatusColor(depositStatus.status)}`}>
                                            {depositStatus.status}
                                        </span>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-white/5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">Amount</span>
                                            <div className="text-right">
                                                <span className="text-white font-mono font-bold">{parseFloat(depositStatus.amount).toFixed(8)} {currency}</span>
                                                {depositStatus.usdValue && (
                                                    <span className="text-emerald-400 text-xs block mt-1">≈ ${parseFloat(depositStatus.usdValue).toFixed(2)} USD</span>
                                                )}
                                            </div>
                                        </div>

                                        {depositStatus.status !== 'CREDITED' && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-400">Confirmations</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-[#0b0f19] rounded-lg h-2 overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                                            style={{
                                                                width: `${Math.min(100, (depositStatus.confirmations / depositStatus.requiredConfirmations) * 100)}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-white font-mono font-bold text-sm min-w-[60px] text-right">
                                                        {depositStatus.confirmations}/{depositStatus.requiredConfirmations}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {depositStatus.status === 'CREDITED' && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mt-4">
                                                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    <span>Funds credited to your account!</span>
                                                </div>
                                            </div>
                                        )}

                                        {depositStatus.txHash && (
                                            <a
                                                href={getExplorerUrl(depositStatus.txHash)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm font-bold pt-2 border-t border-white/5"
                                            >
                                                View on Explorer <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[#131b2e] border border-white/5 rounded-2xl p-6 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500/30 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white mb-1">Waiting for Deposit</p>
                                            <p className="text-xs text-slate-400">Send {currency} to the address above</p>
                                            <p className="text-xs text-slate-500 mt-2">Your transaction will be detected automatically</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Important Info */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                                <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Important Information
                                </h3>
                                <ul className="text-xs text-slate-300 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5">•</span>
                                        <span>Send <strong className="text-white">only {currency}</strong> to this address</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5">•</span>
                                        <span>Minimum deposit: <strong className="text-white">{minDeposit}</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5">•</span>
                                        <span>Requires <strong className="text-white">{requiredConfirmations} confirmations</strong> before crediting</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400 mt-0.5">•</span>
                                        <span>Deposits are processed automatically - no manual action needed</span>
                                    </li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
