import React from 'react';

const PRIORITY_STYLES = {
  LOW: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
  MEDIUM: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  HIGH: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  URGENT: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
    badge: 'animate-pulse',
  },
};

const PriorityBadge = ({ priority }) => {
  const config = PRIORITY_STYLES[priority] || PRIORITY_STYLES.LOW;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border} ${config.badge || ''}`}
    >
      {priority}
    </span>
  );
};

export default PriorityBadge;
