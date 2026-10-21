'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Award, 
  ArrowRight, 
  Phone, 
  Mail, 
  X, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';
import { settingsService, CommitteeMember, DEFAULT_COMMITTEE_MEMBERS } from '@/services/settingsService';

interface PublicCommitteeSectionProps {
  committeeMembers?: CommitteeMember[];
}

export default function PublicCommitteeSection({ committeeMembers: propMembers }: PublicCommitteeSectionProps = {}) {
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>(() => {
    if (propMembers && propMembers.length > 0) return propMembers;
    const settings = settingsService.getSettings();
    return (settings.committeeMembers && settings.committeeMembers.length > 0)
      ? settings.committeeMembers
      : DEFAULT_COMMITTEE_MEMBERS;
  });

  useEffect(() => {
    if (propMembers !== undefined) {
      setCommitteeMembers(propMembers.length > 0 ? propMembers : DEFAULT_COMMITTEE_MEMBERS);
      return;
    }
    const unsub = settingsService.subscribe((s) => {
      if (s.committeeMembers) {
        setCommitteeMembers(s.committeeMembers.length > 0 ? s.committeeMembers : DEFAULT_COMMITTEE_MEMBERS);
      }
    });
    return () => unsub();
  }, [propMembers]);

  // Selected Member for Profile Modal
  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [showAllModal, setShowAllModal] = useState<boolean>(false);

  return (
    <section id="committee" className="py-10 sm:py-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors relative">
      <div id="smc" className="absolute -top-24 left-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ===================================================================
            সেকশন হেডার
            =================================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>পরিচালনা পর্ষদ</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            স্কুলের কমিটির সদস্যবৃন্দ
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full"></span>
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full"></span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed pt-1">
            বিদ্যালয়ের সার্বিক উন্নয়ন, সুশাসন ও শিক্ষার সুষ্ঠু পরিবেশ পরিচালনায় নিবেদিত ম্যানেজিং কমিটির সম্মানিত সদস্যবৃন্দ।
          </p>
        </div>

        {/* ===================================================================
            ৪টি কার্ডের গ্রিড (Desktop: 4, Tablet: 2, Mobile: 1)
            =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {committeeMembers.map((member) => (
            <div
              key={member.id}
              className="group bg-[#F8FAFC] dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* প্রোফাইল ছবি */}
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#0B5D3B] shadow-md group-hover:scale-105 transition-transform duration-300 bg-emerald-50 dark:bg-slate-700 flex items-center justify-center">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=500&auto=format&fit=crop';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-100 dark:bg-emerald-950 text-[#0B5D3B] dark:text-emerald-300 font-black text-2xl">
                          {member.name ? member.name.charAt(0) : 'ক'}
                        </div>
                      )}
                    </div>
                    {/* পদবি আইকন ব্যাজ */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#0B5D3B] text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800">
                      <Award className="w-4 h-4 text-[#F4B400]" />
                    </div>
                  </div>
                </div>

                {/* নাম ও পদবি */}
                <div className="text-center space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors">
                    {member.name}
                  </h3>
                  
                  <span className={`inline-block text-xs font-bold px-3 py-0.5 rounded-full border ${member.badgeColor}`}>
                    {member.role}
                  </span>
                </div>

                {/* সদস্য যোগদান ও মেয়াদকাল তারিখ */}
                <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400">যোগদান: </span>
                      <span className="font-semibold">{member.joiningDate}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#F4B400] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400">মেয়াদকাল: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{member.tenure}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* কার্ড ফুটার: সোশ্যাল আইকন ও বিস্তারিত বাটন */}
              <div className="mt-5 pt-3.5 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                {/* সোশ্যাল আইকন */}
                <div className="flex items-center gap-2">
                  <a
                    href={member.facebook || '#'}
                    aria-label={`${member.name} এর ফেসবুক`}
                    className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 text-[#0B5D3B] dark:text-emerald-400 hover:bg-[#0B5D3B] hover:text-white dark:hover:bg-[#0B5D3B] flex items-center justify-center shadow-2xs border border-slate-200 dark:border-slate-600 transition-all hover:scale-110"
                    title="Facebook"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a
                    href={`tel:${member.phone}`}
                    aria-label={`${member.name} কে কল করুন`}
                    className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 text-[#0B5D3B] dark:text-emerald-400 hover:bg-[#F4B400] hover:text-slate-900 flex items-center justify-center shadow-2xs border border-slate-200 dark:border-slate-600 transition-all hover:scale-110"
                    title="ফোন কল"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`mailto:${member.email}`}
                    aria-label={`${member.name} এর ইমেইল`}
                    className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 text-[#0B5D3B] dark:text-emerald-400 hover:bg-[#0B5D3B] hover:text-white dark:hover:bg-[#0B5D3B] flex items-center justify-center shadow-2xs border border-slate-200 dark:border-slate-600 transition-all hover:scale-110"
                    title="ইমেইল"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* প্রোফাইল বাটন */}
                <button
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0B5D3B] hover:text-[#08492e] dark:text-emerald-400"
                >
                  <span>প্রোফাইল</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ===================================================================
            নিচে "আরো দেখুন" বাটন
            =================================================================== */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group active:scale-95 border-2 border-transparent hover:border-[#F4B400]"
          >
            <Users className="w-5 h-5 text-[#F4B400]" />
            <span>আরো দেখুন</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

      {/* ===================================================================
          কমিটি সদস্য প্রোফাইল মোডাল (MEMBER DETAILS MODAL)
          =================================================================== */}
      {selectedMember && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

            <button
              type="button"
              onClick={() => setSelectedMember(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mt-2">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-[#0B5D3B] shadow-md">
                <img src={selectedMember.photo} alt={selectedMember.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-center sm:text-left space-y-1">
                <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold border ${selectedMember.badgeColor}`}>
                  {selectedMember.role}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedMember.name}
                </h3>
                <p className="text-xs text-slate-500">ম্যানেজিং কমিটি, বরইতলী উচ্চ বিদ্যালয়</p>
              </div>
            </div>

            <div className="mt-6 space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">যোগদান তারিখ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMember.joiningDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">কার্যকাল / মেয়াদ:</span>
                <span className="font-semibold text-[#0B5D3B] dark:text-emerald-400">{selectedMember.tenure}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">যোগাযোগ:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMember.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">ইমেইল:</span>
                <span className="font-semibold text-sky-600">{selectedMember.email}</span>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
              &ldquo;{selectedMember.bio}&rdquo;
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          পূর্ণাঙ্গ কমিটি তালিকা মোডাল (ALL COMMITTEE MEMBERS MODAL)
          =================================================================== */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0B5D3B]">
                  <Users className="w-5 h-5 text-[#0B5D3B]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    ম্যানেজিং কমিটির সকল সদস্যবৃন্দ
                  </h3>
                  <p className="text-xs text-slate-500">বিদ্যালয় পরিচালনা পর্ষদের পূর্ণাঙ্গ তালিকা</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1">
              {committeeMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                      {m.photo ? (
                        <img
                          src={m.photo}
                          alt={m.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=500&auto=format&fit=crop';
                          }}
                        />
                      ) : (
                        <span className="font-bold text-[#0B5D3B] text-sm">{m.name ? m.name.charAt(0) : 'ক'}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</h4>
                      <p className="text-xs font-semibold text-[#0B5D3B] dark:text-emerald-400">{m.role}</p>
                      <p className="text-[11px] text-slate-500">{m.tenure}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAllModal(false);
                      setSelectedMember(m);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0B5D3B] bg-emerald-50 hover:bg-[#0B5D3B] hover:text-white transition-colors"
                  >
                    বিবরণ
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
