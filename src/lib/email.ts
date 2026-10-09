import nodemailer from 'nodemailer';

interface SendInvitationEmailParams {
  toEmail: string;
  recipientName: string;
  role: string;
  identifier: string;
  password: string;
  loginUrl: string;
}

export async function sendInvitationEmail({
  toEmail,
  recipientName,
  role,
  identifier,
  password,
  loginUrl,
}: SendInvitationEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Creative Flow Enterprise';

  // If SMTP is not configured in environment variables, return simulated success
  if (!smtpUser || !smtpPass) {
    console.log(`[EMAIL DISPATCH SIMULATION] Real SMTP not set. Invitation for ${toEmail} (${recipientName}):`);
    console.log(`Email: ${toEmail} | Password: ${password} | Role: ${role} | URL: ${loginUrl}`);
    return { success: true, messageId: 'simulated-' + Date.now() };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass.replace(/\s+/g, ''), // clean any accidental spaces from Google App Password
      },
    });

    const cleanSenderName = 'Creative Portal';
    const subject = `Welcome to Creative Portal - Account Invitation`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Creative Portal Invitation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #64748b; margin-bottom: 24px; }
        .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .item { font-size: 14px; margin-bottom: 8px; }
        .item:last-child { margin-bottom: 0; }
        .k { color: #64748b; font-weight: 500; }
        .v { color: #0f172a; font-weight: 700; font-family: monospace; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 28px; text-decoration: none; border-radius: 8px; margin: 16px 0; }
        .footer { font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2 class="title">Welcome to Creative Portal</h2>
        <p class="subtitle">Hello ${recipientName}, you have been invited to join the Creative Request & Graphic Portal as a <strong>${role}</strong>.</p>
        
        <div class="box">
          <div class="item"><span class="k">Email Address:</span> <span class="v">${toEmail}</span></div>
          <div class="item"><span class="k">Login Password:</span> <span class="v">${password}</span></div>
          <div class="item"><span class="k">Assigned Role:</span> <span class="v">${role} (${identifier})</span></div>
        </div>

        <div>
          <a href="${loginUrl}" class="btn" target="_blank">Log In to Portal</a>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 16px;">
          Direct login link: <a href="${loginUrl}" style="color: #4f46e5;">${loginUrl}</a>
        </p>

        <div class="footer">
          This invitation was sent by your administrator via Creative Portal.
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"${cleanSenderName}" <${smtpUser}>`,
      replyTo: smtpUser,
      to: toEmail,
      subject,
      text: `Hello ${recipientName},\n\nYou have been invited to Creative Portal as a ${role}.\n\nYour Login Details:\nEmail: ${toEmail}\nPassword: ${password}\nRole: ${role} (${identifier})\n\nLog in here: ${loginUrl}\n\nBest regards,\nCreative Portal Team`,
      html: htmlContent,
    });

    console.log(`[EMAIL DISPATCH SUCCESS] Sent invitation to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH FAILED] Error sending to ${toEmail}:`, err);
    return { success: false, error: err.message };
  }
}
