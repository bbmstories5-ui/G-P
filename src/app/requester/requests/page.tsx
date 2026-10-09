'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Filter, Eye, Download, FileText, Ban, AlertCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function RequesterAllRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchRequests = async () => {
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
    fetchRequests();
  }, [statusFilter]);

  // Counts summary
  const counts = useMemo(() => {
    return {
      all: requests.length,
      rejected: requests.filter((r) => r.status === 'REJECTED').length,
      approved: requests.filter((r) => r.status === 'FINAL_APPROVED').length,
      inProgress: requests.filter((r) => ['ASSIGNED', 'IN_DESIGN', 'RESUBMITTED'].includes(r.status)).length,
      pending: requests.filter((r) => r.status === 'PENDING').length,
    };
  }, [requests]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            My Creative Requests
          </h1>
          <p className="text-xs text-slate-500">
            Comprehensive list of all your created requirements and their production statuses.
          </p>
        </div>

        <Link
          href="/requester/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Request</span>
        </Link>
      </div>

      {/* Quick Status Filter Pills with Counts */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'ALL', label: 'All Requests' },
          { id: 'PENDING', label: 'Pending Assignment' },
          { id: 'IN_DESIGN', label: 'In Design' },
          { id: 'PENDING_APPROVAL', label: 'Under Review' },
          { id: 'FINAL_APPROVED', label: 'Approved' },
          { id: 'REJECTED', label: 'Declined / Rejected', color: 'text-rose-600 border-rose-200' },
        ].map((tab) => {
          const isSelected = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : tab.id === 'REJECTED'
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by ID or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRequests()}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-2">
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
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Declined / Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Platform & Size</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Designer</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading your requirements...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No requests found matching criteria.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isRejected = r.status === 'REJECTED';
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isRejected ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {r.reqCode}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/requester/requests/${r.id}`}
                          className="font-bold text-slate-900 hover:text-amber-600 transition-colors"
                        >
                          {r.title}
                        </Link>
                        <div className="text-[11px] text-slate-400">{r.category}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{r.platform}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.dimensions}</div>
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={r.priority} />
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-4">
                        {r.assignedDesigner ? (
                          <div className="font-semibold text-slate-800">
                            {r.assignedDesigner.name}
                          </div>
                        ) : isRejected ? (
                          <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                            <Ban className="w-3 h-3" /> Declined from pool
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">In Open Pool</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/requester/requests/${r.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
