import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const { id } = await Promise.resolve(params);
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'APPROVER' && user.role !== 'ADMIN' && user.role !== 'DESIGNER') {
      return NextResponse.json({ error: 'Unauthorized to reject requirements' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { reason = user.role === 'DESIGNER' ? 'Declined from Designer available pool.' : 'Does not meet creative standards.' } = body;

    const requirement = await prisma.requirement.findUnique({
      where: { id },
      include: {
        requester: true,
        assignedDesigner: true,
        graphics: {
          include: {
            versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    const graphic = requirement.graphics[0];
    const latestVersion = graphic?.versions[0];

    const result = await prisma.$transaction(async (tx) => {
      if (latestVersion) {
        await tx.graphicVersion.update({
          where: { id: latestVersion.id },
          data: { status: 'REJECTED' },
        });

        await tx.approval.create({
          data: {
            requirementId: id,
            graphicVersionId: latestVersion.id,
            approverId: user.id,
            decision: 'REJECTED',
            comments: reason,
          },
        });
      }

      // Add audit comment in discussion thread
      await tx.comment.create({
        data: {
          requirementId: id,
          authorId: user.id,
          authorRole: user.role,
          content: user.role === 'DESIGNER'
            ? `🚫 Requirement Declined by Graphic Designer (${user.name}): "${reason}"`
            : `❌ Requirement Rejected by Approver (${user.name}): "${reason}"`,
        },
      });

      const updatedReq = await tx.requirement.update({
        where: { id },
        data: {
          status: 'REJECTED',
        },
      });

      return { updatedReq };
    });

    // Notify original requester
    await sendNotification({
      userId: requirement.requesterId,
      title: user.role === 'DESIGNER' ? 'Requirement Declined from Pool ❌' : 'Requirement Rejected ❌',
      message: `Your requirement ${requirement.reqCode} was ${user.role === 'DESIGNER' ? 'declined by designer pool' : 'rejected'}. Reason: ${reason}`,
      type: 'REJECTED',
      relatedRequirementId: requirement.id,
    });

    if (requirement.assignedDesignerId && requirement.assignedDesignerId !== user.id) {
      await sendNotification({
        userId: requirement.assignedDesignerId,
        title: 'Submission Rejected ❌',
        message: `Submission for ${requirement.reqCode} was rejected. Reason: ${reason}`,
        type: 'REJECTED',
        relatedRequirementId: requirement.id,
      });
    }

    await logActivity({
      requirementId: requirement.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: user.role === 'DESIGNER' ? 'DECLINED_POOL_REQUIREMENT' : 'REJECTED_GRAPHIC',
      details: `${user.name} (${user.role}) rejected ${requirement.reqCode}. Reason: "${reason}"`,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Reject error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reject requirement' }, { status: 500 });
  }
}
