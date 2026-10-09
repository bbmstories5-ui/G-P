'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Shield,
  Layers,
  X,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { tabFetch, getTabSessionId } from '@/lib/tabAuth';

export interface NoticeData {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'SYSTEM' | 'WORKFLOW' | string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt?: string | Date;
  canDismiss?: boolean;
}

export default function TopNoticeBar() {
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Initialize dismissed state from tab session storage
  useEffect(() => {
    setMounted(true);
    try {
      const tabId = getTabSessionId();
      const saved = sessionStorage.getItem(`portal_dismissed_notices_${tabId}`);
      if (saved) {
        setDismissedIds(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const fetchActiveNotice = useCallback(async () => {
    try {
      const res = await tabFetch('/api/notices/active');
      if (!res.ok) return;
      const data = await res.json();
      if (data.notice) {
        setNotice(data.notice);
      } else {
        setNotice(null);
      }
    } catch (e) {
      console.error('Failed to load active notice:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchActiveNotice();

    // Listen for real-time notice updates
    const handleRealtimeNotice = (e: any) => {
      const updatedNotice = e.detail;
      if (updatedNotice && !dismissedIds.includes(updatedNotice.id)) {
        setNotice(updatedNotice);
      }
    };

    window.addEventListener('portal-notice-updated', handleRealtimeNotice);

    // Auto-poll for new real-time workflow notices every 30 seconds
    const interval = setInterval(() => {
      fetchActiveNotice();
    }, 30000);

    return () => {
      window.removeEventListener('portal-notice-updated', handleRealtimeNotice);
      clearInterval(interval);
    };
  }, [mounted, fetchActiveNotice, dismissedIds]);

  const handleDismiss = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!notice) return;

    const noticeId = notice.id;
    const nextDismissed = [...dismissedIds, noticeId];
    setDismissedIds(nextDismissed);

    try {
      const tabId = getTabSessionId();
      sessionStorage.setItem(`portal_dismissed_notices_${tabId}`, JSON.stringify(nextDismissed));
      await tabFetch(`/api/notices/${noticeId}/dismiss`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to persist dismissal:', err);
    }

    setNotice(null);
  };

  // If no notice or if user already dismissed it in this session
  if (!mounted || !notice || dismissedIds.includes(notice.id)) {
    return null;
  }

  const getStyleTokens = () => {
    const type = (notice.type || 'INFO').toUpperCase();
    const priority = (notice.priority || 'NORMAL').toUpperCase();

    if (type === 'URGENT' || priority === 'URGENT') {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        border: 'border-rose-200 dark:border-rose-800/80',
        text: 'text-rose-900 dark:text-rose-200',
        subtext: 'text-rose-700/90 dark:text-rose-300/80',
        badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border-rose-300/70 dark:border-rose-700/60',
        btnBg: 'bg-rose-700 hover:bg-rose-800 text-white dark:bg-rose-600 dark:hover:bg-rose-500',
        icon: <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
        pillLabel: 'URGENT',
      };
    }

    if (type === 'WARNING' || priority === 'HIGH') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800/80',
        text: 'text-amber-950 dark:text-amber-200',
        subtext: 'text-amber-800/90 dark:text-amber-300/80',
        badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300/70 dark:border-amber-700/60',
        btnBg: 'bg-amber-800 hover:bg-amber-900 text-white dark:bg-amber-600 dark:hover:bg-amber-500',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
        pillLabel: 'ACTION REQUIRED',
      };
    }

    if (type === 'SUCCESS') {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800/80',
        text: 'text-emerald-950 dark:text-emerald-200',
        subtext: 'text-emerald-800/90 dark:text-emerald-300/80',
        badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-700/60',
        btnBg: 'bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        pillLabel: 'READY',
      };
    }

    if (type === 'SYSTEM') {
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        border: 'border-indigo-200 dark:border-indigo-800/80',
        text: 'text-indigo-950 dark:text-indigo-200',
        subtext: 'text-indigo-800/90 dark:text-indigo-300/80',
        badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border-indigo-300/70 dark:border-indigo-700/60',
        btnBg: 'bg-indigo-700 hover:bg-indigo-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500',
        icon: <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />,
        pillLabel: 'SYSTEM',
      };
    }

    // Default INFO / WORKFLOW
    return {
      bg: 'bg-slate-50 dark:bg-neutral-900',
      border: 'border-slate-200 dark:border-neutral-800',
      text: 'text-slate-900 dark:text-white',
      subtext: 'text-slate-600 dark:text-neutral-400',
      badge: 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-300/80 dark:border-neutral-700',
      btnBg: 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900',
      icon: <Bell className="w-4 h-4 text-slate-600 dark:text-neutral-300 shrink-0" />,
      pillLabel: 'NOTICE',
    };
  };

  const style = getStyleTokens();

  return (
    <aside
      aria-label="Workflow Notice Banner"
      className={`w-full border-b ${style.bg} ${style.border} transition-all duration-200 animate-in fade-in slide-in-from-top-1`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          
          {/* Notice Content */}
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="mt-0.5 sm:mt-0 flex-shrink-0">
              {style.icon}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0 flex-1 text-xs sm:text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${style.badge}`}>
                  {style.pillLabel}
                </span>
                <span className={`font-semibold tracking-tight ${style.text}`}>
                  {notice.title}:
                </span>
              </div>

              <span className={`truncate sm:whitespace-normal leading-relaxed ${style.subtext}`}>
                {notice.message}
              </span>
            </div>
          </div>

          {/* Action Button & Dismiss */}
          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
            {notice.actionUrl && (
              <Link
                href={notice.actionUrl}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${style.btnBg}`}
              >
                <span>{notice.actionLabel || 'View →'}</span>
              </Link>
            )}

            {notice.canDismiss !== false && (
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss notice"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
