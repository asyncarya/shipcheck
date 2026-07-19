'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Mail, Lock, User, Loader2, AlertCircle, Shield } from 'lucide-react';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export default function SignUpForm({ onSwitchToSignIn }: SignUpFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
      const { error: signUpErr, data } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      if (signUpErr) throw signUpErr;

      if (data.session) {
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        setSuccess('Registration successful! Please check your inbox for the confirmation link.');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
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
          Create your account
        </h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          Start building securely with ShipCheck.
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">First name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-text-secondary/50" />
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ada"
                className="w-full pl-9 pr-3 py-2.5 bg-bg-card/40 border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/20 focus:border-accent-primary transition duration-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Last name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-text-secondary/50" />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Lovelace"
                className="w-full pl-9 pr-3 py-2.5 bg-bg-card/40 border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/20 focus:border-accent-primary transition duration-200"
              />
            </div>
          </div>
        </div>

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
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Password</label>
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
            required
            className="w-3.5 h-3.5 rounded border border-border-subtle text-accent-primary focus:ring-0 accent-accent-primary cursor-pointer"
          />
          <label htmlFor="checkbox-options" className="text-[11px] text-text-secondary select-none cursor-pointer">
            I agree to the Terms of Service and Privacy Policy
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 font-bold text-white bg-accent-primary hover:bg-accent-primary/95 rounded-xl shadow-xs active:scale-98 disabled:opacity-40 transition text-xs cursor-pointer flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Create account</span>}
        </button>
      </form>

      <div className="pt-2 text-center text-xs">
        <span className="text-text-secondary">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-bold text-text-primary hover:underline cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
