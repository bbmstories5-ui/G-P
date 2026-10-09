'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, Eye, Search, Filter } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function AdminRequirementsPage() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requirements?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.requirements) setRequirements(data.requirements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-600" />
            Global Requirements Registry
          </h1>
          <p className="text-xs text-slate-500">
            All creative briefs submitted across the company with full status tracking.
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search all requirements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRequirements()}
            className="pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Designer</th>
                <th className="py-3 px-4">Platform & Size</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center text-slate-400">Loading requirements...</td></tr>
              ) : requirements.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.reqCode}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{r.title}</td>
                  <td className="py-3.5 px-4">{r.requester?.requesterProfile?.memberCode || r.requester?.name}</td>
                  <td className="py-3.5 px-4">{r.assignedDesigner?.designerProfile?.designerCode || r.assignedDesigner?.name || 'Unassigned'}</td>
                  <td className="py-3.5 px-4">{r.platform} &bull; <span className="font-mono text-[10px] text-slate-400">{r.dimensions}</span></td>
                  <td className="py-3.5 px-4"><PriorityBadge priority={r.priority} /></td>
                  <td className="py-3.5 px-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/approver/review/${r.id}`}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-purple-600 transition-colors"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
