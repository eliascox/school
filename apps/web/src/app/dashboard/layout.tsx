'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { getDashboardRedirect } from '@/lib/routeAccess';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950">লোড হচ্ছে...</div>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // `undefined` = session not read yet (first client render); `null` = logged out.
  const [session, setSession] = useState<UserSession | null | undefined>(undefined);
  const pathname = usePathname() || '';
  const router = useRouter();

  // Load the session once and keep it in sync (logout/login in another tab fires 'storage').
  useEffect(() => {
    const sync = () => setSession(teacherAuthService.getSession());
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // Central route guard — evaluated synchronously on every render/navigation so a
  // forbidden page is never painted, and allowed navigation never flashes a loader.
  const redirectTo = session === undefined ? null : getDashboardRedirect(session, pathname);

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  if (session === undefined || redirectTo) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <div className="flex min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 print:h-auto print:overflow-visible print:bg-white print:p-0 print:m-0 print:block">
        {/* Sidebar (sticky full-height desktop sidebar + mobile drawer) */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:block print:w-full">
          <div className="print:hidden">
            <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
          </div>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 print:overflow-visible print:block print:w-full">
            {children}
          </main>
        </div>
      </div>
    </Suspense>
  );
}
