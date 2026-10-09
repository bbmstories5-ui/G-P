import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, assertRequirementAccess } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const { id } = await Promise.resolve(params);
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access
    const requirement = await assertRequirementAccess(id, user);

    const { content, isInternal = false } = await req.json();

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        requirementId: id,

        authorId: user.id,
        authorRole: user.role,
        content: content.trim(),
        isInternal: user.role === 'ADMIN' ? isInternal : false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
            requesterProfile: true,
            designerProfile: true,
          },
        },
      },
    });

    await logActivity({
      requirementId: id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ADDED_COMMENT',
      details: `${user.name} added a message to ${requirement.reqCode}`,
    });


    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to post comment' }, { status: 500 });
  }
}
