const express = require('express');

function createAffiliateRoutes(supabase) {
    const router = express.Router();

    /**
     * POST /api/affiliates/generate-code
     * Generate unique affiliate code for a user
     */
    router.post('/generate-code', async (req, res) => {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID required' });
            }

            // Check if user already has a code
            const { data: existingCode } = await supabase
                .from('affiliate_codes')
                .select('code')
                .eq('user_id', userId)
                .single();

            if (existingCode) {
                return res.json({ code: existingCode.code });
            }

            // Get username for code generation
            const { data: user } = await supabase
                .from('users')
                .select('username')
                .eq('id', userId)
                .single();

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Generate unique code based on username
            // User requested lootlegend.com/r/username format, so we try to use username directly
            let code = user.username.toUpperCase().replace(/[^A-Z0-9]/g, '');

            // If username is too short or empty, fallback to random
            if (code.length < 3) {
                code = `USER${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            }

            // Ensure uniqueness
            let isUnique = false;
            let attempts = 0;
            let originalCode = code;

            while (!isUnique && attempts < 10) {
                const { data: existing } = await supabase
                    .from('affiliate_codes')
                    .select('id')
                    .eq('code', code)
                    .single();

                if (!existing) {
                    isUnique = true;
                } else {
                    // If taken, append random suffix
                    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                    code = `${originalCode.substring(0, 8)}${suffix}`;
                    attempts++;
                }
            }

            // Create affiliate code
            const { error } = await supabase
                .from('affiliate_codes')
                .insert({
                    id: `aff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    user_id: userId,
                    code
                });

            if (error) throw error;

            // Update user table with affiliate code
            await supabase
                .from('users')
                .update({ affiliate_code: code })
                .eq('id', userId);

            res.json({ code });

        } catch (error) {
            console.error('Generate affiliate code error:', error);
            res.status(500).json({ error: 'Failed to generate affiliate code' });
        }
    });

    /**
     * GET /api/affiliates/stats/:userId
     * Get affiliate statistics for a user
     */
    router.get('/stats/:userId', async (req, res) => {
        try {
            const { userId } = req.params;

            // Get affiliate code
            const { data: affiliateCode } = await supabase
                .from('affiliate_codes')
                .select('code')
                .eq('user_id', userId)
                .single();

            // Get referrals count and stats
            const { data: referrals, count: referralCount } = await supabase
                .from('affiliate_referrals')
                .select('*, users!affiliate_referrals_referred_user_id_fkey(username, avatar)', { count: 'exact' })
                .eq('referrer_user_id', userId);

            // Calculate total wager volume from all referrals
            const totalWagerVolume = referrals?.reduce((sum, ref) => sum + parseFloat(ref.total_wagers || 0), 0) || 0;

            // Get current tier based on wager volume
            const { data: tiers } = await supabase
                .from('affiliate_tiers')
                .select('*')
                .order('min_wager_volume', { ascending: false });

            let currentTier = tiers?.[tiers.length - 1]; // Default to lowest tier
            for (const tier of tiers || []) {
                if (totalWagerVolume >= tier.min_wager_volume) {
                    currentTier = tier;
                    break;
                }
            }

            // Get unclaimed earnings
            const { data: unclaimedEarnings } = await supabase
                .from('affiliate_earnings')
                .select('amount')
                .eq('user_id', userId)
                .eq('claimed', false);

            const totalUnclaimed = unclaimedEarnings?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;

            // Get total claimed earnings
            const { data: claimedEarnings } = await supabase
                .from('affiliate_earnings')
                .select('amount')
                .eq('user_id', userId)
                .eq('claimed', true);

            const totalClaimed = claimedEarnings?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;

            // Get earnings breakdown
            const { data: allEarnings } = await supabase
                .from('affiliate_earnings')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            res.json({
                code: affiliateCode?.code || null,
                referralCount: referralCount || 0,
                totalWagerVolume,
                currentTier: currentTier ? {
                    name: currentTier.name,
                    rate: currentTier.commission_rate,
                    color: currentTier.color,
                    minWagerVolume: currentTier.min_wager_volume
                } : null,
                unclaimedEarnings: totalUnclaimed,
                totalEarnings: totalClaimed + totalUnclaimed,
                claimedEarnings: totalClaimed,
                recentEarnings: allEarnings || [],
                referrals: referrals || []
            });

        } catch (error) {
            console.error('Get affiliate stats error:', error);
            res.status(500).json({ error: 'Failed to get affiliate stats' });
        }
    });

    /**
     * POST /api/affiliates/claim-earnings
     * Claim accumulated affiliate earnings
     */
    router.post('/claim-earnings', async (req, res) => {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID required' });
            }

            // Get unclaimed earnings
            const { data: unclaimedEarnings } = await supabase
                .from('affiliate_earnings')
                .select('*')
                .eq('user_id', userId)
                .eq('claimed', false);

            if (!unclaimedEarnings || unclaimedEarnings.length === 0) {
                return res.status(400).json({ error: 'No earnings to claim' });
            }

            const totalAmount = unclaimedEarnings.reduce((sum, e) => sum + parseFloat(e.amount), 0);

            // Get user's current balance
            const { data: user } = await supabase
                .from('users')
                .select('balance')
                .eq('id', userId)
                .single();

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Update user balance
            const newBalance = parseFloat(user.balance) + totalAmount;
            const { error: balanceError } = await supabase
                .from('users')
                .update({ balance: newBalance })
                .eq('id', userId);

            if (balanceError) throw balanceError;

            // Mark earnings as claimed
            const earningIds = unclaimedEarnings.map(e => e.id);
            const { error: claimError } = await supabase
                .from('affiliate_earnings')
                .update({
                    claimed: true,
                    claimed_at: new Date().toISOString()
                })
                .in('id', earningIds);

            if (claimError) throw claimError;

            // Create transaction record
            await supabase
                .from('transactions')
                .insert({
                    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    user_id: userId,
                    type: 'WIN',
                    amount: totalAmount,
                    description: `Affiliate earnings claimed`,
                    timestamp: Date.now()
                });

            res.json({
                success: true,
                amount: totalAmount,
                newBalance
            });

        } catch (error) {
            console.error('Claim earnings error:', error);
            res.status(500).json({ error: 'Failed to claim earnings' });
        }
    });

    /**
     * POST /api/affiliates/track-referral
     * Track a new user signup via referral code
     */
    router.post('/track-referral', async (req, res) => {
        try {
            const { code, newUserId } = req.body;

            if (!code || !newUserId) {
                return res.status(400).json({ error: 'Code and new user ID required' });
            }

            // Get referrer from code
            const { data: affiliateCode } = await supabase
                .from('affiliate_codes')
                .select('user_id')
                .eq('code', code.toUpperCase())
                .single();

            if (!affiliateCode) {
                return res.status(404).json({ error: 'Invalid referral code' });
            }

            // Check if user is trying to refer themselves
            if (affiliateCode.user_id === newUserId) {
                return res.status(400).json({ error: 'Cannot refer yourself' });
            }

            // Check if user was already referred
            const { data: existingReferral } = await supabase
                .from('affiliate_referrals')
                .select('id')
                .eq('referred_user_id', newUserId)
                .single();

            if (existingReferral) {
                return res.status(400).json({ error: 'User already referred' });
            }

            // Create referral record
            const { error } = await supabase
                .from('affiliate_referrals')
                .insert({
                    id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    referrer_user_id: affiliateCode.user_id,
                    referred_user_id: newUserId
                });

            if (error) throw error;

            // Update referred user's record
            await supabase
                .from('users')
                .update({ referred_by: affiliateCode.user_id })
                .eq('id', newUserId);

            res.json({ success: true });

        } catch (error) {
            console.error('Track referral error:', error);
            res.status(500).json({ error: 'Failed to track referral' });
        }
    });

    /**
     * POST /api/affiliates/track-deposit
     * Track deposit and award $5 bonus if >= $25
     */
    router.post('/track-deposit', async (req, res) => {
        try {
            const { userId, amount } = req.body;

            if (!userId || !amount) {
                return res.status(400).json({ error: 'User ID and amount required' });
            }

            // Check if this user was referred
            const { data: referral } = await supabase
                .from('affiliate_referrals')
                .select('*')
                .eq('referred_user_id', userId)
                .single();

            if (!referral) {
                return res.json({ success: true, message: 'No referral to track' });
            }

            // Check if deposit bonus already paid
            if (referral.deposit_bonus_paid) {
                return res.json({ success: true, message: 'Deposit bonus already paid' });
            }

            // Update referral with first deposit info
            await supabase
                .from('affiliate_referrals')
                .update({
                    first_deposit_amount: amount,
                    first_deposit_at: new Date().toISOString()
                })
                .eq('id', referral.id);

            // If deposit >= $25, award $5 bonus to referrer
            if (amount >= 25) {
                const bonusAmount = 5.00;

                // Create earning record
                await supabase
                    .from('affiliate_earnings')
                    .insert({
                        id: `earn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        user_id: referral.referrer_user_id,
                        referral_id: referral.id,
                        type: 'DEPOSIT_BONUS',
                        amount: bonusAmount
                    });

                // Mark bonus as paid
                await supabase
                    .from('affiliate_referrals')
                    .update({
                        deposit_bonus_paid: true,
                        deposit_bonus_amount: bonusAmount
                    })
                    .eq('id', referral.id);

                return res.json({
                    success: true,
                    bonusAwarded: true,
                    amount: bonusAmount
                });
            }

            res.json({ success: true, bonusAwarded: false });

        } catch (error) {
            console.error('Track deposit error:', error);
            res.status(500).json({ error: 'Failed to track deposit' });
        }
    });

    /**
     * POST /api/affiliates/track-wager
     * Track wager and calculate commission
     */
    router.post('/track-wager', async (req, res) => {
        try {
            const { userId, wagerAmount } = req.body;

            if (!userId || !wagerAmount) {
                return res.status(400).json({ error: 'User ID and wager amount required' });
            }

            // Check if this user was referred
            const { data: referral } = await supabase
                .from('affiliate_referrals')
                .select('*')
                .eq('referred_user_id', userId)
                .single();

            if (!referral) {
                return res.json({ success: true, message: 'No referral to track' });
            }

            // Update total wagers for this referral
            const newTotalWagers = parseFloat(referral.total_wagers || 0) + parseFloat(wagerAmount);
            await supabase
                .from('affiliate_referrals')
                .update({ total_wagers: newTotalWagers })
                .eq('id', referral.id);

            // Get all referrals for this referrer to calculate total volume
            const { data: allReferrals } = await supabase
                .from('affiliate_referrals')
                .select('total_wagers')
                .eq('referrer_user_id', referral.referrer_user_id);

            const totalVolume = allReferrals?.reduce((sum, ref) => sum + parseFloat(ref.total_wagers || 0), 0) || 0;

            // Get current tier based on total volume
            const { data: tiers } = await supabase
                .from('affiliate_tiers')
                .select('*')
                .order('min_wager_volume', { ascending: false });

            let currentTier = tiers?.[tiers.length - 1];
            for (const tier of tiers || []) {
                if (totalVolume >= tier.min_wager_volume) {
                    currentTier = tier;
                    break;
                }
            }

            if (!currentTier) {
                return res.json({ success: true, message: 'No tier found' });
            }

            // Calculate commission
            const commissionRate = parseFloat(currentTier.commission_rate);
            const commissionAmount = (parseFloat(wagerAmount) * commissionRate) / 100;

            // Create earning record
            await supabase
                .from('affiliate_earnings')
                .insert({
                    id: `earn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    user_id: referral.referrer_user_id,
                    referral_id: referral.id,
                    type: 'WAGER_COMMISSION',
                    amount: commissionAmount,
                    commission_rate: commissionRate,
                    wager_amount: wagerAmount
                });

            res.json({
                success: true,
                commission: commissionAmount,
                rate: commissionRate,
                tier: currentTier.name
            });

        } catch (error) {
            console.error('Track wager error:', error);
            res.status(500).json({ error: 'Failed to track wager' });
        }
    });

    /**
     * GET /api/affiliates/tiers
     * Get all affiliate tiers
     */
    router.get('/tiers', async (req, res) => {
        try {
            const { data: tiers, error } = await supabase
                .from('affiliate_tiers')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            res.json({ tiers: tiers || [] });

        } catch (error) {
            console.error('Get tiers error:', error);
            res.status(500).json({ error: 'Failed to get tiers' });
        }
    });

    return router;
}

module.exports = createAffiliateRoutes;
