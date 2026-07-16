'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, hasSupabase } from '@/lib/supabase';
import { Shield, Sparkles, Mail, Lock, Loader2, UserPlus, LogIn, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

  // Check if Supabase keys exist
  useEffect(() => {
    if (!hasSupabase()) {
      setConfigured(false);
      const timer = setTimeout(() => {
        router.push('/test/new');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const client = createClient();
    if (!client) {
      setError('Supabase is not configured.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error: loginErr } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (loginErr) throw loginErr;
        setSuccess('Success! Redirecting...');
        setTimeout(() => router.push('/test/new'), 800);
      } else {
        const { error: signUpErr, data } = await client.auth.signUp({
          email,
          password,
        });
        if (signUpErr) throw signUpErr;
        
        if (data.session) {
          setSuccess('Account created successfully! Redirecting...');
          setTimeout(() => router.push('/test/new'), 1000);
        } else {
          setSuccess('Registration successful! Please check your inbox for the confirmation link.');
          setEmail('');
          setPassword('');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="relative min-h-screen bg-bg-app text-text-primary flex items-center justify-center p-6 overflow-hidden">
        <div className="bg-bg-card border border-border-subtle p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-sm relative z-10">
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
    <div className="relative min-h-screen bg-bg-app text-text-primary flex items-center justify-center p-6 overflow-hidden">
      {/* Main Glassmorphic Panel */}
      <div className="bg-bg-card border border-border-subtle p-8 rounded-3xl max-w-md w-full shadow-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-accent-primary items-center justify-center shadow-xs mb-2">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary font-serif-anthropic flex items-center justify-center gap-1.5">
            <span>ShipCheck Workspace</span>
            <Sparkles size={16} className="text-accent-primary animate-pulse" />
          </h1>
          <p className="text-xs text-text-secondary">
            {isLogin ? 'Sign in to access your dashboard & runs history' : 'Register a free workspace account to save reports'}
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-500/5 border border-red-500/20 text-red-500 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2 duration-200">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 text-xs bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2 duration-200">
            <Shield size={14} className="flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-text-secondary/70" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-11 pr-4 py-3 bg-bg-app border border-border-subtle rounded-xl text-sm text-text-primary placeholder-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent-primary/30 focus:border-accent-primary transition duration-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-text-secondary/70" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-bg-app border border-border-subtle rounded-xl text-sm text-text-primary placeholder-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent-primary/30 focus:border-accent-primary transition duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 font-bold text-white bg-accent-primary hover:bg-accent-primary/90 rounded-xl shadow-xs active:scale-98 disabled:opacity-40 transition text-sm cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn size={16} />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="border-t border-border-subtle pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            className="text-xs text-accent-primary hover:text-accent-primary/80 font-semibold transition cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
