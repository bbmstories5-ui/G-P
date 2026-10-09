'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, Palette, Layers, UserCheck, Check, Ban } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = users.filter((u) => roleFilter === 'ALL' || u.role === roleFilter);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Users & Roles Management ({users.length})
          </h1>
          <p className="text-xs text-slate-500">
            All 17 accounts: 12 Requester Members, 3 Graphic Makers, 1 Lead Approver, and Super Admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'REQUESTER', 'DESIGNER', 'APPROVER', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                roleFilter === r ? 'bg-purple-600 text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {r === 'ALL' ? 'All Roles (17)' : r === 'REQUESTER' ? 'Requesters (12)' : r === 'DESIGNER' ? 'Designers (3)' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role & Identifier</th>
                <th className="py-3 px-4">Email Account</th>
                <th className="py-3 px-4">Department / Specialty</th>
                <th className="py-3 px-4">Activity Count</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading accounts...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">No users found.</td></tr>
              ) : (
                filtered.map((u) => {
                  const isRequester = u.role === 'REQUESTER';
                  const isDesigner = u.role === 'DESIGNER';
                  const isApprover = u.role === 'APPROVER';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                          />
                          <div className="font-bold text-slate-900">{u.name}</div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            isRequester
                              ? 'bg-amber-100 text-amber-800'
                              : isDesigner
                              ? 'bg-blue-100 text-blue-800'
                              : isApprover
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {u.requesterProfile?.memberCode ||
                            u.designerProfile?.designerCode ||
                            (isApprover ? 'Lead Approver' : 'Super Admin')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {u.requesterProfile?.department ||
                          u.designerProfile?.specialty ||
                          u.approverProfile?.department ||
                          'Global Administration'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {isRequester && `${u._count?.createdRequests || 0} requests created`}
                        {isDesigner && `${u._count?.assignedRequests || 0} designs assigned`}
                        {isApprover && `${u._count?.approvals || 0} reviews conducted`}
                        {u.role === 'ADMIN' && 'System Master'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                              u.status === 'ACTIVE'
                                ? 'bg-white border-slate-300 text-slate-600 hover:text-rose-600 hover:border-rose-300'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
