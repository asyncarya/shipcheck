'use client';

import React from 'react';
import { CheckCircle2, XCircle, Loader2, Circle, Eye } from 'lucide-react';
import { TestStep, StepResult } from '@/lib/schemas';

interface StepTimelineProps {
  steps: TestStep[];
  stepResults: StepResult[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
}

export default function StepTimeline({
  steps,
  stepResults,
  selectedStepId,
  onSelectStep,
}: StepTimelineProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 font-serif-anthropic">
        Execution steps
      </h3>
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const result = stepResults.find((r) => r.stepId === step.id);
          const status = result?.status || 'pending';
          const duration = result?.durationMs;
          const isSelected = selectedStepId === step.id;

          // Determine status visual elements
          let StatusIcon = Circle;
          let iconColor = 'text-text-secondary/60';
          let borderStyle = 'border-border-subtle bg-bg-card/40';
          let textColor = 'text-text-secondary';

          if (status === 'running') {
            StatusIcon = Loader2;
            iconColor = 'text-accent-primary animate-spin';
            borderStyle = 'border-accent-primary/45 bg-accent-glow';
            textColor = 'text-text-primary font-medium';
          } else if (status === 'passed') {
            StatusIcon = CheckCircle2;
            iconColor = 'text-emerald-500';
            borderStyle = 'border-border-subtle hover:border-emerald-500/30 bg-bg-card/60';
            textColor = 'text-text-primary';
          } else if (status === 'failed') {
            StatusIcon = XCircle;
            iconColor = 'text-red-500';
            borderStyle = 'border-red-500/20 bg-red-500/5 hover:border-red-500/40';
            textColor = 'text-red-650 dark:text-red-400';
          } else if (status === 'timed_out') {
            StatusIcon = XCircle;
            iconColor = 'text-amber-500';
            borderStyle = 'border-amber-500/20 bg-amber-500/5';
            textColor = 'text-amber-700 dark:text-amber-400';
          } else if (status === 'skipped') {
            StatusIcon = Circle;
            iconColor = 'text-text-secondary/40';
            borderStyle = 'border-border-subtle opacity-50';
            textColor = 'text-text-secondary/70';
          }

          // Override for selected step
          if (isSelected) {
            borderStyle = 'border-accent-primary bg-accent-glow ring-1 ring-accent-primary/10';
          }

          const hasScreenshot = !!result?.screenshotPath;

          return (
            <div
              key={step.id}
              onClick={() => hasScreenshot && onSelectStep(step.id)}
              className={`flex items-center gap-3 justify-between p-3.5 border rounded-xl transition duration-150 min-w-0 ${borderStyle} ${
                hasScreenshot ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <StatusIcon size={18} className={`${iconColor} flex-shrink-0`} />
                <div className="min-w-0">
                  <p className={`text-sm ${textColor} break-words`}>{step.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono uppercase bg-bg-app text-text-secondary px-1.5 py-0.5 rounded border border-border-subtle">
                      {step.action}
                    </span>
                    {duration !== undefined && (
                      <span className="text-xs text-text-secondary/75">
                        {(duration / 1000).toFixed(2)}s
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {hasScreenshot && (
                <div className={`flex items-center gap-1.5 text-xs ${isSelected ? 'text-accent-primary font-medium' : 'text-text-secondary'}`}>
                  <Eye size={14} />
                  <span>Inspect</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
