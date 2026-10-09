import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(['ADMIN']);

    const users = await prisma.user.findMany({
      include: {
        requesterProfile: true,
        designerProfile: true,
        approverProfile: true,
        _count: {
          select: {
            createdRequests: true,
            assignedRequests: true,
            approvals: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { userId, status } = await req.json();

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
