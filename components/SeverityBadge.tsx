import React from 'react';

interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const configs = {
    critical: {
      bg: 'bg-red-500/5 border-red-550/20 text-red-600 dark:text-red-400',
      label: 'Critical Impact',
    },
    high: {
      bg: 'bg-orange-550/5 border-orange-550/20 text-orange-650 dark:text-orange-400',
      label: 'High Severity',
    },
    medium: {
      bg: 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400',
      label: 'Medium Severity',
    },
    low: {
      bg: 'bg-bg-app border-border-subtle text-text-secondary',
      label: 'Low Severity',
    },
  };

  const current = configs[severity] || configs.low;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${current.bg}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {current.label}
    </span>
  );
}
