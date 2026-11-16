'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Printer,
  Search,
  Send,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { StudentFeeLedger, financeService } from '@/services/financeService';
import { Student } from '@/services/studentService';
import { smsService } from '@/services/smsService';
import { auditTrailService } from '@/services/auditTrailService';
import { showToast } from '@/components/ui/ToastProvider';
import {
  AuditLogEntry,
  FinancePrintHeader,
  FinancePrintSignatureBlock,
  MONTHS_LIST,
  PaymentRecord,
  SchoolInfoState,
  StudentFinanceExt,
} from './financeShared';

type ReportsAndLogsSubTab = 'due_report' | 'history' | 'monthly_analysis' | 'audit_log';

interface StudentFeesReportsAndLogsTabsProps {
  feeSubTab: ReportsAndLogsSubTab;
  students: Student[];
  allStudentLedgers: Record<string, StudentFeeLedger>;
  paymentHistory: PaymentRecord[];
  auditLogs: AuditLogEntry[];
  schoolInfo: SchoolInfoState;
  onCollectStudentFromDue: (st: Student) => void;
  onPrintReceipt: (rec: PaymentRecord) => void;
}

const HISTORY_METHODS = ['all', 'Cash', 'bKash', 'Nagad', 'Bank Transfer'] as const;

/** Renders the due report, payment history, monthly analysis, and audit log sub-tabs under Student Fees. */
export function StudentFeesReportsAndLogsTabs({
  feeSubTab,
  students,
  allStudentLedgers,
  paymentHistory,
  auditLogs,
  schoolInfo,
  onCollectStudentFromDue,
  onPrintReceipt,
}: StudentFeesReportsAndLogsTabsProps) {
  const [selectedDueStudentsForSMS, setSelectedDueStudentsForSMS] = useState<string[]>([]);
  const [smsSendingState, setSmsSendingState] = useState<{ isSending: boolean; result?: string }>({
    isSending: false,
  });
  const [paymentHistoryFilter, setPaymentHistoryFilter] = useState<string>('all');
  const [paymentHistorySearch, setPaymentHistorySearch] = useState<string>('');
  const [historyGradeFilter, setHistoryGradeFilter] = useState<string>('all');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');

  const filteredPaymentHistory = useMemo(() => {
    const q = paymentHistorySearch.toLowerCase();
    return paymentHistory.filter((rec) => {
      const matchMethod = paymentHistoryFilter === 'all' || rec.paymentMethod === paymentHistoryFilter;
      const matchSearch =
        q === '' ||
        rec.receiptId.toLowerCase().includes(q) ||
        rec.studentName.toLowerCase().includes(q) ||
        rec.roll.includes(paymentHistorySearch) ||
        (rec.trxId && rec.trxId.toLowerCase().includes(q));
      const matchGrade = historyGradeFilter === 'all' || rec.grade === historyGradeFilter;

      let matchMonth = historyMonthFilter === 'all';
      if (!matchMonth) {
        const targetMonthIdx = MONTHS_LIST.indexOf(historyMonthFilter);
        if (targetMonthIdx >= 0 && rec.date) {
          const d = new Date(rec.date);
          matchMonth = !isNaN(d.getTime()) && d.getMonth() === targetMonthIdx;
        }
      }
      return matchMethod && matchSearch && matchGrade && matchMonth;
    });
  }, [paymentHistory, paymentHistoryFilter, paymentHistorySearch, historyGradeFilter, historyMonthFilter]);

  const handleSendDueSMSBulk = () => {
    if (selectedDueStudentsForSMS.length === 0) {
      showToast('অনুগ্রহ করে অন্তত একজন শিক্ষার্থী নির্বাচন করুন!', 'warning');
      return;
    }

    setSmsSendingState({ isSending: true });
    let count = 0;

    selectedDueStudentsForSMS.forEach((studentId) => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;
      const ledger = allStudentLedgers[studentId];
      const due = ledger ? ledger.totalDue : 0;
      const phone = student.mobile || (student as StudentFinanceExt).phone;

      if (phone && phone !== 'N/A' && phone.length >= 11) {
        try {
          smsService.sendSMS({
            recipient: phone,
            message: `সম্মানিত অভিভাবক, ${schoolInfo.nameBn}-এ আপনার সন্তান ${student.name} (শ্রেণি: ${student.grade}, রোল: ${student.roll})-এর সর্বমোট বকেয়া ৳${due}। দ্রুত বকেয়া পরিশোধের জন্য অনুরোধ করা হলো।`,
            type: 'fee_reminder',
            targetAudience: 'individual',
            recipientName: student.name,
            studentId: student.id,
            class: student.grade,
            roll: String(student.roll),
          });
          count++;
        } catch {
          // Skip failed SMS sends cleanly in bulk mode
        }
      }
    });

    try {
      auditTrailService.addLog({
        action: 'BULK_FEE_REMINDER_SMS',
        performedBy: 'অ্যাডমিন/হিসাব সহকারী',
        targetId: `BULK-${selectedDueStudentsForSMS.length}`,
        details: `${count} জন বকেয়া শিক্ষার্থীর অভিভাবককে বকেয়া তাগাদা SMS পাঠানো হয়েছে।`,
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Non-blocking audit log
    }

    setSmsSendingState({
      isSending: false,
      result: `${count} জন অভিভাবকের মোবাইলে বকেয়া তাগাদা SMS পাঠানো হয়েছে!`,
    });

    setTimeout(() => {
      setSelectedDueStudentsForSMS([]);
      setSmsSendingState({ isSending: false });
    }, 4000);
  };

  if (feeSubTab === 'due_report') {
    const classWiseReport = financeService.getClassWiseDueReport(
      allStudentLedgers,
      students.map((s) => ({
        id: s.id,
        grade: s.grade || '6th',
        name: s.name,
        roll: s.roll,
        section: s.section,
      }))
    );
    const totalAllDue = classWiseReport.reduce((sum, c) => sum + c.totalDue, 0);
    const totalAllStudents = classWiseReport.reduce((sum, c) => sum + c.totalStudents, 0);
    const totalWithDue = classWiseReport.reduce((sum, c) => sum + c.studentsWithDue, 0);

    return (
      <div className="space-y-4">
        <FinancePrintHeader
          schoolInfo={schoolInfo}
          title="শ্রেণিভিত্তিক শিক্ষার্থী ফি বকেয়া বিবরণী ও তলব তালিকা"
          sessionText="২০২৬"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              শ্রেণিভিত্তিক বকেয়া বিবরণী ও তলব তালিকা
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              মোট {totalAllStudents} শিক্ষার্থী • {totalWithDue} জনের বকেয়া আছে • সর্বমোট বকেয়া: ৳
              {totalAllDue.toLocaleString('bn-BD')}
            </p>
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
                <span>
                  {smsSendingState.isSending
                    ? 'পাঠানো হচ্ছে...'
                    : `নির্বাচিত (${selectedDueStudentsForSMS.length} জন) SMS পাঠান`}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
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

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {classWiseReport.map((cls) => (
            <div
              key={cls.grade}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-center shadow-2xs"
            >
              <p className="text-[10px] font-bold text-slate-500 truncate">{cls.gradeName}</p>
              <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-1">
                ৳{Math.round(cls.totalDue / 1000)}K
              </p>
              <p className="text-[10px] text-slate-400">{cls.studentsWithDue} জন বকেয়া</p>
            </div>
          ))}
        </div>

        {classWiseReport
          .filter((c) => c.totalStudents > 0)
          .map((cls) => {
            const dueStudents = cls.students.filter((s) => s.totalDue > 0);
            return (
              <div
                key={cls.grade}
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{cls.gradeName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {cls.totalStudents} জন
                    </span>
                    {cls.studentsWithDue > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold">
                        {cls.studentsWithDue} জন বকেয়া
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500">
                      বিল:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        ৳{cls.totalBilled.toLocaleString('bn-BD')}
                      </strong>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      আদায়: <strong>৳{cls.totalPaid.toLocaleString('bn-BD')}</strong>
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-black">
                      বকেয়া: ৳{cls.totalDue.toLocaleString('bn-BD')}
                    </span>
                  </div>
                </div>

                {dueStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-rose-50 dark:bg-rose-950/20 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <th className="p-2.5 w-8">
                            <input
                              type="checkbox"
                              title="সবাইকে নির্বাচন করুন"
                              onChange={(e) => {
                                const classDueIds = dueStudents.map((s) => s.id);
                                if (e.target.checked) {
                                  setSelectedDueStudentsForSMS(
                                    Array.from(new Set([...selectedDueStudentsForSMS, ...classDueIds]))
                                  );
                                } else {
                                  setSelectedDueStudentsForSMS(
                                    selectedDueStudentsForSMS.filter((id) => !classDueIds.includes(id))
                                  );
                                }
                              }}
                              checked={dueStudents.every((s) => selectedDueStudentsForSMS.includes(s.id))}
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
                        {dueStudents.map((st, idx) => (
                          <tr key={st.id || idx} className="hover:bg-rose-50/30 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="p-2.5">
                              <input
                                type="checkbox"
                                checked={selectedDueStudentsForSMS.includes(st.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDueStudentsForSMS([...selectedDueStudentsForSMS, st.id]);
                                  } else {
                                    setSelectedDueStudentsForSMS(
                                      selectedDueStudentsForSMS.filter((id) => id !== st.id)
                                    );
                                  }
                                }}
                                className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                              />
                            </td>
                            <td className="p-2.5 font-mono font-bold text-slate-600 dark:text-slate-400">#{st.roll}</td>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">{st.name}</td>
                            <td className="p-2.5 text-slate-500">{st.section}</td>
                            <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-bold">
                              ৳{st.totalPaid.toLocaleString('bn-BD')}
                            </td>
                            <td className="p-2.5">
                              <span className="inline-block px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-black text-[11px]">
                                ৳{st.totalDue.toLocaleString('bn-BD')}
                              </span>
                            </td>
                            <td className="p-2.5 text-[10px] text-slate-500 max-w-[160px] truncate">
                              {st.monthsDue.slice(0, 4).join(', ')}
                              {st.monthsDue.length > 4 ? ` +${st.monthsDue.length - 4}` : ''}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  const fullSt = students.find((s) => s.id === st.id);
                                  if (fullSt) onCollectStudentFromDue(fullSt);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer transition-all"
                              >
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
            );
          })}

        <FinancePrintSignatureBlock labels={['আদায়কারী / হিসাব সহকারী', 'হিসাবরক্ষক', 'প্রধান শিক্ষক']} />
      </div>
    );
  }

  if (feeSubTab === 'history') {
    const hasActiveFilter =
      historyGradeFilter !== 'all' ||
      historyMonthFilter !== 'all' ||
      paymentHistoryFilter !== 'all' ||
      paymentHistorySearch !== '';

    return (
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">ফি আদায় রেজিস্টার (Payment History)</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredPaymentHistory.length} টি
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              {HISTORY_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentHistoryFilter(m)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    paymentHistoryFilter === m
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                >
                  {m === 'all' ? 'সব' : m}
                </button>
              ))}
            </div>
            <select
              value={historyGradeFilter}
              onChange={(e) => setHistoryGradeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">🎓 সব শ্রেণি</option>
              <option value="6th">৬ষ্ঠ শ্রেণি</option>
              <option value="7th">৭ম শ্রেণি</option>
              <option value="8th">৮ম শ্রেণি</option>
              <option value="9th">৯ম শ্রেণি</option>
              <option value="10th">১০ম শ্রেণি</option>
            </select>
            <select
              value={historyMonthFilter}
              onChange={(e) => setHistoryMonthFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">📅 সব মাস</option>
              {MONTHS_LIST.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="রসিদ/নাম/TrxID..."
                value={paymentHistorySearch}
                onChange={(e) => setPaymentHistorySearch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
              />
            </div>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={() => {
                  setHistoryGradeFilter('all');
                  setHistoryMonthFilter('all');
                  setPaymentHistoryFilter('all');
                  setPaymentHistorySearch('');
                }}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
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
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500">
                    কোন পেমেন্ট রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredPaymentHistory.map((rec, idx) => (
                  <tr key={rec.receiptId || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{rec.receiptId}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900 dark:text-white">{rec.studentName}</p>
                      <p className="text-[10px] text-slate-400">রোল: #{rec.roll}</p>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {rec.grade} ({rec.section || 'ক'})
                    </td>
                    <td className="p-3 max-w-xs text-[11px] text-slate-500">
                      {rec.feeItems.map((f) => f.name).join(', ')}
                    </td>
                    <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">
                      ৳ {rec.paidAmount.toLocaleString('bn-BD')}
                    </td>
                    <td className="p-3">
                      {rec.dueRemaining && rec.dueRemaining > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                          ৳{rec.dueRemaining} বাকি
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">পরিশোধিত</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.paymentMethod === 'Cash'
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : rec.paymentMethod === 'bKash'
                              ? 'bg-pink-100 dark:bg-pink-500/15 text-pink-700 dark:text-pink-400'
                              : rec.paymentMethod === 'Nagad'
                                ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                : 'bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400'
                        }`}
                      >
                        {rec.paymentMethod}
                      </span>
                      {rec.trxId && <p className="text-[9px] font-mono text-slate-500 mt-0.5">{rec.trxId}</p>}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{rec.date}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => onPrintReceipt(rec)}
                        className="px-2.5 py-1 rounded bg-indigo-100 dark:bg-indigo-600/20 hover:bg-indigo-200 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-500/30 transition-all flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>রসিদ</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (feeSubTab === 'monthly_analysis') {
    const monthlyReport = financeService.getMonthWiseCollectionReport(
      paymentHistory.map((p) => ({
        date: p.date,
        paidAmount: p.paidAmount,
        paymentMethod: p.paymentMethod,
        grade: p.grade,
      }))
    );
    const maxCollected = Math.max(...monthlyReport.map((m) => m.totalCollected), 1);
    const totalYearCollected = monthlyReport.reduce((sum, m) => sum + m.totalCollected, 0);
    const totalTransactions = monthlyReport.reduce((sum, m) => sum + m.transactionCount, 0);
    const currentMonth = new Date().getMonth();

    return (
      <div className="space-y-4">
        <FinancePrintHeader
          schoolInfo={schoolInfo}
          title="মাসওয়ারি ফি আদায় ও বার্ষিক আর্থিক রাজস্ব বিশ্লেষণ প্রতিবেদন"
          sessionText="২০২৬"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-500">বার্ষিক মোট আদায়</p>
            <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ৳ {totalYearCollected.toLocaleString('bn-BD')}
            </h4>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-500">মোট লেনদেন</p>
            <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalTransactions} টি</h4>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-500">গড় মাসিক আদায়</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              ৳ {Math.round(totalYearCollected / 12).toLocaleString('bn-BD')}
            </h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              মাসওয়ারি ফি আদায় বিশ্লেষণ — ২০২৬
            </h3>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট</span>
            </button>
          </div>

          <div className="flex items-end gap-1.5 h-40 mb-2 overflow-x-auto pb-1">
            {monthlyReport.map((m, idx) => {
              const pct = maxCollected > 0 ? (m.totalCollected / maxCollected) * 100 : 0;
              const isCurrentMonth = idx === currentMonth;
              return (
                <div key={m.month} className="flex flex-col items-center gap-1 flex-1 min-w-[32px]">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                    {m.totalCollected > 0 ? `${Math.round(m.totalCollected / 1000)}K` : '—'}
                  </span>
                  <div className="w-full relative" style={{ height: '100px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-lg transition-all ${
                        isCurrentMonth
                          ? 'bg-indigo-600 dark:bg-indigo-500'
                          : m.totalCollected > 0
                            ? 'bg-emerald-500 dark:bg-emerald-600'
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
            {monthlyReport.map((m) => (
              <div
                key={m.month}
                className="flex-1 min-w-[32px] text-center text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate"
              >
                {m.month.substring(0, 3)}
              </div>
            ))}
          </div>

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
                  <tr
                    key={m.month}
                    className={`transition-colors ${m.totalCollected > 0 ? 'hover:bg-emerald-50/30 dark:hover:bg-slate-900/40' : 'opacity-50'}`}
                  >
                    <td
                      className={`p-2.5 font-bold ${
                        idx === currentMonth ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {m.month}
                    </td>
                    <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-mono">
                      {m.cashCollected > 0 ? `৳ ${m.cashCollected.toLocaleString('bn-BD')}` : '—'}
                    </td>
                    <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-mono">
                      {m.digitalCollected > 0 ? `৳ ${m.digitalCollected.toLocaleString('bn-BD')}` : '—'}
                    </td>
                    <td className="p-2.5 font-black text-slate-900 dark:text-white font-mono">
                      {m.totalCollected > 0 ? `৳ ${m.totalCollected.toLocaleString('bn-BD')}` : '—'}
                    </td>
                    <td className="p-2.5 text-slate-500">{m.transactionCount > 0 ? `${m.transactionCount} টি` : '—'}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 dark:bg-slate-950 font-black text-sm border-t-2 border-slate-300 dark:border-slate-700">
                  <td className="p-2.5">মোট বার্ষিক</td>
                  <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-mono">
                    ৳ {monthlyReport.reduce((s, m) => s + m.cashCollected, 0).toLocaleString('bn-BD')}
                  </td>
                  <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-mono">
                    ৳ {monthlyReport.reduce((s, m) => s + m.digitalCollected, 0).toLocaleString('bn-BD')}
                  </td>
                  <td className="p-2.5 text-slate-900 dark:text-white font-mono">
                    ৳ {totalYearCollected.toLocaleString('bn-BD')}
                  </td>
                  <td className="p-2.5 text-slate-600">{totalTransactions} টি</td>
                </tr>
              </tbody>
            </table>
          </div>

          <FinancePrintSignatureBlock labels={['হিসাবরক্ষকের স্বাক্ষর', 'অর্থ কমিটি আহ্বায়ক', 'প্রধান শিক্ষক']} />
        </div>
      </div>
    );
  }

  // feeSubTab === 'audit_log'
  const q = auditSearch.toLowerCase();
  const filteredLogs = auditLogs.filter((log) => {
    if (!q) return true;
    return (
      (log.action && String(log.action).toLowerCase().includes(q)) ||
      (log.performedBy && String(log.performedBy).toLowerCase().includes(q)) ||
      (log.details && String(log.details).toLowerCase().includes(q)) ||
      (log.targetId && String(log.targetId).toLowerCase().includes(q))
    );
  });

  return (
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
            onChange={(e) => setAuditSearch(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
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
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{log.performedBy}</td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{log.targetId || '—'}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300 max-w-md">{log.details}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.severity === 'critical'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : log.severity === 'warning'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      {log.severity || 'info'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
