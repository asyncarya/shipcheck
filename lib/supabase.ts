import { createBrowserClient } from '@supabase/ssr';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function hasSupabase(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Client component browser Supabase instance
export function createClient() {
  if (!hasSupabase()) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
