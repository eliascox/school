'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Upload,
  Plus,
  Star,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Trash2,
  Camera,
  Video,
  Image as ImageIcon,
  Play,
  X,
  Search,
  Check,
} from 'lucide-react';
import {
  AchieverStudent,
  GalleryMediaItem,
  DEFAULT_GALLERY_CONFIG,
} from '@/services/landingPageService';
import { Student } from '@/services/studentService';
import { confirmDialog } from '@/components/ui/ToastProvider';
import { BaseLandingTabProps, ShowToastFn } from './landingAdminShared';

interface LandingAchieversTabProps extends BaseLandingTabProps {
  showToast: ShowToastFn;
  liveStudents: Student[];
  showImportModal: boolean;
  setShowImportModal: (open: boolean) => void;
}

export function LandingAchieversTab({
  config,
  handleUpdateConfig,
  showToast,
  liveStudents,
  showImportModal,
  setShowImportModal,
}: LandingAchieversTabProps) {
  const [importSearch, setImportSearch] = useState<string>('');
  const [importClassFilter, setImportClassFilter] = useState<string>('all');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Trophy className="w-6 h-6 text-amber-500" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                সেরা ছাত্র/ছাত্রী (কৃতী শিক্ষার্থী) ব্যবস্থাপনা
              </h2>
              <p className="text-xs text-slate-500">
                বোর্ড পরীক্ষা ও মেধা অন্বেষণে শীর্ষস্থান অর্জনকারী শিক্ষার্থীদের তালিকা ও ছবি পরিবর্তন করুন।
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm shadow-emerald-600/20"
            >
              <Upload className="w-4 h-4" />
              <span>ডাটাবেজ থেকে শীর্ষ শিক্ষার্থী আনুন</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const newStudent: AchieverStudent = {
                  id: `ach-${Date.now()}`,
                  name: 'নতুন কৃতি শিক্ষার্থী',
                  class: '১০ম শ্রেণি',
                  roll: '০১',
                  year: '২০২৬',
                  gpa: '৫.০০',
                  photo: '',
                  awardBadge: '🏆 গোল্ডেন জিপিএ-৫',
                  visible: true,
                };
                handleUpdateConfig({
                  ...config,
                  achievers: {
                    ...config.achievers,
                    students: [...config.achievers.students, newStudent],
                  },
                });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>ম্যানুয়ালি যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Image Dimension Guidelines Banner for Achievers */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-sm">
              📐
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-900 dark:text-amber-200">
                ছবি সাইজ ও ডাইমেনশন নির্দেশিকা — কৃতী শিক্ষার্থী প্রতিকৃতি
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                <span className="font-bold">• শিক্ষার্থীর ছবি ডাইমেনশন:</span> ৩০০ × ৩৮০ px (৩:৪ উল্লম্ব প্রতিকৃতি বা ১:১ পাসপোর্ট সাইজ), সর্বোচ্চ ১৫-২৫ KB (স্বয়ংক্রিয় কম্প্রেসড)।
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-black shrink-0 border border-amber-300 dark:border-amber-700">
            ৩:৪ পোর্ট্রেট বা ১:১ পাসপোর্ট
          </span>
        </div>

        {/* Section Settings Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">সেকশন শিরোনাম</label>
            <input
              type="text"
              value={config.achievers.title}
              onChange={(e) =>
                handleUpdateConfig({
                  ...config,
                  achievers: { ...config.achievers, title: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              সাবটাইটেল / বিবরণ
            </label>
            <input
              type="text"
              value={config.achievers.subtitle}
              onChange={(e) =>
                handleUpdateConfig({
                  ...config,
                  achievers: { ...config.achievers, subtitle: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
            />
          </div>
        </div>

        {/* Achiever Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {config.achievers.students.map((st, idx) => (
            <div
              key={st.id}
              className={`p-4 rounded-2xl border transition-all duration-200 space-y-3.5 relative ${
                st.visible !== false
                  ? 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700'
                  : 'bg-slate-100/60 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>#{idx + 1} কৃতী</span>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...config.achievers.students];
                      updated[idx] = { ...updated[idx], visible: st.visible === false ? true : false };
                      handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                    }}
                    className={`p-1.5 rounded-lg transition ${
                      st.visible !== false
                        ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                        : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                    title={st.visible !== false ? 'দৃশ্যমান (ক্লিক করে লুকান)' : 'লুকানো (ক্লিক করে দৃশ্যমান করুন)'}
                  >
                    {st.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...config.achievers.students];
                        const temp = updated[idx];
                        updated[idx] = updated[idx - 1];
                        updated[idx - 1] = temp;
                        handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                      title="বামে স্থানান্তর"
                    >
                      <MoveUp className="w-3.5 h-3.5 -rotate-90" />
                    </button>
                  )}
                  {idx < config.achievers.students.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...config.achievers.students];
                        const temp = updated[idx];
                        updated[idx] = updated[idx + 1];
                        updated[idx + 1] = temp;
                        handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                      title="ডানে স্থানান্তর"
                    >
                      <MoveDown className="w-3.5 h-3.5 -rotate-90" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        await confirmDialog({
                          title: 'কৃতী শিক্ষার্থী মুছে ফেলুন',
                          message: `আপনি কি "${st.name}" এর তথ্য মুছে ফেলতে চান?`,
                          confirmLabel: 'মুছে ফেলুন',
                          danger: true,
                        })
                      ) {
                        const updated = config.achievers.students.filter((_, i) => i !== idx);
                        handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                        showToast('শিক্ষার্থী তালিকা থেকে বাদ দেওয়া হয়েছে', 'info');
                      }
                    }}
                    className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Student Photo with Direct Upload */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border-2 border-amber-400">
                  {st.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={st.photo} alt={st.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                      {st.name ? st.name.slice(0, 1) : 'ছবি'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-[11px] font-bold cursor-pointer transition w-full justify-center">
                    <Upload className="w-3 h-3" />
                    <span>ছবি আপলোড</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (re) => {
                            const updated = [...config.achievers.students];
                            updated[idx] = { ...updated[idx], photo: re.target?.result as string };
                            handleUpdateConfig({
                              ...config,
                              achievers: { ...config.achievers, students: updated },
                            });
                            showToast(`${st.name} এর ছবি আপলোড হয়েছে`, 'success');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="অনলাইন ছবির লিঙ্ক"
                    value={st.photo || ''}
                    onChange={(e) => {
                      const updated = [...config.achievers.students];
                      updated[idx] = { ...updated[idx], photo: e.target.value };
                      handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                    }}
                    className="w-full px-2 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 truncate"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-0.5">শিক্ষার্থীর নাম</label>
                <input
                  type="text"
                  value={st.name}
                  onChange={(e) => {
                    const updated = [...config.achievers.students];
                    updated[idx].name = e.target.value;
                    handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                  }}
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-0.5">শ্রেণি</label>
                  <input
                    type="text"
                    value={st.class}
                    onChange={(e) => {
                      const updated = [...config.achievers.students];
                      updated[idx].class = e.target.value;
                      handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                    }}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-0.5">রোল নং</label>
                  <input
                    type="text"
                    value={st.roll}
                    onChange={(e) => {
                      const updated = [...config.achievers.students];
                      updated[idx].roll = e.target.value;
                      handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                    }}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-0.5">শিক্ষাবর্ষ / সাল</label>
                  <input
                    type="text"
                    value={st.year}
                    onChange={(e) => {
                      const updated = [...config.achievers.students];
                      updated[idx].year = e.target.value;
                      handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                    }}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-0.5">জিপিএ / ফলাফল</label>
                  <input
                    type="text"
                    value={st.gpa || ''}
                    placeholder="৫.০০"
                    onChange={(e) => {
                      const updated = [...config.achievers.students];
                      updated[idx].gpa = e.target.value;
                      handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                    }}
                    className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ট্রফি / সম্মাননা ব্যাজ</label>
                <input
                  type="text"
                  value={st.awardBadge}
                  onChange={(e) => {
                    const updated = [...config.achievers.students];
                    updated[idx].awardBadge = e.target.value;
                    handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                  }}
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-amber-600 dark:text-amber-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: IMPORT ACHIEVER FROM LIVE STUDENTS DATABASE */}
      {showImportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 sm:p-7 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <Upload className="w-5 h-5 text-emerald-600" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    শিক্ষার্থী ডাটাবেজ থেকে শীর্ষ শিক্ষার্থী ইমপোর্ট
                  </h3>
                  <p className="text-xs text-slate-500">
                    স্কুলের মূল ডাটাবেজ থেকে মেধাবী শিক্ষার্থী নির্বাচন করে সরাসরি এক ক্লিকে যুক্ত করুন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100 dark:border-slate-800">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="নাম, রোল বা আইডি দিয়ে খুঁজুন..."
                  value={importSearch}
                  onChange={(e) => setImportSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <select
                  value={importClassFilter}
                  onChange={(e) => setImportClassFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                >
                  <option value="all">সকল শ্রেণি</option>
                  <option value="Class 10">১০ম শ্রেণি</option>
                  <option value="Class 9">৯ম শ্রেণি</option>
                  <option value="Class 8">৮ম শ্রেণি</option>
                  <option value="Class 7">৭ম শ্রেণি</option>
                  <option value="Class 6">৬ষ্ঠ শ্রেণি</option>
                </select>
              </div>
            </div>

            <div className="overflow-y-auto py-4 space-y-2 flex-1">
              {liveStudents
                .filter((st) => {
                  const matchSearch =
                    !importSearch ||
                    st.name.toLowerCase().includes(importSearch.toLowerCase()) ||
                    st.roll.includes(importSearch) ||
                    st.id.toLowerCase().includes(importSearch.toLowerCase());
                  const matchClass = importClassFilter === 'all' || st.grade === importClassFilter;
                  return matchSearch && matchClass;
                })
                .slice(0, 30)
                .map((st) => {
                  const alreadyAdded = config.achievers.students.some(
                    (a) => a.name === st.name || a.id === `ach-${st.id}`
                  );
                  return (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 flex-shrink-0">
                          {st.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={st.photo} alt={st.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-500">
                              {st.name.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">{st.name}</h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              রোল: {st.roll}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {st.gradeBn || `${st.grade} শ্রেণি`} • {st.section || 'শাখা ক'} • {st.session || '২০২৬'} •
                            GPA: {st.gpa || '৫.০০'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => {
                          const newAchiever: AchieverStudent = {
                            id: `ach-${st.id}-${Date.now()}`,
                            name: st.name,
                            class: st.gradeBn || `${st.grade} শ্রেণি`,
                            roll: st.roll,
                            year: st.session || '২০২৬',
                            gpa: st.gpa || '৫.০০',
                            photo: st.photo || '',
                            awardBadge:
                              st.gpa === '5.00' ? '🏆 গোল্ডেন জিপিএ-৫' : `⭐ মেধা স্থান #${st.roll}`,
                            visible: true,
                          };
                          handleUpdateConfig({
                            ...config,
                            achievers: {
                              ...config.achievers,
                              students: [...config.achievers.students, newAchiever],
                            },
                          });
                          showToast(`${st.name} সফলভাবে কৃতী তালিকায় যুক্ত হয়েছে!`, 'success');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          alreadyAdded
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        {alreadyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>যুক্ত আছে</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>যুক্ত করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>মোট শিক্ষার্থী: {liveStudents.length} জন</span>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 transition"
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface LandingGalleryTabProps extends BaseLandingTabProps {
  showToast: ShowToastFn;
}

export function LandingGalleryTab({ config, handleUpdateConfig, showToast }: LandingGalleryTabProps) {
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState<string>('all');

  const currentItems = config.gallery?.items || DEFAULT_GALLERY_CONFIG.items;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Camera className="w-6 h-6 text-purple-600" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">ফটো ও ভিডিও গ্যালারি পরিচালনা</h2>
              <p className="text-xs text-slate-500">
                বিদ্যালয়ের স্মৃতিময় মুহূর্ত, শ্রেণিকক্ষ, বিজ্ঞান মেলা ও ক্রীড়া প্রতিযোগিতার ছবি সহজে আপলোড করুন।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const currentGallery = config.gallery || DEFAULT_GALLERY_CONFIG;
              const newItem: GalleryMediaItem = {
                id: `gal-${Date.now()}`,
                type: 'image',
                title: 'নতুন গ্যালারি আইটেম',
                category: 'ক্যাম্পাস',
                thumbnail:
                  'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
                date: '২০২৬',
                caption: 'এই ছবির বিবরণ বা ক্যাপশন এখানে লিখুন...',
                visible: true,
              };
              handleUpdateConfig({
                ...config,
                gallery: {
                  ...currentGallery,
                  items: [...currentGallery.items, newItem],
                },
              });
              showToast('নতুন গ্যালারি আইটেম যোগ করা হয়েছে', 'success');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-sm shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ছবি/ভিডিও যোগ করুন</span>
          </button>
        </div>

        {/* Image Dimension Guidelines Banner for Gallery */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-sm">
              📐
            </div>
            <div>
              <h4 className="text-xs font-black text-purple-900 dark:text-purple-200">
                ছবি সাইজ ও ডাইমেনশন নির্দেশিকা — ফটো গ্যালারি
              </h4>
              <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
                <span className="font-bold">• গ্যালারি ফটো ডাইমেনশন:</span> ৮০০ × ৬০০ px (৪:৩ অনুপাত) অথবা ৮০০ × ৪৫০ px (১৬:৯ অনুপাত), সর্বোচ্চ ২৫-৪০ KB (স্বয়ংক্রিয় কম্প্রেসড)।
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-black shrink-0 border border-purple-300 dark:border-purple-800">
            ৪:৩ বা ১৬:৯ অনুপাত
          </span>
        </div>

        {/* Section Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">সেকশন শিরোনাম</label>
            <input
              type="text"
              value={config.gallery?.title || 'ছবি এবং ভিডিও গ্যালারী'}
              onChange={(e) => {
                const currentGallery = config.gallery || DEFAULT_GALLERY_CONFIG;
                handleUpdateConfig({ ...config, gallery: { ...currentGallery, title: e.target.value } });
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              আইব্রো ট্যাগ (Eyebrow)
            </label>
            <input
              type="text"
              value={config.gallery?.eyebrow || 'ক্যাম্পাস লাইফ ও স্মৃতি'}
              onChange={(e) => {
                const currentGallery = config.gallery || DEFAULT_GALLERY_CONFIG;
                handleUpdateConfig({ ...config, gallery: { ...currentGallery, eyebrow: e.target.value } });
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              সাবটাইটেল / বিবরণ
            </label>
            <input
              type="text"
              value={
                config.gallery?.subtitle ||
                'বিদ্যালয়ের প্রাণবন্ত পাঠদান, ক্রীড়া ও সাংস্কৃতিক উৎসব এবং বিজ্ঞান প্রদর্শনীর স্মরণীয় মুহূর্তসমূহ।'
              }
              onChange={(e) => {
                const currentGallery = config.gallery || DEFAULT_GALLERY_CONFIG;
                handleUpdateConfig({ ...config, gallery: { ...currentGallery, subtitle: e.target.value } });
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['all', 'অ্যাকাডেমিক', 'ভিডিও হাইলাইটস', 'বিজ্ঞান ও প্রযুক্তি', 'ক্রীড়া ও সংস্কৃতি', 'ক্যাম্পাস'].map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setGalleryCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  galleryCategoryFilter === cat
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'সকল মিডিয়া' : cat}
              </button>
            )
          )}
        </div>

        {/* Gallery Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentItems
            .filter((item) => galleryCategoryFilter === 'all' || item.category === galleryCategoryFilter)
            .map((item, idx) => {
              const realIndex = currentItems.findIndex((i) => i.id === item.id);
              const isVideo = item.type === 'video';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 relative ${
                    item.visible !== false
                      ? 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100/60 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 flex items-center gap-1">
                      {isVideo ? (
                        <Video className="w-3 h-3 text-rose-500" />
                      ) : (
                        <ImageIcon className="w-3 h-3 text-emerald-500" />
                      )}
                      <span>
                        {isVideo ? 'ভিডিও' : 'ছবি'} • #{idx + 1}
                      </span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...currentItems];
                          updated[realIndex] = {
                            ...updated[realIndex],
                            visible: item.visible === false ? true : false,
                          };
                          const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                          handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                        }}
                        className={`p-1.5 rounded-lg transition ${
                          item.visible !== false
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                            : 'text-slate-400 hover:bg-slate-200'
                        }`}
                        title={
                          item.visible !== false ? 'দৃশ্যমান (ক্লিক করে লুকান)' : 'লুকানো (ক্লিক করে প্রদর্শন করুন)'
                        }
                      >
                        {item.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {realIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...currentItems];
                            const temp = updated[realIndex];
                            updated[realIndex] = updated[realIndex - 1];
                            updated[realIndex - 1] = temp;
                            const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                            handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                          title="আগে নিন"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {realIndex < currentItems.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...currentItems];
                            const temp = updated[realIndex];
                            updated[realIndex] = updated[realIndex + 1];
                            updated[realIndex + 1] = temp;
                            const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                            handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                          title="পরে নিন"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            await confirmDialog({
                              title: 'গ্যালারি আইটেম মুছে ফেলুন',
                              message: `আপনি কি "${item.title}" মুছে ফেলতে চান?`,
                              confirmLabel: 'মুছে ফেলুন',
                              danger: true,
                            })
                          ) {
                            const updated = currentItems.filter((i) => i.id !== item.id);
                            const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                            handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                            showToast('গ্যালারি আইটেম মুছে ফেলা হয়েছে', 'info');
                          }
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Image Thumbnail Preview & Direct Upload */}
                  <div className="space-y-2">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      {isVideo && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="p-2 rounded-full bg-rose-600 text-white shadow-lg">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                        <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[11px] font-bold cursor-pointer transition backdrop-blur-md">
                          <Upload className="w-3 h-3 text-purple-400" />
                          <span>ছবি আপলোড</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (re) => {
                                  const updated = [...currentItems];
                                  updated[realIndex] = {
                                    ...updated[realIndex],
                                    thumbnail: re.target?.result as string,
                                  };
                                  const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                                  handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                                  showToast('গ্যালারির থাম্বনেইল ছবি আপলোড হয়েছে', 'success');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="অনলাইন ছবি লিঙ্ক (URL)"
                      value={item.thumbnail}
                      onChange={(e) => {
                        const updated = [...currentItems];
                        updated[realIndex] = { ...updated[realIndex], thumbnail: e.target.value };
                        const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                        handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                      }}
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                    />
                  </div>

                  {/* Type and Category */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">মিডিয়া টাইপ</label>
                      <select
                        value={item.type}
                        onChange={(e) => {
                          const updated = [...currentItems];
                          updated[realIndex] = {
                            ...updated[realIndex],
                            type: e.target.value as 'image' | 'video',
                          };
                          const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                          handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      >
                        <option value="image">📷 ছবি</option>
                        <option value="video">🎥 ভিডিও</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ক্যাটাগরি</label>
                      <input
                        type="text"
                        value={item.category}
                        placeholder="অ্যাকাডেমিক / বিজ্ঞান"
                        onChange={(e) => {
                          const updated = [...currentItems];
                          updated[realIndex] = { ...updated[realIndex], category: e.target.value };
                          const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                          handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {isVideo && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ভিডিও এম্বেড লিংক</label>
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/embed/..."
                        value={item.videoUrl || ''}
                        onChange={(e) => {
                          const updated = [...currentItems];
                          updated[realIndex] = { ...updated[realIndex], videoUrl: e.target.value };
                          const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                          handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                        }}
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-rose-600 font-mono"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">শিরোনাম</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...currentItems];
                        updated[realIndex] = { ...updated[realIndex], title: e.target.value };
                        const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                        handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                      }}
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">তারিখ</label>
                      <input
                        type="text"
                        value={item.date}
                        placeholder="১২ অক্টোবর ২০২৬"
                        onChange={(e) => {
                          const updated = [...currentItems];
                          updated[realIndex] = { ...updated[realIndex], date: e.target.value };
                          const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                          handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ক্যাপশন / বিবরণ</label>
                      <input
                        type="text"
                        value={item.caption}
                        onChange={(e) => {
                          const updated = [...currentItems];
                          updated[realIndex] = { ...updated[realIndex], caption: e.target.value };
                          const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                          handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
