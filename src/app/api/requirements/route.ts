import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { notifyDesignersOfNewRequirement } from '@/lib/notifications';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const scope = searchParams.get('scope'); // 'available', 'assigned', 'mine'

    let whereClause: any = {};

    // 1. ROLE-BASED ACCESS CONTROL & STRICT DATA ISOLATION
    if (user.role === 'REQUESTER') {
      // Requesters can ONLY EVER see their own requirements!
      whereClause.requesterId = user.id;
    } else if (user.role === 'DESIGNER') {
      if (scope === 'available') {
        // Unassigned requests available in queue
        whereClause.status = 'PENDING';
        whereClause.assignedDesignerId = null;
      } else if (scope === 'mine' || scope === 'assigned') {
        // Requests assigned to this specific designer
        whereClause.assignedDesignerId = user.id;
      } else {
        // By default show assigned to them OR available
        whereClause.OR = [
          { assignedDesignerId: user.id },
          { status: 'PENDING', assignedDesignerId: null },
        ];
      }
    } else if (user.role === 'APPROVER') {
      if (scope === 'pending_approvals') {
        whereClause.status = { in: ['PENDING_APPROVAL', 'RESUBMITTED'] };
      }
    }

    // 2. ADDITIONAL FILTERS
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }
    if (priority && priority !== 'ALL') {
      whereClause.priority = priority;
    }
    if (category && category !== 'ALL') {
      whereClause.category = category;
    }
    if (search) {
      const searchTerms = search.trim();
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { reqCode: { contains: searchTerms } },
            { title: { contains: searchTerms } },
            { description: { contains: searchTerms } },
          ],
        },
      ];
    }

    const requirements = await prisma.requirement.findMany({
      where: whereClause,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            requesterProfile: true,
          },
        },
        assignedDesigner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            designerProfile: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        files: true,
        revisions: {
          orderBy: { requestedAt: 'desc' },
          take: 1,
          include: {
            approver: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        graphics: {
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            revisions: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requirements });
  } catch (error: any) {
    console.error('Fetch requirements error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch requirements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'REQUESTER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only requesters or admins can create graphic requests' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category = 'Social Media',
      platform = 'Instagram',
      dimensions = '1080x1080',
      priority = 'MEDIUM',
      deadline,
      additionalInstructions,
      referenceFileUrl,
      referenceFileName,
    } = body;

    if (!title || !description || !deadline) {
      return NextResponse.json({ error: 'Title, description, and deadline are required' }, { status: 400 });
    }

    // Generate unique sequential code (e.g., REQ-0011)
    const count = await prisma.requirement.count();
    const reqCode = `REQ-${String(count + 1).padStart(4, '0')}`;

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
        deadline: new Date(deadline),
        status: 'PENDING',
        additionalInstructions,
        files: referenceFileUrl
          ? {
            create: {
              fileName: referenceFileName || 'Reference-Material.png',
              fileUrl: referenceFileUrl,
              fileType: 'image/png',
              fileSize: 1024 * 500,
              isReference: true,
            },
          }
          : undefined,
      },
    });

    // Notify all active designers
    await notifyDesignersOfNewRequirement(reqCode, title, requirement.id);

    // Audit log
    await logActivity({
      requirementId: requirement.id,
      userId: user.id,
      userName: `${user.name} (${user.requesterProfile?.memberCode || 'Requester'})`,
      userRole: user.role,
      action: 'CREATED_REQUIREMENT',
      details: `Created new creative requirement ${reqCode}: "${title}" with priority ${priority}`,
    });

    return NextResponse.json({ success: true, requirement });
  } catch (error: any) {
    console.error('Create requirement error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create requirement' }, { status: 500 });
  }
}
