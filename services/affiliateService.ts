const API_BASE = 'http://localhost:3001';

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
 * Generate affiliate code for a user
 */
export async function generateAffiliateCode(userId: string): Promise<string> {
    try {
        const response = await fetch(`${API_BASE}/api/affiliates/generate-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            throw new Error('Failed to generate affiliate code');
        }

        const data = await response.json();
        return data.code;
    } catch (error) {
        console.error('Generate affiliate code error:', error);
        throw error;
    }
}

/**
 * Get affiliate statistics for a user
 */
export async function getAffiliateStats(userId: string): Promise<AffiliateStats> {
    try {
        const response = await fetch(`${API_BASE}/api/affiliates/stats/${userId}`);

        if (!response.ok) {
            throw new Error('Failed to get affiliate stats');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Get affiliate stats error:', error);
        throw error;
    }
}

/**
 * Claim accumulated affiliate earnings
 */
export async function claimAffiliateEarnings(userId: string): Promise<{ amount: number; newBalance: number }> {
    try {
        const response = await fetch(`${API_BASE}/api/affiliates/claim-earnings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to claim earnings');
        }

        const data = await response.json();
        return { amount: data.amount, newBalance: data.newBalance };
    } catch (error) {
        console.error('Claim earnings error:', error);
        throw error;
    }
}

/**
 * Track a new user signup via referral code
 */
export async function trackReferral(code: string, newUserId: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/api/affiliates/track-referral`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, newUserId })
        });

        if (!response.ok) {
            console.error('Failed to track referral');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Track referral error:', error);
        return false;
    }
}

/**
 * Track deposit and award bonus if applicable
 */
export async function trackDeposit(userId: string, amount: number): Promise<void> {
    try {
        await fetch(`${API_BASE}/api/affiliates/track-deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount })
        });
    } catch (error) {
        console.error('Track deposit error:', error);
    }
}

/**
 * Track wager and calculate commission
 */
export async function trackWager(userId: string, wagerAmount: number): Promise<void> {
    try {
        await fetch(`${API_BASE}/api/affiliates/track-wager`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, wagerAmount })
        });
    } catch (error) {
        console.error('Track wager error:', error);
    }
}

/**
 * Get all affiliate tiers
 */
export async function getAffiliateTiers(): Promise<any[]> {
    try {
        const response = await fetch(`${API_BASE}/api/affiliates/tiers`);

        if (!response.ok) {
            throw new Error('Failed to get tiers');
        }

        const data = await response.json();
        return data.tiers;
    } catch (error) {
        console.error('Get tiers error:', error);
        return [];
    }
}
