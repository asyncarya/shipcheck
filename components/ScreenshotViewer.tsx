'use client';

import React from 'react';
import { Monitor, AlertCircle, RefreshCw, Radio } from 'lucide-react';

interface ScreenshotViewerProps {
  screenshotPath: string | null;
  stepDescription: string | null;
  currentUrl: string | null;
  isLive?: boolean;
}

export default function ScreenshotViewer({
  screenshotPath,
  stepDescription,
  currentUrl,
  isLive = false,
}: ScreenshotViewerProps) {
  return (
    <div className="flex flex-col h-full bg-bg-app border border-border-subtle rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
      {/* Mock Browser Titlebar */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-bg-card border-b border-border-subtle">
        <div className="flex items-center gap-2 min-w-0">
          {/* Windows-style close/minimize buttons */}
          <div className="flex gap-1.5 flex-shrink-0">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-650/10" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-650/10" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-650/10" />
          </div>
          <span className="text-xs text-text-secondary font-mono ml-4 truncate hidden sm:inline">
            {stepDescription || (isLive ? 'Active Browser session' : 'Browser Simulator')}
          </span>
        </div>

        {/* Live Indicator vs Static Badge */}
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent-glow text-accent-primary border border-accent-primary/20 animate-pulse">
            <Radio size={10} className="animate-spin" />
            <span>LIVE PREVIEW</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-bg-app text-text-secondary border border-border-subtle">
            <Monitor size={10} />
            <span>STATIC FRAME</span>
          </span>
        )}
      </div>

      {/* Mock Browser URL Bar */}
      <div className="px-4 py-2.5 bg-bg-card/45 border-b border-border-subtle flex items-center gap-2">
        {/* Navigation arrows (disabled mock) */}
        <div className="flex gap-1">
          <span className="w-6 h-6 flex items-center justify-center text-text-secondary/40 rounded text-xs select-none pointer-events-none">&larr;</span>
          <span className="w-6 h-6 flex items-center justify-center text-text-secondary/40 rounded text-xs select-none pointer-events-none">&rarr;</span>
        </div>
        
        {/* Address bar */}
        <div className="flex-1 flex min-w-0 items-center gap-2 px-3 py-1.5 bg-bg-app border border-border-subtle rounded-xl text-text-secondary text-xs font-mono select-all">
          <span className="w-2 h-2 flex-shrink-0 rounded-full bg-accent-primary/40" />
          <span className="flex-1 truncate min-w-0">{currentUrl || 'about:blank'}</span>
          {isLive && <RefreshCw size={10} className="animate-spin text-accent-primary" />}
        </div>
      </div>

      {/* Media Content Area */}
      <div className="h-[450px] w-full bg-bg-card/10 flex items-center justify-center relative overflow-hidden group">
        {screenshotPath ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={screenshotPath}
            alt="Browser Screenshot"
            className="w-full h-full object-contain pointer-events-none select-none transition duration-300"
          />
        ) : (
          <div className="text-center p-8 space-y-3">
            <AlertCircle size={36} className="mx-auto text-text-secondary/30" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-secondary">No screenshot captured yet</p>
              <p className="text-xs text-text-secondary/60 max-w-xs mx-auto leading-relaxed">
                Screenshots appear here after steps execute. Click a completed step in the timeline to view its screen capture.
              </p>
            </div>
          </div>
        )}

        {/* Live overlay mask effect */}
        {isLive && screenshotPath && screenshotPath.includes('-live') && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-bg-card/90 border border-border-subtle px-2 py-1 rounded text-[9px] font-mono text-text-secondary backdrop-blur-xs pointer-events-none">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            <span>STREAMING</span>
          </div>
        )}
      </div>
    </div>
  );
}
