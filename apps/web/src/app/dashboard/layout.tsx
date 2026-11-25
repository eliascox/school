'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CommandPalette from '@/components/CommandPalette';
import { NavIcon } from '@/components/NavIcon';
import DashboardRouteLoading from '@/app/dashboard/loading';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { languageService, AppLanguage } from '@/services/languageService';
import { getDashboardRedirect, normalizePath } from '@/lib/routeAccess';
import {
  ADMIN_MOBILE_BOTTOM_TABS,
  TEACHER_MOBILE_BOTTOM_TABS,
  isNavHrefActive,
} from '@/config/navigationConfig';
import {
  NAV_PENDING_EVENT,
  URL_QUERY_CHANGED_EVENT,
  areSessionsEqual,
  createLiveQueryLookup,
  notifyNavigationPending,
  toCanonicalRouteHref,
  trySameRouteQueryNavigation,
} from '@/lib/urlTabSync';

const SIDEBAR_COLLAPSE_KEY = 'sms_sidebar_collapsed';
const CHUNK_RELOAD_GUARD_KEY = 'sms_chunk_reload_guard_ts';
const CLOUD_RESTORE_ATTEMPTED_KEY = 'sms_cloud_restore_checked';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950">
    লোড হচ্ছে...
  </div>
);

const HeaderFallback = () => (
  <header className="h-14 lg:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center sticky top-0 z-40 shadow-xs print:hidden">
    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
  </header>
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<AppLanguage>('bn');
  const [liveSearch, setLiveSearch] = useState<string | null>(null);
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setLang(languageService.getLanguage());
    return languageService.subscribe((l) => setLang(l));
  }, []);

  useEffect(() => {
    setLiveSearch(null);
  }, [pathname, searchParams]);

  useEffect(() => {
    const syncQuery = () => {
      if (typeof window !== 'undefined') {
        setLiveSearch(window.location.search);
      }
    };
    window.addEventListener(URL_QUERY_CHANGED_EVENT, syncQuery);
    window.addEventListener('popstate', syncQuery);
    return () => {
      window.removeEventListener(URL_QUERY_CHANGED_EVENT, syncQuery);
      window.removeEventListener('popstate', syncQuery);
    };
  }, []);

  const queryLookup = createLiveQueryLookup(searchParams, liveSearch);
  const tabs = isAdmin ? ADMIN_MOBILE_BOTTOM_TABS : TEACHER_MOBILE_BOTTOM_TABS;

  const warmPrefetch = (href: string) => {
    const canonical = toCanonicalRouteHref(href);
    if (prefetchedRef.current.has(canonical)) return;
    prefetchedRef.current.add(canonical);
    try {
      router.prefetch(canonical);
    } catch {
      // Ignore prefetch errors safely
    }
  };

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

        const canonicalHref = toCanonicalRouteHref(tab.href);
        const active = !isSidebarOpen && isNavHrefActive(tab.href, pathname, queryLookup);
        return (
          <Link
            key={tab.id}
            href={canonicalHref}
            prefetch={false}
            onMouseEnter={() => warmPrefetch(tab.href!)}
            onTouchStart={() => warmPrefetch(tab.href!)}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              if (trySameRouteQueryNavigation(tab.href!, pathname)) {
                e.preventDefault();
                return;
              }
              if (normalizePath(tab.href!) !== normalizePath(pathname)) {
                notifyNavigationPending(canonicalHref);
              }
            }}
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
  const [navPendingHref, setNavPendingHref] = useState<string | null>(null);
  const pathname = usePathname() || '';
  const router = useRouter();
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore desktop sidebar collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      if (saved === 'true') setIsSidebarCollapsed(true);
    } catch {
      // Ignore storage access failures
    }
  }, []);

  // Load session once and only update state when auth fields actually changed
  useEffect(() => {
    const sync = () => {
      const next = teacherAuthService.getSession();
      setSession((prev) => (areSessionsEqual(prev, next) ? prev : next));
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // Clear pending route indicator as soon as pathname settles
  useEffect(() => {
    setNavPendingHref(null);
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  }, [pathname]);

  // Instant navigation progress indicator + stalled-route / post-deploy chunk recovery watchdog
  useEffect(() => {
    const canTriggerSafeHardRecovery = (): boolean => {
      try {
        const lastTs = Number(sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) || '0');
        if (Date.now() - lastTs < 15000) return false;
        sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, String(Date.now()));
        return true;
      } catch {
        return false;
      }
    };

    const handleNavPending = (e: Event) => {
      const detail = (e as CustomEvent<{ href?: string }>).detail;
      const targetHref = detail?.href;
      if (!targetHref) return;
      setNavPendingHref(targetHref);

      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
      }
      // Failsafe: if a Next.js client transition truly hangs > 7.5s (e.g., stale Vercel chunk after deploy),
      // recover automatically via clean direct navigation instead of leaving the UI permanently stuck.
      pendingTimeoutRef.current = setTimeout(() => {
        try {
          const targetPath = normalizePath(targetHref);
          const currentPath = normalizePath(window.location.pathname);
          if (targetPath !== currentPath && canTriggerSafeHardRecovery()) {
            window.location.assign(targetHref);
          } else {
            setNavPendingHref(null);
          }
        } catch {
          setNavPendingHref(null);
        }
      }, 7500);
    };

    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const rawMessage =
        'reason' in event
          ? String(event.reason?.message || event.reason || '')
          : String(event.message || '');
      const isChunkError =
        rawMessage.includes('ChunkLoadError') ||
        rawMessage.includes('Loading chunk') ||
        rawMessage.includes('Failed to fetch dynamically imported module') ||
        rawMessage.includes('Importing a module script failed');
      if (isChunkError && canTriggerSafeHardRecovery()) {
        window.location.reload();
      }
    };

    window.addEventListener(NAV_PENDING_EVENT, handleNavPending);
    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);
    return () => {
      window.removeEventListener(NAV_PENDING_EVENT, handleNavPending);
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current);
      }
    };
  }, []);

  // ☁️ Fresh-PC Auto-Restore ONLY (deferred so initial dashboard render & navigation never stall)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    try {
      if (sessionStorage.getItem(CLOUD_RESTORE_ATTEMPTED_KEY) === '1') return;
      const rawStudents = localStorage.getItem('sms_students');
      const hasLocalStudents = Boolean(rawStudents && rawStudents.length > 4 && rawStudents !== '[]');
      if (hasLocalStudents) {
        sessionStorage.setItem(CLOUD_RESTORE_ATTEMPTED_KEY, '1');
        return;
      }
    } catch {
      return;
    }

    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(CLOUD_RESTORE_ATTEMPTED_KEY, '1');
      } catch {}
      import('@/services/firebaseSyncService')
        .then(async ({ firebaseSyncService }) => {
          try {
            await firebaseSyncService.pullAllFromCloud();
          } catch {
            // Ignore offline/network errors gracefully
          }
        })
        .catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Central route guard — evaluated synchronously on every render/navigation so a
  // forbidden page is never painted, and allowed navigation never flashes a loader.
  const redirectTo = session === undefined ? null : getDashboardRedirect(session, pathname);

  useEffect(() => {
    if (redirectTo) router.replace(toCanonicalRouteHref(redirectTo));
  }, [redirectTo, router]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  }, []);

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
    normalizedPath === '/dashboard/exam/omr' ||
    normalizedPath === '/dashboard/exam/rank-result' ||
    normalizedPath === '/dashboard/exam/seat-plan' ||
    normalizedPath === '/dashboard/academic/marksheet';

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
      {/* Instant top route transition progress bar */}
      {navPendingHref && (
        <div
          className="fixed top-0 left-0 right-0 z-[70] h-[3px] bg-indigo-500/20 overflow-hidden pointer-events-none print:hidden"
          role="progressbar"
          aria-label="পেজ লোড হচ্ছে"
        >
          <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 animate-pulse rounded-r-full" />
        </div>
      )}

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
          <Suspense fallback={<HeaderFallback />}>
            <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
          </Suspense>
        </div>
        <main
          className={`flex-1 overflow-y-auto print:p-0 print:m-0 print:overflow-visible print:block print:w-full ${
            isFlushSubHeaderRoute
              ? 'p-0 pb-20 lg:pb-0'
              : 'p-4 pb-20 sm:p-6 sm:pb-20 lg:p-8'
          }`}
        >
          <Suspense fallback={<DashboardRouteLoading />}>{children}</Suspense>
        </main>
      </div>

      <Suspense fallback={null}>
        <MobileBottomNav
          isAdmin={isAdmin}
          isSidebarOpen={isSidebarOpen}
          onOpenMenu={toggleSidebar}
        />
      </Suspense>
      <CommandPalette />
    </div>
  );
}
