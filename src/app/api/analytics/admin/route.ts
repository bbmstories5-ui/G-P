import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { subDays, subMonths, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request, 'ADMIN');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';

    const now = new Date();
    let startDate = subDays(now, 30);
    if (range === '7d') startDate = subDays(now, 7);
    else if (range === '3m') startDate = subMonths(now, 3);
    else if (range === '6m') startDate = subMonths(now, 6);
    else if (range === '12m') startDate = subMonths(now, 12);

    // Fetch counts of roles
    const totalRequesters = await prisma.user.count({ where: { role: 'REQUESTER' } });
    const totalDesigners = await prisma.user.count({ where: { role: 'DESIGNER' } });
    const totalApprovers = await prisma.user.count({ where: { role: 'APPROVER' } });

    // Fetch all requirements
    const allRequirements = await prisma.requirement.findMany({
      include: {
        requester: { select: { id: true, name: true, requesterProfile: true } },
        assignedDesigner: { select: { id: true, name: true, designerProfile: true } },
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

    const totalRequests = allRequirements.length;
    const pending = allRequirements.filter((r) => r.status === 'PENDING').length;
    const inDesign = allRequirements.filter((r) => ['ASSIGNED', 'IN_DESIGN'].includes(r.status)).length;
    const pendingApproval = allRequirements.filter((r) => ['PENDING_APPROVAL', 'RESUBMITTED'].includes(r.status)).length;
    const revision = allRequirements.filter((r) => r.status === 'REVISION_REQUIRED').length;
    const approved = allRequirements.filter((r) => r.status === 'FINAL_APPROVED').length;
    const completed = allRequirements.filter((r) => r.status === 'COMPLETED').length;

    const statusDistribution = [
      { status: 'Pending', count: pending, color: '#94A3B8' },
      { status: 'In Design', count: inDesign, color: '#38BDF8' },
      { status: 'Pending Approval', count: pendingApproval, color: '#FBBF24' },
      { status: 'Revision Required', count: revision, color: '#F87171' },
      { status: 'Approved', count: approved, color: '#34D399' },
      { status: 'Completed', count: completed, color: '#818CF8' },
    ];

    // Designer Comparison Matrix (Designer 01, 02, 03)
    const designers = await prisma.user.findMany({
      where: { role: 'DESIGNER' },
      include: { designerProfile: true },
    });

    const designerComparison = designers.map((d) => {
      const dReqs = allRequirements.filter((r) => r.assignedDesignerId === d.id);
      const dAssigned = dReqs.length;
      const dInDesign = dReqs.filter((r) => r.status === 'IN_DESIGN').length;
      const dSubmitted = dReqs.filter((r) => ['PENDING_APPROVAL', 'RESUBMITTED'].includes(r.status)).length;
      const dRevision = dReqs.filter((r) => r.status === 'REVISION_REQUIRED').length;
      const dApproved = dReqs.filter((r) => r.status === 'FINAL_APPROVED').length;
      const dCompleted = dReqs.filter((r) => r.status === 'COMPLETED').length;

      return {
        id: d.id,
        name: d.name,
        code: d.designerProfile?.designerCode || d.name,
        assigned: dAssigned,
        inDesign: dInDesign,
        submitted: dSubmitted,
        revision: dRevision,
        approved: dApproved,
        completed: dCompleted,
        completionRate: dAssigned > 0 ? Math.round(((dApproved + dCompleted) / dAssigned) * 100) : 0,
      };
    });

    // Requester Overview Matrix (All 12 Members)
    const requesters = await prisma.user.findMany({
      where: { role: 'REQUESTER' },
      include: { requesterProfile: true },
      orderBy: { email: 'asc' },
    });

    const requesterOverview = requesters.map((m) => {
      const mReqs = allRequirements.filter((r) => r.requesterId === m.id);
      const mTotal = mReqs.length;
      const mPending = mReqs.filter((r) => r.status === 'PENDING').length;
      const mInProgress = mReqs.filter((r) => ['ASSIGNED', 'IN_DESIGN'].includes(r.status)).length;
      const mApproval = mReqs.filter((r) => ['PENDING_APPROVAL', 'RESUBMITTED'].includes(r.status)).length;
      const mApproved = mReqs.filter((r) => r.status === 'FINAL_APPROVED').length;
      const mCompleted = mReqs.filter((r) => r.status === 'COMPLETED').length;

      return {
        id: m.id,
        name: m.name,
        memberCode: m.requesterProfile?.memberCode || m.name,
        department: m.requesterProfile?.department || 'Marketing',
        totalRequests: mTotal,
        pending: mPending,
        inProgress: mInProgress,
        approval: mApproval,
        approved: mApproved,
        completed: mCompleted,
      };
    });

    // Company-wide Monthly Trends
    const isDayView = range === '7d' || range === '30d';
    const trendMap = new Map<string, { label: string; created: number; completed: number; approved: number }>();

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

    for (const req of allRequirements) {
      const createdDate = new Date(req.createdAt);
      if (createdDate >= startDate) {
        const key = isDayView ? format(createdDate, 'MMM dd') : format(createdDate, 'MMM yyyy');
        const match = trendMap.get(key) || Array.from(trendMap.values())[0];
        if (match) match.created += 1;
      }

      if (['COMPLETED', 'FINAL_APPROVED'].includes(req.status)) {
        const cDate = new Date(req.updatedAt);
        if (cDate >= startDate) {
          const key = isDayView ? format(cDate, 'MMM dd') : format(cDate, 'MMM yyyy');
          const match = trendMap.get(key) || Array.from(trendMap.values())[0];
          if (match) {
            match.completed += 1;
            if (req.status === 'FINAL_APPROVED') match.approved += 1;
          }
        }
      }
    }

    const companyTrends = Array.from(trendMap.values());

    return NextResponse.json({
      metrics: {
        totalRequesters,
        totalDesigners,
        totalApprovers,
        totalRequests,
        pending,
        inDesign,
        pendingApproval,
        revision,
        approved,
        completed,
      },
      statusDistribution,
      designerComparison,
      requesterOverview,
      companyTrends,
      range,
    });
  } catch (error: any) {
    console.error('Admin Analytics Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
