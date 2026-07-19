import React from 'react';
import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="w-full border-t border-border-subtle bg-bg-card/30 pt-16 pb-8 z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
        {/* Top Footer Columns */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-accent-glow border border-border-subtle flex items-center justify-center font-bold text-[10px] font-serif-anthropic text-accent-primary">SC</div>
              <span className="font-bold text-md tracking-tight font-serif-anthropic"><span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span></span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed max-w-xs">
              AI-powered web verification engine translating natural language test intents to structured Playwright scenarios.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Navigation</h4>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li><Link href="/dashboard" className="hover:text-text-primary transition-colors link-underline">Test Playground</Link></li>
              <li><a href="#simulator" className="hover:text-text-primary transition-colors link-underline">QA Simulator</a></li>
              <li><Link href="/auth" className="hover:text-text-primary transition-colors link-underline">Developer Portal</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Architecture</h4>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Chromium Sandbox isolation engine executing with custom OpenAI analysis models for instant bug reports.
            </p>
          </div>
        </div>

        {/* Large Typographic Display Title (Awwwards Style) */}
        <div className="w-full border-t border-border-subtle/50 pt-8 select-none overflow-hidden flex flex-col items-center justify-center">
          <h1 className="text-[14vw] font-black tracking-tighter leading-none text-center select-none uppercase font-sans cursor-default stroke-text">
            ShipCheck
          </h1>

          <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary/50 mt-6 text-center" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} ShipCheck. Built for the AI Hackathon.
          </p>
        </div>
      </div>
    </footer>
  );
}
