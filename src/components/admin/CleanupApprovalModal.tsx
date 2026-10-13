'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileImage,
  Database,
  Calendar,
  Layers,
  X,
  Loader2,
  Info,
  Clock,
  User,
} from 'lucide-react';
import { tabFetch } from '@/lib/tabAuth';

interface CleanupItem {
  graphicId: string;
  versionId: string;
  fileName: string;
  fileUrl: string;
  previewUrl?: string | null;
  fileSize: number;
  formattedSize?: string;
  mimeType?: string;
  requirementId: string;
  reqCode: string;
  requirementTitle: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerRole?: string;
  createdAt: string;
  expirationDate?: string;
  ageDays?: number;
  isExpired?: boolean;
}

interface CleanupRequestData {
  id: string;
  cycleNumber: number;
  startDate: string;
  scheduledDeletionDate: string;
  status: string;
  graphicsCount: number;
  totalSizeBytes: number;
  formattedSize: string;
  items?: CleanupItem[];
  createdAt: string;
}

interface CleanupApprovalModalProps {
  request: CleanupRequestData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function CleanupApprovalModal({
  request,
  isOpen,
  onClose,
  onSuccess,
}: CleanupApprovalModalProps) {
  const [isConfirmingApprove, setIsConfirmingApprove] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await tabFetch(`/api/admin/cleanup/${request.id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve deletion');
      }

      setIsConfirmingApprove(false);
      onSuccess(
        `Successfully deleted ${data.result?.deletedCount || 0} graphics (${request.formattedSize}). Cycle #${request.cycleNumber} completed.`
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while executing graphics deletion');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await tabFetch(`/api/admin/cleanup/${request.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject cleanup request');
      }

      setIsRejecting(false);
      onSuccess(
        `Cleanup request for Cycle #${request.cycleNumber} was rejected. All graphics have been preserved safely.`
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while rejecting cleanup request');
    } finally {
      setLoading(false);
    }
  };

  const items = request.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Cycle #{request.cycleNumber} • 15-Day Expiration
                </span>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  Pending Approval
                </span>
              </div>
              <h2 className="text-xl font-bold mt-1 text-white">
                Super Admin Graphics Cleanup Request
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <FileImage className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Graphics to Delete</p>
                <p className="text-lg font-bold text-white">{request.graphicsCount} files</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Estimated Released Storage</p>
                <p className="text-lg font-bold text-emerald-300">{request.formattedSize}</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Request Generated</p>
                <p className="text-xs font-semibold text-slate-200 mt-1">
                  {new Date(request.scheduledDeletionDate).toLocaleDateString()} at{' '}
                  {new Date(request.scheduledDeletionDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Graphics Preview Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Expired Graphics Queue ({items.length})
              </h3>
              <span className="text-xs text-slate-400">
                Preview before permanent deletion
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-6 bg-slate-800/30 border border-slate-800 rounded-xl text-center text-slate-400 text-sm">
                No active graphic files found in queue. All assets are currently preserved.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/40">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Graphic Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                        {item.previewUrl || item.fileUrl ? (
                          <img
                            src={item.previewUrl || item.fileUrl}
                            alt={item.fileName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                            }}
                          />
                        ) : (
                          <FileImage className="w-5 h-5 text-slate-500" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                          {item.fileName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span>{item.reqCode}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" />
                            {item.ownerName || item.ownerEmail || 'Designer'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span>Uploaded: {new Date(item.createdAt).toLocaleDateString()}</span>
                          {item.expirationDate && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-semibold">
                                Expired: {new Date(item.expirationDate).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {item.formattedSize || `${(item.fileSize / 1024).toFixed(0)} KB`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Governance Notice */}
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-200">Storage Cleanup Safety Safeguards:</p>
              <p className="text-blue-300/90 mt-0.5">
                • Files will be checked for shared references before physical removal to prevent broken assets.
                <br />
                • Associated database deliverables and requirement references are safely unlinked.
                <br />
                • If rejected, all files and records remain completely untouched and active.
              </p>
            </div>
          </div>

          {/* Step 2 Confirmation Views */}
          {isConfirmingApprove && (
            <div className="p-4 bg-red-950/60 border-2 border-red-500/60 rounded-xl space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Are you sure you want to approve permanent deletion?
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will delete <strong className="text-white">{request.graphicsCount} graphics</strong>{' '}
                and permanently release approximately <strong className="text-white">{request.formattedSize}</strong>{' '}
                from disk storage. Database records and deliverables will be safely removed. This operation is recorded in the Super Admin audit log.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingApprove(false)}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-red-900/50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting Files...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" /> Confirm Permanent Deletion
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {isRejecting && (
            <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                <XCircle className="w-5 h-5 text-amber-400" />
                Reject Deletion &amp; Preserve Graphics
              </div>
              <p className="text-xs text-slate-300">
                Provide an optional reason for rejecting the cleanup request. All graphics and files will remain intact.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Optional rejection reason (e.g., Graphics required for campaign retention or review)..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Rejection...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Rejection
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!isConfirmingApprove && !isRejecting && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Graphics will only be permanently removed upon Super Admin approval.
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4 text-amber-400" />
                Reject Request
              </button>

              <button
                type="button"
                onClick={() => setIsConfirmingApprove(true)}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-950/60 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Approve &amp; Permanently Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
