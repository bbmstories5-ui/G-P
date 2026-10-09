import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSession, signJwtToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, tabSessionId } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        requesterProfile: true,
        designerProfile: true,
        approverProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create an independent database session for this client tab
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const effectiveTabId = tabSessionId || req.headers.get('x-tab-session-id') || null;

    const session = await createSession(user.id, {
      tabSessionId: effectiveTabId,
      userAgent,
      ipAddress,
      deviceInfo: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
    });

    const token = signJwtToken({
      userId: user.id,
      sessionId: session.id,
      sessionToken: session.sessionToken,
      tabSessionId: effectiveTabId || undefined,
      email: user.email,
      role: user.role as any,
      name: user.name,
      memberCode: user.requesterProfile?.memberCode,
      designerCode: user.designerProfile?.designerCode,
    });

    const userKey = user.email.split('@')[0].toLowerCase();
    // Determine target dashboard path based on role with user-scope
    let redirectUrl = '/requester/dashboard?u=' + userKey;
    if (user.role === 'DESIGNER') redirectUrl = '/designer/dashboard?u=' + userKey;
    else if (user.role === 'APPROVER') redirectUrl = '/approver/dashboard?u=approver';
    else if (user.role === 'ADMIN') redirectUrl = '/admin/dashboard?u=admin';

    const response = NextResponse.json({
      success: true,
      token,
      redirectUrl,
      sessionId: session.id,
      tabSessionId: effectiveTabId,
      userKey,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        memberCode: user.requesterProfile?.memberCode,
        designerCode: user.designerProfile?.designerCode,
      },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    };

    response.cookies.set({
      name: 'token',
      value: token,
      ...cookieOptions,
    });

    response.cookies.set({
      name: `token_${userKey}`,
      value: token,
      ...cookieOptions,
    });

    response.cookies.set({
      name: `token_${user.role.toLowerCase()}`,
      value: token,
      ...cookieOptions,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error switching user' }, { status: 500 });
  }
}
