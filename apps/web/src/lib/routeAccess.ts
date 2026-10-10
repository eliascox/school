/**
 * Central route-access rules for the /dashboard area.
 *
 * NOTE: The app is a static export with a client-side session
 * (`sms_current_session` in localStorage). This guard is a UX / navigation
 * control that stops teachers from opening admin pages by URL; it is NOT a
 * security boundary on its own (see docs/audit/05_SECURITY_AUDIT.md SEC-101).
 */

export type SessionRole = 'admin' | 'teacher';

/** Dashboard routes a teacher may open. Matching is by path prefix. */
export const TEACHER_ALLOWED_PREFIXES: readonly string[] = [
  '/dashboard/teacher-portal',
  '/dashboard/exam/mark-entry',
  '/dashboard/academic/attendance',
  '/dashboard/notices',
  '/dashboard/mobile-app', // existing redirect page → teacher-portal
];

export const TEACHER_HOME = '/dashboard/teacher-portal';
export const LOGIN_ROUTE = '/login';

/** Strip query/hash and the trailing slash added by `trailingSlash: true`. */
export function normalizePath(pathname: string | null | undefined): string {
  if (!pathname) return '/';
  let p = pathname.split('?')[0].split('#')[0];
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix + '/');
}

export function canAccessDashboardRoute(role: SessionRole | null | undefined, pathname: string): boolean {
  const path = normalizePath(pathname);
  if (role === 'admin') return true;
  if (role === 'teacher') return TEACHER_ALLOWED_PREFIXES.some((pre) => matchesPrefix(path, pre));
  return false;
}

/**
 * Returns where the user should be sent, or `null` if the current route is allowed.
 */
export function getDashboardRedirect(
  session: { role?: string } | null | undefined,
  pathname: string,
): string | null {
  const role = session?.role;
  if (role !== 'admin' && role !== 'teacher') return LOGIN_ROUTE;
  if (canAccessDashboardRoute(role, pathname)) return null;
  return role === 'teacher' ? TEACHER_HOME : LOGIN_ROUTE;
}
