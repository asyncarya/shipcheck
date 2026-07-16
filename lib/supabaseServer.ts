import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseJSClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { supabaseUrl, supabaseAnonKey } from './supabase';

export const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Admin client for server-side background runners (bypasses RLS)
export function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createSupabaseJSClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Server Component / API Route Supabase instance
export async function createServer() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
