'use client';

import React from 'react';
import { Check, Shield, Sparkles } from 'lucide-react';

export interface BrandLogoItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  darkLogoUrl?: string | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface LogoSelectorProps {
  logos: BrandLogoItem[];
  selectedLogo: BrandLogoItem | null;
  onSelectLogo: (logo: BrandLogoItem) => void;
}

export default function LogoSelector({
  logos = [],
  selectedLogo,
  onSelectLogo,
}: LogoSelectorProps) {
  if (!logos || logos.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 space-y-3.5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">Select Brand Chapter Logo</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose from the 6 approved chapter logos. Your selected logo is seamlessly embedded in the template.
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
          6 Logo Assets
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {logos.map((logo) => {
          const isSelected = selectedLogo?.id === logo.id;

          return (
            <div
              key={logo.id}
              onClick={() => onSelectLogo(logo)}
              className={`group relative cursor-pointer rounded-xl border-2 p-3 transition-all flex flex-col items-center justify-between bg-white text-center ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Selected Check Badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs z-10">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              {/* Default Tag */}
              {logo.isDefault && (
                <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                  Default
                </span>
              )}

              {/* Logo Preview Container (Preserves aspect ratio & transparency) */}
              <div className="w-full h-16 flex items-center justify-center p-2 rounded-lg bg-slate-50/80 border border-slate-100 mb-2 mt-3 overflow-hidden">
                <img
                  src={logo.logoUrl}
                  alt={logo.name}
                  className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                />
              </div>

              {/* Name */}
              <div className="w-full">
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{logo.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  Vector SVG • Transparent
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
