import React, { useState, useEffect, useRef } from 'react';
import { ClerkProvider, SignedIn, SignedOut, UserButton, useUser, SignInButton, SignUpButton, useClerk, useAuth } from '@clerk/clerk-react';
import { Navbar } from './components/Navbar';
import { OpeningStage } from './components/OpeningStage';
import { WelcomeOpeningStage } from './components/WelcomeOpeningStage';
import { StatsHeader } from './components/StatsHeader';

import { LiveSidebar } from './components/LiveSidebar';
import { BattleLobby } from './components/BattleLobby';
import { BattleArena } from './components/BattleArena';
import { RacePage } from './components/RacePage';
import { AffiliatesPage } from './components/AffiliatesPage';
import { ProvablyFairModal } from './components/ProvablyFairModal';
import { ShippingModal } from './components/ShippingModal';
import { AdminPanel } from './components/AdminPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LazyImage } from './components/LazyImage';
import { ImageUploader } from './components/ImageUploader';
import { CryptoDepositModal } from './components/CryptoDepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { LootBox, User, ViewState, Rarity, LootItem, BoxCategory, Battle, ShippingAddress } from './types';
import { INITIAL_BOXES, RARITY_COLORS, RARITY_BG, RARITY_GRADIENTS, MOCK_BATTLES } from './constants';
import { generateOutcome } from './services/provablyFairService';
import { generateCustomBox, generateBoxImage } from './services/geminiService';
import { getUser, addTransaction, updateUserState, markFreeBoxClaimed } from './services/walletService';
import { createOrder } from './services/orderService';
import { createShipment } from './services/shippingService';
import { supabase } from './services/supabaseClient';
import { createNotification } from './services/notificationService';
import { X, Loader2, Sparkles, RefreshCw, DollarSign, Package, Filter, Search, Bitcoin, CreditCard, ChevronRight, Paintbrush, ArrowRight, Check, Shield, Info, Gift, Users, Skull, Swords, Truck, Pencil, Trophy, Gamepad2 } from 'lucide-react';

export default function App() {
    const { user: clerkUser, isSignedIn, isLoaded } = useUser();
    const { getToken } = useAuth();
    const [view, setView] = useState<ViewState>({ page: 'HOME' });
    const [user, setUser] = useState<User | null>(null);
    const [selectedBox, setSelectedBox] = useState<LootBox | null>(null);

    // Battle State
    const [battles, setBattles] = useState<Battle[]>(MOCK_BATTLES);
    const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
    const [battlePlayerCount, setBattlePlayerCount] = useState<2 | 4 | 6>(2); // 1v1 (2), 2v2 (4), 3v3 (6)

    // Fetch battles from database
    useEffect(() => {
        const fetchBattles = async () => {
            try {
                // Get current time minus 10 minutes (forfeited battles stay visible for 10 min)
                const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

                // Fetch WAITING and ACTIVE battles
                const { data: activeBattles, error: activeError } = await supabase
                    .from('battles')
                    .select('*')
                    .in('status', ['WAITING', 'ACTIVE'])
                    .order('created_at', { ascending: false })
                    .limit(50);

                // Fetch recent FINISHED battles (within last 10 minutes)
                const { data: finishedBattles, error: finishedError } = await supabase
                    .from('battles')
                    .select('*')
                    .eq('status', 'FINISHED')
                    .gte('created_at', tenMinutesAgo)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (activeError || finishedError) {
                    console.error('Error fetching battles:', activeError || finishedError);
                    return;
                }

                // Combine and transform battles
                const allBattles = [...(activeBattles || []), ...(finishedBattles || [])];

                if (allBattles.length > 0) {
                    // Transform database battles to Battle type
                    const transformedBattles: Battle[] = allBattles.map((b: any) => ({
                        id: b.id,
                        boxId: b.box_id,
                        price: parseFloat(b.price),
                        playerCount: b.player_count as 2 | 4 | 6,
                        roundCount: b.round_count,
                        mode: b.mode || 'STANDARD',
                        status: b.status as 'WAITING' | 'ACTIVE' | 'FINISHED',
                        players: typeof b.players === 'string' ? JSON.parse(b.players) : b.players
                    }));

                    // Sort by created_at descending
                    transformedBattles.sort((a, b) => {
                        const aTime = allBattles.find(db => db.id === a.id)?.created_at || '';
                        const bTime = allBattles.find(db => db.id === b.id)?.created_at || '';
                        return bTime.localeCompare(aTime);
                    });

                    setBattles(transformedBattles);
                }
            } catch (error) {
                console.error('Error fetching battles:', error);
            }
        };

        fetchBattles();

        // Refresh battles every 5 seconds
        const interval = setInterval(fetchBattles, 5000);
        return () => clearInterval(interval);
    }, []);

    // Opening State
    const [isOpening, setIsOpening] = useState(false);
    const [rollResult, setRollResult] = useState<{ item: LootItem; serverSeed: string; serverSeedHash: string; nonce: number; randomValue: number } | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);

    // Modals
    const [showDeposit, setShowDeposit] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [showCreateBattle, setShowCreateBattle] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [showProvablyFair, setShowProvablyFair] = useState(false);
    const [showShipping, setShowShipping] = useState(false);
    const [selectedItemsToShip, setSelectedItemsToShip] = useState<LootItem[]>([]);

    // Auth & Welcome Logic
    const [isWelcomeSpinPending, setIsWelcomeSpinPending] = useState(false);

    // Filters & Search
    const [activeCategory, setActiveCategory] = useState<BoxCategory>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // AI Box
    const [isReskinning, setIsReskinning] = useState(false);
    const [boxes, setBoxes] = useState<LootBox[]>(INITIAL_BOXES);
    const [boxesLoading, setBoxesLoading] = useState(true);

    // Deposit State
    const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH'>('BTC');
    const [showCryptoDeposit, setShowCryptoDeposit] = useState(false);

    // Profile Edit State
    const [isEditingName, setIsEditingName] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    // Balance Animation State
    const [balanceIncrease, setBalanceIncrease] = useState<number | null>(null);

    // Demo Mode State
    const [isDemoMode, setIsDemoMode] = useState(false);

    // Scroll to top on view change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [view.page, selectedBox]);

    // Update page title based on current view
    useEffect(() => {
        const baseTitle = 'LootVibe';
        let pageTitle = baseTitle;

        switch (view.page) {
            case 'HOME':
                pageTitle = 'Boxes | LootVibe';
                break;
            case 'BOX_DETAIL':
                pageTitle = selectedBox ? `${selectedBox.name} | LootVibe` : 'Box Details | LootVibe';
                break;
            case 'OPENING':
                pageTitle = selectedBox ? `Opening ${selectedBox.name} | LootVibe` : 'Opening Box | LootVibe';
                break;
            case 'PROFILE':
                pageTitle = user ? `${user.username}'s Profile | LootVibe` : 'Profile | LootVibe';
                break;
            case 'BATTLES':
                pageTitle = 'PVP Arena | LootVibe';
                break;
            case 'BATTLE_ARENA':
                pageTitle = activeBattle ? `Battle Arena | LootVibe` : 'Battle Arena | LootVibe';
                break;
            case 'RACES':
                pageTitle = 'Races | LootVibe';
                break;
            case 'AFFILIATES':
                pageTitle = 'Affiliate Program | LootVibe';
                break;
            case 'ADMIN':
                pageTitle = 'Admin Dashboard | LootVibe';
                break;
            default:
                pageTitle = baseTitle;
        }

        document.title = pageTitle;
    }, [view.page, selectedBox, user, activeBattle]);

    // Fetch boxes from database on mount
    useEffect(() => {
        const fetchBoxes = async () => {
            try {
                setBoxesLoading(true);
                // Try with 'enabled' field first
                let { data, error } = await supabase
                    .from('boxes')
                    .select('*')
                    .eq('enabled', true)
                    .order('created_at', { ascending: false });

                if (error) {
                    // Try with 'active' field instead of 'enabled'
                    const retry = await supabase
                        .from('boxes')
                        .select('*')
                        .eq('active', true)
                        .order('created_at', { ascending: false });

                    if (retry.error) {
                        console.error('Error fetching boxes:', retry.error);
                        // Keep INITIAL_BOXES as fallback
                        setBoxesLoading(false);
                        return;
                    }

                    data = retry.data;
                }

                if (data && data.length > 0) {
                    // Normalize box data - handle both 'image'/'image_url' fields
                    const normalizedBoxes = data.map((box: any) => ({
                        id: box.id,
                        name: box.name,
                        description: box.description || '',
                        category: box.category,
                        price: parseFloat(box.price),
                        sale_price: box.sale_price ? parseFloat(box.sale_price) : undefined,
                        image: box.image || box.image_url || '',
                        color: box.color,
                        tags: box.tags || [],
                        items: box.items || []
                    }));
                    setBoxes(normalizedBoxes);
                }
            } catch (error) {
                console.error('Error fetching boxes:', error);
                // Keep INITIAL_BOXES as fallback
            } finally {
                setBoxesLoading(false);
            }
        };

        fetchBoxes();
    }, []);

    const clerk = useClerk();

    // Sync user balance
    useEffect(() => {
        if (user) {
            const syncUser = async () => {
                const latestUser = await getUser(user.id);
                setUser(latestUser);
            };
            const interval = setInterval(syncUser, 2000);
            return () => clearInterval(interval);
        }
    }, [user?.id, clerk.session]);

    // Check for referral code and routes in URL
    useEffect(() => {
        const handleUrlParams = async () => {
            const path = window.location.pathname;

            // Handle Admin Route
            if (path === '/admin') {
                setView({ page: 'ADMIN' });
                return;
            }

            // Check for /r/USERNAME format
            const match = path.match(/\/r\/([a-zA-Z0-9]+)/);
            let referralCode = null;

            if (match && match[1]) {
                referralCode = match[1];
            } else {
                // Check for ?ref=CODE format
                const params = new URLSearchParams(window.location.search);
                referralCode = params.get('ref');
            }

            if (referralCode) {
                console.log('Found referral code:', referralCode);
                localStorage.setItem('referralCode', referralCode);
            }
        };

        handleUrlParams();
    }, []);

    // Initialize user from Clerk
    useEffect(() => {
        if (!isLoaded) return; // Wait for Clerk to load

        const initUser = async () => {
            if (isSignedIn && clerkUser) {
                // Always re-initialize if Clerk says user is signed in but app user is missing or different
                if (!user || user.id !== clerkUser.id) {
                    console.log('🔄 Initializing user from Clerk:', clerkUser.id);
                    try {
                        await confirmLogin();
                    } catch (error) {
                        console.error('❌ Failed to initialize user:', error);
                    }
                }
            } else if (!isSignedIn) {
                // Clear user if not signed in
                if (user) {
                    console.log('🔓 User signed out, clearing user state');
                    setUser(null);
                }
            }
        };

        initUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn, clerkUser?.id]); // Only depend on Clerk state, not user state

    // --- Handlers ---

    const handleLogin = (fromWelcomeSpin = false) => {
        // Don't open sign-in if user is already signed in
        if (isSignedIn) {
            console.log('User is already signed in, skipping login modal');
            return;
        }
        if (fromWelcomeSpin) {
            console.log('🎁 Setting pendingWelcomeSpin flag in localStorage');
            localStorage.setItem('pendingWelcomeSpin', 'true');
            setIsWelcomeSpinPending(true);
        }
        clerk.openSignIn();
    };

    const confirmLogin = async () => {
        console.log('🔐 confirmLogin called');
        if (!clerkUser) {
            console.log('❌ No clerkUser, returning');
            return;
        }

        console.log('👤 Fetching user from database:', clerkUser.id);

        // Get Clerk token for authenticated user creation
        const clerkToken = await getToken({ template: 'supabase' });
        console.log('🔑 Got Clerk token for user creation:', !!clerkToken);

        const loggedInUser = await getUser(clerkUser.id, clerkToken || undefined);
        console.log('✅ User fetched:', loggedInUser.username, 'freeBoxClaimed:', loggedInUser.freeBoxClaimed);

        // Check for pending referral
        const pendingReferral = localStorage.getItem('referralCode');
        if (pendingReferral) {
            try {
                // Import dynamically to avoid circular dependencies if any
                const { trackReferral } = await import('./services/affiliateService');
                await trackReferral(pendingReferral, loggedInUser.id);
                localStorage.removeItem('referralCode');
                console.log('Referral tracked successfully');
            } catch (e) {
                console.error('Failed to track referral on login:', e);
            }
        }

        setUser(loggedInUser);
        setShowAuth(false);

        // Check if this login originated from "Claim Free Box" to trigger the spin
        // Check both local state (for direct login) and localStorage (for redirect login)
        const localStorageFlag = localStorage.getItem('pendingWelcomeSpin');
        const isPending = isWelcomeSpinPending || localStorageFlag === 'true';

        console.log('🎁 Checking Free Box trigger:', {
            isWelcomeSpinPending,
            localStorageFlag,
            isPending,
            freeBoxClaimed: loggedInUser.freeBoxClaimed
        });

        if (isPending) {
            if (loggedInUser.freeBoxClaimed) {
                console.log('⚠️ User already claimed free box, skipping spin');
                setIsWelcomeSpinPending(false);
                localStorage.removeItem('pendingWelcomeSpin');
            } else {
                console.log('🎰 Triggering Free Box spin in 500ms...');
                setTimeout(() => {
                    // Trigger welcome spin box
                    const welcomeBox = INITIAL_BOXES.find(b => b.id === 'welcome_gift');
                    console.log('📦 Welcome box found:', welcomeBox?.name);
                    if (welcomeBox) {
                        setSelectedBox(welcomeBox);
                        // Rigged spin for welcome bonus
                        handleWelcomeSpin(welcomeBox);
                        setIsWelcomeSpinPending(false); // Reset pending state
                        localStorage.removeItem('pendingWelcomeSpin');
                        console.log('✅ Free Box spin triggered!');
                    } else {
                        console.error('❌ Welcome box not found in INITIAL_BOXES');
                    }
                }, 500);
            }
        } else {
            console.log('ℹ️ No pending welcome spin');
        }
    };

    const handleWelcomeSpin = async (box: LootBox) => {
        if (!user || user.freeBoxClaimed) {
            console.log('❌ Cannot claim free box:', { hasUser: !!user, freeBoxClaimed: user?.freeBoxClaimed });
            return;
        }

        console.log('🎁 Claiming free box via Edge Function...');

        try {
            // Get Clerk session token
            const token = await clerk.session?.getToken({ template: 'supabase' });
            if (!token) {
                console.error('❌ No Clerk token available');
                alert('Authentication error. Please sign in again.');
                return;
            }

            // Show opening animation
            setView({ page: 'OPENING' });
            setIsOpening(true);

            // Call secure Edge Function
            const { data, error } = await supabase.functions.invoke('claim-free-box', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (error) {
                console.error('❌ Edge Function error:', error);

                // Check if already claimed
                if (error.message?.includes('already claimed')) {
                    alert('You have already claimed your free box!');
                    setIsOpening(false);
                    setView({ page: 'HOME' });
                    return;
                }

                throw error;
            }

            console.log('✅ Free box claimed successfully:', data);

            // CRITICAL: Update user state IMMEDIATELY to prevent re-claiming
            const updatedUser = {
                ...user,
                balance: data.newBalance,
                freeBoxClaimed: true
            };
            setUser(updatedUser);

            // --- RIGGED REEL GENERATION FOR FREE BOX ---
            // We want to tease high value items right before the winner (Index 60)
            const WINNER_INDEX = 60;
            const totalItems = WINNER_INDEX + 10;
            const reelItems: LootItem[] = [];

            // Get high value items (Legendary/Epic) for the tease
            const highValueItems = box.items.filter(i => i.rarity === 'LEGENDARY' || i.rarity === 'EPIC');
            const winnerItem = data.item;

            for (let i = 0; i < totalItems; i++) {
                if (i === WINNER_INDEX) {
                    // The Winner (Index 60)
                    reelItems.push({ ...winnerItem, id: `winner-${winnerItem.id}` });
                } else if (i === WINNER_INDEX - 1) {
                    // TEASER: Place a high value item RIGHT BEFORE the winner
                    // This creates the "slow down on Charizard" effect
                    const teaser = highValueItems.length > 0
                        ? highValueItems[Math.floor(Math.random() * highValueItems.length)]
                        : box.items[0];
                    reelItems.push({ ...teaser, id: `teaser-${teaser.id}-${i}` });
                } else if (i === WINNER_INDEX + 1) {
                    // Item right after winner (also visible)
                    const nextItem = box.items[Math.floor(Math.random() * box.items.length)];
                    reelItems.push({ ...nextItem, id: `next-${nextItem.id}-${i}` });
                } else {
                    // Random items from the box
                    const randomItem = box.items[Math.floor(Math.random() * box.items.length)];
                    reelItems.push({ ...randomItem, id: `${randomItem.id}-${i}` });
                }
            }

            // Set the roll result with our custom rigged reel
            setRollResult({
                ...data.rollResult,
                preGeneratedReel: reelItems
            });

            // Wait for animation
            setTimeout(async () => {
                if (!user) return; // User state is already updated, this check is mostly for safety

                setIsOpening(false);
                setView({ page: 'HOME' });
                setSelectedBox(null);

                console.log('🎉 Free box flow complete!');
            }, 3000);

        } catch (error) {
            console.error('❌ Error claiming free box:', error);
            alert('Failed to claim free box. Please try again.');
            setIsOpening(false);
            setView({ page: 'HOME' });
        }
    };

    const handleLogout = async () => {
        await clerk.signOut();
        setUser(null);
        setView({ page: 'HOME' });
    };

    const handleOpenBox = async () => {
        if (!selectedBox || !user) {
            // Only trigger login if user is not signed in with Clerk
            if (!user && !isSignedIn) {
                handleLogin(false);
            }
            return;
        }

        // Redirect Welcome Gift to special handler
        if (selectedBox.id === 'welcome_gift') {
            handleWelcomeSpin(selectedBox);
            return;
        }

        // Ensure we are NOT in demo mode for a real opening
        setIsDemoMode(false);

        const cost = selectedBox.salePrice || selectedBox.price;
        if (user.balance < cost) {
            setShowDeposit(true);
            return;
        }

        try {
            // Show "Generating seed" suspense
            setIsOpening(true);
            setView({ page: 'OPENING' });

            // Add 1.5 second delay for suspense
            await new Promise(resolve => setTimeout(resolve, 1500));

            // SECURITY: Use Supabase Edge Function to generate outcome server-side
            // This prevents client-side manipulation (unlike the old client-side generateOutcome)
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (!anonKey) {
                throw new Error('VITE_SUPABASE_ANON_KEY is missing! Edge Function will fail.');
            }

            const authHeader = `Bearer ${anonKey}`;
            console.log(`🔐 Secure Box Opening - Using Edge Function for user: ${user.id}`);

            // Call secure edge function (similar to battle-spin)
            const { data, error } = await supabase.functions.invoke('box-open', {
                headers: {
                    Authorization: authHeader
                },
                body: {
                    boxId: selectedBox.id,
                    userId: user.id,
                    clientSeed: user.clientSeed,
                    nonce: user.nonce
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error || 'Failed to generate outcome');

            const outcome = data.outcome;
            // Outcome generated successfully

            // Format result to match expected structure
            const result = {
                item: outcome.item,
                serverSeed: outcome.serverSeed,
                serverSeedHash: outcome.serverSeedHash,
                nonce: outcome.nonce,
                randomValue: outcome.randomValue,
                block: {
                    height: 840000 + Math.floor(Math.random() * 1000),
                    hash: "0000000000000000000" + outcome.serverSeedHash.substring(0, 20)
                }
            };

            // 2. Generate the reel ONCE here (before component mounts)
            const WINNER_INDEX = 60;
            const totalItems = WINNER_INDEX + 10;
            const reelItems: LootItem[] = [];
            const highTierItems = selectedBox.items.filter(i => i.rarity === 'LEGENDARY' || i.rarity === 'EPIC');

            for (let i = 0; i < totalItems; i++) {
                if (i === WINNER_INDEX) {
                    // Place the actual winner at index 60
                    reelItems.push({ ...result.item, id: `winner - ${result.item.id} ` });
                } else if (i === WINNER_INDEX + 1 || i === WINNER_INDEX - 1) {
                    // Teaser items next to winner
                    if (Math.random() > 0.5 && highTierItems.length > 0) {
                        const randomTease = highTierItems[Math.floor(Math.random() * highTierItems.length)];
                        reelItems.push(randomTease.id !== result.item.id ? randomTease : selectedBox.items[0]);
                    } else {
                        const randomItem = selectedBox.items[Math.floor(Math.random() * selectedBox.items.length)];
                        reelItems.push({ ...randomItem, id: `${randomItem.id} -${i} ` });
                    }
                } else {
                    // Random filler
                    const randomItem = selectedBox.items[Math.floor(Math.random() * selectedBox.items.length)];
                    reelItems.push({ ...randomItem, id: `${randomItem.id} -${i} ` });
                }
            }

            // Note: Balance deduction, transaction creation, inventory addition, and box_openings record
            // are all handled by the edge function for security. We don't need createOrder anymore.

            // 3. Update Stats (totalWagered = count of boxes, totalProfit = item values)
            const newTotalWagered = (user.totalWagered || 0) + 1; // Increment box count
            const newTotalProfit = (user.totalProfit || 0) + outcome.itemValue; // Add item value

            // 4. Update Local User State with stats and new balance
            // Note: nonce is already incremented by edge function, don't overwrite it
            await updateUserState(user.id, {
                totalWagered: newTotalWagered,
                totalProfit: newTotalProfit
            });
            const updatedUser = await getUser(user.id);
            setUser(updatedUser);

            // 5. Set result with pre-generated reel and openingId for tracking
            setRollResult({
                ...result,
                preGeneratedReel: reelItems,
                openingId: outcome.openingId // Store openingId for exchange tracking
            });

        } catch (error) {
            console.error("❌ Open Box Error:", error);
            alert(`Failed to open box: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
            setIsOpening(false);
            setView({ page: 'BOX_DETAIL' });
        }
    };

    const handleDemoOpen = async () => {
        console.log('🎮 handleDemoOpen called, selectedBox:', selectedBox);
        console.log('🎮 Current view:', view);
        console.log('🎮 Current isOpening:', isOpening);

        if (!selectedBox) {
            console.error('❌ No box selected for demo');
            alert('Please select a box first');
            return;
        }

        if (!selectedBox.items || selectedBox.items.length === 0) {
            console.error('❌ Box has no items:', selectedBox);
            console.error('❌ Box items:', selectedBox.items);
            alert('This box has no items available');
            return;
        }

        try {
            console.log('🎮 Starting demo open for box:', selectedBox.name, 'with', selectedBox.items.length, 'items');
            console.log('🎮 First item sample:', selectedBox.items[0]);

            // 1. Generate outcome (no balance deduction)
            const demoSeed = 'demo-seed-' + Date.now();
            console.log('🎮 Generating outcome with seed:', demoSeed);

            const result = await generateOutcome(selectedBox.items, demoSeed, 0);
            console.log('🎮 DEMO: Generated outcome:', result.item.name, '| Value:', result.item.value);
            console.log('🎮 DEMO: Result object:', result);

            // 2. Generate the reel
            const WINNER_INDEX = 60;
            const totalItems = WINNER_INDEX + 10;
            const reelItems: LootItem[] = [];
            const highTierItems = selectedBox.items.filter(i => i.rarity === 'LEGENDARY' || i.rarity === 'EPIC');
            console.log('🎮 High tier items count:', highTierItems.length);

            for (let i = 0; i < totalItems; i++) {
                if (i === WINNER_INDEX) {
                    reelItems.push({ ...result.item, id: `winner-${result.item.id}` });
                } else if (i === WINNER_INDEX + 1 || i === WINNER_INDEX - 1) {
                    if (Math.random() > 0.5 && highTierItems.length > 0) {
                        const randomTease = highTierItems[Math.floor(Math.random() * highTierItems.length)];
                        reelItems.push(randomTease.id !== result.item.id ? randomTease : selectedBox.items[0]);
                    } else {
                        const randomItem = selectedBox.items[Math.floor(Math.random() * selectedBox.items.length)];
                        reelItems.push({ ...randomItem, id: `${randomItem.id}-${i}` });
                    }
                } else {
                    const randomItem = selectedBox.items[Math.floor(Math.random() * selectedBox.items.length)];
                    reelItems.push({ ...randomItem, id: `${randomItem.id}-${i}` });
                }
            }

            console.log('🎮 Generated reel with', reelItems.length, 'items');
            console.log('🎮 Winner at index', WINNER_INDEX, ':', reelItems[WINNER_INDEX]?.name);

            // 3. Set result with pre-generated reel BEFORE changing view
            // This ensures the OpeningStage component receives rollResult immediately
            const rollResultData = { ...result, preGeneratedReel: reelItems };
            console.log('🎮 Setting rollResult:', rollResultData);
            setRollResult(rollResultData);

            // 4. Set opening state and change view
            console.log('🎮 Setting isOpening to true and changing view to OPENING');
            setIsOpening(true);
            setIsDemoMode(true);
            setView({ page: 'OPENING' });

            console.log('🎮 Demo open complete!');

        } catch (error) {
            console.error("❌ Demo Open Error:", error);
            console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
            alert(`Failed to run demo: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsOpening(false);
            setView({ page: 'BOX_DETAIL' });
            setIsDemoMode(false);
        }
    };

    const handleAnimationComplete = React.useCallback(() => {
        setIsOpening(false);
        setTimeout(() => {
            setShowResultModal(true);
        }, 500);
    }, []);

    const resetOpenState = React.useCallback(() => {
        setShowResultModal(false);
        setRollResult(null);
        setView({ page: 'BOX_DETAIL' });
    }, []);

    const handleSellItem = React.useCallback(async () => {
        if (!user || !rollResult) return;
        try {
            // SECURITY: Use edge function to exchange item (prevents manipulation)
            // Get Clerk JWT token for authentication
            const clerkToken = await getToken({ template: 'supabase' });
            if (!clerkToken) {
                throw new Error('Not authenticated with Clerk');
            }

            // Get anon key for Supabase gateway (required)
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (!anonKey) {
                throw new Error('VITE_SUPABASE_ANON_KEY is missing!');
            }

            // Call secure edge function
            // Send anon key in Authorization (for Supabase gateway)
            // Send Clerk JWT in custom header (for function to verify)
            const { data, error } = await supabase.functions.invoke('item-exchange', {
                headers: {
                    Authorization: `Bearer ${anonKey}`,
                    'X-Clerk-Token': clerkToken // Custom header for Clerk JWT
                },
                body: {
                    openingId: (rollResult as any).openingId
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error || 'Failed to exchange item');

            // Trigger balance animation
            setBalanceIncrease(data.itemValue);

            // Close modal immediately
            resetOpenState();

            // Update user state
            const updatedUser = await getUser(user.id);
            console.log('✅ Balance updated:', updatedUser.balance);
            setUser(updatedUser);
        } catch (error) {
            console.error('❌ Error exchanging item:', error);
            alert(`Failed to exchange item: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
        }
    }, [user, rollResult, resetOpenState]);

    const handleKeepItem = React.useCallback(async () => {
        if (!user || !rollResult) return;
        try {
            // NOTE: Item is already added to inventory by the box-open edge function
            // This is just a UI action to close the modal and refresh the user state

            // Create notification when user clicks "Add to Inventory"
            if (rollResult.item && selectedBox) {
                await createNotification(
                    user.id,
                    'INVENTORY_ADDED',
                    'Item Added to Inventory',
                    `${rollResult.item.name} has been added to your inventory!`,
                    {
                        item_name: rollResult.item.name,
                        item_image: rollResult.item.image,
                        item_value: rollResult.item.value,
                        box_id: selectedBox.id,
                        box_name: selectedBox.name
                    }
                );
            }

            // Refresh user state to get latest inventory
            const updatedUser = await getUser(user.id);
            setUser(updatedUser);
            resetOpenState();
        } catch (error) {
            console.error('❌ Error refreshing inventory:', error);
            alert('Failed to refresh inventory. Please try again.');
        }
    }, [user, rollResult, resetOpenState, selectedBox]);

    const handleShipItems = (items: LootItem[]) => {
        // Filter out items that are already being processed
        const availableItems = items.filter(item => !item.shippingStatus);
        if (availableItems.length === 0) {
            alert('No items available to ship. All selected items are already being processed.');
            return;
        }
        setSelectedItemsToShip(availableItems);
        setShowShipping(true);
    };

    const handleShipmentSubmit = async (address: ShippingAddress) => {
        if (!user) return;
        try {
            await createShipment(user.id, selectedItemsToShip, address);
            const updatedUser = await getUser(user.id);
            setUser(updatedUser);
            setShowShipping(false);
            setSelectedItemsToShip([]);
        } catch (error: any) {
            console.error('Shipping error:', error);
            alert(error.message || 'Failed to create shipment. Please try again.');
        }
    };

    // --- Battle Handlers ---
    const initiateCreateBattle = () => {
        if (!user && !isSignedIn) { handleLogin(false); return; }
        setShowCreateBattle(true);
    };

    const finalizeCreateBattle = async (box: LootBox) => {
        if (!user) return;

        const cost = box.salePrice || box.price;

        if (user.balance < cost) {
            setShowCreateBattle(false);
            setShowDeposit(true);
            return;
        }

        try {
            // Deduct balance from database
            await addTransaction(user.id, 'BET', cost, `Battle creation: ${battlePlayerCount === 2 ? '1v1' : battlePlayerCount === 4 ? '2v2' : '3v3'}`);

            // Refresh user from database
            const updatedUser = await getUser(user.id);
            setUser(updatedUser);

            const playersArray = new Array(battlePlayerCount).fill(null);
            playersArray[0] = updatedUser; // Creator is always slot 0

            const newBattle: Battle = {
                id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                boxId: box.id,
                price: cost,
                playerCount: battlePlayerCount,
                players: playersArray,
                status: 'WAITING',
                roundCount: 1,
            };

            // Save battle to database
            const { error: dbError } = await supabase
                .from('battles')
                .insert({
                    id: newBattle.id,
                    box_id: newBattle.boxId,
                    price: newBattle.price,
                    player_count: newBattle.playerCount,
                    round_count: newBattle.roundCount,
                    mode: 'STANDARD',
                    status: newBattle.status,
                    players: JSON.stringify(newBattle.players)
                });

            if (dbError) {
                console.error('Error saving battle to database:', dbError);
                // Continue anyway - battle will work in memory
            }

            setBattles([newBattle, ...battles]);
            setShowCreateBattle(false);
            setActiveBattle(newBattle);
            setView({ page: 'BATTLE_ARENA' });
        } catch (error) {
            console.error('❌ Error creating battle:', error);
            alert('Failed to create battle. Please try again.');
        }
    };

    // Auto-fill with bots after waiting period
    const botFillTimerRef = useRef<NodeJS.Timeout | null>(null);
    const botFillFallbackRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Clear any existing timers
        if (botFillTimerRef.current) {
            clearTimeout(botFillTimerRef.current);
            botFillTimerRef.current = null;
        }
        if (botFillFallbackRef.current) {
            clearTimeout(botFillFallbackRef.current);
            botFillFallbackRef.current = null;
        }

        if (view.page === 'BATTLE_ARENA' && activeBattle && activeBattle.status === 'WAITING' && user) {
            // Check if there are empty slots
            const emptySlotsCount = activeBattle.players.filter(p => p === null).length;
            const isCreator = activeBattle.players[0]?.id === user.id;

            console.log('🔍 Bot fill check:', {
                page: view.page,
                battleId: activeBattle.id,
                status: activeBattle.status,
                emptySlots: emptySlotsCount,
                isCreator,
                userId: user.id,
                firstPlayerId: activeBattle.players[0]?.id
            });

            // Start timer if there are empty slots
            // For created battles: only creator starts timer
            // For joined battles: any player can trigger bot fill if battle is waiting
            if (emptySlotsCount > 0) {
                // If user is not creator, they might have joined - still allow bot fill after wait
                if (!isCreator) {
                    console.log('⚠️ User is not creator, but battle is waiting - will fill bots after wait');
                }
                // Wait 3-8 seconds (reduced for faster testing, can be 5-15s later)
                // Minimum 3 seconds, maximum 8 seconds
                const waitTime = 3000 + Math.random() * 5000; // 3-8 seconds
                console.log(`🤖 Bot fill timer started for battle ${activeBattle.id}: ${Math.round(waitTime / 1000)}s wait, ${emptySlotsCount} empty slots`);

                // Helper function to fill bots
                const fillBots = (battleToUpdate: Battle) => {
                    const newPlayers = [...battleToUpdate.players];
                    const emptySlots: number[] = [];

                    newPlayers.forEach((p, index) => {
                        if (p === null) {
                            emptySlots.push(index);
                        }
                    });

                    if (emptySlots.length > 0) {
                        console.log(`🤖 Filling ${emptySlots.length} slots with bots`);

                        const realisticUsernames = [
                            'AlexM', 'JordanK', 'SamT', 'ChrisR', 'TaylorW',
                            'MorganL', 'CaseyJ', 'RileyB', 'AveryP', 'QuinnM',
                            'DrewH', 'BlakeS', 'CameronN', 'DakotaF', 'EmeryC',
                            'FinleyG', 'HarperD', 'HaydenV', 'JamieX', 'KendallB',
                            'LoganM', 'MasonT', 'NoahR', 'OwenL', 'ParkerK',
                            'ReeseJ', 'RowanH', 'SageP', 'SkylarN', 'TylerF',
                            'ZaneC', 'AidenG', 'BrodyD', 'CarterV', 'DylanB',
                            'EthanM', 'FinnT', 'GavinR', 'HunterL', 'IsaacK',
                            'JaxonJ', 'KaiH', 'LiamP', 'MaxN', 'NolanF',
                            'OscarC', 'PeytonG', 'QuinnD', 'RyanV', 'SawyerB'
                        ];

                        const shuffledUsernames = [...realisticUsernames].sort(() => Math.random() - 0.5);

                        emptySlots.forEach((slotIndex, botIndex) => {
                            const botId = `bot_${battleToUpdate.id}_${slotIndex}_${Date.now()}_${botIndex}`;
                            newPlayers[slotIndex] = {
                                id: botId,
                                username: shuffledUsernames[botIndex] || `Player${botIndex + 1}`,
                                balance: 10000,
                                inventory: [],
                                shipments: [],
                                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${botId}`,
                                clientSeed: botId,
                                nonce: 0,
                            };
                        });

                        return {
                            ...battleToUpdate,
                            players: newPlayers,
                            status: 'ACTIVE' as const
                        };
                    }
                    return battleToUpdate;
                };

                // Also set a maximum timeout as fallback (20 seconds max)
                const maxWaitTime = 20000;
                const fallbackTimer = setTimeout(() => {
                    console.warn('⚠️ Fallback timer fired - forcing bot fill after 20s');
                    if (botFillTimerRef.current) {
                        clearTimeout(botFillTimerRef.current);
                        botFillTimerRef.current = null;
                    }
                    // Force bot fill
                    setBattles(prevBattles => {
                        const currentBattle = prevBattles.find(b => b.id === activeBattle.id);
                        if (currentBattle && currentBattle.status === 'WAITING') {
                            // Fill with bots immediately
                            const newPlayers = [...currentBattle.players];
                            const emptySlots: number[] = [];
                            newPlayers.forEach((p, index) => {
                                if (p === null) emptySlots.push(index);
                            });

                            if (emptySlots.length > 0) {
                                const realisticUsernames = [
                                    'AlexM', 'JordanK', 'SamT', 'ChrisR', 'TaylorW',
                                    'MorganL', 'CaseyJ', 'RileyB', 'AveryP', 'QuinnM',
                                    'DrewH', 'BlakeS', 'CameronN', 'DakotaF', 'EmeryC',
                                    'FinleyG', 'HarperD', 'HaydenV', 'JamieX', 'KendallB',
                                    'LoganM', 'MasonT', 'NoahR', 'OwenL', 'ParkerK',
                                    'ReeseJ', 'RowanH', 'SageP', 'SkylarN', 'TylerF',
                                    'ZaneC', 'AidenG', 'BrodyD', 'CarterV', 'DylanB',
                                    'EthanM', 'FinnT', 'GavinR', 'HunterL', 'IsaacK',
                                    'JaxonJ', 'KaiH', 'LiamP', 'MaxN', 'NolanF',
                                    'OscarC', 'PeytonG', 'QuinnD', 'RyanV', 'SawyerB'
                                ];
                                const shuffledUsernames = [...realisticUsernames].sort(() => Math.random() - 0.5);

                                emptySlots.forEach((slotIndex, botIndex) => {
                                    const botId = `bot_${currentBattle.id}_${slotIndex}_${Date.now()}_${botIndex}`;
                                    newPlayers[slotIndex] = {
                                        id: botId,
                                        username: shuffledUsernames[botIndex] || `Player${botIndex + 1}`,
                                        balance: 10000,
                                        inventory: [],
                                        shipments: [],
                                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${botId}`,
                                        clientSeed: botId,
                                        nonce: 0,
                                    };
                                });

                                const updatedBattle: Battle = {
                                    ...currentBattle,
                                    players: newPlayers,
                                    status: 'ACTIVE'
                                };

                                console.log('🤖 Fallback: Battle activated with bots');
                                setActiveBattle(updatedBattle);
                                return prevBattles.map(b => b.id === updatedBattle.id ? updatedBattle : b);
                            }
                        }
                        return prevBattles;
                    });
                }, maxWaitTime);

                // Store fallback timer reference
                botFillFallbackRef.current = fallbackTimer;

                botFillTimerRef.current = setTimeout(() => {
                    console.log('🤖 Bot fill timer fired! Checking battle state...');

                    // Use setBattles callback to get latest state
                    setBattles(prevBattles => {
                        const currentBattle = prevBattles.find(b => b.id === activeBattle.id);
                        if (!currentBattle) {
                            console.log('🤖 Battle not found in battles array');
                            return prevBattles;
                        }

                        if (currentBattle.status !== 'WAITING') {
                            console.log(`🤖 Battle status is ${currentBattle.status}, skipping bot fill`);
                            return prevBattles; // Battle already started
                        }

                        console.log('🤖 Battle is still waiting, proceeding with bot fill');
                        const updated = fillBots(currentBattle);

                        if (updated.status === 'ACTIVE') {
                            console.log('🤖 Battle activated with bots:', updated.players.map(p => p?.username));
                            setActiveBattle(updated);
                            return prevBattles.map(b => b.id === updated.id ? updated : b);
                        }

                        return prevBattles;
                    });

                    botFillTimerRef.current = null;
                }, waitTime);
            }
        }

        return () => {
            if (botFillTimerRef.current) {
                clearTimeout(botFillTimerRef.current);
                botFillTimerRef.current = null;
            }
            if (botFillFallbackRef.current) {
                clearTimeout(botFillFallbackRef.current);
                botFillFallbackRef.current = null;
            }
        };
    }, [view.page, activeBattle?.id, activeBattle?.status, user?.id]); // Depend on status too

    const handleJoinBattle = async (battleId: string) => {
        if (!user && !isSignedIn) { handleLogin(false); return; }

        const target = battles.find(b => b.id === battleId);
        if (!target) return;

        if (target.players.some(p => p?.id === user.id)) {
            setActiveBattle(target);
            setView({ page: 'BATTLE_ARENA' });
            return;
        }

        const emptyIndex = target.players.findIndex(p => p === null);
        if (emptyIndex === -1) return;

        // Each player pays the box price once to join (not per round)
        const cost = target.price;
        if (user.balance < cost) {
            setShowDeposit(true);
            return;
        }

        try {
            // Deduct balance from database
            await addTransaction(user.id, 'BET', cost, `Battle entry: ${target.roundCount} round${target.roundCount > 1 ? 's' : ''} - ${target.playerCount === 2 ? '1v1' : target.playerCount === 4 ? '2v2' : '3v3'}`);

            // Refresh user from database to get updated balance
            const updatedUser = await getUser(user.id);
            setUser(updatedUser);

            const updatedBattles = battles.map(b => {
                if (b.id === battleId) {
                    const newPlayers = [...b.players];
                    newPlayers[emptyIndex] = updatedUser;
                    const isNowFull = newPlayers.every(p => p !== null);
                    return {
                        ...b,
                        players: newPlayers,
                        status: isNowFull ? 'ACTIVE' : 'WAITING'
                    } as Battle;
                }
                return b;
            });

            // Update battle in database
            const updatedBattle = updatedBattles.find(b => b.id === battleId);
            if (updatedBattle) {
                const { error: dbError } = await supabase
                    .from('battles')
                    .update({
                        players: JSON.stringify(updatedBattle.players),
                        status: updatedBattle.status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', battleId);

                if (dbError) {
                    console.error('Error updating battle in database:', dbError);
                    // Continue anyway - battle will work in memory
                }
            }

            setBattles(updatedBattles);
            if (updatedBattle) {
                setActiveBattle(updatedBattle);
                setView({ page: 'BATTLE_ARENA' });
            }
        } catch (error) {
            console.error('❌ Error joining battle:', error);
            alert('Failed to join battle. Please try again.');
        }
    };

    const handleWatchBattle = (battle: Battle) => {
        setActiveBattle(battle);
        setView({ page: 'BATTLE_ARENA' });
    };

    const handleCreateRematch = (oldBattle: Battle) => {
        if (!user) return;

        // Find the opponent (non-user player)
        const opponent = oldBattle.players.find(p => p?.id && p.id !== user.id);
        if (!opponent) return;

        // Create new battle with same settings
        const box = INITIAL_BOXES.find(b => b.id === oldBattle.boxId);
        if (!box) return;

        const cost = box.salePrice || box.price;
        const playersArray = new Array(oldBattle.playerCount).fill(null);
        playersArray[0] = user;
        playersArray[1] = opponent; // Place opponent in second slot

        // For 1v1, activate immediately since both players are ready
        // For 2v2/3v3, fill with bots immediately
        let battleStatus: 'WAITING' | 'ACTIVE' = 'WAITING';
        let finalPlayers = playersArray;

        if (oldBattle.playerCount === 2) {
            // 1v1 - both players ready, activate immediately
            battleStatus = 'ACTIVE';
        } else {
            // 2v2 or 3v3 - fill remaining slots with bots immediately
            const botNames = [
                'AlexM', 'JordanK', 'SamT', 'ChrisR', 'TaylorW',
                'MorganL', 'CaseyJ', 'RileyB', 'AveryP', 'QuinnM',
                'DrewH', 'BlakeS', 'CameronN', 'DakotaF', 'EmeryC'
            ];

            for (let i = 2; i < oldBattle.playerCount; i++) {
                if (!finalPlayers[i]) {
                    const randomName = botNames[Math.floor(Math.random() * botNames.length)];
                    finalPlayers[i] = {
                        id: `bot_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
                        username: randomName,
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomName}`,
                        balance: 0
                    };
                }
            }

            // All slots filled, activate
            battleStatus = 'ACTIVE';
        }

        const newBattle: Battle = {
            id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            boxId: oldBattle.boxId,
            price: cost,
            playerCount: oldBattle.playerCount,
            players: finalPlayers,
            status: battleStatus,
            roundCount: oldBattle.roundCount,
            mode: oldBattle.mode,
        };

        console.log('🔄 Creating rematch battle:', newBattle.id, 'Status:', battleStatus);
        setBattles([newBattle, ...battles]);

        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
            setActiveBattle(newBattle);
            setView({ page: 'BATTLE_ARENA' });
            console.log('✅ Rematch battle activated and view set');
        }, 100);
    };

    const handleBattleClaim = async (amount: number, items?: LootItem[]) => {
        if (!user) return;

        try {
            const prizeChoice = items && items.length > 0 ? 'items' : 'cash';
            console.log(`🏆 Claiming battle prize via Secure Edge Function: ${prizeChoice}`);

            // Get Clerk session token for authentication
            const clerkToken = await getToken({ template: 'supabase' });
            console.log('🔑 Clerk Token Debug:', {
                hasToken: !!clerkToken,
                tokenStart: clerkToken ? clerkToken.substring(0, 30) + '...' : 'NULL',
                tokenLength: clerkToken?.length
            });

            if (!clerkToken) {
                throw new Error('Not authenticated with Clerk');
            }

            const { data, error } = await supabase.functions.invoke('battle-claim', {
                headers: {
                    Authorization: `Bearer ${clerkToken}`
                },
                body: {
                    battleId: activeBattle?.id || 'unknown',
                    prizeChoice,
                    amount,
                    items,
                    userId: user.id
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error || 'Failed to claim prize');

            console.log('✅ Prize claimed successfully via server');

            // Refresh user data to show new balance/inventory
            const updatedUser = await getUser(user.id);
            setUser(updatedUser);

            // Navigate back to battles
            setView({ page: 'BATTLES' });
            setActiveBattle(null);
        } catch (error) {
            console.error('❌ Error claiming battle prize:', error);
            alert('Failed to claim prize. Please try again.');
        }
    };

    const handleReskinBox = async () => {
        if (!selectedBox) return;
        setIsReskinning(true);
        const newImage = await generateBoxImage(selectedBox.name, selectedBox.description, selectedBox.color.split(' ')[1].replace('to-', ''));
        if (newImage) {
            const updatedBox = { ...selectedBox, image: newImage };
            setSelectedBox(updatedBox);
            setBoxes(prev => prev.map(b => b.id === selectedBox.id ? updatedBox : b));
        }
        setIsReskinning(false);
    };

    const handleUpdateUsername = async () => {
        if (!user || !newUsername.trim()) return;

        await updateUserState(user.id, { username: newUsername.trim() });
        const updatedUser = await getUser(user.id);
        setUser(updatedUser);
        setIsEditingName(false);
    };

    const filteredBoxes = boxes.filter(box => {
        // Hide welcome box if already claimed
        if (box.id === 'welcome_gift' && user?.freeBoxClaimed) {
            return false;
        }
        const matchesCategory = activeCategory === 'ALL' || box.category === activeCategory;
        const matchesSearch = box.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    }).sort((a, b) => {
        // Sort by price (cheapest to most expensive)
        const priceA = a.salePrice || a.price || 0;
        const priceB = b.salePrice || b.price || 0;
        return priceA - priceB;
    });

    const handleBoxClick = (box: LootBox) => {
        setSelectedBox(box);
        setView({ page: 'BOX_DETAIL' });
    };

    const CATEGORIES: { id: BoxCategory; label: string }[] = [
        { id: 'ALL', label: 'All Boxes' },
        { id: 'STREETWEAR', label: 'Streetwear' },
        { id: 'TECH', label: 'Tech & Gaming' },
        { id: 'POKEMON', label: 'Pokemon' },
        { id: 'GIFT_CARDS', label: 'Gift Cards' },
        { id: 'CRYPTO', label: 'Crypto' },
        { id: 'SPORTS', label: 'Sports' },
    ];

    return (
        <div className="min-h-screen bg-[#0b0f19] text-white font-sans selection:bg-purple-500/30">

            {view.page !== 'OPENING' && view.page !== 'BATTLE_ARENA' && <StatsHeader />}

            {/* Centered Balance Animation Overlay */}
            {balanceIncrease && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="animate-[float-up-center_2s_ease-out_forwards] flex flex-col items-center">
                        <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                            +${balanceIncrease.toFixed(2)}
                        </div>
                        <div className="text-emerald-200 font-bold text-xl mt-2 animate-pulse">
                            BALANCE UPDATED
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes float-up-center {
                    0% { opacity: 0; transform: scale(0.5) translateY(50px); }
                    20% { opacity: 1; transform: scale(1.2) translateY(0); }
                    40% { transform: scale(1); }
                    80% { opacity: 1; transform: translateY(-50px); }
                    100% { opacity: 0; transform: translateY(-100px); }
                }
            `}</style>

            <Navbar
                user={user}
                onLogin={() => setShowAuth(true)}
                onLogout={handleLogout}
                onDeposit={() => setShowDeposit(true)}
                onWithdraw={() => setShowWithdraw(true)}
                onHome={() => setView({ page: 'HOME' })}
                onProfile={() => setView({ page: 'PROFILE' })}
                onBattles={() => setView({ page: 'BATTLES' })}
                onRaces={() => setView({ page: 'RACES' })}
                onAffiliates={() => setView({ page: 'AFFILIATES' })}
                onAdmin={() => setView({ page: 'ADMIN' })}
                balanceIncrease={balanceIncrease}
                onBalanceAnimationComplete={() => setBalanceIncrease(null)}
            />



            <div className="pt-20 flex min-h-screen">

                {/* Main Content Area - Push right on XL screens to make room for sidebar */}
                <div className="flex-1 w-full xl:mr-[300px] transition-all duration-300">
                    {view.page === 'AFFILIATES' ? (
                        <AffiliatesPage user={user} onBack={() => setView({ page: 'HOME' })} />
                    ) : view.page === 'ADMIN' ? (
                        <AdminPanel />
                    ) : view.page === 'UPLOAD' ? (
                        <ImageUploader />
                    ) : view.page === 'RACES' ? (
                        <RacePage />
                    ) : view.page === 'BATTLE_ARENA' && activeBattle ? (
                        <BattleArena
                            key={activeBattle.id} // Force remount when battle ID changes (for rematches)
                            battle={activeBattle}
                            user={user}
                            onBack={() => {
                                setActiveBattle(null);
                                setView({ page: 'BATTLES' });
                            }}
                            onClaim={handleBattleClaim}
                            onCreateRematch={handleCreateRematch}
                        />
                    ) : view.page === 'BATTLES' ? (
                        <BattleLobby
                            battles={battles}
                            user={user}
                            onJoin={handleJoinBattle}
                            onCreate={initiateCreateBattle}
                            onWatch={handleWatchBattle}
                        />
                    ) : view.page === 'HOME' ? (
                        <main className="pb-12">


                            <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-8">

                                <section className="relative rounded-3xl overflow-hidden bg-[#131b2e] min-h-[400px] flex items-center border border-white/5 mb-12 group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 z-0"></div>
                                    <div className="absolute right-0 top-0 w-full md:w-2/3 h-full bg-[url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=1200&auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-[20s]"></div>

                                    <div className="relative z-10 p-12 max-w-2xl">
                                        <span className="inline-block py-1 px-3 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold tracking-widest mb-6">
                                            PROVABLY FAIR GAMING
                                        </span>
                                        <h1 className="font-display text-6xl md:text-7xl font-bold leading-tight mb-6 text-white drop-shadow-2xl">
                                            UNBOX THE <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">VIBE</span>
                                        </h1>
                                        <p className="text-slate-300 text-lg mb-8 leading-relaxed max-w-md drop-shadow-md">
                                            Open mystery boxes containing real-world items, crypto, and exclusive collectibles. Authenticated on the Bitcoin blockchain.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button onClick={() => setView({ page: 'BATTLES' })} className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-red-900/50 clip-path-slant flex items-center justify-center gap-2">
                                                ENTER PVP ARENA
                                            </button>

                                            {!user && (
                                                <button
                                                    onClick={() => handleLogin(true)} // Trigger Welcome Spin
                                                    className="bg-white hover:bg-slate-200 text-black px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-white/20 flex items-center justify-center gap-2"
                                                >
                                                    <Gift className="w-5 h-5 text-purple-600" />
                                                    CLAIM FREE BOX
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 sticky top-20 z-30 bg-[#0b0f19]/95 backdrop-blur-xl py-4 border-b border-white/5 -mx-4 px-4 md:mx-0 md:px-0">
                                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setActiveCategory(cat.id)}
                                                className={`
                                    px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all
                                    ${activeCategory === cat.id
                                                        ? 'bg-white text-black shadow-lg shadow-white/10 scale-105'
                                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}
                                `}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative w-full md:w-auto">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Search boxes..."
                                            className="bg-[#131b2e] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 w-full md:w-64 transition-all focus:bg-[#1a2336]"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {filteredBoxes.map(box => (
                                        <div
                                            key={box.id}
                                            onClick={() => handleBoxClick(box)}
                                            className="group bg-[#131b2e] rounded-xl border border-white/5 overflow-hidden cursor-pointer hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:border-white/10 transition-all duration-300 relative"
                                        >
                                            <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                                                {box.tags?.map(tag => (
                                                    <span key={tag} className={`
                                        text-[10px] font-bold px-2 py-0.5 rounded shadow-lg backdrop-blur-md
                                        ${tag === 'HOT' ? 'bg-orange-500/90 text-white' : ''}
                                        ${tag === 'NEW' ? 'bg-emerald-500/90 text-white' : ''}
                                        ${tag === 'SALE' ? 'bg-red-500/90 text-white' : ''}
                                        ${tag === 'FEATURED' ? 'bg-purple-500/90 text-white' : ''}
                                    `}>{tag}</span>
                                                ))}
                                            </div>

                                            <div className="aspect-square relative p-6 flex items-center justify-center bg-gradient-to-b from-[#1a2336] to-[#131b2e] overflow-hidden">
                                                <div className={`absolute inset-0 bg-gradient-to-br ${box.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                                                <LazyImage
                                                    src={box.image}
                                                    alt={box.name}
                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-2xl"
                                                />
                                            </div>

                                            <div className="p-4 border-t border-white/5 bg-[#131b2e] relative z-20">
                                                <h3 className="font-bold text-slate-200 truncate group-hover:text-purple-400 transition-colors">{box.name}</h3>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex flex-col">
                                                        {box.salePrice ? (
                                                            <>
                                                                <span className="text-[10px] text-slate-500 line-through">${box.price?.toFixed(2) || '0.00'}</span>
                                                                <span className="text-emerald-400 font-mono font-bold">${box.salePrice?.toFixed(2) || '0.00'}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-emerald-400 font-mono font-bold">${box.price?.toFixed(2) || '0.00'}</span>
                                                        )}
                                                    </div>
                                                    <button className="bg-white/5 hover:bg-white/20 p-2 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                        <Package className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </main>
                    ) : view.page === 'BOX_DETAIL' && selectedBox ? (
                        <div className="max-w-6xl mx-auto px-4 animate-in fade-in zoom-in-95 duration-300 pt-8 pb-16">
                            <button onClick={() => setView({ page: 'HOME' })} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 group">
                                <div className="bg-white/5 p-2 rounded-lg group-hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></div>
                                <span className="font-medium text-sm">Back to Market</span>
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4 flex flex-col gap-6">
                                    <div className="bg-[#131b2e] rounded-3xl p-8 border border-white/5 relative overflow-hidden text-center group shadow-2xl">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${selectedBox.color} opacity-10`}></div>
                                        <div className={`absolute inset-0 blur-3xl opacity-20 bg-gradient-to-br ${selectedBox.color}`}></div>

                                        <div className="relative w-64 h-64 mx-auto mb-6 z-10">
                                            <LazyImage src={selectedBox.image} alt={selectedBox.name} className="w-full h-full object-cover rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-[float_4s_ease-in-out_infinite]" />
                                        </div>

                                        <h1 className="relative z-10 font-display text-4xl font-bold mb-2 uppercase tracking-wide text-white drop-shadow-lg">{selectedBox.name}</h1>
                                        <p className="relative z-10 text-slate-400 text-sm mb-6 max-w-xs mx-auto">{selectedBox.description}</p>

                                        <div className="relative z-10 bg-[#0b0f19]/80 backdrop-blur rounded-2xl p-4 border border-white/10 mb-6 shadow-inner">
                                            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Price per box</div>
                                            <div className="text-4xl font-mono font-bold text-emerald-400 drop-shadow">
                                                ${(selectedBox.salePrice || selectedBox.price).toFixed(2)}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleOpenBox}
                                            className="relative z-20 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all transform active:scale-95 border-t border-white/10"
                                        >
                                            {user ? 'OPEN NOW' : 'SIGN IN TO OPEN'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log('🎮 TRY FOR FREE button clicked!', selectedBox);
                                                console.log('🎮 Event:', e);
                                                console.log('🎮 Calling handleDemoOpen...');
                                                handleDemoOpen().catch(err => {
                                                    console.error('❌ Unhandled error in handleDemoOpen:', err);
                                                    alert('Error: ' + (err instanceof Error ? err.message : String(err)));
                                                });
                                            }}
                                            className="relative z-20 w-full bg-[#131b2e] hover:bg-[#1c263d] active:bg-[#1a2336] text-slate-300 font-bold py-4 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!selectedBox || (selectedBox.items && selectedBox.items.length === 0)}
                                        >
                                            <Gamepad2 className="w-5 h-5" /> TRY FOR FREE
                                        </button>
                                    </div>

                                    <div className="bg-[#131b2e] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                                        <div className="flex items-center gap-2 text-white font-bold mb-4">
                                            <Shield className="w-5 h-5 text-emerald-400" /> PROVABLY FAIR
                                        </div>
                                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                                            We use the latest <span className="text-white">Bitcoin Block Hash</span> to generate a truly random number (0.00-1.00) that determines your prize. This cannot be manipulated.
                                        </p>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase">
                                                <span>0.00</span>
                                                <span>Probability Distribution</span>
                                                <span>1.00</span>
                                            </div>
                                            <div className="h-4 w-full rounded-full flex overflow-hidden">
                                                <div className="h-full bg-slate-500" style={{ width: '60%' }} title="Common (60%)"></div>
                                                <div className="h-full bg-blue-500" style={{ width: '25%' }} title="Uncommon (25%)"></div>
                                                <div className="h-full bg-purple-500" style={{ width: '10%' }} title="Rare (10%)"></div>
                                                <div className="h-full bg-yellow-500" style={{ width: '5%' }} title="Legendary (5%)"></div>
                                            </div>
                                            <div className="text-[10px] text-center text-slate-500 pt-2">
                                                Hash → Hex → Decimal → Your Prize
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-8">
                                    <div className="bg-[#131b2e]/50 backdrop-blur rounded-3xl p-6 border border-white/5 h-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="font-display text-xl font-bold flex items-center gap-2">
                                                <Package className="text-purple-500" />
                                                BOX CONTENTS
                                                <span className="text-slate-500 text-sm font-sans font-normal ml-2">({selectedBox.items.length} items)</span>
                                            </h2>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {selectedBox.items.sort((a, b) => b.odds - a.odds).map(item => (
                                                <div key={item.id} className={`
                                            group relative rounded-xl border bg-[#0b0f19] flex flex-col items-center text-center transition-all hover:bg-[#131b2e] hover:-translate-y-1 shadow-lg overflow-hidden
                                            ${RARITY_COLORS[item.rarity]}
                                        `}>
                                                    <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${RARITY_GRADIENTS[item.rarity]} z-10`}></div>
                                                    <div className="absolute top-2 right-2 text-[10px] font-bold text-white bg-black/80 border border-white/10 px-2 py-1 rounded shadow-lg z-20">{item.odds}%</div>

                                                    <div className="w-full h-56 p-2 flex items-center justify-center bg-gradient-to-b from-transparent to-black/20 relative overflow-hidden">
                                                        <LazyImage
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl"
                                                        />
                                                    </div>

                                                    <div className="w-full relative z-10 p-3 bg-[#0b0f19] border-t border-white/5 min-h-[72px] flex flex-col justify-center">
                                                        <div className="text-xs font-bold leading-snug mb-1.5 line-clamp-3 text-slate-200 group-hover:text-white px-1">{item.name}</div>
                                                        <div className="text-xs font-mono text-emerald-500 mt-auto">${item.value.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : view.page === 'OPENING' && selectedBox ? (
                        selectedBox.id === 'welcome_gift' ? (
                            <WelcomeOpeningStage
                                box={selectedBox}
                                winner={rollResult?.item || null}
                                onComplete={() => {
                                    // Welcome box auto-credits balance, just close and go home
                                    setIsOpening(false);
                                    setRollResult(null);
                                    setSelectedBox(null);
                                    setView({ page: 'HOME' });
                                }}
                                rollResult={rollResult}
                            />
                        ) : (
                            <OpeningStage
                                key={rollResult?.randomValue || Date.now()} // Force new instance per opening
                                box={selectedBox}
                                winner={rollResult?.item || null}
                                onBack={() => {
                                    setView({ page: 'BOX_DETAIL' });
                                    setIsDemoMode(false);
                                }}
                                onComplete={handleAnimationComplete}
                                isOpening={isOpening}
                                isDemoMode={isDemoMode}
                                rollResult={rollResult}
                            />
                        )
                    ) : view.page === 'PROFILE' && user ? (
                        <div className="max-w-6xl mx-auto px-4 pt-8">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="w-full md:w-1/3 bg-[#131b2e] rounded-2xl p-6 border border-white/5 sticky top-24">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative mb-4">
                                            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 rounded-full"></div>
                                            <img src={user.avatar} className="relative w-24 h-24 rounded-full border-4 border-[#0b0f19] shadow-xl" />
                                        </div>

                                        {isEditingName ? (
                                            <div className="flex flex-col items-center gap-2 mb-2 w-full">
                                                <input
                                                    type="text"
                                                    value={newUsername}
                                                    onChange={(e) => setNewUsername(e.target.value)}
                                                    className="bg-[#0b0f19] border border-purple-500 rounded-lg px-4 py-2 text-white font-bold text-center w-full focus:outline-none focus:border-purple-400 shadow-lg shadow-purple-500/20"
                                                    placeholder="Enter new username"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={handleUpdateUsername} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2">
                                                        <Check className="w-4 h-4" /> Save
                                                    </button>
                                                    <button onClick={() => setIsEditingName(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2">
                                                        <X className="w-4 h-4" /> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center mb-2">
                                                <div className="flex items-center gap-2 group mb-1">
                                                    <h2 className="text-2xl font-bold">{user.username}</h2>
                                                    <button
                                                        onClick={() => {
                                                            setNewUsername(user.username);
                                                            setIsEditingName(true);
                                                        }}
                                                        className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 p-2 rounded-lg transition-all border border-purple-500/30"
                                                        title="Change username"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-slate-400 text-sm">{clerkUser?.primaryEmailAddress?.emailAddress || 'No email'}</p>
                                            </div>
                                        )}
                                        <p className="text-slate-500 text-xs mb-6">Member since 2024</p>

                                        <div className="grid grid-cols-2 gap-4 w-full mb-6">
                                            <div className="bg-[#0b0f19] p-3 rounded-xl border border-white/5">
                                                <div className="text-xs text-slate-500 uppercase">Total Unboxed</div>
                                                <div className="font-mono font-bold text-purple-400">{user.totalWagered?.toLocaleString() || '0'} Boxes</div>
                                            </div>
                                            <div className="bg-[#0b0f19] p-3 rounded-xl border border-white/5">
                                                <div className="text-xs text-slate-500 uppercase">Total Profit</div>
                                                <div className="font-mono font-bold text-emerald-400">+${user.totalProfit?.toLocaleString() || '0'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full md:w-2/3">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold flex items-center gap-2"><Package /> Inventory</h3>
                                        {user.inventory.filter(item => !item.shippingStatus).length > 0 && (
                                            <button
                                                onClick={() => handleShipItems(user.inventory.filter(item => !item.shippingStatus))}
                                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
                                            >
                                                <Truck className="w-4 h-4" />
                                                Ship All Items
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {user.inventory.map((item, i) => {
                                            const isProcessing = item.shippingStatus === 'PROCESSING';
                                            const rarityGradient = RARITY_GRADIENTS[item.rarity];
                                            return (
                                                <div
                                                    key={i}
                                                    className={`relative group rounded-2xl overflow-hidden bg-gradient-to-br from-[#131b2e] to-[#0b0f19] border-2 ${RARITY_COLORS[item.rarity]} hover:scale-105 transition-all duration-300 ${isProcessing ? 'opacity-50 grayscale' : 'hover:shadow-2xl'}`}
                                                    style={{
                                                        boxShadow: isProcessing ? 'none' : `0 10px 40px -10px ${rarityGradient.split(' ')[0]}40`
                                                    }}
                                                >
                                                    {/* Rarity Glow Effect */}
                                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                                                        background: `radial-gradient(circle at 50% 0%, ${rarityGradient.split(' ')[0]}20, transparent 70%)`
                                                    }}></div>

                                                    {/* Ship Button */}
                                                    {!isProcessing && (
                                                        <button
                                                            onClick={() => handleShipItems([item])}
                                                            className="absolute top-3 right-3 bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-lg"
                                                            title="Ship this item"
                                                        >
                                                            <Truck className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Processing Badge */}
                                                    {isProcessing && (
                                                        <div className="absolute top-3 right-3 bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold z-10 shadow-lg">
                                                            Processing
                                                        </div>
                                                    )}

                                                    {/* Image Container */}
                                                    <div className="relative p-6 bg-gradient-to-b from-transparent to-black/20">
                                                        <LazyImage
                                                            src={item.image}
                                                            alt={item.name}
                                                            className={`w-full aspect-square object-contain ${isProcessing ? '' : 'group-hover:scale-110'} transition-transform duration-500`}
                                                        />
                                                    </div>

                                                    {/* Item Info */}
                                                    <div className="p-4 bg-black/40 backdrop-blur-sm">
                                                        <div className="text-sm font-bold text-white mb-1 truncate">{item.name}</div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-lg font-mono font-bold text-emerald-400">${item.value}</div>
                                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${RARITY_BG[item.rarity]}`}>
                                                                {item.rarity}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {user.inventory.length === 0 && (
                                            <div className="col-span-full py-16 text-center text-slate-500 border border-dashed border-white/10 rounded-xl bg-[#131b2e]/50">
                                                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <p>Your inventory is empty.</p>
                                                <button onClick={() => setView({ page: 'HOME' })} className="text-purple-400 hover:text-white mt-2 text-sm">Open some boxes!</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Live Sidebar - Hidden on small screens, fixed on right for large screens, and hidden on admin panel */}
                {view.page !== 'ADMIN' && <LiveSidebar />}

            </div>

            {/* Create Battle Modal */}
            {showCreateBattle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#131b2e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#131b2e] z-10 sticky top-0">
                            <h2 className="text-xl font-bold font-display">Create Battle</h2>
                            <button onClick={() => setShowCreateBattle(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        {/* SETTINGS SELECTOR */}
                        <div className="px-6 pt-6 pb-2">
                            {/* Team Size */}
                            <div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Team Size</div>
                                <div className="flex gap-2">
                                    {[2, 4, 6].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setBattlePlayerCount(mode as any)}
                                            className={`
                                        flex-1 py-3 rounded-xl border font-bold text-sm transition-all
                                        ${battlePlayerCount === mode
                                                    ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                                                    : 'bg-[#0b0f19] border-white/10 text-slate-400 hover:border-white/20'
                                                }
                                    `}
                                        >
                                            {mode === 2 ? '1 v 1' : mode === 4 ? '2 v 2' : '3 v 3'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {boxes.map(box => (
                                <button
                                    key={box.id}
                                    onClick={() => finalizeCreateBattle(box)}
                                    className="bg-[#0b0f19] border border-white/5 rounded-xl p-4 hover:border-purple-500 hover:bg-purple-500/5 transition-all flex flex-col items-center gap-3 group"
                                >
                                    <LazyImage src={box.image} alt={box.name} className="w-20 h-20 object-cover rounded-lg group-hover:scale-105 transition-transform" />
                                    <div className="text-center">
                                        <div className="font-bold text-sm truncate w-full">{box.name}</div>
                                        <div className="text-emerald-400 font-mono text-xs font-bold">${(box.salePrice || box.price).toFixed(2)}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {showResultModal && rollResult && selectedBox && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className={`relative bg-[#0b0f19] rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-300 border border-white/10`}>

                        <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-[100px] opacity-20 ${RARITY_BG[rollResult.item.rarity]}`}></div>
                        <div className={`absolute -bottom-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-20 ${RARITY_BG[rollResult.item.rarity]}`}></div>

                        <div className="relative z-10 p-2">
                            <div className="bg-[#131b2e]/80 backdrop-blur-xl rounded-[28px] p-6 border border-white/5 overflow-hidden">
                                <div className="flex justify-center mb-8">
                                    <div className={`
                                px-4 py-1.5 rounded-full text-xs font-extrabold tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10
                                ${RARITY_BG[rollResult.item.rarity]} text-white
                           `}>
                                        {rollResult.item.rarity} DROP
                                    </div>
                                </div>

                                <div className="relative w-64 h-64 mx-auto mb-6">
                                    <div className={`absolute inset-0 bg-gradient-to-tr ${RARITY_GRADIENTS[rollResult.item.rarity]} rounded-full blur-[60px] opacity-30 animate-pulse`}></div>
                                    <img src={rollResult.item.image} className="relative w-full h-full object-contain animate-[float_4s_ease-in-out_infinite] drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" />
                                </div>

                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-display font-bold text-white mb-2 leading-tight drop-shadow-lg">{rollResult.item.name}</h2>
                                    <div className="text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 drop-shadow-sm">
                                        ${rollResult.item.value.toFixed(2)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {!isDemoMode ? (
                                        <>
                                            <button
                                                onClick={handleSellItem}
                                                className="group relative overflow-hidden bg-[#0b0f19] hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 rounded-2xl py-4 transition-all duration-300"
                                            >
                                                <div className="flex flex-col items-center gap-1 relative z-10">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-red-400 transition-colors">Exchange For</span>
                                                    <span className="flex items-center gap-1 font-mono font-bold text-lg group-hover:text-white transition-colors">
                                                        <DollarSign className="w-4 h-4 text-emerald-500" /> {rollResult.item.value}
                                                    </span>
                                                </div>
                                            </button>

                                            <button
                                                onClick={handleKeepItem}
                                                className="group relative overflow-hidden bg-white hover:bg-slate-200 text-black rounded-2xl py-4 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                                            >
                                                <div className="flex flex-col items-center gap-1 relative z-10">
                                                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-wide">Add To Inventory</span>
                                                    <span className="flex items-center gap-2 font-bold text-lg">
                                                        Collect <Check className="w-4 h-4" />
                                                    </span>
                                                </div>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Demo Comparison Widget */}
                                            <div className="col-span-2 mb-3 p-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Demo Result</span>
                                                    <span className="text-xs font-bold text-emerald-400">If Real: +${rollResult.item.value.toFixed(2)}</span>
                                                </div>
                                                <div className="text-sm text-slate-300 leading-relaxed">
                                                    {rollResult.item.value >= selectedBox.price * 2 ? (
                                                        <span className="text-emerald-400 font-semibold">🎉 Profit! You would've won ${(rollResult.item.value - selectedBox.price).toFixed(2)} more than the box cost!</span>
                                                    ) : rollResult.item.value >= selectedBox.price ? (
                                                        <span className="text-slate-300">📦 Break-even! This item is worth the box price.</span>
                                                    ) : (
                                                        <span className="text-slate-400">💡 Try again - you might get something better!</span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    resetOpenState();
                                                    setIsDemoMode(false);
                                                    handleOpenBox();
                                                }}
                                                className="col-span-2 group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl py-4 transition-all duration-300 shadow-[0_0_30px_rgba(147,51,234,0.3)]"
                                            >
                                                <div className="flex flex-col items-center gap-1 relative z-10">
                                                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-wide">Liked what you saw?</span>
                                                    <span className="flex items-center gap-2 font-bold text-lg">
                                                        PLAY FOR REAL <Trophy className="w-4 h-4" />
                                                    </span>
                                                </div>
                                            </button>

                                            <div className="col-span-2 grid grid-cols-2 gap-3 mt-2">
                                                <button
                                                    onClick={() => {
                                                        resetOpenState();
                                                        // Keep demo mode and try again
                                                        handleDemoOpen();
                                                    }}
                                                    className="bg-[#131b2e] hover:bg-[#1c263d] border border-white/10 text-slate-300 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                    Try Again
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        resetOpenState();
                                                        setIsDemoMode(false);
                                                        setView({ page: 'HOME' });
                                                    }}
                                                    className="bg-[#131b2e] hover:bg-[#1c263d] border border-white/10 text-slate-300 font-bold py-3 rounded-xl transition-all"
                                                >
                                                    Browse Boxes
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {!isDemoMode && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                // 1. Sell current item first (this updates balance)
                                                await handleSellItem();

                                                // 2. Wait a moment for state to settle
                                                await new Promise(resolve => setTimeout(resolve, 100));

                                                // 3. Refresh user to get updated nonce from database
                                                if (user) {
                                                    const refreshedUser = await getUser(user.id);
                                                    setUser(refreshedUser);
                                                }

                                                // 4. Then spin again with fresh nonce
                                                handleOpenBox();
                                            } catch (error) {
                                                console.error('Error in spin again:', error);
                                                alert('Failed to spin again. Please try manually.');
                                            }
                                        }}
                                        className="w-full bg-[#1a1f2e] hover:bg-[#252b3d] border border-white/10 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-between px-6 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                            <span>SPIN AGAIN</span>
                                        </div>
                                        <div className="bg-[#0b0f19] px-3 py-1 rounded text-sm font-mono">
                                            ${selectedBox?.price}
                                        </div>
                                    </button>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {
                showAuth && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                        <div className="bg-[#131b2e] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/20">
                                    <Package className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Welcome to LootVibe</h2>
                                <p className="text-slate-400 mb-8">Sign in to start unboxing rare items.</p>

                                <button onClick={confirmLogin} className="w-full bg-[#24292e] hover:bg-[#2f363d] text-white font-bold py-3 rounded-xl mb-3 flex items-center justify-center gap-3 transition-colors border border-white/5">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-1.334 5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                    Continue with GitHub (Clerk)
                                </button>
                                <button onClick={confirmLogin} className="w-full bg-white hover:bg-slate-200 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-3 transition-colors">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                    Continue with Google (Clerk)
                                </button>
                                <button onClick={() => setShowAuth(false)} className="mt-6 text-sm text-slate-500 hover:text-white">Cancel</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDeposit && (
                    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <div className="bg-[#131b2e] border border-white/10 rounded-2xl w-full max-w-lg p-0 overflow-hidden shadow-2xl relative">
                                <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#131b2e] z-10">
                                    <h2 className="text-xl font-bold font-display">Deposit Funds</h2>
                                    <button onClick={() => setShowDeposit(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            setSelectedCrypto('BTC');
                                            setShowDeposit(false);
                                            setShowCryptoDeposit(true);
                                        }}
                                        className="flex flex-col items-center justify-center p-6 rounded-xl border bg-[#0b0f19] border-white/10 text-slate-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-white transition-all gap-3"
                                    >
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-slate-400"><Bitcoin className="w-6 h-6" /></div>
                                        <div className="font-bold">Bitcoin</div>
                                        <div className="text-xs text-slate-500">BTC</div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedCrypto('ETH');
                                            setShowDeposit(false);
                                            setShowCryptoDeposit(true);
                                        }}
                                        className="flex flex-col items-center justify-center p-6 rounded-xl border bg-[#0b0f19] border-white/10 text-slate-400 hover:bg-blue-500/10 hover:border-blue-500 hover:text-white transition-all gap-3"
                                    >
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-slate-400"><div className="font-bold text-lg">Ξ</div></div>
                                        <div className="font-bold">Ethereum</div>
                                        <div className="text-xs text-slate-500">ETH</div>
                                    </button>
                                </div>

                                <div className="p-6 bg-[#0b0f19] border-t border-white/5">
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                                        <div className="text-xs font-bold text-blue-400 mb-2">💡 Real Crypto Deposits</div>
                                        <div className="text-xs text-slate-400">
                                            Select a cryptocurrency above to get your unique deposit address. Funds are automatically credited after confirmations.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Provably Fair Modal */}
            {
                user && (
                    <ProvablyFairModal
                        isOpen={showProvablyFair}
                        onClose={() => setShowProvablyFair(false)}
                        user={user}
                    />
                )
            }

            {/* Shipping Modal */}
            {
                showShipping && (
                    <ShippingModal
                        items={selectedItemsToShip}
                        onClose={() => {
                            setShowShipping(false);
                            setSelectedItemsToShip([]);
                        }}
                        onSubmit={handleShipmentSubmit}
                    />
                )
            }

            {/* Crypto Deposit Modal */}
            {
                user && (
                    <CryptoDepositModal
                        isOpen={showCryptoDeposit}
                        onClose={() => setShowCryptoDeposit(false)}
                        userId={user.id}
                        currency={selectedCrypto}
                        onDepositCredited={async () => {
                            // Refresh user balance when deposit is credited
                            if (user) {
                                const updatedUser = await getUser(user.id);
                                setUser(updatedUser);
                            }
                        }}
                    />
                )
            }

            {/* Withdraw Modal */}
            {
                user && (
                    <WithdrawModal
                        isOpen={showWithdraw}
                        onClose={() => setShowWithdraw(false)}
                        user={user}
                    />
                )
            }

            {/* Provably Fair Button */}

            {/* Floating Provably Fair Button (Bottom Left) */}
            {
                user && (
                    <button
                        onClick={() => setShowProvablyFair(true)}
                        className="fixed bottom-4 left-4 z-40 bg-[#131b2e]/80 backdrop-blur border border-white/10 text-slate-400 hover:text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105"
                    >
                        <Shield className="w-4 h-4 text-emerald-500" /> PROVABLY FAIR
                    </button>
                )
            }

            {/* Footer with Legal Links */}
            <footer className="fixed bottom-4 right-4 z-30 flex gap-3 text-xs">
                <a
                    href="/terms-of-service.html"
                    target="_blank"
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                    Terms of Service
                </a>
                <span className="text-slate-600">•</span>
                <a
                    href="/privacy-policy.html"
                    target="_blank"
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                    Privacy Policy
                </a>
            </footer>

        </div >
    );
}
