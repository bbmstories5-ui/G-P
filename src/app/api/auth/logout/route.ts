import { NextRequest, NextResponse } from 'next/server';
import { revokeCurrentSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Revoke ONLY the current browser's specific session in the database
    await revokeCurrentSession(req);

    const response = NextResponse.json({ success: true, message: 'Logged out current session successfully' });
    
    // Clear all cookies on this client
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
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
