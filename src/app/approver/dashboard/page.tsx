'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Archive,
  ArrowRight,
  Eye,
  Sparkles,
  ShieldCheck,
  Clock,
  Send,
  Calendar,
  RefreshCw,
  Zap,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import AnalyticsCard from '@/components/analytics/AnalyticsCard';
import StatusDonutChart from '@/components/analytics/StatusDonutChart';
import MonthlyTrendChart from '@/components/analytics/MonthlyTrendChart';
import WorkloadForecastCard from '@/components/analytics/WorkloadForecastCard';
import ResponseTimeGauge from '@/components/analytics/ResponseTimeGauge';
import ActivityTimeline from '@/components/analytics/ActivityTimeline';
import LoadingSkeleton from '@/components/analytics/LoadingSkeleton';
import { tabFetch, getTabUser } from '@/lib/tabAuth';



export default function ApproverDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      const res = await tabFetch(`/api/analytics/approver?range=${range}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load approver analytics:', e);
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

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  const metrics = data?.metrics || {
    graphicsReceived: 0,
    pendingApproval: 0,
    approved: 0,
    revisionRequested: 0,
    rejected: 0,
    completed: 0,
  };

  const statusDistribution = data?.statusDistribution || [];
  const approvalTrends = data?.approvalTrends || [];
  const approvalQueue = data?.approvalQueue || [];
  const upcomingGraphics = data?.upcomingGraphics || [];
  const workloadForecast = data?.workloadForecast || { today: 0, thisWeek: 0, next7Days: 0, next30Days: 0 };
  const responseAnalytics = data?.responseAnalytics || {
    avgApprovalTime: '3h 45m',
    fastestApproval: '18m',
    longestApproval: '1d 4h',
    avgRevisionCycles: '1.2 cycles',
  };
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Lead Approver Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Brand Governance &amp; Approval Center
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Audit submitted proofs against quality standards, approve production-ready assets, dispatch feedback loops, and forecast intake volume.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => fetchAnalytics(false)}
            disabled={isRefreshing}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors shadow-xs"
            title="Refresh Live Statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <Link
            href="/approver/pending"
            className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition-all shrink-0"
          >
            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>REVIEW QUEUE ({metrics.pendingApproval})</span>
          </Link>
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Graphics Received */}
        <AnalyticsCard
          title="Received"
          value={metrics.graphicsReceived}
          subtitle="Total submissions"
          icon={Send}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          badge="All Time"
        />

        {/* Pending Approval */}
        <AnalyticsCard
          title="Pending Approval"
          value={metrics.pendingApproval}
          subtitle="Awaiting sign-off"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          badgeType="warning"
          badge={metrics.pendingApproval > 0 ? 'Urgent' : undefined}
        />

        {/* Approved */}
        <AnalyticsCard
          title="Approved"
          value={metrics.approved}
          subtitle="Compliance verified"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          badgeType="success"
        />

        {/* Revision Requested */}
        <AnalyticsCard
          title="Revision Loop"
          value={metrics.revisionRequested}
          subtitle="Returned to designer"
          icon={AlertCircle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          badgeType="danger"
        />

        {/* Rejected */}
        <AnalyticsCard
          title="Rejected"
          value={metrics.rejected}
          subtitle="Off-brand assets"
          icon={XCircle}
          iconColor="text-red-700"
          iconBg="bg-red-50"
        />

        {/* Completed */}
        <AnalyticsCard
          title="Completed"
          value={metrics.completed}
          subtitle="Delivered & archived"
          icon={Archive}
          iconColor="text-slate-600"
          iconBg="bg-slate-100"
        />
      </div>

      {/* Workload Forecast Cards + Response Time SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <WorkloadForecastCard forecast={workloadForecast} />
        </div>
        <div className="lg:col-span-6">
          <ResponseTimeGauge analytics={responseAnalytics} />
        </div>
      </div>

      {/* Analytics Charts: Status Donut + Monthly Approval Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <StatusDonutChart
            data={statusDistribution}
            title="Approval Pipeline Status"
            totalLabel="Evaluations"
          />
        </div>

        <div className="lg:col-span-7">
          <MonthlyTrendChart
            data={approvalTrends}
            title="Monthly Intake vs Approval Throughput"
            range={range}
            onRangeChange={(newRange) => setRange(newRange)}
            series={[
              { key: 'received', label: 'Graphics Received', color: '#6366F1' },
              { key: 'approved', label: 'Graphics Approved', color: '#10B981' },
              { key: 'revision', label: 'Revision Loops', color: '#F43F5E' },
            ]}
          />
        </div>
      </div>

      {/* Core Approval Queue Table (Section 17) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-emerald-50/30">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 tracking-tight">Active Approval Queue</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-full">
                {approvalQueue.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Graphic proofs waiting for lead approval decision
            </p>
          </div>
          <Link
            href="/approver/pending"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Full Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Graphic Maker</th>
                <th className="py-3 px-4">Request Title</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {approvalQueue.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1.5" />
                    <p className="font-bold text-slate-700 text-xs">Zero Pending Submissions</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All designer uploads are fully evaluated.</p>
                  </td>
                </tr>
              ) : (
                approvalQueue.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900">{r.reqCode}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{r.requesterName}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{r.designerName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.title}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(r.submittedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[10px] px-2 py-0.5 bg-slate-900 text-white rounded-md">
                        {r.version}
                      </span>
                    </td>
                    <td className="py-3 px-4"><PriorityBadge priority={r.priority} /></td>
                    <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/approver/review/${r.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[11px] shadow-xs transition-all hover:scale-102"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Review</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Graphics & Live Activity Feed (Sections 18 & 21) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Upcoming Approval Work (Section 18) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                  Upcoming Approval Work
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Requirements currently in design expected to arrive for review soon
                </p>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                In Production ({upcomingGraphics.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Request</th>
                    <th className="py-2.5 px-3">Requester</th>
                    <th className="py-2.5 px-3">Designer</th>
                    <th className="py-2.5 px-3">Expected Date</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {upcomingGraphics.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No upcoming graphics in design pipeline.
                      </td>
                    </tr>
                  ) : (
                    upcomingGraphics.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.reqCode}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{item.requesterName}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{item.designerName}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-medium text-[11px]">{item.expectedDate}</td>
                        <td className="py-2.5 px-3 text-right"><StatusBadge status={item.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Activity Timeline (Section 21) */}
        <div className="lg:col-span-5">
          <ActivityTimeline activities={recentActivity} title="Recent Approver Actions" />
        </div>
      </div>
    </div>
  );
}
