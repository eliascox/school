'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  CheckCircle2,
  Clock,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  teacherRBACService,
  type ClassTeacherAssignment,
  type SubjectAssignment,
  type TeacherRecord,
} from '@/services/teacherRBACService';
import { teacherAuthService, type UserSession } from '@/services/teacherAuthService';
import { auditTrailService } from '@/services/auditTrailService';
import { verifyPassword } from '@/lib/passwordUtils';
import { compressImage } from '@/lib/imageUtils';
import { showToast } from '@/components/ui/ToastProvider';
import {
  formatClassIdBn,
  TeacherAuditLog,
  toBnDigit,
} from './teacherPortalUtils';

interface TeacherPortalProfileTabProps {
  session: UserSession;
  teacher: TeacherRecord | null;
  teacherName: string;
  teacherId: string;
  designation: string;
  isClassTeacher: boolean;
  classTeachers: ClassTeacherAssignment[];
  assignments: SubjectAssignment[];
  auditLogs: TeacherAuditLog[];
  onRefreshData: () => void;
  onLogout: () => void;
  showAlert: (type: 'success' | 'error', text: string) => void;
}

export default function TeacherPortalProfileTab({
  session,
  teacher,
  teacherName,
  teacherId,
  designation,
  isClassTeacher,
  classTeachers,
  assignments,
  auditLogs,
  onRefreshData,
  onLogout,
  showAlert,
}: TeacherPortalProfileTabProps) {
  // Profile Editable Fields (DOB & Photo only — Name/Phone/Designation remain admin-governed RBAC fields)
  const [dobDraft, setDobDraft] = useState<string | null>(null);
  const [photoDraft, setPhotoDraft] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const dobInput = dobDraft ?? (teacher?.dob || '');
  const photoPreview = photoDraft ?? (teacher?.photoUrl || '');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে।', 'warning');
      return;
    }
    const compressed = await compressImage(file, 300, 300, 0.85, true);
    setPhotoDraft(compressed);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) {
      showAlert('error', 'শিক্ষক প্রোফাইল রেকর্ড পাওয়া যায়নি।');
      return;
    }

    setSavingProfile(true);
    const res = await teacherRBACService.updateTeacher(teacher.id, {
      dob: dobInput || teacher.dob,
      photoUrl: photoPreview,
    });
    setSavingProfile(false);

    if (res.success) {
      auditTrailService.addLog({
        action: 'TEACHER_PROFILE_UPDATED',
        category: 'Profile',
        details: `শিক্ষক '${teacherName}' (${teacherId}) প্রোফাইল তথ্য (জন্ম তারিখ/ছবি) হালনাগাদ করেছেন।`,
        performedBy: teacherName,
        status: 'Success',
      });
      setDobDraft(null);
      setPhotoDraft(null);
      showAlert('success', 'প্রোফাইল তথ্য সফলভাবে হালনাগাদ হয়েছে!');
      onRefreshData();
    } else {
      showAlert('error', res.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) {
      showAlert('error', 'শিক্ষক অ্যাকাউন্ট রেকর্ড পাওয়া যায়নি।');
      return;
    }

    const cleanNew = newPassword.trim();
    if (cleanNew.length < 6) {
      showAlert('error', 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!');
      return;
    }
    if (cleanNew !== confirmPassword.trim()) {
      showAlert('error', 'নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না!');
      return;
    }

    setSavingPassword(true);
    try {
      // Verify current password when a teacher is changing their own password
      if (session.role === 'teacher' && teacher.passwordHash) {
        if (!currentPassword.trim()) {
          showAlert('error', 'বর্তমান পাসওয়ার্ড প্রদান করুন!');
          setSavingPassword(false);
          return;
        }
        const check = await verifyPassword(
          currentPassword.trim(),
          teacher.passwordHash
        );
        if (!check.valid) {
          showAlert('error', 'বর্তমান পাসওয়ার্ডটি সঠিক নয়!');
          setSavingPassword(false);
          return;
        }
      }

      const res = await teacherAuthService.setTeacherPassword(
        teacher.id,
        cleanNew
      );
      if (res.success) {
        // Clear mustChangePassword flag in active session if set
        if (session.mustChangePassword) {
          teacherAuthService.setSession({
            ...session,
            mustChangePassword: false,
          });
        }

        auditTrailService.addLog({
          action: 'TEACHER_PASSWORD_CHANGED',
          category: 'Security',
          details: `শিক্ষক '${teacherName}' (${teacherId}) পোর্টাল থেকে পাসওয়ার্ড পরিবর্তন করেছেন।`,
          performedBy: teacherName,
          status: 'Success',
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showAlert('success', 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!');
        onRefreshData();
      } else {
        showAlert('error', res.message);
      }
    } catch {
      showAlert('error', 'পাসওয়ার্ড পরিবর্তনে ত্রুটি হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Column: Identity, Profile Update & Password Change */}
      <div className="lg:col-span-5 space-y-5">
        {/* 1. Calm Executive Profile & RBAC Scope Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className="relative shrink-0">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={teacherName}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-300 flex items-center justify-center font-black text-2xl">
                  {teacherName.charAt(0) || 'শ'}
                </div>
              )}
              {teacher && (
                <label
                  title="প্রোফাইল ছবি পরিবর্তন"
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-[#0B5D3B] hover:bg-emerald-800 text-white flex items-center justify-center shadow-xs cursor-pointer transition"
                >
                  <Camera size={13} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                  {teacherName}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                  সক্রিয়
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {designation}
              </p>
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-bold">
                ID: {teacherId}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                ইউজারনেম / মোবাইল
              </span>
              <span className="font-extrabold font-mono text-slate-900 dark:text-white">
                {teacher?.phone || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                শ্রেণি শিক্ষক দায়িত্ব
              </span>
              <span className="font-extrabold text-[#0B5D3B] dark:text-emerald-400 text-right">
                {isClassTeacher
                  ? classTeachers
                      .map((c) => formatClassIdBn(c.classId))
                      .join(', ')
                  : 'নির্ধারিত নয়'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                বরাদ্দকৃত বিষয়
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {toBnDigit(assignments.length)}টি বিষয়
              </span>
            </div>

            {teacher && (
              <div className="pt-2 space-y-2.5">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                    জন্ম তারিখ (হালনাগাদযোগ্য)
                  </label>
                  <input
                    type="date"
                    value={dobInput}
                    onChange={(e) => setDobDraft(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full h-9 bg-[#0B5D3B] hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl font-bold text-xs transition inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save size={14} />
                  <span>
                    {savingProfile
                      ? 'সংরক্ষণ হচ্ছে...'
                      : 'প্রোফাইল তথ্য হালনাগাদ'}
                  </span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* 2. Password Change Card (PBKDF2 Verified) */}
        {teacher && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center shrink-0">
                <KeyRound size={15} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  পাসওয়ার্ড পরিবর্তন ও নিরাপত্তা
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  কমপক্ষে ৬ অক্ষরের শক্তিশালী পাসওয়ার্ড ব্যবহার করুন
                </p>
              </div>
            </div>

            <form
              onSubmit={handleChangePassword}
              className="space-y-3 text-xs font-bold"
            >
              {session.role === 'teacher' && teacher.passwordHash && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    বর্তমান পাসওয়ার্ড *
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                    required
                    autoComplete="current-password"
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  নতুন পাসওয়ার্ড *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="ন্যূনতম ৬ অক্ষর"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  নতুন পাসওয়ার্ড নিশ্চিত করুন *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#0B5D3B]"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full h-9 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 disabled:opacity-60 rounded-xl font-bold text-xs transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck size={14} />
                <span>
                  {savingPassword
                    ? 'হালনাগাদ হচ্ছে...'
                    : 'নতুন পাসওয়ার্ড সংরক্ষণ করুন'}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* 3. Mobile App & Logout */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/mobile-app"
            className="flex-1 h-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <Smartphone size={15} className="text-[#0B5D3B] dark:text-emerald-400" />
            <span>মোবাইল অ্যাপ</span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 h-10 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={15} />
            <span>লগআউট করুন</span>
          </button>
        </div>
      </div>

      {/* Right Column: Audit Trail */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Clock size={15} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                আমার সাম্প্রতিক অ্যাকশন লগ (Audit Trail)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                নম্বর এন্ট্রি, ছুটি, প্রোফাইল ও নিরাপত্তা কার্যক্রমের রেকর্ড
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold font-mono">
            {toBnDigit(auditLogs.length)}টি লগ
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-bold rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
            কোনো সাম্প্রতিক অ্যাকশন লগ নেই।
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {auditLogs.map((log, idx) => (
              <div
                key={`${log.action}-${idx}`}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CheckCircle2
                      size={13}
                      className="text-[#0B5D3B] dark:text-emerald-400 shrink-0"
                    />
                    <span className="font-extrabold font-mono text-[11px] text-slate-800 dark:text-slate-200">
                      {log.action}
                    </span>
                    <span className="text-[10px] font-bold text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
                      {log.category}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs font-medium leading-relaxed">
                    {log.details}
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold shrink-0 sm:text-right">
                  <div>
                    {new Date(log.timestamp).toLocaleDateString('bn-BD')}
                  </div>
                  <div>
                    {new Date(log.timestamp).toLocaleTimeString('bn-BD')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
