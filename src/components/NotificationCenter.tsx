'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  Check,
  ExternalLink,
  Search,
  Trash2,
  CheckCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  RefreshCw,
  SlidersHorizontal,
  X,
  Eye,
  EyeOff,
  Inbox,
  ArrowRight,
  Filter
} from 'lucide-react';
import { tabFetch, useTabUser } from '@/lib/tabAuth';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedRequirementId?: string | null;
  isRead: boolean;
  createdAt: string;
  requirement?: {
    id: string;
    reqCode: string;
    title: string;
    status: string;
    priority: string;
    category: string;
    platform: string;
    deadline?: string;
  } | null;
}

interface NotificationMetrics {
  total: number;
  unread: number;
  approvals: number;
  revisions: number;
  assignments: number;
}

interface NotificationCenterProps {
  role?: 'REQUESTER' | 'DESIGNER' | 'APPROVER' | 'ADMIN';
  pageTitle?: string;
  subtitle?: string;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 172800) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function NotificationCenter({
  role: initialRole,
  pageTitle = 'Notifications',
  subtitle = 'Manage your project updates, review requests, and workflow status.',
}: NotificationCenterProps) {
  const user = useTabUser();
  const currentRole = initialRole || (user?.role as any) || 'REQUESTER';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [metrics, setMetrics] = useState<NotificationMetrics>({
    total: 0,
    unread: 0,
    approvals: 0,
    revisions: 0,
    assignments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'approvals' | 'revisions' | 'assignments'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  const fetchNotifications = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await tabFetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        if (data.metrics) {
          setMetrics(data.metrics);
        } else {
          const unread = data.notifications.filter((n: any) => !n.isRead).length;
          setMetrics({
            total: data.notifications.length,
            unread,
            approvals: data.notifications.filter((n: any) => ['APPROVED', 'SUBMITTED', 'REJECTED'].includes(n.type)).length,
            revisions: data.notifications.filter((n: any) => n.type === 'REVISION_REQUESTED').length,
            assignments: data.notifications.filter((n: any) => ['ASSIGNED', 'REQUIREMENT_CREATED'].includes(n.type)).length,
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleRealtimeNotif = (e: any) => {
      const newNotif = e.detail;
      if (newNotif) {
        setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
        setMetrics((prev) => ({
          ...prev,
          total: prev.total + 1,
          unread: prev.unread + 1,
        }));
      }
    };

    window.addEventListener('portal-notification-received', handleRealtimeNotif);
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      window.removeEventListener('portal-notification-received', handleRealtimeNotif);
      clearInterval(interval);
    };
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setMetrics((prev) => ({ ...prev, unread: 0 }));
    setSelectedIds(new Set());
    showToast('All notifications marked as read');

    try {
      await tabFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
    } catch (e) {
      console.error(e);
      fetchNotifications();
    }
  };

  const handleToggleRead = async (id: string, currentIsRead: boolean) => {
    const nextStatus = !currentIsRead;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: nextStatus } : n))
    );
    setMetrics((prev) => ({
      ...prev,
      unread: Math.max(0, prev.unread + (nextStatus ? -1 : 1)),
    }));

    try {
      await tabFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleRead', id, isRead: nextStatus }),
      });
    } catch (e) {
      console.error(e);
      fetchNotifications();
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) {
      setMetrics((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
        total: Math.max(0, prev.total - 1),
      }));
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast('Notification removed');

    try {
      await tabFetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'single', id }),
      });
    } catch (e) {
      console.error(e);
      fetchNotifications();
    }
  };

  const handleClearAllRead = async () => {
    const readItems = notifications.filter((n) => n.isRead);
    if (readItems.length === 0) {
      showToast('No read notifications to clear');
      return;
    }
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    setMetrics((prev) => ({ ...prev, total: prev.unread }));
    setSelectedIds(new Set());
    showToast(`Cleared ${readItems.length} read notifications`);

    try {
      await tabFetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAllRead: true }),
      });
    } catch (e) {
      console.error(e);
      fetchNotifications();
    }
  };

  const handleBatchMarkRead = async (isRead: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setNotifications((prev) =>
      prev.map((n) => (selectedIds.has(n.id) ? { ...n, isRead } : n))
    );
    setSelectedIds(new Set());
    showToast(`Marked ${ids.length} as ${isRead ? 'read' : 'unread'}`);

    try {
      await tabFetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markBatch', ids, isRead }),
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
    showToast(`Deleted ${ids.length} notifications`);

    try {
      await tabFetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch', ids }),
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread' && n.isRead) return false;
      if (activeTab === 'approvals' && !['APPROVED', 'SUBMITTED', 'REJECTED'].includes(n.type)) return false;
      if (activeTab === 'revisions' && n.type !== 'REVISION_REQUESTED') return false;
      if (activeTab === 'assignments' && !['ASSIGNED', 'REQUIREMENT_CREATED'].includes(n.type)) return false;

      if (priorityFilter !== 'all') {
        const priority = n.requirement?.priority?.toUpperCase();
        if (priority !== priorityFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = n.title?.toLowerCase().includes(q);
        const messageMatch = n.message?.toLowerCase().includes(q);
        const reqCodeMatch = n.requirement?.reqCode?.toLowerCase().includes(q);
        const reqTitleMatch = n.requirement?.title?.toLowerCase().includes(q);
        if (!titleMatch && !messageMatch && !reqCodeMatch && !reqTitleMatch) return false;
      }

      return true;
    });
  }, [notifications, activeTab, priorityFilter, searchQuery]);

  const getActionLink = (n: NotificationItem) => {
    if (!n.relatedRequirementId) return null;
    const reqId = n.relatedRequirementId;
    if (currentRole === 'APPROVER') {
      return { href: `/approver/review/${reqId}`, label: 'Review' };
    }
    if (currentRole === 'DESIGNER') {
      return { href: `/designer/requests/${reqId}`, label: 'Open Brief' };
    }
    if (currentRole === 'ADMIN') {
      return { href: `/admin/requirements`, label: 'View Request' };
    }
    return { href: `/requester/requests/${reqId}`, label: 'View Request' };
  };

  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'SUBMITTED':
        return {
          icon: <FileText className="w-4 h-4 text-slate-700" />,
          label: 'Submission',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
      case 'APPROVED':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          label: 'Approved',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'REVISION_REQUESTED':
        return {
          icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
          label: 'Revision',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'REQUIREMENT_CREATED':
        return {
          icon: <Inbox className="w-4 h-4 text-blue-600" />,
          label: 'New Request',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'ASSIGNED':
        return {
          icon: <UserCheck className="w-4 h-4 text-slate-700" />,
          label: 'Assigned',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          label: 'Rejected',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4 text-slate-600" />,
          label: 'Update',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const isAllSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((n) => selectedIds.has(n.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg shadow-lg text-xs font-medium border border-slate-800">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            title="Refresh"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleClearAllRead}
            disabled={notifications.filter((n) => n.isRead).length === 0}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium shadow-2xs transition-colors disabled:opacity-40"
          >
            Clear read
          </button>

          <button
            onClick={handleMarkAllRead}
            disabled={metrics.unread === 0}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Tabs, Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All', count: metrics.total },
              { id: 'unread', label: 'Unread', count: metrics.unread },
              { id: 'approvals', label: 'Approvals', count: metrics.approvals },
              { id: 'revisions', label: 'Revisions', count: metrics.revisions },
              { id: 'assignments', label: 'Assignments', count: metrics.assignments },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Priority Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Batch Selection Banner */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-semibold text-slate-700">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleBatchMarkRead(true)}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium transition-colors"
              >
                Mark as read
              </button>
              <button
                onClick={() => handleBatchMarkRead(false)}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium transition-colors"
              >
                Mark as unread
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded text-xs font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-500 hover:text-slate-800 px-2 font-medium"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Select All Row */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-400 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Select all ({filteredNotifications.length})</span>
          </label>
          <span>{metrics.unread} unread</span>
        </div>
      )}

      {/* Notification List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center px-4 max-w-xs mx-auto space-y-2">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-semibold text-slate-800">No notifications</div>
            <p className="text-[11px] text-slate-500">
              {searchQuery || activeTab !== 'all' || priorityFilter !== 'all'
                ? 'No notifications match your current filters.'
                : 'You are caught up on all recent activity.'}
            </p>
            {(searchQuery || activeTab !== 'all' || priorityFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                  setPriorityFilter('all');
                }}
                className="mt-2 text-xs font-medium text-slate-700 underline hover:text-slate-900"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const typeMeta = getTypeMeta(n.type);
            const action = getActionLink(n);
            const isSelected = selectedIds.has(n.id);

            return (
              <div
                key={n.id}
                className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${n.isRead ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/60 hover:bg-slate-100/60'
                  }`}
              >
                {/* Checkbox, Icon, Text Content */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="pt-0.5 flex items-center gap-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(n.id)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-400 w-3.5 h-3.5 cursor-pointer"
                    />
                    {!n.isRead ? (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread" />
                    ) : (
                      <span className="w-2 h-2 shrink-0" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${typeMeta.badgeClass}`}>
                        {typeMeta.label}
                      </span>

                      {n.requirement?.reqCode && (
                        <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {n.requirement.reqCode}
                        </span>
                      )}

                      {n.requirement?.priority && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {n.requirement.priority}
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 ml-auto sm:ml-0 font-normal">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-900 leading-snug">
                      {n.title}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {n.message}
                    </p>

                    {n.requirement && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                        <span className="truncate max-w-xs">{n.requirement.title}</span>
                        <span>•</span>
                        <span>{n.requirement.category}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleToggleRead(n.id, n.isRead)}
                    title={n.isRead ? 'Mark as unread' : 'Mark as read'}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
                  >
                    {n.isRead ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleDeleteNotification(n.id)}
                    title="Delete"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {action && (
                    <Link
                      href={action.href}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800 text-xs font-medium rounded-lg shrink-0 flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <span>{action.label}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
