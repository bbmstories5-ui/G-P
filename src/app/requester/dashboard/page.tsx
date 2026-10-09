'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Archive,
  Layers,
  Eye,
  ArrowRight,
  Filter,
  Search,
  Download,
  Sparkles,
  RefreshCw,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import AnalyticsCard from '@/components/analytics/AnalyticsCard';
import StatusDonutChart from '@/components/analytics/StatusDonutChart';
import MonthlyTrendChart from '@/components/analytics/MonthlyTrendChart';
import LoadingSkeleton from '@/components/analytics/LoadingSkeleton';
import { tabFetch, getTabUser } from '@/lib/tabAuth';



export default function RequesterDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch logged in user details for banner
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
      const res = await tabFetch(`/api/analytics/requester?range=${range}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load requester analytics:', e);
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
    totalRequests: 0,
    pending: 0,
    inProgress: 0,
    pendingApproval: 0,
    revisionRequired: 0,
    approved: 0,
    completed: 0,
  };

  const statusDistribution = data?.statusDistribution || [];
  const monthlyTrends = data?.monthlyTrends || [];
  const allRecentRequests = data?.recentRequests || [];

  // Filter recent requests by local search and status filter
  const filteredRecentRequests = allRecentRequests.filter((req: any) => {
    const matchesSearch =
      search === '' ||
      req.reqCode.toLowerCase().includes(search.toLowerCase()) ||
      req.title.toLowerCase().includes(search.toLowerCase()) ||
      req.category.toLowerCase().includes(search.toLowerCase()) ||
      req.designerName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && req.status === 'PENDING') ||
      (statusFilter === 'IN_PROGRESS' && ['ASSIGNED', 'IN_DESIGN'].includes(req.status)) ||
      (statusFilter === 'PENDING_APPROVAL' && ['PENDING_APPROVAL', 'RESUBMITTED'].includes(req.status)) ||
      (statusFilter === 'REVISION_REQUIRED' && req.status === 'REVISION_REQUIRED') ||
      (statusFilter === 'APPROVED' && req.status === 'FINAL_APPROVED') ||
      (statusFilter === 'COMPLETED' && req.status === 'COMPLETED');

    return matchesSearch && matchesStatus;
  });

  const memberDisplayName = currentUser?.name || 'Requester Member';
  const memberCode = currentUser?.requesterProfile?.memberCode || 'Member';
  const department = currentUser?.requesterProfile?.department || 'Department';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Welcome Banner & Action Bar */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold mb-1.5 border border-slate-200">
            <span>{memberCode}</span>
            <span className="opacity-40">•</span>
            <span className="font-normal text-slate-500">{department}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {memberDisplayName}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 max-w-xl">
            Track your graphic requests, design proofs, revisions, and deliverable approvals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAnalytics(false)}
            disabled={isRefreshing}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/requester/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Request</span>
          </Link>
        </div>
      </div>

      {/* Top Analytics KPI Cards (7 Cards as per specification) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Requests */}
        <AnalyticsCard
          title="Total Requests"
          value={metrics.totalRequests}
          subtitle="My requirements"
          icon={Layers}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          badge="All Time"
        />

        {/* Pending */}
        <AnalyticsCard
          title="Pending"
          value={metrics.pending}
          subtitle="Awaiting designer"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          badgeType="warning"
          badge={metrics.pending > 0 ? 'Queued' : undefined}
        />

        {/* In Progress */}
        <AnalyticsCard
          title="In Progress"
          value={metrics.inProgress}
          subtitle="Under active creation"
          icon={Clock}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          badgeType="info"
          badge={metrics.inProgress > 0 ? 'Designing' : undefined}
        />

        {/* Pending Approval */}
        <AnalyticsCard
          title="Pending Approval"
          value={metrics.pendingApproval}
          subtitle="On approver desk"
          icon={Clock}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          badgeType="info"
        />

        {/* Revision Required */}
        <AnalyticsCard
          title="Revision"
          value={metrics.revisionRequired}
          subtitle="Edits requested"
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
          subtitle="Ready to download"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          badgeType="success"
          badge={metrics.approved > 0 ? 'Ready' : undefined}
        />

        {/* Completed */}
        <AnalyticsCard
          title="Completed"
          value={metrics.completed}
          subtitle="Archived deliverables"
          icon={Archive}
          iconColor="text-slate-600"
          iconBg="bg-slate-100"
        />
      </div>

      {/* Analytics Graphs Section: Status Breakdown + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Status Breakdown Donut Chart */}
        <div className="lg:col-span-5">
          <StatusDonutChart
            data={statusDistribution}
            title="My Request Status Distribution"
            totalLabel="Requirements"
          />
        </div>

        {/* Monthly Request Trend Bar Chart with 7d, 30d, 3m, 6m, 12m filters */}
        <div className="lg:col-span-7">
          <MonthlyTrendChart
            data={monthlyTrends}
            title="Monthly Request & Completion Trends"
            range={range}
            onRangeChange={(newRange) => setRange(newRange)}
            series={[
              { key: 'created', label: 'Requests Created', color: '#6366F1' },
              { key: 'completed', label: 'Requests Completed', color: '#10B981' },
            ]}
          />
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 tracking-tight">Recent Requirements</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                {filteredRecentRequests.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Strictly isolated to {memberCode} data
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search my requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 w-48 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent focus:outline-none font-medium text-xs cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="REVISION_REQUIRED">Revision Required</option>
                <option value="APPROVED">Approved</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requirements Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Designer</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {filteredRecentRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto">
                      <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700 text-xs">No matching requests found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {search || statusFilter !== 'ALL'
                          ? 'Try clearing the search or status filters.'
                          : "You haven't submitted any graphic requirements yet."}
                      </p>
                      <Link
                        href="/requester/new"
                        className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-2xs hover:bg-slate-800 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Submit New Request
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecentRequests.map((req: any) => {
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900">
                        {req.reqCode}
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/requester/requests/${req.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block text-xs"
                        >
                          {req.title}
                        </Link>
                        <span className="text-[10px] text-slate-400 truncate block max-w-xs">
                          {req.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString(undefined, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800">
                        {req.designerName}
                      </td>

                      <td className="py-3 px-4">
                        <PriorityBadge priority={req.priority} />
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={req.status} />
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(req.updatedAt).toLocaleDateString(undefined, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/requester/requests/${req.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                        >
                          <Eye className="w-3 h-3" />
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
