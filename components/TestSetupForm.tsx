'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateUrl } from '@/lib/urlValidation';
import { Play, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function TestSetupForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [task, setTask] = useState('');
  const [expectedResult, setExpectedResult] = useState('');

  const [urlError, setUrlError] = useState<string | undefined>(undefined);
  const [urlWarning, setUrlWarning] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!url) {
      setUrlError(undefined);
      setUrlWarning(undefined);
      return;
    }

    const { isValid, error, isWarning } = validateUrl(url);
    if (!isValid) {
      setUrlError(error);
      setUrlWarning(undefined);
    } else if (isWarning) {
      setUrlError(undefined);
      setUrlWarning(error);
    } else {
      setUrlError(undefined);
      setUrlWarning(undefined);
    }
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);

    const { isValid, error } = validateUrl(url);
    if (!isValid) {
      setUrlError(error);
      return;
    }

    if (!task.trim()) {
      setFormError('Task description is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create a test plan
      const planRes = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, task, expectedResult }),
      });

      const planContentType = planRes.headers.get('content-type');
      const isPlanJson = planContentType && planContentType.indexOf('application/json') !== -1;

      if (!planRes.ok) {
        if (isPlanJson) {
          const planData = await planRes.json();
          throw new Error(planData.error?.message || 'Failed to generate test plan.');
        } else {
          throw new Error(`Failed to generate test plan: Server returned ${planRes.status}`);
        }
      }

      if (!isPlanJson) {
        throw new Error('Received unexpected non-JSON response from server during planning.');
      }

      const planData = await planRes.json();
      if (planData.error) {
        throw new Error(planData.error?.message || 'Failed to generate test plan.');
      }

      const plan = planData.plan;

      // Step 2: Start a run using the generated plan
      const runRes = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, planId: plan.id }),
      });

      const runContentType = runRes.headers.get('content-type');
      const isRunJson = runContentType && runContentType.indexOf('application/json') !== -1;

      if (!runRes.ok) {
        if (isRunJson) {
          const runData = await runRes.json();
          throw new Error(runData.error?.message || 'Failed to initialize test run.');
        } else {
          throw new Error(`Failed to initialize test run: Server returned ${runRes.status}`);
        }
      }

      if (!isRunJson) {
        throw new Error('Received unexpected non-JSON response from server during run initialization.');
      }

      const runData = await runRes.json();
      if (runData.error) {
        throw new Error(runData.error?.message || 'Failed to initialize test run.');
      }

      const run = runData.run;
      router.push(`/dashboard/${run.id}`);

    } catch (err: any) {
      console.error('Error submitting form:', err);
      setFormError(err.message || 'An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || !!urlError || !url || !task.trim();

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-6">
      {/* Website URL */}
      <div className="space-y-2">
        <label htmlFor="url" className="block text-sm font-semibold text-text-primary">
          Target Website URL
        </label>
        <div className="relative rounded-xl shadow-xs">
          <input
            id="url"
            type="text"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSubmitting}
            placeholder="https://example.com"
            className={`w-full px-4 py-3 bg-bg-app border rounded-xl text-text-primary placeholder:text-text-secondary/40 placeholder:text-sm focus:outline-none focus:ring-1 transition duration-200 ${urlError
                ? 'border-red-500/40 focus:ring-red-500/20 focus:border-red-500'
                : urlWarning
                  ? 'border-amber-500/40 focus:ring-amber-500/20 focus:border-amber-500'
                  : 'border-border-subtle focus:border-accent-primary focus:ring-accent-primary/20'
              }`}
          />
        </div>

        {urlError && (
          <p className="flex items-center gap-1 text-xs text-red-400 mt-1.5 font-medium">
            <ShieldAlert size={13} />
            {urlError}
          </p>
        )}

        {urlWarning && (
          <p className="flex items-center gap-1 text-xs text-amber-500 mt-1.5 font-medium">
            <AlertTriangle size={13} />
            {urlWarning}
          </p>
        )}
      </div>

      {/* Task Description */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <label htmlFor="task" className="block text-sm font-semibold text-text-primary">
            Task Description
          </label>
          <span className="text-[10px] uppercase font-semibold text-text-secondary/70 font-mono tracking-wider">Natural Language</span>
        </div>
        <textarea
          id="task"
          required
          rows={3}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          disabled={isSubmitting}
          placeholder="Describe what to do (e.g. Navigate to contact page, enter email, submit and verify success message)"
          className="w-full px-4 py-3 bg-bg-app border border-border-subtle rounded-xl text-text-primary placeholder:text-text-secondary/40 placeholder:text-sm focus:outline-none focus:ring-1 focus:border-accent-primary focus:ring-accent-primary/20 transition duration-200 resize-none"
        />
      </div>

      {/* Expected Result */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <label htmlFor="expectedResult" className="block text-sm font-semibold text-text-primary">
            Expected Result <span className="text-text-secondary font-normal text-xs">(Optional)</span>
          </label>
        </div>
        <textarea
          id="expectedResult"
          rows={2}
          value={expectedResult}
          onChange={(e) => setExpectedResult(e.target.value)}
          disabled={isSubmitting}
          placeholder="What is the expected outcome (e.g. A success notification 'Thank you for reaching out' is visible)"
          className="w-full px-4 py-3 bg-bg-app border border-border-subtle rounded-xl text-text-primary placeholder:text-text-secondary/40 placeholder:text-sm focus:outline-none focus:ring-1 focus:border-accent-primary focus:ring-accent-primary/20 transition duration-200 resize-none"
        />
      </div>

      {/* Safety Alert Box */}
      <div className="p-4 bg-bg-app border border-border-subtle rounded-xl text-text-secondary text-xs leading-relaxed space-y-1.5 shadow-xs">
        <p className="font-semibold text-accent-primary flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
          <ShieldAlert size={13} /> Safety Notice
        </p>
        <p>
          Run tests only on websites you own or are authorized to test. ShipCheck will interact with the page using browser automation.
          Do not specify real credentials, personal information, or make purchases during tests.
        </p>
      </div>

      {formError && (
        <div className="p-3.5 bg-red-500/5 border border-red-500/20 text-red-500 text-sm rounded-xl">
          {formError}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isFormDisabled}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 font-semibold text-white bg-accent-primary hover:bg-accent-primary/90 active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100 rounded-xl shadow-xs transition duration-200 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating test plan...
          </>
        ) : (
          <>
            <Play size={15} fill="currentColor" />
            <span>Run Test</span>
          </>
        )}
      </button>
    </form>
  );
}
