'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  CheckSquare,
  Layers,
  Plus,
  PlusCircle,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  DEFAULT_CLASS_FEES_CONFIG,
  DEFAULT_FEE_SECTORS,
  FeeSector,
  GRADES_LIST,
  financeService,
  normalizeGradeKey,
} from '@/services/financeService';
import { Student } from '@/services/studentService';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';

type FeeFrequency = 'monthly' | 'yearly' | 'one_time' | 'per_exam' | 'on_demand';
type FeeCategory = 'tuition' | 'admission' | 'exam' | 'facility' | 'board' | 'event' | 'service' | 'other';
type SetupSubView = 'matrix' | 'new_fee' | 'directory';

interface StudentFeesSetupTabProps {
  students: Student[];
  classFees: { [grade: string]: { [secId: string]: number } };
  feeSectors: FeeSector[];
  onRefreshAll: () => void;
}

export function StudentFeesSetupTab({
  students,
  classFees,
  feeSectors,
  onRefreshAll,
}: StudentFeesSetupTabProps) {
  const [feeSetupSubView, setFeeSetupSubView] = useState<SetupSubView>('matrix');
  const [feeSetupClassFilter, setFeeSetupClassFilter] = useState<string>('all');
  const [feeSetupSearchQuery, setFeeSetupSearchQuery] = useState<string>('');
  const [classRateSavedToast, setClassRateSavedToast] = useState<string | null>(null);
  const [bulkSectorId, setBulkSectorId] = useState<string>('tuition');
  const [bulkAmountInput, setBulkAmountInput] = useState<string>('');

  const [classQuickAddModal, setClassQuickAddModal] = useState<{
    isOpen: boolean;
    gradeId: string;
    gradeName: string;
    selectedSectorId: string;
    customAmount: number;
    isCreatingNewSector: boolean;
    newSectorName: string;
    newSectorAccountCode: string;
    newSectorFrequency: FeeFrequency;
  }>({
    isOpen: false,
    gradeId: '',
    gradeName: '',
    selectedSectorId: '',
    customAmount: 200,
    isCreatingNewSector: false,
    newSectorName: '',
    newSectorAccountCode: '4060',
    newSectorFrequency: 'yearly',
  });

  const [newSectorForm, setNewSectorForm] = useState<{
    name: string;
    nameEn: string;
    id: string;
    defAmount: number;
    description: string;
    accountCode: string;
    frequency: FeeFrequency;
    applicableClasses: string[];
    category: FeeCategory;
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
    classRates: { '6th': 200, '7th': 200, '8th': 200, '9th': 200, '10th': 200 },
  });

  const handleUpdateSingleClassFee = (gradeId: string, sectorId: string, amount: number) => {
    financeService.setSingleClassFeeRate(gradeId, sectorId, amount);
    onRefreshAll();
    setClassRateSavedToast(`সংরক্ষিত: ৳${amount}`);
    setTimeout(() => setClassRateSavedToast(null), 2500);
  };

  const handleApplySectorRateToAll = (sectorId: string, amount: number, sectorName: string) => {
    if (isNaN(amount) || amount < 0) {
      showToast('সঠিক টাকার পরিমাণ লিখুন!', 'warning');
      return;
    }
    financeService.applyFeeRateToAllClasses(sectorId, amount);
    onRefreshAll();
    showToast(`'${sectorName}' সফলভাবে সকল শ্রেণিতে ৳${amount} টাকা নির্ধারণ করা হয়েছে!`, 'success');
  };

  const handleRemoveClassFee = async (gradeId: string, sectorId: string, sectorName: string) => {
    if (
      await confirmDialog({
        title: 'ফি খাত সরান',
        message: `এই শ্রেণি থেকে '${sectorName}' ফি খাতটি কি সরাতে চান?`,
        confirmLabel: 'সরিয়ে ফেলুন',
        danger: true,
      })
    ) {
      financeService.removeClassFeeFromGrade(gradeId, sectorId);
      onRefreshAll();
    }
  };

  const handleQuickAddClassFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const {
      gradeId,
      isCreatingNewSector,
      selectedSectorId,
      customAmount,
      newSectorName,
      newSectorAccountCode,
      newSectorFrequency,
    } = classQuickAddModal;

    if (customAmount < 0 || isNaN(customAmount)) {
      showToast('সঠিক টাকার পরিমাণ লিখুন!', 'warning');
      return;
    }

    if (isCreatingNewSector) {
      if (!newSectorName.trim()) {
        showToast('ফি খাতের নাম লিখুন!', 'warning');
        return;
      }
      financeService.addClassFeeHead({
        name: newSectorName.trim(),
        defAmount: customAmount,
        accountCode: newSectorAccountCode,
        frequency: newSectorFrequency,
        applicableClasses: [gradeId],
        classRates: { [gradeId]: customAmount },
      });
      onRefreshAll();
      showToast(`'${newSectorName}' সফলভাবে তৈরি করে ${classQuickAddModal.gradeName}-এ যোগ করা হয়েছে!`, 'success');
    } else {
      if (!selectedSectorId) {
        showToast('ফি খাত নির্বাচন করুন!', 'warning');
        return;
      }
      financeService.setSingleClassFeeRate(gradeId, selectedSectorId, customAmount);
      onRefreshAll();
      const sName = feeSectors.find((s) => s.id === selectedSectorId)?.name || selectedSectorId;
      showToast(`'${sName}' (৳${customAmount}) সফলভাবে ${classQuickAddModal.gradeName}-এ যোগ করা হয়েছে!`, 'success');
    }

    setClassQuickAddModal((prev) => ({ ...prev, isOpen: false, newSectorName: '', customAmount: 200 }));
  };

  const handleAddNewSectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorForm.name.trim()) {
      showToast('ফি খাতের নাম লিখুন!', 'warning');
      return;
    }

    const {
      name,
      id,
      defAmount,
      description,
      accountCode,
      frequency,
      applicableClasses,
      category,
      isSameRateForAll,
      classRates,
    } = newSectorForm;

    const rates: { [grade: string]: number } = {};
    applicableClasses.forEach((g) => {
      rates[g] = isSameRateForAll ? defAmount : classRates[g] !== undefined ? classRates[g] : defAmount;
    });

    financeService.addClassFeeHead({
      name: name.trim(),
      id: id.trim() || undefined,
      defAmount: Number(defAmount) || 0,
      description: description.trim() || `${name.trim()} বাবদ ফি`,
      accountCode,
      frequency,
      applicableClasses,
      category,
      classRates: rates,
    });

    onRefreshAll();
    showToast(`'${name.trim()}' ফি খাত সফলভাবে তৈরি ও নির্ধারিত শ্রেণিসমূহে কার্যকর করা হয়েছে!`, 'success');
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
      classRates: { '6th': 200, '7th': 200, '8th': 200, '9th': 200, '10th': 200 },
    });
    setFeeSetupSubView('matrix');
  };

  const handleDeleteFeeSector = async (sectorId: string, sectorName: string) => {
    if (
      await confirmDialog({
        title: 'ফি খাত মুছে ফেলুন',
        message: `'${sectorName}' ফি খাতটি কি নিশ্চিতভাবে মুছে ফেলতে চান?`,
        confirmLabel: 'মুছে ফেলুন',
        danger: true,
      })
    ) {
      try {
        financeService.deleteFeeSector(sectorId);
        onRefreshAll();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'খাতটি মুছে ফেলা সম্ভব হয়নি';
        showToast(msg, 'error');
      }
    }
  };

  const handleResetClassFeesToDefault = async () => {
    if (
      await confirmDialog({
        title: 'ফি কাঠামো রিসেট',
        message: 'আপনি কি সকল শ্রেণির ফি কাঠামো সিস্টেমের মূল ডিফল্ট মানে রিসেট করতে চান?',
        confirmLabel: 'রিসেট করুন',
        danger: true,
      })
    ) {
      financeService.resetClassFeesToDefault();
      onRefreshAll();
      showToast('সকল শ্রেণির ফি কাঠামো সফলভাবে ডিফল্ট মানে রিসেট করা হয়েছে!', 'success');
    }
  };

  const sectors = feeSectors.length > 0 ? feeSectors : DEFAULT_FEE_SECTORS;

  return (
    <div className="space-y-5">
      {/* Header Banner & Quick Actions */}
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
            <h4 className="text-lg font-black font-mono text-white mt-0.5">{sectors.length} টি খাত</h4>
            <p className="text-[10px] text-slate-400">সক্রিয় সেবা ও অ্যাকাডেমিক</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-indigo-700/30">
            <span className="text-[10px] text-indigo-300 font-bold block uppercase tracking-wider">শ্রেণি কভারেজ</span>
            <h4 className="text-lg font-black text-white mt-0.5">৬ষ্ঠ - ১০ম শ্রেণি</h4>
            <p className="text-[10px] text-slate-400">৫টি স্বতন্ত্র শ্রেণি কাঠামো</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-indigo-700/30">
            <span className="text-[10px] text-indigo-300 font-bold block uppercase tracking-wider">মাসিক টিউশন রেঞ্জ</span>
            <h4 className="text-lg font-black font-mono text-emerald-400 mt-0.5">৳ ৪০০ - ৳ ৬০০</h4>
            <p className="text-[10px] text-slate-400">শ্রেণিভেদে নির্ধারিত</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xs rounded-xl p-3 border border-indigo-700/30">
            <span className="text-[10px] text-indigo-300 font-bold block uppercase tracking-wider">খতিয়ান ম্যাপিং</span>
            <h4 className="text-lg font-black text-indigo-300 mt-0.5">১০০% অটো ম্যাপড</h4>
            <p className="text-[10px] text-slate-400">COA রেভিনিউ হেড ৪০০০+</p>
          </div>
        </div>
      </div>

      {classRateSavedToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            ফি কাঠামো সফলভাবে আপডেট ও শিক্ষার্থী লেজারে সিঙ্ক হয়েছে! ({classRateSavedToast})
          </span>
          <button type="button" onClick={() => setClassRateSavedToast(null)} className="text-white/80 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sub-views Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {([
            { id: 'matrix', label: '১. শ্রেণিভিত্তিক নির্ধারিত ফি মেট্রিক্স ও হার', icon: Layers },
            { id: 'new_fee', label: '২. নতুন ফি খাত যোগ ও শ্রেণিভিত্তিক রেট', icon: PlusCircle },
            { id: 'directory', label: '৩. সকল ফি খাতের ডিরেক্টরি ও নিয়ন্ত্রণ', icon: BookOpen },
          ] as { id: SetupSubView; label: string; icon: React.ComponentType<{ className?: string }> }[]).map((tab) => {
            const Icon = tab.icon;
            const isActive = feeSetupSubView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFeeSetupSubView(tab.id)}
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
              onChange={(e) => setFeeSetupClassFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="all">সকল শ্রেণি (৬ষ্ঠ - ১০ম)</option>
              {GRADES_LIST.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
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
              onChange={(e) => setFeeSetupSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* VIEW 1: CLASS-WISE FEE MATRIX */}
      {feeSetupSubView === 'matrix' && (
        <div className="space-y-4">
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
                  value={bulkSectorId}
                  onChange={(e) => setBulkSectorId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="tuition">📚 মাসিক বেতন (Tuition Fee)</option>
                  <option value="admission">🎓 ভর্তি ও সেশন ফি (Admission Fee)</option>
                  <option value="exam">📝 পরীক্ষা ফি (Exam Fee)</option>
                  {sectors
                    .filter((s) => !['tuition', 'admission', 'exam'].includes(s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        🏷️ {s.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="sm:col-span-4 relative">
                <span className="absolute left-3 top-2 text-xs font-black text-indigo-600 dark:text-indigo-400">৳</span>
                <input
                  type="number"
                  value={bulkAmountInput}
                  onChange={(e) => setBulkAmountInput(e.target.value)}
                  placeholder="টাকার পরিমাণ (যেমন: ৫০০)"
                  className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={() => {
                    const amt = Number(bulkAmountInput);
                    const sName = sectors.find((s) => s.id === bulkSectorId)?.name || bulkSectorId;
                    handleApplySectorRateToAll(bulkSectorId, amt, sName);
                    setBulkAmountInput('');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                >
                  <span>সকল ক্লাসে প্রয়োগ ➔</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {GRADES_LIST.filter((g) => feeSetupClassFilter === 'all' || g.id === feeSetupClassFilter).map((g) => {
              const fees = classFees[g.id] || DEFAULT_CLASS_FEES_CONFIG[g.id] || {};

              const tuitionVal =
                fees.tuition !== undefined ? fees.tuition : DEFAULT_CLASS_FEES_CONFIG[g.id]?.tuition || 400;
              const admissionVal =
                fees.admission !== undefined ? fees.admission : DEFAULT_CLASS_FEES_CONFIG[g.id]?.admission || 1500;
              const examVal = fees.exam !== undefined ? fees.exam : DEFAULT_CLASS_FEES_CONFIG[g.id]?.exam || 300;
              const classStudentsCount = students.filter((s) => normalizeGradeKey(s.grade) === g.id).length;

              const annualTuition = tuitionVal * 12;
              const annualExams = examVal * 2;
              const otherTotal = sectors
                .filter((s) => !['tuition', 'admission', 'exam'].includes(s.id))
                .filter((s) => !s.applicableClasses || s.applicableClasses.includes(g.id))
                .reduce((sum, s) => sum + (fees[s.id] !== undefined ? fees[s.id] : s.defAmount), 0);
              const approxAnnualTotal = annualTuition + admissionVal + annualExams + otherTotal;

              return (
                <div
                  key={g.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
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
                          শিক্ষার্থীপ্রতি আনুমানিক বার্ষিক মোট ফি:{' '}
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            ৳ {approxAnnualTotal.toLocaleString('bn-BD')}
                          </span>
                        </p>
                      </div>
                    </div>

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
                          newSectorFrequency: 'yearly',
                        });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ এই শ্রেণিতে নতুন ফি যুক্ত করুন</span>
                    </button>
                  </div>

                  {/* 3 Core Primary Fees */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      মূল অ্যাকাডেমিক ও আবশ্যিক ফি:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between gap-2 shadow-2xs">
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white block">📚 মাসিক বেতন</span>
                          <button
                            type="button"
                            onClick={() => handleApplySectorRateToAll('tuition', tuitionVal, 'মাসিক বেতন')}
                            className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
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
                            onChange={(e) => handleUpdateSingleClassFee(g.id, 'tuition', Number(e.target.value) || 0)}
                            className="w-18 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-black text-indigo-700 dark:text-indigo-300 text-right outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border-2 border-purple-200 dark:border-purple-900/60 flex items-center justify-between gap-2 shadow-2xs">
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white block">🎓 ভর্তি ও সেশন ফি</span>
                          <button
                            type="button"
                            onClick={() => handleApplySectorRateToAll('admission', admissionVal, 'ভর্তি ও সেশন ফি')}
                            className="text-[9px] text-purple-600 dark:text-purple-400 hover:underline font-bold cursor-pointer"
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
                            onChange={(e) => handleUpdateSingleClassFee(g.id, 'admission', Number(e.target.value) || 0)}
                            className="w-18 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-black text-purple-700 dark:text-purple-300 text-right outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 shadow-2xs">
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white block">📝 পরীক্ষা ফি</span>
                          <button
                            type="button"
                            onClick={() => handleApplySectorRateToAll('exam', examVal, 'পরীক্ষা ফি')}
                            className="text-[9px] text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
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
                            onChange={(e) => handleUpdateSingleClassFee(g.id, 'exam', Number(e.target.value) || 0)}
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
                      {sectors
                        .filter((s) => !['tuition', 'admission', 'exam'].includes(s.id))
                        .filter((s) => !s.applicableClasses || s.applicableClasses.includes(g.id))
                        .map((s) => {
                          const val = fees[s.id] !== undefined ? fees[s.id] : s.defAmount;
                          const freqBn =
                            s.frequency === 'monthly'
                              ? 'মাসিক'
                              : s.frequency === 'one_time'
                              ? 'এককালীন'
                              : s.frequency === 'per_exam'
                              ? 'পরীক্ষাকালীন'
                              : s.frequency === 'on_demand'
                              ? 'প্রয়োজনবোধে'
                              : 'বাৎসরিক';

                          return (
                            <div
                              key={s.id}
                              className="p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-300 transition-colors group"
                            >
                              <div className="min-w-0">
                                <span
                                  className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block"
                                  title={s.name}
                                >
                                  {s.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-900/60">
                                    {freqBn}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleApplySectorRateToAll(s.id, val, s.name)}
                                    className="text-[9px] text-slate-400 hover:text-indigo-600 font-bold cursor-pointer"
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
                                  onChange={(e) => handleUpdateSingleClassFee(g.id, s.id, Number(e.target.value) || 0)}
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

      {/* VIEW 2: ADD NEW FEE HEAD & CLASS RATES */}
      {feeSetupSubView === 'new_fee' && (
        <form
          onSubmit={handleAddNewSectorSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                নতুন ফি খাত সৃষ্টি ও শ্রেণিভিত্তিক রেট নির্ধারণ
              </h3>
              <p className="text-xs text-slate-500">
                যেমন: বিজ্ঞানাগার/প্র্যাকটিক্যাল ফি, আইসিটি ল্যাব ফি, মডেল টেস্ট ফি, কোচিং ফি, রেডক্রিসেন্ট ও স্কাউট ফি
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ফি খাতের নাম (বাংলা) *
              </label>
              <input
                type="text"
                placeholder="যেমন: বিজ্ঞানাগার ও প্র্যাকটিক্যাল ফি"
                value={newSectorForm.name}
                onChange={(e) => setNewSectorForm({ ...newSectorForm, name: e.target.value })}
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
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  const updatedRates = { ...newSectorForm.classRates };
                  GRADES_LIST.forEach((g) => {
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
                onChange={(e) => setNewSectorForm({ ...newSectorForm, accountCode: e.target.value })}
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
                onChange={(e) => setNewSectorForm({ ...newSectorForm, frequency: e.target.value as FeeFrequency })}
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
                onChange={(e) => setNewSectorForm({ ...newSectorForm, category: e.target.value as FeeCategory })}
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
                onChange={(e) => setNewSectorForm({ ...newSectorForm, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

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
                    setNewSectorForm({ ...newSectorForm, applicableClasses: GRADES_LIST.map((g) => g.id) });
                  }
                }}
                className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                {newSectorForm.applicableClasses.length === GRADES_LIST.length
                  ? 'সবগুলো আনচেক করুন'
                  : 'সকল শ্রেণি সিলেক্ট করুন'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {GRADES_LIST.map((g) => {
                const isSelected = newSectorForm.applicableClasses.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      const next = isSelected
                        ? newSectorForm.applicableClasses.filter((x) => x !== g.id)
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

              <button
                type="button"
                onClick={() => {
                  const next = !newSectorForm.isSameRateForAll;
                  const updated = { ...newSectorForm.classRates };
                  if (next) {
                    GRADES_LIST.forEach((g) => {
                      updated[g.id] = newSectorForm.defAmount;
                    });
                  }
                  setNewSectorForm({ ...newSectorForm, isSameRateForAll: next, classRates: updated });
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  newSectorForm.isSameRateForAll
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {newSectorForm.isSameRateForAll
                  ? `✓ সব ক্লাসে একই রেট (৳${newSectorForm.defAmount})`
                  : 'শ্রেণিভেদে আলাদা রেট মোড'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {GRADES_LIST.map((g) => {
                const isApplicable = newSectorForm.applicableClasses.includes(g.id);
                const amt =
                  newSectorForm.classRates[g.id] !== undefined
                    ? newSectorForm.classRates[g.id]
                    : newSectorForm.defAmount;

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
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setNewSectorForm({
                            ...newSectorForm,
                            classRates: { ...newSectorForm.classRates, [g.id]: val },
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

      {/* VIEW 3: ALL FEE HEADS DIRECTORY */}
      {feeSetupSubView === 'directory' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">বিদ্যমান ফি খাতের পূর্ণাঙ্গ ডিরেক্টরি</h3>
              <p className="text-[11px] text-slate-400">প্রতিটি খাতের নাম, ডিফল্ট রেট, খতিয়ান কোড এবং শ্রেণি কভারেজ</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300">
              মোট {sectors.length} টি খাত
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sectors
              .filter((s) => {
                if (!feeSetupSearchQuery) return true;
                const q = feeSetupSearchQuery.toLowerCase();
                return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.accountCode || '').includes(q);
              })
              .map((s) => {
                const freqBn =
                  s.frequency === 'monthly'
                    ? 'মাসিক'
                    : s.frequency === 'one_time'
                    ? 'এককালীন'
                    : s.frequency === 'per_exam'
                    ? 'পরীক্ষাকালীন'
                    : s.frequency === 'on_demand'
                    ? 'প্রয়োজন সাপেক্ষে'
                    : 'বাৎসরিক';

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

      {/* QUICK MODAL: ADD FEE SPECIFICALLY TO A CLASS */}
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
                onClick={() => setClassQuickAddModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setClassQuickAddModal((prev) => ({ ...prev, isCreatingNewSector: false }))}
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
                onClick={() => setClassQuickAddModal((prev) => ({ ...prev, isCreatingNewSector: true }))}
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
                    onChange={(e) => {
                      const secId = e.target.value;
                      const sec = feeSectors.find((s) => s.id === secId);
                      setClassQuickAddModal((prev) => ({
                        ...prev,
                        selectedSectorId: secId,
                        customAmount: sec ? sec.defAmount : prev.customAmount,
                      }));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- যেকোনো একটি ফি খাত বাছুন --</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (ডিফল্ট: ৳{s.defAmount})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">নতুন ফি খাতের নাম *</label>
                    <input
                      type="text"
                      placeholder="যেমন: কম্পিউটার ল্যাব ফি / স্কাউট ফি"
                      value={classQuickAddModal.newSectorName}
                      onChange={(e) => setClassQuickAddModal((prev) => ({ ...prev, newSectorName: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">বিলিং চক্র</label>
                      <select
                        value={classQuickAddModal.newSectorFrequency}
                        onChange={(e) =>
                          setClassQuickAddModal((prev) => ({
                            ...prev,
                            newSectorFrequency: e.target.value as FeeFrequency,
                          }))
                        }
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                      >
                        <option value="yearly">বাৎসরিক</option>
                        <option value="monthly">প্রতি মাসে</option>
                        <option value="one_time">এককালীন</option>
                        <option value="per_exam">প্রতি পরীক্ষা</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">খতিয়ান কোড</label>
                      <select
                        value={classQuickAddModal.newSectorAccountCode}
                        onChange={(e) =>
                          setClassQuickAddModal((prev) => ({ ...prev, newSectorAccountCode: e.target.value }))
                        }
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
                    onChange={(e) =>
                      setClassQuickAddModal((prev) => ({ ...prev, customAmount: Number(e.target.value) || 0 }))
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setClassQuickAddModal((prev) => ({ ...prev, isOpen: false }))}
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
  );
}
