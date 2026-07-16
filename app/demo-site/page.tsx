import React from 'react';
import Link from 'next/link';

export default function DemoSiteHome() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500/35">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">A</span>
          <span className="font-bold text-base text-slate-200">Acme Corp</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-slate-400 cursor-not-allowed">Features</span>
          <span className="text-slate-400 cursor-not-allowed">Pricing</span>
          <Link href="/demo-site/contact" className="font-semibold text-indigo-400 hover:text-indigo-300">
            Contact
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 flex flex-col justify-center items-center text-center space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-100">
          Modern Solutions for Modern Teams
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          Acme Corp provides automated integrations and state of the art pipeline orchestration. Integrate in under 5 minutes.
        </p>
        <div>
          <Link
            href="/demo-site/contact"
            className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition"
          >
            Get in Touch
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-800/50 text-xs text-slate-500 bg-slate-950">
        &copy; Acme Corp Demo Site. Intentionally built with bugs for testing.
      </footer>
    </div>
  );
}
