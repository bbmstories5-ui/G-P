'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Eye, AlertCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function RequesterInProgressPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/requirements')
      .then((res) => res.json())
      .then((data) => {
        if (data.requirements) {
          setRequests(
            data.requirements.filter((r: any) =>
              ['ASSIGNED', 'IN_DESIGN', 'PENDING_APPROVAL', 'RESUBMITTED'].includes(r.status)
            )
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          In Progress Requirements
        </h1>
        <p className="text-xs text-slate-500">
          Graphic requirements currently undergoing design, rendering, or pending approval review.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Request ID</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Platform</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Assigned Designer</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">No active in-progress requirements.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.reqCode}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{r.title}</td>
                  <td className="py-3 px-4">{r.platform}</td>
                  <td className="py-3 px-4"><PriorityBadge priority={r.priority} /></td>
                  <td className="py-3 px-4">{r.assignedDesigner?.name || 'Unassigned'}</td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/requester/requests/${r.id}`}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-indigo-600"
                    >
                      View
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
