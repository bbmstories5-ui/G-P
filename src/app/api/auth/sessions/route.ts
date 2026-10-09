import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.session.findMany({
      where: { userId: user.id, isRevoked: false },
      orderBy: { lastActivityAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        deviceInfo: true,
        createdAt: true,
        lastActivityAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({
      sessions,
      totalActive: sessions.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching sessions' }, { status: 500 });
  }
}
