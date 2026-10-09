import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { subDays, subMonths, startOfDay, format, isAfter, isBefore, addDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request, 'REQUESTER');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d'; // 7d, 30d, 3m, 6m, 12m
    const targetUserId = searchParams.get('userId') || user.id;

    // Strict Security: Requesters can only access their own analytics
    if (user.role === 'REQUESTER' && targetUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Cannot access other requesters data' }, { status: 403 });
    }

    // Determine cutoff date based on range
    const now = new Date();
    let startDate = subDays(now, 30);
    if (range === '7d') startDate = subDays(now, 7);
    else if (range === '3m') startDate = subMonths(now, 3);
    else if (range === '6m') startDate = subMonths(now, 6);
    else if (range === '12m') startDate = subMonths(now, 12);

    // Fetch all requirements for this specific requester
    const allRequests = await prisma.requirement.findMany({
      where: { requesterId: targetUserId },
      include: {
        assignedDesigner: { select: { id: true, name: true } },
        finalGraphic: true,
        graphics: {
          include: {
            versions: true,
          },
        },
        revisions: true,
        approvals: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute top-level metric counters
    const totalRequests = allRequests.length;
    const pending = allRequests.filter((r) => r.status === 'PENDING').length;
    const inProgress = allRequests.filter((r) => ['ASSIGNED', 'IN_DESIGN'].includes(r.status)).length;
    const pendingApproval = allRequests.filter((r) => ['PENDING_APPROVAL', 'RESUBMITTED'].includes(r.status)).length;
    const revisionRequired = allRequests.filter((r) => r.status === 'REVISION_REQUIRED').length;
    const approved = allRequests.filter((r) => r.status === 'FINAL_APPROVED').length;
    const completed = allRequests.filter((r) => r.status === 'COMPLETED').length;
    const rejected = allRequests.filter((r) => r.status === 'REJECTED').length;

    // Status breakdown for donut/pie charts
    const statusDistribution = [
      { status: 'Pending', count: pending, color: '#94A3B8' },
      { status: 'In Progress', count: inProgress, color: '#38BDF8' },
      { status: 'Pending Approval', count: pendingApproval, color: '#FBBF24' },
      { status: 'Revision Required', count: revisionRequired, color: '#F87171' },
      { status: 'Approved', count: approved, color: '#34D399' },
      { status: 'Completed', count: completed, color: '#818CF8' },
      { status: 'Rejected', count: rejected, color: '#F43F5E' },
    ];

    // Build timeline buckets for Monthly / Periodic trend graph
    const filteredRequests = allRequests.filter((r) => new Date(r.createdAt) >= startDate);
    
    // Group by month or day depending on range
    const trendMap = new Map<string, { label: string; created: number; completed: number; approved: number }>();

    // Prepare time slots
    const isDayView = range === '7d' || range === '30d';
    const stepCount = range === '7d' ? 7 : range === '30d' ? 10 : range === '3m' ? 3 : range === '6m' ? 6 : 12;

    if (isDayView) {
      const days = range === '7d' ? 7 : 30;
      for (let i = days - 1; i >= 0; i -= (range === '7d' ? 1 : 3)) {
        const d = subDays(now, i);
        const key = format(d, 'MMM dd');
        trendMap.set(key, { label: key, created: 0, completed: 0, approved: 0 });
      }
    } else {
      const months = range === '3m' ? 3 : range === '6m' ? 6 : 12;
      for (let i = months - 1; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, 'MMM yyyy');
        trendMap.set(key, { label: format(d, 'MMM'), created: 0, completed: 0, approved: 0 });
      }
    }

    // Populate trend data
    for (const req of allRequests) {
      const createdDate = new Date(req.createdAt);
      if (createdDate >= startDate) {
        const key = isDayView ? format(createdDate, 'MMM dd') : format(createdDate, 'MMM yyyy');
        // Find closest bucket if stepped
        if (trendMap.has(key)) {
          const entry = trendMap.get(key)!;
          entry.created += 1;
        } else {
          // If in between steps, add to first preceding key or match
          const matchingKey = Array.from(trendMap.keys()).reverse().find((k) => k <= key) || Array.from(trendMap.keys())[0];
          if (matchingKey && trendMap.has(matchingKey)) {
            trendMap.get(matchingKey)!.created += 1;
          }
        }
      }

      if (['COMPLETED', 'FINAL_APPROVED'].includes(req.status)) {
        const completedDate = new Date(req.updatedAt);
        if (completedDate >= startDate) {
          const key = isDayView ? format(completedDate, 'MMM dd') : format(completedDate, 'MMM yyyy');
          if (trendMap.has(key)) {
            const entry = trendMap.get(key)!;
            entry.completed += 1;
            if (req.status === 'FINAL_APPROVED') entry.approved += 1;
          } else {
            const matchingKey = Array.from(trendMap.keys()).reverse().find((k) => k <= key) || Array.from(trendMap.keys())[0];
            if (matchingKey && trendMap.has(matchingKey)) {
              trendMap.get(matchingKey)!.completed += 1;
              if (req.status === 'FINAL_APPROVED') trendMap.get(matchingKey)!.approved += 1;
            }
          }
        }
      }
    }

    const monthlyTrends = Array.from(trendMap.values());

    // Recent requests table data (top 8)
    const recentRequests = allRequests.slice(0, 8).map((r) => ({
      id: r.id,
      reqCode: r.reqCode,
      title: r.title,
      category: r.category,
      priority: r.priority,
      status: r.status,
      deadline: r.deadline,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      designerName: r.assignedDesigner?.name || 'Unassigned',
      hasApprovedGraphic: !!r.finalGraphicId,
    }));

    return NextResponse.json({
      metrics: {
        totalRequests,
        pending,
        inProgress,
        pendingApproval,
        revisionRequired,
        approved,
        completed,
        rejected,
      },
      statusDistribution,
      monthlyTrends,
      recentRequests,
      range,
    });
  } catch (error: any) {
    console.error('Requester Analytics Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
