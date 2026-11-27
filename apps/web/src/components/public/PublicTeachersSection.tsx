'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Mail,
  Award,
  ArrowRight,
  X,
  Users,
  Phone,
  Search,
  MessageCircle,
} from 'lucide-react';
import { TeacherAccount } from '@/services/teacherAuthService';
import InitialsAvatar from './InitialsAvatar';

interface PublicTeachersSectionProps {
  teachers?: TeacherAccount[];
}

interface TeacherProfile {
  id: string;
  name: string;
  designation: string;
  subject: string;
  qualification: string;
  experience: string;
  joiningDate: string;
  email: string;
  phone?: string;
  bio: string;
  photo: string;
  whatsapp?: string;
}

const DEFAULT_SAMPLE_TEACHERS: TeacherProfile[] = [
  {
    id: 'TCH-101',
    name: 'জনাব মোখলেসুর রহমান',
    designation: 'সিনিয়র শিক্ষক (বাংলা)',
    subject: 'বাংলা ১ম ও ২য় পত্র',
    qualification: 'এম.এ (বাংলা সাহিত্য), ঢাকা বিশ্ববিদ্যালয়; বি.এড',
    experience: '১৫+ বছর',
    joiningDate: '১০ মার্চ ২০১০',
    email: 'mokhlesur.bangla@school.edu.bd',
    bio: 'মাতৃভাষা ও সাহিত্যের শুদ্ধ চর্চায় শিক্ষার্থীদের দক্ষ করে তোলাই আমার মূল ব্রত। ক্লাসরুমে সৃজনশীল লিখন ও ব্যাকরণের সহজ পাঠদানে আমি বিশ্বাসী।',
    photo: '',
  },
  {
    id: 'TCH-102',
    name: 'বেগম শাহীন আক্তার',
    designation: 'সিনিয়র শিক্ষিকা (ইংরেজি)',
    subject: 'ইংরেজি ১ম ও ২য় পত্র',
    qualification: 'এম.এ (ইংরেজি), চট্টগ্রাম বিশ্ববিদ্যালয়; এম.এড',
    experience: '১২+ বছর',
    joiningDate: '০১ আগস্ট ২০১২',
    email: 'shaheen.english@school.edu.bd',
    bio: 'ইংরেজি ভীতি দূর করে যোগাযোগের বাস্তব প্রয়োগ ও গ্রামাটিক্যাল নির্ভুলতায় শিক্ষার্থীদের আত্মবিশ্বাসী গড়ে তুলতে আনন্দময় পদ্ধতিতে পাঠদান করি।',
    photo: '',
  },
  {
    id: 'TCH-103',
    name: 'জনাব মোঃ কামরুল হাসান',
    designation: 'সহকারী শিক্ষক (গণিত)',
    subject: 'সাধারণ ও উচ্চতর গণিত',
    qualification: 'এম.এসসি (ফলিত গণিত), জাহাঙ্গীরনগর বিশ্ববিদ্যালয়',
    experience: '১০+ বছর',
    joiningDate: '১৫ জানুয়ারি ২০১৫',
    email: 'kamrul.math@school.edu.bd',
    bio: 'গণিত কোনো মুখস্থ করার বিষয় নয়, এটি চিন্তার যুক্তি ও সৌন্দর্য। শিক্ষার্থীদের ধাপে ধাপে গাণিতিক সমস্যা সমাধানে দক্ষ করে তোলাই আমার লক্ষ্য।',
    photo: '',
  },
  {
    id: 'TCH-104',
    name: 'ইঞ্জিঃ ফারহানা চৌধুরী',
    designation: 'সহকারী শিক্ষিকা (আইসিটি)',
    subject: 'তথ্য ও যোগাযোগ প্রযুক্তি',
    qualification: 'বি.এসসি ইন সিএসই (শাবিপ্রবি)',
    experience: '৭+ বছর',
    joiningDate: '০৫ সেপ্টেম্বর ২০১৮',
    email: 'farhana.ict@school.edu.bd',
    bio: 'একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবেলায় শিক্ষার্থীদের কম্পিউটার প্রোগ্রামিং, রোবটিক্স এবং নিরাপদ ইন্টারনেট ব্যবহারের আধুনিক জ্ঞানে সমৃদ্ধ করছি।',
    photo: '',
  },
];

export default function PublicTeachersSection({ teachers = [] }: PublicTeachersSectionProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!selectedTeacher && !showAllModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTeacher(null);
        setShowAllModal(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedTeacher, showAllModal]);

  const allProfiles = useMemo<TeacherProfile[]>(() => {
    if (teachers.length === 0) return DEFAULT_SAMPLE_TEACHERS;
    return teachers.map((t, idx) => {
      const cleanDigits = (t.mobile || t.phone || '').replace(/\D/g, '');
      const validWhatsapp =
        cleanDigits.length >= 10
          ? `https://wa.me/${cleanDigits.startsWith('88') ? cleanDigits : `88${cleanDigits}`}`
          : undefined;
      return {
        id: t.id || `TCH-${101 + idx}`,
        name: t.name,
        designation: t.designation || 'সহকারী শিক্ষক',
        subject: t.subject || 'সাধারণ বিভাগ',
        qualification: t.qualification || 'স্নাতক / স্নাতকোত্তর; বি.এড',
        experience: 'অভিজ্ঞ শিক্ষক',
        joiningDate: 'নিয়মিত কর্মরত',
        email: t.email || '',
        phone: t.mobile || t.phone,
        bio: 'শিক্ষার্থীদের সুনাগরিক, দক্ষ ও নৈতিক মূল্যবোধসম্পন্ন মানুষ হিসেবে গড়ে তোলাই আমাদের অঙ্গীকার।',
        photo: (t as TeacherAccount & { photo?: string }).photo || '',
        whatsapp: validWhatsapp,
      };
    });
  }, [teachers]);

  const featuredTeachers = allProfiles.slice(0, 4);

  const filteredDirectory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allProfiles;
    return allProfiles.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.designation.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
    );
  }, [allProfiles, searchQuery]);

  return (
    <section
      id="teachers"
      className="py-12 sm:py-16 bg-[#F8FAFC] dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 transition-colors relative"
    >
      <div id="faculty" className="absolute top-0 left-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-9 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <GraduationCap className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>আমাদের শিক্ষকমণ্ডলী</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            সম্মানিত শিক্ষকমণ্ডলী
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full" />
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full" />
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed pt-1">
            মেধাবী, অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকবৃন্দের স্নেহ ও আদর্শ পরিচালনায় গড়ে উঠছে প্রতিটি শিক্ষার্থীর উজ্জ্বল ভবিষ্যৎ।
          </p>
        </div>

        {/* 4-Column Executive Teacher Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {featuredTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400/70 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3.6] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <InitialsAvatar
                    src={teacher.photo}
                    name={teacher.name}
                    className="w-full h-full"
                    textClassName="text-5xl"
                    imgClassName="transition-transform duration-500 group-hover:scale-105 object-top"
                  />

                  <div className="absolute top-3 right-3 z-10 max-w-[78%]">
                    <span className="inline-block truncate max-w-full px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 dark:bg-slate-900/95 text-[#0B5D3B] dark:text-emerald-300 backdrop-blur-md shadow-xs border border-emerald-100 dark:border-emerald-900/60">
                      {teacher.subject}
                    </span>
                  </div>
                </div>

                <div className="p-5 text-center">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors">
                    {teacher.name}
                  </h3>

                  <p className="text-xs font-bold text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 inline-block px-3 py-1 rounded-full mt-2 border border-emerald-100 dark:border-emerald-800/80">
                    {teacher.designation}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#F4B400] shrink-0" />
                      <span className="truncate">{teacher.subject}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Award className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{teacher.qualification}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-0">
                <button
                  type="button"
                  onClick={() => setSelectedTeacher(teacher)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/70 hover:bg-[#0B5D3B] hover:text-white hover:border-[#0B5D3B] transition-all cursor-pointer"
                >
                  <span>বিস্তারিত প্রোফাইল</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* All Teachers Directory Trigger */}
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-[#F4B400]" />
            <span>সকল শিক্ষকবৃন্দ ({allProfiles.length} জন)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Teacher Profile Modal */}
      {selectedTeacher && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedTeacher(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

            <button
              type="button"
              onClick={() => setSelectedTeacher(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mt-1">
              <InitialsAvatar
                src={selectedTeacher.photo}
                name={selectedTeacher.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shrink-0 border-2 border-[#0B5D3B] shadow-md"
                textClassName="text-4xl"
              />

              <div className="text-center sm:text-left space-y-1.5 flex-1">
                <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {selectedTeacher.designation}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedTeacher.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#F4B400]" />
                  <span>
                    পাঠদান বিষয়: <strong className="text-slate-700 dark:text-slate-200">{selectedTeacher.subject}</strong>
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <div className="flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">শিক্ষাগত যোগ্যতা: </span>
                  <span className="text-slate-600 dark:text-slate-400">{selectedTeacher.qualification}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#F4B400] shrink-0" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">অভিজ্ঞতা: </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {selectedTeacher.experience} ({selectedTeacher.joiningDate})
                  </span>
                </div>
              </div>

              {selectedTeacher.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">ইমেইল: </span>
                    <a href={`mailto:${selectedTeacher.email}`} className="text-sky-600 hover:underline">
                      {selectedTeacher.email}
                    </a>
                  </div>
                </div>
              )}

              {selectedTeacher.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">যোগাযোগ: </span>
                    <a href={`tel:${selectedTeacher.phone}`} className="text-slate-700 dark:text-slate-300 hover:underline font-mono">
                      {selectedTeacher.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
              “{selectedTeacher.bio}”
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              {selectedTeacher.whatsapp ? (
                <a
                  href={selectedTeacher.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 inline-flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>হোয়াটসঅ্যাপে যোগাযোগ</span>
                </a>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={() => setSelectedTeacher(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Teachers Directory Modal with Search */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col p-5 sm:p-7 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    সকল শিক্ষক ও কর্মকর্তাবৃন্দ
                  </h3>
                  <p className="text-xs text-slate-500">প্রতিষ্ঠানের সর্বমোট শিক্ষক ও কর্মকর্তা তালিকা</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                aria-label="বন্ধ করুন"
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 pb-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="শিক্ষকের নাম, পদবি বা বিষয় লিখে খুঁজুন..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0B5D3B]"
                />
              </div>
            </div>

            <div className="overflow-y-auto py-3 space-y-2.5 pr-1 flex-1">
              {filteredDirectory.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  কোনো শিক্ষক খুঁজে পাওয়া যায়নি।
                </div>
              ) : (
                filteredDirectory.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <InitialsAvatar
                        src={teacher.photo}
                        name={teacher.name}
                        className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
                        textClassName="text-base"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {teacher.name}
                        </h4>
                        <p className="text-xs text-[#0B5D3B] dark:text-emerald-400 font-bold truncate">
                          {teacher.designation} • {teacher.subject}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{teacher.qualification}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAllModal(false);
                        setSelectedTeacher(teacher);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-[#0B5D3B] hover:text-white transition-colors shrink-0 cursor-pointer"
                    >
                      প্রোফাইল
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
