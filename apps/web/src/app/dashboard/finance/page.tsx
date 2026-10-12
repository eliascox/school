'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  DollarSign,
  CreditCard,
  Banknote,
  Receipt,
  Landmark,
  RotateCcw,
  FileBarChart,
  Search,
  Plus,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Filter,
  User,
  Users,
  Settings,
  X,
  FileText,
  ShieldCheck,
  Percent,
  Sparkles,
  BookOpen,
  Scale,
  PieChart,
  Layers,
  ChevronRight,
  Trash2,
  Edit,
  Building2,
  Wallet,
  Clock,
  Check,
  Smartphone,
  BadgePercent,
  PlusCircle,
  Send,
  MessageSquare,
  RefreshCw,
  CheckSquare,
  Square,
  FileCheck,
  Sliders,
  Tag,
  BookmarkCheck,
  ArrowRight
} from 'lucide-react';
import {
  financeService,
  FeeSector,
  ClassFeeItem,
  PayrollRecord,
  ExpenseRecord,
  BankAccount,
  WaiverRecord,
  RefundRecord,
  AccountHead,
  VoucherRecord,
  JournalLine,
  AccountCategory,
  VoucherType,
  EXPENSE_CATEGORIES,
  DEFAULT_FEE_SECTORS,
  DEFAULT_CLASS_FEES_CONFIG,
  GRADES_LIST,
  normalizeGradeKey,
  BANGLA_MONTHS,
  StudentFeeLedger,
  MonthDue,
  OtherFeeDue,
  FeeCollectionStats,
  FinanceSettings,
  DEFAULT_FINANCE_SETTINGS,
  FeeInvoice,
  FeeInvoiceItem,
  FeeInvoicePayment,
  getPaymentAssetCode,
  getExpenseAccountCode
} from '@/services/financeService';
import { studentService, Student } from '@/services/studentService';
import { teacherAuthService } from '@/services/teacherAuthService';
import { languageService, AppLanguage } from '@/services/languageService';
import { smsService } from '@/services/smsService';
import { auditTrailService } from '@/services/auditTrailService';

// Main Finance Tab Types
type FinanceTab = 'student_fees' | 'payroll' | 'expenses' | 'cash_bank' | 'waivers_refunds' | 'reports';

// Sub-tabs under Student Fees
type FeeSubTab = 'collection' | 'invoices' | 'fee_setup' | 'opening_due' | 'due_report' | 'history' | 'monthly_analysis' | 'audit_log';

// Sub-tabs under Financial Reports & Accounting
type ReportSubTab = 
  | 'income_statement' 
  | 'balance_sheet' 
  | 'trial_balance' 
  | 'cash_book' 
  | 'bank_book' 
  | 'general_ledger' 
  | 'vouchers' 
  | 'chart_of_accounts';

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

const MONTHS_LIST = BANGLA_MONTHS;

function FinanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active Tab Management
  const tabParam = searchParams.get('tab') as FinanceTab;
  const [activeTab, setActiveTab] = useState<FinanceTab>(tabParam || 'student_fees');
  const [reportSubTab, setReportSubTab] = useState<ReportSubTab>('income_statement');
  const [feeSubTab, setFeeSubTab] = useState<FeeSubTab>('collection');
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');

  useEffect(() => {
    const sess = teacherAuthService.getSession();
    if (sess && sess.role === 'teacher') {
      router.replace('/dashboard/teacher-portal');
      return;
    }

    if (tabParam && ['student_fees', 'payroll', 'expenses', 'cash_bank', 'waivers_refunds', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, router]);

  const handleTabChange = (t: FinanceTab) => {
    setActiveTab(t);
    router.replace(`/dashboard/finance?tab=${t}`);
  };

  // ─── DATA STATES ──────────────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>([]);
  const [classFees, setClassFees] = useState<{ [grade: string]: { [secId: string]: number } }>({});
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [waivers, setWaivers] = useState<WaiverRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<AccountHead[]>([]);
  const [allStudentLedgers, setAllStudentLedgers] = useState<Record<string, StudentFeeLedger>>({});
  const [feeSectors, setFeeSectors] = useState<FeeSector[]>([]);
  const [feeSetupTab, setFeeSetupTab] = useState<'classes' | 'sectors'>('classes');
  const [feeSetupSubView, setFeeSetupSubView] = useState<'matrix' | 'new_fee' | 'directory'>('matrix');
  const [feeSetupClassFilter, setFeeSetupClassFilter] = useState<string>('all');
  const [feeSetupSearchQuery, setFeeSetupSearchQuery] = useState<string>('');
  const [classRateSavedToast, setClassRateSavedToast] = useState<string | null>(null);

  // Quick Add Fee Modal for a specific class
  const [classQuickAddModal, setClassQuickAddModal] = useState<{
    isOpen: boolean;
    gradeId: string;
    gradeName: string;
    selectedSectorId: string;
    customAmount: number;
    isCreatingNewSector: boolean;
    newSectorName: string;
    newSectorAccountCode: string;
    newSectorFrequency: 'monthly' | 'yearly' | 'one_time' | 'per_exam' | 'on_demand';
  }>({
    isOpen: false,
    gradeId: '',
    gradeName: '',
    selectedSectorId: '',
    customAmount: 200,
    isCreatingNewSector: false,
    newSectorName: '',
    newSectorAccountCode: '4060',
    newSectorFrequency: 'yearly'
  });

  const [newSectorForm, setNewSectorForm] = useState<{
    name: string;
    nameEn: string;
    id: string;
    defAmount: number;
    description: string;
    accountCode: string;
    frequency: 'monthly' | 'yearly' | 'one_time' | 'per_exam' | 'on_demand';
    applicableClasses: string[];
    category: 'tuition' | 'admission' | 'exam' | 'facility' | 'board' | 'event' | 'service' | 'other';
    isSameRateForAll: boolean;
    classRates: { [grade: string]: number };
  }>({
    name: '',
    nameEn: '',
    id: '',
    defAmount: 200,
    description: '',
    accountCode: '4060',
    frequency: 'yearly',
    applicableClasses: ['6th', '7th', '8th', '9th', '10th'],
    category: 'facility',
    isSameRateForAll: true,
    classRates: { '6th': 200, '7th': 200, '8th': 200, '9th': 200, '10th': 200 }
  });

  // Load all finance data
  const loadAllData = () => {
    const loadedStudents = studentService.getAllStudents();
    setStudents(loadedStudents);
    const activeClassFees = financeService.getClassFeesConfig();
    setClassFees(activeClassFees);
    setPayrolls(financeService.getPayrollRecords());
    setExpenses(financeService.getExpenses());
    setBankAccounts(financeService.getBankAccounts());
    setWaivers(financeService.getWaivers());
    setRefunds(financeService.getRefunds());
    setVouchers(financeService.getVouchers());
    setChartOfAccounts(financeService.getChartOfAccounts());
    const syncedLedgers = financeService.syncStudentLedgersWithClassFees(activeClassFees);
    setAllStudentLedgers(syncedLedgers);
    setFeeSectors(financeService.getFeeSectors());

    const settings = financeService.getFinanceSettings();
    setFinanceSettings(settings);
    setGoLiveStartMonth(settings.systemStartMonth);
    setGoLiveStartYear(settings.systemStartYear);
    setGoLivePreStartMode(settings.preStartMonthsAction);
    setInvoices(financeService.getInvoices());

    try {
      const logsRaw = localStorage.getItem('sms_audit_logs');
      if (logsRaw) setAuditLogs(JSON.parse(logsRaw));
      else setAuditLogs([]);
    } catch (e) {
      setAuditLogs([]);
    }

    const isDemoCleared = typeof window !== 'undefined' && localStorage.getItem('sms_demo_cleared') === 'true';

    try {
      const storedPayments = localStorage.getItem('sms_payment_history');
      if (storedPayments) {
        const parsed = JSON.parse(storedPayments);
        // If demo was cleared and no students exist, clean up payment history
        if (isDemoCleared && (loadedStudents.length === 0 || (Array.isArray(parsed) && parsed.some(p => p.receiptId?.startsWith('REC-DEMO'))))) {
          localStorage.setItem('sms_payment_history', JSON.stringify([]));
          setPaymentHistory([]);
        } else {
          setPaymentHistory(Array.isArray(parsed) ? parsed : []);
        }
      } else {
        setPaymentHistory([]);
      }
    } catch (e) {
      setPaymentHistory([]);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentLang(languageService.getLanguage());
    loadAllData();
    const unsubFinance = financeService.subscribe(() => {
      loadAllData();
    });
    const unsubLang = languageService.subscribe((lang) => {
      setCurrentLang(lang);
    });
    const handleStorageChange = () => {
      loadAllData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      unsubFinance();
      unsubLang();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ─── 1. STUDENT FEES STATE & COMPUTATIONS ─────────────────────────
  const [feeSearch, setFeeSearch] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [studentDueFilter, setStudentDueFilter] = useState<'all' | 'has_due' | 'paid_up'>('all');
  const [paymentHistoryFilter, setPaymentHistoryFilter] = useState<string>('all');
  const [paymentHistorySearch, setPaymentHistorySearch] = useState<string>('');

  // ─── 🚩 GO-LIVE & OPENING DUE STATES ──────────────────────────────
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings>(DEFAULT_FINANCE_SETTINGS);
  const [goLiveStartMonth, setGoLiveStartMonth] = useState<string>('জানুয়ারি');
  const [goLiveStartYear, setGoLiveStartYear] = useState<number>(2026);
  const [goLivePreStartMode, setGoLivePreStartMode] = useState<'settled' | 'waived' | 'due'>('settled');
  const [openingDueSearch, setOpeningDueSearch] = useState<string>('');
  const [openingDueGradeFilter, setOpeningDueGradeFilter] = useState<string>('all');
  const [openingDueInputs, setOpeningDueInputs] = useState<Record<string, number | string>>({});
  const [openingDueNotes, setOpeningDueNotes] = useState<Record<string, string>>({});
  const [goLiveAlert, setGoLiveAlert] = useState<string | null>(null);

  // ─── 🧾 INVOICE HUB STATES ─────────────────────────────────────────
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [invoiceGradeFilter, setInvoiceGradeFilter] = useState<string>('all');
  const [invoiceMonthFilter, setInvoiceMonthFilter] = useState<string>('all');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [generateInvoiceMonth, setGenerateInvoiceMonth] = useState<string>('সেপ্টেম্বর');
  const [generateInvoiceGrade, setGenerateInvoiceGrade] = useState<string>('all');
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<FeeInvoice | null>(null);
  const [invoicePayAmount, setInvoicePayAmount] = useState<number | string>('');
  const [invoicePayMethod, setInvoicePayMethod] = useState<string>('Cash');
  const [invoiceTrxId, setInvoiceTrxId] = useState<string>('');
  const [invoicePayAlert, setInvoicePayAlert] = useState<string | null>(null);

  // ─── 🛡️ AUDIT TRAIL STATES ─────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState<string>('');

  // ─── 📱 DEFAULTER SMS NOTIFICATIONS STATE ──────────────────────────
  const [selectedDueStudentsForSMS, setSelectedDueStudentsForSMS] = useState<string[]>([]);
  const [smsSendingState, setSmsSendingState] = useState<{ isSending: boolean; result?: string }>({ isSending: false });
  const [historyGradeFilter, setHistoryGradeFilter] = useState<string>('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [extraFeeSelections, setExtraFeeSelections] = useState<{ [secId: string]: boolean }>({
    exam: true
  });
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [trxIdInput, setTrxIdInput] = useState<string>('');
  const [collectedBy, setCollectedBy] = useState<string>('ক্যাশিয়ার');
  const [printReceiptData, setPrintReceiptData] = useState<PaymentRecord | null>(null);
  const [showFeeSettingsModal, setShowFeeSettingsModal] = useState(false);

  // Check if student is stipend beneficiary
  const isStipendStudent = (st: Student | null) => {
    if (!st) return false;
    return Boolean((st as any).isStipend || (st as any).stipendCategory || (st as any).stipendStatus === 'Active');
  };

  const getStudentStipendStartMonth = (st: Student | null): string => {
    if (!st) return 'জানুয়ারি';
    return (st as any).stipendStartMonth || 'জানুয়ারি';
  };

  const [stipendStartMonthOverride, setStipendStartMonthOverride] = useState<string>('জানুয়ারি');

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchGrade = selectedGradeFilter === 'all' || s.grade === selectedGradeFilter;
      const matchSearch = feeSearch === '' ||
        s.name.toLowerCase().includes(feeSearch.toLowerCase()) ||
        s.roll.toString().includes(feeSearch) ||
        ((s as any).studentId && (s as any).studentId.toLowerCase().includes(feeSearch.toLowerCase()));

      const stipend = isStipendStudent(s);
      const gradeKey = normalizeGradeKey(s.grade);
      const ledger = allStudentLedgers[s.id] || financeService.getStudentFeeLedger(s.id, gradeKey, stipend);
      const studentDue = ledger ? ledger.totalDue : 0;

      const matchDue =
        studentDueFilter === 'all' ? true :
        studentDueFilter === 'has_due' ? studentDue > 0 :
        studentDue === 0;

      return matchGrade && matchSearch && matchDue;
    });
  }, [students, selectedGradeFilter, feeSearch, studentDueFilter, allStudentLedgers]);

  // Active Class Statistics
  const activeClassStats = useMemo(() => {
    const classStudents = selectedGradeFilter === 'all'
      ? students
      : students.filter(s => s.grade === selectedGradeFilter);

    let totalDue = 0;
    let studentsWithDue = 0;
    let studentsPaid = 0;
    const duesList: { student: Student; due: number; paid: number }[] = [];

    classStudents.forEach(st => {
      const stipend = isStipendStudent(st);
      const gradeKey = normalizeGradeKey(st.grade);
      const ledger = allStudentLedgers[st.id] || financeService.getStudentFeeLedger(st.id, gradeKey, stipend);
      const due = ledger ? ledger.totalDue : 0;
      const paid = ledger ? ledger.totalPaid : 0;
      totalDue += due;
      if (due > 0) {
        studentsWithDue++;
        duesList.push({ student: st, due, paid });
      } else {
        studentsPaid++;
      }
    });

    duesList.sort((a, b) => b.due - a.due);

    return {
      totalStudents: classStudents.length,
      totalDue,
      studentsWithDue,
      studentsPaid,
      duesList
    };
  }, [students, selectedGradeFilter, allStudentLedgers]);

  // Selected student's active ledger
  const selectedStudentLedger = useMemo(() => {
    if (!selectedStudent) return null;
    const stipend = isStipendStudent(selectedStudent);
    const stipendStart = stipendStartMonthOverride || getStudentStipendStartMonth(selectedStudent);
    const gradeKey = normalizeGradeKey(selectedStudent.grade);
    return financeService.getStudentFeeLedger(selectedStudent.id, gradeKey, stipend, stipendStart);
  }, [selectedStudent, stipendStartMonthOverride, allStudentLedgers, classFees]);

  // Handle select student for fee collection
  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    const stipend = isStipendStudent(st);
    const stipendStart = getStudentStipendStartMonth(st);
    setStipendStartMonthOverride(stipendStart);
    const gradeKey = normalizeGradeKey(st.grade);
    const ledger = financeService.getStudentFeeLedger(st.id, gradeKey, stipend, stipendStart);

    // Auto-select months that have outstanding due
    const currentMonthIdx = new Date().getMonth();
    const monthsWithDue = ledger.months
      .filter((m, idx) => m.dueAmount > 0 && idx <= Math.max(currentMonthIdx + 1, 7))
      .map(m => m.month);

    const defaultMonths = monthsWithDue.length > 0
      ? monthsWithDue
      : ledger.months.filter(m => m.dueAmount > 0).map(m => m.month).slice(0, 3);

    setSelectedMonths(defaultMonths);

    // Select extra fees with due
    const extra: { [secId: string]: boolean } = {};
    if (ledger.otherFees) {
      Object.keys(ledger.otherFees).forEach(secId => {
        if (secId === 'exam' && ledger.otherFees[secId].dueAmount > 0) {
          extra[secId] = true;
        }
      });
    }
    setExtraFeeSelections(extra);
    setDiscountAmount(0);
    setTrxIdInput('');
    setPaymentAmountInput('');
  };

  // Toggle month
  const toggleMonth = (m: string) => {
    if (selectedMonths.includes(m)) {
      setSelectedMonths(selectedMonths.filter(x => x !== m));
    } else {
      setSelectedMonths([...selectedMonths, m]);
    }
  };

  // Get current grade tuition rate
  const currentGrade = normalizeGradeKey(selectedStudent?.grade);
  const monthlyTuitionRate = isStipendStudent(selectedStudent)
    ? 0
    : (classFees[currentGrade]?.tuition || DEFAULT_CLASS_FEES_CONFIG[currentGrade]?.tuition || 400);

  // Calculate current subtotal from selected months & extra fees based on actual live due
  const currentSubtotal = useMemo(() => {
    if (!selectedStudent || !selectedStudentLedger) return 0;
    let sum = 0;

    selectedMonths.forEach(mName => {
      const monthObj = selectedStudentLedger.months.find(m => m.month === mName);
      if (monthObj) {
        sum += monthObj.dueAmount;
      } else {
        sum += monthlyTuitionRate;
      }
    });

    Object.keys(extraFeeSelections).forEach(secId => {
      if (extraFeeSelections[secId]) {
        if (secId === 'opening_due') {
          sum += (selectedStudentLedger.openingDueRemaining || 0);
          return;
        }
        const feeObj = selectedStudentLedger.otherFees?.[secId];
        if (feeObj) {
          sum += feeObj.dueAmount;
        } else {
          const amt = classFees[currentGrade]?.[secId] || DEFAULT_CLASS_FEES_CONFIG[currentGrade]?.[secId] || 300;
          sum += amt;
        }
      }
    });

    return sum;
  }, [selectedStudent, selectedStudentLedger, selectedMonths, extraFeeSelections, monthlyTuitionRate, classFees, currentGrade]);

  const currentNetPayable = Math.max(0, currentSubtotal - discountAmount);

  // Auto-fill paymentAmountInput if user hasn't typed a custom partial amount
  useEffect(() => {
    if (selectedStudent) {
      setPaymentAmountInput(currentNetPayable);
    }
  }, [currentNetPayable, selectedStudent]);

  // Actual amount being collected
  const actualPaidAmount = typeof paymentAmountInput === 'number'
    ? paymentAmountInput
    : Number(paymentAmountInput) || 0;

  // Remaining due after this payment
  const remainingDueAfterThisPay = Math.max(0, currentNetPayable - actualPaidAmount);

  // Fee collection stats
  const feeStats: FeeCollectionStats = useMemo(() => {
    return financeService.getFeeCollectionStats(paymentHistory);
  }, [paymentHistory, allStudentLedgers]);

  // Filtered payment history
  const filteredPaymentHistory = useMemo(() => {
    return paymentHistory.filter(rec => {
      const matchMethod = paymentHistoryFilter === 'all' || rec.paymentMethod === paymentHistoryFilter;
      const matchSearch = paymentHistorySearch === '' ||
        rec.receiptId.toLowerCase().includes(paymentHistorySearch.toLowerCase()) ||
        rec.studentName.toLowerCase().includes(paymentHistorySearch.toLowerCase()) ||
        rec.roll.includes(paymentHistorySearch) ||
        (rec.trxId && rec.trxId.toLowerCase().includes(paymentHistorySearch.toLowerCase()));
      // Grade filter
      const matchGrade = historyGradeFilter === 'all' || rec.grade === historyGradeFilter;
      // Month filter: check ISO date field
      let matchMonth = historyMonthFilter === 'all';
      if (!matchMonth) {
        const BANGLA_MONTHS_LOCAL = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
        const targetMonthIdx = BANGLA_MONTHS_LOCAL.indexOf(historyMonthFilter);
        if (targetMonthIdx >= 0 && rec.date) {
          const d = new Date(rec.date);
          matchMonth = !isNaN(d.getTime()) && d.getMonth() === targetMonthIdx;
        }
      }
      return matchMethod && matchSearch && matchGrade && matchMonth;
    });
  }, [paymentHistory, paymentHistoryFilter, paymentHistorySearch, historyGradeFilter, historyMonthFilter]);

  // Submit student fee payment
  const handleCollectFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (actualPaidAmount <= 0 && currentNetPayable > 0 && discountAmount === 0) {
      alert('অনুগ্রহ করে প্রাপ্ত অর্থের সঠিক পরিমাণ লিখুন!');
      return;
    }

    const now = new Date();
    const receiptNum = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const selectedOtherIds = Object.keys(extraFeeSelections).filter(secId => extraFeeSelections[secId]);

    // Apply payment to student ledger
    // Determine stipend start month from student data
    const studentStipendStartMonth = (selectedStudent as any).stipendStartMonth || 
      (selectedStudent.isStipend && (selectedStudent as any).stipendMonth) || 'জানুয়ারি';

    const { updatedLedger, paidFeeItems } = financeService.applyPaymentToStudentLedger({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      roll: String(selectedStudent.roll),
      grade: selectedStudent.grade || '6th',
      section: selectedStudent.section || 'ক',
      mobile: selectedStudent.mobile || (selectedStudent as any).phone || 'N/A',
      selectedMonths,
      selectedOtherFeeIds: selectedOtherIds,
      paymentAmount: actualPaidAmount,
      discountAmount: discountAmount,
      paymentMethod: paymentMethod as any,
      trxId: paymentMethod === 'Cash' ? `CASH-${Date.now().toString().slice(-6)}` : trxIdInput || `TRX-${Date.now().toString().slice(-6)}`,
      receiptId: receiptNum,
      collectedBy,
      date: now.toISOString().split('T')[0],
      isStipend: isStipendStudent(selectedStudent),
      stipendStartMonth: isStipendStudent(selectedStudent) ? studentStipendStartMonth : undefined
    });

    const newRecord: PaymentRecord = {
      receiptId: receiptNum,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      roll: String(selectedStudent.roll),
      grade: selectedStudent.grade || '6th',
      section: selectedStudent.section || 'ক',
      mobile: selectedStudent.mobile || (selectedStudent as any).phone || 'N/A',
      feeItems: paidFeeItems.map(f => ({ name: f.name, amount: f.amount, dueRemaining: f.dueRemaining })),
      subtotal: currentSubtotal,
      discount: discountAmount,
      paidAmount: actualPaidAmount,
      dueRemaining: updatedLedger.totalDue,
      paymentMethod,
      trxId: paymentMethod === 'Cash' ? `CASH-${Date.now().toString().slice(-6)}` : trxIdInput || `TRX-${Date.now().toString().slice(-6)}`,
      date: now.toISOString().split('T')[0],
      collectedBy
    };

    const updated = [newRecord, ...paymentHistory];
    setPaymentHistory(updated);
    try {
      localStorage.setItem('sms_payment_history', JSON.stringify(updated));
    } catch (err) {}

    // 🌟 AUTOMATED DOUBLE-ENTRY JOURNAL POSTING!
    financeService.postFeeReceiptJournal({
      receiptId: receiptNum,
      studentName: selectedStudent.name,
      roll: String(selectedStudent.roll),
      grade: selectedStudent.grade || '6th',
      paidAmount: actualPaidAmount,
      subtotal: actualPaidAmount + discountAmount,
      discount: discountAmount,
      paymentMethod,
      feeItems: paidFeeItems.map(f => ({ name: f.name, amount: f.amount })),
      date: now.toISOString().split('T')[0],
      collectedBy
    });

    // 📱 SMS PAYMENT NOTIFICATION
    if (selectedStudent.mobile && selectedStudent.mobile !== 'N/A' && selectedStudent.mobile.length >= 11) {
      try {
        smsService.sendSMS({
          recipient: selectedStudent.mobile,
          message: `বরইতলী উচ্চ বিদ্যালয়: শিক্ষার্থী ${selectedStudent.name}-এর ফি বাবদ ৳${actualPaidAmount} গ্রহণ করা হয়েছে। রসিদ নং: ${receiptNum}। বর্তমান অবশিষ্ট বকেয়া: ৳${updatedLedger.totalDue}। ধন্যবাদ।`,
          type: 'fee_reminder',
          targetAudience: 'individual',
          recipientName: selectedStudent.name,
          studentId: selectedStudent.id,
          class: selectedStudent.grade,
          roll: String(selectedStudent.roll)
        });
      } catch (err) {}
    }

    // 🛡️ FINANCIAL AUDIT TRAIL LOGGING
    try {
      auditTrailService.addLog({
        action: 'FEE_PAYMENT_COLLECTED',
        performedBy: collectedBy || 'ক্যাশিয়ার',
        targetId: receiptNum,
        details: `শিক্ষার্থী ${selectedStudent.name} (রোল: ${selectedStudent.roll}, শ্রেণি: ${selectedStudent.grade}) থেকে ৳${actualPaidAmount} ফি আদায় করা হয়েছে। মাধ্যম: ${paymentMethod}, TrxID: ${trxIdInput || 'ক্যাশ'}। অবশিষ্ট বকেয়া: ৳${updatedLedger.totalDue}।`,
        severity: 'info',
        timestamp: new Date().toISOString()
      });
    } catch (err) {}

    loadAllData();
    setPrintReceiptData(newRecord);
    setSelectedStudent(null);
    setSelectedMonths([]);
    setExtraFeeSelections({});
    setPaymentAmountInput('');
    setDiscountAmount(0);
    setTrxIdInput('');
  };

  // ─── 🚩 GO-LIVE & OPENING DUE HANDLERS ────────────────────────────
  const handleGoLiveApply = () => {
    try {
      financeService.applySoftwareStartMonth(
        goLiveStartMonth,
        Number(goLiveStartYear) || 2026,
        goLivePreStartMode
      );
      setFinanceSettings(financeService.getFinanceSettings());
      loadAllData();
      setGoLiveAlert(`সফটওয়্যার শুরুর মাস '${goLiveStartMonth} ${goLiveStartYear}' সফলভাবে সমন্বয় ও কার্যকর করা হয়েছে!`);
      setTimeout(() => setGoLiveAlert(null), 6000);
    } catch (e: any) {
      alert('সফটওয়্যার শুরুর মাস সমন্বয় করতে সমস্যা হয়েছে: ' + (e.message || ''));
    }
  };

  const handleSaveOpeningDue = (studentId: string) => {
    const rawAmt = openingDueInputs[studentId];
    if (rawAmt === undefined || rawAmt === '') {
      alert('অনুগ্রহ করে পূর্ববর্তী বকেয়ার সঠিক টাকার পরিমাণ লিখুন!');
      return;
    }
    const amount = Number(rawAmt);
    if (isNaN(amount) || amount < 0) {
      alert('টাকার পরিমাণ ০ বা তদুর্ধ্ব হতে হবে!');
      return;
    }
    const note = openingDueNotes[studentId] || 'সফটওয়্যার শুরুর পূর্বে পূর্ববর্তী বকেয়া';
    financeService.setStudentOpeningDue(studentId, amount, note, 'অ্যাডমিন');
    loadAllData();
    alert(`শিক্ষার্থীর পূর্ববর্তী বকেয়া (৳${amount}) সফলভাবে সংরক্ষণ করা হয়েছে!`);
  };

  // ─── 🧾 INVOICE ACTIONS ───────────────────────────────────────────
  const handleGenerateInvoices = () => {
    const res = financeService.generateMonthlyInvoices(
      generateInvoiceMonth,
      Number(goLiveStartYear) || 2026,
      generateInvoiceGrade
    );
    loadAllData();
    alert(`${generateInvoiceMonth} মাসের জন্য মোট ${res.generated} টি নতুন ফি ইনভয়েস সফলভাবে প্রস্তুত হয়েছে!`);
  };

  const handlePayInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    const payAmt = Number(invoicePayAmount);
    if (!payAmt || payAmt <= 0) {
      alert('অনুগ্রহ করে পরিশোধের সঠিক টাকার পরিমাণ লিখুন!');
      return;
    }
    if (payAmt > selectedInvoiceForPayment.dueAmount) {
      alert(`পরিশোধের পরিমাণ বকেয়া (৳${selectedInvoiceForPayment.dueAmount}) থেকে বেশি হতে পারবে না!`);
      return;
    }

    try {
      const res = financeService.payInvoice(selectedInvoiceForPayment.id, {
        amount: payAmt,
        paymentMethod: invoicePayMethod,
        trxId: invoiceTrxId || (invoicePayMethod === 'Cash' ? `CASH-${Date.now().toString().slice(-6)}` : `TRX-${Date.now().toString().slice(-6)}`),
        collectedBy: collectedBy || 'ক্যাশিয়ার',
        date: new Date().toISOString().split('T')[0]
      });

      // Send SMS Confirmation if mobile exists
      if (res.invoice.mobile && res.invoice.mobile !== 'N/A' && res.invoice.mobile.length >= 11) {
        try {
          smsService.sendSMS({
            recipient: res.invoice.mobile,
            message: `বরইতলী উচ্চ বিদ্যালয়: শিক্ষার্থী ${res.invoice.studentName}-এর ইনভয়েস #${res.invoice.invoiceNo || res.invoice.invoiceId} বাবদ ৳${payAmt} গ্রহণ করা হয়েছে। বর্তমান ইনভয়েস বকেয়া: ৳${res.invoice.dueAmount}। ধন্যবাদ।`,
            type: 'fee_reminder',
            targetAudience: 'individual',
            recipientName: res.invoice.studentName,
            studentId: res.invoice.studentId,
            class: res.invoice.grade,
            roll: res.invoice.roll
          });
        } catch (err) {}
      }

      loadAllData();
      setSelectedInvoiceForPayment(null);
      setInvoicePayAmount('');
      setInvoiceTrxId('');
      alert(`ইনভয়েস #${res.invoice.invoiceNo || res.invoice.invoiceId}-এ ৳${payAmt} সফলভাবে জমা হয়েছে! রসিদ নং: ${res.receiptId}`);
    } catch (e: any) {
      alert('ইনভয়েস পেমেন্ট সংরক্ষণে ত্রুটি: ' + (e.message || ''));
    }
  };

  // ─── 📱 BULK DEFAULTER SMS NOTIFICATIONS ──────────────────────────
  const handleSendDueSMSBulk = () => {
    if (selectedDueStudentsForSMS.length === 0) {
      alert('অনুগ্রহ করে অন্তত একজন শিক্ষার্থী নির্বাচন করুন!');
      return;
    }

    setSmsSendingState({ isSending: true });
    let count = 0;

    selectedDueStudentsForSMS.forEach(studentId => {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      const ledger = allStudentLedgers[studentId];
      const due = ledger ? ledger.totalDue : 0;
      const phone = student.mobile || (student as any).phone;

      if (phone && phone !== 'N/A' && phone.length >= 11) {
        try {
          smsService.sendSMS({
            recipient: phone,
            message: `সম্মানিত অভিভাবক, বরইতলী উচ্চ বিদ্যালয়ে আপনার সন্তান ${student.name} (শ্রেণি: ${student.grade}, রোল: ${student.roll})-এর সর্বমোট বকেয়া ৳${due}। দ্রুত বকেয়া পরিশোধের জন্য অনুরোধ করা হলো।`,
            type: 'fee_reminder',
            targetAudience: 'individual',
            recipientName: student.name,
            studentId: student.id,
            class: student.grade,
            roll: String(student.roll)
          });
          count++;
        } catch (err) {}
      }
    });

    try {
      auditTrailService.addLog({
        action: 'BULK_FEE_REMINDER_SMS',
        performedBy: 'অ্যাডমিন/হিসাব সহকারী',
        targetId: `BULK-${selectedDueStudentsForSMS.length}`,
        details: `${count} জন বকেয়া শিক্ষার্থীর অভিভাবককে বকেয়া তাগাদা SMS পাঠানো হয়েছে।`,
        severity: 'info',
        timestamp: new Date().toISOString()
      });
    } catch (err) {}

    setSmsSendingState({
      isSending: false,
      result: `${count} জন অভিভাবকের মোবাইলে বকেয়া তাগাদা SMS পাঠানো হয়েছে!`
    });

    setTimeout(() => {
      setSelectedDueStudentsForSMS([]);
      setSmsSendingState({ isSending: false });
    }, 4000);
  };

  // ─── 2. PAYROLL STATE ─────────────────────────────────────────────
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [printSalarySlip, setPrintSalarySlip] = useState<PayrollRecord | null>(null);
  const [payrollForm, setPayrollForm] = useState({
    teacherId: 'TCH-103',
    teacherName: 'কাজী মিজানুর রহমান',
    designation: 'সিনিয়র গণিত শিক্ষক',
    month: 'আগস্ট',
    year: 2026,
    baseSalary: 32000,
    allowances: 5000,
    bonus: 0,
    deductions: 1000,
    paymentMethod: 'Bank Transfer' as const,
    trxId: '',
    note: 'মাসিক বেতন ও ভাতা প্রদান'
  });

  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const net = payrollForm.baseSalary + payrollForm.allowances + payrollForm.bonus - payrollForm.deductions;
    const now = new Date();
    const vNo = `PR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`;

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
      note: payrollForm.note
    };

    financeService.savePayrollRecord(record);
    loadAllData();
    setShowPayrollModal(false);
    setPrintSalarySlip(record);
  };

  // ─── 3. EXPENSES STATE ────────────────────────────────────
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [printExpenseSlip, setPrintExpenseSlip] = useState<ExpenseRecord | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: 1500,
    paidTo: '',
    paymentMethod: 'Cash' as const,
    note: '',
    recordedBy: 'হিসাবরক্ষক'
  });

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const vNo = `VCH-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`;

    const record: ExpenseRecord = {
      id: `EXP-${Date.now()}`,
      voucherNo: vNo,
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      date: now.toISOString().split('T')[0],
      paidTo: expenseForm.paidTo || 'সংশ্লিষ্ট ব্যক্তি/প্রতিষ্ঠান',
      paymentMethod: expenseForm.paymentMethod,
      note: expenseForm.note,
      recordedBy: expenseForm.recordedBy
    };

    financeService.saveExpense(record);
    loadAllData();
    setShowExpenseModal(false);
    setPrintExpenseSlip(record);
  };

  // ─── 4. CASH & BANK STATE ─────────────────────────────────
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [bankTransferForm, setBankTransferForm] = useState({
    from: 'Cash in Hand (হাতে নগদ)',
    to: 'bank-1',
    amount: 25000,
    refNo: '',
    note: 'দৈনিক ফি আদায়ের উদ্বৃত্ত অর্থ ব্যাংকে জমা'
  });

  const [showBankEditModal, setShowBankEditModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankModalForm, setBankModalForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branch: '',
    accountCode: '1020',
    balance: 0
  });

  const handleOpenBankModal = (b: BankAccount | null) => {
    if (b) {
      setEditingBank(b);
      setBankModalForm({
        bankName: b.bankName,
        accountName: b.accountName,
        accountNumber: b.accountNumber,
        branch: b.branch,
        accountCode: b.accountCode || '1020',
        balance: b.balance
      });
    } else {
      setEditingBank(null);
      setBankModalForm({
        bankName: '',
        accountName: '',
        accountNumber: '',
        branch: '',
        accountCode: `10${(bankAccounts.length + 2) * 10}`,
        balance: 0
      });
    }
    setShowBankEditModal(true);
  };

  const handleSaveBankModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankModalForm.bankName.trim()) {
      alert('অনুগ্রহ করে ব্যাংকের নাম প্রদান করুন');
      return;
    }
    financeService.addOrUpdateBankAccount({
      id: editingBank ? editingBank.id : `bank-${Date.now()}`,
      bankName: bankModalForm.bankName.trim(),
      accountName: bankModalForm.accountName.trim() || bankModalForm.bankName.trim(),
      accountNumber: bankModalForm.accountNumber.trim(),
      branch: bankModalForm.branch.trim(),
      accountCode: bankModalForm.accountCode.trim(),
      balance: Number(bankModalForm.balance) || 0
    });
    loadAllData();
    setShowBankEditModal(false);
  };

  const handleDeleteBank = (id: string, name: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${name}" ব্যাংক হিসাবটি ডিলিট করতে চান?`)) {
      financeService.deleteBankAccount(id);
      loadAllData();
    }
  };

  const handleResetAllBankBalances = () => {
    if (confirm('আপনি কি সকল ব্যাংকের স্থিতি ও ব্যালেন্স ৳০ করতে চান? এতে পূর্বের ডেমো টাকা মুছে যাবে।')) {
      financeService.resetAllBankBalancesToZero();
      loadAllData();
      alert('সকল ব্যাংক হিসাবের ব্যালেন্স সফলভাবে ৳০ করা হয়েছে!');
    }
  };

  const handleSaveBankTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    financeService.postContraJournal({
      from: bankTransferForm.from,
      to: bankTransferForm.to,
      amount: Number(bankTransferForm.amount),
      date: new Date().toISOString().split('T')[0],
      refNo: bankTransferForm.refNo,
      note: bankTransferForm.note
    });
    loadAllData();
    setShowBankTransferModal(false);
  };

  // ─── 5. WAIVERS & REFUNDS STATE ───────────────────────────
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [waiverForm, setWaiverForm] = useState<{
    studentId: string;
    studentName: string;
    roll: string;
    grade: string;
    type: 'percent' | 'flat';
    value: number;
    reason: string;
    approvedBy: string;
  }>({
    studentId: 'STU-601',
    studentName: 'তাহমিদ চৌধুরী',
    roll: '০১',
    grade: '৬ষ্ঠ শ্রেণি',
    type: 'percent',
    value: 100,
    reason: 'বীর মুক্তিযোদ্ধা সন্তান কোটা',
    approvedBy: 'প্রধান শিক্ষক'
  });
  const [refundForm, setRefundForm] = useState({
    receiptId: 'REC-202608-8819',
    studentId: 'STU-601',
    studentName: 'তাহমিদ চৌধুরী',
    amount: 300,
    reason: 'পরীক্ষা ফি অতিরিক্ত প্রদান করায় ফেরত',
    processedBy: 'ক্যাশিয়ার'
  });

  const handleSaveWaiver = (e: React.FormEvent) => {
    e.preventDefault();
    financeService.saveWaiver({
      id: `WVR-${Date.now()}`,
      ...waiverForm,
      value: Number(waiverForm.value),
      date: new Date().toISOString().split('T')[0]
    });
    loadAllData();
    setShowWaiverModal(false);
  };

  const handleSaveRefund = (e: React.FormEvent) => {
    e.preventDefault();
    financeService.saveRefund({
      id: `RFD-${Date.now()}`,
      ...refundForm,
      amount: Number(refundForm.amount),
      date: new Date().toISOString().split('T')[0]
    });
    loadAllData();
    setShowRefundModal(false);
  };

  // ─── 6. MANUAL VOUCHER CREATOR MODAL STATE ────────────────
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [printVoucherData, setPrintVoucherData] = useState<VoucherRecord | null>(null);
  const [voucherFormType, setVoucherFormType] = useState<VoucherType>('Payment');
  const [voucherFormRef, setVoucherFormRef] = useState('');
  const [voucherFormNarration, setVoucherFormNarration] = useState('');
  const [voucherFormRows, setVoucherFormRows] = useState<JournalLine[]>([
    { accountCode: '5030', accountName: 'Electricity & Utility Bills', debit: 5000, credit: 0, narration: 'বিদ্যুৎ বিল' },
    { accountCode: '1010', accountName: 'Cash in Hand (হাতে নগদ)', debit: 0, credit: 5000, narration: 'ক্যাশ প্রদান' }
  ]);

  const addVoucherRow = () => {
    setVoucherFormRows([
      ...voucherFormRows,
      { accountCode: '1010', accountName: 'Cash in Hand (হাতে নগদ)', debit: 0, credit: 0, narration: '' }
    ]);
  };

  const removeVoucherRow = (idx: number) => {
    if (voucherFormRows.length > 2) {
      setVoucherFormRows(voucherFormRows.filter((_, i) => i !== idx));
    }
  };

  const updateVoucherRow = (idx: number, field: keyof JournalLine, value: any) => {
    const copy = [...voucherFormRows];
    if (field === 'accountCode') {
      const matched = chartOfAccounts.find(a => a.code === value);
      copy[idx].accountCode = value;
      copy[idx].accountName = matched ? matched.nameBn || matched.name : value;
    } else {
      (copy[idx] as any)[field] = value;
    }
    setVoucherFormRows(copy);
  };

  const totalVoucherDebit = voucherFormRows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  const totalVoucherCredit = voucherFormRows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  const isVoucherBalanced = Math.abs(totalVoucherDebit - totalVoucherCredit) < 0.01 && totalVoucherDebit > 0;

  const handleSaveManualVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVoucherBalanced) {
      alert('ভাউচারের মোট ডেবিট ও মোট ক্রেডিট সমান হতে হবে!');
      return;
    }
    const prefix = voucherFormType === 'Receipt' ? 'RV' : voucherFormType === 'Payment' ? 'PV' : voucherFormType === 'Contra' ? 'CV' : 'JV';
    const now = new Date();
    const vNo = `${prefix}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`;

    const newVoucher: VoucherRecord = {
      id: `VOUCH-${Date.now()}`,
      voucherNo: vNo,
      voucherType: voucherFormType,
      date: now.toISOString().split('T')[0],
      reference: voucherFormRef || 'ম্যানুয়াল সাধারণ ভাউচার',
      narration: voucherFormNarration || 'অ্যাকাউন্টিং সমন্বয় ও এন্ট্রি',
      sourceModule: 'manual_voucher',
      totalAmount: totalVoucherDebit,
      createdBy: 'হিসাবরক্ষক',
      entries: voucherFormRows.map(r => ({
        accountCode: r.accountCode,
        accountName: r.accountName,
        debit: Number(r.debit) || 0,
        credit: Number(r.credit) || 0,
        narration: r.narration
      }))
    };

    financeService.addVoucher(newVoucher);
    loadAllData();
    setShowVoucherModal(false);
    setPrintVoucherData(newVoucher);
  };

  // ─── 7. CHART OF ACCOUNTS ADD/EDIT MODAL ─────────────────
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountHead>({
    code: '',
    name: '',
    nameBn: '',
    category: 'Expense',
    subCategory: 'Administrative Expense',
    openingBalance: 0,
    isSystem: false,
    description: ''
  });

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.code || !accountForm.nameBn) {
      alert('অ্যাকাউন্ট কোড ও শিরোনাম বাধ্যতামূলক!');
      return;
    }
    financeService.addOrUpdateAccount(accountForm);
    loadAllData();
    setShowAccountModal(false);
  };

  // ─── 🏷️ FEE SETUP & HEADS HUB HANDLERS ─────────────────────
  const handleUpdateSingleClassFee = (gradeId: string, sectorId: string, amount: number) => {
    const updated = financeService.setSingleClassFeeRate(gradeId, sectorId, amount);
    setClassFees(updated);
    setAllStudentLedgers(financeService.getAllStudentLedgers());
    setClassRateSavedToast(`সংরক্ষিত: ৳${amount}`);
    setTimeout(() => setClassRateSavedToast(null), 2500);
  };

  const handleApplySectorRateToAll = (sectorId: string, amount: number, sectorName: string) => {
    if (isNaN(amount) || amount < 0) {
      alert('সঠিক টাকার পরিমাণ লিখুন!');
      return;
    }
    const updated = financeService.applyFeeRateToAllClasses(sectorId, amount);
    setClassFees(updated);
    setAllStudentLedgers(financeService.getAllStudentLedgers());
    alert(`'${sectorName}' সফলভাবে সকল শ্রেণিতে ৳${amount} টাকা নির্ধারণ করা হয়েছে!`);
  };

  const handleRemoveClassFee = (gradeId: string, sectorId: string, sectorName: string) => {
    if (confirm(`এই শ্রেণি থেকে '${sectorName}' ফি খাতটি কি সরাতে চান?`)) {
      const updated = financeService.removeClassFeeFromGrade(gradeId, sectorId);
      setClassFees(updated);
      setAllStudentLedgers(financeService.getAllStudentLedgers());
    }
  };

  const handleQuickAddClassFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { gradeId, isCreatingNewSector, selectedSectorId, customAmount, newSectorName, newSectorAccountCode, newSectorFrequency } = classQuickAddModal;
    
    if (customAmount < 0 || isNaN(customAmount)) {
      alert('সঠিক টাকার পরিমাণ লিখুন!');
      return;
    }

    if (isCreatingNewSector) {
      if (!newSectorName.trim()) {
        alert('ফি খাতের নাম লিখুন!');
        return;
      }
      const res = financeService.addClassFeeHead({
        name: newSectorName.trim(),
        defAmount: customAmount,
        accountCode: newSectorAccountCode,
        frequency: newSectorFrequency,
        applicableClasses: [gradeId],
        classRates: { [gradeId]: customAmount }
      });
      setFeeSectors(res.sectors);
      setClassFees(res.classFees);
      setAllStudentLedgers(financeService.getAllStudentLedgers());
      alert(`'${newSectorName}' সফলভাবে তৈরি করে ${classQuickAddModal.gradeName}-এ যোগ করা হয়েছে!`);
    } else {
      if (!selectedSectorId) {
        alert('ফি খাত নির্বাচন করুন!');
        return;
      }
      const updated = financeService.setSingleClassFeeRate(gradeId, selectedSectorId, customAmount);
      setClassFees(updated);
      setAllStudentLedgers(financeService.getAllStudentLedgers());
      const sName = feeSectors.find(s => s.id === selectedSectorId)?.name || selectedSectorId;
      alert(`'${sName}' (৳${customAmount}) সফলভাবে ${classQuickAddModal.gradeName}-এ যোগ করা হয়েছে!`);
    }

    setClassQuickAddModal(prev => ({ ...prev, isOpen: false, newSectorName: '', customAmount: 200 }));
  };

  const handleAddNewSectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorForm.name.trim()) {
      alert('ফি খাতের নাম লিখুন!');
      return;
    }

    const { name, id, defAmount, description, accountCode, frequency, applicableClasses, category, isSameRateForAll, classRates } = newSectorForm;

    const rates: { [grade: string]: number } = {};
    if (isSameRateForAll) {
      applicableClasses.forEach(g => {
        rates[g] = defAmount;
      });
    } else {
      applicableClasses.forEach(g => {
        rates[g] = classRates[g] !== undefined ? classRates[g] : defAmount;
      });
    }

    const res = financeService.addClassFeeHead({
      name: name.trim(),
      id: id.trim() || undefined,
      defAmount: Number(defAmount) || 0,
      description: description.trim() || `${name.trim()} বাবদ ফি`,
      accountCode,
      frequency,
      applicableClasses,
      category,
      classRates: rates
    });

    setFeeSectors(res.sectors);
    setClassFees(res.classFees);
    setAllStudentLedgers(financeService.getAllStudentLedgers());

    alert(`'${name.trim()}' ফি খাত সফলভাবে তৈরি ও নির্ধারিত শ্রেণিসমূহে কার্যকর করা হয়েছে!`);
    setNewSectorForm({
      name: '',
      nameEn: '',
      id: '',
      defAmount: 200,
      description: '',
      accountCode: '4060',
      frequency: 'yearly',
      applicableClasses: ['6th', '7th', '8th', '9th', '10th'],
      category: 'facility',
      isSameRateForAll: true,
      classRates: { '6th': 200, '7th': 200, '8th': 200, '9th': 200, '10th': 200 }
    });
    setFeeSetupSubView('matrix');
  };

  const handleDeleteFeeSector = (sectorId: string, sectorName: string) => {
    if (confirm(`'${sectorName}' ফি খাতটি কি নিশ্চিতভাবে মুছে ফেলতে চান?`)) {
      try {
        const updated = financeService.deleteFeeSector(sectorId);
        setFeeSectors(updated);
        setAllStudentLedgers(financeService.getAllStudentLedgers());
      } catch (err: any) {
        alert(err.message || 'খাতটি মুছে ফেলা সম্ভব হয়নি');
      }
    }
  };

  const handleResetClassFeesToDefault = () => {
    if (confirm('আপনি কি সকল শ্রেণির ফি কাঠামো সিস্টেমের মূল ডিফল্ট মানে রিসেট করতে চান?')) {
      const def = financeService.resetClassFeesToDefault();
      setClassFees(def);
      setFeeSectors(financeService.getFeeSectors());
      setAllStudentLedgers(financeService.getAllStudentLedgers());
      alert('সকল শ্রেণির ফি কাঠামো সফলভাবে ডিফল্ট মানে রিসেট করা হয়েছে!');
    }
  };

  // ─── 8. LEDGER FILTER STATES ──────────────────────────────
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState('1010');
  const [selectedBankBookCode, setSelectedBankBookCode] = useState('1020');

  // Compute live financial statements
  const trialBalance = useMemo(() => financeService.getTrialBalance(), [vouchers, chartOfAccounts]);
  const incomeStatement = useMemo(() => financeService.getIncomeStatement(), [vouchers, chartOfAccounts]);
  const balanceSheet = useMemo(() => financeService.getBalanceSheet(), [vouchers, chartOfAccounts]);
  const cashBook = useMemo(() => financeService.getCashBook(), [vouchers, chartOfAccounts]);
  const bankBook = useMemo(() => financeService.getBankBook(selectedBankBookCode), [vouchers, chartOfAccounts, selectedBankBookCode]);
  const generalLedger = useMemo(() => financeService.getGeneralLedger(selectedLedgerAccount), [vouchers, chartOfAccounts, selectedLedgerAccount]);

  // Overall Quick Stats
  const cashInHand = cashBook.closingBalance;
  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.balance, 0);
  const monthlyTotalExpense = incomeStatement.totalExpense;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">ফাইন্যান্স ও হিসাবরক্ষণ মডিউল লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 transition-colors duration-200">
      {/* ─── PRINT-ONLY CSS STYLES ───────────────────────────────── */}
      <style jsx global>{`
        @media print {
          /* Hide all screen chrome & interaction elements */
          aside, header, nav, .print\\:hidden, button, input, select {
            display: none !important;
          }
          
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 10pt !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 portrait;
            margin: 0.5in;
          }

          .landscape-print {
            size: A4 landscape !important;
            margin: 0.5in !important;
          }

          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }

          th, td {
            border-color: #000000 !important;
            color: #000000 !important;
          }

          /* Ensure modal slips take full print space when active */
          #print-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* ─── COMPACT TOP ACTION BAR & DESK HEADERS ─────────────────────── */}
      <div className={`max-w-7xl mx-auto space-y-4 ${(printReceiptData || printSalarySlip || printExpenseSlip || printVoucherData) ? "print:hidden" : ""}`}>

        {/* 1. STUDENT FEES: PROFESSIONAL 4-TAB LAYOUT */}
        {activeTab === 'student_fees' && (
          <div className="space-y-4">

            {/* ── TOP ACTION BAR ─────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/30">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">শিক্ষার্থী ফি ও বকেয়া ব্যবস্থাপনা</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">বরইতলী উচ্চ বিদ্যালয় • EIIN: 106184 • সেশন ২০২৬</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFeeSubTab('fee_setup')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>ফি সেটআপ ও খাত হাব</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>প্রিন্ট</span>
                </button>
              </div>
            </div>

            {/* ── 6 KPI SUMMARY CARDS ─────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">সর্বমোট বকেয়া</p>
                  <h4 className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5 font-mono">৳ {feeStats.totalDueAll.toLocaleString('bn-BD')}</h4>
                  <p className="text-[10px] text-slate-400">বর্তমান মোট পাওনা</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">পূর্বের বকেয়া</p>
                  <h4 className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono">৳ {(feeStats.totalOpeningDueRemaining || 0).toLocaleString('bn-BD')}</h4>
                  <p className="text-[10px] text-slate-400">প্রাক-সেশন বকেয়া</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">আজকের আদায়</p>
                  <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">৳ {feeStats.todayCollected.toLocaleString('bn-BD')}</h4>
                  <p className="text-[10px] text-slate-400">দৈনিক সংগ্রহ</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ক্যাশ আদায়</p>
                  <h4 className="text-base font-black text-emerald-600 dark:text-emerald-300 mt-0.5 font-mono">৳ {feeStats.cashCollected.toLocaleString('bn-BD')}</h4>
                  <p className="text-[10px] text-slate-400">হাতে নগদ</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">বিকাশ (bKash)</p>
                  <h4 className="text-base font-black text-pink-600 dark:text-pink-400 mt-0.5 font-mono">৳ {feeStats.bkashCollected.toLocaleString('bn-BD')}</h4>
                  <p className="text-[10px] text-slate-400">মোবাইল ব্যাংকিং</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400 border border-pink-100 dark:border-pink-500/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">নগদ (Nagad)</p>
                  <h4 className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono">৳ {feeStats.nagadCollected.toLocaleString('bn-BD')}</h4>
                  <p className="text-[10px] text-slate-400">ডিজিটাল কালেকশন</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* ── FEE SUB-TAB NAVIGATION ──────────────────────────────── */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl overflow-x-auto">
              {([
                { id: 'collection', label: 'ফি আদায়', icon: CreditCard },
                { id: 'invoices', label: 'ফি ইনভয়েস হাব', icon: FileCheck },
                { id: 'fee_setup', label: 'ফি সেটআপ ও খাত হাব', icon: Sliders },
                { id: 'opening_due', label: 'সফটওয়্যার শুরু ও পূর্বের বকেয়া', icon: Clock },
                { id: 'due_report', label: 'বকেয়া রিপোর্ট', icon: AlertCircle },
                { id: 'history', label: 'পেমেন্ট হিস্ট্রি', icon: FileText },
                { id: 'monthly_analysis', label: 'মাসিক বিশ্লেষণ', icon: TrendingUp },
                { id: 'audit_log', label: 'অডিট ও সিকিউরিটি লগ', icon: ShieldCheck },
              ] as { id: FeeSubTab; label: string; icon: any }[]).map(tab => {
                const Icon = tab.icon;
                const isActive = feeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFeeSubTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ══════════════════════════════════════════════════════════ */}
            {/* FEE SUB-TAB 1: ফি আদায় (COLLECTION)                      */}
            {/* ══════════════════════════════════════════════════════════ */}
            {feeSubTab === 'collection' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Student Selector */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        শিক্ষার্থী তালিকা ও বকেয়া স্থিতি
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {selectedGradeFilter === 'all' ? 'সকল শ্রেণি' : (GRADES_LIST.find(g => g.id === selectedGradeFilter)?.name || selectedGradeFilter)}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-slate-700">
                      {filteredStudents.length} জন
                    </span>
                  </div>

                  {/* Status Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {([
                      { val: 'all', label: `সকল (${students.length})`, cls: 'indigo' },
                      { val: 'has_due', label: 'বকেয়া আছে', cls: 'rose' },
                      { val: 'paid_up', label: 'পরিশোধিত ✓', cls: 'emerald' },
                    ] as { val: typeof studentDueFilter; label: string; cls: string }[]).map(f => (
                      <button
                        key={f.val}
                        type="button"
                        onClick={() => setStudentDueFilter(f.val)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          studentDueFilter === f.val
                            ? f.val === 'has_due' ? 'bg-rose-600 text-white font-bold'
                              : f.val === 'paid_up' ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Class Quick Tabs */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button type="button" onClick={() => setSelectedGradeFilter('all')}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${selectedGradeFilter === 'all' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
                      সকল
                    </button>
                    {GRADES_LIST.map(g => {
                      const cnt = students.filter(s => s.grade === g.id).length;
                      return (
                        <button key={g.id} type="button" onClick={() => setSelectedGradeFilter(g.id)}
                          className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${selectedGradeFilter === g.id ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
                          <span>{g.name.replace(' শ্রেণি', '')}</span>
                          <span className="text-[9px] opacity-70 ml-0.5">({cnt})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="নাম / রোল / আইডি দিয়ে খুঁজুন..."
                      value={feeSearch}
                      onChange={e => setFeeSearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Active Class Banner */}
                  {selectedGradeFilter !== 'all' && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-900 dark:text-indigo-200">
                        {GRADES_LIST.find(g => g.id === selectedGradeFilter)?.name}: {activeClassStats.totalStudents} জন
                      </span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        বকেয়া: ৳{activeClassStats.totalDue.toLocaleString('bn-BD')}
                      </span>
                    </div>
                  )}

                  {/* Student Cards List */}
                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs">কোন শিক্ষার্থী পাওয়া যায়নি</div>
                    ) : filteredStudents.map(st => {
                      const isSelected = selectedStudent?.id === st.id;
                      const stipend = isStipendStudent(st);
                      const gradeKey = normalizeGradeKey(st.grade);
                      const ledger = allStudentLedgers[st.id] || financeService.getStudentFeeLedger(st.id, gradeKey, stipend);
                      const totalDue = ledger ? ledger.totalDue : 0;
                      const totalPaid = ledger ? ledger.totalPaid : 0;

                      return (
                        <div key={st.id} onClick={() => handleSelectStudent(st)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                              : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                          }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${
                              isSelected ? 'bg-indigo-600 text-white border-indigo-400'
                              : totalDue > 0 ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            }`}>
                              #{st.roll}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className={`text-xs font-bold ${isSelected ? 'text-indigo-900 dark:text-white' : 'text-slate-900 dark:text-slate-100'}`}>{st.name}</h4>
                                {stipend && <span className="text-[9px] px-1.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-medium">উপবৃত্তি</span>}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{st.grade} ({st.section || 'ক'})</p>
                            </div>
                          </div>
                          <div className="text-right pl-2 shrink-0">
                            {totalDue > 0 ? (
                              <div className="space-y-1">
                                <span className="inline-block px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-[10px] font-black">বকেয়া ৳{totalDue}</span>
                                <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">আদায় ➔</span>
                              </div>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">পরিশোধিত ✓</span>
                            )}
                            {totalPaid > 0 && totalDue === 0 && <p className="text-[9px] text-slate-500 mt-0.5">আদায়: ৳{totalPaid}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT: Fee Collection Form */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 sm:p-5">
                  {selectedStudent && selectedStudentLedger ? (
                    <form onSubmit={handleCollectFee} className="space-y-4">
                      {/* Student Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedStudent.name}</h3>
                            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">রোল: #{selectedStudent.roll}</span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">শ্রেণি: {selectedStudent.grade} ({selectedStudent.section || 'ক'})</span>
                            {isStipendStudent(selectedStudent) && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                                <span>🎓 উপবৃত্তি শিক্ষার্থী</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            অভিভাবক: {selectedStudent.fatherName || (selectedStudent as any).guardian || 'N/A'} • মোবাইল: <span className="font-mono">{selectedStudent.mobile || (selectedStudent as any).phone || 'N/A'}</span>
                          </p>

                          {/* Stipend Rule Banner */}
                          {isStipendStudent(selectedStudent) && (
                            <div className="mt-2.5 p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-200">
                                <span className="font-bold">উপবৃত্তি শুরু:</span>
                                <span>নির্বাচিত হওয়ার পূর্বের মাসগুলোর বেতন প্রযোজ্য, পরবর্তী মাস মওকুফ।</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">উপবৃত্তি শুরুর মাস:</span>
                                <select
                                  value={stipendStartMonthOverride}
                                  onChange={e => setStipendStartMonthOverride(e.target.value)}
                                  className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg px-2 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300 outline-none cursor-pointer"
                                >
                                  {BANGLA_MONTHS.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-slate-950 border border-rose-200 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400">মোট বকেয়া</p>
                            <p className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">৳ {selectedStudentLedger.totalDue.toLocaleString('bn-BD')}</p>
                          </div>
                          <div className="text-right px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-slate-950 border border-emerald-200 dark:border-slate-800">
                            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">পরিশোধিত</p>
                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">৳ {selectedStudentLedger.totalPaid.toLocaleString('bn-BD')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Month Matrix */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            ১. মাসওয়ারি বেতন বকেয়া ({selectedMonths.length} মাস নির্বাচিত):
                          </label>
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <button type="button" onClick={() => setSelectedMonths(selectedStudentLedger.months.filter(m => m.dueAmount > 0).map(m => m.month))} className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">সব বকেয়া</button>
                            <span className="text-slate-300">|</span>
                            <button type="button" onClick={() => setSelectedMonths([])} className="text-slate-500 hover:text-slate-700 cursor-pointer font-normal">মুছুন</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {selectedStudentLedger.months.map(m => {
                            const isSelected = selectedMonths.includes(m.month);
                            const isPaid = m.status === 'paid';
                            const isPartial = m.status === 'partial';
                            const isWaived = m.status === 'waived';
                            return (
                              <div key={m.month}
                                onClick={() => { if (isPaid || isWaived) return; toggleMonth(m.month); }}
                                className={`p-2.5 rounded-xl border transition-all text-xs select-none cursor-pointer ${
                                  isPaid || isWaived ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70 cursor-default'
                                  : isSelected ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-400 shadow-sm'
                                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                                }`}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <input type="checkbox" disabled={isPaid || isWaived} checked={isSelected || isPaid}
                                      onChange={e => { e.stopPropagation(); if (isPaid || isWaived) return; toggleMonth(m.month); }}
                                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer disabled:opacity-60" />
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{m.month}</span>
                                  </div>
                                  {isPaid ? <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> পেইড</span>
                                  : isWaived ? <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">মওকুফ</span>
                                  : isPartial ? <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">আংশিক</span>
                                  : <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold">বকেয়া</span>}
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 border-t border-slate-100 dark:border-slate-900 pt-1">
                                  <span>ফি: ৳{m.tuitionAmount}</span>
                                  {m.dueAmount > 0 ? <span className="font-bold text-rose-600 dark:text-rose-400">বাকি ৳{m.dueAmount}</span>
                                  : <span className="font-bold text-emerald-600 dark:text-emerald-400">৳{m.paidAmount} জমা</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Opening Arrears Section */}
                      {selectedStudentLedger.openingDueRemaining !== undefined && selectedStudentLedger.openingDueRemaining > 0 && (
                        <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(extraFeeSelections['opening_due'])}
                                onChange={e => setExtraFeeSelections({ ...extraFeeSelections, opening_due: e.target.checked })}
                                className="rounded border-amber-400 text-amber-600 focus:ring-0 w-4 h-4 cursor-pointer"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-amber-950 dark:text-amber-200">পূর্ববর্তী সেশনের বকেয়া (Opening Arrears)</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold">পূর্বে বাকি</span>
                                </div>
                                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                  {selectedStudentLedger.openingDueNote || 'সফটওয়্যার শুরুর পূর্বে শিক্ষার্থীর বকেয়া'}
                                </p>
                              </div>
                            </label>
                            <div className="text-right">
                              <span className="text-sm font-black font-mono text-amber-900 dark:text-amber-300">
                                ৳ {selectedStudentLedger.openingDueRemaining.toLocaleString('bn-BD')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Other Fees */}
                      <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-xs font-black text-slate-900 dark:text-slate-100 block">২. অন্যান্য ফি (পরীক্ষা, ভর্তি ও সেবা খাত):</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS).filter(s => s.id !== 'tuition').map(sector => {
                            const isChecked = Boolean(extraFeeSelections[sector.id]);
                            const feeObj = selectedStudentLedger.otherFees?.[sector.id];
                            const feeAmount = feeObj ? feeObj.dueAmount : (classFees[currentGrade]?.[sector.id] || sector.defAmount);
                            const isAlreadyPaid = feeObj && feeObj.dueAmount === 0 && feeObj.paidAmount > 0;
                            return (
                              <label key={sector.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                isAlreadyPaid ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 cursor-default opacity-70'
                                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 cursor-pointer shadow-2xs'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" disabled={isAlreadyPaid} checked={isChecked}
                                    onChange={e => setExtraFeeSelections({ ...extraFeeSelections, [sector.id]: e.target.checked })}
                                    className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer" />
                                  <span className="text-xs font-semibold">{sector.name}</span>
                                </div>
                                <div className="text-right">
                                  {isAlreadyPaid ? (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">পরিশোধিত</span>
                                  ) : (
                                    <span className="text-xs font-black font-mono text-indigo-700 dark:text-indigo-300">৳ {feeAmount}</span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Payment Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">বিশেষ ছাড় / মওকুফ (টাকা)</label>
                          <input type="number" min="0" max={currentSubtotal} value={discountAmount || ''} placeholder="০"
                            onChange={e => setDiscountAmount(Number(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">পেমেন্ট মাধ্যম</label>
                          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold cursor-pointer">
                            <option value="Cash">💵 নগদ ক্যাশ</option>
                            <option value="bKash">📱 বিকাশ (bKash)</option>
                            <option value="Nagad">📲 নগদ (Nagad)</option>
                            <option value="Bank Transfer">🏛️ সোনালী ব্যাংক ডিপোজিট</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            {paymentMethod === 'Cash' ? 'ক্যাশ রসিদ রেফারেন্স' : 'TrxID / ট্রানজেকশন নং'}
                          </label>
                          <input type="text"
                            placeholder={paymentMethod === 'Cash' ? 'অটো-জেনারেটেড' : 'যেমন: TRX92810481'}
                            value={trxIdInput} onChange={e => setTrxIdInput(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-slate-800 pb-2.5">
                          <div>
                            <label className="text-xs font-black text-indigo-950 dark:text-white flex items-center gap-1.5">
                              <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              আদায়কৃত অর্থের পরিমাণ:
                            </label>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                              নির্বাচিত ফি: <strong className="text-slate-900 dark:text-white">৳{currentSubtotal}</strong>
                              {discountAmount > 0 && <span className="text-rose-600 font-bold"> (ছাড়: -৳{discountAmount})</span>}
                              {' '}| নিট প্রদেয়: <strong className="text-emerald-700 dark:text-emerald-400">৳{currentNetPayable}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <button type="button" onClick={() => setPaymentAmountInput(currentNetPayable)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer transition-all active:scale-95">
                              সম্পূর্ণ (৳{currentNetPayable})
                            </button>
                            {currentNetPayable > 1000 && (
                              <button type="button" onClick={() => setPaymentAmountInput(1000)}
                                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 font-bold shadow-2xs cursor-pointer transition-all">
                                ১০০০৳
                              </button>
                            )}
                            {currentNetPayable > 500 && (
                              <button type="button" onClick={() => setPaymentAmountInput(500)}
                                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 font-bold shadow-2xs cursor-pointer transition-all">
                                ৫০০৳
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div className="relative">
                            <span className="absolute left-4 top-3 text-indigo-600 dark:text-indigo-400 font-black text-lg">৳</span>
                            <input type="number" min="0" max={currentNetPayable}
                              value={paymentAmountInput} onChange={e => setPaymentAmountInput(e.target.value)}
                              placeholder="টাকার অংক লিখুন..."
                              className="w-full bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl pl-9 pr-3 py-2.5 text-xl font-black text-indigo-900 dark:text-emerald-400 font-mono shadow-inner outline-none focus:ring-2 focus:ring-indigo-500/30" />
                          </div>
                          <div className={`p-3 rounded-2xl border text-xs ${remainingDueAfterThisPay === 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'}`}>
                            {remainingDueAfterThisPay === 0 ? (
                              <div className="flex items-center gap-1.5 font-black">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>সম্পূর্ণ পরিশোধ (কোনো বাকি থাকবে না)</span>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-1.5 font-bold">
                                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span>আংশিক: ৳ {remainingDueAfterThisPay} বকেয়া থাকবে</span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">পরবর্তী কিস্তিতে পরিশোধযোগ্য।</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2">
                        <button type="button" onClick={() => setSelectedStudent(null)}
                          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer transition-all">
                          বাতিল
                        </button>
                        <button type="submit"
                          disabled={actualPaidAmount <= 0 && currentNetPayable > 0 && discountAmount === 0}
                          className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ফি জমা ও মানি রসিদ তৈরি</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-600 animate-ping" />
                            {selectedGradeFilter === 'all' ? 'সকল শ্রেণির ফি ও বকেয়া আদায় হাব' : `${GRADES_LIST.find(g => g.id === selectedGradeFilter)?.name} ফি ও বকেয়া আদায় হাব`}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">বাম তালিকা থেকে শিক্ষার্থী নির্বাচন করুন।</p>
                        </div>
                        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-slate-700 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>সেশন: ২০২৬</span>
                        </div>
                      </div>

                      {/* Class Summary KPIs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'মোট শিক্ষার্থী', value: `${activeClassStats.totalStudents} জন`, color: 'slate' },
                          { label: 'বকেয়া শিক্ষার্থী', value: `${activeClassStats.studentsWithDue} জন`, color: 'rose' },
                          { label: 'মোট বকেয়া', value: `৳ ${activeClassStats.totalDue.toLocaleString('bn-BD')}`, color: 'amber' },
                          { label: 'পরিশোধিত', value: `${activeClassStats.studentsPaid} জন`, color: 'emerald' },
                        ].map((kpi, i) => (
                          <div key={i} className={`p-3.5 bg-${kpi.color}-50/70 dark:bg-slate-950 rounded-2xl border border-${kpi.color}-200 dark:border-slate-800`}>
                            <span className={`text-[10px] font-bold text-${kpi.color}-700 dark:text-${kpi.color}-400 block uppercase`}>{kpi.label}</span>
                            <h4 className={`text-lg font-black text-${kpi.color}-700 dark:text-${kpi.color}-400 mt-1`}>{kpi.value}</h4>
                          </div>
                        ))}
                      </div>

                      {/* Due Students Quick List */}
                      {activeClassStats.duesList.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            বকেয়া তালিকা — দ্রুত আদায়:
                            <span className="text-[11px] text-slate-500 font-normal">{activeClassStats.duesList.length} জন</span>
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                  <th className="p-2.5">রোল</th>
                                  <th className="p-2.5">নাম</th>
                                  <th className="p-2.5">শ্রেণি</th>
                                  <th className="p-2.5 text-rose-600">বকেয়া (৳)</th>
                                  <th className="p-2.5">আদায়</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {activeClassStats.duesList.slice(0, 10).map(({ student: st, due }) => (
                                  <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                    <td className="p-2.5 font-mono font-bold text-slate-600 dark:text-slate-400">#{st.roll}</td>
                                    <td className="p-2.5 font-bold text-slate-900 dark:text-white">{st.name}</td>
                                    <td className="p-2.5 text-slate-500">{st.grade}</td>
                                    <td className="p-2.5 font-black text-rose-600 dark:text-rose-400">৳ {due.toLocaleString('bn-BD')}</td>
                                    <td className="p-2.5">
                                      <button type="button" onClick={() => handleSelectStudent(st)}
                                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1">
                                        <Banknote className="w-3.5 h-3.5" />
                                        <span>আদায়</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* FEE SUB-TAB: ফি ইনভয়েস হাব (INVOICES HUB)               */}
            {/* ══════════════════════════════════════════════════════════ */}
            {feeSubTab === 'invoices' && (
              <div className="space-y-4">
                {/* Top Generator Card */}
                <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-700/50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-white/10 backdrop-blur border border-white/20">
                          <FileCheck className="w-5 h-5 text-indigo-300" />
                        </span>
                        <div>
                          <h3 className="text-base font-black">মাসিক ফি ইনভয়েস জেনারেটর</h3>
                          <p className="text-xs text-indigo-200 mt-0.5">এক ক্লিকে সকল শিক্ষার্থীর জন্য স্বয়ংক্রিয় মাসিক ফি ইনভয়েস প্রস্তুত করুন</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="text-indigo-200">মাস:</span>
                        <select
                          value={generateInvoiceMonth}
                          onChange={e => setGenerateInvoiceMonth(e.target.value)}
                          className="bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 border border-indigo-500/40 outline-none cursor-pointer"
                        >
                          {BANGLA_MONTHS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="text-indigo-200">শ্রেণি:</span>
                        <select
                          value={generateInvoiceGrade}
                          onChange={e => setGenerateInvoiceGrade(e.target.value)}
                          className="bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 border border-indigo-500/40 outline-none cursor-pointer"
                        >
                          <option value="all">সকল শ্রেণি</option>
                          {GRADES_LIST.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateInvoices}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ইনভয়েস জেনারেট করুন</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={invoiceGradeFilter}
                      onChange={e => setInvoiceGradeFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer font-medium"
                    >
                      <option value="all">🎓 সকল শ্রেণি</option>
                      {GRADES_LIST.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>

                    <select
                      value={invoiceMonthFilter}
                      onChange={e => setInvoiceMonthFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer font-medium"
                    >
                      <option value="all">📅 সকল মাস</option>
                      {BANGLA_MONTHS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <select
                      value={invoiceStatusFilter}
                      onChange={e => setInvoiceStatusFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer font-medium"
                    >
                      <option value="all">🏷️ সকল স্ট্যাটাস</option>
                      <option value="unpaid">বকেয়া (Unpaid)</option>
                      <option value="partial">আংশিক পরিশোধ (Partial)</option>
                      <option value="paid">পরিশোধিত (Paid)</option>
                      <option value="cancelled">বাতিল (Cancelled)</option>
                    </select>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ইনভয়েস নং / নাম / রোল..."
                      value={invoiceSearch}
                      onChange={e => setInvoiceSearch(e.target.value)}
                      className="w-full sm:w-64 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Invoices List Table */}
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  {(() => {
                    const filteredInvoices = invoices.filter(inv => {
                      const matchGrade = invoiceGradeFilter === 'all' || inv.grade === invoiceGradeFilter;
                      const matchMonth = invoiceMonthFilter === 'all' || inv.month === invoiceMonthFilter;
                      const matchStatus = invoiceStatusFilter === 'all' || inv.status === invoiceStatusFilter;
                      const invCode = (inv.invoiceNo || inv.invoiceId || inv.id || '').toLowerCase();
                      const matchSearch = !invoiceSearch || 
                        invCode.includes(invoiceSearch.toLowerCase()) ||
                        inv.studentName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                        inv.roll.includes(invoiceSearch);
                      return matchGrade && matchMonth && matchStatus && matchSearch;
                    });

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                              <th className="p-3">ইনভয়েস নং</th>
                              <th className="p-3">শিক্ষার্থী</th>
                              <th className="p-3">শ্রেণি</th>
                              <th className="p-3">মাস</th>
                              <th className="p-3 text-right">মোট ফি</th>
                              <th className="p-3 text-right">পরিশোধিত</th>
                              <th className="p-3 text-right text-rose-600 dark:text-rose-400">বকেয়া</th>
                              <th className="p-3 text-center">স্ট্যাটাস</th>
                              <th className="p-3 text-right">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredInvoices.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                                  কোনো ইনভয়েস পাওয়া যায়নি। উপরের 'ইনভয়েস জেনারেট করুন' বোতামে ক্লিক করে নতুন ইনভয়েস প্রস্তুত করুন।
                                </td>
                              </tr>
                            ) : (
                              filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                  <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    {inv.invoiceNo || inv.invoiceId || inv.id}
                                  </td>
                                  <td className="p-3">
                                    <p className="font-bold text-slate-900 dark:text-white">{inv.studentName}</p>
                                    <p className="text-[10px] text-slate-400">রোল: #{inv.roll} {inv.mobile ? `• ${inv.mobile}` : ''}</p>
                                  </td>
                                  <td className="p-3 text-slate-600 dark:text-slate-300">
                                    {inv.grade} ({inv.section || 'ক'})
                                  </td>
                                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                                    {inv.month} {inv.year}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                    ৳ {(inv.totalPayable ?? inv.netPayable ?? 0).toLocaleString('bn-BD')}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    ৳ {(inv.totalPaid ?? inv.paidAmount ?? 0).toLocaleString('bn-BD')}
                                  </td>
                                  <td className="p-3 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                                    ৳ {(inv.dueAmount ?? 0).toLocaleString('bn-BD')}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      inv.status === 'paid'
                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                        : inv.status === 'partial'
                                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                        : inv.status === 'cancelled'
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-700'
                                    }`}>
                                      {inv.status === 'paid' ? 'পরিশোধিত' : inv.status === 'partial' ? 'আংশিক জমা' : inv.status === 'cancelled' ? 'বাতিল' : 'বকেয়া'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {inv.dueAmount > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedInvoiceForPayment(inv);
                                            setInvoicePayAmount(inv.dueAmount);
                                            setInvoiceTrxId('');
                                          }}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                                        >
                                          <Banknote className="w-3 h-3" />
                                          <span>ফি জমা</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          alert(`ইনভয়েস #${inv.invoiceNo || inv.invoiceId || inv.id} বিস্তারিত:\nশিক্ষার্থী: ${inv.studentName}\nশ্রেণি: ${inv.grade}\nমাস: ${inv.month}\nমোট প্রদেয়: ৳${inv.totalPayable ?? inv.netPayable ?? 0}\nপরিশোধ: ৳${inv.totalPaid ?? inv.paidAmount ?? 0}\nঅবশিষ্ট বকেয়া: ৳${inv.dueAmount ?? 0}`);
                                        }}
                                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] cursor-pointer"
                                      >
                                        বিবরণ
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

                {/* Modal for Invoice Payment */}
                {selectedInvoiceForPayment && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-5 h-5 text-emerald-600" />
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">ইনভয়েস ফি পরিশোধ</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForPayment(null)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl space-y-1.5 text-xs border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ইনভয়েস আইডি:</span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedInvoiceForPayment.invoiceId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">শিক্ষার্থীর নাম:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{selectedInvoiceForPayment.studentName} (#{selectedInvoiceForPayment.roll})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">শ্রেণি ও মাস:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedInvoiceForPayment.grade} • {selectedInvoiceForPayment.month}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5">
                          <span className="text-slate-500">বর্তমান বকেয়া:</span>
                          <span className="font-mono font-black text-rose-600 dark:text-rose-400">৳ {selectedInvoiceForPayment.dueAmount}</span>
                        </div>
                      </div>

                      <form onSubmit={handlePayInvoiceSubmit} className="space-y-3 text-xs">
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">পরিশোধের পরিমাণ (টাকা) *</label>
                          <input
                            type="number"
                            min="1"
                            max={selectedInvoiceForPayment.dueAmount}
                            value={invoicePayAmount}
                            onChange={e => setInvoicePayAmount(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-black text-indigo-700 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">আংশিক বা সম্পূর্ণ টাকা জমা দেওয়া যাবে</p>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">পেমেন্ট মাধ্যম</label>
                          <select
                            value={invoicePayMethod}
                            onChange={e => setInvoicePayMethod(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                          >
                            <option value="Cash">💵 নগদ ক্যাশ</option>
                            <option value="bKash">📱 বিকাশ (bKash)</option>
                            <option value="Nagad">📲 নগদ (Nagad)</option>
                            <option value="Bank Transfer">🏛️ ব্যাংক ডিপোজিট</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">TrxID / ট্রানজেকশন নম্বর (ঐচ্ছিক)</label>
                          <input
                            type="text"
                            placeholder="যেমন: TRX-83719"
                            value={invoiceTrxId}
                            onChange={e => setInvoiceTrxId(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForPayment(null)}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold"
                          >
                            বাতিল
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md"
                          >
                            ফি জমা নিশ্চিত করুন
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* FEE SUB-TAB 3: ফি সেটআপ ও খাত ব্যবস্থাপনা হাব               */}
            {/* ══════════════════════════════════════════════════════════ */}
            {feeSubTab === 'fee_setup' && (
              <div className="space-y-5">
                {/* 1. Header Banner & Quick Actions */}
                <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 border border-indigo-800/60 shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                          <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black tracking-tight text-white">ফি সেটআপ ও খাত ব্যবস্থাপনা হাব</h2>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              রিয়েলটাইম লেজার সিঙ্ক
                            </span>
                          </div>
                          <p className="text-xs text-indigo-200/80">
                            ৬ষ্ঠ থেকে ১০ম শ্রেণি পর্যন্ত প্রতিটি শ্রেণির আলাদা ফি কাঠামো, নতুন ফি খাত সংযোজন, শ্রেণিভিত্তিক রেট বরাদ্দ এবং সাধারণ খতিয়ানে স্বয়ংক্রিয় সিঙ্ক
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFeeSetupSubView('new_fee')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>নতুন ফি খাত যুক্ত করুন</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetClassFeesToDefault}
                        className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                        title="সিস্টেম ডিফল্ট ফি কাঠামোতে রিসেট করুন"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>ডিফল্ট রিসেট</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Quick Info Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-indigo-800/50">
                    <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-indigo-700/30">
                      <span className="text-[10px] text-indigo-300 font-bold block uppercase tracking-wider">মোট ফি খাত</span>
                      <h4 className="text-lg font-black font-mono text-white mt-0.5">
                        {(feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS).length} টি খাত
                      </h4>
                      <p className="text-[10px] text-slate-400">সক্রিয় সেবা ও অ্যাকাডেমিক</p>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-indigo-700/30">
                      <span className="text-[10px] text-indigo-300 font-bold block uppercase tracking-wider">শ্রেণি কভারেজ</span>
                      <h4 className="text-lg font-black text-white mt-0.5">
                        ৬ষ্ঠ - ১০ম শ্রেণি
                      </h4>
                      <p className="text-[10px] text-slate-400">৫টি স্বতন্ত্র শ্রেণি কাঠামো</p>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-indigo-700/30">
                      <span className="text-[10px] text-indigo-300 font-bold block uppercase tracking-wider">মাসিক টিউশন রেঞ্জ</span>
                      <h4 className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                        ৳ ৪০০ - ৳ ৬০০
                      </h4>
                      <p className="text-[10px] text-slate-400">শ্রেণিভেদে নির্ধারিত</p>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-indigo-700/30">
                      <span className="text-[10px] text-indigo-300 font-bold block uppercase tracking-wider">খতিয়ান ম্যাপিং</span>
                      <h4 className="text-lg font-black text-indigo-300 mt-0.5">
                        ১০০% অটো ম্যাপড
                      </h4>
                      <p className="text-[10px] text-slate-400">COA রেভিনিউ হেড ৪০০০+</p>
                    </div>
                  </div>
                </div>

                {/* Toast Notification */}
                {classRateSavedToast && (
                  <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      ফি কাঠামো সফলভাবে আপডেট ও শিক্ষার্থী লেজারে সিঙ্ক হয়েছে! ({classRateSavedToast})
                    </span>
                    <button onClick={() => setClassRateSavedToast(null)} className="text-white/80 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 2. Sub-views Switcher Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                      { id: 'matrix', label: '১. শ্রেণিভিত্তিক নির্ধারিত ফি মেট্রিক্স ও হার', icon: Layers },
                      { id: 'new_fee', label: '২. নতুন ফি খাত যোগ ও শ্রেণিভিত্তিক রেট', icon: PlusCircle },
                      { id: 'directory', label: '৩. সকল ফি খাতের ডিরেক্টরি ও নিয়ন্ত্রণ', icon: BookOpen }
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isActive = feeSetupSubView === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFeeSetupSubView(tab.id as any)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {feeSetupSubView === 'matrix' && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[11px] font-bold text-slate-500">শ্রেণি ফিল্টার:</span>
                      <select
                        value={feeSetupClassFilter}
                        onChange={e => setFeeSetupClassFilter(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="all">সকল শ্রেণি (৬ষ্ঠ - ১০ম)</option>
                        {GRADES_LIST.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {feeSetupSubView === 'directory' && (
                    <div className="relative w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ফি খাতের নাম বা কোড খুঁজুন..."
                        value={feeSetupSearchQuery}
                        onChange={e => setFeeSetupSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* ─── VIEW 1: CLASS-WISE FEE MATRIX ─────────────────── */}
                {feeSetupSubView === 'matrix' && (
                  <div className="space-y-4">
                    {/* Bulk Tool Bar */}
                    <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          এক ক্লিকে সকল শ্রেণিতে (৬ষ্ঠ-১০ম) যেকোনো ফির রেট প্রয়োগ করুন:
                        </span>
                        <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                          কুইক বাল্ক টুল
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-5">
                          <select
                            id="hubBulkSectorSelect"
                            defaultValue="tuition"
                            className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                          >
                            <option value="tuition">📚 মাসিক বেতন (Tuition Fee)</option>
                            <option value="admission">🎓 ভর্তি ও সেশন ফি (Admission Fee)</option>
                            <option value="exam">📝 পরীক্ষা ফি (Exam Fee)</option>
                            {(feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS).filter(s => !['tuition', 'admission', 'exam'].includes(s.id)).map(s => (
                              <option key={s.id} value={s.id}>🏷️ {s.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4 relative">
                          <span className="absolute left-3 top-2 text-xs font-black text-indigo-600 dark:text-indigo-400">৳</span>
                          <input
                            type="number"
                            id="hubBulkAmountInput"
                            placeholder="টাকার পরিমাণ (যেমন: ৫০০)"
                            className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <button
                            type="button"
                            onClick={() => {
                              const select = document.getElementById('hubBulkSectorSelect') as HTMLSelectElement;
                              const input = document.getElementById('hubBulkAmountInput') as HTMLInputElement;
                              const sectorId = select?.value || 'tuition';
                              const amt = Number(input?.value);
                              const sName = (feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS).find(s => s.id === sectorId)?.name || sectorId;
                              handleApplySectorRateToAll(sectorId, amt, sName);
                              if (input) input.value = '';
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                          >
                            <span>সকল ক্লাসে প্রয়োগ ➔</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Class Cards Grid */}
                    <div className="space-y-4">
                      {GRADES_LIST.filter(g => feeSetupClassFilter === 'all' || g.id === feeSetupClassFilter).map(g => {
                        const fees = classFees[g.id] || DEFAULT_CLASS_FEES_CONFIG[g.id] || {};
                        const activeSectors = (feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS);

                        const tuitionVal = fees.tuition !== undefined ? fees.tuition : (DEFAULT_CLASS_FEES_CONFIG[g.id]?.tuition || 400);
                        const admissionVal = fees.admission !== undefined ? fees.admission : (DEFAULT_CLASS_FEES_CONFIG[g.id]?.admission || 1500);
                        const examVal = fees.exam !== undefined ? fees.exam : (DEFAULT_CLASS_FEES_CONFIG[g.id]?.exam || 300);

                        const classStudentsCount = students.filter(s => normalizeGradeKey(s.grade) === g.id).length;

                        // Calculate annual estimation per student in this class
                        const annualTuition = tuitionVal * 12;
                        const annualExams = examVal * 2; // half-yearly + annual
                        const otherTotal = activeSectors
                          .filter(s => !['tuition', 'admission', 'exam'].includes(s.id))
                          .filter(s => !s.applicableClasses || s.applicableClasses.includes(g.id))
                          .reduce((sum, s) => sum + (fees[s.id] !== undefined ? fees[s.id] : s.defAmount), 0);
                        const approxAnnualTotal = annualTuition + admissionVal + annualExams + otherTotal;

                        return (
                          <div
                            key={g.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                          >
                            {/* Class Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                              <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-indigo-600/20">
                                  {g.id === '6th' ? '৬' : g.id === '7th' ? '৭' : g.id === '8th' ? '৮' : g.id === '9th' ? '৯' : '১০'}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">{g.name}</h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                                      {classStudentsCount} জন শিক্ষার্থী
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">
                                    শিক্ষার্থীপ্রতি আনুমানিক বার্ষিক মোট ফি: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">৳ {approxAnnualTotal.toLocaleString('bn-BD')}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Button: Add New Fee to This Class */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClassQuickAddModal({
                                      isOpen: true,
                                      gradeId: g.id,
                                      gradeName: g.name,
                                      selectedSectorId: '',
                                      customAmount: 200,
                                      isCreatingNewSector: false,
                                      newSectorName: '',
                                      newSectorAccountCode: '4060',
                                      newSectorFrequency: 'yearly'
                                    });
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ এই শ্রেণিতে নতুন ফি যুক্ত করুন</span>
                                </button>
                              </div>
                            </div>

                            {/* 3 Core Primary Fees */}
                            <div>
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                মূল অ্যাকাডেমিক ও আবশ্যিক ফি:
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {/* Monthly Tuition */}
                                <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between gap-2 shadow-2xs">
                                  <div>
                                    <span className="text-xs font-black text-slate-900 dark:text-white block">📚 মাসিক বেতন</span>
                                    <button
                                      type="button"
                                      onClick={() => handleApplySectorRateToAll('tuition', tuitionVal, 'মাসিক বেতন')}
                                      className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                                      title="এই রেট সকল শ্রেণিতে কপি করুন"
                                    >
                                      সব ক্লাসে কপি ➔
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold text-indigo-600">৳</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={tuitionVal}
                                      onChange={e => handleUpdateSingleClassFee(g.id, 'tuition', Number(e.target.value) || 0)}
                                      className="w-18 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-black text-indigo-700 dark:text-indigo-300 text-right outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                    />
                                  </div>
                                </div>

                                {/* Admission / Session */}
                                <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-900/60 flex items-center justify-between gap-2 shadow-2xs">
                                  <div>
                                    <span className="text-xs font-black text-slate-900 dark:text-white block">🎓 ভর্তি ও সেশন ফি</span>
                                    <button
                                      type="button"
                                      onClick={() => handleApplySectorRateToAll('admission', admissionVal, 'ভর্তি ও সেশন ফি')}
                                      className="text-[9px] text-purple-600 dark:text-purple-400 hover:underline font-bold cursor-pointer"
                                      title="এই রেট সকল শ্রেণিতে কপি করুন"
                                    >
                                      সব ক্লাসে কপি ➔
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold text-purple-600">৳</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={admissionVal}
                                      onChange={e => handleUpdateSingleClassFee(g.id, 'admission', Number(e.target.value) || 0)}
                                      className="w-18 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-black text-purple-700 dark:text-purple-300 text-right outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                                    />
                                  </div>
                                </div>

                                {/* Exam Fee */}
                                <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 shadow-2xs">
                                  <div>
                                    <span className="text-xs font-black text-slate-900 dark:text-white block">📝 পরীক্ষা ফি</span>
                                    <button
                                      type="button"
                                      onClick={() => handleApplySectorRateToAll('exam', examVal, 'পরীক্ষা ফি')}
                                      className="text-[9px] text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                                      title="এই রেট সকল শ্রেণিতে কপি করুন"
                                    >
                                      সব ক্লাসে কপি ➔
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-bold text-amber-600">৳</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={examVal}
                                      onChange={e => handleUpdateSingleClassFee(g.id, 'exam', Number(e.target.value) || 0)}
                                      className="w-18 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-black text-amber-700 dark:text-amber-300 text-right outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Secondary & Class-specific Fees */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  অন্যান্য ফি ও সেবা খাতসমূহ:
                                </label>
                                <span className="text-[10px] text-slate-400">
                                  রেট ০ টাকা হলে বা মুছে দিলে এই ক্লাসে ফি প্রযোজ্য হবে না
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 text-xs">
                                {activeSectors
                                  .filter(s => !['tuition', 'admission', 'exam'].includes(s.id))
                                  .filter(s => !s.applicableClasses || s.applicableClasses.includes(g.id))
                                  .map(s => {
                                    const val = fees[s.id] !== undefined ? fees[s.id] : s.defAmount;
                                    const freqBn = s.frequency === 'monthly' ? 'মাসিক' : s.frequency === 'one_time' ? 'এককালীন' : s.frequency === 'per_exam' ? 'পরীক্ষাকালীন' : s.frequency === 'on_demand' ? 'প্রয়োজনবোধে' : 'বাৎসরিক';

                                    return (
                                      <div
                                        key={s.id}
                                        className="p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-300 transition-colors group"
                                      >
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={s.name}>
                                              {s.name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-900/60">
                                              {freqBn}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleApplySectorRateToAll(s.id, val, s.name)}
                                              className="text-[9px] text-slate-400 hover:text-indigo-600 font-bold cursor-pointer"
                                              title="সকল শ্রেণিতে এই রেট কপি করুন"
                                            >
                                              সব ক্লাসে ➔
                                            </button>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          <input
                                            type="number"
                                            min="0"
                                            value={val}
                                            onChange={e => handleUpdateSingleClassFee(g.id, s.id, Number(e.target.value) || 0)}
                                            className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white text-right outline-none focus:ring-1 focus:ring-indigo-500"
                                          />
                                          <span className="text-[11px] text-slate-400">৳</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveClassFee(g.id, s.id, s.name)}
                                            className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                            title="এই ক্লাস থেকে সরান"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── VIEW 2: ADD NEW FEE HEAD & CLASS RATES ────────── */}
                {feeSetupSubView === 'new_fee' && (
                  <form
                    onSubmit={handleAddNewSectorSubmit}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6"
                  >
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center">
                          <PlusCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white">নতুন ফি খাত সৃষ্টি ও শ্রেণিভিত্তিক রেট নির্ধারণ</h3>
                          <p className="text-xs text-slate-500">
                            যেমন: বিজ্ঞানাগার/প্র্যাকটিক্যাল ফি, আইসিটি ল্যাব ফি, মডেল টেস্ট ফি, কোচিং ফি, রেডক্রিসেন্ট ও স্কাউট ফি
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 1: Basic Head Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          ফি খাতের নাম (বাংলা) *
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: বিজ্ঞানাগার ও প্র্যাকটিক্যাল ফি"
                          value={newSectorForm.name}
                          onChange={e => setNewSectorForm({ ...newSectorForm, name: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          ডিফল্ট ফির পরিমাণ (টাকা) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="২৫০"
                          value={newSectorForm.defAmount || ''}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            const updatedRates = { ...newSectorForm.classRates };
                            GRADES_LIST.forEach(g => {
                              if (newSectorForm.isSameRateForAll) updatedRates[g.id] = val;
                            });
                            setNewSectorForm({ ...newSectorForm, defAmount: val, classRates: updatedRates });
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          হিসাবের খতিয়ান (COA Revenue Head)
                        </label>
                        <select
                          value={newSectorForm.accountCode}
                          onChange={e => setNewSectorForm({ ...newSectorForm, accountCode: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                        >
                          <option value="4030">4030 - ভর্তি ও পুন:ভর্তি ফি আয়</option>
                          <option value="4020">4020 - পরীক্ষা ফি আয়</option>
                          <option value="4040">4040 - বোর্ড রেজিস্ট্রেশন ও ফরম পূরণ ফি</option>
                          <option value="4050">4050 - বিদায় অনুষ্ঠান ও সাংস্কৃতিক ফি</option>
                          <option value="4060">4060 - সেশন চার্জ, ল্যাব ও অন্যান্য সেবা</option>
                          <option value="4080">4080 - বিবিধ ও অন্যান্য ফি আয়</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          বিলিং চক্র (Billing Frequency)
                        </label>
                        <select
                          value={newSectorForm.frequency}
                          onChange={e => setNewSectorForm({ ...newSectorForm, frequency: e.target.value as any })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                        >
                          <option value="monthly">📅 প্রতি মাসে (Monthly)</option>
                          <option value="yearly">🗓️ বাৎসরিক (Yearly)</option>
                          <option value="one_time">🎯 এককালীন / সেশন শুরুতে (One-time)</option>
                          <option value="per_exam">📝 প্রতি পরীক্ষায় (Per Exam)</option>
                          <option value="on_demand">📄 প্রয়োজন সাপেক্ষে / আবেদনভিত্তিক (On-demand)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          ফি ক্যাটাগরি (Category)
                        </label>
                        <select
                          value={newSectorForm.category}
                          onChange={e => setNewSectorForm({ ...newSectorForm, category: e.target.value as any })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                        >
                          <option value="facility">🔬 সুবিধা ও ল্যাব (Facility/Lab)</option>
                          <option value="tuition">📚 শিক্ষা ও ক্লাস (Academic/Tuition)</option>
                          <option value="exam">📝 পরীক্ষা ও মূল্যায়ন (Exam)</option>
                          <option value="admission">🎓 ভর্তি ও সেশন (Admission)</option>
                          <option value="board">🏛️ বোর্ড রেজিস্ট্রেশন (Board)</option>
                          <option value="event">🎉 অনুষ্ঠান ও সাংস্কৃতিক (Event)</option>
                          <option value="service">📄 সনদ ও সেবা (Service)</option>
                          <option value="other">🏷️ অন্যান্য (Other)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          বিবরণ / নিয়মাবলী (ঐচ্ছিক)
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: বিজ্ঞান বিভাগের শিক্ষার্থীদের জন্য ল্যাব ফি"
                          value={newSectorForm.description}
                          onChange={e => setNewSectorForm({ ...newSectorForm, description: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Step 2: Applicable Classes Selection */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                          প্রযোজ্য শ্রেণি নির্বাচন করুন:
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (newSectorForm.applicableClasses.length === GRADES_LIST.length) {
                              setNewSectorForm({ ...newSectorForm, applicableClasses: [] });
                            } else {
                              setNewSectorForm({ ...newSectorForm, applicableClasses: GRADES_LIST.map(g => g.id) });
                            }
                          }}
                          className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
                        >
                          {newSectorForm.applicableClasses.length === GRADES_LIST.length ? 'সবগুলো আনচেক করুন' : 'সকল শ্রেণি সিলেক্ট করুন'}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {GRADES_LIST.map(g => {
                          const isSelected = newSectorForm.applicableClasses.includes(g.id);
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                const next = isSelected
                                  ? newSectorForm.applicableClasses.filter(x => x !== g.id)
                                  : [...newSectorForm.applicableClasses, g.id];
                                setNewSectorForm({ ...newSectorForm, applicableClasses: next });
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <span>{isSelected ? '✓' : '+'}</span>
                              <span>{g.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 3: Class-Specific Rates Inputs */}
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-black text-indigo-950 dark:text-indigo-200 block">
                            শ্রেণিভিত্তিক টাকার পরিমাণ (Class-wise Fee Rates):
                          </label>
                          <p className="text-[11px] text-slate-500">
                            সকল শ্রেণির জন্য একই ফি রাখতে পারেন অথবা শ্রেণিভেদে ভিন্ন ভিন্ন রেট দিতে পারেন
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const next = !newSectorForm.isSameRateForAll;
                              const updated = { ...newSectorForm.classRates };
                              if (next) {
                                GRADES_LIST.forEach(g => { updated[g.id] = newSectorForm.defAmount; });
                              }
                              setNewSectorForm({ ...newSectorForm, isSameRateForAll: next, classRates: updated });
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              newSectorForm.isSameRateForAll
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {newSectorForm.isSameRateForAll ? '✓ সব ক্লাসে একই রেট (৳' + newSectorForm.defAmount + ')' : 'শ্রেণিভেদে আলাদা রেট মোড'}
                          </button>
                        </div>
                      </div>

                      {/* Class Rate Inputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                        {GRADES_LIST.map(g => {
                          const isApplicable = newSectorForm.applicableClasses.includes(g.id);
                          const amt = newSectorForm.classRates[g.id] !== undefined ? newSectorForm.classRates[g.id] : newSectorForm.defAmount;

                          return (
                            <div
                              key={g.id}
                              className={`p-3 rounded-2xl border transition-all ${
                                isApplicable
                                  ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                                  : 'bg-slate-100/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{g.name}</span>
                                {isApplicable && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold">
                                    প্রযোজ্য
                                  </span>
                                )}
                              </div>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">৳</span>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={!isApplicable || newSectorForm.isSameRateForAll}
                                  value={amt}
                                  onChange={e => {
                                    const val = Number(e.target.value) || 0;
                                    setNewSectorForm({
                                      ...newSectorForm,
                                      classRates: { ...newSectorForm.classRates, [g.id]: val }
                                    });
                                  }}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-6 pr-2 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white disabled:bg-slate-100 disabled:dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setFeeSetupSubView('matrix')}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>+ নতুন ফি খাত সংরক্ষণ ও শ্রেণিসমূহে কার্যকর করুন</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* ─── VIEW 3: ALL FEE HEADS DIRECTORY ──────────────── */}
                {feeSetupSubView === 'directory' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">বিদ্যমান ফি খাতের পূর্ণাঙ্গ ডিরেক্টরি</h3>
                        <p className="text-[11px] text-slate-400">প্রতিটি খাতের নাম, ডিফল্ট রেট, খতিয়ান কোড এবং শ্রেণি কভারেজ</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300">
                        মোট {(feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS).length} টি খাত
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS)
                        .filter(s => {
                          if (!feeSetupSearchQuery) return true;
                          const q = feeSetupSearchQuery.toLowerCase();
                          return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.accountCode || '').includes(q);
                        })
                        .map(s => {
                          const freqBn = s.frequency === 'monthly' ? 'মাসিক' : s.frequency === 'one_time' ? 'এককালীন' : s.frequency === 'per_exam' ? 'পরীক্ষাকালীন' : s.frequency === 'on_demand' ? 'প্রয়োজন সাপেক্ষে' : 'বাৎসরিক';

                          return (
                            <div
                              key={s.id}
                              className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 hover:border-indigo-300 transition-all shadow-2xs group"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{s.name}</h4>
                                    <span className="text-[10px] font-mono text-slate-400">আইডি: #{s.id}</span>
                                  </div>
                                  <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900">
                                    ডিফল্ট ৳{s.defAmount}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                  {s.description || 'নিয়মিত অ্যাকাডেমিক ফি খাত'}
                                </p>

                                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800">
                                    {freqBn}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-mono font-bold border border-slate-200 dark:border-slate-800">
                                    খতিয়ান: {s.accountCode || '4060'}
                                  </span>
                                  {s.applicableClasses && s.applicableClasses.length < 5 && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                                      ক্লাস: {s.applicableClasses.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleApplySectorRateToAll(s.id, s.defAmount, s.name)}
                                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                                >
                                  সকল ক্লাসে ডিফল্ট রেট প্রয়োগ ➔
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteFeeSector(s.id, s.name)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="এই ফি খাতটি মুছে ফেলুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* ─── QUICK MODAL: ADD FEE SPECIFICALLY TO A CLASS ───── */}
                {classQuickAddModal.isOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
                            <Plus className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                              {classQuickAddModal.gradeName}-এ নতুন ফি বরাদ্দ করুন
                            </h3>
                            <p className="text-xs text-slate-500">
                              বিদ্যমান খাত থেকে নির্বাচন করুন অথবা শুধুমাত্র এই শ্রেণির জন্য নতুন ফি তৈরি করুন
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setClassQuickAddModal(prev => ({ ...prev, isOpen: false }))}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Toggle: Select Existing vs Create New */}
                      <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setClassQuickAddModal(prev => ({ ...prev, isCreatingNewSector: false }))}
                          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                            !classQuickAddModal.isCreatingNewSector
                              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          বিদ্যমান খাত থেকে যোগ
                        </button>
                        <button
                          type="button"
                          onClick={() => setClassQuickAddModal(prev => ({ ...prev, isCreatingNewSector: true }))}
                          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                            classQuickAddModal.isCreatingNewSector
                              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          + সম্পূর্ণ নতুন খাত তৈরি
                        </button>
                      </div>

                      <form onSubmit={handleQuickAddClassFeeSubmit} className="space-y-3.5 text-xs">
                        {!classQuickAddModal.isCreatingNewSector ? (
                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              ফি খাত নির্বাচন করুন *
                            </label>
                            <select
                              value={classQuickAddModal.selectedSectorId}
                              onChange={e => {
                                const secId = e.target.value;
                                const sec = feeSectors.find(s => s.id === secId);
                                setClassQuickAddModal(prev => ({
                                  ...prev,
                                  selectedSectorId: secId,
                                  customAmount: sec ? sec.defAmount : prev.customAmount
                                }));
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                              required
                            >
                              <option value="">-- যেকোনো একটি ফি খাত বাছুন --</option>
                              {(feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS).map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name} (ডিফল্ট: ৳{s.defAmount})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                নতুন ফি খাতের নাম *
                              </label>
                              <input
                                type="text"
                                placeholder="যেমন: কম্পিউটার ল্যাব ফি / স্কাউট ফি"
                                value={classQuickAddModal.newSectorName}
                                onChange={e => setClassQuickAddModal(prev => ({ ...prev, newSectorName: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-bold"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                  বিলিং চক্র
                                </label>
                                <select
                                  value={classQuickAddModal.newSectorFrequency}
                                  onChange={e => setClassQuickAddModal(prev => ({ ...prev, newSectorFrequency: e.target.value as any }))}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                                >
                                  <option value="yearly">বাৎসরিক</option>
                                  <option value="monthly">প্রতি মাসে</option>
                                  <option value="one_time">এককালীন</option>
                                  <option value="per_exam">প্রতি পরীক্ষা</option>
                                </select>
                              </div>

                              <div>
                                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                  খতিয়ান কোড
                                </label>
                                <select
                                  value={classQuickAddModal.newSectorAccountCode}
                                  onChange={e => setClassQuickAddModal(prev => ({ ...prev, newSectorAccountCode: e.target.value }))}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                                >
                                  <option value="4060">4060 - অন্যান্য ফি</option>
                                  <option value="4030">4030 - ভর্তি ফি</option>
                                  <option value="4020">4020 - পরীক্ষা ফি</option>
                                </select>
                              </div>
                            </div>
                          </>
                        )}

                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            {classQuickAddModal.gradeName}-এর জন্য ফির পরিমাণ (টাকা) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">৳</span>
                            <input
                              type="number"
                              min="0"
                              value={classQuickAddModal.customAmount}
                              onChange={e => setClassQuickAddModal(prev => ({ ...prev, customAmount: Number(e.target.value) || 0 }))}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setClassQuickAddModal(prev => ({ ...prev, isOpen: false }))}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold cursor-pointer"
                          >
                            বাতিল
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md cursor-pointer"
                          >
                            {classQuickAddModal.gradeName}-এ ফি যুক্ত করুন
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* FEE SUB-TAB: সফটওয়্যার শুরু ও পূর্বের বকেয়া সেটআপ           */}
            {/* ══════════════════════════════════════════════════════════ */}
            {feeSubTab === 'opening_due' && (
              <div className="space-y-6">
                {/* 1. Go-Live Start Month Configuration */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          সফটওয়্যার শুরুর মাস ও প্রাক-বকেয়া নীতি (Go-Live Configuration)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          সফটওয়্যার শুরুর পূর্ববর্তী মাসসমূহের বকেয়া মুক্ত রাখা এবং সঠিক শুরুর মাস নির্ধারণ
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      বর্তমান শুরুর মাস: {financeSettings.systemStartMonth} {financeSettings.systemStartYear}
                    </span>
                  </div>

                  {goLiveAlert && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{goLiveAlert}</span>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      গুরুত্বপূর্ণ নির্দেশিকা:
                    </p>
                    <p>
                      যদি আপনার বিদ্যালয় সেপ্টেম্বর মাস থেকে এই সফটওয়্যারে হিসাব শুরু করে, তবে শুরুর মাস হিসেবে <strong>'সেপ্টেম্বর'</strong> নির্বাচন করুন এবং প্রাক-মাস ব্যবস্থা হিসেবে <strong>'স্বয়ংক্রিয় পরিশোধিত'</strong> রাখুন। এর ফলে জানুয়ারি থেকে আগস্ট পর্যন্ত শিক্ষার্থীদের ওপর কোনো কৃত্রিম বা ভুয়া বকেয়া চাপবে না। শুধুমাত্র সেপ্টেম্বর মাস থেকে যথারীতি নতুন বিলিং ও ইনভয়েস প্রযোজ্য হবে।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                        সফটওয়্যার চালুর মাস (Start Month) *
                      </label>
                      <select
                        value={goLiveStartMonth}
                        onChange={e => setGoLiveStartMonth(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        {BANGLA_MONTHS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                        শিক্ষাবর্ষ / সেশন *
                      </label>
                      <input
                        type="number"
                        value={goLiveStartYear}
                        onChange={e => setGoLiveStartYear(Number(e.target.value) || 2026)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                        শুরুর পূর্বের মাসসমূহের ব্যবস্থা *
                      </label>
                      <select
                        value={goLivePreStartMode}
                        onChange={e => setGoLivePreStartMode(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="settled">স্বয়ংক্রিয় পরিশোধিত (কোনো বকেয়া থাকবে না - সুপারিশকৃত)</option>
                        <option value="waived">মওকুফ করা হবে (Waived)</option>
                        <option value="due">বকেয়া হিসেবে বহাল থাকবে (Full Due)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleGoLiveApply}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/30 cursor-pointer transition-all active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>সেটিংস প্রয়োগ ও সকল শিক্ষার্থীর লেজার সমন্বয় করুন</span>
                    </button>
                  </div>
                </div>

                {/* 2. Student Opening Arrears Entry Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        শিক্ষার্থীদের পূর্ববর্তী বকেয়া অ্যান্ট্রি (Student Opening Arrears)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        সফটওয়্যার চালুর পূর্বে কোনো শিক্ষার্থীর পূর্বের বছরের বা ভর্তির কোনো বকেয়া থাকলে তা এখানে এন্ট্রি দিন
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={openingDueGradeFilter}
                        onChange={e => setOpeningDueGradeFilter(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer font-medium"
                      >
                        <option value="all">🎓 সকল শ্রেণি</option>
                        {GRADES_LIST.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="নাম / রোল দিয়ে খুঁজুন..."
                          value={openingDueSearch}
                          onChange={e => setOpeningDueSearch(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Opening Due Table */}
                  <div className="overflow-x-auto">
                    {(() => {
                      const displayedStudents = students.filter(s => {
                        const matchGrade = openingDueGradeFilter === 'all' || s.grade === openingDueGradeFilter;
                        const matchSearch = !openingDueSearch ||
                          s.name.toLowerCase().includes(openingDueSearch.toLowerCase()) ||
                          s.roll.toString().includes(openingDueSearch);
                        return matchGrade && matchSearch;
                      });

                      return (
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                              <th className="p-3">রোল</th>
                              <th className="p-3">শিক্ষার্থীর নাম</th>
                              <th className="p-3">শ্রেণি</th>
                              <th className="p-3">পূর্বের মোট বকেয়া (৳)</th>
                              <th className="p-3">পরিশোধিত (৳)</th>
                              <th className="p-3 text-rose-600">অবশিষ্ট পূর্ব-বকেয়া</th>
                              <th className="p-3">নতুন পূর্ব-বকেয়া নির্ধারণ (৳)</th>
                              <th className="p-3">নোট / বিবরণ</th>
                              <th className="p-3 text-right">সংরক্ষণ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {displayedStudents.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-6 text-center text-slate-500">
                                  কোন শিক্ষার্থী পাওয়া যায়নি
                                </td>
                              </tr>
                            ) : (
                              displayedStudents.map(st => {
                                const ledger = allStudentLedgers[st.id] || financeService.getStudentFeeLedger(st.id, normalizeGradeKey(st.grade));
                                const currentOpenDue = ledger.openingDue || 0;
                                const currentOpenPaid = ledger.openingDuePaid || 0;
                                const currentOpenRem = ledger.openingDueRemaining !== undefined ? ledger.openingDueRemaining : Math.max(0, currentOpenDue - currentOpenPaid);

                                return (
                                  <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                    <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">#{st.roll}</td>
                                    <td className="p-3 font-bold text-slate-900 dark:text-white">{st.name}</td>
                                    <td className="p-3 text-slate-500">{st.grade} ({st.section || 'ক'})</td>
                                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                                      ৳ {currentOpenDue.toLocaleString('bn-BD')}
                                    </td>
                                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      ৳ {currentOpenPaid.toLocaleString('bn-BD')}
                                    </td>
                                    <td className="p-3 font-mono font-black text-rose-600 dark:text-rose-400">
                                      ৳ {currentOpenRem.toLocaleString('bn-BD')}
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder={String(currentOpenDue)}
                                        value={openingDueInputs[st.id] !== undefined ? openingDueInputs[st.id] : ''}
                                        onChange={e => setOpeningDueInputs({ ...openingDueInputs, [st.id]: e.target.value })}
                                        className="w-28 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        placeholder={ledger.openingDueNote || "যেমন: পূর্ববর্তী বছরের বকেয়া"}
                                        value={openingDueNotes[st.id] !== undefined ? openingDueNotes[st.id] : ''}
                                        onChange={e => setOpeningDueNotes({ ...openingDueNotes, [st.id]: e.target.value })}
                                        className="w-40 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                    </td>
                                    <td className="p-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveOpeningDue(st.id)}
                                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                                      >
                                        সংরক্ষণ
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* FEE SUB-TAB 2: বকেয়া রিপোর্ট (DUE REPORT)               */}
            {/* ══════════════════════════════════════════════════════════ */}
            {feeSubTab === 'due_report' && (() => {
              const classWiseReport = financeService.getClassWiseDueReport(
                allStudentLedgers,
                students.map(s => ({ id: s.id, grade: s.grade || '6th', name: s.name, roll: s.roll, section: s.section }))
              );
              const totalAllDue = classWiseReport.reduce((sum, c) => sum + c.totalDue, 0);
              const totalAllStudents = classWiseReport.reduce((sum, c) => sum + c.totalStudents, 0);
              const totalWithDue = classWiseReport.reduce((sum, c) => sum + c.studentsWithDue, 0);

              return (
                <div className="space-y-4">
                  {/* Print Header for Class-wise Due Report */}
                  <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-4 text-black">
                    <h1 className="text-xl font-black tracking-tight">বরইতলী উচ্চ বিদ্যালয়</h1>
                    <p className="text-xs text-gray-700 font-medium">বরইতলী, চকরিয়া, কক্সবাজার • EIIN: 106184 • স্থাপিত: ১৯৬৯</p>
                    <div className="mt-2 inline-block border border-black px-3 py-1 rounded text-xs font-black uppercase">
                      শ্রেণিভিত্তিক শিক্ষার্থী ফি বকেয়া বিবরণী ও তলব তালিকা
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-600 mt-2 px-2">
                      <span>অর্থবছর / সেশন: ২০২৬</span>
                      <span>মুদ্রণ তারিখ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Report Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        শ্রেণিভিত্তিক বকেয়া বিবরণী ও তলব তালিকা
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">মোট {totalAllStudents} শিক্ষার্থী • {totalWithDue} জনের বকেয়া আছে • সর্বমোট বকেয়া: ৳{totalAllDue.toLocaleString('bn-BD')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedDueStudentsForSMS.length > 0 && (
                        <button
                          type="button"
                          disabled={smsSendingState.isSending}
                          onClick={handleSendDueSMSBulk}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{smsSendingState.isSending ? 'পাঠানো হচ্ছে...' : `নির্বাচিত (${selectedDueStudentsForSMS.length} জন) SMS পাঠান`}</span>
                        </button>
                      )}
                      <button type="button" onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer">
                        <Printer className="w-3.5 h-3.5" />
                        <span>বকেয়া তালিকা প্রিন্ট</span>
                      </button>
                    </div>
                  </div>

                  {smsSendingState.result && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{smsSendingState.result}</span>
                    </div>
                  )}

                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {classWiseReport.map(cls => (
                      <div key={cls.grade} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-center shadow-2xs">
                        <p className="text-[10px] font-bold text-slate-500 truncate">{cls.gradeName}</p>
                        <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-1">৳{Math.round(cls.totalDue / 1000)}K</p>
                        <p className="text-[10px] text-slate-400">{cls.studentsWithDue} জন বকেয়া</p>
                      </div>
                    ))}
                  </div>

                  {/* Class-wise Due Tables */}
                  {classWiseReport.filter(c => c.totalStudents > 0).map(cls => (
                    <div key={cls.grade} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      {/* Class Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-900 dark:text-white">{cls.gradeName}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{cls.totalStudents} জন</span>
                          {cls.studentsWithDue > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold">{cls.studentsWithDue} জন বকেয়া</span>}
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-slate-500">বিল: <strong className="text-slate-900 dark:text-white">৳{cls.totalBilled.toLocaleString('bn-BD')}</strong></span>
                          <span className="text-emerald-600 dark:text-emerald-400">আদায়: <strong>৳{cls.totalPaid.toLocaleString('bn-BD')}</strong></span>
                          <span className="text-rose-600 dark:text-rose-400 font-black">বকেয়া: ৳{cls.totalDue.toLocaleString('bn-BD')}</span>
                        </div>
                      </div>

                      {/* Student Table */}
                      {cls.students.filter(s => s.totalDue > 0).length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-rose-50 dark:bg-rose-950/20 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-2.5 w-8">
                                  <input
                                    type="checkbox"
                                    title="সবাইকে নির্বাচন করুন"
                                    onChange={e => {
                                      const classDueStudentIds = cls.students.filter(s => s.totalDue > 0).map(s => s.id);
                                      if (e.target.checked) {
                                        setSelectedDueStudentsForSMS(Array.from(new Set([...selectedDueStudentsForSMS, ...classDueStudentIds])));
                                      } else {
                                        setSelectedDueStudentsForSMS(selectedDueStudentsForSMS.filter(id => !classDueStudentIds.includes(id)));
                                      }
                                    }}
                                    checked={cls.students.filter(s => s.totalDue > 0).every(s => selectedDueStudentsForSMS.includes(s.id))}
                                    className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                                  />
                                </th>
                                <th className="p-2.5">রোল</th>
                                <th className="p-2.5">শিক্ষার্থীর নাম</th>
                                <th className="p-2.5">শাখা</th>
                                <th className="p-2.5">আদায়কৃত</th>
                                <th className="p-2.5 text-rose-600 dark:text-rose-400">বকেয়া (৳)</th>
                                <th className="p-2.5">বকেয়া মাসগুলো</th>
                                <th className="p-2.5 text-right">আদায়</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {cls.students.filter(s => s.totalDue > 0).map((st, idx) => (
                                <tr key={idx} className="hover:bg-rose-50/30 dark:hover:bg-slate-900/40 transition-colors">
                                  <td className="p-2.5">
                                    <input
                                      type="checkbox"
                                      checked={selectedDueStudentsForSMS.includes(st.id)}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          setSelectedDueStudentsForSMS([...selectedDueStudentsForSMS, st.id]);
                                        } else {
                                          setSelectedDueStudentsForSMS(selectedDueStudentsForSMS.filter(id => id !== st.id));
                                        }
                                      }}
                                      className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-2.5 font-mono font-bold text-slate-600 dark:text-slate-400">#{st.roll}</td>
                                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">{st.name}</td>
                                  <td className="p-2.5 text-slate-500">{st.section}</td>
                                  <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-bold">৳{st.totalPaid.toLocaleString('bn-BD')}</td>
                                  <td className="p-2.5">
                                    <span className="inline-block px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-black text-[11px]">৳{st.totalDue.toLocaleString('bn-BD')}</span>
                                  </td>
                                  <td className="p-2.5 text-[10px] text-slate-500 max-w-[160px] truncate">{st.monthsDue.slice(0, 4).join(', ')}{st.monthsDue.length > 4 ? ` +${st.monthsDue.length - 4}` : ''}</td>
                                  <td className="p-2.5 text-right">
                                    <button type="button"
                                      onClick={() => {
                                        const fullSt = students.find(s => s.id === st.id);
                                        if (fullSt) { handleSelectStudent(fullSt); setFeeSubTab('collection'); }
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer transition-all">
                                      আদায়
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ এই শ্রেণির সকল শিক্ষার্থী পরিশোধিত
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Print Signature Block */}
                  <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t border-black mt-8">
                    <div className="text-center">
                      <p className="border-t border-black px-6 pt-1 font-semibold">আদায়কারী / হিসাব সহকারী</p>
                    </div>
                    <div className="text-center">
                      <p className="border-t border-black px-6 pt-1 font-semibold">হিসাবরক্ষক</p>
                    </div>
                    <div className="text-center">
                      <p className="border-t border-black px-6 pt-1 font-semibold">প্রধান শিক্ষক</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* FEE SUB-TAB 3: পেমেন্ট হিস্ট্রি (PAYMENT HISTORY)        */}
            {/* ══════════════════════════════════════════════════════════ */}
            {feeSubTab === 'history' && (
              <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">ফি আদায় রেজিস্টার (Payment History)</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{filteredPaymentHistory.length} টি</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Payment method filter */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      {['all', 'Cash', 'bKash', 'Nagad', 'Bank Transfer'].map(m => (
                        <button key={m} onClick={() => setPaymentHistoryFilter(m)}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${paymentHistoryFilter === m ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>
                          {m === 'all' ? 'সব' : m}
                        </button>
                      ))}
                    </div>
                    {/* Grade filter */}
                    <select value={historyGradeFilter} onChange={e => setHistoryGradeFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer">
                      <option value="all">🎓 সব শ্রেণি</option>
                      <option value="6th">৬ষ্ঠ শ্রেণি</option>
                      <option value="7th">৭ম শ্রেণি</option>
                      <option value="8th">৮ম শ্রেণি</option>
                      <option value="9th">৯ম শ্রেণি</option>
                      <option value="10th">১০ম শ্রেণি</option>
                    </select>
                    {/* Month filter */}
                    <select value={historyMonthFilter} onChange={e => setHistoryMonthFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer">
                      <option value="all">📅 সব মাস</option>
                      {['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'].map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                      <input type="text" placeholder="রসিদ/নাম/TrxID..."
                        value={paymentHistorySearch} onChange={e => setPaymentHistorySearch(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-400" />
                    </div>
                    {/* Reset filters button */}
                    {(historyGradeFilter !== 'all' || historyMonthFilter !== 'all' || paymentHistoryFilter !== 'all' || paymentHistorySearch) && (
                      <button onClick={() => { setHistoryGradeFilter('all'); setHistoryMonthFilter('all'); setPaymentHistoryFilter('all'); setPaymentHistorySearch(''); }}
                        className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer">
                        ✕ ফিল্টার রিসেট
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-3">রসিদ নং</th>
                        <th className="p-3">শিক্ষার্থী</th>
                        <th className="p-3">শ্রেণি</th>
                        <th className="p-3">পরিশোধিত খাত</th>
                        <th className="p-3">আদায় (৳)</th>
                        <th className="p-3">বকেয়া</th>
                        <th className="p-3">মাধ্যম</th>
                        <th className="p-3">তারিখ</th>
                        <th className="p-3 text-right">রসিদ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {filteredPaymentHistory.length === 0 ? (
                        <tr><td colSpan={9} className="p-6 text-center text-slate-500">কোন পেমেন্ট রেকর্ড পাওয়া যায়নি</td></tr>
                      ) : filteredPaymentHistory.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{rec.receiptId}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-900 dark:text-white">{rec.studentName}</p>
                            <p className="text-[10px] text-slate-400">রোল: #{rec.roll}</p>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{rec.grade} ({rec.section || 'ক'})</td>
                          <td className="p-3 max-w-xs text-[11px] text-slate-500">{rec.feeItems.map(f => f.name).join(', ')}</td>
                          <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">৳ {rec.paidAmount.toLocaleString('bn-BD')}</td>
                          <td className="p-3">
                            {rec.dueRemaining && rec.dueRemaining > 0
                              ? <span className="text-rose-600 dark:text-rose-400 font-bold text-[11px]">৳{rec.dueRemaining} বাকি</span>
                              : <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">পরিশোধিত</span>}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.paymentMethod === 'Cash' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : rec.paymentMethod === 'bKash' ? 'bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-400'
                              : rec.paymentMethod === 'Nagad' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                              : 'bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400'
                            }`}>{rec.paymentMethod}</span>
                            {rec.trxId && <p className="text-[9px] font-mono text-slate-500 mt-0.5">{rec.trxId}</p>}
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{rec.date}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => setPrintReceiptData(rec)}
                              className="px-2.5 py-1 rounded bg-indigo-100 dark:bg-indigo-600/20 hover:bg-indigo-200 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-500/30 transition-all flex items-center gap-1 ml-auto">
                              <Printer className="w-3 h-3" />
                              <span>রসিদ</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* FEE SUB-TAB 4: মাসিক বিশ্লেষণ (MONTHLY ANALYSIS)         */}
            {/* ══════════════════════════════════════════════════════════ */}
            {feeSubTab === 'monthly_analysis' && (() => {
              const monthlyReport = financeService.getMonthWiseCollectionReport(
                paymentHistory.map(p => ({ date: p.date, paidAmount: p.paidAmount, paymentMethod: p.paymentMethod, grade: p.grade }))
              );
              const maxCollected = Math.max(...monthlyReport.map(m => m.totalCollected), 1);
              const totalYearCollected = monthlyReport.reduce((sum, m) => sum + m.totalCollected, 0);
              const totalTransactions = monthlyReport.reduce((sum, m) => sum + m.transactionCount, 0);

              return (
                <div className="space-y-4">
                  {/* Print Header for Monthly Analysis */}
                  <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-4 text-black">
                    <h1 className="text-xl font-black tracking-tight">বরইতলী উচ্চ বিদ্যালয়</h1>
                    <p className="text-xs text-gray-700 font-medium">বরইতলী, চকরিয়া, কক্সবাজার • EIIN: 106184 • স্থাপিত: ১৯৬৯</p>
                    <div className="mt-2 inline-block border border-black px-3 py-1 rounded text-xs font-black uppercase">
                      মাসওয়ারি ফি আদায় ও বার্ষিক আর্থিক রাজস্ব বিশ্লেষণ প্রতিবেদন
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-600 mt-2 px-2">
                      <span>অর্থবছর / সেশন: ২০২৬</span>
                      <span>মুদ্রণ তারিখ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Summary Header */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
                      <p className="text-[11px] font-bold text-slate-500">বার্ষিক মোট আদায়</p>
                      <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">৳ {totalYearCollected.toLocaleString('bn-BD')}</h4>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
                      <p className="text-[11px] font-bold text-slate-500">মোট লেনদেন</p>
                      <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalTransactions} টি</h4>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
                      <p className="text-[11px] font-bold text-slate-500">গড় মাসিক আদায়</p>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">৳ {Math.round(totalYearCollected / 12).toLocaleString('bn-BD')}</h4>
                    </div>
                  </div>

                  {/* Monthly Bar Chart (pure CSS) */}
                  <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        মাসওয়ারি ফি আদায় বিশ্লেষণ — ২০২৬
                      </h3>
                      <button type="button" onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                        <Printer className="w-3.5 h-3.5" />
                        <span>প্রিন্ট</span>
                      </button>
                    </div>

                    {/* Bar Chart */}
                    <div className="flex items-end gap-1.5 h-40 mb-2 overflow-x-auto pb-1">
                      {monthlyReport.map((m, idx) => {
                        const pct = maxCollected > 0 ? (m.totalCollected / maxCollected) * 100 : 0;
                        const currentMonth = new Date().getMonth();
                        const isCurrentMonth = idx === currentMonth;
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1 flex-1 min-w-[32px]">
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                              {m.totalCollected > 0 ? `${Math.round(m.totalCollected / 1000)}K` : '—'}
                            </span>
                            <div className="w-full relative" style={{ height: '100px' }}>
                              <div
                                className={`absolute bottom-0 w-full rounded-t-lg transition-all ${
                                  isCurrentMonth ? 'bg-indigo-600 dark:bg-indigo-500'
                                  : m.totalCollected > 0 ? 'bg-emerald-500 dark:bg-emerald-600'
                                  : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                                style={{ height: `${Math.max(pct, m.totalCollected > 0 ? 5 : 2)}%` }}
                                title={`${m.month}: ৳${m.totalCollected.toLocaleString('bn-BD')}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {monthlyReport.map((m, idx) => (
                        <div key={idx} className="flex-1 min-w-[32px] text-center text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate">{m.month.substring(0, 3)}</div>
                      ))}
                    </div>

                    {/* Monthly Table */}
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <th className="p-2.5">মাস</th>
                            <th className="p-2.5 text-emerald-600">ক্যাশ আদায়</th>
                            <th className="p-2.5 text-indigo-600">ডিজিটাল আদায়</th>
                            <th className="p-2.5 text-slate-900 dark:text-white">মোট আদায়</th>
                            <th className="p-2.5">লেনদেন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {monthlyReport.map((m, idx) => (
                            <tr key={idx} className={`transition-colors ${m.totalCollected > 0 ? 'hover:bg-emerald-50/30 dark:hover:bg-slate-900/40' : 'opacity-50'}`}>
                              <td className={`p-2.5 font-bold ${idx === new Date().getMonth() ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{m.month}</td>
                              <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-mono">{m.cashCollected > 0 ? `৳ ${m.cashCollected.toLocaleString('bn-BD')}` : '—'}</td>
                              <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-mono">{m.digitalCollected > 0 ? `৳ ${m.digitalCollected.toLocaleString('bn-BD')}` : '—'}</td>
                              <td className="p-2.5 font-black text-slate-900 dark:text-white font-mono">{m.totalCollected > 0 ? `৳ ${m.totalCollected.toLocaleString('bn-BD')}` : '—'}</td>
                              <td className="p-2.5 text-slate-500">{m.transactionCount > 0 ? `${m.transactionCount} টি` : '—'}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 dark:bg-slate-950 font-black text-sm border-t-2 border-slate-300 dark:border-slate-700">
                            <td className="p-2.5">মোট বার্ষিক</td>
                            <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-mono">৳ {monthlyReport.reduce((s, m) => s + m.cashCollected, 0).toLocaleString('bn-BD')}</td>
                            <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-mono">৳ {monthlyReport.reduce((s, m) => s + m.digitalCollected, 0).toLocaleString('bn-BD')}</td>
                            <td className="p-2.5 text-slate-900 dark:text-white font-mono">৳ {totalYearCollected.toLocaleString('bn-BD')}</td>
                            <td className="p-2.5 text-slate-600">{totalTransactions} টি</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Print Signature Block */}
                    <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t border-black mt-8">
                      <div className="text-center">
                        <p className="border-t border-black px-6 pt-1 font-semibold">হিসাবরক্ষকের স্বাক্ষর</p>
                      </div>
                      <div className="text-center">
                        <p className="border-t border-black px-6 pt-1 font-semibold">অর্থ কমিটি আহ্বায়ক</p>
                      </div>
                      <div className="text-center">
                        <p className="border-t border-black px-6 pt-1 font-semibold">প্রধান শিক্ষক</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* FEE SUB-TAB: অডিট ও সিকিউরিটি লগ (AUDIT TRAIL)          */}
            {/* ══════════════════════════════════════════════════════════ */}
            {feeSubTab === 'audit_log' && (
              <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        আর্থিক অডিট ট্রেইল ও নিরাপত্তা লগ (Financial Audit Trail)
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        কে, কখন কোন লেনদেন বা পরিবর্তন করেছেন তার অপরিবর্তনীয় রেকর্ড ({auditLogs.length} টি রেকর্ড সংরক্ষিত)
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="লগ খুঁজুন (অ্যাকশন, ইউজার, বিবরণ)..."
                      value={auditSearch}
                      onChange={e => setAuditSearch(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {(() => {
                    const filteredLogs = auditLogs.filter(log => {
                      if (!auditSearch) return true;
                      const q = auditSearch.toLowerCase();
                      return (
                        (log.action && String(log.action).toLowerCase().includes(q)) ||
                        (log.performedBy && String(log.performedBy).toLowerCase().includes(q)) ||
                        (log.details && String(log.details).toLowerCase().includes(q)) ||
                        (log.targetId && String(log.targetId).toLowerCase().includes(q))
                      );
                    });

                    return (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <th className="p-3">সময় ও তারিখ</th>
                            <th className="p-3">অ্যাকশন টাইপ</th>
                            <th className="p-3">ব্যবহারকারী</th>
                            <th className="p-3">রেফারেন্স / আইডি</th>
                            <th className="p-3">বিস্তারিত বিবরণ</th>
                            <th className="p-3 text-center">মাত্রা (Severity)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500">
                                কোনো অডিট লগ পাওয়া যায়নি
                              </td>
                            </tr>
                          ) : (
                            filteredLogs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                  {log.timestamp ? new Date(log.timestamp).toLocaleString('bn-BD') : 'N/A'}
                                </td>
                                <td className="p-3">
                                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                  {log.performedBy}
                                </td>
                                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                                  {log.targetId || '—'}
                                </td>
                                <td className="p-3 text-slate-700 dark:text-slate-300 max-w-md">
                                  {log.details}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    log.severity === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                    : log.severity === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  }`}>
                                    {log.severity || 'info'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* TAB 2: PAYROLL                                                */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            {/* Print Header for Payroll */}
            <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-4 text-black">
              <h1 className="text-xl font-black tracking-tight">বরইতলী উচ্চ বিদ্যালয়</h1>
              <p className="text-xs text-gray-700 font-medium">বরইতলী, চকরিয়া, কক্সবাজার • EIIN: 106184 • স্থাপিত: ১৯৬৯</p>
              <div className="mt-2 inline-block border border-black px-3 py-1 rounded text-xs font-black uppercase">
                শিক্ষক ও কর্মচারী মাসিক বেতন-ভাতা বিবরণী ও পে-রোল রেজিস্টার
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-600 mt-2 px-2">
                <span>অর্থবছর / সেশন: ২০২৬</span>
                <span>মুদ্রণ তারিখ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  শিক্ষক ও স্টাফ পে-রোল (Payroll Management)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  মাসিক মূল বেতন, বাড়িভাড়া ভাতা, বোনাস ও প্রভিডেন্ট ফান্ড সমন্বয়
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>পে-রোল প্রিন্ট</span>
                </button>
                <button
                  onClick={() => setShowPayrollModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন বেতন বিতরণ</span>
                </button>
              </div>
            </div>

            {/* Payroll History Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4 print:border-none print:p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse print:text-black">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                      <th className="p-3">ভাউচার নং</th>
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
                    {payrolls.map((pay, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">{pay.voucherNo}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">{pay.teacherName}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{pay.designation}</td>
                        <td className="p-3">{pay.month} {pay.year}</td>
                        <td className="p-3 text-right font-mono font-bold">৳ {pay.baseSalary.toLocaleString('bn-BD')}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 print:text-black">+ ৳ {(pay.allowances + pay.bonus).toLocaleString('bn-BD')}</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-700 dark:text-rose-400 print:text-black">- ৳ {pay.deductions.toLocaleString('bn-BD')}</td>
                        <td className="p-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-300 print:text-black">৳ {pay.netPayable.toLocaleString('bn-BD')}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                            {pay.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-right print:hidden">
                          <button
                            onClick={() => setPrintSalarySlip(pay)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-500/30 cursor-pointer"
                          >
                            স্যালারি স্লিপ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Print Signature Block */}
              <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t border-black mt-8">
                <div className="text-center">
                  <p className="border-t border-black px-6 pt-1 font-semibold">হিসাবরক্ষকের স্বাক্ষর</p>
                </div>
                <div className="text-center">
                  <p className="border-t border-black px-6 pt-1 font-semibold">অর্থ কমিটি আহ্বায়ক</p>
                </div>
                <div className="text-center">
                  <p className="border-t border-black px-6 pt-1 font-semibold">প্রধান শিক্ষক</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EXPENSES                                               */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-400" />
                  দৈনন্দিন ব্যয় রেজিস্টার (Expense Ledger)
                </h2>
                <p className="text-xs text-slate-400">
                  বিদ্যুৎ বিল, স্টেশনারি, ল্যাব সামগ্রী, মেরামত ও বিবিধ ব্যয় এন্ট্রি
                </p>
              </div>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন খরচ এন্ট্রি (Add Expense)</span>
              </button>
            </div>

            {/* Expenses Table */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">ভাউচার নং</th>
                      <th className="p-3">ব্যয় খাত (Category)</th>
                      <th className="p-3">বিবরণ (Note)</th>
                      <th className="p-3">প্রাপক (Paid To)</th>
                      <th className="p-3">পরিমাণ (টাকা)</th>
                      <th className="p-3">মাধ্যম</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3 text-right">ভাউচার প্রিন্ট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {expenses.map((exp, idx) => (
                      <tr key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-100 dark:hover:bg-slate-900/40">
                        <td className="p-3 font-mono font-bold text-sky-400">{exp.voucherNo}</td>
                        <td className="p-3 font-bold text-white">{exp.category}</td>
                        <td className="p-3 text-slate-400">{exp.note || 'N/A'}</td>
                        <td className="p-3">{exp.paidTo}</td>
                        <td className="p-3 font-black text-rose-400">৳ {exp.amount}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {exp.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{exp.date}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setPrintExpenseSlip(exp)}
                            className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs border border-indigo-500/30"
                          >
                            ভাউচার স্লিপ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* TAB 4: CASH & BANK                                            */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'cash_bank' && (
          <div className="space-y-6">
            {/* Print Header for Cash & Bank */}
            <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-4 text-black">
              <h1 className="text-xl font-black tracking-tight">বরইতলী উচ্চ বিদ্যালয়</h1>
              <p className="text-xs text-gray-700 font-medium">বরইতলী, চকরিয়া, কক্সবাজার • EIIN: 106184 • স্থাপিত: ১৯৬৯</p>
              <div className="mt-2 inline-block border border-black px-3 py-1 rounded text-xs font-black uppercase">
                ক্যাশ ও ব্যাংক হিসাব স্থিতি বিবরণী এবং কন্ট্রা ট্রান্সফার খতিয়ান
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-600 mt-2 px-2">
                <span>অর্থবছর / সেশন: ২০২৬</span>
                <span>মুদ্রণ তারিখ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  ক্যাশ ও ব্যাংক হিসাব ব্যবস্থাপনা (Cash & Bank Management)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  হাতে নগদ ড্রয়ার, সোনালী, ইসলামী ব্যাংক ও ডাচ্-বাংলা ব্যাংক হিসাব, ব্যালেন্স এডিট ও ফান্ড ট্রান্সফার
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleResetAllBankBalances}
                  title="সকল ব্যাংকের ডেমো ব্যালেন্স ০ করতে ক্লিক করুন"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800/60 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>ব্যালেন্স রিসেট (৳০)</span>
                </button>
                <button
                  onClick={() => handleOpenBankModal(null)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800/60 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>নতুন ব্যাংক হিসাব</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>স্থিতি প্রিন্ট</span>
                </button>
                <button
                  onClick={() => setShowBankTransferModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>ব্যাংকে অর্থ জমা ও ফান্ড ট্রান্সফার</span>
                </button>
              </div>
            </div>

            {/* Bank Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bankAccounts.map((b, idx) => (
                <div key={b.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-3 print:bg-white print:border-black relative group transition-all hover:border-sky-300 dark:hover:border-sky-700">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-500/20 font-bold">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
                        কোড: {b.accountCode}
                      </span>
                      <button
                        onClick={() => handleOpenBankModal(b)}
                        className="print:hidden p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="ব্যাংক হিসাব ও ব্যালেন্স এডিট করুন"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {bankAccounts.length > 1 && (
                        <button
                          onClick={() => handleDeleteBank(b.id, b.bankName)}
                          className="print:hidden p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="হিসাব মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white print:text-black">{b.bankName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{b.accountName}</p>
                    {b.branch && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{b.branch}</p>
                    )}
                    <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1">হিসাব নং: {b.accountNumber}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">বর্তমান স্থিতি:</span>
                      <button
                        onClick={() => handleOpenBankModal(b)}
                        className="print:hidden text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                        title="ব্যালেন্স এডিট করতে ক্লিক করুন"
                      >
                        (এডিট)
                      </button>
                    </div>
                    <span className="text-lg font-black font-mono text-sky-700 dark:text-sky-400 print:text-black">৳ {b.balance.toLocaleString('bn-BD')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Contra Transfer Log */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4 print:border-none print:p-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                সাম্প্রতিক কন্ট্রা ভাউচার ও ডিপোজিট খতিয়ান (Contra Transfers)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse print:text-black">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                      <th className="p-3">ভাউচার নং</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">রেফারেন্স ও উদ্দেশ্য</th>
                      <th className="p-3">বিবরণ</th>
                      <th className="p-3 text-right text-emerald-700 dark:text-emerald-400">পরিমাণ (টাকা)</th>
                      <th className="p-3">এন্ট্রি কারক</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 print:divide-gray-300">
                    {vouchers.filter(v => v.voucherType === 'Contra').map((cv, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400 print:text-black">{cv.voucherNo}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{cv.date}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">{cv.reference}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{cv.narration}</td>
                        <td className="p-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 print:text-black">৳ {cv.totalAmount.toLocaleString('bn-BD')}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{cv.createdBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WAIVERS & REFUNDS                                      */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'waivers_refunds' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Waivers Section */}
              <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    বৃত্তি ও ফি মওকুফ রেজিস্টার (Fee Waivers)
                  </h3>
                  <button
                    onClick={() => setShowWaiverModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    + মওকুফ অনুমোদন
                  </button>
                </div>
                <div className="space-y-2.5">
                  {waivers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      কোনো বৃত্তি বা ফি মওকুফ রেকর্ড নথিভুক্ত নেই
                    </div>
                  ) : (
                    waivers.map((w, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 transition-colors hover:border-purple-300 dark:hover:border-purple-800/60 shadow-2xs">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {w.studentName} <span className="text-slate-600 dark:text-slate-400 font-medium">({w.grade})</span>
                          </h4>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-slate-900 dark:text-slate-200">কারণ:</span> {w.reason}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            অনুমোদনে: {w.approvedBy} • {w.date}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-xs font-mono font-black border border-purple-200 dark:border-purple-800 shrink-0">
                          {w.type === 'percent' ? `${w.value}% ছাড়` : `৳ ${w.value.toLocaleString('bn-BD')} ছাড়`}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Refunds Section */}
              <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    ফি রিফান্ড ও সমন্বয় রেজিস্টার (Refunds)
                  </h3>
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    + রিফান্ড ভাউচার
                  </button>
                </div>
                <div className="space-y-2.5">
                  {refunds.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      কোনো ফি রিফান্ড বা সমন্বয় রেকর্ড নেই
                    </div>
                  ) : (
                    refunds.map((r, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 transition-colors hover:border-rose-300 dark:hover:border-rose-800/60 shadow-2xs">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{r.studentName}</h4>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-slate-900 dark:text-slate-200">রসিদ নং:</span> {r.receiptId} • <span className="font-semibold text-slate-900 dark:text-slate-200">কারণ:</span> {r.reason}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            প্রক্রিয়াকরণে: {r.processedBy} • {r.date}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-xs font-mono font-black border border-rose-200 dark:border-rose-800 shrink-0">
                          ফেরত ৳ {r.amount.toLocaleString('bn-BD')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* TAB 6: FINANCIAL REPORTS & AUDIT STATEMENTS (8 REPORTS)       */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <div className="space-y-5">
            {/* Sub-tab Navigation (Screen Only) */}
            <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-2 flex flex-wrap items-center gap-1.5">
              {[
                { id: 'income_statement', label: 'আয়-ব্যয় বিবরণী (Income Statement)', icon: PieChart },
                { id: 'balance_sheet', label: 'উদ্বৃত্তপত্র (Balance Sheet)', icon: Scale },
                { id: 'trial_balance', label: 'রেওয়ামিল (Trial Balance)', icon: Layers },
                { id: 'cash_book', label: 'ক্যাশবুক (Cash Book)', icon: BookOpen },
                { id: 'bank_book', label: 'ব্যাংকবুক (Bank Book)', icon: Landmark },
                { id: 'general_ledger', label: 'খতিয়ান (General Ledger)', icon: FileText },
                { id: 'vouchers', label: 'ভাউচার রেজিস্টার (Vouchers)', icon: Receipt },
                { id: 'chart_of_accounts', label: 'চার্ট অব একাউন্টস (COA)', icon: Building2 }
              ].map(sub => {
                const Icon = sub.icon;
                const isSelected = reportSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setReportSubTab(sub.id as ReportSubTab)}
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

            {/* ─── PRINT HEADER COMPONENT (Shows only on print) ─────── */}
            <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-4 text-black">
              <h1 className="text-xl font-black tracking-tight">বরইতলী উচ্চ বিদ্যালয়</h1>
              <p className="text-xs text-gray-700 font-medium">বরইতলী, চকরিয়া, কক্সবাজার • EIIN: 106184 • স্থাপিত: ১৯৬৯</p>
              <div className="mt-2 inline-block border border-black px-3 py-1 rounded text-xs font-black uppercase">
                {reportSubTab === 'income_statement' ? 'আর্থিক আয় ও ব্যয় বিবরণী (Statement of Income & Expenditure)' :
                 reportSubTab === 'balance_sheet' ? 'আর্থিক অবস্থার বিবরণী / উদ্বৃত্তপত্র (Balance Sheet)' :
                 reportSubTab === 'trial_balance' ? 'রেওয়ামিল খতিয়ান বিবরণী (Trial Balance Statement)' :
                 reportSubTab === 'cash_book' ? 'ক্যাশবুক / দৈনিক নগদ প্রবাহ খতিয়ান (Cash Book)' :
                 reportSubTab === 'bank_book' ? `ব্যাংক হিসাব খতিয়ান — ${bankBook.bankName}` :
                 reportSubTab === 'general_ledger' ? `সাধারণ খতিয়ান হিসাব — ${generalLedger.account.nameBn || generalLedger.account.name}` :
                 reportSubTab === 'vouchers' ? 'ভাউচার ও জার্নাল রেজিস্টার (Voucher Master Ledger)' :
                 'চার্ট অব একাউন্টস ও লেজার সূচি (Chart of Accounts)'}
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-600 mt-2 px-2">
                <span>অর্থবছর / সেশন: ২০২৬</span>
                <span>প্রতিবেদন তৈরির তারিখ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════ */}
            {/* 1. INCOME STATEMENT (আয়-ব্যয় বিবরণী)                    */}
            {/* ═════════════════════════════════════════════════════════ */}
            {reportSubTab === 'income_statement' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-6 print:border-none print:p-0">
                <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      আর্থিক আয় ও ব্যয় বিবরণী (Statement of Income & Expenditure)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">চলতি অর্থবছর ২০২৬ • বরইতলী উচ্চ বিদ্যালয়</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold border border-indigo-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>প্রিন্ট করুন</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                  {/* Revenue / Income */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b-2 border-emerald-500 pb-1.5">
                      <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">ক. প্রাপ্ত আয়সমূহ (Revenues)</h4>
                      <span className="text-[11px] font-mono font-black text-emerald-700 dark:text-emerald-400">৳ {incomeStatement.totalIncome.toLocaleString('bn-BD')}</span>
                    </div>
                    <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2 print:bg-white print:border-black">
                      {incomeStatement.incomeLines.map((line, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 dark:border-slate-800/80 print:border-gray-300">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{line.nameBn || line.name}</span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 print:text-black">৳ {line.amount.toLocaleString('bn-BD')}</span>
                        </div>
                      ))}
                      <div className="pt-2.5 flex items-center justify-between font-black text-xs text-emerald-800 dark:text-emerald-300 border-t-2 border-emerald-500/40">
                        <span>মোট অর্জিত রাজস্ব আয়:</span>
                        <span className="font-mono text-sm">৳ {incomeStatement.totalIncome.toLocaleString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b-2 border-rose-500 pb-1.5">
                      <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">খ. পরিচালন ব্যয়সমূহ (Operating Expenses)</h4>
                      <span className="text-[11px] font-mono font-black text-rose-700 dark:text-rose-400">৳ {incomeStatement.totalExpense.toLocaleString('bn-BD')}</span>
                    </div>
                    <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2 print:bg-white print:border-black">
                      {incomeStatement.expenseLines.map((line, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 dark:border-slate-800/80 print:border-gray-300">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{line.nameBn || line.name}</span>
                          <span className="font-mono font-bold text-rose-700 dark:text-rose-400 print:text-black">৳ {line.amount.toLocaleString('bn-BD')}</span>
                        </div>
                      ))}
                      <div className="pt-2.5 flex items-center justify-between font-black text-xs text-rose-800 dark:text-rose-300 border-t-2 border-rose-500/40">
                        <span>মোট পরিচালন ব্যয়:</span>
                        <span className="font-mono text-sm">৳ {incomeStatement.totalExpense.toLocaleString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Surplus / Deficit Summary */}
                <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 dark:border-slate-800 flex items-center justify-between shadow-xs print:bg-white print:border-black">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">নিট পরিচালন ফলাফল (Net Operating Surplus / Deficit)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">মোট অর্জিত রাজস্ব আয় হতে সর্বমোট পরিচালন ব্যয় কর্তনান্তে নিট উদ্বৃত্ত</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">তহবিল উদ্বৃত্ত:</span>
                    <h2 className={`text-2xl font-black font-mono ${incomeStatement.netSurplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} print:text-black`}>
                      ৳ {incomeStatement.netSurplus.toLocaleString('bn-BD')}
                    </h2>
                  </div>
                </div>

                {/* Print Signature Block */}
                <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t border-black mt-8">
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">হিসাবরক্ষকের স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">অর্থ ও অডিট কমিটি আহ্বায়ক</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">প্রধান শিক্ষক</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* 2. BALANCE SHEET (উদ্বৃত্তপত্র)                          */}
            {/* ═════════════════════════════════════════════════════════ */}
            {reportSubTab === 'balance_sheet' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-6 print:border-none print:p-0">
                <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      আর্থিক অবস্থার বিবরণী / উদ্বৃত্তপত্র (Balance Sheet)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">হিসাব সমীকরণ: সম্পদ = দায় + মূলধন ও সংরক্ষিত তহবিল (A = L + E)</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold border border-indigo-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>উদ্বৃত্তপত্র প্রিন্ট</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                  {/* Assets */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b-2 border-sky-500 pb-1.5">
                      <h4 className="text-xs font-black text-sky-700 dark:text-sky-400 uppercase tracking-wider">১. মোট সম্পদ (Assets)</h4>
                      <span className="text-[11px] font-mono font-black text-sky-700 dark:text-sky-400">৳ {balanceSheet.totalAssets.toLocaleString('bn-BD')}</span>
                    </div>
                    <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2 print:bg-white print:border-black">
                      {balanceSheet.assetLines.map((line, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 dark:border-slate-800/80 print:border-gray-300">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{line.nameBn || line.name}</span>
                          <span className="font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">৳ {line.amount.toLocaleString('bn-BD')}</span>
                        </div>
                      ))}
                      <div className="pt-3 flex items-center justify-between font-black text-xs text-sky-800 dark:text-sky-300 border-t-2 border-sky-500/40">
                        <span>সর্বমোট সম্পদ (Total Assets):</span>
                        <span className="font-mono text-sm">৳ {balanceSheet.totalAssets.toLocaleString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="space-y-4">
                    {/* Liabilities */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b-2 border-rose-500 pb-1">
                        <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">২. মোট দায়সমূহ (Liabilities)</h4>
                        <span className="text-[11px] font-mono font-black text-rose-700 dark:text-rose-400">৳ {balanceSheet.totalLiabilities.toLocaleString('bn-BD')}</span>
                      </div>
                      <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2 print:bg-white print:border-black">
                        {balanceSheet.liabilityLines.map((line, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-800/80 print:border-gray-300">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{line.nameBn || line.name}</span>
                            <span className="font-mono font-bold text-rose-700 dark:text-rose-400 print:text-black">৳ {line.amount.toLocaleString('bn-BD')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Equity */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b-2 border-amber-500 pb-1">
                        <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">৩. সংরক্ষিত তহবিল ও মূলধন (Equity)</h4>
                        <span className="text-[11px] font-mono font-black text-amber-700 dark:text-amber-400">৳ {balanceSheet.totalEquity.toLocaleString('bn-BD')}</span>
                      </div>
                      <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2 print:bg-white print:border-black">
                        {balanceSheet.equityLines.map((line, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-800/80 print:border-gray-300">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{line.nameBn || line.name}</span>
                            <span className="font-mono font-bold text-amber-700 dark:text-amber-400 print:text-black">৳ {line.amount.toLocaleString('bn-BD')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-slate-950 p-3.5 rounded-xl border border-indigo-200 dark:border-slate-800 flex items-center justify-between font-black text-xs text-indigo-900 dark:text-indigo-300 print:bg-white print:border-black">
                      <span>মোট দায় ও মূলধন (Total Liabilities & Equity):</span>
                      <span className="font-mono text-sm">৳ {balanceSheet.totalLiabAndEquity.toLocaleString('bn-BD')}</span>
                    </div>
                  </div>
                </div>

                {/* Print Signature Block */}
                <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t border-black mt-8">
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">হিসাবরক্ষকের স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">অর্থ ও অডিট কমিটি আহ্বায়ক</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">প্রধান শিক্ষক</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* 3. TRIAL BALANCE (রেওয়ামিল)                              */}
            {/* ═════════════════════════════════════════════════════════ */}
            {reportSubTab === 'trial_balance' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
                <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      রেওয়ামিল খতিয়ান (Trial Balance Statement)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ডেবিট ব্যালেন্স ও ক্রেডিট ব্যালেন্স স্বয়ংক্রিয় মিলন</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                      trialBalance.isBalanced ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                    }`}>
                      {trialBalance.isBalanced ? '✓ রেওয়ামিল মিলেছে (Balanced)' : '✕ অমিল আছে (Unbalanced)'}
                    </span>
                    <button
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
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">{line.code}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">{line.nameBn || line.name}</td>
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
                        <td colSpan={3} className="p-3 text-right">মোট যোগফল (Grand Total):</td>
                        <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 print:text-black">৳ {trialBalance.totalDebit.toLocaleString('bn-BD')}</td>
                        <td className="p-3 text-right font-mono text-rose-700 dark:text-rose-400 print:text-black">৳ {trialBalance.totalCredit.toLocaleString('bn-BD')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Print Signature Block */}
                <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t border-black mt-8">
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">হিসাবরক্ষকের স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">অর্থ ও অডিট কমিটি আহ্বায়ক</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">প্রধান শিক্ষক</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* 4. CASH BOOK (ক্যাশবুক)                                  */}
            {/* ═════════════════════════════════════════════════════════ */}
            {reportSubTab === 'cash_book' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
                <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ক্যাশবুক / দৈনিক নগদ প্রবাহ খতিয়ান (Cash Book)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">প্রারম্ভিক ব্যালেন্স: ৳ {cashBook.openingBalance.toLocaleString('bn-BD')}</p>
                  </div>
                  <button
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
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black">৳ {cashBook.openingBalance.toLocaleString('bn-BD')}</td>
                      </tr>
                      {cashBook.records.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 text-slate-500 dark:text-slate-400">{rec.date}</td>
                          <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">{rec.voucherNo}</td>
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
                        <td colSpan={3} className="p-3 text-right">মোট জমা ও খরচ:</td>
                        <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 print:text-black">৳ {cashBook.totalReceipts.toLocaleString('bn-BD')}</td>
                        <td className="p-3 text-right font-mono text-rose-700 dark:text-rose-400 print:text-black">৳ {cashBook.totalPayments.toLocaleString('bn-BD')}</td>
                        <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 print:text-black">৳ {cashBook.closingBalance.toLocaleString('bn-BD')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Print Signature Block */}
                <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t border-black mt-8">
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">ক্যাশিয়ার / হিসাবরক্ষক</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">প্রধান শিক্ষক</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* 5. BANK BOOK (ব্যাংকবুক)                                  */}
            {/* ═════════════════════════════════════════════════════════ */}
            {reportSubTab === 'bank_book' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
                <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedBankBookCode}
                      onChange={e => setSelectedBankBookCode(e.target.value)}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                    >
                      <option value="1020">সোনালী ব্যাংক পিএলসি (1020)</option>
                      <option value="1030">ইসলামী ব্যাংক বাংলাদেশ (1030)</option>
                      <option value="1040">ডাচ-বাংলা ব্যাংক পিএলসি (1040)</option>
                    </select>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{bankBook.bankName} খতিয়ান</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">প্রারম্ভিক স্থিতি: ৳ {bankBook.openingBalance.toLocaleString('bn-BD')}</p>
                    </div>
                  </div>
                  <button
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
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black">৳ {bankBook.openingBalance.toLocaleString('bn-BD')}</td>
                      </tr>
                      {bankBook.records.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 text-slate-500 dark:text-slate-400">{rec.date}</td>
                          <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">{rec.voucherNo}</td>
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

                {/* Print Signature Block */}
                <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t border-black mt-8">
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">হিসাবরক্ষকের স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">প্রধান শিক্ষক</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* 6. GENERAL LEDGER (খতিয়ান / লেজারবুক)                     */}
            {/* ═════════════════════════════════════════════════════════ */}
            {reportSubTab === 'general_ledger' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
                <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedLedgerAccount}
                      onChange={e => setSelectedLedgerAccount(e.target.value)}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs max-w-xs cursor-pointer"
                    >
                      {chartOfAccounts.map(a => (
                        <option key={a.code} value={a.code}>
                          {a.code} - {a.nameBn || a.name} ({a.category})
                        </option>
                      ))}
                    </select>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{generalLedger.account.nameBn} খতিয়ান</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">প্রারম্ভিক জের: ৳ {generalLedger.openingBalance.toLocaleString('bn-BD')}</p>
                    </div>
                  </div>
                  <button
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
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black">৳ {generalLedger.openingBalance.toLocaleString('bn-BD')}</td>
                      </tr>
                      {generalLedger.records.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 text-slate-500 dark:text-slate-400">{rec.date}</td>
                          <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">{rec.voucherNo}</td>
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

                {/* Print Signature Block */}
                <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t border-black mt-8">
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">হিসাবরক্ষকের স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">প্রধান শিক্ষক</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════ */}
            {/* 7. VOUCHERS (ভাউচার রেজিস্টার)                           */}
            {/* ═════════════════════════════════════════════════════════ */}
            {reportSubTab === 'vouchers' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
                <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      ভাউচার ও জার্নাল রেজিস্টার (Voucher Master Ledger)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">রিসিপ্ট, পেমেন্ট, কন্ট্রা ও সমন্বয় জার্নাল ভাউচার তালিকা</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>তালিকা প্রিন্ট</span>
                    </button>
                    <button
                      onClick={() => {
                        setVoucherFormType('Journal');
                        setShowVoucherModal(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>নতুন ভাউচার এন্ট্রি</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {vouchers.map((v, idx) => (
                    <div key={idx} className="bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 print:bg-white print:border-black">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                            v.voucherType === 'Receipt' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' :
                            v.voucherType === 'Payment' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30' :
                            v.voucherType === 'Contra' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' :
                            'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30'
                          }`}>
                            {v.voucherNo}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white print:text-black">{v.reference}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{v.date}</span>
                          <button
                            onClick={() => setPrintVoucherData(v)}
                            className="print:hidden px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            প্রিন্ট ভাউচার
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400">{v.narration}</p>

                      {/* Entries Table */}
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
                                <td className="py-1.5 font-bold text-slate-900 dark:text-white print:text-black">{entry.accountName}</td>
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

            {/* ═════════════════════════════════════════════════════════ */}
            {/* 8. CHART OF ACCOUNTS (COA)                               */}
            {/* ═════════════════════════════════════════════════════════ */}
            {reportSubTab === 'chart_of_accounts' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 print:border-none print:p-0">
                <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      চার্ট অব একাউন্টস ও লেজার সেটআপ (Chart of Accounts)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">হিসাবের প্রধান ও উপ-খাত সংযোজন, সংশোধন ও নিয়ন্ত্রণ</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>COA প্রিন্ট</span>
                    </button>
                    <button
                      onClick={() => {
                        setAccountForm({
                          code: String(Math.floor(5000 + Math.random() * 900)),
                          name: '',
                          nameBn: '',
                          category: 'Expense',
                          subCategory: 'Administrative Expense',
                          openingBalance: 0,
                          isSystem: false,
                          description: ''
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
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400 print:text-black">{acc.code}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">{acc.nameBn}</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{acc.name}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              acc.category === 'Asset' ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300' :
                              acc.category === 'Liability' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300' :
                              acc.category === 'Equity' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300' :
                              acc.category === 'Income' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300' :
                              'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300'
                            }`}>
                              {acc.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{acc.subCategory}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white print:text-black">৳ {acc.openingBalance.toLocaleString('bn-BD')}</td>
                          <td className="p-3 text-center print:hidden">
                            {acc.isSystem ? (
                              <span className="text-[10px] text-slate-400">কোর সিস্টেম</span>
                            ) : (
                              <button
                                onClick={() => {
                                  if (confirm(`'${acc.nameBn}' অ্যাকাউন্টটি মুছে ফেলতে চান?`)) {
                                    financeService.deleteAccount(acc.code);
                                    loadAllData();
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

                {/* Print Signature Block */}
                <div className="hidden print:flex justify-between items-end pt-12 text-xs text-black border-t border-black mt-8">
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">হিসাবরক্ষকের স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-6 pt-1 font-semibold">প্রধান শিক্ষক</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

{/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: PAYROLL DISBURSEMENT MODAL                           */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                শিক্ষক ও কর্মচারী বেতন বিতরণ ভাউচার
              </h3>
              <button onClick={() => setShowPayrollModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayroll} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">শিক্ষক / স্টাফ নির্বাচন</label>
                <input
                  type="text"
                  value={payrollForm.teacherName}
                  onChange={e => setPayrollForm({ ...payrollForm, teacherName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">মাস</label>
                  <select
                    value={payrollForm.month}
                    onChange={e => setPayrollForm({ ...payrollForm, month: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">বছর</label>
                  <input
                    type="number"
                    value={payrollForm.year}
                    onChange={e => setPayrollForm({ ...payrollForm, year: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">মূল বেতন (Base)</label>
                  <input
                    type="number"
                    value={payrollForm.baseSalary}
                    onChange={e => setPayrollForm({ ...payrollForm, baseSalary: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">ভাতা (Allowances)</label>
                  <input
                    type="number"
                    value={payrollForm.allowances}
                    onChange={e => setPayrollForm({ ...payrollForm, allowances: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">কর্তন (PF Deduction)</label>
                  <input
                    type="number"
                    value={payrollForm.deductions}
                    onChange={e => setPayrollForm({ ...payrollForm, deductions: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">পরিশোধ মাধ্যম</label>
                  <select
                    value={payrollForm.paymentMethod}
                    onChange={e => setPayrollForm({ ...payrollForm, paymentMethod: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
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
                    onChange={e => setPayrollForm({ ...payrollForm, trxId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{currentLang === 'en' ? 'Net Payable Salary:' : 'নিট প্রদেয় বেতন:'}</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  ৳ {(payrollForm.baseSalary + payrollForm.allowances + payrollForm.bonus - payrollForm.deductions).toLocaleString('bn-BD')}
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  বেতন কনফার্ম ও পোস্টিং
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: EXPENSE ENTRY MODAL                                  */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" />
                নতুন বিদ্যালয় ব্যয় ভাউচার
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">ব্যয় খাত (Category)</label>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">টাকার পরিমাণ</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">প্রাপক / ভেন্ডরের নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: পল্লী বিদ্যুৎ সমিতি / পেপার হাউস"
                  value={expenseForm.paidTo}
                  onChange={e => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">পরিশোধ মাধ্যম</label>
                <select
                  value={expenseForm.paymentMethod}
                  onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
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
                  onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  খরচ সংরক্ষণ ও পোস্টিং
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: BANK TRANSFER / CONTRA MODAL                         */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {showBankTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                কন্ট্রা ভাউচার (ক্যাশ-টু-ব্যাংক ট্রান্সফার)
              </h3>
              <button onClick={() => setShowBankTransferModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankTransfer} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">উৎস হিসাব (From Account)</label>
                <input
                  type="text"
                  value={bankTransferForm.from}
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">গন্তব্য ব্যাংক হিসাব (To Bank)</label>
                <select
                  value={bankTransferForm.to}
                  onChange={e => setBankTransferForm({ ...bankTransferForm, to: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>{b.bankName} ({b.accountNumber || b.accountCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">টাকার পরিমাণ</label>
                <input
                  type="number"
                  value={bankTransferForm.amount}
                  onChange={e => setBankTransferForm({ ...bankTransferForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">ডিপোজিট স্লিপ / রেফারেন্স নং</label>
                <input
                  type="text"
                  placeholder="যেমন: SLIP-88210"
                  value={bankTransferForm.refNo}
                  onChange={e => setBankTransferForm({ ...bankTransferForm, refNo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBankTransferModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                >
                  ট্রান্সফার সম্পন্ন ও কন্ট্রা এন্ট্রি
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 3B: BANK ACCOUNT ADD / EDIT MODAL                     */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {showBankEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                {editingBank ? 'ব্যাংক হিসাব এডিট ও ব্যালেন্স পরিবর্তন' : 'নতুন ব্যাংক হিসাব যুক্ত করুন'}
              </h3>
              <button
                onClick={() => setShowBankEditModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankModal} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  ব্যাংকের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: সোনালী ব্যাংক পিএলসি"
                  value={bankModalForm.bankName}
                  onChange={e => setBankModalForm({ ...bankModalForm, bankName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  হিসাবের নাম (Account Title)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বরইতলী উচ্চ বিদ্যালয় সাধারণ তহবিল"
                  value={bankModalForm.accountName}
                  onChange={e => setBankModalForm({ ...bankModalForm, accountName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    হিসাব নম্বর (Account Number)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: 1042003819201"
                    value={bankModalForm.accountNumber}
                    onChange={e => setBankModalForm({ ...bankModalForm, accountNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    শাখা (Branch)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: চকরিয়া শাখা, কক্সবাজার"
                    value={bankModalForm.branch}
                    onChange={e => setBankModalForm({ ...bankModalForm, branch: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    হিসাব কোড (COA Account Code)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: 1020, 1030, 1040"
                    value={bankModalForm.accountCode}
                    onChange={e => setBankModalForm({ ...bankModalForm, accountCode: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    বর্তমান স্থিতি / প্রারম্ভিক জের (টাকা)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={bankModalForm.balance}
                      onChange={e => setBankModalForm({ ...bankModalForm, balance: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  ডেমো ডাটা মুছে ফেলার পর যদি কোনো ডেমো ব্যালেন্স অবশিষ্ট থাকে, তবে এখানে <strong>০ (শূন্য)</strong> লিখে সেভ করুন অথবা উপরের "ব্যালেন্স রিসেট (৳০)" বাটনে ক্লিক করুন।
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBankEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 cursor-pointer active:scale-95"
                >
                  {editingBank ? 'পরিবর্তন সংরক্ষণ করুন' : 'হিসাব সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: MANUAL VOUCHER CREATOR MODAL (DOUBLE ENTRY)          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {currentLang === 'en' ? 'Standard Double-Entry Voucher Creator' : 'স্ট্যান্ডার্ড ডাবল-এন্ট্রি ভাউচার ক্রিয়েটর'}
              </h3>
              <button onClick={() => setShowVoucherModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualVoucher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">ভাউচার টাইপ</label>
                  <select
                    value={voucherFormType}
                    onChange={e => setVoucherFormType(e.target.value as VoucherType)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="Payment">{currentLang === 'en' ? 'Payment Voucher (PV)' : 'পেমেন্ট ভাউচার (PV)'}</option>
                    <option value="Receipt">{currentLang === 'en' ? 'Receipt Voucher (RV)' : 'রিসিপ্ট ভাউচার (RV)'}</option>
                    <option value="Contra">{currentLang === 'en' ? 'Contra Voucher (CV)' : 'কন্ট্রা ভাউচার (CV)'}</option>
                    <option value="Journal">{currentLang === 'en' ? 'Journal Voucher (JV)' : 'জার্নাল সমন্বয় ভাউচার (JV)'}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">রেফারেন্স / প্রাপক / উৎস</label>
                  <input
                    type="text"
                    placeholder="যেমন: বিজ্ঞান ল্যাব রাসায়নিক ক্রয়"
                    value={voucherFormRef}
                    onChange={e => setVoucherFormRef(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">{currentLang === 'en' ? 'General Narration' : 'সার্বিক বিবরণ'}</label>
                <input
                  type="text"
                  placeholder="ভাউচারের বিস্তারিত কারণ ও বিবরণ..."
                  value={voucherFormNarration}
                  onChange={e => setVoucherFormNarration(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Journal Line Entries */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">ডেবিট ও ক্রেডিট খতিয়ান সারি:</label>
                  <button
                    type="button"
                    onClick={addVoucherRow}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> সারি যোগ করুন
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {voucherFormRows.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="col-span-4">
                        <select
                          value={row.accountCode}
                          onChange={e => updateVoucherRow(idx, 'accountCode', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white font-medium"
                        >
                          {chartOfAccounts.map(a => (
                            <option key={a.code} value={a.code}>
                              {a.code} - {a.nameBn}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="ডেবিট ৳"
                          value={row.debit || ''}
                          onChange={e => updateVoucherRow(idx, 'debit', Number(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg px-2 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold text-right"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="ক্রেডিট ৳"
                          value={row.credit || ''}
                          onChange={e => updateVoucherRow(idx, 'credit', Number(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold text-right"
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        {voucherFormRows.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeVoucherRow(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Balance Check */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                    <span>{currentLang === 'en' ? 'Total Debit:' : 'মোট ডেবিট:'} <strong className="text-emerald-600 dark:text-emerald-400">৳ {totalVoucherDebit}</strong></span>
                    <span>{currentLang === 'en' ? 'Total Credit:' : 'মোট ক্রেডিট:'} <strong className="text-rose-600 dark:text-rose-400">৳ {totalVoucherCredit}</strong></span>
                  </div>
                  <span className={`text-xs font-bold ${isVoucherBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {isVoucherBalanced ? (currentLang === 'en' ? '✓ Balanced' : '✓ ব্যালেন্স সমান') : (currentLang === 'en' ? '✕ Unbalanced' : '✕ ডেবিট ও ক্রেডিট সমান নয়')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={!isVoucherBalanced}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all ${
                    isVoucherBalanced ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  ভাউচার পোস্ট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 5: ADD ACCOUNT HEAD IN CHART OF ACCOUNTS                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                নতুন চার্ট অব একাউন্টস হেড যোগ করুন
              </h3>
              <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer">
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
                    onChange={e => setAccountForm({ ...accountForm, code: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">ক্যাটাগরি</label>
                  <select
                    value={accountForm.category}
                    onChange={e => setAccountForm({ ...accountForm, category: e.target.value as AccountCategory })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
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
                  onChange={e => setAccountForm({ ...accountForm, nameBn: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">হিসাবের নাম (English)</label>
                <input
                  type="text"
                  placeholder="যেমন: Computer Lab Equipment"
                  value={accountForm.name}
                  onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">প্রারম্ভিক ব্যালেন্স (৳)</label>
                <input
                  type="number"
                  value={accountForm.openingBalance}
                  onChange={e => setAccountForm({ ...accountForm, openingBalance: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  অ্যাকাউন্ট সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL: WAIVER APPROVAL MODAL (বৃত্তি ও ফি মওকুফ)              */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {showWaiverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                বৃত্তি ও ফি মওকুফ অনুমোদন (Fee Waiver Approval)
              </h3>
              <button
                onClick={() => setShowWaiverModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWaiver} className="space-y-3">
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">শিক্ষার্থী নির্বাচন করুন</label>
                {students.length > 0 ? (
                  <select
                    value={waiverForm.studentId}
                    onChange={(e) => {
                      const st = students.find(s => s.id === e.target.value);
                      if (st) {
                        setWaiverForm({
                          ...waiverForm,
                          studentId: st.id,
                          studentName: st.name,
                          roll: st.roll || '০১',
                          grade: st.grade || '৬ষ্ঠ শ্রেণি'
                        });
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.grade} - রোল: {st.roll})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={waiverForm.studentName}
                    onChange={(e) => setWaiverForm({ ...waiverForm, studentName: e.target.value })}
                    placeholder="শিক্ষার্থীর নাম"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">মওকুফের ধরণ</label>
                  <select
                    value={waiverForm.type}
                    onChange={(e) => setWaiverForm({ ...waiverForm, type: e.target.value as 'percent' | 'flat' })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="percent">শতকরা হার (%)</option>
                    <option value="flat">নির্দিষ্ট পরিমাণ (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    {waiverForm.type === 'percent' ? 'ছাড়ের পরিমাণ (%)' : 'ছাড়ের পরিমাণ (৳)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={waiverForm.type === 'percent' ? 100 : 100000}
                    value={waiverForm.value}
                    onChange={(e) => setWaiverForm({ ...waiverForm, value: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">মওকুফ / বৃত্তির কারণ</label>
                <input
                  type="text"
                  placeholder="যেমন: বীর মুক্তিযোদ্ধা সন্তান কোটা / এতিম দরিদ্র তহবিল"
                  value={waiverForm.reason}
                  onChange={(e) => setWaiverForm({ ...waiverForm, reason: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">অনুমোদনকারী কর্তৃপক্ষ</label>
                <input
                  type="text"
                  placeholder="যেমন: প্রধান শিক্ষক / সভাপতি"
                  value={waiverForm.approvedBy}
                  onChange={(e) => setWaiverForm({ ...waiverForm, approvedBy: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWaiverModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  মওকুফ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL: REFUND VOUCHER MODAL (ফি রিফান্ড ও সমন্বয়)               */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                ফি রিফান্ড ও সমন্বয় ভাউচার (Refund Voucher)
              </h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRefund} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">রসিদ নম্বর (Receipt ID)</label>
                  <input
                    type="text"
                    placeholder="যেমন: REC-2026-001"
                    value={refundForm.receiptId}
                    onChange={(e) => setRefundForm({ ...refundForm, receiptId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">রিফান্ড পরিমাণ (৳)</label>
                  <input
                    type="number"
                    min="1"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">শিক্ষার্থী নির্বাচন করুন</label>
                {students.length > 0 ? (
                  <select
                    value={refundForm.studentId}
                    onChange={(e) => {
                      const st = students.find(s => s.id === e.target.value);
                      if (st) {
                        setRefundForm({
                          ...refundForm,
                          studentId: st.id,
                          studentName: st.name
                        });
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.grade} - রোল: {st.roll})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={refundForm.studentName}
                    onChange={(e) => setRefundForm({ ...refundForm, studentName: e.target.value })}
                    placeholder="শিক্ষার্থীর নাম"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">রিফান্ডের কারণ</label>
                <input
                  type="text"
                  placeholder="যেমন: অতিরিক্ত ফি প্রদান করায় বা ভুল চালানের অর্থ ফেরত"
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">প্রক্রিয়াকরণে (ক্যাশিয়ার/হিসাবরক্ষক)</label>
                <input
                  type="text"
                  placeholder="যেমন: হিসাবরক্ষক"
                  value={refundForm.processedBy}
                  onChange={(e) => setRefundForm({ ...refundForm, processedBy: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  রিফান্ড ভাউচার তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 6: ADVANCED FEE SETUP & DYNAMIC SECTORS HUB            */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {showFeeSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/30">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      ফি সেটআপ ও খাত ব্যবস্থাপনা হাব
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                      লাইভ রেট সিঙ্ক
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    শ্রেণিভিত্তিক মাসিক বেতন, ভর্তি ফি ও অন্যান্য ফি রেট পরিবর্তন, সকল ক্লাসে বাল্ক প্রয়োগ ও শিক্ষার্থী লেজারে সিঙ্ক
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowFeeSettingsModal(false);
                  loadAllData();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFeeSetupTab('classes')}
                className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  feeSetupTab === 'classes'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{currentLang === 'en' ? '1. Class-wise Fee Rates Table' : '১. শ্রেণিভিত্তিক নির্ধারিত ফি তালিকা'}</span>
              </button>

              <button
                type="button"
                onClick={() => setFeeSetupTab('sectors')}
                className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  feeSetupTab === 'sectors'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>{currentLang === 'en' ? '2. Add & Manage Fee Sectors' : '২. নতুন ফি খাত যোগ ও ব্যবস্থাপনা'}</span>
              </button>
            </div>

            {/* ─── TAB 1: CLASS-WISE FEE RATES MATRIX ───────────────────── */}
            {feeSetupTab === 'classes' && (
              <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
                
                {/* 🚀 QUICK BULK APPLY TO ALL CLASSES TOOLBAR ────────── */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-slate-50 dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-800/80 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      এক ক্লিকে সকল ক্লাসে (৬ষ্ঠ-১০ম) যেকোনো ফি প্রয়োগ করুন:
                    </span>
                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                      বাল্ক রেট টুল
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-5">
                      <select
                        id="bulkSectorSelect"
                        defaultValue="tuition"
                        className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                      >
                        <option value="tuition">📚 মাসিক বেতন (Tuition Fee)</option>
                        <option value="admission">🎓 ভর্তি ও পুনঃভর্তি ফি (Admission Fee)</option>
                        <option value="exam">📝 পরীক্ষা ফি (Exam Fee)</option>
                        {(feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS).filter(s => !['tuition', 'admission', 'exam'].includes(s.id)).map(s => (
                          <option key={s.id} value={s.id}>🏷️ {s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4 relative">
                      <span className="absolute left-3 top-2 text-xs font-black text-indigo-600 dark:text-indigo-400">৳</span>
                      <input
                        type="number"
                        id="bulkAmountInput"
                        placeholder="টাকার পরিমাণ (যেমন: ৫০০)"
                        className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={() => {
                          const select = document.getElementById('bulkSectorSelect') as HTMLSelectElement;
                          const input = document.getElementById('bulkAmountInput') as HTMLInputElement;
                          const sectorId = select?.value || 'tuition';
                          const amt = Number(input?.value);
                          if (isNaN(amt) || amt < 0 || input?.value.trim() === '') {
                            alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন!');
                            return;
                          }
                          const updated = financeService.applyFeeRateToAllClasses(sectorId, amt);
                          setClassFees(updated);
                          const updatedLedgers = financeService.getAllStudentLedgers();
                          setAllStudentLedgers(updatedLedgers);
                          const sectorName = (feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS).find(s => s.id === sectorId)?.name || sectorId;
                          alert(`সকল শ্রেণির জন্য '${sectorName}' সফলভাবে ৳${amt} টাকা নির্ধারণ করা হয়েছে!`);
                          input.value = '';
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                      >
                        <span>সকল ক্লাসে প্রয়োগ ➔</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ─── CLASS BY CLASS MATRIX ───────────────────────────── */}
                <div className="space-y-3">
                  {GRADES_LIST.map(g => {
                    const fees = classFees[g.id] || DEFAULT_CLASS_FEES_CONFIG[g.id] || {};
                    const activeSectors = (feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS);

                    const tuitionVal = fees.tuition !== undefined ? fees.tuition : (DEFAULT_CLASS_FEES_CONFIG[g.id]?.tuition || 400);
                    const admissionVal = fees.admission !== undefined ? fees.admission : (DEFAULT_CLASS_FEES_CONFIG[g.id]?.admission || 1500);
                    const examVal = fees.exam !== undefined ? fees.exam : (DEFAULT_CLASS_FEES_CONFIG[g.id]?.exam || 300);

                    const updateSingleClassFee = (secId: string, val: number) => {
                      const updated = {
                        ...classFees,
                        [g.id]: { ...(classFees[g.id] || {}), [secId]: val }
                      };
                      setClassFees(updated);
                      financeService.saveClassFeesConfig(updated);
                      const updatedLedgers = financeService.getAllStudentLedgers();
                      setAllStudentLedgers(updatedLedgers);
                    };

                    const applyThisRateToAll = (secId: string, val: number, name: string) => {
                      const updated = financeService.applyFeeRateToAllClasses(secId, val);
                      setClassFees(updated);
                      setAllStudentLedgers(financeService.getAllStudentLedgers());
                      alert(`'${name}' ৳${val} টাকা সকল শ্রেণিতে (৬ষ্ঠ-১০ম) প্রয়োগ করা হয়েছে!`);
                    };

                    return (
                      <div
                        key={g.id}
                        className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs"
                      >
                        {/* Class Header */}
                        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                              {g.id === '6th' ? '৬' : g.id === '7th' ? '৭' : g.id === '8th' ? '৮' : g.id === '9th' ? '৯' : '১০'}
                            </span>
                            <div>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">{g.name}</h4>
                              <p className="text-[10px] text-slate-400">এই শ্রেণির জন্য নির্ধারিত ফি কাঠামো</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            সেশন ২০২৬
                          </span>
                        </div>

                        {/* 🌟 3 CORE PRIMARY FEES: TUITION, ADMISSION, EXAM ─────── */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* 1. Monthly Tuition */}
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between gap-2 shadow-2xs">
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-white block">📚 মাসিক বেতন</span>
                              <button
                                type="button"
                                onClick={() => applyThisRateToAll('tuition', tuitionVal, 'মাসিক বেতন')}
                                className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                                title="এই রেট সকল শ্রেণিতে কপি করুন"
                              >
                                সব ক্লাসে ➔
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-indigo-600">৳</span>
                              <input
                                type="number"
                                min="0"
                                value={tuitionVal}
                                onChange={e => updateSingleClassFee('tuition', Number(e.target.value) || 0)}
                                className="w-16 bg-indigo-50/60 dark:bg-slate-950 border border-indigo-300 dark:border-indigo-800 rounded-lg px-2 py-1 text-xs font-mono font-black text-indigo-700 dark:text-indigo-300 text-right outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          {/* 2. Admission / Re-admission Fee */}
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-900/60 flex items-center justify-between gap-2 shadow-2xs">
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-white block">🎓 ভর্তি ও সেশন ফি</span>
                              <button
                                type="button"
                                onClick={() => applyThisRateToAll('admission', admissionVal, 'ভর্তি ও সেশন ফি')}
                                className="text-[9px] text-purple-600 dark:text-purple-400 hover:underline font-bold cursor-pointer"
                                title="এই রেট সকল শ্রেণিতে কপি করুন"
                              >
                                সব ক্লাসে ➔
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-purple-600">৳</span>
                              <input
                                type="number"
                                min="0"
                                value={admissionVal}
                                onChange={e => updateSingleClassFee('admission', Number(e.target.value) || 0)}
                                className="w-16 bg-purple-50/60 dark:bg-slate-950 border border-purple-300 dark:border-purple-800 rounded-lg px-2 py-1 text-xs font-mono font-black text-purple-700 dark:text-purple-300 text-right outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>

                          {/* 3. Examination Fee */}
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 shadow-2xs">
                            <div>
                              <span className="text-xs font-black text-slate-900 dark:text-white block">📝 পরীক্ষা ফি</span>
                              <button
                                type="button"
                                onClick={() => applyThisRateToAll('exam', examVal, 'পরীক্ষা ফি')}
                                className="text-[9px] text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                                title="এই রেট সকল শ্রেণিতে কপি করুন"
                              >
                                সব ক্লাসে ➔
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-amber-600">৳</span>
                              <input
                                type="number"
                                min="0"
                                value={examVal}
                                onChange={e => updateSingleClassFee('exam', Number(e.target.value) || 0)}
                                className="w-16 bg-amber-50/60 dark:bg-slate-950 border border-amber-300 dark:border-amber-800 rounded-lg px-2 py-1 text-xs font-mono font-black text-amber-700 dark:text-amber-300 text-right outline-none focus:ring-2 focus:ring-amber-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* OTHER SECONDARY FEE SECTORS ────────────────── */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">অন্যান্য ফি খাতসমূহ:</span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                            {activeSectors.filter(s => !['tuition', 'admission', 'exam'].includes(s.id)).map(s => {
                              const val = fees[s.id] !== undefined ? fees[s.id] : s.defAmount;
                              return (
                                <div
                                  key={s.id}
                                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-1 shadow-2xs hover:border-slate-300 transition-colors"
                                >
                                  <div className="min-w-0">
                                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate block" title={s.name}>
                                      {s.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => applyThisRateToAll(s.id, val, s.name)}
                                      className="text-[8.5px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold cursor-pointer"
                                      title="সকল ক্লাসে প্রয়োগ করুন"
                                    >
                                      সব ক্লাসে ➔
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <input
                                      type="number"
                                      min="0"
                                      value={val}
                                      onChange={e => updateSingleClassFee(s.id, Number(e.target.value) || 0)}
                                      className="w-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-1.5 py-0.5 text-[11px] font-mono font-bold text-slate-900 dark:text-white text-right outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <span className="text-[10px] text-slate-400">৳</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── TAB 2: ADD & MANAGE FEE SECTORS ─────────────────────── */}
            {feeSetupTab === 'sectors' && (
              <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
                {/* Form to Add New Fee Sector */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!newSectorForm.name.trim()) return;
                    const generatedId = newSectorForm.id.trim() 
                      ? newSectorForm.id.trim().toLowerCase().replace(/\s+/g, '_')
                      : 'fee_' + Date.now().toString().slice(-6);

                    const newSector: FeeSector = {
                      id: generatedId,
                      name: newSectorForm.name.trim(),
                      defAmount: Number(newSectorForm.defAmount) || 0,
                      description: newSectorForm.description.trim() || `${newSectorForm.name} বাবদ ফি`,
                      accountCode: newSectorForm.accountCode || '4060'
                    };

                    const updatedSectors = financeService.addFeeSector(newSector);
                    setFeeSectors(updatedSectors);

                    // Update class fees config for new sector with default amount
                    const updatedClassFees = { ...classFees };
                    GRADES_LIST.forEach(g => {
                      if (!updatedClassFees[g.id]) updatedClassFees[g.id] = {};
                      if (updatedClassFees[g.id][generatedId] === undefined) {
                        updatedClassFees[g.id][generatedId] = newSector.defAmount;
                      }
                    });
                    setClassFees(updatedClassFees);
                    financeService.saveClassFeesConfig(updatedClassFees);
                    setAllStudentLedgers(financeService.getAllStudentLedgers());

                    setNewSectorForm({
                      name: '',
                      nameEn: '',
                      id: '',
                      defAmount: 200,
                      description: '',
                      accountCode: '4060',
                      frequency: 'yearly',
                      applicableClasses: ['6th', '7th', '8th', '9th', '10th'],
                      category: 'facility',
                      isSameRateForAll: true,
                      classRates: { '6th': 200, '7th': 200, '8th': 200, '9th': 200, '10th': 200 }
                    });
                    alert(`'${newSector.name}' ফি খাত সফলভাবে যোগ করা হয়েছে!`);
                  }}
                  className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-800/60 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {currentLang === 'en' ? 'Add New Fee Sector / Head' : 'নতুন ফি খাত যোগ করুন (যেমন: বিদায় ফি, রেজিস্ট্রেশন, ছাড়পত্র ফি)'}
                    </h4>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-white dark:bg-indigo-900/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-700">
                      ডাবল-এন্ট্রি অ্যাকাউন্টিং ইন্টিগ্রেটেড
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        ফি খাতের নাম (বাংলা) *
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: উন্নয়ন ফি / খেলাধুলা ফি"
                        value={newSectorForm.name}
                        onChange={e => setNewSectorForm({ ...newSectorForm, name: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        ডিফল্ট ফির পরিমাণ (টাকা) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="২০০"
                        value={newSectorForm.defAmount || ''}
                        onChange={e => setNewSectorForm({ ...newSectorForm, defAmount: Number(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        হিসাবের খতিয়ান (COA Head)
                      </label>
                      <select
                        value={newSectorForm.accountCode}
                        onChange={e => setNewSectorForm({ ...newSectorForm, accountCode: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                      >
                        <option value="4030">4030 - ভর্তি ও পুনঃভর্তি ফি আয়</option>
                        <option value="4020">4020 - পরীক্ষা ফি আয়</option>
                        <option value="4040">4040 - বোর্ড রেজিস্ট্রেশন ও ফরম পূরণ ফি</option>
                        <option value="4050">4050 - বিদায় অনুষ্ঠান ও সাংস্কৃতিক ফি</option>
                        <option value="4060">4060 - সেশন চার্জ, ছাড়পত্র ও অন্যান্য সেবা</option>
                        <option value="4080">4080 - বিবিধ ও অন্যান্য ফি আয়</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="বিবরণ / নোট (ঐচ্ছিক): যেমন - বাৎসরিক উন্নয়ন বা স্পোর্টস সামগ্রী বাবদ ফি"
                      value={newSectorForm.description}
                      onChange={e => setNewSectorForm({ ...newSectorForm, description: e.target.value })}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
                    >
                      + খাত যুক্ত করুন
                    </button>
                  </div>
                </form>

                {/* List of Existing Fee Sectors (with Delete for ALL sectors) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    বিদ্যমান সকল ফি খাতের তালিকা (মোট {(feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS).length}টি খাত সক্রিয়):
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS).map(s => {
                      return (
                        <div
                          key={s.id}
                          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs hover:border-indigo-300 transition-all group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">{s.name}</h5>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {s.description || 'নিয়মিত ফি খাত'} • খতিয়ান: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{s.accountCode || '4060'}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Quick Apply to All Classes */}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = financeService.applyFeeRateToAllClasses(s.id, s.defAmount);
                                setClassFees(updated);
                                setAllStudentLedgers(financeService.getAllStudentLedgers());
                                alert(`'${s.name}' এর ডিফল্ট রেট (৳${s.defAmount}) সকল শ্রেণিতে সফলভাবে প্রয়োগ করা হয়েছে!`);
                              }}
                              className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                              title="এই রেট সব ক্লাসে প্রয়োগ করুন"
                            >
                              সব ক্লাসে ➔
                            </button>

                            <span className="text-xs font-black font-mono text-indigo-700 dark:text-indigo-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl">
                              ৳ {s.defAmount}
                            </span>

                            {/* Delete Button for ANY Sector */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`'${s.name}' ফি খাতটি কি নিশ্চিতভাবে মুছে ফেলতে চান?`)) {
                                  try {
                                    const updated = financeService.deleteFeeSector(s.id);
                                    setFeeSectors(updated);
                                    setAllStudentLedgers(financeService.getAllStudentLedgers());
                                  } catch (err: any) {
                                    alert(err.message);
                                  }
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="খাতটি মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                সকল ফি রেট শিক্ষার্থীদের আদায় প্যানেলে ও বকেয়া তালিকায় তাৎক্ষণিক সিঙ্ক হয়েছে
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowFeeSettingsModal(false);
                  loadAllData();
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
              >
                {currentLang === 'en' ? 'Save & Close' : 'সংরক্ষণ ও সমাপ্ত'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* PRINT-ONLY AREA: 3-PART LANDSCAPE A4 MONEY RECEIPT           */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {printReceiptData && (
        <div id="print-area" className="hidden print:block text-black bg-white">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs font-bold">বরইতলী উচ্চ বিদ্যালয় — মানি রিসিট (A4 Landscape ৩-কপি)</h2>
            <button onClick={() => setPrintReceiptData(null)} className="print:hidden text-xs bg-red-500 text-white px-2 py-1 rounded">বন্ধ করুন</button>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t-2 border-black pt-2 text-[10px]">
            {['শিক্ষার্থী কপি (Student Copy)', 'অফিস কপি (Office Copy)', 'হিসাব শাখা কপি (Accounts Copy)'].map((copyName, i) => (
              <div key={i} className="border border-dashed border-gray-400 p-2.5 relative flex flex-col justify-between min-h-[340px]">
                <div>
                  <div className="text-center border-b border-gray-300 pb-1.5">
                    <h3 className="font-bold text-[13px] tracking-tight">বরইতলী উচ্চ বিদ্যালয়</h3>
                    <p className="text-[8.5px] text-gray-700">বরইতলী, চকরিয়া, কক্সবাজার • EIIN: 106184 • স্থাপিত: ১৯৬৯</p>
                    <span className="inline-block bg-gray-200 px-2 py-0.5 rounded text-[8px] font-bold mt-1 uppercase tracking-wider">{copyName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 my-1.5 text-[9px] bg-gray-50 p-1.5 rounded border border-gray-200">
                    <div><strong>রসিদ নং:</strong> <span className="font-mono font-bold">{printReceiptData.receiptId}</span></div>
                    <div><strong>তারিখ:</strong> {printReceiptData.date}</div>
                    <div><strong>শিক্ষার্থী:</strong> {printReceiptData.studentName}</div>
                    <div><strong>রোল:</strong> #{printReceiptData.roll}</div>
                    <div><strong>শ্রেণি:</strong> {printReceiptData.grade} ({printReceiptData.section})</div>
                    <div><strong>পদ্ধতি:</strong> {printReceiptData.paymentMethod} {printReceiptData.trxId ? `(${printReceiptData.trxId})` : ''}</div>
                  </div>

                  <table className="w-full text-left text-[8px] border-collapse border border-gray-300 mt-1">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-300">
                        <th className="p-1">ফি খাত ও বিবরণ</th>
                        <th className="p-1 text-right">আদায়</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printReceiptData.feeItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="p-1">{item.name}</td>
                          <td className="p-1 text-right font-mono">৳{item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      {printReceiptData.discount > 0 && (
                        <tr>
                          <td className="p-1 text-right text-gray-600">বিশেষ মওকুফ/ছাড়:</td>
                          <td className="p-1 text-right font-mono text-red-600">-৳{printReceiptData.discount}</td>
                        </tr>
                      )}
                      <tr className="font-bold border-t border-gray-400 bg-gray-50">
                        <td className="p-1 text-right">মোট পরিশোধিত অর্থ:</td>
                        <td className="p-1 text-right font-mono text-emerald-800">৳{printReceiptData.paidAmount}</td>
                      </tr>
                      {printReceiptData.dueRemaining !== undefined && printReceiptData.dueRemaining > 0 && (
                        <tr className="font-bold text-red-600 border-t border-gray-300">
                          <td className="p-1 text-right">অবশিষ্ট মোট বকেয়া:</td>
                          <td className="p-1 text-right font-mono">৳{printReceiptData.dueRemaining}</td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>

                <div className="flex justify-between items-end pt-4 text-[8px] border-t border-gray-300 mt-2">
                  <div className="text-center">
                    <p className="text-[7.5px] text-gray-500">{printReceiptData.collectedBy || 'আদায়কারী'}</p>
                    <p className="border-t border-black px-2 mt-0.5 font-semibold">আদায়কারীর স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-2 font-semibold">প্রধান শিক্ষক</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* PRINT-ONLY AREA: EXPENSE VOUCHER SLIP                         */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {printExpenseSlip && (
        <div id="print-area" className="hidden print:block text-black bg-white p-6 max-w-md mx-auto border border-black">
          <div className="text-center border-b pb-2">
            <h2 className="text-base font-bold">বরইতলী উচ্চ বিদ্যালয়</h2>
            <p className="text-xs">চকরিয়া, কক্সবাজার • বিদ্যালয় ব্যয় ভাউচার স্লিপ</p>
          </div>
          <div className="my-3 text-xs space-y-1">
            <p><strong>ভাউচার নং:</strong> {printExpenseSlip.voucherNo}</p>
            <p><strong>ব্যয় খাত:</strong> {printExpenseSlip.category}</p>
            <p><strong>প্রাপক / সুবিধাভোগী:</strong> {printExpenseSlip.paidTo}</p>
            <p><strong>তারিখ:</strong> {printExpenseSlip.date}</p>
            <p><strong>পরিশোধ মাধ্যম:</strong> {printExpenseSlip.paymentMethod}</p>
            <p><strong>বিবরণ / নোট:</strong> {printExpenseSlip.note || 'নিয়মিত বিদ্যালয় ব্যয়'}</p>
          </div>
          <table className="w-full text-xs border border-collapse mb-4">
            <tbody>
              <tr className="border-b"><td className="p-1.5 font-semibold">খরচের খাত:</td><td className="p-1.5">{printExpenseSlip.category}</td></tr>
              <tr className="border-b"><td className="p-1.5 font-semibold">বিবরণ:</td><td className="p-1.5">{printExpenseSlip.note || 'অনুমোদিত ব্যয়'}</td></tr>
              <tr className="bg-gray-100 font-bold"><td className="p-1.5">মোট ব্যয়কৃত অর্থ:</td><td className="p-1.5 text-right font-mono">৳ {printExpenseSlip.amount}</td></tr>
            </tbody>
          </table>
          <div className="flex justify-between pt-8 text-xs">
            <p className="border-t border-black px-4">গ্রহীতার স্বাক্ষর</p>
            <p className="border-t border-black px-4">হিসাবরক্ষক</p>
            <p className="border-t border-black px-4">প্রধান শিক্ষক</p>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* PRINT-ONLY AREA: PAYROLL SALARY VOUCHER                       */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {printSalarySlip && (
        <div id="print-area" className="hidden print:block text-black bg-white p-6 max-w-md mx-auto border border-black">
          <div className="text-center border-b pb-2">
            <h2 className="text-base font-bold">বরইতলী উচ্চ বিদ্যালয়</h2>
            <p className="text-xs">চকরিয়া, কক্সবাজার • অফিশিয়াল স্যালারি ভাউচার স্লিপ</p>
          </div>
          <div className="my-3 text-xs space-y-1">
            <p><strong>ভাউচার নং:</strong> {printSalarySlip.voucherNo}</p>
            <p><strong>শিক্ষক/স্টাফ নাম:</strong> {printSalarySlip.teacherName} ({printSalarySlip.designation})</p>
            <p><strong>মাস ও বছর:</strong> {printSalarySlip.month} {printSalarySlip.year}</p>
            <p><strong>পরিশোধ মাধ্যম:</strong> {printSalarySlip.paymentMethod} (Trx: {printSalarySlip.trxId || 'N/A'})</p>
          </div>
          <table className="w-full text-xs border border-collapse mb-4">
            <tbody>
              <tr className="border-b"><td className="p-1.5 font-semibold">মূল বেতন:</td><td className="p-1.5 text-right font-mono">৳ {printSalarySlip.baseSalary}</td></tr>
              <tr className="border-b"><td className="p-1.5 font-semibold">ভাতা ও বোনাস:</td><td className="p-1.5 text-right font-mono">+ ৳ {printSalarySlip.allowances + printSalarySlip.bonus}</td></tr>
              <tr className="border-b"><td className="p-1.5 font-semibold">প্রভিডেন্ট ফান্ড কর্তন:</td><td className="p-1.5 text-right font-mono text-red-600">- ৳ {printSalarySlip.deductions}</td></tr>
              <tr className="bg-gray-100 font-bold"><td className="p-1.5">নিট পরিশোধিত বেতন:</td><td className="p-1.5 text-right font-mono">৳ {printSalarySlip.netPayable}</td></tr>
            </tbody>
          </table>
          <div className="flex justify-between pt-8 text-xs">
            <p className="border-t border-black px-4">গ্রহণকারীর স্বাক্ষর</p>
            <p className="border-t border-black px-4">প্রধান শিক্ষক</p>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* PRINT-ONLY AREA: MANUAL VOUCHER PRINT SLIP                    */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {printVoucherData && (
        <div id="print-area" className="hidden print:block text-black bg-white p-6 max-w-lg mx-auto border border-black">
          <div className="text-center border-b pb-2">
            <h2 className="text-base font-bold">বরইতলী উচ্চ বিদ্যালয়</h2>
            <p className="text-xs">চকরিয়া, কক্সবাজার • হিসাব ভাউচার ({printVoucherData.voucherType} Voucher)</p>
          </div>
          <div className="my-3 text-xs space-y-1">
            <p><strong>ভাউচার নং:</strong> {printVoucherData.voucherNo}</p>
            <p><strong>তারিখ:</strong> {printVoucherData.date}</p>
            <p><strong>রেফারেন্স:</strong> {printVoucherData.reference}</p>
            <p><strong>বিবরণ:</strong> {printVoucherData.narration}</p>
          </div>
          <table className="w-full text-xs border border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-1.5 text-left">কোড ও হিসাবের নাম</th>
                <th className="p-1.5 text-right">ডেবিট (৳)</th>
                <th className="p-1.5 text-right">ক্রেডিট (৳)</th>
              </tr>
            </thead>
            <tbody>
              {printVoucherData.entries.map((e, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-1.5">{e.accountCode} - {e.accountName}</td>
                  <td className="p-1.5 text-right font-mono">{e.debit > 0 ? `৳${e.debit}` : '-'}</td>
                  <td className="p-1.5 text-right font-mono">{e.credit > 0 ? `৳${e.credit}` : '-'}</td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-100">
                <td className="p-1.5 text-right">মোট:</td>
                <td className="p-1.5 text-right font-mono">৳{printVoucherData.totalAmount}</td>
                <td className="p-1.5 text-right font-mono">৳{printVoucherData.totalAmount}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-between pt-8 text-xs">
            <p className="border-t border-black px-4">ক্যাশিয়ার</p>
            <p className="border-t border-black px-4">হিসাবরক্ষক</p>
            <p className="border-t border-black px-4">প্রধান শিক্ষক</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">ফাইন্যান্স মডিউল লোড হচ্ছে...</div>}>
      <FinanceContent />
    </Suspense>
  );
}
