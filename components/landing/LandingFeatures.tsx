'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Cpu } from 'lucide-react';

export default function LandingFeatures() {
  // Intersection Observer for Features Section
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFeaturesVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={featuresRef} className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-border-subtle/50 grid md:grid-cols-3 gap-8 z-10 overflow-hidden">
      <div className={`p-8 bg-bg-card border border-border-subtle rounded-2xl hover:border-accent-primary/35 hover:-translate-y-2 hover:shadow-md transition-all duration-500 space-y-4 group transform ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-center text-accent-primary shadow-xs group-hover:bg-accent-glow transition duration-300">
          <Terminal size={18} className="group-hover:scale-110 transition-transform duration-200" />
        </div>
        <h3 className="text-lg font-bold text-text-primary font-serif-anthropic">1. Structured Setup</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          Enter a public target URL, type down the test goal in natural language (e.g., submit contact form), and establish expected outcomes instantly.
        </p>
      </div>

      <div className={`p-8 bg-bg-card border border-border-subtle rounded-2xl hover:border-accent-primary/35 hover:-translate-y-2 hover:shadow-md transition-all duration-500 delay-100 space-y-4 group transform ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-center text-accent-primary shadow-xs group-hover:bg-accent-glow transition duration-300">
          <Play size={18} className="group-hover:translate-x-0.5 transition-transform duration-200" />
        </div>
        <h3 className="text-lg font-bold text-text-primary font-serif-anthropic">2. Automated Playwright Runs</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          The background runner spawns Chromium instances, translates plans to structured actions, logs screenshots at each step, and gathers page console errors.
        </p>
      </div>

      <div className={`p-8 bg-bg-card border border-border-subtle rounded-2xl hover:border-accent-primary/35 hover:-translate-y-2 hover:shadow-md transition-all duration-500 delay-200 space-y-4 group transform ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-center text-accent-primary shadow-xs group-hover:bg-accent-glow transition duration-300">
          <Cpu size={18} className="group-hover:rotate-12 transition-transform duration-200" />
        </div>
        <h3 className="text-lg font-bold text-text-primary font-serif-anthropic">3. Evidence Analyzer</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          AI evaluates step statuses, screenshots, and terminal log files to compile structured reports outlining error root causes and suggested code actions.
        </p>
      </div>
    </section>
  );
}
