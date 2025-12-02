-- Fix policies for battles table
DROP POLICY IF EXISTS "Users can update battles they're in" ON public.battles;
CREATE POLICY "Users can update battles they're in"
    ON public.battles
    FOR UPDATE
    USING (
        (auth.jwt() ->> 'sub') = ANY(
            SELECT jsonb_array_elements_text(players::jsonb -> 'id')
        )
    );

-- Fix policies for battle_results table
DROP POLICY IF EXISTS "Users can read their own results" ON public.battle_results;
CREATE POLICY "Users can read their own results"
    ON public.battle_results
    FOR SELECT
    USING ( (auth.jwt() ->> 'sub') = winner_id );

-- Ensure service role policies exist (idempotent)
DROP POLICY IF EXISTS "Service role has full access to battles" ON public.battles;
CREATE POLICY "Service role has full access to battles" 
    ON public.battles FOR ALL 
    USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role has full access to battle_results" ON public.battle_results;
CREATE POLICY "Service role has full access to battle_results" 
    ON public.battle_results FOR ALL 
    USING (auth.role() = 'service_role');
