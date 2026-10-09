'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Layers,
  Palette,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Eye,
  Send,
  PlayCircle,
  Upload,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import AnalyticsCard from '@/components/analytics/AnalyticsCard';
import StatusDonutChart from '@/components/analytics/StatusDonutChart';
import MonthlyTrendChart from '@/components/analytics/MonthlyTrendChart';
import PipelineFlowChart from '@/components/analytics/PipelineFlowChart';
import LoadingSkeleton from '@/components/analytics/LoadingSkeleton';
import { tabFetch, getTabUser } from '@/lib/tabAuth';
import { toast } from '@/components/ui/ToastProvider';



export default function DesignerDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);

  // Fetch logged in user
  useEffect(() => {
    const cached = getTabUser();
    if (cached) setCurrentUser(cached);
    tabFetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (json.user) setCurrentUser(json.user);
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchAnalytics = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setIsRefreshing(true);
      const [analyticsRes, availRes] = await Promise.all([
        tabFetch(`/api/analytics/designer?range=${range}`),
        tabFetch('/api/requirements?scope=available'),
      ]);

      const analyticsJson = await analyticsRes.json();
      const availJson = await availRes.json();

      if (analyticsRes.ok) setData(analyticsJson);
      if (availJson.requirements) setAvailableRequests(availJson.requirements);
    } catch (e) {
      console.error('Failed to load designer analytics:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics(true);
  }, [fetchAnalytics]);

  // Real-time auto-polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const handleAcceptRequest = async (id: string) => {
    try {
      const res = await fetch(`/api/requirements/${id}/assign`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success(
          'Requirement claimed',
          'Task has been assigned and added to your workspace.'
        );
        fetchAnalytics(false);
      } else {
        toast.error('Claim failed', json.error || 'Failed to accept requirement.');
      }
    } catch (e: any) {
      toast.error('Network error', e.message || 'Failed to claim requirement.');
    }
  };

  const handleRejectRequest = async (id: string, reqCode: string) => {
    const reason = window.prompt(`Enter reason for declining requirement ${reqCode} from pool:`, 'Declined from Designer available pool due to capacity / assets.');
    if (reason === null) return; // User cancelled prompt

    try {
      const res = await fetch(`/api/requirements/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'Declined from Designer available pool.' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.warning(
          'Requirement Declined',
          `${reqCode} has been declined and removed from the available pool.`
        );
        fetchAnalytics(false);
      } else {
        toast.error('Decline failed', json.error || 'Failed to decline requirement.');
      }
    } catch (e: any) {
      toast.error('Network error', e.message || 'Failed to decline requirement.');
    }
  };

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  const metrics = data?.metrics || {
    totalAssigned: 0,
    pending: 0,
    inDesign: 0,
    submittedForApproval: 0,
    revisionRequired: 0,
    approved: 0,
    completed: 0,
  };

  const statusDistribution = data?.statusDistribution || [];
  const pipeline = data?.pipeline || [];
  const performanceTrends = data?.performanceTrends || [];
  const recentWork = data?.recentWork || [];

  const designerDisplayName = currentUser?.name || 'Graphic Maker';
  const designerCode = currentUser?.designerProfile?.designerCode || 'Designer';
  const specialty = currentUser?.designerProfile?.specialty || 'Creative Production';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-500/30">
            <Palette className="w-3.5 h-3.5" />
            <span>{designerCode} Dashboard</span>
            <span className="opacity-60">•</span>
            <span className="font-medium text-blue-200">{specialty}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {designerDisplayName}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Live creative production pipeline, versioned mockups, approval turnaround rates, and open queue tasks.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => fetchAnalytics(false)}
            disabled={isRefreshing}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors shadow-xs"
            title="Refresh Live Statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <Link
            href="/designer/available"
            className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-all shrink-0"
          >
            <Inbox className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>OPEN POOL ({availableRequests.length})</span>
          </Link>
        </div>
      </div>

      {/* Top Analytics KPI Cards (7 Cards as per specification) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Assigned */}
        <AnalyticsCard
          title="Assigned"
          value={metrics.totalAssigned}
          subtitle="Total assigned"
          icon={Layers}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          badge="All Time"
        />

        {/* Pending Requests */}
        <AnalyticsCard
          title="Pending"
          value={metrics.pending}
          subtitle="Not yet started"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          badgeType="warning"
          badge={metrics.pending > 0 ? 'Queued' : undefined}
        />

        {/* In Design */}
        <AnalyticsCard
          title="In Design"
          value={metrics.inDesign}
          subtitle="Under creation"
          icon={Palette}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          badgeType="info"
          badge={metrics.inDesign > 0 ? 'Active' : undefined}
        />

        {/* Submitted for Approval */}
        <AnalyticsCard
          title="Submitted"
          value={metrics.submittedForApproval}
          subtitle="On approver desk"
          icon={Send}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          badgeType="info"
        />

        {/* Revision Required */}
        <AnalyticsCard
          title="Revision"
          value={metrics.revisionRequired}
          subtitle="Edits needed"
          icon={AlertCircle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          badgeType="danger"
          badge={metrics.revisionRequired > 0 ? 'Action' : undefined}
        />

        {/* Approved */}
        <AnalyticsCard
          title="Approved"
          value={metrics.approved}
          subtitle="Sign-off granted"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          badgeType="success"
        />

        {/* Completed */}
        <AnalyticsCard
          title="Completed"
          value={metrics.completed}
          subtitle="Delivered work"
          icon={CheckCircle2}
          iconColor="text-slate-600"
          iconBg="bg-slate-100"
        />
      </div>

      {/* Visual Approval Pipeline Flow */}
      <PipelineFlowChart stages={pipeline} title="My Visual Production & Approval Pipeline" />

      {/* Charts Section: Performance Donut + Monthly Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Status Breakdown */}
        <div className="lg:col-span-5">
          <StatusDonutChart
            data={statusDistribution}
            title="My Design Status Breakdown"
            totalLabel="Workload"
          />
        </div>

        {/* Monthly Performance Trend Chart */}
        <div className="lg:col-span-7">
          <MonthlyTrendChart
            data={performanceTrends}
            title="Monthly Designer Performance & Throughput"
            range={range}
            onRangeChange={(newRange) => setRange(newRange)}
            series={[
              { key: 'received', label: 'Requests Received', color: '#6366F1' },
              { key: 'submitted', label: 'Graphics Submitted', color: '#F59E0B' },
              { key: 'approved', label: 'Graphics Approved', color: '#10B981' },
            ]}
          />
        </div>
      </div>

      {/* Revision Alerts */}
      {metrics.revisionRequired > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border-l-4 border-orange-500 p-4 rounded-r-2xl bg-white shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-orange-950">
                You have {metrics.revisionRequired} requirement(s) awaiting revisions!
              </div>
              <div className="text-[11px] text-orange-800">
                Please review the Lead Approver comments and submit updated mockups.
              </div>
            </div>
          </div>
          <Link
            href="/designer/revisions"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            Review Revisions
          </Link>
        </div>
      )}

      {/* Recent Work Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xs font-bold text-slate-900 tracking-tight">Recent Assigned Work</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Production assignments isolated to {designerCode}
            </p>
          </div>
          <Link
            href="/designer/assigned"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Assigned ({metrics.totalAssigned})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Request Title</th>
                <th className="py-3 px-4">Assigned Date</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {recentWork.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-700 text-xs">No assigned tasks yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Accept requests from the open pool to begin.</p>
                  </td>
                </tr>
              ) : (
                recentWork.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900">{r.reqCode}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{r.requesterName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <Link href={`/designer/requests/${r.id}`} className="hover:text-blue-600">
                        {r.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium text-[11px]">
                      {new Date(r.deadline).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[10px] px-2 py-0.5 bg-slate-900 text-white rounded-md">
                        {r.version}
                      </span>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/designer/requests/${r.id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold shadow-xs transition-all ${
                          r.status === 'REVISION_REQUIRED'
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : r.status === 'ASSIGNED'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-900 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {r.status === 'ASSIGNED' ? (
                          <>
                            <PlayCircle className="w-3 h-3" />
                            <span>Start</span>
                          </>
                        ) : r.status === 'IN_DESIGN' ? (
                          <>
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </>
                        ) : r.status === 'REVISION_REQUIRED' ? (
                          <>
                            <Upload className="w-3 h-3" />
                            <span>Revise</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </>
                        )}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Available Requests Pool Section */}
      {availableRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-amber-50/40">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-amber-600" />
              <div>
                <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                  Available Requirements Pool ({availableRequests.length})
                </h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Unassigned requirements waiting for claim
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {availableRequests.map((req) => (
              <div key={req.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-amber-50/20 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] bg-slate-900 text-white px-2 py-0.5 rounded">
                      {req.reqCode}
                    </span>
                    <PriorityBadge priority={req.priority} />
                    <span className="text-[11px] font-semibold text-slate-500">
                      From: {req.requester?.requesterProfile?.memberCode || req.requester?.name}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">{req.title}</h3>
                  <p className="text-[11px] text-slate-600 max-w-2xl">{req.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRejectRequest(req.id, req.reqCode)}
                    className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    Reject Pool
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAcceptRequest(req.id)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>ACCEPT REQUEST</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
