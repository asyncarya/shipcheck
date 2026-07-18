'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal, ShieldAlert, Cpu } from 'lucide-react';

interface ConsoleAnalysisViewProps {
  analysis?: string;
  consoleErrors?: Array<{ type: string; text: string; timestamp: string }>;
}

export default function ConsoleAnalysisView({ analysis, consoleErrors = [] }: ConsoleAnalysisViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const parseBoldText = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-semibold text-text-primary">{part}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (md: string) => {
    const lines = md.split('\n');
    let insideCodeBlock = false;
    let codeBlockLines: string[] = [];

    return lines.map((line, idx) => {
      if (line.trim().startsWith('```')) {
        if (insideCodeBlock) {
          insideCodeBlock = false;
          const codeText = codeBlockLines.join('\n');
          codeBlockLines = [];
          return (
            <pre key={idx} className="bg-bg-app p-4 rounded-xl border border-border-subtle overflow-x-auto text-[11px] font-mono text-text-primary my-3">
              <code>{codeText}</code>
            </pre>
          );
        } else {
          insideCodeBlock = true;
          return null;
        }
      }

      if (insideCodeBlock) {
        codeBlockLines.push(line);
        return null;
      }

      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-bold uppercase tracking-wider text-text-primary mt-6 mb-2 flex items-center gap-1.5 font-serif-anthropic">
            <Cpu size={14} className="text-accent-primary" />
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-accent-primary mt-8 mb-3 font-serif-anthropic border-b border-border-subtle/40 pb-1">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-base font-bold text-accent-primary mt-10 mb-4 font-serif-anthropic">
            {line.replace('# ', '')}
          </h2>
        );
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="list-disc ml-5 text-xs text-text-secondary leading-relaxed mb-1.5">
            {parseBoldText(line.substring(2))}
          </li>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-xs text-text-secondary leading-relaxed mb-2.5">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  const getDiagnosticsSummary = () => {
    const counts = { js: 0, network: 0, security: 0, other: 0 };
    consoleErrors.forEach(err => {
      const type = err.type.toLowerCase();
      if (type.includes('page_error') || type.includes('error')) counts.js++;
      else if (type.includes('network') || type.includes('server')) counts.network++;
      else if (err.text.includes('Content-Security-Policy') || err.text.includes('CSP')) counts.security++;
      else counts.other++;
    });
    return counts;
  };

  const summary = getDiagnosticsSummary();

  return (
    <div className="space-y-6">
      {/* Diagnostics Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-app/40 rounded-xl p-3 border border-border-subtle flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
            <ShieldAlert size={16} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">JS Errors</p>
            <p className="text-sm font-bold text-text-primary">{summary.js}</p>
          </div>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3 border border-border-subtle flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Terminal size={16} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Network Errors</p>
            <p className="text-sm font-bold text-text-primary">{summary.network}</p>
          </div>
        </div>
        <div className="bg-bg-app/40 rounded-xl p-3 border border-border-subtle flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Terminal size={16} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">CSP Warnings</p>
            <p className="text-sm font-bold text-text-primary">{summary.security}</p>
          </div>
        </div>
      </div>

      {analysis ? (
        <div className="bg-bg-card rounded-xl border border-border-subtle overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-bg-app/20">
            <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Terminal size={12} className="text-accent-primary" />
              AI Console Analysis
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-app/60 rounded-lg transition cursor-pointer"
              title="Copy markdown report"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
          
          {/* Content panel */}
          <div className="p-5 font-sans-anthropic">
            {renderMarkdown(analysis)}
          </div>
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed border-border-subtle rounded-xl space-y-3 bg-bg-app/10">
          <Terminal size={24} className="mx-auto text-text-secondary/60 animate-pulse" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-text-primary font-serif-anthropic">Analyzing logs...</p>
            <p className="text-[10px] text-text-secondary">Generating AI diagnostic breakdown for console logs.</p>
          </div>
        </div>
      )}
    </div>
  );
}
