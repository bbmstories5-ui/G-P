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
  ExternalLink,
  Info,
} from 'lucide-react';
import { tabFetch } from '@/lib/tabAuth';

interface CleanupItem {
  graphicId: string;
  versionId: string;
  fileName: string;
  fileUrl: string;
  previewUrl?: string | null;
  fileSize: number;
  mimeType?: string;
  requirementId: string;
  reqCode: string;
  requirementTitle: string;
  createdAt: string;
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
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejecting the cleanup request.');
      return;
    }

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
      <div className="bg-slate-900 border border-purple-900/50 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-purple-950/50 text-white overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-red-950/40 via-purple-950/30 to-slate-900 flex items-start justify-between gap-4">
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
              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-lg">
                <FileImage className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Graphics to Delete</p>
                <p className="text-lg font-bold text-white">{request.graphicsCount} files</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Storage Size</p>
                <p className="text-lg font-bold text-white">{request.formattedSize}</p>
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
                <Layers className="w-4 h-4 text-purple-400" />
                Scheduled Graphics Queue ({items.length})
              </h3>
              <span className="text-xs text-slate-400">
                Only items in this request will be deleted
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-6 bg-slate-800/30 border border-slate-800 rounded-xl text-center text-slate-400 text-sm">
                No active graphic files found in queue. All assets are currently preserved.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/40">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.previewUrl && !item.previewUrl.startsWith('data:') ? (
                          <img
                            src={item.previewUrl}
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
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate max-w-xs sm:max-w-md">
                          {item.fileName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.reqCode} • {item.requirementTitle}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-medium text-slate-300">
                        {(item.fileSize / (1024 * 1024)).toFixed(2)} MB
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
              <p className="font-semibold text-blue-200">Security &amp; Safety Protocol:</p>
              <p className="text-blue-300/90 mt-0.5">
                • Files will be backed up to the quarantine archive before deletion.
                <br />
                • Active website assets, user avatars, and system branding are excluded.
                <br />
                • If rejected, all files remain completely untouched and safe.
              </p>
            </div>
          </div>

          {/* Step 2 Confirmation Views */}
          {isConfirmingApprove && (
            <div className="p-4 bg-red-950/60 border-2 border-red-500/60 rounded-xl space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Are you sure you want to delete the selected graphics?
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will delete <strong className="text-white">{request.graphicsCount} graphics</strong>{' '}
                and free approximately <strong className="text-white">{request.formattedSize}</strong>{' '}
                from storage. A quarantine backup will be kept. This operation is recorded in the Super Admin audit log.
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
                      <Trash2 className="w-3.5 h-3.5" /> Confirm &amp; Execute Deletion
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
                Reject Cleanup &amp; Preserve Graphics
              </div>
              <p className="text-xs text-slate-300">
                Please provide the reason for rejection. This will be stored in governance records, and the next 15-day cycle will start automatically.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter governance rejection reason (e.g. Graphics required for active quarter Q3 reporting / audit archive)..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
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
              Decision will start the next 15-day cleanup cycle.
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
                Approve &amp; Delete Graphics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
