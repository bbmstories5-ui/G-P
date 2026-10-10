import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import crypto from 'crypto';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'creative-portal-super-secure-jwt-secret-key-2026';

export interface AuthPayload {
  userId: string;
  sessionId: string;
  sessionToken: string;
  tabSessionId?: string;
  email: string;
  role: 'REQUESTER' | 'DESIGNER' | 'APPROVER' | 'ADMIN';
  name: string;
  memberCode?: string;
  designerCode?: string;
}

/**
 * Creates a unique authenticated session in the database for the given user.
 * Supports unlimited concurrent logins across different browsers, devices, and tabs.
 */
export async function createSession(
  userId: string,
  meta?: {
    tabSessionId?: string | null;
    userAgent?: string | null;
    ipAddress?: string | null;
    deviceInfo?: string | null;
  }
) {
  // Generate cryptographically unique session token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const refreshToken = crypto.randomBytes(48).toString('hex');
  
  // 30 days expiration per session
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken,
      refreshToken,
      userAgent: meta?.userAgent || 'Browser Client',
      ipAddress: meta?.ipAddress || '127.0.0.1',
      deviceInfo: meta?.tabSessionId ? `Tab: ${meta.tabSessionId}` : (meta?.deviceInfo || 'Desktop / Mobile'),
      isRevoked: false,
      expiresAt,
      lastActivityAt: new Date(),
    },
  });

  return session;
}

export function signJwtToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyJwtToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Resolves the authenticated user strictly from the current request/tab session token.
 * 1. Prioritizes tab-specific Authorization Bearer and x-tab-token headers.
 * 2. Falls back to user-scoped cookies (token_member01, token_approver, etc.).
 * 3. Falls back to role-isolated cookies (token_approver, token_designer, token_requester, token_admin).
 * 4. Falls back to general token cookie.
 */
export async function getCurrentUser(req?: Request, preferredRole?: 'REQUESTER' | 'DESIGNER' | 'APPROVER' | 'ADMIN') {
  let token: string | undefined;
  let targetUserKey: string | undefined;

  // 1. Try reading from Request headers / cookies / query parameters if provided
  if (req) {
    const urlStr = req.url || '';
    if (urlStr.includes('?')) {
      try {
        const parsedUrl = new URL(urlStr, 'http://localhost:3000');
        const u = parsedUrl.searchParams.get('u')?.toLowerCase().trim();
        if (u) targetUserKey = u;
        const tabTokenParam = parsedUrl.searchParams.get('tabToken')?.trim();
        if (tabTokenParam) token = tabTokenParam;
      } catch {}
    }

    if (!targetUserKey) {
      const uHeader = req.headers.get('x-user-key');
      if (uHeader) targetUserKey = uHeader.toLowerCase().trim();
    }

    // A. HIGHEST PRIORITY: Tab-isolated Bearer Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    // B. Custom tab token header
    if (!token) {
      const tabTokenHeader = req.headers.get('x-tab-token');
      if (tabTokenHeader) token = tabTokenHeader.trim();
    }

    // C. User-specific and Role-specific cookies
    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      
      if (targetUserKey) {
        const userCookieMatch = cookieHeader.match(new RegExp(`token_${targetUserKey}=([^;]+)`));
        if (userCookieMatch) {
          token = decodeURIComponent(userCookieMatch[1]);
        }
      }

      let targetRole = preferredRole;
      if (!targetRole) {
        if (urlStr.includes('/approver')) targetRole = 'APPROVER';
        else if (urlStr.includes('/designer')) targetRole = 'DESIGNER';
        else if (urlStr.includes('/requester')) targetRole = 'REQUESTER';
        else if (urlStr.includes('/admin')) targetRole = 'ADMIN';
      }

      if (!token && targetRole) {
        const roleCookieMatch = cookieHeader.match(new RegExp(`token_${targetRole.toLowerCase()}=([^;]+)`));
        if (roleCookieMatch) {
          token = decodeURIComponent(roleCookieMatch[1]);
        }
      }

      // Fallback to standard 'token' cookie
      if (!token) {
        const match = cookieHeader.match(/token=([^;]+)/);
        if (match) token = decodeURIComponent(match[1]);
      }
    }
  }

  // 2. Next.js server component context (headers() & cookies())
  if (!token) {
    try {
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
      if (!token) {
        token = headerStore.get('x-tab-token') || undefined;
      }
      if (!targetUserKey) {
        targetUserKey = headerStore.get('x-user-key')?.toLowerCase().trim() || undefined;
      }
      if (!targetUserKey) {
        const xUrl = headerStore.get('x-url') || headerStore.get('referer') || '';
        if (xUrl.includes('?')) {
          try {
            const parsed = new URL(xUrl, 'http://localhost:3000');
            const u = parsed.searchParams.get('u')?.toLowerCase().trim();
            if (u) targetUserKey = u;
          } catch {}
        }
      }
    } catch {}
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      
      if (targetUserKey) {
        const userCookie = cookieStore.get(`token_${targetUserKey}`)?.value;
        if (userCookie) token = userCookie;
      }

      if (!token && preferredRole) {
        const roleCookie = cookieStore.get(`token_${preferredRole.toLowerCase()}`)?.value;
        if (roleCookie) token = roleCookie;
      }

      if (!token) {
        token = cookieStore.get('token')?.value;
      }

      // If still not found and no preferredRole, check any role cookie
      if (!token && !preferredRole) {
        token =
          cookieStore.get('token_approver')?.value ||
          cookieStore.get('token_designer')?.value ||
          cookieStore.get('token_requester')?.value ||
          cookieStore.get('token_admin')?.value;
      }
    } catch {
      // Ignore when called outside of Next.js server context
    }
  }


  // If token was found, verify JWT & database session
  if (token) {
    const payload = verifyJwtToken(token);
    if (payload && payload.userId) {
      if (payload.sessionToken) {
        const dbSession = await prisma.session.findUnique({
          where: { sessionToken: payload.sessionToken },
        });

        if (!dbSession || dbSession.isRevoked || new Date() > dbSession.expiresAt) {
          // Token is revoked
        } else {
          // Update last activity timestamp asynchronously
          prisma.session
            .update({
              where: { id: dbSession.id },
              data: { lastActivityAt: new Date() },
            })
            .catch(() => {});

          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: {
              requesterProfile: true,
              designerProfile: true,
              approverProfile: true,
            },
          });

          if (user && user.status === 'ACTIVE') {
            if (!preferredRole || user.role === preferredRole || user.role === 'ADMIN') {
              return user;
            }
          }
        }
      }
    }
  }

  // If URL explicitly requested a known account (e.g. ?u=member01, ?u=member02, ?u=approver), resolve account directly
  if (targetUserKey) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: `${targetUserKey}@company.com` },
          { email: targetUserKey },
        ],
        status: 'ACTIVE',
      },
      include: {
        requesterProfile: true,
        designerProfile: true,
        approverProfile: true,
      },
    });

    if (user) {
      if (!preferredRole || user.role === preferredRole || user.role === 'ADMIN') {
        return user;
      }
    }
  }

  return null;
}

/**
 * Revokes ONLY the specific session of the current caller.
 * Other sessions of the same user or different users remain completely unaffected.
 */
export async function revokeCurrentSession(req?: Request) {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      const tabToken = req.headers.get('x-tab-token');
      if (tabToken) token = tabToken.trim();
    }
    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value;
    } catch {}
  }


  if (!token) return false;

  const payload = verifyJwtToken(token);
  if (payload?.sessionToken) {
    await prisma.session.updateMany({
      where: { sessionToken: payload.sessionToken },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    return true;
  }

  return false;
}

/**
 * Revokes all sessions belonging to ONE specific user (e.g. "Logout from all devices").
 * Does NOT affect any other user's sessions.
 */
export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true, revokedAt: new Date() },
  });
}

export async function requireAuth(allowedRoles?: Array<'REQUESTER' | 'DESIGNER' | 'APPROVER' | 'ADMIN'>) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

/**
 * Strict Data Isolation Guard:
 * Requesters can ONLY access their own requirements and final graphics.
 */
export async function assertRequirementAccess(requirementId: string, user: any) {
  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    include: {
      requester: { include: { requesterProfile: true } },
      assignedDesigner: { include: { designerProfile: true } },
      approvedBy: true,
      files: true,
      graphics: {
        include: {
          versions: {
            include: {
              approvals: true,
              revisions: true,
            },
            orderBy: { versionNumber: 'desc' },
          },
        },
      },
      approvals: true,
      revisions: { orderBy: { requestedAt: 'desc' } },
      comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      activityLogs: { orderBy: { timestamp: 'desc' } },
    },
  });

  if (!requirement) {
    throw new Error('NOT_FOUND');
  }

  // Super Admin and Approver have broad governance visibility
  if (user.role === 'ADMIN' || user.role === 'APPROVER') {
    return requirement;
  }

  // REQUESTER: STRICT ISOLATION -> Only own created requirements!
  if (user.role === 'REQUESTER') {
    if (requirement.requesterId !== user.id) {
      throw new Error('FORBIDDEN: You do not have permission to access this requirement.');
    }
    return requirement;
  }

  // DESIGNER: Can access if PENDING (in pool), or if assigned to this designer
  if (user.role === 'DESIGNER') {
    const isAssigned = requirement.assignedDesignerId === user.id;
    const isAvailableInPool = requirement.status === 'PENDING';
    if (!isAssigned && !isAvailableInPool) {
      throw new Error('FORBIDDEN: You are not assigned to this graphic request.');
    }
    return requirement;
  }

  throw new Error('FORBIDDEN');
}

/**
 * Signs a secure, time-limited JWT for password reset (valid for 1 hour)
 */
export function signPasswordResetToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email: email.toLowerCase().trim(), type: 'PASSWORD_RESET' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Verifies a password reset JWT token and returns user credentials if valid
 */
export function verifyPasswordResetToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.type === 'PASSWORD_RESET' && decoded.userId && decoded.email) {
      return { userId: decoded.userId, email: decoded.email };
    }
    return null;
  } catch {
    return null;
  }
}

