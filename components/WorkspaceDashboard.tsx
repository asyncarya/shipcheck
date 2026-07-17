'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { TestRun } from '@/lib/schemas';
import TestSetupForm from './TestSetupForm';
import ThemeToggle from './ThemeToggle';
import { 
  Play, 
  History, 
  LogOut, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  ExternalLink
} from 'lucide-react';

interface WorkspaceDashboardProps {
  initialRuns: TestRun[];
  userEmail: string | null;
  hasSupabaseKey: boolean;
}

export default function WorkspaceDashboard({
  initialRuns,
  userEmail,
  hasSupabaseKey,
}: WorkspaceDashboardProps) {
  const router = useRouter();
  const [runs, setRuns] = useState<TestRun[]>(initialRuns);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const ITEMS_PER_PAGE = 5;

  const totalPages = Math.max(1, Math.ceil(runs.length / ITEMS_PER_PAGE));
  const paginatedRuns = runs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSignOut = async () => {
    setLoading(true);
    const client = createClient();
    if (client) {
      await client.auth.signOut();
      router.push('/auth');
    }
    setLoading(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-bg-app text-text-primary flex flex-col md:flex-row selection:bg-accent-primary/10 selection:text-accent-primary">
      {/* Sidebar Panel */}
      <aside className="w-full md:w-80 bg-bg-card/45 border-b md:border-b-0 md:border-r border-border-subtle flex flex-col justify-between flex-shrink-0 z-10">
        
        {/* Top sidebar wrapper */}
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Logo Brand Header */}
          <div className="px-6 py-5.5 border-b border-border-subtle flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="ShipCheck Logo" className="w-8 h-8 rounded-lg object-cover bg-accent-glow border border-border-subtle" />
              <span className="font-bold text-base tracking-tight font-serif-anthropic text-text-primary">ShipCheck</span>
            </Link>
          </div>

          {/* Test Runs History title */}
          <div className="px-6 py-4 flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider bg-bg-card/20 border-b border-border-subtle">
            <History size={12} className="text-accent-primary" />
            <span>Test History</span>
            <span className="text-[10px] bg-bg-app text-text-secondary border border-border-subtle px-2 py-0.5 rounded-full ml-auto font-mono">
              {runs.length}
            </span>
          </div>

          {/* Runs history scrollable list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/50 max-h-[300px] md:max-h-none">
            {runs.length === 0 ? (
              <div className="px-6 py-8 text-center space-y-2">
                <Clock size={20} className="mx-auto text-text-secondary/50" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  No execution logs found. Create your first test plan to record history.
                </p>
              </div>
            ) : (
              paginatedRuns.map((run) => {
                let statusColor = 'bg-blue-500';
                if (run.status === 'passed') {
                  statusColor = 'bg-emerald-500';
                } else if (run.status === 'failed') {
                  statusColor = 'bg-red-500';
                } else if (run.status === 'timed_out' || run.status === 'error') {
                  statusColor = 'bg-amber-500';
                }

                return (
                  <Link
                    key={run.id}
                    href={`/test/${run.id}`}
                    className="group px-6 py-3.5 block hover:bg-bg-app/40 hover:border-l-2 hover:border-accent-primary border-l-2 border-transparent transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-text-secondary/60 font-mono">#{run.id.slice(-6)}</span>
                      <span className="text-[10px] text-text-secondary/80 group-hover:text-accent-primary transition flex items-center gap-1">
                        <span>Details</span>
                        <ExternalLink size={8} />
                      </span>
                    </div>
                    
                    <p className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition truncate mt-1">
                      {run.task}
                    </p>
                    <p className="text-[10px] text-text-secondary truncate mt-0.5">
                      {run.url}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                      <span className="text-[9px] uppercase font-bold text-text-secondary">
                        {run.status === 'created' ? 'queued' : run.status}
                      </span>
                      <span className="text-[9px] text-text-secondary/60 font-mono ml-auto">
                        {new Date(run.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* History Pagination Control */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-border-subtle flex items-center justify-between bg-bg-card/20 select-none">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-app text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:hover:text-text-secondary transition text-[10px] font-bold uppercase active:scale-95 cursor-pointer disabled:active:scale-100 shadow-xs"
              >
                Prev
              </button>
              <span className="text-[10px] font-semibold text-text-secondary font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-app text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:hover:text-text-secondary transition text-[10px] font-bold uppercase active:scale-95 cursor-pointer disabled:active:scale-100 shadow-xs"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col justify-between relative overflow-hidden">
        
        {/* Top-Right Header Actions (ThemeToggle after Profile) */}
        <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
          {hasSupabaseKey && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-bg-card hover:bg-border-subtle border border-border-subtle flex items-center justify-center text-accent-primary hover:text-accent-primary/80 transition shadow-sm cursor-pointer active:scale-95"
                title="Profile Settings"
              >
                <User size={18} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-bg-card border border-border-subtle rounded-2xl p-4 shadow-md space-y-3.5 z-50 animate-fade-in-up">
                  <div className="flex items-center gap-3 border-b border-border-subtle pb-3">
                    <div className="w-8 h-8 rounded-full bg-bg-app flex items-center justify-center text-text-secondary border border-border-subtle">
                      <User size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {userEmail || 'Active User'}
                      </p>
                      <p className="text-[10px] text-text-secondary truncate">
                        Authenticated Workspace
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-border-subtle hover:border-red-950/30 text-text-secondary hover:text-red-500 hover:bg-red-500/5 rounded-xl text-xs font-semibold active:scale-95 transition cursor-pointer disabled:opacity-40"
                  >
                    {loading ? (
                      <Loader2 size={12} className="animate-spin text-text-secondary" />
                    ) : (
                      <>
                        <LogOut size={12} />
                        <span>Log out</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
          <ThemeToggle />
        </div>

        <div className="w-full max-w-3xl mx-auto px-6 py-12 md:py-20 z-10 space-y-8">
          <div className="space-y-3.5 text-center sm:text-left">
            <h1 className="text-3xl font-bold font-serif-anthropic tracking-tight sm:text-4xl text-text-primary">
              Launch Browser automation
            </h1>
            <p className="text-sm text-text-secondary max-w-lg leading-relaxed">
              Describe a website target URL and the goal task you wish to verify. The AI assistant constructs step actions and runs them dynamically.
            </p>
          </div>

          {/* Form wrapper */}
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-sm">
            <TestSetupForm />
          </div>
        </div>

        {/* Global Footer */}
        <footer className="text-center py-6 border-t border-border-subtle text-[10px] text-text-secondary/50 z-10 bg-bg-card/5">
          ShipCheck Workspace &middot; Built for the AI Hackathon
        </footer>
      </main>
    </div>
  );
}
