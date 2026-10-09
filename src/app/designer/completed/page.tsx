'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Eye, Download } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export default function DesignerCompletedPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/requirements?scope=mine&status=FINAL_APPROVED')
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
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          Completed & Approved Creations
        </h1>
        <p className="text-xs text-slate-500">
          Graphic designs created by you that achieved full sign-off and delivery to requesters.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Request ID</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Requester Member</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">No completed tasks yet.</td></tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.reqCode}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{r.title}</td>
                  <td className="py-3 px-4">{r.requester?.requesterProfile?.memberCode || r.requester?.name}</td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/designer/requests/${r.id}`}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-emerald-600"
                    >
                      View Archive
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
