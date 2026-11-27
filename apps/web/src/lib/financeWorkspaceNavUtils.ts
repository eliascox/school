/**
 * Pure Navigation Grouping & Live Badge Utilities for the Finance & Accounts Workspaces
 * (`/dashboard/finance` — Fee Collection & Financial Reports).
 * Organizes flat sub-tabs into 3 clean, scannable workflow clusters with live counters.
 */

import type { FeeSubTab, ReportSubTab } from '@/components/finance/financeShared';
import { toBanglaDigits } from '@/lib/omr/omrTemplates';

export type FinanceNavAccent = 'teal' | 'indigo' | 'amber';

export interface FinanceGroupedNavItem<T extends string> {
  id: T;
  label: string;
  shortDesc: string;
  badgeText?: string;
  badgeTone?: 'neutral' | 'alert' | 'success' | 'info';
}

export interface FinanceGroupedNavCluster<T extends string> {
  id: string;
  title: string;
  accent: FinanceNavAccent;
  items: FinanceGroupedNavItem<T>[];
}

export interface FeeWorkspaceBadgeCounts {
  totalStudents: number;
  dueStudentsCount: number;
  invoicesCount: number;
  receiptsCount: number;
  feeSectorsCount: number;
  openingDueAmount: number;
  auditLogsCount: number;
}

export const VALID_FEE_SUB_TABS: FeeSubTab[] = [
  'collection',
  'invoices',
  'history',
  'due_report',
  'monthly_analysis',
  'audit_log',
  'fee_setup',
  'opening_due',
];

export function isValidFeeSubTab(val: string | null | undefined): val is FeeSubTab {
  return Boolean(val && VALID_FEE_SUB_TABS.includes(val as FeeSubTab));
}

export function buildFeeWorkspaceClusters(
  counts: FeeWorkspaceBadgeCounts,
): FinanceGroupedNavCluster<FeeSubTab>[] {
  return [
    {
      id: 'daily_desk',
      title: 'দৈনন্দিন লেনদেন',
      accent: 'teal',
      items: [
        {
          id: 'collection',
          label: 'ফি আদায়',
          shortDesc: 'শিক্ষার্থী নির্বাচন করে ক্যাশ, ব্যাংক বা বিকাশ/নগদে ফি আদায় ও তাৎক্ষণিক রিসিপ্ট প্রিন্ট করুন',
          badgeText: counts.totalStudents > 0 ? toBanglaDigits(counts.totalStudents) : undefined,
          badgeTone: 'info',
        },
        {
          id: 'invoices',
          label: 'মাসিক ইনভয়েস',
          shortDesc: 'শ্রেণিভিত্তিক মাসিক বিল তৈরি, বাল্ক ইনভয়েস প্রিন্ট ও বকেয়া SMS পাঠান',
          badgeText: counts.invoicesCount > 0 ? toBanglaDigits(counts.invoicesCount) : undefined,
          badgeTone: 'neutral',
        },
        {
          id: 'history',
          label: 'রিসিপ্ট হিস্টোরি',
          shortDesc: 'ইস্যুকৃত সকল জমার রসিদ অনুসন্ধান, পুনঃপ্রিন্ট ও দৈনিক আদায় যাচাই করুন',
          badgeText: counts.receiptsCount > 0 ? toBanglaDigits(counts.receiptsCount) : undefined,
          badgeTone: 'success',
        },
      ],
    },
    {
      id: 'reports_audit',
      title: 'রিপোর্ট ও বিশ্লেষণ',
      accent: 'indigo',
      items: [
        {
          id: 'due_report',
          label: 'বকেয়া রিপোর্ট',
          shortDesc: 'শ্রেণি ও শিক্ষার্থীভিত্তিক বকেয়া তালিকা দেখে এক ক্লিকে ফি আদায়ে যান',
          badgeText: counts.dueStudentsCount > 0 ? toBanglaDigits(counts.dueStudentsCount) : undefined,
          badgeTone: counts.dueStudentsCount > 0 ? 'alert' : 'neutral',
        },
        {
          id: 'monthly_analysis',
          label: 'মাসভিত্তিক বিশ্লেষণ',
          shortDesc: 'জানুয়ারি থেকে ডিসেম্বর পর্যন্ত মাসওয়ারি আদায় ও প্রবণতা বিশ্লেষণ করুন',
        },
        {
          id: 'audit_log',
          label: 'অডিট লগ',
          shortDesc: 'আর্থিক লেনদেন, রিসিপ্ট ও কনফিগারেশন পরিবর্তনের নিরাপদ অডিট ইতিহাস দেখুন',
          badgeText: counts.auditLogsCount > 0 ? toBanglaDigits(counts.auditLogsCount) : undefined,
          badgeTone: 'neutral',
        },
      ],
    },
    {
      id: 'setup_config',
      title: 'সেটআপ ও বকেয়া',
      accent: 'amber',
      items: [
        {
          id: 'fee_setup',
          label: 'ফি সেটআপ ও খাত',
          shortDesc: 'শ্রেণিভিত্তিক মাসিক টিউশন ফি, পরীক্ষা ও অন্যান্য আয়ের খাত নির্ধারণ করুন',
          badgeText:
            counts.feeSectorsCount > 0 ? `${toBanglaDigits(counts.feeSectorsCount)} খাত` : undefined,
          badgeTone: 'neutral',
        },
        {
          id: 'opening_due',
          label: 'পূর্বের বকেয়া',
          shortDesc: 'বিগত শিক্ষাবর্ষের প্রারম্ভিক বকেয়া এন্ট্রি ও সমন্বয় পরিচালনা করুন',
          badgeText:
            counts.openingDueAmount > 0
              ? `৳${counts.openingDueAmount.toLocaleString('bn-BD')}`
              : undefined,
          badgeTone: counts.openingDueAmount > 0 ? 'alert' : 'neutral',
        },
      ],
    },
  ];
}

export interface ReportWorkspaceBadgeCounts {
  vouchersCount: number;
  accountsCount: number;
  dueClassesWithDue: number;
}

export function buildReportWorkspaceClusters(
  counts: ReportWorkspaceBadgeCounts,
): FinanceGroupedNavCluster<ReportSubTab>[] {
  return [
    {
      id: 'financial_statements',
      title: 'আর্থিক বিবরণী',
      accent: 'teal',
      items: [
        {
          id: 'income_statement',
          label: 'আয়-ব্যয় বিবরণী',
          shortDesc: 'নির্দিষ্ট সময়সীমার মোট আয়, ব্যয় ও নিট উদ্বৃত্তের বিবরণী',
        },
        {
          id: 'balance_sheet',
          label: 'উদ্বৃত্তপত্র',
          shortDesc: 'সম্পদ, দায় ও তহবিলের ব্যালেন্স শিট রিপোর্ট',
        },
        {
          id: 'trial_balance',
          label: 'রেওয়ামিল',
          shortDesc: 'সকল হিসাব খাতের ডেবিট ও ক্রেডিট সমতার যাচাই (Trial Balance)',
        },
      ],
    },
    {
      id: 'books_dues',
      title: 'বকেয়া ও হিসাব বই',
      accent: 'indigo',
      items: [
        {
          id: 'student_dues',
          label: 'শ্রেণিভিত্তিক বকেয়া',
          shortDesc: 'প্রতিটি শ্রেণির শিক্ষার্থী বকেয়ার সমন্বিত রিপোর্ট',
          badgeText:
            counts.dueClassesWithDue > 0 ? toBanglaDigits(counts.dueClassesWithDue) : undefined,
          badgeTone: counts.dueClassesWithDue > 0 ? 'alert' : 'neutral',
        },
        {
          id: 'cash_book',
          label: 'ক্যাশবুক',
          shortDesc: 'নগদ ক্যাশ গ্রহণ ও প্রদানের দৈনিক খতিয়ান',
        },
        {
          id: 'bank_book',
          label: 'ব্যাংকবুক',
          shortDesc: 'প্রতিষ্ঠানের ব্যাংক হিসাবভিত্তিক জমা-উত্তোলনের বিবরণী',
        },
      ],
    },
    {
      id: 'ledgers_coa',
      title: 'লেজার ও খাত',
      accent: 'amber',
      items: [
        {
          id: 'general_ledger',
          label: 'খতিয়ান (GL)',
          shortDesc: 'যেকোনো হিসাব খাতের বিস্তারিত ডেবিট-ক্রেডিট লেজার',
        },
        {
          id: 'vouchers',
          label: 'ভাউচার রেজিস্টার',
          shortDesc: 'সকল রিসিপ্ট, পেমেন্ট, কন্ট্রা ও জার্নাল ভাউচার তালিকা',
          badgeText: counts.vouchersCount > 0 ? toBanglaDigits(counts.vouchersCount) : undefined,
          badgeTone: 'info',
        },
        {
          id: 'chart_of_accounts',
          label: 'চার্ট অব একাউন্টস',
          shortDesc: 'প্রতিষ্ঠানের সকল আয়, ব্যয়, সম্পদ ও দায় হিসাব খাত ব্যবস্থাপনা',
          badgeText: counts.accountsCount > 0 ? toBanglaDigits(counts.accountsCount) : undefined,
          badgeTone: 'neutral',
        },
      ],
    },
  ];
}

export function findActiveGroupedNavItem<T extends string>(
  clusters: FinanceGroupedNavCluster<T>[],
  activeId: T,
): { cluster: FinanceGroupedNavCluster<T>; item: FinanceGroupedNavItem<T> } | null {
  for (const cluster of clusters) {
    const found = cluster.items.find((it) => it.id === activeId);
    if (found) return { cluster, item: found };
  }
  return null;
}
