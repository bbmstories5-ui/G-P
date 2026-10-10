import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { collectCurrentGraphicsData, formatBytes } from '@/lib/cleanup-scheduler';
import { sendNotification } from '@/lib/notifications';

export const runtime = 'nodejs';

/**
 * POST /api/admin/cleanup/simulate-cycle
 * Fast-forwards the active countdown to trigger PENDING_APPROVAL for immediate testing
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    let activeCycle = await prisma.graphicsCleanupRequest.findFirst({
      where: { status: 'COUNTDOWN_ACTIVE' },
      orderBy: { cycleNumber: 'desc' },
    });

    const { totalCount, totalSizeBytes, items } = await collectCurrentGraphicsData();

    if (!activeCycle) {
      // Find latest or create a new cycle
      const latest = await prisma.graphicsCleanupRequest.findFirst({
        orderBy: { cycleNumber: 'desc' },
      });
      const cycleNumber = (latest?.cycleNumber || 0) + 1;

      activeCycle = await prisma.graphicsCleanupRequest.create({
        data: {
          cycleNumber,
          startDate: new Date(Date.now() - 15 * 86400000),
          scheduledDeletionDate: new Date(),
          status: 'PENDING_APPROVAL',
          graphicsCount: totalCount,
          totalSizeBytes,
          quarantineData: JSON.stringify(items),
        },
      });
    } else {
      activeCycle = await prisma.graphicsCleanupRequest.update({
        where: { id: activeCycle.id },
        data: {
          scheduledDeletionDate: new Date(),
          status: 'PENDING_APPROVAL',
          graphicsCount: totalCount,
          totalSizeBytes,
          quarantineData: JSON.stringify(items),
        },
      });
    }

    // Send notification to Super Admin
    await sendNotification({
      userId: user.id,
      title: `⚠️ 15-Day Graphics Cleanup Approval Required (Cycle #${activeCycle.cycleNumber})`,
      message: `The 15-day period has completed. ${totalCount} graphics (${formatBytes(totalSizeBytes)}) are scheduled for deletion. Please review and approve or reject.`,
      type: 'SYSTEM',
      priority: 'URGENT',
      actionUrl: '/admin/cleanup',
      actionLabel: 'Review Cleanup Request →',
      entityType: 'SYSTEM',
      entityId: activeCycle.id,
    });

    return NextResponse.json({
      success: true,
      message: `Cycle #${activeCycle.cycleNumber} has been updated to PENDING_APPROVAL for Super Admin review.`,
      cycle: activeCycle,
    });
  } catch (error: any) {
    console.error('Error simulating cleanup expiration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to simulate cleanup expiration' },
      { status: 500 }
    );
  }
}
