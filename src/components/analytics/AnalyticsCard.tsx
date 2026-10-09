'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  onClick?: () => void;
}

export default function AnalyticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  badge,
  badgeType = 'neutral',
  onClick,
}: AnalyticsCardProps) {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'info':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs transition-all duration-200 flex flex-col justify-between ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-md active:scale-[0.99]' : ''
        }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 shadow-xs`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-500 truncate">{title}</span>
        </div>

        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle()}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
