import { promises as fs } from 'fs';
import path from 'path';
import prisma from './prisma';

export interface CleanupResult {
  success: boolean;
  totalAttachments: number;
  deletedCount: number;
  skippedSharedCount: number;
  failedCount: number;
  error?: string;
  details: Array<{
    attachmentId: string;
    fileUrl: string;
    status: 'DELETED' | 'SKIPPED_SHARED' | 'FAILED' | 'DATA_URI_CLEANED';
    reason?: string;
  }>;
}

/**
 * Checks whether a given fileUrl is referenced by any other database entity
 * outside of the specified issue's attachments.
 */
export async function isFileReferencedElsewhere(
  fileUrl: string,
  excludeIssueId: string
): Promise<boolean> {
  if (!fileUrl || fileUrl.startsWith('data:')) {
    return false;
  }

  // 1. Check other issue attachments
  const otherIssueAttachment = await prisma.issueAttachment.findFirst({
    where: {
      fileUrl,
      issueId: { not: excludeIssueId },
    },
    select: { id: true },
  });
  if (otherIssueAttachment) return true;

  // 2. Check RequirementFile
  const requirementFile = await prisma.requirementFile.findFirst({
    where: { fileUrl },
    select: { id: true },
  });
  if (requirementFile) return true;

  // 3. Check GraphicVersion
  const graphicVersion = await prisma.graphicVersion.findFirst({
    where: {
      OR: [{ fileUrl }, { previewUrl: fileUrl }],
    },
    select: { id: true },
  });
  if (graphicVersion) return true;

  // 4. Check GeneratedCreative
  const generatedCreative = await prisma.generatedCreative.findFirst({
    where: {
      OR: [{ fileUrl }, { previewUrl: fileUrl }],
    },
    select: { id: true },
  });
  if (generatedCreative) return true;

  // 5. Check User Avatar
  const userAvatar = await prisma.user.findFirst({
    where: { avatar: fileUrl },
    select: { id: true },
  });
  if (userAvatar) return true;

  // 6. Check CreativeTemplate
  const templateRef = await prisma.creativeTemplate.findFirst({
    where: {
      OR: [
        { previewImageUrl: fileUrl },
        { backgroundUrl: fileUrl },
        { baseDesignUrl: fileUrl },
      ],
    },
    select: { id: true },
  });
  if (templateRef) return true;

  // 7. Check BrandLogo
  const logoRef = await prisma.brandLogo.findFirst({
    where: {
      OR: [{ logoUrl: fileUrl }, { darkLogoUrl: fileUrl }],
    },
    select: { id: true },
  });
  if (logoRef) return true;

  return false;
}

/**
 * Executes automatic permanent deletion of issue screenshots from physical storage
 * and removes the database attachment records once successfully deleted.
 *
 * Idempotent: can be safely re-run without errors or duplicate deletions.
 */
export async function executeIssueScreenshotCleanup(
  issueId: string,
  executedByUser?: { id: string; name: string; role: string }
): Promise<CleanupResult> {
  const issue = await prisma.supportIssue.findUnique({
    where: { id: issueId },
    include: {
      attachments: true,
    },
  });

  if (!issue) {
    throw new Error(`Issue not found with ID: ${issueId}`);
  }

  // Set status to PENDING while executing
  await prisma.supportIssue.update({
    where: { id: issueId },
    data: {
      screenshotCleanupStatus: 'PENDING',
      screenshotCleanupError: null,
    },
  });

  const attachments = issue.attachments;
  const result: CleanupResult = {
    success: true,
    totalAttachments: attachments.length,
    deletedCount: 0,
    skippedSharedCount: 0,
    failedCount: 0,
    details: [],
  };

  if (attachments.length === 0) {
    // No attachments to clean
    await prisma.supportIssue.update({
      where: { id: issueId },
      data: {
        screenshotCleanupStatus: 'COMPLETED',
        screenshotCleanupCompletedAt: new Date(),
        screenshotCleanupError: null,
      },
    });

    await prisma.issueActivity.create({
      data: {
        issueId,
        userId: executedByUser?.id,
        userName: executedByUser?.name || 'System Worker',
        userRole: executedByUser?.role || 'SYSTEM',
        action: 'CLEANUP_COMPLETED',
        details: 'Cleanup completed: Issue had no screenshots attached.',
      },
    });

    return result;
  }

  for (const attachment of attachments) {
    const fileUrl = attachment.fileUrl;

    try {
      // 1. Data URI cleanup (no disk file)
      if (fileUrl.startsWith('data:')) {
        await prisma.issueAttachment.delete({
          where: { id: attachment.id },
        });
        result.deletedCount++;
        result.details.push({
          attachmentId: attachment.id,
          fileUrl: '[Data URI Image]',
          status: 'DATA_URI_CLEANED',
        });
        continue;
      }

      // 2. Check if file is shared / referenced elsewhere
      const isShared = await isFileReferencedElsewhere(fileUrl, issueId);
      if (isShared) {
        // Remove only this issue's attachment record, DO NOT delete shared physical file
        await prisma.issueAttachment.delete({
          where: { id: attachment.id },
        });
        result.skippedSharedCount++;
        result.details.push({
          attachmentId: attachment.id,
          fileUrl,
          status: 'SKIPPED_SHARED',
          reason: 'File is referenced by other assets/issues; preserved storage, pruned issue reference.',
        });
        continue;
      }

      // 3. Local storage physical deletion
      if (fileUrl.startsWith('/uploads/')) {
        const sanitizedRel = fileUrl.replace(/^\//, '').replace(/\.\./g, '');
        const diskPath = path.join(process.cwd(), 'public', sanitizedRel);

        try {
          // Check if file exists on disk
          await fs.access(diskPath);
          // Unlink / permanently delete
          await fs.unlink(diskPath);
        } catch (accessOrUnlinkErr: any) {
          if (accessOrUnlinkErr.code !== 'ENOENT') {
            // File exists but could not be unlinked (permission error, file lock, etc.)
            throw new Error(`Failed to unlink file on disk (${accessOrUnlinkErr.code}): ${accessOrUnlinkErr.message}`);
          }
          // If ENOENT: file already removed from disk previously, safe to proceed
        }

        // 4. Prune database attachment record ONLY after physical file deletion succeeded
        await prisma.issueAttachment.delete({
          where: { id: attachment.id },
        });

        result.deletedCount++;
        result.details.push({
          attachmentId: attachment.id,
          fileUrl,
          status: 'DELETED',
        });
      } else {
        // External storage or other local reference
        await prisma.issueAttachment.delete({
          where: { id: attachment.id },
        });
        result.deletedCount++;
        result.details.push({
          attachmentId: attachment.id,
          fileUrl,
          status: 'DELETED',
        });
      }
    } catch (itemErr: any) {
      console.error(`Error deleting attachment ${attachment.id} (${fileUrl}):`, itemErr);
      result.failedCount++;
      result.success = false;
      result.error = itemErr.message || 'Storage file removal failed';
      result.details.push({
        attachmentId: attachment.id,
        fileUrl,
        status: 'FAILED',
        reason: itemErr.message || 'File deletion failed',
      });
      // Do not delete the database row if physical file deletion failed, as per prompt specifications!
    }
  }

  // Finalize issue cleanup status
  if (result.success && result.failedCount === 0) {
    const totalPruned = result.deletedCount + result.skippedSharedCount;
    await prisma.supportIssue.update({
      where: { id: issueId },
      data: {
        screenshotCleanupStatus: 'COMPLETED',
        screenshotCleanupCompletedAt: new Date(),
        screenshotCleanupError: null,
        deletedScreenshotCount: {
          increment: totalPruned,
        },
      },
    });

    await prisma.issueActivity.create({
      data: {
        issueId,
        userId: executedByUser?.id,
        userName: executedByUser?.name || 'System Worker',
        userRole: executedByUser?.role || 'SYSTEM',
        action: 'CLEANUP_COMPLETED',
        details: `Successfully permanently deleted ${result.deletedCount} physical screenshot file(s) and pruned database attachment records. (${result.skippedSharedCount} shared assets safely preserved).`,
      },
    });
  } else {
    // Mark as failed and preserve remaining attachment records for background retry
    await prisma.supportIssue.update({
      where: { id: issueId },
      data: {
        screenshotCleanupStatus: 'FAILED',
        screenshotCleanupError: result.error || `${result.failedCount} screenshot file(s) could not be removed`,
        deletedScreenshotCount: {
          increment: result.deletedCount,
        },
      },
    });

    await prisma.issueActivity.create({
      data: {
        issueId,
        userId: executedByUser?.id,
        userName: executedByUser?.name || 'System Worker',
        userRole: executedByUser?.role || 'SYSTEM',
        action: 'CLEANUP_FAILED',
        details: `Screenshot cleanup failed: ${result.error || `${result.failedCount} file(s) failed`}. Attachment records preserved for retry.`,
      },
    });
  }

  return result;
}
