import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyPasswordResetToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing recovery token. Please click the link sent to your email.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters in length' },
        { status: 400 }
      );
    }

    // Verify cryptographic JWT token
    const tokenPayload = verifyPasswordResetToken(token);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'This password recovery link is invalid or has expired. Please request a new link.' },
        { status: 400 }
      );
    }

    // Find target user
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'This account has been suspended. Please contact your system administrator.' },
        { status: 403 }
      );
    }

    // Hash new password securely
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Revoke all existing sessions for security
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    }).catch(() => {});

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_RESET_COMPLETED',
        details: `Password successfully updated via recovery link for ${user.email}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role || 'USER',
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully! You can now sign in with your new credentials.',
    });
  } catch (error: any) {
    console.error('[RESET PASSWORD ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while resetting your password' },
      { status: 500 }
    );
  }
}
