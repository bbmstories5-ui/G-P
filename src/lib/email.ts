import nodemailer, { Transporter } from 'nodemailer';

export interface SendInvitationEmailParams {
  toEmail: string;
  recipientName: string;
  role: string;
  identifier: string;
  password: string;
  loginUrl: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: 'GMAIL_SUCCESS' | 'GMAIL_WEBHOOK_SUCCESS' | 'CONFIG_ERROR' | 'CONNECTION_ERROR';
}

/**
 * Resolves the public live domain for email invitation links
 */
export function resolveLiveLoginUrl(inputUrl: string): string {
  const configuredAppUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    process.env.APP_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '');

  if (configuredAppUrl && (inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1'))) {
    const cleanAppUrl = configuredAppUrl.replace(/\/$/, '');
    return inputUrl.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, cleanAppUrl);
  }

  // Fallback to official Railway live deployment if sent from local test
  if (inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1')) {
    return inputUrl.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, 'https://portal-grap.up.railway.app');
  }

  return inputUrl;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Generates modern White Minimalist invitation HTML with animated shimmer bar
 */
function generateInvitationHtml({
  recipientName,
  role,
  identifier,
  toEmail,
  password,
  loginUrl,
}: {
  recipientName: string;
  role: string;
  identifier: string;
  toEmail: string;
  password: string;
  loginUrl: string;
}): string {
  return `
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
}

/**
 * Creates Gmail Nodemailer transporter
 */
function createGmailTransporter(user: string, pass: string): Transporter {
  const cleanPass = pass.replace(/\s+/g, '');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: cleanPass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 6000,
    socketTimeout: 10000,
  });
}

/**
 * Google Mail Sender: dispatches via Google Apps Script HTTPS Webhook (Port 443 - 100% Cloud-Proof)
 * or Direct Gmail SMTP
 */
export async function sendInvitationEmail({
  toEmail,
  recipientName,
  role,
  identifier,
  password,
  loginUrl: rawLoginUrl,
}: SendInvitationEmailParams): Promise<EmailDispatchResult> {
  const cleanEmail = toEmail.trim().toLowerCase();

  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      error: `Invalid recipient email address format: ${cleanEmail}`,
    };
  }

  const gmailWebhookUrl = process.env.GMAIL_WEBHOOK_URL;
  const smtpUser = process.env.SMTP_USER || 'bbmstories5@gmail.com';
  const smtpPass = process.env.SMTP_PASS || 'hggdkekltkehelmo';
  const loginUrl = resolveLiveLoginUrl(rawLoginUrl);
  const subject = `Welcome to Creative Portal - Account Invitation`;

  const htmlContent = generateInvitationHtml({
    recipientName,
    role,
    identifier,
    toEmail: cleanEmail,
    password,
    loginUrl,
  });

  const textContent = `Hello ${recipientName},\n\nYou have been invited to Creative Portal as a ${role}.\n\nYour Login Details:\nEmail: ${cleanEmail}\nPassword: ${password}\nRole: ${role} (${identifier})\n\nLog in here: ${loginUrl}\n\nBest regards,\nCreative Portal Team`;

  // METHOD 1: Google Apps Script HTTPS Webhook (Dispatches from bbmstories5@gmail.com directly via Google's servers over Port 443)
  if (gmailWebhookUrl) {
    try {
      console.log(`[GOOGLE MAIL WEBHOOK] Dispatching to ${cleanEmail} via Google API...`);
      const res = await fetch(gmailWebhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanEmail,
          subject,
          html: htmlContent,
          text: textContent,
        }),
      });

      const data = await res.json().catch(() => ({ success: res.ok }));
      if (res.ok && data.success !== false) {
        console.log(`[GOOGLE MAIL WEBHOOK SUCCESS] Delivered to ${cleanEmail}`);
        return {
          success: true,
          messageId: data.messageId || `gsuite-${Date.now()}`,
          code: 'GMAIL_WEBHOOK_SUCCESS',
        };
      } else {
        console.warn(`[GOOGLE MAIL WEBHOOK WARNING]`, data.error || 'Webhook failed');
      }
    } catch (whErr: any) {
      console.warn(`[GOOGLE MAIL WEBHOOK ERROR]`, whErr.message);
    }
  }

  // METHOD 2: Direct Gmail SMTP using user's App Password (bbmstories5@gmail.com)
  if (smtpUser && smtpPass) {
    try {
      console.log(`[GMAIL SMTP] Dispatching directly via Google Gmail SMTP to ${cleanEmail}...`);
      const transporter = createGmailTransporter(smtpUser, smtpPass);

      const info = await transporter.sendMail({
        from: `"Creative Portal" <${smtpUser}>`,
        replyTo: smtpUser,
        to: cleanEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[GMAIL SMTP SUCCESS] Delivered to ${cleanEmail}. Message ID: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        code: 'GMAIL_SUCCESS',
      };
    } catch (smtpErr: any) {
      console.error(`[GMAIL SMTP FAILED]`, smtpErr.message);

      // On Railway, if TCP ports 465/587 are blocked by cloud firewall
      const isTimeout = smtpErr.message.includes('ETIMEDOUT') || smtpErr.message.includes('timeout') || smtpErr.code === 'ETIMEDOUT';
      if (isTimeout) {
        return {
          success: false,
          error: `Railway Cloud Container blocked direct SMTP ports 465/587 to prevent spam. Set GMAIL_WEBHOOK_URL to send via Google HTTPS Port 443.`,
          code: 'CONNECTION_ERROR',
        };
      }

      return {
        success: false,
        error: smtpErr.message,
        code: 'CONNECTION_ERROR',
      };
    }
  }

  return {
    success: false,
    error: 'No Google Mail configuration found (missing SMTP_USER / SMTP_PASS / GMAIL_WEBHOOK_URL)',
    code: 'CONFIG_ERROR',
  };
}

