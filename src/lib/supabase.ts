import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
    throw new Error('VITE_SUPABASE_URL is not set in environment variables');
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    throw new Error('VITE_SUPABASE_ANON_KEY is not set in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
