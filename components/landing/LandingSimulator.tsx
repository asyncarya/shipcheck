'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Radio, AlertTriangle, Terminal, CheckCircle2, XCircle } from 'lucide-react';

const SIMULATOR_STEPS = [
  { id: '1', action: 'navigate', desc: 'Open contact form page', target: '/demo-site/contact' },
  { id: '2', action: 'fill', desc: 'Fill name input with "QA Bot"', target: 'Name' },
  { id: '3', action: 'fill', desc: 'Fill email input with "bot@qa.com"', target: 'Email' },
  { id: '4', action: 'click', desc: 'Click "Submit" form button', target: 'Submit' },
  { id: '5', action: 'verify', desc: 'Verify "Message sent successfully"', target: 'Success Message' }
];

export default function LandingSimulator() {
  // Simulator State Machine
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<('pending' | 'running' | 'passed' | 'failed')[]>([
    'running', 'pending', 'pending', 'pending', 'pending'
  ]);
  const [browserUrl, setBrowserUrl] = useState('about:blank');
  const [browserInputs, setBrowserInputs] = useState({ name: '', email: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Timeline and Console Auto-Scroll Refs
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const consoleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll timeline container to center the active item
    if (stepsContainerRef.current) {
      const container = stepsContainerRef.current;
      const activeChild = container.children[currentStepIdx] as HTMLElement;
      if (activeChild) {
        container.scrollTo({
          top: activeChild.offsetTop - container.offsetTop - 12,
          behavior: 'smooth'
        });
      }
    }

    // Auto scroll console container to the bottom
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTo({
        top: consoleContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [currentStepIdx]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIdx((prevIdx) => {
        const nextIdx = (prevIdx + 1) % 6; // 6 states: 5 steps + 1 report screen

        // Reset state
        if (nextIdx === 0) {
          setStepStatuses(['running', 'pending', 'pending', 'pending', 'pending']);
          setBrowserUrl('about:blank');
          setBrowserInputs({ name: '', email: '' });
          setIsSubmitted(false);
          setShowReport(false);
          return 0;
        }

        const newStatuses = [...stepStatuses];

        if (nextIdx < 5) {
          // Mark previous as passed
          newStatuses[prevIdx] = 'passed';
          // Mark current as running
          newStatuses[nextIdx] = 'running';
          setStepStatuses(newStatuses);

          // Update simulated browser state
          if (nextIdx === 1) {
            setBrowserUrl('http://localhost:3000/demo-site/contact');
          } else if (nextIdx === 2) {
            setBrowserInputs(p => ({ ...p, name: 'QA Bot' }));
          } else if (nextIdx === 3) {
            setBrowserInputs(p => ({ ...p, email: 'bot@qa.com' }));
          } else if (nextIdx === 4) {
            setIsSubmitted(true);
          }
        } else if (nextIdx === 5) {
          // Step 5 fails due to simulated server bug
          newStatuses[4] = 'failed';
          setStepStatuses(newStatuses);
          setShowReport(true);
        }

        return nextIdx;
      });
    }, 2800);

    return () => clearInterval(timer);
  }, [stepStatuses]);

  return (
    <section id="simulator" className="w-full max-w-7xl mx-auto px-6 pt-10 pb-20 border-t border-border-subtle/50 z-10">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
        <span className="text-[11px] uppercase tracking-wider font-bold text-accent-primary font-mono bg-accent-glow px-2.5 py-1 rounded-full">Simulator Playground</span>
        <h2 className="text-3xl font-bold font-serif-anthropic text-text-primary">See the AI execution agent in action</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Below is a live rendering of the ShipCheck test runner navigating the target form, identifying console logs, capturing screenshots, and compiling reports.
        </p>
      </div>

      {/* Live Simulator Interface */}
      <div className="grid lg:grid-cols-12 gap-8 items-stretch">
        {/* Left panel: Simulated Browser (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-bg-card border border-border-subtle rounded-2xl overflow-hidden shadow-sm h-[530px]">
          {/* Browser Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-bg-app border-b border-border-subtle select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex-1 max-w-md mx-4 px-3 py-1 bg-bg-card border border-border-subtle/80 rounded-lg text-[10px] text-text-secondary font-mono truncate text-center flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
              <span>{browserUrl}</span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-accent-primary bg-accent-glow px-2 py-0.5 rounded-full flex items-center gap-1">
              <Radio size={9} className="animate-pulse" />
              <span>Simulated View</span>
            </span>
          </div>

          {/* Browser Window Body */}
          <div className="flex-1 bg-bg-app p-8 flex items-center justify-center relative overflow-hidden">
            {showReport ? (
              /* Report View */
              <div className="w-full max-w-lg bg-bg-card border border-red-500/20 rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wide">
                    High Severity
                  </span>
                  <span className="text-[9px] text-text-secondary font-mono ml-auto">Confidence: High</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-red-500" />
                    Contact form submission fails with 500
                  </h4>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Clicking submit on contact form triggers a backend database exception and fails validation check.
                  </p>
                </div>

                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg space-y-1 text-[10px] text-text-secondary">
                  <p><strong>Observed logs:</strong> [SERVER_ERROR] Response 500 from POST /api/demo-contact</p>
                </div>

                <div className="p-3 bg-accent-glow border border-accent-primary/20 rounded-lg space-y-1 text-[10px] text-text-primary">
                  <p><strong>Suggested Action Plan:</strong> Review backend route handling inside POST /api/demo-contact to prevent null reference errors on input validations.</p>
                </div>
              </div>
            ) : (
              /* Browser Form View */
              <div className="w-full max-w-md bg-bg-card border border-border-subtle rounded-xl p-6 shadow-xs space-y-4">
                <div className="border-b border-border-subtle pb-3">
                  <h3 className="text-sm font-bold font-serif-anthropic text-text-primary">Mock Target Website</h3>
                  <p className="text-[10px] text-text-secondary">Testing endpoint connection form</p>
                </div>

                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Name</label>
                    <input
                      type="text"
                      readOnly
                      value={browserInputs.name}
                      placeholder="Filling name field..."
                      className="w-full px-3 py-2 text-xs bg-bg-app border border-border-subtle rounded-lg text-text-primary font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Email address</label>
                    <input
                      type="text"
                      readOnly
                      value={browserInputs.email}
                      placeholder="Filling email field..."
                      className="w-full px-3 py-2 text-xs bg-bg-app border border-border-subtle rounded-lg text-text-primary font-mono focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled
                    className={`w-full py-2.5 text-xs font-bold text-white rounded-lg transition duration-200 ${isSubmitted ? 'bg-accent-primary/80 animate-pulse' : 'bg-accent-primary'
                      }`}
                  >
                    {isSubmitted ? 'Sending Request...' : 'Submit Message'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Active Step Tracker & Console Output (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-bg-card border border-border-subtle rounded-2xl p-6 shadow-sm h-[530px] justify-between overflow-hidden">
          {/* Step list Timeline */}
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Simulated Timeline</h4>

            <div ref={stepsContainerRef} className="flex-1 overflow-y-auto no-scrollbar space-y-2">
              {SIMULATOR_STEPS.map((step, idx) => {
                const status = stepStatuses[idx];

                let borderClass = 'border-border-subtle bg-bg-card';
                let icon = <span className="w-1.5 h-1.5 rounded-full bg-text-secondary/50" />;
                let textClass = 'text-text-secondary/60';

                if (status === 'running') {
                  borderClass = 'border-accent-primary bg-accent-glow';
                  icon = <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-ping" />;
                  textClass = 'text-text-primary font-medium';
                } else if (status === 'passed') {
                  borderClass = 'border-border-subtle bg-bg-app';
                  icon = <CheckCircle2 size={13} className="text-emerald-500" />;
                  textClass = 'text-text-secondary';
                } else if (status === 'failed') {
                  borderClass = 'border-red-500/20 bg-red-500/5';
                  icon = <XCircle size={13} className="text-red-500 animate-pulse" />;
                  textClass = 'text-red-650 dark:text-red-400 font-bold';
                }

                return (
                  <div key={step.id} className={`flex items-center justify-between p-3 border rounded-xl transition duration-300 ${borderClass}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 flex items-center justify-center">{icon}</div>
                      <div>
                        <p className={`text-xs ${textClass}`}>{step.desc}</p>
                        <span className="text-[9px] font-mono text-text-secondary/50 uppercase bg-bg-app border border-border-subtle/50 px-1 py-0.2 rounded mt-0.5 inline-block">
                          {step.action}
                        </span>
                      </div>
                    </div>

                    {status === 'passed' && <span className="text-[9px] text-text-secondary font-mono">0.4s</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulated Live Console logs */}
          <div className="border-t border-border-subtle/60 pt-4 mt-4 flex flex-col h-40 font-mono text-[10px]">
            <div className="pb-2 mb-2 flex items-center gap-2 text-text-secondary select-none">
              <Terminal size={12} className="text-accent-primary" />
              <span className="font-bold">Automator Console Output</span>
            </div>
            <div ref={consoleContainerRef} className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 text-text-secondary/80 select-none">
              {currentStepIdx >= 0 && <p className="text-text-secondary/40">&gt; Starting automated QA worker thread...</p>}
              {currentStepIdx >= 1 && <p className="text-emerald-500">&gt; [OK] Connection established with target URL</p>}
              {currentStepIdx >= 2 && <p className="text-text-secondary/60">&gt; [FILL] Injected string into Name input field</p>}
              {currentStepIdx >= 3 && <p className="text-text-secondary/60">&gt; [FILL] Injected string into Email input field</p>}
              {currentStepIdx >= 4 && <p className="text-text-secondary/60">&gt; [CLICK] Dispatching submit click event</p>}
              {currentStepIdx >= 5 && (
                <>
                  <p className="text-red-500 font-bold">&gt; [SERVER_ERROR] POST /api/demo-contact returned status code 500</p>
                  <p className="text-amber-500">&gt; [WARNING] Expected success banner is missing. Launching AI Analyzer...</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
