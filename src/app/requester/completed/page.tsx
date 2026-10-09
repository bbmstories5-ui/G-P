'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Download,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  FileImage,
  FolderArchive
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import GraphicViewerModal from '@/components/GraphicViewerModal';
import { tabFetch } from '@/lib/tabAuth';

export default function RequesterCompletedPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCompleted = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await tabFetch('/api/requirements?status=COMPLETED');
      const data = await res.json();
      if (data.requirements) setRequests(data.requirements);
    } catch (e) {
      console.error('Failed to load completed archive:', e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(requests.map((r) => r.category).filter(Boolean));
    return Array.from(set);
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const codeMatch = r.reqCode?.toLowerCase().includes(q);
        const titleMatch = r.title?.toLowerCase().includes(q);
        const descMatch = r.description?.toLowerCase().includes(q);
        const designerMatch = r.assignedDesigner?.name?.toLowerCase().includes(q);
        if (!codeMatch && !titleMatch && !descMatch && !designerMatch) return false;
      }
      return true;
    });
  }, [requests, search, categoryFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Completed Archive</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical list of finalized and archived design requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => fetchCompleted(true)}
            disabled={refreshing}
            title="Refresh"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search completed requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading archive...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-sm mx-auto space-y-2">
          <FolderArchive className="w-7 h-7 text-slate-300 mx-auto" />
          <div className="text-xs font-semibold text-slate-800">No completed requests</div>
          <p className="text-[11px] text-slate-500">
            {search || categoryFilter !== 'ALL'
              ? 'No requests match your search criteria.'
              : 'Requests that reach the completed state will be archived here.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Platform & Size</th>
                  <th className="py-3 px-4">Assigned Designer</th>
                  <th className="py-3 px-4">Completed Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((r) => {
                  const version = r.graphics?.[0]?.versions?.[0];

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {r.reqCode}
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/requester/requests/${r.id}`}
                          className="font-bold text-slate-900 hover:text-slate-700 transition-colors block text-xs"
                        >
                          {r.title}
                        </Link>
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                          {r.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{r.platform}</div>
                        <div className="font-mono text-[10px] text-slate-400">{r.dimensions}</div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700">
                        {r.assignedDesigner?.name || 'Assigned Designer'}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(r.updatedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/requester/requests/${r.id}`}
                            className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-medium transition-colors"
                          >
                            Details
                          </Link>
                          {version?.fileUrl && (
                            <a
                              href={version.fileUrl}
                              download={version.fileName || `${r.reqCode}-final.png`}
                              className="p-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const version = req.graphics?.[0]?.versions?.[0];

            return (
              <div
                key={req.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video bg-slate-900 p-2 flex items-center justify-center relative group overflow-hidden">
                    {version?.fileUrl ? (
                      <img
                        src={version.fileUrl}
                        alt={req.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                        <FileImage className="w-5 h-5 text-slate-600" />
                        <span>No preview</span>
                      </div>
                    )}

                    {version?.fileUrl && (
                      <button
                        onClick={() => {
                          setSelectedVersion(version);
                          setIsModalOpen(true);
                        }}
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-medium transition-opacity"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {req.reqCode}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>

                    <h3 className="font-bold text-slate-900 text-xs truncate">
                      {req.title}
                    </h3>
                    <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                      {req.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{req.platform}</span>
                      <span className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                        {req.dimensions}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    href={`/requester/requests/${req.id}`}
                    className="flex-1 text-center py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-medium transition-colors shadow-2xs"
                  >
                    Details
                  </Link>
                  {version?.fileUrl && (
                    <a
                      href={version.fileUrl}
                      download={version.fileName || `${req.reqCode}-final.png`}
                      className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-2xs flex items-center gap-1 text-xs font-medium"
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Asset Viewer Modal */}
      <GraphicViewerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        version={selectedVersion}
        canDownload={true}
      />
    </div>
  );
}
