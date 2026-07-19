'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Sparkles } from 'lucide-react';

interface LandingHeroProps {
  user: any;
  hasKeys: boolean;
}

export default function LandingHero({ user, hasKeys }: LandingHeroProps) {
  // Mouse Spotlight Tracker
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full flex flex-col items-center justify-between z-0"
    >
      {/* Dynamic Radial Spotlight */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out z-0 hidden md:block"
          style={{
            background: `radial-gradient(550px circle at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(217, 119, 6, 0.025), transparent 80%)`
          }}
        />
      )}

      {/* Editorial Decorative Grid Lines */}
      <div className="absolute inset-y-0 left-1/4 w-[1px] bg-border-subtle/30 pointer-events-none hidden md:block" />
      <div className="absolute inset-y-0 right-1/4 w-[1px] bg-border-subtle/30 pointer-events-none hidden md:block" />

      {/* Zero Gravity Drifting Background Blobs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none z-0 animate-drift1" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none z-0 animate-drift2" />

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-6 pt-20 pb-8 z-10 flex flex-col items-center">
        {/* Centered Typography Details */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border border-border-subtle bg-bg-card text-accent-primary shadow-xs animate-fade-in-up animation-delay-100">
            <Sparkles size={11} className="text-accent-primary animate-pulse" />
            <span>Automated Web Verification</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight font-serif-anthropic text-text-primary text-center animate-fade-in-up animation-delay-200">
            Describe a user flow.<br />
            Get <span className="text-accent-primary font-serif-anthropic italic font-normal">complete browser tests</span> & bug reports.
          </h1>

          <p className="text-base sm:text-md text-text-secondary leading-relaxed max-w-xl mx-auto text-center animate-fade-in-up animation-delay-300">
            Give ShipCheck a public URL and a natural language goal. Our AI agent plans execution steps, triggers automated Playwright tests, captures full evidence, and drafts structured bug reports instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 animate-fade-in-up animation-delay-400">
            <Link
              href={hasKeys && !user ? "/auth" : "/dashboard"}
              className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-9 py-4 font-bold text-white bg-accent-primary hover:bg-accent-primary/95 active:scale-95 rounded-xl shadow-xs transition duration-200 cursor-pointer"
            >
              <span>Launch Playground</span>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
            <a
              href="#simulator"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary border border-border-subtle rounded-xl bg-bg-card/40 transition active:scale-95"
            >
              See simulator
            </a>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-text-secondary/80 font-medium animate-fade-in-up animation-delay-500">
            <Shield size={12} className="text-emerald-500" />
            <span>Zero configuration sandbox environment</span>
          </div>
        </div>
      </section>
    </div>
  );
}
