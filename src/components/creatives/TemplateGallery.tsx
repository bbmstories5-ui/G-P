'use client';

import React, { useState, useMemo } from 'react';
import {
  Check,
  Sparkles,
  Search,
  Filter,
  Heart,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';

interface TemplateGalleryProps {
  templates: any[];
  selectedTemplate: any;
  onSelectTemplate: (template: any) => void;
  categoryCode: string;
}

const STYLE_FILTERS = [
  { id: 'ALL', label: 'All Styles' },
  { id: 'minimal-corporate', label: 'Minimal White' },
  { id: 'corporate-slate', label: 'Corporate' },
  { id: 'clean-editorial', label: 'Editorial' },
  { id: 'swiss-grid', label: 'Swiss Grid' },
  { id: 'luxury-black-gold', label: 'Black & Gold' },
  { id: 'white-gold', label: 'White & Gold' },
  { id: 'navy-white', label: 'Navy Blue' },
  { id: 'clean-geometric', label: 'Geometric' },
  { id: 'modern-card', label: 'Modern Card' },
  { id: 'beige-neutral', label: 'Beige Neutral' },
  { id: 'bold-typography', label: 'Bold Display' },
  { id: 'colorful-celebration', label: 'Celebration' },
];

export default function TemplateGallery({
  templates = [],
  selectedTemplate,
  onSelectTemplate,
  categoryCode,
}: TemplateGalleryProps) {
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState('ALL');
  const [orientationFilter, setOrientationFilter] = useState('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('fav_templates') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Toggle favorite
  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id];
      if (typeof window !== 'undefined') {
        localStorage.setItem('fav_templates', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Filter templates
  const filtered = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesSearch =
        !search ||
        tpl.name.toLowerCase().includes(search.toLowerCase()) ||
        tpl.slug.toLowerCase().includes(search.toLowerCase()) ||
        (tpl.description && tpl.description.toLowerCase().includes(search.toLowerCase()));

      const matchesStyle =
        styleFilter === 'ALL' || tpl.themeStyle === styleFilter;

      const matchesOrientation =
        orientationFilter === 'ALL' || tpl.orientation === orientationFilter;

      const matchesFav = !onlyFavorites || favorites.includes(tpl.id);

      return matchesSearch && matchesStyle && matchesOrientation && matchesFav;
    });
  }, [templates, search, styleFilter, orientationFilter, onlyFavorites, favorites]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Badge helper
  const getThemeBadge = (themeStyle: string) => {
    switch (themeStyle) {
      case 'white-gold':
        return { label: 'White & Gold', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'luxury-black-gold':
        return { label: 'Luxury Gold', bg: 'bg-neutral-900 text-amber-300 border-amber-500/40' };
      case 'modern-blue':
      case 'navy-white':
        return { label: 'Navy / Blue', bg: 'bg-sky-50 text-sky-800 border-sky-200' };
      case 'clean-editorial':
        return { label: 'Editorial', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'swiss-grid':
        return { label: 'Swiss Grid', bg: 'bg-zinc-100 text-zinc-900 border-zinc-300' };
      case 'clean-geometric':
        return { label: 'Geometric', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'beige-neutral':
        return { label: 'Beige Neutral', bg: 'bg-amber-50/70 text-stone-800 border-stone-200' };
      case 'bold-typography':
        return { label: 'Bold Type', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'colorful-celebration':
        return { label: 'Celebration', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
      default:
        return { label: 'Minimalist', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 space-y-4">
      {/* Header & Count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Choose Design Template</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              50 Ready Designs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            50 distinct layouts with genuine typography, composition, and visual hierarchy.
          </p>
        </div>

        {/* Favorites button */}
        <button
          onClick={() => setOnlyFavorites(!onlyFavorites)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            onlyFavorites
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-rose-600 text-rose-600' : ''}`} />
          <span>Favorites ({favorites.length})</span>
        </button>
      </div>

      {/* Search & Style Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search 50 templates..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Style Dropdown */}
        <div className="sm:col-span-4">
          <select
            value={styleFilter}
            onChange={(e) => {
              setStyleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {STYLE_FILTERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Orientation Dropdown */}
        <div className="sm:col-span-3">
          <select
            value={orientationFilter}
            onChange={(e) => {
              setOrientationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Shapes</option>
            <option value="SQUARE">Square (1:1)</option>
            <option value="PORTRAIT">Portrait (4:5)</option>
            <option value="LANDSCAPE">Landscape (16:9)</option>
          </select>
        </div>
      </div>

      {/* Grid of Templates */}
      {paginated.length === 0 ? (
        <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs font-medium text-slate-500">No templates found matching your search or filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setStyleFilter('ALL');
              setOrientationFilter('ALL');
              setOnlyFavorites(false);
            }}
            className="mt-2 text-xs font-bold text-blue-600 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {paginated.map((tpl) => {
            const isSelected = selectedTemplate?.id === tpl.id || selectedTemplate?.slug === tpl.slug;
            const theme = getThemeBadge(tpl.themeStyle);
            const isFav = favorites.includes(tpl.id);

            let styleConfig: any = {};
            try {
              styleConfig = typeof tpl.stylingConfig === 'string' ? JSON.parse(tpl.stylingConfig) : tpl.stylingConfig || {};
            } catch {}

            const isDarkCard = tpl.themeStyle === 'luxury-black-gold' || tpl.themeStyle === 'elegant-dark';

            return (
              <div
                key={tpl.id}
                onClick={() => onSelectTemplate(tpl)}
                className={`group relative cursor-pointer rounded-xl border-2 p-2.5 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/30 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                }`}
              >
                {/* Favorite Heart Button */}
                <button
                  onClick={(e) => toggleFavorite(e, tpl.id)}
                  title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                  className="absolute top-2 left-2 z-10 p-1 rounded-full bg-white/80 backdrop-blur-xs hover:bg-white text-slate-400 hover:text-rose-600 transition-colors shadow-xs"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                {/* Selected Check Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs z-10">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Template Visual Thumbnail Preview */}
                <div
                  className={`w-full aspect-square rounded-lg mb-2 flex flex-col items-center justify-center p-2.5 text-center border relative overflow-hidden transition-all ${
                    isDarkCard
                      ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
                      : tpl.themeStyle === 'white-gold'
                      ? 'bg-gradient-to-br from-[#FAF9F6] to-[#FFFBEB] border-amber-200 text-slate-800'
                      : tpl.themeStyle === 'navy-white' || tpl.themeStyle === 'modern-blue'
                      ? 'bg-gradient-to-br from-sky-50 to-blue-100 border-sky-200 text-slate-800'
                      : tpl.themeStyle === 'colorful-celebration'
                      ? 'bg-gradient-to-br from-amber-50 to-rose-50 border-rose-200 text-slate-800'
                      : tpl.themeStyle === 'clean-geometric'
                      ? 'bg-gradient-to-br from-teal-50 to-emerald-50 border-emerald-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {/* Decorative Frame */}
                  <div
                    className="absolute inset-1.5 border border-dashed rounded opacity-30 pointer-events-none"
                    style={{ borderColor: styleConfig.accentColor || '#94A3B8' }}
                  />

                  {/* Sparkle or Layout Badge */}
                  <div
                    className="w-7 h-7 rounded-full mb-1 flex items-center justify-center shadow-xs"
                    style={{
                      backgroundColor: styleConfig.accentColor ? `${styleConfig.accentColor}25` : '#E2E8F0',
                      color: styleConfig.accentColor || '#2563EB',
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>

                  <span className="text-[11px] font-bold tracking-tight line-clamp-1 px-1">
                    {tpl.name}
                  </span>
                  <span className="text-[9px] opacity-75 mt-0.5 font-medium">
                    {tpl.width}×{tpl.height} ({tpl.orientation})
                  </span>
                </div>

                {/* Title & Metadata */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{tpl.name}</h4>
                  <div className="mt-1 flex items-center justify-between">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${theme.bg}`}>
                      {theme.label}
                    </span>
                    {tpl.isDefault && (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of{' '}
            {filtered.length} designs
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors ${
                  currentPage === p
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
