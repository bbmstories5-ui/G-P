'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Cake,
  Users,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  priority?: string;
  actionUrl?: string;
  actionLabel?: string;
  timestamp?: string;
  relatedRequirementId?: string;
}

interface IPhoneNotificationToastProps {
  toast: ToastNotification | null;
  onDismiss: () => void;
  onOpenSettings?: () => void;
}

export default function IPhoneNotificationToast({
  toast,
  onDismiss,
  onOpenSettings,
}: IPhoneNotificationToastProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const duration = 6000; // 6 seconds
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const getIcon = () => {
    const t = (toast.type || '').toUpperCase();
    const title = (toast.title || '').toLowerCase();

    if (title.includes('birthday') || t.includes('BIRTHDAY')) {
      return <Cake className="w-4 h-4 text-amber-300" />;
    }
    if (title.includes('meeting') || t.includes('MEETING')) {
      return <Users className="w-4 h-4 text-blue-300" />;
    }
    if (title.includes('presentation') || t.includes('BUSINESS')) {
      return <Briefcase className="w-4 h-4 text-indigo-300" />;
    }
    if (title.includes('kym') || t.includes('KYM')) {
      return <UserCheck className="w-4 h-4 text-emerald-300" />;
    }
    if (t === 'APPROVED' || t === 'SUCCESS') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    if (t === 'REVISION_REQUESTED' || t === 'WARNING' || t === 'URGENT') {
      return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
    if (t === 'SYSTEM') {
      return <Shield className="w-4 h-4 text-indigo-400" />;
    }
    return <Bell className="w-4 h-4 text-blue-400" />;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (toast.actionUrl) {
      router.push(toast.actionUrl);
      onDismiss();
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed z-50 top-3 right-3 sm:right-6 max-w-sm sm:max-w-md w-[calc(100vw-24px)] animate-in fade-in slide-in-from-top-4 duration-300"
      style={{ top: 'max(12px, env(safe-area-inset-top, 12px))' }}
    >
      <div
        onClick={handleClick}
        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/70 text-white shadow-2xl shadow-black/50 p-3.5 transition-all hover:border-slate-500/80 hover:bg-slate-900 active:scale-[0.99]"
      >
        {/* Top App Identity Strip (Apple iOS Header) */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center shadow-xs">
              {getIcon()}
            </div>
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-300">
              Creative Request Portal
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium">Just now</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Toast Body */}
        <div className="pt-2 pb-1 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug">
              {toast.title}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 leading-relaxed font-normal">
              {toast.message}
            </p>
          </div>

          {toast.actionUrl && (
            <div className="shrink-0 self-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 group-hover:bg-indigo-500 text-white font-bold text-[11px] shadow-sm transition-colors">
                <span>{toast.actionLabel || 'View'}</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>

        {/* iOS-Style Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
