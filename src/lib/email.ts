import { Resend } from 'resend';

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
  code?: 'MISSING_API_KEY' | 'UNVERIFIED_DOMAIN_RESTRICTION' | 'INVALID_RECIPIENT' | 'PROVIDER_ERROR' | 'SUCCESS';
  details?: any;
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

/**
 * Validates email format
 */
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
 * Main transactional email dispatcher using official Resend HTTPS API (Port 443)
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

  // Validate recipient format
  if (!isValidEmail(cleanEmail)) {
    return {
      success: false,
      error: `Invalid recipient email address format: ${cleanEmail}`,
      code: 'INVALID_RECIPIENT',
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  // If RESEND_API_KEY is not configured, report simulated mode safely
  if (!resendApiKey) {
    console.log(`[RESEND SIMULATION] RESEND_API_KEY not configured. Invitation simulated for ${cleanEmail}:`);
    console.log(`Password: ${password} | Role: ${role} | URL: ${rawLoginUrl}`);
    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
      code: 'MISSING_API_KEY',
    };
  }

  const fromSender = process.env.EMAIL_FROM || 'Creative Portal <onboarding@resend.dev>';
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;
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

  try {
    const resend = new Resend(resendApiKey.trim());

    const { data, error } = await resend.emails.send({
      from: fromSender,
      to: [cleanEmail],
      replyTo,
      subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.warn(`[RESEND DISPATCH FAILED] Error for ${cleanEmail}:`, error.message);

      // Check specifically for free sandbox testing restriction
      const isDomainRestriction =
        error.message.includes('only send testing emails') ||
        error.message.includes('verify a domain') ||
        error.message.includes('domain is not verified');

      return {
        success: false,
        error: isDomainRestriction
          ? `Resend Free Sandbox: Can only send to account owner email or requires verified domain at resend.com/domains`
          : error.message,
        code: isDomainRestriction ? 'UNVERIFIED_DOMAIN_RESTRICTION' : 'PROVIDER_ERROR',
        details: error,
      };
    }

    const messageId = data?.id || `resend-${Date.now()}`;
    console.log(`[RESEND DISPATCH SUCCESS] Delivered to ${cleanEmail} (ID: ${messageId})`);

    return {
      success: true,
      messageId,
      code: 'SUCCESS',
    };
  } catch (err: any) {
    console.error(`[RESEND SDK EXCEPTION] Error sending to ${cleanEmail}:`, err.message);
    return {
      success: false,
      error: err.message || 'Unknown network error occurred while dispatching email via Resend',
      code: 'PROVIDER_ERROR',
    };
  }
}
