'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Loader2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Smartphone,
  X,
} from 'lucide-react';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { languageService, AppLanguage } from '@/services/languageService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { leaveService } from '@/services/leaveService';
import { studentService } from '@/services/studentService';
import { teacherRBACService } from '@/services/teacherRBACService';
import {
  ADMIN_NAV_SECTIONS,
  TEACHER_NAV_SECTIONS,
  NavBadgeKey,
  isNavGroupActive,
  isNavHrefActive,
} from '@/config/navigationConfig';
import { NavIcon } from '@/components/NavIcon';
import { normalizePath } from '@/lib/routeAccess';
import {
  URL_QUERY_CHANGED_EVENT,
  areSessionsEqual,
  createLiveQueryLookup,
  notifyNavigationPending,
  toCanonicalRouteHref,
  trySameRouteQueryNavigation,
} from '@/lib/urlTabSync';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface SidebarContentProps {
  session: UserSession | null;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function SidebarContent({
  session,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [liveSearch, setLiveSearch] = useState<string | null>(null);
  const [pendingNavId, setPendingNavId] = useState<string | null>(null);
  const prefetchedHrefsRef = useRef<Set<string>>(new Set());

  const isAdmin = session?.role === 'admin';

  // Hydration-safe live metric counters (populated inside useEffect)
  const [studentCount, setStudentCount] = useState<number>(0);
  const [teacherCount, setTeacherCount] = useState<number>(0);
  const [pendingLeavesCount, setPendingLeavesCount] = useState<number>(0);

  // Reset live search override & pending spinner once Next.js route/search settles
  useEffect(() => {
    setLiveSearch(null);
    setPendingNavId(null);
  }, [pathname, searchParams]);

  // Listen to 0ms in-place tab query sync events so Sidebar active highlights update instantaneously
  useEffect(() => {
    const syncLiveQuery = () => {
      if (typeof window !== 'undefined') {
        setLiveSearch(window.location.search);
      }
      setPendingNavId(null);
    };
    window.addEventListener(URL_QUERY_CHANGED_EVENT, syncLiveQuery);
    window.addEventListener('popstate', syncLiveQuery);
    return () => {
      window.removeEventListener(URL_QUERY_CHANGED_EVENT, syncLiveQuery);
      window.removeEventListener('popstate', syncLiveQuery);
    };
  }, []);

  useEffect(() => {
    setCurrentLang(languageService.getLanguage());
    setSchoolSettings(settingsService.getSettings());
    const unsubLang = languageService.subscribe((lang) => setCurrentLang(lang));

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const updateMetricsNow = () => {
      try {
        const students = studentService.getAllStudents();
        const nextCount = Array.isArray(students) ? students.length : 0;
        setStudentCount((prev) => (prev === nextCount ? prev : nextCount));
      } catch {
        setStudentCount((prev) => (prev === 0 ? prev : 0));
      }
      try {
        const t1 = teacherRBACService.getTeachers()?.length || 0;
        const t2 = teacherAuthService.getAllTeachers()?.length || 0;
        const nextTeachers = Math.max(t1, t2);
        setTeacherCount((prev) => (prev === nextTeachers ? prev : nextTeachers));
      } catch {
        setTeacherCount((prev) => (prev === 0 ? prev : 0));
      }
      try {
        const leaves = leaveService.getLeaves();
        const nextPending = leaves.filter((l) => l.status === 'pending').length;
        setPendingLeavesCount((prev) => (prev === nextPending ? prev : nextPending));
      } catch {
        setPendingLeavesCount((prev) => (prev === 0 ? prev : 0));
      }
    };

    const scheduleMetricsUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateMetricsNow, 150);
    };

    updateMetricsNow();
    const unsubStudents = studentService.subscribe(scheduleMetricsUpdate);
    const unsubLeaves = leaveService.subscribe(scheduleMetricsUpdate);
    const unsubSettings = settingsService.subscribe((s) => setSchoolSettings(s));

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', scheduleMetricsUpdate);
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubLang();
      unsubStudents();
      unsubLeaves();
      unsubSettings();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', scheduleMetricsUpdate);
      }
    };
  }, []);

  const queryLookup = createLiveQueryLookup(searchParams, liveSearch);
  const visibleSections = isAdmin ? ADMIN_NAV_SECTIONS : TEACHER_NAV_SECTIONS;

  const warmPrefetchHref = useCallback(
    (rawHref: string) => {
      const canonical = toCanonicalRouteHref(rawHref);
      if (prefetchedHrefsRef.current.has(canonical)) return;
      prefetchedHrefsRef.current.add(canonical);
      try {
        router.prefetch(canonical);
      } catch {
        // Ignore prefetch errors safely
      }
    },
    [router],
  );

  const resolveBadgeValue = (
    badgeKey?: NavBadgeKey,
    staticBadge?: string,
    staticBadgeBn?: string,
  ): string | number | null => {
    if (badgeKey === 'students') return studentCount > 0 ? studentCount : null;
    if (badgeKey === 'teachers') return teacherCount > 0 ? teacherCount : null;
    if (badgeKey === 'pendingLeaves') return pendingLeavesCount > 0 ? pendingLeavesCount : null;
    if (currentLang === 'en') return staticBadge || null;
    return staticBadgeBn || staticBadge || null;
  };

  const toggleGroup = (id: string, currentlyExpanded: boolean) => {
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
      setOpenGroups((prev) => ({ ...prev, [id]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [id]: !currentlyExpanded }));
  };

  const handleNavLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    navId: string,
    rawHref: string,
  ) => {
    if (onClose) onClose();
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    // 0ms instant query switch when staying on the same dashboard route (e.g. Finance tabs, Students Print, Settings tabs)
    if (trySameRouteQueryNavigation(rawHref, pathname)) {
      e.preventDefault();
      return;
    }

    const targetNorm = normalizePath(rawHref);
    const currentNorm = normalizePath(pathname);
    if (targetNorm !== currentNorm) {
      setPendingNavId(navId);
      notifyNavigationPending(toCanonicalRouteHref(rawHref));
    }
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const handleLogout = () => {
    teacherAuthService.logout();
    window.location.href = '/login/';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 select-none transition-colors duration-200">
      {/* ── 1. CLEAN BRAND HEADER + COLLAPSE TOGGLE ── */}
      <div
        className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-800/80 shrink-0 bg-white dark:bg-slate-950 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <Link
          href="/"
          onClick={handleLinkClick}
          className="flex items-center gap-2.5 hover:opacity-95 transition-opacity min-w-0 group"
          title={schoolSettings?.schoolName || 'মূল হোমপেজে যান'}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[2px] shadow-sm shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden">
              {schoolSettings?.schoolLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={schoolSettings.schoolLogo} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden min-w-0">
              <h1 className="font-bold text-slate-900 dark:text-white text-[13.5px] tracking-tight leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {schoolSettings?.schoolName || 'স্মার্ট স্কুল ম্যানেজমেন্ট'}
              </h1>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 truncate">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="truncate">
                  EIIN: {schoolSettings?.eiin || '---'}
                  {schoolSettings?.address
                    ? ` • ${schoolSettings.address.split(',')[1]?.trim() || schoolSettings.address}`
                    : ''}
                </span>
              </p>
            </div>
          )}
        </Link>

        {/* Mobile drawer close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition lg:hidden shrink-0 cursor-pointer"
            aria-label="Close menu"
            title="মেনু বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop collapse button (when expanded) */}
        {!onClose && onToggleCollapse && !isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition shrink-0 cursor-pointer"
            aria-label="Collapse sidebar"
            title={currentLang === 'en' ? 'Collapse sidebar' : 'সাইডবার সংকুচিত করুন'}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── 2. EXPAND BUTTON (COLLAPSED RAIL ONLY) ── */}
      {isCollapsed && onToggleCollapse && (
        <div className="px-2 pt-2.5 pb-1.5 flex flex-col items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-10 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition cursor-pointer"
            aria-label="Expand sidebar"
            title={currentLang === 'en' ? 'Expand sidebar' : 'সাইডবার বড় করুন'}
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── 3. SCROLLABLE 5-DOMAIN NAVIGATION TREE ── */}
      <nav
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className={`flex-1 overflow-y-auto py-3 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar ${
          isCollapsed ? 'px-2' : 'px-3'
        }`}
      >
        {visibleSections.map((section, sIdx) => (
            <div key={section.id} className="space-y-1">
              {isCollapsed ? (
                sIdx > 0 && (
                  <div className="mx-2 my-1.5 border-t border-slate-200/80 dark:border-slate-800" />
                )
              ) : (
                <p className="px-2.5 pb-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {currentLang === 'en' ? section.header : section.headerBn}
                </p>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isDirect = Boolean(item.href);
                  const isDirectActive =
                    isDirect && item.href
                      ? isNavHrefActive(item.href, pathname, queryLookup)
                      : false;
                  const isGActive = isNavGroupActive(item, pathname, queryLookup);
                  const isExpanded = openGroups[item.id] ?? isGActive;
                  const itemLabel = currentLang === 'en' ? item.title : item.titleBn;
                  const itemBadge = resolveBadgeValue(item.badgeKey, item.badge, item.badgeBn);

                  if (isDirect && item.href) {
                    const isEmeraldAccent = item.accent === 'emerald';
                    const isPending = pendingNavId === item.id;
                    const canonicalHref = toCanonicalRouteHref(item.href);
                    const linkClasses = isDirectActive
                      ? isEmeraldAccent
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 font-semibold'
                        : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 font-semibold'
                      : isPending
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 font-semibold'
                      : isEmeraldAccent
                      ? 'bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/15 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:text-slate-950 dark:hover:text-white font-medium';

                    return (
                      <Link
                        key={item.id}
                        href={canonicalHref}
                        prefetch={false}
                        onMouseEnter={() => warmPrefetchHref(item.href!)}
                        onFocus={() => warmPrefetchHref(item.href!)}
                        onClick={(e) => handleNavLinkClick(e, item.id, item.href!)}
                        title={isCollapsed ? itemLabel : undefined}
                        className={`relative flex items-center rounded-xl text-[13px] transition-all group ${
                          isCollapsed
                            ? 'justify-center w-11 h-10 mx-auto'
                            : 'justify-between px-2.5 py-2'
                        } ${linkClasses}`}
                      >
                        <div className={`flex items-center min-w-0 ${isCollapsed ? '' : 'gap-2.5'}`}>
                          <span
                            className={`shrink-0 transition-colors ${
                              isDirectActive ? 'text-white' : item.iconColor
                            }`}
                          >
                            {isPending ? (
                              <Loader2 className="w-[17px] h-[17px] animate-spin text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <NavIcon name={item.icon} className="w-[17px] h-[17px]" />
                            )}
                          </span>
                          {!isCollapsed && <span className="truncate">{itemLabel}</span>}
                        </div>

                        {!isCollapsed && itemBadge !== null && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md shrink-0 ${
                              isDirectActive
                                ? 'bg-white/20 text-white'
                                : item.badgeColor ||
                                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {itemBadge}
                          </span>
                        )}

                        {item.liveDot && (
                          <span
                            className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ${
                              isCollapsed ? 'absolute top-2 right-2' : ''
                            }`}
                          />
                        )}
                      </Link>
                    );
                  }

                  // Collapsible Accordion Group
                  return (
                    <div key={item.id} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.id, isExpanded)}
                        title={isCollapsed ? itemLabel : undefined}
                        aria-expanded={!isCollapsed && isExpanded}
                        className={`relative w-full flex items-center rounded-xl text-[13px] transition-all group cursor-pointer ${
                          isCollapsed
                            ? 'justify-center w-11 h-10 mx-auto'
                            : 'justify-between px-2.5 py-2'
                        } ${
                          isGActive
                            ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:text-slate-950 dark:hover:text-white font-medium'
                        }`}
                      >
                        {isGActive && !isCollapsed && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-indigo-600 dark:bg-indigo-400" />
                        )}

                        <div className={`flex items-center min-w-0 ${isCollapsed ? '' : 'gap-2.5'}`}>
                          <span
                            className={`shrink-0 transition-colors ${
                              isGActive
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : item.iconColor
                            }`}
                          >
                            <NavIcon name={item.icon} className="w-[17px] h-[17px]" />
                          </span>
                          {!isCollapsed && <span className="truncate">{itemLabel}</span>}
                        </div>

                        {!isCollapsed && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {itemBadge !== null && (
                              <span
                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
                                  item.badgeColor ||
                                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {itemBadge}
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-150" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-150" />
                            )}
                          </div>
                        )}

                        {isCollapsed && itemBadge !== null && item.badgeKey === 'pendingLeaves' && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                        )}
                      </button>

                      {/* Clean Tree Submenu */}
                      {!isCollapsed && isExpanded && item.subItems && (
                        <div className="ml-4 pl-3 border-l border-slate-200/90 dark:border-slate-800 space-y-0.5 py-0.5">
                          {item.subItems.map((sub) => {
                            const subActive = isNavHrefActive(sub.href, pathname, queryLookup);
                            const subPending = pendingNavId === sub.id;
                            const canonicalSubHref = toCanonicalRouteHref(sub.href);
                            const subBadge = resolveBadgeValue(
                              sub.badgeKey,
                              sub.badge,
                              sub.badgeBn,
                            );

                            return (
                              <Link
                                key={sub.id}
                                href={canonicalSubHref}
                                prefetch={false}
                                onMouseEnter={() => warmPrefetchHref(sub.href)}
                                onFocus={() => warmPrefetchHref(sub.href)}
                                onClick={(e) => handleNavLinkClick(e, sub.id, sub.href)}
                                className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg text-[12.5px] transition-all group ${
                                  subActive
                                    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold'
                                    : subPending
                                    ? 'bg-indigo-50/70 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`shrink-0 ${
                                      subActive
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : sub.iconColor || 'text-slate-400 dark:text-slate-500'
                                    }`}
                                  >
                                    {subPending ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                                    ) : (
                                      <NavIcon name={sub.icon} className="w-3.5 h-3.5" />
                                    )}
                                  </span>
                                  <span className="truncate">
                                    {currentLang === 'en' ? sub.label : sub.labelBn}
                                  </span>
                                </span>

                                {subBadge !== null && (
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md shrink-0 ${
                                      sub.badgeColor ||
                                      'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-500/30'
                                    }`}
                                  >
                                    {subBadge}
                                  </span>
                                )}

                                {sub.isExternal && (
                                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </nav>

      {/* ── 4. COMPACT MOBILE APP WIDGET (ADMIN EXPANDED) + USER FOOTER ── */}
      <div
        className={`border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 shrink-0 ${
          isCollapsed ? 'p-2 space-y-2' : 'p-3 space-y-2'
        }`}
      >
        {isAdmin && !isCollapsed && (
          <Link
            href="/dashboard/mobile-app/"
            prefetch={false}
            onMouseEnter={() => warmPrefetchHref('/dashboard/mobile-app')}
            onFocus={() => warmPrefetchHref('/dashboard/mobile-app')}
            onClick={(e) => handleNavLinkClick(e, 'mobile_app_widget', '/dashboard/mobile-app')}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/80 dark:from-emerald-950/50 dark:to-teal-950/40 border border-emerald-200/80 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11.5px] font-bold text-emerald-950 dark:text-emerald-200 truncate leading-tight">
                  {currentLang === 'en' ? 'Mobile App & QR' : 'মোবাইল অ্যাপ ও QR'}
                </p>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate">
                  {currentLang === 'en' ? 'Student, Guardian & Teacher' : 'শিক্ষার্থী, অভিভাবক ও শিক্ষক'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        )}

        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative"
              title={
                session?.teacherName ||
                (isAdmin ? schoolSettings?.principalName || 'Admin User' : 'Teacher')
              }
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                {session?.teacherName ? session.teacherName.charAt(0) : isAdmin ? 'AU' : 'TC'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title={currentLang === 'en' ? 'Logout' : 'লগআউট'}
              aria-label="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                  {session?.teacherName ? session.teacherName.charAt(0) : isAdmin ? 'AU' : 'TC'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {session?.teacherName ||
                    (isAdmin ? schoolSettings?.principalName || 'Admin User' : 'Teacher')}
                </p>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                  {isAdmin
                    ? currentLang === 'en'
                      ? 'Super Admin'
                      : 'প্রধান প্রশাসক'
                    : currentLang === 'en'
                    ? 'Faculty Member'
                    : 'সহকারী শিক্ষক'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title={currentLang === 'en' ? 'Logout' : 'লগআউট'}
              aria-label="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const handleStorage = () => {
      const next = teacherAuthService.getSession();
      setSession((prev) => (areSessionsEqual(prev, next) ? prev : next));
    };
    handleStorage();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <>
      {/* Desktop Sidebar (264px expanded ↔ 72px sleek icon rail) */}
      <aside
        className={`hidden lg:flex lg:flex-col shrink-0 h-screen sticky top-0 z-30 print:hidden border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 transition-[width] duration-200 ease-out ${
          isCollapsed ? 'w-[72px]' : 'w-[264px]'
        }`}
      >
        <React.Suspense
          fallback={
            <div
              className={`${
                isCollapsed ? 'w-[72px]' : 'w-[264px]'
              } bg-white dark:bg-slate-950 h-screen border-r border-slate-200/90 dark:border-slate-800`}
            />
          }
        >
          <SidebarContent
            session={session}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
          />
        </React.Suspense>
      </aside>

      {/* Mobile Overlay Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 print:hidden ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        {/* Drawer — mount inner nav tree only when open to avoid duplicate subscriptions & link trees */}
        <aside
          className={`absolute left-0 top-0 bottom-0 w-[272px] shadow-2xl transition-transform duration-300 ease-in-out border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {isOpen && (
            <React.Suspense
              fallback={
                <div className="w-[272px] bg-white dark:bg-slate-950 h-full border-r border-slate-200/90 dark:border-slate-800" />
              }
            >
              <SidebarContent session={session} onClose={onClose} />
            </React.Suspense>
          )}
        </aside>
      </div>
    </>
  );
}
