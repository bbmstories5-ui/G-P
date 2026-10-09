import nodemailer, { Transporter } from 'nodemailer';

interface SendInvitationEmailParams {
  toEmail: string;
  recipientName: string;
  role: string;
  identifier: string;
  password: string;
  loginUrl: string;
}

/**
 * Resolves the public live domain for email links
 */
function resolveLiveLoginUrl(inputUrl: string): string {
  const configuredAppUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '');

  if (configuredAppUrl && (inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1'))) {
    const cleanAppUrl = configuredAppUrl.replace(/\/$/, '');
    return inputUrl.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, cleanAppUrl);
  }

  // Fallback to official Railway live deployment if sent from local machine
  if (inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1')) {
    return inputUrl.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, 'https://portal-grap.up.railway.app');
  }

  return inputUrl;
}

// Cached singleton transporter with connection pooling for ultra-fast delivery
let cachedTransporter: Transporter | null = null;
let lastSmtpConfigKey = '';

function getPooledTransporter(smtpUser: string, smtpPass: string): Transporter {
  const currentKey = `${smtpUser}:${smtpPass}`;
  if (cachedTransporter && lastSmtpConfigKey === currentKey) {
    return cachedTransporter;
  }

  // Cloud/Railway-optimized SMTP with explicit IPv4 (family: 4) & Port 587 STARTTLS
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS for maximum cloud container compatibility
    requireTLS: true,
    family: 4, // Prevent IPv6 timeout on Railway/Docker
    pool: true, // Reuse TCP/TLS connections
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10,
    connectionTimeout: 7000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    auth: {
      user: smtpUser,
      pass: smtpPass.replace(/\s+/g, ''),
    },
    tls: {
      rejectUnauthorized: false,
    },
  } as any);

  lastSmtpConfigKey = currentKey;
  return cachedTransporter;
}

export async function sendInvitationEmail({
  toEmail,
  recipientName,
  role,
  identifier,
  password,
  loginUrl: rawLoginUrl,
}: SendInvitationEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Creative Portal';

  const loginUrl = resolveLiveLoginUrl(rawLoginUrl);

  // If SMTP is not configured in environment variables, return simulated success
  if (!smtpUser || !smtpPass) {
    console.log(`[EMAIL DISPATCH SIMULATION] Real SMTP not set. Invitation for ${toEmail} (${recipientName}):`);
    console.log(`Email: ${toEmail} | Password: ${password} | Role: ${role} | Live URL: ${loginUrl}`);
    return { success: true, messageId: 'simulated-' + Date.now() };
  }

  try {
    const transporter = getPooledTransporter(smtpUser, smtpPass);

    const cleanSenderName = 'Creative Portal';
    const subject = `Welcome to Creative Portal - Account Invitation`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Creative Portal Invitation</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 32px 16px;
          color: #0f172a;
          -webkit-font-smoothing: antialiased;
        }
        .wrapper {
          max-width: 560px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
        }
        .top-banner {
          height: 6px;
          background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
          background-size: 200% 200%;
          animation: shimmerBar 3s ease infinite;
        }
        @keyframes shimmerBar {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .content {
          padding: 36px 32px 28px 32px;
        }
        .badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #4338ca;
          background-color: #eef2ff;
          border: 1px solid #c7d2fe;
          padding: 4px 12px;
          border-radius: 9999px;
          margin-bottom: 16px;
        }
        .title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 10px 0;
          line-height: 1.3;
        }
        .subtitle {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
          margin: 0 0 24px 0;
        }
        .role-highlight {
          color: #4338ca;
          font-weight: 700;
        }
        .card-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .card-row {
          display: table;
          width: 100%;
          padding: 8px 0;
          border-bottom: 1px solid #edf2f7;
        }
        .card-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .card-row:first-child {
          padding-top: 0;
        }
        .card-label {
          display: table-cell;
          width: 38%;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
          vertical-align: middle;
        }
        .card-value {
          display: table-cell;
          width: 62%;
          font-size: 13px;
          color: #0f172a;
          font-weight: 700;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          vertical-align: middle;
        }
        .btn-wrapper {
          text-align: left;
          margin: 28px 0 20px 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: #ffffff !important;
          font-weight: 700;
          font-size: 14px;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 12px;
          box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.35);
          transition: all 0.2s ease;
        }
        .direct-link-box {
          font-size: 12px;
          color: #64748b;
          line-height: 1.6;
          word-break: break-all;
          margin-top: 16px;
        }
        .direct-link-box a {
          color: #4f46e5;
          text-decoration: underline;
        }
        .footer {
          border-top: 1px solid #f1f5f9;
          padding: 20px 32px;
          background-color: #fafbfc;
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="top-banner"></div>
        <div class="content">
          <div class="badge">✨ Portal Invitation</div>
          <h1 class="title">Welcome to Creative Portal</h1>
          <p class="subtitle">
            Hello <strong>${recipientName}</strong>, you have been invited to join the Creative Request &amp; Graphic Design Portal as a <span class="role-highlight">${role}</span>.
          </p>
          
          <div class="card-box">
            <div class="card-row">
              <div class="card-label">Email Address:</div>
              <div class="card-value">${toEmail}</div>
            </div>
            <div class="card-row">
              <div class="card-label">Login Password:</div>
              <div class="card-value">${password}</div>
            </div>
            <div class="card-row">
              <div class="card-label">Assigned Role:</div>
              <div class="card-value">${role} (${identifier})</div>
            </div>
          </div>

          <div class="btn-wrapper">
            <a href="${loginUrl}" class="btn" target="_blank">Log In to Portal &rarr;</a>
          </div>

          <div class="direct-link-box">
            Direct access URL: <a href="${loginUrl}" target="_blank">${loginUrl}</a>
          </div>
        </div>

        <div class="footer">
          This invitation was sent securely by your administrator via Creative Portal.
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
