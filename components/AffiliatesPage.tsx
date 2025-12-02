import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ArrowLeft, Users, DollarSign, TrendingUp, Copy, Check, Gift, Trophy } from 'lucide-react';

interface AffiliatesPageProps {
    user: User | null;
    onBack: () => void;
}

interface AffiliateStats {
    code: string | null;
    referralCount: number;
    totalWagerVolume: number;
    currentTier: {
        name: string;
        rate: number;
        color: string;
        minWagerVolume: number;
    } | null;
    unclaimedEarnings: number;
    totalEarnings: number;
    claimedEarnings: number;
    recentEarnings: any[];
    referrals: any[];
}

export const AffiliatesPage: React.FC<AffiliatesPageProps> = ({ user, onBack }) => {
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [generatingCode, setGeneratingCode] = useState(false);

    // Get backend URL from environment variable
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        if (user) {
            fetchAffiliateStats();
        }
    }, [user]);

    const fetchAffiliateStats = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            // Use the backend URL from environment variable
            const response = await fetch(`${backendUrl}/api/affiliates/stats/${user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch affiliate stats: ${response.statusText}`);
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Get affiliate stats error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load affiliate stats');
        } finally {
            setLoading(false);
        }
    };

    const generateAffiliateCode = async () => {
        if (!user) return;

        try {
            setGeneratingCode(true);
            const response = await fetch(`${backendUrl}/api/affiliates/generate-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate affiliate code');
            }

            const data = await response.json();
            await fetchAffiliateStats(); // Refresh stats
        } catch (err) {
            console.error('Generate affiliate code error:', err);
            setError('Failed to generate affiliate code');
        } finally {
            setGeneratingCode(false);
        }
    };

    const copyReferralLink = () => {
        if (!stats?.code) return;

        const referralLink = `${window.location.origin}?ref=${stats.code}`;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const claimEarnings = async () => {
        if (!user || !stats || stats.unclaimedEarnings <= 0) return;

        try {
            const response = await fetch(`${backendUrl}/api/affiliates/claim-earnings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id }),
            });

            if (!response.ok) {
                throw new Error('Failed to claim earnings');
            }

            await fetchAffiliateStats(); // Refresh stats
        } catch (err) {
            console.error('Claim earnings error:', err);
            setError('Failed to claim earnings');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0f19] text-white p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                            <p className="text-slate-400">Loading affiliate stats...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="min-h-screen bg-[#0b0f19] text-white p-8">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                        <p className="text-red-400">{error}</p>
                        <button
                            onClick={fetchAffiliateStats}
                            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0f19] text-white p-8">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Affiliate Program</h1>
                    <p className="text-slate-400">Earn commissions by referring friends</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Affiliate Code Section */}
                <div className="bg-[#131b2e] rounded-2xl border border-white/5 p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Your Referral Code</h2>
                    {stats?.code ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 bg-[#0b0f19] border border-white/10 rounded-lg p-4">
                                    <p className="text-sm text-slate-400 mb-1">Your Referral Link</p>
                                    <p className="font-mono text-lg break-all">
                                        {window.location.origin}?ref={stats.code}
                                    </p>
                                </div>
                                <button
                                    onClick={copyReferralLink}
                                    className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-4 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-5 h-5" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-slate-400 mb-4">Generate your unique affiliate code to start earning</p>
                            <button
                                onClick={generateAffiliateCode}
                                disabled={generatingCode}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generatingCode ? 'Generating...' : 'Generate Code'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                {stats && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="bg-[#131b2e] rounded-xl border border-white/5 p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5 text-blue-400" />
                                    <h3 className="text-sm text-slate-400">Referrals</h3>
                                </div>
                                <p className="text-3xl font-bold">{stats.referralCount}</p>
                            </div>

                            <div className="bg-[#131b2e] rounded-xl border border-white/5 p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                    <h3 className="text-sm text-slate-400">Total Volume</h3>
                                </div>
                                <p className="text-3xl font-bold">${stats.totalWagerVolume.toFixed(2)}</p>
                            </div>

                            <div className="bg-[#131b2e] rounded-xl border border-white/5 p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <DollarSign className="w-5 h-5 text-yellow-400" />
                                    <h3 className="text-sm text-slate-400">Unclaimed</h3>
                                </div>
                                <p className="text-3xl font-bold">${stats.unclaimedEarnings.toFixed(2)}</p>
                            </div>

                            <div className="bg-[#131b2e] rounded-xl border border-white/5 p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Trophy className="w-5 h-5 text-purple-400" />
                                    <h3 className="text-sm text-slate-400">Total Earned</h3>
                                </div>
                                <p className="text-3xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Current Tier */}
                        {stats.currentTier && (
                            <div className="bg-[#131b2e] rounded-xl border border-white/5 p-6 mb-6">
                                <h3 className="text-lg font-bold mb-2">Current Tier</h3>
                                <div className="flex items-center gap-4">
                                    <div
                                        className="px-4 py-2 rounded-lg font-bold"
                                        style={{ backgroundColor: `${stats.currentTier.color}20`, color: stats.currentTier.color }}
                                    >
                                        {stats.currentTier.name}
                                    </div>
                                    <p className="text-slate-400">
                                        {stats.currentTier.rate * 100}% commission rate
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Claim Earnings */}
                        {stats.unclaimedEarnings > 0 && (
                            <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-xl border border-purple-500/20 p-6 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold mb-1">Unclaimed Earnings</h3>
                                        <p className="text-2xl font-bold text-purple-400">
                                            ${stats.unclaimedEarnings.toFixed(2)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={claimEarnings}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"
                                    >
                                        <Gift className="w-5 h-5" />
                                        Claim Earnings
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Recent Referrals */}
                        {stats.referrals && stats.referrals.length > 0 && (
                            <div className="bg-[#131b2e] rounded-xl border border-white/5 p-6">
                                <h3 className="text-lg font-bold mb-4">Recent Referrals</h3>
                                <div className="space-y-2">
                                    {stats.referrals.slice(0, 10).map((referral, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-[#0b0f19] rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {referral.users?.username || 'Unknown User'}
                                                </p>
                                                <p className="text-sm text-slate-400">
                                                    Joined {new Date(referral.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">${parseFloat(referral.total_wagers || 0).toFixed(2)}</p>
                                                <p className="text-xs text-slate-400">Total Wagers</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

