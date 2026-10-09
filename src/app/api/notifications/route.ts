import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // all, unread, read, approvals, revisions, assignments
    const search = searchParams.get('search') || '';

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Extract requirement IDs to enrich notifications
    const reqIds = Array.from(
      new Set(notifications.map((n) => n.relatedRequirementId).filter(Boolean) as string[])
    );

    let requirementMap: Record<string, any> = {};
    if (reqIds.length > 0) {
      const requirements = await prisma.requirement.findMany({
        where: { id: { in: reqIds } },
        select: {
          id: true,
          reqCode: true,
          title: true,
          status: true,
          priority: true,
          category: true,
          platform: true,
          deadline: true,
        },
      });
      requirementMap = requirements.reduce((acc, req) => {
        acc[req.id] = req;
        return acc;
      }, {} as Record<string, any>);
    }

    const enriched = notifications.map((n) => ({
      ...n,
      requirement: n.relatedRequirementId ? requirementMap[n.relatedRequirementId] || null : null,
    }));

    // Calculate metrics
    const totalCount = notifications.length;
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const approvalsCount = notifications.filter(
      (n) => n.type === 'APPROVED' || n.type === 'SUBMITTED' || n.type === 'REJECTED'
    ).length;
    const revisionsCount = notifications.filter((n) => n.type === 'REVISION_REQUESTED').length;
    const assignmentsCount = notifications.filter(
      (n) => n.type === 'ASSIGNED' || n.type === 'REQUIREMENT_CREATED'
    ).length;

    return NextResponse.json({
      notifications: enriched,
      metrics: {
        total: totalCount,
        unread: unreadCount,
        approvals: approvalsCount,
        revisions: revisionsCount,
        assignments: assignmentsCount,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'markAllRead', id, ids, isRead } = body;

    if (action === 'toggleRead' && id) {
      const existing = await prisma.notification.findUnique({
        where: { id },
      });
      if (!existing || existing.userId !== user.id) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: isRead !== undefined ? isRead : !existing.isRead },
      });

      return NextResponse.json({ success: true, notification: updated });
    }

    if (action === 'markBatch' && Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          id: { in: ids },
        },
        data: { isRead: isRead !== undefined ? isRead : true },
      });
      return NextResponse.json({ success: true, count: ids.length });
    }

    // Default: Mark all read for user
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'single', id, ids, deleteAllRead } = body;

    if (deleteAllRead) {
      const result = await prisma.notification.deleteMany({
        where: { userId: user.id, isRead: true },
      });
      return NextResponse.json({ success: true, deletedCount: result.count });
    }

    if (action === 'batch' && Array.isArray(ids) && ids.length > 0) {
      const result = await prisma.notification.deleteMany({
        where: {
          userId: user.id,
          id: { in: ids },
        },
      });
      return NextResponse.json({ success: true, deletedCount: result.count });
    }

    if (id) {
      await prisma.notification.deleteMany({
        where: { id, userId: user.id },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid delete request' }, { status: 400 });
  } catch (error) {
    console.error('Failed to delete notifications:', error);
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
  }
}
