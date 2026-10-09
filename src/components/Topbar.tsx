'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Search, Check, ExternalLink, Menu, Sliders, Volume2, Sparkles } from 'lucide-react';
import { tabFetch, useTabUser } from '@/lib/tabAuth';
import { markInitialNotificationsSeen } from '@/lib/notificationSound';

interface TopbarProps {
  user: any;
  title?: string;
}

export default function Topbar({ user: initialUser, title = 'Portal' }: TopbarProps) {
  const user = useTabUser(initialUser);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await tabFetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
        // Register existing IDs to prevent historical sound playback
        markInitialNotificationsSeen(data.notifications.map((n: any) => n.id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notification events
    const handleRealtimeNotification = (e: any) => {
      const newNotif = e.detail;
      if (newNotif) {
        setNotifications((prev) => [newNotif, ...prev.filter((item) => item.id !== newNotif.id)]);
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleUnreadCountChanged = (e: any) => {
      if (typeof e.detail === 'number') {
        setUnreadCount(e.detail);
      }
    };

    window.addEventListener('portal-notification-received', handleRealtimeNotification);
    window.addEventListener('portal-unread-count-changed', handleUnreadCountChanged);

    // Backup polling every 30s
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('portal-notification-received', handleRealtimeNotification);
      window.removeEventListener('portal-unread-count-changed', handleUnreadCountChanged);
      clearInterval(interval);
    };
  }, []);

  const markAllRead = async () => {
    try {
      await tabFetch('/api/notifications', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  let dynamicTitle = title;
  if (user?.role === 'REQUESTER') {
    dynamicTitle = `Requester Portal — ${user.requesterProfile?.memberCode || user.name}`;
  } else if (user?.role === 'DESIGNER') {
    dynamicTitle = `Graphic Maker Studio — ${user.designerProfile?.designerCode || user.name}`;
  } else if (user?.role === 'APPROVER') {
    dynamicTitle = `Lead Approver Portal — Creative Governance`;
  } else if (user?.role === 'ADMIN') {
    dynamicTitle = `Super Admin Control Center — System Governance`;
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title / Breadcrumb / Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-portal-sidebar'))}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate max-w-[190px] sm:max-w-md">
          {dynamicTitle}
        </h1>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Real-time
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-[calc(100vw-28px)] max-w-sm sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 p-3.5 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    Notifications ({unreadCount} unread)
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-emerald-600" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">No notifications yet</div>
                  ) : (
                    notifications.slice(0, 8).map((n) => {
                      const targetHref = n.actionUrl || (n.relatedRequirementId
                        ? user?.role === 'APPROVER'
                          ? `/approver/review/${n.relatedRequirementId}`
                          : user?.role === 'DESIGNER'
                            ? `/designer/requests/${n.relatedRequirementId}`
                            : `/requester/requests/${n.relatedRequirementId}`
                        : null);

                      const handleNotificationClick = async () => {
                        setShowNotifications(false);
                        if (!n.isRead) {
                          try {
                            await tabFetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' });
                            setUnreadCount((prev) => Math.max(0, prev - 1));
                            setNotifications((prev) =>
                              prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
                            );
                          } catch (e) { }
                        }
                      };

                      const timeAgo = (dateStr: string) => {
                        const date = new Date(dateStr);
                        const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
                        if (diffSec < 60) return 'Just now';
                        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
                        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
                        return `${Math.floor(diffSec / 86400)}d ago`;
                      };

                      const content = (
                        <div
                          className={`p-2.5 rounded-xl transition-all border ${!n.isRead
                              ? 'bg-blue-50/70 border-blue-200/90 text-slate-900 shadow-2xs'
                              : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-100/80'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 animate-pulse" />
                              )}
                              <span className={`truncate text-xs ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {n.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className={`mt-1 text-[11px] leading-snug line-clamp-2 ${!n.isRead ? 'text-slate-800' : 'text-slate-500'}`}>
                            {n.message}
                          </p>
                        </div>
                      );

                      return targetHref ? (
                        <Link
                          key={n.id}
                          href={targetHref}
                          onClick={handleNotificationClick}
                          className="block hover:scale-[1.01] transition-transform"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div key={n.id} onClick={handleNotificationClick} className="cursor-pointer">
                          {content}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-100 text-center">
                  <Link
                    href={`/${user?.role?.toLowerCase() || 'requester'}/notifications`}
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1.5 py-1"
                  >
                    <span>View all notifications</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar indicator */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'user'}`}
            alt="Avatar"
            className="w-8 h-8 rounded-full border border-slate-300 object-cover"
          />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800">{user?.name}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
