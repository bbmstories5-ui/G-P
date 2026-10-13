'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Users,
  Palette,
  CheckCircle2,
  Layers,
  History,
  Settings,
  BarChart3,
  Sliders,
  ArrowRight,
  Sparkles,
  Clock,
  AlertCircle,
  Archive,
  RefreshCw,
  Eye,
  CheckSquare,
  TrendingUp,
  HardDrive,
} from 'lucide-react';
import AnalyticsCard from '@/components/analytics/AnalyticsCard';
import StatusDonutChart from '@/components/analytics/StatusDonutChart';
import MonthlyTrendChart from '@/components/analytics/MonthlyTrendChart';
import DesignerComparisonChart from '@/components/analytics/DesignerComparisonChart';
import LoadingSkeleton from '@/components/analytics/LoadingSkeleton';
import CleanupApprovalModal from '@/components/admin/CleanupApprovalModal';
import { tabFetch } from '@/lib/tabAuth';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Graphics Auto-Deletion & Super Admin Approval State
  const [cleanupData, setCleanupData] = useState<any>(null);
  const [showCleanupModal, setShowCleanupModal] = useState(false);

  const fetchAnalytics = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setIsRefreshing(true);
      const [res, cleanupRes] = await Promise.all([
        tabFetch(`/api/analytics/admin?range=${range}`),
        tabFetch('/api/admin/cleanup'),
      ]);

      if (res.ok) {
        const json = await res.json();
        setData(json);
      }

      if (cleanupRes.ok) {
        const cJson = await cleanupRes.json();
        setCleanupData(cJson);
        // Automatically show popup when approval is pending
        if (cJson.pendingRequest && showLoading) {
          setShowCleanupModal(true);
        }
      }
    } catch (e) {
      console.error('Failed to load admin analytics or cleanup status:', e);
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
    totalRequesters: 12,
    totalDesigners: 3,
    totalApprovers: 1,
    totalRequests: 0,
    pending: 0,
    inDesign: 0,
    pendingApproval: 0,
    revision: 0,
    approved: 0,
    completed: 0,
  };

  const statusDistribution = data?.statusDistribution || [];
  const designerComparison = data?.designerComparison || [];
  const requesterOverview = data?.requesterOverview || [];
  const companyTrends = data?.companyTrends || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Admin Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-purple-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2 border border-purple-500/30">
            <Shield className="w-3.5 h-3.5 text-purple-400" /> Super Admin Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Company-Wide Analytics &amp; Governance
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Live oversight across 12 Requesters, 3 Graphic Makers, 1 Brand Approver, and enterprise throughput metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => fetchAnalytics(false)}
            disabled={isRefreshing}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-purple-900/60 transition-colors shadow-xs"
            title="Refresh Live Statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-5 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Manage 17 Users</span>
          </Link>
        </div>
      </div>

      {/* 15-Day Graphics Cleanup Governance Banner */}
      {cleanupData && (
        <div
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-md ${
            cleanupData.pendingRequest
              ? 'bg-gradient-to-r from-red-950/70 via-amber-950/40 to-slate-900 border-amber-500/50 shadow-amber-950/20'
              : 'bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-slate-800/90 hover:border-purple-500/30 shadow-slate-950/30'
          }`}
        >
          {/* Ambient background glow accent */}
          <div
            className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
              cleanupData.pendingRequest ? 'bg-amber-500/10' : 'bg-purple-500/10'
            }`}
          />

          <div className="relative z-10 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Icon, Cycle Badge, and Policy Title */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center border shadow-xs transition-transform duration-200 ${
                  cleanupData.pendingRequest
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-purple-500/15 text-purple-400 border-purple-500/25'
                }`}
              >
                {cleanupData.pendingRequest ? (
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      cleanupData.pendingRequest
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        cleanupData.pendingRequest
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-emerald-400 animate-pulse'
                      }`}
                    />
                    Cycle #{cleanupData.activeCycle?.cycleNumber || 1} •{' '}
                    {cleanupData.pendingRequest ? 'Approval Required' : 'Countdown Active'}
                  </span>

                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    15-Day Storage Retention Policy
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  {cleanupData.pendingRequest
                    ? `⚠️ 15-Day Cycle Complete: ${cleanupData.pendingRequest.graphicsCount} assets queued for deletion`
                    : 'Automated Graphic Storage Governance'}
                </h3>
              </div>
            </div>

            {/* Center: Live Status Metric Chips */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 py-0.5">
              {/* Countdown / Review chip */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs shadow-xs">
                <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    Next Auto-Review
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm tracking-tight">
                    {cleanupData.pendingRequest ? (
                      <span className="text-amber-400">Review Pending Now</span>
                    ) : (
                      <span>
                        <span className="text-purple-300 font-extrabold">
                          {cleanupData.countdown?.days || 0}d {cleanupData.countdown?.hours || 0}h
                        </span>{' '}
                        <span className="text-slate-400 text-[11px] font-normal">remaining</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Storage Footprint chip */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs shadow-xs">
                <HardDrive className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    Active Storage
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm tracking-tight">
                    <span className="text-slate-100 font-extrabold">
                      {cleanupData.metrics?.totalGraphicsStored || 0}
                    </span>{' '}
                    <span className="text-slate-400 text-[11px] font-normal">files</span>{' '}
                    <span className="text-slate-500 font-medium">•</span>{' '}
                    <span className="text-indigo-300 font-extrabold">
                      {cleanupData.metrics?.formattedStorageUsed || '0 Bytes'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
              {cleanupData.pendingRequest && (
                <button
                  onClick={() => setShowCleanupModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-950/40 transition-all flex items-center gap-2 animate-pulse"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Review &amp; Approve
                </button>
              )}
              <Link
                href="/admin/cleanup"
                className="group px-4 py-2.5 bg-slate-800/90 hover:bg-purple-600 text-slate-200 hover:text-white border border-slate-700/80 hover:border-purple-500 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-xs"
              >
                <span>Cleanup Center</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Slim progress bar indicating elapsed cycle */}
          {!cleanupData.pendingRequest && (
            <div className="w-full bg-slate-800/40 h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-500 rounded-r-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(4, cleanupData.countdown?.percentageElapsed || 0)
                  )}%`,
                }}
                title={`${cleanupData.countdown?.percentageElapsed || 0}% of 15-day cycle elapsed`}
              />
            </div>
          )}
        </div>
      )}


      {/* Role Counts Summary Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-amber-200/80 bg-amber-50/20 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Requesters</span>
            <div className="text-2xl font-black text-amber-900 mt-0.5">{metrics.totalRequesters} Members</div>
            <span className="text-[10px] text-slate-400">Member 01 – 12</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
            12
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-blue-200/80 bg-blue-50/20 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Graphic Makers</span>
            <div className="text-2xl font-black text-blue-900 mt-0.5">{metrics.totalDesigners} Designers</div>
            <span className="text-[10px] text-slate-400">Designer 01 – 03</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            3
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/80 bg-emerald-50/20 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Governance</span>
            <div className="text-2xl font-black text-emerald-900 mt-0.5">{metrics.totalApprovers} Lead Approver</div>
            <span className="text-[10px] text-slate-400">Elena Rostova</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            1
          </div>
        </div>
      </div>

      {/* Top 7 Overall Status KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <AnalyticsCard
          title="Total Requests"
          value={metrics.totalRequests}
          subtitle="All created"
          icon={Layers}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          badge="Global"
        />

        <AnalyticsCard
          title="Pending"
          value={metrics.pending}
          subtitle="Unassigned"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          badgeType="warning"
        />

        <AnalyticsCard
          title="In Design"
          value={metrics.inDesign}
          subtitle="Active creation"
          icon={Palette}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          badgeType="info"
        />

        <AnalyticsCard
          title="Pending Approval"
          value={metrics.pendingApproval}
          subtitle="On review desk"
          icon={CheckSquare}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />

        <AnalyticsCard
          title="Revision Loop"
          value={metrics.revision}
          subtitle="Correction loops"
          icon={AlertCircle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          badgeType="danger"
        />

        <AnalyticsCard
          title="Approved"
          value={metrics.approved}
          subtitle="Final approvals"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          badgeType="success"
        />

        <AnalyticsCard
          title="Completed"
          value={metrics.completed}
          subtitle="Delivered & done"
          icon={Archive}
          iconColor="text-slate-600"
          iconBg="bg-slate-100"
        />
      </div>

      {/* Designer Comparison Matrix (Section 23) */}
      <DesignerComparisonChart designers={designerComparison} />

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <StatusDonutChart
            data={statusDistribution}
            title="Company-Wide Requirement Status Distribution"
            totalLabel="Requirements"
          />
        </div>

        <div className="lg:col-span-7">
          <MonthlyTrendChart
            data={companyTrends}
            title="Enterprise Demand vs Completion Throughput"
            range={range}
            onRangeChange={(newRange) => setRange(newRange)}
            series={[
              { key: 'created', label: 'Requests Created', color: '#6366F1' },
              { key: 'completed', label: 'Completed Deliverables', color: '#10B981' },
              { key: 'approved', label: 'Approved Assets', color: '#38BDF8' },
            ]}
          />
        </div>
      </div>

      {/* Admin Requester Overview (Section 24 - All 12 Members) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 tracking-tight">
                All 12 Requester Members Overview
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-600 text-white rounded-full">
                12 Accounts
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Click any member row to inspect isolated requester metrics
            </p>
          </div>
          <Link
            href="/admin/users"
            className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <span>Manage Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Total Requests</th>
                <th className="py-3 px-4 text-center">Pending</th>
                <th className="py-3 px-4 text-center">In Progress</th>
                <th className="py-3 px-4 text-center">Approval</th>
                <th className="py-3 px-4 text-center">Approved</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {requesterOverview.map((m: any) => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className="hover:bg-purple-50/30 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-xs">{m.memberCode}</div>
                    <div className="text-[10px] text-slate-400">{m.name}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600 text-[11px]">{m.department}</td>
                  <td className="py-3 px-4 text-center font-extrabold text-slate-900">{m.totalRequests}</td>
                  <td className="py-3 px-4 text-center font-bold text-amber-600">{m.pending}</td>
                  <td className="py-3 px-4 text-center font-bold text-sky-600">{m.inProgress}</td>
                  <td className="py-3 px-4 text-center font-bold text-purple-600">{m.approval}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">{m.approved}</td>
                  <td className="py-3 px-4 text-center font-bold text-indigo-600">{m.completed}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember(m);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-bold text-[10px] transition-colors border border-purple-200"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                  {selectedMember.memberCode}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">{selectedMember.name}</h3>
                <p className="text-xs text-slate-400">{selectedMember.department}</p>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-semibold block">Total</span>
                <span className="text-lg font-black text-slate-900">{selectedMember.totalRequests}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                <span className="text-[10px] text-amber-600 font-semibold block">Pending</span>
                <span className="text-lg font-black text-amber-700">{selectedMember.pending}</span>
              </div>
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200/60">
                <span className="text-[10px] text-sky-600 font-semibold block">In Progress</span>
                <span className="text-lg font-black text-sky-700">{selectedMember.inProgress}</span>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/60">
                <span className="text-[10px] text-purple-600 font-semibold block">Approval</span>
                <span className="text-lg font-black text-purple-700">{selectedMember.approval}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60">
                <span className="text-[10px] text-emerald-600 font-semibold block">Approved</span>
                <span className="text-lg font-black text-emerald-700">{selectedMember.approved}</span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200/60">
                <span className="text-[10px] text-indigo-600 font-semibold block">Completed</span>
                <span className="text-lg font-black text-indigo-700">{selectedMember.completed}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Popup Cleanup Approval Modal for Super Admin */}
      {cleanupData?.pendingRequest && (
        <CleanupApprovalModal
          request={cleanupData.pendingRequest}
          isOpen={showCleanupModal}
          onClose={() => setShowCleanupModal(false)}
          onSuccess={() => {
            fetchAnalytics(false);
          }}
        />
      )}
    </div>
  );
}
