'use client';

import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Mail, 
  Calendar, 
  Award, 
  ArrowRight, 
  X, 
  Users, 
  CheckCircle2, 
  Phone
} from 'lucide-react';
import { TeacherAccount } from '@/services/teacherAuthService';

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
  facebook?: string;
  linkedin?: string;
  whatsapp?: string;
  telegram?: string;
}

export default function PublicTeachersSection({ teachers = [] }: PublicTeachersSectionProps) {
  // 4 Realistic Sample Teachers Data in Bengali
  const sampleTeachers: TeacherProfile[] = [
    {
      id: 'TCH-101',
      name: 'জনাব মোখলেসুর রহমান',
      designation: 'সিনিয়র শিক্ষক (বাংলা)',
      subject: 'বাংলা ১ম ও ২য় পত্র',
      qualification: 'এম.এ (বাংলা সাহিত্য), ঢাকা বিশ্ববিদ্যালয়; বি.এড',
      experience: '১৫+ বছর',
      joiningDate: '১০ মার্চ ২০১০',
      email: 'mokhlesur.bangla@school.edu.bd',
      phone: '+880 1711-234567',
      bio: 'মাতৃভাষা ও সাহিত্যের শুদ্ধ চর্চায় শিক্ষার্থীদের দক্ষ করে তোলাই আমার মূল ব্রত। ক্লাসরুমে সৃজনশীল লিখন ও ব্যাকরণের সহজ পাঠদানে আমি বিশ্বাসী।',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
      facebook: '#',
      linkedin: '#',
      whatsapp: 'https://wa.me/8801711234567',
      telegram: '#'
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
      phone: '+880 1812-345678',
      bio: 'ইংরেজি ভীতি দূর করে যোগাযোগের বাস্তব প্রয়োগ ও গ্রামাটিক্যাল নির্ভুলতায় শিক্ষার্থীদের আত্মবিশ্বাসী গড়ে তুলতে আনন্দময় পদ্ধতিতে পাঠদান করি।',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
      facebook: '#',
      linkedin: '#',
      whatsapp: 'https://wa.me/8801812345678',
      telegram: '#'
    },
    {
      id: 'TCH-103',
      name: 'জনাব মোঃ কামরুল হাসান',
      designation: 'সহকারী শিক্ষক (গণিত ও উচ্চতর গণিত)',
      subject: 'সাধারণ গণিত ও উচ্চতর গণিত',
      qualification: 'এম.এসসি (ফলিত গণিত), জাহাঙ্গীরনগর বিশ্ববিদ্যালয়',
      experience: '১০+ বছর',
      joiningDate: '১৫ জানুয়ারি ২০১৫',
      email: 'kamrul.math@school.edu.bd',
      phone: '+880 1913-456789',
      bio: 'গণিত কোনো মুখস্থ করার বিষয় নয়, এটি চিন্তার যুক্তি ও সৌন্দর্য। শিক্ষার্থীদের ধাপে ধাপে গাণিতিক সমস্যা সমাধানে দক্ষ করে তোলাই আমার লক্ষ্য।',
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop',
      facebook: '#',
      linkedin: '#',
      whatsapp: 'https://wa.me/8801913456789',
      telegram: '#'
    },
    {
      id: 'TCH-104',
      name: 'ইঞ্জিঃ ফারহানা চৌধুরী',
      designation: 'সহকারী শিক্ষিকা (তথ্য ও যোগাযোগ প্রযুক্তি)',
      subject: 'তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)',
      qualification: 'বি.এসসি ইন সিএসই (শাবিপ্রবি), সিসিএনএ সার্টিফাইড',
      experience: '৭+ বছর',
      joiningDate: '০৫ সেপ্টেম্বর ২০১৮',
      email: 'farhana.ict@school.edu.bd',
      phone: '+880 1614-567890',
      bio: 'একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবেলায় শিক্ষার্থীদের কম্পিউটার প্রোগ্রামিং, রোবটিক্স এবং নিরাপদ ইন্টারনেট ব্যবহারের আধুনিক জ্ঞানে সমৃদ্ধ করছি।',
      photo: 'https://images.unsplash.com/photo-1580894732454-defbe4fc8331?q=80&w=600&auto=format&fit=crop',
      facebook: '#',
      linkedin: '#',
      whatsapp: 'https://wa.me/8801614567890',
      telegram: '#'
    }
  ];

  // Selected teacher for Details Modal
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  // Modal for All Teachers View
  const [showAllModal, setShowAllModal] = useState<boolean>(false);

  return (
    <section id="teachers" className="py-16 sm:py-24 bg-[#F5F7FA] dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ===================================================================
            সেকশন হেডার (মাঝখানে টাইটেল ও ডুয়েল আন্ডারলাইন)
            =================================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>আমাদের শিক্ষক মণ্ডলী</span>
          </div>

          {/* Main Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            স্কুল শিক্ষক মন্ডলী
          </h2>

          {/* Dual-colored Underline */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full"></span>
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full"></span>
          </div>

          {/* Subtitle */}
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed pt-2">
            মেধাবী, অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকবৃন্দের স্নেহ ও আদর্শ পরিচালনায় গড়ে উঠছে প্রতিটি শিক্ষার্থীর উজ্জ্বল ভবিষ্যৎ।
          </p>
        </div>

        {/* ===================================================================
            ৪ কলামের শিক্ষক গ্রিড (Desktop: 4, Tablet: 2, Mobile: 1)
            =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {sampleTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="group bg-white dark:bg-slate-800/90 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Card Header & Photo with Slide-up Social Overlay */}
              <div>
                <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
                  <img
                    src={teacher.photo}
                    alt={teacher.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Subject Badge on Top-Right */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 dark:bg-slate-900/90 text-[#0B5D3B] dark:text-emerald-400 backdrop-blur-md shadow-sm border border-emerald-100 dark:border-emerald-900/50">
                      {teacher.subject.split(' ')[0]}
                    </span>
                  </div>

                  {/* Primary Color Overlay with Slide-Up Social Icons on Hover */}
                  <div className="absolute inset-0 bg-[#0B5D3B]/85 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                    <div className="flex items-center gap-3 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-300 ease-out">
                      {/* Facebook */}
                      <a
                        href={teacher.facebook || '#'}
                        aria-label={`${teacher.name} এর ফেসবুক প্রোফাইল`}
                        className="w-10 h-10 rounded-full bg-white text-[#0B5D3B] hover:bg-[#F4B400] hover:text-slate-900 flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                        title="Facebook"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>

                      {/* LinkedIn */}
                      <a
                        href={teacher.linkedin || '#'}
                        aria-label={`${teacher.name} এর লিঙ্কডইন প্রোফাইল`}
                        className="w-10 h-10 rounded-full bg-white text-[#0B5D3B] hover:bg-[#F4B400] hover:text-slate-900 flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                        title="LinkedIn"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </a>

                      {/* WhatsApp */}
                      <a
                        href={teacher.whatsapp || '#'}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${teacher.name} এর হোয়াটসঅ্যাপ`}
                        className="w-10 h-10 rounded-full bg-white text-[#0B5D3B] hover:bg-[#F4B400] hover:text-slate-900 flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                        title="WhatsApp"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                      </a>

                      {/* Telegram */}
                      <a
                        href={teacher.telegram || '#'}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${teacher.name} এর টেলিগ্রাম`}
                        className="w-10 h-10 rounded-full bg-white text-[#0B5D3B] hover:bg-[#F4B400] hover:text-slate-900 flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                        title="Telegram"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.966z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Card Body Info */}
                <div className="p-5 text-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors">
                    {teacher.name}
                  </h3>
                  
                  <p className="text-xs font-semibold text-[#0B5D3B] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 inline-block px-3 py-1 rounded-md mt-2 border border-emerald-100 dark:border-emerald-800">
                    {teacher.designation}
                  </p>

                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#F4B400] shrink-0" />
                      <span className="truncate">{teacher.subject}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{teacher.experience} অভিজ্ঞতা</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: "বিস্তারিত" Button */}
              <div className="px-5 pb-5 pt-0">
                <button
                  type="button"
                  onClick={() => setSelectedTeacher(teacher)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 bg-white dark:bg-slate-800 border-2 border-[#0B5D3B]/20 hover:border-[#0B5D3B] hover:bg-[#0B5D3B] hover:text-white dark:hover:bg-[#0B5D3B] dark:hover:text-white transition-all duration-200 shadow-sm active:scale-[0.98]"
                >
                  <span>বিস্তারিত</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ===================================================================
            নিচে মাঝখানে "সকল শিক্ষকবৃন্দ" বাটন
            =================================================================== */}
        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#0B5D3B] hover:bg-[#08492e] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group active:scale-95 border-2 border-transparent hover:border-[#F4B400]"
          >
            <Users className="w-5 h-5 text-[#F4B400]" />
            <span>সকল শিক্ষকবৃন্দ</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

      {/* ===================================================================
          শিক্ষকের ব্যক্তিগত বিস্তারিত মোডাল (TEACHER DETAILS MODAL)
          =================================================================== */}
      {selectedTeacher && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedTeacher(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative accent bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0B5D3B] via-[#F4B400] to-[#0B5D3B]" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedTeacher(null)}
              aria-label="বন্ধ করুন"
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Content */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mt-2">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 border-2 border-[#0B5D3B] shadow-md">
                <img
                  src={selectedTeacher.photo}
                  alt={selectedTeacher.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-center sm:text-left space-y-1.5 flex-1">
                <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {selectedTeacher.designation}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedTeacher.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#F4B400]" />
                  <span>পাঠদান বিষয়: <strong>{selectedTeacher.subject}</strong></span>
                </p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="mt-6 space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <div className="flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-[#0B5D3B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">শিক্ষাগত যোগ্যতা: </span>
                  <span className="text-slate-600 dark:text-slate-400">{selectedTeacher.qualification}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#F4B400] shrink-0" />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">অভিজ্ঞতা: </span>
                  <span className="text-slate-600 dark:text-slate-400">{selectedTeacher.experience} (যোগদান: {selectedTeacher.joiningDate})</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">ইমেইল: </span>
                  <a href={`mailto:${selectedTeacher.email}`} className="text-sky-600 hover:underline">{selectedTeacher.email}</a>
                </div>
              </div>

              {selectedTeacher.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">যোগাযোগ: </span>
                    <span className="text-slate-600 dark:text-slate-400">{selectedTeacher.phone}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Teacher's Bio / Thought */}
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
              &ldquo;{selectedTeacher.bio}&rdquo;
            </div>

            {/* Social Connect in Modal */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">সোশ্যাল মিডিয়া:</span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedTeacher.whatsapp || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 transition-colors"
                >
                  <span>হোয়াটসঅ্যাপে বার্তা পাঠান</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          সকল শিক্ষকবৃন্দের তালিকা মোডাল (ALL TEACHERS DIRECTORY MODAL)
          =================================================================== */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0B5D3B]">
                  <Users className="w-5 h-5 text-[#0B5D3B]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    সকল শিক্ষক ও কর্মকর্তাবৃন্দ
                  </h3>
                  <p className="text-xs text-slate-500">প্রতিষ্ঠানের সর্বমোট শিক্ষক ও কর্মকর্তা তালিকা</p>
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

            {/* List */}
            <div className="overflow-y-auto py-4 space-y-3 pr-1 flex-1">
              {sampleTeachers.concat(
                teachers.filter(t => !sampleTeachers.some(s => s.id === t.id)).map(t => ({
                  id: t.id,
                  name: t.name,
                  designation: t.designation,
                  subject: t.subject || 'সাধারণ',
                  qualification: t.qualification || 'স্নাতক / স্নাতকোত্তর',
                  experience: '৫+ বছর',
                  joiningDate: '২০২০',
                  email: t.email || `${t.id.toLowerCase()}@school.edu.bd`,
                  phone: t.mobile,
                  bio: 'শিক্ষার্থীদের সুশিক্ষায় শিক্ষিত করা আমাদের পরম দায়িত্ব।',
                  photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop',
                  facebook: '#',
                  linkedin: '#',
                  whatsapp: '#',
                  telegram: '#'
                }))
              ).map((teacher, idx) => (
                <div
                  key={teacher.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={teacher.photo}
                      alt={teacher.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{teacher.name}</h4>
                      <p className="text-xs text-[#0B5D3B] dark:text-emerald-400 font-medium">{teacher.designation}</p>
                      <p className="text-[11px] text-slate-500">{teacher.qualification}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAllModal(false);
                      setSelectedTeacher(teacher);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#0B5D3B] bg-emerald-50 hover:bg-[#0B5D3B] hover:text-white transition-colors"
                  >
                    প্রোফাইল
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
