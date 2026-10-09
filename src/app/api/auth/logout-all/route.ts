import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, revokeAllUserSessions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Revoke all sessions belonging to this user only
    await revokeAllUserSessions(user.id);

    const response = NextResponse.json({
      success: true,
      message: `All sessions for ${user.name} have been logged out across all devices.`,
    });

    const cookieNames = ['token', 'token_approver', 'token_designer', 'token_requester', 'token_admin'];
    cookieNames.forEach((name) => {
      response.cookies.set({
        name,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    });

    return response;
  } catch (error: any) {
    console.error('Logout all error:', error);
    return NextResponse.json({ error: 'Logout all devices failed' }, { status: 500 });
  }
}
