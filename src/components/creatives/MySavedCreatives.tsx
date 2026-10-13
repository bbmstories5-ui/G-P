'use client';

import React, { useState } from 'react';
import {
  Download,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Search,
  CheckCircle2,
  FileImage,
  Edit3,
  Clock,
} from 'lucide-react';

interface MySavedCreativesProps {
  creatives: any[];
  onDeleteCreative: (id: string) => void;
  onEditCreative?: (creative: any) => void;
  onRefresh: () => void;
}

const calculateDaysLeft = (createdAt: string | Date) => {
  const created = new Date(createdAt).getTime();
  const expiresAt = created + 15 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const diffMs = expiresAt - now;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
};

export default function MySavedCreatives({
  creatives = [],
  onDeleteCreative,
  onEditCreative,
  onRefresh,
}: MySavedCreativesProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = creatives.filter((c) => {
    const matchesSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.memberName && c.memberName.toLowerCase().includes(search.toLowerCase())) ||
      (c.referralGroupName && c.referralGroupName.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' || c.category?.code === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleDownloadFile = async (c: any) => {
    try {
      setDownloadingId(c.id);

      // Call download tracker
      await fetch(`/api/creatives/${c.id}/download`, { method: 'POST' });

      // Trigger actual download
      const link = document.createElement('a');
      link.href = c.fileUrl;
      const safeTitle = c.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const ext = c.outputFormat ? c.outputFormat.toLowerCase() : 'png';
      link.download = `${safeTitle}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onRefresh();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">My Saved Creatives & Download History</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Access your previously generated graphics, track downloads, and re-download anytime.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creatives..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories</option>
            <option value="MEETING_ANNOUNCEMENT">Announcement</option>
            <option value="BUSINESS_PRESENTATION">Presentation</option>
            <option value="KYM">KYM</option>
            <option value="BIRTHDAY">Birthday</option>
          </select>
        </div>
      </div>

      {/* 15-Day Auto-Retention Policy Banner */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 mb-5 flex items-start gap-2.5 text-xs text-amber-900">
        <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-amber-950">15-Day Database Auto-Retention Policy</p>
          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
            All generated graphics are stored for 15 days in your database and account before automatic deletion. You can edit any template or download HD copies at any time before expiration.
          </p>
        </div>
      </div>

      {/* Grid or Empty */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileImage className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-700">No saved creatives yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Choose a category above, select a template, and generate your first professional referral graphic.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const daysLeft = calculateDaysLeft(c.createdAt);
            return (
              <div
                key={c.id}
                className="group border border-slate-200/90 hover:border-slate-300 rounded-xl bg-white p-3.5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Preview Thumbnail */}
                  <div className="relative aspect-square w-full rounded-lg bg-slate-50 border border-slate-100 overflow-hidden mb-3">
                    {c.fileUrl ? (
                      <img
                        src={c.fileUrl}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <FileImage className="w-10 h-10" />
                      </div>
                    )}

                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold">
                      {c.outputFormat || 'PNG'}
                    </span>

                    {/* Expiry Badge */}
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-xs ${
                        daysLeft <= 3
                          ? 'bg-rose-600/90 text-white'
                          : daysLeft <= 7
                          ? 'bg-amber-600/90 text-white'
                          : 'bg-slate-900/80 text-white backdrop-blur-xs'
                      }`}
                      title={`Auto-deletes from database in ${daysLeft} days`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{daysLeft === 0 ? 'Expires today' : `${daysLeft}d left`}</span>
                    </span>
                  </div>

                  {/* Details */}
                  <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{c.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                      {c.category?.name || 'Creative'}
                    </span>
                    {c.template?.name && (
                      <span className="text-[11px] text-slate-500 truncate">{c.template.name}</span>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {new Date(c.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="font-medium text-slate-600">
                      {c.downloadCount} {c.downloadCount === 1 ? 'download' : 'downloads'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDeleteCreative(c.id)}
                      title="Delete creative"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {onEditCreative && (
                      <button
                        onClick={() => onEditCreative(c)}
                        title="Edit creative details & template"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/60 rounded-lg transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownloadFile(c)}
                    disabled={downloadingId === c.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingId === c.id ? 'Downloading...' : 'Download'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
