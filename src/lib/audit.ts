import prisma from './prisma';

export async function logActivity({
  requirementId,
  userId,
  userName,
  userRole,
  action,
  details,
}: {
  requirementId?: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  details?: string;
}) {
  try {
    return await prisma.activityLog.create({
      data: {
        requirementId,
        userId,
        userName,
        userRole,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}
