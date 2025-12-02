import React, { useState, useEffect } from 'react';
import { Shield, Key, Smartphone, CheckCircle, AlertCircle, Copy } from 'lucide-react';

interface TwoFactorAuthProps {
    token: string;
    adminUser: any;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ token, adminUser }) => {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [showSetup, setShowSetup] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    useEffect(() => {
        setEnabled(adminUser?.two_fa_enabled || false);
    }, [adminUser]);

    const handleEnable2FA = async () => {
        try {
            setLoading(true);
            setMessage('');

            const response = await fetch(`${BACKEND_URL}/api/admin/2fa/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate 2FA setup');
            }

            setSecret(data.secret);
            setQrCode(data.qrCode);
            setShowSetup(true);
        } catch (error: any) {
            setMessage(error.message || 'Failed to generate 2FA setup');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndEnable = async () => {
        if (verificationCode.length !== 6) {
            setMessage('Please enter a 6-digit code');
            setMessageType('error');
            return;
        }

        try {
            setLoading(true);
            setMessage('');

            const response = await fetch(`${BACKEND_URL}/api/admin/2fa/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: verificationCode })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid verification code');
            }

            setEnabled(true);
            setShowSetup(false);
            setMessage('2FA has been successfully enabled!');
            setMessageType('success');
            setVerificationCode('');
        } catch (error: any) {
            setMessage(error.message || 'Invalid verification code');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!confirm('Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.')) {
            return;
        }

        const password = prompt('Enter your password to disable 2FA:');
        if (!password) {
            return;
        }

        try {
            setLoading(true);
            setMessage('');

            const response = await fetch(`${BACKEND_URL}/api/admin/2fa/disable`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to disable 2FA');
            }

            setEnabled(false);
            setMessage('2FA has been disabled');
            setMessageType('success');
        } catch (error: any) {
            setMessage(error.message || 'Failed to disable 2FA');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const copySecret = () => {
        navigator.clipboard.writeText(secret);
        setMessage('Secret key copied to clipboard!');
        setMessageType('success');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Two-Factor Authentication</h1>
                <p className="text-slate-400">Add an extra layer of security to your admin account</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                    messageType === 'success'
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                    {messageType === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <p>{message}</p>
                </div>
            )}

            {/* Current Status */}
            <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                            enabled ? 'bg-green-500/20' : 'bg-slate-500/20'
                        }`}>
                            <Shield className={`w-8 h-8 ${enabled ? 'text-green-400' : 'text-slate-400'}`} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">
                                2FA Status: {enabled ? 'Enabled' : 'Disabled'}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {enabled
                                    ? 'Your account is protected with two-factor authentication'
                                    : 'Enable 2FA to add extra security to your account'
                                }
                            </p>
                        </div>
                    </div>
                    <div>
                        {enabled ? (
                            <button
                                onClick={handleDisable2FA}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                                Disable 2FA
                            </button>
                        ) : (
                            <button
                                onClick={handleEnable2FA}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                                Enable 2FA
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Setup Flow */}
            {showSetup && !enabled && (
                <div className="space-y-6">
                    {/* Step 1: Install App */}
                    <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-purple-400 font-bold">1</span>
                            </div>
                            <h3 className="text-lg font-bold text-white">Download Authenticator App</h3>
                        </div>
                        <p className="text-slate-400 mb-4">
                            Download an authenticator app on your smartphone:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[#0b0f19] p-4 rounded-lg border border-white/10">
                                <Smartphone className="w-8 h-8 text-blue-400 mb-2" />
                                <div className="font-bold text-white mb-1">Google Authenticator</div>
                                <div className="text-xs text-slate-400">iOS & Android</div>
                            </div>
                            <div className="bg-[#0b0f19] p-4 rounded-lg border border-white/10">
                                <Smartphone className="w-8 h-8 text-green-400 mb-2" />
                                <div className="font-bold text-white mb-1">Authy</div>
                                <div className="text-xs text-slate-400">iOS, Android & Desktop</div>
                            </div>
                            <div className="bg-[#0b0f19] p-4 rounded-lg border border-white/10">
                                <Smartphone className="w-8 h-8 text-purple-400 mb-2" />
                                <div className="font-bold text-white mb-1">Microsoft Authenticator</div>
                                <div className="text-xs text-slate-400">iOS & Android</div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Scan QR Code */}
                    <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-purple-400 font-bold">2</span>
                            </div>
                            <h3 className="text-lg font-bold text-white">Scan QR Code</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-slate-400 mb-4">
                                    Scan this QR code with your authenticator app:
                                </p>
                                {qrCode && (
                                    <div className="bg-white p-4 rounded-lg inline-block">
                                        <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-slate-400 mb-2">Or enter this secret key manually:</p>
                                <div className="bg-[#0b0f19] p-4 rounded-lg border border-white/10 mb-3">
                                    <div className="flex items-center justify-between">
                                        <code className="text-white font-mono text-sm">{secret}</code>
                                        <button
                                            onClick={copySecret}
                                            className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded transition-colors"
                                            title="Copy secret"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500">
                                    Save this secret key in a safe place. You'll need it to recover your account if you lose access to your authenticator app.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Verify */}
                    <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-purple-400 font-bold">3</span>
                            </div>
                            <h3 className="text-lg font-bold text-white">Verify Code</h3>
                        </div>
                        <p className="text-slate-400 mb-4">
                            Enter the 6-digit code from your authenticator app:
                        </p>
                        <div className="flex items-center gap-4 max-w-md">
                            <input
                                type="text"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:border-purple-500 focus:outline-none"
                                placeholder="000000"
                            />
                            <button
                                onClick={handleVerifyAndEnable}
                                disabled={loading || verificationCode.length !== 6}
                                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Verify & Enable
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => {
                                setShowSetup(false);
                                setVerificationCode('');
                            }}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Info When Enabled */}
            {enabled && (
                <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">What's Next?</h3>
                    <div className="space-y-3 text-sm text-slate-400">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="text-white font-bold">You're now protected</div>
                                <div>Next time you login, you'll need to enter a code from your authenticator app</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Key className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="text-white font-bold">Keep your device secure</div>
                                <div>Make sure your phone is password protected and backed up</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="text-white font-bold">Lost your device?</div>
                                <div>Contact support immediately to regain access to your account</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
