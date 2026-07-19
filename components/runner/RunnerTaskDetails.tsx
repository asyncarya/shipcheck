import React from 'react';
import { TestRun } from '@/lib/schemas';

interface RunnerTaskDetailsProps {
  run: TestRun;
}

export default function RunnerTaskDetails({ run }: RunnerTaskDetailsProps) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-sm space-y-4 min-w-0">
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Test Task</h4>
        <p className="text-sm font-semibold text-text-primary font-serif-anthropic break-words">{run.task}</p>
      </div>

      {run.expectedResult && (
        <div className="space-y-1 pt-3 border-t border-border-subtle">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Expected Result</h4>
          <p className="text-sm text-text-secondary break-words">{run.expectedResult}</p>
        </div>
      )}
    </div>
  );
}
