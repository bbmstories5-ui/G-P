import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { executeIssueScreenshotCleanup } from '@/lib/issueStorageCleanup';

export const runtime = 'nodejs';

// POST /api/support/issues/[id]/retry-cleanup
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admins can retry screenshot cleanup.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const issue = await prisma.supportIssue.findUnique({
      where: { id },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (issue.status !== 'RESOLVED' && issue.status !== 'CLOSED') {
      return NextResponse.json(
        { error: 'Cleanup retry is only applicable to resolved issues.' },
        { status: 400 }
      );
    }

    const cleanupResult = await executeIssueScreenshotCleanup(id, {
      id: user.id,
      name: user.name,
      role: user.role,
    });

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
      message: cleanupResult.success
        ? 'Screenshot cleanup completed successfully.'
        : 'Screenshot cleanup encountered errors.',
      cleanup: cleanupResult,
      issue: updatedIssue,
    });
  } catch (error: any) {
    console.error('Error retrying cleanup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retry cleanup' },
      { status: 500 }
    );
  }
}
