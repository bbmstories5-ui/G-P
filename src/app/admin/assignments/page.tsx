'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Palette, ArrowRight, UserCheck } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export default function AdminAssignmentsPage() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [designers, setDesigners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, usersRes] = await Promise.all([
        fetch('/api/requirements'),
        fetch('/api/admin/users'),
      ]);

      const reqData = await reqRes.json();
      const usersData = await usersRes.json();

      if (reqData.requirements) setRequirements(reqData.requirements);
      if (usersData.users) {
        setDesigners(usersData.users.filter((u: any) => u.role === 'DESIGNER'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-purple-600" />
          Workload Balancing & Assignments
        </h1>
        <p className="text-xs text-slate-500">
          Monitor studio capacity across Designer 01, 02, and 03.
        </p>
      </div>

      {/* Designer Capacity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {designers.map((d) => {
          const activeTasks = requirements.filter(
            (r) => r.assignedDesignerId === d.id && ['ASSIGNED', 'IN_DESIGN', 'PENDING_APPROVAL', 'REVISION_REQUIRED'].includes(r.status)
          );

          return (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <img src={d.avatar} alt="Avatar" className="w-10 h-10 rounded-full border object-cover" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{d.name}</h3>
                  <div className="text-[11px] text-slate-500">{d.designerProfile?.specialty}</div>
                </div>
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-xs">
                <span className="text-slate-500">Active Workload:</span>
                <span className="font-extrabold text-blue-600">{activeTasks.length} / 5 Active Tasks</span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min((activeTasks.length / 5) * 100, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-900 text-sm">Active Requirement Assignments</h3>
        </div>

        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Request</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Requester</th>
              <th className="py-3 px-4">Assigned Graphic Maker</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {requirements.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.reqCode}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">{r.title}</td>
                <td className="py-3.5 px-4">{r.requester?.requesterProfile?.memberCode || r.requester?.name}</td>
                <td className="py-3.5 px-4 font-medium text-slate-800">
                  {r.assignedDesigner?.designerProfile?.designerCode || r.assignedDesigner?.name || 'Unassigned (In Pool)'}
                </td>
                <td className="py-3.5 px-4"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
