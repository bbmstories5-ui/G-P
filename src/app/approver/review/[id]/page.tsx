'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  MessageSquare,
  Sparkles,
  Eye,
  FileCode,
  Download,
  Calendar,
  Layers,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import VersionHistoryTimeline from '@/components/VersionHistoryTimeline';
import GraphicViewerModal from '@/components/GraphicViewerModal';
import { toast } from '@/components/ui/ToastProvider';

export default function ApproverReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [requirement, setRequirement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Action Dialog states
  const [activeModal, setActiveModal] = useState<'APPROVE' | 'REVISION' | 'REJECT' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Comment state
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

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/requirements/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: actionNotes || 'Approved brand asset.' }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModal(null);
        setActionNotes('');
        toast.success(
          'Graphic deliverable approved',
          'Creative asset is now signed off and released to the requester.'
        );
        fetchRequirement();
      } else {
        toast.error('Approval failed', data.error || 'Could not complete approval process.');
      }
    } catch (e: any) {
      toast.error('Approval error', e.message || 'Network error during approval.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!actionNotes.trim()) {
      toast.warning('Notes required', 'Please enter specific revision feedback instructions.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/requirements/${params.id}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: actionNotes.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModal(null);
        setActionNotes('');
        toast.warning(
          'Revision requested',
          'Itemized revision notes have been dispatched to the assigned designer.'
        );
        fetchRequirement();
      } else {
        toast.error('Revision request failed', data.error || 'Could not send revision directive.');
      }
    } catch (e: any) {
      toast.error('Revision error', e.message || 'Failed to submit revision.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!actionNotes.trim()) {
      toast.warning('Reason required', 'Please provide a reason for rejecting this graphic.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/requirements/${params.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: actionNotes.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModal(null);
        setActionNotes('');
        toast.info(
          'Submission rejected',
          'The graphic submission has been marked rejected and archived.'
        );
        fetchRequirement();
      } else {
        toast.error('Rejection failed', data.error || 'Could not complete rejection.');
      }
    } catch (e: any) {
      toast.error('Rejection error', e.message || 'Error executing rejection.');
    } finally {
      setActionLoading(false);
    }
  };

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
        toast.success('Comment posted', 'Feedback note has been added to the revision thread.');
        fetchRequirement();
      } else {
        toast.error('Comment failed', data.error || 'Could not post comment.');
      }
    } catch (e: any) {
      toast.error('Comment error', e.message || 'Error posting feedback.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-xs text-slate-600">Loading creative review viewport...</p>
      </div>
    );
  }

  if (error || !requirement) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-black text-slate-900">Requirement Not Found</h2>
        <p className="text-xs text-slate-600">{error}</p>
        <Link
          href="/approver/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Queue
        </Link>
      </div>
    );
  }

  const latestGraphic = requirement.graphics?.[0];
  const latestVersion = latestGraphic?.versions?.[0];
  const isApproved = requirement.status === 'FINAL_APPROVED';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/approver/dashboard"
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

        {/* Action Decision Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setActionNotes('Approved brand asset. Meets all typography, color, and composition standards.');
              setActiveModal('APPROVE');
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all hover:scale-[1.02]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>APPROVE GRAPHIC</span>
          </button>

          <button
            onClick={() => {
              setActionNotes('');
              setActiveModal('REVISION');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
          >
            <AlertCircle className="w-4 h-4" />
            <span>REQUEST REVISION</span>
          </button>

          <button
            onClick={() => {
              setActionNotes('');
              setActiveModal('REJECT');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>REJECT</span>
          </button>
        </div>
      </div>

      {/* Main Review Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (7 cols): Graphic Reviewer & Large Viewport */}
        <div className="lg:col-span-7 space-y-6">
          {/* Final Graphic Large Viewport */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 text-white shadow-xl flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold bg-emerald-600 px-2.5 py-1 rounded text-white">
                  Version {latestVersion?.versionNumber || 1}
                </span>
                <span className="font-bold text-slate-300">
                  {latestVersion?.fileName || 'Graphic Submission'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {latestVersion && (
                  <button
                    onClick={() => {
                      setSelectedVersion(latestVersion);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Zoom in Fullscreen"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Graphic Large Viewport */}
            <div className="aspect-square max-w-md w-full rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 flex items-center justify-center my-6">
              {latestVersion?.fileUrl ? (
                <img
                  src={latestVersion.fileUrl}
                  alt="Submission"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-xs text-center p-6">
                  No graphic file uploaded by the graphic maker yet.
                </div>
              )}
            </div>

            <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs text-slate-400">
              <span>Dimensions: <strong className="text-white">{requirement.dimensions}</strong></span>
              <span>Platform: <strong className="text-white">{requirement.platform}</strong></span>
              {latestVersion?.designerNotes && (
                <div className="w-full text-left bg-slate-900 p-2.5 rounded-lg border border-slate-800 mt-1 italic text-slate-300">
                  <span className="not-italic font-bold text-slate-400">Designer notes:</span> "{latestVersion.designerNotes}"
                </div>
              )}
            </div>
          </div>

          {/* Graphic Version History Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <VersionHistoryTimeline
              graphics={requirement.graphics || []}
              revisions={requirement.revisions || []}
              approvals={requirement.approvals || []}
              onSelectVersion={(v) => {
                setSelectedVersion(v);
                setIsModalOpen(true);
              }}
              canDownload={true}
            />
          </div>

          {/* Review Discussion & Collaboration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              Requirement Discussion & Governance Audit
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {requirement.comments?.map((c: any) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>{c.author?.name} ({c.authorRole})</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-700">{c.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Post a governance instruction..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

        {/* Right Col (5 cols): Requirement Specifications & Reference Files */}
        <div className="lg:col-span-5 space-y-6">
          {/* Request Information Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b pb-2">
              REQUEST INFORMATION
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500 block">Requester</span>
                <span className="font-bold text-slate-900 text-sm">
                  {requirement.requester?.requesterProfile?.memberCode || requirement.requester?.name} ({requirement.requester?.requesterProfile?.department || 'Marketing'})
                </span>
                <span className="text-[11px] text-slate-400 block">{requirement.requester?.email}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Assigned Graphic Maker</span>
                <span className="font-bold text-slate-900 text-sm">
                  {requirement.assignedDesigner?.designerProfile?.designerCode || requirement.assignedDesigner?.name || 'Unassigned'}
                </span>
                <span className="text-[11px] text-slate-400 block">{requirement.assignedDesigner?.email}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-slate-500 block">Platform</span>
                  <span className="font-semibold text-slate-800">{requirement.platform}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Dimensions</span>
                  <span className="font-mono font-bold text-slate-900">{requirement.dimensions}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block">Delivery Deadline</span>
                <span className="font-semibold text-slate-800">
                  {new Date(requirement.deadline).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t">
              <span className="text-slate-500 block font-semibold mb-1">Requirement Description & Creative Brief</span>
              <div className="text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs whitespace-pre-wrap font-sans">
                {requirement.description}
              </div>
            </div>

            {requirement.additionalInstructions && (
              <div className="pt-2">
                <span className="text-slate-500 block font-semibold mb-1">Special Instructions</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {requirement.additionalInstructions}
                </p>
              </div>
            )}
          </div>

          {/* Reference Image / Moodboard */}
          {requirement.files?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b pb-2">
                REFERENCE MATERIAL / MOODBOARD
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

      {/* Action Dialog Modal: Approve / Revision / Reject */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3">
              {activeModal === 'APPROVE' ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : activeModal === 'REVISION' ? (
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
              )}

              <div>
                <h3 className="text-base font-black text-slate-900">
                  {activeModal === 'APPROVE'
                    ? 'Confirm Final Creative Approval'
                    : activeModal === 'REVISION'
                    ? 'Request Revisions from Designer'
                    : 'Reject Graphic Submission'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeModal === 'APPROVE'
                    ? 'The approved high-res graphic will be released exclusively to the original requester.'
                    : activeModal === 'REVISION'
                    ? 'The assigned graphic maker will be notified with your feedback.'
                    : 'The submission will be marked rejected and archived.'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {activeModal === 'APPROVE'
                  ? 'Approval Review Notes (Optional)'
                  : activeModal === 'REVISION'
                  ? 'Revision Instructions & Required Changes *'
                  : 'Rejection Reason *'}
              </label>
              <textarea
                rows={3}
                required={activeModal !== 'APPROVE'}
                placeholder={
                  activeModal === 'APPROVE'
                    ? 'e.g., Meets all corporate branding guidelines. Approved.'
                    : 'e.g., Please change the headline and replace the background image.'
                }
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>

              {activeModal === 'APPROVE' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleApprove}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : 'Confirm & Release Final Graphic'}
                </button>
              )}

              {activeModal === 'REVISION' && (
                <button
                  type="button"
                  disabled={actionLoading || !actionNotes.trim()}
                  onClick={handleRequestRevision}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Sending...' : 'Send Revision Feedback'}
                </button>
              )}

              {activeModal === 'REJECT' && (
                <button
                  type="button"
                  disabled={actionLoading || !actionNotes.trim()}
                  onClick={handleReject}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Viewer Modal */}
      <GraphicViewerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        version={selectedVersion}
        canDownload={true}
      />
    </div>
  );
}
