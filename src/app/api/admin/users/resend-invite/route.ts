import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { userId, customPassword } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        requesterProfile: true,
        designerProfile: true,
        approverProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_BASE_URL ||
      process.env.APP_URL ||
      (host.includes('localhost') ? 'https://portal-grap.up.railway.app' : `${protocol}://${host}`);

    const roleLoginPath =
      user.role === 'ADMIN'
        ? '/login/admin'
        : user.role === 'APPROVER'
        ? '/login/approver'
        : user.role === 'DESIGNER'
        ? '/login/designer'
        : '/login/requester';

    const loginUrl = `${baseUrl.replace(/\/$/, '')}${roleLoginPath}?email=${encodeURIComponent(user.email)}`;
    const identifier =
      user.requesterProfile?.memberCode ||
      user.designerProfile?.designerCode ||
      (user.role === 'APPROVER' ? 'Lead Approver' : 'Super Admin');

    const result = await sendInvitationEmail({
      toEmail: user.email,
      recipientName: user.name,
      role: user.role,
      identifier,
      password: customPassword || 'password123',
      loginUrl,
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      code: result.code,
    });
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    return NextResponse.json({ error: error.message || 'Failed to resend' }, { status: 500 });
  }
}
