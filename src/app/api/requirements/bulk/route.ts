import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notifyDesignersOfNewRequirement } from '@/lib/notifications';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'REQUESTER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only requesters or admins can create bulk creative requests' }, { status: 403 });
    }

    const body = await req.json();
    const { items, batchName = 'Bulk Birthday Request' } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'An array of items is required' }, { status: 400 });
    }

    if (items.length > 200) {
      return NextResponse.json({ error: 'Maximum 200 items per bulk upload batch' }, { status: 400 });
    }

    // Process items in database
    const createdRequirements: any[] = [];
    const baseCount = await prisma.requirement.count();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const {
        title,
        description,
        category = 'Birthday Creative',
        platform = 'WhatsApp Status & Socials',
        dimensions = '1080 x 1080',
        priority = 'MEDIUM',
        deadline,
        additionalInstructions,
        referenceFileUrl,
        referenceFileName,
      } = item;

      if (!title || !description) {
        continue;
      }

      const reqCode = `REQ-${String(baseCount + i + 1).padStart(4, '0')}`;
      const effectiveDeadline = deadline ? new Date(deadline) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      const requirement = await prisma.requirement.create({
        data: {
          reqCode,
          requesterId: user.id,
          title,
          description,
          category,
          platform,
          dimensions,
          priority,
          deadline: effectiveDeadline,
          status: 'PENDING',
          additionalInstructions,
          files: referenceFileUrl
            ? {
                create: {
                  fileName: referenceFileName || 'Member-Photo.png',
                  fileUrl: referenceFileUrl,
                  fileType: 'image/png',
                  fileSize: 1024 * 500,
                  isReference: true,
                },
              }
            : undefined,
        },
      });

      // Audit log for individual requirement
      await logActivity({
        requirementId: requirement.id,
        userId: user.id,
        userName: `${user.name} (${user.requesterProfile?.memberCode || 'Requester'})`,
        userRole: user.role,
        action: 'CREATED_REQUIREMENT',
        details: `Created batch requirement ${reqCode}: "${title}" [${batchName}]`,
      });

      createdRequirements.push(requirement);
    }

    // Trigger notification for newly added requirements
    if (createdRequirements.length > 0) {
      await notifyDesignersOfNewRequirement(
        `${createdRequirements[0].reqCode} - ${createdRequirements[createdRequirements.length - 1].reqCode}`,
        `Batch: ${batchName} (${createdRequirements.length} Creatives)`,
        createdRequirements[0].id
      );
    }

    return NextResponse.json({
      success: true,
      count: createdRequirements.length,
      requirements: createdRequirements,
    });
  } catch (error: any) {
    console.error('Bulk create requirements error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process bulk requirements' }, { status: 500 });
  }
}
