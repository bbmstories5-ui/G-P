'use client';

import React from 'react';
import { Award, CheckCircle2, Layers, Palette, RefreshCw } from 'lucide-react';

interface DesignerStat {
  id: string;
  name: string;
  code: string;
  assigned: number;
  inDesign: number;
  submitted: number;
  revision: number;
  approved: number;
  completed: number;
  completionRate: number;
}

interface DesignerComparisonChartProps {
  designers: DesignerStat[];
}

export default function DesignerComparisonChart({ designers }: DesignerComparisonChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            Graphic Makers Performance &amp; Capacity Matrix
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Side-by-side comparative throughput across all 3 active designers
          </p>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          3 Active Makers
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {designers.map((d, idx) => {
          const colors = [
            { border: 'border-blue-200', bg: 'bg-blue-50/50', badge: 'bg-blue-600', text: 'text-blue-600' },
            { border: 'border-purple-200', bg: 'bg-purple-50/50', badge: 'bg-purple-600', text: 'text-purple-600' },
            { border: 'border-emerald-200', bg: 'bg-emerald-50/50', badge: 'bg-emerald-600', text: 'text-emerald-600' },
          ][idx % 3];

          return (
            <div
              key={d.id}
              className={`rounded-2xl border ${colors.border} ${colors.bg} p-4 flex flex-col justify-between transition-all hover:shadow-xs`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                  <div>
                    <div className="text-xs font-bold text-slate-900 truncate">{d.name}</div>
                    <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{d.code}</div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-white text-[10px] font-bold ${colors.badge}`}>
                    {d.completionRate}% Done
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 my-3 text-center">
                  <div className="bg-white/80 rounded-xl p-2 border border-slate-200/50">
                    <span className="text-[10px] font-semibold text-slate-400 block">Assigned</span>
                    <span className="text-base font-extrabold text-slate-900">{d.assigned}</span>
                  </div>
                  <div className="bg-white/80 rounded-xl p-2 border border-slate-200/50">
                    <span className="text-[10px] font-semibold text-slate-400 block">In Design</span>
                    <span className="text-base font-extrabold text-sky-600">{d.inDesign}</span>
                  </div>
                  <div className="bg-white/80 rounded-xl p-2 border border-slate-200/50">
                    <span className="text-[10px] font-semibold text-slate-400 block">Submitted</span>
                    <span className="text-base font-extrabold text-amber-600">{d.submitted}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/80 rounded-xl p-2 border border-slate-200/50">
                    <span className="text-[10px] font-semibold text-slate-400 block">Revisions</span>
                    <span className="text-base font-extrabold text-rose-600">{d.revision}</span>
                  </div>
                  <div className="bg-white/80 rounded-xl p-2 border border-slate-200/50">
                    <span className="text-[10px] font-semibold text-slate-400 block">Approved</span>
                    <span className="text-base font-extrabold text-emerald-600">{d.approved}</span>
                  </div>
                  <div className="bg-white/80 rounded-xl p-2 border border-slate-200/50">
                    <span className="text-[10px] font-semibold text-slate-400 block">Completed</span>
                    <span className="text-base font-extrabold text-indigo-600">{d.completed}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Output Throughput</span>
                  <span className="font-bold text-slate-900">{d.approved + d.completed} / {d.assigned}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${colors.badge}`}
                    style={{ width: `${d.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
