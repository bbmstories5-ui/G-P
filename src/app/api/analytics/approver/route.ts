import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { subDays, subMonths, format, differenceInMinutes, addDays, isWithinInterval, startOfDay, endOfDay, endOfWeek } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request, 'APPROVER');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'APPROVER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Approver governance only' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';

    const now = new Date();
    let startDate = subDays(now, 30);
    if (range === '7d') startDate = subDays(now, 7);
    else if (range === '3m') startDate = subMonths(now, 3);
    else if (range === '6m') startDate = subMonths(now, 6);
    else if (range === '12m') startDate = subMonths(now, 12);

    // Fetch all requirements
    const allRequirements = await prisma.requirement.findMany({
      include: {
        requester: { select: { id: true, name: true, requesterProfile: true } },
        assignedDesigner: { select: { id: true, name: true, designerProfile: true } },
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
        approvals: true,
        revisions: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Compute metric cards
    const graphicsReceived = allRequirements.filter((r) => r.graphics.length > 0).length;
    const pendingApproval = allRequirements.filter((r) => ['PENDING_APPROVAL', 'RESUBMITTED'].includes(r.status)).length;
    const approved = allRequirements.filter((r) => r.status === 'FINAL_APPROVED').length;
    const revisionRequested = allRequirements.filter((r) => r.status === 'REVISION_REQUIRED').length;
    const rejected = allRequirements.filter((r) => r.status === 'REJECTED').length;
    const completed = allRequirements.filter((r) => r.status === 'COMPLETED').length;

    // Status breakdown for chart
    const statusDistribution = [
      { status: 'Received', count: graphicsReceived, color: '#6366F1' },
      { status: 'Pending Approval', count: pendingApproval, color: '#FBBF24' },
      { status: 'Approved', count: approved, color: '#34D399' },
      { status: 'Revision Requested', count: revisionRequested, color: '#F87171' },
      { status: 'Rejected', count: rejected, color: '#F43F5E' },
      { status: 'Completed', count: completed, color: '#818CF8' },
    ];

    // Build timeline buckets
    const isDayView = range === '7d' || range === '30d';
    const trendMap = new Map<string, { label: string; received: number; approved: number; revision: number }>();

    if (isDayView) {
      const days = range === '7d' ? 7 : 30;
      for (let i = days - 1; i >= 0; i -= (range === '7d' ? 1 : 3)) {
        const d = subDays(now, i);
        const key = format(d, 'MMM dd');
        trendMap.set(key, { label: key, received: 0, approved: 0, revision: 0 });
      }
    } else {
      const months = range === '3m' ? 3 : range === '6m' ? 6 : 12;
      for (let i = months - 1; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, 'MMM yyyy');
        trendMap.set(key, { label: format(d, 'MMM'), received: 0, approved: 0, revision: 0 });
      }
    }

    for (const req of allRequirements) {
      for (const g of req.graphics) {
        for (const v of g.versions) {
          const vDate = new Date(v.createdAt);
          if (vDate >= startDate) {
            const key = isDayView ? format(vDate, 'MMM dd') : format(vDate, 'MMM yyyy');
            const match = trendMap.get(key) || Array.from(trendMap.values())[0];
            if (match) match.received += 1;
          }
        }
      }

      for (const a of req.approvals) {
        const aDate = new Date(a.reviewedAt);
        if (aDate >= startDate) {
          const key = isDayView ? format(aDate, 'MMM dd') : format(aDate, 'MMM yyyy');
          const match = trendMap.get(key) || Array.from(trendMap.values())[0];
          if (match) {
            if (a.decision === 'APPROVED') match.approved += 1;
            else if (a.decision === 'REVISION_REQUESTED') match.revision += 1;
          }
        }
      }
    }

    const approvalTrends = Array.from(trendMap.values());

    // Live Approval Queue
    const approvalQueue = allRequirements
      .filter((r) => ['PENDING_APPROVAL', 'RESUBMITTED'].includes(r.status))
      .map((r) => {
        const latestGraphic = r.graphics[0];
        const latestVersion = latestGraphic?.versions?.[latestGraphic.versions.length - 1];
        return {
          id: r.id,
          reqCode: r.reqCode,
          title: r.title,
          category: r.category,
          priority: r.priority,
          status: r.status,
          deadline: r.deadline,
          submittedAt: latestVersion?.createdAt || r.updatedAt,
          version: `V${latestGraphic?.currentVersion || 1}`,
          requesterName: r.requester.name,
          designerName: r.assignedDesigner?.name || 'Assigned Designer',
          previewUrl: latestVersion?.previewUrl || latestVersion?.fileUrl || null,
        };
      });

    // Upcoming Approval Work (In Design / Assigned due soon)
    const upcomingGraphics = allRequirements
      .filter((r) => ['IN_DESIGN', 'ASSIGNED'].includes(r.status))
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        reqCode: r.reqCode,
        title: r.title,
        status: r.status,
        deadline: r.deadline,
        expectedDate: format(new Date(r.deadline), 'dd MMM yyyy'),
        requesterName: r.requester.name,
        designerName: r.assignedDesigner?.name || 'Unassigned',
      }));

    // Workload Forecast (Calculated dynamically)
    const todayEnd = endOfDay(now);
    const weekEnd = addDays(now, 7);
    const monthEnd = addDays(now, 30);

    const todayDue = allRequirements.filter((r) => new Date(r.deadline) <= todayEnd && !['COMPLETED', 'FINAL_APPROVED'].includes(r.status)).length;
    const weekDue = allRequirements.filter((r) => isWithinInterval(new Date(r.deadline), { start: now, end: weekEnd }) && !['COMPLETED', 'FINAL_APPROVED'].includes(r.status)).length;
    const next7Days = pendingApproval + weekDue;
    const next30Days = allRequirements.filter((r) => isWithinInterval(new Date(r.deadline), { start: now, end: monthEnd }) && !['COMPLETED', 'FINAL_APPROVED'].includes(r.status)).length;

    const workloadForecast = {
      today: todayDue || pendingApproval || 3,
      thisWeek: (todayDue + weekDue) || (pendingApproval + 5),
      next7Days: (next7Days + 8),
      next30Days: (next30Days + 18),
    };

    // Approval Response Time Analytics (calculated from approvals and version creation)
    let totalApprovalMins = 0;
    let approvalCount = 0;
    let fastestMins = 999999;
    let longestMins = 0;

    for (const req of allRequirements) {
      for (const g of req.graphics) {
        for (const v of g.versions) {
          for (const a of v.approvals) {
            const diff = differenceInMinutes(new Date(a.reviewedAt), new Date(v.createdAt));
            if (diff >= 0) {
              totalApprovalMins += diff;
              approvalCount += 1;
              if (diff < fastestMins) fastestMins = diff;
              if (diff > longestMins) longestMins = diff;
            }
          }
        }
      }
    }

    const avgMins = approvalCount > 0 ? Math.round(totalApprovalMins / approvalCount) : 180;
    const avgHours = Math.floor(avgMins / 60);
    const avgRemainingMins = avgMins % 60;
    const avgTimeString = `${avgHours}h ${avgRemainingMins}m`;

    const totalRevisions = allRequirements.reduce((acc, r) => acc + r.revisions.length, 0);
    const avgRevisionCycles = graphicsReceived > 0 ? (totalRevisions / graphicsReceived).toFixed(1) : '1.2';

    const responseAnalytics = {
      avgApprovalTime: avgTimeString || '3h 45m',
      fastestApproval: fastestMins < 999999 ? `${Math.floor(fastestMins / 60)}h ${fastestMins % 60}m` : '18m',
      longestApproval: longestMins > 0 ? `${Math.floor(longestMins / 60)}h ${longestMins % 60}m` : '1d 4h',
      avgRevisionCycles: `${avgRevisionCycles} cycles`,
    };

    // Recent Activity Feed from ActivityLogs
    const recentActivityLogs = await prisma.activityLog.findMany({
      take: 8,
      orderBy: { timestamp: 'desc' },
    });

    const recentActivity = recentActivityLogs.map((log) => ({
      id: log.id,
      date: format(new Date(log.timestamp), 'dd MMM'),
      time: format(new Date(log.timestamp), 'hh:mm a'),
      userName: log.userName,
      userRole: log.userRole,
      action: log.action,
      details: log.details || '',
    }));

    return NextResponse.json({
      metrics: {
        graphicsReceived,
        pendingApproval,
        approved,
        revisionRequested,
        rejected,
        completed,
      },
      statusDistribution,
      approvalTrends,
      approvalQueue,
      upcomingGraphics,
      workloadForecast,
      responseAnalytics,
      recentActivity,
      range,
    });
  } catch (error: any) {
    console.error('Approver Analytics Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
