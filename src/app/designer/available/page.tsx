'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Inbox, Check, Eye, X, AlertCircle, Trash2, Ban } from 'lucide-react';
import PriorityBadge from '@/components/PriorityBadge';
import { toast } from '@/components/ui/ToastProvider';

export default function DesignerAvailablePoolPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Reject / Decline Modal State
  const [rejectingReq, setRejectingReq] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('Insufficient reference assets / unclear brief');
  const [customReason, setCustomReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const fetchAvailable = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requirements?scope=available');
      const data = await res.json();
      if (data.requirements) setRequests(data.requirements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  const handleAccept = async (id: string) => {
    setAcceptingId(id);
    try {
      const res = await fetch(`/api/requirements/${id}/assign`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(
          'Task claimed successfully',
          'Requirement has been allocated to your workspace queue.'
        );
        router.push(`/designer/requests/${id}`);
      } else {
        toast.error('Could not claim task', data.error || 'Failed to assign requirement.');
      }
    } catch (e: any) {
      toast.error('Claim error', e.message || 'Error communicating with server.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingReq) return;
    const finalReason = customReason.trim() || rejectReason;
    setSubmittingReject(true);

    try {
      const res = await fetch(`/api/requirements/${rejectingReq.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason }),
      });

      const data = await res.json();
      if (data.success) {
        toast.warning(
          'Requirement Rejected & Removed',
          `${rejectingReq.reqCode} has been removed from the available pool and marked as rejected.`
        );
        // Remove from local pool list immediately
        setRequests((prev) => prev.filter((r) => r.id !== rejectingReq.id));
        setRejectingReq(null);
        setCustomReason('');
      } else {
        toast.error('Could not decline requirement', data.error || 'Failed to process rejection.');
      }
    } catch (e: any) {
      toast.error('Rejection error', e.message || 'Network error.');
    } finally {
      setSubmittingReject(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Inbox className="w-6 h-6 text-amber-500" />
            Available Requirements Pool
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unclaimed graphic requests submitted by company members. Claim to start designing or decline if out of capacity.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl self-start sm:self-auto">
          {requests.length} Open In Pool
        </span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading open pool...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="font-bold text-slate-700 text-sm">All caught up! No unclaimed requests in pool.</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Check back when requesters submit new requirements or return to your assigned workspace.
          </p>
          <Link
            href="/designer/dashboard"
            className="inline-block mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
          >
            Go to My Workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold bg-slate-900 text-white px-2.5 py-0.5 rounded">
                    {req.reqCode}
                  </span>
                  <PriorityBadge priority={req.priority} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Requested by: <strong>{req.requester?.requesterProfile?.memberCode || req.requester?.name}</strong> ({req.requester?.requesterProfile?.department || 'Member'})
                  </div>
                </div>

                <div className="text-xs text-slate-600 max-h-28 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap font-sans">
                  {req.description}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                  <div>
                    <span className="block text-slate-400">Platform</span>
                    <strong className="text-slate-800">{req.platform}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400">Dimensions</span>
                    <strong className="text-slate-800 font-mono">{req.dimensions}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-400">Deadline</span>
                    <strong className="text-slate-800">{new Date(req.deadline).toLocaleDateString()}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Reject Pool & Accept */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingReq(req)}
                  disabled={acceptingId === req.id}
                  className="py-2.5 px-3 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Reject from Pool</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAccept(req.id)}
                  disabled={acceptingId === req.id}
                  className="py-2.5 px-4 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{acceptingId === req.id ? 'Claiming...' : 'Accept & Start Working'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Reject Requirement from Pool
                  </h3>
                  <span className="font-mono text-xs font-bold text-rose-600">
                    {rejectingReq.reqCode}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Rejecting this request will immediately remove it from the Available Pool and notify{' '}
              <strong>{rejectingReq.requester?.name || 'the requester'}</strong> with your reason.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Reason for Rejection
              </label>

              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="Insufficient reference assets / unclear brief">
                  Insufficient reference assets / unclear brief
                </option>
                <option value="Scope mismatch / requires specialized tool">
                  Scope mismatch / requires specialized tool
                </option>
                <option value="Designer studio capacity full">
                  Designer studio capacity full
                </option>
                <option value="Unrealistic turnaround deadline">
                  Unrealistic turnaround deadline
                </option>
                <option value="Other">Other / Custom reason</option>
              </select>

              <textarea
                rows={2}
                placeholder="Additional notes for requester (optional)..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReject}
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {submittingReject ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
