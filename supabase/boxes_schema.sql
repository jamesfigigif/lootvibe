-- Create box_openings table for audit trail and provably fair verification
CREATE TABLE IF NOT EXISTS public.box_openings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL, -- Storing Clerk User ID (text), not Supabase UUID
    box_id TEXT NOT NULL, -- references boxes(id) but loose coupling allowed
    item_won JSONB NOT NULL, -- Store full item data at time of winning
    box_price DECIMAL(10, 2) NOT NULL,
    item_value DECIMAL(10, 2) NOT NULL,
    profit_loss DECIMAL(10, 2) NOT NULL,
    client_seed TEXT NOT NULL,
    server_seed TEXT NOT NULL,
    nonce INTEGER NOT NULL,
    random_value DECIMAL(20, 18) NOT NULL,
    outcome TEXT NOT NULL DEFAULT 'KEPT', -- KEPT, SOLD, COLLECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_box_openings_user_id ON public.box_openings(user_id);
CREATE INDEX IF NOT EXISTS idx_box_openings_created_at ON public.box_openings(created_at DESC);

-- Enable RLS
ALTER TABLE public.box_openings ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own openings
-- Drop policy if exists to avoid error on rerun
DROP POLICY IF EXISTS "Users can view their own box openings" ON public.box_openings;
CREATE POLICY "Users can view their own box openings" 
ON public.box_openings FOR SELECT 
USING (auth.uid()::text = user_id);

-- Service role can do anything (functions use this)
-- No insert/update policy needed for anon/authenticated as functions handle writes via service role
