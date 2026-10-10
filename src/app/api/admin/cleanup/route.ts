import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCleanupSystemStats, ensureActiveCleanupCycle } from '@/lib/cleanup-scheduler';

export const runtime = 'nodejs';

/**
 * GET /api/admin/cleanup
 * Returns current cycle stats, countdown timer, pending requests, and historical logs
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const data = await getCleanupSystemStats();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching cleanup system stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cleanup stats' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cleanup
 * Trigger a background cycle check/re-evaluation
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const activeCycle = await ensureActiveCleanupCycle();
    const data = await getCleanupSystemStats();

    return NextResponse.json({
      success: true,
      message: 'Cleanup cycle checked and updated successfully',
      data,
    });
  } catch (error: any) {
    console.error('Error updating cleanup cycle:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update cleanup cycle' },
      { status: 500 }
    );
  }
}
