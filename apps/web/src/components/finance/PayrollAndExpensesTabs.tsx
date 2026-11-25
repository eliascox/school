'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  History,
  Landmark,
  Layers,
  Plus,
  Printer,
  Receipt,
  Save,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  TrendingDown,
  Users,
  X,
} from 'lucide-react';
import {
  BANGLA_MONTHS,
  BankAccount,
  EXPENSE_CATEGORIES,
  ExpenseRecord,
  PayrollRecord,
  financeService,
} from '@/services/financeService';
import { AppLanguage } from '@/services/languageService';
import { TeacherRecord } from '@/services/teacherRBACService';
import {
  StaffCategory,
  StaffSalaryProfile,
  buildMonthlyPayrollDrafts,
  computePayrollBreakdown,
  getEffectiveSalaryProfile,
  getStaffMonthlyApprovedLeaveDays,
  getStaffSalaryProfiles,
  hasDuplicatePayrollEntry,
  inferStaffCategory,
  saveStaffSalaryProfile,
} from '@/lib/payrollEngine';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import {
  FinancePrintHeader,
  FinancePrintSignatureBlock,
  FinanceSlimHeader,
  MONTHS_LIST,
  SchoolInfoState,
} from './financeShared';

interface PayrollAndExpensesTabsProps {
  activeTab: 'payroll' | 'expenses';
  payrolls: PayrollRecord[];
  expenses: ExpenseRecord[];
  teachersList: TeacherRecord[];
  bankAccounts: BankAccount[];
  schoolInfo: SchoolInfoState;
  currentLang: AppLanguage;
  onRefreshAll: () => void;
  onPrintSalarySlip: (pay: PayrollRecord) => void;
  onPrintExpenseSlip: (exp: ExpenseRecord) => void;
}

type PayrollSubTab = 'sheet' | 'structure' | 'history';

/** Manages independent 3-tab Staff Payroll Studio and Operating Expense Records with full double-entry & HR sync. */
export function PayrollAndExpensesTabs({
  activeTab,
  payrolls,
  expenses,
  teachersList,
  bankAccounts,
  schoolInfo,
  currentLang,
  onRefreshAll,
  onPrintSalarySlip,
  onPrintExpenseSlip,
}: PayrollAndExpensesTabsProps) {
  const defaultBankId = bankAccounts[0]?.id || 'bank-1';
  const currentMonthBn = BANGLA_MONTHS[new Date().getMonth()];
  const currentYearNum = new Date().getFullYear();

  // ─── PAYROLL STATE ───────────────────────────────────────────────────
  const [payrollSubTab, setPayrollSubTab] = useState<PayrollSubTab>('sheet');
  const [sheetMonth, setSheetMonth] = useState<string>(currentMonthBn);
  const [sheetYear, setSheetYear] = useState<number>(currentYearNum);
  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollMonthFilter, setPayrollMonthFilter] = useState('all');
  const [payrollStatusFilter, setPayrollStatusFilter] = useState<'all' | 'Paid' | 'Pending'>('all');

  // Salary profiles state (synced from localStorage)
  const [salaryProfiles, setSalaryProfiles] = useState<Record<string, StaffSalaryProfile>>(() =>
    getStaffSalaryProfiles()
  );
  const [editingProfileTeacher, setEditingProfileTeacher] = useState<TeacherRecord | null>(null);
  const [profileForm, setProfileForm] = useState<StaffSalaryProfile | null>(null);

  // Add/Edit Payroll Modal state
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [editingPayrollId, setEditingPayrollId] = useState<string | null>(null);
  const [payrollForm, setPayrollForm] = useState<{
    teacherId: string;
    teacherName: string;
    designation: string;
    staffCategory: StaffCategory;
    month: string;
    year: number;
    baseSalary: number;
    allowances: number;
    bonus: number;
    pfDeduction: number;
    otherDeduction: number;
    status: 'Paid' | 'Pending';
    paymentMethod: PayrollRecord['paymentMethod'];
    bankAccountId: string;
    trxId: string;
    note: string;
  }>({
    teacherId: '',
    teacherName: '',
    designation: '',
    staffCategory: 'teacher',
    month: currentMonthBn,
    year: currentYearNum,
    baseSalary: 0,
    allowances: 0,
    bonus: 0,
    pfDeduction: 0,
    otherDeduction: 0,
    status: 'Paid',
    paymentMethod: 'Bank Transfer',
    bankAccountId: defaultBankId,
    trxId: '',
    note: '',
  });

  // ─── EXPENSE STATE ───────────────────────────────────────────────────
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseMethodFilter, setExpenseMethodFilter] = useState('all');
  const [expenseFromDate, setExpenseFromDate] = useState('');
  const [expenseToDate, setExpenseToDate] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<{
    category: string;
    amount: number;
    date: string;
    paidTo: string;
    paymentMethod: ExpenseRecord['paymentMethod'];
    bankAccountId: string;
    note: string;
    recordedBy: string;
  }>({
    category: EXPENSE_CATEGORIES[0],
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paidTo: '',
    paymentMethod: 'Cash',
    bankAccountId: defaultBankId,
    note: '',
    recordedBy: 'হিসাবরক্ষক',
  });

  const activeTeachers = useMemo(
    () => teachersList.filter((t) => t.status !== 'inactive'),
    [teachersList]
  );

  const configuredProfilesCount = useMemo(
    () => activeTeachers.filter((t) => (salaryProfiles[t.id]?.baseSalary || 0) > 0).length,
    [activeTeachers, salaryProfiles]
  );

  // ─── PAYROLL HANDLERS ────────────────────────────────────────────────
  const openNewPayrollModal = (presetTeacher?: TeacherRecord) => {
    setEditingPayrollId(null);
    if (presetTeacher) {
      const prof = getEffectiveSalaryProfile(presetTeacher, salaryProfiles);
      const allowances = prof.houseRent + prof.medicalAllowance + prof.otherAllowance;
      const pfAmt = Math.round((prof.baseSalary * (prof.pfPercent || 0)) / 100);
      setPayrollForm({
        teacherId: presetTeacher.id,
        teacherName: presetTeacher.name,
        designation: presetTeacher.designation || 'সহকারী শিক্ষক',
        staffCategory: prof.staffCategory,
        month: sheetMonth,
        year: sheetYear,
        baseSalary: prof.baseSalary,
        allowances,
        bonus: 0,
        pfDeduction: pfAmt,
        otherDeduction: 0,
        status: 'Paid',
        paymentMethod: prof.defaultPaymentMethod || 'Bank Transfer',
        bankAccountId: prof.bankAccountId || defaultBankId,
        trxId: '',
        note: '',
      });
    } else {
      setPayrollForm({
        teacherId: '',
        teacherName: '',
        designation: '',
        staffCategory: 'teacher',
        month: sheetMonth,
        year: sheetYear,
        baseSalary: 0,
        allowances: 0,
        bonus: 0,
        pfDeduction: 0,
        otherDeduction: 0,
        status: 'Paid',
        paymentMethod: 'Bank Transfer',
        bankAccountId: defaultBankId,
        trxId: '',
        note: '',
      });
    }
    setShowPayrollModal(true);
  };

  const openEditPayrollModal = (pay: PayrollRecord) => {
    setEditingPayrollId(pay.id);
    const pfDed = pay.pfDeduction !== undefined ? pay.pfDeduction : pay.deductions;
    const otherDed = pay.otherDeduction !== undefined ? pay.otherDeduction : Math.max(0, pay.deductions - pfDed);
    setPayrollForm({
      teacherId: pay.teacherId || '',
      teacherName: pay.teacherName,
      designation: pay.designation || '',
      staffCategory: pay.staffCategory || inferStaffCategory(pay.designation),
      month: pay.month,
      year: pay.year,
      baseSalary: pay.baseSalary,
      allowances: pay.allowances,
      bonus: pay.bonus,
      pfDeduction: pfDed,
      otherDeduction: otherDed,
      status: pay.status,
      paymentMethod: pay.paymentMethod,
      bankAccountId: pay.bankAccountId || defaultBankId,
      trxId: pay.trxId || '',
      note: pay.note || '',
    });
    setShowPayrollModal(true);
  };

  const handleSelectTeacherInModal = (teacherId: string) => {
    const t = teachersList.find((item) => item.id === teacherId);
    if (!t) {
      setPayrollForm((prev) => ({ ...prev, teacherId: '' }));
      return;
    }
    const prof = getEffectiveSalaryProfile(t, salaryProfiles);
    const allowances = prof.houseRent + prof.medicalAllowance + prof.otherAllowance;
    const pfAmt = Math.round((prof.baseSalary * (prof.pfPercent || 0)) / 100);
    setPayrollForm((prev) => ({
      ...prev,
      teacherId: t.id,
      teacherName: t.name,
      designation: t.designation || 'সহকারী শিক্ষক',
      staffCategory: prof.staffCategory,
      baseSalary: prof.baseSalary > 0 ? prof.baseSalary : prev.baseSalary,
      allowances: allowances > 0 ? allowances : prev.allowances,
      pfDeduction: pfAmt > 0 ? pfAmt : prev.pfDeduction,
      paymentMethod: prof.defaultPaymentMethod || prev.paymentMethod,
      bankAccountId: prof.bankAccountId || prev.bankAccountId,
    }));
  };

  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollForm.teacherName.trim()) {
      showToast('অনুগ্রহ করে শিক্ষক বা কর্মচারীর নাম লিখুন।', 'warning');
      return;
    }

    const calc = computePayrollBreakdown({
      baseSalary: payrollForm.baseSalary,
      allowances: payrollForm.allowances,
      bonus: payrollForm.bonus,
      pfDeduction: payrollForm.pfDeduction,
      otherDeduction: payrollForm.otherDeduction,
    });

    if (!calc.valid) {
      showToast(calc.error || 'বেতনের হিসাব সঠিক নয়।', 'warning');
      return;
    }

    if (
      hasDuplicatePayrollEntry(
        payrolls,
        payrollForm.teacherId,
        payrollForm.teacherName,
        payrollForm.month,
        payrollForm.year,
        editingPayrollId || undefined
      )
    ) {
      showToast(
        `${payrollForm.teacherName}-এর ${payrollForm.month} ${payrollForm.year} মাসের বেতন ইতিমধ্যেই তৈরি করা আছে!`,
        'warning'
      );
      return;
    }

    const existing = editingPayrollId ? payrolls.find((p) => p.id === editingPayrollId) : null;
    const now = new Date();
    const monthIdx = Math.max(0, BANGLA_MONTHS.indexOf(payrollForm.month));
    const vNo =
      existing?.voucherNo ||
      `PR-${payrollForm.year}-${String(monthIdx + 1).padStart(2, '0')}-${String(
        Math.floor(100 + Math.random() * 900)
      )}`;
    const leaveDays = getStaffMonthlyApprovedLeaveDays(
      payrollForm.teacherId,
      payrollForm.teacherName,
      payrollForm.month,
      payrollForm.year
    );

    const record: PayrollRecord = {
      id: existing?.id || `PAY-${Date.now()}`,
      voucherNo: vNo,
      teacherId: payrollForm.teacherId,
      teacherName: payrollForm.teacherName.trim(),
      designation: payrollForm.designation.trim() || 'সহকারী শিক্ষক',
      staffCategory: payrollForm.staffCategory,
      month: payrollForm.month,
      year: Number(payrollForm.year),
      baseSalary: Number(payrollForm.baseSalary) || 0,
      allowances: Number(payrollForm.allowances) || 0,
      bonus: Number(payrollForm.bonus) || 0,
      deductions: calc.totalDeductions,
      pfDeduction: calc.pfDeduction,
      otherDeduction: calc.otherDeduction,
      approvedLeaveDays: leaveDays,
      netPayable: calc.netPayable,
      paidAmount: payrollForm.status === 'Paid' ? calc.netPayable : 0,
      status: payrollForm.status,
      paymentDate:
        payrollForm.status === 'Paid'
          ? existing?.paymentDate || now.toISOString().split('T')[0]
          : '',
      paymentMethod: payrollForm.paymentMethod,
      bankAccountId:
        payrollForm.paymentMethod === 'Bank Transfer' ? payrollForm.bankAccountId : undefined,
      trxId:
        payrollForm.status === 'Paid'
          ? payrollForm.trxId || existing?.trxId || `PAY-TRX-${Date.now().toString().slice(-5)}`
          : payrollForm.trxId,
      note: payrollForm.note,
    };

    financeService.savePayrollRecord(record);
    onRefreshAll();
    setShowPayrollModal(false);
    setEditingPayrollId(null);

    if (record.status === 'Paid') {
      showToast(`${record.teacherName}-এর বেতন সফলভাবে পরিশোধ ও লেজারে পোস্ট হয়েছে!`, 'success');
      onPrintSalarySlip(record);
    } else {
      showToast(`${record.teacherName}-এর বেতন শিট ড্রাফট (Pending) হিসেবে সংরক্ষিত হয়েছে।`, 'info');
    }
  };

  const handleGenerateMonthlySheet = () => {
    if (activeTeachers.length === 0) {
      showToast('HR তালিকায় কোনো সক্রিয় শিক্ষক/কর্মচারী নেই। আগে শিক্ষক যুক্ত করুন।', 'warning');
      return;
    }

    const res = buildMonthlyPayrollDrafts({
      teachers: activeTeachers,
      existingPayrolls: payrolls,
      month: sheetMonth,
      year: sheetYear,
      profiles: salaryProfiles,
      defaultBankAccountId: defaultBankId,
    });

    if (res.createdDrafts.length === 0) {
      if (res.skippedNoSalary > 0) {
        showToast(
          `${res.skippedNoSalary} জন শিক্ষক/স্টাফের মূল বেতন সেট করা নেই। আগে "বেতন কাঠামো" ট্যাবে মূল বেতন নির্ধারণ করুন।`,
          'warning'
        );
        setPayrollSubTab('structure');
      } else {
        showToast(`${sheetMonth} ${sheetYear} মাসের জন্য সকল শিক্ষকের বেতন শিট ইতিমধ্যেই তৈরি আছে।`, 'info');
      }
      return;
    }

    res.createdDrafts.forEach((draft) => {
      financeService.savePayrollRecord(draft);
    });
    onRefreshAll();

    const extraNote =
      res.skippedNoSalary > 0
        ? ` (${res.skippedNoSalary} জনের মূল বেতন সেট না থাকায় বাদ পড়েছে)`
        : res.skippedExisting > 0
          ? ` (${res.skippedExisting} জন আগে থেকেই তালিকায় ছিল)`
          : '';
    showToast(
      `${sheetMonth} ${sheetYear} মাসের ${res.createdDrafts.length} টি বেতন ড্রাফট তৈরি হয়েছে!${extraNote}`,
      'success'
    );
  };

  const handleDisburseSingle = async (pay: PayrollRecord) => {
    const ok = await confirmDialog({
      title: 'বেতন পরিশোধ নিশ্চিতকরণ',
      message: `${pay.teacherName} (${pay.month} ${pay.year})-এর নিট বেতন ৳${pay.netPayable.toLocaleString('bn-BD')} (${pay.paymentMethod}) পরিশোধ ও ডাবল-এন্ট্রি লেজারে পোস্ট করতে চান?`,
      confirmLabel: 'পরিশোধ করুন',
    });
    if (!ok) return;

    const updated = financeService.disbursePayrollRecord(pay.id);
    onRefreshAll();
    if (updated) {
      showToast(`${updated.teacherName}-এর বেতন পরিশোধ ও খতিয়ানে সিংক হয়েছে!`, 'success');
      onPrintSalarySlip(updated);
    }
  };

  const handleBulkDisburseMonth = async (pendingRows: PayrollRecord[]) => {
    if (pendingRows.length === 0) return;
    const totalAmt = pendingRows.reduce((s, p) => s + (Number(p.netPayable) || 0), 0);
    const ok = await confirmDialog({
      title: 'একসাথে সকল বকেয়া বেতন পরিশোধ',
      message: `${sheetMonth} ${sheetYear} মাসের ${pendingRows.length} জন শিক্ষক/কর্মচারীর মোট ৳${totalAmt.toLocaleString('bn-BD')} বেতন একসাথে পরিশোধ ও ডাবল-এন্ট্রি লেজারে পোস্ট করতে চান?`,
      confirmLabel: 'সব পরিশোধ করুন',
    });
    if (!ok) return;

    pendingRows.forEach((p) => {
      financeService.disbursePayrollRecord(p.id);
    });
    onRefreshAll();
    showToast(`${pendingRows.length} জনের মোট ৳${totalAmt.toLocaleString('bn-BD')} বেতন সফলভাবে পরিশোধ হয়েছে!`, 'success');
  };

  const openEditProfileModal = (t: TeacherRecord) => {
    setEditingProfileTeacher(t);
    setProfileForm(getEffectiveSalaryProfile(t, salaryProfiles));
  };

  const handleSaveSalaryProfileModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm) return;
    const updated = saveStaffSalaryProfile(profileForm);
    setSalaryProfiles({ ...updated });
    setEditingProfileTeacher(null);
    setProfileForm(null);
    showToast('বেতন কাঠামো সফলভাবে সংরক্ষিত হয়েছে!', 'success');
  };

  // ─── EXPENSE HANDLERS ────────────────────────────────────────────────
  const openNewExpenseModal = () => {
    setEditingExpenseId(null);
    setExpenseForm({
      category: EXPENSE_CATEGORIES[0],
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      paidTo: '',
      paymentMethod: 'Cash',
      bankAccountId: defaultBankId,
      note: '',
      recordedBy: 'হিসাবরক্ষক',
    });
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (exp: ExpenseRecord) => {
    setEditingExpenseId(exp.id);
    setExpenseForm({
      category: exp.category,
      amount: exp.amount,
      date: exp.date,
      paidTo: exp.paidTo,
      paymentMethod: exp.paymentMethod,
      bankAccountId: exp.bankAccountId || defaultBankId,
      note: exp.note || '',
      recordedBy: exp.recordedBy || 'হিসাবরক্ষক',
    });
    setShowExpenseModal(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expenseForm.amount) || 0;
    if (amt <= 0) {
      showToast('খরচের পরিমাণ ০ টাকার বেশি হতে হবে।', 'warning');
      return;
    }

    const existing = editingExpenseId ? expenses.find((x) => x.id === editingExpenseId) : null;
    const now = new Date();
    const vNo =
      existing?.voucherNo ||
      `VCH-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        Math.floor(100 + Math.random() * 900)
      )}`;

    const record: ExpenseRecord = {
      id: existing?.id || `EXP-${Date.now()}`,
      voucherNo: vNo,
      category: expenseForm.category,
      amount: amt,
      date: expenseForm.date || now.toISOString().split('T')[0],
      paidTo: expenseForm.paidTo.trim() || 'সংশ্লিষ্ট ব্যক্তি/প্রতিষ্ঠান',
      paymentMethod: expenseForm.paymentMethod,
      bankAccountId:
        expenseForm.paymentMethod === 'Bank Check' ? expenseForm.bankAccountId : undefined,
      note: expenseForm.note.trim(),
      recordedBy: expenseForm.recordedBy,
    };

    financeService.saveExpense(record);
    onRefreshAll();
    setShowExpenseModal(false);
    setEditingExpenseId(null);
    showToast(
      existing ? 'ব্যয় ভাউচার আপডেট ও লেজারে সিংক হয়েছে!' : 'নতুন ব্যয় ভাউচার সংরক্ষিত ও লেজারে পোস্ট হয়েছে!',
      'success'
    );
    if (!existing) onPrintExpenseSlip(record);
  };

  // ═════════════════════════════════════════════════════════════════════
  // TAB 1: INDEPENDENT STAFF PAYROLL STUDIO
  // ═════════════════════════════════════════════════════════════════════
  const renderPayrollTab = () => {
    const paidPayrolls = payrolls.filter((p) => p.status === 'Paid');
    const pendingPayrollsAll = payrolls.filter((p) => p.status === 'Pending');

    const totalNetPaid = paidPayrolls.reduce((s, p) => s + (Number(p.netPayable) || 0), 0);
    const totalPendingAmt = pendingPayrollsAll.reduce((s, p) => s + (Number(p.netPayable) || 0), 0);
    const totalPfAccum = paidPayrolls.reduce(
      (s, p) => s + (Number(p.pfDeduction !== undefined ? p.pfDeduction : p.deductions) || 0),
      0
    );

    const monthSheetRows = payrolls.filter(
      (p) => p.month === sheetMonth && Number(p.year) === Number(sheetYear)
    );
    const monthPendingRows = monthSheetRows.filter((p) => p.status === 'Pending');

    const filteredHistory = payrolls.filter((p) => {
      const matchMonth = payrollMonthFilter === 'all' || p.month === payrollMonthFilter;
      const matchStatus = payrollStatusFilter === 'all' || p.status === payrollStatusFilter;
      const q = payrollSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.teacherName && p.teacherName.toLowerCase().includes(q)) ||
        (p.designation && p.designation.toLowerCase().includes(q)) ||
        (p.voucherNo && p.voucherNo.toLowerCase().includes(q)) ||
        (p.teacherId && p.teacherId.toLowerCase().includes(q));
      return matchMonth && matchStatus && matchSearch;
    });

    const modalCalc = computePayrollBreakdown({
      baseSalary: payrollForm.baseSalary,
      allowances: payrollForm.allowances,
      bonus: payrollForm.bonus,
      pfDeduction: payrollForm.pfDeduction,
      otherDeduction: payrollForm.otherDeduction,
    });
    const modalLeaveDays = payrollForm.teacherId || payrollForm.teacherName
      ? getStaffMonthlyApprovedLeaveDays(
          payrollForm.teacherId,
          payrollForm.teacherName,
          payrollForm.month,
          payrollForm.year
        )
      : 0;

    return (
      <div className="space-y-4">
        <FinancePrintHeader
          schoolInfo={schoolInfo}
          title={`শিক্ষক ও কর্মচারী মাসিক বেতন-ভাতা শিট (${sheetMonth} ${sheetYear})`}
        />

        <FinanceSlimHeader
          title="শিক্ষক ও কর্মচারী পে-রোল"
          subtitle="HR শিক্ষক তালিকা ও ছুটির ডাটা থেকে অটো-সিংকড মাসিক বেতন কাঠামো, শিট জেনারেশন, PF কর্তন ও ডাবল-এন্ট্রি পোস্টিং"
          icon={<Banknote className="w-5 h-5" />}
          iconBg="bg-emerald-600"
          actions={
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>বেতন শিট প্রিন্ট</span>
              </button>
              <button
                type="button"
                onClick={() => openNewPayrollModal()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>একক বেতন এন্ট্রি</span>
              </button>
            </>
          }
        />

        {/* 4 Clean Contextual Payroll KPIs */}
        <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">মোট পরিশোধিত বেতন</p>
              <h4 className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ৳ {totalNetPaid.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">{paidPayrolls.length} টি ভাউচার (5010/5020)</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">বকেয়া / অনুমোদনাধীন</p>
              <h4 className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                ৳ {totalPendingAmt.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">{pendingPayrollsAll.length} টি পেন্ডিং শিট</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">প্রভিডেন্ট ফান্ড (PF)</p>
              <h4 className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                ৳ {totalPfAccum.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">COA দায় কোড: 2020</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">সক্রিয় শিক্ষক ও স্টাফ</p>
              <h4 className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {activeTeachers.length} জন
              </h4>
              <p className="text-[10px] text-slate-400">বেতন কাঠামো সেট: {configuredProfilesCount}/{activeTeachers.length}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        {/* 3 Clean Inline Sub-Tabs */}
        <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-1.5 flex flex-wrap gap-1 shadow-2xs">
          {(
            [
              { id: 'sheet', label: 'মাসিক বেতন শিট', icon: Layers, count: monthSheetRows.length },
              { id: 'structure', label: 'বেতন কাঠামো (Salary Structure)', icon: Sliders, count: activeTeachers.length },
              { id: 'history', label: 'বেতন ইতিহাস ও ভাউচার', icon: History, count: payrolls.length },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = payrollSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPayrollSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  active
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── SUB-TAB A: MONTHLY PAYROLL SHEET ─── */}
        {payrollSubTab === 'sheet' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs print:border-none print:p-0">
            <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500">বেতন মাস:</span>
                <select
                  value={sheetMonth}
                  onChange={(e) => setSheetMonth(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {MONTHS_LIST.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={sheetYear}
                  onChange={(e) => setSheetYear(Number(e.target.value) || currentYearNum)}
                  className="w-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateMonthlySheet}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>সকল শিক্ষকের শিট তৈরি করুন</span>
                </button>
                {monthPendingRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleBulkDisburseMonth(monthPendingRows)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>সব বকেয়া পরিশোধ ({monthPendingRows.length})</span>
                  </button>
                )}
              </div>
            </div>

            {monthSheetRows.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Banknote className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {sheetMonth} {sheetYear} মাসের কোনো বেতন শিট তৈরি হয়নি
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    আগে &quot;বেতন কাঠামো&quot; ট্যাবে শিক্ষক/কর্মচারীদের মূল বেতন নির্ধারণ করুন, তারপর উপরের &quot;সকল শিক্ষকের শিট তৈরি করুন&quot; বাটনে ১ ক্লিক করলেই পুরো মাসের শিট প্রস্তুত হয়ে যাবে।
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPayrollSubTab('structure')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    বেতন কাঠামো সেট করুন
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateMonthlySheet}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
                  >
                    শিট তৈরি করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse print:text-black">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                      <th className="p-3">শিক্ষক / কর্মচারী</th>
                      <th className="p-3">খাত ও ছুটি</th>
                      <th className="p-3 text-right">মূল বেতন</th>
                      <th className="p-3 text-right text-emerald-700 dark:text-emerald-400">ভাতা ও বোনাস</th>
                      <th className="p-3 text-right text-rose-700 dark:text-rose-400">কর্তন (PF/অন্য)</th>
                      <th className="p-3 text-right font-black">নিট বেতন</th>
                      <th className="p-3">অবস্থা</th>
                      <th className="p-3 text-right print:hidden">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {monthSheetRows.map((pay) => {
                      const liveLeaves =
                        pay.approvedLeaveDays ??
                        getStaffMonthlyApprovedLeaveDays(pay.teacherId, pay.teacherName, pay.month, pay.year);
                      const isStaff = pay.staffCategory === 'staff';
                      return (
                        <tr key={pay.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-3">
                            <div className="font-black text-slate-900 dark:text-white print:text-black">{pay.teacherName}</div>
                            <div className="text-[10.5px] text-slate-500">{pay.designation} · {pay.voucherNo}</div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap items-center gap-1">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isStaff
                                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                                }`}
                              >
                                {isStaff ? 'স্টাফ (5020)' : 'শিক্ষক (5010)'}
                              </span>
                              {liveLeaves > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                  ছুটি: {liveLeaves} দিন
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold">৳ {pay.baseSalary.toLocaleString('bn-BD')}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            + ৳ {(pay.allowances + pay.bonus).toLocaleString('bn-BD')}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                            - ৳ {pay.deductions.toLocaleString('bn-BD')}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                            ৳ {pay.netPayable.toLocaleString('bn-BD')}
                          </td>
                          <td className="p-3">
                            {pay.status === 'Paid' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-black border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> পরিশোধিত ({pay.paymentMethod})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10.5px] font-black border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3 h-3" /> বকেয়া (Pending)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right print:hidden">
                            <div className="flex items-center justify-end gap-1.5">
                              {pay.status === 'Pending' ? (
                                <button
                                  type="button"
                                  onClick={() => handleDisburseSingle(pay)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] cursor-pointer"
                                >
                                  পরিশোধ করুন
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onPrintSalarySlip(pay)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                                >
                                  পে-স্লিপ
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditPayrollModal(pay)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                                title="সংশোধন করুন"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (
                                    await confirmDialog({
                                      title: 'পে-রোল রেকর্ড মুছুন',
                                      message: `'${pay.teacherName}'-এর পে-রোল রেকর্ড (এবং সংশ্লিষ্ট ভাউচার/লেজার এন্ট্রি) মুছে ফেলতে চান?`,
                                      confirmLabel: 'মুছে ফেলুন',
                                      danger: true,
                                    })
                                  ) {
                                    financeService.deletePayrollRecord(pay.id);
                                    onRefreshAll();
                                    showToast('পে-রোল রেকর্ড ও সংশ্লিষ্ট খতিয়ান এন্ট্রি মুছে ফেলা হয়েছে।', 'info');
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                                title="মুছুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <FinancePrintSignatureBlock labels={['হিসাবরক্ষকের স্বাক্ষর', 'অর্থ কমিটি আহ্বায়ক', 'প্রধান শিক্ষক']} />
          </div>
        )}

        {/* ─── SUB-TAB B: STAFF SALARY STRUCTURE (HR SYNCED) ─── */}
        {payrollSubTab === 'structure' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  শিক্ষক ও কর্মচারী মাসিক বেতন কাঠামো (HR ডিরেক্টরি থেকে অটো-সিংকড)
                </h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                  একবার মূল বেতন, বাড়িভাড়া, চিকিৎসা ভাতা ও PF % নির্ধারণ করলে প্রতি মাসে ১ ক্লিকে পুরো বেতন শিট তৈরি হবে।
                </p>
              </div>
              <Link
                href="/dashboard/teacher/"
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0"
              >
                শিক্ষক তালিকা ম্যানেজ করুন →
              </Link>
            </div>

            {activeTeachers.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  এখনো কোনো শিক্ষক বা কর্মচারী নিবন্ধিত নেই
                </p>
                <Link
                  href="/dashboard/teacher/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black"
                >
                  শিক্ষক ও স্টাফ যুক্ত করুন →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">নাম ও পদবি</th>
                      <th className="p-3">অ্যাকাউন্ট খাত</th>
                      <th className="p-3 text-right">মূল বেতন</th>
                      <th className="p-3 text-right">মোট ভাতা</th>
                      <th className="p-3 text-right">PF কর্তন</th>
                      <th className="p-3 text-right font-black">মাসিক নিট</th>
                      <th className="p-3">ডিফল্ট মাধ্যম</th>
                      <th className="p-3 text-right">সেটআপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeTeachers.map((t) => {
                      const prof = getEffectiveSalaryProfile(t, salaryProfiles);
                      const allowances = prof.houseRent + prof.medicalAllowance + prof.otherAllowance;
                      const pfAmt = Math.round((prof.baseSalary * (prof.pfPercent || 0)) / 100);
                      const net = Math.max(0, prof.baseSalary + allowances - pfAmt);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-3">
                            <div className="font-black text-slate-900 dark:text-white">{t.name}</div>
                            <div className="text-[10.5px] text-slate-500">{t.designation} · {t.phone}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10.5px] font-bold">
                              {prof.staffCategory === 'staff' ? 'অফিস স্টাফ (5020)' : 'শিক্ষক (5010)'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold">
                            {prof.baseSalary > 0 ? (
                              `৳ ${prof.baseSalary.toLocaleString('bn-BD')}`
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400">সেট হয়নি</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            ৳ {allowances.toLocaleString('bn-BD')}
                          </td>
                          <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                            {prof.pfPercent}% (৳{pfAmt.toLocaleString('bn-BD')})
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                            ৳ {net.toLocaleString('bn-BD')}
                          </td>
                          <td className="p-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            {prof.defaultPaymentMethod}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => openEditProfileModal(t)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-black border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                            >
                              {prof.baseSalary > 0 ? 'পরিবর্তন করুন' : '+ বেতন সেট করুন'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── SUB-TAB C: PAYROLL ARCHIVE & HISTORY ─── */}
        {payrollSubTab === 'history' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="শিক্ষক নাম, পদবি বা ভাউচার নং খুঁজুন..."
                  value={payrollSearch}
                  onChange={(e) => setPayrollSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={payrollMonthFilter}
                  onChange={(e) => setPayrollMonthFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="all">সকল মাস ({payrolls.length})</option>
                  {MONTHS_LIST.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={payrollStatusFilter}
                  onChange={(e) => setPayrollStatusFilter(e.target.value as 'all' | 'Paid' | 'Pending')}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="all">সকল অবস্থা</option>
                  <option value="Paid">পরিশোধিত (Paid)</option>
                  <option value="Pending">বকেয়া (Pending)</option>
                </select>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">কোনো পে-রোল রেকর্ড পাওয়া যায়নি।</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">ভাউচার নং ও তারিখ</th>
                      <th className="p-3">শিক্ষক/স্টাফ</th>
                      <th className="p-3">মাস ও বছর</th>
                      <th className="p-3 text-right">মূল বেতন</th>
                      <th className="p-3 text-right">ভাতা/বোনাস</th>
                      <th className="p-3 text-right">কর্তন</th>
                      <th className="p-3 text-right font-black">নিট পরিশোধ</th>
                      <th className="p-3">অবস্থা</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredHistory.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <span className="font-mono font-bold text-sky-700 dark:text-sky-400 block">{pay.voucherNo}</span>
                          <span className="text-[10px] text-slate-400">{pay.paymentDate || 'অপরিশোধিত'}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{pay.teacherName}</div>
                          <div className="text-[10.5px] text-slate-500">{pay.designation}</div>
                        </td>
                        <td className="p-3 font-semibold">{pay.month} {pay.year}</td>
                        <td className="p-3 text-right font-mono font-bold">৳ {pay.baseSalary.toLocaleString('bn-BD')}</td>
                        <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          + ৳ {(pay.allowances + pay.bonus).toLocaleString('bn-BD')}
                        </td>
                        <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                          - ৳ {pay.deductions.toLocaleString('bn-BD')}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-300">
                          ৳ {pay.netPayable.toLocaleString('bn-BD')}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              pay.status === 'Paid'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {pay.status === 'Paid' ? pay.paymentMethod : 'Pending'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pay.status === 'Pending' ? (
                              <button
                                type="button"
                                onClick={() => handleDisburseSingle(pay)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                              >
                                পরিশোধ
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onPrintSalarySlip(pay)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] cursor-pointer"
                              >
                                স্যালারি স্লিপ
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                if (
                                  await confirmDialog({
                                    title: 'পে-রোল রেকর্ড মুছুন',
                                    message: `'${pay.teacherName}'-এর পে-রোল রেকর্ড মুছে ফেলতে চান?`,
                                    confirmLabel: 'মুছে ফেলুন',
                                    danger: true,
                                  })
                                ) {
                                  financeService.deletePayrollRecord(pay.id);
                                  onRefreshAll();
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
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
        )}

        {/* ─── PAYROLL ADD / EDIT MODAL ─── */}
        {showPayrollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-500" />
                  {editingPayrollId ? 'পে-রোল রেকর্ড সংশোধন' : 'নতুন বেতন ভাউচার এন্ট্রি'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePayroll} className="space-y-3">
                {teachersList.length > 0 && !editingPayrollId && (
                  <div>
                    <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                      HR তালিকা থেকে নির্বাচন করুন (বেতন কাঠামো অটো-ফিল হবে)
                    </label>
                    <select
                      value={payrollForm.teacherId}
                      onChange={(e) => handleSelectTeacherInModal(e.target.value)}
                      className="w-full bg-emerald-50/50 dark:bg-slate-950 border border-emerald-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">-- শিক্ষক/কর্মচারী নির্বাচন করুন --</option>
                      {activeTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.designation || 'শিক্ষক'} • ID: {t.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {modalLeaveDays > 0 && (
                  <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {payrollForm.month} {payrollForm.year} মাসে অনুমোদিত ছুটি রয়েছে: <strong>{modalLeaveDays} দিন</strong> (Leave ড্যাশবোর্ড থেকে সিংকড)
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">নাম *</label>
                    <input
                      type="text"
                      value={payrollForm.teacherName}
                      onChange={(e) => setPayrollForm({ ...payrollForm, teacherName: e.target.value })}
                      placeholder="শিক্ষক/কর্মচারীর নাম"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">পদবি</label>
                    <input
                      type="text"
                      value={payrollForm.designation}
                      onChange={(e) => setPayrollForm({ ...payrollForm, designation: e.target.value })}
                      placeholder="যেমন: সহকারী শিক্ষক"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">মাস</label>
                    <select
                      value={payrollForm.month}
                      onChange={(e) => setPayrollForm({ ...payrollForm, month: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {MONTHS_LIST.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">বছর</label>
                    <input
                      type="number"
                      value={payrollForm.year}
                      onChange={(e) => setPayrollForm({ ...payrollForm, year: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">COA খাত</label>
                    <select
                      value={payrollForm.staffCategory}
                      onChange={(e) => setPayrollForm({ ...payrollForm, staffCategory: e.target.value as StaffCategory })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="teacher">শিক্ষক (5010)</option>
                      <option value="staff">স্টাফ (5020)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">মূল বেতন *</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.baseSalary || ''}
                      placeholder="0"
                      onChange={(e) => setPayrollForm({ ...payrollForm, baseSalary: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">ভাতা</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.allowances || ''}
                      placeholder="0"
                      onChange={(e) => setPayrollForm({ ...payrollForm, allowances: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">বোনাস</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.bonus || ''}
                      placeholder="0"
                      onChange={(e) => setPayrollForm({ ...payrollForm, bonus: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-sky-600 dark:text-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">PF (2020)</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.pfDeduction || ''}
                      placeholder="0"
                      onChange={(e) => setPayrollForm({ ...payrollForm, pfDeduction: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-rose-600 dark:text-rose-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">অন্য কর্তন</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.otherDeduction || ''}
                      placeholder="0"
                      onChange={(e) => setPayrollForm({ ...payrollForm, otherDeduction: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">পরিশোধের মাধ্যম</label>
                    <select
                      value={payrollForm.paymentMethod}
                      onChange={(e) =>
                        setPayrollForm({
                          ...payrollForm,
                          paymentMethod: e.target.value as PayrollRecord['paymentMethod'],
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Bank Transfer">ব্যাংক ট্রান্সফার</option>
                      <option value="Cash">নগদ ক্যাশ</option>
                      <option value="bKash">বিকাশ (bKash)</option>
                      <option value="Nagad">নগদ (Nagad)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">স্ট্যাটাস</label>
                    <select
                      value={payrollForm.status}
                      onChange={(e) => setPayrollForm({ ...payrollForm, status: e.target.value as 'Paid' | 'Pending' })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Paid">এখনই পরিশোধ (Paid &amp; Post)</option>
                      <option value="Pending">ড্রাফট রাখুন (Pending)</option>
                    </select>
                  </div>
                </div>

                {payrollForm.paymentMethod === 'Bank Transfer' && bankAccounts.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">ব্যাংক হিসাব নির্বাচন</label>
                    <select
                      value={payrollForm.bankAccountId}
                      onChange={(e) => setPayrollForm({ ...payrollForm, bankAccountId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} ({b.accountCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                      {currentLang === 'en' ? 'Net Payable Salary:' : 'নিট প্রদেয় বেতন:'}
                    </span>
                    {!modalCalc.valid && modalCalc.error && (
                      <span className="text-[10.5px] font-bold text-rose-600">{modalCalc.error}</span>
                    )}
                  </div>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ৳ {modalCalc.netPayable.toLocaleString('bn-BD')}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayrollModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={!modalCalc.valid}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer disabled:opacity-50"
                  >
                    {payrollForm.status === 'Paid' ? 'পরিশোধ ও লেজার পোস্টিং' : 'ড্রাফট সংরক্ষণ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── SALARY PROFILE STRUCTURE MODAL ─── */}
        {editingProfileTeacher && profileForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{editingProfileTeacher.name}</h3>
                  <p className="text-[11px] text-slate-500">{editingProfileTeacher.designation} · মাসিক বেতন কাঠামো</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfileTeacher(null);
                    setProfileForm(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSalaryProfileModal} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">COA ক্যাটাগরি</label>
                    <select
                      value={profileForm.staffCategory}
                      onChange={(e) => setProfileForm({ ...profileForm, staffCategory: e.target.value as StaffCategory })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="teacher">শিক্ষক (5010)</option>
                      <option value="staff">অফিস স্টাফ (5020)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">মূল বেতন (৳) *</label>
                    <input
                      type="number"
                      min="0"
                      value={profileForm.baseSalary || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, baseSalary: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">বাড়িভাড়া (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={profileForm.houseRent || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, houseRent: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">চিকিৎসা (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={profileForm.medicalAllowance || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, medicalAllowance: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">PF (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={profileForm.pfPercent || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, pfPercent: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">ডিফল্ট মাধ্যম</label>
                    <select
                      value={profileForm.defaultPaymentMethod}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          defaultPaymentMethod: e.target.value as PayrollRecord['paymentMethod'],
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value="Bank Transfer">ব্যাংক ট্রান্সফার</option>
                      <option value="Cash">নগদ ক্যাশ</option>
                      <option value="bKash">বিকাশ</option>
                      <option value="Nagad">নগদ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">অন্যান্য ভাতা (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={profileForm.otherAllowance || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, otherAllowance: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfileTeacher(null);
                      setProfileForm(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> কাঠামো সংরক্ষণ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════════
  // TAB 2: INDEPENDENT EXPENSE RECORDS WORKSPACE
  // ═════════════════════════════════════════════════════════════════════
  const renderExpensesTab = () => {
    const todayIso = new Date().toISOString().split('T')[0];

    const filteredExpenses = expenses.filter((exp) => {
      const matchCat = expenseCategoryFilter === 'all' || exp.category === expenseCategoryFilter;
      const matchMethod = expenseMethodFilter === 'all' || exp.paymentMethod === expenseMethodFilter;
      const matchFrom = !expenseFromDate || exp.date >= expenseFromDate;
      const matchTo = !expenseToDate || exp.date <= expenseToDate;
      const q = expenseSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (exp.voucherNo && exp.voucherNo.toLowerCase().includes(q)) ||
        (exp.paidTo && exp.paidTo.toLowerCase().includes(q)) ||
        (exp.note && exp.note.toLowerCase().includes(q)) ||
        (exp.category && exp.category.toLowerCase().includes(q));
      return matchCat && matchMethod && matchFrom && matchTo && matchSearch;
    });

    const totalExpenseSum = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const todayExpenseSum = expenses
      .filter((e) => e.date === todayIso)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const cashExpenseSum = filteredExpenses
      .filter((e) => e.paymentMethod === 'Cash')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const digitalBankExpenseSum = totalExpenseSum - cashExpenseSum;

    return (
      <div className="space-y-4">
        <FinancePrintHeader
          schoolInfo={schoolInfo}
          title="দৈনন্দিন পরিচালন ব্যয় ও ভাউচার খতিয়ান রেজিস্টার"
        />

        <FinanceSlimHeader
          title="ব্যয় ও খরচসমূহ"
          subtitle="বিদ্যুৎ বিল, স্টেশনারি, প্রিন্টিং, ল্যাব, মেরামত ও অফিস ব্যয়ের ডাবল-এন্ট্রি ভাউচার ও জেনারেল লেজার অটো-সিংক"
          icon={<Receipt className="w-5 h-5" />}
          iconBg="bg-rose-600"
          actions={
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>ব্যয় খতিয়ান প্রিন্ট</span>
              </button>
              <button
                type="button"
                onClick={openNewExpenseModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন খরচ এন্ট্রি</span>
              </button>
            </>
          }
        />

        <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">মোট ব্যয় (ফিল্টারকৃত)</p>
              <h4 className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                ৳ {totalExpenseSum.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">{filteredExpenses.length} টি ভাউচার</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">আজকের দৈনিক খরচ</p>
              <h4 className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                ৳ {todayExpenseSum.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">তারিখ: {todayIso}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">নগদ ক্যাশ ব্যয়</p>
              <h4 className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ৳ {cashExpenseSum.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">ক্যাশ ড্রয়ার (1010)</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Banknote className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ব্যাংক ও মোবাইল পেমেন্ট</p>
              <h4 className="text-lg font-black font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                ৳ {digitalBankExpenseSum.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">চেক, বিকাশ ও নগদ</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Landmark className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-2xl p-4 sm:p-5 space-y-4 print:border-none print:p-0">
          <div className="print:hidden flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ভাউচার নং, প্রাপক বা বিবরণ খুঁজুন..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={expenseFromDate}
                onChange={(e) => setExpenseFromDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                title="শুরুর তারিখ"
              />
              <input
                type="date"
                value={expenseToDate}
                onChange={(e) => setExpenseToDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                title="শেষ তারিখ"
              />
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
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
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="all">সকল মাধ্যম</option>
                <option value="Cash">নগদ ক্যাশ</option>
                <option value="Bank Check">ব্যাংক চেক</option>
                <option value="bKash">বিকাশ</option>
                <option value="Nagad">নগদ</option>
              </select>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
                <Receipt className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">কোনো ব্যয়ের ভাউচার রেকর্ড নেই</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  বিদ্যালয়ের দৈনন্দিন খরচ এন্ট্রি করলে তা স্বয়ংক্রিয়ভাবে ক্যাশবুক, ব্যাংক হিসাব, জেনারেল লেজার ও আয়-ব্যয় বিবরণীতে যুক্ত হবে।
                </p>
              </div>
              <button
                type="button"
                onClick={openNewExpenseModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer"
              >
                <Plus className="w-4 h-4" /> নতুন খরচ এন্ট্রি করুন
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse print:text-black">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                    <th className="p-3">ভাউচার নং</th>
                    <th className="p-3">ব্যয় খাত</th>
                    <th className="p-3">প্রাপক ও বিবরণ</th>
                    <th className="p-3 text-right">পরিমাণ (টাকা)</th>
                    <th className="p-3">মাধ্যম</th>
                    <th className="p-3">তারিখ</th>
                    <th className="p-3 text-right print:hidden">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">
                        {exp.voucherNo}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">{exp.category}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{exp.paidTo}</div>
                        <div className="text-[11px] text-slate-500">{exp.note || 'নিয়মিত পরিচালন ব্যয়'}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 print:text-black">
                        ৳ {Number(exp.amount).toLocaleString('bn-BD')}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 font-mono">{exp.date}</td>
                      <td className="p-3 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintExpenseSlip(exp)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                          >
                            ভাউচার স্লিপ
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditExpenseModal(exp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="সংশোধন করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                await confirmDialog({
                                  title: 'ব্যয় ভাউচার মুছুন',
                                  message: `ভাউচার #${exp.voucherNo} (৳${exp.amount}) এবং এর জেনারেল লেজার এন্ট্রি মুছে ফেলতে চান?`,
                                  confirmLabel: 'মুছে ফেলুন',
                                  danger: true,
                                })
                              ) {
                                financeService.deleteExpense(exp.id);
                                onRefreshAll();
                                showToast('ব্যয় ভাউচার ও সংশ্লিষ্ট লেজার এন্ট্রি মুছে ফেলা হয়েছে।', 'info');
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="মুছুন"
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

        {/* ─── ADD / EDIT EXPENSE MODAL ─── */}
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-500" />
                  {editingExpenseId ? 'ব্যয় ভাউচার সংশোধন' : 'নতুন বিদ্যালয় ব্যয় ভাউচার'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">ব্যয় খাত</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">টাকার পরিমাণ *</label>
                    <input
                      type="number"
                      min="1"
                      value={expenseForm.amount || ''}
                      placeholder="0"
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">তারিখ</label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">প্রাপক / ভেন্ডরের নাম *</label>
                  <input
                    type="text"
                    placeholder="যেমন: পল্লী বিদ্যুৎ সমিতি / পেপার হাউস"
                    value={expenseForm.paidTo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">পরিশোধ মাধ্যম</label>
                    <select
                      value={expenseForm.paymentMethod}
                      onChange={(e) =>
                        setExpenseForm({
                          ...expenseForm,
                          paymentMethod: e.target.value as ExpenseRecord['paymentMethod'],
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Cash">নগদ ক্যাশ (Cash)</option>
                      <option value="bKash">বিকাশ (bKash)</option>
                      <option value="Nagad">নগদ (Nagad)</option>
                      <option value="Bank Check">ব্যাংক চেক</option>
                    </select>
                  </div>
                  {expenseForm.paymentMethod === 'Bank Check' && bankAccounts.length > 0 && (
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">ব্যাংক হিসাব</label>
                      <select
                        value={expenseForm.bankAccountId}
                        onChange={(e) => setExpenseForm({ ...expenseForm, bankAccountId: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        {bankAccounts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} ({b.accountCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">খরচের বিবরণ / নোট</label>
                  <input
                    type="text"
                    placeholder="সংক্ষিপ্ত বিবরণ..."
                    value={expenseForm.note}
                    onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer"
                  >
                    {editingExpenseId ? 'আপডেট করুন' : 'খরচ সংরক্ষণ ও পোস্টিং'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return activeTab === 'payroll' ? renderPayrollTab() : renderExpensesTab();
}
