import React, { useEffect, useState, useRef } from 'react';
import { LootBox, LootItem, Rarity } from '../types';
import { RARITY_COLORS, RARITY_BG, RARITY_GRADIENTS } from '../constants';
import { ChevronLeft, Volume2, ShieldCheck, Box, Hash, Percent, Loader2 } from 'lucide-react';

interface OpeningStageProps {
  box: LootBox;
  winner: LootItem | null;
  onBack: () => void;
  onComplete: () => void;
  isOpening: boolean;
  isDemoMode?: boolean;
  // Updated Prop Type for Block Data
  rollResult: {
    item: LootItem;
    block: { height: number; hash: string };
    randomValue: number;
    preGeneratedReel?: LootItem[];
  } | null;
}

export const OpeningStage: React.FC<OpeningStageProps> = ({ box, winner, onBack, onComplete, isOpening, rollResult, isDemoMode = false }) => {
  const [reelItems, setReelItems] = useState<LootItem[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const reelGeneratedRef = useRef(false); // Track if reel has been generated

  // Use rollResult.item as the authoritative winner source
  const actualWinner = rollResult?.item || winner;

  // Configuration
  const CARD_WIDTH = 200;
  const MARGIN_X = 16; // mx-2 = 8px * 2
  const TOTAL_CARD_WIDTH = CARD_WIDTH + MARGIN_X;
  const WINNER_INDEX = 60; // Increased index for longer spin time

  useEffect(() => {
    // Use the pre-generated reel from rollResult (generated in App.tsx)
    // This ensures the reel is generated EXACTLY ONCE and matches the prize
    if (rollResult?.preGeneratedReel && reelItems.length === 0) {
      setReelItems(rollResult.preGeneratedReel);
    }
  }, [rollResult, actualWinner, reelItems.length]);

  // Preload Images Effect
  useEffect(() => {
    if (reelItems.length === 0) return;

    const preloadImages = async () => {
      console.log('🔄 Preloading reel images...');

      // Get unique images to load
      const uniqueImages = Array.from(new Set(reelItems.map(item => item.image)));

      const loadPromises = uniqueImages.map(src => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = resolve; // Continue even if one fails
        });
      });

      try {
        await Promise.all(loadPromises);
        console.log('✅ All reel images preloaded');
        setImagesLoaded(true);
      } catch (error) {
        console.error('Error preloading images:', error);
        setImagesLoaded(true); // Proceed anyway
      }
    };

    preloadImages();
  }, [reelItems]);

  // Reset the ref when component unmounts (for next box opening)
  useEffect(() => {
    return () => {
      reelGeneratedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Only start animation if opening, container exists, reel exists AND images are loaded
    if (isOpening && scrollContainerRef.current && reelItems.length > 0 && imagesLoaded) {
      // Calculate final position
      const containerWidth = window.innerWidth;

      // The reel starts at x=0 (no initial offset)
      // Each card is TOTAL_CARD_WIDTH (200px + 16px margin = 216px)
      // Winner is at index 60
      // We want the CENTER of the winner card to align with the CENTER of the screen
      //
      // Winner card left edge = WINNER_INDEX * TOTAL_CARD_WIDTH
      // Winner card center = Winner card left edge + (CARD_WIDTH / 2)
      // Screen center = containerWidth / 2
      // 
      // To center the winner card, we need to translate the reel by:
      // -(Winner card center - Screen center)
      // Which simplifies to: Screen center - Winner card center

      const winnerCardLeftEdge = WINNER_INDEX * TOTAL_CARD_WIDTH;
      const winnerCardCenter = winnerCardLeftEdge + (CARD_WIDTH / 2);
      const screenCenter = containerWidth / 2;
      const finalPosition = winnerCardCenter - screenCenter;

      const el = scrollContainerRef.current;

      // 1. Reset
      el.style.transition = 'none';
      el.style.transform = 'translateX(0px)';

      // Force Reflow
      el.getBoundingClientRect();

      // 2. Animate - Longer 6s animation for better suspense
      // cubic-bezier(0.05, 0.7, 0.1, 1.0) -> Fast start, then VERY long slow tail to simulate friction
      el.style.transition = 'transform 6s cubic-bezier(0.05, 0.7, 0.1, 1.0)';
      el.style.transform = `translateX(-${finalPosition}px)`;

      const timer = setTimeout(() => {
        onComplete();
      }, 6500); // Wait for transition + sticking time

      return () => clearTimeout(timer);
    }
  }, [isOpening, onComplete, reelItems.length, actualWinner, imagesLoaded]);

  // Fun loading messages
  const LOADING_MESSAGES = [
    "GENERATING LUCK...",
    "POLISHING GEMSTONES...",
    "CALCULATING PROBABILITIES...",
    "CONSULTING THE ORACLE...",
    "MANIFESTING RARES...",
    "SYNCING WITH BLOCKCHAIN..."
  ];
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    if (!imagesLoaded) {
      setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }
  }, [imagesLoaded]);

  return (
    <div className="fixed inset-0 z-40 bg-[#0b0f19] flex flex-col">
      {/* Top Controls */}
      <div className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#0b0f19]/50 backdrop-blur z-50">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="font-bold">EXIT</span>
        </button>
        <div className="font-display font-bold text-xl tracking-widest text-purple-500 uppercase flex items-center gap-3">
          {box.name}
          {isDemoMode && (
            <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full font-bold tracking-wider">
              DEMO MODE
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onComplete}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-white transition-colors"
          >
            SKIP
          </button>
          <button className="text-slate-400 hover:text-white">
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">

        {/* Loading Spinner for Assets */}
        {!imagesLoaded && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0f19]/80 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
            <div className="text-sm font-bold text-slate-400 tracking-widest uppercase animate-pulse">{loadingMsg}</div>
          </div>
        )}

        {/* Background Effects */}
        <div className={`absolute inset-0 bg-gradient-to-br ${box.color} opacity-5`}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_70%)]"></div>

        {/* LootVibe Watermark Logo - Positioned at top to avoid interference */}
        <div className="absolute top-4 md:top-24 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="text-center animate-[fadeWatermark_4s_ease-out_forwards]">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg className="w-12 h-12 md:w-16 md:h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-2xl md:text-4xl font-bold">
              <span className="text-white">LOOT</span><span className="text-purple-500">VIBE</span>
            </div>
            <div className="text-[10px] md:text-xs font-medium text-slate-400 tracking-widest mt-0.5">PROVABLY FAIR</div>
          </div>
        </div>

        {/* Center Indicator (The Needle) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[260px] w-[2px] bg-yellow-400 z-30 shadow-[0_0_15px_rgba(250,204,21,1)] pointer-events-none">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-yellow-400 rotate-45 shadow-[0_0_10px_rgba(250,204,21,0.8)] border-4 border-[#0b0f19]"></div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-yellow-400 rotate-45 shadow-[0_0_10px_rgba(250,204,21,0.8)] border-4 border-[#0b0f19]"></div>
        </div>

        {/* The Reel */}
        <div className="w-full relative py-12">
          <div
            ref={scrollContainerRef}
            className="flex items-center"
            style={{ width: 'max-content', willChange: 'transform' }}
          >
            {reelItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className={`
                            relative flex-shrink-0 w-[200px] h-[200px] mx-2 rounded-2xl 
                            bg-[#131b2e] border-b-[6px] flex flex-col items-center justify-center p-4
                            transform transition-transform duration-300
                            ${RARITY_COLORS[item.rarity]}
                            ${item.rarity === Rarity.LEGENDARY ? 'shadow-[0_0_30px_rgba(234,179,8,0.15)] border-yellow-500/30' : 'shadow-lg'}
                        `}
              >
                {/* Card Glow Background */}
                <div className={`absolute inset-0 opacity-10 rounded-xl bg-gradient-to-br ${RARITY_GRADIENTS[item.rarity]}`}></div>

                <div className="relative w-32 h-32 mb-4 z-10">
                  <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-contain drop-shadow-2xl" />
                </div>

                <div className="relative z-10 text-center w-full">
                  <div className="text-sm font-bold truncate px-2 text-slate-200">{item.name}</div>
                  <div className="text-xs font-mono opacity-60 mt-1 text-slate-400">${item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Provably Fair Info */}
      <div className="h-24 border-t border-white/5 bg-[#0e121e] flex flex-col justify-center px-8 relative z-20">
        <div className="max-w-4xl mx-auto w-full grid grid-cols-3 gap-8 text-xs font-mono text-slate-500">
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-slate-300">
              <Box className="w-3 h-3 text-orange-500" /> BITCOIN BLOCK
            </div>
            <div className="truncate opacity-70">
              {rollResult?.block ? `#${rollResult.block.height}` : 'WAITING_FOR_MINER...'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-slate-300">
              <Hash className="w-3 h-3 text-blue-500" /> BLOCK HASH
            </div>
            <div className="truncate opacity-70">
              {rollResult?.block ? rollResult.block.hash : 'MINING...'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-slate-300">
              <Percent className="w-3 h-3 text-purple-500" /> RANDOM ROLL (0-1)
            </div>
            <div className="truncate text-emerald-400 font-bold">
              {rollResult ? rollResult.randomValue.toFixed(16) : 'CALCULATING...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};