'use client';

import React, { useState } from 'react';

interface StatusItem {
  status: string;
  count: number;
  color: string;
}

interface StatusDonutChartProps {
  data: StatusItem[];
  title?: string;
  totalLabel?: string;
}

export default function StatusDonutChart({
  data,
  title = 'Request Status Breakdown',
  totalLabel = 'Total',
}: StatusDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, item) => acc + item.count, 0);

  // SVG dimensions
  const size = 220;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-slate-900 tracking-tight">{title}</h3>
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {total} {totalLabel}
        </span>
      </div>

      {total === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No data available for current selection
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-around my-auto">
          {/* Donut Chart SVG */}
          <div className="relative w-[180px] h-[180px] shrink-0">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
              />

              {data.map((item, idx) => {
                if (item.count === 0) return null;
                const percent = item.count / total;
                const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
                const strokeDashoffset = -circumference * accumulatedPercent;
                accumulatedPercent += percent;

                const isHovered = hoveredIndex === idx;

                return (
                  <circle
                    key={idx}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Centered Total Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                {hoveredIndex !== null ? data[hoveredIndex].count : total}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1 truncate max-w-[100px] text-center">
                {hoveredIndex !== null ? data[hoveredIndex].status : totalLabel}
              </span>
            </div>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-1 gap-1.5 w-full max-w-[200px]">
            {data.map((item, idx) => {
              const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${isHovered ? 'bg-slate-50 font-bold' : 'hover:bg-slate-50/60'
                    }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 truncate text-[11px] font-medium">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                    <span className="font-bold text-slate-800">{item.count}</span>
                    <span className="text-[10px] text-slate-400">({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
