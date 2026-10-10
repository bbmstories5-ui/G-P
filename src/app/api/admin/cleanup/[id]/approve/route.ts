import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { executeApprovedCleanup } from '@/lib/cleanup-scheduler';

export const runtime = 'nodejs';

/**
 * POST /api/admin/cleanup/[id]/approve
 * Super Admin approval to execute graphics batch deletion
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

    const result = await executeApprovedCleanup(id, user.id);

    return NextResponse.json({
      success: true,
      message: `Successfully executed graphics deletion for Cycle #${result.cycleNumber}.`,
      result: {
        id: result.id,
        cycleNumber: result.cycleNumber,
        status: result.status,
        deletedCount: result.deletedCount,
        failedCount: result.failedCount,
        executedAt: result.executedAt,
      },
    });
  } catch (error: any) {
    console.error('Error approving and executing cleanup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute cleanup deletion' },
      { status: 500 }
    );
  }
}
