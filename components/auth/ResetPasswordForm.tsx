'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Mail, Lock, Loader2, AlertCircle, Shield } from 'lucide-react';

interface ResetPasswordFormProps {
  onBackToSignIn: () => void;
  isConfirmingReset: boolean;
}

export default function ResetPasswordForm({ onBackToSignIn, isConfirmingReset }: ResetPasswordFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      if (isConfirmingReset) {
        // Reset password confirmation update
        const { error: updateErr } = await client.auth.updateUser({
          password: password
        });
        if (updateErr) throw updateErr;
        setSuccess('Password updated successfully! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1200);
      } else {
        // Request forgot password email link
        const { error: resetErr } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });
        if (resetErr) throw resetErr;
        setSuccess('Password reset link sent! Check your inbox for instructions.');
      }
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
          {isConfirmingReset ? 'Update your password' : 'Reset your password'}
        </h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          {isConfirmingReset
            ? 'Enter a new strong password for your workspace.'
            : 'Enter your work email and we will send a recovery link.'}
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
        {!isConfirmingReset ? (
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
        ) : (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              New password
            </label>
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
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 font-bold text-white bg-accent-primary hover:bg-accent-primary/95 rounded-xl shadow-xs active:scale-98 disabled:opacity-40 transition text-xs cursor-pointer flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isConfirmingReset ? (
            <span>Update password</span>
          ) : (
            <span>Send reset link</span>
          )}
        </button>
      </form>

      <div className="pt-2 text-center text-xs">
        <button
          type="button"
          onClick={onBackToSignIn}
          className="font-bold text-text-primary hover:underline cursor-pointer"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}
