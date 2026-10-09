'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckSquare, Eye, Clock } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function ApproverPendingPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/requirements?scope=pending_approvals')
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
          <Clock className="w-6 h-6 text-purple-600" />
          Pending Approvals Queue ({requests.length})
        </h1>
        <p className="text-xs text-slate-500">
          Submissions uploaded by graphic makers waiting for your governance review.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Request</th>
              <th className="py-3 px-4">Requester</th>
              <th className="py-3 px-4">Graphic Maker</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading pending reviews...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Zero submissions pending review.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-900">{r.reqCode}</div>
                    <div className="font-bold text-slate-800">{r.title}</div>
                  </td>
                  <td className="py-3 px-4">{r.requester?.requesterProfile?.memberCode || r.requester?.name}</td>
                  <td className="py-3 px-4">{r.assignedDesigner?.designerProfile?.designerCode || r.assignedDesigner?.name}</td>
                  <td className="py-3 px-4"><PriorityBadge priority={r.priority} /></td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/approver/review/${r.id}`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow"
                    >
                      Review
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
