'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  Layers,
  Calendar,
  Presentation,
  UserCheck,
  Cake,
  Check,
  RefreshCw,
  Search,
  Filter,
  FileImage,
  Download,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Shield,
  Upload,
  ChevronLeft,
  ChevronRight,
  Copy,
  Clock,
  User,
  Building,
  Save,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { tabFetch } from '@/lib/tabAuth';
import { renderCreativeOnCanvas } from '@/lib/creativeCanvasRenderer';

export default function AdminTemplateManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [logos, setLogos] = useState<any[]>([]);
  const [allCreatives, setAllCreatives] = useState<any[]>([]);
  const [creativeRequests, setCreativeRequests] = useState<any[]>([]);
  const [sharedFooterConfig, setSharedFooterConfig] = useState<any>(null);

  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'INACTIVE'>('ALL');
  const [activeTab, setActiveTab] = useState<
    'TEMPLATES' | 'LOGOS' | 'SHARED_FOOTER' | 'REQUESTS_QUEUE' | 'RECORDS'
  >('TEMPLATES');

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modals
  const [previewingTemplate, setPreviewingTemplate] = useState<any>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [editingLogo, setEditingLogo] = useState<any>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmTemplateNameInput, setConfirmTemplateNameInput] = useState('');
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  // Logo Form State
  const [logoForm, setLogoForm] = useState<any>({
    name: '',
    slug: '',
    logoUrl: '',
    darkLogoUrl: '',
    isDefault: false,
    isActive: true,
    sortOrder: 0,
  });

  // Shared Footer Form State
  const [footerForm, setFooterForm] = useState<any>({
    referralGroup: 'JBN PEARL',
    chapterLocation: 'Ahmedabad',
    mainSponsor: { name: 'BONICA JEWELS', type: 'REFERRAL MAIN SPONSOR', logoUrl: '/logos/official/sponsor-bonica-jewels.png' },
    coSponsor: { name: 'DHS MULTI SPECIALITY HOSPITAL', type: 'REFERRAL CO-SPONSOR', logoUrl: '/logos/official/sponsor-dhs-hospital.png' },
    titleSponsor: { name: 'PAGARIYA GROUP', type: 'Title Sponsor', logoUrl: '/logos/official/sponsor-pagariya-group.png' },
    referralTeam: [
      { role: 'Referral Head', name: 'Dr. Ketan Patel', phone: '+91 98250 12345' },
      { role: 'Referral Lead', name: 'Jigar Shah', phone: '+91 98251 23456' },
      { role: 'Referral Secretary', name: 'Bhavin Mehta', phone: '+91 98252 34567' },
    ],
    leadership: [
      { designation: 'Chairman', name: 'Sanjeev Chhajer', org: 'JITO Ahmedabad' },
      { designation: 'Chief Secretary', name: 'Asit Shah', org: 'JITO Ahmedabad' },
      { designation: 'JBN Convener', name: 'Rajesh Jain', org: 'JBN Apex' },
      { designation: 'Co-Convener', name: 'Nilesh Mehta', org: 'JBN Apex' },
    ],
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, tplsRes, logosRes, creativesRes, sharedRes, requestsRes] = await Promise.all([
        tabFetch('/api/creatives/categories?all=true'),
        tabFetch('/api/creatives/templates?all=true'),
        tabFetch('/api/creatives/logos?all=true'),
        tabFetch('/api/creatives?all=true'),
        tabFetch('/api/creatives/shared-content'),
        tabFetch('/api/creatives/requests'),
      ]);

      const catsData = await catsRes.json();
      const tplsData = await tplsRes.json();
      const logosData = await logosRes.json();
      const creativesData = await creativesRes.json();
      const sharedData = await sharedRes.json();
      const requestsData = await requestsRes.json();

      if (catsData.categories) setCategories(catsData.categories);
      if (tplsData.templates) setTemplates(tplsData.templates);
      if (logosData.logos) setLogos(logosData.logos);
      if (creativesData.creatives) setAllCreatives(creativesData.creatives);
      if (requestsData.requests) setCreativeRequests(requestsData.requests);

      if (sharedData.config) {
        setSharedFooterConfig(sharedData.config);
        setFooterForm((prev: any) => ({ ...prev, ...sharedData.config }));
      }
    } catch (err) {
      console.error('Failed to load admin templates data:', err);
      showToast('Error loading template records', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Duplicate template
  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      const res = await tabFetch('/api/creatives/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', templateId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Template duplicated successfully as draft.');
        fetchData();
      } else {
        showToast(data.error || 'Failed to duplicate template', 'error');
      }
    } catch (err) {
      showToast('Error duplicating template', 'error');
    }
  };

  // Toggle publish / unpublish
  const handleTogglePublish = async (tpl: any) => {
    const newStatus = tpl.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await tabFetch('/api/creatives/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tpl.id, status: newStatus }),
      });
      if (res.ok) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === tpl.id ? { ...t, status: newStatus } : t))
        );
        showToast(`Template marked as ${newStatus}.`);
      }
    } catch (err) {
      showToast('Error updating template status', 'error');
    }
  };

  // Open Delete Template Modal
  const handleOpenDeleteModal = (id: string, name: string) => {
    setTemplateToDelete({ id, name });
    setConfirmTemplateNameInput('');
  };

  // Confirm Permanent Delete Template & All Associated Records
  const handleConfirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    if (confirmTemplateNameInput.trim() !== templateToDelete.name.trim()) return;

    setIsDeletingTemplate(true);
    try {
      const res = await tabFetch(`/api/creatives/templates?id=${templateToDelete.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
        showToast(json.message || `Template "${templateToDelete.name}" and all associated data deleted.`);
        setTemplateToDelete(null);
        setConfirmTemplateNameInput('');
      } else {
        showToast(json.error || 'Failed to delete template', 'error');
      }
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      showToast(err.message || 'Network error deleting template', 'error');
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  // Save Shared Footer
  const handleSaveSharedFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await tabFetch('/api/creatives/shared-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'global_footer_config',
          label: 'Global Footer & Sponsor Leadership Configuration',
          config: footerForm,
        }),
      });
      if (res.ok) {
        showToast('Global footer and sponsor leadership saved across all templates!');
        fetchData();
      } else {
        showToast('Failed to save footer settings', 'error');
      }
    } catch (err) {
      showToast('Network error saving footer settings', 'error');
    }
  };

  // Approve / Reject Request
  const handleUpdateRequestStatus = async (requestId: string, status: 'APPROVED' | 'REJECTED', feedback?: string) => {
    try {
      const res = await tabFetch('/api/creatives/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: requestId,
          status,
          adminFeedback: feedback || (status === 'APPROVED' ? 'Approved by Admin' : 'Revision requested'),
        }),
      });
      if (res.ok) {
        showToast(`Creative Request marked as ${status}.`);
        setRejectingRequestId(null);
        setRejectReason('');
        fetchData();
      } else {
        showToast('Failed to update request status', 'error');
      }
    } catch (err) {
      showToast('Error updating request', 'error');
    }
  };

  // Filtering templates
  const filteredTemplates = templates.filter((t) => {
    const matchesCat = selectedCategoryCode === 'ALL' || t.category?.code === selectedCategoryCode;
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && t.status === 'PUBLISHED') ||
      (statusFilter === 'DRAFT' && t.status === 'DRAFT') ||
      (statusFilter === 'INACTIVE' && (t.status === 'INACTIVE' || !t.isActive));

    return matchesCat && matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTemplates.length / pageSize) || 1;
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Template Builder & Creative Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic template builder, official 6-logo library, shared footer settings, and approval workflow.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/admin/templates/builder"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Open Template Builder</span>
          </Link>
        </div>
      </div>

      {/* Primary Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'TEMPLATES'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Templates ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGOS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'LOGOS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Official 6 Logos ({logos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SHARED_FOOTER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'SHARED_FOOTER'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Shared Footer & Leadership</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS_QUEUE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'REQUESTS_QUEUE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Creative Requests Queue ({creativeRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RECORDS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'RECORDS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileImage className="w-4 h-4" />
          <span>Generated Graphics ({allCreatives.length})</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: TEMPLATES DIRECTORY & ACTIONS
          ===================================================================== */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-6">
          {/* Sub-Filters: Status & Category */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center gap-1.5">
              {(['ALL', 'PUBLISHED', 'DRAFT', 'INACTIVE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    statusFilter === st
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search template name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 w-52"
                />
              </div>

              <select
                value={selectedCategoryCode}
                onChange={(e) => {
                  setSelectedCategoryCode(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Templates Grid Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Template</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Dimensions</th>
                    <th className="py-3 px-4">Approval</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTemplates.map((tpl) => (
                    <tr key={tpl.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {tpl.previewImageUrl ? (
                              <img
                                src={tpl.previewImageUrl}
                                alt={tpl.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileImage className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{tpl.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{tpl.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">
                          {tpl.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {tpl.width}×{tpl.height} ({tpl.orientation})
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tpl.approvalRequired
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {tpl.approvalRequired ? 'Approval Req.' : 'Direct'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleTogglePublish(tpl)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition ${
                            tpl.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tpl.status === 'PUBLISHED' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>{tpl.status || 'Draft'}</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/templates/builder?id=${tpl.id}`}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title="Edit in Template Builder"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDuplicateTemplate(tpl.id)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Duplicate Template"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenDeleteModal(tpl.id, tpl.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredTemplates.length)} of{' '}
                  {filteredTemplates.length} templates
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-slate-200 rounded disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-slate-200 rounded disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: BRAND LOGO LIBRARY
          ===================================================================== */}
      {activeTab === 'LOGOS' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">
              Official 6 Logos Library
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              All 6 vector & transparent assets preserved with original aspect ratio, colors, and positioning.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {logos.map((logo) => (
                <div
                  key={logo.id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div className="h-28 bg-white border border-slate-100 rounded-lg p-3 flex items-center justify-center mb-3">
                    <img
                      src={logo.logoUrl}
                      alt={logo.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs truncate">{logo.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {logo.slug}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: SHARED FOOTER & LEADERSHIP SETTINGS
          ===================================================================== */}
      {activeTab === 'SHARED_FOOTER' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Shared Content & Global Footer Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates here immediately reflect across all 200 creative templates without requiring code changes.
            </p>
          </div>

          <form onSubmit={handleSaveSharedFooter} className="space-y-6 text-xs">
            {/* General Chapter */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Referral Group Name</label>
                <input
                  type="text"
                  value={footerForm.referralGroup || ''}
                  onChange={(e) => setFooterForm({ ...footerForm, referralGroup: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chapter Location</label>
                <input
                  type="text"
                  value={footerForm.chapterLocation || ''}
                  onChange={(e) => setFooterForm({ ...footerForm, chapterLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>

            {/* Referral Team */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs mb-3">Referral Core Team (Contacts)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {footerForm.referralTeam?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-amber-800 text-[11px] block">{item.role}</span>
                    <input
                      type="text"
                      placeholder="Name"
                      value={item.name}
                      onChange={(e) => {
                        const newTeam = [...footerForm.referralTeam];
                        newTeam[idx].name = e.target.value;
                        setFooterForm({ ...footerForm, referralTeam: newTeam });
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={item.phone}
                      onChange={(e) => {
                        const newTeam = [...footerForm.referralTeam];
                        newTeam[idx].phone = e.target.value;
                        setFooterForm({ ...footerForm, referralTeam: newTeam });
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 font-mono text-[11px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Leadership Hierarchy */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs mb-3">JITO Ahmedabad Leadership Hierarchy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {footerForm.leadership?.map((leader: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 text-[11px] block">{leader.designation}</span>
                    <input
                      type="text"
                      placeholder="Official Name"
                      value={leader.name}
                      onChange={(e) => {
                        const newLead = [...footerForm.leadership];
                        newLead[idx].name = e.target.value;
                        setFooterForm({ ...footerForm, leadership: newLead });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-800"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Footer Settings Globally</span>
            </button>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 4: CREATIVE REQUESTS QUEUE (APPROVAL WORKFLOW)
          ===================================================================== */}
      {activeTab === 'REQUESTS_QUEUE' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Member Creative Approval Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and approve member design submissions for templates configured with mandatory approval.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Request Code</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Template</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creativeRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No creative requests pending approval.
                    </td>
                  </tr>
                ) : (
                  creativeRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{req.reqCode}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{req.member?.name}</span>
                        <span className="text-[10px] text-slate-400">{req.member?.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700">{req.template?.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleUpdateRequestStatus(req.id, 'APPROVED')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectingRequestId(req.id)}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-bold border border-rose-200"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: GENERATED GRAPHICS AUDIT
          ===================================================================== */}
      {activeTab === 'RECORDS' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Generated Graphics Audit Log</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live records of member graphic downloads, format choices, and associated brand logo metadata.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Template</th>
                  <th className="py-3 px-4">Dimensions</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allCreatives.map((cr) => (
                  <tr key={cr.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{cr.memberName || 'Member'}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{cr.title}</td>
                    <td className="py-3 px-4 text-slate-500">{cr.template?.name || 'Custom'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{cr.dimensions || '1080x1080'}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(cr.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {cr.fileUrl && (
                        <a
                          href={cr.fileUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingRequestId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Provide Reason for Rejection</h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please upload a higher resolution portrait photo..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRejectingRequestId(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateRequestStatus(rejectingRequestId, 'REJECTED', rejectReason)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PERMANENT TEMPLATE DELETE MODAL (TYPE TEMPLATE NAME TO CONFIRM)
          ===================================================================== */}
      {templateToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-base">Permanently Delete Template?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This action cannot be undone. All connected records will be purged from the database.
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50/80 border border-red-200/90 rounded-xl text-xs text-red-800 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-red-900">
                ⚠️ All associated data will be completely deleted from the database:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-700">
                <li>All template elements, text blocks, and dynamic placeholders</li>
                <li>All pending & completed member requests created from this template</li>
                <li>All generated member graphics referencing this template</li>
                <li>The master template record itself</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-700">
                To confirm permanent deletion, please type the template name{' '}
                <span className="font-bold font-mono text-red-700 select-all bg-red-50 px-1 py-0.5 rounded border border-red-200">
                  {templateToDelete.name}
                </span>{' '}
                below:
              </label>

              <input
                type="text"
                autoFocus
                value={confirmTemplateNameInput}
                onChange={(e) => setConfirmTemplateNameInput(e.target.value)}
                placeholder={`Type "${templateToDelete.name}" to confirm`}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 transition-all ${
                  confirmTemplateNameInput.trim() === templateToDelete.name.trim()
                    ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900 focus:ring-emerald-500/20'
                    : 'border-slate-300 bg-white text-slate-800 focus:border-red-500 focus:ring-red-500/20'
                }`}
              />

              {confirmTemplateNameInput && confirmTemplateNameInput.trim() !== templateToDelete.name.trim() && (
                <p className="text-[11px] text-amber-600 font-medium">
                  Template name does not match yet.
                </p>
              )}

              {confirmTemplateNameInput.trim() === templateToDelete.name.trim() && (
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  ✓ Template name matches. Ready to permanently delete.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setTemplateToDelete(null);
                  setConfirmTemplateNameInput('');
                }}
                disabled={isDeletingTemplate}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteTemplate}
                disabled={confirmTemplateNameInput.trim() !== templateToDelete.name.trim() || isDeletingTemplate}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
              >
                {isDeletingTemplate ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting all data from database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete from Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
