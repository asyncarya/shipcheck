'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasSupabase } from '@/lib/supabase';
import { AlertCircle, Loader2 } from 'lucide-react';
import AuthHeader from '@/components/auth/AuthHeader';
import AuthShowcase from '@/components/auth/AuthShowcase';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword' | 'resetPassword';

export default function AuthPage() {
  const router = useRouter();
  const [configured, setConfigured] = useState(true);
  const [mode, setMode] = useState<AuthMode>('signIn');

  // Check if Supabase keys exist
  useEffect(() => {
    if (!hasSupabase()) {
      setConfigured(false);
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [router]);

  // Check URL parameters for reset tokens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === 'true') {
        setMode('resetPassword');
      }
    }
  }, []);

  if (!configured) {
    return (
      <div className="relative min-h-screen bg-bg-app text-text-primary flex items-center justify-center p-6 overflow-hidden">
        <div className="bg-bg-card border border-border-subtle p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-sm relative z-10 animate-fade-in-up">
          <AlertCircle size={36} className="mx-auto text-accent-primary animate-pulse" />
          <h2 className="text-xl font-bold text-text-primary font-serif-anthropic">Local Sandbox Mode</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Supabase credentials are not configured in `.env.local`. Bypassing login check and redirecting to the local workspace simulator...
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-accent-primary font-medium">
            <Loader2 size={12} className="animate-spin" />
            <span>Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-bg-app text-text-primary overflow-x-hidden font-sans">
      <AuthShowcase />

      {/* Right Column: Authentication Card Form */}
      <div className="relative p-8 sm:p-12 md:p-20 flex flex-col justify-center items-center bg-bg-app border-l border-border-subtle/20">
        <AuthHeader />

        {mode === 'signIn' && (
          <SignInForm
            onSwitchToSignUp={() => setMode('signUp')}
            onForgotPassword={() => setMode('forgotPassword')}
          />
        )}

        {mode === 'signUp' && (
          <SignUpForm
            onSwitchToSignIn={() => setMode('signIn')}
          />
        )}

        {(mode === 'forgotPassword' || mode === 'resetPassword') && (
          <ResetPasswordForm
            isConfirmingReset={mode === 'resetPassword'}
            onBackToSignIn={() => setMode('signIn')}
          />
        )}

        {/* Mobile Brand Footer */}
        <div className="md:hidden absolute bottom-8 left-8 right-8 space-y-4 opacity-80">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-glow border border-border-subtle flex items-center justify-center font-bold text-xs font-serif-anthropic text-accent-primary">SC</div>
              <span className="font-bold text-lg tracking-tight font-serif-anthropic"><span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span></span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              AI-powered web verification engine translating natural language test intents to structured Playwright scenarios.
            </p>
          </div>
          <div className="pt-3 border-t border-border-subtle/30 text-[9px] text-text-secondary/60 font-medium text-center" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} <span className="font-serif-anthropic font-bold"><span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span></span> Workspace. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
