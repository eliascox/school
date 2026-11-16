'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  CommitteeMember,
  DEFAULT_COMMITTEE_MEMBERS,
  SchoolSettings,
  settingsService,
} from '@/services/settingsService';
import { validateAndSanitizeImage } from '@/lib/securityUtils';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import { getRoleBadgeColor } from './settingsShared';

interface CommitteeSettingsTabProps {
  formData: SchoolSettings;
  setFormData: React.Dispatch<React.SetStateAction<SchoolSettings>>;
}

export function CommitteeSettingsTab({ formData, setFormData }: CommitteeSettingsTabProps) {
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [committeeAlert, setCommitteeAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [committeeSearchQuery, setCommitteeSearchQuery] = useState('');
  const [committeeForm, setCommitteeForm] = useState<Partial<CommitteeMember>>({
    name: '',
    role: 'সভাপতি',
    tenure: '২০২৪ – ২০২৬ খ্রিঃ (৩ বছর)',
    joiningDate: '০১ জানুয়ারি ২০২৪',
    phone: '',
    email: '',
    photo: '',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-900/40 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60',
    bio: '',
    facebook: '',
    linkedin: '',
  });

  const currentCommitteeMembers: CommitteeMember[] =
    formData.committeeMembers && formData.committeeMembers.length > 0
      ? formData.committeeMembers
      : DEFAULT_COMMITTEE_MEMBERS;

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setCommitteeForm({
      name: '',
      role: 'সদস্য',
      tenure: '২০২৪ – ২০২৬ খ্রিঃ (৩ বছর)',
      joiningDate: '০১ জানুয়ারি ২০২৪',
      phone: '',
      email: '',
      photo: '',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/40 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60',
      bio: '',
      facebook: '',
      linkedin: '',
    });
    setIsCommitteeModalOpen(true);
  };

  const handleOpenEditMember = (member: CommitteeMember) => {
    setEditingMember(member);
    setCommitteeForm({ ...member });
    setIsCommitteeModalOpen(true);
  };

  const handleMemberPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await validateAndSanitizeImage(file, {
        maxSizeMB: 2,
        maxWidth: 400,
        maxHeight: 500,
        quality: 0.85,
      });
      if (result.valid && result.sanitizedDataUrl) {
        setCommitteeForm((prev) => ({ ...prev, photo: result.sanitizedDataUrl }));
      } else {
        showToast(result.error || 'ছবির ফাইলটি সঠিক নয়।', 'error');
      }
    }
  };

  const handleSaveCommitteeMember = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!committeeForm.name?.trim()) {
      showToast('অনুগ্রহ করে সদস্যের নাম পূরণ করুন!', 'warning');
      return;
    }
    if (!committeeForm.role?.trim()) {
      showToast('অনুগ্রহ করে সদস্যের পদবি পূরণ করুন!', 'warning');
      return;
    }

    const members = [...currentCommitteeMembers];
    const role = committeeForm.role.trim();
    const badgeColor = committeeForm.badgeColor || getRoleBadgeColor(role);

    if (editingMember) {
      const idx = members.findIndex((m) => m.id === editingMember.id);
      if (idx !== -1) {
        members[idx] = {
          ...editingMember,
          ...committeeForm,
          name: committeeForm.name.trim(),
          role,
          badgeColor,
        } as CommitteeMember;
      }
    } else {
      const newMember: CommitteeMember = {
        id: `CM-${Date.now()}`,
        name: committeeForm.name.trim(),
        role,
        tenure: committeeForm.tenure?.trim() || '২০২৪ – ২০২৬ খ্রিঃ (৩ বছর)',
        joiningDate: committeeForm.joiningDate?.trim() || '০১ জানুয়ারি ২০২৪',
        phone: committeeForm.phone?.trim() || '',
        email: committeeForm.email?.trim() || '',
        photo: committeeForm.photo || '',
        badgeColor,
        bio: committeeForm.bio?.trim() || '',
        facebook: committeeForm.facebook?.trim() || '',
        linkedin: committeeForm.linkedin?.trim() || '',
        order: members.length + 1,
      };
      members.push(newMember);
    }

    settingsService.updateSettings({ committeeMembers: members });
    setFormData((prev) => ({ ...prev, committeeMembers: members }));
    setIsCommitteeModalOpen(false);
    setCommitteeAlert({
      type: 'success',
      message: editingMember
        ? 'কমিটি সদস্যের তথ্য সফলভাবে হালনাগাদ ও ওয়েবসাইটে সিঙ্ক হয়েছে!'
        : 'নতুন সদস্য সফলভাবে যুক্ত ও ওয়েবসাইটে সিঙ্ক হয়েছে!',
    });
    setTimeout(() => setCommitteeAlert(null), 4000);
  };

  const handleDeleteMember = async (memberId: string) => {
    const member = currentCommitteeMembers.find((m) => m.id === memberId);
    if (!member) return;
    if (
      await confirmDialog({
        title: 'কমিটি সদস্য মুছে ফেলুন',
        message: `আপনি কি নিশ্চিত যে "${member.name}" (${member.role})-কে কমিটি তালিকা থেকে মুছে ফেলতে চান?`,
        confirmLabel: 'মুছে ফেলুন',
        danger: true,
      })
    ) {
      const updated = currentCommitteeMembers.filter((m) => m.id !== memberId);
      settingsService.updateSettings({ committeeMembers: updated });
      setFormData((prev) => ({ ...prev, committeeMembers: updated }));
      setCommitteeAlert({
        type: 'success',
        message: 'সদস্যকে সফলভাবে কমিটি তালিকা থেকে মুছে ফেলা হয়েছে।',
      });
      setTimeout(() => setCommitteeAlert(null), 3000);
    }
  };

  const handleMoveMember = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentCommitteeMembers.length) return;
    const members = [...currentCommitteeMembers];
    const temp = members[index];
    members[index] = members[targetIndex];
    members[targetIndex] = temp;
    settingsService.updateSettings({ committeeMembers: members });
    setFormData((prev) => ({ ...prev, committeeMembers: members }));
  };

  const handleResetCommittee = async () => {
    if (
      await confirmDialog({
        title: 'কমিটি তথ্য পুনরুদ্ধার',
        message: 'আপনি কি ডিফল্ট ৪ সদস্যের ম্যানেজিং কমিটি তথ্য পুনরুদ্ধার করতে চান? এতে বর্তমান কাস্টম কমিটির তথ্য মুছে যাবে।',
        confirmLabel: 'পুনরুদ্ধার করুন',
        danger: true,
      })
    ) {
      settingsService.updateSettings({ committeeMembers: DEFAULT_COMMITTEE_MEMBERS });
      setFormData((prev) => ({ ...prev, committeeMembers: DEFAULT_COMMITTEE_MEMBERS }));
      setCommitteeAlert({
        type: 'success',
        message: 'ম্যানেজিং কমিটির তথ্য সফলভাবে ডিফল্ট মানে রিসেট করা হয়েছে।',
      });
      setTimeout(() => setCommitteeAlert(null), 4000);
    }
  };

  const filteredMembers = currentCommitteeMembers.filter(
    (m) =>
      !committeeSearchQuery ||
      m.name.toLowerCase().includes(committeeSearchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(committeeSearchQuery.toLowerCase()) ||
      (m.phone && m.phone.includes(committeeSearchQuery))
  );

  return (
    <>
      {/* Header Card & Actions */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>ম্যানেজিং কমিটি ও পরিচালনা পর্ষদ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              বিদ্যালয় পরিচালনা কমিটির সদস্য ব্যবস্থাপনা
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              কমিটির সদস্যদের নাম, পদবি, মেয়াদকাল, ছবি ও যোগাযোগের তথ্য হালনাগাদ করুন। এখানে সংরক্ষিত তথ্য মূল ওয়েবসাইটের <strong>&quot;পরিচালনা পর্ষদ&quot;</strong> সেকশনে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddMember}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 dark:text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন সদস্য যোগ করুন</span>
            </button>

            <button
              type="button"
              onClick={handleResetCommittee}
              title="ডিফল্ট ৪ সদস্যের কমিটি রিস্টোর করুন"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 dark:hover:bg-slate-800 text-white font-bold text-xs border border-white/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">ডিফল্ট রিস্টোর</span>
            </button>

            <Link
              href="/#committee"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 dark:hover:bg-slate-800 text-white font-bold text-xs border border-white/20 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">ওয়েবসাইটে দেখুন</span>
            </Link>
          </div>
        </div>

        {/* Auto Sync Banner */}
        <div className="mt-5 pt-4 border-t border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>অটো-সিঙ্ক সক্রিয়:</strong> কোনো পরিবর্তন সেভ করার সাথে সাথে ওয়েবসাইটের হোমপেজে (#committee) লাইভ প্রতিফলিত হবে।</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-700/50">
            <span>মোট সদস্য:</span>
            <span className="font-bold text-amber-300">{currentCommitteeMembers.length} জন</span>
          </div>
        </div>
      </div>

      {/* Committee Alert Banner */}
      {committeeAlert && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border transition-all ${
            committeeAlert.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{committeeAlert.message}</span>
          <button onClick={() => setCommitteeAlert(null)} className="ml-auto p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={committeeSearchQuery}
            onChange={(e) => setCommitteeSearchQuery(e.target.value)}
            placeholder="সদস্যের নাম, পদবি বা ফোন নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
          />
          {committeeSearchQuery && (
            <button onClick={() => setCommitteeSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <span>প্রদর্শিত সদস্য:</span>
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-mono">
            {filteredMembers.length} জন
          </span>
        </div>
      </div>

      {/* Committee Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.map((member, idx) => (
          <div
            key={member.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shadow-xs">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=500&auto=format&fit=crop';
                        }}
                      />
                    ) : (
                      <span className="text-xl font-black text-emerald-800 dark:text-emerald-200">
                        {member.name ? member.name.charAt(0) : 'ক'}
                      </span>
                    )}
                  </div>
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {idx + 1}
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${member.badgeColor || getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white truncate" title={member.name}>
                    {member.name}
                  </h3>
                  {member.tenure && (
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{member.tenure}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                {member.phone ? (
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-mono font-medium">{member.phone}</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-[11px] italic">ফোন নম্বর যুক্ত করা হয়নি</div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">{member.email}</span>
                  </div>
                )}
                {member.joiningDate && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>যোগদান: {member.joiningDate}</span>
                  </div>
                )}
              </div>

              {member.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2 bg-emerald-50/50 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-100/50 dark:border-emerald-800/60">
                  &quot;{member.bio}&quot;
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveMember(idx, 'up')}
                  disabled={idx === 0}
                  title="উপরে স্থানান্তর করুন"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-slate-600 dark:text-slate-400"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveMember(idx, 'down')}
                  disabled={idx === currentCommitteeMembers.length - 1}
                  title="নিচে স্থানান্তর করুন"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-slate-600 dark:text-slate-400"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditMember(member)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-800"
                >
                  <Pencil className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>সম্পাদনা</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteMember(member.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-800"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>মুছুন</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {currentCommitteeMembers.length === 0 && (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">বর্তমানে কোনো সদস্য নেই</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">ম্যানেজিং কমিটিতে নতুন সদস্য যোগ করতে নিচের বাটনে চাপ দিন।</p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleOpenAddMember}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> সদস্য যোগ করুন
            </button>
            <button
              type="button"
              onClick={handleResetCommittee}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> ডিফল্ট কমিটি লোড করুন
            </button>
          </div>
        </div>
      )}

      {/* Committee Member Add/Edit Modal */}
      {isCommitteeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsCommitteeModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-50 dark:from-emerald-950/50 via-teal-50 dark:via-teal-950/30 to-white dark:to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {editingMember ? 'কমিটির সদস্য তথ্য সম্পাদনা' : 'নতুন কমিটির সদস্য যোগ'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    সদস্যের তথ্য পূরণ করে সংরক্ষণ করুন, সরাসরি মূল ওয়েবসাইটে আপডেট হবে
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCommitteeModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommitteeMember} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    সদস্যের নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={committeeForm.name || ''}
                    onChange={(e) => setCommitteeForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="যেমন: আলহাজ্ব মোস্তফা কামাল"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>পদবি / দায়িত্ব <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">নিচের তালিকা থেকে নির্বাচন করুন বা টাইপ করুন</span>
                  </label>

                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {[
                      'সভাপতি',
                      'সহ-সভাপতি',
                      'ক্যাশিয়ার (অর্থ সম্পাদক)',
                      'সেক্রেটারী (সদস্য সচিব)',
                      'অভিভাবক সদস্য',
                      'শিক্ষক প্রতিনিধি',
                      'প্রতিষ্ঠাতা সদস্য',
                      'বিদ্যোৎসাহী সদস্য',
                      'দাতা সদস্য',
                    ].map((presetRole) => (
                      <button
                        key={presetRole}
                        type="button"
                        onClick={() => {
                          setCommitteeForm((prev) => ({
                            ...prev,
                            role: presetRole,
                            badgeColor: getRoleBadgeColor(presetRole),
                          }));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          committeeForm.role === presetRole
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300'
                        }`}
                      >
                        {presetRole}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={committeeForm.role || ''}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setCommitteeForm((prev) => ({
                        ...prev,
                        role: newRole,
                        badgeColor: getRoleBadgeColor(newRole),
                      }));
                    }}
                    placeholder="যেমন: সভাপতি"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">মেয়াদকাল</label>
                  <input
                    type="text"
                    value={committeeForm.tenure || ''}
                    onChange={(e) => setCommitteeForm((prev) => ({ ...prev, tenure: e.target.value }))}
                    placeholder="যেমন: ২০২৪ – ২০২৬ খ্রিঃ (৩ বছর)"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">যোগদানের তারিখ</label>
                  <input
                    type="text"
                    value={committeeForm.joiningDate || ''}
                    onChange={(e) => setCommitteeForm((prev) => ({ ...prev, joiningDate: e.target.value }))}
                    placeholder="যেমন: ০১ জানুয়ারি ২০২৪"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={committeeForm.phone || ''}
                    onChange={(e) => setCommitteeForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="যেমন: +880 1712-345678"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ইমেইল এড্রেস</label>
                  <input
                    type="email"
                    value={committeeForm.email || ''}
                    onChange={(e) => setCommitteeForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="যেমন: member@school.edu.bd"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>সদস্যের ছবি</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">কম্পিউটার/মোবাইল থেকে আপলোড করুন বা লিংক দিন</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-xs">
                    {committeeForm.photo ? (
                      <img
                        src={committeeForm.photo}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=500&auto=format&fit=crop';
                        }}
                      />
                    ) : (
                      <Users className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>ছবি আপলোড করুন</span>
                        <input type="file" accept="image/*" onChange={handleMemberPhotoUpload} className="hidden" />
                      </label>
                      {committeeForm.photo && (
                        <button
                          type="button"
                          onClick={() => setCommitteeForm((prev) => ({ ...prev, photo: '' }))}
                          className="px-3 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl text-xs font-bold transition-all"
                        >
                          ছবি মুছুন
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={committeeForm.photo || ''}
                      onChange={(e) => setCommitteeForm((prev) => ({ ...prev, photo: e.target.value }))}
                      placeholder="অথবা সরাসরি ছবির ওয়েব লিংক পেস্ট করুন"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">সংক্ষিপ্ত পরিচিতি ও বক্তব্য (Bio / Statement)</label>
                <textarea
                  rows={3}
                  value={committeeForm.bio || ''}
                  onChange={(e) => setCommitteeForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="বিদ্যালয়ের উন্নয়ন ও মানসম্মত শিক্ষা সম্প্রসারণে উনার ভূমিকা বা বক্তব্য..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCommitteeModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingMember ? 'তথ্য হালনাগাদ করুন' : 'সদস্য সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
