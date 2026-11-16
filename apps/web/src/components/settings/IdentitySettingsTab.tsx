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
    <>
      {/* School Identity Card */}
      <SettingsCard
        title="প্রতিষ্ঠানের মূল তথ্য"
        subtitle="প্রতিষ্ঠানের নাম, ইআইআইএন, ঠিকানা ও স্থাপিত সাল"
        icon={<School className="w-5 h-5" />}
        iconBg="bg-indigo-50" iconColor="text-indigo-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormInput label="প্রতিষ্ঠানের নাম" value={formData.schoolName} onChange={(v) => handleChange('schoolName', v)} placeholder="যেমন: বরইতলী উচ্চ বিদ্যালয়" required />
          </div>
          <FormInput label="ইআইআইএন" value={formData.eiin} onChange={(v) => handleChange('eiin', v)} placeholder="যেমন: 106184" required mono />
          <FormInput label="স্থাপিত সাল" value={formData.estdYear} onChange={(v) => handleChange('estdYear', v)} placeholder="যেমন: 1969" required mono />
          <div className="sm:col-span-2">
            <FormInput label="প্রতিষ্ঠানের ঠিকানা" value={formData.address} onChange={(v) => handleChange('address', v)} placeholder="যেমন: চকরিয়া, কক্সবাজার" required />
          </div>
        </div>
      </SettingsCard>

      {/* Authority & Signatures */}
      <SettingsCard
        title="কর্তৃপক্ষ ও ফুটার স্বাক্ষর"
        subtitle="প্রধান শিক্ষকের নাম ও নম্বরপত্রের ফুটার স্বাক্ষর সেট করুন"
        icon={<UserCheck className="w-5 h-5" />}
        iconBg="bg-purple-50" iconColor="text-purple-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="প্রধান শিক্ষকের নাম" value={formData.principalName} onChange={(v) => handleChange('principalName', v)} placeholder="যেমন: মোহাম্মদ রফিকুল ইসলাম" />
          <FormInput label="প্রধান শিক্ষকের পদবী" value={formData.principalTitle} onChange={(v) => handleChange('principalTitle', v)} placeholder="যেমন: প্রধান শিক্ষক" required />
          <FormInput label="শ্রেণি শিক্ষক লেবেল" value={formData.classTeacherTitle} onChange={(v) => handleChange('classTeacherTitle', v)} placeholder="যেমন: শ্রেণি শিক্ষকের স্বাক্ষর" />
          <FormInput label="অভিভাবক লেবেল" value={formData.guardianTitle} onChange={(v) => handleChange('guardianTitle', v)} placeholder="যেমন: অভিভাবকের স্বাক্ষর" />
        </div>
      </SettingsCard>

      {/* Contact Information */}
      <SettingsCard
        title="যোগাযোগের তথ্য"
        subtitle="ফোন, ইমেইল ও ওয়েবসাইট"
        icon={<Phone className="w-5 h-5" />}
        iconBg="bg-emerald-50" iconColor="text-emerald-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput label="মোবাইল/ফোন নম্বর" value={formData.phone} onChange={(v) => handleChange('phone', v)} placeholder="যেমন: 01819-000000" icon={<Phone className="w-3.5 h-3.5" />} mono />
          <FormInput label="অফিশিয়াল ইমেইল" value={formData.email} onChange={(v) => handleChange('email', v)} placeholder="যেমন: school@gmail.com" type="email" icon={<Mail className="w-3.5 h-3.5" />} />
          <FormInput label="ওয়েবসাইট URL" value={formData.website} onChange={(v) => handleChange('website', v)} placeholder="যেমন: www.school.edu.bd" icon={<Globe className="w-3.5 h-3.5" />} />
        </div>
      </SettingsCard>
    </>
  );
}
