'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Palette, Upload } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function DesignerInDesignPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/requirements?scope=mine&status=IN_DESIGN')
      .then((res) => res.json())
      .then((data) => {
        if (data.requirements) setRequests(data.requirements);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Palette className="w-6 h-6 text-indigo-600" />
          Requirements Currently In Design
        </h1>
        <p className="text-xs text-slate-500">Creative briefs you have started and are actively composing.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Request ID</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Platform & Size</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Deadline</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">No active items in design.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.reqCode}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{r.title}</td>
                  <td className="py-3 px-4">{r.platform} &bull; <span className="font-mono">{r.dimensions}</span></td>
                  <td className="py-3 px-4"><PriorityBadge priority={r.priority} /></td>
                  <td className="py-3 px-4">{new Date(r.deadline).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/designer/requests/${r.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700"
                    >
                      <Upload className="w-3 h-3" /> Upload Graphic
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
