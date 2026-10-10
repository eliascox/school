// ─── ENTERPRISE SCHOOL LEDGER SERVICE (শ্রেণিভিত্তিক আয় ও ব্যয় খতিয়ান) ────────────────

export interface LedgerRecord {
  id: string;
  type: 'Income' | 'Expense'; // আয় বা ব্যয়
  category: string;           // 'মাসিক বেতন', 'ভর্তি ফি', 'পরীক্ষা ফি', 'শিক্ষক বেতন', 'বিদ্যুৎ বিল', 'প্রিন্টিং', 'অন্যান্য'
  grade?: string;              // '6th', '7th', '8th', '9th', '10th', 'all'
  studentName?: string;
  studentRoll?: string;
  amount: number;              // পরিমাণ (৳)
  voucherNo: string;           // ভাউচার বা রশিদ নম্বর
  date: string;                // YYYY-MM-DD
  paymentMethod: 'Cash' | 'bKash' | 'Nagad' | 'Bank Transfer';
  description: string;
  createdByName?: string;
  updatedAt?: string;
}

export interface LedgerFilterOptions {
  type?: 'All' | 'Income' | 'Expense';
  grade?: string; // 'All', '6th', '7th', '8th', '9th', '10th'
  period?: 'all' | 'today' | 'weekly' | 'monthly' | 'custom';
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface LedgerSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  classIncomeMap: Record<string, number>;
  otherIncome: number;
  expenseCategoryMap: Record<string, number>;
}

const STORAGE_KEY = 'school_ledger_records';

const INITIAL_RECORDS: LedgerRecord[] = [
  {
    id: 'LEDG-1001',
    type: 'Income',
    category: 'মাসিক বেতন',
    grade: '6th',
    studentName: 'আরিফুল ইসলাম',
    studentRoll: '101',
    amount: 1500,
    voucherNo: 'REC-2026-001',
    date: '2026-08-12',
    paymentMethod: 'Cash',
    description: '৬ষ্ঠ শ্রেণির জুলাই মাসের বেতন পরিশোধ',
    createdByName: 'ক্যাশিয়ার'
  },
  {
    id: 'LEDG-1002',
    type: 'Income',
    category: 'ভর্তি ফি',
    grade: '9th',
    studentName: 'সামিয়া আকতার',
    studentRoll: '105',
    amount: 3500,
    voucherNo: 'REC-2026-002',
    date: '2026-08-11',
    paymentMethod: 'bKash',
    description: '৯ম শ্রেণি নতুন ভর্তি সেশন ফি সহ',
    createdByName: 'অ্যাডমিন'
  },
  {
    id: 'LEDG-1003',
    type: 'Income',
    category: 'পরীক্ষা ফি',
    grade: '10th',
    studentName: 'মেহেদী হাসান',
    studentRoll: '102',
    amount: 800,
    voucherNo: 'REC-2026-003',
    date: '2026-08-10',
    paymentMethod: 'Nagad',
    description: '১০ম শ্রেণির নির্বাচনী পরীক্ষা ফি',
    createdByName: 'ক্যাশিয়ার'
  },
  {
    id: 'LEDG-1004',
    type: 'Income',
    category: 'মাসিক বেতন',
    grade: '7th',
    studentName: 'রাশেদুল করিম',
    studentRoll: '103',
    amount: 1200,
    voucherNo: 'REC-2026-004',
    date: '2026-08-08',
    paymentMethod: 'Cash',
    description: '৭ম শ্রেণির জুলাই বেতন',
    createdByName: 'ক্যাশিয়ার'
  },
  {
    id: 'LEDG-1005',
    type: 'Income',
    category: 'মাসিক বেতন',
    grade: '8th',
    studentName: 'নুসরাত জাহান',
    studentRoll: '104',
    amount: 1300,
    voucherNo: 'REC-2026-005',
    date: '2026-08-05',
    paymentMethod: 'Cash',
    description: '৮ম শ্রেণির মাসিক বেতন',
    createdByName: 'ক্যাশিয়ার'
  },
  {
    id: 'LEDG-2001',
    type: 'Expense',
    category: 'শিক্ষক বেতন',
    grade: 'all',
    amount: 45000,
    voucherNo: 'EXP-2026-001',
    date: '2026-08-01',
    paymentMethod: 'Bank Transfer',
    description: 'সহকারী শিক্ষক ও কর্মচারী সমূহের জুলাই মাসের সম্মানী',
    createdByName: 'প্রধান শিক্ষক'
  },
  {
    id: 'LEDG-2002',
    type: 'Expense',
    category: 'বিদ্যুৎ বিল',
    grade: 'all',
    amount: 6800,
    voucherNo: 'EXP-2026-002',
    date: '2026-08-04',
    paymentMethod: 'bKash',
    description: 'বিদ্যালয় বিদ্যুৎ বিল পরিশোধ (জুলাই)',
    createdByName: 'হিসাবরক্ষণ'
  },
  {
    id: 'LEDG-2003',
    type: 'Expense',
    category: 'প্রিন্টিং ও খাতাপত্র',
    grade: 'all',
    amount: 4200,
    voucherNo: 'EXP-2026-003',
    date: '2026-08-07',
    paymentMethod: 'Cash',
    description: 'অফিসিয়াল খাতা, হাজিরা খাতা ও প্রশ্নপত্র ফটোকপি খরচ',
    createdByName: 'ক্যাশিয়ার'
  },
  {
    id: 'LEDG-2004',
    type: 'Expense',
    category: 'ভবন মেরামত ও সংস্কার',
    grade: 'all',
    amount: 12500,
    voucherNo: 'EXP-2026-004',
    date: '2026-08-09',
    paymentMethod: 'Cash',
    description: 'কম্পিউটার ল্যাব রং ও ফ্যান মেরামত',
    createdByName: 'অ্যাডমিন'
  }
];

class LedgerService {
  private getStorageRecords(): LedgerRecord[] {
    if (typeof window === 'undefined') return [];
    const isDemoCleared = localStorage.getItem('sms_demo_cleared') === 'true';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (isDemoCleared) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // If demo was cleared and leftover demo records remain, wipe them!
        if (isDemoCleared && parsed.length > 0 && parsed.some(r => r.id && r.id.startsWith('LEDG-100'))) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
          return [];
        }
        return parsed;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  private saveStorageRecords(records: LedgerRecord[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  // Clear all ledger records (Fresh start)
  clearAllLedgerData(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new Event('storage'));
  }

  // Restore demo ledger records
  restoreDemoLedgerData(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
    window.dispatchEvent(new Event('storage'));
  }

  // Get all records
  getAllRecords(): LedgerRecord[] {
    return this.getStorageRecords();
  }

  // Add new record
  addRecord(record: Omit<LedgerRecord, 'id'>): LedgerRecord {
    const records = this.getStorageRecords();
    const prefix = record.type === 'Income' ? 'REC' : 'EXP';
    const newId = `LEDG-${Math.floor(1000 + Math.random() * 9000)}`;
    const autoVoucher = record.voucherNo || `${prefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: LedgerRecord = {
      ...record,
      id: newId,
      voucherNo: autoVoucher,
      date: record.date || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };

    const updatedList = [newRecord, ...records];
    this.saveStorageRecords(updatedList);
    return newRecord;
  }

  // Update existing record
  updateRecord(id: string, updatedFields: Partial<LedgerRecord>): boolean {
    const records = this.getStorageRecords();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) return false;

    records[index] = {
      ...records[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    this.saveStorageRecords(records);
    return true;
  }

  // Delete record
  deleteRecord(id: string): boolean {
    const records = this.getStorageRecords();
    const filtered = records.filter((r) => r.id !== id);
    if (filtered.length === records.length) return false;

    this.saveStorageRecords(filtered);
    return true;
  }

  // Filter records by date/period, class, type, and search keyword
  getFilteredRecords(options: LedgerFilterOptions): LedgerRecord[] {
    const records = this.getStorageRecords();
    const todayStr = new Date().toISOString().split('T')[0];

    return records.filter((item) => {
      // 1. Type Filter
      if (options.type && options.type !== 'All' && item.type !== options.type) {
        return false;
      }

      // 2. Grade/Class Filter
      if (options.grade && options.grade !== 'All') {
        if (item.grade && item.grade !== 'all' && item.grade !== options.grade) {
          return false;
        }
      }

      // 3. Date / Period Filter
      if (options.period === 'today') {
        if (item.date !== todayStr) return false;
      } else if (options.period === 'weekly') {
        const itemTime = new Date(item.date).getTime();
        const nowTime = new Date().getTime();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (nowTime - itemTime > sevenDaysMs || itemTime > nowTime) {
          return false;
        }
      } else if (options.period === 'monthly') {
        const itemMonth = item.date.slice(0, 7); // YYYY-MM
        const currentMonth = todayStr.slice(0, 7);
        if (itemMonth !== currentMonth) return false;
      } else if (options.period === 'custom') {
        if (options.startDate && item.date < options.startDate) return false;
        if (options.endDate && item.date > options.endDate) return false;
      }

      // 4. Search Filter
      if (options.search && options.search.trim() !== '') {
        const q = options.search.toLowerCase().trim();
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesVoucher = item.voucherNo.toLowerCase().includes(q);
        const matchesStudent = (item.studentName || '').toLowerCase().includes(q);
        const matchesRoll = (item.studentRoll || '').includes(q);
        if (!matchesCat && !matchesDesc && !matchesVoucher && !matchesStudent && !matchesRoll) {
          return false;
        }
      }

      return true;
    });
  }

  // Calculate Summary
  getSummary(filteredList: LedgerRecord[]): LedgerSummary {
    let totalIncome = 0;
    let totalExpense = 0;
    let otherIncome = 0;
    const classIncomeMap: Record<string, number> = {
      '6th': 0,
      '7th': 0,
      '8th': 0,
      '9th': 0,
      '10th': 0
    };
    const expenseCategoryMap: Record<string, number> = {};

    filteredList.forEach((r) => {
      if (r.type === 'Income') {
        totalIncome += r.amount;
        if (r.grade && classIncomeMap[r.grade] !== undefined) {
          classIncomeMap[r.grade] += r.amount;
        } else {
          otherIncome += r.amount;
        }
      } else if (r.type === 'Expense') {
        totalExpense += r.amount;
        const cat = r.category || 'অন্যান্য ব্যয়';
        expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + r.amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      classIncomeMap,
      otherIncome,
      expenseCategoryMap
    };
  }

  // Export records to CSV format
  exportToCSV(records: LedgerRecord[], filename = 'school_ledger_report.csv') {
    if (typeof window === 'undefined') return;

    const headers = ['তারিখ', 'টাইপ', 'ক্যাটাগরি', 'শ্রেণি', 'শিক্ষার্থীর নাম', 'রোল', 'ভাউচার নং', 'মেথড', 'পরিমাণ (৳)', 'বিবরণ'];
    const rows = records.map((r) => [
      r.date,
      r.type === 'Income' ? 'আয়' : 'ব্যয়',
      r.category,
      r.grade || 'সকল',
      r.studentName || '-',
      r.studentRoll || '-',
      r.voucherNo,
      r.paymentMethod,
      r.amount,
      `"${(r.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const ledgerService = new LedgerService();
