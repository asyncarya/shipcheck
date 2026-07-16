'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function DemoContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    // Retrieve 'bug' state from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const forceSuccess = params.get('bug') === 'false' || name.toLowerCase().includes('happypath');

    console.log(`[Form] Attempting form submission for: Name="${name}", Email="${email}"`);

    try {
      const response = await fetch('/api/demo-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, forceSuccess }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      const data = await response.json();
      setIsSuccess(true);
      setStatusMsg(data.message || 'Message sent successfully');
      setName('');
      setEmail('');
    } catch (err: any) {
      console.error('Error submitting form: Internal Server Error');
      // Force page level exception logging
      console.error(new Error('Submission failed with status 500'));
      
      setIsSuccess(false);
      setStatusMsg('An error occurred during submission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500/35">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex justify-between items-center">
        <Link href="/demo-site" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">A</span>
          <span className="font-bold text-base text-slate-200">Acme Corp</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/demo-site" className="text-slate-400 hover:text-slate-200">
            Home
          </Link>
          <span className="font-semibold text-indigo-400">Contact</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-md w-full mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="space-y-3 text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100">Get in Touch</h1>
          <p className="text-sm text-slate-400">We respond to inquiries in 24 business hours.</p>
        </div>

        {/* Contact Form */}
        <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl shadow-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-xs font-semibold text-slate-450 uppercase tracking-wider">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-semibold text-slate-450 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              id="submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-40 rounded-lg transition text-sm cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>

          {statusMsg && (
            <div
              id="status-message"
              className={`p-3 text-xs rounded-lg border text-center ${
                isSuccess
                  ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
                  : 'bg-red-950/20 border-red-900/40 text-red-400'
              }`}
            >
              {statusMsg}
            </div>
          )}
        </div>

        {/* Demo configuration helper info */}
        <div className="mt-8 p-3.5 bg-slate-950/50 border border-slate-850/40 rounded-xl text-[11px] text-slate-500 leading-relaxed text-center">
          <p>
            💡 <strong className="text-slate-400">Testing Helper</strong>: To test a passing flow, set Name to <code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded font-mono">HappyPath</code> or append <code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded font-mono">?bug=false</code> to the URL.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-5 border-t border-slate-800/50 text-[10px] text-slate-600 bg-slate-950">
        This is a sandbox company form designed to demonstrate error logging and bug analysis.
      </footer>
    </div>
  );
}
