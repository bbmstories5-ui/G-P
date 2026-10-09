'use client';

import React, { useState, useEffect } from 'react';
import { History, Shield, Clock, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/logs?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.logs) setLogs(data.logs);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-purple-600" />
          Enterprise System Audit Trail
        </h1>
        <p className="text-xs text-slate-500">
          Immutable audit record of every requirement creation, designer claim, upload, revision request, and approval.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Details & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 font-sans">Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 font-sans">No logs recorded yet.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-sans">{log.userName}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-purple-700 font-sans">{log.action}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {log.requirement?.reqCode || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans truncate max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
