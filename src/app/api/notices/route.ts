import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notices = await prisma.systemNotice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ notices });
  } catch (error) {
    console.error('Failed to list system notices:', error);
    return NextResponse.json({ error: 'Failed to list notices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can create system notices' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      message,
      type = 'SYSTEM',
      priority = 'NORMAL',
      targetRole = 'ALL',
      targetUserId,
      actionUrl,
      actionLabel,
      startAt,
      expiresAt,
    } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const newNotice = await prisma.systemNotice.create({
      data: {
        title,
        message,
        type,
        priority,
        targetRole,
        targetUserId: targetUserId || null,
        actionUrl: actionUrl || null,
        actionLabel: actionLabel || 'Learn More →',
        startAt: startAt ? new Date(startAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
        createdBy: user.name || user.email,
      },
    });

    return NextResponse.json({ success: true, notice: newNotice });
  } catch (error: any) {
    console.error('Failed to create system notice:', error);
    return NextResponse.json({ error: error.message || 'Failed to create notice' }, { status: 500 });
  }
}
