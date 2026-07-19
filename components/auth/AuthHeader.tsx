import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function AuthHeader() {
  return (
    <div className="absolute top-8 left-8 right-8 flex items-center justify-between md:justify-end z-10">
      {/* Mobile Logo Link */}
      <Link href="/" className="md:hidden flex items-center gap-2 active:scale-95 transition">
        <div className="w-8 h-8 rounded-lg bg-accent-glow border border-border-subtle flex items-center justify-center font-bold text-xs font-serif-anthropic text-accent-primary">SC</div>
        <span className="font-bold text-lg tracking-tight font-serif-anthropic"><span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span></span>
      </Link>

      <ThemeToggle />
    </div>
  );
}
