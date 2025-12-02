import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, RefreshCw, Copy, Check } from 'lucide-react';
import { User } from '../types';
import { rotateServerSeed, getServerSeedHash } from '../services/provablyFairService';
import { updateUserState } from '../services/walletService';

interface ProvablyFairModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({ isOpen, onClose, user }) => {
    const [clientSeed, setClientSeed] = useState(user.clientSeed);
    const [serverSeedHash, setServerSeedHash] = useState(user.serverSeedHash || getServerSeedHash());
    const [nonce, setNonce] = useState(user.nonce);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setClientSeed(user.clientSeed);
            setNonce(user.nonce);
            setServerSeedHash(user.serverSeedHash || getServerSeedHash());
        }
    }, [isOpen, user]);

    const handleSaveClientSeed = () => {
        updateUserState({ clientSeed });
        // In a real app, you'd save this to the backend
    };

    const handleRotateServerSeed = () => {
        const newHash = rotateServerSeed();
        setServerSeedHash(newHash);
        updateUserState({ serverSeedHash: newHash, nonce: 0 }); // Reset nonce on seed rotation
        setNonce(0);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#1e293b]/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="font-display font-bold text-xl text-white">Provably Fair</h2>
                            <p className="text-xs text-slate-400">Verify every game outcome</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Server Seed Hash */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Server Seed (Hashed)</label>
                        <div className="bg-[#0b0f19] border border-white/10 rounded-lg p-3 flex items-center justify-between gap-2">
                            <code className="text-xs text-emerald-400 truncate font-mono">{serverSeedHash}</code>
                            <button onClick={() => copyToClipboard(serverSeedHash)} className="text-slate-500 hover:text-white">
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        <button
                            onClick={handleRotateServerSeed}
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1"
                        >
                            <RefreshCw className="w-3 h-3" /> Rotate Server Seed
                        </button>
                    </div>

                    {/* Client Seed */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Seed</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={clientSeed}
                                onChange={(e) => setClientSeed(e.target.value)}
                                className="flex-1 bg-[#0b0f19] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <button
                                onClick={handleSaveClientSeed}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-lg font-bold text-sm transition-colors"
                            >
                                SAVE
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500">This seed is combined with the server seed to generate the result. You can change it anytime.</p>
                    </div>

                    {/* Nonce */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nonce</label>
                        <div className="bg-[#0b0f19] border border-white/10 rounded-lg p-3 text-sm text-slate-300 font-mono">
                            {nonce}
                        </div>
                        <p className="text-[10px] text-slate-500">Increments by 1 for every game played with this seed pair.</p>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-[#0b0f19] border-t border-white/5 text-center">
                    <a href="#" className="text-xs text-slate-500 hover:text-white underline">Learn how our Provably Fair system works</a>
                </div>

            </div>
        </div>
    );
};
