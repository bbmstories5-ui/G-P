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
  Clock,
  PlayCircle,
  Upload,
  Send,
  MessageSquare,
  FileCode,
  Eye,
  Lock,
  Sparkles,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import VersionHistoryTimeline from '@/components/VersionHistoryTimeline';
import GraphicViewerModal from '@/components/GraphicViewerModal';
import InteractiveGraphicCanvas from '@/components/InteractiveGraphicCanvas';
import { toast } from '@/components/ui/ToastProvider';

export default function DesignerWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const [requirement, setRequirement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingGraphic, setSubmittingGraphic] = useState(false);
  const [startingDesign, setStartingDesign] = useState(false);

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

  const handleStartDesign = async () => {
    try {
      setStartingDesign(true);
      const res = await fetch(`/api/requirements/${params.id}/start`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Design started', 'Status transitioned to In-Progress. Happy designing!');
        fetchRequirement();
      } else {
        toast.error('Could not start task', data.error || 'Failed to update status.');
      }
    } catch (e: any) {
      toast.error('Network error', e.message || 'Error updating status.');
    } finally {
      setStartingDesign(false);
    }
  };

  const handleUploadVersion = async (versionData: { fileUrl: string; fileName: string; designerNotes: string }) => {
    try {
      setSubmittingGraphic(true);
      const res = await fetch(`/api/requirements/${params.id}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          'Graphic submitted successfully',
          'Version has been submitted and sent to Approver for review.'
        );
        fetchRequirement();
      } else {
        toast.error('Upload failed', data.error || 'Could not submit graphic.');
      }
    } catch (e: any) {
      toast.error('Upload error', e.message || 'Error uploading graphic.');
    } finally {
      setSubmittingGraphic(false);
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
        toast.success('Comment sent', 'Note added to the discussion thread.');
        fetchRequirement();
      } else {
        toast.error('Comment failed', data.error || 'Could not post note.');
      }
    } catch (e: any) {
      toast.error('Error', e.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-xs text-slate-600">Loading designer studio workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">{error}</p>
        <div className="pt-2">
          <Link
            href="/designer/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Studio Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const latestGraphic = requirement.graphics?.[0];
  const latestVersion = latestGraphic?.versions?.[0];
  const isAssigned = requirement.status === 'ASSIGNED';
  const isRevision = requirement.status === 'REVISION_REQUIRED';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/designer/dashboard"
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

        {/* Primary Action Button */}
        {isAssigned && (
          <button
            onClick={handleStartDesign}
            disabled={startingDesign}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{startingDesign ? 'Starting...' : 'START DESIGN'}</span>
          </button>
        )}
      </div>

      {/* Revision Banner if Revision Required */}
      {isRevision && requirement.revisions?.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border-l-4 border-orange-500 p-5 rounded-r-2xl bg-white shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-orange-900 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
            <span>Revision Required by Approver</span>
          </div>
          <p className="text-xs text-orange-950 font-medium bg-orange-100/70 p-3 rounded-xl border border-orange-200">
            "{requirement.revisions[0].feedback}"
          </p>
          <p className="text-[11px] text-orange-800">
            Please make the requested adjustments and upload a new version below.
          </p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Graphic Studio Canvas & Version Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Graphic Canvas / Studio */}
          <InteractiveGraphicCanvas
            requirement={requirement}
            onSubmitVersion={handleUploadVersion}
            isSubmitting={submittingGraphic}
          />

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
              canDownload={true}
            />
          </div>

          {/* Collaboration Thread */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              Collaboration & Feedback ({requirement.comments?.length || 0})
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {requirement.comments?.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">
                  No comments yet. Send a note to the requester or approver.
                </div>
              ) : (
                requirement.comments?.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
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
                placeholder="Write a message to requester or approver..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Right 1 Col: Requirement Brief & Reference Material */}
        <div className="space-y-6">
          {/* Requirement Brief */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b pb-2">
              Creative Requirement Brief
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500 block">Requester Member</span>
                <span className="font-bold text-slate-800 text-sm">
                  {requirement.requester?.requesterProfile?.memberCode || requirement.requester?.name} ({requirement.requester?.requesterProfile?.department || 'Marketing'})
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Target Platform</span>
                <span className="font-semibold text-slate-800">{requirement.platform}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Required Dimensions</span>
                <span className="font-mono font-bold text-indigo-700 text-sm">{requirement.dimensions}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Deadline</span>
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
                <span className="text-slate-500 block font-semibold mb-1">Special Guidelines</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {requirement.additionalInstructions}
                </p>
              </div>
            )}
          </div>

          {/* Reference Material */}
          {requirement.files?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b pb-2">
                Reference Material / Moodboard
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

      <GraphicViewerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        version={selectedVersion}
        canDownload={true}
      />
    </div>
  );
}
