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
      return NextResponse.json({ error: 'Only approvers or admins can request revisions' }, { status: 403 });
    }

    const { feedback } = await req.json();

    if (!feedback || feedback.trim() === '') {
      return NextResponse.json({ error: 'Revision feedback instructions are required' }, { status: 400 });
    }

    const requirement = await prisma.requirement.findUnique({
      where: { id },

      include: {
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

    const revisionCount = await prisma.revision.count({
      where: { requirementId: id },
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update version status
      await tx.graphicVersion.update({
        where: { id: latestVersion.id },
        data: { status: 'REVISION_REQUESTED' },
      });

      // 2. Create revision record
      const revision = await tx.revision.create({
        data: {
          requirementId: id,
          graphicVersionId: latestVersion.id,
          approverId: user.id,
          revisionNumber: revisionCount + 1,
          feedback: feedback.trim(),
        },
      });

      // 3. Update requirement status
      const updatedReq = await tx.requirement.update({
        where: { id },
        data: {
          status: 'REVISION_REQUIRED',
        },
      });

      return { updatedReq, revision };
    });


    // Notify assigned designer with Action CTA
    if (requirement.assignedDesignerId) {
      await sendNotification({
        userId: requirement.assignedDesignerId,
        title: `Revision Mandated: ${requirement.reqCode}`,
        message: `Approver requested changes on "${requirement.title}": "${feedback.trim().slice(0, 90)}..."`,
        type: 'WARNING',
        priority: 'URGENT',
        actionUrl: `/designer/requests/${requirement.id}`,
        actionLabel: 'View Revisions →',
        relatedRequirementId: requirement.id,
      });
    }

    // Audit log
    await logActivity({
      requirementId: requirement.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'REQUESTED_REVISION',
      details: `${user.name} requested Revision #${revisionCount + 1} for ${requirement.reqCode}. Feedback: "${feedback.trim()}"`,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Revision request error:', error);
    return NextResponse.json({ error: error.message || 'Failed to request revision' }, { status: 500 });
  }
}
