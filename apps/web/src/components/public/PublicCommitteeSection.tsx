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
  Building2,
} from 'lucide-react';
import {
  settingsService,
  CommitteeMember,
  DEFAULT_COMMITTEE_MEMBERS,
} from '@/services/settingsService';
import InitialsAvatar from './InitialsAvatar';

interface PublicCommitteeSectionProps {
  committeeMembers?: CommitteeMember[];
}

export default function PublicCommitteeSection({
  committeeMembers: propMembers,
}: PublicCommitteeSectionProps = {}) {
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>(
    propMembers && propMembers.length > 0 ? propMembers : DEFAULT_COMMITTEE_MEMBERS
  );
  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    if (propMembers !== undefined) {
      setCommitteeMembers(propMembers.length > 0 ? propMembers : DEFAULT_COMMITTEE_MEMBERS);
      return;
    }
    const unsub = settingsService.subscribe((s) => {
      if (s.committeeMembers) {
        setCommitteeMembers(
          s.committeeMembers.length > 0 ? s.committeeMembers : DEFAULT_COMMITTEE_MEMBERS
        );
      }
    });
    return () => unsub();
  }, [propMembers]);

  useEffect(() => {
    if (!selectedMember && !showAllModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMember(null);
        setShowAllModal(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedMember, showAllModal]);

  return (
    <section
      id="committee"
      className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 transition-colors relative"
    >
      <div id="smc" className="absolute top-0 left-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>পরিচালনা পর্ষদ</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            বিদ্যালয় পরিচালনা পর্ষদ (ম্যানেজিং কমিটি)
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full" />
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full" />
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed pt-1">
            বিদ্যালয়ের সার্বিক উন্নয়ন, সুশাসন ও শিক্ষার সুষ্ঠু পরিবেশ পরিচালনায় নিবেদিত ম্যানেজিং কমিটির সম্মানিত সদস্যবৃন্দ।
          </p>
        </div>

        {/* Clean Graceful Card When No Members Are Published Yet */}
        {committeeMembers.length === 0 ? (
          <div className="max-w-2xl mx-auto rounded-3xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 p-6 sm:p-8 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              বোর্ড অনুমোদিত নিয়মিত পরিচালনা পর্ষদ
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              চট্টগ্রাম মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ডের বিধি অনুযায়ী বিদ্যালয় পরিচালনা পর্ষদের সদস্যবৃন্দের তথ্য হালনাগাদ করা হচ্ছে। যেকোনো প্রশাসনিক যোগাযোগের জন্য অফিস কক্ষে যোগাযোগ করুন।
            </p>
            <div className="pt-1">
              <a
                href="#contact"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0B5D3B] hover:bg-[#08492e] text-white text-xs font-bold shadow-xs transition"
              >
                <span>অফিসে যোগাযোগ করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {committeeMembers.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  className="group bg-[#F8FAFC] dark:bg-slate-800/80 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-700/80 hover:border-emerald-400/70 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <InitialsAvatar
                          src={member.photo}
                          name={member.name}
                          className="w-24 h-24 rounded-2xl border-2 border-[#0B5D3B] shadow-md group-hover:scale-105 transition-transform duration-300"
                          textClassName="text-3xl"
                        />
                        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#0B5D3B] text-white flex items-center justify-center shadow-sm border-2 border-white dark:border-slate-800">
                          <Award className="w-3.5 h-3.5 text-[#F4B400]" />
                        </div>
                      </div>
                    </div>

                    <div className="text-center space-y-1.5">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors">
                        {member.name}
                      </h3>

                      <span
                        className={`inline-block text-xs font-bold px-3 py-0.5 rounded-full border ${
                          member.badgeColor ||
                          'bg-emerald-50 text-[#0B5D3B] border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>

                    {(member.joiningDate || member.tenure) && (
                      <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-xs">
                        {member.joiningDate && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                            <span>
                              <span className="text-slate-400">যোগদান: </span>
                              <span className="font-semibold">{member.joiningDate}</span>
                            </span>
                          </div>
                        )}
                        {member.tenure && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#F4B400] shrink-0" />
                            <span>
                              <span className="text-slate-400">মেয়াদকাল: </span>
                              <span className="font-semibold">{member.tenure}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {member.phone && (
                        <a
                          href={`tel:${member.phone}`}
                          aria-label={`${member.name} কে কল করুন`}
                          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-[#0B5D3B] dark:text-emerald-400 hover:bg-[#0B5D3B] hover:text-white flex items-center justify-center border border-slate-200 dark:border-slate-600 transition"
                          title="ফোন কল"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          aria-label={`${member.name} এর ইমেইল`}
                          className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-[#0B5D3B] dark:text-emerald-400 hover:bg-[#0B5D3B] hover:text-white flex items-center justify-center border border-slate-200 dark:border-slate-600 transition"
                          title="ইমেইল"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0B5D3B] hover:text-[#08492e] dark:text-emerald-400 cursor-pointer"
                    >
                      <span>প্রোফাইল</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {committeeMembers.length > 4 && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllModal(true)}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#F4B400]" />
                  <span>সকল সদস্যবৃন্দ ({committeeMembers.length} জন)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />
            <button
              type="button"
              onClick={() => setSelectedMember(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mt-1">
              <InitialsAvatar
                src={selectedMember.photo}
                name={selectedMember.name}
                className="w-22 h-22 rounded-2xl border-2 border-[#0B5D3B] shadow-md shrink-0"
                textClassName="text-3xl"
              />
              <div className="text-center sm:text-left space-y-1">
                <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#0B5D3B] border border-emerald-200">
                  {selectedMember.role}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedMember.name}
                </h3>
                <p className="text-xs text-slate-500">বিদ্যালয় পরিচালনা পর্ষদ</p>
              </div>
            </div>

            <div className="mt-5 space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
              {selectedMember.joiningDate && (
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">যোগদান তারিখ:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedMember.joiningDate}
                  </span>
                </div>
              )}
              {selectedMember.tenure && (
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">কার্যকাল / মেয়াদ:</span>
                  <span className="font-semibold text-[#0B5D3B] dark:text-emerald-400">
                    {selectedMember.tenure}
                  </span>
                </div>
              )}
              {selectedMember.phone && (
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">যোগাযোগ:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedMember.phone}
                  </span>
                </div>
              )}
              {selectedMember.email && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">ইমেইল:</span>
                  <span className="font-semibold text-sky-600">{selectedMember.email}</span>
                </div>
              )}
            </div>

            {selectedMember.bio && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                “{selectedMember.bio}”
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Committee Modal */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                ম্যানেজিং কমিটির সকল সদস্যবৃন্দ
              </h3>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                aria-label="বন্ধ করুন"
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-2.5 flex-1">
              {committeeMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <InitialsAvatar
                      src={m.photo}
                      name={m.name}
                      className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
                      textClassName="text-sm"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {m.name}
                      </h4>
                      <p className="text-xs font-semibold text-[#0B5D3B] dark:text-emerald-400 truncate">
                        {m.role}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAllModal(false);
                      setSelectedMember(m);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#0B5D3B] bg-emerald-50 hover:bg-[#0B5D3B] hover:text-white transition cursor-pointer shrink-0"
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
