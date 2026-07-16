'use client';

import React from 'react';
import { Terminal, ShieldCheck } from 'lucide-react';
import { ConsoleError } from '@/lib/schemas';

interface ConsoleErrorsProps {
  errors: ConsoleError[];
}

export default function ConsoleErrors({ errors }: ConsoleErrorsProps) {
  if (errors.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/25 rounded-xl text-emerald-600 dark:text-emerald-400">
        <ShieldCheck size={18} />
        <div>
          <p className="text-sm font-semibold">Console Clean</p>
          <p className="text-xs text-text-secondary">No unhandled browser console errors or network failures occurred.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border-subtle bg-bg-card rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-bg-card border-b border-border-subtle">
        <Terminal size={14} className="text-accent-primary" />
        <span className="text-xs font-semibold text-text-primary">Console Logs & Network Errors</span>
        <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full font-mono ml-auto">
          {errors.length}
        </span>
      </div>

      {/* Log list */}
      <div className="divide-y divide-border-subtle/50 font-mono text-xs max-h-[220px] overflow-y-auto bg-bg-app/20">
        {errors.map((error, idx) => {
          const isError = error.type.includes('error') || error.type.includes('page');
          const rowBg = isError ? 'hover:bg-red-500/5 bg-red-500/[0.01]' : 'hover:bg-amber-500/5 bg-amber-500/[0.01]';
          const typeBadge = isError ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';

          return (
            <div key={idx} className={`p-3 flex items-start gap-2.5 transition duration-150 ${rowBg}`}>
              <span className={`px-1.5 py-0.5 text-[9px] font-semibold border ${typeBadge} flex-shrink-0 uppercase`}>
                {error.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`whitespace-pre-wrap break-all ${isError ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {error.text}
                </p>
                <span className="text-[10px] text-text-secondary mt-1 block" suppressHydrationWarning>
                  {new Date(error.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
