'use client';

import React from 'react';
import { Globe, Mail, Phone, School, UserCheck } from 'lucide-react';
import { SchoolSettings } from '@/services/settingsService';
import { FormInput, SettingsCard } from './settingsShared';

interface IdentitySettingsTabProps {
  formData: SchoolSettings;
  handleChange: <K extends keyof SchoolSettings>(field: K, value: SchoolSettings[K]) => void;
}

export function IdentitySettingsTab({ formData, handleChange }: IdentitySettingsTabProps) {
  return (
    <div className="space-y-5">
      {/* School Identity Card */}
      <SettingsCard
        title="প্রতিষ্ঠানের মূল তথ্য"
        subtitle="প্রতিষ্ঠানের নাম, EIIN নম্বর, ঠিকানা ও স্থাপিত সাল — সকল ডকুমেন্টে ব্যবহৃত হবে"
        icon={<School className="w-4.5 h-4.5" />}
        iconBg="bg-indigo-50 dark:bg-indigo-950/60"
        iconColor="text-indigo-600 dark:text-indigo-400"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormInput
              id="field-schoolName"
              label="প্রতিষ্ঠানের নাম"
              value={formData.schoolName}
              onChange={(v) => handleChange('schoolName', v)}
              placeholder="যেমন: বরইতলী উচ্চ বিদ্যালয়"
              hint="নম্বরপত্র, সনদপত্র, নোটিশ ও পাবলিক ওয়েবসাইটের শিরোনামে এই নাম দেখাবে।"
              required
            />
          </div>
          <FormInput
            id="field-eiin"
            label="EIIN নম্বর"
            value={formData.eiin}
            onChange={(v) => handleChange('eiin', v)}
            placeholder="যেমন: 106184"
            hint="শিক্ষা বোর্ড প্রদত্ত ৬ ডিজিটের প্রাতিষ্ঠানিক কোড।"
            required
            mono
          />
          <FormInput
            label="স্থাপিত সাল"
            value={formData.estdYear}
            onChange={(v) => handleChange('estdYear', v)}
            placeholder="যেমন: 1969"
            hint="প্রতিষ্ঠান স্থাপনের খ্রিস্টাব্দ।"
            required
            mono
          />
          <div className="sm:col-span-2">
            <FormInput
              label="প্রতিষ্ঠানের ঠিকানা"
              value={formData.address}
              onChange={(v) => handleChange('address', v)}
              placeholder="যেমন: বরইতলী, চকরিয়া, কক্সবাজার"
              required
            />
          </div>
        </div>
      </SettingsCard>

      {/* Authority & Signatures */}
      <SettingsCard
        title="কর্তৃপক্ষ ও স্বাক্ষর লেবেল"
        subtitle="প্রধান শিক্ষকের নাম এবং নম্বরপত্র ও সনদের ফুটার স্বাক্ষর নির্ধারণ করুন"
        icon={<UserCheck className="w-4.5 h-4.5" />}
        iconBg="bg-purple-50 dark:bg-purple-950/60"
        iconColor="text-purple-600 dark:text-purple-400"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            id="field-principalName"
            label="প্রধান শিক্ষকের নাম"
            value={formData.principalName}
            onChange={(v) => handleChange('principalName', v)}
            placeholder="যেমন: মোহাম্মদ রফিকুল ইসলাম"
            hint="প্রত্যয়ন, ছাড়পত্র ও মার্কশিটের স্বাক্ষর অংশে প্রদর্শিত হবে।"
          />
          <FormInput
            label="প্রধান শিক্ষকের পদবি"
            value={formData.principalTitle}
            onChange={(v) => handleChange('principalTitle', v)}
            placeholder="যেমন: প্রধান শিক্ষক"
            required
          />
          <FormInput
            label="শ্রেণি শিক্ষক স্বাক্ষর লেবেল"
            value={formData.classTeacherTitle}
            onChange={(v) => handleChange('classTeacherTitle', v)}
            placeholder="যেমন: শ্রেণি শিক্ষকের স্বাক্ষর"
          />
          <FormInput
            label="অভিভাবক স্বাক্ষর লেবেল"
            value={formData.guardianTitle}
            onChange={(v) => handleChange('guardianTitle', v)}
            placeholder="যেমন: অভিভাবকের স্বাক্ষর"
          />
        </div>
      </SettingsCard>

      {/* Contact Information */}
      <SettingsCard
        id="section-contact"
        title="যোগাযোগের তথ্য"
        subtitle="অফিশিয়াল ফোন নম্বর, ইমেইল ও ওয়েবসাইট ঠিকানা"
        icon={<Phone className="w-4.5 h-4.5" />}
        iconBg="bg-emerald-50 dark:bg-emerald-950/60"
        iconColor="text-emerald-600 dark:text-emerald-400"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput
            label="মোবাইল / ফোন নম্বর"
            value={formData.phone}
            onChange={(v) => handleChange('phone', v)}
            placeholder="যেমন: 01819-000000"
            icon={<Phone className="w-3.5 h-3.5" />}
            mono
          />
          <FormInput
            label="অফিশিয়াল ইমেইল"
            value={formData.email}
            onChange={(v) => handleChange('email', v)}
            placeholder="যেমন: school@gmail.com"
            type="email"
            icon={<Mail className="w-3.5 h-3.5" />}
          />
          <FormInput
            label="ওয়েবসাইট URL"
            value={formData.website}
            onChange={(v) => handleChange('website', v)}
            placeholder="যেমন: www.school.edu.bd"
            icon={<Globe className="w-3.5 h-3.5" />}
          />
        </div>
      </SettingsCard>
    </div>
  );
}
