'use client';

import React from 'react';
import { Calendar, TrendingUp, AlertCircle, Clock } from 'lucide-react';

interface WorkloadForecastProps {
  forecast: {
    today: number;
    thisWeek: number;
    next7Days: number;
    next30Days: number;
  };
}

export default function WorkloadForecastCard({ forecast }: WorkloadForecastProps) {
  const items = [
    { label: 'Due Today', value: forecast.today, subtitle: 'Immediate review required', color: 'bg-rose-50 text-rose-700 border-rose-200', countBg: 'bg-rose-500' },
    { label: 'This Week', value: forecast.thisWeek, subtitle: 'Arriving in current sprint', color: 'bg-amber-50 text-amber-700 border-amber-200', countBg: 'bg-amber-500' },
    { label: 'Next 7 Days', value: forecast.next7Days, subtitle: 'Estimated submission wave', color: 'bg-blue-50 text-blue-700 border-blue-200', countBg: 'bg-blue-500' },
    { label: 'Next 30 Days', value: forecast.next30Days, subtitle: 'Monthly pipeline volume', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', countBg: 'bg-indigo-500' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            Upcoming Workload &amp; Intake Forecast
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Predictive volume calculated from active design assignments and deadlines
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-semibold border border-indigo-100">
          <Calendar className="w-3.5 h-3.5" />
          <span>Forecast</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border ${item.color} flex flex-col justify-between transition-all hover:scale-[1.02]`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider">{item.label}</div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{item.value}</span>
              <span className="text-xs font-semibold text-slate-500">graphics</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              {item.subtitle}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
