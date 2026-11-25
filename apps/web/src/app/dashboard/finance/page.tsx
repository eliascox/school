'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Wallet, Users, Receipt, Printer, Settings,
  AlertCircle, FileText, History, BarChart3, ShieldCheck, Smartphone, CreditCard
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
import { leaveService } from '@/services/leaveService';
import { teacherRBACService, TeacherRecord } from '@/services/teacherRBACService';
import { teacherAuthService } from '@/services/teacherAuthService';
import { URL_QUERY_CHANGED_EVENT, syncUrlQueryParams } from '@/lib/urlTabSync';
import {
  FinanceTab,
  FeeSubTab,
  PaymentRecord,
  SchoolInfoState,
  AuditLogEntry,
  FinanceSlimHeader
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
  { id: 'invoices', label: 'মাসিক ইনভয়েস', icon: FileText },
  { id: 'fee_setup', label: 'ফি সেটআপ ও খাত', icon: Settings },
  { id: 'opening_due', label: 'পূর্বের বকেয়া', icon: AlertCircle },
  { id: 'due_report', label: 'বকেয়া রিপোর্ট', icon: Users },
  { id: 'history', label: 'রিসিপ্ট হিস্টোরি', icon: History },
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
  const [teachersList, setTeachersList] = useState<TeacherRecord[]>([]);
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
    const syncTabFromUrl = () => {
      const liveTab = (
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('tab')
          : tabParam
      ) as FinanceTab | null;
      if (liveTab && VALID_TABS.includes(liveTab)) {
        setActiveTab(liveTab);
      } else if (!liveTab) {
        setActiveTab('student_fees');
      }
    };
    syncTabFromUrl();
    window.addEventListener(URL_QUERY_CHANGED_EVENT, syncTabFromUrl);
    window.addEventListener('popstate', syncTabFromUrl);
    return () => {
      window.removeEventListener(URL_QUERY_CHANGED_EVENT, syncTabFromUrl);
      window.removeEventListener('popstate', syncTabFromUrl);
    };
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
      setTeachersList(loadedTeachers);

      const settings = settingsService.getSettings();
      const storedSession = localStorage.getItem('sms_academic_session');
      setSchoolInfo({
        nameBn: settings.schoolName || DEFAULT_SCHOOL_INFO.nameBn,
        eiin: settings.eiin || DEFAULT_SCHOOL_INFO.eiin,
        address: settings.address || DEFAULT_SCHOOL_INFO.address,
        established: settings.estdYear || DEFAULT_SCHOOL_INFO.established,
        session: storedSession || DEFAULT_SCHOOL_INFO.session,
        phone: settings.phone
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
    const unsubStudents = studentService.subscribe(() => loadAllData());
    const unsubLeaves = leaveService.subscribe(() => loadAllData());
    const unsubSettings = settingsService.subscribe(() => loadAllData());
    const unsubLang = languageService.subscribe((lang: AppLanguage) => setCurrentLang(lang));
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('sms_') || e.key === 'school_ledger_records') loadAllData();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubFinance();
      unsubStudents();
      unsubLeaves();
      unsubSettings();
      unsubLang();
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadAllData]);

  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    setSelectionNonce((n) => n + 1);
  };

  const handleCollectDueFromReport = (st: Student) => {
    handleSelectStudent(st);
    setActiveTab('student_fees');
    setFeeSubTab('collection');
    syncUrlQueryParams('/dashboard/finance', { tab: 'student_fees' }, { push: true });
  };

  const feeStats: FeeCollectionStats = useMemo(() => {
    void allStudentLedgers;
    return financeService.getFeeCollectionStats(paymentHistory);
  }, [paymentHistory, allStudentLedgers]);

  const reconciledTreasury = useMemo(() => {
    void vouchers;
    void chartOfAccounts;
    void bankAccounts;
    return financeService.getReconciledTreasurySummary();
  }, [vouchers, chartOfAccounts, bankAccounts]);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const isPrintModalOpen = Boolean(printReceiptData || printSalarySlip || printExpenseSlip || printVoucherData);

  return (
    <>
      {!isPrintModalOpen && (
        <style>{`@media print { @page { size: A4 portrait; margin: 12mm; } }`}</style>
      )}
      <style jsx global>{`
        @media print {
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

      <div className={`w-full space-y-4 ${isPrintModalOpen ? 'print:hidden' : ''}`}>
        {/* ─── INDEPENDENT MENU 1: FEE COLLECTION (?tab=student_fees) ─── */}
        {activeTab === 'student_fees' && (
          <div className="space-y-4">
            <FinanceSlimHeader
              title="ফি ও বেতন আদায়"
              subtitle={`মোট ${students.length} জন শিক্ষার্থী · রিসিপ্ট ইস্যু: ${paymentHistory.length} টি · উপবৃত্তি ও ফি মওকুফ স্বয়ংক্রিয়ভাবে সিংকড`}
              icon={<Wallet className="w-5 h-5" />}
              iconBg="bg-teal-600"
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => setFeeSubTab('fee_setup')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>ফি সেটআপ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>প্রিন্ট</span>
                  </button>
                </>
              }
            />

            {/* 4 Clean Contextual KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">সর্বমোট বকেয়া</span>
                <div className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                  ৳ {feeStats.totalDueAll.toLocaleString('bn-BD')}
                </div>
                <span className="text-[10px] text-slate-400">
                  পূর্বের বকেয়া: ৳{(feeStats.totalOpeningDueRemaining || 0).toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">আজকের আদায়</span>
                <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ৳ {feeStats.todayCollected.toLocaleString('bn-BD')}
                </div>
                <span className="text-[10px] text-slate-400">
                  মোট আদায়: ৳{feeStats.totalCollectedAll.toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Receipt className="w-3 h-3 text-emerald-600" /> ক্যাশ ও ব্যাংক আদায়
                </span>
                <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  ৳ {(feeStats.cashCollected + feeStats.bankCollected).toLocaleString('bn-BD')}
                </div>
                <span className="text-[10px] text-slate-400">
                  ক্যাশ ৳{feeStats.cashCollected.toLocaleString('bn-BD')} · ব্যাংক ৳{feeStats.bankCollected.toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-pink-600" /> <CreditCard className="w-3 h-3 text-orange-500" /> বিকাশ ও নগদ
                </span>
                <div className="text-lg font-black font-mono text-pink-600 dark:text-pink-400 mt-0.5">
                  ৳ {(feeStats.bkashCollected + feeStats.nagadCollected).toLocaleString('bn-BD')}
                </div>
                <span className="text-[10px] text-slate-400">
                  বিকাশ ৳{feeStats.bkashCollected.toLocaleString('bn-BD')} · নগদ ৳{feeStats.nagadCollected.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            {/* Clean Sub-Tabs inside Fee Collection */}
            <div className="flex flex-wrap gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs print:hidden">
              {FEE_SUB_TABS.map((sub) => {
                const Icon = sub.icon;
                const active = feeSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setFeeSubTab(sub.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                bankAccounts={bankAccounts}
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

        {/* ─── INDEPENDENT MENUS 2 & 3: PAYROLL (?tab=payroll) & EXPENSES (?tab=expenses) ─── */}
        {(activeTab === 'payroll' || activeTab === 'expenses') && (
          <PayrollAndExpensesTabs
            activeTab={activeTab}
            payrolls={payrolls}
            expenses={expenses}
            teachersList={teachersList}
            bankAccounts={bankAccounts}
            schoolInfo={schoolInfo}
            currentLang={currentLang}
            onRefreshAll={loadAllData}
            onPrintSalarySlip={(pay: PayrollRecord) => setPrintSalarySlip(pay)}
            onPrintExpenseSlip={(exp: ExpenseRecord) => setPrintExpenseSlip(exp)}
          />
        )}

        {/* ─── INDEPENDENT MENUS 4 & 5: CASH & BANK (?tab=cash_bank) & WAIVERS/REFUNDS (?tab=waivers_refunds) ─── */}
        {(activeTab === 'cash_bank' || activeTab === 'waivers_refunds') && (
          <CashBankAndWaiversTabs
            activeTab={activeTab}
            bankAccounts={bankAccounts}
            vouchers={vouchers}
            waivers={waivers}
            refunds={refunds}
            students={students}
            paymentHistory={paymentHistory}
            feeStats={feeStats}
            reconciledTreasury={reconciledTreasury}
            schoolInfo={schoolInfo}
            onRefreshAll={loadAllData}
          />
        )}

        {/* ─── INDEPENDENT MENU 6: FINANCIAL REPORTS & DUES (?tab=reports) ─── */}
        {activeTab === 'reports' && (
          <FinanceReportsTab
            vouchers={vouchers}
            chartOfAccounts={chartOfAccounts}
            bankAccounts={bankAccounts}
            students={students}
            allStudentLedgers={allStudentLedgers}
            schoolInfo={schoolInfo}
            onRefreshAll={loadAllData}
            onOpenVoucherModal={(t?: VoucherType) => {
              setVoucherDefaultType(t || 'Journal');
              setShowVoucherModal(true);
            }}
            onPrintVoucher={(v: VoucherRecord) => setPrintVoucherData(v)}
            onCollectStudentDue={handleCollectDueFromReport}
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
