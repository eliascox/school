'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Eye,
  EyeOff,
  Key,
  Pencil,
  Phone,
  UserPlus,
  X,
} from 'lucide-react';
import {
  ClassTeacherAssignment,
  SubjectAssignment,
  TeacherRecord,
} from '@/services/teacherRBACService';

export interface EditTeacherPayload {
  id: string;
  name: string;
  phone: string;
  designation: string;
  dob: string;
  password?: string;
  status: 'active' | 'inactive';
}

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  designation: string;
  setDesignation: (v: string) => void;
  dob: string;
  setDob: (v: string) => void;
  initialPassword: string;
  setInitialPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddTeacherModal({
  isOpen,
  onClose,
  name,
  setName,
  phone,
  setPhone,
  designation,
  setDesignation,
  dob,
  setDob,
  initialPassword,
  setInitialPassword,
  onSubmit,
}: AddTeacherModalProps) {
  const [showPwd, setShowPwd] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <UserPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            নতুন শিক্ষক এন্ট্রি
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs font-bold">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">শিক্ষকের নাম *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: মোঃ আব্দুর রহিম"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">ফোন নম্বর (ইউজারনেম) *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="যেমন: 01812345671"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white font-mono focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">পদবী</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">জন্ম তারিখ</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">প্রাথমিক পাসওয়ার্ড</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                minLength={6}
                value={initialPassword}
                onChange={(e) => setInitialPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড লিখুন"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block mt-1">
              ⚠️ প্রথম লগইনে পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক হবে
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow cursor-pointer transition active:scale-95"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  newPassword,
  setNewPassword,
  onSubmit,
}: ResetPasswordModalProps) {
  const [showPwd, setShowPwd] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <Key size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            পাসওয়ার্ড রিসেট
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs font-bold">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">নতুন পাসওয়ার্ড *</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 rounded-xl text-[11px]">
            ⚠️ রিসেট করলে <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">must_change_password</code> ফ্ল্যাগ পুনরায় সক্রিয় হবে।
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer">
              বাতিল
            </button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow cursor-pointer transition">
              পাসওয়ার্ড আপডেট
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditTeacherModalProps {
  isOpen: boolean;
  data: EditTeacherPayload | null;
  setData: (d: EditTeacherPayload | null) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditTeacherModal({ isOpen, data, setData, onClose, onSubmit }: EditTeacherModalProps) {
  const [showPwd, setShowPwd] = useState(false);
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Pencil size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            শিক্ষকের তথ্য এডিট
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs font-bold">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1">আইডি</label>
            <input
              type="text"
              disabled
              value={data.id}
              className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-400 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">শিক্ষকের নাম *</label>
            <input
              type="text"
              required
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-300 transition"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">ফোন নম্বর (লগইন আইডি) *</label>
            <input
              type="text"
              required
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500/30 transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">পদবী</label>
              <input
                type="text"
                value={data.designation}
                onChange={(e) => setData({ ...data, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">জন্ম তারিখ</label>
              <input
                type="date"
                value={data.dob}
                onChange={(e) => setData({ ...data, dob: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">পাসওয়ার্ড</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={data.password || ''}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                placeholder="পরিবর্তন করতে নতুন পাসওয়ার্ড লিখুন"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer">
              বাতিল
            </button>
            <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 dark:text-white font-black rounded-xl text-xs shadow cursor-pointer transition active:scale-95">
              আপডেট করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ViewTeacherModalProps {
  isOpen: boolean;
  teacher: TeacherRecord | null;
  subjectAssignments: SubjectAssignment[];
  classTeachers: ClassTeacherAssignment[];
  onClose: () => void;
}

export function ViewTeacherModal({
  isOpen,
  teacher,
  subjectAssignments,
  classTeachers,
  onClose,
}: ViewTeacherModalProps) {
  if (!isOpen || !teacher) return null;

  const subs = subjectAssignments.filter((sa) => sa.teacherId === teacher.id);
  const classTch = classTeachers.filter((ct) => ct.teacherId === teacher.id);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
              <Eye size={16} className="text-sky-600 dark:text-sky-400" />
            </div>
            শিক্ষকের প্রোফাইল
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
            {teacher.name.charAt(0)}
          </div>
          <div className="space-y-0.5">
            <h4 className="font-black text-lg">{teacher.name}</h4>
            <p className="text-xs text-amber-300 font-extrabold">{teacher.designation}</p>
            <span className="text-[11px] font-mono text-indigo-200 block">{teacher.id}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">ইউজার আইডি (ফোন)</span>
            <strong className="text-indigo-900 dark:text-indigo-200 font-mono text-sm flex items-center gap-1 mt-0.5">
              <Phone size={12} /> {teacher.phone}
            </strong>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">লগইন পাসওয়ার্ড</span>
            <strong className="text-slate-800 dark:text-slate-100 font-mono text-xs flex items-center gap-1 mt-0.5">
              <Key size={12} /> {teacher.passwordHash ? '•••••••• (এনক্রিপ্টেড)' : 'সেট করা নেই'}
            </strong>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">জন্ম তারিখ</span>
            <strong className="text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1 mt-0.5">
              <Calendar size={12} /> {teacher.dob}
            </strong>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">স্ট্যাটাস</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                teacher.status === 'active'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${teacher.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {teacher.status === 'active' ? 'অ্যাক্টিভ' : 'নিষ্ক্রিয়'}
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h5 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={13} className="text-indigo-600 dark:text-indigo-400" /> বন্টিত শ্রেণি ও বিষয়:
          </h5>
          <div className="space-y-2 text-xs">
            {classTch.length > 0 && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-950 dark:text-emerald-200 font-bold">
                👑 শ্রেণি শিক্ষক: <strong>{classTch.map((c) => c.classId).join(', ')}</strong>
              </div>
            )}
            {subs.length === 0 ? (
              <p className="text-slate-400 text-xs italic">কোনো বিষয় এসাইন করা হয়নি।</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {subs.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-[11px] rounded-lg"
                  >
                    {s.classId} → {s.subjectId}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-800 transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
