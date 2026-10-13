'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  UploadCloud,
  FileImage,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Search,
  Filter,
  X,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  History,
  Lock,
  Layers,
  Check,
  ArrowRight,
  Eye,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import { tabFetch } from '@/lib/tabAuth';

interface SupportIssue {
  id: string;
  issueCode: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  affectedPage?: string | null;
  reporterId: string;
  reporter?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  resolvedById?: string | null;
  resolvedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  resolvedAt?: string | null;
  resolutionSummary?: string | null;
  previousResolutions?: string | null;
  screenshotCleanupStatus: 'NONE' | 'PENDING' | 'COMPLETED' | 'FAILED';
  screenshotCleanupCompletedAt?: string | null;
  screenshotCleanupError?: string | null;
  deletedScreenshotCount: number;
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    isScreenshot: boolean;
    uploadedAt: string;
  }>;
  activities: Array<{
    id: string;
    action: string;
    details?: string;
    userName: string;
    userRole: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface HelpSupportCenterProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

export default function HelpSupportCenter({ currentUser }: HelpSupportCenterProps) {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [issues, setIssues] = useState<SupportIssue[]>([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  // Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIssueDetails, setSelectedIssueDetails] = useState<SupportIssue | null>(null);
  const [resolvingIssue, setResolvingIssue] = useState<SupportIssue | null>(null);
  const [reopeningIssue, setReopeningIssue] = useState<SupportIssue | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedIssueHistory, setExpandedIssueHistory] = useState<Record<string, boolean>>({});

  // Resolve Modal Form State
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [confirmDeleteScreenshots, setConfirmDeleteScreenshots] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  // Retry Cleanup State
  const [retryingIssueId, setRetryingIssueId] = useState<string | null>(null);

  // Reopen Modal Form State
  const [reopenReason, setReopenReason] = useState('');
  const [reopenFiles, setReopenFiles] = useState<Array<{ fileUrl: string; fileName: string; fileSize: number }>>([]);
  const [isReopening, setIsReopening] = useState(false);
  const [reopenError, setReopenError] = useState('');

  // Report Modal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('CANVAS_STUDIO');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newAffectedPage, setNewAffectedPage] = useState('/requester/creative-studio');
  const [newUploadedFiles, setNewUploadedFiles] = useState<Array<{ fileUrl: string; fileName: string; fileSize: number }>>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reopenFileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = currentUser?.role === 'ADMIN';

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('status', activeTab);
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (selectedPriority !== 'ALL') params.set('priority', selectedPriority);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await tabFetch(`/api/support/issues?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setIssues(data.issues || []);
        if (data.counts) setCounts(data.counts);

        // Keep open issue details updated
        if (selectedIssueDetails) {
          const fresh = (data.issues || []).find((i: SupportIssue) => i.id === selectedIssueDetails.id);
          if (fresh) setSelectedIssueDetails(fresh);
        }
      }
    } catch (err) {
      console.error('Failed to load support issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [activeTab, selectedCategory, selectedPriority]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIssues();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Screenshot Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isReopen = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFiles(true);
    setReportError('');
    setReopenError('');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'attachment');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload screenshot');
        }

        const uploadedItem = {
          fileUrl: data.url,
          fileName: file.name,
          fileSize: file.size,
        };

        if (isReopen) {
          setReopenFiles((prev) => [...prev, uploadedItem]);
        } else {
          setNewUploadedFiles((prev) => [...prev, uploadedItem]);
        }
      }
    } catch (err: any) {
      if (isReopen) {
        setReopenError(err.message || 'File upload failed');
      } else {
        setReportError(err.message || 'File upload failed');
      }
    } finally {
      setIsUploadingFiles(false);
      if (e.target) e.target.value = '';
    }
  };

  // Submit New Issue
  const handleSubmitNewIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      setReportError('Please provide both an issue title and description.');
      return;
    }

    setIsSubmittingReport(true);
    setReportError('');

    try {
      const res = await tabFetch('/api/support/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          category: newCategory,
          priority: newPriority,
          affectedPage: newAffectedPage.trim(),
          attachments: newUploadedFiles,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit issue');
      }

      setNewTitle('');
      setNewDescription('');
      setNewUploadedFiles([]);
      setIsReportModalOpen(false);
      setActiveTab('ACTIVE');
      fetchIssues();
    } catch (err: any) {
      setReportError(err.message || 'Failed to submit issue');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Execute Mark As Done / Resolve
  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIssue) return;

    if (!resolutionSummary.trim()) {
      setResolveError('A resolution summary is required before resolving the issue.');
      return;
    }

    if (!confirmDeleteScreenshots) {
      setResolveError('Please confirm the permanent deletion of screenshots.');
      return;
    }

    setIsResolving(true);
    setResolveError('');

    try {
      const res = await tabFetch(`/api/support/issues/${resolvingIssue.id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionSummary: resolutionSummary.trim(),
          confirmDeleteScreenshots: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark issue as resolved');
      }

      // If details modal is open for this issue, update it
      if (selectedIssueDetails?.id === resolvingIssue.id) {
        setSelectedIssueDetails(data.issue);
      }

      setResolvingIssue(null);
      setResolutionSummary('');
      setConfirmDeleteScreenshots(false);
      fetchIssues();
    } catch (err: any) {
      setResolveError(err.message || 'Resolve operation failed');
    } finally {
      setIsResolving(false);
    }
  };

  // Retry Failed Cleanup
  const handleRetryCleanup = async (issueId: string) => {
    try {
      setRetryingIssueId(issueId);
      const res = await tabFetch(`/api/support/issues/${issueId}/retry-cleanup`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Retry cleanup failed');
      } else {
        if (selectedIssueDetails?.id === issueId) {
          setSelectedIssueDetails(data.issue);
        }
        fetchIssues();
      }
    } catch (err) {
      console.error('Error retrying cleanup:', err);
    } finally {
      setRetryingIssueId(null);
    }
  };

  // Execute Reopen Issue
  const handleConfirmReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopeningIssue) return;

    setIsReopening(true);
    setReopenError('');

    try {
      const res = await tabFetch(`/api/support/issues/${reopeningIssue.id}/reopen`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reopenReason.trim() || 'Reopened for additional review',
          newAttachments: reopenFiles,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reopen issue');
      }

      if (selectedIssueDetails?.id === reopeningIssue.id) {
        setSelectedIssueDetails(data.issue);
      }

      setReopeningIssue(null);
      setReopenReason('');
      setReopenFiles([]);
      setActiveTab('ACTIVE');
      fetchIssues();
    } catch (err: any) {
      setReopenError(err.message || 'Failed to reopen issue');
    } finally {
      setIsReopening(false);
    }
  };

  // Helper Badge Colors
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REOPENED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* ========================================================= */}
      {/* TOP HERO HEADER (Clean White Theme)                       */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-semibold text-blue-700">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Help Center &amp; Automated Storage Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Help &amp; Issue Resolution Center
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Report design glitches, canvas bugs, or template defects with screenshot evidence.
              When Super Admin marks an issue as <span className="text-emerald-700 font-semibold">Done</span>,
              all uploaded screenshots are automatically and permanently purged from storage while full resolution history is preserved.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Report New Issue</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Strip (Clean White / Light Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
            <div className="text-xs text-amber-700 font-bold uppercase tracking-wider">Active Issues</div>
            <div className="text-2xl font-black text-amber-800 mt-0.5">{counts.active}</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
            <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Resolved &amp; Cleaned</div>
            <div className="text-2xl font-black text-emerald-800 mt-0.5">{counts.resolved}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Registered</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{counts.total}</div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONTROLS & TABS STRIP                                     */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Active vs Resolved Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Issues</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
              {counts.active}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('RESOLVED')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'RESOLVED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Resolved History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
              {counts.resolved}
            </span>
          </button>
        </div>

        {/* Filter and Search Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, title, module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="CANVAS_STUDIO">Creative Studio</option>
            <option value="TEMPLATE_EDITOR">Template Builder</option>
            <option value="DOWNLOAD_EXPORT">Export &amp; Download</option>
            <option value="AUTH_LOGIN">Login &amp; Auth</option>
            <option value="GENERAL">General Bug</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ISSUES LIST (Clean, compact list cards - click to open popup) */}
      {/* ========================================================= */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-200/80 space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading issues &amp; storage status...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-200/80 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
            {activeTab === 'ACTIVE' ? <CheckCircle2 className="w-7 h-7 text-emerald-500" /> : <HelpCircle className="w-7 h-7" />}
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {activeTab === 'ACTIVE' ? 'No Active Issues Right Now' : 'No Resolved Issues Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            {activeTab === 'ACTIVE'
              ? 'All reported bugs and user support requests have been resolved. New issues will appear here.'
              : 'Issues resolved by Super Admin will appear here along with their resolution summaries and confirmation of deleted screenshots.'}
          </p>
          {activeTab === 'ACTIVE' && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Report an Issue</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const isResolved = issue.status === 'RESOLVED' || issue.status === 'CLOSED';
            const isCleanedUp = issue.screenshotCleanupStatus === 'COMPLETED';
            const hasAttachments = issue.attachments && issue.attachments.length > 0;

            return (
              <div
                key={issue.id}
                onClick={() => setSelectedIssueDetails(issue)}
                className="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400/80 transition-all cursor-pointer p-4 sm:p-5 space-y-3 select-none"
              >
                {/* Header Row: Code, Badges, Direct Quick Actions */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                      {issue.issueCode}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getStatusBadge(
                        issue.status
                      )}`}
                    >
                      {issue.status}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getPriorityBadge(
                        issue.priority
                      )}`}
                    >
                      {issue.priority} Priority
                    </span>
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200/70">
                      {issue.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Right quick buttons */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {!isResolved && isSuperAdmin && (
                      <button
                        onClick={() => {
                          setResolvingIssue(issue);
                          setResolutionSummary('');
                          setConfirmDeleteScreenshots(false);
                          setResolveError('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    )}

                    {isResolved && (
                      <button
                        onClick={() => {
                          setReopeningIssue(issue);
                          setReopenReason('');
                          setReopenFiles([]);
                          setReopenError('');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                        title="Reopen Issue"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reopen</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedIssueDetails(issue)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                {/* Middle: Title & preview snippet */}
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {issue.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                {/* Bottom Strip: Status Chips & Reporter */}
                <div className="flex items-center justify-between gap-3 flex-wrap text-xs pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    {isResolved && isCleanedUp && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Screenshots Permanently Deleted ({issue.deletedScreenshotCount || 1})</span>
                      </span>
                    )}

                    {!isResolved && hasAttachments && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        <FileImage className="w-3 h-3 text-blue-600" />
                        <span>{issue.attachments.length} Screenshot(s) Attached</span>
                      </span>
                    )}

                    {issue.affectedPage && (
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 truncate max-w-[220px]">
                        {issue.affectedPage}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200">
                      <img
                        src={issue.reporter?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt="Reporter"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span>Reported by <strong className="text-slate-700">{issue.reporter?.name}</strong></span>
                    <span>&bull;</span>
                    <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* POPUP MODAL: FULL ISSUE DETAILS ("open pop to all details")*/}
      {/* ========================================================= */}
      {selectedIssueDetails && (
        <div
          onClick={() => setSelectedIssueDetails(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                    {selectedIssueDetails.issueCode}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-0.5 rounded-lg border ${getStatusBadge(
                      selectedIssueDetails.status
                    )}`}
                  >
                    {selectedIssueDetails.status}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-0.5 rounded-lg border ${getPriorityBadge(
                      selectedIssueDetails.priority
                    )}`}
                  >
                    {selectedIssueDetails.priority} Priority
                  </span>
                  <span className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-0.5 rounded-lg border border-slate-200/80">
                    {selectedIssueDetails.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {selectedIssueDetails.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedIssueDetails(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reporter & Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0">
                  <img
                    src={selectedIssueDetails.reporter?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="Reporter"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Reporter</div>
                  <div className="font-bold text-slate-800">{selectedIssueDetails.reporter?.name}</div>
                  <div className="text-[10px] text-slate-500">{selectedIssueDetails.reporter?.email}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Affected Module</div>
                <div className="font-mono text-xs text-blue-700 font-semibold truncate">
                  {selectedIssueDetails.affectedPage || 'Not specified'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Submitted: {new Date(selectedIssueDetails.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Problem Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Full Description
              </h4>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedIssueDetails.description}
              </div>
            </div>

            {/* Screenshot Evidence / Cleaned Up Notice */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileImage className="w-4 h-4 text-slate-500" />
                  <span>Screenshot Evidence &amp; Storage State</span>
                </h4>

                {selectedIssueDetails.screenshotCleanupStatus === 'COMPLETED' && (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Screenshots Permanently Deleted</span>
                  </span>
                )}
              </div>

              {/* Active Issue: Display Active Images */}
              {selectedIssueDetails.status !== 'RESOLVED' &&
                selectedIssueDetails.attachments &&
                selectedIssueDetails.attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    {selectedIssueDetails.attachments.map((att) => (
                      <div
                        key={att.id}
                        onClick={() => setPreviewImage(att.fileUrl)}
                        className="group relative aspect-square rounded-xl bg-white border border-slate-200 overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all"
                      >
                        <img
                          src={att.fileUrl}
                          alt={att.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-5 h-5" />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-slate-900/70 backdrop-blur-xs p-1 text-[9px] text-white truncate text-center">
                          {att.fileName}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Active Issue: No attachments */}
              {selectedIssueDetails.status !== 'RESOLVED' &&
                (!selectedIssueDetails.attachments || selectedIssueDetails.attachments.length === 0) && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 italic">
                    No screenshot files were attached to this report.
                  </div>
                )}

              {/* Resolved Issue with Cleaned Up Screenshots */}
              {selectedIssueDetails.screenshotCleanupStatus === 'COMPLETED' && (
                <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-1.5 text-xs text-emerald-950">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Storage &amp; Privacy Policy Enforced: Files Pruned</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed pl-6">
                    All screenshot files belonging to this issue have been permanently erased from disk storage, and the database attachment records have been pruned. No broken images or orphan files remain on the server.
                    {selectedIssueDetails.deletedScreenshotCount > 0 && (
                      <span className="font-semibold block mt-1">
                        Total files wiped: {selectedIssueDetails.deletedScreenshotCount} screenshot(s).
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Failed Cleanup alert */}
              {selectedIssueDetails.screenshotCleanupStatus === 'FAILED' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs text-rose-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Screenshot Cleanup Failed</span>
                    </div>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleRetryCleanup(selectedIssueDetails.id)}
                        disabled={retryingIssueId === selectedIssueDetails.id}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs"
                      >
                        Retry Cleanup
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-rose-800 pl-6">
                    {selectedIssueDetails.screenshotCleanupError || 'Storage removal error.'}
                  </p>
                </div>
              )}
            </div>

            {/* Resolution Summary (If Resolved) */}
            {selectedIssueDetails.resolutionSummary && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Resolution Summary</span>
                  </div>
                  <div className="text-[11px] text-blue-700 font-medium">
                    Resolved by{' '}
                    <span className="font-bold text-blue-950">
                      {selectedIssueDetails.resolvedBy?.name || 'Super Admin'}
                    </span>
                    {selectedIssueDetails.resolvedAt && (
                      <span> &bull; {new Date(selectedIssueDetails.resolvedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed bg-white/90 p-3.5 rounded-xl border border-blue-100 whitespace-pre-wrap">
                  {selectedIssueDetails.resolutionSummary}
                </p>
              </div>
            )}

            {/* Activity History Timeline */}
            {selectedIssueDetails.activities && selectedIssueDetails.activities.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-slate-500" />
                  <span>Audit Activity Timeline</span>
                </h4>
                <div className="space-y-1.5 pl-3 border-l-2 border-slate-200">
                  {selectedIssueDetails.activities.map((act) => (
                    <div key={act.id} className="text-xs space-y-0.5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-bold text-slate-800">{act.action}</span>
                        <span>by {act.userName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {act.details && (
                        <p className="text-[11px] text-slate-500">{act.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 flex-wrap">
              <div className="flex items-center gap-2">
                {selectedIssueDetails.status !== 'RESOLVED' && isSuperAdmin && (
                  <button
                    onClick={() => {
                      setResolvingIssue(selectedIssueDetails);
                      setResolutionSummary('');
                      setConfirmDeleteScreenshots(false);
                      setResolveError('');
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Done / Resolve Issue</span>
                  </button>
                )}

                {selectedIssueDetails.status === 'RESOLVED' && (
                  <button
                    onClick={() => {
                      setReopeningIssue(selectedIssueDetails);
                      setReopenReason('');
                      setReopenFiles([]);
                      setReopenError('');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reopen This Issue</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedIssueDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: MARK AS DONE / RESOLVE ISSUE CONFIRMATION        */}
      {/* ========================================================= */}
      {resolvingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Resolve Issue &amp; Auto-Delete Screenshots
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {resolvingIssue.issueCode}: {resolvingIssue.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResolvingIssue(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              {/* Resolution Summary (Mandatory) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Resolution Summary <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Describe how the bug was fixed or what solution was provided for the user.
                </p>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Fixed dynamic font size isolation when switching between templates in Creative Studio. Verified on staging..."
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Automatic Deletion Warning Box */}
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Storage Purge &amp; Data Privacy Notice</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Marking this issue as <strong>Done</strong> will permanently erase all associated screenshot files from storage and clean up their database attachment records.
                  The issue description, resolution summary, reporter details, and timeline will remain permanently available in Resolved History.
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={confirmDeleteScreenshots}
                  onChange={(e) => setConfirmDeleteScreenshots(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800 select-none">
                  I confirm this issue is resolved and agree to permanently delete its screenshot files from storage.
                </span>
              </label>

              {resolveError && (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-semibold">
                  {resolveError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingIssue(null)}
                  disabled={isResolving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving || !confirmDeleteScreenshots || !resolutionSummary.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isResolving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting Screenshots &amp; Resolving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm &amp; Mark as Done</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: REPORT A NEW ISSUE                               */}
      {/* ========================================================= */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Report a Problem or Glitch
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Submit detailed information with screenshot evidence.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewIssue} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Issue Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Text overlaps photo in template 04 on mobile"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Category & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="CANVAS_STUDIO">Creative Studio Canvas</option>
                    <option value="TEMPLATE_EDITOR">Template Builder</option>
                    <option value="DOWNLOAD_EXPORT">Download &amp; Export</option>
                    <option value="AUTH_LOGIN">Login &amp; Password</option>
                    <option value="GENERAL">General Bug</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="LOW">Low (Cosmetic)</option>
                    <option value="MEDIUM">Medium (Normal)</option>
                    <option value="HIGH">High (Blocks work)</option>
                    <option value="URGENT">Urgent (Critical)</option>
                  </select>
                </div>
              </div>

              {/* Affected Page / Module */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Affected Page / URL
                </label>
                <input
                  type="text"
                  placeholder="/requester/creative-studio"
                  value={newAffectedPage}
                  onChange={(e) => setNewAffectedPage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Problem Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe step-by-step what happened and what was expected..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Upload Screenshots Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Upload Screenshots (Evidence)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {newUploadedFiles.length} file(s) selected
                  </span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-4 text-center cursor-pointer transition-colors"
                >
                  <FileImage className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">
                    Click to select screenshots or error captures
                  </p>
                  <p className="text-[10px] text-slate-500">
                    PNG, JPG, WebP up to 5MB. Screenshots are auto-deleted when resolved.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="hidden"
                  />
                </div>

                {/* Selected File Previews */}
                {newUploadedFiles.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {newUploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden group"
                      >
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNewUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg opacity-90 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {isUploadingFiles && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold pt-1">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Uploading screenshots...</span>
                  </div>
                )}
              </div>

              {reportError && (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-semibold">
                  {reportError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  disabled={isSubmittingReport}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport || isUploadingFiles}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isSubmittingReport ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Submit Issue Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: REOPEN ISSUE MODAL                               */}
      {/* ========================================================= */}
      {reopeningIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Reopen Resolved Issue
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {reopeningIssue.issueCode}: {reopeningIssue.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReopeningIssue(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReopen} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Reopening preserves previous resolution records while putting the issue back into the active queue.
                You can optionally upload new screenshots of the recurring problem.
              </p>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Reason for Reopening <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Issue still appears when generating bulk creatives..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Optional New Screenshots for reopened issue */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Fresh Screenshots (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => reopenFileInputRef.current?.click()}
                    className="text-xs text-purple-600 font-bold hover:underline cursor-pointer"
                  >
                    + Add Images
                  </button>
                  <input
                    ref={reopenFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                  />
                </div>

                {reopenFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {reopenFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden group"
                      >
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setReopenFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {reopenError && (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-semibold">
                  {reopenError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReopeningIssue(null)}
                  disabled={isReopening}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReopening || !reopenReason.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isReopening ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Reopening...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Confirm Reopen</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LIGHTBOX MODAL FOR PREVIEWING ACTIVE SCREENSHOTS          */}
      {/* ========================================================= */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-black">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Screenshot Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
