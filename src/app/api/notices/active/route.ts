import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ notice: null });
    }

    const now = new Date();

    // 1. Check for Active Admin Broadcast / System Notice matching user role
    const systemNotice = await prisma.systemNotice.findFirst({
      where: {
        isActive: true,
        OR: [
          { targetRole: 'ALL' },
          { targetRole: user.role },
          { targetUserId: user.id },
        ],
        startAt: { lte: now },
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (systemNotice) {
      return NextResponse.json({
        notice: {
          id: `sys_${systemNotice.id}`,
          title: systemNotice.title,
          message: systemNotice.message,
          type: systemNotice.type || 'SYSTEM',
          priority: systemNotice.priority || 'HIGH',
          actionUrl: systemNotice.actionUrl,
          actionLabel: systemNotice.actionLabel || 'Learn More →',
          createdAt: systemNotice.createdAt,
          source: 'SYSTEM_NOTICE',
          canDismiss: true,
        },
      });
    }

    // 2. Check for Role-Specific Workflow Real-Time Notices (Exact User Isolation)
    if (user.role === 'APPROVER') {
      const pendingApprovalCount = await prisma.graphic.count({
        where: {
          status: 'PENDING_APPROVAL',
        },
      });

      if (pendingApprovalCount > 0) {
        return NextResponse.json({
          notice: {
            id: `approver_pending_${pendingApprovalCount}`,
            title: 'Approval Required',
            message: `${pendingApprovalCount} graphic${pendingApprovalCount > 1 ? 's are' : ' is'} waiting for executive review and production sign-off.`,
            type: 'URGENT',
            priority: 'URGENT',
            actionUrl: '/approver/dashboard',
            actionLabel: 'Review Queue →',
            createdAt: now,
            source: 'WORKFLOW_AUTOMATION',
            canDismiss: true,
          },
        });
      }
    } else if (user.role === 'DESIGNER') {
      // Revisions requested for this specific designer
      const pendingRevisions = await prisma.requirement.count({
        where: {
          assignedDesignerId: user.id,
          status: 'REVISION_REQUIRED',
        },
      });

      if (pendingRevisions > 0) {
        return NextResponse.json({
          notice: {
            id: `designer_revisions_${pendingRevisions}`,
            title: 'Revision Directives Waiting',
            message: `${pendingRevisions} of your assigned deliverable${pendingRevisions > 1 ? 's have' : ' has'} received revision feedback from the approver.`,
            type: 'WARNING',
            priority: 'HIGH',
            actionUrl: '/designer/dashboard',
            actionLabel: 'Open Studio →',
            createdAt: now,
            source: 'WORKFLOW_AUTOMATION',
            canDismiss: true,
          },
        });
      }

      // Check for approaching deadlines (within 24h)
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const urgentDeadlines = await prisma.requirement.findFirst({
        where: {
          assignedDesignerId: user.id,
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
          deadline: { lte: tomorrow, gte: now },
        },
        orderBy: { deadline: 'asc' },
      });

      if (urgentDeadlines) {
        return NextResponse.json({
          notice: {
            id: `designer_deadline_${urgentDeadlines.id}`,
            title: 'Deadline Approaching',
            message: `Request ${urgentDeadlines.reqCode} ("${urgentDeadlines.title}") is due within 24 hours.`,
            type: 'WARNING',
            priority: 'HIGH',
            actionUrl: `/designer/requests/${urgentDeadlines.id}`,
            actionLabel: 'Submit Version →',
            createdAt: now,
            source: 'WORKFLOW_AUTOMATION',
            canDismiss: true,
          },
        });
      }
    } else if (user.role === 'REQUESTER') {
      // Check if any recently approved requirement is ready
      const recentApproved = await prisma.requirement.findFirst({
        where: {
          requesterId: user.id,
          status: 'FINAL_APPROVED',
          updatedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (recentApproved) {
        return NextResponse.json({
          notice: {
            id: `requester_approved_${recentApproved.id}`,
            title: 'Deliverable Approved',
            message: `Graphic ${recentApproved.reqCode} ("${recentApproved.title}") is approved and ready for full download.`,
            type: 'SUCCESS',
            priority: 'NORMAL',
            actionUrl: '/requester/approved',
            actionLabel: 'Download Asset →',
            createdAt: recentApproved.updatedAt,
            source: 'WORKFLOW_AUTOMATION',
            canDismiss: true,
          },
        });
      }
    }

    // 3. Fallback to latest unread high-priority user notification (not dismissed)
    const urgentNotification = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        isRead: false,
        isDismissed: false,
        priority: { in: ['HIGH', 'URGENT'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (urgentNotification) {
      return NextResponse.json({
        notice: {
          id: `notif_${urgentNotification.id}`,
          title: urgentNotification.title,
          message: urgentNotification.message,
          type: urgentNotification.type || 'INFO',
          priority: urgentNotification.priority || 'HIGH',
          actionUrl: urgentNotification.actionUrl || '/notifications',
          actionLabel: urgentNotification.actionLabel || 'View Details →',
          createdAt: urgentNotification.createdAt,
          source: 'USER_NOTIFICATION',
          canDismiss: true,
        },
      });
    }

    return NextResponse.json({ notice: null });
  } catch (error) {
    console.error('Failed to get active notice:', error);
    return NextResponse.json({ notice: null });
  }
}
