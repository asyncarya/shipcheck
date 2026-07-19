import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase';

interface LandingHeaderProps {
  user: any;
  hasKeys: boolean;
}

export default function LandingHeader({ user, hasKeys }: LandingHeaderProps) {
  return (
    <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10 border-b border-border-subtle/40">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent-glow border border-border-subtle flex items-center justify-center font-bold text-xs font-serif-anthropic text-accent-primary">SC</div>
        <span className="font-bold text-lg tracking-tight font-serif-anthropic"><span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span></span>
      </div>
      <div className="flex items-center gap-3">
        {!hasKeys ? (
          // Sandbox mode
          <Link
            href="/dashboard"
            className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition duration-200 border border-border-subtle bg-bg-card/50 px-3.5 py-1.5 rounded-lg active:scale-95 shadow-2xs"
          >
            <span>Dashboard</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        ) : user ? (
          // Logged in
          <>
            <span className="text-[10px] text-text-secondary font-mono hidden sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={async () => {
                const client = createClient();
                if (client) {
                  await client.auth.signOut();
                }
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-red-500 transition duration-200 cursor-pointer"
            >
              Sign Out
            </button>
            <Link
              href="/dashboard"
              className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition duration-200 border border-border-subtle bg-bg-card/50 px-3.5 py-1.5 rounded-lg active:scale-95 shadow-2xs"
            >
              <span>Dashboard</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
          </>
        ) : (
          // Logged out
          <Link
            href="/auth"
            className="hidden sm:flex group items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition duration-200 border border-border-subtle bg-bg-card/50 px-3.5 py-1.5 rounded-lg active:scale-95 shadow-2xs"
          >
            <span>Get started</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
