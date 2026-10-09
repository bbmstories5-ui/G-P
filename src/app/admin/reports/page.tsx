'use client';

import React from 'react';
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle, Users } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          Creative Workflow Analytics & Reports
        </h1>
        <p className="text-xs text-slate-500">
          Turnaround velocity, first-pass approval rates, and department throughput metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Avg Turnaround</div>
          <div className="text-3xl font-black text-slate-900 mt-2">1.8 Days</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">15% faster than SLA target</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase">Approval Rate</div>
          <div className="text-3xl font-black text-emerald-800 mt-2">91.4%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">High creative compliance</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-orange-200 bg-orange-50/20 shadow-sm">
          <div className="text-xs font-bold text-orange-600 uppercase">Revision Rate</div>
          <div className="text-3xl font-black text-orange-800 mt-2">8.6%</div>
          <div className="text-[11px] text-orange-600 font-medium mt-1">Avg 1.2 revisions/req</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-sm">
          <div className="text-xs font-bold text-purple-600 uppercase">Active Capacity</div>
          <div className="text-3xl font-black text-purple-800 mt-2">66.7%</div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">Studio load balanced</div>
        </div>
      </div>

      {/* Platform & Department breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Volume by Social Platform</h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1 font-semibold">
                <span>Instagram (Feed & Story)</span>
                <span>45%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-pink-500 h-full rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold">
                <span>Website & Landing Pages</span>
                <span>25%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '25%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold">
                <span>LinkedIn Carousel & PDF</span>
                <span>18%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '18%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold">
                <span>YouTube & Print</span>
                <span>12%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '12%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Designer Production Throughput</h3>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="font-bold text-slate-800">Designer 01 (Alex Morgan)</div>
                <div className="text-slate-400 text-[11px]">Brand Identity & Visuals</div>
              </div>
              <span className="font-bold text-emerald-600">4 Completed / 1 Active</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="font-bold text-slate-800">Designer 02 (Sophia Chen)</div>
                <div className="text-slate-400 text-[11px]">Social Media & Vector Art</div>
              </div>
              <span className="font-bold text-emerald-600">3 Completed / 2 Active</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="font-bold text-slate-800">Designer 03 (Marcus Vance)</div>
                <div className="text-slate-400 text-[11px]">Infographics & Ad Campaigns</div>
              </div>
              <span className="font-bold text-emerald-600">3 Completed / 1 Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
