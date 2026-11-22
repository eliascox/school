'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CommandPalette from '@/components/CommandPalette';
import { NavIcon } from '@/components/NavIcon';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { languageService, AppLanguage } from '@/services/languageService';
import { getDashboardRedirect, normalizePath } from '@/lib/routeAccess';
import {
  ADMIN_MOBILE_BOTTOM_TABS,
  TEACHER_MOBILE_BOTTOM_TABS,
  isNavHrefActive,
} from '@/config/navigationConfig';

const SIDEBAR_COLLAPSE_KEY = 'sms_sidebar_collapsed';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950">লোড হচ্ছে...</div>
);

function MobileBottomNav({
  isAdmin,
  isSidebarOpen,
  onOpenMenu,
}: {
  isAdmin: boolean;
  isSidebarOpen: boolean;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<AppLanguage>('bn');

  useEffect(() => {
    setLang(languageService.getLanguage());
    return languageService.subscribe((l) => setLang(l));
  }, []);

  const tabs = isAdmin ? ADMIN_MOBILE_BOTTOM_TABS : TEACHER_MOBILE_BOTTOM_TABS;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1.5 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(15,23,42,0.06)] print:hidden"
    >
      {tabs.map((tab) => {
        const label = lang === 'en' ? tab.label : tab.labelBn;
        if (tab.action === 'openMenu' || !tab.href) {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={onOpenMenu}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 px-2 rounded-xl text-[10px] font-bold transition-colors ${
                isSidebarOpen
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-500/15'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <NavIcon name={tab.icon} className="w-[18px] h-[18px]" />
              <span className="leading-tight truncate max-w-[64px]">{label}</span>
            </button>
          );
        }

        const active = !isSidebarOpen && isNavHrefActive(tab.href, pathname, searchParams);
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 px-2 rounded-xl text-[10px] font-bold transition-colors ${
              active
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-500/15'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <NavIcon name={tab.icon} className="w-[18px] h-[18px]" />
            <span className="leading-tight truncate max-w-[64px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // `undefined` = session not read yet (first client render); `null` = logged out.
  const [session, setSession] = useState<UserSession | null | undefined>(undefined);
  const pathname = usePathname() || '';
  const router = useRouter();

  // Restore desktop sidebar collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      if (saved === 'true') setIsSidebarCollapsed(true);
    } catch {
      // Ignore storage access failures
    }
  }, []);

  // Load the session once and keep it in sync (logout/login in another tab fires 'storage').
  useEffect(() => {
    const sync = () => setSession(teacherAuthService.getSession());
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // ☁️ Cross-PC Real-Time Cloud Firestore Sync on Dashboard Mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.onLine) {
      import('@/services/firebaseSyncService').then(async ({ firebaseSyncService }) => {
        try {
          const rawStudents = localStorage.getItem('sms_students');
          const hasLocalStudents = rawStudents && JSON.parse(rawStudents).length > 0;
          if (!hasLocalStudents) {
            // Fresh PC or cleared browser cache: automatically restore full school database from Cloud Firestore
            await firebaseSyncService.pullAllFromCloud();
          } else {
            const cloudData = await firebaseSyncService.fetchLandingPageCloudData();
            if (cloudData.settings) {
              const { settingsService } = await import('@/services/settingsService');
              settingsService.updateSettings(cloudData.settings);
            }
          }
        } catch {
          // Ignore offline/network errors gracefully
        }
      }).catch(() => {});
    }
  }, []);

  // Central route guard — evaluated synchronously on every render/navigation so a
  // forbidden page is never painted, and allowed navigation never flashes a loader.
  const redirectTo = session === undefined ? null : getDashboardRedirect(session, pathname);

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };

  if (session === undefined || redirectTo) return <LoadingScreen />;

  const isAdmin = session?.role === 'admin';
  const normalizedPath = normalizePath(pathname);
  const isFlushSubHeaderRoute =
    normalizedPath === '/dashboard/students' ||
    normalizedPath === '/dashboard/students/bulk-import' ||
    normalizedPath === '/dashboard/academic/curriculum' ||
    normalizedPath === '/dashboard/academic/classes' ||
    normalizedPath === '/dashboard/academic/session' ||
    normalizedPath === '/dashboard/admission' ||
    normalizedPath === '/dashboard/academic/promotion' ||
    normalizedPath === '/dashboard/routine' ||
    normalizedPath === '/dashboard/teacher' ||
    normalizedPath === '/dashboard/leaves' ||
    normalizedPath === '/dashboard/teacher-portal' ||
    normalizedPath === '/dashboard/exam/omr';

  return (
    <Suspense fallback={<LoadingScreen />}>
      <div className="flex min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
        {/* Sidebar (sticky full-height desktop sidebar + collapsible rail + mobile drawer) */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-clip lg:h-full lg:overflow-hidden print:block print:w-full">
          <div className="sticky top-0 z-40 print:hidden">
            <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
          </div>
          <main
            className={`flex-1 overflow-y-auto print:p-0 print:m-0 print:overflow-visible print:block print:w-full ${
              isFlushSubHeaderRoute
                ? 'p-0 pb-20 lg:pb-0'
                : 'p-4 pb-20 sm:p-6 sm:pb-20 lg:p-8'
            }`}
          >
            {children}
          </main>
        </div>

        <MobileBottomNav
          isAdmin={isAdmin}
          isSidebarOpen={isSidebarOpen}
          onOpenMenu={toggleSidebar}
        />
        <CommandPalette />
      </div>
    </Suspense>
  );
}
