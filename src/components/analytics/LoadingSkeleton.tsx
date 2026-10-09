'use client';

import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      {/* Top Metric Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 bg-slate-200/70 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-16 h-3 bg-slate-300 rounded" />
              <div className="w-6 h-6 rounded-lg bg-slate-300" />
            </div>
            <div className="w-12 h-6 bg-slate-300 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 h-80 bg-slate-200/70 rounded-2xl p-5" />
        <div className="lg:col-span-7 h-80 bg-slate-200/70 rounded-2xl p-5" />
      </div>

      {/* Table Skeleton */}
      <div className="h-64 bg-slate-200/70 rounded-2xl p-5" />
    </div>
  );
}
