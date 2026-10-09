'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Palette,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  FileCode,
  Send,
  MessageSquare,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import VersionHistoryTimeline from '@/components/VersionHistoryTimeline';
import GraphicViewerModal from '@/components/GraphicViewerModal';
import { toast } from '@/components/ui/ToastProvider';

export default function RequesterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [requirement, setRequirement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchRequirement = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/requirements/${params.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load requirement');
      }

      setRequirement(data.requirement);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchRequirement();
    }
  }, [params.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await fetch(`/api/requirements/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentText('');
        toast.success('Feedback sent', 'Note attached to the request discussion thread.');
        fetchRequirement();
      } else {
        toast.error('Could not post comment', data.error || 'Failed to send note.');
      }
    } catch (e: any) {
      toast.error('Error', e.message || 'Network error.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-xs text-slate-600">Verifying authorization & loading requirement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Access Restricted / Not Found</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
        <div className="pt-2">
          <Link
            href="/requester/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> Return to My Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isApproved = requirement.status === 'FINAL_APPROVED';
  const isRejected = requirement.status === 'REJECTED';
  const latestGraphic = requirement.graphics?.[0];
  const latestVersion = latestGraphic?.versions?.[0];
  const latestApproval = requirement.approvals?.[0];
  const rejectionComment = requirement.comments?.find(
    (c: any) => c.content?.includes('Declined') || c.content?.includes('Rejected')
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/requester/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 bg-slate-900 text-white rounded-md">
                {requirement.reqCode}
              </span>
              <StatusBadge status={requirement.status} />
              <PriorityBadge priority={requirement.priority} />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
              {requirement.title}
            </h1>
          </div>
        </div>

        {/* Action button if approved */}
        {isApproved && latestVersion?.fileUrl && (
          <a
            href={latestVersion.fileUrl}
            download={latestVersion.fileName}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Approved High-Res Asset</span>
          </a>
        )}
      </div>

      {/* Rejection Alert Banner if status is REJECTED */}
      {isRejected && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-900 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                Requirement Declined / Rejected
              </h3>
              <p className="text-xs text-rose-700">
                This creative requirement was declined and removed from the active production queue.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
            <span className="font-bold text-slate-800 block">Feedback / Decline Note:</span>
            <p className="text-slate-700 leading-relaxed font-medium">
              {latestApproval?.comments ||
                rejectionComment?.content ||
                'Declined by Graphic Designer / Reviewer due to capacity or requirement clarification.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Deliverable Preview & Version History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Final Graphic Approved Card */}
          {isApproved && latestVersion && (
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-emerald-300">Final Approved Deliverable</h2>
                    <p className="text-[11px] text-slate-300">
                      Approved by {requirement.approvedBy?.name || 'Lead Approver'} &bull; Version {latestVersion.versionNumber}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedVersion(latestVersion);
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Fullscreen View
                </button>
              </div>

              {/* Graphic Large Viewport */}
              <div className="aspect-square max-w-sm mx-auto rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 flex items-center justify-center my-4">
                <img
                  src={latestVersion.fileUrl}
                  alt={latestVersion.fileName}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="text-slate-400">
                  File: <span className="text-white font-mono">{latestVersion.fileName}</span> &bull; {requirement.dimensions}
                </div>
                <a
                  href={latestVersion.fileUrl}
                  download={latestVersion.fileName}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download Final Graphic
                </a>
              </div>
            </div>
          )}

          {/* Active / In Design Graphic Preview if not approved yet */}
          {!isApproved && latestVersion && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600" />
                  Latest Submitted Graphic (Version {latestVersion.versionNumber})
                </h3>
                <StatusBadge status={latestVersion.status} size="sm" />
              </div>

              <div className="aspect-square max-w-xs mx-auto rounded-xl overflow-hidden shadow-md border border-slate-200 bg-slate-950 flex items-center justify-center my-2">
                <img
                  src={latestVersion.fileUrl}
                  alt="Draft graphic"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-center text-xs text-slate-500 mt-2">
                Currently under review by Approver.
              </p>
            </div>
          )}

          {/* Version History Component */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <VersionHistoryTimeline
              graphics={requirement.graphics || []}
              revisions={requirement.revisions || []}
              approvals={requirement.approvals || []}
              onSelectVersion={(v) => {
                setSelectedVersion(v);
                setIsModalOpen(true);
              }}
              canDownload={isApproved}
            />
          </div>

          {/* Discussion & Collaboration Thread */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              Requirement Discussion & Messages ({requirement.comments?.length || 0})
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {requirement.comments?.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">
                  No messages yet. Post instructions or updates below.
                </div>
              ) : (
                requirement.comments?.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        {c.author?.name} ({c.authorRole})
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a message or instruction..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Metadata & Assignment Details */}
        <div className="space-y-6">
          {/* Requirement Specs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b pb-2">
              Requirement Specifications
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500 block">Category</span>
                <span className="font-semibold text-slate-800">{requirement.category}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Target Platform</span>
                <span className="font-semibold text-slate-800">{requirement.platform}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Dimensions</span>
                <span className="font-mono font-semibold text-slate-800">{requirement.dimensions}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Required Delivery Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(requirement.deadline).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Created On</span>
                <span className="text-slate-700">{new Date(requirement.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t">
              <span className="text-slate-500 block font-semibold mb-1">Description</span>
              <div className="text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs whitespace-pre-wrap font-sans space-y-1">
                {requirement.description}
              </div>
            </div>

            {requirement.additionalInstructions && (
              <div className="pt-2">
                <span className="text-slate-500 block font-semibold mb-1">Additional Guidelines</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {requirement.additionalInstructions}
                </p>
              </div>
            )}
          </div>

          {/* Assigned Graphic Maker Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b pb-2 flex items-center justify-between">
              <span>Assigned Graphic Maker</span>
              <Palette className="w-4 h-4 text-blue-500" />
            </h3>

            {requirement.assignedDesigner ? (
              <div className="flex items-center gap-3">
                <img
                  src={requirement.assignedDesigner.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=designer'}
                  alt="Designer avatar"
                  className="w-10 h-10 rounded-full border border-slate-300 object-cover"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {requirement.assignedDesigner.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {requirement.assignedDesigner.designerProfile?.specialty || 'Graphic Maker'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
                <p className="font-semibold">In Open Queue</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Waiting for one of the 3 graphic makers to accept this request.
                </p>
              </div>
            )}
          </div>

          {/* Reference Material if attached */}
          {requirement.files?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b pb-2">
                Reference Material
              </h3>
              {requirement.files.map((f: any) => (
                <div key={f.id} className="space-y-2">
                  <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                    <img src={f.fileUrl} alt={f.fileName} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{f.fileName}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen modal */}
      <GraphicViewerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        version={selectedVersion}
        canDownload={isApproved}
      />
    </div>
  );
}
