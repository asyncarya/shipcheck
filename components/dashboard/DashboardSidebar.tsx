import React from 'react';
import Link from 'next/link';
import { History, X, Sparkles, CheckCircle2, AlertCircle, Play, Loader2, Trash2, Clock } from 'lucide-react';
import { TestRun } from '@/lib/schemas';

interface DashboardSidebarProps {
  runs: (TestRun & { isDeleting?: boolean })[];
  showMobileHistory: boolean;
  setShowMobileHistory: (show: boolean) => void;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  totalPages: number;
  paginatedRuns: (TestRun & { isDeleting?: boolean })[];
  setRunToDelete: (id: string | null) => void;
}

export default function DashboardSidebar({
  runs,
  showMobileHistory,
  setShowMobileHistory,
  currentPage,
  setCurrentPage,
  totalPages,
  paginatedRuns,
  setRunToDelete,
}: DashboardSidebarProps) {
  return (
    <aside className={`${showMobileHistory ? 'fixed inset-0 z-50 flex flex-col bg-bg-app' : 'hidden md:flex flex-col'} w-full md:w-80 md:bg-bg-card/45 border-b md:border-b-0 md:border-r border-border-subtle justify-between flex-shrink-0 md:z-10`}>
      
      {/* Top sidebar wrapper */}
      <div className="flex flex-col flex-1 min-h-0">
        
        {/* Logo Brand Header */}
        <div className="px-6 py-5.5 border-b border-border-subtle flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-glow border border-border-subtle flex items-center justify-center font-bold text-xs font-serif-anthropic text-accent-primary">SC</div>
            <span className="font-bold text-base tracking-tight font-serif-anthropic"><span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span></span>
          </Link>
          {showMobileHistory && (
            <button 
              className="md:hidden p-2 text-text-secondary hover:text-text-primary bg-bg-card rounded-lg border border-border-subtle active:scale-95 transition"
              onClick={() => setShowMobileHistory(false)}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Test Runs History title */}
        <div className="px-6 py-4 flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider bg-bg-card/20 border-b border-border-subtle">
          <History size={12} className="text-accent-primary" />
          <span>Test History</span>
          <span className="text-[10px] bg-bg-app text-text-secondary border border-border-subtle px-2 py-0.5 rounded-full ml-auto font-mono">
            {runs.length}
          </span>
        </div>

        {/* Virtualized/Scrollable List of Runs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-secondary opacity-60 space-y-3">
              <History size={24} />
              <p className="text-xs font-medium text-center px-4">No test runs recorded yet.</p>
            </div>
          ) : (
            paginatedRuns.map((run) => (
              <div 
                key={run.id}
                className={`group block bg-bg-app border border-border-subtle hover:border-accent-primary/30 rounded-xl p-3 shadow-xs hover:shadow-sm transition duration-300 relative overflow-hidden ${
                  run.isDeleting ? 'animate-slide-out-right pointer-events-none' : 'animate-fade-in-up'
                }`}
              >
                {/* Gradient subtle highlight */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-accent-primary/5 rounded-bl-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition duration-300" />
                
                <div className="flex items-center justify-between mb-2">
                  <Link href={`/dashboard/${run.id}`} className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => setShowMobileHistory(false)}>
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 bg-bg-card border border-border-subtle">
                      {run.status === 'planning' && <Sparkles size={10} className="text-accent-primary animate-pulse" />}
                      {run.status === 'running' && <Loader2 size={10} className="text-accent-primary animate-spin" />}
                      {run.status === 'passed' && <CheckCircle2 size={10} className="text-emerald-500" />}
                      {run.status === 'failed' && <AlertCircle size={10} className="text-red-500" />}
                      {run.status === 'timed_out' && <Clock size={10} className="text-amber-500" />}
                      {run.status === 'error' && <AlertCircle size={10} className="text-red-500" />}
                      {run.status === 'created' && <Clock size={10} className="text-blue-500" />}
                    </div>
                    <span className="text-[10px] font-mono text-text-secondary truncate">
                      {run.id.split('-')[0]}
                    </span>
                  </Link>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span suppressHydrationWarning={true} className="text-[9px] font-semibold text-text-secondary opacity-60">
                      {new Date(run.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    {/* Delete Run Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setRunToDelete(run.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-md transition cursor-pointer"
                      title="Delete test run"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <Link href={`/dashboard/${run.id}`} onClick={() => setShowMobileHistory(false)} className="block cursor-pointer">
                  <p className="text-[11px] font-semibold text-text-primary mb-1 truncate group-hover:text-accent-primary transition-colors duration-200">
                    {run.task}
                  </p>
                  <p className="text-[9px] text-text-secondary truncate pr-4">
                    {run.url}
                  </p>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border-subtle bg-bg-card/45 flex items-center justify-between">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-1.5 text-[10px] font-bold text-text-primary bg-bg-app border border-border-subtle rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-card transition active:scale-95"
          >
            Prev
          </button>
          <span className="text-[10px] font-bold text-text-secondary font-mono tracking-widest">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1.5 text-[10px] font-bold text-text-primary bg-bg-app border border-border-subtle rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-card transition active:scale-95"
          >
            Next
          </button>
        </div>
      )}
    </aside>
  );
}
