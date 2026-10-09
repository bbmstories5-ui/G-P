import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notifyApproverOfSubmission } from '@/lib/notifications';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const { id } = await Promise.resolve(params);
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DESIGNER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only designers can upload graphic submissions' }, { status: 403 });
    }

    const requirement = await prisma.requirement.findUnique({
      where: { id },
      include: {

        graphics: {
          include: {
            versions: { orderBy: { versionNumber: 'desc' } },
          },
        },
      },
    });

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    if (user.role === 'DESIGNER' && requirement.assignedDesignerId !== user.id) {
      return NextResponse.json({ error: 'You are not assigned to this requirement' }, { status: 403 });
    }

    const body = await req.json();
    const { fileUrl, fileName = 'graphic-submission.png', fileSize = 1500000, mimeType = 'image/png', designerNotes = '' } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: 'Graphic file is required' }, { status: 400 });
    }

    // Check existing Graphic parent
    let graphic = requirement.graphics[0];
    let nextVersionNumber = 1;

    if (graphic && graphic.versions.length > 0) {
      nextVersionNumber = graphic.versions[0].versionNumber + 1;
    }

    const result = await prisma.$transaction(async (tx) => {
      if (!graphic) {
        graphic = await tx.graphic.create({
          data: {
            requirementId: id,
            designerId: user.id,
            currentVersion: 1,
            status: 'PENDING_APPROVAL',
          },
          include: { versions: true },
        });
      } else {
        await tx.graphic.update({
          where: { id: graphic.id },
          data: {
            currentVersion: nextVersionNumber,
            status: 'PENDING_APPROVAL',
          },
        });
      }

      // Create new Version
      const newVersion = await tx.graphicVersion.create({
        data: {
          graphicId: graphic.id,
          versionNumber: nextVersionNumber,
          fileUrl,
          previewUrl: fileUrl,
          fileName,
          fileSize,
          mimeType,
          dimensions: requirement.dimensions,
          designerNotes,
          status: 'PENDING_APPROVAL',
        },
      });

      // Update Requirement status
      const isResubmission = requirement.status === 'REVISION_REQUIRED';
      const updatedStatus = 'PENDING_APPROVAL';

      const updatedReq = await tx.requirement.update({
        where: { id },
        data: {
          status: updatedStatus,
        },
      });


      return { updatedReq, newVersion };
    });

    // Notify Approver
    await notifyApproverOfSubmission(
      requirement.reqCode,
      requirement.title,
      user.name,
      nextVersionNumber,
      requirement.id
    );

    // Audit log
    await logActivity({
      requirementId: requirement.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPLOADED_GRAPHIC',
      details: `${user.name} uploaded Version ${nextVersionNumber} (${fileName}). Notes: "${designerNotes || 'No notes'}"`,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Upload graphic error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit graphic' }, { status: 500 });
  }
}
