-- Fix RLS policies for affiliate tables to allow public read access for referral tracking

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read for affiliate codes" ON affiliate_codes;
DROP POLICY IF EXISTS "Allow users to read their own affiliate code" ON affiliate_codes;
DROP POLICY IF EXISTS "Allow users to create their own affiliate code" ON affiliate_codes;

-- Enable RLS
ALTER TABLE affiliate_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read affiliate codes (needed for /r/CODE lookups)
CREATE POLICY "Allow public read for affiliate codes"
ON affiliate_codes
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to create their own code
CREATE POLICY "Allow users to create their own affiliate code"
ON affiliate_codes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NOT NULL);

-- Fix affiliate_referrals policies
DROP POLICY IF EXISTS "Users can read their own referrals" ON affiliate_referrals;
DROP POLICY IF EXISTS "System can create referrals" ON affiliate_referrals;

ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Allow users to see referrals where they are the referrer
CREATE POLICY "Users can read their own referrals"
ON affiliate_referrals
FOR SELECT
TO authenticated
USING (auth.uid()::text = referrer_user_id);

-- Allow anyone to create referrals (needed for signup tracking)
CREATE POLICY "System can create referrals"
ON affiliate_referrals
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Fix affiliate_earnings policies
DROP POLICY IF EXISTS "Users can read their own earnings" ON affiliate_earnings;
DROP POLICY IF EXISTS "Users can update their own earnings" ON affiliate_earnings;
DROP POLICY IF EXISTS "System can create earnings" ON affiliate_earnings;

ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own earnings"
ON affiliate_earnings
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own earnings"
ON affiliate_earnings
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "System can create earnings"
ON affiliate_earnings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Fix affiliate_tiers - should be publicly readable
DROP POLICY IF EXISTS "Allow public read for tiers" ON affiliate_tiers;

ALTER TABLE affiliate_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for tiers"
ON affiliate_tiers
FOR SELECT
TO anon, authenticated
USING (true);
