import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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


    // If it's a user notification (starts with notif_)
    if (id.startsWith('notif_')) {
      const realId = id.replace('notif_', '');
      await prisma.notification.updateMany({
        where: { id: realId, userId: user.id },
        data: {
          isDismissed: true,
          dismissedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: 'Notice dismissed' });
    }

    return NextResponse.json({ success: true, message: 'Notice dismissed for session' });
  } catch (error) {
    console.error('Failed to dismiss notice:', error);
    return NextResponse.json({ error: 'Failed to dismiss notice' }, { status: 500 });
  }
}
