'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Search,
  Users,
} from 'lucide-react';
import {
  BANGLA_MONTHS,
  DEFAULT_CLASS_FEES_CONFIG,
  DEFAULT_FEE_SECTORS,
  FeeSector,
  GRADES_LIST,
  StudentFeeLedger,
  financeService,
  normalizeGradeKey,
} from '@/services/financeService';
import { Student } from '@/services/studentService';
import { smsService } from '@/services/smsService';
import { paymentGatewayService, PaymentGatewayProvider } from '@/services/paymentGatewayService';
import { auditTrailService } from '@/services/auditTrailService';
import { showToast } from '@/components/ui/ToastProvider';
import {
  FeePaymentMethod,
  PaymentRecord,
  SchoolInfoState,
  StudentFinanceExt,
  getStudentStipendStartMonth,
  isStipendStudent,
} from './financeShared';

interface StudentFeesCollectionTabProps {
  students: Student[];
  classFees: { [grade: string]: { [secId: string]: number } };
  allStudentLedgers: Record<string, StudentFeeLedger>;
  feeSectors: FeeSector[];
  paymentHistory: PaymentRecord[];
  schoolInfo: SchoolInfoState;
  selectedStudent: Student | null;
  selectionNonce: number;
  onSelectStudent: (st: Student) => void;
  onClearSelectedStudent: () => void;
  onPaymentHistoryUpdate: (updated: PaymentRecord[]) => void;
  onRefreshAll: () => void;
  onPrintReceipt: (rec: PaymentRecord) => void;
}

export function StudentFeesCollectionTab({
  students,
  classFees,
  allStudentLedgers,
  feeSectors,
  paymentHistory,
  schoolInfo,
  selectedStudent,
  selectionNonce,
  onSelectStudent,
  onClearSelectedStudent,
  onPaymentHistoryUpdate,
  onRefreshAll,
  onPrintReceipt,
}: StudentFeesCollectionTabProps) {
  const [feeSearch, setFeeSearch] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [studentDueFilter, setStudentDueFilter] = useState<'all' | 'has_due' | 'paid_up'>('all');
  const [stipendStartMonthOverride, setStipendStartMonthOverride] = useState<string>('জানুয়ারি');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [extraFeeSelections, setExtraFeeSelections] = useState<{ [secId: string]: boolean }>({
    exam: true,
  });
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState<FeePaymentMethod>('Cash');
  const [trxIdInput, setTrxIdInput] = useState<string>('');
  const [collectedBy] = useState<string>('ক্যাশিয়ার');

  // Initialize selection matrices when a student is picked (either locally or from due report).
  useEffect(() => {
    if (!selectedStudent) return;
    const stipend = isStipendStudent(selectedStudent);
    const stipendStart = getStudentStipendStartMonth(selectedStudent);
    setStipendStartMonthOverride(stipendStart);

    const gradeKey = normalizeGradeKey(selectedStudent.grade);
    const ledger = financeService.getStudentFeeLedger(selectedStudent.id, gradeKey, stipend, stipendStart);

    const currentMonthIdx = new Date().getMonth();
    const monthsWithDue = ledger.months
      .filter((m, idx) => m.dueAmount > 0 && idx <= Math.max(currentMonthIdx + 1, 7))
      .map((m) => m.month);

    const defaultMonths =
      monthsWithDue.length > 0
        ? monthsWithDue
        : ledger.months.filter((m) => m.dueAmount > 0).map((m) => m.month).slice(0, 3);

    setSelectedMonths(defaultMonths);

    const extra: { [secId: string]: boolean } = {};
    if (ledger.otherFees) {
      Object.keys(ledger.otherFees).forEach((secId) => {
        if (secId === 'exam' && ledger.otherFees[secId].dueAmount > 0) {
          extra[secId] = true;
        }
      });
    }
    setExtraFeeSelections(extra);
    setDiscountAmount(0);
    setTrxIdInput('');
    setPaymentAmountInput('');
  }, [selectedStudent, selectionNonce]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const ext = s as StudentFinanceExt;
      const matchGrade = selectedGradeFilter === 'all' || s.grade === selectedGradeFilter;
      const matchSearch =
        feeSearch === '' ||
        s.name.toLowerCase().includes(feeSearch.toLowerCase()) ||
        s.roll.toString().includes(feeSearch) ||
        (ext.studentId && ext.studentId.toLowerCase().includes(feeSearch.toLowerCase()));

      const stipend = isStipendStudent(s);
      const gradeKey = normalizeGradeKey(s.grade);
      const ledger = allStudentLedgers[s.id] || financeService.getStudentFeeLedger(s.id, gradeKey, stipend);
      const studentDue = ledger ? ledger.totalDue : 0;

      const matchDue =
        studentDueFilter === 'all'
          ? true
          : studentDueFilter === 'has_due'
          ? studentDue > 0
          : studentDue === 0;

      return matchGrade && matchSearch && matchDue;
    });
  }, [students, selectedGradeFilter, feeSearch, studentDueFilter, allStudentLedgers]);

  const activeClassStats = useMemo(() => {
    const classStudents =
      selectedGradeFilter === 'all' ? students : students.filter((s) => s.grade === selectedGradeFilter);

    let totalDue = 0;
    let studentsWithDue = 0;
    let studentsPaid = 0;
    const duesList: { student: Student; due: number; paid: number }[] = [];

    classStudents.forEach((st) => {
      const stipend = isStipendStudent(st);
      const gradeKey = normalizeGradeKey(st.grade);
      const ledger = allStudentLedgers[st.id] || financeService.getStudentFeeLedger(st.id, gradeKey, stipend);
      const due = ledger ? ledger.totalDue : 0;
      const paid = ledger ? ledger.totalPaid : 0;
      const billed = ledger ? ledger.totalBilled : 0;
      totalDue += due;
      if (due > 0) {
        studentsWithDue++;
        duesList.push({ student: st, due, paid });
      } else if (paid > 0 || billed === 0) {
        studentsPaid++;
      }
    });

    duesList.sort((a, b) => b.due - a.due);

    return {
      totalStudents: classStudents.length,
      totalDue,
      studentsWithDue,
      studentsPaid,
      duesList,
    };
  }, [students, selectedGradeFilter, allStudentLedgers]);

  const selectedStudentLedger = useMemo(() => {
    if (!selectedStudent) return null;
    const stipend = isStipendStudent(selectedStudent);
    const stipendStart = stipendStartMonthOverride || getStudentStipendStartMonth(selectedStudent);
    const gradeKey = normalizeGradeKey(selectedStudent.grade);
    return financeService.getStudentFeeLedger(selectedStudent.id, gradeKey, stipend, stipendStart);
  }, [selectedStudent, stipendStartMonthOverride, allStudentLedgers, classFees]);

  const toggleMonth = (m: string) => {
    if (selectedMonths.includes(m)) {
      setSelectedMonths(selectedMonths.filter((x) => x !== m));
    } else {
      setSelectedMonths([...selectedMonths, m]);
    }
  };

  const currentGrade = normalizeGradeKey(selectedStudent?.grade);
  const monthlyTuitionRate = isStipendStudent(selectedStudent)
    ? 0
    : classFees[currentGrade]?.tuition || DEFAULT_CLASS_FEES_CONFIG[currentGrade]?.tuition || 400;

  const currentSubtotal = useMemo(() => {
    if (!selectedStudent || !selectedStudentLedger) return 0;
    let sum = 0;

    selectedMonths.forEach((mName) => {
      const monthObj = selectedStudentLedger.months.find((m) => m.month === mName);
      if (monthObj) {
        sum += monthObj.dueAmount;
      } else {
        sum += monthlyTuitionRate;
      }
    });

    Object.keys(extraFeeSelections).forEach((secId) => {
      if (extraFeeSelections[secId]) {
        if (secId === 'opening_due') {
          sum += selectedStudentLedger.openingDueRemaining || 0;
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

  useEffect(() => {
    if (selectedStudent) {
      setPaymentAmountInput(currentNetPayable);
    }
  }, [currentNetPayable, selectedStudent]);

  const actualPaidAmount =
    typeof paymentAmountInput === 'number' ? paymentAmountInput : Number(paymentAmountInput) || 0;
  const remainingDueAfterThisPay = Math.max(0, currentNetPayable - actualPaidAmount);

  const handleCollectFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (actualPaidAmount <= 0 && currentNetPayable > 0 && discountAmount === 0) {
      showToast('অনুগ্রহ করে প্রাপ্ত অর্থের সঠিক পরিমাণ লিখুন!', 'warning');
      return;
    }

    const extStudent = selectedStudent as StudentFinanceExt;
    const now = new Date();
    const receiptNum = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const selectedOtherIds = Object.keys(extraFeeSelections).filter((secId) => extraFeeSelections[secId]);

    const studentStipendStartMonth =
      extStudent.stipendStartMonth || (selectedStudent.isStipend && extStudent.stipendMonth) || 'জানুয়ারি';

    const finalTrxId =
      paymentMethod === 'Cash'
        ? `CASH-${Date.now().toString().slice(-6)}`
        : trxIdInput || `TRX-${Date.now().toString().slice(-6)}`;

    const { updatedLedger, paidFeeItems } = financeService.applyPaymentToStudentLedger({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      roll: String(selectedStudent.roll),
      grade: selectedStudent.grade || '6th',
      section: selectedStudent.section || 'ক',
      mobile: selectedStudent.mobile || extStudent.phone || 'N/A',
      selectedMonths,
      selectedOtherFeeIds: selectedOtherIds,
      paymentAmount: actualPaidAmount,
      discountAmount,
      paymentMethod,
      trxId: finalTrxId,
      receiptId: receiptNum,
      collectedBy,
      date: now.toISOString().split('T')[0],
      isStipend: isStipendStudent(selectedStudent),
      stipendStartMonth: isStipendStudent(selectedStudent) ? studentStipendStartMonth : undefined,
    });

    const newRecord: PaymentRecord = {
      receiptId: receiptNum,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      roll: String(selectedStudent.roll),
      grade: selectedStudent.grade || '6th',
      section: selectedStudent.section || 'ক',
      mobile: selectedStudent.mobile || extStudent.phone || 'N/A',
      feeItems: paidFeeItems.map((f) => ({ name: f.name, amount: f.amount, dueRemaining: f.dueRemaining })),
      subtotal: currentSubtotal,
      discount: discountAmount,
      paidAmount: actualPaidAmount,
      dueRemaining: updatedLedger.totalDue,
      paymentMethod,
      trxId: finalTrxId,
      date: now.toISOString().split('T')[0],
      collectedBy,
    };

    const updated = [newRecord, ...paymentHistory];
    onPaymentHistoryUpdate(updated);
    try {
      localStorage.setItem('sms_payment_history', JSON.stringify(updated));
    } catch {}

    financeService.postFeeReceiptJournal({
      receiptId: receiptNum,
      studentName: selectedStudent.name,
      roll: String(selectedStudent.roll),
      grade: selectedStudent.grade || '6th',
      paidAmount: actualPaidAmount,
      subtotal: actualPaidAmount + discountAmount,
      discount: discountAmount,
      paymentMethod,
      feeItems: paidFeeItems.map((f) => ({ name: f.name, amount: f.amount })),
      date: now.toISOString().split('T')[0],
      collectedBy,
    });

    if (selectedStudent.mobile && selectedStudent.mobile !== 'N/A' && selectedStudent.mobile.length >= 11) {
      try {
        smsService.sendSMS({
          recipient: selectedStudent.mobile,
          message: `${schoolInfo.nameBn}: শিক্ষার্থী ${selectedStudent.name}-এর ফি বাবদ ৳${actualPaidAmount} গ্রহণ করা হয়েছে। রসিদ নং: ${receiptNum}। বর্তমান অবশিষ্ট বকেয়া: ৳${updatedLedger.totalDue}। ধন্যবাদ।`,
          type: 'fee_reminder',
          targetAudience: 'individual',
          recipientName: selectedStudent.name,
          studentId: selectedStudent.id,
          class: selectedStudent.grade,
          roll: String(selectedStudent.roll),
        });
      } catch {}
    }

    try {
      auditTrailService.addLog({
        action: 'FEE_PAYMENT_COLLECTED',
        performedBy: collectedBy || 'ক্যাশিয়ার',
        targetId: receiptNum,
        details: `শিক্ষার্থী ${selectedStudent.name} (রোল: ${selectedStudent.roll}, শ্রেণি: ${selectedStudent.grade}) থেকে ৳${actualPaidAmount} ফি আদায় করা হয়েছে। মাধ্যম: ${paymentMethod}, TrxID: ${trxIdInput || 'ক্যাশ'}। অবশিষ্ট বকেয়া: ৳${updatedLedger.totalDue}।`,
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
    } catch {}

    onRefreshAll();
    onPrintReceipt(newRecord);
    onClearSelectedStudent();
    setSelectedMonths([]);
    setExtraFeeSelections({});
    setPaymentAmountInput('');
    setDiscountAmount(0);
    setTrxIdInput('');
  };

  const kpiCards = [
    {
      label: 'মোট শিক্ষার্থী',
      value: `${activeClassStats.totalStudents} জন`,
      boxClass: 'bg-slate-50/70 border-slate-200',
      textClass: 'text-slate-700 dark:text-slate-400',
    },
    {
      label: 'বকেয়া শিক্ষার্থী',
      value: `${activeClassStats.studentsWithDue} জন`,
      boxClass: 'bg-rose-50/70 border-rose-200',
      textClass: 'text-rose-700 dark:text-rose-400',
    },
    {
      label: 'মোট বকেয়া',
      value: `৳ ${activeClassStats.totalDue.toLocaleString('bn-BD')}`,
      boxClass: 'bg-amber-50/70 border-amber-200',
      textClass: 'text-amber-700 dark:text-amber-400',
    },
    {
      label: 'পরিশোধিত',
      value: `${activeClassStats.studentsPaid} জন`,
      boxClass: 'bg-emerald-50/70 border-emerald-200',
      textClass: 'text-emerald-700 dark:text-emerald-400',
    },
  ];

  return (
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
              {selectedGradeFilter === 'all'
                ? 'সকল শ্রেণি'
                : GRADES_LIST.find((g) => g.id === selectedGradeFilter)?.name || selectedGradeFilter}
            </p>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-slate-700">
            {filteredStudents.length} জন
          </span>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {([
            { val: 'all', label: `সকল (${students.length})` },
            { val: 'has_due', label: 'বকেয়া আছে' },
            { val: 'paid_up', label: 'পরিশোধিত ✓' },
          ] as { val: typeof studentDueFilter; label: string }[]).map((f) => (
            <button
              key={f.val}
              type="button"
              onClick={() => setStudentDueFilter(f.val)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                studentDueFilter === f.val
                  ? f.val === 'has_due'
                    ? 'bg-rose-600 text-white font-bold'
                    : f.val === 'paid_up'
                    ? 'bg-emerald-600 text-white font-bold'
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
          <button
            type="button"
            onClick={() => setSelectedGradeFilter('all')}
            className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
              selectedGradeFilter === 'all'
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            সকল
          </button>
          {GRADES_LIST.map((g) => {
            const cnt = students.filter((s) => s.grade === g.id).length;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGradeFilter(g.id)}
                className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  selectedGradeFilter === g.id
                    ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
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
            onChange={(e) => setFeeSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>

        {/* Active Class Banner */}
        {selectedGradeFilter !== 'all' && (
          <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-900 dark:text-indigo-200">
              {GRADES_LIST.find((g) => g.id === selectedGradeFilter)?.name}: {activeClassStats.totalStudents} জন
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
          ) : (
            filteredStudents.map((st) => {
              const isSelected = selectedStudent?.id === st.id;
              const stipend = isStipendStudent(st);
              const gradeKey = normalizeGradeKey(st.grade);
              const ledger = allStudentLedgers[st.id] || financeService.getStudentFeeLedger(st.id, gradeKey, stipend);
              const totalDue = ledger ? ledger.totalDue : 0;
              const totalPaid = ledger ? ledger.totalPaid : 0;

              return (
                <div
                  key={st.id}
                  onClick={() => onSelectStudent(st)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : totalDue > 0
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      }`}
                    >
                      #{st.roll}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4
                          className={`text-xs font-bold ${
                            isSelected ? 'text-indigo-900 dark:text-white' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {st.name}
                        </h4>
                        {stipend && (
                          <span className="text-[9px] px-1.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-medium">
                            উপবৃত্তি
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {st.grade} ({st.section || 'ক'})
                      </p>
                    </div>
                  </div>
                  <div className="text-right pl-2 shrink-0">
                    {totalDue > 0 ? (
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-[10px] font-black">
                          বকেয়া ৳{totalDue}
                        </span>
                        <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">
                          আদায় ➔
                        </span>
                      </div>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold">
                        পরিশোধিত ✓
                      </span>
                    )}
                    {totalPaid > 0 && totalDue === 0 && (
                      <p className="text-[9px] text-slate-500 mt-0.5">আদায়: ৳{totalPaid}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
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
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                    রোল: #{selectedStudent.roll}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                    শ্রেণি: {selectedStudent.grade} ({selectedStudent.section || 'ক'})
                  </span>
                  {isStipendStudent(selectedStudent) && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                      <span>🎓 উপবৃত্তি শিক্ষার্থী</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  অভিভাবক: {selectedStudent.fatherName || selectedStudent.guardian || 'N/A'} • মোবাইল:{' '}
                  <span className="font-mono">
                    {selectedStudent.mobile || (selectedStudent as StudentFinanceExt).phone || 'N/A'}
                  </span>
                </p>

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
                        onChange={(e) => setStipendStartMonthOverride(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg px-2 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300 outline-none cursor-pointer"
                      >
                        {BANGLA_MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-slate-950 border border-rose-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400">মোট বকেয়া</p>
                  <p className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                    ৳ {selectedStudentLedger.totalDue.toLocaleString('bn-BD')}
                  </p>
                </div>
                <div className="text-right px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-slate-950 border border-emerald-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">পরিশোধিত</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ৳ {selectedStudentLedger.totalPaid.toLocaleString('bn-BD')}
                  </p>
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
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMonths(
                        selectedStudentLedger.months.filter((m) => m.dueAmount > 0).map((m) => m.month)
                      )
                    }
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    সব বকেয়া
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMonths([])}
                    className="text-slate-500 hover:text-slate-700 cursor-pointer font-normal"
                  >
                    মুছুন
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {selectedStudentLedger.months.map((m) => {
                  const isSelected = selectedMonths.includes(m.month);
                  const isPaid = m.status === 'paid';
                  const isPartial = m.status === 'partial';
                  const isWaived = m.status === 'waived';
                  return (
                    <div
                      key={m.month}
                      onClick={() => {
                        if (isPaid || isWaived) return;
                        toggleMonth(m.month);
                      }}
                      className={`p-2.5 rounded-xl border transition-all text-xs select-none cursor-pointer ${
                        isPaid || isWaived
                          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70 cursor-default'
                          : isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-400 shadow-sm'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            disabled={isPaid || isWaived}
                            checked={isSelected || isPaid}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (isPaid || isWaived) return;
                              toggleMonth(m.month);
                            }}
                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer disabled:opacity-60"
                          />
                          <span className="font-bold text-slate-900 dark:text-slate-100">{m.month}</span>
                        </div>
                        {isPaid ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> পেইড
                          </span>
                        ) : isWaived ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">
                            মওকুফ
                          </span>
                        ) : isPartial ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                            আংশিক
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold">
                            বকেয়া
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 border-t border-slate-100 dark:border-slate-900 pt-1">
                        <span>ফি: ৳{m.tuitionAmount}</span>
                        {m.dueAmount > 0 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">বাকি ৳{m.dueAmount}</span>
                        ) : (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">৳{m.paidAmount} জমা</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Opening Arrears Section */}
            {selectedStudentLedger.openingDueRemaining !== undefined &&
              selectedStudentLedger.openingDueRemaining > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(extraFeeSelections['opening_due'])}
                        onChange={(e) =>
                          setExtraFeeSelections({ ...extraFeeSelections, opening_due: e.target.checked })
                        }
                        className="rounded border-amber-400 text-amber-600 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                            পূর্ববর্তী সেশনের বকেয়া (Opening Arrears)
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold">
                            পূর্বে বাকি
                          </span>
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
              <label className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                ২. অন্যান্য ফি (পরীক্ষা, ভর্তি ও সেবা খাত):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS)
                  .filter((s) => s.id !== 'tuition')
                  .map((sector) => {
                    const isChecked = Boolean(extraFeeSelections[sector.id]);
                    const feeObj = selectedStudentLedger.otherFees?.[sector.id];
                    const feeAmount = feeObj
                      ? feeObj.dueAmount
                      : classFees[currentGrade]?.[sector.id] || sector.defAmount;
                    const isAlreadyPaid = Boolean(feeObj && feeObj.dueAmount === 0 && feeObj.paidAmount > 0);
                    return (
                      <label
                        key={sector.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isAlreadyPaid
                            ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 cursor-default opacity-70'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 cursor-pointer shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            disabled={isAlreadyPaid}
                            checked={isChecked}
                            onChange={(e) =>
                              setExtraFeeSelections({ ...extraFeeSelections, [sector.id]: e.target.checked })
                            }
                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-semibold">{sector.name}</span>
                        </div>
                        <div className="text-right">
                          {isAlreadyPaid ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                              পরিশোধিত
                            </span>
                          ) : (
                            <span className="text-xs font-black font-mono text-indigo-700 dark:text-indigo-300">
                              ৳ {feeAmount}
                            </span>
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বিশেষ ছাড় / মওকুফ (টাকা)
                </label>
                <input
                  type="number"
                  min="0"
                  max={currentSubtotal}
                  value={discountAmount || ''}
                  placeholder="০"
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as FeePaymentMethod)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold cursor-pointer"
                >
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
                <input
                  type="text"
                  placeholder={paymentMethod === 'Cash' ? 'অটো-জেনারেটেড' : 'যেমন: TRX92810481'}
                  value={trxIdInput}
                  onChange={(e) => setTrxIdInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
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
                  <button
                    type="button"
                    onClick={() => setPaymentAmountInput(currentNetPayable)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    সম্পূর্ণ (৳{currentNetPayable})
                  </button>
                  {currentNetPayable > 1000 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmountInput(1000)}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 font-bold shadow-2xs cursor-pointer transition-all"
                    >
                      ১০০০৳
                    </button>
                  )}
                  {currentNetPayable > 500 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmountInput(500)}
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 font-bold shadow-2xs cursor-pointer transition-all"
                    >
                      ৫০০৳
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="relative">
                  <span className="absolute left-4 top-3 text-indigo-600 dark:text-indigo-400 font-black text-lg">৳</span>
                  <input
                    type="number"
                    min="0"
                    max={currentNetPayable}
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    placeholder="টাকার অংক লিখুন..."
                    className="w-full bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl pl-9 pr-3 py-2.5 text-xl font-black text-indigo-900 dark:text-emerald-400 font-mono shadow-inner outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
                <div
                  className={`p-3 rounded-2xl border text-xs ${
                    remainingDueAfterThisPay === 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                  }`}
                >
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
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        পরবর্তী কিস্তিতে পরিশোধযোগ্য।
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={onClearSelectedStudent}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
              >
                বাতিল
              </button>
              <div className="flex flex-wrap items-center gap-2">
                {(paymentMethod === 'bKash' || paymentMethod === 'Nagad') && selectedStudent && (
                  <button
                    type="button"
                    disabled={actualPaidAmount <= 0}
                    onClick={async () => {
                      const trx = trxIdInput.trim() || `${paymentMethod.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
                      const res = await paymentGatewayService.verifyAndSettlePayment({
                        provider: paymentMethod as PaymentGatewayProvider,
                        student: selectedStudent,
                        amount: actualPaidAmount,
                        trxId: trx,
                        monthsPaid: selectedMonths,
                        extraFeeIds: Object.keys(extraFeeSelections).filter((k) => extraFeeSelections[k]),
                        collectedBy,
                        discountAmount,
                      });
                      if (!res.success || !res.receipt) {
                        showToast(res.message, 'error');
                        return;
                      }
                      showToast(res.message, 'success');
                      onPaymentHistoryUpdate([res.receipt, ...paymentHistory]);
                      onRefreshAll();
                      onPrintReceipt(res.receipt);
                      onClearSelectedStudent();
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-black shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>গেটওয়ে যাচাই ও সেটেল ({paymentMethod})</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={actualPaidAmount <= 0 && currentNetPayable > 0 && discountAmount === 0}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ফি জমা ও মানি রসিদ তৈরি</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-600 animate-ping" />
                  {selectedGradeFilter === 'all'
                    ? 'সকল শ্রেণির ফি ও বকেয়া আদায় হাব'
                    : `${GRADES_LIST.find((g) => g.id === selectedGradeFilter)?.name} ফি ও বকেয়া আদায় হাব`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">বাম তালিকা থেকে শিক্ষার্থী নির্বাচন করুন।</p>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-slate-700 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>সেশন: ২০২৬</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {kpiCards.map((kpi) => (
                <div key={kpi.label} className={`p-3.5 ${kpi.boxClass} dark:bg-slate-950 rounded-2xl border dark:border-slate-800`}>
                  <span className={`text-[10px] font-bold ${kpi.textClass} block uppercase`}>{kpi.label}</span>
                  <h4 className={`text-lg font-black ${kpi.textClass} mt-1`}>{kpi.value}</h4>
                </div>
              ))}
            </div>

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
                          <td className="p-2.5 font-black text-rose-600 dark:text-rose-400">
                            ৳ {due.toLocaleString('bn-BD')}
                          </td>
                          <td className="p-2.5">
                            <button
                              type="button"
                              onClick={() => onSelectStudent(st)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                            >
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
  );
}
