'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Search,
  Plus,
  Pencil,
  Trash2,
  Printer,
  ArrowLeft,
  Phone,
  Briefcase,
  Building,
  Award,
  X,
} from 'lucide-react';
import { alumniService, AlumniRecord } from '@/services/alumniService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';

const STATUS_OPTIONS: Array<NonNullable<AlumniRecord['currentStatus']>> = [
  'উচ্চশিক্ষা',
  'চাকরি',
  'ব্যবসা',
  'প্রবাসী',
  'অন্যান্য',
];

const GROUP_OPTIONS = ['বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা', 'সাধারণ'];

export default function AlumniPortalPage() {
  const [mounted, setMounted] = useState(false);
  const [alumniList, setAlumniList] = useState<AlumniRecord[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add / Edit Modal Form
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [passingYear, setPassingYear] = useState('2026');
  const [batch, setBatch] = useState('এসএসসি ব্যাচ ২০২৬');
  const [sscRoll, setSscRoll] = useState('');
  const [regNo, setRegNo] = useState('');
  const [group, setGroup] = useState('বিজ্ঞান');
  const [gpa, setGpa] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currentStatus, setCurrentStatus] = useState<NonNullable<AlumniRecord['currentStatus']>>('উচ্চশিক্ষা');
  const [institutionOrWork, setInstitutionOrWork] = useState('');
  const [address, setAddress] = useState('');

  const loadData = useCallback(() => {
    setAlumniList(alumniService.getAlumni());
    setSettings(settingsService.getSettings());
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
    const onStorage = () => loadData();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadData]);

  const passingYears = useMemo(() => {
    const set = new Set(alumniList.map((a) => a.passingYear).filter(Boolean));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [alumniList]);

  const filteredAlumni = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return alumniList.filter((a) => {
      if (yearFilter !== 'all' && a.passingYear !== yearFilter) return false;
      if (groupFilter !== 'all' && a.group !== groupFilter) return false;
      if (statusFilter !== 'all' && a.currentStatus !== statusFilter) return false;
      if (q) {
        const hay = `${a.name} ${a.sscRoll || ''} ${a.regNo || ''} ${a.batch} ${a.institutionOrWork || ''} ${a.phone || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [alumniList, yearFilter, groupFilter, statusFilter, searchQuery]);

  const openNewModal = () => {
    setEditingId(undefined);
    setName('');
    setFatherName('');
    setPassingYear('2026');
    setBatch('এসএসসি ব্যাচ ২০২৬');
    setSscRoll('');
    setRegNo('');
    setGroup('বিজ্ঞান');
    setGpa('');
    setPhone('');
    setEmail('');
    setCurrentStatus('উচ্চশিক্ষা');
    setInstitutionOrWork('');
    setAddress('');
    setShowModal(true);
  };

  const openEditModal = (rec: AlumniRecord) => {
    setEditingId(rec.id);
    setName(rec.name);
    setFatherName(rec.fatherName || '');
    setPassingYear(rec.passingYear);
    setBatch(rec.batch);
    setSscRoll(rec.sscRoll || '');
    setRegNo(rec.regNo || '');
    setGroup(rec.group || 'সাধারণ');
    setGpa(rec.gpa || '');
    setPhone(rec.phone || '');
    setEmail(rec.email || '');
    setCurrentStatus(rec.currentStatus || 'উচ্চশিক্ষা');
    setInstitutionOrWork(rec.institutionOrWork || '');
    setAddress(rec.address || '');
    setShowModal(true);
  };

  const handleSaveAlumni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !passingYear.trim()) {
      showToast('প্রাক্তন শিক্ষার্থীর নাম ও পাসের সন আবশ্যক।', 'error');
      return;
    }
    alumniService.saveAlumni({
      id: editingId,
      name: name.trim(),
      fatherName: fatherName.trim() || undefined,
      passingYear: passingYear.trim(),
      batch: batch.trim() || `ব্যাচ ${passingYear.trim()}`,
      sscRoll: sscRoll.trim() || undefined,
      regNo: regNo.trim() || undefined,
      group,
      gpa: gpa.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      currentStatus,
      institutionOrWork: institutionOrWork.trim() || undefined,
      address: address.trim() || undefined,
    });
    showToast(editingId ? 'অ্যালুমনাই তথ্য হালনাগাদ হয়েছে!' : 'নতুন প্রাক্তন শিক্ষার্থী আর্কাইভে যুক্ত হয়েছে!', 'success');
    setShowModal(false);
    loadData();
  };

  const handleDeleteAlumni = async (rec: AlumniRecord) => {
    const ok = await confirmDialog({
      title: 'অ্যালুমনাই রেকর্ড মুছুন',
      message: `আপনি কি "${rec.name}" (${rec.batch}) এর রেকর্ড স্থায়ীভাবে মুছে ফেলতে চান?`,
      confirmLabel: 'মুছুন',
      cancelLabel: 'বাতিল',
      danger: true,
    });
    if (!ok) return;
    alumniService.deleteAlumni(rec.id);
    showToast('অ্যালুমনাই রেকর্ড মুছে ফেলা হয়েছে।', 'success');
    loadData();
  };

  if (!mounted) {
    return (
      <div className="p-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
        অ্যালুমনাই আর্কাইভ পোর্টাল লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 space-y-6">
      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          .no-print { display: none !important; }
          body { background: #ffffff !important; color: #0f172a !important; }
        }
      `}</style>

      {/* Print Banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4">
        <h1 className="text-xl font-black">{settings?.schoolName || 'স্মার্ট স্কুল অ্যান্ড কলেজ'}</h1>
        <p className="text-xs font-bold text-slate-600">{settings?.address || ''} • প্রাক্তন শিক্ষার্থী (Alumni) আর্কাইভ ও ডিরেক্টরি</p>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs no-print">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                প্রাক্তন শিক্ষার্থী (Alumni) ডিরেক্টরি ও আর্কাইভ
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                মোট: {alumniList.length} জন
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              দশম শ্রেণি পাস-আউট শিক্ষার্থীদের স্বয়ংক্রিয় আর্কাইভ, বিশ্ববিদ্যালয় ও কর্মক্ষেত্র ট্র্যাকিং
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> ড্যাশবোর্ড
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট
          </button>
          <button
            type="button"
            onClick={openNewModal}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> প্রাক্তন শিক্ষার্থী যোগ করুন
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3 no-print">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম, রোল, রেজিস্ট্রেশন বা বর্তমান প্রতিষ্ঠান..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
          />
        </div>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
        >
          <option value="all">সকল ব্যাচ / সন</option>
          {passingYears.map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
        >
          <option value="all">সকল বিভাগ</option>
          {GROUP_OPTIONS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
        >
          <option value="all">সকল অবস্থান</option>
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>

      {/* Directory Grid */}
      {filteredAlumni.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
          <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-sm font-black text-slate-600 dark:text-slate-300">কোনো প্রাক্তন শিক্ষার্থী আর্কাইভ করা নেই</p>
          <p className="text-xs text-slate-400">
            শ্রেণি প্রমোশন পেইজ থেকে ১০ম শ্রেণি থেকে পাস-আউট (Alumni) করলে স্বয়ংক্রিয়ভাবে এখানে তালিকা যুক্ত হবে অথবা ম্যানুয়ালি যোগ করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAlumni.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                      {a.batch} ({a.passingYear})
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {a.currentStatus || 'উচ্চশিক্ষা'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">{a.name}</h3>
                  {a.fatherName && <p className="text-[11px] text-slate-400 font-bold">পিতা/অভিভাবক: {a.fatherName}</p>}
                </div>

                <div className="flex items-center gap-1 no-print">
                  <Link
                    href={`/dashboard/certificates?action=create&alumniId=${a.id}&type=ssc_testimonial`}
                    className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[10px] font-black transition flex items-center gap-1"
                    title="এই প্রাক্তন শিক্ষার্থীর প্রশংসাপত্র / সনদ তৈরি করুন"
                  >
                    <Award className="w-3 h-3" /> প্রশংসাপত্র
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEditModal(a)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="সম্পাদনা করুন"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAlumni(a)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 text-[11px] font-bold">
                <div>
                  <span className="text-slate-400 block text-[10px]">এসএসসি রোল</span>
                  <span>{a.sscRoll || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">বিভাগ</span>
                  <span>{a.group || 'সাধারণ'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">GPA</span>
                  <span className="inline-flex items-center gap-0.5 text-emerald-600 font-black">
                    <Award className="w-3 h-3" /> {a.gpa || '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                {a.institutionOrWork && (
                  <p className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <span>{a.institutionOrWork}</span>
                  </p>
                )}
                {a.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{a.phone}</span>
                  </p>
                )}
                {a.regNo && (
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Briefcase className="w-3.5 h-3.5 shrink-0" /> বোর্ড রেজিঃ {a.regNo}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <form
            onSubmit={handleSaveAlumni}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black">
                {editingId ? 'প্রাক্তন শিক্ষার্থীর তথ্য হালনাগাদ' : 'নতুন প্রাক্তন শিক্ষার্থী যুক্ত করুন'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1">পূর্ণ নাম *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">পিতার নাম</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">পাসের সন *</label>
                <input
                  type="text"
                  value={passingYear}
                  onChange={(e) => setPassingYear(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">ব্যাচ লেবেল</label>
                <input
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">এসএসসি রোল</label>
                <input
                  type="text"
                  value={sscRoll}
                  onChange={(e) => setSscRoll(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">বোর্ড রেজিস্ট্রেশন</label>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">বিভাগ</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  {GROUP_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">প্রাপ্ত GPA</label>
                <input
                  type="text"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="যেমন: 5.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">বর্তমান অবস্থান</label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value as NonNullable<AlumniRecord['currentStatus']>)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-500 mb-1">বর্তমান বিশ্ববিদ্যালয় / কর্মক্ষেত্র</label>
                <input
                  type="text"
                  value={institutionOrWork}
                  onChange={(e) => setInstitutionOrWork(e.target.value)}
                  placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয় / চট্টগ্রাম মেডিকেল কলেজ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-500 mb-1">স্থায়ী ঠিকানা</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black cursor-pointer"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
