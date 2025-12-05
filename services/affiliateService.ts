import { supabase } from './supabaseClient';

export interface AffiliateStats {
    code: string | null;
    referralCount: number;
    totalWagerVolume: number;
    currentTier: {
        name: string;
        rate: number;
        color: string;
        minWagerVolume: number;
    } | null;
    unclaimedEarnings: number;
    totalEarnings: number;
    claimedEarnings: number;
    recentEarnings: any[];
    referrals: any[];
}

/**
 * Track a new user signup via referral code
 */
export async function trackReferral(code: string, newUserId: string): Promise<boolean> {
    try {
        console.log('📊 Tracking referral:', code, 'for user:', newUserId);

        // 1. Find the affiliate code in database
        const { data: affiliateCode, error: codeError } = await supabase
            .from('affiliate_codes')
            .select('user_id')
            .eq('code', code)
            .single();

        if (codeError || !affiliateCode) {
            console.error('❌ Affiliate code not found:', code);
            return false;
        }

        // Don't allow self-referral
        if (affiliateCode.user_id === newUserId) {
            console.warn('⚠️ User tried to refer themselves');
            return false;
        }

        console.log('✅ Found affiliate code for user:', affiliateCode.user_id);

        // 2. Check if referral already exists (prevent duplicates)
        const { data: existingReferral } = await supabase
            .from('affiliate_referrals')
            .select('id')
            .eq('referred_user_id', newUserId)
            .single();

        if (existingReferral) {
            console.warn('⚠️ User already has a referrer');
            return false;
        }

        // 3. Create referral record
        const { error: referralError } = await supabase
            .from('affiliate_referrals')
            .insert({
                id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                referrer_user_id: affiliateCode.user_id,
                referred_user_id: newUserId,
                total_wagers: 0,
                created_at: new Date().toISOString()
            });

        if (referralError) {
            console.error('❌ Failed to create referral:', referralError);
            return false;
        }

        console.log('✅ Referral tracked successfully');
        return true;
    } catch (error) {
        console.error('❌ Track referral error:', error);
        return false;
    }
}

/**
 * Track deposit and award bonus if applicable
 */
export async function trackDeposit(userId: string, amount: number): Promise<void> {
    try {
        console.log('💰 Tracking deposit:', userId, amount);

        // Check if user was referred
        const { data: referral } = await supabase
            .from('affiliate_referrals')
            .select('referrer_user_id')
            .eq('referred_user_id', userId)
            .single();

        if (!referral) {
            console.log('No referrer found for deposit tracking');
            return;
        }

        // Award 5% deposit bonus to referred user
        const bonus = amount * 0.05;

        const { error: updateError } = await supabase
            .from('users')
            .update({
                balance: supabase.rpc('increment_balance', { user_id: userId, amount: bonus })
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Failed to award deposit bonus:', updateError);
        } else {
            console.log(`✅ Awarded ${bonus} deposit bonus to user ${userId}`);
        }
    } catch (error) {
        console.error('Track deposit error:', error);
    }
}

/**
 * Track wager and calculate commission
 */
export async function trackWager(userId: string, wagerAmount: number): Promise<void> {
    try {
        console.log('🎲 Tracking wager:', userId, wagerAmount);

        // Check if user was referred
        const { data: referral } = await supabase
            .from('affiliate_referrals')
            .select('referrer_user_id, total_wagers')
            .eq('referred_user_id', userId)
            .single();

        if (!referral) {
            return;
        }

        // Update total wagers
        const newTotalWagers = parseFloat(referral.total_wagers || '0') + wagerAmount;

        await supabase
            .from('affiliate_referrals')
            .update({ total_wagers: newTotalWagers })
            .eq('referred_user_id', userId);

        // Calculate commission based on referrer's tier
        const { data: tierData } = await supabase
            .from('affiliate_tiers')
            .select('commission_rate')
            .order('min_wager_volume', { ascending: false });

        // Get all referrals for referrer to calculate total volume
        const { data: allReferrals } = await supabase
            .from('affiliate_referrals')
            .select('total_wagers')
            .eq('referrer_user_id', referral.referrer_user_id);

        const totalVolume = (allReferrals || []).reduce((sum, r) =>
            sum + parseFloat(r.total_wagers || '0'), 0
        );

        // Find applicable tier
        const tier = (tierData || []).find(t =>
            totalVolume >= parseFloat(t.min_wager_volume || '0')
        ) || tierData?.[tierData.length - 1];

        if (!tier) return;

        const commissionRate = parseFloat(tier.commission_rate) / 100;
        const commission = wagerAmount * commissionRate;

        // Create earnings record
        await supabase
            .from('affiliate_earnings')
            .insert({
                id: `earn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                user_id: referral.referrer_user_id,
                referred_user_id: userId,
                wager_amount: wagerAmount,
                commission_rate: tier.commission_rate,
                amount: commission,
                claimed: false,
                created_at: new Date().toISOString()
            });

        console.log(`✅ Tracked commission: ${commission} for referrer ${referral.referrer_user_id}`);
    } catch (error) {
        console.error('Track wager error:', error);
    }
}

/**
 * Get all affiliate tiers
 */
export async function getAffiliateTiers(): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('affiliate_tiers')
            .select('*')
            .order('min_wager_volume', { ascending: true });

        if (error) {
            console.error('Failed to get tiers:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Get tiers error:', error);
        return [];
    }
}
