import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const { id } = await Promise.resolve(params);
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DESIGNER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only graphic makers or admins can accept requirements' }, { status: 403 });
    }

    const requirement = await prisma.requirement.findUnique({
      where: { id },

      include: { requester: true },
    });

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    if (requirement.status !== 'PENDING' && requirement.assignedDesignerId) {
      return NextResponse.json(
        { error: 'This requirement has already been claimed by another graphic maker.' },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const reqUpdated = await tx.requirement.update({
        where: { id },
        data: {
          assignedDesignerId: user.id,
          status: 'ASSIGNED',
        },
      });

      await tx.designerAssignment.create({
        data: {
          requirementId: id,
          designerId: user.id,
          status: 'ACTIVE',
        },
      });

      return reqUpdated;
    });


    // Notify original requester
    await sendNotification({
      userId: requirement.requesterId,
      title: 'Designer Assigned 🎨',
      message: `${user.name} has accepted your request ${requirement.reqCode} (${requirement.title}).`,
      type: 'ASSIGNED',
      relatedRequirementId: requirement.id,
    });

    // Log Activity
    await logActivity({
      requirementId: requirement.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ACCEPTED_ASSIGNMENT',
      details: `${user.name} claimed requirement ${requirement.reqCode}`,
    });

    return NextResponse.json({ success: true, requirement: updated });
  } catch (error: any) {
    console.error('Assign error:', error);
    return NextResponse.json({ error: error.message || 'Failed to assign requirement' }, { status: 500 });
  }
}
