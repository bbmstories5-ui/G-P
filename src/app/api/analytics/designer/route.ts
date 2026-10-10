import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { subDays, subMonths } from 'date-fns';
import { buildTimelineBuckets, findMatchingBucketIndex } from '@/lib/analytics-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request, 'DESIGNER');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';
    const targetUserId = searchParams.get('userId') || user.id;

    // Strict Security: Designers can only access their own performance data
    if (user.role === 'DESIGNER' && targetUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Cannot access other designers performance' }, { status: 403 });
    }

    // Determine cutoff date based on range
    const now = new Date();
    let startDate = subDays(now, 30);
    if (range === '7d') startDate = subDays(now, 7);
    else if (range === '3m') startDate = subMonths(now, 3);
    else if (range === '6m') startDate = subMonths(now, 6);
    else if (range === '12m') startDate = subMonths(now, 12);

    // Fetch all requirements assigned to this designer
    const assignedRequests = await prisma.requirement.findMany({
      where: { assignedDesignerId: targetUserId },
      include: {
        requester: { select: { id: true, name: true } },
        finalGraphic: true,
        graphics: {
          include: {
            versions: {
              include: {
                approvals: true,
                revisions: true,
              },
            },
          },
        },
        revisions: true,
        approvals: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Top metrics
    const totalAssigned = assignedRequests.length;
    const pending = assignedRequests.filter((r) => r.status === 'ASSIGNED').length;
    const inDesign = assignedRequests.filter((r) => r.status === 'IN_DESIGN').length;
    const submittedForApproval = assignedRequests.filter((r) => ['PENDING_APPROVAL', 'RESUBMITTED'].includes(r.status)).length;
    const revisionRequired = assignedRequests.filter((r) => r.status === 'REVISION_REQUIRED').length;
    const approved = assignedRequests.filter((r) => r.status === 'FINAL_APPROVED').length;
    const completed = assignedRequests.filter((r) => r.status === 'COMPLETED').length;

    // Status breakdown
    const statusDistribution = [
      { status: 'Assigned Pending', count: pending, color: '#94A3B8' },
      { status: 'In Design Studio', count: inDesign, color: '#38BDF8' },
      { status: 'Submitted Approval', count: submittedForApproval, color: '#FBBF24' },
      { status: 'Revision Required', count: revisionRequired, color: '#F87171' },
      { status: 'Approved', count: approved, color: '#34D399' },
      { status: 'Completed', count: completed, color: '#818CF8' },
    ];

    // Pipeline Stage Funnel
    const pipeline = [
      { stage: 'Assigned', count: totalAssigned, color: '#6366F1' },
      { stage: 'In Design', count: inDesign + submittedForApproval + revisionRequired + approved + completed, color: '#3B82F6' },
      { stage: 'Submitted', count: submittedForApproval + revisionRequired + approved + completed, color: '#F59E0B' },
      { stage: 'Under Review', count: submittedForApproval, color: '#EC4899' },
      { stage: 'Approved / Completed', count: approved + completed, color: '#10B981' },
    ];

    // Build timeline buckets
    const buckets = buildTimelineBuckets(range, now);
    const performanceTrends = buckets.map((b) => ({
      label: b.label,
      received: 0,
      submitted: 0,
      approved: 0,
    }));

    for (const req of assignedRequests) {
      const createdDate = new Date(req.createdAt);
      const rIdx = findMatchingBucketIndex(createdDate, buckets);
      if (rIdx >= 0) {
        performanceTrends[rIdx].received += 1;
      }

      // Check graphic version submissions
      for (const g of req.graphics) {
        for (const v of g.versions) {
          const vDate = new Date(v.createdAt);
          const vIdx = findMatchingBucketIndex(vDate, buckets);
          if (vIdx >= 0) {
            performanceTrends[vIdx].submitted += 1;
          }
        }
      }

      // Check approvals
      if (['FINAL_APPROVED', 'COMPLETED'].includes(req.status)) {
        const aDate = new Date(req.updatedAt);
        const aIdx = findMatchingBucketIndex(aDate, buckets);
        if (aIdx >= 0) {
          performanceTrends[aIdx].approved += 1;
        }
      }
    }

    // Recent work list
    const recentWork = assignedRequests.slice(0, 8).map((r) => {
      const currentGraphic = r.graphics[0];
      const versionNum = currentGraphic?.currentVersion || 1;
      return {
        id: r.id,
        reqCode: r.reqCode,
        title: r.title,
        category: r.category,
        priority: r.priority,
        status: r.status,
        deadline: r.deadline,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        requesterName: r.requester.name,
        version: `V${versionNum}`,
        hasRevisions: r.revisions.length > 0,
      };
    });

    return NextResponse.json({
      metrics: {
        totalAssigned,
        pending,
        inDesign,
        submittedForApproval,
        revisionRequired,
        approved,
        completed,
      },
      statusDistribution,
      pipeline,
      performanceTrends,
      recentWork,
      range,
    });
  } catch (error: any) {
    console.error('Designer Analytics Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
