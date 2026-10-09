import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const { id } = await Promise.resolve(params);
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requirement = await prisma.requirement.findUnique({
      where: { id },
    });

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    if (user.role === 'DESIGNER' && requirement.assignedDesignerId !== user.id) {
      return NextResponse.json({ error: 'You are not assigned to this requirement' }, { status: 403 });
    }

    const updated = await prisma.requirement.update({
      where: { id },
      data: { status: 'IN_DESIGN' },
    });


    await logActivity({
      requirementId: requirement.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'STARTED_DESIGN',
      details: `${user.name} started creative design work on ${requirement.reqCode}`,
    });

    return NextResponse.json({ success: true, requirement: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to start design' }, { status: 500 });
  }
}
