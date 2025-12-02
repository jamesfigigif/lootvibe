-- Create battles table to store battle information
CREATE TABLE IF NOT EXISTS public.battles (
    id TEXT PRIMARY KEY,
    box_id TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    player_count INTEGER NOT NULL CHECK (player_count IN (2, 4, 6)),
    round_count INTEGER NOT NULL DEFAULT 1,
    mode TEXT CHECK (mode IN ('STANDARD', 'CRAZY')) DEFAULT 'STANDARD',
    status TEXT NOT NULL CHECK (status IN ('WAITING', 'ACTIVE', 'FINISHED')) DEFAULT 'WAITING',
    players JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_battles_status ON public.battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_created_at ON public.battles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battles_box_id ON public.battles(box_id);

-- Enable RLS
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

-- Allow service role (Edge Functions) full access
CREATE POLICY "Service role has full access"
    ON public.battles
    FOR ALL
    USING (auth.role() = 'service_role');

-- Allow anonymous users to read battles (for lobby)
CREATE POLICY "Anyone can read battles"
    ON public.battles
    FOR SELECT
    USING (true);

-- Allow authenticated users to update battles they're in (for joining)
CREATE POLICY "Users can update battles they're in"
    ON public.battles
    FOR UPDATE
    USING (
        auth.uid()::text = ANY(
            SELECT jsonb_array_elements_text(players::jsonb -> 'id')
        )
    );

