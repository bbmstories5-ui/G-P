import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const { id } = await Promise.resolve(params);
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'APPROVER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only approvers or admins can approve graphics' }, { status: 403 });
    }

    const { comments = 'Approved brand asset.' } = await req.json();

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

    if (!graphic || !latestVersion) {
      return NextResponse.json({ error: 'No graphic has been uploaded for this requirement yet.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update version status
      await tx.graphicVersion.update({
        where: { id: latestVersion.id },
        data: { status: 'APPROVED' },
      });

      // 2. Update graphic status
      await tx.graphic.update({
        where: { id: graphic.id },
        data: { status: 'APPROVED' },
      });

      // 3. Create approval record
      const approval = await tx.approval.create({
        data: {
          requirementId: id,
          graphicVersionId: latestVersion.id,
          approverId: user.id,
          decision: 'APPROVED',
          comments,
        },
      });

      // 4. Update requirement status to FINAL_APPROVED
      const updatedReq = await tx.requirement.update({
        where: { id },
        data: {
          status: 'FINAL_APPROVED',
          approvedById: user.id,
          finalGraphicId: graphic.id,
        },
      });


      return { updatedReq, approval };
    });

    // 5. Notify the ORIGINAL REQUESTER (Strict workflow routing!)
    await sendNotification({
      userId: requirement.requesterId,
      title: `Graphic Approved: ${requirement.reqCode}`,
      message: `Your requirement "${requirement.title}" has been approved by ${user.name}. You can download the high-resolution master asset now.`,
      type: 'SUCCESS',
      priority: 'HIGH',
      actionUrl: `/requester/approved`,
      actionLabel: 'Download Deliverable →',
      relatedRequirementId: requirement.id,
    });

    // 6. Notify assigned designer
    if (requirement.assignedDesignerId) {
      await sendNotification({
        userId: requirement.assignedDesignerId,
        title: `Work Approved: ${requirement.reqCode}`,
        message: `Version ${latestVersion.versionNumber} of "${requirement.title}" was approved by ${user.name}. Great job!`,
        type: 'SUCCESS',
        priority: 'NORMAL',
        actionUrl: `/designer/requests/${requirement.id}`,
        actionLabel: 'View Deliverable →',
        relatedRequirementId: requirement.id,
      });
    }

    // 7. Audit log
    await logActivity({
      requirementId: requirement.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'APPROVED_GRAPHIC',
      details: `${user.name} approved Version ${latestVersion.versionNumber}. Approval note: "${comments}"`,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Approve error:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve requirement' }, { status: 500 });
  }
}
