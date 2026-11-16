'use client';

import React from 'react';
import {
  CreditCard,
  Banknote,
  Receipt,
  Landmark,
  Percent,
  FileBarChart,
} from 'lucide-react';
import { BANGLA_MONTHS } from '@/services/financeService';
import { Student } from '@/services/studentService';

export type FinanceTab =
  | 'student_fees'
  | 'payroll'
  | 'expenses'
  | 'cash_bank'
  | 'waivers_refunds'
  | 'reports';

export type FeeSubTab =
  | 'collection'
  | 'invoices'
  | 'fee_setup'
  | 'opening_due'
  | 'due_report'
  | 'history'
  | 'monthly_analysis'
  | 'audit_log';

export type ReportSubTab =
  | 'income_statement'
  | 'balance_sheet'
  | 'trial_balance'
  | 'cash_book'
  | 'bank_book'
  | 'general_ledger'
  | 'vouchers'
  | 'chart_of_accounts';

export type FeePaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Bank Transfer';

export interface PaymentItem {
  name: string;
  amount: number;
  dueRemaining?: number;
}

export interface PaymentRecord {
  receiptId: string;
  studentId: string;
  studentName: string;
  roll: string;
  grade: string;
  section: string;
  mobile: string;
  feeItems: PaymentItem[];
  subtotal: number;
  discount: number;
  paidAmount: number;
  dueRemaining?: number;
  paymentMethod: string;
  trxId?: string;
  date: string;
  collectedBy: string;
}

export interface SchoolInfoState {
  nameBn: string;
  eiin: string;
  address: string;
  established: string;
  session: string;
  phone?: string;
}

export type StudentFinanceExt = Student & {
  studentId?: string;
  phone?: string;
  stipendStartMonth?: string;
  stipendMonth?: string;
};

export interface AuditLogEntry {
  action?: string;
  category?: string;
  details?: string;
  performedBy?: string;
  status?: string;
  targetId?: string;
  severity?: string;
  timestamp?: string;
}

export const MONTHS_LIST = BANGLA_MONTHS;

/** Checks whether a student currently qualifies as a stipend beneficiary. */
export function isStipendStudent(st: Student | null): boolean {
  if (!st) return false;
  return Boolean(st.isStipend || st.stipendCategory || st.stipendStatus === 'Active');
}

/** Returns the starting month for stipend fee waiver calculation. */
export function getStudentStipendStartMonth(st: Student | null): string {
  if (!st) return 'জানুয়ারি';
  return (st as StudentFinanceExt).stipendStartMonth || 'জানুয়ারি';
}

export interface FinanceModuleTabDef {
  id: FinanceTab;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

/** Builds top-level finance command bar module cards with live badges. */
export function getFinanceMainModules(counts: {
  totalDueAll: number;
  payrollCount: number;
  expenseCount: number;
  bankCount: number;
  waiverCount: number;
}): FinanceModuleTabDef[] {
  return [
    {
      id: 'student_fees',
      label: '১. শিক্ষার্থী ফি ও বিলিং',
      sub: 'কালেকশন, ইনভয়েস ও বকেয়া',
      icon: CreditCard,
      badge: counts.totalDueAll > 0 ? 'বকেয়া' : undefined,
    },
    {
      id: 'payroll',
      label: '২. শিক্ষক ও স্টাফ পে-রোল',
      sub: 'বেতন, ভাতা ও পিএফ',
      icon: Banknote,
      badge: counts.payrollCount > 0 ? `${counts.payrollCount}` : undefined,
    },
    {
      id: 'expenses',
      label: '৩. দৈনন্দিন ব্যয় ও ভাউচার',
      sub: 'বিল ও খরচ রেজিস্টার',
      icon: Receipt,
      badge: counts.expenseCount > 0 ? `${counts.expenseCount}` : undefined,
    },
    {
      id: 'cash_bank',
      label: '৪. ক্যাশ ও ব্যাংক ট্রেজারি',
      sub: 'হিসাব স্থিতি ও ট্রান্সফার',
      icon: Landmark,
      badge: `${counts.bankCount} ব্যাংক`,
    },
    {
      id: 'waivers_refunds',
      label: '৫. বৃত্তি, মওকুফ ও রিফান্ড',
      sub: 'ছাড় ও ফেরত সমন্বয়',
      icon: Percent,
      badge: counts.waiverCount > 0 ? `${counts.waiverCount}` : undefined,
    },
    {
      id: 'reports',
      label: '৬. আর্থিক প্রতিবেদন ও COA',
      sub: 'রেওয়ামিল, ক্যাশবুক ও খতিয়ান',
      icon: FileBarChart,
      badge: '৮ রিপোর্ট',
    },
  ];
}

/** Shared print header shown only when printing financial registers and statements. */
export function FinancePrintHeader({
  schoolInfo,
  title,
  sessionText,
  dateLabel = 'মুদ্রণ তারিখ',
}: {
  schoolInfo: SchoolInfoState;
  title: string;
  sessionText?: string;
  dateLabel?: string;
}) {
  return (
    <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-4 text-black">
      <h1 className="text-xl font-black tracking-tight">{schoolInfo.nameBn}</h1>
      <p className="text-xs text-gray-700 font-medium">
        {schoolInfo.address ? `${schoolInfo.address} • ` : ''}EIIN: {schoolInfo.eiin}
        {schoolInfo.established ? ` • স্থাপিত: ${schoolInfo.established}` : ''}
      </p>
      <div className="mt-2 inline-block border border-black px-3 py-1 rounded text-xs font-black uppercase">
        {title}
      </div>
      <div className="flex justify-between items-center text-[10px] text-gray-600 mt-2 px-2">
        <span>অর্থবছর / সেশন: {sessionText ?? schoolInfo.session}</span>
        <span>
          {dateLabel}: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
}

/** Shared print-only signature footer for financial registers and statements. */
export function FinancePrintSignatureBlock({ labels }: { labels: string[] }) {
  return (
    <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t border-black mt-8">
      {labels.map((label) => (
        <div key={label} className="text-center">
          <p className="border-t border-black px-6 pt-1 font-semibold">{label}</p>
        </div>
      ))}
    </div>
  );
}
