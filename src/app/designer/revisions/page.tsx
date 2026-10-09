'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Upload, ArrowRight } from 'lucide-react';
import PriorityBadge from '@/components/PriorityBadge';

export default function DesignerRevisionsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/requirements?scope=mine&status=REVISION_REQUIRED')
      .then((res) => res.json())
      .then((data) => {
        if (data.requirements) setRequests(data.requirements);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-orange-600" />
          Revisions Required ({requests.length})
        </h1>
        <p className="text-xs text-slate-500">
          The Lead Approver has requested modifications on these graphic submissions. Review notes and submit new version.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading revision queue...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700">No revisions currently pending!</p>
          <p className="text-xs text-slate-400 mt-1">All your submitted work is either reviewed or approved.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {requests.map((req) => {
            const latestGraphic = req.graphics?.[0];
            const version = latestGraphic?.versions?.[0];

            return (
              <div
                key={req.id}
                className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                      {req.reqCode}
                    </span>
                    <PriorityBadge priority={req.priority} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                  <div className="text-xs text-slate-500">
                    Requester: <strong>{req.requester?.requesterProfile?.memberCode || req.requester?.name}</strong>
                  </div>

                  {/* Approver Revision Box */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-950 space-y-1">
                    <div className="font-bold text-orange-900 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                      Approver Change Request:
                    </div>
                    <p className="font-medium italic">
                      "Please update typography, sharpen contrast and verify logo placement."
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href={`/designer/requests/${req.id}`}
                    className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Revised Graphic Version</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
