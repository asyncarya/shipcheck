'use client';

import React, { useState, useEffect } from 'react';
import { createClient, hasSupabase } from '@/lib/supabase';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingHero from '@/components/landing/LandingHero';
import LandingSimulator from '@/components/landing/LandingSimulator';
import LandingSpecs from '@/components/landing/LandingSpecs';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Home() {
  // Supabase Auth Integration State
  const [user, setUser] = useState<any>(null);
  const [hasKeys, setHasKeys] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setHasKeys(hasSupabase());
    if (hasSupabase()) {
      const client = createClient();
      if (client) {
        // Initial session check
        client.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
        });

        // Listen for changes in session state
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-bg-app text-text-primary flex flex-col items-center justify-between overflow-x-hidden selection:bg-accent-primary/10 selection:text-accent-primary font-sans transition-all duration-300">
      {/* Scroll Progress Bar Indicator */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-accent-primary z-50 transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      <LandingHeader user={user} hasKeys={hasKeys} />
      
      <LandingHero user={user} hasKeys={hasKeys} />

      <LandingSimulator />

      <LandingSpecs />

      <LandingFeatures />

      <LandingCTA user={user} hasKeys={hasKeys} />

      <LandingFooter />
    </div>
  );
}
