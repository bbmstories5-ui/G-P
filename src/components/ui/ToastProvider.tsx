'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Check,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, default 4000
  action?: ToastAction;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: Omit<ToastItem, 'id' | 'createdAt'>) => string;
  dismissToast: (id: string) => void;
  success: (title: string, description?: string, duration?: number) => string;
  error: (title: string, description?: string, duration?: number) => string;
  info: (title: string, description?: string, duration?: number) => string;
  warning: (title: string, description?: string, duration?: number) => string;
  loading: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Global event bus for singleton usage without hooks if needed
type ToastListener = (toast: Omit<ToastItem, 'id' | 'createdAt'>) => void;
type DismissListener = (id: string) => void;

let globalShowToast: ToastListener | null = null;
let globalDismissToast: DismissListener | null = null;

export const toast = {
  success: (title: string, description?: string, duration?: number) => {
    if (globalShowToast) {
      globalShowToast({ type: 'success', title, description, duration });
    }
  },
  error: (title: string, description?: string, duration?: number) => {
    if (globalShowToast) {
      globalShowToast({ type: 'error', title, description, duration });
    }
  },
  info: (title: string, description?: string, duration?: number) => {
    if (globalShowToast) {
      globalShowToast({ type: 'info', title, description, duration });
    }
  },
  warning: (title: string, description?: string, duration?: number) => {
    if (globalShowToast) {
      globalShowToast({ type: 'warning', title, description, duration });
    }
  },
  loading: (title: string, description?: string) => {
    if (globalShowToast) {
      globalShowToast({ type: 'loading', title, description, duration: 15000 });
    }
  },
  dismiss: (id: string) => {
    if (globalDismissToast) {
      globalDismissToast(id);
    }
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, description, duration = 4000, action }: Omit<ToastItem, 'id' | 'createdAt'>) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        id,
        type,
        title,
        description,
        duration,
        action,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0 && type !== 'loading') {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  useEffect(() => {
    globalShowToast = (opts) => showToast(opts);
    globalDismissToast = (id) => dismissToast(id);
    return () => {
      globalShowToast = null;
      globalDismissToast = null;
    };
  }, [showToast, dismissToast]);

  const success = useCallback(
    (title: string, description?: string, duration?: number) =>
      showToast({ type: 'success', title, description, duration }),
    [showToast]
  );
  const error = useCallback(
    (title: string, description?: string, duration?: number) =>
      showToast({ type: 'error', title, description, duration }),
    [showToast]
  );
  const info = useCallback(
    (title: string, description?: string, duration?: number) =>
      showToast({ type: 'info', title, description, duration }),
    [showToast]
  );
  const warning = useCallback(
    (title: string, description?: string, duration?: number) =>
      showToast({ type: 'warning', title, description, duration }),
    [showToast]
  );
  const loading = useCallback(
    (title: string, description?: string) =>
      showToast({ type: 'loading', title, description, duration: 15000 }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, dismissToast, success, error, info, warning, loading }}
    >
      {children}
      {/* Toast Viewport Container (Bottom-Right Floating Hub) */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toasts: [],
      showToast: (opts: any) => toast.success(opts.title, opts.description),
      dismissToast: (id: string) => toast.dismiss(id),
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
      loading: toast.loading,
    };
  }
  return ctx;
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0 || toast.type === 'loading') return;
    const intervalTime = 40;
    const step = (intervalTime / toast.duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, intervalTime);
    return () => clearInterval(timer);
  }, [toast.duration, toast.type]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
            <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
      case 'loading':
        return (
          <div className="w-6 h-6 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 flex-shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
            <Info className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        );
    }
  };

  return (
    <div
      role="alert"
      className="pointer-events-auto relative group overflow-hidden w-full bg-white text-slate-900 rounded-2xl border border-slate-200/90 shadow-[0_14px_38px_rgba(0,0,0,0.09),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl p-3.5 transition-all animate-in fade-in slide-in-from-bottom-3 duration-250 ease-out"
    >
      <div className="flex items-start gap-3">
        {getIcon()}

        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[13px] font-semibold tracking-tight text-slate-900 leading-snug">
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
              {toast.description}
            </p>
          )}

          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={onDismiss}
          aria-label="Close notification"
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition flex-shrink-0 opacity-70 group-hover:opacity-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtle Bottom Auto-dismiss Progress Bar */}
      {toast.duration && toast.duration > 0 && toast.type !== 'loading' && (
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${
              toast.type === 'success'
                ? 'bg-emerald-500'
                : toast.type === 'error'
                ? 'bg-rose-500'
                : toast.type === 'warning'
                ? 'bg-amber-500'
                : 'bg-sky-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
