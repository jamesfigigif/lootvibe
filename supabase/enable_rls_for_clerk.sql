-- RE-ENABLE RLS for Clerk-based authentication
-- This works because Clerk's JWT template includes the 'sub' claim (user ID)
-- and we're using auth.jwt() to extract it

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" 
ON public.users FOR SELECT 
USING (
  (auth.jwt() ->> 'sub') = id
);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (
  (auth.jwt() ->> 'sub') = id
);

-- Users can update their own non-sensitive data
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (
  (auth.jwt() ->> 'sub') = id
);

-- Enable RLS on inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own inventory" 
ON public.inventory_items FOR SELECT 
USING (
  (auth.jwt() ->> 'sub') = user_id
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" 
ON public.transactions FOR SELECT 
USING (
  (auth.jwt() ->> 'sub') = user_id
);

-- Enable RLS on shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own shipments" 
ON public.shipments FOR SELECT 
USING (
  (auth.jwt() ->> 'sub') = user_id
);

-- NOTE: This assumes you're using the Clerk JWT template named 'supabase'
-- and calling clerk.session.getToken({ template: 'supabase' }) in your app
