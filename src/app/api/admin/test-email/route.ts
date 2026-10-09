import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['ADMIN']);
    const { targetEmail } = await req.json();

    if (!targetEmail) {
      return NextResponse.json({ error: 'targetEmail is required' }, { status: 400 });
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_BASE_URL ||
      process.env.APP_URL ||
      (host.includes('localhost') ? 'https://portal-grap.up.railway.app' : `${protocol}://${host}`);

    const result = await sendInvitationEmail({
      toEmail: targetEmail,
      recipientName: 'Test Recipient',
      role: 'ADMIN',
      identifier: 'Super Admin Test',
      password: 'testPassword123',
      loginUrl: `${baseUrl}/login/admin`,
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      code: result.code,
      diagnostics: {
        hasResendKey: Boolean(process.env.RESEND_API_KEY),
        fromAddress: process.env.EMAIL_FROM || 'Creative Portal <onboarding@resend.dev>',
        replyTo: process.env.EMAIL_REPLY_TO || 'None',
        targetEmail,
      },
    });
  } catch (error: any) {
    console.error('Error in test-email route:', error);
    return NextResponse.json({ error: error.message || 'Diagnostic test failed' }, { status: 500 });
  }
}
