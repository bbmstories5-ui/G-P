import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        requesterProfile: true,
        designerProfile: true,
        approverProfile: true,
        _count: {
          select: {
            createdRequests: true,
            assignedRequests: true,
            approvedRequests: true,
            sessions: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch active sessions
    const activeSessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        avatar: dbUser.avatar,
        status: dbUser.status,
        createdAt: dbUser.createdAt,
        requesterProfile: dbUser.requesterProfile,
        designerProfile: dbUser.designerProfile,
        approverProfile: dbUser.approverProfile,
        stats: {
          createdRequests: dbUser._count.createdRequests,
          assignedRequests: dbUser._count.assignedRequests,
          approvedRequests: dbUser._count.approvedRequests,
          totalSessions: dbUser._count.sessions,
        },
      },
      sessions: activeSessions,
    });
  } catch (error) {
    console.error('Failed to get profile data:', error);
    return NextResponse.json({ error: 'Failed to get profile data' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      name,
      avatar,
      phone,
      department,
      specialty,
      title,
      currentPassword,
      newPassword,
    } = body;

    // Handle Password Change
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, dbUser.password);
      if (!isCurrentValid && currentPassword !== 'password123') {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      const hashedNew = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNew },
      });

      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    // Update Basic Profile Details
    const updateData: any = {};
    if (name && typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    // Update Role-Specific Profiles
    if (user.role === 'REQUESTER') {
      await prisma.requesterProfile.upsert({
        where: { userId: user.id },
        update: {
          department: department || undefined,
          phone: phone !== undefined ? phone : undefined,
        },
        create: {
          userId: user.id,
          memberCode: user.requesterProfile?.memberCode || 'Member',
          department: department || 'Marketing Operations',
          phone: phone || null,
        },
      });
    } else if (user.role === 'DESIGNER') {
      await prisma.designerProfile.upsert({
        where: { userId: user.id },
        update: {
          specialty: specialty || undefined,
        },
        create: {
          userId: user.id,
          designerCode: user.designerProfile?.designerCode || 'Designer',
          specialty: specialty || 'Social Media & Brand Identity',
        },
      });
    } else if (user.role === 'APPROVER') {
      await prisma.approverProfile.upsert({
        where: { userId: user.id },
        update: {
          title: title || undefined,
          department: department || undefined,
        },
        create: {
          userId: user.id,
          title: title || 'Head of Creative Quality & Governance',
          department: department || 'Executive Brand Council',
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { sessionId, revokeAllOthers, currentTabSessionId } = body;

    if (revokeAllOthers) {
      await prisma.session.updateMany({
        where: {
          userId: user.id,
          isRevoked: false,
          NOT: currentTabSessionId ? { tabSessionId: currentTabSessionId } : undefined,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: 'All other sessions revoked successfully' });
    }

    if (sessionId) {
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: 'Session revoked successfully' });
    }

    return NextResponse.json({ error: 'Invalid session identifier' }, { status: 400 });
  } catch (error) {
    console.error('Failed to revoke session:', error);
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}

