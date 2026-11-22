/**
 * Unified Print & PDF Filename Utilities
 * Ensures clean, OS-safe filenames when saving as PDF from browser print dialogs.
 */

export function buildSafePdfTitle(parts: Array<string | number | null | undefined>): string {
  const cleaned = parts
    .map((p) => String(p ?? '').trim())
    .filter(Boolean)
    .join(' - ')
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'SchoolPro_Document';
}

const ROUTE_PDF_LABELS: Array<{ prefix: string; label: string }> = [
  { prefix: '/dashboard/academic/marksheet', label: 'মার্কশিট' },
  { prefix: '/dashboard/academic/attendance', label: 'হাজিরা রিপোর্ট' },
  { prefix: '/dashboard/academic/classes', label: 'শ্রেণি ও শাখা তালিকা' },
  { prefix: '/dashboard/academic/session', label: 'শিক্ষাবর্ষ ও সেশন তালিকা' },
  { prefix: '/dashboard/academic/curriculum', label: 'পাঠ্যক্রম ও বিষয় তালিকা' },
  { prefix: '/dashboard/exam/admit-card', label: 'পরীক্ষার প্রবেশপত্র' },
  { prefix: '/dashboard/exam/seat-plan', label: 'পরীক্ষার সিট প্ল্যান' },
  { prefix: '/dashboard/exam/tabulation', label: 'ফলাফল ট্যাবুলেশন শিট' },
  { prefix: '/dashboard/exam/rank-result', label: 'ফলাফল মেধাতালিকা' },
  { prefix: '/dashboard/exam/results', label: 'ফলাফল ও পরিসংখ্যান' },
  { prefix: '/dashboard/exam/mark-entry', label: 'নম্বর এন্ট্রি শিট' },
  { prefix: '/dashboard/students/id-card', label: 'শিক্ষার্থী আইডি কার্ড' },
  { prefix: '/dashboard/students/print', label: 'শিক্ষার্থী তালিকা রিপোর্ট' },
  { prefix: '/dashboard/students/bulk-import', label: 'বাল্ক শিক্ষার্থী ইম্পোর্ট' },
  { prefix: '/dashboard/students', label: 'শিক্ষার্থী তালিকা' },
  { prefix: '/dashboard/certificates', label: 'সনদ ও প্রশংসাপত্র' },
  { prefix: '/dashboard/ssc-transcript', label: 'এসএসসি প্রশংসাপত্র' },
  { prefix: '/dashboard/admission', label: 'ভর্তি ফরম' },
  { prefix: '/dashboard/routine', label: 'ক্লাস রুটিন' },
  { prefix: '/dashboard/finance', label: 'আর্থিক হিসাব ও রসিদ' },
  { prefix: '/dashboard/ledger', label: 'খতিয়ান লেজার' },
  { prefix: '/dashboard/stipend', label: 'উপবৃত্তি তালিকা' },
  { prefix: '/dashboard/notices', label: 'অফিশিয়াল নোটিশ' },
  { prefix: '/dashboard/library', label: 'লাইব্রেরি রিপোর্ট' },
  { prefix: '/dashboard/alumni', label: 'প্রাক্তন শিক্ষার্থী তালিকা' },
  { prefix: '/dashboard/sms', label: 'এসএমএস লগ রিপোর্ট' },
  { prefix: '/dashboard/teacher-portal', label: 'শিক্ষক পোর্টাল ডকুমেন্ট' },
  { prefix: '/dashboard/teacher', label: 'শিক্ষক ও দায়িত্ব তালিকা' },
  { prefix: '/dashboard', label: 'ড্যাশবোর্ড রিপোর্ট' },
  { prefix: '/result', label: 'একাডেমিক ট্রান্সক্রিপ্ট' },
  { prefix: '/admission', label: 'ভর্তি আবেদন ফরম' },
  { prefix: '/verify-certificate', label: 'সনদ যাচাইকরণ রিপোর্ট' },
  { prefix: '/verify/ssc-testimonial', label: 'এসএসসি প্রশংসাপত্র যাচাই' },
];

export function getRoutePdfLabel(pathname: string | null | undefined): string {
  const clean = (pathname || '').replace(/\/+$/, '') || '/';
  for (const entry of ROUTE_PDF_LABELS) {
    if (clean === entry.prefix || clean.startsWith(`${entry.prefix}/`)) {
      return entry.label;
    }
  }
  return 'অফিশিয়াল ডকুমেন্ট';
}

export function triggerProfessionalPrint(customParts?: Array<string | number | null | undefined>): void {
  if (typeof window === 'undefined') return;
  const prevTitle = document.title;
  const hasCustom = Boolean(customParts && customParts.some(Boolean));

  if (hasCustom && customParts) {
    document.title = buildSafePdfTitle(customParts);
  }

  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    if (hasCustom) {
      document.title = prevTitle;
    }
    window.removeEventListener('afterprint', restore);
  };

  window.addEventListener('afterprint', restore);
  window.print();
  setTimeout(restore, 1500);
}
