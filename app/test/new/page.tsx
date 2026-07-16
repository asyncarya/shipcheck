import React from 'react';
import { hasSupabase } from '@/lib/supabase';
import { createServer } from '@/lib/supabaseServer';
import { runStore } from '@/lib/runStore';
import WorkspaceDashboard from '@/components/WorkspaceDashboard';

export default async function NewTestPage() {
  const hasSupabaseKey = hasSupabase();
  let userEmail: string | null = null;
  let userId: string | undefined = undefined;

  if (hasSupabaseKey) {
    try {
      const supabase = await createServer();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userEmail = user.email || null;
          userId = user.id;
        }
      }
    } catch (err) {
      console.error('[NewTestPage] Failed to fetch session:', err);
    }
  }

  // Fetch test runs history
  const runs = await runStore.getAllRuns(userId);

  return (
    <WorkspaceDashboard 
      initialRuns={runs} 
      userEmail={userEmail} 
      hasSupabaseKey={hasSupabaseKey} 
    />
  );
}
