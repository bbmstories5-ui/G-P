'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Check,
  Zap,
  Settings,
  HelpCircle,
  Briefcase,
  LogOut,
  Layers,
  Bell,
  BookOpen,
  FileText,
  User,
  X,
  Menu,
} from 'lucide-react';
import { tabFetch, clearTabAuth, useTabUser, getScopedHref } from '@/lib/tabAuth';

interface SidebarProps {
  user: any;
}

export default function Sidebar({ user: initialUser }: SidebarProps) {
  const user = useTabUser(initialUser);
  const pathname = usePathname();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showUserPopover, setShowUserPopover] = useState(false);
  const [showWorkspacePopover, setShowWorkspacePopover] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{ text: string; top: number } | null>(null);

  const userPopoverRef = useRef<HTMLDivElement>(null);
  const workspacePopoverRef = useRef<HTMLDivElement>(null);

  // Listen to mobile toggle events and close on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    const handleClose = () => setIsMobileOpen(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };

    window.addEventListener('toggle-portal-sidebar', handleToggle);
    window.addEventListener('close-portal-sidebar', handleClose);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('toggle-portal-sidebar', handleToggle);
      window.removeEventListener('close-portal-sidebar', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userPopoverRef.current &&
        !userPopoverRef.current.contains(event.target as Node)
      ) {
        setShowUserPopover(false);
      }
      if (
        workspacePopoverRef.current &&
        !workspacePopoverRef.current.contains(event.target as Node)
      ) {
        setShowWorkspacePopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleLogout = async () => {
    try {
      await tabFetch('/api/auth/logout', { method: 'POST' });
    } catch { }
    clearTabAuth();
    router.push('/');
    router.refresh();
  };

  // Requester Links
  const requesterNav = {
    main: [
      { label: 'Inbox', href: '/requester/dashboard', icon: Layers },
      { label: 'Activity', href: '/requester/notifications', icon: Bell, hasBadge: true },
      { label: 'Schedule', href: '/requester/requests', icon: BookOpen },
    ],
    shared: [
      { label: 'New Request', href: '/requester/new', icon: Zap },
      { label: 'In Progress', href: '/requester/in-progress', icon: FileText },
    ],
    projects: [
      { label: 'Revision Required', href: '/requester/revisions', color: 'bg-[#A7F3D0]' }, // mint
      { label: 'Approved Final', href: '/requester/approved', color: 'bg-[#C7D2FE]' }, // blue
      { label: 'Completed Archive', href: '/requester/completed', color: 'bg-[#E9D5FF]' }, // purple
    ],
  };

  // Designer Links
  const designerNav = {
    main: [
      { label: 'Inbox', href: '/designer/dashboard', icon: Layers },
      { label: 'Activity', href: '/designer/notifications', icon: Bell, hasBadge: true },
      { label: 'Studio Pool', href: '/designer/available', icon: BookOpen },
    ],
    shared: [
      { label: 'My Assigned', href: '/designer/assigned', icon: Zap },
      { label: 'In Design', href: '/designer/in-design', icon: FileText },
    ],
    projects: [
      { label: 'Pending Approval', href: '/designer/pending-approval', color: 'bg-[#A7F3D0]' },
      { label: 'Revision Required', href: '/designer/revisions', color: 'bg-[#C7D2FE]' },
      { label: 'Completed Work', href: '/designer/completed', color: 'bg-[#E9D5FF]' },
    ],
  };

  // Approver Links
  const approverNav = {
    main: [
      { label: 'Inbox', href: '/approver/dashboard', icon: Layers },
      { label: 'Activity', href: '/approver/notifications', icon: Bell, hasBadge: true },
      { label: 'Schedule', href: '/approver/all', icon: BookOpen },
    ],
    shared: [
      { label: 'Pending Approvals', href: '/approver/pending', icon: Zap },
      { label: 'Approved Library', href: '/approver/approved', icon: FileText },
    ],
    projects: [
      { label: 'Revision Requests', href: '/approver/revisions', color: 'bg-[#A7F3D0]' },
      { label: 'Completed Registry', href: '/approver/completed', color: 'bg-[#C7D2FE]' },
      { label: 'Rejected Queue', href: '/approver/rejected', color: 'bg-[#E9D5FF]' },
    ],
  };

  // Admin Links
  const adminNav = {
    main: [
      { label: 'Inbox', href: '/admin/dashboard', icon: Layers },
      { label: 'Activity', href: '/admin/activity-logs', icon: Bell, hasBadge: true },
      { label: 'Users & Roles', href: '/admin/users', icon: BookOpen },
    ],
    shared: [
      { label: 'Requirements', href: '/admin/requirements', icon: Zap },
      { label: 'Assignments', href: '/admin/assignments', icon: FileText },
    ],
    projects: [
      { label: 'Graphics Cleanup', href: '/admin/cleanup', color: 'bg-[#FCA5A5]' },
      { label: 'Analytics Reports', href: '/admin/reports', color: 'bg-[#A7F3D0]' },
      { label: 'System Settings', href: '/admin/settings', color: 'bg-[#C7D2FE]' },
      { label: 'Governance Logs', href: '/admin/activity-logs', color: 'bg-[#E9D5FF]' },
    ],
  };

  let activeConfig = requesterNav;
  let roleLabel = 'Member';
  if (user?.role === 'DESIGNER') {
    activeConfig = designerNav;
    roleLabel = 'Graphic Maker';
  } else if (user?.role === 'APPROVER') {
    activeConfig = approverNav;
    roleLabel = 'Lead Approver';
  } else if (user?.role === 'ADMIN') {
    activeConfig = adminNav;
    roleLabel = 'Super Admin';
  }

  // Combined 5 main icons to guarantee 100% exact equal gap
  const topFiveIcons = [
    ...activeConfig.main,
    ...activeConfig.shared,
  ];

  const workspaces = [
    { name: 'Mercedes', subtitle: 'Team Plan • 4.5k members', logoText: 'M', active: false, color: 'bg-black text-white' },
    { name: 'Sandra', subtitle: 'Personal Plan • 1 member', logoText: 'S', active: false, color: 'bg-slate-200 text-slate-700' },
    { name: 'widelab', subtitle: 'Team Plan • 40 members', logoText: 'wl', active: true, color: 'bg-[#3F47EC] text-white' },
    { name: 'Figma', subtitle: 'Team Plan • 556 members', logoText: 'Fg', active: false, color: 'bg-rose-500 text-white' },
  ];

  const profileHref = `/${user?.role?.toLowerCase() || 'requester'}/profile`;
  const notifHref = `/${user?.role?.toLowerCase() || 'requester'}/notifications`;

  const handleMouseEnter = (text: string, e: React.MouseEvent) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTooltip({ text, top: rect.top + rect.height / 2 });
  };

  return (
    <>
      {/* ========================================================= */}
      {/* MOBILE DRAWER (lg:hidden)                                 */}
      {/* ========================================================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Slide-in */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between p-4 z-50 animate-in slide-in-from-left duration-200 overflow-y-auto">
            {/* Header with Close */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#3F47EC] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-sm">
                  wl
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">widelab</div>
                  <div className="text-[10px] text-slate-400 leading-tight">Creative Portal</div>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation Content */}
            <div className="space-y-4 py-3 flex-1 overflow-y-auto">
              {/* Primary Links */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Navigation
                </div>
                <div className="space-y-1">
                  {activeConfig.main.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={getScopedHref(item.href, user)}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${isActive
                            ? 'bg-[#F2F3F6] text-slate-900 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-slate-500 stroke-[1.8]" />
                          <span>{item.label}</span>
                        </div>
                        {(item as any).hasBadge && (
                          <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Shared Links */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Shared
                </div>
                <div className="space-y-1">
                  {activeConfig.shared.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={getScopedHref(item.href, user)}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${isActive
                            ? 'bg-[#F2F3F6] text-slate-900 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                      >
                        <Icon className="w-4 h-4 text-slate-500 stroke-[1.8]" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Project Categories */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Queues &amp; Statuses
                </div>
                <div className="space-y-1">
                  {activeConfig.projects.map((proj) => {
                    const isActive = pathname === proj.href;
                    return (
                      <Link
                        key={proj.href}
                        href={getScopedHref(proj.href, user)}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${isActive
                            ? 'bg-[#F2F3F6] text-slate-900 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-md ${proj.color} shrink-0`} />
                        <span>{proj.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                href={getScopedHref(profileHref, user)}
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Account Settings</span>
              </Link>
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DESKTOP ASIDE (hidden on mobile, visible lg:flex)         */}
      {/* ========================================================= */}
      <aside
        className={`hidden lg:flex relative select-none z-40 transition-all duration-300 ease-in-out flex-col justify-between shrink-0 p-3 h-screen max-h-screen ${isCollapsed ? 'w-[74px]' : 'w-[250px]'
          }`}
      >
        {/* Floating White Card (Exact proportions, perfectly padded at bottom) */}
        <div className="bg-white rounded-[24px] shadow-[0_2px_14px_rgba(0,0,0,0.04)] border border-slate-200/90 flex flex-col justify-between h-full relative py-3 px-2">


          {/* OUTSIDE CENTER COLLAPSE TOGGLE */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white hover:bg-slate-50 border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all duration-150 hover:scale-110 active:scale-95 z-50 cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </button>

          {isCollapsed ? (
            /* ========================================================= */
            /* COLLAPSED MODE                                            */
            /* ========================================================= */
            <div className="flex flex-col items-center justify-between h-full w-full py-1 pb-2">
              {/* Top: Brand Logo */}
              <div className="relative w-full flex justify-center shrink-0 pt-0.5" ref={workspacePopoverRef}>
                <div
                  onClick={() => setShowWorkspacePopover(!showWorkspacePopover)}
                  onMouseEnter={(e) => handleMouseEnter('widelab Team Plan', e)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#3F47EC] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-sm ring-2 ring-indigo-100">
                    wl
                  </div>
                </div>

                {/* Workspace Popover */}
                {showWorkspacePopover && (
                  <div className="absolute top-0 left-[calc(100%+14px)] w-64 bg-white rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.18)] border border-slate-200/90 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="space-y-1">
                      {workspaces.map((ws, i) => (
                        <div
                          key={i}
                          onClick={() => setShowWorkspacePopover(false)}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${ws.active
                            ? 'bg-[#F0F2FF] text-slate-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg ${ws.color} flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs`}
                            >
                              {ws.logoText}
                            </div>
                            <div className="min-w-0 text-left">
                              <div className="text-xs font-semibold text-slate-900 truncate">
                                {ws.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {ws.subtitle}
                              </div>
                            </div>
                          </div>
                          {ws.active && <Check className="w-4 h-4 text-[#3F47EC] shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Middle Section: Strict Equal Spacing between the 5 Icons */}
              <div className="flex flex-col items-center gap-2.5 w-full my-auto">
                {/* The 5 Navigation Icons (Layers, Bell, Book, Zap, File) with identical equal gap */}
                {topFiveIcons.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <div
                      key={item.href}
                      className="w-full flex justify-center"
                      onMouseEnter={(e) => handleMouseEnter(item.label, e)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <Link
                        href={getScopedHref(item.href, user)}
                        className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs transition-all relative ${isActive
                          ? 'bg-[#F2F3F6] text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                      >
                        <Icon className="w-4 h-4 text-slate-500 stroke-[1.8] shrink-0" />
                        {(item as any).hasBadge && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EA580C] ring-2 ring-white" />
                        )}
                      </Link>
                    </div>
                  );
                })}

                {/* Projects Pastel Squares */}
                <div className="flex flex-col items-center gap-2 pt-0.5 w-full">
                  {activeConfig.projects.map((proj) => {
                    const isActive = pathname === proj.href;
                    return (
                      <div
                        key={proj.href}
                        className="w-full flex justify-center"
                        onMouseEnter={(e) => handleMouseEnter(proj.label, e)}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <Link
                          href={getScopedHref(proj.href, user)}
                          className={`w-8 h-7 flex items-center justify-center rounded-xl text-xs transition-colors ${isActive
                            ? 'bg-[#F2F3F6] text-slate-900 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                          <span className={`w-4 h-4 rounded-md ${proj.color} shrink-0`} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Stack: Settings, Help, Divider, Avatar (Comfortably Inside Card) */}
              <div className="flex flex-col items-center gap-2.5 w-full shrink-0 pb-1">
                {/* Settings */}
                <div
                  className="w-full flex justify-center"
                  onMouseEnter={(e) => handleMouseEnter('Settings', e)}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <Link
                    href={getScopedHref(profileHref, user)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400 stroke-[1.8] shrink-0" />
                  </Link>
                </div>

                {/* Help */}
                <div
                  className="w-full flex justify-center"
                  onMouseEnter={(e) => handleMouseEnter('Help', e)}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <Link
                    href={getScopedHref(notifHref, user)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400 stroke-[1.8] shrink-0" />
                  </Link>
                </div>

                {/* Divider */}
                <div className="w-8 h-px bg-slate-100 my-0.5 mx-auto" />

                {/* User Avatar (Fully Inside White Card) */}
                <div className="relative w-full flex justify-center pt-0.5" ref={userPopoverRef}>
                  <div
                    onClick={() => setShowUserPopover(!showUserPopover)}
                    onMouseEnter={(e) => handleMouseEnter(`${user?.name} (Account)`, e)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-pink-100 p-0.5 border border-pink-200 shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                      <img
                        src={
                          user?.avatar ||
                          `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`
                        }
                        alt="Avatar"
                        className="w-full h-full rounded-md object-cover"
                      />
                    </div>
                  </div>

                  {/* Profile Popover */}
                  {showUserPopover && (
                    <div className="absolute bottom-0 left-[calc(100%+14px)] w-60 bg-white rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.18)] border border-slate-200/90 p-3 z-50 animate-in fade-in zoom-in-95 space-y-2">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-pink-100 p-0.5 border border-pink-200 shrink-0 overflow-hidden">
                          <img
                            src={
                              user?.avatar ||
                              `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`
                            }
                            alt="Avatar"
                            className="w-full h-full rounded-md object-cover"
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="text-xs font-bold text-slate-900 truncate">{user?.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600">
                        <Link
                          href={getScopedHref(profileHref, user)}
                          onClick={() => setShowUserPopover(false)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Account Settings</span>
                        </Link>

                        <div className="px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-medium flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span>Update App</span>
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                        v1.5.69 &bull; Terms &amp; Conditions
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* EXPANDED MODE                                             */
            /* ========================================================= */
            <div className="flex flex-col justify-between h-full w-full">
              <div className="space-y-3.5">
                {/* Workspace / Brand Header */}
                <div className="relative" ref={workspacePopoverRef}>
                  <div
                    onClick={() => setShowWorkspacePopover(!showWorkspacePopover)}
                    className="flex items-center justify-between px-2 py-1 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#3F47EC] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-sm ring-2 ring-indigo-100 shrink-0">
                        wl
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="text-[13px] font-bold text-slate-900 tracking-tight leading-tight truncate">
                          widelab
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal leading-tight truncate">
                          Team Plan
                        </div>
                      </div>
                    </div>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Primary Nav Links */}
                <nav className="space-y-1">
                  {activeConfig.main.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={getScopedHref(item.href, user)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${isActive
                          ? 'bg-[#F2F3F6] text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 text-slate-500 stroke-[1.8] shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                {/* Shared Section */}
                <div className="pt-1">
                  <div className="px-2.5 pb-1 text-[11px] font-semibold text-slate-400">
                    Shared
                  </div>
                  <div className="space-y-1">
                    {activeConfig.shared.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={getScopedHref(item.href, user)}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${isActive
                            ? 'bg-[#F2F3F6] text-slate-900 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                          <Icon className="w-4 h-4 text-slate-500 stroke-[1.8] shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Projects Section */}
                <div className="pt-1">
                  <div className="px-2.5 pb-1 text-[11px] font-semibold text-slate-400">
                    Projects
                  </div>
                  <div className="space-y-1">
                    {activeConfig.projects.map((proj) => {
                      const isActive = pathname === proj.href;
                      return (
                        <Link
                          key={proj.href}
                          href={getScopedHref(proj.href, user)}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs transition-colors ${isActive
                            ? 'bg-[#F2F3F6] text-slate-900 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                          <span className={`w-4 h-4 rounded-md ${proj.color} shrink-0`} />
                          <span className="truncate">{proj.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <Link
                  href={getScopedHref(profileHref, user)}
                  className="flex items-center gap-2.5 px-2.5 py-1 rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400 stroke-[1.8] shrink-0" />
                  <span>Settings</span>
                </Link>
                <Link
                  href={getScopedHref(notifHref, user)}
                  className="flex items-center gap-2.5 px-2.5 py-1 rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400 stroke-[1.8] shrink-0" />
                  <span>Help</span>
                </Link>

                <div className="w-full h-px bg-slate-100 my-1" />

                <div
                  onClick={() => setShowUserPopover(!showUserPopover)}
                  className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-pink-100 p-0.5 border border-pink-200 shrink-0 overflow-hidden flex items-center justify-center">
                      <img
                        src={
                          user?.avatar ||
                          `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`
                        }
                        alt="Avatar"
                        className="w-full h-full rounded-md object-cover"
                      />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-semibold text-slate-900 truncate leading-tight">
                        {user?.name || 'Sandra Marx'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate leading-tight">
                        {user?.email || 'sandra@gmail.com'}
                      </div>
                    </div>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Dark Tooltip in Collapsed Mode */}
        {isCollapsed && activeTooltip && (
          <div
            style={{ top: activeTooltip.top - 14 }}
            className="fixed left-[84px] z-50 px-2.5 py-1 bg-black text-white text-[11px] font-medium rounded-md shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 flex items-center"
          >
            {activeTooltip.text}
          </div>
        )}
      </aside>
    </>
  );
}

