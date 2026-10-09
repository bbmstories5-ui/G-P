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
} from 'lucide-react';
import AnalyticsCard from '@/components/analytics/AnalyticsCard';
import StatusDonutChart from '@/components/analytics/StatusDonutChart';
import MonthlyTrendChart from '@/components/analytics/MonthlyTrendChart';
import DesignerComparisonChart from '@/components/analytics/DesignerComparisonChart';
import LoadingSkeleton from '@/components/analytics/LoadingSkeleton';
import { tabFetch } from '@/lib/tabAuth';



export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const fetchAnalytics = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setIsRefreshing(true);
      const res = await tabFetch(`/api/analytics/admin?range=${range}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load admin analytics:', e);
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
    </div>
  );
}
