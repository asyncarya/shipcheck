'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient, hasSupabase } from '@/lib/supabase';
import ThemeToggle from '@/components/ThemeToggle';
import {
  Shield, Sparkles, Mail, Lock, Loader2, AlertCircle,
  Key, Check, User, ArrowLeft
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

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

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);

  // Check URL parameters for reset tokens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === 'true') {
        setIsResetPassword(true);
        setIsLogin(false);
        setIsForgotPassword(false);
      }
    }
  }, []);

  // Infographic Loop Animation State
  const [activeInfoIdx, setActiveInfoIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInfoIdx((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

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
      if (isResetPassword) {
        // Reset password confirmation update
        const { error: updateErr } = await client.auth.updateUser({
          password: password
        });
        if (updateErr) throw updateErr;
        setSuccess('Password updated successfully! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1200);
      } else if (isForgotPassword) {
        // Request forgot password email link
        const { error: resetErr } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });
        if (resetErr) throw resetErr;
        setSuccess('Password reset link sent! Check your inbox for instructions.');
      } else if (isLogin) {
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
      } else {
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
          setEmail('');
          setPassword('');
          setFirstName('');
          setLastName('');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthClick = () => {
    setError('OAuth authentication is disabled. Please sign in with email/password instead.');
  };

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

      {/* Left Column: Awwwards Editorial Branding Showcase */}
      <div className="hidden md:flex relative bg-bg-card text-text-primary p-8 sm:p-12 flex-col justify-between overflow-hidden border-r border-border-subtle/50">
        {/* Glow spotlight blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-accent-primary/5 blur-[100px] pointer-events-none" />

        {/* Top Header Logo */}
        <div className="flex items-center gap-2 z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-glow border border-border-subtle flex items-center justify-center font-bold text-xs font-serif-anthropic text-accent-primary">SC</div>
            <span className="font-bold text-lg tracking-tight font-serif-anthropic"><span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span></span>
          </Link>
        </div>

        {/* Center Editorial Showcase & Timeline Infographic */}
        <div className="my-auto space-y-8 max-w-lg z-10">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight font-serif-anthropic text-text-primary">
              Autonomous website verification and AI-backed bug reporting.
            </h1>
            <p className="text-xs text-text-secondary leading-relaxed">
              One secure workspace for browser regression, automated form validation, and evidence compiles.
            </p>
          </div>

          {/* Interactive Visual Infographic */}
          <div className="border border-border-subtle bg-bg-app/40 rounded-2xl p-6 relative overflow-hidden space-y-4 shadow-2xs group hover:border-accent-primary/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent-primary/5 blur-2xl pointer-events-none" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <Sparkles size={11} className="text-accent-primary animate-pulse" />
              <span>ShipCheck Lifecycle Engine</span>
            </h4>

            <div className="relative pl-6 border-l border-border-subtle/80 space-y-6 text-left">
              {/* Node 1 */}
              <div className={`relative transition-all duration-500 ${activeInfoIdx === 0 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`absolute -left-[32.5px] top-0.5 w-4 h-4 rounded-full bg-bg-card border transition-all duration-500 flex items-center justify-center ${activeInfoIdx === 0 ? 'border-accent-primary bg-accent-glow scale-110 shadow-xs' : 'border-border-subtle'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeInfoIdx === 0 ? 'bg-accent-primary' : 'bg-text-secondary/30'}`} />
                </div>
                <h5 className={`text-[11px] font-bold uppercase tracking-wide transition-colors duration-500 ${activeInfoIdx === 0 ? 'text-accent-primary' : 'text-text-primary'}`}>
                  1. Plan Generation
                </h5>
                <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                  OpenAI models convert natural language tasks (e.g. &quot;submit contact form&quot;) into structured browser steps.
                </p>
              </div>

              {/* Node 2 */}
              <div className={`relative transition-all duration-500 ${activeInfoIdx === 1 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`absolute -left-[32.5px] top-0.5 w-4 h-4 rounded-full bg-bg-card border transition-all duration-500 flex items-center justify-center ${activeInfoIdx === 1 ? 'border-accent-primary bg-accent-glow scale-110 shadow-xs' : 'border-border-subtle'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeInfoIdx === 1 ? 'bg-accent-primary' : 'bg-text-secondary/30'}`} />
                </div>
                <h5 className={`text-[11px] font-bold uppercase tracking-wide transition-colors duration-500 ${activeInfoIdx === 1 ? 'text-accent-primary' : 'text-text-primary'}`}>
                  2. Playwright Run
                </h5>
                <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                  Automated Playwright runner opens Chromium, executes clicks and inputs, and collects page screenshots.
                </p>
              </div>

              {/* Node 3 */}
              <div className={`relative transition-all duration-500 ${activeInfoIdx === 2 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`absolute -left-[32.5px] top-0.5 w-4 h-4 rounded-full bg-bg-card border transition-all duration-500 flex items-center justify-center ${activeInfoIdx === 2 ? 'border-accent-primary bg-accent-glow scale-110 shadow-xs' : 'border-border-subtle'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeInfoIdx === 2 ? 'bg-accent-primary' : 'bg-text-secondary/30'}`} />
                </div>
                <h5 className={`text-[11px] font-bold uppercase tracking-wide transition-colors duration-500 ${activeInfoIdx === 2 ? 'text-accent-primary' : 'text-text-primary'}`}>
                  3. Bug Analysis
                </h5>
                <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                  AI compares execution screenshots and console logs to expected results to compile bug reports.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Brand Label */}
        <div className="text-[10px] text-text-secondary/70 font-medium z-10 flex items-center gap-1.5" suppressHydrationWarning>
          <div className="w-5 h-5 rounded-md bg-accent-glow border border-border-subtle flex items-center justify-center font-bold text-[8px] font-serif-anthropic text-accent-primary">SC</div>
          <span>&copy; {new Date().getFullYear()} <span className="font-serif-anthropic font-bold"><span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span></span> Workspace. All rights reserved.</span>
        </div>
      </div>

      {/* Right Column: Authentication Card Form */}
      <div className="relative p-8 sm:p-12 md:p-20 flex flex-col justify-center items-center bg-bg-app border-l border-border-subtle/20">

        {/* Top-Right Toggle & Actions */}
        <div className="absolute top-8 left-8 right-8 flex items-center justify-between md:justify-end z-10">
          {/* Mobile Logo Link */}
          <Link href="/" className="md:hidden flex items-center gap-2 active:scale-95 transition">
            <div className="w-8 h-8 rounded-lg bg-accent-glow border border-border-subtle flex items-center justify-center font-bold text-xs font-serif-anthropic text-accent-primary">SC</div>
            <span className="font-bold text-lg tracking-tight font-serif-anthropic"><span className="text-black dark:text-white">Ship</span><span className="text-accent-primary">Check</span></span>
          </Link>

          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm space-y-6 animate-fade-in-up">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary font-serif-anthropic">
              {isResetPassword
                ? 'Update your password'
                : isForgotPassword
                  ? 'Reset your password'
                  : isLogin
                    ? 'Welcome back'
                    : 'Create your account'}
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              {isResetPassword
                ? 'Enter a new strong password for your workspace.'
                : isForgotPassword
                  ? 'Enter your work email and we will send a recovery link.'
                  : isLogin
                    ? 'Sign in to your ShipCheck workspace.'
                    : 'Start building securely with ShipCheck.'}
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

            {/* Conditional Fields: First and Last Name for Sign Up */}
            {!isLogin && !isForgotPassword && !isResetPassword && (
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
            )}

            {/* Email Field: Rendered unless we are resetting password */}
            {!isResetPassword && (
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
            )}

            {/* Password Field: Rendered for Login, Register, and Reset Password states */}
            {!isForgotPassword && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                    {isResetPassword ? 'New password' : 'Password'}
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-[9px] font-semibold text-text-secondary hover:text-text-primary transition duration-200 cursor-pointer animate-pulse"
                    >
                      Forgot password?
                    </button>
                  )}
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
            )}

            {/* Checkbox Options */}
            {!isForgotPassword && !isResetPassword && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="checkbox-options"
                  type="checkbox"
                  required={!isLogin}
                  defaultChecked={isLogin}
                  className="w-3.5 h-3.5 rounded border border-border-subtle text-accent-primary focus:ring-0 accent-accent-primary cursor-pointer"
                />
                <label htmlFor="checkbox-options" className="text-[11px] text-text-secondary select-none cursor-pointer">
                  {isLogin ? 'Keep me signed in for 30 days' : 'I agree to the Terms of Service and Privacy Policy'}
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 font-bold text-white bg-accent-primary hover:bg-accent-primary/95 rounded-xl shadow-xs active:scale-98 disabled:opacity-40 transition text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isResetPassword ? (
                <span>Update password</span>
              ) : isForgotPassword ? (
                <span>Send reset link</span>
              ) : isLogin ? (
                <span>Sign in</span>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs">
            {isResetPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsResetPassword(false);
                  setIsLogin(true);
                  setError(null);
                  setSuccess(null);
                  router.replace('/auth');
                }}
                className="font-bold text-text-primary hover:underline cursor-pointer"
              >
                Back to sign in
              </button>
            ) : isForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="font-bold text-text-primary hover:underline cursor-pointer"
              >
                Back to sign in
              </button>
            ) : (
              <>
                <span className="text-text-secondary">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="font-bold text-text-primary hover:underline cursor-pointer"
                >
                  {isLogin ? 'Create one' : 'Sign in'}
                </button>
              </>
            )}
          </div>
        </div>

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
