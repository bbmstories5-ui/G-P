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
  LayoutTemplate,
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
  const [activeTooltip, setActiveTooltip] = useState<{ text: string; top: number } | null>(null);

  const userPopoverRef = useRef<HTMLDivElement>(null);

  // Listen to mobile toggle events and close on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    const handleClose = () => setIsMobileOpen(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
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

  // Close popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userPopoverRef.current &&
        !userPopoverRef.current.contains(event.target as Node)
      ) {
        setShowUserPopover(false);
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
      { label: 'Saved Creatives', href: '/requester/creative-studio', color: 'bg-[#FDE68A]' },
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
      { label: 'Template Studio', href: '/admin/templates', color: 'bg-[#FDE68A]' },
      { label: 'Issue Tracker', href: '/admin/support', color: 'bg-[#F472B6]' },
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
              <Link
                href={getScopedHref(user?.role === 'ADMIN' ? '/admin/support' : '/help', user)}
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Help &amp; Issues</span>
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
        className={`hidden lg:flex relative select-none z-40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex-col justify-between shrink-0 p-3 h-screen max-h-screen ${
          isCollapsed ? 'w-[76px]' : 'w-[250px]'
        }`}
      >
        {/* Floating White Card (Exact proportions, perfectly padded at bottom) */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] border border-slate-200/90 flex flex-col justify-between h-full relative py-3 px-2 overflow-visible transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">

          {/* OUTSIDE CENTER COLLAPSE TOGGLE */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(63,71,236,0.2)] hover:border-[#3F47EC]/40 rounded-full flex items-center justify-center text-slate-400 hover:text-[#3F47EC] transition-all duration-200 hover:scale-110 active:scale-95 z-50 cursor-pointer group"
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          >
            <ChevronLeft
              className={`w-3.5 h-3.5 stroke-[2.5] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isCollapsed ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>

          {/* Unified High-Level Sidebar Content */}
          <div className="flex flex-col h-full w-full justify-between min-h-0">
            {/* Top: Brand / Workspace Header (Workspace popover removed, icon perfectly centered) */}
            <div className="relative shrink-0 pb-1.5 w-full flex justify-center">
              <div
                onMouseEnter={(e) => isCollapsed && handleMouseEnter('widelab', e)}
                onMouseLeave={() => setActiveTooltip(null)}
                className={`w-full flex items-center rounded-xl transition-all duration-200 select-none ${
                  isCollapsed ? 'justify-center p-0.5' : 'justify-start px-2 py-1.5 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#3F47EC] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-sm ring-2 ring-indigo-100 shrink-0 transition-transform duration-200 hover:scale-105">
                  wl
                </div>
                <div
                  className={`min-w-0 text-left overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isCollapsed
                      ? 'max-w-0 opacity-0 pointer-events-none'
                      : 'max-w-[140px] opacity-100 translate-x-0 ml-2.5'
                  }`}
                >
                  <div className="text-[13px] font-bold text-slate-900 tracking-tight leading-tight truncate">
                    widelab
                  </div>
                  <div className="text-[11px] text-slate-400 font-normal leading-tight truncate">
                    Creative Portal
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Section: Scrollable, smooth flex navigation */}
            <div className="flex-1 min-h-0 w-full overflow-y-auto no-scrollbar flex flex-col py-1">
              <div
                className={`w-full flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isCollapsed ? 'gap-1.5 my-auto items-center' : 'space-y-3'
                }`}
              >
                {/* Primary Nav Links */}
                <div className={`w-full flex flex-col ${isCollapsed ? 'gap-1.5 items-center' : 'space-y-1'}`}>
                  {activeConfig.main.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <div
                        key={item.href}
                        className="w-full flex justify-center"
                        onMouseEnter={(e) => isCollapsed && handleMouseEnter(item.label, e)}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <Link
                          href={getScopedHref(item.href, user)}
                          className={`flex items-center rounded-xl text-xs transition-all duration-200 relative group overflow-hidden ${
                            isCollapsed
                              ? 'w-8 h-8 justify-center'
                              : 'w-full px-2.5 py-1.5 justify-start gap-2.5'
                          } ${
                            isActive
                              ? 'bg-[#F2F3F6] text-slate-900 font-semibold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-5 h-5 shrink-0 flex items-center justify-center relative">
                            <Icon
                              className={`w-4 h-4 stroke-[1.8] transition-transform duration-200 group-hover:scale-110 ${
                                isActive ? 'text-slate-900' : 'text-slate-500'
                              }`}
                            />
                            {(item as any).hasBadge && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#EA580C] ring-2 ring-white" />
                            )}
                          </div>
                          <span
                            className={`truncate whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              isCollapsed
                                ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                                : 'max-w-[150px] opacity-100 translate-x-0'
                            }`}
                          >
                            {item.label}
                          </span>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* Shared Section */}
                <div className="w-full">
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isCollapsed
                        ? 'max-h-0 opacity-0 my-0 py-0 pointer-events-none'
                        : 'max-h-6 opacity-100 px-2.5 pb-1 text-[11px] font-semibold text-slate-400'
                    }`}
                  >
                    Shared
                  </div>
                  <div className={`w-full flex flex-col ${isCollapsed ? 'gap-1.5 items-center' : 'space-y-1'}`}>
                    {activeConfig.shared.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <div
                          key={item.href}
                          className="w-full flex justify-center"
                          onMouseEnter={(e) => isCollapsed && handleMouseEnter(item.label, e)}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          <Link
                            href={getScopedHref(item.href, user)}
                            className={`flex items-center rounded-xl text-xs transition-all duration-200 relative group overflow-hidden ${
                              isCollapsed
                                ? 'w-8 h-8 justify-center'
                                : 'w-full px-2.5 py-1.5 justify-start gap-2.5'
                            } ${
                              isActive
                                ? 'bg-[#F2F3F6] text-slate-900 font-semibold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                              <Icon
                                className={`w-4 h-4 stroke-[1.8] transition-transform duration-200 group-hover:scale-110 ${
                                  isActive ? 'text-slate-900' : 'text-slate-500'
                                }`}
                              />
                            </div>
                            <span
                              className={`truncate whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                isCollapsed
                                  ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                                  : 'max-w-[150px] opacity-100 translate-x-0'
                              }`}
                            >
                              {item.label}
                            </span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Projects Section */}
                <div className="w-full">
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isCollapsed
                        ? 'max-h-0 opacity-0 my-0 py-0 pointer-events-none'
                        : 'max-h-6 opacity-100 px-2.5 pb-1 text-[11px] font-semibold text-slate-400'
                    }`}
                  >
                    Projects
                  </div>
                  <div className={`w-full flex flex-col ${isCollapsed ? 'gap-1.5 items-center' : 'space-y-1'}`}>
                    {activeConfig.projects.map((proj) => {
                      const isActive = pathname === proj.href;
                      return (
                        <div
                          key={proj.href}
                          className="w-full flex justify-center"
                          onMouseEnter={(e) => isCollapsed && handleMouseEnter(proj.label, e)}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          <Link
                            href={getScopedHref(proj.href, user)}
                            className={`flex items-center rounded-xl text-xs transition-all duration-200 relative group overflow-hidden ${
                              isCollapsed
                                ? 'w-8 h-7 justify-center'
                                : 'w-full px-2.5 py-1.5 justify-start gap-2.5'
                            } ${
                              isActive
                                ? 'bg-[#F2F3F6] text-slate-900 font-semibold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                              <span
                                className={`w-3.5 h-3.5 rounded-md ${proj.color} transition-transform duration-200 group-hover:scale-110 shadow-xs`}
                              />
                            </div>
                            <span
                              className={`truncate whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                isCollapsed
                                  ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                                  : 'max-w-[150px] opacity-100 translate-x-0'
                              }`}
                            >
                              {proj.label}
                            </span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Stack: Settings, Help, Divider, Avatar */}
            <div
              className={`shrink-0 w-full pt-2 border-t border-slate-100 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isCollapsed ? 'gap-1.5 items-center pb-0.5' : 'space-y-1.5 pb-1'
              }`}
            >
              {/* Settings */}
              <div
                className="w-full flex justify-center"
                onMouseEnter={(e) => isCollapsed && handleMouseEnter('Settings', e)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <Link
                  href={getScopedHref(profileHref, user)}
                  className={`flex items-center rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200 group overflow-hidden ${
                    isCollapsed
                      ? 'w-8 h-8 justify-center'
                      : 'w-full px-2.5 py-1.5 justify-start gap-2.5'
                  }`}
                >
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-slate-400 stroke-[1.8] transition-transform duration-300 group-hover:rotate-45" />
                  </div>
                  <span
                    className={`truncate whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isCollapsed
                        ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                        : 'max-w-[150px] opacity-100 translate-x-0'
                    }`}
                  >
                    Settings
                  </span>
                </Link>
              </div>

              {/* Help */}
              <div
                className="w-full flex justify-center"
                onMouseEnter={(e) => isCollapsed && handleMouseEnter('Help & Issues', e)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <Link
                  href={getScopedHref(user?.role === 'ADMIN' ? '/admin/support' : '/help', user)}
                  className={`flex items-center rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200 group overflow-hidden ${
                    isCollapsed
                      ? 'w-8 h-8 justify-center'
                      : 'w-full px-2.5 py-1.5 justify-start gap-2.5'
                  }`}
                >
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-slate-400 stroke-[1.8] transition-transform duration-200 group-hover:scale-110" />
                  </div>
                  <span
                    className={`truncate whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isCollapsed
                        ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                        : 'max-w-[150px] opacity-100 translate-x-0'
                    }`}
                  >
                    Help &amp; Issues
                  </span>
                </Link>
              </div>

              {/* Divider */}
              <div
                className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] bg-slate-100 my-0.5 ${
                  isCollapsed ? 'w-7 h-px mx-auto' : 'w-full h-px'
                }`}
              />

              {/* User Avatar & Info */}
              <div className="relative w-full" ref={userPopoverRef}>
                <div
                  onClick={() => setShowUserPopover(!showUserPopover)}
                  onMouseEnter={(e) => isCollapsed && handleMouseEnter(`${user?.name} (Account)`, e)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className={`flex items-center rounded-xl hover:bg-slate-50 active:scale-[0.98] cursor-pointer transition-all duration-200 overflow-hidden ${
                    isCollapsed
                      ? 'w-8 h-8 justify-center mx-auto'
                      : 'w-full p-1.5 justify-between'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-pink-100 p-0.5 border border-pink-200 shrink-0 overflow-hidden flex items-center justify-center shadow-xs transition-transform duration-200 hover:scale-105">
                      <img
                        src={
                          user?.avatar ||
                          `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`
                        }
                        alt="Avatar"
                        className="w-full h-full rounded-md object-cover"
                      />
                    </div>
                    <div
                      className={`min-w-0 text-left overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isCollapsed
                          ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none'
                          : 'max-w-[130px] opacity-100 translate-x-0'
                      }`}
                    >
                      <div className="text-xs font-semibold text-slate-900 truncate leading-tight">
                        {user?.name || 'Sandra Marx'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate leading-tight">
                        {user?.email || 'sandra@gmail.com'}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${
                      isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[20px] opacity-100'
                    }`}
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
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

