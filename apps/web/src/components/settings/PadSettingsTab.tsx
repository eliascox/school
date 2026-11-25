'use client';

import React from 'react';
import Link from 'next/link';
import { Award, BarChart3, Bell, FileText, Sparkles } from 'lucide-react';
import PadSettingsPanel from '@/components/PadSettingsPanel';
import { SchoolSettings } from '@/services/settingsService';

interface PadSettingsTabProps {
  formData: SchoolSettings;
  onPadSaved?: (updated: SchoolSettings) => void;
}

const PAD_LINKED_MODULES = [
  { href: '/dashboard/certificates/', label: 'প্রত্যয়ন ও সনদপত্র', icon: Award },
  { href: '/dashboard/notices/', label: 'অফিশিয়াল নোটিশ বোর্ড', icon: Bell },
  { href: '/dashboard/exam/rank-result/', label: 'মেধা তালিকা ও ফলাফল', icon: FileText },
  { href: '/dashboard/students/?tab=summary', label: 'শিক্ষার্থী পরিসংখ্যান', icon: BarChart3 },
];

export function PadSettingsTab({ formData, onPadSaved }: PadSettingsTabProps) {
  return (
    <div className="space-y-5 w-full print:space-y-0 print:m-0 print:p-0">
      {/* Unified Executive Split-Pane Pad Calibration Studio (Shared with Certificates) */}
      <PadSettingsPanel
        isModal={false}
        compactLayout={true}
        initialSettings={formData}
        onSaved={onPadSaved}
      />

      {/* Compact Connected Modules Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200 shrink-0">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>এই প্যাড স্বয়ংক্রিয়ভাবে ব্যবহৃত হয়:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PAD_LINKED_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-[11.5px] font-bold flex items-center gap-1.5 transition"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-500" />
                <span>{mod.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
