'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Palette,
  Layers,
  UserCheck,
  UserPlus,
  Mail,
  Copy,
  Check,
  Sparkles,
  Search,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Send,
  RefreshCw,
  Building,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'REQUESTER',
    department: 'Marketing',
    specialty: 'Social Media & Creatives',
    memberCode: '',
    designerCode: '',
    approverTitle: 'Lead Creative Approver',
    password: 'password123',
  });

  // Success Invitation Result
  const [inviteSuccess, setInviteSuccess] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [emailDispatched, setEmailDispatched] = useState(false);
  const [resendingUserId, setResendingUserId] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const handleResendEmail = async (targetUser: any) => {
    setResendingUserId(targetUser.id);
    try {
      const res = await fetch('/api/admin/users/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id }),
      });
      const d = await res.json();
      if (d.success) {
        setNotificationToast({
          message: `Invitation email sent instantly to ${targetUser.email}`,
          type: 'success',
        });
      } else {
        setNotificationToast({
          message: `Failed to resend: ${d.error || 'Check SMTP credentials'}`,
          type: 'error',
        });
      }
    } catch (err) {
      setNotificationToast({
        message: 'Network error while dispatching email',
        type: 'error',
      });
    } finally {
      setResendingUserId(null);
      setTimeout(() => setNotificationToast(null), 4000);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Please provide both Full Name and Email Address');
      return;
    }

    try {
      setInviting(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setInviteSuccess(data.credentials);
      setEmailDispatched(true);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while inviting user');
    } finally {
      setInviting(false);
    }
  };

  const resetModal = () => {
    setIsInviteOpen(false);
    setInviteSuccess(null);
    setFormError('');
    setEmailDispatched(false);
    setFormData({
      name: '',
      email: '',
      role: 'REQUESTER',
      department: 'Marketing',
      specialty: 'Social Media & Creatives',
      memberCode: '',
      designerCode: '',
      approverTitle: 'Lead Creative Approver',
      password: 'password123',
    });
  };

  const copyToClipboard = (text: string, type: 'link' | 'creds') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCredentials(true);
      setTimeout(() => setCopiedCredentials(false), 2000);
    }
  };

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      searchQuery === '' ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.requesterProfile?.memberCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.designerProfile?.designerCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {/* Toast Notification */}
      {notificationToast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 ${
            notificationToast.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-700/60 backdrop-blur-md'
              : 'bg-rose-950/95 text-rose-200 border-rose-700/60 backdrop-blur-md'
          }`}
        >
          {notificationToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{notificationToast.message}</span>
        </div>
      )}

      {/* Header & Invite Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-purple-900/30">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-2 border border-purple-500/30">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            Super Admin Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            Users & Invitation Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Invite and onboard Requesters, Graphic Designers, Lead Approvers, and Administrators with custom credentials and direct login access.
          </p>
        </div>

        <button
          onClick={() => {
            resetModal();
            setIsInviteOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm shadow-lg hover:shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <UserPlus className="w-5 h-5" />
          <span>Invite New Member</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { key: 'ALL', label: `All Users (${users.length})` },
            { key: 'REQUESTER', label: 'Requesters', icon: Layers },
            { key: 'DESIGNER', label: 'Graphic Makers', icon: Palette },
            { key: 'APPROVER', label: 'Approvers', icon: UserCheck },
            { key: 'ADMIN', label: 'Admins', icon: Shield },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setRoleFilter(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                roleFilter === item.key
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {item.icon && <item.icon className="w-3.5 h-3.5" />}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Member Profile</th>
                <th className="py-3.5 px-4">Role & Badge</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Department / Specialty</th>
                <th className="py-3.5 px-4">Activity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading enterprise directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isRequester = u.role === 'REQUESTER';
                  const isDesigner = u.role === 'DESIGNER';
                  const isApprover = u.role === 'APPROVER';
                  const isAdmin = u.role === 'ADMIN';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
                            alt="Avatar"
                            className="w-9 h-9 rounded-full border border-slate-200 object-cover shadow-xs"
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {u.email === 'dhruviktra.rajput.1379@gmail.com' && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-1.5 py-0.2 rounded-md">
                                  Primary Super Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">ID: {u.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1.5 ${
                            isRequester
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isDesigner
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : isApprover
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {isRequester && <Layers className="w-3 h-3 text-amber-600" />}
                          {isDesigner && <Palette className="w-3 h-3 text-blue-600" />}
                          {isApprover && <UserCheck className="w-3 h-3 text-emerald-600" />}
                          {isAdmin && <Shield className="w-3 h-3 text-purple-600" />}
                          {u.requesterProfile?.memberCode ||
                            u.designerProfile?.designerCode ||
                            (isApprover ? 'Lead Approver' : 'Super Admin')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{u.email}</td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {u.requesterProfile?.department ||
                          u.designerProfile?.specialty ||
                          u.approverProfile?.department ||
                          'Global Administration'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {isRequester && `${u._count?.createdRequests || 0} reqs`}
                        {isDesigner && `${u._count?.assignedRequests || 0} designs`}
                        {isApprover && `${u._count?.approvals || 0} reviews`}
                        {isAdmin && 'Full Control'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] ${
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={resendingUserId === u.id}
                            onClick={() => handleResendEmail(u)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all inline-flex items-center gap-1.5 ${
                              resendingUserId === u.id
                                ? 'bg-purple-100 text-purple-700 border-purple-300 opacity-80 cursor-wait'
                                : 'border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 text-slate-700'
                            }`}
                            title="Resend email with login link to this member"
                          >
                            {resendingUserId === u.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Mail className="w-3.5 h-3.5 text-purple-600" />
                                <span className="hidden sm:inline">Resend Email</span>
                              </>
                            )}
                          </button>

                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                u.status === 'ACTIVE'
                                  ? 'bg-white border-slate-300 text-slate-600 hover:text-rose-600 hover:border-rose-300'
                                  : 'bg-emerald-600 text-white border-emerald-600'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invitation Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-2xl text-purple-700">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Invite New Team Member</h3>
                  <p className="text-xs text-slate-500">Configure role, credentials, and send invitation link.</p>
                </div>
              </div>
              <button
                onClick={resetModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success State */}
            {inviteSuccess ? (
              <div className="p-6 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">Member Invited Successfully!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    An official invitation email with login credentials has been dispatched.
                  </p>
                </div>

                {/* Credentials Display Card */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 font-mono text-xs border border-slate-800 shadow-lg">
                  <div className="flex justify-between items-center text-slate-400 text-[10px] pb-2 border-b border-slate-800">
                    <span>MEMBER CREDENTIALS</span>
                    <span className="text-emerald-400 font-bold">READY FOR LOGIN</span>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-400">Email:</span>{' '}
                      <span className="text-amber-300 font-bold">{inviteSuccess.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Password:</span>{' '}
                      <span className="text-white font-bold">{inviteSuccess.password}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Role:</span>{' '}
                      <span className="text-purple-300 font-bold">{inviteSuccess.role}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Identifier:</span>{' '}
                      <span className="text-blue-300 font-bold">{inviteSuccess.identifier}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-400">Login URL:</span>{' '}
                      <span className="text-emerald-300 underline">{inviteSuccess.loginUrl}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => {
                      const msg = `🎉 You've been invited to ${process.env.NEXT_PUBLIC_APP_NAME || 'Creative Flow Portal'}!\n\nRole: ${inviteSuccess.role} (${inviteSuccess.identifier})\nEmail: ${inviteSuccess.email}\nPassword: ${inviteSuccess.password}\nLogin Link: ${inviteSuccess.loginUrl}`;
                      copyToClipboard(msg, 'creds');
                    }}
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    {copiedCredentials ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                    {copiedCredentials ? 'Credentials Copied to Clipboard!' : 'Copy Full Invitation & Credentials'}
                  </button>

                  <button
                    onClick={resetModal}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Close & Return to User Directory
                  </button>
                </div>
              </div>
            ) : (
              /* Invitation Form */
              <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Category / Role Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Member Category / Role <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'REQUESTER', label: 'Requester Member', desc: 'Submits graphics requirements' },
                      { key: 'DESIGNER', label: 'Graphic Designer', desc: 'Accepts & uploads creatives' },
                      { key: 'APPROVER', label: 'Lead Approver', desc: 'Reviews and approves graphics' },
                      { key: 'ADMIN', label: 'Administrator', desc: 'Full system management' },
                    ].map((r) => (
                      <button
                        type="button"
                        key={r.key}
                        onClick={() => setFormData({ ...formData, role: r.key })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formData.role === r.key
                            ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900">{r.label}</div>
                        <div className="text-[10px] text-slate-500">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Department or Specialty */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {formData.role === 'DESIGNER'
                      ? 'Design Specialty'
                      : formData.role === 'APPROVER'
                      ? 'Executive Department'
                      : 'Assigned Department'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      formData.role === 'DESIGNER'
                        ? 'e.g. Social Media & Vector Branding'
                        : 'e.g. Performance Marketing'
                    }
                    value={formData.role === 'DESIGNER' ? formData.specialty : formData.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ...(formData.role === 'DESIGNER'
                          ? { specialty: e.target.value }
                          : { department: e.target.value }),
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  />
                </div>

                {/* Password Setting */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Initial Password</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700"
                    >
                      Generate Random
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Default is set to: password123</p>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    {inviting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending Invitation...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Dispatch Invitation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

