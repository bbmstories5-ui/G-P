'use client';

import React from 'react';
import { getStatusTheme, formatStatusLabel } from '@/lib/workflow';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export default function StatusBadge({ status, size = 'md', showDot = true }: StatusBadgeProps) {
  const theme = getStatusTheme(status);
  const label = formatStatusLabel(status);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
    lg: 'text-sm px-3 py-1.5 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${theme.bg} ${theme.text} ${theme.border} ${sizeClasses} shadow-sm transition-all`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${theme.dot} ${status === 'PENDING_APPROVAL' || status === 'IN_DESIGN' ? 'animate-pulse' : ''
            }`}
        />
      )}
      {label}
    </span>
  );
}
