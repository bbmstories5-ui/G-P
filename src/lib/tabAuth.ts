'use client';

import { useState, useEffect } from 'react';

const TAB_ID_KEY = 'portal_tab_session_id';
const TAB_TOKEN_KEY = 'portal_tab_auth_token';
const TAB_USER_KEY = 'portal_tab_auth_user';

/**
 * Returns the unique ID for the current browser tab.
 * Uses sessionStorage which is natively isolated per browser tab.
 */
export function getTabSessionId(): string {
  if (typeof window === 'undefined') return 'SERVER_TAB';
  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = 'TAB-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
}

/**
 * Returns the authentication token specific to this tab.
 */
export function getTabToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TAB_TOKEN_KEY);
}

/**
 * Returns the cached user for this specific tab.
 */
export function getTabUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(TAB_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Stores the tab-specific authentication context.
 */
export function saveTabAuth(token: string, user: any, tabSessionId?: string) {
  if (typeof window === 'undefined') return;
  const activeTabId = tabSessionId || getTabSessionId();
  sessionStorage.setItem(TAB_ID_KEY, activeTabId);
  sessionStorage.setItem(TAB_TOKEN_KEY, token);
  sessionStorage.setItem(TAB_USER_KEY, JSON.stringify(user));
}

/**
 * Clears the authentication state for the current tab only.
 * Other tabs in the same browser are completely unaffected.
 */
export function clearTabAuth() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TAB_TOKEN_KEY);
  sessionStorage.removeItem(TAB_USER_KEY);
}

/**
 * Helper to get userKey identifier (e.g. 'member01', 'designer01', 'approver', 'admin')
 */
export function getUserKey(user?: any): string {
  if (!user?.email) return '';
  return user.email.split('@')[0].toLowerCase();
}

/**
 * Appends or preserves the tab's user scope in URLs
 */
export function getScopedHref(href: string, user?: any): string {
  const activeUser = user || getTabUser();
  const uKey = getUserKey(activeUser);
  if (!uKey) return href;
  if (href.includes('?u=')) return href;
  const sep = href.includes('?') ? '&' : '?';
  return `${href}${sep}u=${uKey}`;
}

/**
 * Automatically monkeypatches window.fetch on the client so EVERY fetch call
 * (even third party or standard fetch) transmits this tab's auth token!
 */
if (typeof window !== 'undefined' && !(window as any).__tabFetchIntercepted) {
  (window as any).__tabFetchIntercepted = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    try {
      const urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input as Request).url || '');
      const isInternal = urlStr.startsWith('/') || urlStr.startsWith('http://localhost') || urlStr.startsWith(window.location.origin);
      
      if (isInternal) {
        const token = getTabToken();
        const tabId = getTabSessionId();
        
        let headersObj: Headers;
        if (init?.headers) {
          headersObj = new Headers(init.headers);
        } else if (typeof input === 'object' && 'headers' in input && (input as Request).headers) {
          headersObj = new Headers((input as Request).headers);
        } else {
          headersObj = new Headers();
        }

        if (token) {
          if (!headersObj.has('Authorization')) {
            headersObj.set('Authorization', `Bearer ${token}`);
          }
          if (!headersObj.has('x-tab-token')) {
            headersObj.set('x-tab-token', token);
          }
        }
        if (!headersObj.has('x-tab-session-id')) {
          headersObj.set('x-tab-session-id', tabId);
        }

        return originalFetch(input, { ...init, headers: headersObj });
      }
    } catch (e) {
      // Fallback to regular fetch on any error
    }
    return originalFetch(input, init);
  };
}

/**
 * Tab-isolated HTTP fetch wrapper.
 * Automatically injects tab authentication headers into every request.
 */
export async function tabFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getTabToken();
  const tabId = getTabSessionId();

  const headers = new Headers(init?.headers || {});
  
  if (token) {
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('x-tab-token')) {
      headers.set('x-tab-token', token);
    }
  }
  if (!headers.has('x-tab-session-id')) {
    headers.set('x-tab-session-id', tabId);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * Hook to resolve and track the authenticated user for the current tab.
 * 1. Initializes instantly from tab's sessionStorage.
 * 2. Fetches /api/auth/me using tabFetch to verify with the backend.
 * 3. Keeps URL scoped with ?u= parameter so browser reloads retain tab identity.
 */
export function useTabUser(fallbackUser?: any) {
  const [user, setUser] = useState<any>(() => {
    const cached = getTabUser();
    return cached || fallbackUser || null;
  });

  useEffect(() => {
    const cached = getTabUser();
    if (cached) {
      setUser(cached);
      // Ensure URL has ?u= parameter for reload safety
      if (typeof window !== 'undefined') {
        const uKey = getUserKey(cached);
        const url = new URL(window.location.href);
        if (uKey && url.searchParams.get('u') !== uKey && !url.pathname.startsWith('/login') && url.pathname !== '/') {
          url.searchParams.set('u', uKey);
          window.history.replaceState(null, '', url.pathname + url.search);
        }
      }
    }

    tabFetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          const currentToken = getTabToken();
          if (currentToken) {
            saveTabAuth(currentToken, data.user);
          }
          // Ensure URL has ?u= parameter
          if (typeof window !== 'undefined') {
            const uKey = getUserKey(data.user);
            const url = new URL(window.location.href);
            if (uKey && url.searchParams.get('u') !== uKey && !url.pathname.startsWith('/login') && url.pathname !== '/') {
              url.searchParams.set('u', uKey);
              window.history.replaceState(null, '', url.pathname + url.search);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  return user;
}
