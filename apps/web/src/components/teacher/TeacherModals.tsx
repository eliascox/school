'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  Check,
  Clock,
  Copy,
  Droplets,
  Eye,
  EyeOff,
  GraduationCap,
  Hash,
  Key,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  ClassTeacherAssignment,
  SubjectAssignment,
  TeacherRecord,
} from '@/services/teacherRBACService';
import { compressImage } from '@/lib/imageUtils';
import {
  BLOOD_GROUP_OPTIONS,
  TEACHER_DESIGNATION_PRESETS,
  formatClassSectionLabelBn,
  formatClassShortLabelBn,
  generateSecureTeacherPassword,
  toBanglaDigits,
} from './teacherUtils';

export interface AddTeacherPayload {
  name: string;
  phone: string;
  designation: string;
  dob: string;
  initialPassword: string;
  qualification: string;
  indexNo: string;
  joiningDate: string;
  email: string;
  bloodGroup: string;
  subjectSpecialty: string;
  photoUrl: string;
}

export interface EditTeacherPayload {
  id: string;
  name: string;
  phone: string;
  designation: string;
  dob: string;
  password?: string;
  status: 'active' | 'inactive';
  qualification?: string;
  indexNo?: string;
  joiningDate?: string;
  email?: string;
  bloodGroup?: string;
  subjectSpecialty?: string;
  photoUrl?: string;
}

const INPUT_CLASS =
  'w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] focus:ring-2 focus:ring-[#0B5D3B]/15 transition';

const LABEL_CLASS = 'block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1';

function useEscapeToClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
}

function AvatarUploader({
  name,
  photoUrl,
  onPhotoChange,
}: {
  name: string;
  photoUrl?: string;
  onPhotoChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, 240, 240, 0.82, true);
      if (compressed) onPhotoChange(compressed);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-3.5 p-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl">
      <div className="w-14 h-14 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-lg flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name || 'শিক্ষকের ছবি'} className="w-full h-full object-cover" />
        ) : (
          <span>{(name || 'শ').trim().charAt(0) || 'শ'}</span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
          শিক্ষকের ছবি (ঐচ্ছিক)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <Camera size={12} />
            {uploading ? 'প্রসেসিং...' : photoUrl ? 'ছবি পরিবর্তন' : 'ছবি আপলোড'}
          </button>
          {photoUrl && (
            <button
              type="button"
              onClick={() => onPhotoChange('')}
              className="px-2 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg inline-flex items-center gap-1 cursor-pointer transition"
            >
              <Trash2 size={11} /> সরান
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADD TEACHER MODAL ────────────────────────────────────────────────
interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: AddTeacherPayload;
  setForm: React.Dispatch<React.SetStateAction<AddTeacherPayload>>;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddTeacherModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
}: AddTeacherModalProps) {
  const [showPwd, setShowPwd] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);
  useEscapeToClose(isOpen, onClose);

  if (!isOpen) return null;

  const handleGeneratePwd = () => {
    const generated = generateSecureTeacherPassword(8);
    setForm((prev) => ({ ...prev, initialPassword: generated }));
    setShowPwd(true);
  };

  const handleCopyPwd = async () => {
    if (!form.initialPassword) return;
    try {
      await navigator.clipboard.writeText(form.initialPassword);
      setCopiedPwd(true);
      setTimeout(() => setCopiedPwd(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400">
              <UserPlus size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                নতুন শিক্ষক / স্টাফ নিবন্ধন
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                ব্যক্তিগত তথ্য, পদবী ও পোর্টাল লগইন ক্রেডেনশিয়াল নির্ধারণ করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="বন্ধ করুন"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="overflow-y-auto p-5 space-y-4">
          <AvatarUploader
            name={form.name}
            photoUrl={form.photoUrl}
            onPhotoChange={(photoUrl) => setForm((prev) => ({ ...prev, photoUrl }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>শিক্ষকের পূর্ণ নাম *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="যেমন: মোঃ আব্দুর রহিম"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>মোবাইল নম্বর (লগইন আইডি) *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="যেমন: 01711000000"
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>পদবী *</label>
              <input
                type="text"
                required
                list="teacher-designation-presets-add"
                value={form.designation}
                onChange={(e) => setForm((prev) => ({ ...prev, designation: e.target.value }))}
                placeholder="সহকারী শিক্ষক"
                className={INPUT_CLASS}
              />
              <datalist id="teacher-designation-presets-add">
                {TEACHER_DESIGNATION_PRESETS.map((preset) => (
                  <option key={preset} value={preset} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={LABEL_CLASS}>শিক্ষাগত যোগ্যতা</label>
              <input
                type="text"
                value={form.qualification}
                onChange={(e) => setForm((prev) => ({ ...prev, qualification: e.target.value }))}
                placeholder="যেমন: এম.এসসি (গণিত), বি.এড"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>ইনডেক্স / এমপিও নম্বর</label>
              <input
                type="text"
                value={form.indexNo}
                onChange={(e) => setForm((prev) => ({ ...prev, indexNo: e.target.value }))}
                placeholder="যেমন: N1048291"
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>মূল বিষয় / দক্ষতা</label>
              <input
                type="text"
                value={form.subjectSpecialty}
                onChange={(e) => setForm((prev) => ({ ...prev, subjectSpecialty: e.target.value }))}
                placeholder="যেমন: গণিত ও পদার্থবিজ্ঞান"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>যোগদানের তারিখ</label>
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => setForm((prev) => ({ ...prev, joiningDate: e.target.value }))}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>জন্ম তারিখ</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm((prev) => ({ ...prev, dob: e.target.value }))}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>রক্তের গ্রুপ</label>
              <select
                value={form.bloodGroup}
                onChange={(e) => setForm((prev) => ({ ...prev, bloodGroup: e.target.value }))}
                className={INPUT_CLASS}
              >
                <option value="">নির্বাচন করুন</option>
                {BLOOD_GROUP_OPTIONS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>ইমেইল (ঐচ্ছিক)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="teacher@school.edu.bd"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                প্রাথমিক লগইন পাসওয়ার্ড *
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGeneratePwd}
                  className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 text-[#0B5D3B] dark:text-emerald-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                >
                  <RefreshCw size={11} /> জেনারেট
                </button>
                {form.initialPassword && (
                  <button
                    type="button"
                    onClick={handleCopyPwd}
                    className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedPwd ? <Check size={11} className="text-[#0B5D3B]" /> : <Copy size={11} />}
                    {copiedPwd ? 'কপি হয়েছে' : 'কপি'}
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                minLength={6}
                value={form.initialPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, initialPassword: e.target.value }))}
                placeholder="কমপক্ষে ৬ অক্ষরের অস্থায়ী পাসওয়ার্ড লিখুন"
                className={`${INPUT_CLASS} font-mono pr-10 bg-white dark:bg-slate-900`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="পাসওয়ার্ড দেখান বা লুকান"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              নিরাপত্তার স্বার্থে প্রথমবার লগইনের সময় শিক্ষককে নিজস্ব নতুন পাসওয়ার্ড সেট করতে হবে।
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0B5D3B] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition active:scale-[0.98]"
            >
              শিক্ষক সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── RESET PASSWORD MODAL ─────────────────────────────────────────────
interface ResetPasswordModalProps {
  isOpen: boolean;
  teacher?: TeacherRecord | null;
  onClose: () => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ResetPasswordModal({
  isOpen,
  teacher,
  onClose,
  newPassword,
  setNewPassword,
  onSubmit,
}: ResetPasswordModalProps) {
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);
  useEscapeToClose(isOpen, onClose);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setNewPassword(generateSecureTeacherPassword(8));
    setShowPwd(true);
  };

  const handleCopyCredentials = async () => {
    if (!newPassword) return;
    const text = teacher
      ? `শিক্ষক: ${teacher.name}\nইউজার আইডি: ${teacher.phone}\nনতুন অস্থায়ী পাসওয়ার্ড: ${newPassword}`
      : newPassword;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400">
              <Key size={15} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                লগইন পাসওয়ার্ড রিসেট
              </h3>
              {teacher && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  {teacher.name} • <span className="font-mono">{teacher.phone}</span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer text-slate-400"
            aria-label="বন্ধ করুন"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                নতুন অস্থায়ী পাসওয়ার্ড *
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 text-[#0B5D3B] dark:text-emerald-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                >
                  <RefreshCw size={11} /> জেনারেট
                </button>
                {newPassword && (
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    {copied ? <Check size={11} className="text-[#0B5D3B]" /> : <Copy size={11} />}
                    {copied ? 'কপি হয়েছে' : 'ক্রেডেনশিয়াল কপি'}
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
                className={`${INPUT_CLASS} font-mono pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="পাসওয়ার্ড দেখান বা লুকান"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 rounded-xl text-[11px] font-medium leading-relaxed">
            পাসওয়ার্ড রিসেট করার পর শিক্ষক পরবর্তী লগইনে বাধ্যতামূলকভাবে নতুন ব্যক্তিগত পাসওয়ার্ড নির্ধারণ করবেন।
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0B5D3B] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition active:scale-[0.98]"
            >
              পাসওয়ার্ড আপডেট করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── EDIT TEACHER MODAL ───────────────────────────────────────────────
interface EditTeacherModalProps {
  isOpen: boolean;
  data: EditTeacherPayload | null;
  setData: (d: EditTeacherPayload | null) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditTeacherModal({
  isOpen,
  data,
  setData,
  onClose,
  onSubmit,
}: EditTeacherModalProps) {
  const [showPwd, setShowPwd] = useState(false);
  useEscapeToClose(isOpen, onClose);

  if (!isOpen || !data) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200">
              <Pencil size={15} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                শিক্ষকের প্রোফাইল সম্পাদনা
              </h3>
              <p className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                আইডি: {data.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer text-slate-400"
            aria-label="বন্ধ করুন"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="overflow-y-auto p-5 space-y-4">
          <AvatarUploader
            name={data.name}
            photoUrl={data.photoUrl}
            onPhotoChange={(photoUrl) => setData({ ...data, photoUrl })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>শিক্ষকের পূর্ণ নাম *</label>
              <input
                type="text"
                required
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>মোবাইল নম্বর (লগইন আইডি) *</label>
              <input
                type="text"
                required
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>পদবী *</label>
              <input
                type="text"
                required
                list="teacher-designation-presets-edit"
                value={data.designation}
                onChange={(e) => setData({ ...data, designation: e.target.value })}
                className={INPUT_CLASS}
              />
              <datalist id="teacher-designation-presets-edit">
                {TEACHER_DESIGNATION_PRESETS.map((preset) => (
                  <option key={preset} value={preset} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={LABEL_CLASS}>অ্যাকাউন্ট স্ট্যাটাস</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setData({ ...data, status: 'active' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    data.status === 'active'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  সক্রিয়
                </button>
                <button
                  type="button"
                  onClick={() => setData({ ...data, status: 'inactive' })}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    data.status === 'inactive'
                      ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  নিষ্ক্রিয়
                </button>
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>শিক্ষাগত যোগ্যতা</label>
              <input
                type="text"
                value={data.qualification || ''}
                onChange={(e) => setData({ ...data, qualification: e.target.value })}
                placeholder="যেমন: এম.এ (বাংলা), বি.এড"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>ইনডেক্স / এমপিও নম্বর</label>
              <input
                type="text"
                value={data.indexNo || ''}
                onChange={(e) => setData({ ...data, indexNo: e.target.value })}
                placeholder="যেমন: N1048291"
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>মূল বিষয় / দক্ষতা</label>
              <input
                type="text"
                value={data.subjectSpecialty || ''}
                onChange={(e) => setData({ ...data, subjectSpecialty: e.target.value })}
                placeholder="যেমন: ইংরেজি"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>যোগদানের তারিখ</label>
              <input
                type="date"
                value={data.joiningDate || ''}
                onChange={(e) => setData({ ...data, joiningDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>জন্ম তারিখ</label>
              <input
                type="date"
                value={data.dob}
                onChange={(e) => setData({ ...data, dob: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>রক্তের গ্রুপ</label>
              <select
                value={data.bloodGroup || ''}
                onChange={(e) => setData({ ...data, bloodGroup: e.target.value })}
                className={INPUT_CLASS}
              >
                <option value="">নির্বাচন করুন</option>
                {BLOOD_GROUP_OPTIONS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>ইমেইল</label>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="teacher@school.edu.bd"
                className={INPUT_CLASS}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>নতুন পাসওয়ার্ড (পরিবর্তন না করলে খালি রাখুন)</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={data.password || ''}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  placeholder="পরিবর্তন করতে কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড লিখুন"
                  className={`${INPUT_CLASS} font-mono pr-10`}
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
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0B5D3B] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition active:scale-[0.98]"
            >
              পরিবর্তন সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── VIEW TEACHER PROFILE MODAL ───────────────────────────────────────
interface ViewTeacherModalProps {
  isOpen: boolean;
  teacher: TeacherRecord | null;
  subjectAssignments: SubjectAssignment[];
  classTeachers: ClassTeacherAssignment[];
  weeklyPeriodCount?: number;
  onClose: () => void;
  onEdit?: (teacher: TeacherRecord) => void;
  onAssignSubject?: (teacherId: string) => void;
  onResetPassword?: (teacher: TeacherRecord) => void;
}

export function ViewTeacherModal({
  isOpen,
  teacher,
  subjectAssignments,
  classTeachers,
  weeklyPeriodCount = 0,
  onClose,
  onEdit,
  onAssignSubject,
  onResetPassword,
}: ViewTeacherModalProps) {
  const [copiedPhone, setCopiedPhone] = useState(false);
  useEscapeToClose(isOpen, onClose);

  if (!isOpen || !teacher) return null;

  const subs = subjectAssignments.filter((sa) => sa.teacherId === teacher.id);
  const classTch = classTeachers.filter((ct) => ct.teacherId === teacher.id);

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(teacher.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1600);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Briefcase size={15} className="text-[#0B5D3B] dark:text-emerald-400" />
            শিক্ষক সার্ভিস প্রোফাইল
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer text-slate-400"
            aria-label="বন্ধ করুন"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Calm Executive Identity Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-2xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
              {teacher.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={teacher.photoUrl} alt={teacher.name} className="w-full h-full object-cover" />
              ) : (
                <span>{teacher.name.charAt(0)}</span>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
                  {teacher.name}
                </h4>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    teacher.status === 'active'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      teacher.status === 'active' ? 'bg-emerald-600' : 'bg-slate-400'
                    }`}
                  />
                  {teacher.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </span>
              </div>

              <p className="text-xs font-bold text-[#0B5D3B] dark:text-emerald-400">
                {teacher.designation}
                {teacher.subjectSpecialty ? ` • ${teacher.subjectSpecialty}` : ''}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold pt-0.5">
                <span className="font-mono px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200">
                  {teacher.id}
                </span>
                {teacher.indexNo && (
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Hash size={11} /> ইনডেক্স: {teacher.indexNo}
                  </span>
                )}
                {weeklyPeriodCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200">
                    <Clock size={11} className="text-[#0B5D3B] dark:text-emerald-400" />
                    সাপ্তাহিক {toBanglaDigits(weeklyPeriodCount)} পিরিয়ড
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Institutional Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                  মোবাইল নম্বর (লগইন আইডি)
                </span>
                <strong className="text-slate-900 dark:text-white font-mono text-xs flex items-center gap-1.5 mt-0.5">
                  <Phone size={12} className="text-slate-400 shrink-0" /> {teacher.phone}
                </strong>
              </div>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 cursor-pointer transition shrink-0"
                title="নম্বর কপি করুন"
              >
                {copiedPhone ? <Check size={13} className="text-[#0B5D3B]" /> : <Copy size={13} />}
              </button>
            </div>

            <div className="p-3 bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                অ্যাকাউন্ট ও নিরাপত্তা
              </span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5 mt-0.5">
                <ShieldCheck size={12} className="text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                {teacher.mustChangePassword ? 'প্রথম লগইনে পাসওয়ার্ড পরিবর্তন বাকি' : 'পাসওয়ার্ড ভেরিফায়েড'}
              </strong>
            </div>

            <div className="p-3 bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                শিক্ষাগত যোগ্যতা
              </span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5 mt-0.5">
                <GraduationCap size={12} className="text-slate-400 shrink-0" />
                {teacher.qualification || 'উল্লেখ নেই'}
              </strong>
            </div>

            <div className="p-3 bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                যোগদানের তারিখ ও জন্ম তারিখ
              </span>
              <strong className="text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5 mt-0.5">
                <Calendar size={12} className="text-slate-400 shrink-0" />
                {teacher.joiningDate ? `যোগদান: ${teacher.joiningDate}` : `জন্ম: ${teacher.dob || '—'}`}
              </strong>
            </div>

            {(teacher.email || teacher.bloodGroup) && (
              <>
                <div className="p-3 bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                    ইমেইল
                  </span>
                  <strong className="text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5 mt-0.5 truncate">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{teacher.email || 'উল্লেখ নেই'}</span>
                  </strong>
                </div>
                <div className="p-3 bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                    রক্তের গ্রুপ
                  </span>
                  <strong className="text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5 mt-0.5">
                    <Droplets size={12} className="text-rose-500 shrink-0" />
                    {teacher.bloodGroup || 'উল্লেখ নেই'}
                  </strong>
                </div>
              </>
            )}
          </div>

          {/* Academic Responsibilities */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
              <BookOpen size={13} className="text-[#0B5D3B] dark:text-emerald-400" />
              একাডেমিক দায়িত্ব ও বরাদ্দকৃত বিষয় ({toBanglaDigits(subs.length)})
            </h5>

            {classTch.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {classTch.map((ct) => (
                  <span
                    key={ct.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg text-[#0B5D3B] dark:text-emerald-300 text-xs font-bold"
                  >
                    <Award size={12} />
                    শ্রেণি শিক্ষক: {formatClassSectionLabelBn(ct.classId)}
                  </span>
                ))}
              </div>
            )}

            {subs.length === 0 ? (
              <p className="text-slate-400 text-xs font-medium">
                এখনও কোনো শ্রেণি বা বিষয় বরাদ্দ করা হয়নি।
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {subs.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] rounded-lg"
                  >
                    {formatClassShortLabelBn(s.classId)} • {s.subjectId}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(teacher);
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <Pencil size={12} /> এডিট
              </button>
            )}
            {onAssignSubject && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAssignSubject(teacher.id);
                }}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#0B5D3B] dark:text-emerald-300 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <Plus size={12} /> বিষয় অ্যাসাইন
              </button>
            )}
            {onResetPassword && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResetPassword(teacher);
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition"
              >
                <Key size={12} /> পাসওয়ার্ড রিসেট
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-xs cursor-pointer transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
