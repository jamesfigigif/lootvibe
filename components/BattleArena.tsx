import React, { useEffect, useState, useRef } from 'react';
import { Battle, LootBox, LootItem, BattlePlayerResult, User } from '../types';
import { INITIAL_BOXES, RARITY_COLORS, RARITY_GRADIENTS, RARITY_BG } from '../constants';
import { generateOutcome } from '../services/provablyFairService';
import { supabase } from '../services/supabaseClient';
import { ShieldCheck, ArrowLeft, Crown, Trophy, Coins, Zap, Flame, Loader2, Skull, Smile, Eye, Copy, Check, X, RefreshCw } from 'lucide-react';
import CryptoJS from 'crypto-js';

interface BattleArenaProps {
    battle: Battle;
    user: User | null;
    onBack: () => void;
    onClaim: (amount: number, items?: LootItem[]) => void;
    onCreateRematch?: (battle: Battle) => void;
}

interface FloatingEmote {
    id: number;
    emoji: string;
    x: number;
    y: number;
}

// --- SUB-COMPONENT: BATTLE REEL ---
const BattleReel = ({
    player,
    item,
    isSpinning,
    boxItems,
    isWinner,
    isCrazyMode,
    playerCount = 2
}: {
    player: any,
    item: LootItem | null,
    isSpinning: boolean,
    boxItems: LootItem[],
    isWinner: boolean,
    isCrazyMode: boolean,
    playerCount?: number
}) => {
    const [reelItems, setReelItems] = useState<LootItem[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [tickerAnimationComplete, setTickerAnimationComplete] = useState(false);

    // Configuration for ticker - larger for 2v2/3v3
    const CARD_WIDTH = playerCount === 4 ? 240 : playerCount === 6 ? 220 : 200;
    const MARGIN_X = playerCount === 4 ? 20 : playerCount === 6 ? 18 : 16;
    const TOTAL_CARD_WIDTH = CARD_WIDTH + MARGIN_X;
    const WINNER_INDEX = 40;

    // Generate reel when item is determined OR when spinning starts
    useEffect(() => {
        if (item) {
            // Always regenerate if item changes or reel is empty
            const needsUpdate = reelItems.length === 0 ||
                (reelItems.length > 0 && reelItems[WINNER_INDEX]?.id !== item.id);

            if (needsUpdate) {
                const totalItems = 80; // Total items in reel
                const newReelItems: LootItem[] = [];

                // Get high tier items for teasing
                const highTierItems = boxItems.filter(i => i.rarity === 'LEGENDARY' || i.rarity === 'EPIC');

                for (let i = 0; i < totalItems; i++) {
                    if (i === WINNER_INDEX) {
                        // Place winner at the target index
                        newReelItems.push(item);
                    } else if (i === WINNER_INDEX + 1 || i === WINNER_INDEX - 1) {
                        // Tease with high tier items near winner
                        if (Math.random() > 0.5 && highTierItems.length > 0) {
                            const randomTease = highTierItems[Math.floor(Math.random() * highTierItems.length)];
                            newReelItems.push(randomTease.id !== item.id ? randomTease : boxItems[0]);
                        } else {
                            const randomItem = boxItems[Math.floor(Math.random() * boxItems.length)];
                            newReelItems.push({ ...randomItem, id: `${randomItem.id}-${i}` });
                        }
                    } else {
                        // Random items elsewhere
                        const randomItem = boxItems[Math.floor(Math.random() * boxItems.length)];
                        newReelItems.push({ ...randomItem, id: `${randomItem.id}-${i}` });
                    }
                }

                setReelItems(newReelItems);
            }
        } else if (isSpinning && reelItems.length === 0) {
            // If spinning but no item yet, generate placeholder reel so ticker can show
            const totalItems = 80;
            const newReelItems: LootItem[] = [];
            for (let i = 0; i < totalItems; i++) {
                const randomItem = boxItems[Math.floor(Math.random() * boxItems.length)];
                newReelItems.push({ ...randomItem, id: `${randomItem.id}-${i}` });
            }
            setReelItems(newReelItems);
        }
    }, [item, boxItems, isSpinning, reelItems.length]);

    // Animate ticker when spinning starts or when item is determined
    useEffect(() => {
        if (isSpinning && reelItems.length > 0 && scrollContainerRef.current && !tickerAnimationComplete) {
            const containerWidth = scrollContainerRef.current.parentElement?.clientWidth || 200;

            // If item is set, use it as the target. Otherwise, use a random position
            const targetIndex = item ? WINNER_INDEX : Math.floor(Math.random() * (reelItems.length - 20)) + 10;
            const targetCardLeftEdge = targetIndex * TOTAL_CARD_WIDTH;
            const targetCardCenter = targetCardLeftEdge + (CARD_WIDTH / 2);
            const screenCenter = containerWidth / 2;
            const finalPosition = targetCardCenter - screenCenter;

            const el = scrollContainerRef.current;

            // Reset
            el.style.transition = 'none';
            el.style.transform = 'translateX(0px)';
            el.getBoundingClientRect();

            // Animate - duration matches spin duration (4-5 seconds)
            const animationDuration = 4000 + Math.random() * 1000; // 4-5 seconds
            el.style.transition = `transform ${animationDuration}ms cubic-bezier(0.15, 0.85, 0.35, 1.00)`;
            el.style.transform = `translateX(-${finalPosition}px)`;

            setTimeout(() => {
                setTickerAnimationComplete(true);
            }, animationDuration + 200);
        }
    }, [isSpinning, item, reelItems.length, tickerAnimationComplete]);

    // Reset ticker animation when new spin starts (but keep reel items)
    useEffect(() => {
        if (isSpinning) {
            setTickerAnimationComplete(false);
            // Don't clear reelItems - we need them for the animation
        }
    }, [isSpinning]);

    return (
        <div className={`
            relative flex flex-col bg-[#131b2e] rounded-2xl overflow-hidden transition-all duration-300 h-full
            ${isWinner ? (isCrazyMode ? 'border-2 border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.2)]' : 'border-2 border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.2)]') : 'border border-white/5 opacity-90'}
            ${isWinner ? 'scale-[1.02] z-10' : ''}
        `}>
            {/* Player Header */}
            <div className={`p-3 border-b border-white/5 flex items-center gap-3 ${isWinner ? (isCrazyMode ? 'bg-purple-500/10' : 'bg-yellow-500/10') : 'bg-[#0d121f]'}`}>
                <div className="relative">
                    {player ? (
                        <img src={player.avatar} className={`w-10 h-10 rounded-full border-2 ${isWinner ? (isCrazyMode ? 'border-purple-500' : 'border-yellow-500') : 'border-white/10'}`} />
                    ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center">?</div>
                    )}

                    {isWinner && (
                        <div className={`absolute -top-3 -right-2 ${isCrazyMode ? 'text-purple-500 border-purple-500' : 'text-yellow-500 border-yellow-500'} bg-black rounded-full p-0.5 border z-20`}>
                            {isCrazyMode ? <Skull className="w-3 h-3 fill-current" /> : <Crown className="w-3 h-3 fill-current" />}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate ${isWinner ? (isCrazyMode ? 'text-purple-400' : 'text-yellow-400') : 'text-white'}`}>
                        {player ? player.username : 'Waiting...'}
                    </div>
                </div>
            </div>

            {/* THE SLOT MACHINE WINDOW */}
            <div className={`flex-1 relative overflow-hidden flex items-center justify-center bg-black/40 ${playerCount === 4 ? 'min-h-[320px]' : playerCount === 6 ? 'min-h-[300px]' : 'min-h-[280px]'}`}>


                {/* TICKER REEL (Show during spinning or when item is determined) */}
                {(isSpinning || item) && reelItems.length > 0 && (
                    <div className="absolute inset-0 overflow-hidden">
                        {/* Center Indicator (The Needle) - Show during ticker animation */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${playerCount === 4 ? 'h-[280px]' : playerCount === 6 ? 'h-[260px]' : 'h-[240px]'} w-[2px] bg-yellow-400 z-30 shadow-[0_0_15px_rgba(250,204,21,1)] pointer-events-none`}>
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-400 rotate-45 shadow-[0_0_10px_rgba(250,204,21,0.8)] border-2 border-[#131b2e]"></div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-400 rotate-45 shadow-[0_0_10px_rgba(250,204,21,0.8)] border-2 border-[#131b2e]"></div>
                        </div>

                        <div
                            ref={scrollContainerRef}
                            className="flex items-center h-full"
                            style={{ width: 'max-content', willChange: 'transform' }}
                        >
                            {reelItems.map((reelItem, index) => (
                                <div
                                    key={`${reelItem.id}-${index}`}
                                    className={`
                                        relative flex-shrink-0 ${playerCount === 4 ? 'w-[240px] h-[280px]' : playerCount === 6 ? 'w-[220px] h-[260px]' : 'w-[200px] h-[240px]'} mx-2 rounded-xl 
                                        bg-[#0d121f] border flex flex-col items-center justify-center p-1
                                        ${index === WINNER_INDEX && tickerAnimationComplete && item ? 'border-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'border-white/10'}
                                    `}
                                >
                                    {/* Card Glow Background */}
                                    <div className={`absolute inset-0 opacity-5 rounded-lg bg-gradient-to-br ${RARITY_GRADIENTS[reelItem.rarity]}`}></div>

                                    <div className="relative w-full flex-1 z-10 flex items-center justify-center min-h-0">
                                        <img src={reelItem.image} alt={reelItem.name} className="w-full h-full object-contain" />
                                    </div>

                                    <div className="relative z-10 text-center w-full mt-auto pb-2 flex-shrink-0">
                                        <div className="text-sm font-bold truncate px-2 text-slate-300">{reelItem.name}</div>
                                        <div className="text-xs font-mono opacity-60 text-slate-400">${reelItem.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* WAITING STATE */}
                {!isSpinning && !item && (
                    <div className="opacity-20 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white animate-spin-slow"></div>
                    </div>
                )}
            </div>

            {/* ROUND RESULT OVERLAY */}
            {!isSpinning && item && isWinner && (
                <div className={`absolute inset-x-0 bottom-0 h-1 ${isCrazyMode ? 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,1)]' : 'bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,1)]'}`}></div>
            )}
        </div>
    )
}


export const BattleArena: React.FC<BattleArenaProps> = ({ battle, user, onBack, onClaim, onCreateRematch }) => {
    const box = INITIAL_BOXES.find(b => b.id === battle.boxId);
    const isCrazyMode = battle.mode === 'CRAZY';

    // Game State
    const [currentRound, setCurrentRound] = useState(1);
    const [results, setResults] = useState<{ [playerId: string]: BattlePlayerResult }>({});
    const [roundItems, setRoundItems] = useState<{ [playerId: string]: LootItem | null }>({});
    const [tieAttempts, setTieAttempts] = useState(0); // Track tie attempts to ensure different outcomes on re-spins

    // Animation State
    const [gameStatus, setGameStatus] = useState<'WAITING' | 'STARTING' | 'ANTICIPATION' | 'SPINNING' | 'REVEALING' | 'REVEALED' | 'FINISHED'>(
        battle.status === 'FINISHED' ? 'FINISHED' : battle.status === 'WAITING' ? 'WAITING' : 'STARTING'
    );
    const [roundWinnerId, setRoundWinnerId] = useState<string | null>(null);
    const [showCountdown, setShowCountdown] = useState(false);
    const [countdownValue, setCountdownValue] = useState(3);
    const [screenShake, setScreenShake] = useState(false);
    const [flashEffect, setFlashEffect] = useState(false);
    const [confettiActive, setConfettiActive] = useState(false);
    const [displayedScores, setDisplayedScores] = useState<{ [playerId: string]: number }>({});
    const [showFairnessProof, setShowFairnessProof] = useState(false);
    const [copiedSeed, setCopiedSeed] = useState<string | null>(null);
    const [anticipationPhase, setAnticipationPhase] = useState<'BUILDUP' | 'COUNTDOWN' | 'SPINNING' | 'REVEALING' | null>(null);
    const [prizeChoice, setPrizeChoice] = useState<'items' | 'cash' | null>(null);
    const [revealOrder, setRevealOrder] = useState<string[]>([]);
    const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
    const [heartbeatActive, setHeartbeatActive] = useState(false);
    const [lastRoundItems, setLastRoundItems] = useState<{ [playerId: string]: LootItem | null }>({});

    // Rematch State
    const [rematchOffered, setRematchOffered] = useState(false);
    const [rematchAccepted, setRematchAccepted] = useState(false);
    const [rematchDeclined, setRematchDeclined] = useState(false);
    const [rematchTimer, setRematchTimer] = useState(10); // 10 second timer
    const rematchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Store provably fair data for each round
    const [fairnessData, setFairnessData] = useState<Array<{
        round: number;
        players: Array<{
            playerId: string;
            username: string;
            clientSeed: string;
            nonce: number;
            item: LootItem;
        }>;
    }>>([]);

    // Emotes
    const [emotes, setEmotes] = useState<FloatingEmote[]>([]);
    const nextEmoteId = useRef(0);

    // Refs for logic control
    const mountedRef = useRef(true);
    const spinInProgress = useRef(false);
    const determineWinnerRef = useRef<(() => void) | null>(null);

    // To avoid stale closures in timeouts/async logic, we use a ref for the latest results
    const resultsRef = useRef<{ [playerId: string]: BattlePlayerResult }>({});

    // Animate score counting
    const animateScore = (playerId: string, from: number, to: number) => {
        const duration = 800;
        const steps = 30;
        const increment = (to - from) / steps;
        let current = from;
        let step = 0;

        const interval = setInterval(() => {
            step++;
            current = from + (increment * step);
            if (step >= steps) {
                current = to;
                clearInterval(interval);
            }
            setDisplayedScores(prev => ({ ...prev, [playerId]: Math.round(current) }));
        }, duration / steps);
    };


    // Initialize displayed scores
    useEffect(() => {
        const initialScores: { [playerId: string]: number } = {};
        battle.players.forEach(player => {
            if (player?.id) {
                initialScores[player.id] = 0;
            }
        });
        setDisplayedScores(initialScores);
    }, [battle.players]);

    // Sync displayed scores with actual results
    useEffect(() => {
        Object.entries(results).forEach(([playerId, result]) => {
            const battleResult = result as BattlePlayerResult;
            if (displayedScores[playerId] !== battleResult.totalValue) {
                if (displayedScores[playerId] === undefined) {
                    setDisplayedScores(prev => ({ ...prev, [playerId]: battleResult.totalValue }));
                }
            }
        });
    }, [results]);

    // Add an emote
    const triggerEmote = (emoji: string) => {
        if (!mountedRef.current) return;
        const id = nextEmoteId.current++;
        const x = 10 + Math.random() * 80; // Random horizontal position 10-90%
        const y = 80;

        setEmotes(prev => [...prev, { id, emoji, x, y }]);

        // Remove after 2s
        setTimeout(() => {
            if (mountedRef.current) {
                setEmotes(prev => prev.filter(e => e.id !== id));
            }
        }, 2000);
    }

    // BOT AI for Emotes (Less frequent now)
    useEffect(() => {
        if (battle.status !== 'ACTIVE') return;

        const interval = setInterval(() => {
            // 5% chance every 3s (was 30% every 2s) - much more natural
            if (Math.random() > 0.95) {
                const botEmojis = isCrazyMode ? ['🤡', '💀', '😱'] : ['🔥', '🤑', '😎', '👍'];
                const randomEmoji = botEmojis[Math.floor(Math.random() * botEmojis.length)];
                triggerEmote(randomEmoji);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [battle.status, isCrazyMode]);


    useEffect(() => {
        mountedRef.current = true;
        spinInProgress.current = false;
        return () => { mountedRef.current = false; };
    }, []);

    // Initialize Results - Reset when battle ID changes (new battle/rematch)
    useEffect(() => {
        // Reset all state when battle ID changes (new rematch battle)
        setCurrentRound(1);
        setResults({});
        setRoundItems({});
        setRoundWinnerId(null);
        setTieAttempts(0);
        setPrizeChoice(null);
        setRematchOffered(false);
        setRematchAccepted(false);
        setRematchDeclined(false);
        setRematchTimer(10);
        if (rematchTimerRef.current) {
            clearInterval(rematchTimerRef.current);
            rematchTimerRef.current = null;
        }

        // Check if battle has already been completed (has results with items)
        const hasCompletedResults = (Object.values(results) as BattlePlayerResult[]).some(r => r.items && r.items.length > 0);

        // If battle is finished or has completed results, don't restart
        if (battle.status === 'FINISHED' || hasCompletedResults) {
            if (gameStatus !== 'FINISHED') {
                setGameStatus('FINISHED');
            }
            return; // Don't initialize or restart
        }

        const initialResults: any = {};
        battle.players.forEach(p => {
            if (p?.id) {
                initialResults[p.id] = { id: p.id, items: [], totalValue: 0 };
            }
        });
        setResults(initialResults);
        resultsRef.current = initialResults;

        // Set initial game status based on battle status
        // Only initialize if we're in a reset state (WAITING or FINISHED)
        if (battle.status === 'WAITING') {
            setGameStatus('WAITING');
        } else if (battle.status === 'ACTIVE') {
            // Only initialize if we're in WAITING state (new battle)
            // Don't reset if game is already in progress
            setGameStatus(prev => {
                if (prev === 'WAITING') {
                    // Delay slightly before starting
                    setTimeout(() => {
                        if (mountedRef.current) {
                            setGameStatus(prevState => prevState === 'WAITING' ? 'STARTING' : prevState);
                        }
                    }, 500);
                    return 'WAITING';
                }
                // Game is already in progress, don't reset
                return prev;
            });
        }
    }, [battle.id]); // Only depend on battle.id to avoid re-running when status/players change

    // CORE GAME LOOP
    // This effect listens only to gameStatus to orchestrate steps.
    // It avoids depending on 'battle' object to prevent re-running mid-spin.
    useEffect(() => {
        if (!box) return;
        
        console.log(`🎮 Game loop: gameStatus=${gameStatus}, currentRound=${currentRound}, battle.roundCount=${battle.roundCount}, battle.status=${battle.status}`);

        // Prevent game loop from running if battle is finished
        if (battle.status === 'FINISHED') {
            if (gameStatus !== 'FINISHED') {
                setGameStatus('FINISHED');
            }
            return;
        }

        if (gameStatus === 'STARTING') {
            const t = setTimeout(() => {
                if (mountedRef.current) {
                    // Skip buildup phase for tie re-rolls - go straight to spinning
                    if (tieAttempts > 0) {
                        setGameStatus('SPINNING');
                    } else {
                        setAnticipationPhase('BUILDUP');
                        setGameStatus('ANTICIPATION');
                    }
                }
            }, 1000);
            return () => clearTimeout(t);
        }

        if (gameStatus === 'ANTICIPATION' || gameStatus === 'SPINNING') {
            // CRITICAL: Prevent spinning if battle is finished
            if (battle.status === 'FINISHED') {
                setGameStatus('FINISHED');
                return;
            }

            // Don't check for completed results here - this prevents multi-round games from continuing
            // The REVEALED handler will properly check if all rounds are complete
            // This check was causing 2-round games to finish after round 1

            // For tie re-rolls, allow spin to proceed even if spinInProgress is true
            // (it was reset in the tie handler, but there might be a timing issue)
            if (spinInProgress.current && tieAttempts === 0) return; // Only prevent if not a tie re-roll
            spinInProgress.current = true;

            const runSpin = async () => {
                try {
                    // 1. Generate Outcomes (Async)
                    const roundOutcomes: { [pid: string]: LootItem } = {};
                    const roundFairnessData: Array<{
                        playerId: string;
                        username: string;
                        clientSeed: string;
                        nonce: number;
                        item: LootItem;
                    }> = [];
                    let playerIndex = 0;

                    for (const player of battle.players) {
                        if (!player?.id) continue;
                        // Use player ID as client seed (deterministic)
                        // In a real app, each player would have their own client seed committed beforehand
                        const clientSeed = player.id;

                        // Create a deterministic, provably fair nonce
                        // Hash player ID + round + index + tie attempts to ensure uniqueness while remaining verifiable
                        // tieAttempts ensures different outcomes when re-spinning due to ties
                        // IMPORTANT: Ensure playerIndex is unique for each player in the loop
                        // Match box-open approach: use numeric nonce for consistency with provably fair system
                        const nonceInput = `${player.id}:${currentRound}:${playerIndex}:${battle.id}:${tieAttempts}`;
                        const nonceHash = CryptoJS.SHA256(nonceInput).toString();
                        // Use first 13 hex chars (52 bits) to stay within Number.MAX_SAFE_INTEGER
                        // This matches box-open's approach of using numeric nonces
                        // Convert to number for consistency with box-open edge function
                        const nonce = parseInt(nonceHash.substring(0, 13), 16);

                        // Debug logging to verify uniqueness
                        console.log(`🎲 Nonce calculation for player ${player.id}:`, {
                            nonceInput,
                            nonceHash: nonceHash.substring(0, 16) + '...',
                            nonce,
                            clientSeed,
                            playerIndex,
                            currentRound,
                            tieAttempts
                        });

                        let outcomeItem: LootItem;

                        // Call Supabase Edge Function to generate outcome
                        try {
                            // Since we use Clerk, we don't have a Supabase session.
                            // Use the Anon Key for the Edge Function (it allows anonymous access).
                            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                            if (!anonKey) {
                                console.error('❌ VITE_SUPABASE_ANON_KEY is missing! Edge Function will fail.');
                            }

                            const authHeader = `Bearer ${anonKey}`;
                            console.log(`🔐 Auth Debug - Using Anon Key for Clerk user: ${player.id}`);

                            const { data, error } = await supabase.functions.invoke('battle-spin', {
                                headers: {
                                    Authorization: authHeader
                                },
                                body: {
                                    battleId: battle.id,
                                    playerId: player.id,
                                    clientSeed,
                                    nonce,
                                    boxItems: box.items
                                }
                            });

                            if (error) throw error;
                            if (!data.success) throw new Error(data.error || 'Failed to generate outcome');

                            outcomeItem = data.outcome.item;
                            console.log(`✅ Secure Edge Function generated outcome for player ${player.id}:`, {
                                item: outcomeItem.name,
                                value: outcomeItem.value,
                                randomValue: data.outcome.randomValue,
                                nonce: data.outcome.nonce
                            });
                        } catch (error) {
                            console.error(`❌ Error generating outcome for player ${player.id}:`, error);
                            // For development/offline fallback only - in production this should fail
                            console.warn('⚠️ Falling back to local outcome generation (DEV ONLY)');
                            const localOutcome = await generateOutcome(box.items, clientSeed, nonce);
                            outcomeItem = localOutcome.item;
                        }

                        roundOutcomes[player.id] = outcomeItem;

                        // Store fairness data for this player
                        roundFairnessData.push({
                            playerId: player.id,
                            username: player.username || 'Unknown',
                            clientSeed: clientSeed,
                            nonce: nonce,
                            item: outcomeItem
                        });

                        playerIndex++;
                    }

                    // Store fairness data for this round
                    setFairnessData(prev => [...prev, {
                        round: currentRound,
                        players: roundFairnessData
                    }]);

                    // PSYCHOLOGY-BASED ANTICIPATION PHASES
                    // For tie re-rolls, skip buildup and countdown - go straight to spinning
                    if (tieAttempts > 0) {
                        // Set items immediately for tie re-roll
                        setRoundItems(roundOutcomes);

                        // Brief delay then start spinning
                        setTimeout(() => {
                            if (!mountedRef.current) return;
                            setAnticipationPhase('SPINNING');
                            setGameStatus('SPINNING');

                            // Phase 3: SPINNING (4-5 seconds) - Ticker animation
                            const spinDuration = 4000 + Math.random() * 1000; // 4-5 seconds

                            setTimeout(() => {
                                if (!mountedRef.current) return;

                                // All revealed simultaneously - show final results
                                setAnticipationPhase(null);
                                setHeartbeatActive(false);
                                setGameStatus('REVEALED');

                                // Screen shake when all items land
                                setScreenShake(true);
                                setTimeout(() => setScreenShake(false), 500);

                                // Determine winner after brief pause
                                setTimeout(() => {
                                    if (determineWinnerRef.current) {
                                        determineWinnerRef.current();
                                        determineWinnerRef.current = null;
                                    }
                                }, 500);
                            }, spinDuration);
                        }, 100); // Brief delay for state update
                    } else {
                        // Normal flow: Phase 1: BUILDUP (2 seconds) - Quick buildup
                        setAnticipationPhase('BUILDUP');
                        setHeartbeatActive(true);

                        setTimeout(() => {
                            if (!mountedRef.current) return;

                            // Phase 2: COUNTDOWN (3 seconds) - Dramatic countdown
                            setAnticipationPhase('COUNTDOWN');
                            setShowCountdown(true);
                            setCountdownValue(3);

                            const countdownInterval = setInterval(() => {
                                setCountdownValue(prev => {
                                    if (prev <= 1) {
                                        clearInterval(countdownInterval);
                                        setShowCountdown(false);
                                        return 0;
                                    }
                                    return prev - 1;
                                });
                            }, 1000);

                            setTimeout(() => {
                                if (!mountedRef.current) return;
                                clearInterval(countdownInterval);
                                setShowCountdown(false);

                                // Set items FIRST so BattleReel can generate reel items
                                setRoundItems(roundOutcomes);

                                // Wait a moment for state to propagate and reel items to generate
                                setTimeout(() => {
                                    if (!mountedRef.current) return;

                                    setAnticipationPhase('SPINNING');
                                    setGameStatus('SPINNING');

                                    // Phase 3: SPINNING (4-5 seconds) - Ticker animation
                                    const spinDuration = 4000 + Math.random() * 1000; // 4-5 seconds

                                    setTimeout(() => {
                                        if (!mountedRef.current) return;

                                        // All revealed simultaneously - show final results
                                        setAnticipationPhase(null);
                                        setHeartbeatActive(false);
                                        setGameStatus('REVEALED');

                                        // Screen shake when all items land
                                        setScreenShake(true);
                                        setTimeout(() => setScreenShake(false), 500);

                                        // Determine winner after brief pause
                                        setTimeout(() => {
                                            if (determineWinnerRef.current) {
                                                determineWinnerRef.current();
                                                determineWinnerRef.current = null;
                                            }
                                        }, 500);
                                    }, spinDuration);
                                }, 100); // Give time for state update and reel generation
                            }, 3000); // 3 second countdown
                        }, 2000); // 2 second buildup (reduced from 3)
                    }

                    // After all reveals complete, determine winner
                    // This happens in the revealNext callback when all players are revealed
                    // The winner determination logic is moved to a separate function that runs after reveals
                    const determineWinnerAfterReveal = () => {
                        if (!mountedRef.current) return;

                        // Collect all player results
                        const allValues: number[] = [];
                        const playerResults: Array<{ pid: string; value: number }> = [];

                        Object.entries(roundOutcomes).forEach(([pid, item]) => {
                            const value = item.value;
                            allValues.push(value);
                            playerResults.push({ pid, value });
                        });

                        console.log('🎲 Round Results:', playerResults);

                        // Check for tie - handling differs for single-round vs multi-round games
                        const uniqueValues = new Set(allValues);
                        const isTie = uniqueValues.size === 1 && allValues.length > 1;
                        
                        let rWinner: string | null = null;
                        let bestValue = isCrazyMode ? Infinity : -1;

                        if (isTie) {
                            if (battle.roundCount === 1) {
                                // Single-round game: Re-roll on tie (don't add items, just re-spin)
                                console.log('🔄 TIE DETECTED in single-round game: All players got same value, re-spinning round (attempt:', tieAttempts + 1, ')');
                                triggerEmote('😱');
                                
                                setTieAttempts(prev => prev + 1);
                                setRoundWinnerId(null);
                                setGameStatus('REVEALED');
                                
                                // Clear items and reset for re-roll (don't add items to results)
                                setTimeout(() => {
                                    if (!mountedRef.current) return;
                                    setRoundItems({});
                                    setRoundWinnerId(null);
                                    spinInProgress.current = false;
                                    // Trigger a new spin by going through STARTING -> ANTICIPATION -> SPINNING flow
                                    setGameStatus('STARTING');
                                }, 2000);
                                return; // Exit early, don't add items to results
                            } else {
                                // Multi-round game: Ties continue to next round (both players keep their items)
                                console.log('🔄 TIE DETECTED in multi-round game: All players got same value. This round has no winner - both players keep their items and continue to next round.');
                                triggerEmote('😱');
                                rWinner = null;
                            }
                        } else {
                            // Determine Round Winner
                            Object.entries(roundOutcomes).forEach(([pid, item]) => {
                                const value = item.value;
                                if (isCrazyMode) {
                                    if (value < bestValue) {
                                        bestValue = value;
                                        rWinner = pid;
                                    }
                                } else {
                                    if (value > bestValue) {
                                        bestValue = value;
                                        rWinner = pid;
                                    }
                                }
                            });

                            console.log('🏆 Round Winner:', rWinner, 'with value:', bestValue);
                            setFlashEffect(true);
                            setTimeout(() => setFlashEffect(false), 300);

                            triggerEmote('🎉');
                            if (rWinner === user?.id) {
                                triggerEmote('🔥');
                            }
                        }

                        console.log(`📊 Round ${currentRound} of ${battle.roundCount} complete`);

                        setRoundWinnerId(rWinner);

                        // Update Total Results
                        // For single-round games: Only winner gets their item (loser gets nothing)
                        // For multi-round games: ALL players get their items (best-of-3: total value determines winner)
                        const nextResults = { ...resultsRef.current };
                        Object.keys(roundOutcomes).forEach(pid => {
                            const item = roundOutcomes[pid];
                            if (!nextResults[pid]) nextResults[pid] = { id: pid, items: [], totalValue: 0 };

                            if (battle.roundCount === 1) {
                                // Single-round game: Only winner gets the item
                                if (pid === rWinner) {
                                    const newTotal = nextResults[pid].totalValue + item.value;
                                    nextResults[pid] = {
                                        ...nextResults[pid],
                                        items: [...nextResults[pid].items, item],
                                        totalValue: newTotal
                                    };
                                    animateScore(pid, nextResults[pid].totalValue - item.value, newTotal);
                                } else {
                                    // Loser gets nothing in single-round games
                                    // Keep their existing results (should be empty for first round)
                                }
                            } else {
                                // Multi-round game: ALL players get their items added
                                // This is best-of-3: total value across all rounds determines winner
                                const newTotal = nextResults[pid].totalValue + item.value;
                                nextResults[pid] = {
                                    ...nextResults[pid],
                                    items: [...nextResults[pid].items, item],
                                    totalValue: newTotal
                                };
                                animateScore(pid, nextResults[pid].totalValue - item.value, newTotal);
                            }
                        });

                        setResults(nextResults);
                        resultsRef.current = nextResults;

                        if (rWinner && rWinner.startsWith('bot_')) {
                            triggerEmote(isCrazyMode ? '🤡' : '🔥');
                        } else if (rWinner) {
                            triggerEmote(isCrazyMode ? '💀' : '😭');
                        }

                        // Set status to REVEALED so the progression handler can run
                        setGameStatus('REVEALED');
                        spinInProgress.current = false;
                    };

                    // Store the determineWinner function to call after reveals
                    determineWinnerRef.current = determineWinnerAfterReveal;
                } catch (error) {
                    console.error('❌ Critical error in runSpin:', error);
                    // Set error state so user can see what went wrong
                    alert(`Error during battle: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
                    setGameStatus('FINISHED');
                    spinInProgress.current = false;
                }
            };

            runSpin();
        }

        if (gameStatus === 'REVEALED') {
            const t = setTimeout(() => {
                if (!mountedRef.current) return;

                // Check if we have results - if not, something went wrong
                const currentScores = resultsRef.current;
                if (Object.keys(currentScores).length === 0) {
                    console.warn('⚠️ No results found, cannot determine winner');
                    return;
                }

                // Progress if we have results (determineWinnerAfterReveal has run)
                // This includes ties - in best-of-3, ties just continue to next round
                // Check End Condition or Sudden Death
                const nextRound = currentRound + 1;
                
                console.log(`🔄 Round progression check: currentRound=${currentRound}, nextRound=${nextRound}, battle.roundCount=${battle.roundCount}`);
                
                // IMPORTANT: Store final round items BEFORE clearing roundItems
                // Check if this is the final round BEFORE incrementing
                if (nextRound > battle.roundCount) {
                    console.log(`🏁 All ${battle.roundCount} rounds complete, checking for winner...`);
                    console.log('📦 Storing final round items (current round:', currentRound, '):', roundItems);
                    
                    // Store final round items BEFORE finishing (roundItems still has current round's items)
                    // Make a copy to avoid reference issues
                    const finalRoundItemsCopy = { ...roundItems };
                    setLastRoundItems(finalRoundItemsCopy);
                    console.log('✅ Final round items stored:', finalRoundItemsCopy);
                    
                    const sortedPlayers = (Object.values(currentScores) as BattlePlayerResult[]).sort((a, b) =>
                        isCrazyMode ? a.totalValue - b.totalValue : b.totalValue - a.totalValue
                    );

                    console.log('📊 Final scores:', sortedPlayers.map(p => ({ id: p.id, total: p.totalValue })));

                    // Sudden Death Check (if final scores are tied after all rounds)
                    if (sortedPlayers.length > 1 && sortedPlayers[0].totalValue === sortedPlayers[1].totalValue) {
                        console.log('⚔️ Sudden Death! Tied scores after all rounds, continuing...');
                        triggerEmote('😱');
                        triggerEmote('😱');
                        setCurrentRound(nextRound);
                        setRoundItems({});
                        setRoundWinnerId(null);
                        setTieAttempts(0);
                        setPrizeChoice(null);
                        // Go through full animation flow for sudden death
                        setGameStatus('STARTING');
                    } else {
                        console.log('✅ Battle finished! Winner:', sortedPlayers[0]?.id, 'with score:', sortedPlayers[0]?.totalValue);
                        // Force immediate transition to FINISHED
                        setGameStatus('FINISHED');
                        // Ensure results are set
                        setResults(currentScores);
                    }
                } else {
                    // Next round - increment round number and reset state
                    // This happens for both regular round completion AND ties (best-of-3)
                    const roundResult = roundWinnerId ? `Round ${currentRound} won by player ${roundWinnerId}` : `Round ${currentRound} was a tie - continuing to next round`;
                    console.log(`🔄 ${roundResult}. Moving to round ${nextRound} of ${battle.roundCount}`);
                    console.log(`✅ Proceeding to next round: ${nextRound} (battle.roundCount: ${battle.roundCount})`);
                    setCurrentRound(nextRound);
                    setRoundItems({});
                    setRoundWinnerId(null);
                    setTieAttempts(0);
                    // Reset prize choice for new round
                    setPrizeChoice(null);
                    // Go through STARTING -> ANTICIPATION -> SPINNING flow for next round
                    setGameStatus('STARTING');
                }
            }, 2000); // Reduced to 2s delay to show round results before progressing
            return () => clearTimeout(t);
        }

    }, [gameStatus, box, roundWinnerId, currentRound, battle.roundCount, results]); // Only trigger when status updates


    if (!box) return null;

    // Calculate winner for display
    const finalSorted = (Object.values(results) as BattlePlayerResult[]).sort((a, b) => isCrazyMode ? a.totalValue - b.totalValue : b.totalValue - a.totalValue);
    const overallWinnerId = gameStatus === 'FINISHED' ? finalSorted[0]?.id : null;

    // Prize pool calculation
    // Each player pays the box price once (battle.price) to join
    // Total collected = box price × number of players
    // Apply 5% platform fee (95% return to players)
    const PLATFORM_FEE = 0.05; // 5% platform fee
    const totalCollected = battle.price * battle.playerCount;
    const totalPot = totalCollected * (1 - PLATFORM_FEE); // 95% of collected amount
    const isUserWinner = user && overallWinnerId === user.id;

    // Debug: Log when FINISHED state is reached
    useEffect(() => {
        if (gameStatus === 'FINISHED') {
            console.log('🎉 FINISHED state reached!');
            console.log('📊 Results:', results);
            console.log('🏆 Final sorted:', finalSorted);
            console.log('👑 Overall winner ID:', overallWinnerId);
            console.log('👤 User ID:', user?.id);
            console.log('✅ Is user winner?', isUserWinner);
            console.log('🎯 Prize choice state:', prizeChoice);
            console.log('💰 Total pot:', totalPot);
        }
    }, [gameStatus, results, finalSorted, overallWinnerId, isUserWinner, prizeChoice, totalPot]);

    // Trigger confetti when battle finishes
    useEffect(() => {
        if (gameStatus === 'FINISHED' && overallWinnerId) {
            setConfettiActive(true);
            setTimeout(() => setConfettiActive(false), 3000);
        }
    }, [gameStatus, overallWinnerId]);

    // Debug logging for final results
    if (gameStatus === 'FINISHED' && finalSorted.length > 0) {
        console.log('🏁 Final Results:', finalSorted.map(r => ({ id: r.id, totalValue: r.totalValue })));
        console.log('👑 Overall Winner:', overallWinnerId);
        if (user) {
            const userResult = finalSorted.find(r => r.id === user.id);
            console.log('👤 Your Result:', userResult ? { totalValue: userResult.totalValue } : 'not found');
        }
    }

    // Prize pool calculation:
    // - battle.price = box price (e.g., $10)
    // - battle.playerCount = number of players (e.g., 2)
    // Each player pays: battle.price (the box price) to join
    // Total pot = box price × number of players = $10 × 2 = $20
    // (totalPot and isUserWinner are already declared above)

    return (
        <div className="min-h-screen bg-[#0b0f19] flex flex-col relative overflow-hidden">

            <style dangerouslySetInnerHTML={{
                __html: `
          @keyframes scroll-vertical {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          .animate-scroll-vertical {
            animation: scroll-vertical 0.5s linear infinite;
          }
          @keyframes float-up {
              0% { transform: translateY(0) scale(0.5); opacity: 0; }
              10% { opacity: 1; }
              100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px) rotate(-1deg); }
            20%, 40%, 60%, 80% { transform: translateX(5px) rotate(1deg); }
          }
          @keyframes flash {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
          }
          @keyframes countdown-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.8; }
          }
          @keyframes confetti-fall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          @keyframes score-pop {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          .screen-shake {
            animation: shake 0.5s ease-in-out;
          }
          .flash-effect {
            animation: flash 0.3s ease-in-out;
          }
          .countdown-animation {
            animation: countdown-pulse 0.5s ease-in-out;
          }
          .score-pop {
            animation: score-pop 0.3s ease-out;
          }
        `}} />

            <div className={`absolute inset-0 bg-gradient-to-br ${box.color} opacity-10 pointer-events-none`}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

            {/* Screen Shake Effect */}
            {screenShake && (
                <div className="absolute inset-0 pointer-events-none screen-shake z-[200]"></div>
            )}

            {/* Flash Effect */}
            {flashEffect && (
                <div className="absolute inset-0 bg-white/30 pointer-events-none flash-effect z-[200]"></div>
            )}

            {/* Heartbeat Effect - Builds tension */}
            {heartbeatActive && (
                <div className="absolute inset-0 pointer-events-none heartbeat z-[199]">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 pulse-glow"></div>
                </div>
            )}

            {/* Anticipation Overlay - BUILDUP Phase */}
            {anticipationPhase === 'BUILDUP' && (
                <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl font-bold text-white mb-4 animate-pulse">⚡</div>
                        <div className="text-3xl font-bold text-white uppercase tracking-widest mb-2">
                            {tieAttempts > 0 ? 'REROLL' : `ROUND ${currentRound}`}
                        </div>
                        {tieAttempts > 0 && (
                            <div className="text-lg text-yellow-400 uppercase tracking-widest mb-2">Tie Detected - Re-rolling...</div>
                        )}
                        <div className="mt-8 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confetti Effect */}
            {confettiActive && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-[150]">
                    {Array.from({ length: 50 }).map((_, i) => {
                        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        const left = Math.random() * 100;
                        const delay = Math.random() * 2;
                        const duration = 2 + Math.random() * 2;
                        return (
                            <div
                                key={i}
                                className="absolute w-3 h-3 rounded-full"
                                style={{
                                    left: `${left}%`,
                                    top: '-10px',
                                    backgroundColor: color,
                                    animation: `confetti-fall ${duration}s linear ${delay}s forwards`,
                                    boxShadow: `0 0 10px ${color}`
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {/* EMOTE LAYER */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100]">
                {emotes.map(e => (
                    <div
                        key={e.id}
                        className="absolute text-4xl"
                        style={{
                            left: `${e.x}%`,
                            bottom: '100px',
                            animation: 'float-up 2s ease-out forwards'
                        }}
                    >
                        {e.emoji}
                    </div>
                ))}
            </div>

            <div className="relative z-20 h-24 border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur flex items-center justify-between px-6 md:px-12">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onBack();
                    }}
                    className="text-slate-400 hover:text-white flex items-center gap-2 font-bold text-sm bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> LEAVE
                </button>

                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold tracking-widest uppercase mb-1">
                        {isCrazyMode ? <Skull className="w-3 h-3 text-purple-500" /> : <Zap className="w-3 h-3 text-yellow-500 fill-current" />}
                        {currentRound > battle.roundCount ? <span className="text-red-500 animate-pulse">SUDDEN DEATH</span> : `Round ${currentRound} / ${battle.roundCount}`}
                    </div>
                    <div className="text-white font-display font-bold text-2xl tracking-wide drop-shadow-md flex items-center gap-2">
                        {box.name} {isCrazyMode && <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded ml-2">CRAZY MODE</span>}
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-900/40 to-emerald-950/40 border border-emerald-500/20 px-6 py-2 rounded-xl shadow-lg shadow-emerald-900/20">
                    <Coins className="w-5 h-5 text-emerald-400" />
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-[10px] text-emerald-500/80 font-bold uppercase">Prize Pool</span>
                        <span className="text-emerald-400 font-mono font-bold text-lg">${totalPot.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="text-[9px] text-slate-500 font-bold">(5% platform fee)</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative">

                {gameStatus === 'WAITING' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Zap className="w-8 h-8 text-purple-500 animate-pulse" fill="currentColor" />
                            </div>
                        </div>
                        <h2 className="mt-8 text-2xl font-bold font-display tracking-widest">LOOKING FOR OPPONENT...</h2>
                        <p className="text-slate-400 mt-2">Waiting for players to join your {battle.playerCount === 4 ? '2v2' : battle.playerCount === 6 ? '3v3' : '1v1'} battle</p>
                    </div>
                )}

                {/* Countdown Overlay */}
                {showCountdown && countdownValue > 0 && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="text-center">
                            <div className={`text-9xl font-bold ${isCrazyMode ? 'text-purple-500' : 'text-yellow-500'} countdown-animation drop-shadow-2xl`}>
                                {countdownValue}
                            </div>
                            <div className="text-2xl font-bold text-white mt-4 uppercase tracking-widest">Revealing...</div>
                        </div>
                    </div>
                )}

                {/* Players Grid - RESPONSIVE GRID LAYOUT */}
                <div className="w-full max-w-7xl h-[65vh] p-4">
                    <div className={`
                    w-full h-full grid gap-6 items-center justify-items-center
                    ${battle.playerCount === 2 ? 'grid-cols-2' : ''}
                    ${battle.playerCount === 4 ? 'grid-cols-2 grid-rows-2' : ''}
                    ${battle.playerCount === 6 ? 'grid-cols-3 grid-rows-2' : ''}
                `}>
                        {battle.players.map((player, idx) => {
                            // Empty Slot
                            if (!player && gameStatus === 'WAITING') {
                                return (
                                    <div key={idx} className="w-full h-full max-w-sm flex flex-col gap-2 opacity-50 min-h-[250px]">
                                        <div className="flex items-center justify-between p-3 rounded-xl border bg-[#131b2e] border-white/5">
                                            <span className="text-xs text-slate-400 font-bold uppercase">Total</span>
                                            <span className="font-mono font-bold text-lg text-slate-600">$0</span>
                                        </div>
                                        <div className="flex-1 bg-[#131b2e] rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                                            </div>
                                            <div className="text-slate-500 font-bold">Waiting...</div>
                                        </div>
                                    </div>
                                );
                            }

                            if (!player) return <div key={idx}></div>;

                            const result = results[player.id || ''] || { totalValue: 0, items: [] };
                            const isRoundWinner = roundWinnerId === player.id && gameStatus === 'REVEALED';

                            return (
                                <div key={idx} className={`w-full h-full flex flex-col gap-3 ${battle.playerCount === 4 ? 'max-w-md min-h-[350px]' : battle.playerCount === 6 ? 'max-w-sm min-h-[300px]' : 'max-w-sm min-h-[280px]'}`}>
                                    <div className={`
                                    flex items-center justify-between p-3 rounded-xl border transition-all duration-300
                                    ${isRoundWinner ? (isCrazyMode ? 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-yellow-500/20 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]') : 'bg-[#131b2e] border-white/5'}
                                `}>
                                        <span className="text-xs text-slate-400 font-bold uppercase">Total</span>
                                        <span className={`font-mono font-bold text-lg transition-all ${isRoundWinner ? (isCrazyMode ? 'text-purple-400' : 'text-yellow-400') : 'text-emerald-400'} ${isRoundWinner ? 'score-pop' : ''}`}>
                                            ${(displayedScores[player.id || ''] ?? result.totalValue).toLocaleString()}
                                        </span>
                                    </div>

                                    <BattleReel
                                        player={player}
                                        item={roundItems[player.id || '']}
                                        isSpinning={gameStatus === 'SPINNING'}
                                        boxItems={box.items}
                                        isWinner={isRoundWinner}
                                        isCrazyMode={isCrazyMode}
                                        playerCount={battle.playerCount}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* LIVE REACTIONS TOOLBAR */}
                <div className="absolute bottom-8 z-30 flex gap-2">
                    {['🔥', '🤑', '😎', '😭', '🤡'].map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => triggerEmote(emoji)}
                            className="bg-black/50 hover:bg-black/80 backdrop-blur rounded-full w-12 h-12 text-2xl border border-white/10 hover:border-white/30 hover:scale-110 active:scale-90 transition-all shadow-lg"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {gameStatus === 'FINISHED' && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-700 overflow-y-auto p-4">
                    <div
                        className={`bg-[#131b2e] border p-1.5 rounded-[32px] max-w-lg w-full my-auto animate-in zoom-in-90 duration-500 ${isUserWinner ? (isCrazyMode ? 'border-purple-500/30 shadow-[0_0_100px_rgba(168,85,247,0.3)]' : 'border-yellow-500/30 shadow-[0_0_100px_rgba(234,179,8,0.3)]') : 'border-red-500/30 shadow-[0_0_100px_rgba(239,68,68,0.3)]'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[#0b0f19] rounded-[26px] p-6 md:p-10 text-center relative">
                            <div className={`absolute inset-0 ${isUserWinner ? (isCrazyMode ? 'bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2),transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.2),transparent_70%)]') : 'bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2),transparent_70%)]'}`}></div>

                            <div className="relative w-28 h-28 mx-auto mb-6">
                                {isUserWinner ? (
                                    <>
                                        <div className={`absolute inset-0 ${isCrazyMode ? 'bg-purple-500' : 'bg-yellow-500'} rounded-full blur-xl opacity-50 animate-pulse`}></div>
                                        <img
                                            src={user?.avatar || battle.players.find(p => p?.id === overallWinnerId)?.avatar}
                                            className={`relative z-10 w-full h-full rounded-full border-4 ${isCrazyMode ? 'border-purple-500' : 'border-yellow-500'} shadow-2xl`}
                                        />
                                        <div className={`absolute -bottom-2 -right-2 ${isCrazyMode ? 'bg-purple-500' : 'bg-yellow-500'} text-black p-2 rounded-full border-4 border-[#0b0f19] z-20`}>
                                            {isCrazyMode ? <Skull className="w-6 h-6 fill-current" /> : <Trophy className="w-6 h-6 fill-current" />}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-30"></div>
                                        <img
                                            src={user?.avatar}
                                            className="relative z-10 w-full h-full rounded-full border-4 border-red-500/50 shadow-2xl opacity-70"
                                        />
                                        <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2 rounded-full border-4 border-[#0b0f19] z-20">
                                            <X className="w-6 h-6" />
                                        </div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                                            <div className="bg-yellow-500 rounded-full p-2 border-4 border-[#0b0f19]">
                                                <img
                                                    src={battle.players.find(p => p?.id === overallWinnerId)?.avatar}
                                                    className="w-16 h-16 rounded-full border-2 border-yellow-500"
                                                />
                                                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black p-1 rounded-full border-2 border-[#0b0f19]">
                                                    <Trophy className="w-4 h-4 fill-current" />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {isUserWinner ? (
                                <>
                                    <h2 className="text-4xl font-display font-bold text-white mb-2 drop-shadow-lg tracking-wide">VICTORY</h2>
                                    <div className={`${isCrazyMode ? 'text-purple-500' : 'text-yellow-500'} font-bold text-lg mb-2 uppercase tracking-widest`}>You Win!</div>
                                    {isCrazyMode && <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">(LOWEST TOTAL VALUE)</div>}
                                    
                                    {/* Multi-round game notice */}
                                    {battle.roundCount > 1 && (
                                        <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                                            <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">⚠️ Multi-Round Game</div>
                                            <div className="text-slate-300 text-xs mb-2">Winner determined by highest total value across all rounds. Only items from the final round are claimable (or prize pool cash).</div>
                                            {/* Show all rounds summary */}
                                            <div className="mt-3 space-y-2">
                                                <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest">All Rounds Summary:</div>
                                                {(() => {
                                                    const userResult = finalSorted.find(r => r.id === user?.id);
                                                    if (!userResult || !userResult.items || userResult.items.length === 0) return null;
                                                    
                                                    // Items are stored in order: one item per round for this player
                                                    // items[0] = round 1, items[1] = round 2, items[2] = round 3, etc.
                                                    const rounds = [];
                                                    for (let i = 0; i < userResult.items.length; i++) {
                                                        const roundNum = i + 1;
                                                        if (!rounds[roundNum - 1]) {
                                                            rounds[roundNum - 1] = { round: roundNum, items: [], total: 0 };
                                                        }
                                                        rounds[roundNum - 1].items.push(userResult.items[i]);
                                                        rounds[roundNum - 1].total += userResult.items[i].value;
                                                    }
                                                    
                                                    return (
                                                        <div className="space-y-1">
                                                            {rounds.map((roundData, idx) => (
                                                                <div key={idx} className="text-xs text-slate-400 flex items-center justify-between">
                                                                    <span>Round {roundData.round}: {roundData.items.length} item{roundData.items.length !== 1 ? 's' : ''} (${roundData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                                                    {roundData.round === battle.roundCount && (
                                                                        <span className="text-yellow-400 text-[10px] font-bold">(CLAIMABLE)</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            <div className="text-xs text-yellow-400 font-bold flex items-center justify-between pt-1 border-t border-yellow-500/20">
                                                                <span>Total Across All Rounds:</span>
                                                                <span className="font-mono">${userResult.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {!prizeChoice ? (
                                        <>
                                            <div className="text-slate-300 text-sm mb-4">
                                                Choose your prize:
                                            </div>

                                            {/* Items Option - Show last round items for multi-round, all items for single round */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    console.log('Items button clicked');
                                                    setPrizeChoice('items');
                                                }}
                                                className="w-full mb-3 p-6 rounded-xl bg-gradient-to-r from-[#1a2336] to-[#131b2e] border-2 border-white/20 hover:border-yellow-500/50 transition-all cursor-pointer relative z-10 active:scale-[0.98] overflow-hidden group"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="text-white font-bold text-lg">
                                                        {battle.roundCount > 1 ? 'Final Round Items' : 'Your Items'}
                                                    </div>
                                                </div>
                                                <div className="flex gap-4 justify-center">
                                                    {(() => {
                                                        let claimableItems: LootItem[] = [];
                                                        if (battle.roundCount > 1) {
                                                            // Multi-round: only final round items are claimable
                                                            const finalRoundItem = lastRoundItems[user?.id || ''];
                                                            if (finalRoundItem) {
                                                                claimableItems = [finalRoundItem];
                                                            } else {
                                                                // Fallback: try to get from results (last item in array)
                                                                const userResult = finalSorted.find(r => r.id === user?.id);
                                                                if (userResult && userResult.items && userResult.items.length > 0) {
                                                                    // Get the last item (should be from final round)
                                                                    const lastItem = userResult.items[userResult.items.length - 1];
                                                                    claimableItems = [lastItem];
                                                                }
                                                            }
                                                            console.log('🎁 Multi-round claimable items:', { 
                                                                userId: user?.id, 
                                                                lastRoundItems, 
                                                                finalRoundItem: lastRoundItems[user?.id || ''],
                                                                userResultItems: finalSorted.find(r => r.id === user?.id)?.items,
                                                                claimableItems 
                                                            });
                                                        } else {
                                                            // Single round: all items the winner won
                                                            claimableItems = finalSorted.find(r => r.id === user?.id)?.items || [];
                                                        }
                                                        
                                                        if (claimableItems.length === 0) {
                                                            return (
                                                                <div className="text-slate-400 text-sm py-8">
                                                                    No items available to claim
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        return claimableItems.filter(Boolean).slice(0, 2).map((item, idx) => (
                                                            <div key={idx} className="relative flex-1 max-w-[180px] bg-gradient-to-br from-black/60 to-black/40 rounded-xl p-5 border-2 border-white/20 group-hover:border-yellow-500/50 transition-all">
                                                                {/* Rarity glow effect */}
                                                                <div className={`absolute inset-0 opacity-30 rounded-xl bg-gradient-to-br ${RARITY_GRADIENTS[item?.rarity || 'COMMON'] || RARITY_GRADIENTS.COMMON} blur-2xl`}></div>

                                                                {/* Item image */}
                                                                <div className="relative z-10 flex flex-col items-center">
                                                                    <div className="w-32 h-32 mb-4 flex items-center justify-center bg-black/40 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                                                                        <img
                                                                            src={item?.image}
                                                                            alt={item?.name}
                                                                            className="w-full h-full object-contain drop-shadow-2xl"
                                                                        />
                                                                    </div>

                                                                    {/* Item name and value */}
                                                                    <div className="text-center w-full">
                                                                        <div className="text-base font-bold text-white mb-2 line-clamp-2">{item?.name}</div>
                                                                        <div className={`text-sm font-mono font-bold ${RARITY_COLORS[item?.rarity || 'COMMON'] || 'text-slate-400'}`}>
                                                                            ${item?.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                        </div>
                                                                        <div className="text-[10px] text-emerald-400 mt-2 font-bold uppercase tracking-widest">
                                                                            Add to Inventory
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </button>

                                            {/* Cash Option - Available for all battles */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    console.log('Cash button clicked');
                                                    setPrizeChoice('cash');
                                                }}
                                                className="w-full mb-6 p-4 rounded-xl bg-gradient-to-r from-[#1a2336] to-[#131b2e] border-2 border-white/20 hover:border-yellow-500/50 transition-all cursor-pointer relative z-10 active:scale-[0.98]"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="text-white font-bold text-lg">Prize Pool Cash</div>
                                                    <div className="text-emerald-400 font-mono text-2xl font-bold">
                                                        ${totalPot.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                                {battle.roundCount > 1 && (
                                                    <div className="text-xs text-slate-400 mt-2 text-center">
                                                        (Winner determined by highest total value across all {battle.roundCount} rounds)
                                                    </div>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="bg-gradient-to-r from-[#1a2336] to-[#131b2e] p-6 rounded-2xl border border-white/10 mb-6 flex flex-col items-center">
                                            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                                                {prizeChoice === 'items' 
                                                    ? (battle.roundCount > 1 ? 'Final Round Items Selected' : 'Items Selected')
                                                    : 'Prize Pool Cash Selected'}
                                            </div>
                                            {prizeChoice === 'items' ? (
                                                <div className="flex gap-4 w-full justify-center">
                                                    {(() => {
                                                        let claimableItems: LootItem[] = [];
                                                        if (battle.roundCount > 1) {
                                                            // Multi-round: only final round items are claimable
                                                            const finalRoundItem = lastRoundItems[user?.id || ''];
                                                            if (finalRoundItem) {
                                                                claimableItems = [finalRoundItem];
                                                            }
                                                        } else {
                                                            // Single round: all items the winner won
                                                            claimableItems = finalSorted.find(r => r.id === user?.id)?.items || [];
                                                        }
                                                        return claimableItems.filter(Boolean).slice(0, 2).map((item, idx) => (
                                                            <div key={idx} className="relative flex-1 max-w-[160px] bg-gradient-to-br from-black/60 to-black/40 rounded-xl p-5 border border-white/10">
                                                                {/* Rarity glow effect */}
                                                                <div className={`absolute inset-0 opacity-30 rounded-xl bg-gradient-to-br ${RARITY_GRADIENTS[item?.rarity || 'COMMON'] || RARITY_GRADIENTS.COMMON} blur-2xl`}></div>

                                                                {/* Item image */}
                                                                <div className="relative z-10 flex flex-col items-center">
                                                                    <div className="w-32 h-32 mb-4 flex items-center justify-center bg-black/40 rounded-xl p-3 shadow-2xl">
                                                                        <img
                                                                            src={item?.image}
                                                                            alt={item?.name}
                                                                            className="w-full h-full object-contain drop-shadow-2xl"
                                                                        />
                                                                    </div>

                                                                    {/* Item name and value */}
                                                                    <div className="text-center w-full">
                                                                        <div className="text-sm font-bold text-white mb-2 line-clamp-2">{item?.name}</div>
                                                                        <div className={`text-xs font-mono font-bold ${RARITY_COLORS[item?.rarity || 'COMMON'] || 'text-slate-400'}`}>
                                                                            ${item?.value}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="text-5xl font-mono font-bold text-emerald-400 flex items-center gap-2 drop-shadow-xl">
                                                    ${totalPot.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h2 className="text-4xl font-display font-bold text-red-500 mb-2 drop-shadow-lg tracking-wide">DEFEAT</h2>
                                    <div className="text-slate-400 font-bold text-lg mb-2 uppercase tracking-widest">
                                        {battle.players.find(p => p?.id === overallWinnerId)?.username} Wins!
                                    </div>
                                    {isCrazyMode && <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-6">(LOWEST TOTAL VALUE)</div>}
                                    <div className="bg-gradient-to-r from-[#1a2336] to-[#131b2e] p-6 rounded-2xl border border-white/10 mb-6 flex flex-col items-center">
                                        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Winner's Prize</div>
                                        {(() => {
                                            const winnerResult = finalSorted.find(r => r.id === overallWinnerId);
                                            let winnerItems: LootItem[] = [];
                                            
                                            if (battle.roundCount > 1) {
                                                // Multi-round: show winner's final round item
                                                const finalRoundItem = lastRoundItems[overallWinnerId || ''];
                                                if (finalRoundItem) {
                                                    winnerItems = [finalRoundItem];
                                                }
                                            } else {
                                                // Single round: show all winner's items
                                                winnerItems = winnerResult?.items || [];
                                            }
                                            
                                            if (winnerItems.length > 0) {
                                                return (
                                                    <div className="w-full">
                                                        <div className="flex gap-4 justify-center mb-4">
                                                            {winnerItems.slice(0, 2).map((item, idx) => (
                                                                <div key={idx} className="relative flex-1 max-w-[160px] bg-gradient-to-br from-black/60 to-black/40 rounded-xl p-4 border border-white/10">
                                                                    {/* Rarity glow effect */}
                                                                    <div className={`absolute inset-0 opacity-30 rounded-xl bg-gradient-to-br ${RARITY_GRADIENTS[item?.rarity || 'COMMON'] || RARITY_GRADIENTS.COMMON} blur-2xl`}></div>
                                                                    
                                                                    {/* Item image */}
                                                                    <div className="relative z-10 flex flex-col items-center">
                                                                        <div className="w-24 h-24 mb-3 flex items-center justify-center bg-black/40 rounded-xl p-2 shadow-xl">
                                                                            <img
                                                                                src={item?.image}
                                                                                alt={item?.name}
                                                                                className="w-full h-full object-contain drop-shadow-lg"
                                                                            />
                                                                        </div>
                                                                        
                                                                        {/* Item name and value */}
                                                                        <div className="text-center w-full">
                                                                            <div className="text-sm font-bold text-white mb-1 line-clamp-2">{item?.name}</div>
                                                                            <div className={`text-xs font-mono font-bold ${RARITY_COLORS[item?.rarity || 'COMMON'] || 'text-slate-400'}`}>
                                                                                ${item?.value}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="text-center mt-2">
                                                            <div className="text-xs text-slate-500 mb-1">Prize Pool Cash Available</div>
                                                            <div className="text-2xl font-mono font-bold text-emerald-400">
                                                                ${totalPot.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // Fallback to cash if no items found
                                                return (
                                                    <div className="text-5xl font-mono font-bold text-emerald-400 flex items-center gap-2 drop-shadow-xl">
                                                        ${totalPot.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
                                        <div className="text-red-400 text-sm font-bold uppercase tracking-widest mb-1">Your Total</div>
                                        <div className="text-2xl font-mono font-bold text-red-400">
                                            ${(finalSorted.find(r => r.id === user?.id)?.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>

                                    {/* Rematch Section for Losers */}
                                    {!rematchOffered && !rematchAccepted && !rematchDeclined && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setRematchOffered(true);
                                                setRematchTimer(10);

                                                // Start timer
                                                rematchTimerRef.current = setInterval(() => {
                                                    setRematchTimer(prev => {
                                                        if (prev <= 1) {
                                                            if (rematchTimerRef.current) {
                                                                clearInterval(rematchTimerRef.current);
                                                            }
                                                            // Timer expired - bot declines
                                                            setRematchDeclined(true);
                                                            return 0;
                                                        }
                                                        return prev - 1;
                                                    });
                                                }, 1000);

                                                // Bot responds after 2-4 seconds (70% accept, 30% decline)
                                                setTimeout(() => {
                                                    if (rematchTimerRef.current) {
                                                        const botAccepts = Math.random() < 0.7; // 70% chance
                                                        if (botAccepts) {
                                                            setRematchAccepted(true);
                                                            if (rematchTimerRef.current) {
                                                                clearInterval(rematchTimerRef.current);
                                                            }
                                                            // Create rematch battle after 1 second
                                                            setTimeout(() => {
                                                                if (onCreateRematch) {
                                                                    onCreateRematch(battle);
                                                                }
                                                            }, 1000);
                                                        } else {
                                                            setRematchDeclined(true);
                                                            if (rematchTimerRef.current) {
                                                                clearInterval(rematchTimerRef.current);
                                                            }
                                                        }
                                                    }
                                                }, 2000 + Math.random() * 2000); // 2-4 second delay
                                            }}
                                            className="w-full mb-3 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-sm hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer relative z-10"
                                        >
                                            <RefreshCw className="w-4 h-4" /> OFFER REMATCH
                                        </button>
                                    )}

                                    {/* Rematch Status for Losers */}
                                    {rematchOffered && !rematchAccepted && !rematchDeclined && (
                                        <div className="mb-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                                            <div className="text-blue-400 font-bold text-sm mb-2">Waiting for opponent...</div>
                                            <div className="text-2xl font-mono font-bold text-blue-400">{rematchTimer}s</div>
                                        </div>
                                    )}

                                    {rematchAccepted && (
                                        <div className="mb-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                                            <div className="text-emerald-400 font-bold text-sm">Rematch Accepted! Starting new battle...</div>
                                        </div>
                                    )}

                                    {rematchDeclined && (
                                        <div className="mb-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                                            <div className="text-red-400 font-bold text-sm">Rematch Declined - Battle Forfeited</div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Provably Fair Verification Button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowFairnessProof(!showFairnessProof);
                                }}
                                className="w-full mb-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer relative z-10"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                {showFairnessProof ? 'HIDE' : 'VIEW'} PROVABLY FAIR PROOF
                            </button>

                            {/* Provably Fair Proof Section */}
                            {showFairnessProof && (
                                <div className="mb-6 bg-[#0b0f19] border border-white/10 rounded-xl p-4 flex flex-col" style={{ maxHeight: '400px' }}>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 flex-shrink-0">
                                        <ShieldCheck className="w-3 h-3" />
                                        Provably Fair Verification
                                    </div>
                                    <div className="overflow-y-auto overflow-x-hidden flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                                        {fairnessData && fairnessData.length > 0 ? (
                                            <div className="space-y-4">
                                                {fairnessData.map((roundData, idx) => (
                                                    <div key={idx} className="border-b border-white/5 pb-3 last:border-0">
                                                        <div className="text-xs font-bold text-purple-400 mb-2">Round {roundData.round}</div>
                                                        <div className="space-y-2">
                                                            {roundData.players.map((playerData) => (
                                                                <div key={playerData.playerId} className="bg-[#131b2e] rounded-lg p-2 text-xs">
                                                                    <div className="font-bold text-white mb-1 truncate">{playerData.username}</div>
                                                                    <div className="space-y-1 text-slate-400">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span className="text-[10px]">Client Seed:</span>
                                                                            <div className="flex items-center gap-1 min-w-0">
                                                                                <span className="font-mono text-[10px] truncate">{playerData.clientSeed.slice(0, 20)}...</span>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        navigator.clipboard.writeText(playerData.clientSeed);
                                                                                        setCopiedSeed(playerData.clientSeed);
                                                                                        setTimeout(() => setCopiedSeed(null), 2000);
                                                                                    }}
                                                                                    className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                                                                                >
                                                                                    {copiedSeed === playerData.clientSeed ? (
                                                                                        <Check className="w-3 h-3 text-green-400" />
                                                                                    ) : (
                                                                                        <Copy className="w-3 h-3" />
                                                                                    )}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span className="text-[10px]">Nonce:</span>
                                                                            <span className="font-mono text-[10px]">{playerData.nonce.toLocaleString()}</span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span className="text-[10px]">Item:</span>
                                                                            <span className="text-emerald-400 text-[10px] truncate">{playerData.item.name} (${playerData.item.value})</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-400 py-8 text-sm">
                                                No fairness data available yet. Complete a round to see verification details.
                                            </div>
                                        )}
                                        <div className="mt-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400">
                                            <strong>How to verify:</strong> Each player's client seed and nonce are combined with the server seed to generate the outcome. You can verify the fairness by checking the HMAC-SHA256 calculation.
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (isUserWinner) {
                                        if (!prizeChoice) return; // Don't allow claim until choice is made
                                        // For multi-round games, only claim last round items
                                        let claimableItems: LootItem[] = [];
                                        if (battle.roundCount > 1) {
                                            const finalRoundItem = lastRoundItems[user?.id || ''];
                                            if (finalRoundItem) {
                                                claimableItems = [finalRoundItem];
                                            }
                                        } else {
                                            claimableItems = finalSorted.find(r => r.id === user?.id)?.items || [];
                                        }
                                        if (prizeChoice === 'items') {
                                            onClaim(0, claimableItems.filter(Boolean));
                                        } else {
                                            onClaim(totalPot);
                                        }
                                    } else {
                                        onBack();
                                    }
                                }}
                                disabled={isUserWinner && !prizeChoice}
                                className={`
                                w-full py-4 rounded-xl font-extrabold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer relative z-10
                                ${isUserWinner
                                        ? prizeChoice
                                            ? `bg-gradient-to-r ${isCrazyMode ? 'from-purple-500 to-purple-600 shadow-[0_0_30px_rgba(168,85,247,0.4)]' : 'from-yellow-500 to-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.4)]'} text-black`
                                            : 'bg-white/10 text-white/50 border border-white/10 cursor-not-allowed'
                                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                                    }
                             `}
                            >
                                {isUserWinner ? (prizeChoice ? 'CLAIM PRIZE' : 'SELECT PRIZE') : 'LEAVE ARENA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};