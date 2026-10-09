import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { realtimeEmitter, RealtimeEventPayload } from '@/lib/realtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const userRole = user.role;

    // Fetch initial unread count & latest active notices
    const initialUnreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    const activeNotice = await prisma.systemNotice.findFirst({
      where: {
        isActive: true,
        OR: [
          { targetRole: 'ALL' },
          { targetRole: userRole },
          { targetUserId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    let isClosed = false;
    let cleanupListener: (() => void) | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (event: string, data: any) => {
          if (isClosed) return;
          try {
            const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch (err) {
            // Stream was closed by client
            isClosed = true;
          }
        };

        // 1. Send initial connected payload
        sendEvent('connected', {
          userId,
          role: userRole,
          unreadCount: initialUnreadCount,
          activeNotice,
          timestamp: new Date().toISOString(),
        });

        // 2. Event listener from server realtime emitter
        const eventHandler = (payload: RealtimeEventPayload) => {
          if (isClosed) return;

          // Scope check: User ID match or Role match
          const isUserMatch = payload.targetUserIds?.includes(userId);
          const isRoleMatch =
            payload.targetRoles?.includes('ALL') ||
            (userRole && payload.targetRoles?.includes(userRole as any));

          if (isUserMatch || isRoleMatch) {
            sendEvent(payload.type, payload.data);
          }
        };

        realtimeEmitter.on('portal_realtime_event', eventHandler);
        cleanupListener = () => {
          realtimeEmitter.off('portal_realtime_event', eventHandler);
        };

        // 3. Heartbeat / ping every 20 seconds to maintain connection
        heartbeatInterval = setInterval(() => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            isClosed = true;
          }
        }, 20000);
      },

      cancel() {
        isClosed = true;
        if (cleanupListener) cleanupListener();
        if (heartbeatInterval) clearInterval(heartbeatInterval);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform, no-store',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('SSE Stream initialization failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
