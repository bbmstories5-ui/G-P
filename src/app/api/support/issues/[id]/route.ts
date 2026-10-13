import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/support/issues/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const issue = await prisma.supportIssue.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        resolvedBy: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        attachments: {
          orderBy: { uploadedAt: 'asc' },
        },
        activities: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Access check: only reporter or admin can view
    if (user.role !== 'ADMIN' && issue.reporterId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, issue });
  } catch (error: any) {
    console.error('Error fetching issue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch issue' },
      { status: 500 }
    );
  }
}

// DELETE /api/support/issues/[id] - Super Admin only can delete issue if needed
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Super Admin authorization required' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.supportIssue.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Issue removed' });
  } catch (error: any) {
    console.error('Error deleting issue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete issue' },
      { status: 500 }
    );
  }
}
