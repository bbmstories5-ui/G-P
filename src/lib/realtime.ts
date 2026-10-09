import { EventEmitter } from 'events';

// Global singleton EventEmitter across Next.js dev & prod server instances
const globalRealtime = global as unknown as {
  __portal_realtime_emitter__?: EventEmitter;
};

if (!globalRealtime.__portal_realtime_emitter__) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(200); // Support high concurrency tabs
  globalRealtime.__portal_realtime_emitter__ = emitter;
}

export const realtimeEmitter = globalRealtime.__portal_realtime_emitter__;

export interface RealtimeEventPayload {
  eventId: string;
  type: 'notification' | 'notice' | 'requirement_update' | 'stats_update';
  targetUserIds?: string[];
  targetRoles?: ('REQUESTER' | 'DESIGNER' | 'APPROVER' | 'ADMIN' | 'ALL')[];
  data: any;
  timestamp: string;
}

/**
 * Broadcasts a real-time event to all matching user subscriptions
 */
export function emitRealtimeEvent(payload: Omit<RealtimeEventPayload, 'eventId' | 'timestamp'>) {
  const fullPayload: RealtimeEventPayload = {
    ...payload,
    eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  realtimeEmitter.emit('portal_realtime_event', fullPayload);
}

/**
 * Helper to emit a notification directly to the recipient
 */
export function emitNotificationEvent(notification: any) {
  if (!notification || !notification.userId) return;

  emitRealtimeEvent({
    type: 'notification',
    targetUserIds: [notification.userId],
    data: notification,
  });
}

/**
 * Helper to emit a system notice to roles or specific user
 */
export function emitNoticeEvent(notice: any) {
  if (!notice) return;

  emitRealtimeEvent({
    type: 'notice',
    targetRoles: notice.targetRole ? [notice.targetRole] : ['ALL'],
    targetUserIds: notice.targetUserId ? [notice.targetUserId] : undefined,
    data: notice,
  });
}

/**
 * Helper to emit requirement status changes to involved stakeholders
 */
export function emitRequirementUpdateEvent(
  requirement: any,
  options?: {
    involvedUserIds?: string[];
    involvedRoles?: ('REQUESTER' | 'DESIGNER' | 'APPROVER' | 'ADMIN')[];
    eventType?: string;
  }
) {
  if (!requirement) return;

  const targetUsers = new Set<string>(options?.involvedUserIds || []);
  if (requirement.requesterId) targetUsers.add(requirement.requesterId);
  if (requirement.assignedDesignerId) targetUsers.add(requirement.assignedDesignerId);

  emitRealtimeEvent({
    type: 'requirement_update',
    targetUserIds: Array.from(targetUsers),
    targetRoles: options?.involvedRoles || ['APPROVER', 'ADMIN'],
    data: {
      requirement,
      eventType: options?.eventType || 'STATUS_CHANGED',
    },
  });
}
