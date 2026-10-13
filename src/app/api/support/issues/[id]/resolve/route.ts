import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { executeIssueScreenshotCleanup } from '@/lib/issueStorageCleanup';

export const runtime = 'nodejs';

// PATCH /api/support/issues/[id]/resolve
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    // 3. Validate Super Admin authorization on backend
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only authorized Super Admins can resolve issues and trigger cleanup.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { resolutionSummary, confirmDeleteScreenshots } = body;

    // 1. Require resolution summary
    if (!resolutionSummary || !resolutionSummary.trim()) {
      return NextResponse.json(
        { error: 'A resolution summary describing how the issue was fixed is required.' },
        { status: 400 }
      );
    }

    // 2. Require confirmation of screenshot deletion
    if (confirmDeleteScreenshots !== true) {
      return NextResponse.json(
        { error: 'Explicit confirmation for permanent screenshot file cleanup is required.' },
        { status: 400 }
      );
    }

    const existingIssue = await prisma.supportIssue.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!existingIssue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // 4 & 5. Update issue status to RESOLVED, save resolution summary, resolvedBy, and resolvedAt
    const now = new Date();
    await prisma.supportIssue.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedById: user.id,
        resolvedAt: now,
        resolutionSummary: resolutionSummary.trim(),
        screenshotCleanupStatus: existingIssue.attachments.length > 0 ? 'PENDING' : 'COMPLETED',
      },
    });

    // Log resolution activity
    await prisma.issueActivity.create({
      data: {
        issueId: id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'RESOLVED',
        details: `Issue marked as Resolved. Resolution Summary: "${resolutionSummary.trim()}"`,
      },
    });

    // 6, 7, 8. Execute storage cleanup: physically delete files, then prune attachment DB records
    let cleanupResult;
    try {
      cleanupResult = await executeIssueScreenshotCleanup(id, {
        id: user.id,
        name: user.name,
        role: user.role,
      });
    } catch (cleanupErr: any) {
      console.error(`Automatic cleanup failed for issue ${id}:`, cleanupErr);
      await prisma.supportIssue.update({
        where: { id },
        data: {
          screenshotCleanupStatus: 'FAILED',
          screenshotCleanupError: cleanupErr.message || 'Storage cleanup failed during execution',
        },
      });
      cleanupResult = {
        success: false,
        error: cleanupErr.message,
        deletedCount: 0,
        failedCount: existingIssue.attachments.length,
      };
    }

    // Fetch refreshed issue state with pruned attachments and activities
    const updatedIssue = await prisma.supportIssue.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        resolvedBy: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        attachments: true,
        activities: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Issue marked as Resolved and screenshots cleaned up successfully.',
      issue: updatedIssue,
      cleanup: cleanupResult,
    });
  } catch (error: any) {
    console.error('Error in resolve issue endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resolve issue' },
      { status: 500 }
    );
  }
}
