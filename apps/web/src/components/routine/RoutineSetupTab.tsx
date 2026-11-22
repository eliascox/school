'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Clock,
  Coffee,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  ALL_WEEK_DAYS,
  RoutineDayConfig,
  RoutineDayKey,
  RoutinePeriod,
  routineService,
} from '@/services/routineService';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import { toBanglaDigits } from './routineHelpers';

interface RoutineSetupTabProps {
  periods: RoutinePeriod[];
  days: RoutineDayConfig[];
  onConfigUpdated: () => void;
}

export default function RoutineSetupTab({
  periods,
  days,
  onConfigUpdated,
}: RoutineSetupTabProps) {
  const [draftPeriods, setDraftPeriods] = useState<RoutinePeriod[]>(periods);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newStartTime, setNewStartTime] = useState('০৪:০০ PM');
  const [newEndTime, setNewEndTime] = useState('০৪:৪৫ PM');
  const [newIsBreak, setNewIsBreak] = useState(false);

  const [draftDays, setDraftDays] = useState<RoutineDayConfig[]>(days);
  const [dayToAdd, setDayToAdd] = useState<RoutineDayKey | ''>('');

  useEffect(() => {
    setDraftPeriods(periods);
  }, [periods]);

  useEffect(() => {
    setDraftDays(days);
  }, [days]);

  const missingWeekDays = ALL_WEEK_DAYS.filter(
    (wd) => !draftDays.some((d) => d.key === wd.key)
  );

  // ─── PERIOD HANDLERS ──────────────────────────────────────────────
  const handlePeriodFieldChange = (
    periodNo: number,
    field: 'periodName' | 'startTime' | 'endTime' | 'isBreak',
    value: string | boolean
  ) => {
    setDraftPeriods((prev) =>
      prev.map((p) => (p.periodNo === periodNo ? { ...p, [field]: value } : p))
    );
  };

  const handleMovePeriod = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= draftPeriods.length) return;
    const copy = [...draftPeriods];
    const tmp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = tmp;
    setDraftPeriods(copy);
  };

  const handleSavePeriods = () => {
    const res = routineService.savePeriods(draftPeriods);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) onConfigUpdated();
  };

  const handleAddPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const res = routineService.addPeriod({
      periodName: newPeriodName,
      startTime: newStartTime,
      endTime: newEndTime,
      isBreak: newIsBreak,
    });
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) {
      setNewPeriodName('');
      setNewIsBreak(false);
      onConfigUpdated();
    }
  };

  const handleDeletePeriod = async (p: RoutinePeriod) => {
    if (draftPeriods.length <= 1) {
      showToast('রুটিনে অন্তত একটি পিরিয়ড থাকতে হবে।', 'warning');
      return;
    }
    const ok = await confirmDialog({
      title: 'পিরিয়ড মুছে ফেলবেন?',
      message: `"${p.periodName}" (${p.startTime} – ${p.endTime}) রুটিন কলাম থেকে সরানো হবে।`,
      confirmLabel: 'মুছে ফেলুন',
      danger: true,
    });
    if (!ok) return;
    const res = routineService.deletePeriod(p.periodNo);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) onConfigUpdated();
  };

  const handleResetPeriods = async () => {
    const ok = await confirmDialog({
      title: 'ডিফল্ট পিরিয়ড রিস্টোর',
      message: 'সকল পিরিয়ড ও সময়সূচি পূর্বনির্ধারিত ডিফল্টে (১ম–৭ম পিরিয়ড ও টিফিন বিরতি) ফিরিয়ে আনবেন?',
      confirmLabel: 'রিস্টোর করুন',
    });
    if (!ok) return;
    routineService.resetDefaultPeriods();
    showToast('ডিফল্ট পিরিয়ড ও সময়সূচি রিস্টোর করা হয়েছে।', 'success');
    onConfigUpdated();
  };

  // ─── DAY HANDLERS ─────────────────────────────────────────────────
  const handleAddDay = () => {
    const keyToUse = (dayToAdd || missingWeekDays[0]?.key) as RoutineDayKey | undefined;
    if (!keyToUse) {
      showToast('সপ্তাহের সকল বার ইতোমধ্যে যুক্ত আছে।', 'info');
      return;
    }
    const res = routineService.addDay(keyToUse);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) {
      setDayToAdd('');
      onConfigUpdated();
    }
  };

  const handleDeleteDay = async (d: RoutineDayConfig) => {
    if (draftDays.length <= 1) {
      showToast('অন্তত একটি কার্যদিবস (বার) রাখতে হবে।', 'warning');
      return;
    }
    const ok = await confirmDialog({
      title: 'বার সরিয়ে ফেলবেন?',
      message: `"${d.labelBn}" সাপ্তাহিক রুটিনের তালিকা থেকে বাদ দেওয়া হবে (পরে আবার যোগ করা যাবে)।`,
      confirmLabel: 'সরিয়ে ফেলুন',
      danger: true,
    });
    if (!ok) return;
    const res = routineService.deleteDay(d.key);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) onConfigUpdated();
  };

  const handleMoveDay = (key: RoutineDayKey, direction: 'up' | 'down') => {
    const res = routineService.moveDay(key, direction);
    if (res.success) onConfigUpdated();
  };

  const handleDayLabelChange = (key: RoutineDayKey, labelBn: string) => {
    setDraftDays((prev) => prev.map((d) => (d.key === key ? { ...d, labelBn } : d)));
  };

  const handleSaveDayLabels = () => {
    const res = routineService.saveDays(draftDays);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) onConfigUpdated();
  };

  const handleResetDays = async () => {
    const ok = await confirmDialog({
      title: 'ডিফল্ট বার রিস্টোর',
      message: 'সাপ্তাহিক কার্যদিবস ডিফল্ট (শনিবার – বৃহস্পতিবার) এ ফিরিয়ে আনবেন?',
      confirmLabel: 'রিস্টোর করুন',
    });
    if (!ok) return;
    routineService.resetDefaultDays();
    showToast('ডিফল্ট কার্যদিবস (শনিবার – বৃহস্পতিবার) রিস্টোর হয়েছে।', 'success');
    onConfigUpdated();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* LEFT: DYNAMIC PERIODS & TIMING */}
      <div className="xl:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                ডায়নামিক পিরিয়ড ও সময়সূচি ({toBanglaDigits(draftPeriods.length)}টি)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                প্রতিটি পিরিয়ডের নাম, শুরুর সময়, শেষের সময় ও টিফিন বিরতি কাস্টমাইজ করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetPeriods}
              className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw size={12} /> ডিফল্ট
            </button>
            <button
              type="button"
              onClick={handleSavePeriods}
              className="h-8 px-3 rounded-lg bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <Save size={13} /> পরিবর্তন সংরক্ষণ
            </button>
          </div>
        </div>

        {/* Editable Period Rows */}
        <div className="space-y-2">
          {draftPeriods.map((p, idx) => (
            <div
              key={p.periodNo}
              className={`p-3 rounded-xl border transition grid grid-cols-1 sm:grid-cols-12 gap-2 items-center ${
                p.isBreak
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60'
                  : 'bg-slate-50/60 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="sm:col-span-4">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5 sm:hidden">
                  পিরিয়ডের নাম
                </label>
                <input
                  type="text"
                  value={p.periodName}
                  onChange={(e) =>
                    handlePeriodFieldChange(p.periodNo, 'periodName', e.target.value)
                  }
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5 sm:hidden">
                  শুরু
                </label>
                <input
                  type="text"
                  value={p.startTime}
                  onChange={(e) =>
                    handlePeriodFieldChange(p.periodNo, 'startTime', e.target.value)
                  }
                  placeholder="১০:০০ AM"
                  className="w-full h-9 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-0.5 sm:hidden">
                  শেষ
                </label>
                <input
                  type="text"
                  value={p.endTime}
                  onChange={(e) =>
                    handlePeriodFieldChange(p.periodNo, 'endTime', e.target.value)
                  }
                  placeholder="১০:৪৫ AM"
                  className="w-full h-9 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <div className="sm:col-span-2 flex items-center">
                <button
                  type="button"
                  onClick={() => handlePeriodFieldChange(p.periodNo, 'isBreak', !p.isBreak)}
                  className={`w-full h-9 px-2 rounded-lg text-[11px] font-bold border inline-flex items-center justify-center gap-1 cursor-pointer transition ${
                    p.isBreak
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-800'
                  }`}
                  title="টিফিন / বিরতি হিসেবে চিহ্নিত করুন"
                >
                  <Coffee size={12} />
                  <span>{p.isBreak ? 'বিরতি' : 'ক্লাস'}</span>
                </button>
              </div>

              <div className="sm:col-span-2 flex items-center justify-end gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMovePeriod(idx, 'up')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  title="উপরে নিন"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  disabled={idx === draftPeriods.length - 1}
                  onClick={() => handleMovePeriod(idx, 'down')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  title="নিচে নিন"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  disabled={draftPeriods.length <= 1}
                  onClick={() => handleDeletePeriod(p)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-30 cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Period Form */}
        <form
          onSubmit={handleAddPeriod}
          className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5"
        >
          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
            নতুন পিরিয়ড বা বিরতি যোগ করুন
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <input
              type="text"
              required
              value={newPeriodName}
              onChange={(e) => setNewPeriodName(e.target.value)}
              placeholder="যেমন: ৮ম পিরিয়ড / নামাজ বিরতি"
              className="sm:col-span-4 h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
            />
            <input
              type="text"
              required
              value={newStartTime}
              onChange={(e) => setNewStartTime(e.target.value)}
              placeholder="শুরু (০৪:০০ PM)"
              className="sm:col-span-2 h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
            />
            <input
              type="text"
              required
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              placeholder="শেষ (০৪:৪৫ PM)"
              className="sm:col-span-2 h-9 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
            />
            <label className="sm:col-span-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer px-1">
              <input
                type="checkbox"
                checked={newIsBreak}
                onChange={(e) => setNewIsBreak(e.target.checked)}
                className="rounded border-slate-300 text-[#0B5D3B]"
              />
              <span>বিরতি</span>
            </label>
            <button
              type="submit"
              className="sm:col-span-2 h-9 px-3 rounded-lg bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition"
            >
              <Plus size={13} /> যোগ
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT: DYNAMIC WEEK DAYS MANAGEMENT */}
      <div className="xl:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400">
              <CalendarDays size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                সাপ্তাহিক বার ব্যবস্থাপনা ({toBanglaDigits(draftDays.length)} দিন)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                বার যোগ, ডিলিট বা ক্রম পরিবর্তন করুন (যেমন: রবি–বৃহঃ বা শনি–বৃহঃ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDays}
              className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw size={12} /> ডিফল্ট
            </button>
            <button
              type="button"
              onClick={handleSaveDayLabels}
              className="h-8 px-3 rounded-lg bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <Save size={13} /> সংরক্ষণ
            </button>
          </div>
        </div>

        {/* Active Days List */}
        <div className="space-y-2">
          {draftDays.map((d, idx) => (
            <div
              key={d.key}
              className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-6 h-6 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                  {toBanglaDigits(idx + 1)}
                </span>
                <input
                  type="text"
                  value={d.labelBn}
                  onChange={(e) => handleDayLabelChange(d.key, e.target.value)}
                  className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B] flex-1 min-w-0"
                />
                <span className="text-[10px] font-mono text-slate-400 shrink-0 hidden sm:inline">
                  {d.key}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveDay(d.key, 'up')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  title="উপরে নিন"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  disabled={idx === draftDays.length - 1}
                  onClick={() => handleMoveDay(d.key, 'down')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  title="নিচে নিন"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  disabled={draftDays.length <= 1}
                  onClick={() => handleDeleteDay(d)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-30 cursor-pointer"
                  title="বার বাদ দিন"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Day Panel */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
            নতুন বার যোগ করুন
          </p>
          {missingWeekDays.length === 0 ? (
            <p className="text-[11px] text-slate-400 font-medium">
              সপ্তাহের সকল ৭টি বার ইতোমধ্যে রুটিনে যুক্ত আছে।
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={dayToAdd || missingWeekDays[0]?.key || ''}
                onChange={(e) => setDayToAdd(e.target.value as RoutineDayKey)}
                className="flex-1 h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
              >
                {missingWeekDays.map((wd) => (
                  <option key={wd.key} value={wd.key}>
                    {wd.labelBn} ({wd.key})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddDay}
                className="h-9 px-3.5 rounded-lg bg-[#0B5D3B] hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
              >
                <Plus size={13} /> বার যোগ
              </button>
            </div>
          )}

          {/* Quick Preset: Sun-Thu */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const sunThu = ALL_WEEK_DAYS.filter((d) =>
                  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].includes(d.key)
                );
                const res = routineService.saveDays(sunThu);
                showToast('রবিবার থেকে বৃহস্পতিবার (৫ দিন) সেট করা হয়েছে।', res.success ? 'success' : 'error');
                if (res.success) onConfigUpdated();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold cursor-pointer transition"
            >
              কুইক প্রিসেট: রবি – বৃহঃ (৫ দিন)
            </button>
            <button
              type="button"
              onClick={() => {
                const satThu = ALL_WEEK_DAYS.filter((d) => d.key !== 'Friday');
                const res = routineService.saveDays(satThu);
                showToast('শনিবার থেকে বৃহস্পতিবার (৬ দিন) সেট করা হয়েছে।', res.success ? 'success' : 'error');
                if (res.success) onConfigUpdated();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold cursor-pointer transition"
            >
              কুইক প্রিসেট: শনি – বৃহঃ (৬ দিন)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
