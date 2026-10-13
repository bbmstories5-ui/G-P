import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/support/issues - List issues
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get('status') || 'ALL'; // ALL | ACTIVE | RESOLVED | OPEN | IN_PROGRESS
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const where: any = {};

    // Non-admins only see their own issues
    if (user.role !== 'ADMIN') {
      where.reporterId = user.id;
    }

    // Status filter
    if (filterStatus === 'ACTIVE') {
      where.status = { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] };
    } else if (filterStatus === 'RESOLVED') {
      where.status = { in: ['RESOLVED', 'CLOSED'] };
    } else if (filterStatus !== 'ALL') {
      where.status = filterStatus;
    }

    // Category filter
    if (category && category !== 'ALL') {
      where.category = category;
    }

    // Priority filter
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    // Text search
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { issueCode: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const issues = await prisma.supportIssue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        resolvedBy: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        attachments: {
          orderBy: { uploadedAt: 'asc' },
        },
        activities: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    // Counts for tabs
    const countsWhere: any = user.role !== 'ADMIN' ? { reporterId: user.id } : {};
    const [totalCount, activeCount, resolvedCount] = await Promise.all([
      prisma.supportIssue.count({ where: countsWhere }),
      prisma.supportIssue.count({
        where: { ...countsWhere, status: { in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] } },
      }),
      prisma.supportIssue.count({
        where: { ...countsWhere, status: { in: ['RESOLVED', 'CLOSED'] } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      issues,
      counts: {
        total: totalCount,
        active: activeCount,
        resolved: resolvedCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching support issues:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

// POST /api/support/issues - Create a new issue
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category = 'GENERAL',
      priority = 'MEDIUM',
      affectedPage,
      attachments = [], // array of { fileUrl, fileName, fileSize, mimeType }
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Issue title is required' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Issue description is required' }, { status: 400 });
    }

    // Generate unique sequential issueCode: ISS-1001, ISS-1002, etc.
    const lastIssue = await prisma.supportIssue.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { issueCode: true },
    });

    let nextNumber = 1001;
    if (lastIssue?.issueCode) {
      const match = lastIssue.issueCode.match(/\d+/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }
    const issueCode = `ISS-${nextNumber}`;

    const newIssue = await prisma.supportIssue.create({
      data: {
        issueCode,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: 'OPEN',
        affectedPage: affectedPage?.trim() || null,
        reporterId: user.id,
        screenshotCleanupStatus: attachments.length > 0 ? 'NONE' : 'COMPLETED',
        attachments: {
          create: attachments.map((att: any) => ({
            fileName: att.fileName || 'screenshot.png',
            fileUrl: att.fileUrl,
            fileSize: att.fileSize || 0,
            mimeType: att.mimeType || 'image/png',
            isScreenshot: true,
            storageProvider: att.fileUrl.startsWith('data:') ? 'DATA_URI' : 'LOCAL',
          })),
        },
        activities: {
          create: {
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'CREATED',
            details: `Issue reported with ${attachments.length} screenshot(s).`,
          },
        },
      },
      include: {
        reporter: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        attachments: true,
        activities: true,
      },
    });

    return NextResponse.json({
      success: true,
      issue: newIssue,
      message: `Issue ${issueCode} submitted successfully.`,
    });
  } catch (error: any) {
    console.error('Error creating support issue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit issue' },
      { status: 500 }
    );
  }
}
