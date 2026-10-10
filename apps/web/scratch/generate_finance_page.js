const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/app/dashboard/finance/page.tsx');

const content = `'use client';

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
  Wallet
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
  getPaymentAssetCode,
  getExpenseAccountCode
} from '@/services/financeService';
import { studentService, Student } from '@/services/studentService';
import { teacherAuthService } from '@/services/teacherAuthService';

// Main Finance Tab Types
type FinanceTab = 'student_fees' | 'payroll' | 'expenses' | 'cash_bank' | 'waivers_refunds' | 'reports';

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
  paymentMethod: string;
  trxId?: string;
  date: string;
  collectedBy: string;
}

const MONTHS_LIST = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

function FinanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active Tab Management
  const tabParam = searchParams.get('tab') as FinanceTab;
  const [activeTab, setActiveTab] = useState<FinanceTab>(tabParam || 'student_fees');
  const [reportSubTab, setReportSubTab] = useState<ReportSubTab>('income_statement');

  useEffect(() => {
    if (tabParam && ['student_fees', 'payroll', 'expenses', 'cash_bank', 'waivers_refunds', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (t: FinanceTab) => {
    setActiveTab(t);
    router.replace(\`/dashboard/finance?tab=\${t}\`);
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

  // Load all finance data
  const loadAllData = () => {
    setStudents(studentService.getAllStudents());
    setClassFees(financeService.getClassFeesConfig());
    setPayrolls(financeService.getPayrollRecords());
    setExpenses(financeService.getExpenses());
    setBankAccounts(financeService.getBankAccounts());
    setWaivers(financeService.getWaivers());
    setRefunds(financeService.getRefunds());
    setVouchers(financeService.getVouchers());
    setChartOfAccounts(financeService.getChartOfAccounts());

    try {
      const storedPayments = localStorage.getItem('sms_payment_history');
      if (storedPayments) {
        setPaymentHistory(JSON.parse(storedPayments));
      } else {
        const initialPayments: PaymentRecord[] = [
          {
            receiptId: 'REC-202608-8819',
            studentId: 'STU-601',
            studentName: 'তাহমিদ চৌধুরী',
            roll: '০১',
            grade: '6th',
            section: 'ক',
            mobile: '01811-223344',
            feeItems: [
              { name: 'মাসিক বেতন (জানুয়ারি)', amount: 400 },
              { name: 'মাসিক বেতন (ফেব্রুয়ারি)', amount: 400 },
              { name: 'মাসিক বেতন (মার্চ)', amount: 400 },
              { name: 'অর্ধবার্ষিক পরীক্ষা ফি', amount: 300 }
            ],
            subtotal: 1500,
            discount: 0,
            paidAmount: 1500,
            paymentMethod: 'Cash',
            trxId: 'CASH-881901',
            date: '2026-08-01 10:30 AM',
            collectedBy: 'ক্যাশিয়ার'
          }
        ];
        setPaymentHistory(initialPayments);
        localStorage.setItem('sms_payment_history', JSON.stringify(initialPayments));
      }
    } catch (e) {}
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadAllData();
    const unsub = financeService.subscribe(() => {
      loadAllData();
    });
    return () => unsub();
  }, []);

  // ─── 1. STUDENT FEES STATE & COMPUTATIONS ─────────────────────────
  const [feeSearch, setFeeSearch] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [extraFeeSelections, setExtraFeeSelections] = useState<{ [secId: string]: boolean }>({
    exam: true
  });
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [trxIdInput, setTrxIdInput] = useState<string>('');
  const [collectedBy, setCollectedBy] = useState<string>('ক্যাশিয়ার');
  const [printReceiptData, setPrintReceiptData] = useState<PaymentRecord | null>(null);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchGrade = selectedGradeFilter === 'all' || s.grade === selectedGradeFilter;
      const matchSearch = feeSearch === '' ||
        s.name.toLowerCase().includes(feeSearch.toLowerCase()) ||
        s.roll.toString().includes(feeSearch) ||
        ((s as any).studentId && (s as any).studentId.toLowerCase().includes(feeSearch.toLowerCase()));
      return matchGrade && matchSearch;
    });
  }, [students, selectedGradeFilter, feeSearch]);

  // Check if student has 100% stipend waiver
  const isStipendStudent = (st: Student | null) => {
    if (!st) return false;
    return Boolean((st as any).isStipend || (st as any).stipendCategory || (st as any).stipendStatus === 'Active');
  };

  // Handle select student for fee collection
  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    const currentMonthIdx = new Date().getMonth(); // 0 to 11
    const defaultDueMonths = MONTHS_LIST.slice(0, Math.min(currentMonthIdx + 1, 8));
    setSelectedMonths(defaultDueMonths);
    setDiscountAmount(0);
    setTrxIdInput('');
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
  const currentGrade = selectedStudent?.grade || '6th';
  const monthlyTuitionRate = isStipendStudent(selectedStudent)
    ? 0
    : (classFees[currentGrade]?.tuition || DEFAULT_CLASS_FEES_CONFIG[currentGrade]?.tuition || 400);

  // Calculate current subtotal
  const currentSubtotal = useMemo(() => {
    let sum = selectedMonths.length * monthlyTuitionRate;
    Object.keys(extraFeeSelections).forEach(secId => {
      if (extraFeeSelections[secId]) {
        const amt = classFees[currentGrade]?.[secId] || DEFAULT_CLASS_FEES_CONFIG[currentGrade]?.[secId] || 300;
        sum += amt;
      }
    });
    return sum;
  }, [selectedMonths, monthlyTuitionRate, extraFeeSelections, classFees, currentGrade]);

  const currentNetPayable = Math.max(0, currentSubtotal - discountAmount);

  // Submit student fee payment
  const handleCollectFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const feeItems: PaymentItem[] = [];
    selectedMonths.forEach(m => {
      feeItems.push({
        name: \`মাসিক বেতন (\${m})\`,
        amount: monthlyTuitionRate
      });
    });

    Object.keys(extraFeeSelections).forEach(secId => {
      if (extraFeeSelections[secId]) {
        const sectorObj = DEFAULT_FEE_SECTORS.find(s => s.id === secId);
        const name = sectorObj ? sectorObj.name : secId;
        const amt = classFees[currentGrade]?.[secId] || DEFAULT_CLASS_FEES_CONFIG[currentGrade]?.[secId] || 300;
        feeItems.push({ name, amount: amt });
      }
    });

    const now = new Date();
    const receiptNum = \`REC-\${now.getFullYear()}\${String(now.getMonth() + 1).padStart(2, '0')}-\${String(Math.floor(1000 + Math.random() * 9000))}\`;

    const newRecord: PaymentRecord = {
      receiptId: receiptNum,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      roll: String(selectedStudent.roll),
      grade: selectedStudent.grade || '6th',
      section: selectedStudent.section || 'ক',
      mobile: selectedStudent.mobile || (selectedStudent as any).phone || 'N/A',
      feeItems,
      subtotal: currentSubtotal,
      discount: discountAmount,
      paidAmount: currentNetPayable,
      paymentMethod,
      trxId: paymentMethod === 'Cash' ? \`CASH-\${Date.now().toString().slice(-6)}\` : trxIdInput || \`TRX-\${Date.now().toString().slice(-6)}\`,
      date: now.toLocaleString('bn-BD', { hour12: true }),
      collectedBy
    };

    const updated = [newRecord, ...paymentHistory];
    setPaymentHistory(updated);
    localStorage.setItem('sms_payment_history', JSON.stringify(updated));

    // 🌟 AUTOMATED DOUBLE-ENTRY JOURNAL POSTING!
    financeService.postFeeReceiptJournal({
      receiptId: receiptNum,
      studentName: selectedStudent.name,
      roll: String(selectedStudent.roll),
      grade: selectedStudent.grade || '6th',
      paidAmount: currentNetPayable,
      subtotal: currentSubtotal,
      discount: discountAmount,
      paymentMethod,
      feeItems,
      date: now.toISOString().split('T')[0],
      collectedBy
    });

    loadAllData();
    setPrintReceiptData(newRecord);
    setSelectedStudent(null);
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
    const vNo = \`PR-\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}-\${String(Math.floor(100 + Math.random() * 900))}\`;

    const record: PayrollRecord = {
      id: \`PAY-\${Date.now()}\`,
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
      trxId: payrollForm.trxId || \`PAY-TRX-\${Date.now().toString().slice(-5)}\`,
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
    const vNo = \`VCH-\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}-\${String(Math.floor(100 + Math.random() * 900))}\`;

    const record: ExpenseRecord = {
      id: \`EXP-\${Date.now()}\`,
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
  const [waiverForm, setWaiverForm] = useState({
    studentId: 'STU-601',
    studentName: 'তাহমিদ চৌধুরী',
    roll: '০১',
    grade: '৬ষ্ঠ শ্রেণি',
    type: 'percent' as const,
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
      id: \`WVR-\${Date.now()}\`,
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
      id: \`RFD-\${Date.now()}\`,
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
    const vNo = \`\${prefix}-\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}-\${String(Math.floor(100 + Math.random() * 900))}\`;

    const newVoucher: VoucherRecord = {
      id: \`VOUCH-\${Date.now()}\`,
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
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">ফাইন্যান্স ও হিসাবরক্ষণ মডিউল লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* ─── PRINT-ONLY CSS STYLES ───────────────────────────────── */}
      <style jsx global>{\`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10px;
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          .landscape-print {
            size: A4 landscape !important;
            margin: 4mm !important;
          }
        }
      \`}</style>

      {/* ─── TOP HEADER & EXECUTIVE KPI BANNER ───────────────────── */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  ফাইন্যান্স ও হিসাবরক্ষণ
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    অটোমেটেড একাউন্টিং
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  বরইতলী উচ্চ বিদ্যালয় • EIIN: 106184 • স্ট্যান্ডার্ড ডাবল-এন্ট্রি হিসাব ব্যবস্থা
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setVoucherFormType('Receipt');
                setShowVoucherModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>রিসিপ্ট ভাউচার</span>
            </button>
            <button
              onClick={() => {
                setVoucherFormType('Payment');
                setShowVoucherModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>পেমেন্ট ভাউচার</span>
            </button>
            <button
              onClick={() => {
                setVoucherFormType('Contra');
                setShowVoucherModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>কন্ট্রা ভাউচার</span>
            </button>
            <button
              onClick={() => {
                setVoucherFormType('Journal');
                setShowVoucherModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>জার্নাল ভাউচার (JV)</span>
            </button>
          </div>
        </div>

        {/* ─── 3 SUMMARY KPI METRIC CARDS ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-medium text-slate-400">হাতে নগদ (Cash in Hand)</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">৳ {cashInHand.toLocaleString('bn-BD')}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">ক্যাশ ড্রয়ার স্থিতি</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-medium text-slate-400">ব্যাংক ব্যালেন্স (Bank Total)</p>
              <h3 className="text-2xl font-black text-sky-400 mt-1">৳ {totalBankBalance.toLocaleString('bn-BD')}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">সোনালী, IBBL ও DBBL মোট</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Landmark className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div>
              <p className="text-xs font-medium text-slate-400">চলতি মাসের ব্যয় (Monthly Expenses)</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1">৳ {monthlyTotalExpense.toLocaleString('bn-BD')}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">বেতন ও ইউটিলিটি সহ মোট ব্যয়</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ─── 6 MAIN TABS (MATCHING USER'S SCREENSHOT PILLARS) ────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
          {[
            { id: 'student_fees', label: 'Student Fees', labelBn: 'শিক্ষার্থী ফি', icon: CreditCard, color: 'text-sky-400' },
            { id: 'payroll', label: 'Payroll', labelBn: 'শিক্ষক ও স্টাফ বেতন', icon: Banknote, color: 'text-emerald-400' },
            { id: 'expenses', label: 'Expenses', labelBn: 'দৈনন্দিন ব্যয়', icon: Receipt, color: 'text-rose-400' },
            { id: 'cash_bank', label: 'Cash & Bank', labelBn: 'ক্যাশ ও ব্যাংক', icon: Landmark, color: 'text-amber-400' },
            { id: 'waivers_refunds', label: 'Waivers & Refunds', labelBn: 'মওকুফ ও ছাড়', icon: RotateCcw, color: 'text-purple-400' },
            { id: 'reports', label: 'Financial Reports', labelBn: 'আর্থিক রিপোর্ট ও বিবরণী', icon: FileBarChart, color: 'text-indigo-400' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as FinanceTab)}
                className={\`flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-xs md:text-sm whitespace-nowrap transition-all border \${
                  isActive
                    ? 'bg-slate-900 text-white font-bold border-indigo-500/40 shadow-lg shadow-indigo-500/10 border-l-4 border-l-sky-400'
                    : 'bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/80'
                }\`}
              >
                <Icon className={\`w-4 h-4 \${tab.color}\`} />
                <span>{tab.label} ({tab.labelBn})</span>
              </button>
            );
          })}
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* TAB 1: STUDENT FEES                                           */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'student_fees' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Student Selector & Dues Table */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-sky-400" />
                    শিক্ষার্থী ও বকেয়া ফি নির্বাচন
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {filteredStudents.length} জন
                  </span>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="নাম/রোল/আইডি খুঁজুন..."
                      value={feeSearch}
                      onChange={e => setFeeSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <select
                    value={selectedGradeFilter}
                    onChange={e => setSelectedGradeFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="all">সকল শ্রেণি</option>
                    {GRADES_LIST.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                {/* Student List */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredStudents.map(st => {
                    const isSelected = selectedStudent?.id === st.id;
                    const stipend = isStipendStudent(st);
                    return (
                      <div
                        key={st.id}
                        onClick={() => handleSelectStudent(st)}
                        className={\`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between \${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500/50 text-white'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 text-slate-300'
                        }\`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center font-bold text-xs">
                            {st.roll}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold">{st.name}</h4>
                              {stipend && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                                  উপবৃত্তি (১০০% ফ্রি)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              শ্রেণি: {st.grade || '৬ষ্ঠ'} | শাখা: {st.section || 'ক'} | আইডি: {(st as any).studentId || st.id}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Fee Collection Box (Easy Pay Form) */}
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                {selectedStudent ? (
                  <form onSubmit={handleCollectFee} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>ফি আদায় বক্স —</span>
                          <span className="text-sky-400">{selectedStudent.name}</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          রোল: #{selectedStudent.roll} • শ্রেণি: {selectedStudent.grade || '৬ষ্ঠ'} • মোবাইল: {selectedStudent.mobile || (selectedStudent as any).phone || 'N/A'}
                        </p>
                      </div>
                      {isStipendStudent(selectedStudent) ? (
                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                            মাসিক বেতন ১০০% মওকুফ
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-xs text-slate-400">মাসিক বেতন হার:</span>
                          <p className="text-sm font-black text-sky-400">৳ {monthlyTuitionRate}/মাস</p>
                        </div>
                      )}
                    </div>

                    {/* Month Picker (Jan to Dec) */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-2">
                        ১. মাসিক বেতন নির্বাচন করুন ({selectedMonths.length} মাস নির্বাচিত):
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {MONTHS_LIST.map(m => {
                          const isChecked = selectedMonths.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => toggleMonth(m)}
                              className={\`py-2 px-1 rounded-lg text-xs font-medium text-center transition-all border \${
                                isChecked
                                  ? 'bg-sky-600 text-white font-bold border-sky-400 shadow-md shadow-sky-600/20'
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                              }\`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Non-tuition Fee Checklist */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-2">
                        ২. অন্যান্য ফি অন্তর্ভুক্ত করুন:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {DEFAULT_FEE_SECTORS.filter(s => s.id !== 'tuition').map(sector => {
                          const isChecked = Boolean(extraFeeSelections[sector.id]);
                          const feeAmount = classFees[currentGrade]?.[sector.id] || DEFAULT_CLASS_FEES_CONFIG[currentGrade]?.[sector.id] || sector.defAmount;
                          return (
                            <label
                              key={sector.id}
                              className={\`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all \${
                                isChecked
                                  ? 'bg-slate-950 border-sky-500/40 text-white'
                                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
                              }\`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    setExtraFeeSelections({
                                      ...extraFeeSelections,
                                      [sector.id]: e.target.checked
                                    });
                                  }}
                                  className="rounded border-slate-700 text-sky-600 focus:ring-0 w-4 h-4"
                                />
                                <span className="text-xs">{sector.name}</span>
                              </div>
                              <span className="text-xs font-bold text-slate-300">৳ {feeAmount}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Discount & Payment Methods */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">বিশেষ ছাড় / মওকুফ (টাকা)</label>
                        <input
                          type="number"
                          min="0"
                          value={discountAmount}
                          onChange={e => setDiscountAmount(Number(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">পেমেন্ট মাধ্যম</label>
                        <select
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        >
                          <option value="Cash">নগদ ক্যাশ (Cash in Hand)</option>
                          <option value="bKash">বিকাশ মার্চেন্ট (bKash)</option>
                          <option value="Nagad">নগদ ওয়ালেট (Nagad)</option>
                          <option value="Bank Transfer">সোনালী ব্যাংক ডিপোজিট</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">ট্রানজেকশন / রসিদ রেফারেন্স</label>
                        <input
                          type="text"
                          placeholder={paymentMethod === 'Cash' ? 'অটো জেনারেটেড' : 'TrxID / স্লিপ নং'}
                          value={trxIdInput}
                          onChange={e => setTrxIdInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* Payment Summary Box */}
                    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-400">সর্বমোট প্রদেয় ফি (Net Payable):</p>
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-2xl font-black text-emerald-400">৳ {currentNetPayable.toLocaleString('bn-BD')}</h2>
                          {discountAmount > 0 && (
                            <span className="text-xs text-rose-400 line-through">৳ {currentSubtotal}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(null)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          বাতিল
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ফি জমা ও রসিদ তৈরি</span>
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <User className="w-12 h-12 text-slate-700 mb-3" />
                    <h3 className="text-sm font-bold text-slate-400">কোন শিক্ষার্থী নির্বাচিত নেই</h3>
                    <p className="text-xs max-w-xs mt-1">
                      বাম পাশের তালিকা থেকে শিক্ষার্থী সিলেক্ট করুন অথবা নাম/রোল লিখে সার্চ করে নির্বাচন করুন।
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Fee Collection History Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  সাম্প্রতিক ফি আদায় রেজিস্টার (Recent Payment History)
                </h3>
                <span className="text-xs text-slate-400">মোট রসিদ: {paymentHistory.length} টি</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <th className="p-3">রসিদ নং</th>
                      <th className="p-3">শিক্ষার্থী ও রোল</th>
                      <th className="p-3">শ্রেণি ও শাখা</th>
                      <th className="p-3">ফিস খাতসমূহ</th>
                      <th className="p-3">পরিশোধিত অর্থ</th>
                      <th className="p-3">মাধ্যম</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3 text-right">রসিদ প্রিন্ট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {paymentHistory.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-3 font-mono font-bold text-sky-400">{rec.receiptId}</td>
                        <td className="p-3">
                          <p className="font-bold text-white">{rec.studentName}</p>
                          <p className="text-[10px] text-slate-400">রোল: #{rec.roll}</p>
                        </td>
                        <td className="p-3">{rec.grade || '৬ষ্ঠ'} ({rec.section || 'ক'})</td>
                        <td className="p-3 max-w-xs truncate text-[11px] text-slate-400">
                          {rec.feeItems.map(f => f.name).join(', ')}
                        </td>
                        <td className="p-3 font-bold text-emerald-400">৳ {rec.paidAmount}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {rec.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{rec.date}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setPrintReceiptData(rec)}
                            className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs border border-indigo-500/30"
                          >
                            রসিদ স্লিপ
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
        {/* TAB 2: PAYROLL                                                */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'payroll' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  শিক্ষক ও স্টাফ পে-রোল (Payroll Management)
                </h2>
                <p className="text-xs text-slate-400">
                  মাসিক মূল বেতন, বাড়িভাড়া ভাতা, বোনাস ও প্রভিডেন্ট ফান্ড সমন্বয়
                </p>
              </div>
              <button
                onClick={() => setShowPayrollModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন বেতন বিতরণ (Disburse Salary)</span>
              </button>
            </div>

            {/* Payroll History Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <th className="p-3">ভাউচার নং</th>
                      <th className="p-3">শিক্ষক/স্টাফ নাম</th>
                      <th className="p-3">পদবি</th>
                      <th className="p-3">মাস ও বছর</th>
                      <th className="p-3">মূল বেতন</th>
                      <th className="p-3">ভাতা ও বোনাস</th>
                      <th className="p-3">কর্তন (PF)</th>
                      <th className="p-3">নিট পরিশোধ</th>
                      <th className="p-3">মাধ্যম</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {payrolls.map((pay, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-3 font-mono font-bold text-sky-400">{pay.voucherNo}</td>
                        <td className="p-3 font-bold text-white">{pay.teacherName}</td>
                        <td className="p-3">{pay.designation}</td>
                        <td className="p-3">{pay.month} {pay.year}</td>
                        <td className="p-3">৳ {pay.baseSalary}</td>
                        <td className="p-3 text-emerald-400">+ ৳ {pay.allowances + pay.bonus}</td>
                        <td className="p-3 text-rose-400">- ৳ {pay.deductions}</td>
                        <td className="p-3 font-black text-emerald-400">৳ {pay.netPayable}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {pay.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setPrintSalarySlip(pay)}
                            className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs border border-indigo-500/30"
                          >
                            স্যালারি স্লিপ
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
        {/* TAB 3: EXPENSES                                               */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
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
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
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
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {expenses.map((exp, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-amber-400" />
                  ক্যাশ ও ব্যাংক হিসাব ব্যবস্থাপনা (Cash & Bank Management)
                </h2>
                <p className="text-xs text-slate-400">
                  হাতে নগদ ড্রয়ার, সোনালী, ইসলামী ব্যাংক ও ডাচ্-বাংলা ব্যাংক হিসাব ও কন্ট্রা ট্রান্সফার
                </p>
              </div>
              <button
                onClick={() => setShowBankTransferModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>ব্যাংকে অর্থ জমা ও ফান্ড ট্রান্সফার</span>
              </button>
            </div>

            {/* Bank Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bankAccounts.map((b, idx) => (
                <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 font-bold">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      কোড: {b.accountCode}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{b.bankName}</h4>
                    <p className="text-xs text-slate-400">{b.accountName}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">হিসাব নং: {b.accountNumber}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">বর্তমান স্থিতি:</span>
                    <span className="text-lg font-black text-sky-400">৳ {b.balance.toLocaleString('bn-BD')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Contra Transfer Log */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                সাম্প্রতিক কন্ট্রা ভাউচার ও ডিপোজিট খতিয়ান (Contra Transfers)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <th className="p-3">ভাউচার নং</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">রেফারেন্স ও উদ্দেশ্য</th>
                      <th className="p-3">বিবরণ</th>
                      <th className="p-3">পরিমাণ (টাকা)</th>
                      <th className="p-3">অন্ট্রি কারক</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {vouchers.filter(v => v.voucherType === 'Contra').map((cv, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-3 font-mono font-bold text-amber-400">{cv.voucherNo}</td>
                        <td className="p-3">{cv.date}</td>
                        <td className="p-3 font-medium text-white">{cv.reference}</td>
                        <td className="p-3 text-slate-400">{cv.narration}</td>
                        <td className="p-3 font-black text-emerald-400">৳ {cv.totalAmount}</td>
                        <td className="p-3 text-slate-400">{cv.createdBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* TAB 5: WAIVERS & REFUNDS                                      */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'waivers_refunds' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Waivers Section */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Percent className="w-4 h-4 text-purple-400" />
                    বৃত্তি ও ফি মওকুফ রেজিস্টার (Fee Waivers)
                  </h3>
                  <button
                    onClick={() => setShowWaiverModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold border border-purple-500/30"
                  >
                    + মওকুফ অনুমোদন
                  </button>
                </div>
                <div className="space-y-2">
                  {waivers.map((w, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">{w.studentName} ({w.grade})</h4>
                        <p className="text-[11px] text-slate-400">কারণ: {w.reason}</p>
                        <p className="text-[10px] text-slate-500">অনুমোদনে: {w.approvedBy} • {w.date}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold">
                        {w.type === 'percent' ? \`\${w.value}% ছাড়\` : \`৳ \${w.value} ছাড়\`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refunds Section */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    ফি রিফান্ড ও সমন্বয় রেজিস্টার (Refunds)
                  </h3>
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/30"
                  >
                    + রিফান্ড ভাউচার
                  </button>
                </div>
                <div className="space-y-2">
                  {refunds.map((r, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">{r.studentName}</h4>
                        <p className="text-[11px] text-slate-400">রসিদ নং: {r.receiptId} • কারণ: {r.reason}</p>
                        <p className="text-[10px] text-slate-500">প্রক্রিয়াকরণে: {r.processedBy} • {r.date}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold">
                        ফেরত ৳ {r.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* TAB 6: FINANCIAL REPORTS & STATEMENTS                         */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Sub-Tabs Selector for Reports */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex flex-wrap items-center gap-1.5">
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
                    className={\`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all \${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }\`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ─── SUB-TAB 1: INCOME STATEMENT (আয়-ব্যয় বিবরণী) ─── */}
            {reportSubTab === 'income_statement' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-indigo-400" />
                      আর্থিক আয় ও ব্যয় বিবরণী (Statement of Income & Expenditure)
                    </h3>
                    <p className="text-xs text-slate-400">চলতি অর্থবছর ২০২৬ • বরইতলী উচ্চ বিদ্যালয়</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    <Printer className="w-4 h-4" />
                    <span>প্রিন্ট করুন</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue / Income */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">ক. প্রাপ্ত আয়সমূহ (Revenues)</h4>
                    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
                      {incomeStatement.incomeLines.map((line, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
                          <span className="text-slate-300">{line.nameBn || line.name}</span>
                          <span className="font-bold text-emerald-400">৳ {line.amount.toLocaleString('bn-BD')}</span>
                        </div>
                      ))}
                      <div className="pt-2 flex items-center justify-between font-black text-sm text-emerald-400">
                        <span>মোট অর্জিত আয়:</span>
                        <span>৳ {incomeStatement.totalIncome.toLocaleString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">খ. পরিচালন ব্যয়সমূহ (Operating Expenses)</h4>
                    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
                      {incomeStatement.expenseLines.map((line, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
                          <span className="text-slate-300">{line.nameBn || line.name}</span>
                          <span className="font-bold text-rose-400">৳ {line.amount.toLocaleString('bn-BD')}</span>
                        </div>
                      ))}
                      <div className="pt-2 flex items-center justify-between font-black text-sm text-rose-400">
                        <span>মোট পরিচালন ব্যয়:</span>
                        <span>৳ {incomeStatement.totalExpense.toLocaleString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Surplus / Deficit Summary */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">নিট পরিচালন ফলাফল (Net Operating Surplus / Deficit)</h4>
                    <p className="text-xs text-slate-400">মোট অর্জিত রাজস্ব আয় হতে সর্বমোট ব্যয় কর্তনান্তে নিট উদ্বৃত্ত</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">তহবিল উদ্বৃত্ত:</span>
                    <h2 className={\`text-2xl font-black \${incomeStatement.netSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                      ৳ {incomeStatement.netSurplus.toLocaleString('bn-BD')}
                    </h2>
                  </div>
                </div>
              </div>
            )}

            {/* ─── SUB-TAB 2: BALANCE SHEET (উদ্বৃত্তপত্র) ─────────── */}
            {reportSubTab === 'balance_sheet' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Scale className="w-5 h-5 text-indigo-400" />
                      আর্থিক অবস্থার বিবরণী / উদ্বৃত্তপত্র (Balance Sheet)
                    </h3>
                    <p className="text-xs text-slate-400">সম্পদ = দায় + মূলধন ও সংরক্ষিত তহবিল (A = L + E)</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    <Printer className="w-4 h-4" />
                    <span>উদ্বৃত্তপত্র প্রিন্ট</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assets */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">১. মোট সম্পদ (Assets)</h4>
                    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
                      {balanceSheet.assetLines.map((line, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
                          <span className="text-slate-300">{line.nameBn || line.name}</span>
                          <span className="font-bold text-sky-400">৳ {line.amount.toLocaleString('bn-BD')}</span>
                        </div>
                      ))}
                      <div className="pt-3 flex items-center justify-between font-black text-sm text-sky-400 border-t border-slate-800">
                        <span>সর্বমোট সম্পদ (Total Assets):</span>
                        <span>৳ {balanceSheet.totalAssets.toLocaleString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="space-y-4">
                    {/* Liabilities */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">২. মোট দায়সমূহ (Liabilities)</h4>
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
                        {balanceSheet.liabilityLines.map((line, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
                            <span className="text-slate-300">{line.nameBn || line.name}</span>
                            <span className="font-bold text-rose-400">৳ {line.amount.toLocaleString('bn-BD')}</span>
                          </div>
                        ))}
                        <div className="pt-2 flex items-center justify-between font-bold text-xs text-rose-400">
                          <span>মোট দায় (Total Liabilities):</span>
                          <span>৳ {balanceSheet.totalLiabilities.toLocaleString('bn-BD')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Equity */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">৩. সংরক্ষিত তহবিল ও মূলধন (Equity)</h4>
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
                        {balanceSheet.equityLines.map((line, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-900">
                            <span className="text-slate-300">{line.nameBn || line.name}</span>
                            <span className="font-bold text-amber-400">৳ {line.amount.toLocaleString('bn-BD')}</span>
                          </div>
                        ))}
                        <div className="pt-2 flex items-center justify-between font-bold text-xs text-amber-400">
                          <span>মোট তহবিল (Total Equity):</span>
                          <span>৳ {balanceSheet.totalEquity.toLocaleString('bn-BD')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between font-black text-sm text-indigo-400">
                      <span>মোট দায় ও তহবিল (Total Liab & Equity):</span>
                      <span>৳ {balanceSheet.totalLiabAndEquity.toLocaleString('bn-BD')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── SUB-TAB 3: TRIAL BALANCE (রেওয়ামিল) ─────────────── */}
            {reportSubTab === 'trial_balance' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-400" />
                      রেওয়ামিল খতিয়ান (Trial Balance Statement)
                    </h3>
                    <p className="text-xs text-slate-400">ডেবিট ব্যালেন্স ও ক্রেডিট ব্যালেন্স স্বয়ংক্রিয় মিলন</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={\`px-3 py-1 rounded-full text-xs font-bold \${
                      trialBalance.isBalanced ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }\`}>
                      {trialBalance.isBalanced ? '✓ রেওয়ামিল মিলেছে (Balanced)' : '✕ অমিল আছে (Unbalanced)'}
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="p-3">অ্যাকাউন্ট কোড</th>
                        <th className="p-3">হিসাবের শিরোনাম (Account Name)</th>
                        <th className="p-3">শ্রেণি (Category)</th>
                        <th className="p-3 text-right">ডেবিট স্থিতি (৳)</th>
                        <th className="p-3 text-right">ক্রেডিট স্থিতি (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {trialBalance.lines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-3 font-mono font-bold text-sky-400">{line.code}</td>
                          <td className="p-3 font-bold text-white">{line.nameBn || line.name}</td>
                          <td className="p-3 text-slate-400">{line.category}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            {line.debitBalance > 0 ? \`৳ \${line.debitBalance.toLocaleString('bn-BD')}\` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-400">
                            {line.creditBalance > 0 ? \`৳ \${line.creditBalance.toLocaleString('bn-BD')}\` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-950 font-black text-sm text-white border-t-2 border-slate-700">
                        <td colSpan={3} className="p-3 text-right">মোট যোগফল (Grand Total):</td>
                        <td className="p-3 text-right font-mono text-emerald-400">৳ {trialBalance.totalDebit.toLocaleString('bn-BD')}</td>
                        <td className="p-3 text-right font-mono text-rose-400">৳ {trialBalance.totalCredit.toLocaleString('bn-BD')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ─── SUB-TAB 4: CASH BOOK (ক্যাশবুক) ────────────────── */}
            {reportSubTab === 'cash_book' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-400" />
                      ক্যাশবুক / দৈনিক নগদ প্রবাহ খতিয়ান (Cash Book)
                    </h3>
                    <p className="text-xs text-slate-400">প্রারম্ভিক ব্যালেন্স: ৳ {cashBook.openingBalance.toLocaleString('bn-BD')}</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    <Printer className="w-4 h-4" />
                    <span>ক্যাশবুক প্রিন্ট</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="p-3">তারিখ</th>
                        <th className="p-3">ভাউচার নং</th>
                        <th className="p-3">বিবরণ ও প্রাসঙ্গিক সূত্র</th>
                        <th className="p-3 text-right text-emerald-400">জমা (Receipt ৳)</th>
                        <th className="p-3 text-right text-rose-400">খরচ (Payment ৳)</th>
                        <th className="p-3 text-right font-bold text-white">জের / ব্যালেন্স (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr className="bg-slate-950/60 font-semibold text-slate-400">
                        <td className="p-3">-</td>
                        <td className="p-3">OPENING</td>
                        <td className="p-3">প্রারম্ভিক নগদ তহবিল (Opening Balance)</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right font-mono font-bold text-white">৳ {cashBook.openingBalance.toLocaleString('bn-BD')}</td>
                      </tr>
                      {cashBook.records.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-3 text-slate-400">{rec.date}</td>
                          <td className="p-3 font-mono font-bold text-sky-400">{rec.voucherNo}</td>
                          <td className="p-3">
                            <p className="font-medium text-white">{rec.particulars}</p>
                            <p className="text-[10px] text-slate-500">{rec.reference}</p>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            {rec.receiptAmount > 0 ? \`৳ \${rec.receiptAmount.toLocaleString('bn-BD')}\` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-400">
                            {rec.paymentAmount > 0 ? \`৳ \${rec.paymentAmount.toLocaleString('bn-BD')}\` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-sky-400">
                            ৳ {rec.balance.toLocaleString('bn-BD')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-950 font-black text-sm text-white border-t-2 border-slate-700">
                        <td colSpan={3} className="p-3 text-right">মোট জমা ও খরচ:</td>
                        <td className="p-3 text-right font-mono text-emerald-400">৳ {cashBook.totalReceipts.toLocaleString('bn-BD')}</td>
                        <td className="p-3 text-right font-mono text-rose-400">৳ {cashBook.totalPayments.toLocaleString('bn-BD')}</td>
                        <td className="p-3 text-right font-mono text-emerald-400">৳ {cashBook.closingBalance.toLocaleString('bn-BD')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ─── SUB-TAB 5: BANK BOOK (ব্যাংকবুক) ────────────────── */}
            {reportSubTab === 'bank_book' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedBankBookCode}
                      onChange={e => setSelectedBankBookCode(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="1020">সোনালী ব্যাংক পিএলসি (1020)</option>
                      <option value="1030">ইসলামী ব্যাংক বাংলাদেশ (1030)</option>
                      <option value="1040">ডাচ-বাংলা ব্যাংক পিএলসি (1040)</option>
                    </select>
                    <div>
                      <h3 className="text-base font-bold text-white">{bankBook.bankName} খতিয়ান</h3>
                      <p className="text-xs text-slate-400">প্রারম্ভিক স্থিতি: ৳ {bankBook.openingBalance.toLocaleString('bn-BD')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    <Printer className="w-4 h-4" />
                    <span>ব্যাংকবুক প্রিন্ট</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="p-3">তারিখ</th>
                        <th className="p-3">ভাউচার নং</th>
                        <th className="p-3">বিবরণ ও চেক রেফারেন্স</th>
                        <th className="p-3 text-right text-emerald-400">জমা (Deposit ৳)</th>
                        <th className="p-3 text-right text-rose-400">উত্তোলন (Withdraw ৳)</th>
                        <th className="p-3 text-right font-bold text-white">চলমান স্থিতি (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr className="bg-slate-950/60 font-semibold text-slate-400">
                        <td className="p-3">-</td>
                        <td className="p-3">OPENING</td>
                        <td className="p-3">প্রারম্ভিক ব্যাংক স্থিতি</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right font-mono font-bold text-white">৳ {bankBook.openingBalance.toLocaleString('bn-BD')}</td>
                      </tr>
                      {bankBook.records.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-3 text-slate-400">{rec.date}</td>
                          <td className="p-3 font-mono font-bold text-sky-400">{rec.voucherNo}</td>
                          <td className="p-3 font-medium text-white">{rec.particulars}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            {rec.depositAmount > 0 ? \`৳ \${rec.depositAmount.toLocaleString('bn-BD')}\` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-400">
                            {rec.withdrawAmount > 0 ? \`৳ \${rec.withdrawAmount.toLocaleString('bn-BD')}\` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-sky-400">
                            ৳ {rec.balance.toLocaleString('bn-BD')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── SUB-TAB 6: GENERAL LEDGER (খতিয়ান / লেজারবুক) ──── */}
            {reportSubTab === 'general_ledger' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedLedgerAccount}
                      onChange={e => setSelectedLedgerAccount(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 max-w-xs"
                    >
                      {chartOfAccounts.map(a => (
                        <option key={a.code} value={a.code}>
                          {a.code} - {a.nameBn || a.name} ({a.category})
                        </option>
                      ))}
                    </select>
                    <div>
                      <h3 className="text-base font-bold text-white">{generalLedger.account.nameBn} খতিয়ান</h3>
                      <p className="text-xs text-slate-400">প্রারম্ভিক জের: ৳ {generalLedger.openingBalance.toLocaleString('bn-BD')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    <Printer className="w-4 h-4" />
                    <span>খতিয়ান প্রিন্ট</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="p-3">তারিখ</th>
                        <th className="p-3">ভাউচার নং</th>
                        <th className="p-3">ভাউচার টাইপ</th>
                        <th className="p-3">বিবরণ (Particulars)</th>
                        <th className="p-3 text-right text-emerald-400">ডেবিট (Debit ৳)</th>
                        <th className="p-3 text-right text-rose-400">ক্রেডিট (Credit ৳)</th>
                        <th className="p-3 text-right font-bold text-white">সমাপনী স্থিতি (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr className="bg-slate-950/60 font-semibold text-slate-400">
                        <td className="p-3">-</td>
                        <td className="p-3">OPENING</td>
                        <td className="p-3">Balance B/F</td>
                        <td className="p-3">প্রারম্ভিক জের</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right">-</td>
                        <td className="p-3 text-right font-mono font-bold text-white">৳ {generalLedger.openingBalance.toLocaleString('bn-BD')}</td>
                      </tr>
                      {generalLedger.records.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-3 text-slate-400">{rec.date}</td>
                          <td className="p-3 font-mono font-bold text-sky-400">{rec.voucherNo}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                              {rec.voucherType}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-white">{rec.particulars}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            {rec.debit > 0 ? \`৳ \${rec.debit.toLocaleString('bn-BD')}\` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-400">
                            {rec.credit > 0 ? \`৳ \${rec.credit.toLocaleString('bn-BD')}\` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-sky-400">
                            ৳ {rec.balance.toLocaleString('bn-BD')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── SUB-TAB 7: VOUCHERS (ভাউচার রেজিস্টার) ─────────── */}
            {reportSubTab === 'vouchers' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-indigo-400" />
                      ভাউচার ও জার্নাল রেজিস্টার (Voucher Master Ledger)
                    </h3>
                    <p className="text-xs text-slate-400">রিসিপ্ট, পেমেন্ট, কন্ট্রা ও সমন্বয় জার্নাল ভাউচার তালিকা</p>
                  </div>
                  <button
                    onClick={() => {
                      setVoucherFormType('Journal');
                      setShowVoucherModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন ভাউচার এন্ট্রি</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {vouchers.map((v, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={\`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono \${
                            v.voucherType === 'Receipt' ? 'bg-emerald-500/20 text-emerald-400' :
                            v.voucherType === 'Payment' ? 'bg-rose-500/20 text-rose-400' :
                            v.voucherType === 'Contra' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-indigo-500/20 text-indigo-400'
                          }\`}>
                            {v.voucherNo}
                          </span>
                          <span className="text-xs font-bold text-white">{v.reference}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{v.date}</span>
                          <button
                            onClick={() => setPrintVoucherData(v)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                          >
                            প্রিন্ট ভাউচার
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400">{v.narration}</p>

                      {/* Entries Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-900">
                              <th className="py-1">কোড</th>
                              <th className="py-1">হিসাবের নাম</th>
                              <th className="py-1">বিবরণ</th>
                              <th className="py-1 text-right text-emerald-400">ডেবিট (৳)</th>
                              <th className="py-1 text-right text-rose-400">ক্রেডিট (৳)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900 text-slate-300">
                            {v.entries.map((entry, eIdx) => (
                              <tr key={eIdx}>
                                <td className="py-1 font-mono text-slate-500">{entry.accountCode}</td>
                                <td className="py-1 font-medium">{entry.accountName}</td>
                                <td className="py-1 text-slate-400">{entry.narration || '-'}</td>
                                <td className="py-1 text-right font-mono font-bold text-emerald-400">
                                  {entry.debit > 0 ? \`৳ \${entry.debit.toLocaleString('bn-BD')}\` : '-'}
                                </td>
                                <td className="py-1 text-right font-mono font-bold text-rose-400">
                                  {entry.credit > 0 ? \`৳ \${entry.credit.toLocaleString('bn-BD')}\` : '-'}
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

            {/* ─── SUB-TAB 8: CHART OF ACCOUNTS (COA) ─────────────── */}
            {reportSubTab === 'chart_of_accounts' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                      চার্ট অব একাউন্টস ও লেজার সেটআপ (Chart of Accounts)
                    </h3>
                    <p className="text-xs text-slate-400">ইচ্ছামত হিসাবের প্রধান ও উপ-খাত সংযোজন, সংশোধন ও নিয়ন্ত্রণ</p>
                  </div>
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
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন অ্যাকাউন্ট হেড যোগ করুন</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="p-3">কোড</th>
                        <th className="p-3">হিসাবের নাম (বাংলা)</th>
                        <th className="p-3">হিসাবের নাম (English)</th>
                        <th className="p-3">ক্যাটাগরি</th>
                        <th className="p-3">সাব-ক্যাটাগরি</th>
                        <th className="p-3 text-right">প্রারম্ভিক জের (৳)</th>
                        <th className="p-3 text-center">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {chartOfAccounts.map((acc, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-3 font-mono font-bold text-sky-400">{acc.code}</td>
                          <td className="p-3 font-bold text-white">{acc.nameBn}</td>
                          <td className="p-3 text-slate-400">{acc.name}</td>
                          <td className="p-3">
                            <span className={\`px-2 py-0.5 rounded text-[10px] font-bold \${
                              acc.category === 'Asset' ? 'bg-sky-500/20 text-sky-300' :
                              acc.category === 'Liability' ? 'bg-rose-500/20 text-rose-300' :
                              acc.category === 'Equity' ? 'bg-amber-500/20 text-amber-300' :
                              acc.category === 'Income' ? 'bg-emerald-500/20 text-emerald-300' :
                              'bg-purple-500/20 text-purple-300'
                            }\`}>
                              {acc.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{acc.subCategory}</td>
                          <td className="p-3 text-right font-mono font-bold text-white">৳ {acc.openingBalance.toLocaleString('bn-BD')}</td>
                          <td className="p-3 text-center">
                            {acc.isSystem ? (
                              <span className="text-[10px] text-slate-500">কোর সিস্টেম</span>
                            ) : (
                              <button
                                onClick={() => {
                                  if (confirm(\`'\${acc.nameBn}' অ্যাকাউন্টটি মুছে ফেলতে চান?\`)) {
                                    financeService.deleteAccount(acc.code);
                                    loadAllData();
                                  }
                                }}
                                className="p-1 text-rose-400 hover:text-rose-300"
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: PAYROLL DISBURSEMENT MODAL                           */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                শিক্ষক ও কর্মচারী বেতন বিতরণ ভাউচার
              </h3>
              <button onClick={() => setShowPayrollModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayroll} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">শিক্ষক / স্টাফ নির্বাচন</label>
                <input
                  type="text"
                  value={payrollForm.teacherName}
                  onChange={e => setPayrollForm({ ...payrollForm, teacherName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">মাস</label>
                  <select
                    value={payrollForm.month}
                    onChange={e => setPayrollForm({ ...payrollForm, month: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">বছর</label>
                  <input
                    type="number"
                    value={payrollForm.year}
                    onChange={e => setPayrollForm({ ...payrollForm, year: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">মূল বেতন (Base)</label>
                  <input
                    type="number"
                    value={payrollForm.baseSalary}
                    onChange={e => setPayrollForm({ ...payrollForm, baseSalary: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ভাতা (Allowances)</label>
                  <input
                    type="number"
                    value={payrollForm.allowances}
                    onChange={e => setPayrollForm({ ...payrollForm, allowances: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">কর্তন (PF Deduction)</label>
                  <input
                    type="number"
                    value={payrollForm.deductions}
                    onChange={e => setPayrollForm({ ...payrollForm, deductions: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">পরিশোধ মাধ্যম</label>
                  <select
                    value={payrollForm.paymentMethod}
                    onChange={e => setPayrollForm({ ...payrollForm, paymentMethod: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Bank Transfer">সোনালী ব্যাংক ট্রান্সফার</option>
                    <option value="Cash">নগদ ক্যাশ (Cash)</option>
                    <option value="bKash">বিকাশ (bKash)</option>
                    <option value="Nagad">নগদ (Nagad)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">রেফারেন্স / TrxID</label>
                  <input
                    type="text"
                    value={payrollForm.trxId}
                    onChange={e => setPayrollForm({ ...payrollForm, trxId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">নিট প্রদেয় বেতন:</span>
                <span className="text-base font-black text-emerald-400">
                  ৳ {(payrollForm.baseSalary + payrollForm.allowances + payrollForm.bonus - payrollForm.deductions).toLocaleString('bn-BD')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" />
                নতুন বিদ্যালয় ব্যয় ভাউচার
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">ব্যয় খাত (Category)</label>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">টাকার পরিমাণ</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">প্রাপক / ভেন্ডরের নাম</label>
                <input
                  type="text"
                  placeholder="যেমন: পল্লী বিদ্যুৎ সমিতি / পেপার হাউস"
                  value={expenseForm.paidTo}
                  onChange={e => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">পরিশোধ মাধ্যম</label>
                <select
                  value={expenseForm.paymentMethod}
                  onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Cash">নগদ ক্যাশ (Cash)</option>
                  <option value="bKash">বিকাশ (bKash)</option>
                  <option value="Nagad">নগদ (Nagad)</option>
                  <option value="Bank Check">ব্যাংক চেক (Bank Check)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">খরচের বিবরণ / নোট</label>
                <input
                  type="text"
                  placeholder="সংক্ষিপ্ত বিবরণ..."
                  value={expenseForm.note}
                  onChange={e => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                কন্ট্রা ভাউচার (ক্যাশ-টু-ব্যাংক ট্রান্সফার)
              </h3>
              <button onClick={() => setShowBankTransferModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankTransfer} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">উৎস হিসাব (From Account)</label>
                <input
                  type="text"
                  value={bankTransferForm.from}
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">গন্তব্য ব্যাংক হিসাব (To Bank)</label>
                <select
                  value={bankTransferForm.to}
                  onChange={e => setBankTransferForm({ ...bankTransferForm, to: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="bank-1">সোনালী ব্যাংক পিএলসি (Sonali Bank)</option>
                  <option value="bank-2">ইসলামী ব্যাংক বাংলাদেশ (IBBL)</option>
                  <option value="bank-3">ডাচ-বাংলা ব্যাংক পিএলসি (DBBL)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">টাকার পরিমাণ</label>
                <input
                  type="number"
                  value={bankTransferForm.amount}
                  onChange={e => setBankTransferForm({ ...bankTransferForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">ডিপোজিট স্লিপ / রেফারেন্স নং</label>
                <input
                  type="text"
                  placeholder="যেমন: SLIP-88210"
                  value={bankTransferForm.refNo}
                  onChange={e => setBankTransferForm({ ...bankTransferForm, refNo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBankTransferModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
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
      {/* MODAL 4: MANUAL VOUCHER CREATOR MODAL (DOUBLE ENTRY)          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                স্ট্যান্ডার্ড ডাবল-এন্ট্রি ভাউচার ক্রিয়েটর (Voucher Creator)
              </h3>
              <button onClick={() => setShowVoucherModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualVoucher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ভাউচার টাইপ</label>
                  <select
                    value={voucherFormType}
                    onChange={e => setVoucherFormType(e.target.value as VoucherType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    <option value="Payment">পেমেন্ট ভাউচার (Payment Voucher - PV)</option>
                    <option value="Receipt">রিসিপ্ট ভাউচার (Receipt Voucher - RV)</option>
                    <option value="Contra">কন্ট্রা ভাউচার (Contra Voucher - CV)</option>
                    <option value="Journal">জার্নাল সমন্বয় ভাউচার (Journal - JV)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">রেফারেন্স / প্রাপক / উৎস</label>
                  <input
                    type="text"
                    placeholder="যেমন: বিজ্ঞান ল্যাব রাসায়নিক ক্রয়"
                    value={voucherFormRef}
                    onChange={e => setVoucherFormRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">সার্বিক বিবরণ (Narration)</label>
                <input
                  type="text"
                  placeholder="ভাউচারের বিস্তারিত কারণ ও বিবরণ..."
                  value={voucherFormNarration}
                  onChange={e => setVoucherFormNarration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Journal Line Entries */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">ডেবিট ও ক্রেডিট খতিয়ান সারি:</label>
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
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="col-span-4">
                        <select
                          value={row.accountCode}
                          onChange={e => updateVoucherRow(idx, 'accountCode', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-medium"
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-emerald-400 font-bold text-right"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="ক্রেডিট ৳"
                          value={row.credit || ''}
                          onChange={e => updateVoucherRow(idx, 'credit', Number(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-rose-400 font-bold text-right"
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
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span>মোট ডেবিট: <strong className="text-emerald-400">৳ {totalVoucherDebit}</strong></span>
                    <span>মোট ক্রেডিট: <strong className="text-rose-400">৳ {totalVoucherCredit}</strong></span>
                  </div>
                  <span className={\`text-xs font-bold \${isVoucherBalanced ? 'text-emerald-400' : 'text-rose-400'}\`}>
                    {isVoucherBalanced ? '✓ ব্যালেন্স সমান' : '✕ ডেবিট ও ক্রেডিট সমান নয়'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={!isVoucherBalanced}
                  className={\`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all \${
                    isVoucherBalanced ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }\`}
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                নতুন চার্ট অব একাউন্টস হেড যোগ করুন
              </h3>
              <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">অ্যাকাউন্ট কোড</label>
                  <input
                    type="text"
                    placeholder="যেমন: 5095"
                    value={accountForm.code}
                    onChange={e => setAccountForm({ ...accountForm, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ক্যাটাগরি</label>
                  <select
                    value={accountForm.category}
                    onChange={e => setAccountForm({ ...accountForm, category: e.target.value as AccountCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
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
                <label className="text-xs text-slate-400 block mb-1">হিসাবের নাম (বাংলা)</label>
                <input
                  type="text"
                  placeholder="যেমন: কম্পিউটার ল্যাব যন্ত্রপাতি ক্রয়"
                  value={accountForm.nameBn}
                  onChange={e => setAccountForm({ ...accountForm, nameBn: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">হিসাবের নাম (English)</label>
                <input
                  type="text"
                  placeholder="যেমন: Computer Lab Equipment"
                  value={accountForm.name}
                  onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">প্রারম্ভিক ব্যালেন্স (৳)</label>
                <input
                  type="number"
                  value={accountForm.openingBalance}
                  onChange={e => setAccountForm({ ...accountForm, openingBalance: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
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
      {/* PRINT-ONLY AREA: 3-PART LANDSCAPE A4 MONEY RECEIPT           */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {printReceiptData && (
        <div id="print-area" className="hidden print:block text-black bg-white">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs font-bold">বরইতলী উচ্চ বিদ্যালয় — মানি রিসিট (A4 Landscape ৩-কপি)</h2>
            <button onClick={() => setPrintReceiptData(null)} className="print:hidden text-xs bg-red-500 text-white px-2 py-1 rounded">বন্ধ করুন</button>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t-2 border-black pt-2 text-[10px]">
            {['শিক্ষার্থী কপি (Student Copy)', 'অফিস কপি (Office Copy)', 'হিসাব শাখা কপি (Accounts Copy)'].map((copyName, i) => (
              <div key={i} className="border border-dashed border-gray-400 p-2 relative flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="text-center border-b pb-1">
                    <h3 className="font-bold text-[12px]">বরইতলী উচ্চ বিদ্যালয়</h3>
                    <p className="text-[9px]">বরইতলী, চকরিয়া, কক্সবাজার • EIIN: 106184</p>
                    <span className="inline-block bg-gray-200 px-1.5 py-0.5 rounded text-[8px] font-bold mt-0.5">{copyName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 my-1 text-[9px]">
                    <div><strong>রসিদ নং:</strong> {printReceiptData.receiptId}</div>
                    <div><strong>তারিখ:</strong> {printReceiptData.date}</div>
                    <div><strong>নাম:</strong> {printReceiptData.studentName}</div>
                    <div><strong>রোল:</strong> #{printReceiptData.roll}</div>
                    <div><strong>শ্রেণি:</strong> {printReceiptData.grade} ({printReceiptData.section})</div>
                    <div><strong>মাধ্যম:</strong> {printReceiptData.paymentMethod}</div>
                  </div>

                  <table className="w-full text-left text-[8px] border-collapse border border-gray-300 mt-1">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-300">
                        <th className="p-1">ফি খাত</th>
                        <th className="p-1 text-right">টাকা</th>
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
                          <td className="p-1 text-right">মওকুফ/ছাড়:</td>
                          <td className="p-1 text-right font-mono text-red-600">-৳{printReceiptData.discount}</td>
                        </tr>
                      )}
                      <tr className="font-bold border-t border-gray-400">
                        <td className="p-1 text-right">পরিশোধিত অর্থ:</td>
                        <td className="p-1 text-right font-mono">৳{printReceiptData.paidAmount}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex justify-between items-end pt-4 text-[8px] border-t border-gray-300 mt-2">
                  <div className="text-center">
                    <p className="border-t border-black px-2">আদায়কারীর স্বাক্ষর</p>
                  </div>
                  <div className="text-center">
                    <p className="border-t border-black px-2">প্রধান শিক্ষক</p>
                  </div>
                </div>
              </div>
            ))}
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
                  <td className="p-1.5 text-right font-mono">{e.debit > 0 ? \`৳\${e.debit}\` : '-'}</td>
                  <td className="p-1.5 text-right font-mono">{e.credit > 0 ? \`৳\${e.credit}\` : '-'}</td>
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
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">ফাইন্যান্স মডিউল লোড হচ্ছে...</div>}>
      <FinanceContent />
    </Suspense>
  );
}
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully wrote updated finance page with all type fixes!');
