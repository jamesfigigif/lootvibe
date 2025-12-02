import React, { useEffect, useState } from 'react';
import { RARITY_COLORS, INITIAL_BOXES } from '../constants';
import { Rarity } from '../types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { supabase } from '../services/supabaseClient';

interface Drop {
    id: string;
    user_name: string;
    item_name: string;
    item_image: string;
    box_name: string;
    value: number;
    created_at: string;
}

const MOCK_USERNAMES = [
    'CryptoKing', 'LootMaster', 'SatoshiNakamoto', 'WhaleAlert', 'DiamondHands', 'MoonBoy', 'HODLer', 'BagHolder', 'VitalikFan', 'ElonMusk',
    'DogeFather', 'ShibaInu', 'PepeFrog', 'WAGMI', 'NGMI', 'AlphaSeeker', 'BetaTester', 'GammaRay', 'DeltaForce', 'OmegaLul',
    'AlexG', 'Sarah_99', 'MikeT', 'EmmaW', 'ChrisP', 'JessicaL', 'DavidB', 'AshleyM', 'JamesR', 'AmandaK',
    'RobertH', 'JenniferS', 'MichaelJ', 'LisaD', 'WilliamC', 'MaryF', 'DavidG', 'PatriciaH', 'RichardI', 'LindaJ',
    'JosephK', 'BarbaraL', 'ThomasM', 'ElizabethN', 'CharlesO', 'SusanP', 'ChristopherQ', 'MargaretR', 'DanielS', 'JessicaT',
    'MatthewU', 'SarahV', 'AnthonyW', 'KarenX', 'DonaldY', 'NancyZ', 'MarkA', 'LisaB', 'PaulC', 'BettyD',
    'StevenE', 'DorothyF', 'AndrewG', 'SandraH', 'KennethI', 'AshleyJ', 'JoshuaK', 'KimberlyL', 'KevinM', 'DonnaN',
    'BrianO', 'EmilyP', 'GeorgeQ', 'MichelleR', 'EdwardS', 'CarolT', 'RonaldU', 'AmandaV', 'TimothyW', 'MelissaX',
    'JasonY', 'DeborahZ', 'JeffreyA', 'StephanieB', 'RyanC', 'RebeccaD', 'JacobE', 'LauraF', 'GaryG', 'SharonH',
    'NicholasI', 'CynthiaJ', 'EricK', 'KathleenL', 'StephenM', 'AmyN', 'JonathanO', 'ShirleyP', 'LarryQ', 'AngelaR',
    'JustinS', 'HelenT', 'ScottU', 'AnnaV', 'BrandonW', 'BrendaX', 'FrankY', 'PamelaZ', 'BenjaminA', 'NicoleB',
    'GregoryC', 'SamanthaD', 'SamuelE', 'KatherineF', 'RaymondG', 'ChristineH', 'PatrickI', 'DebraJ', 'AlexanderK', 'RachelL',
    'JackM', 'CatherineN', 'DennisO', 'CarolynP', 'JerryQ', 'JanetR', 'TylerS', 'RuthT', 'AaronU', 'MariaV',
    'HenryW', 'HeatherX', 'JoseY', 'DianeZ', 'DouglasA', 'VirginiaB', 'PeterC', 'JulieD', 'AdamE', 'JoyceF',
    'NathanG', 'VictoriaH', 'ZacharyI', 'OliviaJ', 'WalterK', 'KellyL', 'KyleM', 'ChristinaN', 'HaroldO', 'LaurenP',
    'CarlQ', 'JoanR', 'JeremyS', 'EvelynT', 'KeithU', 'JudithV', 'RogerW', 'MeganX', 'GeraldY', 'CherylZ',
    'EthanA', 'MarthaB', 'ArthurC', 'AndreaD', 'TerryE', 'FrancesF', 'ChristianG', 'HannahH', 'SeanI', 'JacquelineJ',
    'LawrenceK', 'AnnL', 'AustinM', 'GloriaN', 'JoeO', 'JeanP', 'NoahQ', 'KathrynR', 'JesseS', 'AliceT',
    'AlbertU', 'TeresaV', 'BryanW', 'SaraX', 'BillyY', 'JaniceZ', 'BruceA', 'DorisB', 'WillieC', 'MadisonD',
    'JordanE', 'JuliaF', 'DylanG', 'GraceH', 'AlanI', 'JudyJ', 'RalphK', 'AbigailL', 'GabrielM', 'MarieN',
    'RoyO', 'MarilynP', 'JuanQ', 'BeverlyR', 'WayneS', 'DeniseT', 'EugeneU', 'DanielleV', 'LoganW', 'MarilynX',
    'RandyY', 'AmberZ', 'LouisA', 'BrittanyB', 'RussellC', 'RoseD', 'VincentE', 'DianaF', 'PhilipG', 'NatalieH',
    'BobbyI', 'SophiaJ', 'JohnnyK', 'AlexisL', 'BradleyM', 'LoriN'
];

// Create a mapping of items to their boxes (items with their box names)
// This ensures each item is matched to its actual box
interface ItemWithBox {
    item: typeof INITIAL_BOXES[0]['items'][0];
    boxName: string;
}

const ALL_PRIZE_ITEMS_WITH_BOXES: ItemWithBox[] = INITIAL_BOXES.flatMap(box =>
    box.items
        .filter(item => item.value <= 1500)
        .map(item => ({
            item,
            boxName: box.name
        }))
);

// Debug: Log available items count
if (typeof window !== 'undefined') {
    // console.log('Live Drops: Available items count:', ALL_PRIZE_ITEMS_WITH_BOXES.length);
}

// Helper to preload images
const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve anyway to avoid blocking
    });
};

export const LiveSidebar = () => {
    const [drops, setDrops] = useState<Drop[]>([]);

    useEffect(() => {
        // 1. Fetch initial drops from database (shared state for all users)
        const fetchInitialDrops = async () => {
            const { data, error } = await supabase
                .from('live_drops')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) {
                // Get valid box names from INITIAL_BOXES
                const validBoxNames = new Set(INITIAL_BOXES.map(box => box.name));

                // Filter out items > $1500 AND items from boxes that don't exist
                const filteredData = data.filter(drop =>
                    drop.value <= 1500 && validBoxNames.has(drop.box_name)
                );
                setDrops(filteredData);
            }
        };

        fetchInitialDrops();

        // 2. Subscribe to new drops (real-time updates)
        const subscription = supabase
            .channel('live_drops_channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_drops' }, async (payload) => {
                const newDrop = payload.new as Drop;
                // Get valid box names from INITIAL_BOXES
                const validBoxNames = new Set(INITIAL_BOXES.map(box => box.name));
                // Filter out items over $1500 AND items from boxes that don't exist
                if (newDrop.value > 1500 || !validBoxNames.has(newDrop.box_name)) return;
                // Preload image before showing
                if (newDrop.item_image) {
                    await preloadImage(newDrop.item_image);
                }
                setDrops(prev => [newDrop, ...prev].slice(0, 50));
            })
            .subscribe();

        // 3. Generate new drops every 1-3 minutes
        let mockTimeout: NodeJS.Timeout;
        let isGenerating = false;

        const generateAndInsertDrop = async () => {
            // Prevent multiple clients from generating at the same time
            if (isGenerating) {
                return;
            }
            isGenerating = true;

            // Check if we have items available
            if (ALL_PRIZE_ITEMS_WITH_BOXES.length === 0) {
                console.warn('No prize items available for live drops');
                isGenerating = false;
                return;
            }

            // Pick a random item with its correct box name
            const randomItemWithBox = ALL_PRIZE_ITEMS_WITH_BOXES[Math.floor(Math.random() * ALL_PRIZE_ITEMS_WITH_BOXES.length)];
            const randomUser = MOCK_USERNAMES[Math.floor(Math.random() * MOCK_USERNAMES.length)] + Math.floor(Math.random() * 100);

            const mockDrop = {
                id: `drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                user_name: randomUser,
                item_name: randomItemWithBox.item.name,
                item_image: randomItemWithBox.item.image,
                box_name: randomItemWithBox.boxName,
                value: randomItemWithBox.item.value
            };

            // Insert into database (subscription will handle adding to UI)
            try {
                const { data, error } = await supabase
                    .from('live_drops')
                    .insert(mockDrop)
                    .select()
                    .single();

                if (error) {
                    console.error('Failed to insert mock drop:', error);
                } else {
                    // Drop inserted successfully
                }
            } catch (e) {
                console.error('Error inserting mock drop:', e);
            } finally {
                isGenerating = false;
            }
        };

        const scheduleNextDrop = () => {
            // Random delay between 1-3 minutes (60000 - 180000 ms)
            const randomDelay = Math.floor(Math.random() * 120000) + 60000;
            const delayMinutes = (randomDelay / 60000).toFixed(1);

            mockTimeout = setTimeout(async () => {
                // Check if a drop was added recently (within last 30 seconds) to avoid duplicates
                const { data: recentDrops, error: recentError } = await supabase
                    .from('live_drops')
                    .select('created_at')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (recentError) {
                    console.error('Error checking recent drops:', recentError);
                }

                if (recentDrops && recentDrops.length > 0) {
                    const lastDropTime = new Date(recentDrops[0].created_at).getTime();
                    const timeSinceLastDrop = Date.now() - lastDropTime;
                    // Only generate if last drop was more than 30 seconds ago
                    if (timeSinceLastDrop < 30000) {
                        // console.log('Live Drops: Drop was added recently, rescheduling...');
                        // Reschedule for later
                        scheduleNextDrop();
                        return;
                    }
                }

                await generateAndInsertDrop();
                // Schedule next drop
                scheduleNextDrop();
            }, randomDelay);
        };

        // Generate first drop immediately if database is empty, then start scheduling
        const initializeDrops = async () => {
            console.log('Live Drops: Initializing...');
            const { data: existingDrops, error: checkError } = await supabase
                .from('live_drops')
                .select('id')
                .limit(1);

            if (checkError) {
                console.error('Live Drops: Error checking existing drops:', checkError);
            }

            if (!existingDrops || existingDrops.length === 0) {
                // console.log('Live Drops: Database is empty, generating initial drop immediately...');
                await generateAndInsertDrop();
            } else {
                // console.log('Live Drops: Found', existingDrops.length, 'existing drop(s) in database');
            }

            // Start scheduling regular drops
            // console.log('Live Drops: Starting scheduled drops...');
            scheduleNextDrop();
        };

        // Small delay to ensure subscription is set up first
        setTimeout(() => {
            initializeDrops();
        }, 1000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(mockTimeout);
        };
    }, []);

    // Helper to format time with timezone correction
    const formatTimeAgo = (dateString: string) => {
        const date = parseISO(dateString);
        return formatDistanceToNow(date, { addSuffix: true });
    };

    // Helper to determine rarity from value
    const getRarity = (val: number): Rarity => {
        if (val > 2000) return Rarity.LEGENDARY;
        if (val > 500) return Rarity.EPIC;
        if (val > 100) return Rarity.RARE;
        if (val > 50) return Rarity.UNCOMMON;
        return Rarity.COMMON;
    };

    return (
        <div className="hidden xl:flex flex-col w-[300px] bg-[#0b0f19] border-l border-white/5 fixed right-0 top-20 bottom-0 z-30 overflow-hidden">

            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-[#0d121f] flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-xs font-bold text-white tracking-widest uppercase">Live Drops</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                    {drops.length} NEW
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 scrollbar-hide mask-gradient-bottom">
                {drops.map((drop) => {
                    const rarity = getRarity(drop.value);
                    return (
                        <div
                            key={drop.id}
                            className={`
                        relative group flex items-center gap-3 p-3 rounded-xl bg-[#131b2e] border-l-[3px]
                        hover:bg-white/5 transition-all cursor-pointer animate-in slide-in-from-right-10 duration-500
                        ${RARITY_COLORS[rarity]} border-white/5
                    `}
                            style={{ borderLeftColor: rarity === Rarity.LEGENDARY ? '#eab308' : rarity === Rarity.EPIC ? '#f43f5e' : rarity === Rarity.RARE ? '#a855f7' : rarity === Rarity.UNCOMMON ? '#3b82f6' : '#64748b' }}
                        >
                            {/* Item Image */}
                            <div className="w-14 h-14 rounded-lg bg-[#0b0f19] border border-white/5 p-1 relative overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                <div className={`absolute inset-0 opacity-20 ${rarity === Rarity.LEGENDARY ? 'bg-yellow-500' : 'bg-slate-500'}`}></div>
                                <img src={drop.item_image} alt={drop.item_name} className="w-full h-full object-contain relative z-10" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 pr-12">
                                <div className={`text-sm font-bold line-clamp-2 leading-tight break-words ${rarity === Rarity.LEGENDARY ? 'text-yellow-400 drop-shadow-sm' : 'text-slate-200'}`}>
                                    {drop.item_name}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate mb-1 mt-0.5">{drop.box_name}</div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${drop.user_name}`} className="w-4 h-4 rounded-full bg-slate-700" />
                                        <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{drop.user_name}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-600">
                                        {formatTimeAgo(drop.created_at)}
                                    </div>
                                </div>
                            </div>

                            {/* Value Badge */}
                            <div className="absolute top-2 right-2 flex-shrink-0">
                                <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                    ${drop.value.toFixed(0)}
                                </span>
                            </div>
                        </div>
                    );
                })}

                <div className="h-8"></div> {/* Spacer for bottom fade */}
            </div>
        </div>
    );
};

