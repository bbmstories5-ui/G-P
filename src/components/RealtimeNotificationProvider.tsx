'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useTabUser, getTabToken } from '@/lib/tabAuth';
import {
  playNotificationSound,
  markInitialNotificationsSeen,
  unlockAudioContext,
  getSoundPreferences,
} from '@/lib/notificationSound';
import IPhoneNotificationToast, { ToastNotification } from './IPhoneNotificationToast';
import NotificationSettingsModal from './NotificationSettingsModal';

interface RealtimeContextValue {
  openSettings: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  openSettings: () => {},
});

export const useRealtimeNotifications = () => useContext(RealtimeContext);

export default function RealtimeNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useTabUser();
  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffDelayRef = useRef(2000);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  // Unlock audio context on initial user click/tap/keypress
  useEffect(() => {
    const handleGesture = () => {
      unlockAudioContext();
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };

    window.addEventListener('pointerdown', handleGesture, { once: true });
    window.addEventListener('keydown', handleGesture, { once: true });
    window.addEventListener('touchstart', handleGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  // Listen to global open settings event
  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-portal-notification-settings', handleOpenSettings);
    return () => {
      window.removeEventListener('open-portal-notification-settings', handleOpenSettings);
    };
  }, []);

  // Connect to SSE real-time stream
  const connectSSE = useCallback(() => {
    if (!user || typeof window === 'undefined') return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const token = getTabToken();
      const sseUrl = token
        ? `/api/notifications/stream?tabToken=${encodeURIComponent(token)}`
        : `/api/notifications/stream`;

      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        backoffDelayRef.current = 2000; // Reset backoff delay on successful connection
      };

      // 1. Initial Connection Handshake
      es.addEventListener('connected', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.unreadCount !== undefined) {
            window.dispatchEvent(
              new CustomEvent('portal-unread-count-changed', { detail: data.unreadCount })
            );
          }
          if (data.activeNotice) {
            window.dispatchEvent(
              new CustomEvent('portal-notice-updated', { detail: data.activeNotice })
            );
          }
        } catch {}
      });

      // 2. Incoming Notification Event
      es.addEventListener('notification', (e: MessageEvent) => {
        try {
          const notification = JSON.parse(e.data);
          if (!notification) return;

          // Dispatch event so Topbar and NotificationCenter update
          window.dispatchEvent(
            new CustomEvent('portal-notification-received', { detail: notification })
          );

          // Play Sound (respects quiet hours & sound mute preferences)
          playNotificationSound(notification);

          // Check visual alert preferences
          const prefs = getSoundPreferences();
          const isMobile = window.innerWidth < 640;
          const shouldShowToast = isMobile ? prefs.mobileToast : prefs.desktopToast;

          if (shouldShowToast) {
            setActiveToast({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              priority: notification.priority,
              actionUrl: notification.actionUrl,
              actionLabel: notification.actionLabel,
              relatedRequirementId: notification.relatedRequirementId,
              timestamp: notification.createdAt,
            });
          }

          // Browser OS notification if granted
          if (
            'Notification' in window &&
            Notification.permission === 'granted' &&
            document.visibilityState === 'hidden'
          ) {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
            });
          }
        } catch (err) {
          console.error('Error handling SSE notification:', err);
        }
      });

      // 3. Incoming Notice Event
      es.addEventListener('notice', (e: MessageEvent) => {
        try {
          const notice = JSON.parse(e.data);
          window.dispatchEvent(
            new CustomEvent('portal-notice-updated', { detail: notice })
          );
        } catch {}
      });

      // 4. Requirement Update Event
      es.addEventListener('requirement_update', (e: MessageEvent) => {
        try {
          const update = JSON.parse(e.data);
          window.dispatchEvent(
            new CustomEvent('portal-requirement-updated', { detail: update })
          );
        } catch {}
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        // Exponential backoff reconnect
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        const delay = Math.min(backoffDelayRef.current, 30000);
        backoffDelayRef.current = delay * 1.5;

        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, delay);
      };
    } catch (err) {
      console.error('Failed to create SSE connection:', err);
    }
  }, [user]);

  useEffect(() => {
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectSSE]);

  return (
    <RealtimeContext.Provider value={{ openSettings: () => {} }}>
      {children}

      {/* Floating iPhone Dynamic Island / iOS Toast */}
      <IPhoneNotificationToast
        toast={activeToast}
        onDismiss={() => setActiveToast(null)}
      />
    </RealtimeContext.Provider>
  );
}
