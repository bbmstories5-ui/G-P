'use client';

import React from 'react';
import { History, Eye, Download, AlertCircle, CheckCircle, Clock, FileCode, Check } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface VersionHistoryTimelineProps {
  graphics: any[];
  revisions: any[];
  approvals: any[];
  onSelectVersion?: (version: any) => void;
  canDownload?: boolean;
}

export default function VersionHistoryTimeline({
  graphics,
  revisions,
  approvals,
  onSelectVersion,
  canDownload = false,
}: VersionHistoryTimelineProps) {
  // Collect all versions flattened across graphics
  const allVersions: any[] = [];
  graphics?.forEach((g) => {
    g.versions?.forEach((v: any) => {
      allVersions.push({
        ...v,
        designer: g.designer,
      });
    });
  });

  // Sort descending by version number
  allVersions.sort((a, b) => b.versionNumber - a.versionNumber);

  if (allVersions.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs">
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        No graphic versions uploaded yet. Once a designer submits a design, version history will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-500" />
          Graphic Version History ({allVersions.length})
        </h3>
        <span className="text-[11px] text-slate-400">Strict version immutability</span>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
        {allVersions.map((version) => {
          const isApproved = version.status === 'APPROVED';
          const isRevision = version.status === 'REVISION_REQUESTED';
          const relatedRevision = revisions?.find((r) => r.graphicVersionId === version.id);
          const relatedApproval = approvals?.find((a) => a.graphicVersionId === version.id);

          return (
            <div key={version.id} className="relative pl-6">
              {/* Timeline marker icon */}
              <div
                className={`absolute -left-3 top-0 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center ${
                  isApproved
                    ? 'border-emerald-500 text-emerald-600 shadow-sm'
                    : isRevision
                    ? 'border-orange-500 text-orange-600'
                    : 'border-indigo-500 text-indigo-600'
                }`}
              >
                {isApproved ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : isRevision ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Version Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isApproved
                    ? 'bg-emerald-50/40 border-emerald-200 shadow-sm ring-1 ring-emerald-300/50'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                      Version {version.versionNumber}
                    </span>
                    <StatusBadge status={version.status} size="sm" />
                    {isApproved && (
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold tracking-wide">
                        FINAL APPROVED DELIVERY
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(version.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Designer notes */}
                {version.designerNotes && (
                  <div className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 my-2">
                    <span className="font-semibold not-italic text-slate-700">Designer notes:</span>{' '}
                    "{version.designerNotes}"
                  </div>
                )}

                {/* Approver revision comments */}
                {relatedRevision && (
                  <div className="text-xs bg-orange-50/80 border border-orange-200 text-orange-900 p-2.5 rounded-lg my-2">
                    <div className="font-bold flex items-center gap-1.5 text-orange-800">
                      <AlertCircle className="w-3.5 h-3.5" /> Revision Request Feedback:
                    </div>
                    <p className="mt-0.5 text-orange-950 font-medium">{relatedRevision.feedback}</p>
                  </div>
                )}

                {/* Approver approval comments */}
                {relatedApproval && isApproved && (
                  <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded-lg my-2">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <Check className="w-3.5 h-3.5" /> Lead Approver Feedback:
                    </div>
                    <p className="mt-0.5 text-emerald-950">{relatedApproval.comments}</p>
                  </div>
                )}

                {/* Actions & Preview Thumbnail */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{version.fileName}</span>
                    <span>&bull;</span>
                    <span>{(version.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectVersion && (
                      <button
                        onClick={() => onSelectVersion(version)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                    )}
                    {canDownload && (
                      <a
                        href={version.fileUrl}
                        download={version.fileName}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                      >
                        <Download className="w-3 h-3" /> Download Asset
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
