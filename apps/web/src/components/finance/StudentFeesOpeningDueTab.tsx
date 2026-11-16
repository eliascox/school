'use client';

import React, { useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Clock, Search, Users } from 'lucide-react';
import {
  BANGLA_MONTHS,
  FinanceSettings,
  GRADES_LIST,
  StudentFeeLedger,
  financeService,
  normalizeGradeKey,
} from '@/services/financeService';
import { Student } from '@/services/studentService';
import { showToast } from '@/components/ui/ToastProvider';

interface StudentFeesOpeningDueTabProps {
  students: Student[];
  allStudentLedgers: Record<string, StudentFeeLedger>;
  financeSettings: FinanceSettings;
  goLiveStartYear: number;
  onGoLiveStartYearChange: (year: number) => void;
  onRefreshAll: () => void;
}

export function StudentFeesOpeningDueTab({
  students,
  allStudentLedgers,
  financeSettings,
  goLiveStartYear,
  onGoLiveStartYearChange,
  onRefreshAll,
}: StudentFeesOpeningDueTabProps) {
  const [goLiveStartMonth, setGoLiveStartMonth] = useState<string>(financeSettings.systemStartMonth || 'জানুয়ারি');
  const [goLivePreStartMode, setGoLivePreStartMode] = useState<'settled' | 'waived' | 'due'>(
    financeSettings.preStartMonthsAction || 'settled'
  );
  const [openingDueSearch, setOpeningDueSearch] = useState<string>('');
  const [openingDueGradeFilter, setOpeningDueGradeFilter] = useState<string>('all');
  const [openingDueInputs, setOpeningDueInputs] = useState<Record<string, number | string>>({});
  const [openingDueNotes, setOpeningDueNotes] = useState<Record<string, string>>({});
  const [goLiveAlert, setGoLiveAlert] = useState<string | null>(null);

  const handleGoLiveApply = () => {
    try {
      financeService.applySoftwareStartMonth(
        goLiveStartMonth,
        Number(goLiveStartYear) || 2026,
        goLivePreStartMode
      );
      onRefreshAll();
      setGoLiveAlert(`সফটওয়্যার শুরুর মাস '${goLiveStartMonth} ${goLiveStartYear}' সফলভাবে সমন্বয় ও কার্যকর করা হয়েছে!`);
      setTimeout(() => setGoLiveAlert(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      showToast('সফটওয়্যার শুরুর মাস সমন্বয় করতে সমস্যা হয়েছে: ' + msg, 'error');
    }
  };

  const handleSaveOpeningDue = (studentId: string) => {
    const rawAmt = openingDueInputs[studentId];
    if (rawAmt === undefined || rawAmt === '') {
      showToast('অনুগ্রহ করে পূর্ববর্তী বকেয়ার সঠিক টাকার পরিমাণ লিখুন!', 'warning');
      return;
    }
    const amount = Number(rawAmt);
    if (isNaN(amount) || amount < 0) {
      showToast('টাকার পরিমাণ ০ বা তদুর্ধ্ব হতে হবে!', 'warning');
      return;
    }
    const note = openingDueNotes[studentId] || 'সফটওয়্যার শুরুর পূর্বে পূর্ববর্তী বকেয়া';
    financeService.setStudentOpeningDue(studentId, amount, note, 'অ্যাডমিন');
    onRefreshAll();
    showToast(`শিক্ষার্থীর পূর্ববর্তী বকেয়া (৳${amount}) সফলভাবে সংরক্ষণ করা হয়েছে!`, 'success');
  };

  const displayedStudents = students.filter((s) => {
    const matchGrade = openingDueGradeFilter === 'all' || s.grade === openingDueGradeFilter;
    const matchSearch =
      !openingDueSearch ||
      s.name.toLowerCase().includes(openingDueSearch.toLowerCase()) ||
      s.roll.toString().includes(openingDueSearch);
    return matchGrade && matchSearch;
  });

  return (
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
            যদি আপনার বিদ্যালয় সেপ্টেম্বর মাস থেকে এই সফটওয়্যারে হিসাব শুরু করে, তবে শুরুর মাস হিসেবে{' '}
            <strong>&apos;সেপ্টেম্বর&apos;</strong> নির্বাচন করুন এবং প্রাক-মাস ব্যবস্থা হিসেবে{' '}
            <strong>&apos;স্বয়ংক্রিয় পরিশোধিত&apos;</strong> রাখুন। এর ফলে জানুয়ারি থেকে আগস্ট পর্যন্ত শিক্ষার্থীদের ওপর কোনো কৃত্রিম বা ভুয়া বকেয়া চাপবে না। শুধুমাত্র সেপ্টেম্বর মাস থেকে যথারীতি নতুন বিলিং ও ইনভয়েস প্রযোজ্য হবে।
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              সফটওয়্যার চালুর মাস (Start Month) *
            </label>
            <select
              value={goLiveStartMonth}
              onChange={(e) => setGoLiveStartMonth(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {BANGLA_MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
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
              onChange={(e) => onGoLiveStartYearChange(Number(e.target.value) || 2026)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              শুরুর পূর্বের মাসসমূহের ব্যবস্থা *
            </label>
            <select
              value={goLivePreStartMode}
              onChange={(e) => setGoLivePreStartMode(e.target.value as 'settled' | 'waived' | 'due')}
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
              onChange={(e) => setOpeningDueGradeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer font-medium"
            >
              <option value="all">🎓 সকল শ্রেণি</option>
              {GRADES_LIST.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="নাম / রোল দিয়ে খুঁজুন..."
                value={openingDueSearch}
                onChange={(e) => setOpeningDueSearch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
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
                displayedStudents.map((st) => {
                  const ledger =
                    allStudentLedgers[st.id] || financeService.getStudentFeeLedger(st.id, normalizeGradeKey(st.grade));
                  const currentOpenDue = ledger.openingDue || 0;
                  const currentOpenPaid = ledger.openingDuePaid || 0;
                  const currentOpenRem =
                    ledger.openingDueRemaining !== undefined
                      ? ledger.openingDueRemaining
                      : Math.max(0, currentOpenDue - currentOpenPaid);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">#{st.roll}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{st.name}</td>
                      <td className="p-3 text-slate-500">
                        {st.grade} ({st.section || 'ক'})
                      </td>
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
                          onChange={(e) => setOpeningDueInputs({ ...openingDueInputs, [st.id]: e.target.value })}
                          className="w-28 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder={ledger.openingDueNote || 'যেমন: পূর্ববর্তী বছরের বকেয়া'}
                          value={openingDueNotes[st.id] !== undefined ? openingDueNotes[st.id] : ''}
                          onChange={(e) => setOpeningDueNotes({ ...openingDueNotes, [st.id]: e.target.value })}
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
        </div>
      </div>
    </div>
  );
}
