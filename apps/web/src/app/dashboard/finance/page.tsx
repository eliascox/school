'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Wallet, Users, Receipt, Building2, Landmark,
  TrendingUp, TrendingDown, Calculator, Plus, Printer, Settings,
  BookOpen, CreditCard, Smartphone,
  AlertCircle, FileText, History, BarChart3, ShieldCheck
} from 'lucide-react';
import {
  financeService,
  FeeSector,
  AccountHead,
  VoucherType,
  VoucherRecord,
  PayrollRecord,
  ExpenseRecord,
  BankAccount,
  WaiverRecord,
  RefundRecord,
  StudentFeeLedger,
  FinanceSettings,
  FeeInvoice,
  FeeCollectionStats
} from '@/services/financeService';
import { studentService, Student } from '@/services/studentService';
import { settingsService } from '@/services/settingsService';
import { languageService, AppLanguage } from '@/services/languageService';
import { teacherRBACService, TeacherRecord } from '@/services/teacherRBACService';
import { teacherAuthService } from '@/services/teacherAuthService';
import {
  FinanceTab,
  FeeSubTab,
  PaymentRecord,
  SchoolInfoState,
  AuditLogEntry,
  getFinanceMainModules
} from '@/components/finance/financeShared';
import { StudentFeesCollectionTab } from '@/components/finance/StudentFeesCollectionTab';
import { StudentFeesInvoicesTab } from '@/components/finance/StudentFeesInvoicesTab';
import { StudentFeesSetupTab } from '@/components/finance/StudentFeesSetupTab';
import { StudentFeesOpeningDueTab } from '@/components/finance/StudentFeesOpeningDueTab';
import { StudentFeesReportsAndLogsTabs } from '@/components/finance/StudentFeesReportsAndLogsTabs';
import { PayrollAndExpensesTabs } from '@/components/finance/PayrollAndExpensesTabs';
import { CashBankAndWaiversTabs } from '@/components/finance/CashBankAndWaiversTabs';
import { FinanceReportsTab } from '@/components/finance/FinanceReportsTab';
import { FinanceModalsAndPrints } from '@/components/finance/FinanceModalsAndPrints';

const VALID_TABS: FinanceTab[] = [
  'student_fees',
  'payroll',
  'expenses',
  'cash_bank',
  'waivers_refunds',
  'reports'
];

const FEE_SUB_TABS: { id: FeeSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'collection', label: 'ফি আদায়', icon: Wallet },
  { id: 'invoices', label: 'মাসিক ইনভয়েস ও বিল', icon: FileText },
  { id: 'fee_setup', label: 'ফি সেটআপ ও খাত', icon: Settings },
  { id: 'opening_due', label: 'পূর্বের বকেয়া (Opening Due)', icon: AlertCircle },
  { id: 'due_report', label: 'বকেয়া রিপোর্ট', icon: Users },
  { id: 'history', label: 'রিসিপ্ট ও হিস্টোরি', icon: History },
  { id: 'monthly_analysis', label: 'মাসভিত্তিক বিশ্লেষণ', icon: BarChart3 },
  { id: 'audit_log', label: 'অডিট লগ', icon: ShieldCheck }
];

const DEFAULT_SCHOOL_INFO: SchoolInfoState = {
  nameBn: 'শিক্ষা প্রতিষ্ঠান',
  eiin: '',
  address: '',
  established: '',
  session: String(new Date().getFullYear())
};

function FinanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') as FinanceTab | null;

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<FinanceTab>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'student_fees'
  );
  const [feeSubTab, setFeeSubTab] = useState<FeeSubTab>('collection');
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');

  const [students, setStudents] = useState<Student[]>([]);
  const [teachersList, setTeachersList] = useState<{ id: string; name: string; designation?: string }[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfoState>(DEFAULT_SCHOOL_INFO);
  const [classFees, setClassFees] = useState<{ [grade: string]: { [secId: string]: number } }>({});
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [waivers, setWaivers] = useState<WaiverRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<AccountHead[]>([]);
  const [allStudentLedgers, setAllStudentLedgers] = useState<Record<string, StudentFeeLedger>>({});
  const [feeSectors, setFeeSectors] = useState<FeeSector[]>([]);
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings>(() => financeService.getFinanceSettings());
  const [goLiveStartYear, setGoLiveStartYear] = useState<number>(new Date().getFullYear());
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectionNonce, setSelectionNonce] = useState(0);

  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherDefaultType, setVoucherDefaultType] = useState<VoucherType>('Journal');
  const [printReceiptData, setPrintReceiptData] = useState<PaymentRecord | null>(null);
  const [printExpenseSlip, setPrintExpenseSlip] = useState<ExpenseRecord | null>(null);
  const [printSalarySlip, setPrintSalarySlip] = useState<PayrollRecord | null>(null);
  const [printVoucherData, setPrintVoucherData] = useState<VoucherRecord | null>(null);

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const sess = teacherAuthService.getSession();
    if (sess && sess.role === 'teacher') {
      router.replace('/dashboard/teacher-portal');
    }
  }, [router]);

  const loadAllData = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const loadedStudents = studentService.getAllStudents();
      setStudents(loadedStudents);

      const loadedTeachers: TeacherRecord[] = teacherRBACService.getTeachers();
      setTeachersList(
        loadedTeachers.map((t) => ({ id: t.id, name: t.name, designation: t.designation }))
      );

      const settings = settingsService.getSettings();
      let storedSchool: Partial<SchoolInfoState> = {};
      try {
        const rawSettings = localStorage.getItem('sms_school_settings');
        if (rawSettings) storedSchool = JSON.parse(rawSettings);
      } catch {
        // Ignore malformed local settings JSON
      }
      setSchoolInfo({
        nameBn: settings.schoolName || storedSchool.nameBn || DEFAULT_SCHOOL_INFO.nameBn,
        eiin: settings.eiin || storedSchool.eiin || DEFAULT_SCHOOL_INFO.eiin,
        address: settings.address || storedSchool.address || DEFAULT_SCHOOL_INFO.address,
        established: settings.estdYear || storedSchool.established || DEFAULT_SCHOOL_INFO.established,
        session: storedSchool.session || DEFAULT_SCHOOL_INFO.session
      });

      setClassFees(financeService.getClassFeesConfig());
      setPayrolls(financeService.getPayrollRecords());
      setExpenses(financeService.getExpenses());
      setBankAccounts(financeService.getBankAccounts());
      setWaivers(financeService.getWaivers());
      setRefunds(financeService.getRefunds());
      setVouchers(financeService.getVouchers());
      setChartOfAccounts(financeService.getChartOfAccounts());
      setAllStudentLedgers(financeService.getAllStudentLedgers());
      setFeeSectors(financeService.getFeeSectors());
      const fSettings = financeService.getFinanceSettings();
      setFinanceSettings(fSettings);
      setGoLiveStartYear(fSettings.systemStartYear || new Date().getFullYear());
      setInvoices(financeService.getInvoices());

      try {
        const rawAudit = localStorage.getItem('sms_finance_audit_log');
        setAuditLogs(rawAudit ? JSON.parse(rawAudit) : []);
      } catch {
        setAuditLogs([]);
      }

      try {
        const demoCleared = localStorage.getItem('sms_demo_cleared') === 'true';
        const rawHistory = localStorage.getItem('sms_payment_history');
        const parsedHistory: PaymentRecord[] = rawHistory ? JSON.parse(rawHistory) : [];
        const filteredHistory = demoCleared
          ? parsedHistory.filter((p) => !String(p.receiptId || '').startsWith('REC-DEMO'))
          : parsedHistory;
        setPaymentHistory(filteredHistory);
      } catch {
        setPaymentHistory([]);
      }
    } catch {
      // Fail gracefully in SSR or restricted storage contexts
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setCurrentLang(languageService.getLanguage());
    loadAllData();

    const unsubFinance = financeService.subscribe(() => loadAllData());
    const unsubLang = languageService.subscribe((lang: AppLanguage) => setCurrentLang(lang));
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('sms_')) loadAllData();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubFinance();
      unsubLang();
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadAllData]);

  const handleTabChange = (tab: FinanceTab) => {
    setActiveTab(tab);
    router.replace(`/dashboard/finance?tab=${tab}`, { scroll: false });
  };

  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    setSelectionNonce((n) => n + 1);
  };

  const feeStats: FeeCollectionStats = useMemo(() => {
    void allStudentLedgers;
    return financeService.getFeeCollectionStats(paymentHistory);
  }, [paymentHistory, allStudentLedgers]);

  const incomeStatement = useMemo(() => {
    void vouchers;
    void chartOfAccounts;
    return financeService.getIncomeStatement();
  }, [vouchers, chartOfAccounts]);

  const cashBook = useMemo(() => {
    void vouchers;
    void chartOfAccounts;
    return financeService.getCashBook();
  }, [vouchers, chartOfAccounts]);

  const cashInHand = cashBook.closingBalance;
  const totalBankBalance = useMemo(
    () => bankAccounts.reduce((s, b) => s + (b.balance || 0), 0),
    [bankAccounts]
  );

  const modules = useMemo(
    () =>
      getFinanceMainModules({
        totalDueAll: feeStats.totalDueAll,
        payrollCount: payrolls.length,
        expenseCount: expenses.length,
        bankCount: bankAccounts.length,
        waiverCount: waivers.length + refunds.length
      }),
    [feeStats.totalDueAll, payrolls.length, expenses.length, bankAccounts.length, waivers.length, refunds.length]
  );

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const isPrintModalOpen = Boolean(printReceiptData || printSalarySlip || printExpenseSlip || printVoucherData);
  const netSurplus = incomeStatement.totalIncome - incomeStatement.totalExpense;

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.5in;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          aside, header, nav, .print\\:hidden, button, input, select {
            display: none !important;
          }
          .landscape-print {
            size: A4 landscape;
          }
          #print-area {
            display: block !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #print-area table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          #print-area th, #print-area td {
            border: 1px solid #000000 !important;
            padding: 6px !important;
          }
        }
      `}</style>

      <div className={`max-w-7xl mx-auto space-y-4 ${isPrintModalOpen ? 'print:hidden' : ''}`}>
        {/* Executive Header & Actions */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-800/40 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <Landmark className="w-4 h-4" />
                <span>ডাবল-এন্ট্রি ফাইন্যান্সিয়াল অ্যাকাউন্টিং স্যুট</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold mt-1">{schoolInfo.nameBn} — অর্থ ও হিসাব ব্যবস্থাপনা</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                স্বয়ংক্রিয় লেজার, ইনভয়েস, বেতন, ব্যয়, ব্যাংক সমন্বয় ও আর্থিক বিবরণী (EIIN: {schoolInfo.eiin})
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => router.push('/dashboard/ledger')}
                className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/15 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span>শ্রেণিভিত্তিক আয়-ব্যয় খতিয়ান</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setVoucherDefaultType('Journal');
                  setShowVoucherModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ভাউচার এন্ট্রি</span>
              </button>
            </div>
          </div>

          {/* 5 Top Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span>মোট রাজস্ব আয়</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-lg font-bold mt-1">৳{incomeStatement.totalIncome.toLocaleString('bn-BD')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between text-xs text-rose-200">
                <span>মোট পরিচালন ব্যয়</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="text-lg font-bold mt-1">৳{incomeStatement.totalExpense.toLocaleString('bn-BD')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between text-xs text-sky-200">
                <span>নিট উদ্বৃত্ত</span>
                <Calculator className="w-4 h-4" />
              </div>
              <div className={`text-lg font-bold mt-1 ${netSurplus < 0 ? 'text-rose-300' : 'text-white'}`}>
                ৳{netSurplus.toLocaleString('bn-BD')}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between text-xs text-amber-200">
                <span>হাতে নগদ ও ব্যাংক</span>
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-lg font-bold mt-1">৳{(cashInHand + totalBankBalance).toLocaleString('bn-BD')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-xs text-orange-200">
                <span>শিক্ষার্থী মোট বকেয়া</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-lg font-bold mt-1 text-amber-300">৳{feeStats.totalDueAll.toLocaleString('bn-BD')}</div>
            </div>
          </div>
        </div>

        {/* 6 Main Module Navigation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 print:hidden">
          {modules.map((mod) => {
            const isActive = activeTab === mod.id;
            const ModIcon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleTabChange(mod.id)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <ModIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{mod.label}</span>
                  </span>
                  {mod.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {mod.badge}
                    </span>
                  )}
                </div>
                <p className={`text-[11px] mt-1 line-clamp-1 ${isActive ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {mod.sub}
                </p>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Student Fees */}
        {activeTab === 'student_fees' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 print:hidden">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  <span>শিক্ষার্থী বেতন, সেশন ও পরীক্ষার ফি কালেকশন</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  মোট {students.length} জন শিক্ষার্থী | রিসিপ্ট ইস্যু: {paymentHistory.length} টি
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFeeSubTab('fee_setup')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>ফি সেটআপ ও খাত হাব</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট</span>
                </button>
              </div>
            </div>

            {/* 6 Fee Collection KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">সর্বমোট বকেয়া</span>
                <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  ৳{feeStats.totalDueAll.toLocaleString('bn-BD')}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">পূর্বের বকেয়া</span>
                <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  ৳{(feeStats.totalOpeningDueAll || 0).toLocaleString('bn-BD')}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">আজকের আদায়</span>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ৳{feeStats.todayCollected.toLocaleString('bn-BD')}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Receipt className="w-3 h-3 text-emerald-600" /> ক্যাশ আদায়
                </span>
                <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  ৳{feeStats.cashCollected.toLocaleString('bn-BD')}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-pink-600" /> বিকাশ (bKash)
                </span>
                <div className="text-base font-bold text-pink-600 dark:text-pink-400 mt-0.5">
                  ৳{feeStats.bkashCollected.toLocaleString('bn-BD')}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-orange-600" /> নগদ (Nagad)
                </span>
                <div className="text-base font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                  ৳{feeStats.nagadCollected.toLocaleString('bn-BD')}
                </div>
              </div>
            </div>

            {/* 8 Sub-Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 print:hidden">
              {FEE_SUB_TABS.map((sub) => {
                const Icon = sub.icon;
                const active = feeSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setFeeSubTab(sub.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>

            {feeSubTab === 'collection' && (
              <StudentFeesCollectionTab
                students={students}
                classFees={classFees}
                allStudentLedgers={allStudentLedgers}
                feeSectors={feeSectors}
                paymentHistory={paymentHistory}
                schoolInfo={schoolInfo}
                selectedStudent={selectedStudent}
                selectionNonce={selectionNonce}
                onSelectStudent={handleSelectStudent}
                onClearSelectedStudent={() => setSelectedStudent(null)}
                onPaymentHistoryUpdate={setPaymentHistory}
                onRefreshAll={loadAllData}
                onPrintReceipt={(rec: PaymentRecord) => setPrintReceiptData(rec)}
              />
            )}

            {feeSubTab === 'invoices' && (
              <StudentFeesInvoicesTab
                invoices={invoices}
                goLiveStartYear={goLiveStartYear}
                schoolNameBn={schoolInfo.nameBn}
                onRefreshAll={loadAllData}
              />
            )}

            {feeSubTab === 'fee_setup' && (
              <StudentFeesSetupTab
                students={students}
                classFees={classFees}
                feeSectors={feeSectors}
                onRefreshAll={loadAllData}
              />
            )}

            {feeSubTab === 'opening_due' && (
              <StudentFeesOpeningDueTab
                students={students}
                allStudentLedgers={allStudentLedgers}
                financeSettings={financeSettings}
                goLiveStartYear={goLiveStartYear}
                onGoLiveStartYearChange={setGoLiveStartYear}
                onRefreshAll={loadAllData}
              />
            )}

            {(feeSubTab === 'due_report' ||
              feeSubTab === 'history' ||
              feeSubTab === 'monthly_analysis' ||
              feeSubTab === 'audit_log') && (
              <StudentFeesReportsAndLogsTabs
                feeSubTab={feeSubTab}
                students={students}
                allStudentLedgers={allStudentLedgers}
                paymentHistory={paymentHistory}
                auditLogs={auditLogs}
                schoolInfo={schoolInfo}
                onCollectStudentFromDue={(st: Student) => {
                  handleSelectStudent(st);
                  setFeeSubTab('collection');
                }}
                onPrintReceipt={(rec: PaymentRecord) => setPrintReceiptData(rec)}
              />
            )}
          </div>
        )}

        {/* Tab 2 & 3: Payroll & Expenses */}
        {(activeTab === 'payroll' || activeTab === 'expenses') && (
          <PayrollAndExpensesTabs
            activeTab={activeTab}
            payrolls={payrolls}
            expenses={expenses}
            teachersList={teachersList}
            schoolInfo={schoolInfo}
            currentLang={currentLang}
            onRefreshAll={loadAllData}
            onPrintSalarySlip={(pay: PayrollRecord) => setPrintSalarySlip(pay)}
            onPrintExpenseSlip={(exp: ExpenseRecord) => setPrintExpenseSlip(exp)}
          />
        )}

        {/* Tab 4 & 5: Cash/Bank & Waivers/Refunds */}
        {(activeTab === 'cash_bank' || activeTab === 'waivers_refunds') && (
          <CashBankAndWaiversTabs
            activeTab={activeTab}
            bankAccounts={bankAccounts}
            vouchers={vouchers}
            waivers={waivers}
            refunds={refunds}
            students={students}
            feeStats={feeStats}
            cashInHand={cashInHand}
            totalBankBalance={totalBankBalance}
            schoolInfo={schoolInfo}
            onRefreshAll={loadAllData}
          />
        )}

        {/* Tab 6: Financial Reports */}
        {activeTab === 'reports' && (
          <FinanceReportsTab
            vouchers={vouchers}
            chartOfAccounts={chartOfAccounts}
            bankAccounts={bankAccounts}
            schoolInfo={schoolInfo}
            onRefreshAll={loadAllData}
            onOpenVoucherModal={(t?: VoucherType) => {
              setVoucherDefaultType(t || 'Journal');
              setShowVoucherModal(true);
            }}
            onPrintVoucher={(v: VoucherRecord) => setPrintVoucherData(v)}
          />
        )}
      </div>

      {/* Modals & Print Areas */}
      <FinanceModalsAndPrints
        showVoucherModal={showVoucherModal}
        voucherDefaultType={voucherDefaultType}
        onCloseVoucherModal={() => setShowVoucherModal(false)}
        printReceiptData={printReceiptData}
        onCloseReceipt={() => setPrintReceiptData(null)}
        printExpenseSlip={printExpenseSlip}
        onCloseExpenseSlip={() => setPrintExpenseSlip(null)}
        printSalarySlip={printSalarySlip}
        onCloseSalarySlip={() => setPrintSalarySlip(null)}
        printVoucherData={printVoucherData}
        onCloseVoucherPrint={() => setPrintVoucherData(null)}
        onSelectVoucherPrint={(v: VoucherRecord) => setPrintVoucherData(v)}
        schoolInfo={schoolInfo}
        currentLang={currentLang}
        chartOfAccounts={chartOfAccounts}
        onRefreshAll={loadAllData}
      />
    </>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">ফাইন্যান্স মডিউল লোড হচ্ছে...</div>}>
      <FinanceContent />
    </Suspense>
  );
}
