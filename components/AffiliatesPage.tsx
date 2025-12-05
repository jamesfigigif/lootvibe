import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { ArrowLeft, Users, DollarSign, TrendingUp, Copy, Check, Gift, Trophy, BarChart3, CreditCard, Shield, Zap } from 'lucide-react';

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

const TIER_COLORS: { [key: string]: { border: string; bg: string; text: string } } = {
    'BRONZE': { border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-500' },
    'SILVER': { border: 'border-slate-400', bg: 'bg-slate-400/10', text: 'text-slate-400' },
    'GOLD': { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
    'PLATINUM': { border: 'border-cyan-400', bg: 'bg-cyan-400/10', text: 'text-cyan-400' },
    'DIAMOND': { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-500' },
    'LEGEND': { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-500' },
};

export const AffiliatesPage: React.FC<AffiliatesPageProps> = ({ user, onBack }) => {
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [generatingCode, setGeneratingCode] = useState(false);
    const [allTiers, setAllTiers] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchAffiliateStats();
        }
    }, [user?.id]);

    const fetchAffiliateStats = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            const { data: codeData } = await supabase
                .from('affiliate_codes')
                .select('code')
                .eq('user_id', user.id)
                .single();

            const { data: referralsData } = await supabase
                .from('affiliate_referrals')
                .select(`
                    *,
                    referred_user:users!affiliate_referrals_referred_user_id_fkey(username, email, balance)
                `)
                .eq('referrer_user_id', user.id);

            const totalWagerVolume = (referralsData || []).reduce((sum, ref) =>
                sum + parseFloat(ref.total_wagers || 0), 0
            );

            const { data: earningsData } = await supabase
                .from('affiliate_earnings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            const totalEarnings = (earningsData || []).reduce((sum, e) =>
                sum + parseFloat(e.amount || 0), 0
            );

            const claimedEarnings = (earningsData || []).filter(e => e.claimed)
                .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

            const unclaimedEarnings = totalEarnings - claimedEarnings;

            const { data: tiersData } = await supabase
                .from('affiliate_tiers')
                .select('*')
                .order('min_wager_volume', { ascending: true });

            setAllTiers(tiersData || []);

            const currentTier = [...(tiersData || [])].reverse().find(
                tier => totalWagerVolume >= parseFloat(tier.min_wager_volume || 0)
            ) || (tiersData && tiersData[0]);

            setStats({
                code: codeData?.code || null,
                referralCount: referralsData?.length || 0,
                totalWagerVolume,
                currentTier: currentTier ? {
                    name: currentTier.name,
                    rate: parseFloat(currentTier.commission_rate),
                    color: currentTier.color,
                    minWagerVolume: parseFloat(currentTier.min_wager_volume)
                } : null,
                unclaimedEarnings,
                totalEarnings,
                claimedEarnings,
                recentEarnings: earningsData?.slice(0, 10) || [],
                referrals: referralsData || []
            });
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

            const baseCode = user.username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            let code = baseCode;
            let attempt = 0;

            while (attempt < 10) {
                const { data: existing } = await supabase
                    .from('affiliate_codes')
                    .select('id')
                    .eq('code', code)
                    .single();

                if (!existing) break;

                attempt++;
                code = `${baseCode}${Math.floor(Math.random() * 1000)}`;
            }

            const { error: insertError } = await supabase
                .from('affiliate_codes')
                .insert({
                    id: `aff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    user_id: user.id,
                    code: code
                });

            if (insertError) throw insertError;

            await fetchAffiliateStats();
        } catch (err) {
            console.error('Generate affiliate code error:', err);
            setError('Failed to generate affiliate code');
        } finally {
            setGeneratingCode(false);
        }
    };

    const copyReferralLink = () => {
        if (!stats?.code) return;

        const referralLink = `${window.location.origin}/r/${stats.code}`;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const claimEarnings = async () => {
        if (!user || !stats || stats.unclaimedEarnings <= 0) return;

        try {
            const { error: updateError } = await supabase
                .from('affiliate_earnings')
                .update({
                    claimed: true,
                    claimed_at: new Date().toISOString()
                })
                .eq('user_id', user.id)
                .eq('claimed', false);

            if (updateError) throw updateError;

            const { error: balanceError } = await supabase
                .from('users')
                .update({
                    balance: parseFloat(user.balance.toString()) + stats.unclaimedEarnings
                })
                .eq('id', user.id);

            if (balanceError) throw balanceError;

            await fetchAffiliateStats();
        } catch (err) {
            console.error('Claim earnings error:', err);
            setError('Failed to claim earnings');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0f19] text-white">
            {/* Navigation */}
            <div className="border-b border-white/5 bg-[#131b2e]/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Section */}
                <div className="mb-16">
                    <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                        <span className="text-emerald-400 text-sm font-bold flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            PARTNER PROGRAM
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                        EARN<br />
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 text-transparent bg-clip-text">
                            PASSIVE<br />INCOME
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-8">
                        The most rewarding affiliate system in gaming. Refer friends, earn up to <span className="text-white font-bold">10% commission</span> on every wager, and unlock instant crypto loans.
                    </p>

                    {/* Referral Link */}
                    {stats?.code ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-2xl">
                            <div className="flex-1 w-full bg-[#131b2e] border border-white/10 rounded-xl px-6 py-4">
                                <p className="text-xs text-slate-500 mb-1 font-mono">lootvibe.com/r/YOUR_CODE</p>
                                <p className="font-mono text-lg text-white">{stats.code}</p>
                            </div>
                            <button
                                onClick={copyReferralLink}
                                className="bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        COPIED
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-5 h-5" />
                                        COPY
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={generateAffiliateCode}
                            disabled={generatingCode}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-4 rounded-xl transition-all disabled:opacity-50"
                        >
                            {generatingCode ? 'Generating...' : 'Generate Your Code'}
                        </button>
                    )}
                </div>

                {/* Earnings Card */}
                {stats && (
                    <div className="mb-12">
                        <div className="bg-gradient-to-br from-[#1a2332] to-[#131b2e] rounded-3xl border border-white/5 p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

                            <div className="relative">
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <p className="text-slate-400 text-sm uppercase tracking-wide mb-2">ESTIMATED MONTHLY EARNINGS</p>
                                        <div className="flex items-baseline gap-3">
                                            <h2 className="text-5xl font-black">${(stats.totalEarnings * 0.12).toFixed(2)}</h2>
                                            <span className="text-emerald-400 font-bold text-lg">+12%</span>
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                        <TrendingUp className="w-8 h-8 text-purple-400" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <Users className="w-5 h-5 text-emerald-400" />
                                            <span className="text-white font-medium">Active Referrals</span>
                                        </div>
                                        <span className="text-white font-bold text-xl">{stats.referralCount}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-5 h-5 text-yellow-500" />
                                            <span className="text-white font-medium">Current Tier</span>
                                        </div>
                                        <span className="text-yellow-500 font-black text-xl">{stats.currentTier?.name || 'BRONZE'}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-4">
                                        <div className="flex items-center gap-3">
                                            <Zap className="w-5 h-5 text-blue-400" />
                                            <span className="text-white font-medium">Wager Volume</span>
                                        </div>
                                        <span className="text-white font-bold text-xl">${stats.totalWagerVolume.toFixed(0)}</span>
                                    </div>
                                </div>

                                {stats.unclaimedEarnings > 0 && (
                                    <button
                                        onClick={claimEarnings}
                                        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all text-lg"
                                    >
                                        CLAIM EARNINGS
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Commission Tiers */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black mb-4">COMMISSION TIERS</h2>
                        <p className="text-slate-400 text-lg max-w-3xl mx-auto">
                            Level up your affiliate rank by increasing your referral wager volume. Higher tiers unlock exclusive perks and personal loans.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allTiers.map((tier) => {
                            const colors = TIER_COLORS[tier.name] || TIER_COLORS.BRONZE;
                            const isActive = stats?.currentTier?.name === tier.name;

                            return (
                                <div
                                    key={tier.id}
                                    className={`bg-[#1a2332] rounded-2xl border-t-4 ${colors.border} p-6 relative ${isActive ? 'ring-2 ring-white/20' : ''}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
                                        <Shield className={`w-8 h-8 ${colors.text}`} />
                                    </div>

                                    <h3 className={`text-2xl font-black text-center mb-2 ${colors.text}`}>
                                        {tier.name}
                                    </h3>

                                    <div className="text-center mb-4">
                                        <p className="text-5xl font-black text-white">{tier.commission_rate}%</p>
                                        <p className="text-slate-500 text-sm uppercase tracking-wide">COMMISSION</p>
                                    </div>

                                    {isActive && (
                                        <div className="absolute top-4 right-4">
                                            <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                ACTIVE
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#1a2332] rounded-2xl p-8 border border-white/5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6">
                            <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Advanced Analytics</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Track every click, sign-up, and wager in real-time. Our dashboard gives you the data you need to optimize your campaigns.
                        </p>
                    </div>

                    <div className="bg-[#1a2332] rounded-2xl p-8 border border-white/5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-6">
                            <Gift className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Referral Bonuses</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Your friends get a <span className="text-white font-bold">5% Deposit Bonus</span> when using your code, ensuring high conversion rates.
                        </p>
                    </div>

                    <div className="bg-[#1a2332] rounded-2xl p-8 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-4 right-4">
                            <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">NEW</span>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6">
                            <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Instant Loans</h3>
                        <p className="text-slate-400 leading-relaxed mb-4">
                            Need liquidity for a promotion? Borrow up to <span className="text-white font-bold">800 credits</span> against future earnings instantly.
                        </p>
                        <button className="text-emerald-400 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                            VIEW REQUIREMENTS
                            <Zap className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
