import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url', request.url);

  // Extract ?u= query parameter (e.g. member01, member02, designer01, approver, admin)
  const u = request.nextUrl.searchParams.get('u')?.toLowerCase().trim();
  if (u) {
    requestHeaders.set('x-user-key', u);
    // If the browser has a dedicated cookie for this account, attach it to downstream request
    const userCookie = request.cookies.get(`token_${u}`)?.value;
    if (userCookie) {
      requestHeaders.set('x-tab-token', userCookie);
      if (!requestHeaders.has('authorization')) {
        requestHeaders.set('authorization', `Bearer ${userCookie}`);
      }
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/requester/:path*',
    '/designer/:path*',
    '/approver/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};
