import prisma from './prisma';
import { emitNotificationEvent } from './realtime';

export interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'SYSTEM' | 'WORKFLOW' | string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  actionUrl?: string;
  actionLabel?: string;
  entityType?: string;
  entityId?: string;
  relatedRequirementId?: string;
  expiresAt?: Date;
}

export async function sendNotification(input: NotificationInput) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type || 'INFO',
        priority: input.priority || 'NORMAL',
        actionUrl: input.actionUrl || null,
        actionLabel: input.actionLabel || null,
        entityType: input.entityType || (input.relatedRequirementId ? 'REQUIREMENT' : null),
        entityId: input.entityId || input.relatedRequirementId || null,
        relatedRequirementId: input.relatedRequirementId || null,
        expiresAt: input.expiresAt || null,
      },
    });

    // Real-time instant delivery to connected clients
    if (notification) {
      emitNotificationEvent(notification);
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Notify all active designers when an open/unassigned requirement is broadcasted
 */
export async function notifyDesignersOfNewRequirement(
  reqCode: string,
  title: string,
  requirementId: string
) {
  try {
    const designers = await prisma.user.findMany({
      where: { role: 'DESIGNER', status: 'ACTIVE' },
    });

    for (const designer of designers) {
      await sendNotification({
        userId: designer.id,
        title: `Open Requirement: ${reqCode}`,
        message: `Requirement "${title}" is available in the open pool. Claim it for your queue.`,
        type: 'WORKFLOW',
        priority: 'NORMAL',
        actionUrl: `/designer/available`,
        actionLabel: 'Claim Task →',
        relatedRequirementId: requirementId,
      });
    }
  } catch (error) {
    console.error('Failed to notify designers of open pool:', error);
  }
}

/**
 * Notify specific designer when explicitly assigned to a request
 */
export async function notifyDesignerOfAssignment(
  designerId: string,
  reqCode: string,
  title: string,
  requirementId: string
) {
  return await sendNotification({
    userId: designerId,
    title: `Assigned Request: ${reqCode}`,
    message: `You are assigned to design "${title}". Open your studio workspace to start work.`,
    type: 'WORKFLOW',
    priority: 'HIGH',
    actionUrl: `/designer/requests/${requirementId}`,
    actionLabel: 'Open Studio →',
    relatedRequirementId: requirementId,
  });
}

/**
 * Notify requester that a designer claimed or was assigned their request
 */
export async function notifyRequesterOfAssignment(
  requesterId: string,
  designerName: string,
  reqCode: string,
  title: string,
  requirementId: string
) {
  return await sendNotification({
    userId: requesterId,
    title: `Designer Assigned: ${reqCode}`,
    message: `${designerName} has been assigned to produce your graphic "${title}".`,
    type: 'INFO',
    priority: 'NORMAL',
    actionUrl: `/requester/requests/${requirementId}`,
    actionLabel: 'View Request →',
    relatedRequirementId: requirementId,
  });
}

/**
 * Notify approver when a designer uploads a graphic version
 */
export async function notifyApproverOfSubmission(
  reqCode: string,
  title: string,
  designerName: string,
  versionNumber: number,
  requirementId: string
) {
  try {
    const approvers = await prisma.user.findMany({
      where: { role: 'APPROVER', status: 'ACTIVE' },
    });

    for (const approver of approvers) {
      await sendNotification({
        userId: approver.id,
        title: `Approval Required: ${reqCode}`,
        message: `${designerName} submitted Version ${versionNumber} for "${title}". Review and approve before production release.`,
        type: 'URGENT',
        priority: 'URGENT',
        actionUrl: `/approver/review/${requirementId}`,
        actionLabel: 'Review Graphic →',
        relatedRequirementId: requirementId,
      });
    }
  } catch (error) {
    console.error('Failed to notify approver of submission:', error);
  }
}

/**
 * Notify assigned designer when approver requests a revision
 */
export async function notifyDesignerOfRevision(
  designerId: string,
  reqCode: string,
  title: string,
  feedback: string,
  requirementId: string
) {
  return await sendNotification({
    userId: designerId,
    title: `Revision Mandated: ${reqCode}`,
    message: `Approver requested changes on "${title}": "${feedback.slice(0, 100)}${feedback.length > 100 ? '...' : ''}"`,
    type: 'WARNING',
    priority: 'URGENT',
    actionUrl: `/designer/requests/${requirementId}`,
    actionLabel: 'View Revisions →',
    relatedRequirementId: requirementId,
  });
}

/**
 * Notify requester that revision is underway
 */
export async function notifyRequesterOfRevision(
  requesterId: string,
  reqCode: string,
  title: string,
  requirementId: string
) {
  return await sendNotification({
    userId: requesterId,
    title: `Revision in Progress: ${reqCode}`,
    message: `Feedback was submitted on "${title}". Designer is preparing updated deliverable.`,
    type: 'INFO',
    priority: 'NORMAL',
    actionUrl: `/requester/requests/${requirementId}`,
    actionLabel: 'Check Status →',
    relatedRequirementId: requirementId,
  });
}

/**
 * Notify requester when their graphic is finalized and approved
 */
export async function notifyRequesterOfApproval(
  requesterId: string,
  reqCode: string,
  title: string,
  requirementId: string
) {
  return await sendNotification({
    userId: requesterId,
    title: `Graphic Approved: ${reqCode}`,
    message: `Your graphic for "${title}" has received final sign-off and is available to download.`,
    type: 'SUCCESS',
    priority: 'HIGH',
    actionUrl: `/requester/approved`,
    actionLabel: 'Download Deliverable →',
    relatedRequirementId: requirementId,
  });
}

/**
 * Notify designer that their submission was approved
 */
export async function notifyDesignerOfApproval(
  designerId: string,
  reqCode: string,
  title: string,
  requirementId: string
) {
  return await sendNotification({
    userId: designerId,
    title: `Approved by Governance: ${reqCode}`,
    message: `Your graphic for "${title}" has been approved for release. Excellent work!`,
    type: 'SUCCESS',
    priority: 'NORMAL',
    actionUrl: `/designer/requests/${requirementId}`,
    actionLabel: 'View Deliverable →',
    relatedRequirementId: requirementId,
  });
}
