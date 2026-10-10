import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signPasswordResetToken } from '@/lib/auth';
import * as EmailModule from '@/lib/email';
import nodemailer from 'nodemailer';

async function dispatchResetEmailDirectly({
  toEmail,
  recipientName,
  resetUrl,
}: {
  toEmail: string;
  recipientName: string;
  resetUrl: string;
}) {
  // If exported function is available in module graph
  if (typeof (EmailModule as any).sendPasswordResetEmail === 'function') {
    return await (EmailModule as any).sendPasswordResetEmail({
      toEmail,
      recipientName,
      resetUrl,
    });
  }

  // Self-contained Google Mail fallback (ensures 0 crash even if Turbopack HMR cache is stale)
  const gmailWebhookUrl = process.env.GMAIL_WEBHOOK_URL;
  const smtpUser = process.env.SMTP_USER || 'bbmstories5@gmail.com';
  const smtpPass = process.env.SMTP_PASS || 'hggdkekltkehelmo';
  const subject = 'Reset Your Creative Portal Password';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <span style="font-size: 11px; font-weight: bold; background: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">Security Notice</span>
        <h2 style="font-size: 20px; margin: 16px 0 8px; color: #0f172a;">Reset Your Password</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Hello <strong>${recipientName}</strong>,<br><br>
          We received a request to reset your password for Creative Flow Enterprise (<strong>${toEmail}</strong>).
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 9999px; text-decoration: none; display: inline-block;">
            Reset Password &rarr;
          </a>
        </div>
        <p style="font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #f1f5f9; pt: 16px;">
          • This link expires in <strong>1 hour</strong>.<br>
          • Direct link: <a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a><br>
          • If you did not make this request, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  if (gmailWebhookUrl) {
    try {
      const res = await fetch(gmailWebhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject,
          html,
          text: `Reset your password at: ${resetUrl}`,
        }),
      });
      if (res.ok) return { success: true };
    } catch {}
  }

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser.trim(), pass: smtpPass.replace(/\s+/g, '') },
      });
      await transporter.sendMail({
        from: `"Creative Portal Security" <${smtpUser}>`,
        to: toEmail,
        subject,
        html,
        text: `Reset your password at: ${resetUrl}`,
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  return { success: false, error: 'No email service configured' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Please enter your account email address' }, { status: 400 });
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user) {
      // Don't leak account existence, but confirm delivery attempt
      return NextResponse.json({
        success: true,
        message: `If an account exists with ${email}, a recovery link has been dispatched.`,
      });
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'This account has been suspended. Please contact your system administrator.' },
        { status: 403 }
      );
    }

    // Generate signed JWT reset token (valid for 1 hour)
    const resetToken = signPasswordResetToken(user.id, user.email);

    // Formulate reset URL using current request host so it works anywhere (localhost or live)
    const hostHeader = request.headers.get('host');
    const protoHeader = request.headers.get('x-forwarded-proto') || (hostHeader?.includes('localhost') ? 'http' : 'https');
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      (hostHeader ? `${protoHeader}://${hostHeader}` : request.nextUrl.origin);

    const cleanOrigin = origin.replace(/\/$/, '');
    const resetUrl = `${cleanOrigin}/reset-password?token=${encodeURIComponent(resetToken)}`;

    // Dispatch recovery email via Google Mail (resilient)
    const emailResult = await dispatchResetEmailDirectly({
      toEmail: user.email,
      recipientName: user.name,
      resetUrl,
    });

    // Log the security event
    await prisma.activityLog.create({
      data: {
        action: 'PASSWORD_RESET_REQUESTED',
        details: `Password recovery link requested for ${user.email} (Email result: ${emailResult.success ? 'Success' : 'Pending'})`,
        userId: user.id,
        userName: user.name,
        userRole: user.role || 'USER',
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `A recovery link has been dispatched to ${user.email}. Please check your inbox.`,
      emailResult,
    });
  } catch (error: any) {
    console.error('[FORGOT PASSWORD ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while processing your request' },
      { status: 500 }
    );
  }
}
