'use client';

import React from 'react';
import {
  Building2,
  School,
  FileSpreadsheet,
  Users,
  Shield,
  Palette,
  Database,
  Cpu,
  Printer,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';

export type SettingsTab =
  | 'identity'
  | 'committee'
  | 'facilities'
  | 'pad'
  | 'bulk-student'
  | 'security'
  | 'appearance'
  | 'academic'
  | 'sms'
  | 'data'
  | 'system';

export interface TabConfig {
  id: SettingsTab;
  label: string;
  labelBn: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const SETTINGS_TABS: TabConfig[] = [
  { id: 'identity', label: 'Identity', labelBn: 'প্রতিষ্ঠান', icon: <School className="w-4 h-4" />, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-950/50', borderColor: 'border-indigo-200' },
  { id: 'committee', label: 'Managing Committee', labelBn: 'ম্যানেজিং কমিটি', icon: <Users className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/50', borderColor: 'border-emerald-200' },
  { id: 'facilities', label: 'Campus Facilities', labelBn: 'ক্যাম্পাস সুবিধাসমূহ', icon: <Building2 className="w-4 h-4" />, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-950/50', borderColor: 'border-teal-200' },
  { id: 'pad', label: 'School Pad', labelBn: 'স্কুল প্যাড', icon: <Printer className="w-4 h-4" />, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-950/50', borderColor: 'border-sky-200' },
  { id: 'bulk-student', label: 'Bulk Student Upload', labelBn: 'বাল্ক শিক্ষার্থী তথ্য', icon: <FileSpreadsheet className="w-4 h-4" />, color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-950/50', borderColor: 'border-violet-200' },
  { id: 'security', label: 'Security', labelBn: 'নিরাপত্তা', icon: <Shield className="w-4 h-4" />, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-950/50', borderColor: 'border-rose-200' },
  { id: 'appearance', label: 'Appearance', labelBn: 'ডিজাইন', icon: <Palette className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/50', borderColor: 'border-amber-200' },
  { id: 'academic', label: 'Academic', labelBn: 'একাডেমিক', icon: <GraduationCap className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/50', borderColor: 'border-emerald-200' },
  { id: 'sms', label: 'SMS Gateway', labelBn: 'এসএমএস গেটওয়ে', icon: <MessageSquare className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/50', borderColor: 'border-blue-200' },
  { id: 'data', label: 'Data & Backup', labelBn: 'ডাটা ও ব্যাকআপ', icon: <Database className="w-4 h-4" />, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/50', borderColor: 'border-purple-200' },
  { id: 'system', label: 'System', labelBn: 'সিস্টেম', icon: <Cpu className="w-4 h-4" />, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-950/50', borderColor: 'border-sky-200' },
];

export function FormInput({ label, value, onChange, placeholder, required, type = 'text', hint, icon, mono }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  hint?: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white 
          focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all
          placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal ${mono ? 'font-mono tracking-wide' : ''}`}
      />
      {hint && <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug">{hint}</p>}
    </div>
  );
}

export function SettingsCard({ title, subtitle, icon, iconBg, iconColor, children, borderColor, badge }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  children: React.ReactNode;
  borderColor?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className={`bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border ${borderColor || 'border-slate-200 dark:border-slate-800'} shadow-sm space-y-5 transition-all hover:shadow-md`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${iconBg} border border-opacity-20 ${iconColor} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">{title}</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

export function getRoleBadgeColor(role: string): string {
  if (role.includes('সভাপতি') && !role.includes('সহ')) return 'bg-emerald-100 dark:bg-emerald-900/40 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60';
  if (role.includes('সহ-সভাপতি')) return 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-800/60';
  if (role.includes('ক্যাশিয়ার') || role.includes('অর্থ')) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800/60';
  if (role.includes('সেক্রেটারী') || role.includes('সচিব') || role.includes('প্রধান শিক্ষক')) return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800/60';
  if (role.includes('অভিভাবক')) return 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-800/60';
  if (role.includes('শিক্ষক')) return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800/60';
  if (role.includes('প্রতিষ্ঠাতা') || role.includes('দাতা')) return 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800/60';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700';
}
