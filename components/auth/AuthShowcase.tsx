'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthShowcase() {
  // Infographic Loop Animation State
  const [activeInfoIdx, setActiveInfoIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInfoIdx((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex relative bg-bg-card text-text-primary p-8 sm:p-12 flex-col justify-between overflow-hidden border-r border-border-subtle/50">
      {/* Glow spotlight blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-accent-primary/5 blur-[100px] pointer-events-none" />

      {/* Top Header Logo */}
      <div className="flex items-center gap-2 z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-glow border border-border-subtle flex items-center justify-center font-bold text-xs font-serif-anthropic text-accent-primary">SC</div>
          <span className="font-bold text-lg tracking-tight font-serif-anthropic"><span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span></span>
        </Link>
      </div>

      {/* Center Editorial Showcase & Timeline Infographic */}
      <div className="my-auto space-y-8 max-w-lg z-10">
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight font-serif-anthropic text-text-primary">
            Autonomous website verification and AI-backed bug reporting.
          </h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            One secure workspace for browser regression, automated form validation, and evidence compiles.
          </p>
        </div>

        {/* Interactive Visual Infographic */}
        <div className="border border-border-subtle bg-bg-app/40 rounded-2xl p-6 relative overflow-hidden space-y-4 shadow-2xs group hover:border-accent-primary/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent-primary/5 blur-2xl pointer-events-none" />
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
            <Sparkles size={11} className="text-accent-primary animate-pulse" />
            <span>ShipCheck Lifecycle Engine</span>
          </h4>

          <div className="relative pl-6 border-l border-border-subtle/80 space-y-6 text-left">
            {/* Node 1 */}
            <div className={`relative transition-all duration-500 ${activeInfoIdx === 0 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`absolute -left-[32.5px] top-0.5 w-4 h-4 rounded-full bg-bg-card border transition-all duration-500 flex items-center justify-center ${activeInfoIdx === 0 ? 'border-accent-primary bg-accent-glow scale-110 shadow-xs' : 'border-border-subtle'}`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeInfoIdx === 0 ? 'bg-accent-primary' : 'bg-text-secondary/30'}`} />
              </div>
              <h5 className={`text-[11px] font-bold uppercase tracking-wide transition-colors duration-500 ${activeInfoIdx === 0 ? 'text-accent-primary' : 'text-text-primary'}`}>
                1. Plan Generation
              </h5>
              <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                OpenAI models convert natural language tasks (e.g. &quot;submit contact form&quot;) into structured browser steps.
              </p>
            </div>

            {/* Node 2 */}
            <div className={`relative transition-all duration-500 ${activeInfoIdx === 1 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`absolute -left-[32.5px] top-0.5 w-4 h-4 rounded-full bg-bg-card border transition-all duration-500 flex items-center justify-center ${activeInfoIdx === 1 ? 'border-accent-primary bg-accent-glow scale-110 shadow-xs' : 'border-border-subtle'}`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeInfoIdx === 1 ? 'bg-accent-primary' : 'bg-text-secondary/30'}`} />
              </div>
              <h5 className={`text-[11px] font-bold uppercase tracking-wide transition-colors duration-500 ${activeInfoIdx === 1 ? 'text-accent-primary' : 'text-text-primary'}`}>
                2. Playwright Run
              </h5>
              <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                Automated Playwright runner opens Chromium, executes clicks and inputs, and collects page screenshots.
              </p>
            </div>

            {/* Node 3 */}
            <div className={`relative transition-all duration-500 ${activeInfoIdx === 2 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`absolute -left-[32.5px] top-0.5 w-4 h-4 rounded-full bg-bg-card border transition-all duration-500 flex items-center justify-center ${activeInfoIdx === 2 ? 'border-accent-primary bg-accent-glow scale-110 shadow-xs' : 'border-border-subtle'}`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeInfoIdx === 2 ? 'bg-accent-primary' : 'bg-text-secondary/30'}`} />
              </div>
              <h5 className={`text-[11px] font-bold uppercase tracking-wide transition-colors duration-500 ${activeInfoIdx === 2 ? 'text-accent-primary' : 'text-text-primary'}`}>
                3. Bug Analysis
              </h5>
              <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                AI compares execution screenshots and console logs to expected results to compile bug reports.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Brand Label */}
      <div className="text-[10px] text-text-secondary/70 font-medium z-10 flex items-center gap-1.5" suppressHydrationWarning>
        <div className="w-5 h-5 rounded-md bg-accent-glow border border-border-subtle flex items-center justify-center font-bold text-[8px] font-serif-anthropic text-accent-primary">SC</div>
        <span>&copy; {new Date().getFullYear()} <span className="font-serif-anthropic font-bold"><span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span></span> Workspace. All rights reserved.</span>
      </div>
    </div>
  );
}
