'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface LandingCTAProps {
  user: any;
  hasKeys: boolean;
}

export default function LandingCTA({ user, hasKeys }: LandingCTAProps) {
  // Intersection Observer for CTA Section
  const [ctaVisible, setCtaVisible] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCtaVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ctaRef.current) {
      observer.observe(ctaRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ctaRef} className={`w-full max-w-7xl mx-auto px-6 py-16 z-10 transition-all duration-1000 ease-out transform ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="bg-bg-card border border-border-subtle rounded-3xl p-12 text-center space-y-6 relative overflow-hidden shadow-xs group hover:border-accent-primary/20 transition-all duration-300">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />

        <h2 className="text-3xl font-bold font-serif-anthropic text-text-primary">Ready to verify your web forms?</h2>
        <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
          Create custom plans for your public demo sites, execute live automated flows, and inspect generated bug reports.
        </p>
        <div className="pt-2">
          <Link
            href={hasKeys && !user ? "/auth" : "/dashboard"}
            className="inline-flex items-center gap-2 px-9 py-4 font-bold text-white bg-accent-primary hover:bg-accent-primary/95 active:scale-95 rounded-xl shadow-xs transition duration-200 cursor-pointer group/btn"
          >
            <span>Get started free</span>
            <ArrowRight size={15} className="group-hover/btn:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>
      </div>
    </section>
  );
}
