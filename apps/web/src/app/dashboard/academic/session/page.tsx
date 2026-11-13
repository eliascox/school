'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Lock, 
  Unlock, 
  Sparkles, 
  Pencil, 
  Trash2, 
  AlertCircle, 
  ShieldCheck, 
  Users, 
  Award, 
  FileSpreadsheet, 
  RefreshCw, 
  Archive,
  Eye,
  X,
  Building2,
  Check,
  ArrowRightCircle,
  UserCheck,
  CheckSquare,
  Square,
  School
} from 'lucide-react';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import Link from 'next/link';
import { studentService, Student } from '@/services/studentService';

interface AcademicSession {
  id: string;
  name: string;
  nameBn: string;
  year: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  admissionStatus: 'Open' | 'Closed' | 'Upcoming';
  totalStudents: number;
  totalClasses: number;
  status: 'Active' | 'Archived' | 'Upcoming';
  remarks?: string;
}


const DEFAULT_SESSIONS: AcademicSession[] = [
  {
    id: 'ses-2026',
    name: 'Academic Session 2026',
    nameBn: '২০২৬ শিক্ষাবর্ষ',
    year: 2026,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isCurrent: true,
    admissionStatus: 'Open',
    totalStudents: 0,
    totalClasses: 5,
    status: 'Active',
    remarks: 'বর্তমান সক্রিয় সেশন। অনলাইন ভর্তি ও শিক্ষা কার্যক্রম চলমান।'
  },
  {
    id: 'ses-2025',
    name: 'Academic Session 2025',
    nameBn: '২০২৫ শিক্ষাবর্ষ',
    year: 2025,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    isCurrent: false,
    admissionStatus: 'Closed',
    totalStudents: 0,
    totalClasses: 5,
    status: 'Archived',
    remarks: 'বিগত সেশন। সকল পরীক্ষার নম্বর ও রেকর্ড সংরক্ষিত রয়েছে।'
  },
  {
    id: 'ses-2027',
    name: 'Academic Session 2027',
    nameBn: '২০২৭ শিক্ষাবর্ষ (প্রস্তাবিত)',
    year: 2027,
    startDate: '2027-01-01',
    endDate: '2027-12-31',
    isCurrent: false,
    admissionStatus: 'Upcoming',
    totalStudents: 0,
    totalClasses: 5,
    status: 'Upcoming',
    remarks: 'আগামী শিক্ষাবর্ষের আগাম সেশন পরিকল্পনা ও ভর্তি পোর্টাল সেটআপ।'
  }
];


export default function SessionManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<AcademicSession[]>(DEFAULT_SESSIONS);
  const [activeSession, setActiveSession] = useState<AcademicSession>(DEFAULT_SESSIONS[0]);
  const [totalEnrolledCount, setTotalEnrolledCount] = useState<number>(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editSessionModal, setEditSessionModal] = useState<AcademicSession | null>(null);

  // New session form state
  const [newSession, setNewSession] = useState({
    nameBn: '',
    year: 2027,
    startDate: '2027-01-01',
    endDate: '2027-12-31',
    admissionStatus: 'Open' as 'Open' | 'Closed' | 'Upcoming',
    remarks: ''
  });

  // Load from localStorage & studentService
  useEffect(() => {
    setMounted(true);

    const refreshData = () => {
      const allSt = studentService.getAllStudents();
      setTotalEnrolledCount(allSt.length);

      const saved = localStorage.getItem('sms_academic_sessions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSessions(parsed);
            const current = parsed.find((s: AcademicSession) => s.isCurrent) || parsed[0];
            setActiveSession(current);
          }
        } catch (err) {
          console.error('Failed to parse sessions from localStorage', err);
        }
      }
    };

    refreshData();

    const unsubscribe = studentService.subscribe(refreshData);
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', refreshData);
    }
    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', refreshData);
      }
    };
  }, []);

  // Save Sessions to localStorage
  const saveSessions = (updated: AcademicSession[]) => {
    setSessions(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_academic_sessions', JSON.stringify(updated));
    }
    const current = updated.find(s => s.isCurrent) || updated[0];
    setActiveSession(current);
  };

  // Switch Active Session
  const handleSetActiveSession = (id: string) => {
    const updated = sessions.map(s => ({
      ...s,
      isCurrent: s.id === id,
      status: (s.id === id ? 'Active' : s.status === 'Active' ? 'Archived' : s.status) as 'Active' | 'Archived' | 'Upcoming'
    }));
    saveSessions(updated);
  };

  // Toggle Admission Status
  const handleToggleAdmission = (id: string) => {
    const updated = sessions.map(s => {
      if (s.id === id) {
        const nextStatus: 'Open' | 'Closed' = s.admissionStatus === 'Open' ? 'Closed' : 'Open';
        return { ...s, admissionStatus: nextStatus };
      }
      return s;
    });
    saveSessions(updated);
  };


  // Handle Add New Session
  const handleAddSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.nameBn.trim()) {
      showToast('অনুগ্রহ করে সেশনের নাম উল্লেখ করুন!', 'warning');
      return;
    }

    const created: AcademicSession = {
      id: `ses-${newSession.year}`,
      name: `Academic Session ${newSession.year}`,
      nameBn: newSession.nameBn,
      year: Number(newSession.year),
      startDate: newSession.startDate,
      endDate: newSession.endDate,
      isCurrent: false,
      admissionStatus: newSession.admissionStatus,
      totalStudents: 0,
      totalClasses: 5,
      status: 'Upcoming',
      remarks: newSession.remarks || 'নতুন শিক্ষাবর্ষ'
    };

    saveSessions([...sessions, created]);
    setIsAddModalOpen(false);
    setNewSession({
      nameBn: '',
      year: 2027,
      startDate: '2027-01-01',
      endDate: '2027-12-31',
      admissionStatus: 'Open',
      remarks: ''
    });
    showToast('নতুন শিক্ষাবর্ষ সফলভাবে সংযোজন করা হয়েছে!', 'success');
  };

  // Update Session Edit
  const handleUpdateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSessionModal) return;

    const updated = sessions.map(s => s.id === editSessionModal.id ? editSessionModal : s);
    saveSessions(updated);
    setEditSessionModal(null);
    showToast('সেশন তথ্য সফলভাবে আপডেট হয়েছে!', 'success');
  };

  // Handle Delete Session
  const handleDeleteSession = async (id: string, nameBn: string) => {
    if (await confirmDialog({ title: 'শিক্ষাবর্ষ মুছে ফেলা', message: `আপনি কি নিশ্চিত যে "${nameBn}" শিক্ষাবর্ষটি মুছে ফেলতে চান?`, confirmLabel: 'মুছে ফেলুন', danger: true })) {
      const updated = sessions.filter(s => s.id !== id);
      saveSessions(updated);
      showToast('সেশন মুছে ফেলা হয়েছে!', 'success');
    }
  };

  if (!mounted) {
    return <div className="p-8 text-center text-slate-400 font-bold">সেশন প্যানেল লোড হচ্ছে...</div>;
  }

  return (
    <div className="w-full space-y-5 pb-10">
      
      {/* ═══════════════════════════════════════════ */}
      {/* ACTIVE SESSION REAL-TIME KPI SUMMARY CARDS  */}
      {/* ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Session Name */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-800/60 shadow-sm space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/60">
              সক্রিয় শিক্ষাবর্ষ
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <Calendar size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{activeSession.nameBn}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-500" /> বর্তমানে কার্যকর একাডেমিক সেশন
          </p>
        </div>

        {/* Card 2: Enrolled Students */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              মোট রেজিস্টার্ড শিক্ষার্থী
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalEnrolledCount} জন</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">৬ষ্ঠ থেকে ১০ম শ্রেণি সরাসরি তথ্য</p>
        </div>

        {/* Card 3: Session Duration */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              সেশনের মেয়াদ
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">১ জানুঃ - ৩১ ডিসেঃ</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">বছর: {activeSession.year} (১২ মাস)</p>
        </div>

        {/* Card 4: Admission Status Toggle */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              ভর্তি পোর্টাল
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow ${activeSession.admissionStatus === 'Open' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              {activeSession.admissionStatus === 'Open' ? <Unlock size={16} /> : <Lock size={16} />}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className={`text-base font-black ${activeSession.admissionStatus === 'Open' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
              {activeSession.admissionStatus === 'Open' ? 'ভর্তি খোলা (Open)' : 'ভর্তি বন্ধ (Closed)'}
            </p>
            <button
              onClick={() => handleToggleAdmission(activeSession.id)}
              className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-300 underline cursor-pointer"
            >
              টগল করুন
            </button>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">অনলাইন ও সরাসরি নতুন ভর্তি</p>
        </div>

      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SESSIONS DIRECTORY LIST TABLE               */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">বিদ্যালয়ের সকল সেশন ও শিক্ষাবর্ষ তালিকা</h3>
            <p className="text-xs text-slate-400 font-semibold">সক্রিয়, আর্কাইভ এবং আগামী প্রস্তাবিত সেশনের বিবরণী</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap print:hidden">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              মোট সেশন: {sessions.length} টি
            </span>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs transition cursor-pointer"
            >
              <Plus size={15} />
              নতুন সেশন সংযোজন
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessions.map((session) => {
            const statusColor = session.isCurrent
              ? 'border-indigo-500 bg-gradient-to-b from-indigo-50/40 to-white shadow-md ring-2 ring-indigo-500/20'
              : session.status === 'Archived'
              ? 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
              : 'border-amber-200 bg-amber-50/20 hover:border-amber-300';

            return (
              <div
                key={session.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${statusColor}`}
              >
                {/* Top: Title + Badges */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">{session.nameBn}</h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditSessionModal(session)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                        title="সেশন এডিট"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id, session.nameBn)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                        title="সেশন ডিলিট"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {session.isCurrent && (
                      <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-black text-[9px] rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <CheckCircle2 size={10} /> সক্রিয় সেশন
                      </span>
                    )}
                    {session.status === 'Archived' && (
                      <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[9px] rounded-full flex items-center gap-1">
                        <Archive size={10} /> আর্কাইভড
                      </span>
                    )}
                    {session.status === 'Upcoming' && (
                      <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-extrabold text-[9px] rounded-full flex items-center gap-1 border border-amber-300/60 dark:border-amber-800/60">
                        <Clock size={10} /> প্রস্তাবিত / প্রস্তুতি
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full flex items-center gap-1 ${
                      session.admissionStatus === 'Open'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60'
                        : session.admissionStatus === 'Upcoming'
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60'
                        : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/60'
                    }`}>
                      {session.admissionStatus === 'Open' ? '🟢 ভর্তি খোলা' : session.admissionStatus === 'Upcoming' ? '🟡 প্রস্তুতি' : '🔴 ভর্তি বন্ধ'}
                    </span>
                  </div>

                  {/* Remarks */}
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{session.remarks}</p>
                </div>

                {/* Middle: Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">শিক্ষার্থী</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      {session.isCurrent ? totalEnrolledCount : session.totalStudents}
                    </p>
                    <p className="text-[9px] text-slate-400">জন নথিভুক্ত</p>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">মেয়াদ</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{session.year}</p>
                    <p className="text-[9px] text-slate-400">{session.startDate.slice(5)} → {session.endDate.slice(5)}</p>
                  </div>
                </div>

                {/* Bottom: Action Buttons */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleSetActiveSession(session.id)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check size={13} /> সক্রিয় সেশন সেট করুন
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleAdmission(session.id)}
                    className={`w-full py-2 rounded-xl font-extrabold text-xs border transition cursor-pointer ${
                      session.admissionStatus === 'Open'
                        ? 'border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                        : 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    }`}
                  >
                    {session.admissionStatus === 'Open' ? '🔴 ভর্তি বন্ধ করুন' : '🟢 ভর্তি চালু করুন'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ➕ MODAL: ADD NEW ACADEMIC SESSION                                 */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">নতুন শিক্ষাবর্ষ (Session) সংযোজন করুন</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSessionSubmit} className="space-y-3.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">সেশনের নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={newSession.nameBn}
                  onChange={(e) => setNewSession({ ...newSession, nameBn: e.target.value })}
                  placeholder="যেমন: ২০২৭ শিক্ষাবর্ষ"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">শিক্ষাবর্ষ (Year) *</label>
                  <input
                    type="number"
                    required
                    value={newSession.year}
                    onChange={(e) => setNewSession({ ...newSession, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">ভর্তি অবস্থা</label>
                  <select
                    value={newSession.admissionStatus}
                    onChange={(e) => setNewSession({ ...newSession, admissionStatus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Open">🟢 ভর্তি খোলা (Open)</option>
                    <option value="Closed">🔴 ভর্তি বন্ধ (Closed)</option>
                    <option value="Upcoming">🟡 প্রস্তুতি (Upcoming)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">মন্তব্য / বিবরণ</label>
                <input
                  type="text"
                  value={newSession.remarks}
                  onChange={(e) => setNewSession({ ...newSession, remarks: e.target.value })}
                  placeholder="যেমন: আগামী শিক্ষাবর্ষের আগাম সেশন পরিকল্পনা"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-xs cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow transition cursor-pointer"
                >
                  সেশন সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ✏️ MODAL: EDIT SESSION                                            */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {editSessionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">সেশন তথ্য এডিট করুন</h3>
              <button onClick={() => setEditSessionModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateSession} className="space-y-3.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">সেশনের নাম (বাংলা)</label>
                <input
                  type="text"
                  value={editSessionModal.nameBn}
                  onChange={(e) => setEditSessionModal({ ...editSessionModal, nameBn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">মন্তব্য / বিবরণ</label>
                <input
                  type="text"
                  value={editSessionModal.remarks || ''}
                  onChange={(e) => setEditSessionModal({ ...editSessionModal, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditSessionModal(null)}
                  className="px-4 py-2 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-xs cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow transition cursor-pointer"
                >
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}