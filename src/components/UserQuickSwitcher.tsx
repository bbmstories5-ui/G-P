'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Check, ChevronDown, Sparkles, Shield, Palette, UserCheck, Layers } from 'lucide-react';
import { getTabSessionId, saveTabAuth } from '@/lib/tabAuth';

export const ALL_USERS = [
  // Super Admin
  { email: 'dhruviktra.rajput.1379@gmail.com', name: 'Dhruvit Rajput', role: 'ADMIN', badge: 'Super Admin' },
  { email: 'admin@company.com', name: 'Super Admin', role: 'ADMIN', badge: 'System Master' },
  // Approver
  { email: 'approver@company.com', name: 'Elena Rostova', role: 'APPROVER', badge: 'Brand Approver' },
  // 3 Designers
  { email: 'designer01@company.com', name: 'Alex Morgan', role: 'DESIGNER', badge: 'Designer 01' },
  { email: 'designer02@company.com', name: 'Sophia Chen', role: 'DESIGNER', badge: 'Designer 02' },
  { email: 'designer03@company.com', name: 'Marcus Vance', role: 'DESIGNER', badge: 'Designer 03' },
  // 12 Requesters
  { email: 'member01@company.com', name: 'Liam Davies', role: 'REQUESTER', badge: 'Member 01' },
  { email: 'member02@company.com', name: 'Emma Wilson', role: 'REQUESTER', badge: 'Member 02' },
  { email: 'member03@company.com', name: 'Noah Miller', role: 'REQUESTER', badge: 'Member 03' },
  { email: 'member04@company.com', name: 'Olivia Taylor', role: 'REQUESTER', badge: 'Member 04' },
  { email: 'member05@company.com', name: 'Ethan Anderson', role: 'REQUESTER', badge: 'Member 05' },
  { email: 'member06@company.com', name: 'Ava Thomas', role: 'REQUESTER', badge: 'Member 06' },
  { email: 'member07@company.com', name: 'Lucas Jackson', role: 'REQUESTER', badge: 'Member 07' },
  { email: 'member08@company.com', name: 'Mia White', role: 'REQUESTER', badge: 'Member 08' },
  { email: 'member09@company.com', name: 'Oliver Harris', role: 'REQUESTER', badge: 'Member 09' },
  { email: 'member10@company.com', name: 'Isabella Martin', role: 'REQUESTER', badge: 'Member 10' },
  { email: 'member11@company.com', name: 'James Garcia', role: 'REQUESTER', badge: 'Member 11' },
  { email: 'member12@company.com', name: 'Charlotte Robinson', role: 'REQUESTER', badge: 'Member 12' },
];

export default function UserQuickSwitcher({ currentUser }: { currentUser?: any }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  const handleSwitch = async (email: string) => {
    setLoadingEmail(email);
    try {
      const tabSessionId = getTabSessionId();
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tabSessionId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.token) {
          saveTabAuth(data.token, data.user, data.tabSessionId);
        }
        setIsOpen(false);
        router.push(data.redirectUrl);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEmail(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-3.5 h-3.5 text-purple-400" />;
      case 'APPROVER':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'DESIGNER':
        return <Palette className="w-3.5 h-3.5 text-blue-400" />;
      case 'REQUESTER':
        return <Layers className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Users className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm border border-slate-700 transition-colors"
        title="Switch between the 17 verified test accounts"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Role Switcher:</span>
        <span className="text-amber-300 font-bold">
          {currentUser?.name ? `${currentUser.name.split('(')[0]}` : 'Quick Switch'}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 text-white divide-y divide-slate-800">
            {/* Super Admin */}
            <div className="py-1">
              <p className="px-2 py-1 text-[10px] font-bold tracking-wider text-purple-400 uppercase">Super Admin (1)</p>
              {ALL_USERS.filter((u) => u.role === 'ADMIN').map((u) => (
                <button
                  key={u.email}
                  onClick={() => handleSwitch(u.email)}
                  disabled={loadingEmail === u.email}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-purple-950/50 transition-colors text-left ${
                    currentUser?.email === u.email ? 'bg-purple-900/40 font-bold border border-purple-500/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getRoleIcon(u.role)}
                    <div>
                      <div className="font-medium text-slate-200">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                    {u.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Approver */}
            <div className="py-1">
              <p className="px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">Lead Approver (1)</p>
              {ALL_USERS.filter((u) => u.role === 'APPROVER').map((u) => (
                <button
                  key={u.email}
                  onClick={() => handleSwitch(u.email)}
                  disabled={loadingEmail === u.email}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-emerald-950/50 transition-colors text-left ${
                    currentUser?.email === u.email ? 'bg-emerald-900/40 font-bold border border-emerald-500/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getRoleIcon(u.role)}
                    <div>
                      <div className="font-medium text-slate-200">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    {u.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Graphic Makers */}
            <div className="py-1">
              <p className="px-2 py-1 text-[10px] font-bold tracking-wider text-blue-400 uppercase">Graphic Makers (3)</p>
              {ALL_USERS.filter((u) => u.role === 'DESIGNER').map((u) => (
                <button
                  key={u.email}
                  onClick={() => handleSwitch(u.email)}
                  disabled={loadingEmail === u.email}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-950/50 transition-colors text-left ${
                    currentUser?.email === u.email ? 'bg-blue-900/40 font-bold border border-blue-500/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getRoleIcon(u.role)}
                    <div>
                      <div className="font-medium text-slate-200">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">
                    {u.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Requesters */}
            <div className="py-1">
              <p className="px-2 py-1 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                Requester Members (12)
              </p>
              <div className="grid grid-cols-1 gap-0.5 max-h-48 overflow-y-auto pr-1">
                {ALL_USERS.filter((u) => u.role === 'REQUESTER').map((u) => (
                  <button
                    key={u.email}
                    onClick={() => handleSwitch(u.email)}
                    disabled={loadingEmail === u.email}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-amber-950/40 transition-colors text-left ${
                      currentUser?.email === u.email ? 'bg-amber-900/40 font-bold border border-amber-500/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getRoleIcon(u.role)}
                      <div className="truncate">
                        <span className="text-slate-200 font-medium">{u.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                      {u.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
