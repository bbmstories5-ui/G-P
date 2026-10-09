'use client';

import React from 'react';
import { Clock, Zap, RotateCcw, Award } from 'lucide-react';

interface ResponseAnalyticsProps {
  analytics: {
    avgApprovalTime: string;
    fastestApproval: string;
    longestApproval: string;
    avgRevisionCycles: string;
  };
}

export default function ResponseTimeGauge({ analytics }: ResponseAnalyticsProps) {
  const cards = [
    {
      title: 'Average Approval Time',
      value: analytics.avgApprovalTime,
      subtitle: 'From submission to decision',
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Fastest Decision',
      value: analytics.fastestApproval,
      subtitle: 'Rapid turnaround record',
      icon: Zap,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Longest Review',
      value: analytics.longestApproval,
      subtitle: 'Complex multi-asset review',
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Average Revision Cycle',
      value: analytics.avgRevisionCycles,
      subtitle: 'Iterations per requirement',
      icon: RotateCcw,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            Governance &amp; Turnaround Benchmarks
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            SLA performance and review efficiency metrics
          </p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          SLA Compliant
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/60 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-lg ${c.bg} ${c.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 truncate">{c.title}</span>
              </div>
              <div className="my-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{c.value}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {c.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
