'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function LandingSpecs() {
  // Intersection Observer for Specifications Section
  const [specsVisible, setSpecsVisible] = useState(false);
  const specsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSpecsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (specsRef.current) {
      observer.observe(specsRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={specsRef} className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-border-subtle/50 z-10 overflow-hidden">
      <div className={`flex flex-col md:flex-row md:items-start justify-between gap-8 transition-all duration-1000 ease-out transform ${specsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="max-w-md space-y-3">
          <span className="text-[11px] uppercase tracking-wider font-bold text-accent-primary font-mono bg-accent-glow px-2.5 py-1 rounded-full">Specifications</span>
          <h2 className="text-3xl font-bold font-serif-anthropic text-text-primary">Reliable end-to-end browser assertions</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            ShipCheck strictly validates steps and asserts outcomes without complex configuration pipelines or brittle selectors.
          </p>
        </div>

        <div className="flex-1 w-full border border-border-subtle rounded-2xl bg-bg-card/30 overflow-hidden font-mono text-xs select-none">
          <div className="grid grid-cols-12 border-b border-border-subtle bg-bg-card/50 p-4 font-bold text-text-primary uppercase tracking-wider text-[10px]">
            <span className="col-span-4">Capability</span>
            <span className="col-span-8">Description</span>
          </div>

          <div className={`grid grid-cols-12 border-b border-border-subtle/60 p-4 text-text-secondary transition-all duration-700 delay-100 transform ${specsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="col-span-4 font-bold text-text-primary">Browser Isolation</span>
            <span className="col-span-8">Isolated server-side Chromium instances running headless Playwright protocols.</span>
          </div>
          <div className={`grid grid-cols-12 border-b border-border-subtle/60 p-4 text-text-secondary transition-all duration-700 delay-200 transform ${specsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="col-span-4 font-bold text-text-primary">Step Fallbacks</span>
            <span className="col-span-8">Automatic database local fallbacks checking configurations before writing to Supabase.</span>
          </div>
          <div className={`grid grid-cols-12 border-b border-border-subtle/60 p-4 text-text-secondary transition-all duration-700 delay-300 transform ${specsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="col-span-4 font-bold text-text-primary">Evidence Capture</span>
            <span className="col-span-8">Detailed execution timelines recording step status, duration, address URLs, and screens.</span>
          </div>
          <div className={`grid grid-cols-12 p-4 text-text-secondary transition-all duration-700 delay-400 transform ${specsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="col-span-4 font-bold text-text-primary">Root Cause Prompts</span>
            <span className="col-span-8">Structured OpenAI analysis identifying bug hypotheses, warnings, and code solutions.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
