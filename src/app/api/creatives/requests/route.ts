import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (user.role !== 'ADMIN') {
      where.memberId = user.id;
    }
    if (status) {
      where.status = status;
    }

    const requests = await prisma.creativeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: { id: true, name: true, email: true },
        },
        template: {
          select: { id: true, name: true, previewImageUrl: true, categoryId: true, approvalRequired: true },
        },
        generatedCreative: true,
      },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Failed to fetch creative requests:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { templateId, submittedData, photoUrl } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const template = await prisma.creativeTemplate.findUnique({
      where: { id: templateId },
      include: { category: true },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const count = await prisma.creativeRequest.count();
    const reqCode = `CR-${String(count + 1).padStart(4, '0')}`;

    const requiresApproval = template.approvalRequired;
    const initialStatus = requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED';

    const request = await prisma.creativeRequest.create({
      data: {
        reqCode,
        memberId: user.id,
        templateId,
        submittedData: typeof submittedData === 'string' ? submittedData : JSON.stringify(submittedData || {}),
        photoUrl: photoUrl || null,
        status: initialStatus,
      },
      include: {
        template: true,
      },
    });

    return NextResponse.json({
      success: true,
      requiresApproval,
      status: initialStatus,
      request,
    });
  } catch (error: any) {
    console.error('Failed to create creative request:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, adminFeedback, generatedCreativeId } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Request ID and status are required' }, { status: 400 });
    }

    const updated = await prisma.creativeRequest.update({
      where: { id },
      data: {
        status,
        adminFeedback: adminFeedback !== undefined ? adminFeedback : undefined,
        generatedCreativeId: generatedCreativeId !== undefined ? generatedCreativeId : undefined,
      },
      include: {
        member: { select: { name: true, email: true } },
        template: true,
        generatedCreative: true,
      },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Failed to update creative request:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
