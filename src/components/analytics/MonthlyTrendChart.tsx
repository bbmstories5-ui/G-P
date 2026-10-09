'use client';

import React, { useState } from 'react';

interface TrendItem {
  label: string;
  created?: number;
  completed?: number;
  received?: number;
  submitted?: number;
  approved?: number;
  revision?: number;
}

interface MonthlyTrendChartProps {
  data: TrendItem[];
  title?: string;
  range: string;
  onRangeChange: (range: string) => void;
  series: {
    key: keyof TrendItem;
    label: string;
    color: string;
  }[];
}

export default function MonthlyTrendChart({
  data,
  title = 'Activity & Completion Trends',
  range,
  onRangeChange,
  series,
}: MonthlyTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute maximum value for scale
  let maxValue = 1;
  for (const item of data) {
    for (const s of series) {
      const val = (item[s.key] as number) || 0;
      if (val > maxValue) maxValue = val;
    }
  }

  // Add 20% headroom
  const chartMax = Math.ceil(maxValue * 1.2) || 5;

  const ranges = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '3M', value: '3m' },
    { label: '6M', value: '6m' },
    { label: '12M', value: '12m' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header with Title & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Dynamic aggregation over selected timeline
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => onRangeChange(r.value)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${range === r.value
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="relative flex-1 min-h-[220px] flex flex-col justify-end">
        {/* Y-Axis Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
          {[1, 0.75, 0.5, 0.25, 0].map((step, idx) => (
            <div key={idx} className="w-full flex items-center gap-2 border-b border-dashed border-slate-200">
              <span className="text-[9px] font-mono text-slate-400 w-6">
                {Math.round(chartMax * step)}
              </span>
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div className="relative z-10 grid grid-flow-col auto-cols-fr gap-2 h-44 items-end pl-8 pr-2 pt-4">
          {data.map((item, idx) => {
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-30 bg-slate-900 text-white text-[10px] font-semibold py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                    <div className="font-bold text-slate-200 mb-0.5 border-b border-slate-700 pb-0.5">
                      {item.label}
                    </div>
                    {series.map((s) => (
                      <div key={s.key} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-slate-300">{s.label}:</span>
                        <span className="font-bold text-white">{(item[s.key] as number) || 0}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Grouped Bars */}
                <div className="flex items-end gap-1 w-full justify-center">
                  {series.map((s) => {
                    const value = (item[s.key] as number) || 0;
                    const heightPercent = chartMax > 0 ? (value / chartMax) * 100 : 0;

                    return (
                      <div
                        key={s.key}
                        style={{
                          height: `${Math.max(heightPercent, 4)}%`,
                          backgroundColor: s.color,
                        }}
                        className={`w-full max-w-[12px] rounded-t-md transition-all duration-300 ${isHovered ? 'brightness-110 scale-y-105' : 'opacity-90'
                          }`}
                      />
                    );
                  })}
                </div>

                {/* X-Axis Label */}
                <span
                  className={`text-[10px] mt-2 truncate max-w-full font-medium ${isHovered ? 'text-slate-900 font-bold' : 'text-slate-400'
                    }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Series Legend */}
      <div className="flex items-center justify-center gap-4 mt-5 pt-3 border-t border-slate-100 flex-wrap">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-slate-600 font-medium text-[11px]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
