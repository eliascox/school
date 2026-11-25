'use client';

import type { QueryLookup } from '@/config/navigationConfig';
import { normalizePath } from '@/lib/routeAccess';
import type { UserSession } from '@/services/teacherAuthService';

export const URL_QUERY_CHANGED_EVENT = 'sms:url-query-changed';
export const NAV_PENDING_EVENT = 'sms:nav-pending';

/**
 * Ensures internal app routes carry a canonical trailing slash matching
 * `trailingSlash: true` in `next.config.ts`, preventing 308 redirects on Vercel
 * RSC fetches while preserving query strings, hashes, and file asset URLs.
 */
export function toCanonicalRouteHref(href: string): string {
  if (!href) return '/';
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')
  ) {
    return href;
  }

  let hash = '';
  let main = href;
  const hashIdx = main.indexOf('#');
  if (hashIdx >= 0) {
    hash = main.slice(hashIdx);
    main = main.slice(0, hashIdx);
  }

  let query = '';
  const queryIdx = main.indexOf('?');
  if (queryIdx >= 0) {
    query = main.slice(queryIdx);
    main = main.slice(0, queryIdx);
  }

  let path = main.trim();
  if (!path || path === '/') {
    path = '/';
  } else {
    if (!path.startsWith('/')) path = '/' + path;
    // Do not add trailing slash to explicit file URLs like /manifest.json
    const lastSegment = path.slice(path.lastIndexOf('/') + 1);
    const looksLikeFile = /\.[a-zA-Z0-9]{1,8}$/.test(lastSegment);
    if (!looksLikeFile && !path.endsWith('/')) {
      path += '/';
    }
  }

  return `${path}${query}${hash}`;
}

/**
 * Updates URL search parameters in-place in 0ms WITHOUT triggering a full
 * Next.js RSC network round-trip and WITHOUT clobbering `window.history.state`
 * (which Next.js 16 App Router relies on internally).
 */
export function syncUrlQueryParams(
  basePathname: string,
  updates: Record<string, string | null | undefined>,
  options?: { push?: boolean; clearOthers?: boolean },
): string {
  const canonicalPath = toCanonicalRouteHref(normalizePath(basePathname));
  if (typeof window === 'undefined') {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(updates)) {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    return qs ? `${canonicalPath}?${qs}` : canonicalPath;
  }

  const params = options?.clearOthers
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search);

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  const qs = params.toString();
  const nextUrl = qs ? `${canonicalPath}?${qs}` : canonicalPath;
  const currentUrl = `${window.location.pathname}${window.location.search}`;

  if (currentUrl !== nextUrl) {
    try {
      // Preserve existing Next.js router history state object instead of passing null
      const preservedState = window.history.state ?? {};
      if (options?.push) {
        window.history.pushState(preservedState, '', nextUrl);
      } else {
        window.history.replaceState(preservedState, '', nextUrl);
      }
    } catch {
      // Ignore History API restrictions in sandboxed iframes
    }
  }

  try {
    window.dispatchEvent(
      new CustomEvent(URL_QUERY_CHANGED_EVENT, {
        detail: { pathname: canonicalPath, search: qs ? `?${qs}` : '' },
      }),
    );
  } catch {
    // Ignore CustomEvent failures in minimal test shims
  }

  return nextUrl;
}

/**
 * Attempts to handle a link click instantaneously when the target resolves to
 * the exact same dashboard pathname (only changing `?tab=...` or `?view=...`),
 * avoiding an unnecessary Vercel RSC round-trip. Returns `true` if handled.
 */
export function trySameRouteQueryNavigation(
  href: string,
  currentPathname: string | null | undefined,
): boolean {
  if (typeof window === 'undefined' || !href) return false;
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
    return false;
  }

  const [rawPath, rawQuery = ''] = href.split('#')[0].split('?');
  const targetNorm = normalizePath(rawPath);
  const currentNorm = normalizePath(currentPathname || window.location.pathname);

  if (targetNorm !== currentNorm) return false;

  const updates: Record<string, string> = {};
  if (rawQuery) {
    const parsed = new URLSearchParams(rawQuery);
    parsed.forEach((v, k) => {
      updates[k] = v;
    });
  }

  syncUrlQueryParams(targetNorm, updates, { push: true, clearOthers: true });
  return true;
}

/**
 * Combines Next.js `useSearchParams()` with live `window.location.search` so
 * in-place `syncUrlQueryParams()` updates reflect immediately in Sidebar,
 * Header, and page tab consumers.
 */
export function createLiveQueryLookup(
  nextSearchParams: QueryLookup | null | undefined,
  liveSearchOverride: string | null,
): QueryLookup {
  if (liveSearchOverride !== null) {
    const params = new URLSearchParams(liveSearchOverride);
    return { get: (key: string) => params.get(key) };
  }
  return {
    get: (key: string) => nextSearchParams?.get(key) ?? null,
  };
}

/**
 * Notify the dashboard top progress bar & sidebar that a route transition has
 * started (cleared automatically when `pathname` updates).
 */
export function notifyNavigationPending(href: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent(NAV_PENDING_EVENT, {
        detail: { href: toCanonicalRouteHref(href), ts: Date.now() },
      }),
    );
  } catch {
    // Ignore in minimal environments
  }
}

/**
 * Shallow equality comparison for `UserSession` objects so `storage` events
 * that did not change auth state never force full-shell React re-renders.
 */
export function areSessionsEqual(
  a: UserSession | null | undefined,
  b: UserSession | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.role === b.role &&
    a.teacherId === b.teacherId &&
    a.teacherName === b.teacherName &&
    a.loginAt === b.loginAt &&
    a.expiresAt === b.expiresAt &&
    a.mustChangePassword === b.mustChangePassword &&
    a.sig === b.sig
  );
}
