-- ============================================
-- MIGRATION 1: Add email column to users
-- ============================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMENT ON COLUMN public.users.email IS 'User email from Clerk authentication';

-- ============================================
-- MIGRATION 2: Fix boxes RLS for anonymous access
-- ============================================
DROP POLICY IF EXISTS "Anyone can view boxes" ON public.boxes;
DROP POLICY IF EXISTS "Anyone can read active boxes" ON public.boxes;

CREATE POLICY "Anyone can view boxes"
ON public.boxes FOR SELECT
USING (true);

GRANT SELECT ON public.boxes TO anon;
GRANT SELECT ON public.boxes TO authenticated;

ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;
