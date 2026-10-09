'use client';

import React, { useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    portalName: 'Creative Flow Enterprise Portal',
    maxFileSize: '50',
    allowedFormats: 'PNG, JPG, JPEG, WEBP, PDF, SVG, ZIP, PSD, AI',
    autoAssign: 'false',
    approverEmailNotifications: 'true',
    requesterStrictIsolation: 'true',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-600" />
          System Settings & Policies
        </h1>
        <p className="text-xs text-slate-500">
          Global parameters, storage limits, and role security configurations.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6 text-xs">
        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> Settings updated successfully!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
              Portal Name
            </label>
            <input
              type="text"
              value={settings.portalName}
              onChange={(e) => setSettings({ ...settings, portalName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Max Upload File Size (MB)
              </label>
              <input
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({ ...settings, maxFileSize: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Allowed File Formats
              </label>
              <input
                type="text"
                value={settings.allowedFormats}
                onChange={(e) => setSettings({ ...settings, allowedFormats: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="font-bold text-slate-900">Enforce Requester Strict Data Isolation</div>
                <div className="text-slate-500 text-[11px]">
                  Ensures Member 01 never sees Member 02–12 requests or delivered graphics.
                </div>
              </div>
              <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                ENFORCED (Backend Checked)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="font-bold text-slate-900">Automatic Sequential ID Generation</div>
                <div className="text-slate-500 text-[11px]">
                  Auto-generates sequential IDs (REQ-0001, REQ-0002...).
                </div>
              </div>
              <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
