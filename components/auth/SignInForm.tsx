'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Mail, Lock, Loader2, AlertCircle, Shield } from 'lucide-react';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

export default function SignInForm({ onSwitchToSignUp, onForgotPassword }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

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
      const { error: loginErr } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (loginErr) throw loginErr;

      // Clean up old oversized avatar metadata from database before cookie redirect
      const { data: { user } } = await client.auth.getUser();
      if (user && user.user_metadata?.avatar_url && user.user_metadata.avatar_url.length > 10000) {
        await client.auth.updateUser({
          data: {
            avatar_url: ''
          }
        });
      }

      setSuccess('Success! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary font-serif-anthropic">
          Welcome back
        </h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          Sign in to your ShipCheck workspace.
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
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Work email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-text-secondary/50" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full pl-9 pr-3 py-2.5 bg-bg-card/40 border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/20 focus:border-accent-primary transition duration-200"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[9px] font-semibold text-text-secondary hover:text-text-primary transition duration-200 cursor-pointer animate-pulse"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-text-secondary/50" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 bg-bg-card/40 border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/20 focus:border-accent-primary transition duration-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            id="checkbox-options"
            type="checkbox"
            checked={keepSignedIn}
            onChange={(e) => setKeepSignedIn(e.target.checked)}
            className="w-3.5 h-3.5 rounded border border-border-subtle text-accent-primary focus:ring-0 accent-accent-primary cursor-pointer"
          />
          <label htmlFor="checkbox-options" className="text-[11px] text-text-secondary select-none cursor-pointer">
            Keep me signed in for 30 days
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 font-bold text-white bg-accent-primary hover:bg-accent-primary/95 rounded-xl shadow-xs active:scale-98 disabled:opacity-40 transition text-xs cursor-pointer flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Sign in</span>}
        </button>
      </form>

      <div className="pt-2 text-center text-xs">
        <span className="text-text-secondary">Don't have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="font-bold text-text-primary hover:underline cursor-pointer"
        >
          Create one
        </button>
      </div>
    </div>
  );
}
