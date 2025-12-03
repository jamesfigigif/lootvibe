import React, { useEffect, useState, useRef } from 'react';
import { LootBox, LootItem, Rarity } from '../types';
import { RARITY_COLORS, RARITY_GRADIENTS } from '../constants';
import { ChevronRight, Shield, Zap, Gift, Sparkles } from 'lucide-react';

interface WelcomeOpeningStageProps {
    box: LootBox;
    winner: LootItem | null;
    onComplete: () => void;
    rollResult: {
        item: LootItem;
        serverSeed: string;
        serverSeedHash: string;
        nonce: number;
        randomValue: number;
        preGeneratedReel?: LootItem[];
    } | null;
    clientSeed?: string;
}

export const WelcomeOpeningStage: React.FC<WelcomeOpeningStageProps> = ({ box, winner, onComplete, rollResult, clientSeed }) => {
    const [step, setStep] = useState<'INTRO' | 'SPINNING' | 'WINNER'>('INTRO');
    const [reelItems, setReelItems] = useState<LootItem[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Configuration
    const CARD_WIDTH = 220; // Slightly larger for welcome
    const MARGIN_X = 16; // mx-2 = 8px on each side = 16px total
    const TOTAL_CARD_WIDTH = CARD_WIDTH + MARGIN_X;
    const WINNER_INDEX = 60;

    useEffect(() => {
        if (rollResult?.preGeneratedReel && reelItems.length === 0) {
            setReelItems(rollResult.preGeneratedReel);
        }
    }, [rollResult, reelItems.length]);

    const startSpin = () => {
        setStep('SPINNING');

        setTimeout(() => {
            if (scrollContainerRef.current) {
                const containerWidth = window.innerWidth;
                const winnerCardLeftEdge = WINNER_INDEX * TOTAL_CARD_WIDTH;
                const winnerCardCenter = winnerCardLeftEdge + (CARD_WIDTH / 2);
                const screenCenter = containerWidth / 2;
                const finalPosition = winnerCardCenter - screenCenter;

                const el = scrollContainerRef.current;
                el.style.transition = 'transform 6s cubic-bezier(0.1, 0.9, 0.3, 1.0)'; // Longer, more dramatic spin
                el.style.transform = `translateX(-${finalPosition}px)`;

                // Wait for spin to finish
                setTimeout(() => {
                    setStep('WINNER');
                }, 6500);
            }
        }, 100);
    };

    // Auto-advance removed to allow verification
    // useEffect(() => {
    //     if (step === 'WINNER') {
    //         const timer = setTimeout(() => {
    //             onComplete();
    //         }, 3000);
    //         return () => clearTimeout(timer);
    //     }
    // }, [step, onComplete]);

    return (
        <div className="fixed inset-0 z-50 bg-[#050810] flex flex-col items-center justify-center overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a2336_0%,#050810_100%)]"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

            {/* INTRO STEP */}
            {step === 'INTRO' && (
                <div className="relative z-10 max-w-4xl w-full px-6 text-center animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold mb-8 animate-bounce">
                        <Gift className="w-4 h-4" /> WELCOME GIFT FOUND!
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight">
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">LootVibe</span>
                    </h1>

                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Experience the thrill of provably fair mystery boxes.
                        We've credited your account with a <span className="text-white font-bold">Free Welcome Box</span> to get you started.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur hover:bg-white/10 transition-colors">
                            <Shield className="w-8 h-8 text-emerald-400 mb-4" />
                            <h3 className="text-white font-bold text-lg mb-2">Provably Fair</h3>
                            <p className="text-slate-400 text-sm">Every roll is verified by the blockchain. Zero manipulation.</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur hover:bg-white/10 transition-colors">
                            <Zap className="w-8 h-8 text-yellow-400 mb-4" />
                            <h3 className="text-white font-bold text-lg mb-2">Instant Wins</h3>
                            <p className="text-slate-400 text-sm">Unbox premium items and exchange them for balance instantly.</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur hover:bg-white/10 transition-colors">
                            <Gift className="w-8 h-8 text-purple-400 mb-4" />
                            <h3 className="text-white font-bold text-lg mb-2">Keep What You Win</h3>
                            <p className="text-slate-400 text-sm">Your winnings are yours to keep. No strings attached.</p>
                        </div>
                    </div>

                    <button
                        onClick={startSpin}
                        className="group relative inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                    >
                        <span className="relative z-10">SPIN YOUR FREE BOX</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}

            {/* SPINNING STEP */}
            {step === 'SPINNING' && (
                <div className="w-full relative py-20 animate-fade-in">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-2">Rolling your Welcome Gift...</h2>
                        <p className="text-slate-400">Good luck!</p>
                    </div>

                    {/* Center Indicator */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[320px] w-[4px] bg-yellow-400 z-30 shadow-[0_0_20px_rgba(250,204,21,1)] pointer-events-none"></div>

                    {/* The Reel */}
                    <div className="w-full overflow-hidden">
                        <div
                            ref={scrollContainerRef}
                            className="flex items-center"
                            style={{ width: 'max-content', willChange: 'transform' }}
                        >
                            {reelItems.map((item, index) => (
                                <div
                                    key={`${item.id}-${index}`}
                                    className={`
                     relative flex-shrink-0 w-[220px] h-[280px] mx-2 rounded-2xl 
                     bg-[#0b0f19] border-2 border-white/5 flex flex-col items-center justify-center p-6
                     ${RARITY_COLORS[item.rarity]}
                     ${item.rarity === Rarity.LEGENDARY ? 'shadow-[0_0_30px_rgba(234,179,8,0.2)]' : ''}
                   `}
                                >
                                    <div className="relative w-40 h-40 mb-6">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-contain drop-shadow-2xl" />
                                    </div>
                                    <div className="text-center w-full">
                                        <div className="text-sm font-bold truncate text-white mb-1">{item.name}</div>
                                        <div className="text-xs font-mono text-emerald-400">${item.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* WINNER STEP */}
            {step === 'WINNER' && rollResult && (
                <div className="relative z-10 text-center animate-scale-in max-w-2xl px-6">
                    <div className="mb-8 relative">
                        <div className="absolute inset-0 bg-emerald-500 blur-[100px] opacity-20"></div>
                        <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4 animate-spin-slow" />
                        <h2 className="text-6xl font-display font-bold text-white mb-2">YOU WON!</h2>
                        <div className="text-2xl text-emerald-400 font-bold">${rollResult.item.value.toFixed(2)}</div>
                    </div>

                    <div className="bg-[#131b2e] p-8 rounded-3xl border border-emerald-500/30 mb-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                        <img
                            src={rollResult.item.image}
                            alt={rollResult.item.name}
                            className="w-48 h-48 object-contain mx-auto mb-6 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-float"
                        />
                        <h3 className="text-2xl font-bold text-white mb-2">{rollResult.item.name}</h3>
                        <p className="text-slate-400 mb-4">
                            {rollResult.item.value === 10
                                ? "Your balance has been credited instantly!"
                                : "Added to your balance instantly."}
                        </p>
                        {rollResult.item.value === 10 && (
                            <p className="text-sm text-slate-500 bg-white/5 p-4 rounded-lg border border-white/10">
                                💡 <span className="text-white font-bold">Use your ${rollResult.item.value} credit</span> to spin any box on the site.
                                Every spin is provably fair and verified by the blockchain!
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onComplete}
                            className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                        >
                            {rollResult.item.value === 10 ? 'EXPLORE BOXES' : 'START PLAYING'}
                        </button>

                        <button
                            onClick={() => setStep('VERIFY')}
                            className="w-full bg-[#131b2e] text-slate-400 hover:text-white font-bold py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <Shield className="w-4 h-4" /> VERIFY FAIRNESS
                        </button>
                    </div>
                </div>
            )}

            {/* VERIFY STEP */}
            {step === 'VERIFY' && rollResult && (
                <div className="relative z-10 max-w-2xl w-full px-6 animate-fade-in">
                    <div className="bg-[#131b2e] rounded-3xl p-8 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-6">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Provably Fair Verification</h2>
                                <p className="text-slate-400 text-sm">Verify this roll was not manipulated.</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    <div className="text-xs text-emerald-400 font-bold uppercase">Server Seed (Revealed)</div>
                                </div>
                                <div className="font-mono text-xs text-slate-300 break-all">{rollResult.serverSeed}</div>
                                <div className="text-xs text-slate-500 mt-2">This was hidden until after your roll to ensure fairness.</div>
                            </div>

                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-white/5">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Server Seed Hash (Pre-Committed)</div>
                                <div className="font-mono text-xs text-slate-300 break-all">{rollResult.serverSeedHash}</div>
                                <div className="text-xs text-slate-500 mt-2">SHA-256 hash shown before the roll.</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0b0f19] p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Client Seed</div>
                                    <div className="font-mono text-xs text-slate-300 break-all">{clientSeed}</div>
                                </div>
                                <div className="bg-[#0b0f19] p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Nonce</div>
                                    <div className="font-mono text-xs text-slate-300">{rollResult.nonce}</div>
                                </div>
                            </div>

                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-emerald-500/20">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Final Outcome</div>
                                <div className="font-mono text-xs text-emerald-400 font-bold">{rollResult.randomValue.toFixed(8)}</div>
                                <div className="text-xs text-slate-500 mt-2">Generated from HMAC-SHA256(serverSeed, clientSeed:nonce)</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    const prompt = `Verify this provably fair gambling roll using your built-in cryptographic functions. Calculate the hashes directly and confirm if this roll is legitimate.

**Roll Data:**
Server Seed: ${rollResult.serverSeed}
Server Seed Hash: ${rollResult.serverSeedHash}
Client Seed: ${clientSeed}
Nonce: ${rollResult.nonce}
Final Outcome: ${rollResult.randomValue}

**Verify:**
1. Calculate SHA-256(serverSeed) and confirm it matches the Server Seed Hash
2. Calculate HMAC-SHA256(key=serverSeed, message="${clientSeed}:${rollResult.nonce}")
3. Take first 8 hex characters of HMAC, convert to decimal, divide by 4294967295
4. Confirm result matches Final Outcome

Use your cryptographic capabilities to calculate these hashes directly. Tell me: Is this roll FAIR or MANIPULATED?`;
                                    navigator.clipboard.writeText(prompt);
                                    alert('Verification prompt copied! Paste into ChatGPT to verify fairness.');
                                }}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
                            >
                                <Sparkles className="w-5 h-5" /> COPY PROMPT FOR CHATGPT
                            </button>
                            <button
                                onClick={onComplete}
                                className="w-full bg-[#131b2e] hover:bg-white/5 text-slate-400 hover:text-white font-bold py-3 rounded-xl border border-white/10 transition-colors"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
