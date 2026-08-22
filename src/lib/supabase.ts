import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'placeholder-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window === 'undefined') {
    console.warn('Missing Supabase environment variables. Using placeholders.');
  }
}

// Client-side Supabase client (using anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (using service role key, bypassing RLS)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
