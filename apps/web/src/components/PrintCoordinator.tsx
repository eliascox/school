'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { settingsService } from '@/services/settingsService';
import { buildSafePdfTitle, getRoutePdfLabel } from '@/lib/printPdfUtils';
import { localDateKey } from '@/lib/dateUtils';

/**
 * Global Print & PDF Export Coordinator
 * 1. Suspends Night/Dark mode during `beforeprint` and restores immediately on `afterprint`
 *    so printed sheets & exported PDFs always render with crisp white paper & dark ink.
 * 2. Sets a meaningful, sanitized `document.title` during print/Save-as-PDF so downloaded PDFs
 *    receive clean filenames (School Name - Document Type - Date.pdf) automatically.
 */
export default function PrintCoordinator() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let wasDark = false;
    let savedTitle: string | null = null;

    const handleBeforePrint = () => {
      const root = document.documentElement;
      if (root.classList.contains('dark')) {
        wasDark = true;
        root.classList.remove('dark');
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      } else {
        wasDark = false;
      }

      // Only replace generic app title so custom page-specific titles remain intact
      const currentTitle = document.title || '';
      if (!currentTitle || currentTitle.startsWith('SchoolPro')) {
        savedTitle = currentTitle;
        try {
          const schoolName = settingsService.getSettings()?.schoolName || 'SchoolPro';
          const docLabel = getRoutePdfLabel(pathname);
          document.title = buildSafePdfTitle([schoolName, docLabel, localDateKey()]);
        } catch {
          document.title = buildSafePdfTitle([getRoutePdfLabel(pathname), localDateKey()]);
        }
      } else {
        savedTitle = null;
      }
    };

    const handleAfterPrint = () => {
      if (wasDark) {
        const root = document.documentElement;
        root.classList.add('dark');
        root.classList.remove('light');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
        wasDark = false;
      }
      if (savedTitle !== null) {
        document.title = savedTitle;
        savedTitle = null;
      }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      // Clean up in case component unmounts while suspended
      handleAfterPrint();
    };
  }, [pathname]);

  return null;
}
