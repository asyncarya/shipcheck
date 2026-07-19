'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StepTimeline from '@/components/StepTimeline';
import ScreenshotViewer from '@/components/ScreenshotViewer';
import ConsoleErrors from '@/components/ConsoleErrors';
import BugReport from '@/components/BugReport';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { TestRun, BugReport as BugReportType } from '@/lib/schemas';

import RunnerHeader from '@/components/runner/RunnerHeader';
import RunnerTaskDetails from '@/components/runner/RunnerTaskDetails';
import RunnerResultsModal from '@/components/runner/RunnerResultsModal';

interface RunPageProps {
  params: Promise<{ runId: string }>;
}

export default function RunPage({ params }: RunPageProps) {
  const router = useRouter();
  const { runId } = use(params);
  
  const [run, setRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [bugReport, setBugReport] = useState<BugReportType | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'steps' | 'analysis' | 'console'>('steps');
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
        const contentType = res.headers.get('content-type');
        const isJson = contentType && contentType.indexOf('application/json') !== -1;

        if (!res.ok) {
          if (isJson) {
            const errData = await res.json();
            throw new Error(errData.error?.message || 'Failed to fetch run data.');
          } else {
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
        }

        if (!isJson) {
          throw new Error('Received unexpected non-JSON response from server.');
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
      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.indexOf('application/json') !== -1;

      if (!res.ok) {
        if (isJson) {
          const data = await res.json();
          throw new Error(data.error?.message || 'Failed to re-run test.');
        } else {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
      }

      if (!isJson) {
        throw new Error('Received unexpected non-JSON response from server.');
      }

      const data = await res.json();
      router.push(`/dashboard/${data.run.id}`);
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
            href="/dashboard"
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

  return (
    <div className="min-h-screen bg-bg-app text-text-primary flex flex-col overflow-x-hidden selection:bg-accent-primary/10 selection:text-accent-primary pb-12">
      <RunnerHeader
        run={run}
        isFinished={isFinished}
        isRunning={isRunning}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        setModalTab={setModalTab}
        setIsModalOpen={setIsModalOpen}
        handleRetry={handleRetry}
      />

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
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 z-10 min-h-0">
        {/* Main Grid content */}
        <main className="flex-1 grid lg:grid-cols-12 gap-8 min-w-0">
          
          {/* Left Hand: Steps & Logs (4 cols) */}
          <div className="lg:col-span-4 space-y-6 min-w-0">
            <RunnerTaskDetails run={run} />

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
          <div className="lg:col-span-8 min-w-0">
            {/* Screenshot viewer representing active / failing step */}
            <ScreenshotViewer
              screenshotPath={previewScreenshot}
              stepDescription={previewDescription}
              currentUrl={previewUrl}
              isLive={isLivePreviewActive}
            />
          </div>

          {/* Console Error output (Full-Width, 12 cols) */}
          <div className="lg:col-span-12 min-w-0">
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

      <RunnerResultsModal
        run={run}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalTab={modalTab}
        setModalTab={setModalTab}
        bugReport={bugReport}
        analyzing={analyzing}
        triggerAnalysis={triggerAnalysis}
        selectedStepId={selectedStepId}
        setSelectedStepId={setSelectedStepId}
      />
    </div>
  );
}
