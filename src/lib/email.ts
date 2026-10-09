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

    const roleBadgeColor =
      role === 'ADMIN' ? '#7c3aed' : role === 'APPROVER' ? '#059669' : role === 'DESIGNER' ? '#2563eb' : '#d97706';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #31104b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 8px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 0; font-size: 13px; color: #cbd5e1; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .credentials-card { background: #0f172a; border-radius: 12px; padding: 20px; color: #ffffff; margin-bottom: 28px; border: 1px solid #1e293b; }
        .card-header { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; border-bottom: 1px solid #334155; padding-bottom: 8px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
        .label { color: #94a3b8; }
        .value { color: #ffffff; font-weight: 700; font-family: monospace; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 14px 32px; background: #f59e0b; color: #0f172a; font-weight: 800; font-size: 14px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25); }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${appName}</h1>
          <p>Official Team Member Invitation</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${recipientName},</div>
          <div class="desc">
            You have been invited by the <strong>Super Administrator</strong> to join the <strong>${appName}</strong> portal as a <strong>${role}</strong>.
          </div>

          <div class="credentials-card">
            <div class="card-header">Your Login Credentials</div>
            <div class="row"><span class="label">Email:</span> <span class="value" style="color:#fbbf24;">${toEmail}</span></div>
            <div class="row"><span class="label">Temporary Password:</span> <span class="value">${password}</span></div>
            <div class="row"><span class="label">Assigned Role:</span> <span class="value" style="color:#c084fc;">${role} (${identifier})</span></div>
          </div>

          <div class="btn-container">
            <a href="${loginUrl}" class="btn" target="_blank">Access Portal & Log In</a>
          </div>

          <div class="desc" style="font-size: 12px; color: #64748b; margin-top: 20px;">
            If the button above does not work, copy and paste this link into your browser:<br>
            <a href="${loginUrl}" style="color: #2563eb; word-break: break-all;">${loginUrl}</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${appName}. All rights reserved. Strictly confidential.
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"${appName}" <${smtpUser}>`,
      to: toEmail,
      subject: `🎉 You are invited to ${appName} — Access Your Account`,
      text: `Hello ${recipientName},\n\nYou have been invited to ${appName}.\n\nYour Credentials:\nEmail: ${toEmail}\nPassword: ${password}\nRole: ${role} (${identifier})\n\nLog in here: ${loginUrl}`,
      html: htmlContent,
    });

    console.log(`[EMAIL DISPATCH SUCCESS] Sent invitation to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH FAILED] Error sending to ${toEmail}:`, err);
    return { success: false, error: err.message };
  }
}
