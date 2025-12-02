import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, Shield, DollarSign, Bitcoin, AlertTriangle } from 'lucide-react';

interface PlatformSettingsProps {
    token: string;
}

export const PlatformSettings: React.FC<PlatformSettingsProps> = ({ token }) => {
    const [settings, setSettings] = useState({
        min_btc_deposit: '0.0001',
        min_eth_deposit: '0.01',
        btc_confirmations: '3',
        eth_confirmations: '12',
        platform_fee: '5',
        maintenance_mode: false,
        kyc_required: false,
        auto_approve_withdrawals: false,
        manual_approval_threshold: '1000',
        max_withdrawal: '10000',
        support_email: 'support@lootvibe.com'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:3001';

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BACKEND_URL}/api/admin/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // If API fails, try direct Supabase query structure
                throw new Error('Failed to fetch settings');
            }

            const data = await response.json();
            
            // The API returns settings in key-value format, but we also need to check flat structure
            // Try to get from platform_settings table directly
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
            const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
            const supabase = createClient(supabaseUrl, supabaseKey);

            const { data: platformSettings } = await supabase
                .from('platform_settings')
                .select('*')
                .eq('id', 'default')
                .single();

            if (platformSettings) {
                setSettings({
                    min_btc_deposit: '0.0001',
                    min_eth_deposit: '0.01',
                    btc_confirmations: '3',
                    eth_confirmations: '12',
                    platform_fee: '5',
                    maintenance_mode: false,
                    kyc_required: platformSettings.kyc_required || false,
                    auto_approve_withdrawals: platformSettings.auto_approve_withdrawals || false,
                    manual_approval_threshold: platformSettings.manual_approval_threshold?.toString() || '1000',
                    max_withdrawal: platformSettings.max_withdrawal_amount?.toString() || '10000',
                    support_email: 'support@lootvibe.com'
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Keep default settings
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage('');

            // Update platform_settings table directly
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = 'https://cbjdasfnwzizfphnwxfd.supabase.co';
            const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
            const supabase = createClient(supabaseUrl, supabaseKey);

            const { error } = await supabase
                .from('platform_settings')
                .update({
                    auto_approve_withdrawals: settings.auto_approve_withdrawals,
                    manual_approval_threshold: parseFloat(settings.manual_approval_threshold) || 1000,
                    max_withdrawal_amount: parseFloat(settings.max_withdrawal) || 10000,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 'default');

            if (error) throw error;

            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            console.error('Error saving settings:', error);
            setMessage(`Failed to save settings: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading settings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Platform Settings</h1>
                <p className="text-slate-400">Configure platform parameters and limits</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.includes('success')
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {message}
                </div>
            )}

            <div className="space-y-6">
                {/* Crypto Settings */}
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Bitcoin className="w-6 h-6 text-orange-400" />
                        <h2 className="text-xl font-bold text-white">Cryptocurrency Settings</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Minimum BTC Deposit
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                value={settings.min_btc_deposit}
                                onChange={(e) => setSettings({ ...settings, min_btc_deposit: e.target.value })}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Minimum ETH Deposit
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={settings.min_eth_deposit}
                                onChange={(e) => setSettings({ ...settings, min_eth_deposit: e.target.value })}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                BTC Required Confirmations
                            </label>
                            <input
                                type="number"
                                value={settings.btc_confirmations}
                                onChange={(e) => setSettings({ ...settings, btc_confirmations: e.target.value })}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                ETH Required Confirmations
                            </label>
                            <input
                                type="number"
                                value={settings.eth_confirmations}
                                onChange={(e) => setSettings({ ...settings, eth_confirmations: e.target.value })}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Financial Settings */}
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <DollarSign className="w-6 h-6 text-green-400" />
                        <h2 className="text-xl font-bold text-white">Financial Settings</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Platform Fee (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={settings.platform_fee}
                                onChange={(e) => setSettings({ ...settings, platform_fee: e.target.value })}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Max Withdrawal ($)
                            </label>
                            <input
                                type="number"
                                value={settings.max_withdrawal}
                                onChange={(e) => setSettings({ ...settings, max_withdrawal: e.target.value })}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Security & Compliance */}
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Shield className="w-6 h-6 text-blue-400" />
                        <h2 className="text-xl font-bold text-white">Security & Compliance</h2>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.kyc_required}
                                onChange={(e) => setSettings({ ...settings, kyc_required: e.target.checked })}
                                className="w-5 h-5 rounded border-white/10"
                            />
                            <div>
                                <div className="text-white font-bold">Require KYC Verification</div>
                                <div className="text-sm text-slate-400">Users must verify identity before deposits</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.auto_approve_withdrawals}
                                onChange={(e) => setSettings({ ...settings, auto_approve_withdrawals: e.target.checked })}
                                className="w-5 h-5 rounded border-white/10"
                            />
                            <div>
                                <div className="text-white font-bold">Auto-Approve Withdrawals</div>
                                <div className="text-sm text-slate-400">Automatically approve withdrawal requests without manual review</div>
                            </div>
                        </label>
                        {settings.auto_approve_withdrawals && (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-4">
                                <p className="text-blue-400 text-sm">
                                    ℹ️ Auto-approval is enabled. Withdrawals below the threshold will be approved automatically.
                                </p>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">
                                        Manual Approval Threshold ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={settings.manual_approval_threshold}
                                        onChange={(e) => setSettings({ ...settings, manual_approval_threshold: e.target.value })}
                                        className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                                        placeholder="1000"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                        Withdrawals above ${settings.manual_approval_threshold} will require manual approval even with auto-approve enabled. This helps prevent large fraudulent withdrawals.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Maintenance Mode */}
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <AlertTriangle className="w-6 h-6 text-yellow-400" />
                        <h2 className="text-xl font-bold text-white">Maintenance Mode</h2>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.maintenance_mode}
                                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                                className="w-5 h-5 rounded border-white/10"
                            />
                            <div>
                                <div className="text-white font-bold">Enable Maintenance Mode</div>
                                <div className="text-sm text-slate-400">Platform will be inaccessible to users</div>
                            </div>
                        </label>
                        {settings.maintenance_mode && (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <p className="text-yellow-400 text-sm">
                                    ⚠️ Warning: Enabling maintenance mode will prevent users from accessing the platform.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* General */}
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <SettingsIcon className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">General</h2>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Support Email
                        </label>
                        <input
                            type="email"
                            value={settings.support_email}
                            onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};
