import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { ArrowRight, Shield, Play, Terminal, Cpu } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-bg-app text-text-primary flex flex-col items-center justify-between overflow-hidden selection:bg-accent-primary/10 selection:text-accent-primary">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center font-bold text-white shadow-sm">SC</span>
          <span className="font-bold text-lg tracking-tight font-serif-anthropic text-text-primary">ShipCheck</span>
          <span className="text-[10px] uppercase font-bold border border-border-subtle bg-bg-card text-text-secondary px-2 py-0.5 rounded-full tracking-wide">MVP</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link 
            href="/test/new" 
            className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary hover:translate-x-0.5 transition duration-200"
          >
            <span>Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 flex flex-col justify-center items-center text-center space-y-9 z-10 py-16">
        <div className="space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border border-border-subtle bg-bg-card text-accent-primary mb-1 shadow-sm">
            <Cpu size={12} className="animate-spin-[duration:10s]" />
            <span>AI-Driven Browser Automation</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight font-serif-anthropic text-text-primary">
            Turn requirements into{' '}
            <span className="text-accent-primary">
              browser tests
            </span>{' '}
            and bug reports
          </h1>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Describe a user flow in plain English. ShipCheck converts it to a structured test plan, executes it in a headless browser with Playwright, and compiles an evidence-backed report with suggestions.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/test/new"
            className="group flex items-center gap-2.5 px-9 py-4.5 font-bold text-white bg-accent-primary hover:bg-accent-primary/80 active:scale-[0.98] rounded-xl shadow-md transition duration-200 cursor-pointer"
          >
            <span>Start testing</span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-250" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
            <Shield size={12} />
            <span>Anonymous MVP - Sandbox Mode Supported</span>
          </div>
        </div>

        {/* 3 Step Features */}
        <div className="grid md:grid-cols-3 gap-6 w-full pt-16 text-left">
          <div className="p-6 bg-bg-card border border-border-subtle rounded-2xl transition duration-300 transform hover:-translate-y-1 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-center text-accent-primary shadow-xs">
              <Terminal size={18} />
            </div>
            <h3 className="text-base font-bold text-text-primary font-serif-anthropic">1. Describe</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Specify a public target URL and describe the test goal in natural language (e.g. submit contact form).
            </p>
          </div>

          <div className="p-6 bg-bg-card border border-border-subtle rounded-2xl transition duration-300 transform hover:-translate-y-1 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-center text-accent-primary shadow-xs">
              <Play size={18} />
            </div>
            <h3 className="text-base font-bold text-text-primary font-serif-anthropic">2. Automation</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Headless Playwright browser navigates, inputs fields, submits form clicks, and logs screenshots at each step.
            </p>
          </div>

          <div className="p-6 bg-bg-card border border-border-subtle rounded-2xl transition duration-300 transform hover:-translate-y-1 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-center text-accent-primary shadow-xs">
              <Cpu size={18} />
            </div>
            <h3 className="text-base font-bold text-text-primary font-serif-anthropic">3. Bug Report</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              OpenAI compiles screenshot and console log evidence into a detailed bug report outlining causes and fixes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 border-t border-border-subtle bg-bg-card/5">
        <p className="text-xs text-text-secondary/60" suppressHydrationWarning>
          &copy; {new Date().getFullYear()} ShipCheck. Built for the AI Hackathon.
        </p>
      </footer>
    </div>
  );
}
