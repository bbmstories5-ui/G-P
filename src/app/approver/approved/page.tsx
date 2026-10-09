'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Eye, Download } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import GraphicViewerModal from '@/components/GraphicViewerModal';

export default function ApproverApprovedPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/requirements?status=FINAL_APPROVED')
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
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          Approved Graphics Registry
        </h1>
        <p className="text-xs text-slate-500">All graphic submissions approved by governance and released to requesters.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Request ID</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Requester Member</th>
              <th className="py-3 px-4">Graphic Maker</th>
              <th className="py-3 px-4">Approved Version</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading approved assets...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">No approved assets yet.</td></tr>
            ) : (
              requests.map((r) => {
                const version = r.graphics?.[0]?.versions?.[0];
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.reqCode}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.title}</td>
                    <td className="py-3 px-4">{r.requester?.requesterProfile?.memberCode || r.requester?.name}</td>
                    <td className="py-3 px-4">{r.assignedDesigner?.designerProfile?.designerCode || r.assignedDesigner?.name}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Version {version?.versionNumber || 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {version?.fileUrl && (
                          <button
                            onClick={() => {
                              setSelectedVersion(version);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          href={`/approver/review/${r.id}`}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-emerald-600"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
