import defaultPrisma from './prisma';

const prisma = defaultPrisma as any;
import { sendNotification } from './notifications';
import { sendSystemNotificationEmail } from './email';
import { logActivity } from './audit';
import { promises as fs } from 'fs';
import path from 'path';

export const CLEANUP_INTERVAL_DAYS = 15;
export const CLEANUP_INTERVAL_MS = CLEANUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

export interface GraphicItemSnapshot {
  graphicId: string;
  versionId: string;
  fileName: string;
  fileUrl: string;
  previewUrl?: string | null;
  fileSize: number;
  mimeType?: string;
  requirementId: string;
  reqCode: string;
  requirementTitle: string;
  createdAt: string;
}

/**
 * Format bytes into human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Collect all active graphic files currently stored in database
 */
export async function collectCurrentGraphicsData(): Promise<{
  totalCount: number;
  totalSizeBytes: number;
  items: GraphicItemSnapshot[];
}> {
  const graphicVersions = await prisma.graphicVersion.findMany({
    include: {
      graphic: {
        include: {
          requirement: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  let totalSizeBytes = 0;
  const items: GraphicItemSnapshot[] = [];

  for (const v of graphicVersions) {
    const size = v.fileSize || 0;
    totalSizeBytes += size;
    items.push({
      graphicId: v.graphicId,
      versionId: v.id,
      fileName: v.fileName || 'graphic.png',
      fileUrl: v.fileUrl,
      previewUrl: v.previewUrl || v.fileUrl,
      fileSize: size,
      mimeType: v.mimeType,
      requirementId: v.graphic.requirementId,
      reqCode: v.graphic.requirement?.reqCode || 'REQ-GENERAL',
      requirementTitle: v.graphic.requirement?.title || 'Graphic Deliverable',
      createdAt: v.createdAt.toISOString(),
    });
  }

  return {
    totalCount: items.length,
    totalSizeBytes,
    items,
  };
}

/**
 * Ensures a 15-day cleanup cycle is persistently active and tracked.
 * Self-healing: Survives server restarts by storing cycle state in PostgreSQL.
 */
export async function ensureActiveCleanupCycle() {
  try {
    // 1. Get the most recent cycle
    let latestCycle = await prisma.graphicsCleanupRequest.findFirst({
      orderBy: { cycleNumber: 'desc' },
      include: {
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const now = new Date();

    // If no cycle exists, initialize Cycle #1
    if (!latestCycle) {
      const { totalCount, totalSizeBytes, items } = await collectCurrentGraphicsData();
      const scheduledDate = new Date(now.getTime() + CLEANUP_INTERVAL_MS);

      latestCycle = await prisma.graphicsCleanupRequest.create({
        data: {
          cycleNumber: 1,
          startDate: now,
          scheduledDeletionDate: scheduledDate,
          status: 'COUNTDOWN_ACTIVE',
          graphicsCount: totalCount,
          totalSizeBytes,
          quarantineData: JSON.stringify(items),
        },
        include: {
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return latestCycle;
    }

    // If latest cycle is completed or rejected, start the next cycle automatically
    if (latestCycle.status === 'COMPLETED' || latestCycle.status === 'REJECTED') {
      const nextCycleNumber = latestCycle.cycleNumber + 1;
      const { totalCount, totalSizeBytes, items } = await collectCurrentGraphicsData();
      const scheduledDate = new Date(now.getTime() + CLEANUP_INTERVAL_MS);

      latestCycle = await prisma.graphicsCleanupRequest.create({
        data: {
          cycleNumber: nextCycleNumber,
          startDate: now,
          scheduledDeletionDate: scheduledDate,
          status: 'COUNTDOWN_ACTIVE',
          graphicsCount: totalCount,
          totalSizeBytes,
          quarantineData: JSON.stringify(items),
        },
        include: {
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return latestCycle;
    }

    // If currently COUNTDOWN_ACTIVE, check if 15 days have elapsed
    if (latestCycle.status === 'COUNTDOWN_ACTIVE') {
      const scheduledTime = new Date(latestCycle.scheduledDeletionDate).getTime();
      const isPeriodCompleted = now.getTime() >= scheduledTime;

      // Always update live statistics during the active countdown
      const { totalCount, totalSizeBytes, items } = await collectCurrentGraphicsData();

      if (isPeriodCompleted) {
        // Transition to PENDING_APPROVAL - DO NOT delete graphics yet!
        latestCycle = await prisma.graphicsCleanupRequest.update({
          where: { id: latestCycle.id },
          data: {
            status: 'PENDING_APPROVAL',
            graphicsCount: totalCount,
            totalSizeBytes,
            quarantineData: JSON.stringify(items),
          },
          include: {
            reviewedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        // Notify all Super Admins
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN', status: 'ACTIVE' },
        });

        const formattedSize = formatBytes(totalSizeBytes);

        for (const admin of admins) {
          await sendNotification({
            userId: admin.id,
            title: `⚠️ 15-Day Graphics Cleanup Approval Required (Cycle #${latestCycle.cycleNumber})`,
            message: `The 15-day countdown has completed. ${totalCount} graphics (${formattedSize}) are scheduled for deletion. Please review and approve or reject.`,
            type: 'SYSTEM',
            priority: 'URGENT',
            actionUrl: '/admin/cleanup',
            actionLabel: 'Review Cleanup Request →',
            entityType: 'SYSTEM',
            entityId: latestCycle.id,
          });

          // Send Email to Super Admin
          try {
            await sendSystemNotificationEmail({
              to: admin.email,
              recipientName: admin.name,
              title: `15-Day Graphics Cleanup Approval Required`,
              message: `The 15-day graphics database cleanup cycle #${latestCycle.cycleNumber} has completed its countdown.\n\nSummary:\n- Total Graphics: ${totalCount}\n- Storage Size: ${formattedSize}\n- Scheduled Deletion Date: ${latestCycle.scheduledDeletionDate.toLocaleString()}\n\nAction Required: Super Admin approval is needed before any graphics can be deleted. No graphics have been deleted.`,
              actionUrl: `/admin/cleanup`,
              actionLabel: 'Review Request in Portal',
            });
          } catch (mailErr) {
            console.error('Failed to send admin cleanup notification email:', mailErr);
          }
        }
      } else {
        // Update stats if changed
        if (latestCycle.graphicsCount !== totalCount || latestCycle.totalSizeBytes !== totalSizeBytes) {
          latestCycle = await prisma.graphicsCleanupRequest.update({
            where: { id: latestCycle.id },
            data: {
              graphicsCount: totalCount,
              totalSizeBytes,
              quarantineData: JSON.stringify(items),
            },
            include: {
              reviewedBy: {
                select: { id: true, name: true, email: true },
              },
            },
          });
        }
      }
    }

    return latestCycle;
  } catch (err) {
    console.error('Error in ensureActiveCleanupCycle:', err);
    throw err;
  }
}

/**
 * Execute permanent batch deletion of graphics in an approved request
 */
export async function executeApprovedCleanup(requestId: string, adminUserId: string) {
  const request = await prisma.graphicsCleanupRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Cleanup request not found');
  }

  if (request.status !== 'APPROVED' && request.status !== 'PENDING_APPROVAL') {
    throw new Error(`Cannot execute deletion for request in status: ${request.status}`);
  }

  // Set status to IN_PROGRESS
  await prisma.graphicsCleanupRequest.update({
    where: { id: requestId },
    data: {
      status: 'IN_PROGRESS',
      reviewedById: adminUserId,
      reviewedAt: new Date(),
    },
  });

  let items: GraphicItemSnapshot[] = [];
  try {
    items = request.quarantineData ? JSON.parse(request.quarantineData) : [];
  } catch {
    items = [];
  }

  // If quarantineData is empty, re-collect current data
  if (items.length === 0) {
    const fresh = await collectCurrentGraphicsData();
    items = fresh.items;
  }

  let deletedCount = 0;
  let failedCount = 0;
  const executionLogs: string[] = [];

  // Setup quarantine backup directory before permanent deletion
  const quarantineDir = path.join(process.cwd(), 'public', 'uploads', 'quarantine', requestId);
  try {
    await fs.mkdir(quarantineDir, { recursive: true });
  } catch {}

  for (const item of items) {
    try {
      // 1. Storage file deletion / quarantine
      if (item.fileUrl && item.fileUrl.startsWith('/uploads/')) {
        const relativePath = item.fileUrl.replace(/^\//, '').split('?')[0];
        const absolutePath = path.join(process.cwd(), 'public', relativePath);

        try {
          // Check if file exists on disk
          await fs.access(absolutePath);

          // Backup into quarantine folder first
          const backupPath = path.join(quarantineDir, path.basename(absolutePath));
          try {
            await fs.copyFile(absolutePath, backupPath);
          } catch {}

          // Remove original file
          await fs.unlink(absolutePath);
          executionLogs.push(`Deleted physical file: ${relativePath}`);
        } catch (fsErr: any) {
          executionLogs.push(`Physical file not found or already removed: ${relativePath} (${fsErr.message})`);
        }
      }

      // 2. Database Record Deletion in safe transaction
      await prisma.$transaction(async (tx) => {
        // Disconnect finalGraphicId from Requirement if it points to this graphic
        await tx.requirement.updateMany({
          where: { finalGraphicId: item.graphicId },
          data: { finalGraphicId: null },
        });

        // Delete approvals and revisions tied to this graphic version
        await tx.approval.deleteMany({
          where: { graphicVersionId: item.versionId },
        });
        await tx.revision.deleteMany({
          where: { graphicVersionId: item.versionId },
        });

        // Delete graphic version
        await tx.graphicVersion.deleteMany({
          where: { id: item.versionId },
        });

        // If no versions left for parent graphic, delete graphic parent
        const remainingVersions = await tx.graphicVersion.count({
          where: { graphicId: item.graphicId },
        });
        if (remainingVersions === 0) {
          await tx.graphic.deleteMany({
            where: { id: item.graphicId },
          });
        }
      });

      // Record success in DeletedGraphicLog
      await prisma.deletedGraphicLog.create({
        data: {
          cleanupRequestId: requestId,
          graphicId: item.graphicId,
          graphicVersionId: item.versionId,
          requirementCode: item.reqCode,
          fileName: item.fileName,
          fileUrl: item.fileUrl,
          fileSize: item.fileSize,
          status: 'SUCCESS',
        },
      });

      deletedCount++;
    } catch (itemErr: any) {
      failedCount++;
      executionLogs.push(`Failed to delete item ${item.versionId} (${item.fileName}): ${itemErr.message}`);

      // Record failure in DeletedGraphicLog
      await prisma.deletedGraphicLog.create({
        data: {
          cleanupRequestId: requestId,
          graphicId: item.graphicId,
          graphicVersionId: item.versionId,
          requirementCode: item.reqCode,
          fileName: item.fileName,
          fileUrl: item.fileUrl,
          fileSize: item.fileSize,
          status: 'FAILED',
          errorMessage: itemErr.message || 'Unknown deletion error',
        },
      });
    }
  }

  const finalStatus = failedCount > 0 && deletedCount === 0 ? 'FAILED' : 'COMPLETED';

  const updatedRequest = await prisma.graphicsCleanupRequest.update({
    where: { id: requestId },
    data: {
      status: finalStatus,
      deletedCount,
      failedCount,
      executedAt: new Date(),
      logs: JSON.stringify(executionLogs),
    },
  });

  // Audit log entry
  const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
  await logActivity({
    userId: adminUserId,
    userName: adminUser?.name || 'Super Admin',
    userRole: 'ADMIN',
    action: 'GRAPHICS_AUTO_CLEANUP_EXECUTED',
    details: `Executed Cycle #${request.cycleNumber}: ${deletedCount} graphics deleted, ${failedCount} failed.`,
  });

  // Automatically start the next 15-day cycle!
  await ensureActiveCleanupCycle();

  return updatedRequest;
}

/**
 * Reject cleanup request and preserve graphics
 */
export async function rejectCleanupRequest(requestId: string, adminUserId: string, reason: string) {
  const request = await prisma.graphicsCleanupRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Cleanup request not found');
  }

  if (request.status !== 'PENDING_APPROVAL') {
    throw new Error(`Cannot reject request in status: ${request.status}`);
  }

  const updatedRequest = await prisma.graphicsCleanupRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      decisionNotes: reason,
      reviewedById: adminUserId,
      reviewedAt: new Date(),
    },
  });

  // Audit log entry
  const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
  await logActivity({
    userId: adminUserId,
    userName: adminUser?.name || 'Super Admin',
    userRole: 'ADMIN',
    action: 'GRAPHICS_CLEANUP_REJECTED',
    details: `Rejected Cycle #${request.cycleNumber}. Reason: ${reason}. Graphics preserved safely.`,
  });

  // Automatically start the next 15-day cycle!
  await ensureActiveCleanupCycle();

  return updatedRequest;
}

/**
 * Get comprehensive analytics and countdown status for the Admin Dashboard
 */
export async function getCleanupSystemStats() {
  const activeCycle = await ensureActiveCleanupCycle();

  const now = new Date();
  const scheduledTime = new Date(activeCycle.scheduledDeletionDate).getTime();
  const msRemaining = Math.max(0, scheduledTime - now.getTime());

  const daysRemaining = Math.floor(msRemaining / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutesRemaining = Math.floor((msRemaining % (60 * 60 * 1000)) / (60 * 1000));
  const secondsRemaining = Math.floor((msRemaining % (60 * 1000)) / 1000);

  // Overall database graphics totals
  const currentData = await collectCurrentGraphicsData();

  // Historical requests summary
  const allRequests = await prisma.graphicsCleanupRequest.findMany({
    orderBy: { cycleNumber: 'desc' },
    include: {
      reviewedBy: {
        select: { id: true, name: true, email: true },
      },
      deletedLogs: {
        orderBy: { deletedAt: 'desc' },
        take: 20,
      },
    },
  });

  const pendingRequestsCount = allRequests.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const approvedRequestsCount = allRequests.filter((r) => r.status === 'APPROVED' || r.status === 'COMPLETED').length;
  const rejectedRequestsCount = allRequests.filter((r) => r.status === 'REJECTED').length;

  const totalSuccessfullyDeleted = allRequests.reduce((sum, r) => sum + (r.deletedCount || 0), 0);
  const totalFailedDeletions = allRequests.reduce((sum, r) => sum + (r.failedCount || 0), 0);

  // Currently pending approval request (if any)
  const pendingRequest = allRequests.find((r) => r.status === 'PENDING_APPROVAL') || null;

  return {
    activeCycle: {
      id: activeCycle.id,
      cycleNumber: activeCycle.cycleNumber,
      startDate: activeCycle.startDate,
      scheduledDeletionDate: activeCycle.scheduledDeletionDate,
      status: activeCycle.status,
      graphicsCount: activeCycle.graphicsCount,
      totalSizeBytes: activeCycle.totalSizeBytes,
      formattedSize: formatBytes(activeCycle.totalSizeBytes),
      decisionNotes: activeCycle.decisionNotes,
      reviewedBy: (activeCycle as any).reviewedBy,
      reviewedAt: activeCycle.reviewedAt,
      executedAt: activeCycle.executedAt,
      deletedCount: activeCycle.deletedCount,
      failedCount: activeCycle.failedCount,
    },
    countdown: {
      msRemaining,
      days: daysRemaining,
      hours: hoursRemaining,
      minutes: minutesRemaining,
      seconds: secondsRemaining,
      isExpired: msRemaining === 0,
      percentageElapsed: Math.min(100, Math.max(0, Math.round(((CLEANUP_INTERVAL_MS - msRemaining) / CLEANUP_INTERVAL_MS) * 100))),
    },
    metrics: {
      totalGraphicsStored: currentData.totalCount,
      totalStorageBytes: currentData.totalSizeBytes,
      formattedStorageUsed: formatBytes(currentData.totalSizeBytes),
      pendingRequestsCount,
      approvedRequestsCount,
      rejectedRequestsCount,
      totalSuccessfullyDeleted,
      totalFailedDeletions,
    },
    pendingRequest: pendingRequest
      ? {
          ...pendingRequest,
          formattedSize: formatBytes(pendingRequest.totalSizeBytes),
          items: pendingRequest.quarantineData ? JSON.parse(pendingRequest.quarantineData) : [],
        }
      : null,
    requestsHistory: allRequests.map((r) => ({
      id: r.id,
      cycleNumber: r.cycleNumber,
      startDate: r.startDate,
      scheduledDeletionDate: r.scheduledDeletionDate,
      status: r.status,
      graphicsCount: r.graphicsCount,
      totalSizeBytes: r.totalSizeBytes,
      formattedSize: formatBytes(r.totalSizeBytes),
      decisionNotes: r.decisionNotes,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      executedAt: r.executedAt,
      deletedCount: r.deletedCount,
      failedCount: r.failedCount,
      createdAt: r.createdAt,
    })),
    recentGraphics: currentData.items.slice(0, 15),
  };
}
