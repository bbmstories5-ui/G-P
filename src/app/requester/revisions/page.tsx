'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  User,
  ArrowRight,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import { tabFetch } from '@/lib/tabAuth';

export default function RequesterRevisionsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const fetchRevisions = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await tabFetch('/api/requirements?status=REVISION_REQUIRED');
      const data = await res.json();
      if (data.requirements) setRequests(data.requirements);
    } catch (e) {
      console.error('Failed to fetch revisions:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRevisions();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const codeMatch = r.reqCode?.toLowerCase().includes(q);
        const titleMatch = r.title?.toLowerCase().includes(q);
        const designerMatch = r.assignedDesigner?.name?.toLowerCase().includes(q);
        const feedbackMatch = r.revisions?.[0]?.feedback?.toLowerCase().includes(q);
        if (!codeMatch && !titleMatch && !designerMatch && !feedbackMatch) return false;
      }
      return true;
    });
  }, [requests, search, priorityFilter]);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Revisions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Requests where changes or adjustments were requested during review.
          </p>
        </div>

        <button
          onClick={() => fetchRevisions(true)}
          disabled={refreshing}
          title="Refresh"
          className="self-start sm:self-center p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, title, feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Revision Items Feed */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading revisions...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-sm mx-auto space-y-2">
          <RotateCcw className="w-7 h-7 text-slate-300 mx-auto" />
          <div className="text-xs font-semibold text-slate-800">No revisions pending</div>
          <p className="text-[11px] text-slate-500">
            {search || priorityFilter !== 'ALL'
              ? 'No requests match your current filters.'
              : 'None of your requests are currently in revision.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((r) => {
            const latestRevision = r.revisions?.[0];

            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition-colors space-y-3"
              >
                {/* Top info line */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                      {r.reqCode}
                    </span>
                    <span className="text-[11px] text-slate-500">{r.category}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-500">{r.platform}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-[10px] text-slate-400">{r.dimensions}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={r.priority} />
                    <StatusBadge status={r.status} />
                  </div>
                </div>

                {/* Content & Feedback */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 leading-snug">{r.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>

                    {/* Feedback Callout Box */}
                    {latestRevision && (
                      <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-lg space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-amber-900">
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3 text-amber-700" />
                            Revision Notes
                          </span>
                          <span className="text-amber-700 font-normal">
                            {new Date(latestRevision.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-amber-950 text-xs leading-relaxed font-normal">
                          {latestRevision.feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Designer & Action */}
                  <div className="flex flex-col justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <div className="space-y-0.5 text-xs">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Designer
                      </div>
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.assignedDesigner?.name || 'Unassigned'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Due: {new Date(r.deadline).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/requester/requests/${r.id}`}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
