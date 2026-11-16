'use client';

import React, { useState } from 'react';
import {
  Banknote,
  Calendar,
  Landmark,
  Plus,
  Printer,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
  Users,
  X,
} from 'lucide-react';
import {
  BANGLA_MONTHS,
  EXPENSE_CATEGORIES,
  ExpenseRecord,
  PayrollRecord,
  financeService,
} from '@/services/financeService';
import { AppLanguage } from '@/services/languageService';
import { confirmDialog } from '@/components/ui/ToastProvider';
import {
  FinancePrintHeader,
  FinancePrintSignatureBlock,
  MONTHS_LIST,
  SchoolInfoState,
} from './financeShared';

interface TeacherOption {
  id: string;
  name: string;
  designation?: string;
}

interface PayrollAndExpensesTabsProps {
  activeTab: 'payroll' | 'expenses';
  payrolls: PayrollRecord[];
  expenses: ExpenseRecord[];
  teachersList: TeacherOption[];
  schoolInfo: SchoolInfoState;
  currentLang: AppLanguage;
  onRefreshAll: () => void;
  onPrintSalarySlip: (pay: PayrollRecord) => void;
  onPrintExpenseSlip: (exp: ExpenseRecord) => void;
}

/** Manages teacher/staff payroll disbursements and daily operating expense vouchers with modal forms and print views. */
export function PayrollAndExpensesTabs({
  activeTab,
  payrolls,
  expenses,
  teachersList,
  schoolInfo,
  currentLang,
  onRefreshAll,
  onPrintSalarySlip,
  onPrintExpenseSlip,
}: PayrollAndExpensesTabsProps) {
  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollMonthFilter, setPayrollMonthFilter] = useState('all');
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollForm, setPayrollForm] = useState<{
    teacherId: string;
    teacherName: string;
    designation: string;
    month: string;
    year: number;
    baseSalary: number;
    allowances: number;
    bonus: number;
    deductions: number;
    paymentMethod: PayrollRecord['paymentMethod'];
    trxId: string;
    note: string;
  }>({
    teacherId: '',
    teacherName: '',
    designation: '',
    month: BANGLA_MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    baseSalary: 0,
    allowances: 0,
    bonus: 0,
    deductions: 0,
    paymentMethod: 'Bank Transfer',
    trxId: '',
    note: '',
  });

  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseMethodFilter, setExpenseMethodFilter] = useState('all');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState<{
    category: string;
    amount: number;
    paidTo: string;
    paymentMethod: ExpenseRecord['paymentMethod'];
    note: string;
    recordedBy: string;
  }>({
    category: EXPENSE_CATEGORIES[0],
    amount: 0,
    paidTo: '',
    paymentMethod: 'Cash',
    note: '',
    recordedBy: 'হিসাবরক্ষক',
  });

  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const net = payrollForm.baseSalary + payrollForm.allowances + payrollForm.bonus - payrollForm.deductions;
    const now = new Date();
    const vNo = `PR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      Math.floor(100 + Math.random() * 900)
    )}`;

    const record: PayrollRecord = {
      id: `PAY-${Date.now()}`,
      voucherNo: vNo,
      teacherId: payrollForm.teacherId,
      teacherName: payrollForm.teacherName,
      designation: payrollForm.designation,
      month: payrollForm.month,
      year: payrollForm.year,
      baseSalary: Number(payrollForm.baseSalary),
      allowances: Number(payrollForm.allowances),
      bonus: Number(payrollForm.bonus),
      deductions: Number(payrollForm.deductions),
      netPayable: net,
      paidAmount: net,
      status: 'Paid',
      paymentDate: now.toISOString().split('T')[0],
      paymentMethod: payrollForm.paymentMethod,
      trxId: payrollForm.trxId || `PAY-TRX-${Date.now().toString().slice(-5)}`,
      note: payrollForm.note,
    };

    financeService.savePayrollRecord(record);
    onRefreshAll();
    setShowPayrollModal(false);
    onPrintSalarySlip(record);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const vNo = `VCH-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      Math.floor(100 + Math.random() * 900)
    )}`;

    const record: ExpenseRecord = {
      id: `EXP-${Date.now()}`,
      voucherNo: vNo,
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      date: now.toISOString().split('T')[0],
      paidTo: expenseForm.paidTo || 'সংশ্লিষ্ট ব্যক্তি/প্রতিষ্ঠান',
      paymentMethod: expenseForm.paymentMethod,
      note: expenseForm.note,
      recordedBy: expenseForm.recordedBy,
    };

    financeService.saveExpense(record);
    onRefreshAll();
    setShowExpenseModal(false);
    onPrintExpenseSlip(record);
  };

  const renderPayrollTab = () => {
    const totalNetPayroll = payrolls.reduce((s, p) => s + (Number(p.netPayable) || 0), 0);
    const totalAllowancesAndBonus = payrolls.reduce(
      (s, p) => s + (Number(p.allowances) || 0) + (Number(p.bonus) || 0),
      0
    );
    const totalPfDeductions = payrolls.reduce((s, p) => s + (Number(p.deductions) || 0), 0);
    const filteredPayrolls = payrolls.filter((p) => {
      const matchMonth = payrollMonthFilter === 'all' || p.month === payrollMonthFilter;
      const q = payrollSearch.toLowerCase();
      const matchSearch =
        !q ||
        (p.teacherName && p.teacherName.toLowerCase().includes(q)) ||
        (p.designation && p.designation.toLowerCase().includes(q)) ||
        (p.voucherNo && p.voucherNo.toLowerCase().includes(q)) ||
        (p.teacherId && p.teacherId.toLowerCase().includes(q));
      return matchMonth && matchSearch;
    });

    return (
      <div className="space-y-5">
        <FinancePrintHeader
          schoolInfo={schoolInfo}
          title="শিক্ষক ও কর্মচারী মাসিক বেতন-ভাতা বিবরণী ও পে-রোল রেজিস্টার"
        />

        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                শিক্ষক ও কর্মচারী পে-রোল ব্যবস্থাপনা (Payroll &amp; Salary Ledger)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                মাসিক মূল বেতন, বাড়িভাড়া ভাতা, উৎসব বোনাস ও প্রভিডেন্ট ফান্ড (PF) কর্তন ও ডাবল-এন্ট্রি পোস্টিং
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>রেজিস্টার প্রিন্ট</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPayrollModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন বেতন বিতরণ</span>
            </button>
          </div>
        </div>

        <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">মোট পরিশোধিত নিট বেতন</p>
              <h4 className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ৳ {totalNetPayroll.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">COA কোড: 5010</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">মোট ভাতা ও বোনাস</p>
              <h4 className="text-lg font-black font-mono text-sky-600 dark:text-sky-400 mt-1">
                ৳ {totalAllowancesAndBonus.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">বাড়িভাড়া, চিকিৎসা ও উৎসব</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">প্রভিডেন্ট ফান্ড (PF) জমা</p>
              <h4 className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                ৳ {totalPfDeductions.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">COA দায় কোড: 2020</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">মোট স্যালারি ভাউচার</p>
              <h4 className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                {payrolls.length} টি
              </h4>
              <p className="text-[10px] text-slate-400">নিবন্ধিত শিক্ষক: {teachersList.length} জন</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4 print:border-none print:p-0">
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="শিক্ষক নাম, পদবি বা ভাউচার নং দিয়ে খুঁজুন..."
                value={payrollSearch}
                onChange={(e) => setPayrollSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">মাস ফিল্টার:</span>
              <select
                value={payrollMonthFilter}
                onChange={(e) => setPayrollMonthFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">সকল মাস ({payrolls.length})</option>
                {MONTHS_LIST.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredPayrolls.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mx-auto text-emerald-500">
                <Banknote className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  কোনো পে-রোল বা বেতন ভাউচার পাওয়া যায়নি
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  শিক্ষক বা কর্মচারীদের মাসিক বেতন প্রদান করলে তা স্বয়ংক্রিয়ভাবে এখানে এবং ডাবল-এন্ট্রি খতিয়ানে যুক্ত হবে।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayrollModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>প্রথম বেতন ভাউচার এন্ট্রি করুন</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse print:text-black">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                    <th className="p-3">ভাউচার নং ও তারিখ</th>
                    <th className="p-3">শিক্ষক/স্টাফ নাম</th>
                    <th className="p-3">পদবি</th>
                    <th className="p-3">মাস ও বছর</th>
                    <th className="p-3 text-right">মূল বেতন</th>
                    <th className="p-3 text-right text-emerald-700 dark:text-emerald-400">ভাতা/বোনাস</th>
                    <th className="p-3 text-right text-rose-700 dark:text-rose-400">কর্তন (PF)</th>
                    <th className="p-3 text-right font-bold text-slate-900 dark:text-white">নিট পরিশোধ</th>
                    <th className="p-3">মাধ্যম</th>
                    <th className="p-3 text-right print:hidden">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 print:divide-gray-300">
                  {filteredPayrolls.map((pay, idx) => (
                    <tr key={pay.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black block">
                          {pay.voucherNo}
                        </span>
                        <span className="text-[10px] text-slate-400">{pay.paymentDate}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">{pay.teacherName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{pay.designation || 'শিক্ষক/স্টাফ'}</td>
                      <td className="p-3 font-semibold">
                        {pay.month} {pay.year}
                      </td>
                      <td className="p-3 text-right font-mono font-bold">৳ {pay.baseSalary.toLocaleString('bn-BD')}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 print:text-black">
                        + ৳ {(pay.allowances + pay.bonus).toLocaleString('bn-BD')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400 print:text-black">
                        - ৳ {pay.deductions.toLocaleString('bn-BD')}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-300 print:text-black">
                        ৳ {pay.netPayable.toLocaleString('bn-BD')}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          {pay.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintSalarySlip(pay)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-500/30 cursor-pointer"
                          >
                            স্যালারি স্লিপ
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                await confirmDialog({
                                  title: 'পে-রোল রেকর্ড মুছুন',
                                  message: `'${pay.teacherName}'-এর পে-রোল রেকর্ডটি মুছে ফেলতে চান?`,
                                  confirmLabel: 'মুছে ফেলুন',
                                  danger: true,
                                })
                              ) {
                                financeService.deletePayrollRecord(pay.id);
                                onRefreshAll();
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="পে-রোল রেকর্ড মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <FinancePrintSignatureBlock labels={['হিসাবরক্ষকের স্বাক্ষর', 'অর্থ কমিটি আহ্বায়ক', 'প্রধান শিক্ষক']} />
        </div>
      </div>
    );
  };

  const renderExpensesTab = () => {
    const todayIso = new Date().toISOString().split('T')[0];
    const totalExpenseSum = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const todayExpenseSum = expenses
      .filter((e) => e.date === todayIso)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const cashExpenseSum = expenses
      .filter((e) => e.paymentMethod === 'Cash')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const digitalBankExpenseSum = totalExpenseSum - cashExpenseSum;

    const filteredExpenses = expenses.filter((exp) => {
      const matchCat = expenseCategoryFilter === 'all' || exp.category === expenseCategoryFilter;
      const matchMethod = expenseMethodFilter === 'all' || exp.paymentMethod === expenseMethodFilter;
      const q = expenseSearch.toLowerCase();
      const matchSearch =
        !q ||
        (exp.voucherNo && exp.voucherNo.toLowerCase().includes(q)) ||
        (exp.paidTo && exp.paidTo.toLowerCase().includes(q)) ||
        (exp.note && exp.note.toLowerCase().includes(q)) ||
        (exp.category && exp.category.toLowerCase().includes(q));
      return matchCat && matchMethod && matchSearch;
    });

    return (
      <div className="space-y-5">
        <FinancePrintHeader
          schoolInfo={schoolInfo}
          title="দৈনন্দিন পরিচালন ব্যয় ও ভাউচার খতিয়ান রেজিস্টার"
        />

        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                দৈনন্দিন ব্যয় ও ভাউচার রেজিস্টার (Operating Expense Ledger)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                বিদ্যুৎ বিল, স্টেশনারি, প্রিন্টিং, ল্যাব সামগ্রী, মেরামত ও বিবিধ খরচের ডাবল-এন্ট্রি ভাউচার
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>ব্যয় খতিয়ান প্রিন্ট</span>
            </button>
            <button
              type="button"
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন খরচ এন্ট্রি</span>
            </button>
          </div>
        </div>

        <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">সর্বমোট ভাউচার ব্যয়</p>
              <h4 className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
                ৳ {totalExpenseSum.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">{expenses.length} টি ভাউচার এন্ট্রি</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">আজকের দৈনিক খরচ</p>
              <h4 className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                ৳ {todayExpenseSum.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">তারিখ: {todayIso}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">নগদ ক্যাশ ব্যয়</p>
              <h4 className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ৳ {cashExpenseSum.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">ক্যাশ ড্রয়ার (1010)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">ব্যাংক ও মোবাইল পেমেন্ট</p>
              <h4 className="text-lg font-black font-mono text-sky-600 dark:text-sky-400 mt-1">
                ৳ {digitalBankExpenseSum.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">চেক, বিকাশ ও নগদ</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-500/20">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4 print:border-none print:p-0">
          <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ভাউচার নং, প্রাপক বা বিবরণ খুঁজুন..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="all">সকল ব্যয়ের খাত</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={expenseMethodFilter}
                onChange={(e) => setExpenseMethodFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="all">সকল মাধ্যম</option>
                <option value="Cash">নগদ ক্যাশ (Cash)</option>
                <option value="Bank Check">ব্যাংক চেক</option>
                <option value="bKash">বিকাশ (bKash)</option>
                <option value="Nagad">নগদ (Nagad)</option>
              </select>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center mx-auto text-rose-500">
                <Receipt className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">কোনো ব্যয়ের ভাউচার রেকর্ড নেই</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  বিদ্যালয়ের দৈনন্দিন খরচ এন্ট্রি করলে তা স্বয়ংক্রিয়ভাবে ক্যাশবুক, ব্যয় খতিয়ান ও আয়-ব্যয় বিবরণীতে যুক্ত হবে।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন খরচ এন্ট্রি করুন</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse print:text-black">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                    <th className="p-3">ভাউচার নং</th>
                    <th className="p-3">ব্যয় খাত (Category)</th>
                    <th className="p-3">বিবরণ (Note)</th>
                    <th className="p-3">প্রাপক (Paid To)</th>
                    <th className="p-3 text-right">পরিমাণ (টাকা)</th>
                    <th className="p-3">মাধ্যম</th>
                    <th className="p-3">তারিখ</th>
                    <th className="p-3 text-right print:hidden">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 print:divide-gray-300">
                  {filteredExpenses.map((exp, idx) => (
                    <tr key={exp.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">
                        {exp.voucherNo}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">{exp.category}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{exp.note || 'নিয়মিত ব্যয়'}</td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{exp.paidTo}</td>
                      <td className="p-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 print:text-black">
                        ৳ {Number(exp.amount).toLocaleString('bn-BD')}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{exp.date}</td>
                      <td className="p-3 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintExpenseSlip(exp)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-500/30 cursor-pointer"
                          >
                            ভাউচার স্লিপ
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                await confirmDialog({
                                  title: 'ব্যয় ভাউচার মুছুন',
                                  message: `ভাউচার #${exp.voucherNo} (৳${exp.amount}) মুছে ফেলতে চান?`,
                                  confirmLabel: 'মুছে ফেলুন',
                                  danger: true,
                                })
                              ) {
                                financeService.deleteExpense(exp.id);
                                onRefreshAll();
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="ব্যয় রেকর্ড মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {activeTab === 'payroll' ? renderPayrollTab() : renderExpensesTab()}

      {showPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                শিক্ষক ও কর্মচারী বেতন বিতরণ ভাউচার
              </h3>
              <button
                type="button"
                onClick={() => setShowPayrollModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayroll} className="space-y-3">
              {teachersList.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                    তালিকা থেকে শিক্ষক নির্বাচন করুন (ঐচ্ছিক অটো-ফিল)
                  </label>
                  <select
                    value={payrollForm.teacherId}
                    onChange={(e) => {
                      const t = teachersList.find((item) => item.id === e.target.value);
                      if (t) {
                        setPayrollForm({
                          ...payrollForm,
                          teacherId: t.id,
                          teacherName: t.name,
                          designation: t.designation || 'সহকারী শিক্ষক',
                        });
                      } else {
                        setPayrollForm({ ...payrollForm, teacherId: '' });
                      }
                    }}
                    className="w-full bg-emerald-50/50 dark:bg-slate-950 border border-emerald-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- শিক্ষক নির্বাচন করুন অথবা নিচে নাম লিখুন --</option>
                    {teachersList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.designation || 'শিক্ষক'} • ID: {t.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">শিক্ষক / স্টাফ নাম *</label>
                  <input
                    type="text"
                    placeholder="যেমন: মাওলানা আব্দুল করিম"
                    value={payrollForm.teacherName}
                    onChange={(e) => setPayrollForm({ ...payrollForm, teacherName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">পদবি (Designation)</label>
                  <input
                    type="text"
                    placeholder="যেমন: সহকারী শিক্ষক / অফিস সহকারী"
                    value={payrollForm.designation}
                    onChange={(e) => setPayrollForm({ ...payrollForm, designation: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">মাস</label>
                  <select
                    value={payrollForm.month}
                    onChange={(e) => setPayrollForm({ ...payrollForm, month: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {MONTHS_LIST.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">বছর</label>
                  <input
                    type="number"
                    value={payrollForm.year}
                    onChange={(e) => setPayrollForm({ ...payrollForm, year: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">মূল বেতন (Base)</label>
                  <input
                    type="number"
                    min="0"
                    value={payrollForm.baseSalary || ''}
                    placeholder="0"
                    onChange={(e) => setPayrollForm({ ...payrollForm, baseSalary: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">ভাতা (Allowance)</label>
                  <input
                    type="number"
                    min="0"
                    value={payrollForm.allowances || ''}
                    placeholder="0"
                    onChange={(e) => setPayrollForm({ ...payrollForm, allowances: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">বোনাস (Bonus)</label>
                  <input
                    type="number"
                    min="0"
                    value={payrollForm.bonus || ''}
                    placeholder="0"
                    onChange={(e) => setPayrollForm({ ...payrollForm, bonus: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-sky-600 dark:text-sky-400 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">কর্তন (PF)</label>
                  <input
                    type="number"
                    min="0"
                    value={payrollForm.deductions || ''}
                    placeholder="0"
                    onChange={(e) => setPayrollForm({ ...payrollForm, deductions: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">পরিশোধ মাধ্যম</label>
                  <select
                    value={payrollForm.paymentMethod}
                    onChange={(e) =>
                      setPayrollForm({
                        ...payrollForm,
                        paymentMethod: e.target.value as PayrollRecord['paymentMethod'],
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Bank Transfer">সোনালী ব্যাংক ট্রান্সফার</option>
                    <option value="Cash">নগদ ক্যাশ (Cash)</option>
                    <option value="bKash">বিকাশ (bKash)</option>
                    <option value="Nagad">নগদ (Nagad)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">রেফারেন্স / TrxID</label>
                  <input
                    type="text"
                    value={payrollForm.trxId}
                    onChange={(e) => setPayrollForm({ ...payrollForm, trxId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {currentLang === 'en' ? 'Net Payable Salary:' : 'নিট প্রদেয় বেতন:'}
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  ৳{' '}
                  {(
                    payrollForm.baseSalary +
                    payrollForm.allowances +
                    payrollForm.bonus -
                    payrollForm.deductions
                  ).toLocaleString('bn-BD')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  বেতন কনফার্ম ও পোস্টিং
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" />
                নতুন বিদ্যালয় ব্যয় ভাউচার
              </h3>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">ব্যয় খাত (Category)</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">টাকার পরিমাণ</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">প্রাপক / ভেন্ডরের নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: পল্লী বিদ্যুৎ সমিতি / পেপার হাউস"
                  value={expenseForm.paidTo}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">পরিশোধ মাধ্যম</label>
                <select
                  value={expenseForm.paymentMethod}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      paymentMethod: e.target.value as ExpenseRecord['paymentMethod'],
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Cash">নগদ ক্যাশ (Cash)</option>
                  <option value="bKash">বিকাশ (bKash)</option>
                  <option value="Nagad">নগদ (Nagad)</option>
                  <option value="Bank Check">ব্যাংক চেক (Bank Check)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">খরচের বিবরণ / নোট</label>
                <input
                  type="text"
                  placeholder="সংক্ষিপ্ত বিবরণ..."
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                >
                  খরচ সংরক্ষণ ও পোস্টিং
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
