'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Building2,
  FileText,
  Landmark,
  Layers,
  PieChart,
  Plus,
  Printer,
  Receipt,
  Scale,
  Trash2,
  X,
} from 'lucide-react';
import {
  AccountCategory,
  AccountHead,
  BankAccount,
  VoucherRecord,
  VoucherType,
  financeService,
} from '@/services/financeService';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import {
  FinancePrintHeader,
  FinancePrintSignatureBlock,
  ReportSubTab,
  SchoolInfoState,
} from './financeShared';

interface FinanceReportsTabProps {
  vouchers: VoucherRecord[];
  chartOfAccounts: AccountHead[];
  bankAccounts: BankAccount[];
  schoolInfo: SchoolInfoState;
  onRefreshAll: () => void;
  onOpenVoucherModal: (defaultType?: VoucherType) => void;
  onPrintVoucher: (v: VoucherRecord) => void;
}

const REPORT_SUB_TABS: { id: ReportSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'income_statement', label: 'আয়-ব্যয় বিবরণী (Income Statement)', icon: PieChart },
  { id: 'balance_sheet', label: 'উদ্বৃত্তপত্র (Balance Sheet)', icon: Scale },
  { id: 'trial_balance', label: 'রেওয়ামিল (Trial Balance)', icon: Layers },
  { id: 'cash_book', label: 'ক্যাশবুক (Cash Book)', icon: BookOpen },
  { id: 'bank_book', label: 'ব্যাংকবুক (Bank Book)', icon: Landmark },
  { id: 'general_ledger', label: 'খতিয়ান (General Ledger)', icon: FileText },
  { id: 'vouchers', label: 'ভাউচার রেজিস্টার (Vouchers)', icon: Receipt },
  { id: 'chart_of_accounts', label: 'চার্ট অব একাউন্টস (COA)', icon: Building2 },
];

/** Renders the 8 double-entry accounting reports and Chart of Accounts management panel. */
export function FinanceReportsTab({
  vouchers,
  chartOfAccounts,
  bankAccounts,
  schoolInfo,
  onRefreshAll,
  onOpenVoucherModal,
  onPrintVoucher,
}: FinanceReportsTabProps) {
  const [reportSubTab, setReportSubTab] = useState<ReportSubTab>('income_statement');
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState('1010');
  const [selectedBankBookCode, setSelectedBankBookCode] = useState('1020');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountHead>({
    code: '',
    name: '',
    nameBn: '',
    category: 'Expense',
    subCategory: 'Administrative Expense',
    openingBalance: 0,
    isSystem: false,
    description: '',
  });

  const trialBalance = useMemo(() => financeService.getTrialBalance(), [vouchers, chartOfAccounts]);
  const incomeStatement = useMemo(() => financeService.getIncomeStatement(), [vouchers, chartOfAccounts]);
  const balanceSheet = useMemo(() => financeService.getBalanceSheet(), [vouchers, chartOfAccounts]);
  const cashBook = useMemo(() => financeService.getCashBook(), [vouchers, chartOfAccounts]);
  const bankBook = useMemo(
    () => financeService.getBankBook(selectedBankBookCode),
    [vouchers, chartOfAccounts, selectedBankBookCode]
  );
  const generalLedger = useMemo(
    () => financeService.getGeneralLedger(selectedLedgerAccount),
    [vouchers, chartOfAccounts, selectedLedgerAccount]
  );

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.code || !accountForm.nameBn) {
      showToast('অ্যাকাউন্ট কোড ও শিরোনাম বাধ্যতামূলক!', 'warning');
      return;
    }
    financeService.addOrUpdateAccount(accountForm);
    onRefreshAll();
    setShowAccountModal(false);
  };

  const reportPrintTitle =
    reportSubTab === 'income_statement'
      ? 'আর্থিক আয় ও ব্যয় বিবরণী (Statement of Income & Expenditure)'
      : reportSubTab === 'balance_sheet'
        ? 'আর্থিক অবস্থার বিবরণী / উদ্বৃত্তপত্র (Balance Sheet)'
        : reportSubTab === 'trial_balance'
          ? 'রেওয়ামিল খতিয়ান বিবরণী (Trial Balance Statement)'
          : reportSubTab === 'cash_book'
            ? 'ক্যাশবুক / দৈনিক নগদ প্রবাহ খতিয়ান (Cash Book)'
            : reportSubTab === 'bank_book'
              ? `ব্যাংক হিসাব খতিয়ান — ${bankBook.bankName}`
              : reportSubTab === 'general_ledger'
                ? `সাধারণ খতিয়ান হিসাব — ${generalLedger.account.nameBn || generalLedger.account.name}`
                : reportSubTab === 'vouchers'
                  ? 'ভাউচার ও জার্নাল রেজিস্টার (Voucher Master Ledger)'
                  : 'চার্ট অব একাউন্টস ও লেজার সূচি (Chart of Accounts)';

  const customBankOptions = bankAccounts.filter(
    (b) => b.accountCode && !['1020', '1030', '1040'].includes(b.accountCode)
  );

  return (
    <div className="space-y-5">
      <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-2 flex flex-wrap items-center gap-1.5">
        {REPORT_SUB_TABS.map((sub) => {
          const Icon = sub.icon;
          const isSelected = reportSubTab === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => setReportSubTab(sub.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      <FinancePrintHeader
        schoolInfo={schoolInfo}
        title={reportPrintTitle}
        sessionText="২০২৬"
        dateLabel="প্রতিবেদন তৈরির তারিখ"
      />

      {reportSubTab === 'income_statement' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-6 print:border-none print:p-0">
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                আর্থিক আয় ও ব্যয় বিবরণী (Statement of Income &amp; Expenditure)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                চলতি অর্থবছর {schoolInfo.session} • {schoolInfo.nameBn}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold border border-indigo-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-emerald-500 pb-1.5">
                <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  ক. প্রাপ্ত আয়সমূহ (Revenues)
                </h4>
                <span className="text-[11px] font-mono font-black text-emerald-700 dark:text-emerald-400">
                  ৳ {incomeStatement.totalIncome.toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2 print:bg-white print:border-black">
                {incomeStatement.incomeLines.map((line, idx) => (
                  <div
                    key={line.code || idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 dark:border-slate-800/80 print:border-gray-300"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{line.nameBn || line.name}</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 print:text-black">
                      ৳ {line.amount.toLocaleString('bn-BD')}
                    </span>
                  </div>
                ))}
                <div className="pt-2.5 flex items-center justify-between font-black text-xs text-emerald-800 dark:text-emerald-300 border-t-2 border-emerald-500/40">
                  <span>মোট অর্জিত রাজস্ব আয়:</span>
                  <span className="font-mono text-sm">৳ {incomeStatement.totalIncome.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-rose-500 pb-1.5">
                <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  খ. পরিচালন ব্যয়সমূহ (Operating Expenses)
                </h4>
                <span className="text-[11px] font-mono font-black text-rose-700 dark:text-rose-400">
                  ৳ {incomeStatement.totalExpense.toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2 print:bg-white print:border-black">
                {incomeStatement.expenseLines.map((line, idx) => (
                  <div
                    key={line.code || idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 dark:border-slate-800/80 print:border-gray-300"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{line.nameBn || line.name}</span>
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-400 print:text-black">
                      ৳ {line.amount.toLocaleString('bn-BD')}
                    </span>
                  </div>
                ))}
                <div className="pt-2.5 flex items-center justify-between font-black text-xs text-rose-800 dark:text-rose-300 border-t-2 border-rose-500/40">
                  <span>মোট পরিচালন ব্যয়:</span>
                  <span className="font-mono text-sm">৳ {incomeStatement.totalExpense.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 dark:border-slate-800 flex items-center justify-between shadow-xs print:bg-white print:border-black">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                নিট পরিচালন ফলাফল (Net Operating Surplus / Deficit)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                মোট অর্জিত রাজস্ব আয় হতে সর্বমোট পরিচালন ব্যয় কর্তনান্তে নিট উদ্বৃত্ত
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">তহবিল উদ্বৃত্ত:</span>
              <h2
                className={`text-2xl font-black font-mono ${
                  incomeStatement.netSurplus >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                } print:text-black`}
              >
                ৳ {incomeStatement.netSurplus.toLocaleString('bn-BD')}
              </h2>
            </div>
          </div>

          <FinancePrintSignatureBlock labels={['হিসাবরক্ষকের স্বাক্ষর', 'অর্থ ও অডিট কমিটি আহ্বায়ক', 'প্রধান শিক্ষক']} />
        </div>
      )}

      {reportSubTab === 'balance_sheet' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-6 print:border-none print:p-0">
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                আর্থিক অবস্থার বিবরণী / উদ্বৃত্তপত্র (Balance Sheet)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                হিসাব সমীকরণ: সম্পদ = দায় + মূলধন ও সংরক্ষিত তহবিল (A = L + E)
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold border border-indigo-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>উদ্বৃত্তপত্র প্রিন্ট</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-sky-500 pb-1.5">
                <h4 className="text-xs font-black text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                  ১. মোট সম্পদ (Assets)
                </h4>
                <span className="text-[11px] font-mono font-black text-sky-700 dark:text-sky-400">
                  ৳ {balanceSheet.totalAssets.toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2 print:bg-white print:border-black">
                {balanceSheet.assetLines.map((line, idx) => (
                  <div
                    key={line.code || idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 dark:border-slate-800/80 print:border-gray-300"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{line.nameBn || line.name}</span>
                    <span className="font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">
                      ৳ {line.amount.toLocaleString('bn-BD')}
                    </span>
                  </div>
                ))}
                <div className="pt-3 flex items-center justify-between font-black text-xs text-sky-800 dark:text-sky-300 border-t-2 border-sky-500/40">
                  <span>সর্বমোট সম্পদ (Total Assets):</span>
                  <span className="font-mono text-sm">৳ {balanceSheet.totalAssets.toLocaleString('bn-BD')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-rose-500 pb-1">
                  <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                    ২. মোট দায়সমূহ (Liabilities)
                  </h4>
                  <span className="text-[11px] font-mono font-black text-rose-700 dark:text-rose-400">
                    ৳ {balanceSheet.totalLiabilities.toLocaleString('bn-BD')}
                  </span>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2 print:bg-white print:border-black">
                  {balanceSheet.liabilityLines.map((line, idx) => (
                    <div
                      key={line.code || idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-800/80 print:border-gray-300"
                    >
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{line.nameBn || line.name}</span>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-400 print:text-black">
                        ৳ {line.amount.toLocaleString('bn-BD')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-amber-500 pb-1">
                  <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    ৩. সংরক্ষিত তহবিল ও মূলধন (Equity)
                  </h4>
                  <span className="text-[11px] font-mono font-black text-amber-700 dark:text-amber-400">
                    ৳ {balanceSheet.totalEquity.toLocaleString('bn-BD')}
                  </span>
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2 print:bg-white print:border-black">
                  {balanceSheet.equityLines.map((line, idx) => (
                    <div
                      key={line.code || idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-800/80 print:border-gray-300"
                    >
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{line.nameBn || line.name}</span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400 print:text-black">
                        ৳ {line.amount.toLocaleString('bn-BD')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-slate-950 p-3.5 rounded-xl border border-indigo-200 dark:border-slate-800 flex items-center justify-between font-black text-xs text-indigo-900 dark:text-indigo-300 print:bg-white print:border-black">
                <span>মোট দায় ও মূলধন (Total Liabilities &amp; Equity):</span>
                <span className="font-mono text-sm">৳ {balanceSheet.totalLiabAndEquity.toLocaleString('bn-BD')}</span>
              </div>
            </div>
          </div>

          <FinancePrintSignatureBlock labels={['হিসাবরক্ষকের স্বাক্ষর', 'অর্থ ও অডিট কমিটি আহ্বায়ক', 'প্রধান শিক্ষক']} />
        </div>
      )}

      {reportSubTab === 'trial_balance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                রেওয়ামিল খতিয়ান (Trial Balance Statement)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ডেবিট ব্যালেন্স ও ক্রেডিট ব্যালেন্স স্বয়ংক্রিয় মিলন
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                  trialBalance.isBalanced
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                }`}
              >
                {trialBalance.isBalanced ? '✓ রেওয়ামিল মিলেছে (Balanced)' : '✕ অমিল আছে (Unbalanced)'}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold border border-indigo-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse print:text-black">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                  <th className="p-3">অ্যাকাউন্ট কোড</th>
                  <th className="p-3">হিসাবের শিরোনাম (Account Name)</th>
                  <th className="p-3">শ্রেণি (Category)</th>
                  <th className="p-3 text-right text-emerald-700 dark:text-emerald-400">ডেবিট স্থিতি (৳)</th>
                  <th className="p-3 text-right text-rose-700 dark:text-rose-400">ক্রেডিট স্থিতি (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 print:divide-gray-300">
                {trialBalance.lines.map((line, idx) => (
                  <tr key={line.code || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">{line.code}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">
                      {line.nameBn || line.name}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{line.category}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 print:text-black">
                      {line.debitBalance > 0 ? `৳ ${line.debitBalance.toLocaleString('bn-BD')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400 print:text-black">
                      {line.creditBalance > 0 ? `৳ ${line.creditBalance.toLocaleString('bn-BD')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-950 font-black text-sm text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 print:bg-gray-100 print:border-black print:text-black">
                  <td colSpan={3} className="p-3 text-right">
                    মোট যোগফল (Grand Total):
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 print:text-black">
                    ৳ {trialBalance.totalDebit.toLocaleString('bn-BD')}
                  </td>
                  <td className="p-3 text-right font-mono text-rose-700 dark:text-rose-400 print:text-black">
                    ৳ {trialBalance.totalCredit.toLocaleString('bn-BD')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <FinancePrintSignatureBlock labels={['হিসাবরক্ষকের স্বাক্ষর', 'অর্থ ও অডিট কমিটি আহ্বায়ক', 'প্রধান শিক্ষক']} />
        </div>
      )}

      {reportSubTab === 'cash_book' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ক্যাশবুক / দৈনিক নগদ প্রবাহ খতিয়ান (Cash Book)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                প্রারম্ভিক ব্যালেন্স: ৳ {cashBook.openingBalance.toLocaleString('bn-BD')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold border border-indigo-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>ক্যাশবুক প্রিন্ট</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse print:text-black">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">ভাউচার নং</th>
                  <th className="p-3">বিবরণ ও প্রাসঙ্গিক সূত্র</th>
                  <th className="p-3 text-right text-emerald-700 dark:text-emerald-400">জমা (Receipt ৳)</th>
                  <th className="p-3 text-right text-rose-700 dark:text-rose-400">খরচ (Payment ৳)</th>
                  <th className="p-3 text-right font-bold text-slate-900 dark:text-white">জের / ব্যালেন্স (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 print:divide-gray-300">
                <tr className="bg-slate-50/70 dark:bg-slate-950/60 font-semibold text-slate-600 dark:text-slate-400">
                  <td className="p-3">-</td>
                  <td className="p-3 font-mono">OPENING</td>
                  <td className="p-3">প্রারম্ভিক নগদ তহবিল (Opening Balance)</td>
                  <td className="p-3 text-right">-</td>
                  <td className="p-3 text-right">-</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black">
                    ৳ {cashBook.openingBalance.toLocaleString('bn-BD')}
                  </td>
                </tr>
                {cashBook.records.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-slate-500 dark:text-slate-400">{rec.date}</td>
                    <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">
                      {rec.voucherNo}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900 dark:text-white print:text-black">{rec.particulars}</p>
                      <p className="text-[10px] text-slate-400">{rec.reference}</p>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 print:text-black">
                      {rec.receiptAmount > 0 ? `৳ ${rec.receiptAmount.toLocaleString('bn-BD')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400 print:text-black">
                      {rec.paymentAmount > 0 ? `৳ ${rec.paymentAmount.toLocaleString('bn-BD')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">
                      ৳ {rec.balance.toLocaleString('bn-BD')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-950 font-black text-sm text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 print:bg-gray-100 print:border-black print:text-black">
                  <td colSpan={3} className="p-3 text-right">
                    মোট জমা ও খরচ:
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 print:text-black">
                    ৳ {cashBook.totalReceipts.toLocaleString('bn-BD')}
                  </td>
                  <td className="p-3 text-right font-mono text-rose-700 dark:text-rose-400 print:text-black">
                    ৳ {cashBook.totalPayments.toLocaleString('bn-BD')}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 print:text-black">
                    ৳ {cashBook.closingBalance.toLocaleString('bn-BD')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <FinancePrintSignatureBlock labels={['ক্যাশিয়ার / হিসাবরক্ষক', 'প্রধান শিক্ষক']} />
        </div>
      )}

      {reportSubTab === 'bank_book' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedBankBookCode}
                onChange={(e) => setSelectedBankBookCode(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
              >
                <option value="1020">সোনালী ব্যাংক পিএলসি (1020)</option>
                <option value="1030">ইসলামী ব্যাংক বাংলাদেশ (1030)</option>
                <option value="1040">ডাচ-বাংলা ব্যাংক পিএলসি (1040)</option>
                {customBankOptions.map((b) => (
                  <option key={b.id} value={b.accountCode}>
                    {b.bankName} ({b.accountCode})
                  </option>
                ))}
              </select>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{bankBook.bankName} খতিয়ান</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  প্রারম্ভিক স্থিতি: ৳ {bankBook.openingBalance.toLocaleString('bn-BD')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold border border-indigo-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>ব্যাংকবুক প্রিন্ট</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse print:text-black">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">ভাউচার নং</th>
                  <th className="p-3">বিবরণ ও চেক রেফারেন্স</th>
                  <th className="p-3 text-right text-emerald-700 dark:text-emerald-400">জমা (Deposit ৳)</th>
                  <th className="p-3 text-right text-rose-700 dark:text-rose-400">উত্তোলন (Withdraw ৳)</th>
                  <th className="p-3 text-right font-bold text-slate-900 dark:text-white">চলমান স্থিতি (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 print:divide-gray-300">
                <tr className="bg-slate-50/70 dark:bg-slate-950/60 font-semibold text-slate-600 dark:text-slate-400">
                  <td className="p-3">-</td>
                  <td className="p-3 font-mono">OPENING</td>
                  <td className="p-3">প্রারম্ভিক ব্যাংক স্থিতি (Opening Balance)</td>
                  <td className="p-3 text-right">-</td>
                  <td className="p-3 text-right">-</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black">
                    ৳ {bankBook.openingBalance.toLocaleString('bn-BD')}
                  </td>
                </tr>
                {bankBook.records.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-slate-500 dark:text-slate-400">{rec.date}</td>
                    <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">
                      {rec.voucherNo}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">{rec.particulars}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 print:text-black">
                      {rec.depositAmount > 0 ? `৳ ${rec.depositAmount.toLocaleString('bn-BD')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400 print:text-black">
                      {rec.withdrawAmount > 0 ? `৳ ${rec.withdrawAmount.toLocaleString('bn-BD')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">
                      ৳ {rec.balance.toLocaleString('bn-BD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <FinancePrintSignatureBlock labels={['হিসাবরক্ষকের স্বাক্ষর', 'প্রধান শিক্ষক']} />
        </div>
      )}

      {reportSubTab === 'general_ledger' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <select
                value={selectedLedgerAccount}
                onChange={(e) => setSelectedLedgerAccount(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs max-w-xs cursor-pointer"
              >
                {chartOfAccounts.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} - {a.nameBn || a.name} ({a.category})
                  </option>
                ))}
              </select>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{generalLedger.account.nameBn} খতিয়ান</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  প্রারম্ভিক জের: ৳ {generalLedger.openingBalance.toLocaleString('bn-BD')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold border border-indigo-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>খতিয়ান প্রিন্ট</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse print:text-black">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">ভাউচার নং</th>
                  <th className="p-3">ভাউচার টাইপ</th>
                  <th className="p-3">বিবরণ (Particulars)</th>
                  <th className="p-3 text-right text-emerald-700 dark:text-emerald-400">ডেবিট (Debit ৳)</th>
                  <th className="p-3 text-right text-rose-700 dark:text-rose-400">ক্রেডিট (Credit ৳)</th>
                  <th className="p-3 text-right font-bold text-slate-900 dark:text-white">সমাপনী স্থিতি (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 print:divide-gray-300">
                <tr className="bg-slate-50/70 dark:bg-slate-950/60 font-semibold text-slate-600 dark:text-slate-400">
                  <td className="p-3">-</td>
                  <td className="p-3 font-mono">OPENING</td>
                  <td className="p-3">Balance B/F</td>
                  <td className="p-3">প্রারম্ভিক জের</td>
                  <td className="p-3 text-right">-</td>
                  <td className="p-3 text-right">-</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black">
                    ৳ {generalLedger.openingBalance.toLocaleString('bn-BD')}
                  </td>
                </tr>
                {generalLedger.records.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-slate-500 dark:text-slate-400">{rec.date}</td>
                    <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">
                      {rec.voucherNo}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                        {rec.voucherType}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">{rec.particulars}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 print:text-black">
                      {rec.debit > 0 ? `৳ ${rec.debit.toLocaleString('bn-BD')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400 print:text-black">
                      {rec.credit > 0 ? `৳ ${rec.credit.toLocaleString('bn-BD')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">
                      ৳ {rec.balance.toLocaleString('bn-BD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <FinancePrintSignatureBlock labels={['হিসাবরক্ষকের স্বাক্ষর', 'প্রধান শিক্ষক']} />
        </div>
      )}

      {reportSubTab === 'vouchers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                ভাউচার ও জার্নাল রেজিস্টার (Voucher Master Ledger)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                রিসিপ্ট, পেমেন্ট, কন্ট্রা ও সমন্বয় জার্নাল ভাউচার তালিকা
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>তালিকা প্রিন্ট</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenVoucherModal('Journal')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ভাউচার এন্ট্রি</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {vouchers.map((v, idx) => (
              <div
                key={v.id || idx}
                className="bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 print:bg-white print:border-black"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                        v.voucherType === 'Receipt'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                          : v.voucherType === 'Payment'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                            : v.voucherType === 'Contra'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30'
                      }`}
                    >
                      {v.voucherNo}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white print:text-black">{v.reference}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{v.date}</span>
                    <button
                      type="button"
                      onClick={() => onPrintVoucher(v)}
                      className="print:hidden px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      প্রিন্ট ভাউচার
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">{v.narration}</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-1.5">কোড</th>
                        <th className="py-1.5">হিসাবের নাম</th>
                        <th className="py-1.5">বিবরণ</th>
                        <th className="py-1.5 text-right text-emerald-700 dark:text-emerald-400">ডেবিট (৳)</th>
                        <th className="py-1.5 text-right text-rose-700 dark:text-rose-400">ক্রেডিট (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {v.entries.map((entry, eIdx) => (
                        <tr key={eIdx}>
                          <td className="py-1.5 font-mono text-slate-500">{entry.accountCode}</td>
                          <td className="py-1.5 font-bold text-slate-900 dark:text-white print:text-black">
                            {entry.accountName}
                          </td>
                          <td className="py-1.5 text-slate-500 dark:text-slate-400">{entry.narration || '-'}</td>
                          <td className="py-1.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 print:text-black">
                            {entry.debit > 0 ? `৳ ${entry.debit.toLocaleString('bn-BD')}` : '-'}
                          </td>
                          <td className="py-1.5 text-right font-mono font-bold text-rose-700 dark:text-rose-400 print:text-black">
                            {entry.credit > 0 ? `৳ ${entry.credit.toLocaleString('bn-BD')}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportSubTab === 'chart_of_accounts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                চার্ট অব একাউন্টস ও লেজার সেটআপ (Chart of Accounts)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                হিসাবের প্রধান ও উপ-খাত সংযোজন, সংশোধন ও নিয়ন্ত্রণ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>COA প্রিন্ট</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountForm({
                    code: String(Math.floor(5000 + Math.random() * 900)),
                    name: '',
                    nameBn: '',
                    category: 'Expense',
                    subCategory: 'Administrative Expense',
                    openingBalance: 0,
                    isSystem: false,
                    description: '',
                  });
                  setShowAccountModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন অ্যাকাউন্ট হেড</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse print:text-black">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                  <th className="p-3">কোড</th>
                  <th className="p-3">হিসাবের নাম (বাংলা)</th>
                  <th className="p-3">হিসাবের নাম (English)</th>
                  <th className="p-3">ক্যাটাগরি</th>
                  <th className="p-3">সাব-ক্যাটাগরি</th>
                  <th className="p-3 text-right">প্রারম্ভিক জের (৳)</th>
                  <th className="p-3 text-center print:hidden">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 print:divide-gray-300">
                {chartOfAccounts.map((acc, idx) => (
                  <tr key={acc.code || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">{acc.code}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">{acc.nameBn}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{acc.name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          acc.category === 'Asset'
                            ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300'
                            : acc.category === 'Liability'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300'
                              : acc.category === 'Equity'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300'
                                : acc.category === 'Income'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300'
                                  : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300'
                        }`}
                      >
                        {acc.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{acc.subCategory}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black">
                      ৳ {acc.openingBalance.toLocaleString('bn-BD')}
                    </td>
                    <td className="p-3 text-center print:hidden">
                      {acc.isSystem ? (
                        <span className="text-[10px] text-slate-400">কোর সিস্টেম</span>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              await confirmDialog({
                                title: 'অ্যাকাউন্ট মুছুন',
                                message: `'${acc.nameBn}' অ্যাকাউন্টটি মুছে ফেলতে চান?`,
                                confirmLabel: 'মুছে ফেলুন',
                                danger: true,
                              })
                            ) {
                              financeService.deleteAccount(acc.code);
                              onRefreshAll();
                            }
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                          title="অ্যাকাউন্ট মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <FinancePrintSignatureBlock labels={['হিসাবরক্ষকের স্বাক্ষর', 'প্রধান শিক্ষক']} />
        </div>
      )}

      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                নতুন চার্ট অব একাউন্টস হেড যোগ করুন
              </h3>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">অ্যাকাউন্ট কোড</label>
                  <input
                    type="text"
                    placeholder="যেমন: 5095"
                    value={accountForm.code}
                    onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">ক্যাটাগরি</label>
                  <select
                    value={accountForm.category}
                    onChange={(e) =>
                      setAccountForm({ ...accountForm, category: e.target.value as AccountCategory })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Asset">Asset (সম্পদ)</option>
                    <option value="Liability">Liability (দায়)</option>
                    <option value="Equity">Equity (মূলধন/তহবিল)</option>
                    <option value="Income">Income (আয়)</option>
                    <option value="Expense">Expense (ব্যয়)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">হিসাবের নাম (বাংলা)</label>
                <input
                  type="text"
                  placeholder="যেমন: কম্পিউটার ল্যাব যন্ত্রপাতি ক্রয়"
                  value={accountForm.nameBn}
                  onChange={(e) => setAccountForm({ ...accountForm, nameBn: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">হিসাবের নাম (English)</label>
                <input
                  type="text"
                  placeholder="যেমন: Computer Lab Equipment"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">প্রারম্ভিক ব্যালেন্স (৳)</label>
                <input
                  type="number"
                  value={accountForm.openingBalance}
                  onChange={(e) => setAccountForm({ ...accountForm, openingBalance: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  অ্যাকাউন্ট সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
