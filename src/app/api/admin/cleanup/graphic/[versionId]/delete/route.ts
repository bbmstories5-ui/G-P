import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { deleteSingleGraphicVersion } from '@/lib/cleanup-scheduler';

export const runtime = 'nodejs';

/**
 * POST /api/admin/cleanup/graphic/[versionId]/delete
 * Super Admin approval to permanently delete a specific graphic file and its DB records.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { versionId: string } | Promise<{ versionId: string }> }
) {
  try {
    const { versionId } = await Promise.resolve(params);
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only authorized Super Admins can approve and delete graphic assets' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const reason = (body.reason || 'Super Admin individual graphic cleanup approval').trim();

    const result = await deleteSingleGraphicVersion(versionId, user.id, { reason });

    return NextResponse.json({
      success: true,
      message: result.message,
      result,
    });
  } catch (error: any) {
    console.error('Error in deleteSingleGraphicVersion API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete graphic' },
      { status: 500 }
    );
  }
}
