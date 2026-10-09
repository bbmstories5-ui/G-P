'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, Eye, Search, Filter } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function ApproverAllRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requirements?search=${encodeURIComponent(search)}&status=${statusFilter}`);
      const data = await res.json();
      if (data.requirements) setRequests(data.requirements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [statusFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-6 h-6 text-slate-700" />
          Enterprise Requirements Overview
        </h1>
        <p className="text-xs text-slate-500">
          Governance visibility across all 12 requester members and 3 graphic makers.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by ID, title, requester..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAll()}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Assignment</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_DESIGN">In Design</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="REVISION_REQUIRED">Revision Required</option>
            <option value="FINAL_APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Designer</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center text-slate-400">Loading requirements...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-slate-400">No requirements found.</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.reqCode}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.title}</td>
                    <td className="py-3.5 px-4">{r.requester?.requesterProfile?.memberCode || r.requester?.name}</td>
                    <td className="py-3.5 px-4">{r.assignedDesigner?.designerProfile?.designerCode || r.assignedDesigner?.name || 'Unassigned'}</td>
                    <td className="py-3.5 px-4">{r.platform}</td>
                    <td className="py-3.5 px-4"><PriorityBadge priority={r.priority} /></td>
                    <td className="py-3.5 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/approver/review/${r.id}`}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-emerald-600 transition-colors"
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
    </div>
  );
}
