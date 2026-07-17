'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StepTimeline from '@/components/StepTimeline';
import ScreenshotViewer from '@/components/ScreenshotViewer';
import ConsoleErrors from '@/components/ConsoleErrors';
import BugReport from '@/components/BugReport';
import SeverityBadge from '@/components/SeverityBadge';
import ThemeToggle from '@/components/ThemeToggle';
import { ArrowLeft, RefreshCw, Play, AlertCircle, Loader2, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { TestRun, BugReport as BugReportType } from '@/lib/schemas';

interface RunPageProps {
  params: Promise<{ runId: string }>;
}

export default function RunPage({ params }: RunPageProps) {
  const router = useRouter();
  const { runId } = use(params);
  
  const [run, setRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [bugReport, setBugReport] = useState<BugReportType | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'steps' | 'analysis'>('steps');
  const [hasOpenedModal, setHasOpenedModal] = useState(false);

  const triggerAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/runs/${runId}/analyze`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setBugReport(data.bugReport);
      } else {
        console.error('AI analysis failed.');
      }
    } catch (e) {
      console.error('Error during bug analysis trigger:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  // Poll for run updates
  useEffect(() => {
    let pollInterval: any = null;

    const fetchRunStatus = async () => {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || 'Failed to fetch run data.');
        }

        const data = await res.json();
        const currentRun = data.run as TestRun;
        if (currentRun.latestScreenshotPath) {
          currentRun.latestScreenshotPath = `${currentRun.latestScreenshotPath}?t=${Date.now()}`;
        }
        setRun(currentRun);
        setLoading(false);

        // Auto-select the first failed step, or running step, or last step
        if (!selectedStepId) {
          const runningStep = currentRun.steps.find((s) => s.status === 'running');
          const failedStep = currentRun.steps.find((s) => s.status === 'failed');
          const passedSteps = currentRun.steps.filter((s) => s.status === 'passed');
          
          if (failedStep) {
            setSelectedStepId(failedStep.stepId);
          } else if (runningStep) {
            setSelectedStepId(runningStep.stepId);
          } else if (passedSteps.length > 0) {
            setSelectedStepId(passedSteps[passedSteps.length - 1].stepId);
          }
        }

        const activeState = ['created', 'planning', 'running'].includes(currentRun.status);

        if (!activeState) {
          // Execution is done, clear polling
          if (pollInterval) {
            clearInterval(pollInterval);
          }
          
          // Trigger analysis if it hasn't been fetched yet
          if (currentRun.bugReport) {
            setBugReport(currentRun.bugReport);
          } else {
            triggerAnalysis();
          }
        }
      } catch (err: any) {
        console.error('Error fetching run:', err);
        setError(err.message || 'Error occurred while loading test run.');
        setLoading(false);
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      }
    };

    fetchRunStatus();
    
    // Poll every 700ms while run is running to stream live screenshots
    pollInterval = setInterval(fetchRunStatus, 700);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [runId, selectedStepId]);

  // Trigger Results Modal on completion
  useEffect(() => {
    if (run && ['passed', 'failed'].includes(run.status)) {
      if (!hasOpenedModal) {
        setIsModalOpen(true);
        setHasOpenedModal(true);
        // Also auto-fetch AI bug analysis report if the test failed
        if (run.status === 'failed' && !bugReport && !analyzing) {
          triggerAnalysis();
        }
      }
    }
  }, [run?.status, hasOpenedModal, bugReport, analyzing]);

  const handleRetry = async () => {
    if (!run || !run.planId) return;
    setLoading(true);
    setBugReport(null);
    setSelectedStepId(null);
    setError(null);
    setHasOpenedModal(false);
    setIsModalOpen(false);

    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: run.url, planId: run.planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to re-run test.');
      }
      router.push(`/test/${data.run.id}`);
    } catch (e: any) {
      setError(e.message || 'Error launching test retry.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center text-text-secondary space-y-4">
        <Loader2 size={36} className="animate-spin text-accent-primary" />
        <p className="text-sm font-semibold animate-pulse">Retrieving test run details...</p>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center text-text-secondary p-6">
        <div className="max-w-md text-center space-y-6">
          <AlertCircle size={48} className="mx-auto text-red-500/80" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-primary font-serif-anthropic">Unable to load test</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {error || 'The requested test run does not exist or has expired.'}
            </p>
          </div>
          <Link
            href="/test/new"
            className="inline-flex items-center gap-1.5 px-6 py-3 font-semibold text-white bg-accent-primary hover:bg-accent-primary/80 rounded-xl transition cursor-pointer shadow-sm"
          >
            <span>Launch new test</span>
          </Link>
        </div>
      </div>
    );
  }

  const isRunning = ['created', 'planning', 'running'].includes(run.status);
  const isFinished = !isRunning;

  // Compute preview properties (handles live streaming vs static steps)
  const activeStepResult = run.steps.find((s) => s.status === 'running');
  const activeStep = run.plan?.steps.find((s) => s.id === activeStepResult?.stepId);

  // Get screenshot info for the selected step
  const selectedStepResult = run.steps.find((s) => s.stepId === selectedStepId);
  const selectedStep = run.plan?.steps.find((s) => s.id === selectedStepId);

  // Live preview is active if the run is active AND the user hasn't selected a step that already has a screenshot
  const isLivePreviewActive = isRunning && (!selectedStepResult || !selectedStepResult.screenshotPath || selectedStepResult.status === 'running');

  const previewScreenshot = isLivePreviewActive
    ? (run.latestScreenshotPath || null)
    : (selectedStepResult?.screenshotPath || null);

  const previewUrl = isLivePreviewActive
    ? (activeStepResult?.url || run.url)
    : (selectedStepResult?.url || run.url);

  const previewDescription = isLivePreviewActive
    ? (activeStep ? `Executing: ${activeStep.description}` : 'Test Automation Active')
    : (selectedStep?.description || null);

  const hasFailedSteps = run.steps.some((s) => s.status === 'failed' || s.status === 'timed_out');

  return (
    <div className="min-h-screen bg-bg-app text-text-primary flex flex-col overflow-x-hidden selection:bg-accent-primary/10 selection:text-accent-primary pb-12">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <Link href="/test/new" className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-card border border-border-subtle rounded-xl transition" title="Back to Setup">
            <ArrowLeft size={16} />
          </Link>
          <ThemeToggle />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-text-primary font-serif-anthropic">Test Execution</h1>
              <span className="text-xs text-text-secondary font-mono">#{run.id}</span>
            </div>
            <p className="text-xs text-text-secondary truncate max-w-xs sm:max-w-md">{run.url}</p>
          </div>
        </div>

        {/* Status Indicators & Action buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border-subtle bg-bg-card text-xs font-semibold">
            {run.status === 'running' && (
              <>
                <Loader2 size={12} className="animate-spin text-accent-primary" />
                <span className="text-accent-primary">Executing steps ({run.progress}%)</span>
              </>
            )}
            {run.status === 'created' && <span className="text-blue-500">Queued</span>}
            {run.status === 'planning' && (
              <>
                <Sparkles size={12} className="text-accent-primary animate-pulse" />
                <span className="text-accent-primary">Planning test steps...</span>
              </>
            )}
            {run.status === 'passed' && (
              <>
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-emerald-500">Passed</span>
              </>
            )}
            {run.status === 'failed' && (
              <>
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-red-500 font-bold">Failed</span>
              </>
            )}
            {run.status === 'timed_out' && (
              <>
                <Clock size={12} className="text-amber-500" />
                <span className="text-amber-500">Timed Out</span>
              </>
            )}
            {run.status === 'error' && (
              <>
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-red-500">Runner Error</span>
              </>
            )}
          </div>

          {/* Result Overview Button (Blinks on complete) */}
          {isFinished && (
            <button
              onClick={() => {
                setModalTab('steps');
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 border border-transparent text-white font-bold rounded-xl text-xs active:scale-95 transition cursor-pointer shadow-sm animate-pulse"
            >
              See Results
            </button>
          )}

          {isFinished && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-4 py-2 bg-bg-card hover:bg-border-subtle border border-border-subtle text-text-primary rounded-xl text-xs font-semibold active:scale-95 transition cursor-pointer shadow-sm"
            >
              <RefreshCw size={12} />
              <span>Run again</span>
            </button>
          )}
        </div>
      </header>

      {/* Top glowing progress bar */}
      {isRunning && (
        <div className="w-full h-0.5 bg-bg-card overflow-hidden relative">
          <div 
            className="h-full bg-accent-primary transition-all duration-350" 
            style={{ width: `${run.progress}%` }} 
          />
        </div>
      )}

      {/* Main Panel Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 z-10 min-h-0">
        {/* Main Grid content */}
        <main className="flex-1 grid lg:grid-cols-12 gap-8 min-w-0">
          
          {/* Left Hand: Steps & Logs (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Test Task</h4>
                <p className="text-sm font-semibold text-text-primary font-serif-anthropic">{run.task}</p>
              </div>

              {run.expectedResult && (
                <div className="space-y-1 pt-3 border-t border-border-subtle">
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Expected Result</h4>
                  <p className="text-sm text-text-secondary">{run.expectedResult}</p>
                </div>
              )}
            </div>

            {/* Timeline of Steps */}
            {run.plan ? (
              <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-sm max-h-[400px] overflow-y-auto">
                <StepTimeline
                  steps={run.plan.steps}
                  stepResults={run.steps}
                  selectedStepId={selectedStepId}
                  onSelectStep={setSelectedStepId}
                />
              </div>
            ) : (
              <div className="p-8 text-center bg-bg-card border border-border-subtle rounded-2xl">
                <Loader2 size={24} className="mx-auto animate-spin text-text-secondary mb-2" />
                <p className="text-xs text-text-secondary font-medium">Generating structured steps...</p>
              </div>
            )}
          </div>

          {/* Right Hand: Visual screenshot (8 cols) */}
          <div className="lg:col-span-8">
            {/* Screenshot viewer representing active / failing step */}
            <ScreenshotViewer
              screenshotPath={previewScreenshot}
              stepDescription={previewDescription}
              currentUrl={previewUrl}
              isLive={isLivePreviewActive}
            />
          </div>

          {/* Console Error output (Full-Width, 12 cols) */}
          <div className="lg:col-span-12">
            <ConsoleErrors errors={run.consoleErrors} />
          </div>

          {/* AI Bug Analyzer Section (Full-Width, 12 cols) */}
          {isFinished && (
            <div className="lg:col-span-12 space-y-4">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-accent-primary" />
                <span>AI Bug Analysis</span>
              </h3>

              {analyzing ? (
                <div className="bg-bg-card border border-border-subtle rounded-2xl p-8 text-center space-y-4 flex flex-col items-center justify-center">
                  <div className="relative">
                    <Loader2 size={36} className="animate-spin text-accent-primary" />
                    <Sparkles size={16} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-accent-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-text-primary font-serif-anthropic">Analyzing browser execution logs...</p>
                    <p className="text-xs text-text-secondary max-w-sm">
                      We are reading failure screenshots, network requests, console logs, and expected behavior to write the report.
                    </p>
                  </div>
                </div>
              ) : bugReport ? (
                <BugReport report={bugReport} />
              ) : (
                <div className="p-6 bg-bg-card border border-border-subtle rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="text-text-secondary" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary font-serif-anthropic">No report compiled</p>
                      <p className="text-xs text-text-secondary">Analysis was not completed or returned empty details.</p>
                    </div>
                  </div>
                  <button
                    onClick={triggerAnalysis}
                    className="px-4 py-2 text-xs font-semibold bg-bg-app hover:bg-border-subtle border border-border-subtle text-text-primary rounded-lg cursor-pointer shadow-sm transition active:scale-95"
                  >
                    Generate Report
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Results Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-bg-card border border-border-subtle rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-border-subtle flex justify-between items-center bg-bg-card/60">
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider font-serif-anthropic">Test Execution Result</h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  run.status === 'passed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25' : 'bg-red-500/10 text-red-500 border border-red-500/25'
                }`}>
                  {run.status}
                </span>
                {run.status === 'failed' && bugReport && (
                  <SeverityBadge severity={bugReport.severity} />
                )}
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-primary hover:bg-border-subtle border border-border-subtle bg-bg-app px-3.5 py-1.5 rounded-xl transition cursor-pointer text-xs font-bold shadow-sm active:scale-95"
              >
                Close
              </button>
            </div>
            
            {/* Tabs Switcher */}
            <div className="flex border-b border-border-subtle bg-bg-app/40 p-1 px-4 gap-2">
              <button
                type="button"
                onClick={() => setModalTab('steps')}
                className={`px-4.5 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  modalTab === 'steps'
                    ? 'bg-bg-card text-accent-primary border border-border-subtle shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Execution Steps
              </button>
              <button
                type="button"
                onClick={() => setModalTab('analysis')}
                className={`px-4.5 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  modalTab === 'analysis'
                    ? 'bg-bg-card text-accent-primary border border-border-subtle shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                AI Bug Analysis
              </button>
            </div>
            
            {/* Modal Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalTab === 'steps' ? (
                <div className="space-y-4">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Click any completed step in the timeline to view its screen capture in the main dashboard background.
                  </p>
                  <StepTimeline
                    steps={run.plan?.steps || []}
                    stepResults={run.steps}
                    selectedStepId={selectedStepId}
                    onSelectStep={(id) => {
                      setSelectedStepId(id);
                      setIsModalOpen(false); // Close modal to show frame on background viewer
                    }}
                  />
                </div>
              ) : (
                /* Bug Report tab */
                <div className="space-y-4">
                  {analyzing ? (
                    <div className="p-12 text-center space-y-4 flex flex-col items-center justify-center">
                      <div className="relative">
                        <Loader2 size={32} className="animate-spin text-accent-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-text-primary font-serif-anthropic">Compiling AI Bug Report...</p>
                        <p className="text-xs text-text-secondary">Reading browser evidence and constructing recommendations.</p>
                      </div>
                    </div>
                  ) : bugReport ? (
                    <BugReport report={bugReport} />
                  ) : (
                    <div className="text-center p-12 space-y-4">
                      <AlertCircle size={32} className="mx-auto text-text-secondary/60" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-text-primary font-serif-anthropic">No report available yet</p>
                        <p className="text-xs text-text-secondary">Click the button below to analyze execution evidence.</p>
                      </div>
                      <button 
                        onClick={triggerAnalysis}
                        className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 border border-transparent text-white rounded-xl text-xs font-semibold hover:shadow transition cursor-pointer shadow-sm"
                      >
                        Generate Report
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
