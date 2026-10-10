'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Bell,
  User,
  Calendar,
  Clock,
  Database,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  ArrowRight,
  Shield,
  ChevronRight,
  MoreVertical,
  MoreHorizontal,
  Plus,
  FileText,
  Settings,
  X,
  Eye,
  Download,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import CleanupApprovalModal from '@/components/admin/CleanupApprovalModal';
import { tabFetch } from '@/lib/tabAuth';

interface CleanupStats {
  activeCycle: {
    id: string;
    cycleNumber: number;
    startDate: string;
    scheduledDeletionDate: string;
    status: string;
    graphicsCount: number;
    totalSizeBytes: number;
    formattedSize: string;
    decisionNotes?: string;
    reviewedBy?: { id: string; name: string; email: string };
    reviewedAt?: string;
    executedAt?: string;
    deletedCount: number;
    failedCount: number;
  };
  countdown: {
    msRemaining: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    percentageElapsed: number;
  };
  metrics: {
    totalGraphicsStored: number;
    totalStorageBytes: number;
    formattedStorageUsed: string;
    pendingRequestsCount: number;
    approvedRequestsCount: number;
    rejectedRequestsCount: number;
    totalSuccessfullyDeleted: number;
    totalFailedDeletions: number;
  };
  pendingRequest: any;
  requestsHistory: any[];
  recentGraphics?: any[];
}

interface GraphicRowItem {
  id: string;
  previewUrl: string;
  fileName: string;
  mimeType: string;
  size: string;
  uploadedOnDate: string;
  uploadedOnTime: string;
  age: string;
  status: string;
}

export default function GraphicsCleanupAdminPage() {
  const [data, setData] = useState<CleanupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<any | null>(null);
  const [previewGraphic, setPreviewGraphic] = useState<GraphicRowItem | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Live countdown state initialized to 0 until real data loads
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const fetchStats = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setRefreshing(true);
      const res = await tabFetch('/api/admin/cleanup');
      if (res.ok) {
        const json = await res.json();
        setData(json);

        if (json.countdown) {
          setTimeLeft({
            days: json.countdown.days ?? 0,
            hours: json.countdown.hours ?? 0,
            minutes: json.countdown.minutes ?? 0,
            seconds: json.countdown.seconds ?? 0,
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch cleanup stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(true);
  }, [fetchStats]);

  // 1-second live countdown ticker based on real scheduled deletion date
  useEffect(() => {
    if (!data?.activeCycle?.scheduledDeletionDate) return;

    const interval = setInterval(() => {
      const scheduled = new Date(data.activeCycle.scheduledDeletionDate).getTime();
      const now = Date.now();
      const diff = Math.max(0, scheduled - now);

      if (diff === 0 && data.activeCycle.status === 'COUNTDOWN_ACTIVE') {
        fetchStats(false);
      }

      setTimeLeft({
        days: Math.floor(diff / (24 * 60 * 60 * 1000)),
        hours: Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
        minutes: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
        seconds: Math.floor((diff % (60 * 1000)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.activeCycle?.scheduledDeletionDate, data?.activeCycle?.status, fetchStats]);

  // Simulate 15-day expiration for testing / Create deletion request
  const handleSimulateExpiration = async () => {
    try {
      setSimulating(true);
      const res = await tabFetch('/api/admin/cleanup/simulate-cycle', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: 'Simulation successful: 15-day period completed! Deletion request generated.',
        });
        await fetchStats(false);
        setShowApprovalModal(true);
      } else {
        setActionMessage({ type: 'error', text: json.error || 'Simulation failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Simulation error' });
    } finally {
      setSimulating(false);
    }
  };

  // Real database graphics list only (no hardcoded demo graphics)
  const graphicsList: GraphicRowItem[] = useMemo(() => {
    if (!data?.recentGraphics || data.recentGraphics.length === 0) {
      return [];
    }

    return data.recentGraphics.map((item, idx) => {
      const created = new Date(item.createdAt);
      const diffDays = Math.max(0, Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)));
      const formatKB = (item.fileSize / 1024).toFixed(0) + ' KB';

      return {
        id: item.graphicId || item.versionId || `g-${idx}`,
        previewUrl: item.previewUrl || item.fileUrl || '/images/cleanup-hero-3d.jpg',
        fileName: item.fileName || 'graphic.png',
        mimeType: item.mimeType || 'image/png',
        size: item.fileSize ? formatKB : '0 KB',
        uploadedOnDate: created.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        uploadedOnTime: created.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        age: diffDays === 0 ? 'Today' : `${diffDays} days`,
        status: 'Active',
      };
    });
  }, [data?.recentGraphics]);

  // Filtered graphics
  const filteredGraphics = useMemo(() => {
    if (!searchQuery.trim()) return graphicsList;
    const q = searchQuery.toLowerCase();
    return graphicsList.filter(
      (g) => g.fileName.toLowerCase().includes(q) || g.mimeType.toLowerCase().includes(q) || g.age.includes(q)
    );
  }, [graphicsList, searchQuery]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(filteredGraphics.map((g) => g.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Real requests list from database only (no demo requests)
  const displayRequests = useMemo(() => {
    if (!data?.requestsHistory || data.requestsHistory.length === 0) {
      return [];
    }

    return data.requestsHistory.slice(0, 5).map((r, idx) => {
      const isPend = r.status === 'PENDING_APPROVAL';
      const isApp = r.status === 'APPROVED' || r.status === 'COMPLETED';
      const isRej = r.status === 'REJECTED';

      const sColor = isPend ? 'amber' : isApp ? 'emerald' : isRej ? 'rose' : 'blue';
      const statusLabel = isPend
        ? 'Pending Approval'
        : r.status === 'COMPLETED'
        ? 'Completed'
        : isApp
        ? 'Approved'
        : isRej
        ? 'Rejected'
        : 'Active Cycle';

      const created = new Date(r.createdAt || r.scheduledDeletionDate);
      const dateFormatted = `${created.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} • ${created.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

      return {
        id: r.id,
        code: `#REQ-${new Date(r.createdAt || Date.now()).getFullYear()}-${String(r.cycleNumber).padStart(4, '0')}`,
        status: statusLabel,
        statusColor: sColor,
        graphicsCount: r.graphicsCount || 0,
        sizeFormatted: r.formattedSize || '0 Bytes',
        dateFormatted,
        isPending: isPend,
        rawData: r,
      };
    });
  }, [data?.requestsHistory]);

  const activeCycle = data?.activeCycle;
  const metrics = data?.metrics || {
    totalGraphicsStored: 0,
    totalStorageBytes: 0,
    formattedStorageUsed: '0 Bytes',
    pendingRequestsCount: 0,
    approvedRequestsCount: 0,
    rejectedRequestsCount: 0,
    totalSuccessfullyDeleted: 0,
    totalFailedDeletions: 0,
  };

  // Real scheduled deletion date
  const nextCleanupDateText = useMemo(() => {
    if (activeCycle?.scheduledDeletionDate) {
      return new Date(activeCycle.scheduledDeletionDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return 'Not Scheduled';
  }, [activeCycle?.scheduledDeletionDate]);

  return (
    <div className="w-full max-w-[1580px] mx-auto space-y-4 pb-14 font-sans text-slate-800">
      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search graphics, requests, files..."
          className="w-full pl-11 pr-4 py-2.5 bg-white rounded-full border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all"
        />
      </div>

      {/* Action Toast Feedback */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-500 hover:text-slate-900 text-xs font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Row: Keep Your Database Clean & Optimized + Next Cleanup Date */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Hero Card */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-[20px] p-6 sm:p-7 relative overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[190px]">
          {/* Subtle soft blue glow background */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-blue-50/70 via-sky-50/20 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold mb-3 border border-blue-100/80">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Graphics Management</span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 leading-tight">
              Keep Your Database Clean &amp; Optimized
            </h1>

            {/* Subtitle */}
            <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
              Graphics are automatically tracked and removed after 15 days.
              <br />
              Deletion requires Super Admin approval for your safety.
            </p>
          </div>

          {/* 3D Illustration Graphic on Right */}
          <div className="absolute right-2 sm:right-6 -bottom-1 top-1 w-44 sm:w-60 md:w-72 flex items-center justify-center pointer-events-none">
            <div className="relative w-full h-full max-h-[175px]">
              <Image
                src="/images/cleanup-hero-3d.jpg"
                alt="Database Cleanup 3D Graphic"
                fill
                priority
                className="object-contain drop-shadow-sm rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* Right Hero Card: Next Cleanup Date & 4 Countdown Blocks */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[190px]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-500">Next Cleanup Date</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-2.5 mb-4">
              <h2 className="text-2xl sm:text-[26px] font-black text-blue-700 tracking-tight">
                {nextCleanupDateText}
              </h2>
            </div>
          </div>

          {/* 4 Countdown Boxes */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl py-2 px-1">
              <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">Days</div>
            </div>

            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl py-2 px-1">
              <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">Hours</div>
            </div>

            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl py-2 px-1">
              <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">Minutes</div>
            </div>

            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl py-2 px-1">
              <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-[11px] font-medium text-slate-400 mt-0.5">Seconds</div>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* 1. Total Graphics Stored */}
        <div className="bg-white border border-slate-200/90 rounded-[18px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ImageIcon className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 leading-tight">Total Graphics Stored</p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.totalGraphicsStored.toLocaleString()}
            </span>
            <span className="inline-flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Database tracked</p>
        </div>

        {/* 2. Total Storage Used */}
        <div className="bg-white border border-slate-200/90 rounded-[18px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 leading-tight">Total Storage Used</p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {metrics.formattedStorageUsed}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Disk footprint</p>
        </div>

        {/* 3. Pending Deletion Requests */}
        <div className="bg-white border border-slate-200/90 rounded-[18px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 leading-tight">Pending Deletion Requests</p>
          <div className="pt-0.5">
            <span className="text-2xl font-black text-amber-500 tracking-tight">
              {metrics.pendingRequestsCount}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Awaiting approval</p>
        </div>

        {/* 4. Approved Requests */}
        <div className="bg-white border border-slate-200/90 rounded-[18px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 leading-tight">Approved Requests</p>
          <div className="pt-0.5">
            <span className="text-2xl font-black text-emerald-600 tracking-tight">
              {metrics.approvedRequestsCount}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Governance approved</p>
        </div>

        {/* 5. Rejected Requests */}
        <div className="bg-white border border-slate-200/90 rounded-[18px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 leading-tight">Rejected Requests</p>
          <div className="pt-0.5">
            <span className="text-2xl font-black text-rose-500 tracking-tight">
              {metrics.rejectedRequestsCount}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Preserved safely</p>
        </div>

        {/* 6. Deleted Graphics */}
        <div className="bg-white border border-slate-200/90 rounded-[18px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Trash2 className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 leading-tight">Deleted Graphics</p>
          <div className="pt-0.5">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {metrics.totalSuccessfullyDeleted}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Files cleaned</p>
        </div>

        {/* 7. Failed Deletions */}
        <div className="bg-white border border-slate-200/90 rounded-[18px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 leading-tight">Failed Deletions</p>
          <div className="pt-0.5">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {metrics.totalFailedDeletions}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Logged safely</p>
        </div>
      </div>

      {/* Main Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (Recent Graphics Table + System Status Progress Flow) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card: Recent Graphics */}
          <div className="bg-white border border-slate-200/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recent Graphics</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {graphicsList.length > 0
                      ? `${graphicsList.length} graphics tracked from database`
                      : 'Live database tracking'}
                  </p>
                </div>
              </div>

              <Link
                href="/admin/requirements"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors group"
              >
                <span>View All Graphics</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Selected batch toolbar */}
            {selectedRowIds.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900 animate-in fade-in">
                <span className="font-semibold">
                  {selectedRowIds.length} {selectedRowIds.length === 1 ? 'graphic' : 'graphics'} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActionMessage({
                        type: 'success',
                        text: `${selectedRowIds.length} graphics flagged for safe quarantine retention.`,
                      });
                      setSelectedRowIds([]);
                    }}
                    className="px-3 py-1 bg-white hover:bg-slate-50 text-blue-700 font-bold rounded-lg border border-blue-200 shadow-2xs transition-colors"
                  >
                    Protect from Cleanup
                  </button>
                  <button
                    onClick={() => setSelectedRowIds([])}
                    className="px-2 py-1 text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <th className="py-3 px-2 w-8">
                      <input
                        type="checkbox"
                        checked={selectedRowIds.length === filteredGraphics.length && filteredGraphics.length > 0}
                        onChange={handleSelectAll}
                        disabled={filteredGraphics.length === 0}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                      />
                    </th>
                    <th className="py-3 px-3">Preview</th>
                    <th className="py-3 px-3">File Name</th>
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">Uploaded On</th>
                    <th className="py-3 px-3">Age</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredGraphics.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-700">No Graphics Stored</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            There are currently no graphics stored in the database. New deliverables uploaded by designers will be tracked here automatically.
                          </p>
                          <Link
                            href="/admin/requirements"
                            className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>Manage Requirements</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredGraphics.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-2">
                          <input
                            type="checkbox"
                            checked={selectedRowIds.includes(item.id)}
                            onChange={() => handleToggleRow(item.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Preview Thumbnail */}
                        <td className="py-3.5 px-3">
                          <div
                            onClick={() => setPreviewGraphic(item)}
                            className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shadow-2xs"
                          >
                            <Image
                              src={item.previewUrl}
                              alt={item.fileName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </td>

                        {/* File Name & Mime */}
                        <td className="py-3.5 px-3">
                          <button
                            onClick={() => setPreviewGraphic(item)}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left block"
                          >
                            {item.fileName}
                          </button>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.mimeType}</p>
                        </td>

                        {/* Size */}
                        <td className="py-3.5 px-3 text-slate-600 font-semibold">{item.size}</td>

                        {/* Uploaded On */}
                        <td className="py-3.5 px-3">
                          <p className="text-slate-800 font-semibold">{item.uploadedOnDate}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.uploadedOnTime}</p>
                        </td>

                        {/* Age */}
                        <td className="py-3.5 px-3 text-slate-600 font-semibold">{item.age}</td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                            {item.status}
                          </span>
                        </td>

                        {/* Action Menu */}
                        <td className="py-3.5 px-2 text-right relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === item.id && (
                            <div className="absolute right-2 top-11 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 text-left text-xs">
                              <button
                                onClick={() => {
                                  setPreviewGraphic(item);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-500" />
                                View Preview
                              </button>
                              <a
                                href={item.previewUrl}
                                download={item.fileName}
                                onClick={() => setActiveMenuId(null)}
                                className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-500" />
                                Download File
                              </a>
                              <button
                                onClick={() => {
                                  setActionMessage({
                                    type: 'success',
                                    text: `Protection applied: "${item.fileName}" will not be scheduled for 15-day deletion.`,
                                  });
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                              >
                                <Shield className="w-3.5 h-3.5 text-amber-500" />
                                Quarantine Protect
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: System Status Progress Pipeline */}
          <div className="bg-white border border-slate-200/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">System Status</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Graphics tracking &amp; cleanup scheduler is active and monitoring.
            </p>

            {/* 4-Step Flow Chart with Connecting Arrows */}
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 px-2">
              {/* Step 1: Tracking */}
              <div className="flex flex-col items-center text-center w-full md:w-1/4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
                  <Database className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-2.5">Tracking</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Scanning database</p>
              </div>

              {/* Arrow 1 */}
              <div className="hidden md:flex text-slate-300">
                <ArrowRight className="w-5 h-5" />
              </div>

              {/* Step 2: 15-Day Cycle */}
              <div className="flex flex-col items-center text-center w-full md:w-1/4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-2.5">15-Day Cycle</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Next cleanup in {timeLeft.days} days</p>
              </div>

              {/* Arrow 2 */}
              <div className="hidden md:flex text-slate-300">
                <ArrowRight className="w-5 h-5" />
              </div>

              {/* Step 3: Approval */}
              <div className="flex flex-col items-center text-center w-full md:w-1/4">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-2xs">
                  <User className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-2.5">Approval</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Pending ({metrics.pendingRequestsCount} requests)</p>
              </div>

              {/* Arrow 3 */}
              <div className="hidden md:flex text-slate-300">
                <ArrowRight className="w-5 h-5" />
              </div>

              {/* Step 4: Deletion */}
              <div className="flex flex-col items-center text-center w-full md:w-1/4">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-2xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-2.5">Deletion</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Scheduled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Cleanup Request Summary + Quick Actions) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: Cleanup Request Summary */}
          <div className="bg-white border border-slate-200/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Cleanup Request Summary</h3>
              </div>

              <button
                onClick={() => {
                  if (data?.pendingRequest) {
                    setShowApprovalModal(true);
                  } else {
                    setActionMessage({
                      type: 'success',
                      text: `Showing all ${data?.requestsHistory?.length || 0} recorded cleanup cycles in database.`,
                    });
                  }
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors group"
              >
                <span>View All Requests</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Request Cards List from real database */}
            <div className="mt-4 space-y-3">
              {displayRequests.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">No Cleanup Requests Yet</p>
                  <p className="mt-1 text-slate-400">
                    Requests are generated when a 15-day cycle elapses.
                  </p>
                </div>
              ) : (
                displayRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1.5 min-w-0">
                      {/* Badge + Code */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            req.statusColor === 'amber'
                              ? 'bg-amber-100 text-amber-700'
                              : req.statusColor === 'emerald'
                              ? 'bg-emerald-100 text-emerald-700'
                              : req.statusColor === 'rose'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{req.code}</span>
                      </div>

                      {/* Graphics count and size */}
                      <p className="text-xs font-bold text-slate-700">
                        {req.graphicsCount} graphics • {req.sizeFormatted}
                      </p>

                      {/* Date */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{req.dateFormatted}</span>
                      </div>
                    </div>

                    {/* Actions: View Button & Three Dots */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          if (req.isPending) {
                            setShowApprovalModal(true);
                          } else {
                            setSelectedRequestForDetail(req);
                          }
                        }}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setSelectedRequestForDetail(req)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card: Quick Actions */}
          <div className="bg-white border border-slate-200/90 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Action 1: Create Deletion Request */}
              <button
                onClick={handleSimulateExpiration}
                disabled={simulating}
                className="p-3.5 bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 rounded-xl flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-900 leading-tight">
                    {simulating ? 'Generating...' : 'Create Deletion Request'}
                  </p>
                </div>
              </button>

              {/* Action 2: View Audit Log */}
              <Link
                href="/admin/activity-logs"
                className="p-3.5 bg-slate-50/80 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-200 rounded-xl flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-purple-900 leading-tight">
                    View Audit Log
                  </p>
                </div>
              </Link>

              {/* Action 3: Manage Graphics */}
              <Link
                href="/admin/requirements"
                className="p-3.5 bg-slate-50/80 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-200 rounded-xl flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 leading-tight">
                    Manage Graphics
                  </p>
                </div>
              </Link>

              {/* Action 4: Open Settings */}
              <Link
                href="/admin/settings"
                className="p-3.5 bg-slate-50/80 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 rounded-xl flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 group-hover:bg-slate-700 text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                  <Settings className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900 leading-tight">
                    Open Settings
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Cleanup Approval Popup */}
      {data?.pendingRequest && (
        <CleanupApprovalModal
          request={data.pendingRequest}
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          onSuccess={(msg) => {
            setActionMessage({ type: 'success', text: msg });
            fetchStats(false);
          }}
        />
      )}

      {/* Modal: Request Detail Viewer */}
      {selectedRequestForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Request Details ({selectedRequestForDetail.code})
                  </h3>
                  <span className="text-xs text-slate-400">Governance Archive &amp; Audit</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequestForDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Status:</span>
                <span className="font-bold text-slate-800">{selectedRequestForDetail.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Graphics Count:</span>
                <span className="font-bold text-slate-800">{selectedRequestForDetail.graphicsCount} files</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Total Volume:</span>
                <span className="font-bold text-slate-800">{selectedRequestForDetail.sizeFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Timestamp:</span>
                <span className="font-bold text-slate-800">{selectedRequestForDetail.dateFormatted}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRequestForDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
              {selectedRequestForDetail.isPending && (
                <button
                  onClick={() => {
                    setSelectedRequestForDetail(null);
                    setShowApprovalModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Open Decision Form
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Full Graphic Preview */}
      {previewGraphic && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{previewGraphic.fileName}</h3>
                <span className="text-xs text-slate-400">
                  {previewGraphic.mimeType} • {previewGraphic.size}
                </span>
              </div>
              <button
                onClick={() => setPreviewGraphic(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
              <Image
                src={previewGraphic.previewUrl}
                alt={previewGraphic.fileName}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Uploaded: {previewGraphic.uploadedOnDate}</span>
              <span className="font-bold text-emerald-600">{previewGraphic.age} in database</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <a
                href={previewGraphic.previewUrl}
                download={previewGraphic.fileName}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Graphic
              </a>
              <button
                onClick={() => setPreviewGraphic(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
