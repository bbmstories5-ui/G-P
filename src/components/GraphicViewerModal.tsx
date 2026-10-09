'use client';

import React from 'react';
import { X, Download, ZoomIn, FileCode, CheckCircle2, ShieldAlert } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface GraphicViewerModalProps {
  version: any;
  isOpen: boolean;
  onClose: () => void;
  canDownload?: boolean;
}

export default function GraphicViewerModal({
  version,
  isOpen,
  onClose,
  canDownload = false,
}: GraphicViewerModalProps) {
  if (!isOpen || !version) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold bg-indigo-600 px-3 py-1 rounded-lg">
              Version {version.versionNumber}
            </span>
            <div>
              <div className="text-sm font-bold truncate">{version.fileName}</div>
              <div className="text-[11px] text-slate-400">
                Uploaded: {new Date(version.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={version.status} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Graphic Large Viewport */}
        <div className="flex-1 bg-slate-950 p-6 flex items-center justify-center overflow-auto min-h-[350px]">
          <div className="max-w-md w-full aspect-square rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 flex items-center justify-center">
            {version.fileUrl?.startsWith('data:image/svg+xml') ? (
              <img
                src={version.fileUrl}
                alt={version.fileName}
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={version.fileUrl || version.previewUrl}
                alt={version.fileName}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>

        {/* Footer info & download */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            <span>Dimensions: <strong className="text-slate-200">{version.dimensions || '1080x1080'}</strong></span>
            <span>File Size: <strong className="text-slate-200">{(version.fileSize / (1024 * 1024)).toFixed(2)} MB</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {canDownload && (
              <a
                href={version.fileUrl}
                download={version.fileName}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                <Download className="w-4 h-4" /> Download High-Res Graphic
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
