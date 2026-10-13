import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

// PATCH /api/support/issues/[id]/reopen
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason = 'Issue reoccurred / needs further investigation', newAttachments = [] } = body;

    const issue = await prisma.supportIssue.findUnique({
      where: { id },
      include: { attachments: true },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Only admin or original reporter can reopen
    if (user.role !== 'ADMIN' && issue.reporterId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Preserve resolution history
    let existingHistory: any[] = [];
    if (issue.previousResolutions) {
      try {
        existingHistory = JSON.parse(issue.previousResolutions);
      } catch {}
    }

    if (issue.resolvedAt || issue.resolutionSummary) {
      existingHistory.push({
        resolvedAt: issue.resolvedAt,
        resolvedById: issue.resolvedById,
        resolutionSummary: issue.resolutionSummary,
        reopenedAt: new Date(),
        reopenedById: user.id,
        reopenedByName: user.name,
        reopenReason: reason,
      });
    }

    // Update issue state
    await prisma.supportIssue.update({
      where: { id },
      data: {
        status: 'REOPENED',
        resolutionSummary: null,
        resolvedAt: null,
        resolvedById: null,
        previousResolutions: JSON.stringify(existingHistory),
        screenshotCleanupStatus: newAttachments.length > 0 ? 'NONE' : 'COMPLETED',
        attachments: {
          create: newAttachments.map((att: any) => ({
            fileName: att.fileName || 'reopened_screenshot.png',
            fileUrl: att.fileUrl,
            fileSize: att.fileSize || 0,
            mimeType: att.mimeType || 'image/png',
            isScreenshot: true,
            storageProvider: att.fileUrl.startsWith('data:') ? 'DATA_URI' : 'LOCAL',
          })),
        },
      },
    });

    await prisma.issueActivity.create({
      data: {
        issueId: id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'REOPENED',
        details: `Issue reopened by ${user.name}. Reason: ${reason}. (${newAttachments.length} new screenshot(s) attached).`,
      },
    });

    const updated = await prisma.supportIssue.findUnique({
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
      message: 'Issue reopened successfully.',
      issue: updated,
    });
  } catch (error: any) {
    console.error('Error reopening issue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reopen issue' },
      { status: 500 }
    );
  }
}
