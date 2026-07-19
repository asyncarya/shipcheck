import React from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertCircle, Loader2, Sparkles, CheckCircle2, Clock, Eye, MoreVertical } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { TestRun } from '@/lib/schemas';

interface RunnerHeaderProps {
  run: TestRun;
  isFinished: boolean;
  isRunning: boolean;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
  setModalTab: (tab: 'steps' | 'analysis' | 'console') => void;
  setIsModalOpen: (open: boolean) => void;
  handleRetry: () => void;
}

export default function RunnerHeader({
  run,
  isFinished,
  isRunning,
  showMobileMenu,
  setShowMobileMenu,
  setModalTab,
  setIsModalOpen,
  handleRetry
}: RunnerHeaderProps) {
  return (
    <header className="w-full max-w-7xl mx-auto px-6 py-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
      <div className="flex items-center justify-between w-full sm:w-auto">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-card border border-border-subtle rounded-xl transition flex-shrink-0" title="Back to Setup">
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-text-primary font-serif-anthropic whitespace-nowrap">Test Execution</h1>
              <span className="text-xs text-text-secondary font-mono truncate">#{run.id}</span>
            </div>
            <p className="text-xs text-text-secondary truncate max-w-[200px] sm:max-w-md">{run.url}</p>
          </div>
        </div>

        {/* Mobile Actions & Menu Trigger (Right Aligned) */}
        <div className="flex items-center gap-2 flex-shrink-0 sm:hidden">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="w-10 h-10 flex items-center justify-center bg-bg-card hover:bg-border-subtle border border-border-subtle rounded-xl text-text-primary shadow-sm active:scale-95 transition"
          >
            <MoreVertical size={16} />
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Status Indicators & Action buttons */}
      <div className="w-full sm:w-auto flex justify-end">

        {/* Action Items (Expanding on mobile, Inline on desktop) */}
        <div className={`${showMobileMenu ? 'w-full bg-bg-card/40 border border-border-subtle rounded-xl p-3 flex-col flex animate-fade-in-up mt-2' : 'hidden'} sm:flex sm:static sm:w-auto sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:shadow-none sm:p-0 sm:flex-row sm:items-center sm:mt-0 items-stretch gap-2 sm:gap-3`}>
          <div className="flex items-center gap-2 px-3.5 py-2 sm:py-1.5 rounded-lg sm:rounded-full border border-border-subtle bg-bg-app sm:bg-bg-card text-xs font-semibold w-full sm:w-auto">
            {run.status === 'running' && (
              <>
                <Loader2 size={12} className="animate-spin text-accent-primary" />
                <span className="text-accent-primary">Executing steps ({run.progress}%)</span>
              </>
            )}
            {run.status === 'created' && (
              <>
                <Clock size={12} className="text-blue-500" />
                <span className="text-blue-500">Queued</span>
              </>
            )}
            {run.status === 'planning' && (
              <>
                <Sparkles size={12} className="text-accent-primary animate-pulse" />
                <span className="text-accent-primary">Planning test steps...</span>
              </>
            )}
            {run.status === 'passed' && (
              <>
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-emerald-500">Passed</span>
              </>
            )}
            {run.status === 'failed' && (
              <>
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-red-500 font-bold">Failed</span>
              </>
            )}
            {run.status === 'timed_out' && (
              <>
                <Clock size={12} className="text-amber-500" />
                <span className="text-amber-500">Timed Out</span>
              </>
            )}
            {run.status === 'error' && (
              <>
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-red-500">Runner Error</span>
              </>
            )}
          </div>

          {/* Result Overview Button */}
          {isFinished && (
            <button
              onClick={() => {
                setModalTab('steps');
                setIsModalOpen(true);
                setShowMobileMenu(false);
              }}
              className="flex items-center justify-start sm:justify-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 border border-transparent text-white font-bold rounded-xl text-xs active:scale-95 transition cursor-pointer shadow-sm animate-pulse w-full sm:w-auto"
            >
              <Eye size={14} />
              <span>See Results</span>
            </button>
          )}

          {isFinished && (
            <button
              onClick={() => {
                setShowMobileMenu(false);
                handleRetry();
              }}
              className="flex items-center justify-start sm:justify-center gap-2 px-4 py-2 bg-bg-app sm:bg-bg-card hover:bg-border-subtle border border-border-subtle text-text-primary rounded-xl text-xs font-semibold active:scale-95 transition cursor-pointer shadow-sm w-full sm:w-auto"
            >
              <RefreshCw size={14} />
              <span>Run again</span>
            </button>
          )}
          
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
