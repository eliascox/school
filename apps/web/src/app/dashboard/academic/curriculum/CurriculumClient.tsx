'use client';

import React, { useState, useEffect } from 'react';
import {
  Book,
  CheckCircle2,
  ExternalLink,
  Search,
  X,
} from 'lucide-react';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import {
  curriculumService,
  DEFAULT_CURRICULUM_DATA,
  ensureHinduReligionSubjects,
  SubjectCurriculumItem,
} from '@/services/curriculumService';
import ClassSubjectAssignPanel from '@/components/curriculum/ClassSubjectAssignPanel';

export interface NctbBookItem {
  id: string;
  code: string;
  titleBn: string;
  titleEn: string;
  grades: string[];
  group: 'আবশ্যিক' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা' | 'সাধারণ';
  edition: string;
  publisher: string;
  pages: number;
}

const OFFICIAL_NCTB_BOOKS: NctbBookItem[] = [
  {
    id: 'book-601',
    code: '101',
    titleBn: 'বাংলা ১ম পত্র (চারুপাঠ / নতুন দিগন্ত)',
    titleEn: 'Bangla 1st Paper (Charupath)',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 180,
  },
  {
    id: 'book-602',
    code: '102',
    titleBn: 'বাংলা ২য় পত্র (ব্যাকরণ ও নির্মিতি)',
    titleEn: 'Bangla Grammar & Composition',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 140,
  },
  {
    id: 'book-603',
    code: '107',
    titleBn: 'English For Today (1st Paper)',
    titleEn: 'English For Today',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 210,
  },
  {
    id: 'book-604',
    code: '108',
    titleBn: 'English Grammar & Composition (2nd Paper)',
    titleEn: 'English Grammar',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 195,
  },
  {
    id: 'book-605',
    code: '109',
    titleBn: 'গণিত (Mathematics Textbook)',
    titleEn: 'Mathematics Textbook',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 230,
  },
  {
    id: 'book-606',
    code: '127',
    titleBn: 'বিজ্ঞান (Science Laboratory & Theory)',
    titleEn: 'General Science',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 250,
  },
  {
    id: 'book-607',
    code: '154',
    titleBn: 'তথ্য ও যোগাযোগ প্রযুক্তি / ডিজিটাল প্রযুক্তি',
    titleEn: 'ICT / Digital Technology',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 160,
  },
  {
    id: 'book-608',
    code: '150',
    titleBn: 'বাংলাদেশ ও বিশ্বপরিচয়',
    titleEn: 'Bangladesh and Global Studies',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 220,
  },
  {
    id: 'book-610',
    code: '111',
    titleBn: 'ইসলাম ও নৈতিক শিক্ষা',
    titleEn: 'Islam and Moral Education',
    grades: ['6th', '7th', '8th', '9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 168,
  },
  {
    id: 'book-610-hindu',
    code: '112',
    titleBn: 'হিন্দুধর্ম ও নৈতিক শিক্ষা',
    titleEn: 'Hindu Religion and Moral Education',
    grades: ['6th', '7th', '8th', '9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 164,
  },
  {
    id: 'book-611',
    code: '134',
    titleBn: 'কৃষি শিক্ষা (Agriculture Studies)',
    titleEn: 'Agriculture Studies',
    grades: ['6th', '7th', '8th'],
    group: 'সাধারণ',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 144,
  },
  {
    id: 'book-901',
    code: '101',
    titleBn: 'বাংলা ১ম পত্র (সাহিত্যধারা)',
    titleEn: 'Bangla 1st Paper',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 260,
  },
  {
    id: 'book-902',
    code: '102',
    titleBn: 'বাংলা ২য় পত্র (ব্যাকরণ ও রচনা)',
    titleEn: 'Bangla Grammar & Composition',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 220,
  },
  {
    id: 'book-903',
    code: '107',
    titleBn: 'English For Today (1st Paper)',
    titleEn: 'English For Today',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 245,
  },
  {
    id: 'book-904',
    code: '108',
    titleBn: 'English Grammar & Composition (2nd Paper)',
    titleEn: 'English Grammar',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 210,
  },
  {
    id: 'book-905',
    code: '109',
    titleBn: 'সাধারণ গণিত (General Mathematics)',
    titleEn: 'General Mathematics',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 310,
  },
  {
    id: 'book-906',
    code: '154',
    titleBn: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    titleEn: 'Information & Communication Tech',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 175,
  },
  {
    id: 'book-907',
    code: '150',
    titleBn: 'বাংলাদেশ ও বিশ্বপরিচয় (বিজ্ঞান)',
    titleEn: 'Bangladesh and Global Studies',
    grades: ['9th', '10th'],
    group: 'বিজ্ঞান',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 230,
  },
  {
    id: 'book-908',
    code: '127',
    titleBn: 'সাধারণ বিজ্ঞান (মানবিক ও ব্যবসায় শিক্ষা)',
    titleEn: 'General Science',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 240,
  },
  {
    id: 'book-910',
    code: '136',
    titleBn: 'পদার্থবিজ্ঞান (Physics Textbook)',
    titleEn: 'Physics',
    grades: ['9th', '10th'],
    group: 'বিজ্ঞান',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 280,
  },
  {
    id: 'book-911',
    code: '137',
    titleBn: 'রসায়ন (Chemistry Textbook)',
    titleEn: 'Chemistry',
    grades: ['9th', '10th'],
    group: 'বিজ্ঞান',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 265,
  },
  {
    id: 'book-912',
    code: '138',
    titleBn: 'জীববিজ্ঞান (Biology Textbook)',
    titleEn: 'Biology',
    grades: ['9th', '10th'],
    group: 'বিজ্ঞান',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 250,
  },
  {
    id: 'book-918',
    code: '126',
    titleBn: 'উচ্চতর গণিত (Higher Mathematics)',
    titleEn: 'Higher Mathematics',
    grades: ['9th', '10th'],
    group: 'বিজ্ঞান',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 295,
  },
  {
    id: 'book-919',
    code: '153',
    titleBn: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা',
    titleEn: 'History of Bangladesh & World Civilization',
    grades: ['9th', '10th'],
    group: 'মানবিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 225,
  },
  {
    id: 'book-913',
    code: '110',
    titleBn: 'ভূগোল ও পরিবেশ (Geography & Environment)',
    titleEn: 'Geography & Environment',
    grades: ['9th', '10th'],
    group: 'মানবিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 205,
  },
  {
    id: 'book-914',
    code: '140',
    titleBn: 'পৌরনীতি ও নাগরিকতা (Civics & Citizenship)',
    titleEn: 'Civics & Citizenship',
    grades: ['9th', '10th'],
    group: 'মানবিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 185,
  },
  {
    id: 'book-920',
    code: '141',
    titleBn: 'অর্থনীতি (Economics)',
    titleEn: 'Economics',
    grades: ['9th', '10th'],
    group: 'মানবিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 210,
  },
  {
    id: 'book-915',
    code: '146',
    titleBn: 'হিসাববিজ্ঞান (Accounting)',
    titleEn: 'Accounting',
    grades: ['9th', '10th'],
    group: 'ব্যবসায় শিক্ষা',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 290,
  },
  {
    id: 'book-916',
    code: '143',
    titleBn: 'ব্যবসায় উদ্যোগ (Entrepreneurship)',
    titleEn: 'Business Entrepreneurship',
    grades: ['9th', '10th'],
    group: 'ব্যবসায় শিক্ষা',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 190,
  },
  {
    id: 'book-917',
    code: '152',
    titleBn: 'ফিন্যান্স ও ব্যাংকিং (Finance & Banking)',
    titleEn: 'Finance & Banking',
    grades: ['9th', '10th'],
    group: 'ব্যবসায় শিক্ষা',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 215,
  },
];

export default function CurriculumClient() {
  const [activeTab, setActiveTab] = useState<'assign' | 'nctb-books'>('assign');
  const [curriculumList, setCurriculumList] = useState<SubjectCurriculumItem[]>(DEFAULT_CURRICULUM_DATA);
  const [bookGradeFilter, setBookGradeFilter] = useState<'all' | '6-8' | '9-10'>('all');
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setCurriculumList(curriculumService.getCurriculumList());
  };

  const syncAcademicClassesStorage = (curriculumItems: SubjectCurriculumItem[]) => {
    if (typeof window === 'undefined') return;
    const storedClasses = localStorage.getItem('sms_academic_classes');
    if (!storedClasses) return;
    try {
      const parsedClasses = JSON.parse(storedClasses);
      if (Array.isArray(parsedClasses)) {
        const updatedClasses = parsedClasses.map((cls: Record<string, unknown>) => {
          const gradeNum = Number(cls.gradeNumber);
          const gradeKey =
            gradeNum === 6
              ? '6th'
              : gradeNum === 7
                ? '7th'
                : gradeNum === 8
                  ? '8th'
                  : gradeNum === 9
                    ? '9th'
                    : '10th';
          const matchingCurriculum = curriculumItems.filter((c) => c.grade === gradeKey);
          if (matchingCurriculum.length > 0) {
            const subjects = matchingCurriculum.map((c) => ({
              code: c.code,
              name: c.name,
              category: c.group,
              teacher: 'নির্ধারিত শিক্ষক',
              fullMarks: c.fullMarks,
              cq: typeof c.cq === 'number' ? c.cq : undefined,
              mcq: typeof c.mcq === 'number' ? c.mcq : undefined,
              practical: typeof c.practical === 'number' ? c.practical : undefined,
              ca: typeof c.ca === 'number' ? c.ca : undefined,
              passRule: c.passRules,
              jointPass: c.isJointPass,
              jointWith: c.combinedWithCode || c.jointPassInfo,
            }));
            return {
              ...cls,
              subjects,
              subjectsCount: subjects.length,
            };
          }
          return cls;
        });
        localStorage.setItem('sms_academic_classes', JSON.stringify(updatedClasses));
      }
    } catch (e) {
      console.error('Failed to sync academic classes', e);
    }
  };

  const saveData = (updated: SubjectCurriculumItem[]) => {
    setCurriculumList(updated);
    curriculumService.saveCurriculumList(updated);
    syncAcademicClassesStorage(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
  };

  useEffect(() => {
    const initial = curriculumService.getCurriculumList();
    setCurriculumList(initial);
    if (typeof window !== 'undefined' && localStorage.getItem('sms_curriculum_hindu_v1') !== '1') {
      const savedRaw = localStorage.getItem('sms_curriculum_subjects');
      if (savedRaw) {
        try {
          const { changed } = ensureHinduReligionSubjects(JSON.parse(savedRaw));
          if (changed) {
            curriculumService.saveCurriculumList(initial);
            syncAcademicClassesStorage(initial);
          } else {
            localStorage.setItem('sms_curriculum_hindu_v1', '1');
          }
        } catch {
          localStorage.setItem('sms_curriculum_hindu_v1', '1');
        }
      } else {
        localStorage.setItem('sms_curriculum_hindu_v1', '1');
      }
    }
    const unsub = curriculumService.subscribe(loadData);
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadData);
    }
    return () => {
      unsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', loadData);
      }
    };
  }, []);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleResetToNctb = async () => {
    if (
      await confirmDialog({
        title: 'পাঠ্যক্রম রিসেট',
        message: 'আপনি কি NCTB ২০২৬-এর স্ট্যান্ডার্ড পাঠ্যক্রম ও নম্বর বণ্টন ডিফল্ট রিসেট করতে চান?',
        confirmLabel: 'রিসেট করুন',
        danger: true,
      })
    ) {
      saveData(DEFAULT_CURRICULUM_DATA);
      showAlert('success', 'NCTB ২০২৬ স্ট্যান্ডার্ড পাঠ্যক্রম সফলভাবে রিসেট করা হয়েছে!');
    }
  };

  const filteredBooks = OFFICIAL_NCTB_BOOKS.filter((book) => {
    const matchGrade =
      bookGradeFilter === 'all'
        ? true
        : bookGradeFilter === '6-8'
          ? book.grades.some((g) => ['6th', '7th', '8th'].includes(g))
          : book.grades.some((g) => ['9th', '10th'].includes(g));
    const query = bookSearchQuery.toLowerCase();
    const matchSearch =
      book.titleBn.toLowerCase().includes(query) ||
      book.code.toLowerCase().includes(query) ||
      book.titleEn.toLowerCase().includes(query);
    return matchGrade && matchSearch;
  });

  const feedbackBanner = alertMsg ? (
    <div
      className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-2xs ${
        alertMsg.type === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/60'
          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/60'
      }`}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2
          size={16}
          className={
            alertMsg.type === 'success'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }
        />
        <span>{alertMsg.text}</span>
      </div>
      <button
        type="button"
        onClick={() => setAlertMsg(null)}
        className="text-slate-400 hover:text-slate-600 cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  ) : null;

  return (
    <div className="pb-10 print:pb-0">
      {/* DOCKED SUB-HEADER CONTROL BAR + HIGH-DENSITY SUBJECT MANAGEMENT TABLE */}
      <ClassSubjectAssignPanel
        curriculumList={curriculumList}
        activeTab={activeTab}
        nctbBooksCount={OFFICIAL_NCTB_BOOKS.length}
        onChangeTab={setActiveTab}
        onSaveCurriculum={saveData}
        onResetToNctb={handleResetToNctb}
        onNotify={showAlert}
        topBanner={feedbackBanner}
      />

      {/* TAB 2: OFFICIAL NCTB BOOKS CATALOG */}
      {activeTab === 'nctb-books' && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'সকল শ্রেণি' },
                  { id: '6-8', label: '৬ষ্ঠ–৮ম শ্রেণি' },
                  { id: '9-10', label: '৯ম–১০ম শ্রেণি' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setBookGradeFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    bookGradeFilter === f.id
                      ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="পাঠ্যবই বা কোড খুঁজুন..."
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                      <Book size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono block">
                        NCTB কোড: {book.code}
                      </span>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">
                        {book.titleBn}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs pt-3 font-medium text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-bold">ইংরেজি:</span>
                      <span className="text-slate-800 dark:text-slate-100 font-semibold truncate">
                        {book.titleEn}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-bold">শ্রেণি:</span>
                      <div className="flex gap-1">
                        {book.grades.map((g) => (
                          <span
                            key={g}
                            className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-extrabold text-[10px] rounded-md"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-bold">সংস্করণ:</span>
                      <span className="text-slate-800 dark:text-slate-100 font-bold">
                        {book.edition} ({book.pages} পৃষ্ঠা)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] rounded-full border border-emerald-100 dark:border-emerald-800/60">
                    NCTB অনুমোদিত
                  </span>
                  <button
                    type="button"
                    onClick={() => showToast(`NCTB অফিশিয়াল ডিজিটাল কপি: ${book.titleBn}`, 'info')}
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    বিবরণ <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
