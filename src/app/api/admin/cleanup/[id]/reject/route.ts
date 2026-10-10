import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { rejectCleanupRequest } from '@/lib/cleanup-scheduler';

export const runtime = 'nodejs';

/**
 * POST /api/admin/cleanup/[id]/reject
 * Super Admin rejection to keep graphics safe
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = (body.reason || '').trim();

    if (!reason) {
      return NextResponse.json(
        { error: 'A rejection reason is required to document governance records.' },
        { status: 400 }
      );
    }

    const result = await rejectCleanupRequest(id, user.id, reason);

    return NextResponse.json({
      success: true,
      message: `Cycle #${result.cycleNumber} cleanup rejected. All graphics have been preserved safely.`,
      result: {
        id: result.id,
        cycleNumber: result.cycleNumber,
        status: result.status,
        decisionNotes: result.decisionNotes,
        reviewedAt: result.reviewedAt,
      },
    });
  } catch (error: any) {
    console.error('Error rejecting cleanup request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject cleanup request' },
      { status: 500 }
    );
  }
}
