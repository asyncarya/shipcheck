'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { createClient, hasSupabase } from '@/lib/supabase';
import { 
  ArrowRight, Shield, Play, Terminal, Cpu, CheckCircle2, 
  XCircle, Monitor, Radio, Sparkles, AlertTriangle
} from 'lucide-react';

// Steps list for our live homepage simulator loop
const SIMULATOR_STEPS = [
  { id: '1', action: 'navigate', desc: 'Open contact form page', target: '/demo-site/contact' },
  { id: '2', action: 'fill', desc: 'Fill name input with "QA Bot"', target: 'Name' },
  { id: '3', action: 'fill', desc: 'Fill email input with "bot@qa.com"', target: 'Email' },
  { id: '4', action: 'click', desc: 'Click "Submit" form button', target: 'Submit' },
  { id: '5', action: 'verify', desc: 'Verify "Message sent successfully"', target: 'Success Message' }
];

export default function Home() {
  // Spotlight Hover Position
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Supabase Auth Integration State
  const [user, setUser] = useState<any>(null);
  const [hasKeys, setHasKeys] = useState(false);

  useEffect(() => {
    setHasKeys(hasSupabase());
    if (hasSupabase()) {
      const client = createClient();
      if (client) {
        // Initial session check
        client.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
        });

        // Listen for changes in session state
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
      }
    }
  }, []);

  // Simulator State Machine
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<('pending' | 'running' | 'passed' | 'failed')[]>([
    'running', 'pending', 'pending', 'pending', 'pending'
  ]);
  const [browserUrl, setBrowserUrl] = useState('about:blank');
  const [browserInputs, setBrowserInputs] = useState({ name: '', email: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Scroll Progress Tracking State
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for Specifications Section
  const [specsVisible, setSpecsVisible] = useState(false);
  const specsRef = React.useRef<HTMLDivElement>(null);

  // Intersection Observer for Features Section
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = React.useRef<HTMLDivElement>(null);

  // Intersection Observer for CTA Section
  const [ctaVisible, setCtaVisible] = useState(false);
  const ctaRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCtaVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ctaRef.current) {
      observer.observe(ctaRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFeaturesVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }
    return () => observer.disconnect();
  }, []);

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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSpecsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (specsRef.current) {
      observer.observe(specsRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Mouse Spotlight Tracker
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

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
    <div 
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative min-h-screen bg-bg-app text-text-primary flex flex-col items-center justify-between overflow-x-hidden selection:bg-accent-primary/10 selection:text-accent-primary font-sans transition-all duration-300"
    >
      
      {/* Scroll Progress Bar Indicator */}
      <div 
        className="fixed top-0 left-0 h-[2px] bg-accent-primary z-50 transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />
      
      {/* Dynamic Radial Spotlight */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out z-0 hidden md:block"
          style={{
            background: `radial-gradient(550px circle at ${mouseCoords.x}px ${mouseCoords.y}px, rgba(217, 119, 6, 0.025), transparent 80%)`
          }}
        />
      )}

      {/* Editorial Decorative Grid Lines */}
      <div className="absolute inset-y-0 left-1/4 w-[1px] bg-border-subtle/30 pointer-events-none hidden md:block" />
      <div className="absolute inset-y-0 right-1/4 w-[1px] bg-border-subtle/30 pointer-events-none hidden md:block" />

      {/* Zero Gravity Drifting Background Blobs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none z-0 animate-drift1" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none z-0 animate-drift2" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10 border-b border-border-subtle/40">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ShipCheck Logo" className="w-8 h-8 rounded-lg object-cover bg-accent-glow border border-border-subtle" />
          <span className="font-bold text-lg tracking-tight font-serif-anthropic text-text-primary">ShipCheck</span>
          <span className="text-[10px] uppercase font-bold border border-border-subtle bg-bg-card text-text-secondary px-2 py-0.5 rounded-full tracking-wide">MVP</span>
        </div>
        <div className="flex items-center gap-3">
          {!hasKeys ? (
            // Sandbox mode
            <Link 
              href="/test/new" 
              className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition duration-200 border border-border-subtle bg-bg-card/50 px-3.5 py-1.5 rounded-lg active:scale-95 shadow-2xs"
            >
              <span>Dashboard</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
          ) : user ? (
            // Logged in
            <>
              <span className="text-[10px] text-text-secondary font-mono hidden sm:inline">{user.email}</span>
              <button
                type="button"
                onClick={async () => {
                  const client = createClient();
                  if (client) {
                    await client.auth.signOut();
                  }
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-red-500 transition duration-200 cursor-pointer"
              >
                Sign Out
              </button>
              <Link 
                href="/test/new" 
                className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition duration-200 border border-border-subtle bg-bg-card/50 px-3.5 py-1.5 rounded-lg active:scale-95 shadow-2xs"
              >
                <span>Dashboard</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
            </>
          ) : (
            // Logged out
            <Link 
              href="/auth" 
              className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition duration-200 border border-border-subtle bg-bg-card/50 px-3.5 py-1.5 rounded-lg active:scale-95 shadow-2xs"
            >
              <span>Get started</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-6 pt-20 pb-8 z-10 flex flex-col items-center">
        
        {/* Centered Typography Details */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border border-border-subtle bg-bg-card text-accent-primary shadow-xs animate-fade-in-up animation-delay-100">
            <Sparkles size={11} className="text-accent-primary animate-pulse" />
            <span>Automated Web Verification</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight font-serif-anthropic text-text-primary text-center animate-fade-in-up animation-delay-200">
            Describe a user flow.<br />
            Get <span className="text-accent-primary font-serif-anthropic italic font-normal">complete browser tests</span> & bug reports.
          </h1>

          <p className="text-base sm:text-md text-text-secondary leading-relaxed max-w-xl mx-auto text-center animate-fade-in-up animation-delay-300">
            Give ShipCheck a public URL and a natural language goal. Our AI agent plans execution steps, triggers automated Playwright tests, captures full evidence, and drafts structured bug reports instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 animate-fade-in-up animation-delay-400">
            <Link
              href={hasKeys && !user ? "/auth" : "/test/new"}
              className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-9 py-4 font-bold text-white bg-accent-primary hover:bg-accent-primary/95 active:scale-95 rounded-xl shadow-xs transition duration-200 cursor-pointer"
            >
              <span>Launch Playground</span>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
            <a
              href="#simulator"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary border border-border-subtle rounded-xl bg-bg-card/40 transition active:scale-95"
            >
              See simulator
            </a>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-text-secondary/80 font-medium animate-fade-in-up animation-delay-500">
            <Shield size={12} className="text-emerald-500" />
            <span>Zero configuration sandbox environment</span>
          </div>
        </div>

      </section>

      {/* Simulator Section */}
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
                      className={`w-full py-2.5 text-xs font-bold text-white rounded-lg transition duration-200 ${
                        isSubmitted ? 'bg-accent-primary/80 animate-pulse' : 'bg-accent-primary'
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
              
              <div ref={stepsContainerRef} className="flex-1 overflow-y-auto space-y-2">
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
              <div ref={consoleContainerRef} className="flex-1 overflow-y-auto space-y-1.5 text-text-secondary/80 select-none">
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

      {/* Tech Specifications Outline Section */}
      <section ref={specsRef} className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-border-subtle/50 z-10 overflow-hidden">
        <div className={`flex flex-col md:flex-row md:items-start justify-between gap-8 transition-all duration-1000 ease-out transform ${specsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="max-w-md space-y-3">
            <span className="text-[11px] uppercase tracking-wider font-bold text-accent-primary font-mono bg-accent-glow px-2.5 py-1 rounded-full">Specifications</span>
            <h2 className="text-3xl font-bold font-serif-anthropic text-text-primary">Reliable end-to-end browser assertions</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              ShipCheck strictly validates steps and asserts outcomes without complex configuration pipelines or brittle selectors.
            </p>
          </div>

          <div className="flex-1 w-full border border-border-subtle rounded-2xl bg-bg-card/30 overflow-hidden font-mono text-xs select-none">
            <div className="grid grid-cols-12 border-b border-border-subtle bg-bg-card/50 p-4 font-bold text-text-primary uppercase tracking-wider text-[10px]">
              <span className="col-span-4">Capability</span>
              <span className="col-span-8">Description</span>
            </div>
            
            <div className={`grid grid-cols-12 border-b border-border-subtle/60 p-4 text-text-secondary transition-all duration-700 delay-100 transform ${specsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="col-span-4 font-bold text-text-primary">Browser Isolation</span>
              <span className="col-span-8">Isolated server-side Chromium instances running headless Playwright protocols.</span>
            </div>
            <div className={`grid grid-cols-12 border-b border-border-subtle/60 p-4 text-text-secondary transition-all duration-700 delay-200 transform ${specsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="col-span-4 font-bold text-text-primary">Step Fallbacks</span>
              <span className="col-span-8">Automatic database local fallbacks checking configurations before writing to Supabase.</span>
            </div>
            <div className={`grid grid-cols-12 border-b border-border-subtle/60 p-4 text-text-secondary transition-all duration-700 delay-300 transform ${specsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="col-span-4 font-bold text-text-primary">Evidence Capture</span>
              <span className="col-span-8">Detailed execution timelines recording step status, duration, address URLs, and screens.</span>
            </div>
            <div className={`grid grid-cols-12 p-4 text-text-secondary transition-all duration-700 delay-400 transform ${specsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="col-span-4 font-bold text-text-primary">Root Cause Prompts</span>
              <span className="col-span-8">Structured OpenAI analysis identifying bug hypotheses, warnings, and code solutions.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Features */}
      <section ref={featuresRef} className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-border-subtle/50 grid md:grid-cols-3 gap-8 z-10 overflow-hidden">
        <div className={`p-8 bg-bg-card border border-border-subtle rounded-2xl hover:border-accent-primary/35 hover:-translate-y-2 hover:shadow-md transition-all duration-500 space-y-4 group transform ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-center text-accent-primary shadow-xs group-hover:bg-accent-glow transition duration-300">
            <Terminal size={18} className="group-hover:scale-110 transition-transform duration-200" />
          </div>
          <h3 className="text-lg font-bold text-text-primary font-serif-anthropic">1. Structured Setup</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Enter a public target URL, type down the test goal in natural language (e.g., submit contact form), and establish expected outcomes instantly.
          </p>
        </div>

        <div className={`p-8 bg-bg-card border border-border-subtle rounded-2xl hover:border-accent-primary/35 hover:-translate-y-2 hover:shadow-md transition-all duration-500 delay-100 space-y-4 group transform ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-center text-accent-primary shadow-xs group-hover:bg-accent-glow transition duration-300">
            <Play size={18} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </div>
          <h3 className="text-lg font-bold text-text-primary font-serif-anthropic">2. Automated Playwright Runs</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            The background runner spawns Chromium instances, translates plans to structured actions, logs screenshots at each step, and gathers page console errors.
          </p>
        </div>

        <div className={`p-8 bg-bg-card border border-border-subtle rounded-2xl hover:border-accent-primary/35 hover:-translate-y-2 hover:shadow-md transition-all duration-500 delay-200 space-y-4 group transform ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-center text-accent-primary shadow-xs group-hover:bg-accent-glow transition duration-300">
            <Cpu size={18} className="group-hover:rotate-12 transition-transform duration-200" />
          </div>
          <h3 className="text-lg font-bold text-text-primary font-serif-anthropic">3. Evidence Analyzer</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            AI evaluates step statuses, screenshots, and terminal log files to compile structured reports outlining error root causes and suggested code actions.
          </p>
        </div>
      </section>

      {/* Interactive CTA Banner */}
      <section ref={ctaRef} className={`w-full max-w-7xl mx-auto px-6 py-16 z-10 transition-all duration-1000 ease-out transform ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="bg-bg-card border border-border-subtle rounded-3xl p-12 text-center space-y-6 relative overflow-hidden shadow-xs group hover:border-accent-primary/20 transition-all duration-300">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          
          <h2 className="text-3xl font-bold font-serif-anthropic text-text-primary">Ready to verify your web forms?</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
            Create custom plans for your public demo sites, execute live automated flows, and inspect generated bug reports.
          </p>
          <div className="pt-2">
            <Link
              href={hasKeys && !user ? "/auth" : "/test/new"}
              className="inline-flex items-center gap-2 px-9 py-4 font-bold text-white bg-accent-primary hover:bg-accent-primary/95 active:scale-95 rounded-xl shadow-xs transition duration-200 cursor-pointer group/btn"
            >
              <span>Get started free</span>
              <ArrowRight size={15} className="group-hover/btn:translate-x-0.5 transition-transform duration-200" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-border-subtle bg-bg-card/30 pt-16 pb-8 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          {/* Top Footer Columns */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 text-left">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="ShipCheck Logo" className="w-6 h-6 rounded-md object-cover bg-accent-glow border border-border-subtle" />
                <span className="font-bold text-md tracking-tight font-serif-anthropic text-text-primary">ShipCheck</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed max-w-xs">
                AI-powered web verification engine translating natural language test intents to structured Playwright scenarios.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Navigation</h4>
              <ul className="space-y-1.5 text-xs text-text-secondary">
                <li><Link href="/test/new" className="hover:text-text-primary transition-colors link-underline">Test Playground</Link></li>
                <li><a href="#simulator" className="hover:text-text-primary transition-colors link-underline">QA Simulator</a></li>
                <li><Link href="/auth" className="hover:text-text-primary transition-colors link-underline">Developer Portal</Link></li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Architecture</h4>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Chromium Sandbox isolation engine executing with custom OpenAI analysis models for instant bug reports.
              </p>
            </div>
          </div>

          {/* Large Typographic Display Title (Awwwards Style) */}
          <div className="w-full border-t border-border-subtle/50 pt-8 select-none overflow-hidden flex flex-col items-center justify-center">
            <h1 className="text-[14vw] font-black tracking-tighter leading-none text-center select-none uppercase font-sans cursor-default stroke-text">
              ShipCheck
            </h1>
            
            <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary/50 mt-6 text-center" suppressHydrationWarning>
              &copy; {new Date().getFullYear()} ShipCheck. Built for the AI Hackathon.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
