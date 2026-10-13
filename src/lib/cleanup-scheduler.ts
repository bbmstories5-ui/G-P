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
  formattedSize: string;
  mimeType?: string;
  requirementId: string;
  reqCode: string;
  requirementTitle: string;
  ownerName: string;
  ownerEmail: string;
  ownerRole: string;
  createdAt: string;
  expirationDate: string;
  ageDays: number;
  daysRemaining: number;
  isExpired: boolean;
  deletionStatus: 'ELIGIBLE_FOR_CLEANUP' | 'PENDING_APPROVAL' | 'PRESERVED' | 'ACTIVE';
}

/**
 * Format bytes into human-readable string (KB, MB, GB, TB)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!bytes || bytes <= 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Checks whether a graphic's fileUrl or previewUrl is referenced anywhere else in the system.
 * Prevents accidental deletion of shared assets.
 */
export async function isSharedGraphicFile(
  fileUrl: string,
  excludeVersionId: string
): Promise<boolean> {
  if (!fileUrl || fileUrl.startsWith('data:')) return false;

  // 1. Check other graphic versions
  const otherVersion = await prisma.graphicVersion.findFirst({
    where: {
      OR: [{ fileUrl }, { previewUrl: fileUrl }],
      id: { not: excludeVersionId },
    },
    select: { id: true },
  });
  if (otherVersion) return true;

  // 2. Check requirement reference files
  const reqFile = await prisma.requirementFile.findFirst({
    where: { fileUrl },
    select: { id: true },
  });
  if (reqFile) return true;

  // 3. Check generated creative output files
  const genCreative = await prisma.generatedCreative.findFirst({
    where: { OR: [{ fileUrl }, { previewUrl: fileUrl }] },
    select: { id: true },
  });
  if (genCreative) return true;

  // 4. Check user avatars
  const avatar = await prisma.user.findFirst({
    where: { avatar: fileUrl },
    select: { id: true },
  });
  if (avatar) return true;

  // 5. Check creative templates
  const tmpl = await prisma.creativeTemplate.findFirst({
    where: {
      OR: [{ previewImageUrl: fileUrl }, { backgroundUrl: fileUrl }, { baseDesignUrl: fileUrl }],
    },
    select: { id: true },
  });
  if (tmpl) return true;

  // 6. Check brand logos
  const logo = await prisma.brandLogo.findFirst({
    where: { OR: [{ logoUrl: fileUrl }, { darkLogoUrl: fileUrl }] },
    select: { id: true },
  });
  if (logo) return true;

  return false;
}

/**
 * Collect all active graphic files currently stored in database
 * with reliable upload dates, calculated 15-day expiration dates, owners, and sizes.
 */
export async function collectCurrentGraphicsData(): Promise<{
  totalCount: number;
  totalSizeBytes: number;
  formattedStorageUsed: string;
  expiredCount: number;
  expiredSizeBytes: number;
  formattedExpiredStorage: string;
  estimatedReleasedSpace: string;
  items: GraphicItemSnapshot[];
  expiredItems: GraphicItemSnapshot[];
}> {
  const graphicVersions = await prisma.graphicVersion.findMany({
    include: {
      graphic: {
        include: {
          requirement: {
            include: {
              requester: { select: { id: true, name: true, email: true } },
            },
          },
          designer: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  let totalSizeBytes = 0;
  let expiredSizeBytes = 0;
  const items: GraphicItemSnapshot[] = [];
  const expiredItems: GraphicItemSnapshot[] = [];

  for (const v of graphicVersions) {
    const size = v.fileSize || 0;
    totalSizeBytes += size;

    const createdTime = v.createdAt.getTime();
    const expirationTime = createdTime + CLEANUP_INTERVAL_MS;
    const expirationDate = new Date(expirationTime);
    const ageDays = Math.max(0, Math.floor((now.getTime() - createdTime) / (1000 * 60 * 60 * 24)));
    const isExpired = now.getTime() >= expirationTime;
    const daysRemaining = Math.max(0, Math.ceil((expirationTime - now.getTime()) / (1000 * 60 * 60 * 24)));

    const ownerName =
      v.graphic?.designer?.name ||
      v.graphic?.requirement?.requester?.name ||
      'Graphic Maker';
    const ownerEmail =
      v.graphic?.designer?.email ||
      v.graphic?.requirement?.requester?.email ||
      '';
    const ownerRole = v.graphic?.designer ? 'DESIGNER' : 'REQUESTER';

    const item: GraphicItemSnapshot = {
      graphicId: v.graphicId,
      versionId: v.id,
      fileName: v.fileName || 'graphic.png',
      fileUrl: v.fileUrl,
      previewUrl: v.previewUrl || v.fileUrl,
      fileSize: size,
      formattedSize: formatBytes(size),
      mimeType: v.mimeType,
      requirementId: v.graphic.requirementId,
      reqCode: v.graphic.requirement?.reqCode || 'REQ-GENERAL',
      requirementTitle: v.graphic.requirement?.title || 'Graphic Deliverable',
      ownerName,
      ownerEmail,
      ownerRole,
      createdAt: v.createdAt.toISOString(),
      expirationDate: expirationDate.toISOString(),
      ageDays,
      daysRemaining,
      isExpired,
      deletionStatus: isExpired ? 'PENDING_APPROVAL' : 'ACTIVE',
    };

    items.push(item);
    if (isExpired) {
      expiredItems.push(item);
      expiredSizeBytes += size;
    }
  }

  return {
    totalCount: items.length,
    totalSizeBytes,
    formattedStorageUsed: formatBytes(totalSizeBytes),
    expiredCount: expiredItems.length,
    expiredSizeBytes,
    formattedExpiredStorage: formatBytes(expiredSizeBytes),
    estimatedReleasedSpace: formatBytes(expiredSizeBytes),
    items,
    expiredItems,
  };
}

/**
 * Ensures a 15-day cleanup cycle is persistently active and tracked.
 * Self-healing: Survives server restarts by storing cycle state in PostgreSQL.
 */
export async function ensureActiveCleanupCycle() {
  try {
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
      const currentData = await collectCurrentGraphicsData();
      const scheduledDate = new Date(now.getTime() + CLEANUP_INTERVAL_MS);

      latestCycle = await prisma.graphicsCleanupRequest.create({
        data: {
          cycleNumber: 1,
          startDate: now,
          scheduledDeletionDate: scheduledDate,
          status: currentData.expiredCount > 0 ? 'PENDING_APPROVAL' : 'COUNTDOWN_ACTIVE',
          graphicsCount: currentData.expiredCount > 0 ? currentData.expiredCount : currentData.totalCount,
          totalSizeBytes: currentData.expiredCount > 0 ? currentData.expiredSizeBytes : currentData.totalSizeBytes,
          quarantineData: JSON.stringify(currentData.expiredCount > 0 ? currentData.expiredItems : currentData.items),
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
      const currentData = await collectCurrentGraphicsData();
      const scheduledDate = new Date(now.getTime() + CLEANUP_INTERVAL_MS);

      latestCycle = await prisma.graphicsCleanupRequest.create({
        data: {
          cycleNumber: nextCycleNumber,
          startDate: now,
          scheduledDeletionDate: scheduledDate,
          status: currentData.expiredCount > 0 ? 'PENDING_APPROVAL' : 'COUNTDOWN_ACTIVE',
          graphicsCount: currentData.expiredCount > 0 ? currentData.expiredCount : currentData.totalCount,
          totalSizeBytes: currentData.expiredCount > 0 ? currentData.expiredSizeBytes : currentData.totalSizeBytes,
          quarantineData: JSON.stringify(currentData.expiredCount > 0 ? currentData.expiredItems : currentData.items),
        },
        include: {
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return latestCycle;
    }

    // If currently COUNTDOWN_ACTIVE, check if 15 days elapsed OR if any graphics reached 15 days
    if (latestCycle.status === 'COUNTDOWN_ACTIVE') {
      const currentData = await collectCurrentGraphicsData();
      const scheduledTime = new Date(latestCycle.scheduledDeletionDate).getTime();
      const isPeriodCompleted = now.getTime() >= scheduledTime || currentData.expiredCount > 0;

      if (isPeriodCompleted && currentData.expiredCount > 0) {
        // Transition to PENDING_APPROVAL - DO NOT delete graphics yet!
        latestCycle = await prisma.graphicsCleanupRequest.update({
          where: { id: latestCycle.id },
          data: {
            status: 'PENDING_APPROVAL',
            graphicsCount: currentData.expiredCount,
            totalSizeBytes: currentData.expiredSizeBytes,
            quarantineData: JSON.stringify(currentData.expiredItems),
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

        const formattedSize = formatBytes(currentData.expiredSizeBytes);

        for (const admin of admins) {
          await sendNotification({
            userId: admin.id,
            title: `⚠️ 15-Day Graphics Cleanup Approval Required (Cycle #${latestCycle.cycleNumber})`,
            message: `${currentData.expiredCount} graphic(s) have reached 15 days (${formattedSize}). Super Admin approval is required to permanently delete files and free storage.`,
            type: 'SYSTEM',
            priority: 'URGENT',
            actionUrl: '/admin/cleanup',
            actionLabel: 'Review Cleanup Request →',
            entityType: 'SYSTEM',
            entityId: latestCycle.id,
          });

          try {
            await sendSystemNotificationEmail({
              to: admin.email,
              recipientName: admin.name,
              title: `15-Day Graphics Cleanup Approval Required`,
              message: `The 15-day graphics database cleanup cycle #${latestCycle.cycleNumber} requires your review.\n\nSummary:\n- Expired Graphics: ${currentData.expiredCount}\n- Estimated Storage to Free: ${formattedSize}\n\nNote: Graphics are NOT deleted automatically. Super Admin explicit approval is required.`,
              actionUrl: `/admin/cleanup`,
              actionLabel: 'Review Request in Portal',
            });
          } catch (mailErr) {
            console.error('Failed to send admin cleanup notification email:', mailErr);
          }
        }
      } else {
        // Update live metrics during countdown
        if (latestCycle.graphicsCount !== currentData.totalCount || latestCycle.totalSizeBytes !== currentData.totalSizeBytes) {
          latestCycle = await prisma.graphicsCleanupRequest.update({
            where: { id: latestCycle.id },
            data: {
              graphicsCount: currentData.totalCount,
              totalSizeBytes: currentData.totalSizeBytes,
              quarantineData: JSON.stringify(currentData.items),
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
 * Delete a single graphic version permanently after Super Admin approval.
 * Safe: Checks shared references, unlinks storage, deletes DB records, updates logs.
 */
export async function deleteSingleGraphicVersion(
  versionId: string,
  adminUserId: string,
  options?: { reason?: string }
): Promise<{
  success: boolean;
  message: string;
  deletedFile: boolean;
  skippedShared: boolean;
  freedBytes: number;
}> {
  const version = await prisma.graphicVersion.findUnique({
    where: { id: versionId },
    include: {
      graphic: {
        include: {
          requirement: true,
        },
      },
    },
  });

  if (!version) {
    throw new Error(`Graphic version not found: ${versionId}`);
  }

  const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });
  if (!adminUser || adminUser.role !== 'ADMIN') {
    throw new Error('Forbidden: Only authorized Super Admins can execute permanent graphic deletion.');
  }

  const fileSize = version.fileSize || 0;
  const fileName = version.fileName || 'graphic.png';
  const fileUrl = version.fileUrl;
  const previewUrl = version.previewUrl;
  let deletedFile = false;
  let skippedShared = false;

  // 1. Storage file deletion (verify not shared elsewhere first)
  if (fileUrl && fileUrl.startsWith('/uploads/')) {
    const isShared = await isSharedGraphicFile(fileUrl, versionId);
    if (isShared) {
      skippedShared = true;
    } else {
      const relativePath = fileUrl.replace(/^\//, '').split('?')[0];
      const absolutePath = path.join(process.cwd(), 'public', relativePath);
      try {
        await fs.access(absolutePath);
        await fs.unlink(absolutePath);
        deletedFile = true;
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          deletedFile = true; // Already gone
        } else {
          console.warn(`Could not unlink graphic file ${relativePath}:`, e.message);
        }
      }
    }
  }

  // Delete preview file if exists and not shared
  if (previewUrl && previewUrl.startsWith('/uploads/') && previewUrl !== fileUrl) {
    const isSharedPreview = await isSharedGraphicFile(previewUrl, versionId);
    if (!isSharedPreview) {
      const relPreview = previewUrl.replace(/^\//, '').split('?')[0];
      const absPreview = path.join(process.cwd(), 'public', relPreview);
      try {
        await fs.unlink(absPreview);
      } catch {}
    }
  }

  // 2. Database Record Deletion in safe transaction
  await prisma.$transaction(async (tx: any) => {
    // Disconnect requirement finalGraphicId
    await tx.requirement.updateMany({
      where: { finalGraphicId: version.graphicId },
      data: { finalGraphicId: null },
    });

    // Delete approvals & revisions
    await tx.approval.deleteMany({
      where: { graphicVersionId: version.id },
    });
    await tx.revision.deleteMany({
      where: { graphicVersionId: version.id },
    });

    // Delete graphic version
    await tx.graphicVersion.delete({
      where: { id: version.id },
    });

    // If no versions left, delete parent graphic
    const remainingCount = await tx.graphicVersion.count({
      where: { graphicId: version.graphicId },
    });
    if (remainingCount === 0) {
      await tx.graphic.delete({
        where: { id: version.graphicId },
      });
    }
  });

  // 3. Log Audit Records
  await logActivity({
    userId: adminUserId,
    userName: adminUser.name,
    userRole: 'ADMIN',
    action: 'GRAPHIC_MANUALLY_DELETED',
    details: `Permanently deleted graphic "${fileName}" (${formatBytes(fileSize)}). File unlinked: ${deletedFile}, Shared preserved: ${skippedShared}.`,
  });

  // Also record in active cycle if exists
  const activeCycle = await prisma.graphicsCleanupRequest.findFirst({
    orderBy: { cycleNumber: 'desc' },
  });
  if (activeCycle) {
    await prisma.deletedGraphicLog.create({
      data: {
        cleanupRequestId: activeCycle.id,
        graphicId: version.graphicId,
        graphicVersionId: version.id,
        requirementCode: version.graphic?.requirement?.reqCode || 'REQ-GENERAL',
        fileName,
        fileUrl,
        fileSize,
        status: 'SUCCESS',
      },
    });

    await prisma.graphicsCleanupRequest.update({
      where: { id: activeCycle.id },
      data: {
        deletedCount: { increment: 1 },
      },
    });
  }

  return {
    success: true,
    message: `Graphic "${fileName}" successfully and permanently deleted. ${formatBytes(fileSize)} released.`,
    deletedFile,
    skippedShared,
    freedBytes: fileSize,
  };
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

  // Merge currently expired items so all eligible assets are cleaned up
  const fresh = await collectCurrentGraphicsData();
  const itemVersionIds = new Set(items.map((i) => i.versionId));
  for (const exp of fresh.expiredItems) {
    if (!itemVersionIds.has(exp.versionId)) {
      items.push(exp);
      itemVersionIds.add(exp.versionId);
    }
  }

  if (items.length === 0) {
    items = fresh.items;
  }

  let deletedCount = 0;
  let failedCount = 0;
  let totalFreedBytes = 0;
  const executionLogs: string[] = [];

  for (const item of items) {
    try {
      // 1. Storage file deletion (with shared asset check)
      if (item.fileUrl && item.fileUrl.startsWith('/uploads/')) {
        const isShared = await isSharedGraphicFile(item.fileUrl, item.versionId);
        if (isShared) {
          executionLogs.push(`Preserved shared asset file on disk: ${item.fileUrl}`);
        } else {
          const relativePath = item.fileUrl.replace(/^\//, '').split('?')[0];
          const absolutePath = path.join(process.cwd(), 'public', relativePath);

          try {
            await fs.access(absolutePath);
            await fs.unlink(absolutePath);
            executionLogs.push(`Permanently deleted physical file: ${relativePath}`);
          } catch (fsErr: any) {
            if (fsErr.code !== 'ENOENT') {
              throw fsErr;
            }
          }
        }
      }

      // 2. Database Record Deletion in safe transaction
      await prisma.$transaction(async (tx: any) => {
        await tx.requirement.updateMany({
          where: { finalGraphicId: item.graphicId },
          data: { finalGraphicId: null },
        });

        await tx.approval.deleteMany({
          where: { graphicVersionId: item.versionId },
        });
        await tx.revision.deleteMany({
          where: { graphicVersionId: item.versionId },
        });

        await tx.graphicVersion.deleteMany({
          where: { id: item.versionId },
        });

        const remainingVersions = await tx.graphicVersion.count({
          where: { graphicId: item.graphicId },
        });
        if (remainingVersions === 0) {
          await tx.graphic.deleteMany({
            where: { id: item.graphicId },
          });
        }
      });

      // Record in DeletedGraphicLog
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
      totalFreedBytes += item.fileSize || 0;
    } catch (itemErr: any) {
      failedCount++;
      executionLogs.push(`Failed to delete item ${item.versionId} (${item.fileName}): ${itemErr.message}`);

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
    details: `Executed Cycle #${request.cycleNumber}: ${deletedCount} graphics deleted (${formatBytes(totalFreedBytes)} freed), ${failedCount} failed.`,
  });

  // Automatically start the next 15-day cycle
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

  // Automatically start the next 15-day cycle
  await ensureActiveCleanupCycle();

  return updatedRequest;
}

/**
 * Daily Server-Side Scheduler Function:
 * Inspects all graphics daily. If graphics >= 15 days old exist,
 * automatically generates or updates a Super Admin approval request.
 * NEVER deletes graphics without Super Admin explicit approval.
 */
export async function runDaily15DayExpirationScheduler() {
  const now = new Date();
  const currentData = await collectCurrentGraphicsData();

  // Check if a pending approval request already exists
  const existingPending = await prisma.graphicsCleanupRequest.findFirst({
    where: { status: 'PENDING_APPROVAL' },
  });

  if (currentData.expiredCount > 0) {
    if (!existingPending) {
      // Create new pending approval request
      const latestCycle = await prisma.graphicsCleanupRequest.findFirst({
        orderBy: { cycleNumber: 'desc' },
      });
      const nextCycleNumber = (latestCycle?.cycleNumber || 0) + 1;

      const newRequest = await prisma.graphicsCleanupRequest.create({
        data: {
          cycleNumber: nextCycleNumber,
          startDate: now,
          scheduledDeletionDate: now,
          status: 'PENDING_APPROVAL',
          graphicsCount: currentData.expiredCount,
          totalSizeBytes: currentData.expiredSizeBytes,
          quarantineData: JSON.stringify(currentData.expiredItems),
        },
      });

      // Notify Super Admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', status: 'ACTIVE' },
      });

      const formattedSize = formatBytes(currentData.expiredSizeBytes);
      for (const admin of admins) {
        await sendNotification({
          userId: admin.id,
          title: `⚠️ 15-Day Graphics Cleanup Approval Required`,
          message: `${currentData.expiredCount} graphic(s) have reached 15 days (${formattedSize}). Please review and approve deletion to free storage.`,
          type: 'SYSTEM',
          priority: 'URGENT',
          actionUrl: '/admin/cleanup',
          actionLabel: 'Review Request →',
        });
      }

      return {
        success: true,
        timestamp: now.toISOString(),
        action: 'PENDING_REQUEST_CREATED',
        expiredCount: currentData.expiredCount,
        expiredSizeBytes: currentData.expiredSizeBytes,
        formattedExpiredSize: formattedSize,
        requestId: newRequest.id,
      };
    } else {
      // Update existing pending request with latest expired items queue
      const updatedRequest = await prisma.graphicsCleanupRequest.update({
        where: { id: existingPending.id },
        data: {
          graphicsCount: currentData.expiredCount,
          totalSizeBytes: currentData.expiredSizeBytes,
          quarantineData: JSON.stringify(currentData.expiredItems),
        },
      });

      return {
        success: true,
        timestamp: now.toISOString(),
        action: 'EXISTING_PENDING_REQUEST_UPDATED',
        expiredCount: currentData.expiredCount,
        expiredSizeBytes: currentData.expiredSizeBytes,
        formattedExpiredSize: formatBytes(currentData.expiredSizeBytes),
        requestId: updatedRequest.id,
      };
    }
  }

  return {
    success: true,
    timestamp: now.toISOString(),
    action: existingPending ? 'EXISTING_PENDING_REQUEST_ACTIVE' : 'NO_NEW_EXPIRED_GRAPHICS',
    expiredCount: currentData.expiredCount,
    totalCount: currentData.totalCount,
    storageUsed: currentData.formattedStorageUsed,
  };
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

  // Overall database graphics totals with expiration analysis
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
        take: 30,
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
      isExpired: msRemaining === 0 || currentData.expiredCount > 0,
      percentageElapsed: Math.min(100, Math.max(0, Math.round(((CLEANUP_INTERVAL_MS - msRemaining) / CLEANUP_INTERVAL_MS) * 100))),
    },
    metrics: {
      totalGraphicsStored: currentData.totalCount,
      totalStorageBytes: currentData.totalSizeBytes,
      formattedStorageUsed: currentData.formattedStorageUsed,
      totalExpiredGraphics: currentData.expiredCount,
      storageOccupiedByExpired: currentData.formattedExpiredStorage,
      estimatedReleasedSpace: currentData.estimatedReleasedSpace,
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
    recentGraphics: currentData.items,
    expiredGraphics: currentData.expiredItems,
  };
}
