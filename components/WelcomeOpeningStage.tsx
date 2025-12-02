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
        block: { height: number; hash: string };
        randomValue: number;
        preGeneratedReel?: LootItem[];
    } | null;
}

export const WelcomeOpeningStage: React.FC<WelcomeOpeningStageProps> = ({ box, winner, onComplete, rollResult }) => {
    const [step, setStep] = useState<'INTRO' | 'SPINNING' | 'WINNER'>('INTRO');
    const [reelItems, setReelItems] = useState<LootItem[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Configuration
    const CARD_WIDTH = 220; // Slightly larger for welcome
    const MARGIN_X = 16;
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
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[320px] w-[4px] bg-yellow-400 z-30 shadow-[0_0_20px_rgba(250,204,21,1)]"></div>

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
                        <p className="text-slate-400">Added to your balance instantly.</p>
                    </div>

                    <button
                        onClick={onComplete}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                    >
                        START PLAYING
                    </button>
                </div>
            )}
        </div>
    );
};
