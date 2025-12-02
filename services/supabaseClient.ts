import { createClient } from '@supabase/supabase-js';

// Extract credentials from connection string
// postgresql://postgres:[PASSWORD]@db.cbjdasfnwzizfphnwxfd.supabase.co:5432/postgres
const SUPABASE_URL = 'https://hpflcuyxmwzrknxjgavd.supabase.co';
// @ts-ignore - Vite env
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

// Warn if no anon key is set
if (!SUPABASE_ANON_KEY) {
    console.warn('⚠️  VITE_SUPABASE_ANON_KEY not set. Database features will not work. Add your Supabase anon key to .env.local');
}

// For development, we'll use the service role key if available
// In production, you should use the anon key and implement Row Level Security (RLS)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || 'dummy-key-for-development');

// Helper to check connection
export const testConnection = async () => {
    if (!SUPABASE_ANON_KEY) {
        console.warn('⚠️  Skipping Supabase connection test - no anon key configured');
        return false;
    }

    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) throw error;
        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
    }
};

/**
 * Sets the Supabase auth session using a Clerk token.
 * This allows RLS policies to work correctly by setting auth.uid()
 */
export const setClerkSession = async (token: string) => {
    if (!token) {
        // Clear session if no token
        await supabase.auth.signOut();
        return;
    }

    try {
        // Set the session with the Clerk token
        const { error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: token,
        });

        if (error) throw error;
    } catch (error: any) {
        // If setSession fails (e.g. because sub is not a UUID), 
        // we manually set the Authorization header for future requests.
        // This bypasses the Auth API strict validation but allows RLS to work.
        // console.warn('⚠️ setSession failed, falling back to manual header:', error.message);

        // @ts-ignore - Accessing internal property to force header
        supabase.rest.headers['Authorization'] = `Bearer ${token}`;
        // @ts-ignore - Force global header update for all future requests
        supabase.headers['Authorization'] = `Bearer ${token}`;

        // Also set it for the realtime client if needed
        // @ts-ignore
        if (supabase.realtime) {
            supabase.realtime.setAuth(token);
        }
    }
};
