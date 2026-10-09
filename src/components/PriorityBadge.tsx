'use client';

import React from 'react';

interface PriorityBadgeProps {
  priority: string;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const getStyle = (p: string) => {
    switch (p?.toUpperCase()) {
      case 'URGENT':
        return 'bg-red-50 text-red-700 border-red-200 font-bold';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
      case 'LOW':
        return 'bg-slate-50 text-slate-600 border-slate-200 font-medium';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${getStyle(
        priority
      )}`}
    >
      {priority}
    </span>
  );
}
