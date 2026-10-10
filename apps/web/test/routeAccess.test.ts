import { describe, it, expect } from 'vitest';
import {
  canAccessDashboardRoute,
  getDashboardRedirect,
  normalizePath,
  LOGIN_ROUTE,
  TEACHER_HOME,
} from '@/lib/routeAccess';

describe('routeAccess and dashboard layout guard', () => {
  it('normalizePath strips queries, hashes, and trailing slashes', () => {
    expect(normalizePath('/dashboard/')).toBe('/dashboard');
    expect(normalizePath('/dashboard/students/?view=print')).toBe('/dashboard/students');
    expect(normalizePath('/dashboard/finance?tab=fees#top')).toBe('/dashboard/finance');
    expect(normalizePath('')).toBe('/');
    expect(normalizePath(null)).toBe('/');
  });

  it('admin can access any dashboard route', () => {
    expect(canAccessDashboardRoute('admin', '/dashboard')).toBe(true);
    expect(canAccessDashboardRoute('admin', '/dashboard/settings')).toBe(true);
    expect(canAccessDashboardRoute('admin', '/dashboard/finance')).toBe(true);
    expect(canAccessDashboardRoute('admin', '/dashboard/students')).toBe(true);
    expect(getDashboardRedirect({ role: 'admin' }, '/dashboard/settings')).toBeNull();
  });

  it('teacher can access allowed teacher portal & operational routes', () => {
    expect(canAccessDashboardRoute('teacher', '/dashboard/teacher-portal')).toBe(true);
    expect(canAccessDashboardRoute('teacher', '/dashboard/teacher-portal?tab=routine')).toBe(true);
    expect(canAccessDashboardRoute('teacher', '/dashboard/exam/mark-entry')).toBe(true);
    expect(canAccessDashboardRoute('teacher', '/dashboard/academic/attendance')).toBe(true);
    expect(canAccessDashboardRoute('teacher', '/dashboard/notices')).toBe(true);
    expect(getDashboardRedirect({ role: 'teacher' }, '/dashboard/exam/mark-entry')).toBeNull();
  });

  it('teacher is blocked and redirected from admin routes', () => {
    expect(canAccessDashboardRoute('teacher', '/dashboard')).toBe(false);
    expect(canAccessDashboardRoute('teacher', '/dashboard/settings')).toBe(false);
    expect(canAccessDashboardRoute('teacher', '/dashboard/finance')).toBe(false);
    expect(canAccessDashboardRoute('teacher', '/dashboard/students')).toBe(false);
    expect(canAccessDashboardRoute('teacher', '/dashboard/academic/classes')).toBe(false);
    expect(canAccessDashboardRoute('teacher', '/dashboard/sms')).toBe(false);
    expect(getDashboardRedirect({ role: 'teacher' }, '/dashboard/settings')).toBe(TEACHER_HOME);
    expect(getDashboardRedirect({ role: 'teacher' }, '/dashboard/finance')).toBe(TEACHER_HOME);
  });

  it('unauthenticated visitor is redirected to /login', () => {
    expect(getDashboardRedirect(null, '/dashboard')).toBe(LOGIN_ROUTE);
    expect(getDashboardRedirect(undefined, '/dashboard/students')).toBe(LOGIN_ROUTE);
    expect(getDashboardRedirect({ role: 'unknown' }, '/dashboard/exam')).toBe(LOGIN_ROUTE);
  });
});
