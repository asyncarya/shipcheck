import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { TestRun, BugReport as BugReportType } from '@/lib/schemas';
import SeverityBadge from '@/components/SeverityBadge';
import StepTimeline from '@/components/StepTimeline';
import BugReport from '@/components/BugReport';
import ConsoleAnalysisView from '@/components/ConsoleAnalysisView';

interface RunnerResultsModalProps {
  run: TestRun;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  modalTab: 'steps' | 'analysis' | 'console';
  setModalTab: (tab: 'steps' | 'analysis' | 'console') => void;
  bugReport: BugReportType | null;
  analyzing: boolean;
  triggerAnalysis: () => void;
  selectedStepId: string | null;
  setSelectedStepId: (id: string | null) => void;
}

export default function RunnerResultsModal({
  run,
  isModalOpen,
  setIsModalOpen,
  modalTab,
  setModalTab,
  bugReport,
  analyzing,
  triggerAnalysis,
  selectedStepId,
  setSelectedStepId,
}: RunnerResultsModalProps) {
  if (!isModalOpen) return null;

  return (
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
          <button
            type="button"
            onClick={() => setModalTab('console')}
            className={`px-4.5 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              modalTab === 'console'
                ? 'bg-bg-card text-accent-primary border border-border-subtle shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Console Diagnostics
          </button>
        </div>
        
        {/* Modal Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {modalTab === 'steps' && (
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
          )}

          {modalTab === 'analysis' && (
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

          {modalTab === 'console' && (
            <div className="space-y-4">
              <ConsoleAnalysisView 
                analysis={bugReport?.consoleAnalysis}
                consoleErrors={run.consoleErrors}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
