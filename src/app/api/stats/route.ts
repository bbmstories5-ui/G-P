import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let stats: any = {};

    if (user.role === 'REQUESTER') {
      const [total, pending, inProgress, revisionRequired, approved, completed] = await Promise.all([
        prisma.requirement.count({ where: { requesterId: user.id } }),
        prisma.requirement.count({ where: { requesterId: user.id, status: 'PENDING' } }),
        prisma.requirement.count({ where: { requesterId: user.id, status: { in: ['ASSIGNED', 'IN_DESIGN', 'PENDING_APPROVAL', 'RESUBMITTED'] } } }),
        prisma.requirement.count({ where: { requesterId: user.id, status: 'REVISION_REQUIRED' } }),
        prisma.requirement.count({ where: { requesterId: user.id, status: 'FINAL_APPROVED' } }),
        prisma.requirement.count({ where: { requesterId: user.id, status: 'COMPLETED' } }),
      ]);

      stats = { total, pending, inProgress, revisionRequired, approved, completed };
    } else if (user.role === 'DESIGNER') {
      const [available, myAssigned, inDesign, pendingApproval, revisionRequired, completed] = await Promise.all([
        prisma.requirement.count({ where: { status: 'PENDING', assignedDesignerId: null } }),
        prisma.requirement.count({ where: { assignedDesignerId: user.id } }),
        prisma.requirement.count({ where: { assignedDesignerId: user.id, status: 'IN_DESIGN' } }),
        prisma.requirement.count({ where: { assignedDesignerId: user.id, status: 'PENDING_APPROVAL' } }),
        prisma.requirement.count({ where: { assignedDesignerId: user.id, status: 'REVISION_REQUIRED' } }),
        prisma.requirement.count({ where: { assignedDesignerId: user.id, status: 'FINAL_APPROVED' } }),
      ]);

      stats = { available, myAssigned, inDesign, pendingApproval, revisionRequired, completed };
    } else if (user.role === 'APPROVER') {
      const [pendingApprovals, approvedToday, revisionRequests, rejected, totalReviewed] = await Promise.all([
        prisma.requirement.count({ where: { status: { in: ['PENDING_APPROVAL', 'RESUBMITTED'] } } }),
        prisma.approval.count({
          where: {
            approverId: user.id,
            decision: 'APPROVED',
            reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        prisma.requirement.count({ where: { status: 'REVISION_REQUIRED' } }),
        prisma.requirement.count({ where: { status: 'REJECTED' } }),
        prisma.approval.count({ where: { approverId: user.id } }),
      ]);

      stats = { pendingApprovals, approvedToday, revisionRequests, rejected, totalReviewed };
    } else if (user.role === 'ADMIN') {
      const [
        totalRequirements,
        totalRequesters,
        totalDesigners,
        totalApprovals,
        pendingWork,
        approvedTotal,
      ] = await Promise.all([
        prisma.requirement.count(),
        prisma.user.count({ where: { role: 'REQUESTER' } }),
        prisma.user.count({ where: { role: 'DESIGNER' } }),
        prisma.approval.count(),
        prisma.requirement.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_DESIGN', 'PENDING_APPROVAL', 'REVISION_REQUIRED'] } } }),
        prisma.requirement.count({ where: { status: 'FINAL_APPROVED' } }),
      ]);

      stats = {
        totalRequirements,
        totalRequesters,
        totalDesigners,
        totalApprovals,
        pendingWork,
        approvedTotal,
      };
    }

    return NextResponse.json({ stats });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
