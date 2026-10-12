// Centralized Double-Entry Automated Finance & Accounting Service for School Management System
import { auditTrailService } from './auditTrailService';
import { studentService } from './studentService';
import { syncQueueService } from './syncQueueService';

export interface FeeSector {
  id: string;
  name: string;
  defAmount: number;
  description?: string;
  accountCode?: string; // Mapped COA revenue account code
  frequency?: 'monthly' | 'yearly' | 'one_time' | 'per_exam' | 'on_demand';
  applicableClasses?: string[]; // e.g. ['6th', '7th', '8th', '9th', '10th']
  category?: 'tuition' | 'admission' | 'exam' | 'facility' | 'board' | 'event' | 'service' | 'other';
  isActive?: boolean;
}

export interface ClassFeeItem {
  className: string;
  grade: string;
  amount: number;
}

// ─── 🗂️ CHART OF ACCOUNTS (COA) MODEL ──────────────────────────────
export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export interface AccountHead {
  code: string;
  name: string;
  nameBn: string;
  category: AccountCategory;
  subCategory: string;
  openingBalance: number;
  currentBalance?: number;
  isSystem: boolean; // System core accounts cannot be deleted
  description?: string;
}

// ─── 📑 VOUCHER & JOURNAL ENTRY MODELS (AUTO DEBIT-CREDIT) ───────────
export type VoucherType = 'Receipt' | 'Payment' | 'Contra' | 'Journal';

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  narration?: string;
}

export interface VoucherRecord {
  id: string;
  voucherNo: string; // e.g. RV-2026-0001, PV-2026-0001, CV-2026-0001, JV-2026-0001
  voucherType: VoucherType;
  date: string;
  reference: string;
  narration: string;
  entries: JournalLine[];
  totalAmount: number;
  sourceModule: 'student_fees' | 'payroll' | 'expenses' | 'cash_bank' | 'waivers_refunds' | 'manual_voucher';
  sourceId?: string;
  createdBy: string;
}

// ─── 👥 EXISTING BUSINESS RECORDS ────────────────────────────────────
export interface PayrollRecord {
  id: string;
  voucherNo: string;
  teacherId: string;
  teacherName: string;
  designation: string;
  month: string;
  year: number;
  baseSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  netPayable: number;
  paidAmount: number;
  status: 'Paid' | 'Pending';
  paymentDate: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'bKash' | 'Nagad';
  trxId?: string;
  note?: string;
}

export interface ExpenseRecord {
  id: string;
  voucherNo: string;
  category: string;
  accountCode?: string;
  amount: number;
  date: string;
  paidTo: string;
  paymentMethod: 'Cash' | 'Bank Check' | 'bKash' | 'Nagad';
  note: string;
  recordedBy: string;
}

export interface BankAccount {
  id: string;
  accountCode: string; // COA mapped code
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  balance: number;
}

export interface BankTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  from: string;
  to: string;
  amount: number;
  date: string;
  refNo: string;
  note: string;
}

export interface WaiverRecord {
  id: string;
  studentId: string;
  studentName: string;
  roll: string;
  grade: string;
  type: 'percent' | 'flat';
  value: number;
  reason: string;
  approvedBy: string;
  date: string;
}

export interface RefundRecord {
  id: string;
  receiptId: string;
  studentId: string;
  studentName: string;
  amount: number;
  reason: string;
  date: string;
  processedBy: string;
}

// ─── ⚙️ GO-LIVE SETTINGS & BILLING CYCLE ─────────────────────────────
export interface FinanceSettings {
  systemStartMonth: string;         // 'জানুয়ারি', 'জুলাই', 'সেপ্টেম্বর', etc.
  systemStartYear: number;          // 2026
  systemStartDate: string;          // '2026-09-01'
  autoInvoiceGeneration: boolean;   // true
  invoiceDueDay: number;            // 15th of each month
  preStartMonthsAction: 'settled' | 'waived' | 'due'; // default 'settled'
  currencySymbol: string;           // '৳'
  enableLateFine: boolean;          // false
  lateFineAmount: number;           // 50
  schoolName: string;
}

export const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  systemStartMonth: 'জানুয়ারি',
  systemStartYear: 2026,
  systemStartDate: '2026-01-01',
  autoInvoiceGeneration: true,
  invoiceDueDay: 15,
  preStartMonthsAction: 'settled',
  currencySymbol: '৳',
  enableLateFine: false,
  lateFineAmount: 50,
  schoolName: 'বরইতলী উচ্চ বিদ্যালয়'
};

// ─── 🧾 FEE INVOICE & PARTIAL PAYMENT MODELS ─────────────────────────
export interface FeeInvoiceItem {
  sectorId: string;
  name: string;
  amount: number;
  discount: number;
  netAmount: number;
}

export interface FeeInvoicePayment {
  receiptId: string;
  trxId?: string;
  amount: number;
  discountApplied?: number;
  paymentMethod: string;
  date: string;
  collectedBy: string;
}

export interface FeeInvoice {
  id: string;                       // e.g. "INV-2026-09-0012"
  invoiceNo: string;                // e.g. "INV-2609-0012"
  invoiceId?: string;               // Alias for invoiceNo
  studentId: string;
  studentName: string;
  roll: string;
  mobile?: string;
  grade: string;
  section: string;
  month: string;                    // e.g. 'সেপ্টেম্বর'
  year: number;                     // 2026
  issueDate: string;                // '2026-09-01'
  dueDate: string;                  // '2026-09-15'
  items: FeeInvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  waiverReason?: string;
  totalPayable: number;
  netPayable?: number;              // Alias for totalPayable
  totalPaid: number;
  paidAmount?: number;              // Alias for totalPaid
  dueAmount: number;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  payments: FeeInvoicePayment[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── 🎓 STUDENT FEE LEDGER & DUE TRACKING INTERFACES ─────────────────
export const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export interface MonthDue {
  month: string;           // 'জানুয়ারি', 'ফেব্রুয়ারি', etc.
  monthIndex: number;      // 0 to 11
  year: number;            // 2026
  tuitionAmount: number;   // base tuition amount
  paidAmount: number;      // paid amount for this month
  dueAmount: number;       // remaining due for this month
  discount: number;        // discount allocated
  status: 'paid' | 'partial' | 'due' | 'waived';
  paymentReceipts?: string[]; // Receipt IDs
}

export interface OtherFeeDue {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  discount: number;
  status: 'paid' | 'partial' | 'due' | 'waived';
  paymentReceipts?: string[];
}

export interface StudentFeeLedger {
  studentId: string;
  studentName?: string;
  roll?: string;
  grade?: string;
  section?: string;
  sessionYear: number;
  isStipend?: boolean;
  // ─── 🚩 Software Go-Live & Opening Arrears ───
  openingDue?: number;              // পূর্ববর্তী শিক্ষাবর্ষ বা সফটওয়্যার শুরুর পূর্বের বকেয়া
  openingDuePaid?: number;          // পূর্বের বকেয়া থেকে পরিশোধিত
  openingDueRemaining?: number;     // অবশিষ্ট পূর্বের বকেয়া
  openingDueNote?: string;          // বকেয়া নির্ধারণের নোট
  openingDueSetDate?: string;       // তারিখ
  // ─────────────────────────────────────────────
  months: MonthDue[];
  otherFees: { [sectorId: string]: OtherFeeDue };
  totalBilled: number;
  totalPaid: number;
  totalDiscount: number;
  totalDue: number;
  lastPaymentDate?: string;
  lastPaymentMethod?: string;
  lastReceiptId?: string;
}

export interface FeeCollectionStats {
  totalStudents: number;
  totalDueAll: number;
  totalCollectedAll: number;
  totalDiscountAll: number;
  todayCollected: number;
  cashCollected: number;
  bkashCollected: number;
  nagadCollected: number;
  bankCollected: number;
  totalOpeningDueAll?: number;
  totalOpeningDueRemaining?: number;
}

// ─── DEFAULT CHART OF ACCOUNTS (STANDARD 5 CATEGORIES) ───────────────
export const DEFAULT_CHART_OF_ACCOUNTS: AccountHead[] = [
  // 1. Assets (1000 - 1999)
  { code: '1010', name: 'Cash in Hand', nameBn: 'হাতে নগদ (ক্যাশ ইন হ্যান্ড)', category: 'Asset', subCategory: 'Current Asset', openingBalance: 85400, isSystem: true, description: 'বিদ্যালয় প্রধান হিসাবরক্ষণ ক্যাশ ড্রয়ার' },
  { code: '1020', name: 'Sonali Bank PLC (A/C 1042)', nameBn: 'সোনালী ব্যাংক পিএলসি', category: 'Asset', subCategory: 'Bank Accounts', openingBalance: 580000, isSystem: true, description: 'সাধারণ চলতি হিসাব নং ১০৪২০০৩৮১৯২০১' },
  { code: '1030', name: 'Islami Bank Bangladesh PLC (A/C 2050)', nameBn: 'ইসলামী ব্যাংক বাংলাদেশ পিএলসি', category: 'Asset', subCategory: 'Bank Accounts', openingBalance: 320000, isSystem: true, description: 'উন্নয়ন তহবিল হিসাব নং ২০৫০২১০০৩৪৮৯১' },
  { code: '1040', name: 'Dutch-Bangla Bank PLC (A/C 1151)', nameBn: 'ডাচ-বাংলা ব্যাংক পিএলসি', category: 'Asset', subCategory: 'Bank Accounts', openingBalance: 185000, isSystem: true, description: 'অনলাইন ফি কালেকশন হিসাব নং ১১৫১২০০৪৯২১০০' },
  { code: '1050', name: 'bKash Merchant Account', nameBn: 'বিকাশ মার্চেন্ট ওয়ালেট', category: 'Asset', subCategory: 'Mobile Banking', openingBalance: 45000, isSystem: true, description: 'ডিজিটাল ফি আদায় গেটওয়ে' },
  { code: '1060', name: 'Nagad Merchant Account', nameBn: 'নগদ মার্চেন্ট ওয়ালেট', category: 'Asset', subCategory: 'Mobile Banking', openingBalance: 28000, isSystem: true, description: 'ডিজিটাল ফি আদায় গেটওয়ে' },
  { code: '1070', name: 'Accounts Receivable (Student Fees Due)', nameBn: 'শিক্ষার্থীদের নিকট বকেয়া ফি', category: 'Asset', subCategory: 'Receivables', openingBalance: 0, isSystem: true, description: 'চলতি শিক্ষাবর্ষের প্রাপ্য বেতন ও বকেয়া' },
  { code: '1100', name: 'Furniture, Fixture & Smart Boards', nameBn: 'আসবাবপত্র ও ডিজিটাল বোর্ড', category: 'Asset', subCategory: 'Fixed Asset', openingBalance: 1250000, isSystem: false, description: 'শ্রেণিকক্ষের বেঞ্চ, টেবিল, মাল্টিমিডিয়া প্রজেক্টর' },
  { code: '1110', name: 'School Building & Infrastructure', nameBn: 'বিদ্যালয় ভবন ও স্থায়ী অবকাঠামো', category: 'Asset', subCategory: 'Fixed Asset', openingBalance: 4500000, isSystem: false, description: 'একাডেমিক ও প্রশাসনিক ভবন' },

  // 2. Liabilities (2000 - 2999)
  { code: '2010', name: 'Salary Payable (Teachers & Staff)', nameBn: 'শিক্ষক-কর্মচারী বকেয়া বেতন দায়', category: 'Liability', subCategory: 'Current Liability', openingBalance: 0, isSystem: true, description: 'মাসের শেষে অপরিশোধিত বেতন' },
  { code: '2020', name: 'Teachers Provident Fund (PF)', nameBn: 'শিক্ষক ভবিষ্যৎ তহবিল (প্রভিডেন্ট ফান্ড)', category: 'Liability', subCategory: 'Long-term Liability', openingBalance: 340000, isSystem: true, description: 'মাসিক বেতন থেকে কর্তনকৃত কল্যাণ তহবিল' },
  { code: '2030', name: 'Student Advance Fee Deposits', nameBn: 'শিক্ষার্থীদের অগ্রিম ফি জমা', category: 'Liability', subCategory: 'Current Liability', openingBalance: 0, isSystem: false, description: 'ভবিষ্যত মাসের জন্য অগ্রিম প্রদত্ত বেতন' },
  { code: '2040', name: 'Security Deposit (Canteen/Vendors)', nameBn: 'ঠিকাদার/ক্যান্টিন জামানত', category: 'Liability', subCategory: 'Current Liability', openingBalance: 50000, isSystem: false, description: 'ক্যান্টিন ও পরিবহন জামানত তহবিল' },

  // 3. Equity & Reserve Funds (3000 - 3999)
  { code: '3010', name: 'General Reserve Fund', nameBn: 'সাধারণ সংরক্ষিত তহবিল (মূলধন)', category: 'Equity', subCategory: 'Capital Fund', openingBalance: 5800000, isSystem: true, description: 'বিদ্যালয়ের প্রাথমিক সংরক্ষিত তহবিল' },
  { code: '3020', name: 'School Infrastructure Development Fund', nameBn: 'বিদ্যালয় উন্নয়ন তহবিল', category: 'Equity', subCategory: 'Restricted Fund', openingBalance: 650000, isSystem: true, description: 'নতুন ভবন ও ল্যাব সম্প্রসারণ তহবিল' },
  { code: '3030', name: 'Retained Surplus / Deficit', nameBn: 'পুঞ্জীভূত উদ্বৃত্ত / সংরক্ষিত আয়', category: 'Equity', subCategory: 'Retained Earnings', openingBalance: 583400, isSystem: true, description: 'পূর্ববর্তী বছরগুলোর নিট উদ্বৃত্ত তহবিল' },

  // 4. Income / Revenue (4000 - 4999)
  { code: '4010', name: 'Monthly Tuition Fee Revenue', nameBn: 'শিক্ষার্থীদের মাসিক বেতন আয়', category: 'Income', subCategory: 'Academic Revenue', openingBalance: 0, isSystem: true, description: '৬ষ্ঠ-১০ম শ্রেণির মাসিক ফি' },
  { code: '4020', name: 'Examination Fee Revenue', nameBn: 'অর্ধবার্ষিক ও বার্ষিক পরীক্ষার ফি আয়', category: 'Income', subCategory: 'Academic Revenue', openingBalance: 0, isSystem: true, description: 'টার্ম ও মডেল টেস্ট পরীক্ষার ফি' },
  { code: '4030', name: 'Admission & Re-admission Fees', nameBn: 'ভর্তি ও পুনঃভর্তি ফি আয়', category: 'Income', subCategory: 'Academic Revenue', openingBalance: 0, isSystem: true, description: 'সেশনের শুরুতে এককালীন ভর্তি ফি' },
  { code: '4040', name: 'Board Registration & Form Fill-up', nameBn: 'বোর্ড রেজিস্ট্রেশন ও ফরম পূরণ ফি', category: 'Income', subCategory: 'Academic Revenue', openingBalance: 0, isSystem: true, description: 'জেএসসি/এসএসসি বোর্ড পরীক্ষার ফি' },
  { code: '4050', name: 'Farewell & Cultural Event Fees', nameBn: 'বিদায় অনুষ্ঠান ও সাংস্কৃতিক ফি আয়', category: 'Income', subCategory: 'Event Revenue', openingBalance: 0, isSystem: true, description: 'এসএসসি বিদায় সংবর্ধনা ফি' },
  { code: '4060', name: 'Session & Utility Charges', nameBn: 'সেশন চার্জ, আইডিকার্ড ও বিদ্যুৎ ফি', category: 'Income', subCategory: 'Student Services', openingBalance: 0, isSystem: false, description: 'আইডিকার্ড ও লাইব্রেরি সার্ভিস চার্জ' },
  { code: '4070', name: 'Government Subsidies & MPO Grants', nameBn: 'সরকারি অনুদান ও এমপিও সহায়তা', category: 'Income', subCategory: 'Government Grants', openingBalance: 0, isSystem: false, description: 'শিক্ষা মন্ত্রণালয় থেকে প্রাপ্ত অনুদান' },
  { code: '4080', name: 'Donations & Miscellaneous Income', nameBn: 'অনুদান, ব্যাংক মুনাফা ও বিবিধ আয়', category: 'Income', subCategory: 'Other Income', openingBalance: 0, isSystem: false, description: 'শুভাকাঙ্ক্ষীদের দান ও ব্যাংক সুদ' },

  // 5. Operating Expenses (5000 - 5999)
  { code: '5010', name: 'Teacher Salary Expense (Payroll)', nameBn: 'শিক্ষকদের মাসিক মূল বেতন ও ভাতা', category: 'Expense', subCategory: 'Staff Cost', openingBalance: 0, isSystem: true, description: 'প্রধান শিক্ষক ও সহকারী শিক্ষকদের মাসিক বেতন' },
  { code: '5020', name: 'Staff Wages & Overtime', nameBn: 'অফিস স্টাফ ও কর্মচারীদের বেতন', category: 'Expense', subCategory: 'Staff Cost', openingBalance: 0, isSystem: true, description: 'অফিস সহকারী, পিয়ন ও নৈশপ্রহরী বেতন' },
  { code: '5030', name: 'Electricity & Utility Bills', nameBn: 'বিদ্যুৎ বিল ও ইউটিলিটি চার্জ', category: 'Expense', subCategory: 'Administrative Expense', openingBalance: 0, isSystem: true, description: 'পল্লী বিদ্যুৎ ও পানি বিল' },
  { code: '5040', name: 'Stationery, Printing & Paper', nameBn: 'কাগজ, স্টেশনারি ও প্রশ্নপত্র প্রিন্টিং', category: 'Expense', subCategory: 'Academic Expense', openingBalance: 0, isSystem: true, description: 'পরীক্ষার খাতা, প্রশ্ন ও অফিসিয়াল প্যাড' },
  { code: '5050', name: 'Internet, Software & SMS Services', nameBn: 'ইন্টারনেট, সফটওয়্যার ও এসএমএস বিল', category: 'Expense', subCategory: 'Administrative Expense', openingBalance: 0, isSystem: true, description: 'ব্রডব্যান্ড ইন্টারনেট ও স্কুল সফটওয়্যার' },
  { code: '5060', name: 'Repairs, Paint & Maintenance', nameBn: 'মেরামত, চুনকাম ও পরিষ্কার-পরিচ্ছন্নতা', category: 'Expense', subCategory: 'Maintenance Expense', openingBalance: 0, isSystem: true, description: 'ভবন, ফ্যান, লাইট ও বেঞ্চ মেরামত' },
  { code: '5070', name: 'Hospitality & Meeting Expenses', nameBn: 'আপ্যায়ন ও ম্যানেজিং কমিটি সভা ব্যয়', category: 'Expense', subCategory: 'Administrative Expense', openingBalance: 0, isSystem: true, description: 'অভিভাবক সমাবেশ ও শিক্ষক সভার নাস্তা' },
  { code: '5080', name: 'Sports, Scout & National Events', nameBn: 'খেলাধুলা, স্কাউট ও জাতীয় দিবস ব্যয়', category: 'Expense', subCategory: 'Activity Expense', openingBalance: 0, isSystem: false, description: '২১শে ফেব্রুয়ারি, ১৬ই ডিসেম্বর উদযাপন' },
  { code: '5090', name: 'Science Lab & Scientific Apparatus', nameBn: 'বিজ্ঞানাগার ও ল্যাব সামগ্রী ক্রয়', category: 'Expense', subCategory: 'Academic Expense', openingBalance: 0, isSystem: false, description: 'পদার্থ, রসায়ন ও জীববিজ্ঞানের রাসায়নিক' },
  { code: '5100', name: 'Scholarships, Waivers & Fee Discounts', nameBn: 'বৃত্তি, উপবৃত্তি ও ফি মওকুফ ব্যয়', category: 'Expense', subCategory: 'Student Welfare', openingBalance: 0, isSystem: true, description: 'মেধাবী ও দরিদ্র শিক্ষার্থীদের বিশেষ ছাড়' },
  { code: '5110', name: 'Fee Refunds & Adjustment Expense', nameBn: 'ফি রিফান্ড ও সমন্বয় হিসাব', category: 'Expense', subCategory: 'Adjustment', openingBalance: 0, isSystem: true, description: 'অতিরিক্ত আদায়কৃত ফি ফেরত' }
];

export const DEFAULT_FEE_SECTORS: FeeSector[] = [
  { id: 'tuition', name: 'মাসিক বেতন', defAmount: 500, description: 'প্রতি মাসের নিয়মিত শ্রেণি বেতন', accountCode: '4010', frequency: 'monthly', applicableClasses: ['6th', '7th', '8th', '9th', '10th'], category: 'tuition', isActive: true },
  { id: 'exam', name: 'পরীক্ষা ফি', defAmount: 300, description: 'অর্ধবার্ষিক/বার্ষিক পরীক্ষার নির্ধারিত ফি', accountCode: '4020', frequency: 'per_exam', applicableClasses: ['6th', '7th', '8th', '9th', '10th'], category: 'exam', isActive: true },
  { id: 'registration', name: 'রেজিস্ট্রেশন ও ফরম পূরণ ফি', defAmount: 500, description: 'বোর্ড বা বার্ষিক পরীক্ষার অনলাইন রেজিস্ট্রেশন ও ফরম পূরণ ফি', accountCode: '4040', frequency: 'yearly', applicableClasses: ['8th', '9th', '10th'], category: 'board', isActive: true },
  { id: 'farewell', name: 'বিদায় অনুষ্ঠান ফি', defAmount: 250, description: 'এসএসসি ও বিদায় সংবর্ধনা বাবদ ফি', accountCode: '4050', frequency: 'one_time', applicableClasses: ['10th'], category: 'event', isActive: true },
  { id: 'tc', name: 'ছাড়পত্র (TC) ফি', defAmount: 200, description: 'বিদ্যালয় ত্যাগ ও ট্রান্সফার সার্টিফিকেট ফি', accountCode: '4060', frequency: 'on_demand', applicableClasses: ['6th', '7th', '8th', '9th', '10th'], category: 'service', isActive: true },
  { id: 'testimonial', name: 'প্রশংসাপত্র ও প্রত্যয়ন ফি', defAmount: 150, description: 'একাডেমিক প্রশংসাপত্র ও চারিত্রিক সনদ ফি', accountCode: '4060', frequency: 'on_demand', applicableClasses: ['6th', '7th', '8th', '9th', '10th'], category: 'service', isActive: true },
  { id: 'admission', name: 'ভর্তি ফি / পুন:ভর্তি ফি', defAmount: 2000, description: 'সেশন শুরুতে এককালীন ভর্তি ফি', accountCode: '4030', frequency: 'one_time', applicableClasses: ['6th', '7th', '8th', '9th', '10th'], category: 'admission', isActive: true },
  { id: 'idcard', name: 'আইডিকার্ড ফি', defAmount: 100, description: 'ডিজিটাল স্টুডেন্ট আইডি কার্ড', accountCode: '4060', frequency: 'yearly', applicableClasses: ['6th', '7th', '8th', '9th', '10th'], category: 'facility', isActive: true },
  { id: 'library', name: 'লাইব্রেরী ফি', defAmount: 100, description: 'গ্রন্থাগার ও পাঠাগার সেবা', accountCode: '4060', frequency: 'yearly', applicableClasses: ['6th', '7th', '8th', '9th', '10th'], category: 'facility', isActive: true },
  { id: 'electricity', name: 'বিদ্যুৎ ও ফ্যান ফি', defAmount: 50, description: 'বিদ্যুৎ ও জেনারেটর ব্যবস্থাপনা', accountCode: '4060', frequency: 'monthly', applicableClasses: ['6th', '7th', '8th', '9th', '10th'], category: 'facility', isActive: true },
  { id: 'sports', name: 'ক্রীড়া, স্কাউট ও রেডক্রিসেন্ট ফি', defAmount: 150, description: 'বার্ষিক ক্রীড়া ও স্কাউট কল্যাণ ফি', accountCode: '4060', frequency: 'yearly', applicableClasses: ['6th', '7th', '8th', '9th', '10th'], category: 'facility', isActive: true },
  { id: 'software', name: 'স্মার্ট সফটওয়্যার ফি', defAmount: 100, description: 'ডিজিটাল স্কুল ম্যানেজমেন্ট সেবা', accountCode: '4060', frequency: 'yearly', applicableClasses: ['6th', '7th', '8th', '9th', '10th'], category: 'facility', isActive: true }
];

export const EXPENSE_CATEGORIES = [
  'বিদ্যুৎ ও ইউটিলিটি বিল',
  'ইন্টারনেট ও সফটওয়্যার সেবা',
  'স্টেশনারি, কাগজ ও প্রিন্টিং',
  'মেরামত, চুনকাম ও সংস্কার',
  'আপ্যায়ন ও সভা-সেমিনার',
  'খেলাধুলা ও স্কাউট কার্যক্রম',
  'পরীক্ষার প্রশ্নপত্র মুদ্রণ ও উত্তরপত্র',
  'ল্যাব সামগ্রী ও বৈজ্ঞানিক যন্ত্রপাতি',
  'জাতীয় দিবস ও অনুষ্ঠান উদযাপন',
  'বিবিধ ও অন্যান্য ব্যয়'
];

export const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-1',
    accountCode: '1020',
    bankName: 'সোনালী ব্যাংক পিএলসি (Sonali Bank)',
    accountName: 'বরইতলী উচ্চ বিদ্যালয় সাধারণ তহবিল',
    accountNumber: '1042003819201',
    branch: 'চকরিয়া শাখা, কক্সবাজার',
    balance: 580000
  },
  {
    id: 'bank-2',
    accountCode: '1030',
    bankName: 'ইসলামী ব্যাংক বাংলাদেশ পিএলসি (IBBL)',
    accountName: 'বরইতলী উচ্চ বিদ্যালয় উন্নয়ন তহবিল',
    accountNumber: '2050210034891',
    branch: 'চকরিয়া শাখা',
    balance: 320000
  },
  {
    id: 'bank-3',
    accountCode: '1040',
    bankName: 'ডাচ-বাংলা ব্যাংক পিএলসি (DBBL)',
    accountName: 'বরইতলী উচ্চ বিদ্যালয় অনলাইন ফি কালেকশন',
    accountNumber: '1151200492100',
    branch: 'চকরিয়া শাখা',
    balance: 185000
  }
];

// ─── 🏷️ GRADE KEY NORMALIZER ──────────────────────────────────────────
export const normalizeGradeKey = (gradeInput?: string): string => {
  if (!gradeInput) return '6th';
  const g = gradeInput.toString().toLowerCase().trim();
  if (g.includes('10') || g.includes('১০') || g.includes('ten') || g.includes('দশম') || g.includes('ssc')) return '10th';
  if (g.includes('9') || g.includes('৯') || g.includes('nine') || g.includes('নবম')) return '9th';
  if (g.includes('8') || g.includes('৮') || g.includes('eight') || g.includes('অষ্টম') || g.includes('jsc')) return '8th';
  if (g.includes('7') || g.includes('৭') || g.includes('seven') || g.includes('সপ্তম')) return '7th';
  if (g.includes('6') || g.includes('৬') || g.includes('six') || g.includes('ষষ্ঠ') || g.includes('৬ষ্ঠ')) return '6th';
  return '6th';
};

export const GRADES_LIST = [
  { id: '6th', name: '৬ষ্ঠ শ্রেণি' },
  { id: '7th', name: '৭ম শ্রেণি' },
  { id: '8th', name: '৮ম শ্রেণি' },
  { id: '9th', name: '৯ম শ্রেণি' },
  { id: '10th', name: '১০ম শ্রেণি' }
];

export const DEFAULT_CLASS_FEES_CONFIG: { [grade: string]: { [secId: string]: number } } = {
  '6th': { tuition: 400, exam: 300, registration: 350, farewell: 150, admission: 1500, idcard: 100, library: 100, electricity: 50, software: 100 },
  '7th': { tuition: 450, exam: 350, registration: 400, farewell: 200, admission: 1600, idcard: 100, library: 100, electricity: 50, software: 100 },
  '8th': { tuition: 500, exam: 400, registration: 500, farewell: 250, admission: 1800, idcard: 100, library: 100, electricity: 50, software: 100 },
  '9th': { tuition: 550, exam: 500, registration: 600, farewell: 300, admission: 2000, idcard: 100, library: 100, electricity: 50, software: 100 },
  '10th': { tuition: 600, exam: 600, registration: 1200, farewell: 500, admission: 2200, idcard: 100, library: 100, electricity: 50, software: 100 }
};

// STORAGE KEYS
const STORAGE_KEY = 'sms_class_fees_config';
const FEE_SECTORS_STORAGE_KEY = 'sms_fee_sectors';
const PAYROLL_STORAGE_KEY = 'sms_payroll_records';
const EXPENSES_STORAGE_KEY = 'sms_expenses';
const BANK_STORAGE_KEY = 'sms_bank_accounts';
const WAIVERS_STORAGE_KEY = 'sms_student_waivers';
const REFUNDS_STORAGE_KEY = 'sms_fee_refunds';
const COA_STORAGE_KEY = 'sms_chart_of_accounts';
const VOUCHER_STORAGE_KEY = 'sms_vouchers_ledger';
const STUDENT_LEDGER_STORAGE_KEY = 'sms_student_fee_ledgers';
const PAYMENT_HISTORY_STORAGE_KEY = 'sms_payment_history';
const FINANCE_SETTINGS_KEY = 'sms_finance_settings';
const INVOICES_STORAGE_KEY = 'sms_fee_invoices';

const getInitialConfig = (): { [grade: string]: { [secId: string]: number } } => {
  if (typeof window === 'undefined') return DEFAULT_CLASS_FEES_CONFIG;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CLASS_FEES_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {}
  return DEFAULT_CLASS_FEES_CONFIG;
};

let currentConfig = getInitialConfig();
const listeners: ((cfg: { [grade: string]: { [secId: string]: number } }) => void)[] = [];

// Helper to determine asset account code from payment method
export const getPaymentAssetCode = (method: string): { code: string; name: string } => {
  switch (method) {
    case 'bKash': return { code: '1050', name: 'bKash Merchant Account (বিকাশ)' };
    case 'Nagad': return { code: '1060', name: 'Nagad Merchant Account (নগদ)' };
    case 'Bank Transfer':
    case 'Bank Check':
    case 'SSLCommerz': return { code: '1020', name: 'Sonali Bank PLC (সোনালী ব্যাংক)' };
    case 'Cash':
    default: return { code: '1010', name: 'Cash in Hand (হাতে নগদ)' };
  }
};

// Helper to get expense account code from category name
export const getExpenseAccountCode = (category: string): { code: string; name: string } => {
  if (category.includes('বিদ্যুৎ')) return { code: '5030', name: 'Electricity & Utility Bills' };
  if (category.includes('ইন্টারনেট') || category.includes('সফটওয়্যার')) return { code: '5050', name: 'Internet & Software Services' };
  if (category.includes('কাগজ') || category.includes('স্টেশনারি')) return { code: '5040', name: 'Stationery, Printing & Paper' };
  if (category.includes('মেরামত') || category.includes('সংস্কার')) return { code: '5060', name: 'Repairs & Maintenance' };
  if (category.includes('আপ্যায়ন') || category.includes('সভা')) return { code: '5070', name: 'Hospitality & Meeting Expenses' };
  if (category.includes('খেলাধুলা') || category.includes('স্কাউট')) return { code: '5080', name: 'Sports & Event Expenses' };
  if (category.includes('ল্যাব')) return { code: '5090', name: 'Science Lab Equipment' };
  return { code: '5070', name: 'General & Miscellaneous Operating Expense' };
};

// ═════════════════════════════════════════════════════════════════════
// 🌟 FINANCE SERVICE (CENTRALIZED CONTROLLER & ACCOUNTING ENGINE)
// ═════════════════════════════════════════════════════════════════════
export const financeService = {
  // ─── 🏷️ DYNAMIC FEE SECTORS MANAGEMENT ───────────────────────────
  getFeeSectors: (): FeeSector[] => {
    if (typeof window === 'undefined') return DEFAULT_FEE_SECTORS;
    try {
      const stored = localStorage.getItem(FEE_SECTORS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    localStorage.setItem(FEE_SECTORS_STORAGE_KEY, JSON.stringify(DEFAULT_FEE_SECTORS));
    return DEFAULT_FEE_SECTORS;
  },

  saveFeeSectors: (sectors: FeeSector[]): FeeSector[] => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FEE_SECTORS_STORAGE_KEY, JSON.stringify(sectors));
      } catch (e) {}
    }
    listeners.forEach(fn => fn(currentConfig));
    return sectors;
  },

  addFeeSector: (sector: FeeSector): FeeSector[] => {
    const sectors = financeService.getFeeSectors();
    const existingIndex = sectors.findIndex(s => s.id === sector.id);
    if (existingIndex > -1) {
      sectors[existingIndex] = sector;
    } else {
      sectors.push(sector);
    }
    return financeService.saveFeeSectors(sectors);
  },

  deleteFeeSector: (sectorId: string): FeeSector[] => {
    let sectors = financeService.getFeeSectors();
    sectors = sectors.filter(s => s.id !== sectorId);
    return financeService.saveFeeSectors(sectors);
  },

  // Apply a specific fee sector rate to all classes simultaneously
  applyFeeRateToAllClasses: (sectorId: string, amount: number): { [grade: string]: { [secId: string]: number } } => {
    const config = financeService.getClassFeesConfig();
    const updated = { ...config };
    GRADES_LIST.forEach(g => {
      if (!updated[g.id]) updated[g.id] = {};
      updated[g.id][sectorId] = amount;
    });
    financeService.saveClassFeesConfig(updated);
    return updated;
  },

  // Set fee rate for a specific class
  setSingleClassFeeRate: (gradeId: string, sectorId: string, amount: number): { [grade: string]: { [secId: string]: number } } => {
    const config = financeService.getClassFeesConfig();
    const updated = {
      ...config,
      [gradeId]: {
        ...(config[gradeId] || {}),
        [sectorId]: amount
      }
    };
    financeService.saveClassFeesConfig(updated);
    return updated;
  },

  // Remove a fee rate from a specific class
  removeClassFeeFromGrade: (gradeId: string, sectorId: string): { [grade: string]: { [secId: string]: number } } => {
    const config = financeService.getClassFeesConfig();
    const updated = { ...config };
    if (updated[gradeId] && updated[gradeId][sectorId] !== undefined) {
      delete updated[gradeId][sectorId];
      financeService.saveClassFeesConfig(updated);
    }
    return updated;
  },

  // Add a brand new fee sector with class-specific rates
  addClassFeeHead: (params: {
    name: string;
    id?: string;
    defAmount: number;
    description?: string;
    accountCode?: string;
    frequency?: 'monthly' | 'yearly' | 'one_time' | 'per_exam' | 'on_demand';
    applicableClasses?: string[];
    category?: 'tuition' | 'admission' | 'exam' | 'facility' | 'board' | 'event' | 'service' | 'other';
    classRates?: { [grade: string]: number };
  }): { sector: FeeSector; sectors: FeeSector[]; classFees: { [grade: string]: { [secId: string]: number } } } => {
    const generatedId = params.id && params.id.trim()
      ? params.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : 'fee_' + Date.now().toString().slice(-6);

    const newSector: FeeSector = {
      id: generatedId,
      name: params.name.trim(),
      defAmount: params.defAmount,
      description: params.description?.trim() || `${params.name.trim()} বাবদ ফি`,
      accountCode: params.accountCode || '4060',
      frequency: params.frequency || 'yearly',
      applicableClasses: params.applicableClasses && params.applicableClasses.length > 0
        ? params.applicableClasses
        : GRADES_LIST.map(g => g.id),
      category: params.category || 'facility',
      isActive: true
    };

    const updatedSectors = financeService.addFeeSector(newSector);

    // Update class fees config
    const currentFees = financeService.getClassFeesConfig();
    const updatedClassFees = { ...currentFees };

    GRADES_LIST.forEach(g => {
      if (!updatedClassFees[g.id]) updatedClassFees[g.id] = {};
      const isApplicable = !newSector.applicableClasses || newSector.applicableClasses.includes(g.id);
      if (isApplicable) {
        const rate = (params.classRates && params.classRates[g.id] !== undefined)
          ? params.classRates[g.id]
          : params.defAmount;
        updatedClassFees[g.id][generatedId] = rate;
      }
    });

    financeService.saveClassFeesConfig(updatedClassFees);

    auditTrailService.addLog({
      action: 'ADD_FEE_SECTOR',
      category: 'Finance',
      details: `নতুন ফি খাত '${newSector.name}' যোগ করা হয়েছে (ডিফল্ট: ৳${newSector.defAmount})`,
      performedBy: 'অ্যাকাউন্টস অ্যাডমিন',
      status: 'Success'
    });

    return { sector: newSector, sectors: updatedSectors, classFees: updatedClassFees };
  },

  // Reset all class fee structures to system defaults
  resetClassFeesToDefault: (): { [grade: string]: { [secId: string]: number } } => {
    financeService.saveClassFeesConfig(DEFAULT_CLASS_FEES_CONFIG);
    return DEFAULT_CLASS_FEES_CONFIG;
  },

  // ─── 🔄 REAL-TIME SYNC: CLASS FEES TO STUDENT LEDGERS ────────────
  syncStudentLedgersWithClassFees: (customConfig?: { [grade: string]: { [secId: string]: number } }): Record<string, StudentFeeLedger> => {
    if (typeof window === 'undefined') return {};
    const config = customConfig || financeService.getClassFeesConfig();
    const feeSectors = financeService.getFeeSectors();
    let allLedgers: Record<string, StudentFeeLedger> = {};
    try {
      const stored = localStorage.getItem(STUDENT_LEDGER_STORAGE_KEY);
      if (stored) allLedgers = JSON.parse(stored);
    } catch (e) {}

    // Get current students list to sync stipend & grade status
    let allStudentsList: any[] = [];
    try {
      const storedStudents = localStorage.getItem('sms_students');
      if (storedStudents) allStudentsList = JSON.parse(storedStudents);
    } catch (e) {}

    // CRITICAL: If no students exist (e.g. demo data was cleared or all students removed)
    if (allStudentsList.length === 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STUDENT_LEDGER_STORAGE_KEY, JSON.stringify({}));
      }
      return {};
    }

    // Prune orphan ledgers of deleted / non-existent students
    const activeStudentIds = new Set(allStudentsList.map(s => s.id));
    let hasPruned = false;
    Object.keys(allLedgers).forEach(id => {
      if (!activeStudentIds.has(id)) {
        delete allLedgers[id];
        hasPruned = true;
      }
    });
    if (hasPruned && typeof window !== 'undefined') {
      localStorage.setItem(STUDENT_LEDGER_STORAGE_KEY, JSON.stringify(allLedgers));
    }

    const studentsMap = new Map<string, any>();
    allStudentsList.forEach(s => studentsMap.set(s.id, s));

    Object.keys(allLedgers).forEach(studentId => {
      const ledger = allLedgers[studentId];
      if (!ledger) return;

      const studentData = studentsMap.get(studentId);
      const isStipend = studentData ? Boolean(studentData.isStipend || studentData.stipendCategory || studentData.stipendStatus === 'Active') : Boolean(ledger.isStipend);
      const stipendStartMonth = studentData?.stipendStartMonth || (ledger as any).stipendStartMonth || 'জানুয়ারি';
      const stipendStartIdx = BANGLA_MONTHS.indexOf(stipendStartMonth);
      const effectiveStipendIdx = stipendStartIdx >= 0 ? stipendStartIdx : 0;

      ledger.isStipend = isStipend;
      (ledger as any).stipendStartMonth = stipendStartMonth;

      const gradeKey = normalizeGradeKey(studentData?.grade || ledger.grade);
      ledger.grade = gradeKey;
      const gradeFees = config[gradeKey] || DEFAULT_CLASS_FEES_CONFIG[gradeKey] || {};
      const standardTuitionRate = gradeFees.tuition !== undefined ? gradeFees.tuition : (DEFAULT_CLASS_FEES_CONFIG[gradeKey]?.tuition || 400);

      // 1. Sync Months (Pre-stipend months have tuition; post-stipend months are waived 0)
      if (ledger.months && Array.isArray(ledger.months)) {
        ledger.months.forEach((m, idx) => {
          const isMonthWaivedByStipend = isStipend && idx >= effectiveStipendIdx;

          if (isMonthWaivedByStipend) {
            m.tuitionAmount = 0;
            m.dueAmount = 0;
            m.status = 'waived';
          } else {
            // Month before stipend or regular student: regular tuition applies
            const monthTuition = standardTuitionRate;
            m.tuitionAmount = monthTuition;
            if (m.paidAmount === 0 && (m.discount || 0) === 0) {
              m.dueAmount = monthTuition;
              m.status = 'due';
            } else if (m.paidAmount > 0 || (m.discount || 0) > 0) {
              m.dueAmount = Math.max(0, monthTuition - m.paidAmount - (m.discount || 0));
              m.status = m.dueAmount === 0 ? 'paid' : 'partial';
            }
          }
        });
      }

      // 2. Sync Regular Academic Fees (Exam fee is baseline; on-demand fees like TC/Testimonial are 0 unless requested)
      if (!ledger.otherFees) ledger.otherFees = {};
      feeSectors.filter(s => s.id !== 'tuition').forEach(s => {
        // Check if sector applies to this grade
        if (s.applicableClasses && s.applicableClasses.length > 0 && !s.applicableClasses.includes(gradeKey)) {
          if (ledger.otherFees[s.id] && ledger.otherFees[s.id].paidAmount === 0) {
            delete ledger.otherFees[s.id];
          }
          return;
        }

        // On-demand fees (tc, testimonial, farewell, registration) default to 0 initial billed unless already paid or requested
        const isOnDemand = s.frequency === 'on_demand' || ['tc', 'testimonial', 'farewell', 'registration'].includes(s.id);
        const configuredAmount = gradeFees[s.id] !== undefined ? gradeFees[s.id] : s.defAmount;
        const initialAmount = isOnDemand ? 0 : configuredAmount;

        if (!ledger.otherFees[s.id]) {
          ledger.otherFees[s.id] = {
            id: s.id,
            name: s.name,
            totalAmount: initialAmount,
            paidAmount: 0,
            dueAmount: initialAmount,
            discount: 0,
            status: initialAmount > 0 ? 'due' : 'paid',
            paymentReceipts: []
          };
        } else {
          const item = ledger.otherFees[s.id];
          item.name = s.name;
          if (item.paidAmount === 0 && (item.discount || 0) === 0) {
            item.totalAmount = initialAmount;
            item.dueAmount = initialAmount;
            item.status = initialAmount > 0 ? 'due' : 'paid';
          } else if (item.paidAmount > 0) {
            item.totalAmount = Math.max(item.paidAmount, configuredAmount);
            item.dueAmount = Math.max(0, item.totalAmount - item.paidAmount - (item.discount || 0));
            item.status = item.dueAmount === 0 ? 'paid' : 'partial';
          }
        }
      });

      // 3. Recalculate Totals
      const totalMonthsBilled = (ledger.months || []).reduce((s, m) => s + m.tuitionAmount, 0);
      const totalOtherBilled = Object.values(ledger.otherFees || {}).reduce((s, o) => s + o.totalAmount, 0);
      const totalMonthsDue = (ledger.months || []).reduce((s, m) => s + m.dueAmount, 0);
      const totalOtherDue = Object.values(ledger.otherFees || {}).reduce((s, o) => s + o.dueAmount, 0);
      const totalMonthsPaid = (ledger.months || []).reduce((s, m) => s + m.paidAmount, 0);
      const totalOtherPaid = Object.values(ledger.otherFees || {}).reduce((s, o) => s + o.paidAmount, 0);

      const openDueBilled = Number(ledger.openingDue) || 0;
      const openDuePaid = Number(ledger.openingDuePaid) || 0;
      const openDueRemaining = Math.max(0, openDueBilled - openDuePaid);
      ledger.openingDue = openDueBilled;
      ledger.openingDuePaid = openDuePaid;
      ledger.openingDueRemaining = openDueRemaining;

      ledger.totalBilled = totalMonthsBilled + totalOtherBilled + openDueBilled;
      ledger.totalPaid = totalMonthsPaid + totalOtherPaid + openDuePaid;
      ledger.totalDue = totalMonthsDue + totalOtherDue + openDueRemaining;
    });

    try {
      localStorage.setItem(STUDENT_LEDGER_STORAGE_KEY, JSON.stringify(allLedgers));
    } catch (e) {}
    return allLedgers;
  },

  // ─── ⚙️ GO-LIVE & BILLING CONFIGURATION ───────────────────────────
  getFinanceSettings: (): FinanceSettings => {
    if (typeof window === 'undefined') return DEFAULT_FINANCE_SETTINGS;
    try {
      const stored = localStorage.getItem(FINANCE_SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_FINANCE_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {}
    return DEFAULT_FINANCE_SETTINGS;
  },

  saveFinanceSettings: (settings: FinanceSettings): FinanceSettings => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FINANCE_SETTINGS_KEY, JSON.stringify(settings));
      } catch (e) {}
    }
    auditTrailService.addLog({
      action: 'UPDATE_FINANCE_SETTINGS',
      category: 'Finance',
      details: `সফটওয়্যার শুরুর মাস ${settings.systemStartMonth} ${settings.systemStartYear}, ডিউ ডে ${settings.invoiceDueDay} তারিখ আপডেট করা হয়েছে`,
      performedBy: 'অ্যাকাউন্টস অ্যাডমিন',
      status: 'Success'
    });
    listeners.forEach(fn => fn(currentConfig));
    return settings;
  },

  // 1-Click Go-Live software start month applicator:
  applySoftwareStartMonth: (
    startMonth: string,
    startYear: number,
    preStartMode: 'settled' | 'waived' | 'due' = 'settled'
  ): { affectedCount: number; startMonth: string } => {
    const settings = financeService.getFinanceSettings();
    settings.systemStartMonth = startMonth;
    settings.systemStartYear = startYear;
    settings.preStartMonthsAction = preStartMode;
    financeService.saveFinanceSettings(settings);

    const startMonthIdx = BANGLA_MONTHS.indexOf(startMonth);
    const effectiveStartIdx = startMonthIdx >= 0 ? startMonthIdx : 0;

    let allLedgers: Record<string, StudentFeeLedger> = {};
    try {
      const stored = localStorage.getItem(STUDENT_LEDGER_STORAGE_KEY);
      if (stored) allLedgers = JSON.parse(stored);
    } catch (e) {}

    let affectedCount = 0;
    Object.keys(allLedgers).forEach(sId => {
      const ledger = allLedgers[sId];
      if (!ledger || !ledger.months) return;

      ledger.months.forEach((m, idx) => {
        if (idx < effectiveStartIdx) {
          // Pre-start month: mark as settled/paid so it doesn't cause false dues
          if (preStartMode === 'settled') {
            m.paidAmount = m.tuitionAmount;
            m.dueAmount = 0;
            m.status = 'paid';
          } else if (preStartMode === 'waived') {
            m.dueAmount = 0;
            m.status = 'waived';
          }
        } else {
          // Active month onwards: if untouched, ensure due status
          if (m.paidAmount === 0 && (m.discount || 0) === 0 && !ledger.isStipend) {
            m.dueAmount = m.tuitionAmount;
            m.status = 'due';
          }
        }
      });

      // Recalculate totals
      const totalMonthsBilled = ledger.months.reduce((s, m) => s + m.tuitionAmount, 0);
      const totalOtherBilled = Object.values(ledger.otherFees || {}).reduce((s, o) => s + o.totalAmount, 0);
      const totalMonthsDue = ledger.months.reduce((s, m) => s + m.dueAmount, 0);
      const totalOtherDue = Object.values(ledger.otherFees || {}).reduce((s, o) => s + o.dueAmount, 0);
      const totalMonthsPaid = ledger.months.reduce((s, m) => s + m.paidAmount, 0);
      const totalOtherPaid = Object.values(ledger.otherFees || {}).reduce((s, o) => s + o.paidAmount, 0);

      const openDueBilled = Number(ledger.openingDue) || 0;
      const openDuePaid = Number(ledger.openingDuePaid) || 0;
      const openDueRemaining = Math.max(0, openDueBilled - openDuePaid);
      ledger.openingDue = openDueBilled;
      ledger.openingDuePaid = openDuePaid;
      ledger.openingDueRemaining = openDueRemaining;

      ledger.totalBilled = totalMonthsBilled + totalOtherBilled + openDueBilled;
      ledger.totalPaid = totalMonthsPaid + totalOtherPaid + openDuePaid;
      ledger.totalDue = totalMonthsDue + totalOtherDue + openDueRemaining;

      affectedCount++;
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STUDENT_LEDGER_STORAGE_KEY, JSON.stringify(allLedgers));
      } catch (e) {}
    }

    auditTrailService.addLog({
      action: 'APPLY_GO_LIVE_MONTH',
      category: 'Finance',
      details: `সফটওয়্যার হিসাব শুরুর মাস ${startMonth} ${startYear} কার্যকর করা হয়েছে (${affectedCount} জন শিক্ষার্থীর লেজার হালনাগাদ)`,
      performedBy: 'অ্যাকাউন্টস অ্যাডমিন',
      status: 'Success'
    });

    listeners.forEach(fn => fn(currentConfig));
    return { affectedCount, startMonth };
  },

  // ─── 🚩 OPENING DUE / ARREARS MANAGEMENT ──────────────────────────
  setStudentOpeningDue: (
    studentId: string,
    amount: number,
    note: string = 'সফটওয়্যার শুরুর পূর্বের বকেয়া (Opening Arrears)',
    recordedBy: string = 'হিসাবরক্ষক'
  ): StudentFeeLedger => {
    let allLedgers = financeService.getAllStudentLedgers();
    let ledger = allLedgers[studentId];
    if (!ledger) {
      ledger = financeService.getStudentFeeLedger(studentId);
      allLedgers = financeService.getAllStudentLedgers();
    }

    const safeAmount = Math.max(0, Number(amount) || 0);
    ledger.openingDue = safeAmount;
    ledger.openingDuePaid = ledger.openingDuePaid || 0;
    ledger.openingDueRemaining = Math.max(0, safeAmount - ledger.openingDuePaid);
    ledger.openingDueNote = note;
    ledger.openingDueSetDate = new Date().toISOString().split('T')[0];

    // Recalculate totals
    const totalMonthsBilled = (ledger.months || []).reduce((s, m) => s + m.tuitionAmount, 0);
    const totalOtherBilled = Object.values(ledger.otherFees || {}).reduce((s, o) => s + o.totalAmount, 0);
    const totalMonthsDue = (ledger.months || []).reduce((s, m) => s + m.dueAmount, 0);
    const totalOtherDue = Object.values(ledger.otherFees || {}).reduce((s, o) => s + o.dueAmount, 0);
    const totalMonthsPaid = (ledger.months || []).reduce((s, m) => s + m.paidAmount, 0);
    const totalOtherPaid = Object.values(ledger.otherFees || {}).reduce((s, o) => s + o.paidAmount, 0);

    ledger.totalBilled = totalMonthsBilled + totalOtherBilled + ledger.openingDue;
    ledger.totalPaid = totalMonthsPaid + totalOtherPaid + ledger.openingDuePaid;
    ledger.totalDue = totalMonthsDue + totalOtherDue + ledger.openingDueRemaining;

    financeService.saveStudentFeeLedger(ledger);

    auditTrailService.addLog({
      action: 'SET_OPENING_DUE',
      category: 'Finance',
      details: `শিক্ষার্থী ID: ${studentId}, রোল: ${ledger.roll || '-'}, শ্রেণি: ${ledger.grade || '-'} এর প্রারম্ভিক বকেয়া ৳${safeAmount} নির্ধারণ করা হয়েছে (${note})`,
      performedBy: recordedBy,
      status: 'Success'
    });

    return ledger;
  },

  bulkSetOpeningDues: (
    records: { studentId: string; amount: number; note?: string }[],
    recordedBy: string = 'হিসাবরক্ষক'
  ): { updatedCount: number; totalArrears: number } => {
    let updatedCount = 0;
    let totalArrears = 0;

    records.forEach(r => {
      if (r.studentId && r.amount !== undefined) {
        financeService.setStudentOpeningDue(r.studentId, r.amount, r.note || 'সফটওয়্যার শুরুর প্রারম্ভিক বকেয়া', recordedBy);
        updatedCount++;
        totalArrears += Math.max(0, Number(r.amount) || 0);
      }
    });

    return { updatedCount, totalArrears };
  },

  // ─── 🧾 INVOICE ENGINE (AUTO INVOICING & PARTIAL PAYMENTS) ──────────
  getInvoices: (filters?: {
    studentId?: string;
    grade?: string;
    month?: string;
    year?: number;
    status?: string;
    search?: string;
  }): FeeInvoice[] => {
    if (typeof window === 'undefined') return [];
    let list: FeeInvoice[] = [];
    try {
      const stored = localStorage.getItem(INVOICES_STORAGE_KEY);
      if (stored) list = JSON.parse(stored);
    } catch (e) {}

    if (!filters) return list;

    return list.filter(inv => {
      if (filters.studentId && inv.studentId !== filters.studentId) return false;
      if (filters.grade && filters.grade !== 'all' && normalizeGradeKey(inv.grade) !== normalizeGradeKey(filters.grade)) return false;
      if (filters.month && filters.month !== 'all' && inv.month !== filters.month) return false;
      if (filters.year && inv.year !== filters.year) return false;
      if (filters.status && filters.status !== 'all' && inv.status !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = inv.invoiceNo.toLowerCase().includes(q) ||
          inv.studentName.toLowerCase().includes(q) ||
          String(inv.roll).includes(q) ||
          inv.studentId.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  },

  saveInvoices: (invoices: FeeInvoice[]): FeeInvoice[] => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
      } catch (e) {}
    }
    return invoices;
  },

  generateMonthlyInvoices: (
    month: string,
    year: number,
    gradeFilter: string = 'all'
  ): { generated: number; skipped: number; invoices: FeeInvoice[] } => {
    const allInvoices = financeService.getInvoices();
    const config = financeService.getClassFeesConfig();
    const settings = financeService.getFinanceSettings();
    const allStudents = studentService.getAllStudents();
    const waivers = financeService.getWaivers();

    const monthIdx = BANGLA_MONTHS.indexOf(month);
    const targetMonthIdx = monthIdx >= 0 ? monthIdx : 0;
    const dueDay = settings.invoiceDueDay || 15;
    const dueDate = `${year}-${String(targetMonthIdx + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
    const issueDate = new Date().toISOString().split('T')[0];

    const eligibleStudents = allStudents.filter(st => {
      if (gradeFilter === 'all') return true;
      return normalizeGradeKey(st.grade) === normalizeGradeKey(gradeFilter);
    });

    let generated = 0;
    let skipped = 0;
    const newInvoices: FeeInvoice[] = [];

    eligibleStudents.forEach((st, idx) => {
      const existing = allInvoices.find(
        inv => inv.studentId === st.id && inv.month === month && inv.year === year && inv.status !== 'cancelled'
      );
      if (existing) {
        skipped++;
        return;
      }

      const gradeKey = normalizeGradeKey(st.grade);
      const gradeFees = config[gradeKey] || DEFAULT_CLASS_FEES_CONFIG[gradeKey] || {};
      const baseTuition = gradeFees.tuition !== undefined ? gradeFees.tuition : (DEFAULT_CLASS_FEES_CONFIG[gradeKey]?.tuition || 400);

      const isStipend = Boolean(st.isStipend || st.stipendCategory || st.stipendStatus === 'Active');
      const studentWaiver = waivers.find(w => w.studentId === st.id);

      let tuitionDiscount = 0;
      let waiverReason = '';

      if (isStipend) {
        tuitionDiscount = baseTuition;
        waiverReason = 'উপবৃত্তি সুবিধা (১০০% টিউশন ফি মওকুফ)';
      } else if (studentWaiver) {
        if (studentWaiver.type === 'percent') {
          tuitionDiscount = Math.round((baseTuition * studentWaiver.value) / 100);
          waiverReason = `${studentWaiver.reason || 'বিশেষ ছাড়'} (${studentWaiver.value}%)`;
        } else {
          tuitionDiscount = Math.min(baseTuition, studentWaiver.value);
          waiverReason = `${studentWaiver.reason || 'বিশেষ ছাড়'} (৳${studentWaiver.value})`;
        }
      }

      const items: FeeInvoiceItem[] = [
        {
          sectorId: 'tuition',
          name: `মাসিক বেতন (${month})`,
          amount: baseTuition,
          discount: tuitionDiscount,
          netAmount: Math.max(0, baseTuition - tuitionDiscount)
        }
      ];

      const subtotal = items.reduce((s, i) => s + i.amount, 0);
      const totalDiscount = items.reduce((s, i) => s + i.discount, 0);
      const totalPayable = items.reduce((s, i) => s + i.netAmount, 0);

      const invNo = `INV-${String(year).slice(-2)}${String(targetMonthIdx + 1).padStart(2, '0')}-${String(st.roll || idx + 1).padStart(4, '0')}`;
      const newInv: FeeInvoice = {
        id: `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceNo: invNo,
        invoiceId: invNo,
        studentId: st.id,
        studentName: st.name,
        roll: String(st.roll),
        mobile: st.mobile || (st as any).phone || 'N/A',
        grade: st.grade,
        section: st.section || 'ক',
        month,
        year,
        issueDate,
        dueDate,
        items,
        subtotal,
        totalDiscount,
        waiverReason,
        totalPayable,
        netPayable: totalPayable,
        totalPaid: 0,
        paidAmount: 0,
        dueAmount: totalPayable,
        status: totalPayable === 0 ? 'paid' : 'unpaid',
        payments: [],
        createdAt: new Date().toISOString()
      };

      allInvoices.unshift(newInv);
      newInvoices.push(newInv);
      generated++;
    });

    financeService.saveInvoices(allInvoices);

    auditTrailService.addLog({
      action: 'GENERATE_MONTHLY_INVOICES',
      category: 'Finance',
      details: `${month} ${year} সেশনের জন্য ${generated} টি ফি ইনভয়েস সফলভাবে জেনারেট করা হয়েছে (স্কিপ: ${skipped})`,
      performedBy: 'হিসাবরক্ষক/অ্যাকাউন্টস',
      status: 'Success'
    });

    return { generated, skipped, invoices: allInvoices };
  },

  payInvoice: (
    invoiceId: string,
    payment: {
      amount: number;
      paymentMethod: string;
      trxId?: string;
      collectedBy: string;
      date?: string;
    }
  ): { invoice: FeeInvoice; receiptId: string } => {
    const allInvoices = financeService.getInvoices();
    const invoice = allInvoices.find(i => i.id === invoiceId);
    if (!invoice) throw new Error('ইনভয়েস পাওয়া যায়নি');

    const payAmount = Math.max(0, Number(payment.amount) || 0);
    if (payAmount <= 0) throw new Error('পেমেন্টের পরিমাণ ০ এর বেশি হতে হবে');

    const receiptId = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    invoice.totalPaid = (invoice.totalPaid || 0) + payAmount;
    invoice.dueAmount = Math.max(0, invoice.totalPayable - invoice.totalPaid);
    invoice.status = invoice.dueAmount === 0 ? 'paid' : 'partial';

    const paymentDate = payment.date || new Date().toISOString().split('T')[0];

    invoice.payments.push({
      receiptId,
      trxId: payment.trxId,
      amount: payAmount,
      paymentMethod: payment.paymentMethod,
      date: paymentDate,
      collectedBy: payment.collectedBy || 'ক্যাশিয়ার'
    });
    invoice.updatedAt = new Date().toISOString();

    financeService.saveInvoices(allInvoices);

    // Sync to StudentFeeLedger
    financeService.applyPaymentToStudentLedger({
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      roll: invoice.roll,
      grade: invoice.grade,
      section: invoice.section,
      mobile: '',
      selectedMonths: [invoice.month],
      selectedOtherFeeIds: [],
      paymentAmount: payAmount,
      discountAmount: 0,
      paymentMethod: (payment.paymentMethod as any) || 'Cash',
      trxId: payment.trxId,
      receiptId,
      collectedBy: payment.collectedBy,
      date: paymentDate
    });

    // Auto-post double entry voucher
    financeService.postFeeReceiptJournal({
      receiptId,
      studentName: invoice.studentName,
      roll: invoice.roll,
      grade: invoice.grade,
      paidAmount: payAmount,
      subtotal: payAmount,
      discount: 0,
      paymentMethod: payment.paymentMethod,
      feeItems: invoice.items.map(i => ({ name: i.name, amount: payAmount })),
      date: paymentDate,
      collectedBy: payment.collectedBy
    });

    auditTrailService.addLog({
      action: 'PAY_FEE_INVOICE',
      category: 'Finance',
      details: `ইনভয়েস ${invoice.invoiceNo} এ ৳${payAmount} জমা নেওয়া হয়েছে (${payment.paymentMethod}, রসিদ: ${receiptId})`,
      performedBy: payment.collectedBy,
      status: 'Success'
    });

    syncQueueService.enqueue('fee_collection', receiptId, 'CREATE', {
      receiptId,
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      roll: invoice.roll,
      grade: invoice.grade,
      amount: payAmount,
      paymentMethod: payment.paymentMethod,
      trxId: payment.trxId,
      collectedBy: payment.collectedBy,
      date: paymentDate
    }).catch(() => {});

    return { invoice, receiptId };
  },

  cancelInvoice: (invoiceId: string, reason: string = 'বাতিল করা হয়েছে'): boolean => {
    const allInvoices = financeService.getInvoices();
    const invoice = allInvoices.find(i => i.id === invoiceId);
    if (!invoice) return false;
    invoice.status = 'cancelled';
    invoice.notes = reason;
    invoice.updatedAt = new Date().toISOString();
    financeService.saveInvoices(allInvoices);

    auditTrailService.addLog({
      action: 'CANCEL_INVOICE',
      category: 'Finance',
      details: `ইনভয়েস ${invoice.invoiceNo} বাতিল করা হয়েছে। কারণ: ${reason}`,
      performedBy: 'অ্যাকাউন্টস অ্যাডমিন',
      status: 'Success'
    });
    return true;
  },

  // ─── CLASS FEES CONFIG ──────────────────────────────────────────────
  getClassFeesConfig: () => {
    if (typeof window !== 'undefined') currentConfig = getInitialConfig();
    return currentConfig;
  },

  saveClassFeesConfig: (newConfig: { [grade: string]: { [secId: string]: number } }) => {
    currentConfig = { ...newConfig };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
      } catch (e) {}
    }
    financeService.syncStudentLedgersWithClassFees(currentConfig);
    listeners.forEach(fn => fn(currentConfig));
  },

  getClassFeesByType: (feeType: string): ClassFeeItem[] => {
    const cfg = financeService.getClassFeesConfig();
    return GRADES_LIST.map(g => {
      const amt = (cfg[g.id] && cfg[g.id][feeType] !== undefined) 
        ? cfg[g.id][feeType] 
        : (DEFAULT_CLASS_FEES_CONFIG[g.id]?.[feeType] || 300);
      return { className: g.name, grade: g.id, amount: amt };
    });
  },

  formatFeeListForNotice: (feeType: string): string => {
    const items = financeService.getClassFeesByType(feeType);
    return items.map(item => `• ${item.className}: ${item.amount}/- টাকা`).join('\n');
  },

  // ─── 🗂️ CHART OF ACCOUNTS (COA) ────────────────────────────────────
  getChartOfAccounts: (): AccountHead[] => {
    if (typeof window === 'undefined') return DEFAULT_CHART_OF_ACCOUNTS;
    try {
      const stored = localStorage.getItem(COA_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    localStorage.setItem(COA_STORAGE_KEY, JSON.stringify(DEFAULT_CHART_OF_ACCOUNTS));
    return DEFAULT_CHART_OF_ACCOUNTS;
  },

  saveChartOfAccounts: (accounts: AccountHead[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(COA_STORAGE_KEY, JSON.stringify(accounts));
      } catch (e) {}
    }
    return accounts;
  },

  addOrUpdateAccount: (account: AccountHead) => {
    const coa = financeService.getChartOfAccounts();
    const idx = coa.findIndex(a => a.code === account.code);
    if (idx > -1) {
      coa[idx] = { ...coa[idx], ...account };
    } else {
      coa.push(account);
    }
    financeService.saveChartOfAccounts(coa);
    return coa;
  },

  deleteAccount: (code: string) => {
    let coa = financeService.getChartOfAccounts();
    const target = coa.find(a => a.code === code);
    if (target && target.isSystem) {
      throw new Error('সিস্টেমের কোর অ্যাকাউন্ট ডিলিট করা যাবে না!');
    }
    coa = coa.filter(a => a.code !== code);
    financeService.saveChartOfAccounts(coa);
    return coa;
  },

  // ─── 📑 VOUCHER & JOURNAL LEDGER (AUTOMATED DOUBLE-ENTRY) ─────────────
  getVouchers: (): VoucherRecord[] => {
    if (typeof window === 'undefined') return [];
    const isDemoCleared = localStorage.getItem('sms_demo_cleared') === 'true';
    try {
      const stored = localStorage.getItem(VOUCHER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const hasDemo = parsed.some(v => v && v.id && v.id.startsWith('VOUCH-100'));
          if (isDemoCleared || hasDemo) {
            const cleaned = isDemoCleared ? [] : parsed.filter(v => !v.id?.startsWith('VOUCH-100'));
            localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(cleaned));
            return cleaned;
          }
          return parsed;
        }
      }
    } catch (e) {}

    return [];
  },

  saveVouchers: (vouchers: VoucherRecord[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(vouchers));
      } catch (e) {}
    }
    return vouchers;
  },

  addVoucher: (voucher: VoucherRecord) => {
    const list = financeService.getVouchers();
    list.unshift(voucher);
    financeService.saveVouchers(list);
    return list;
  },

  deleteVoucher: (id: string) => {
    let list = financeService.getVouchers();
    list = list.filter(v => v.id !== id);
    financeService.saveVouchers(list);
    return list;
  },

  // ─── 🔄 AUTO-POSTING HOOKS FOR REAL-TIME DOUBLE ENTRY ──────────────
  
  // 1. Hook: Auto-post Fee Receipt to Ledger
  postFeeReceiptJournal: (payment: {
    receiptId: string;
    studentName: string;
    roll: string;
    grade: string;
    paidAmount: number;
    subtotal: number;
    discount: number;
    paymentMethod: string;
    feeItems: { name: string; amount: number }[];
    date: string;
    collectedBy: string;
  }) => {
    const asset = getPaymentAssetCode(payment.paymentMethod);
    const now = new Date();
    const vNo = `RV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const entries: JournalLine[] = [];

    // Debit Asset (Cash/Bank/bKash/Nagad)
    entries.push({
      accountCode: asset.code,
      accountName: asset.name,
      debit: payment.paidAmount,
      credit: 0,
      narration: `ফি আদায় (${payment.paymentMethod})`
    });

    // Debit Discount Expense (if special waiver applied)
    if (payment.discount > 0) {
      entries.push({
        accountCode: '5100',
        accountName: 'Scholarships & Fee Discounts (বৃত্তি ও মওকুফ)',
        debit: payment.discount,
        credit: 0,
        narration: 'বিশেষ মওকুফ / বৃত্তি ছাড়'
      });
    }

    // Credit Fee Revenues according to sectors
    payment.feeItems.forEach(item => {
      let code = '4010';
      let name = 'Monthly Tuition Fee Revenue';
      if (item.name.includes('পরীক্ষা')) { code = '4020'; name = 'Examination Fee Revenue'; }
      else if (item.name.includes('ভর্তি')) { code = '4030'; name = 'Admission Fee Revenue'; }
      else if (item.name.includes('রেজিস্ট্রেশন')) { code = '4040'; name = 'Board Registration Fee'; }
      else if (item.name.includes('বিদায়')) { code = '4050'; name = 'Farewell Event Fee'; }
      else if (item.name.includes('আইডিকার্ড') || item.name.includes('বিদ্যুত') || item.name.includes('সফটওয়্যার')) {
        code = '4060'; name = 'Session & Utility Charges';
      }

      entries.push({
        accountCode: code,
        accountName: name,
        debit: 0,
        credit: item.amount,
        narration: item.name
      });
    });

    const voucher: VoucherRecord = {
      id: `VOUCH-${Date.now()}`,
      voucherNo: vNo,
      voucherType: 'Receipt',
      date: now.toISOString().split('T')[0],
      reference: `শিক্ষার্থী: ${payment.studentName} (রোল: #${payment.roll}, শ্রেণি: ${payment.grade}) | রসিদ: ${payment.receiptId}`,
      narration: `শিক্ষার্থী ফি আদায় — ${payment.feeItems.map(f => f.name).join(', ')}`,
      sourceModule: 'student_fees',
      sourceId: payment.receiptId,
      totalAmount: payment.subtotal,
      createdBy: payment.collectedBy || 'ক্যাশিয়ার',
      entries
    };

    financeService.addVoucher(voucher);
    return voucher;
  },

  // 2. Hook: Auto-post Payroll Disbursement to Ledger
  postPayrollJournal: (payroll: PayrollRecord) => {
    const asset = getPaymentAssetCode(payroll.paymentMethod);
    const now = new Date();
    const grossSalary = payroll.baseSalary + payroll.allowances + payroll.bonus;

    const entries: JournalLine[] = [
      // Debit Salary Expense
      {
        accountCode: '5010',
        accountName: 'Teacher Salary Expense (Payroll)',
        debit: grossSalary,
        credit: 0,
        narration: `${payroll.teacherName} - ${payroll.month} ${payroll.year} বেতন`
      },
      // Credit Cash/Bank
      {
        accountCode: asset.code,
        accountName: asset.name,
        debit: 0,
        credit: payroll.netPayable,
        narration: `নিট বেতন প্রদান (${payroll.paymentMethod})`
      }
    ];

    // Credit PF Liability if any deduction
    if (payroll.deductions > 0) {
      entries.push({
        accountCode: '2020',
        accountName: 'Teachers Provident Fund (PF Liability)',
        debit: 0,
        credit: payroll.deductions,
        narration: 'ভবিষ্যত তহবিল কর্তন'
      });
    }

    const voucher: VoucherRecord = {
      id: `VOUCH-${Date.now()}`,
      voucherNo: payroll.voucherNo,
      voucherType: 'Payment',
      date: payroll.paymentDate,
      reference: `শিক্ষক/স্টাফ: ${payroll.teacherName} (${payroll.designation}) | ID: ${payroll.teacherId}`,
      narration: `${payroll.month} ${payroll.year} মাসের বেতন ও ভাতা প্রদান`,
      sourceModule: 'payroll',
      sourceId: payroll.id,
      totalAmount: grossSalary,
      createdBy: 'হিসাবরক্ষক',
      entries
    };

    financeService.addVoucher(voucher);
    return voucher;
  },

  // 3. Hook: Auto-post Expense Voucher to Ledger
  postExpenseJournal: (expense: ExpenseRecord) => {
    const asset = getPaymentAssetCode(expense.paymentMethod);
    const expAcc = getExpenseAccountCode(expense.category);

    const voucher: VoucherRecord = {
      id: `VOUCH-${Date.now()}`,
      voucherNo: expense.voucherNo,
      voucherType: 'Payment',
      date: expense.date,
      reference: `প্রাপক: ${expense.paidTo} | ক্যাটাগরি: ${expense.category}`,
      narration: expense.note || expense.category,
      sourceModule: 'expenses',
      sourceId: expense.id,
      totalAmount: expense.amount,
      createdBy: expense.recordedBy || 'হিসাবরক্ষক',
      entries: [
        { accountCode: expAcc.code, accountName: expAcc.name, debit: expense.amount, credit: 0, narration: expense.note },
        { accountCode: asset.code, accountName: asset.name, debit: 0, credit: expense.amount, narration: `পরিশোধ (${expense.paymentMethod})` }
      ]
    };

    financeService.addVoucher(voucher);
    return voucher;
  },

  // 4. Hook: Auto-post Contra Voucher (Bank Deposit / Fund Transfer)
  postContraJournal: (transfer: { from: string; to: string; amount: number; date: string; refNo: string; note: string }) => {
    const isFromCash = transfer.from.includes('Cash') || transfer.from.includes('হাতে নগদ');
    const sourceCode = isFromCash ? '1010' : '1020';
    const sourceName = isFromCash ? 'Cash in Hand (হাতে নগদ)' : 'Source Bank Account';

    let targetCode = '1020';
    let targetName = 'Sonali Bank PLC (সোনালী ব্যাংক)';
    if (transfer.to === 'bank-2') { targetCode = '1030'; targetName = 'Islami Bank Bangladesh PLC (IBBL)'; }
    else if (transfer.to === 'bank-3') { targetCode = '1040'; targetName = 'Dutch-Bangla Bank PLC (DBBL)'; }

    const now = new Date();
    const vNo = `CV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`;

    const voucher: VoucherRecord = {
      id: `VOUCH-${Date.now()}`,
      voucherNo: vNo,
      voucherType: 'Contra',
      date: transfer.date || now.toISOString().split('T')[0],
      reference: `ফান্ড ট্রান্সফার: ${transfer.from} ➔ ${targetName} | Ref: ${transfer.refNo || 'N/A'}`,
      narration: transfer.note || 'অভ্যন্তরীণ তহবিল ডিপোজিট ও ট্রান্সফার',
      sourceModule: 'cash_bank',
      totalAmount: transfer.amount,
      createdBy: 'ক্যাশিয়ার',
      entries: [
        { accountCode: targetCode, accountName: targetName, debit: transfer.amount, credit: 0, narration: 'ব্যাংকে জমা' },
        { accountCode: sourceCode, accountName: sourceName, debit: 0, credit: transfer.amount, narration: 'ক্যাশ উত্তোলন / ট্রান্সফার' }
      ]
    };

    financeService.addVoucher(voucher);
    return voucher;
  },

  // ─── 📖 BOOKS OF ACCOUNTS COMPUTATION ENGINE ─────────────────────────

  // 1. Cash Book (ক্যাশবুক)
  getCashBook: (fromDate?: string, toDate?: string) => {
    const vouchers = financeService.getVouchers();
    const coa = financeService.getChartOfAccounts();
    const cashAccount = coa.find(a => a.code === '1010');
    const openingBalance = cashAccount ? cashAccount.openingBalance : 85400;

    let runningBalance = openingBalance;
    const records: {
      date: string;
      voucherNo: string;
      particulars: string;
      reference: string;
      receiptAmount: number;
      paymentAmount: number;
      balance: number;
    }[] = [];

    // Sort chronologically
    const sorted = [...vouchers].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(v => {
      if (fromDate && v.date < fromDate) return;
      if (toDate && v.date > toDate) return;

      const cashEntry = v.entries.find(e => e.accountCode === '1010');
      if (cashEntry) {
        const receipt = cashEntry.debit || 0;
        const payment = cashEntry.credit || 0;
        runningBalance = runningBalance + receipt - payment;

        records.push({
          date: v.date,
          voucherNo: v.voucherNo,
          particulars: v.narration || v.reference,
          reference: v.reference,
          receiptAmount: receipt,
          paymentAmount: payment,
          balance: runningBalance
        });
      }
    });

    const totalReceipts = records.reduce((sum, r) => sum + r.receiptAmount, 0);
    const totalPayments = records.reduce((sum, r) => sum + r.paymentAmount, 0);

    return {
      openingBalance,
      records,
      totalReceipts,
      totalPayments,
      closingBalance: runningBalance
    };
  },

  // 2. Bank Book (ব্যাংকবুক)
  getBankBook: (bankCode: string = '1020', fromDate?: string, toDate?: string) => {
    const vouchers = financeService.getVouchers();
    const coa = financeService.getChartOfAccounts();
    const bankAccount = coa.find(a => a.code === bankCode);
    const openingBalance = bankAccount ? bankAccount.openingBalance : 580000;

    let runningBalance = openingBalance;
    const records: {
      date: string;
      voucherNo: string;
      particulars: string;
      reference: string;
      depositAmount: number;
      withdrawAmount: number;
      balance: number;
    }[] = [];

    const sorted = [...vouchers].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(v => {
      if (fromDate && v.date < fromDate) return;
      if (toDate && v.date > toDate) return;

      const bankEntry = v.entries.find(e => e.accountCode === bankCode);
      if (bankEntry) {
        const deposit = bankEntry.debit || 0;
        const withdraw = bankEntry.credit || 0;
        runningBalance = runningBalance + deposit - withdraw;

        records.push({
          date: v.date,
          voucherNo: v.voucherNo,
          particulars: v.narration || v.reference,
          reference: v.reference,
          depositAmount: deposit,
          withdrawAmount: withdraw,
          balance: runningBalance
        });
      }
    });

    const totalDeposits = records.reduce((sum, r) => sum + r.depositAmount, 0);
    const totalWithdrawals = records.reduce((sum, r) => sum + r.withdrawAmount, 0);

    return {
      bankName: bankAccount ? bankAccount.nameBn : 'সোনালী ব্যাংক',
      openingBalance,
      records,
      totalDeposits,
      totalWithdrawals,
      closingBalance: runningBalance
    };
  },

  // 3. General Ledger Book (খতিয়ান / লেজারবুক) for Any Account
  getGeneralLedger: (accountCode: string, fromDate?: string, toDate?: string) => {
    const vouchers = financeService.getVouchers();
    const coa = financeService.getChartOfAccounts();
    const account = coa.find(a => a.code === accountCode);
    const isDebitNature = account ? (account.category === 'Asset' || account.category === 'Expense') : true;
    const openingBalance = account ? account.openingBalance : 0;

    let runningBalance = openingBalance;
    const records: {
      date: string;
      voucherNo: string;
      voucherType: string;
      particulars: string;
      reference: string;
      debit: number;
      credit: number;
      balance: number;
    }[] = [];

    const sorted = [...vouchers].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(v => {
      if (fromDate && v.date < fromDate) return;
      if (toDate && v.date > toDate) return;

      const matchedEntries = v.entries.filter(e => e.accountCode === accountCode);
      matchedEntries.forEach(entry => {
        const debit = entry.debit || 0;
        const credit = entry.credit || 0;

        if (isDebitNature) {
          runningBalance = runningBalance + debit - credit;
        } else {
          runningBalance = runningBalance + credit - debit;
        }

        records.push({
          date: v.date,
          voucherNo: v.voucherNo,
          voucherType: v.voucherType,
          particulars: entry.narration || v.narration || v.reference,
          reference: v.reference,
          debit,
          credit,
          balance: runningBalance
        });
      });
    });

    const totalDebit = records.reduce((sum, r) => sum + r.debit, 0);
    const totalCredit = records.reduce((sum, r) => sum + r.credit, 0);

    return {
      account: account || { code: accountCode, name: 'Account', nameBn: 'অ্যাকাউন্ট', category: 'Asset' as AccountCategory },
      openingBalance,
      records,
      totalDebit,
      totalCredit,
      closingBalance: runningBalance
    };
  },

  // ─── 📊 FINANCIAL STATEMENTS & REPORTS GENERATOR ─────────────────────

  // 1. Trial Balance (রেওয়ামিল)
  getTrialBalance: () => {
    const coa = financeService.getChartOfAccounts();
    const vouchers = financeService.getVouchers();

    const lines = coa.map(acc => {
      const isDebitNature = acc.category === 'Asset' || acc.category === 'Expense';
      let totalDebit = 0;
      let totalCredit = 0;

      vouchers.forEach(v => {
        v.entries.forEach(e => {
          if (e.accountCode === acc.code) {
            totalDebit += e.debit || 0;
            totalCredit += e.credit || 0;
          }
        });
      });

      let debitBalance = 0;
      let creditBalance = 0;

      if (isDebitNature) {
        const net = acc.openingBalance + totalDebit - totalCredit;
        if (net >= 0) debitBalance = net;
        else creditBalance = Math.abs(net);
      } else {
        const net = acc.openingBalance + totalCredit - totalDebit;
        if (net >= 0) creditBalance = net;
        else debitBalance = Math.abs(net);
      }

      return {
        code: acc.code,
        name: acc.name,
        nameBn: acc.nameBn,
        category: acc.category,
        debitBalance,
        creditBalance
      };
    }).filter(line => line.debitBalance > 0 || line.creditBalance > 0);

    const totalDebit = lines.reduce((sum, l) => sum + l.debitBalance, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.creditBalance, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return {
      lines,
      totalDebit,
      totalCredit,
      isBalanced
    };
  },

  // 2. Income Statement / Profit & Loss (আয়-ব্যয় বিবরণী)
  getIncomeStatement: (fromDate?: string, toDate?: string) => {
    const coa = financeService.getChartOfAccounts();
    const vouchers = financeService.getVouchers();

    const incomeAccounts = coa.filter(a => a.category === 'Income');
    const expenseAccounts = coa.filter(a => a.category === 'Expense');

    const incomeLines = incomeAccounts.map(acc => {
      let amount = acc.openingBalance;
      vouchers.forEach(v => {
        if (fromDate && v.date < fromDate) return;
        if (toDate && v.date > toDate) return;
        v.entries.forEach(e => {
          if (e.accountCode === acc.code) {
            amount += (e.credit - e.debit);
          }
        });
      });
      return { code: acc.code, name: acc.name, nameBn: acc.nameBn, amount: Math.max(0, amount) };
    }).filter(l => l.amount > 0);

    const expenseLines = expenseAccounts.map(acc => {
      let amount = acc.openingBalance;
      vouchers.forEach(v => {
        if (fromDate && v.date < fromDate) return;
        if (toDate && v.date > toDate) return;
        v.entries.forEach(e => {
          if (e.accountCode === acc.code) {
            amount += (e.debit - e.credit);
          }
        });
      });
      return { code: acc.code, name: acc.name, nameBn: acc.nameBn, amount: Math.max(0, amount) };
    }).filter(l => l.amount > 0);

    const totalIncome = incomeLines.reduce((sum, l) => sum + l.amount, 0);
    const totalExpense = expenseLines.reduce((sum, l) => sum + l.amount, 0);
    const netSurplus = totalIncome - totalExpense;

    return {
      incomeLines,
      expenseLines,
      totalIncome,
      totalExpense,
      netSurplus
    };
  },

  // 3. Balance Sheet (উদ্বৃত্তপত্র / আর্থিক অবস্থার বিবরণী)
  getBalanceSheet: () => {
    const coa = financeService.getChartOfAccounts();
    const vouchers = financeService.getVouchers();
    const { netSurplus } = financeService.getIncomeStatement();

    const assetAccounts = coa.filter(a => a.category === 'Asset');
    const liabilityAccounts = coa.filter(a => a.category === 'Liability');
    const equityAccounts = coa.filter(a => a.category === 'Equity');

    const assetLines = assetAccounts.map(acc => {
      let balance = acc.openingBalance;
      vouchers.forEach(v => {
        v.entries.forEach(e => {
          if (e.accountCode === acc.code) {
            balance += (e.debit - e.credit);
          }
        });
      });
      return { code: acc.code, name: acc.name, nameBn: acc.nameBn, subCategory: acc.subCategory, amount: balance };
    }).filter(l => l.amount > 0);

    const liabilityLines = liabilityAccounts.map(acc => {
      let balance = acc.openingBalance;
      vouchers.forEach(v => {
        v.entries.forEach(e => {
          if (e.accountCode === acc.code) {
            balance += (e.credit - e.debit);
          }
        });
      });
      return { code: acc.code, name: acc.name, nameBn: acc.nameBn, subCategory: acc.subCategory, amount: balance };
    }).filter(l => l.amount > 0);

    const equityLines = equityAccounts.map(acc => {
      let balance = acc.openingBalance;
      vouchers.forEach(v => {
        v.entries.forEach(e => {
          if (e.accountCode === acc.code) {
            balance += (e.credit - e.debit);
          }
        });
      });
      return { code: acc.code, name: acc.name, nameBn: acc.nameBn, subCategory: acc.subCategory, amount: balance };
    });

    // Add current period surplus to equity
    equityLines.push({
      code: 'SURPLUS',
      name: 'Current Period Net Surplus',
      nameBn: 'চলতি বছরের নিট উদ্বৃত্ত তহবিল (Net Surplus)',
      subCategory: 'Current Surplus',
      amount: netSurplus
    });

    const totalAssets = assetLines.reduce((sum, l) => sum + l.amount, 0);
    const totalLiabilities = liabilityLines.reduce((sum, l) => sum + l.amount, 0);
    const totalEquity = equityLines.reduce((sum, l) => sum + l.amount, 0);

    return {
      assetLines,
      liabilityLines,
      equityLines,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1
    };
  },

  // ─── PAYROLL CRUD ──────────────────────────────────────────────────
  getPayrollRecords: (): PayrollRecord[] => {
    if (typeof window === 'undefined') return [];
    const isDemoCleared = localStorage.getItem('sms_demo_cleared') === 'true';
    try {
      const stored = localStorage.getItem(PAYROLL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const hasDemo = parsed.some(p => p && p.id && p.id.startsWith('PAY-10'));
          if (isDemoCleared || hasDemo) {
            const cleaned = isDemoCleared ? [] : parsed.filter(p => !p.id?.startsWith('PAY-10'));
            localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(cleaned));
            return cleaned;
          }
          return parsed;
        }
      }
    } catch (e) {}

    return [];
  },

  savePayrollRecord: (record: PayrollRecord) => {
    const list = financeService.getPayrollRecords();
    const index = list.findIndex(r => r.id === record.id);
    if (index > -1) {
      list[index] = record;
    } else {
      list.unshift(record);
      // Auto-post double-entry journal voucher only when salary is actually paid
      if (record.status === 'Paid') {
        financeService.postPayrollJournal(record);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    return list;
  },

  deletePayrollRecord: (id: string) => {
    const list = financeService.getPayrollRecords().filter(r => r.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    return list;
  },

  // ─── EXPENSES CRUD ─────────────────────────────────────────────────
  getExpenses: (): ExpenseRecord[] => {
    if (typeof window === 'undefined') return [];
    const isDemoCleared = localStorage.getItem('sms_demo_cleared') === 'true';
    try {
      const stored = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const hasDemo = parsed.some(e => e && e.id && e.id.startsWith('EXP-10'));
          if (isDemoCleared || hasDemo) {
            const cleaned = isDemoCleared ? [] : parsed.filter(e => !e.id?.startsWith('EXP-10'));
            localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(cleaned));
            return cleaned;
          }
          return parsed;
        }
      }
    } catch (e) {}

    return [];
  },

  saveExpense: (record: ExpenseRecord) => {
    const list = financeService.getExpenses();
    const index = list.findIndex(r => r.id === record.id);
    if (index > -1) {
      list[index] = record;
    } else {
      list.unshift(record);
      // Auto-post double-entry expense voucher!
      financeService.postExpenseJournal(record);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    return list;
  },

  deleteExpense: (id: string) => {
    const list = financeService.getExpenses().filter(r => r.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    return list;
  },

  // ─── BANK ACCOUNTS CRUD ────────────────────────────────────────────
  getBankAccounts: (): BankAccount[] => {
    if (typeof window === 'undefined') return DEFAULT_BANK_ACCOUNTS;
    try {
      const stored = localStorage.getItem(BANK_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_BANK_ACCOUNTS;
  },

  saveBankAccounts: (accounts: BankAccount[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(accounts));
      } catch (e) {}
    }
    return accounts;
  },

  // ─── WAIVERS & REFUNDS CRUD ────────────────────────────────────────
  getWaivers: (): WaiverRecord[] => {
    if (typeof window === 'undefined') return [];
    const isDemoCleared = localStorage.getItem('sms_demo_cleared') === 'true';
    try {
      const stored = localStorage.getItem(WAIVERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const hasDemo = parsed.some(w => w && w.id && w.id.startsWith('WVR-10'));
          if (isDemoCleared || hasDemo) {
            const cleaned = isDemoCleared ? [] : parsed.filter(w => !w.id?.startsWith('WVR-10'));
            localStorage.setItem(WAIVERS_STORAGE_KEY, JSON.stringify(cleaned));
            return cleaned;
          }
          return parsed;
        }
      }
    } catch (e) {}

    return [];
  },

  saveWaiver: (waiver: WaiverRecord) => {
    const list = financeService.getWaivers();
    const index = list.findIndex(w => w.id === waiver.id);
    if (index > -1) list[index] = waiver;
    else list.unshift(waiver);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WAIVERS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    return list;
  },

  deleteWaiver: (id: string) => {
    const list = financeService.getWaivers().filter(w => w.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WAIVERS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    return list;
  },

  getRefunds: (): RefundRecord[] => {
    if (typeof window === 'undefined') return [];
    const isDemoCleared = localStorage.getItem('sms_demo_cleared') === 'true';
    try {
      const stored = localStorage.getItem(REFUNDS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const hasDemo = parsed.some(r => r && r.id && r.id.startsWith('RFD-10'));
          if (isDemoCleared || hasDemo) {
            const cleaned = isDemoCleared ? [] : parsed.filter(r => !r.id?.startsWith('RFD-10'));
            localStorage.setItem(REFUNDS_STORAGE_KEY, JSON.stringify(cleaned));
            return cleaned;
          }
          return parsed;
        }
      }
    } catch (e) {}

    return [];
  },

  saveRefund: (refund: RefundRecord) => {
    const list = financeService.getRefunds();
    list.unshift(refund);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(REFUNDS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    return list;
  },

  // ─── 🎓 STUDENT FEE LEDGER & RECOVERY ENGINE ────────────────────────
  createDefaultStudentLedger: (
    studentId: string,
    rawGrade: string = '6th',
    isStipend: boolean = false,
    stipendStartMonth: string = 'জানুয়ারি',
    sessionYear: number = 2026
  ): StudentFeeLedger => {
    const classFees = financeService.getClassFeesConfig();
    const grade = normalizeGradeKey(rawGrade);
    const standardTuition = classFees[grade]?.tuition !== undefined ? classFees[grade].tuition : (DEFAULT_CLASS_FEES_CONFIG[grade]?.tuition || 400);
    const stipendStartIdx = BANGLA_MONTHS.indexOf(stipendStartMonth);
    const effectiveStipendIdx = stipendStartIdx >= 0 ? stipendStartIdx : 0;

    const settings = financeService.getFinanceSettings();
    const systemStartMonthIdx = BANGLA_MONTHS.indexOf(settings.systemStartMonth);
    const effectiveStartIdx = systemStartMonthIdx >= 0 ? systemStartMonthIdx : 0;

    const months: MonthDue[] = BANGLA_MONTHS.map((m, idx) => {
      const isPreStartMonth = idx < effectiveStartIdx;
      const isMonthWaived = isStipend && idx >= effectiveStipendIdx;
      const monthTuition = isMonthWaived ? 0 : standardTuition;

      let initialStatus: 'paid' | 'partial' | 'due' | 'waived' = isMonthWaived ? 'waived' : 'due';
      let initialPaid = 0;
      let initialDue = monthTuition;

      if (isPreStartMonth) {
        if (settings.preStartMonthsAction === 'settled') {
          initialStatus = 'paid';
          initialPaid = monthTuition;
          initialDue = 0;
        } else if (settings.preStartMonthsAction === 'waived') {
          initialStatus = 'waived';
          initialPaid = 0;
          initialDue = 0;
        }
      }

      return {
        month: m,
        monthIndex: idx,
        year: sessionYear,
        tuitionAmount: monthTuition,
        paidAmount: initialPaid,
        dueAmount: initialDue,
        discount: 0,
        status: initialStatus,
        paymentReceipts: []
      };
    });

    const otherFees: { [sectorId: string]: OtherFeeDue } = {};
    DEFAULT_FEE_SECTORS.filter(s => s.id !== 'tuition').forEach(s => {
      // On-demand fees (tc, testimonial, farewell, registration) start at 0 until requested
      const isOnDemand = ['tc', 'testimonial', 'farewell', 'registration'].includes(s.id);
      const configuredAmount = classFees[grade]?.[s.id] || DEFAULT_CLASS_FEES_CONFIG[grade]?.[s.id] || s.defAmount;
      const initialAmount = isOnDemand ? 0 : configuredAmount;

      otherFees[s.id] = {
        id: s.id,
        name: s.name,
        totalAmount: initialAmount,
        paidAmount: 0,
        dueAmount: initialAmount,
        discount: 0,
        status: initialAmount > 0 ? 'due' : 'paid',
        paymentReceipts: []
      };
    });

    const totalBilled = months.reduce((s, m) => s + m.tuitionAmount, 0) +
      Object.values(otherFees).reduce((s, o) => s + o.totalAmount, 0);
    const totalPaid = months.reduce((s, m) => s + m.paidAmount, 0);
    const totalDiscount = 0;
    const totalDue = months.reduce((s, m) => s + m.dueAmount, 0) +
      Object.values(otherFees).reduce((s, o) => s + o.dueAmount, 0);

    return {
      studentId,
      sessionYear,
      isStipend,
      grade,
      openingDue: 0,
      openingDuePaid: 0,
      openingDueRemaining: 0,
      months,
      otherFees,
      totalBilled,
      totalPaid,
      totalDiscount,
      totalDue
    };
  },

  getAllStudentLedgers: (): Record<string, StudentFeeLedger> => {
    if (typeof window === 'undefined') return {};
    let allStudentsList: any[] = [];
    try {
      const storedStudents = localStorage.getItem('sms_students');
      if (storedStudents) allStudentsList = JSON.parse(storedStudents);
    } catch (e) {}

    // If no students exist (e.g. demo data cleared), immediately return empty
    if (allStudentsList.length === 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STUDENT_LEDGER_STORAGE_KEY, JSON.stringify({}));
      }
      return {};
    }

    try {
      const stored = localStorage.getItem(STUDENT_LEDGER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return financeService.syncStudentLedgersWithClassFees();
        }
      }
    } catch (e) {}
    return {};
  },

  getStudentFeeLedger: (
    studentId: string,
    rawGrade: string = '6th',
    isStipend: boolean = false,
    stipendStartMonth: string = 'জানুয়ারি',
    sessionYear: number = 2026
  ): StudentFeeLedger => {
    const grade = normalizeGradeKey(rawGrade);
    if (typeof window === 'undefined') {
      return financeService.createDefaultStudentLedger(studentId, grade, isStipend, stipendStartMonth, sessionYear);
    }
    try {
      const classFees = financeService.getClassFeesConfig();
      const gradeFees = classFees[grade] || DEFAULT_CLASS_FEES_CONFIG[grade] || {};
      const standardTuition = gradeFees.tuition !== undefined ? gradeFees.tuition : (DEFAULT_CLASS_FEES_CONFIG[grade]?.tuition || 400);
      const feeSectors = financeService.getFeeSectors();

      const stipendStartIdx = BANGLA_MONTHS.indexOf(stipendStartMonth);
      const effectiveStipendIdx = stipendStartIdx >= 0 ? stipendStartIdx : 0;

      const stored = localStorage.getItem(STUDENT_LEDGER_STORAGE_KEY);
      if (stored) {
        const allLedgers = JSON.parse(stored);
        if (allLedgers && allLedgers[studentId]) {
          const ledger = allLedgers[studentId];
          ledger.grade = grade;
          ledger.isStipend = isStipend;
          (ledger as any).stipendStartMonth = stipendStartMonth;

          // Always ensure unpaid/active months reflect latest class tuition rate & stipend start month
          if (ledger.months && Array.isArray(ledger.months)) {
            ledger.months.forEach((m: MonthDue, idx: number) => {
              const isMonthWaived = isStipend && idx >= effectiveStipendIdx;

              if (isMonthWaived) {
                m.tuitionAmount = 0;
                m.dueAmount = 0;
                m.status = 'waived';
              } else {
                const monthTuition = standardTuition;
                m.tuitionAmount = monthTuition;
                if (m.paidAmount === 0 && (m.discount || 0) === 0) {
                  m.dueAmount = monthTuition;
                  m.status = 'due';
                } else if (m.paidAmount > 0 || (m.discount || 0) > 0) {
                  m.dueAmount = Math.max(0, monthTuition - m.paidAmount - (m.discount || 0));
                  m.status = m.dueAmount === 0 ? 'paid' : 'partial';
                }
              }
            });
          }

          // Always ensure other fees reflect latest rates
          if (!ledger.otherFees) ledger.otherFees = {};
          feeSectors.filter(s => s.id !== 'tuition').forEach(s => {
            if (s.applicableClasses && s.applicableClasses.length > 0 && !s.applicableClasses.includes(grade)) {
              if (ledger.otherFees[s.id] && ledger.otherFees[s.id].paidAmount === 0) {
                delete ledger.otherFees[s.id];
              }
              return;
            }
            const isOnDemand = s.frequency === 'on_demand' || ['tc', 'testimonial', 'farewell', 'registration'].includes(s.id);
            const configuredAmount = gradeFees[s.id] !== undefined ? gradeFees[s.id] : s.defAmount;
            const initialAmount = isOnDemand ? 0 : configuredAmount;

            if (!ledger.otherFees[s.id]) {
              ledger.otherFees[s.id] = {
                id: s.id,
                name: s.name,
                totalAmount: initialAmount,
                paidAmount: 0,
                dueAmount: initialAmount,
                discount: 0,
                status: initialAmount > 0 ? 'due' : 'paid',
                paymentReceipts: []
              };
            } else {
              const item = ledger.otherFees[s.id];
              item.name = s.name;
              if (item.paidAmount === 0 && (item.discount || 0) === 0) {
                // If on demand and was 0, keep 0 unless requested
                item.totalAmount = item.totalAmount > 0 ? configuredAmount : initialAmount;
                item.dueAmount = item.totalAmount;
                item.status = item.dueAmount > 0 ? 'due' : 'paid';
              } else if (item.paidAmount > 0) {
                item.totalAmount = Math.max(item.paidAmount, configuredAmount);
                item.dueAmount = Math.max(0, item.totalAmount - item.paidAmount - (item.discount || 0));
                item.status = item.dueAmount === 0 ? 'paid' : 'partial';
              }
            }
          });

          const totalMonthsBilled = (ledger.months || []).reduce((s: number, m: MonthDue) => s + m.tuitionAmount, 0);
          const totalOtherBilled = Object.values(ledger.otherFees || {}).reduce((s: number, o: any) => s + o.totalAmount, 0);
          const totalMonthsDue = (ledger.months || []).reduce((s: number, m: MonthDue) => s + m.dueAmount, 0);
          const totalOtherDue = Object.values(ledger.otherFees || {}).reduce((s: number, o: any) => s + o.dueAmount, 0);
          const totalMonthsPaid = (ledger.months || []).reduce((s: number, m: MonthDue) => s + m.paidAmount, 0);
          const totalOtherPaid = Object.values(ledger.otherFees || {}).reduce((s: number, o: any) => s + o.paidAmount, 0);

          ledger.totalBilled = totalMonthsBilled + totalOtherBilled;
          ledger.totalPaid = totalMonthsPaid + totalOtherPaid;
          ledger.totalDue = totalMonthsDue + totalOtherDue;

          return ledger;
        }
      }
    } catch (e) {}

    const defaultLedger = financeService.createDefaultStudentLedger(studentId, grade, isStipend, stipendStartMonth, sessionYear);
    financeService.saveStudentFeeLedger(defaultLedger);
    return defaultLedger;
  },

  saveStudentFeeLedger: (ledger: StudentFeeLedger) => {
    if (typeof window === 'undefined') return;
    try {
      const all = financeService.getAllStudentLedgers();
      all[ledger.studentId] = ledger;
      localStorage.setItem(STUDENT_LEDGER_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {}
  },

  applyPaymentToStudentLedger: (params: {
    studentId: string;
    studentName: string;
    roll: string;
    grade: string;
    section: string;
    mobile: string;
    selectedMonths: string[];
    selectedOtherFeeIds: string[];
    paymentAmount: number;
    discountAmount: number;
    paymentMethod: 'Cash' | 'bKash' | 'Nagad' | 'Bank Transfer';
    trxId?: string;
    receiptId: string;
    collectedBy: string;
    date: string;
    isStipend?: boolean;
    stipendStartMonth?: string;
  }) => {
    const ledger = financeService.getStudentFeeLedger(params.studentId, params.grade, params.isStipend, params.stipendStartMonth || 'জানুয়ারি');
    let remainingPaid = Math.max(0, params.paymentAmount);
    let remainingDiscount = Math.max(0, params.discountAmount);

    const paidFeeItems: { name: string; amount: number; dueRemaining: number }[] = [];

    // 1. Allocate to selected months in chronological order
    ledger.months.forEach(m => {
      if (params.selectedMonths.includes(m.month)) {
        const itemDue = m.dueAmount;
        if (itemDue > 0) {
          const discToApply = Math.min(remainingDiscount, itemDue);
          m.discount = (m.discount || 0) + discToApply;
          remainingDiscount -= discToApply;

          const payableAfterDisc = itemDue - discToApply;
          const payToApply = Math.min(remainingPaid, payableAfterDisc);
          m.paidAmount = (m.paidAmount || 0) + payToApply;
          m.dueAmount = Math.max(0, m.tuitionAmount - m.paidAmount - m.discount);
          remainingPaid -= payToApply;

          if (m.dueAmount <= 0) {
            m.status = 'paid';
          } else if (m.paidAmount > 0 || m.discount > 0) {
            m.status = 'partial';
          }

          if (!m.paymentReceipts) m.paymentReceipts = [];
          if (!m.paymentReceipts.includes(params.receiptId)) {
            m.paymentReceipts.push(params.receiptId);
          }

          paidFeeItems.push({
            name: `মাসিক বেতন (${m.month})`,
            amount: payToApply + discToApply,
            dueRemaining: m.dueAmount
          });
        }
      }
    });

    // 2. Allocate to selected other fees
    const classFees = financeService.getClassFeesConfig();
    const gradeKey = normalizeGradeKey(params.grade);
    const gradeFees = classFees[gradeKey] || DEFAULT_CLASS_FEES_CONFIG[gradeKey] || {};

    params.selectedOtherFeeIds.forEach(secId => {
      if (!ledger.otherFees[secId]) {
        const configuredAmount = gradeFees[secId] || DEFAULT_FEE_SECTORS.find(s => s.id === secId)?.defAmount || 200;
        ledger.otherFees[secId] = {
          id: secId,
          name: DEFAULT_FEE_SECTORS.find(s => s.id === secId)?.name || secId,
          totalAmount: configuredAmount,
          paidAmount: 0,
          dueAmount: configuredAmount,
          discount: 0,
          status: 'due',
          paymentReceipts: []
        };
      }
      const fee = ledger.otherFees[secId];
      if (fee && (fee.dueAmount > 0 || fee.totalAmount === 0)) {
        if (fee.totalAmount === 0) {
          const configuredAmount = gradeFees[secId] || DEFAULT_FEE_SECTORS.find(s => s.id === secId)?.defAmount || 200;
          fee.totalAmount = configuredAmount;
          fee.dueAmount = configuredAmount;
        }
        const itemDue = fee.dueAmount;
        const discToApply = Math.min(remainingDiscount, itemDue);
        fee.discount = (fee.discount || 0) + discToApply;
        remainingDiscount -= discToApply;

        const payableAfterDisc = itemDue - discToApply;
        const payToApply = Math.min(remainingPaid, payableAfterDisc);
        fee.paidAmount = (fee.paidAmount || 0) + payToApply;
        fee.dueAmount = Math.max(0, fee.totalAmount - fee.paidAmount - fee.discount);
        remainingPaid -= payToApply;

        if (fee.dueAmount <= 0) {
          fee.status = 'paid';
        } else if (fee.paidAmount > 0 || fee.discount > 0) {
          fee.status = 'partial';
        }

        if (!fee.paymentReceipts) fee.paymentReceipts = [];
        if (!fee.paymentReceipts.includes(params.receiptId)) {
          fee.paymentReceipts.push(params.receiptId);
        }

        paidFeeItems.push({
          name: fee.name,
          amount: payToApply + discToApply,
          dueRemaining: fee.dueAmount
        });
      }
    });

    // 3. Allocate to opening arrears if selected
    if (params.selectedOtherFeeIds.includes('opening_due')) {
      const openRemaining = ledger.openingDueRemaining !== undefined 
        ? ledger.openingDueRemaining 
        : Math.max(0, (ledger.openingDue || 0) - (ledger.openingDuePaid || 0));

      if (openRemaining > 0 && (remainingPaid > 0 || remainingDiscount > 0)) {
        const discToApply = Math.min(remainingDiscount, openRemaining);
        remainingDiscount -= discToApply;
        const payableAfterDisc = openRemaining - discToApply;
        const payToApply = Math.min(remainingPaid, payableAfterDisc);
        ledger.openingDuePaid = (ledger.openingDuePaid || 0) + payToApply;
        ledger.openingDueRemaining = Math.max(0, (ledger.openingDue || 0) - ledger.openingDuePaid - discToApply);
        remainingPaid -= payToApply;

        paidFeeItems.push({
          name: 'পূর্ববর্তী বকেয়া (Arrears / Opening Due)',
          amount: payToApply + discToApply,
          dueRemaining: ledger.openingDueRemaining
        });
      }
    }

    // Recalculate totals
    const totalMonthsBilled = ledger.months.reduce((s, m) => s + m.tuitionAmount, 0);
    const totalOtherBilled = Object.values(ledger.otherFees).reduce((s, o) => s + o.totalAmount, 0);
    const totalMonthsPaid = ledger.months.reduce((s, m) => s + m.paidAmount, 0);
    const totalOtherPaid = Object.values(ledger.otherFees).reduce((s, o) => s + o.paidAmount, 0);
    const totalMonthsDiscount = ledger.months.reduce((s, m) => s + (m.discount || 0), 0);
    const totalOtherDiscount = Object.values(ledger.otherFees).reduce((s, o) => s + (o.discount || 0), 0);

    const openBilled = Number(ledger.openingDue) || 0;
    const openPaid = Number(ledger.openingDuePaid) || 0;
    const openRemaining = Math.max(0, openBilled - openPaid);
    ledger.openingDue = openBilled;
    ledger.openingDuePaid = openPaid;
    ledger.openingDueRemaining = openRemaining;

    const totalBilled = totalMonthsBilled + totalOtherBilled + openBilled;
    const totalPaid = totalMonthsPaid + totalOtherPaid + openPaid;
    const totalDiscount = totalMonthsDiscount + totalOtherDiscount;
    const totalDue = Math.max(0, totalBilled - totalPaid - totalDiscount);

    ledger.studentName = params.studentName;
    ledger.roll = params.roll;
    ledger.grade = params.grade;
    ledger.section = params.section;
    ledger.totalBilled = totalBilled;
    ledger.totalPaid = totalPaid;
    ledger.totalDiscount = totalDiscount;
    ledger.totalDue = totalDue;
    ledger.lastPaymentDate = params.date;
    ledger.lastPaymentMethod = params.paymentMethod;
    ledger.lastReceiptId = params.receiptId;

    financeService.saveStudentFeeLedger(ledger);

    // Enqueue fee collection mutation for offline sync
    syncQueueService.enqueue('fee_collection', params.receiptId, 'CREATE', {
      receiptId: params.receiptId,
      studentId: params.studentId,
      studentName: params.studentName,
      roll: params.roll,
      grade: params.grade,
      section: params.section,
      amount: params.paymentAmount,
      discount: params.discountAmount,
      paymentMethod: params.paymentMethod,
      trxId: params.trxId,
      collectedBy: params.collectedBy,
      date: params.date,
      paidFeeItems
    }).catch(() => {});

    return {
      updatedLedger: ledger,
      paidFeeItems
    };
  },

  getFeeCollectionStats: (payments: any[] = []): FeeCollectionStats => {
    let todayCollected = 0;
    let cashCollected = 0;
    let bkashCollected = 0;
    let nagadCollected = 0;
    let bankCollected = 0;
    let totalCollectedAll = 0;
    let totalDiscountAll = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    payments.forEach(p => {
      const paid = Number(p.paidAmount) || 0;
      const disc = Number(p.discount) || 0;
      totalCollectedAll += paid;
      totalDiscountAll += disc;

      if (p.paymentMethod === 'Cash') cashCollected += paid;
      else if (p.paymentMethod === 'bKash') bkashCollected += paid;
      else if (p.paymentMethod === 'Nagad') nagadCollected += paid;
      else if (p.paymentMethod === 'Bank Transfer' || p.paymentMethod === 'Bank Check') bankCollected += paid;

      // Support both ISO dates ('2026-08-25') and legacy Bengali locale dates
      const pDateISO = p.date ? p.date.substring(0, 10) : '';
      if (pDateISO === todayStr || p.date.includes(todayStr)) {
        todayCollected += paid;
      }
    });

    const allLedgers = financeService.getAllStudentLedgers();
    let totalDueAll = 0;
    let totalOpeningDueAll = 0;
    let totalOpeningDueRemaining = 0;
    const studentKeys = Object.keys(allLedgers);
    studentKeys.forEach(k => {
      const l = allLedgers[k];
      totalDueAll += (l.totalDue || 0);
      totalOpeningDueAll += Number(l.openingDue || 0);
      totalOpeningDueRemaining += Number(l.openingDueRemaining || 0);
    });

    return {
      totalStudents: studentKeys.length,
      totalDueAll,
      totalCollectedAll,
      totalDiscountAll,
      todayCollected,
      cashCollected,
      bkashCollected,
      nagadCollected,
      bankCollected,
      totalOpeningDueAll,
      totalOpeningDueRemaining
    };
  },
  // ─── 📊 STUDENT FEES ANALYTICS REPORTS ─────────────────────────────────

  // Class-wise Due Report: how much is due per grade
  getClassWiseDueReport: (allLedgers: Record<string, StudentFeeLedger>, allStudents: { id: string; grade: string; name: string; roll: string | number; section?: string }[]) => {
    const result: {
      grade: string;
      gradeName: string;
      totalStudents: number;
      studentsWithDue: number;
      studentsPaid: number;
      totalBilled: number;
      totalPaid: number;
      totalDue: number;
      students: { id: string; name: string; roll: string; section: string; totalDue: number; totalPaid: number; monthsDue: string[] }[];
    }[] = [];

    const gradeNames: Record<string, string> = {
      '6th': '৬ষ্ঠ শ্রেণি', '7th': '৭ম শ্রেণি', '8th': '৮ম শ্রেণি',
      '9th': '৯ম শ্রেণি', '10th': '১০ম শ্রেণি'
    };

    const grades = ['6th', '7th', '8th', '9th', '10th'];
    grades.forEach(grade => {
      const gradeStudents = allStudents.filter(s => normalizeGradeKey(s.grade) === grade);
      const rows: { id: string; name: string; roll: string; section: string; totalDue: number; totalPaid: number; monthsDue: string[] }[] = [];
      let totalBilled = 0;
      let totalPaid = 0;
      let totalDue = 0;
      let studentsWithDue = 0;
      let studentsPaid = 0;

      gradeStudents.forEach(st => {
        const ledger = allLedgers[st.id];
        const due = ledger ? ledger.totalDue : 0;
        const paid = ledger ? ledger.totalPaid : 0;
        const billed = ledger ? ledger.totalBilled : 0;
        const monthsDue = ledger ? ledger.months.filter(m => m.dueAmount > 0).map(m => m.month) : [];
        totalBilled += billed;
        totalPaid += paid;
        totalDue += due;
        if (due > 0) studentsWithDue++;
        else if (paid > 0 || billed === 0) studentsPaid++;

        rows.push({
          id: st.id,
          name: st.name,
          roll: String(st.roll),
          section: st.section || 'ক',
          totalDue: due,
          totalPaid: paid,
          monthsDue
        });
      });

      rows.sort((a, b) => b.totalDue - a.totalDue);

      result.push({
        grade,
        gradeName: gradeNames[grade] || grade,
        totalStudents: gradeStudents.length,
        studentsWithDue,
        studentsPaid,
        totalBilled,
        totalPaid,
        totalDue,
        students: rows
      });
    });

    return result;
  },

  // Month-wise collection report: what was collected per month
  getMonthWiseCollectionReport: (payments: { date: string; paidAmount: number; paymentMethod: string; grade: string }[]) => {
    const monthNames = BANGLA_MONTHS;

    // Helper: parse date string to JS Date, supporting ISO and Bengali locale formats
    const parseDate = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      // Try ISO format first (new format: '2026-08-05')
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
      // Fallback: convert Bengali numerals to ASCII and try again
      const bnDigits: Record<string, string> = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};
      const ascii = dateStr.replace(/[০-৯]/g, c => bnDigits[c] || c)
        .replace(/অপরাহ্ন/g, 'PM').replace(/পূর্বাহ্ন/g, 'AM')
        .replace(/\//g, '-');
      // Try dd-MM-yyyy or M-d-yyyy
      const parts = ascii.match(/(\d+)-(\d+)-(\d+)/);
      if (parts) {
        const [, a, b, c] = parts;
        // Try yyyy-MM-dd first, then dd-MM-yyyy
        const d2 = new Date(`${c.length === 4 ? c : a}-${b.padStart(2,'0')}-${(c.length === 4 ? a : c).padStart(2,'0')}`);
        if (!isNaN(d2.getTime())) return d2;
      }
      return null;
    };

    const report = monthNames.map((month, calIdx) => {
      const monthPayments = payments.filter(p => {
        const d = parseDate(p.date || '');
        return d !== null && d.getMonth() === calIdx;
      });

      const monthTotal = monthPayments.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0);
      const cashTotal = monthPayments
        .filter(p => p.paymentMethod === 'Cash')
        .reduce((s, p) => s + (Number(p.paidAmount) || 0), 0);
      const digitalTotal = monthTotal - cashTotal;

      return {
        month,
        monthIndex: calIdx,
        totalCollected: monthTotal,
        cashCollected: cashTotal,
        digitalCollected: digitalTotal,
        transactionCount: monthPayments.length
      };
    });

    return report;
  },

  // ─── 🧹 RESET & CLEAR DEMO FINANCE DATA ───────────────────────────
  clearAllFinanceData: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STUDENT_LEDGER_STORAGE_KEY, JSON.stringify({}));
    localStorage.setItem(PAYMENT_HISTORY_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(WAIVERS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(REFUNDS_STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new Event('storage'));
    listeners.forEach(fn => fn(currentConfig));
  },

  restoreDemoFinanceData: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STUDENT_LEDGER_STORAGE_KEY);
    localStorage.removeItem(PAYMENT_HISTORY_STORAGE_KEY);
    localStorage.removeItem(VOUCHER_STORAGE_KEY);
    localStorage.removeItem(PAYROLL_STORAGE_KEY);
    localStorage.removeItem(EXPENSES_STORAGE_KEY);
    localStorage.removeItem(INVOICES_STORAGE_KEY);
    localStorage.removeItem(WAIVERS_STORAGE_KEY);
    localStorage.removeItem(REFUNDS_STORAGE_KEY);
    window.dispatchEvent(new Event('storage'));
    listeners.forEach(fn => fn(currentConfig));
  },

  // ─── SUBSCRIPTION LISTENER ─────────────────────────────────────────
  subscribe: (fn: (cfg: { [grade: string]: { [secId: string]: number } }) => void) => {
    listeners.push(fn);
    fn(financeService.getClassFeesConfig());
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }
};
