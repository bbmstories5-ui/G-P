'use client';

import React from 'react';
import { Calendar, Presentation, UserCheck, Cake, Sparkles, ArrowRight } from 'lucide-react';

interface CategoryCardsProps {
  categories: any[];
  activeCategoryCode: string;
  onSelectCategory: (code: string) => void;
}

export default function CategoryCards({
  categories,
  activeCategoryCode,
  onSelectCategory,
}: CategoryCardsProps) {
  // Icon mapper
  const getIcon = (code: string) => {
    switch (code) {
      case 'MEETING_ANNOUNCEMENT':
        return Calendar;
      case 'BUSINESS_PRESENTATION':
        return Presentation;
      case 'KYM':
        return UserCheck;
      case 'BIRTHDAY':
        return Cake;
      default:
        return Sparkles;
    }
  };

  const getAccentColor = (code: string) => {
    switch (code) {
      case 'MEETING_ANNOUNCEMENT':
        return {
          iconBg: 'bg-blue-50 text-blue-600',
          activeRing: 'border-blue-600 ring-2 ring-blue-500/10 bg-blue-50/20',
          tag: 'Weekly Announcement',
        };
      case 'BUSINESS_PRESENTATION':
        return {
          iconBg: 'bg-amber-50 text-amber-600',
          activeRing: 'border-amber-600 ring-2 ring-amber-500/10 bg-amber-50/20',
          tag: 'Keynote Feature',
        };
      case 'KYM':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600',
          activeRing: 'border-emerald-600 ring-2 ring-emerald-500/10 bg-emerald-50/20',
          tag: 'Member Spotlight',
        };
      case 'BIRTHDAY':
        return {
          iconBg: 'bg-rose-50 text-rose-600',
          activeRing: 'border-rose-600 ring-2 ring-rose-500/10 bg-rose-50/20',
          tag: 'Word Docx + Graphic',
        };
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-700',
          activeRing: 'border-slate-800 bg-slate-50',
          tag: 'Creative',
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((cat) => {
        const IconComponent = getIcon(cat.code);
        const isActive = activeCategoryCode === cat.code;
        const style = getAccentColor(cat.code);

        return (
          <div
            key={cat.id || cat.code}
            onClick={() => onSelectCategory(cat.code)}
            className={`group cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
              isActive
                ? `${style.activeRing} shadow-md`
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${style.iconBg}`}
                >
                  <IconComponent className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {style.tag}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {cat.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {cat.description || 'Generate branded graphics with minimal inputs.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">
                {cat.templates?.length || 4} templates
              </span>
              <span
                className={`text-xs font-semibold inline-flex items-center gap-1 ${
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                }`}
              >
                {isActive ? 'Selected' : 'Choose'}
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
