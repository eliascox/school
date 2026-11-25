import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  ADMIN_NAV_SECTIONS,
  TEACHER_NAV_SECTIONS,
  ADMIN_MOBILE_BOTTOM_TABS,
  TEACHER_MOBILE_BOTTOM_TABS,
  filterNavSections,
  isNavGroupActive,
  isNavHrefActive,
  NavSectionConfig,
} from '@/config/navigationConfig';
import { canAccessDashboardRoute, normalizePath } from '@/lib/routeAccess';

const REDIRECT_ONLY_ROUTES = new Set([
  '/dashboard/academic',
  '/dashboard/analytics',
  '/dashboard/hr',
  '/dashboard/students/print',
]);

function collectDashboardPageRoutes(rootDir: string, currentDir = rootDir): string[] {
  const routes: string[] = [];
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...collectDashboardPageRoutes(rootDir, fullPath));
    } else if (entry.isFile() && entry.name === 'page.tsx') {
      const rel = path.relative(rootDir, currentDir).replace(/\\/g, '/');
      routes.push(rel ? `/dashboard/${rel}` : '/dashboard');
    }
  }
  return routes.sort();
}

function collectAllHrefs(sections: NavSectionConfig[]): string[] {
  const hrefs: string[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.href) hrefs.push(item.href);
      if (item.subItems) {
        for (const sub of item.subItems) {
          hrefs.push(sub.href);
        }
      }
    }
  }
  return hrefs;
}

describe('navigationConfig', () => {
  it('covers every active /dashboard/**/page.tsx route in ADMIN_NAV_SECTIONS', () => {
    const dashboardDir = path.resolve(process.cwd(), 'src/app/dashboard');
    const diskRoutes = collectDashboardPageRoutes(dashboardDir).filter(
      (route) => !REDIRECT_ONLY_ROUTES.has(route),
    );
    const navNormalizedPaths = new Set(
      collectAllHrefs(ADMIN_NAV_SECTIONS).map((href) => normalizePath(href)),
    );

    const missing = diskRoutes.filter((route) => !navNormalizedPaths.has(route));
    expect(missing).toEqual([]);
  });

  it('has unique item IDs and zero duplicate sub-menu hrefs in ADMIN_NAV_SECTIONS', () => {
    const seenIds = new Set<string>();
    const seenSubHrefs = new Set<string>();

    for (const section of ADMIN_NAV_SECTIONS) {
      expect(seenIds.has(section.id)).toBe(false);
      seenIds.add(section.id);

      for (const item of section.items) {
        expect(seenIds.has(item.id)).toBe(false);
        seenIds.add(item.id);

        for (const sub of item.subItems ?? []) {
          expect(seenIds.has(sub.id)).toBe(false);
          seenIds.add(sub.id);
          expect(seenSubHrefs.has(sub.href)).toBe(false);
          seenSubHrefs.add(sub.href);
        }
      }
    }
  });

  it('keeps every Teacher sidebar item and mobile bottom tab within Teacher RBAC prefixes', () => {
    const teacherHrefs = collectAllHrefs(TEACHER_NAV_SECTIONS);
    expect(teacherHrefs.length).toBeGreaterThan(0);

    for (const href of teacherHrefs) {
      expect(canAccessDashboardRoute('teacher', href)).toBe(true);
    }

    for (const tab of TEACHER_MOBILE_BOTTOM_TABS) {
      if (tab.href) {
        expect(canAccessDashboardRoute('teacher', tab.href)).toBe(true);
      }
    }
  });

  it('provides 5 mobile bottom tabs each for admin and teacher with a Menu trigger', () => {
    expect(ADMIN_MOBILE_BOTTOM_TABS).toHaveLength(5);
    expect(TEACHER_MOBILE_BOTTOM_TABS).toHaveLength(5);
    expect(ADMIN_MOBILE_BOTTOM_TABS.some((t) => t.action === 'openMenu')).toBe(true);
    expect(TEACHER_MOBILE_BOTTOM_TABS.some((t) => t.action === 'openMenu')).toBe(true);
  });

  it('filters sections cleanly with Bangla and English search queries', () => {
    expect(filterNavSections(ADMIN_NAV_SECTIONS, '')).toBe(ADMIN_NAV_SECTIONS);
    expect(filterNavSections(ADMIN_NAV_SECTIONS, '   ')).toBe(ADMIN_NAV_SECTIONS);

    const feeMatches = collectAllHrefs(filterNavSections(ADMIN_NAV_SECTIONS, 'ফি'));
    expect(feeMatches).toContain('/dashboard/finance?tab=student_fees');

    const admitMatches = collectAllHrefs(filterNavSections(ADMIN_NAV_SECTIONS, 'admit'));
    expect(admitMatches).toContain('/dashboard/exam/admit-card');

    const markMatches = collectAllHrefs(filterNavSections(ADMIN_NAV_SECTIONS, 'নম্বর'));
    expect(markMatches).toContain('/dashboard/exam/mark-entry');

    const certMatches = collectAllHrefs(filterNavSections(ADMIN_NAV_SECTIONS, 'সনদ'));
    expect(certMatches).toContain('/dashboard/certificates');

    const routineMatches = collectAllHrefs(filterNavSections(ADMIN_NAV_SECTIONS, 'routine'));
    expect(routineMatches).toContain('/dashboard/routine');

    expect(filterNavSections(ADMIN_NAV_SECTIONS, 'zzzz-nonexistent-query')).toEqual([]);
  });

  it('matches active routes accurately with trailing slashes and query parameters', () => {
    const query = (qs = '') => new URLSearchParams(qs);

    // Trailing slash parity
    expect(isNavHrefActive('/dashboard', '/dashboard/', query())).toBe(true);
    expect(isNavHrefActive('/dashboard/students', '/dashboard/students/', query())).toBe(true);

    // ?view=print separates Print Docs from Students
    expect(
      isNavHrefActive('/dashboard/students', '/dashboard/students/', query('view=print')),
    ).toBe(false);
    expect(
      isNavHrefActive('/dashboard/students?view=print', '/dashboard/students/', query('view=print')),
    ).toBe(true);

    const studentsGroup = ADMIN_NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.id === 'students')!;
    const printDocsGroup = ADMIN_NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.id === 'print_docs')!;
    expect(isNavGroupActive(studentsGroup, '/dashboard/students/', query('view=print'))).toBe(false);
    expect(isNavGroupActive(printDocsGroup, '/dashboard/students/', query('view=print'))).toBe(true);

    // Default ?tab= handling for Finance and Teacher Portal
    expect(
      isNavHrefActive('/dashboard/finance?tab=student_fees', '/dashboard/finance/', query()),
    ).toBe(true);
    expect(
      isNavHrefActive('/dashboard/finance?tab=expenses', '/dashboard/finance/', query()),
    ).toBe(false);
    expect(
      isNavHrefActive('/dashboard/finance?tab=expenses', '/dashboard/finance/', query('tab=expenses')),
    ).toBe(true);

    expect(
      isNavHrefActive('/dashboard/teacher-portal?tab=home', '/dashboard/teacher-portal/', query()),
    ).toBe(true);
    expect(
      isNavHrefActive('/dashboard/teacher-portal?tab=leaves', '/dashboard/teacher-portal/', query('tab=leaves')),
    ).toBe(true);

    // Teacher & Leaves are separate sidebar routes; Settings explicit tab vs default
    expect(
      isNavHrefActive('/dashboard/teacher', '/dashboard/teacher/', query()),
    ).toBe(true);
    expect(
      isNavHrefActive('/dashboard/leaves', '/dashboard/leaves/', query()),
    ).toBe(true);
    expect(
      isNavHrefActive('/dashboard/teacher', '/dashboard/leaves/', query()),
    ).toBe(false);

    // Unified Settings item stays active across all internal ?tab= views
    expect(
      isNavHrefActive('/dashboard/settings', '/dashboard/settings/', query()),
    ).toBe(true);
    expect(
      isNavHrefActive('/dashboard/settings', '/dashboard/settings/', query('tab=committee')),
    ).toBe(true);
    expect(
      isNavHrefActive('/dashboard/settings', '/dashboard/settings/', query('tab=pad')),
    ).toBe(true);
    expect(
      isNavHrefActive(
        '/dashboard/settings?tab=committee',
        '/dashboard/settings/',
        query('tab=committee'),
      ),
    ).toBe(true);
  });
});
