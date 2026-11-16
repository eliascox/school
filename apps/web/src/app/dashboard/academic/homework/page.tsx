'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  FileText,
  CheckCircle2,
  Circle,
  Archive,
  Trash2,
  Printer,
  Users,
  Link2,
  Upload,
  X,
  ArrowLeft,
} from 'lucide-react';
import { homeworkService, HomeworkAssignment } from '@/services/homeworkService';
import { studentService, Student } from '@/services/studentService';
import { teacherRBACService, TeacherRecord } from '@/services/teacherRBACService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import { localDateKey } from '@/lib/dateUtils';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';

const GRADES = [
  { key: '6th', label: '৬ষ্ঠ শ্রেণি' },
  { key: '7th', label: '৭ম শ্রেণি' },
  { key: '8th', label: '৮ম শ্রেণি' },
  { key: '9th', label: '৯ম শ্রেণি' },
  { key: '10th', label: '১০ম শ্রেণি' },
];

const SECTIONS = ['A', 'B', 'C'];

const gradeLabel = (g: string) => GRADES.find((x) => x.key === g)?.label || g;

export default function HomeworkManagerPage() {
  const [mounted, setMounted] = useState(false);
  const [homeworks, setHomeworks] = useState<HomeworkAssignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  // Filters
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Composer State
  const [showComposer, setShowComposer] = useState<boolean>(false);
  const [formGrade, setFormGrade] = useState<string>('10th');
  const [formSection, setFormSection] = useState<string>('all');
  const [formSubject, setFormSubject] = useState<string>('');
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formTeacherName, setFormTeacherName] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formDueDate, setFormDueDate] = useState<string>('');
  const [formAttachmentName, setFormAttachmentName] = useState<string>('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState<string>('');

  // Submission Tracker Drawer
  const [trackerHomeworkId, setTrackerHomeworkId] = useState<string | null>(null);
  const [trackerSearch, setTrackerSearch] = useState<string>('');

  const loadData = useCallback(() => {
    setHomeworks(homeworkService.getHomeworks({ includeArchived: true }));
    setStudents(studentService.getAllStudents());
    const tList = teacherRBACService.getTeachers();
    setTeachers(tList);
    setSettings(settingsService.getSettings());
    setFormDueDate((prev) => prev || localDateKey());
    if (tList.length > 0 && !formTeacherId) {
      setFormTeacherId(tList[0].id);
      setFormTeacherName(tList[0].name);
    }
  }, [formTeacherId]);

  useEffect(() => {
    setMounted(true);
    loadData();
    const onStorage = () => loadData();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadData]);

  const gradeSubjects = useMemo(() => {
    return getActiveCurriculumSubjects(formGrade, 'বিজ্ঞান');
  }, [formGrade]);

  useEffect(() => {
    if (gradeSubjects.length > 0 && !formSubject) {
      setFormSubject(gradeSubjects[0].name);
    }
  }, [gradeSubjects, formSubject]);

  const filteredHomeworks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return homeworks.filter((hw) => {
      if (!includeArchived && hw.status === 'archived') return false;
      if (filterGrade !== 'all' && hw.grade !== filterGrade) return false;
      if (filterSection !== 'all' && hw.section !== 'all' && hw.section !== filterSection) return false;
      if (q) {
        const hay = `${hw.title} ${hw.subject} ${hw.teacherName} ${hw.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [homeworks, includeArchived, filterGrade, filterSection, searchQuery]);

  const trackerHomework = useMemo(() => {
    if (!trackerHomeworkId) return null;
    return homeworks.find((hw) => hw.id === trackerHomeworkId) || null;
  }, [homeworks, trackerHomeworkId]);

  const trackerStudents = useMemo(() => {
    if (!trackerHomework) return [];
    const q = trackerSearch.trim().toLowerCase();
    return students
      .filter((s) => {
        if (s.grade !== trackerHomework.grade) return false;
        if (trackerHomework.section && trackerHomework.section !== 'all' && s.section !== trackerHomework.section) {
          return false;
        }
        if (q && !`${s.name} ${s.roll}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (parseInt(a.roll, 10) || 9999) - (parseInt(b.roll, 10) || 9999));
  }, [trackerHomework, students, trackerSearch]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_400_000) {
      showToast('ফাইলের আকার ১.৪ MB-এর কম হতে হবে। বড় ফাইলের জন্য ড্রাইভ/ফায়ারবেস লিংক ব্যবহার করুন।', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormAttachmentName(file.name);
      setFormAttachmentUrl(String(reader.result || ''));
      showToast(`${file.name} সংযুক্ত করা হয়েছে।`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    const res = homeworkService.createHomework({
      title: formTitle.trim(),
      description: formDescription.trim(),
      grade: formGrade,
      section: formSection,
      subject: formSubject.trim(),
      teacherId: formTeacherId || undefined,
      teacherName: formTeacherName.trim() || 'শ্রেণি/বিষয় শিক্ষক',
      dueDate: formDueDate,
      attachmentName: formAttachmentName.trim() || undefined,
      attachmentUrl: formAttachmentUrl.trim() || undefined,
    });
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }
    showToast(res.message, 'success');
    setFormTitle('');
    setFormDescription('');
    setFormAttachmentName('');
    setFormAttachmentUrl('');
    setShowComposer(false);
    loadData();
  };

  const handleDeleteHomework = async (hw: HomeworkAssignment) => {
    const ok = await confirmDialog({
      title: 'হোমওয়ার্ক মুছে ফেলুন',
      message: `আপনি কি "${hw.title}" হোমওয়ার্কটি স্থায়ীভাবে মুছে ফেলতে চান?`,
      confirmLabel: 'হ্যাঁ, মুছুন',
      cancelLabel: 'না',
      danger: true,
    });
    if (!ok) return;
    homeworkService.deleteHomework(hw.id);
    if (trackerHomeworkId === hw.id) setTrackerHomeworkId(null);
    showToast('হোমওয়ার্ক মুছে ফেলা হয়েছে।', 'success');
    loadData();
  };

  if (!mounted) {
    return (
      <div className="p-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
        ডিজিটাল হোমওয়ার্ক মডিউল লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 space-y-6">
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          .no-print { display: none !important; }
          body { background: #ffffff !important; color: #0f172a !important; }
        }
      `}</style>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4">
        <h1 className="text-xl font-black">{settings?.schoolName || 'স্মার্ট স্কুল অ্যান্ড কলেজ'}</h1>
        <p className="text-xs font-bold text-slate-600">{settings?.address || ''} • ডিজিটাল হোমওয়ার্ক ও লেকচার শিট তালিকা</p>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs no-print">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                ডিজিটাল হোমওয়ার্ক, অ্যাসাইনমেন্ট ও লেকচার শিট
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                সক্রিয়: {homeworks.filter((h) => h.status === 'active').length}টি
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              শ্রেণি ও বিষয়ভিত্তিক বাড়ির কাজ প্রকাশ, পিডিএফ/লেকচার সংযুক্তি এবং শিক্ষার্থী জমা ট্র্যাকার
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> ড্যাশবোর্ড
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট
          </button>
          <button
            type="button"
            onClick={() => setShowComposer((prev) => !prev)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {showComposer ? 'ফর্ম বন্ধ করুন' : 'নতুন হোমওয়ার্ক দিন'}
          </button>
        </div>
      </div>

      {/* Composer Form */}
      {showComposer && (
        <form
          onSubmit={handleCreateHomework}
          className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 rounded-2xl p-5 shadow-sm space-y-4 no-print"
        >
          <h2 className="text-sm font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <FileText className="w-4 h-4" /> নতুন হোমওয়ার্ক বা লেকচার শিট প্রকাশ করুন
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">শ্রেণি *</label>
              <select
                value={formGrade}
                onChange={(e) => {
                  setFormGrade(e.target.value);
                  setFormSubject('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                {GRADES.map((g) => (
                  <option key={g.key} value={g.key}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">শাখা</label>
              <select
                value={formSection}
                onChange={(e) => setFormSection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">সকল শাখা</option>
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>{sec} শাখা</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">বিষয় *</label>
              <input
                list="homework-subject-list"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="বিষয়ের নাম লিখুন বা বাছুন"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
              <datalist id="homework-subject-list">
                {gradeSubjects.map((sub) => (
                  <option key={sub.code} value={sub.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">জমা দেওয়ার শেষ তারিখ *</label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">শিরোনাম *</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="যেমন: অধ্যায়-৪ অনুশীলনী ৪.১ এর ১-১০ নং অঙ্ক সমাধান"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">বিষয় শিক্ষক</label>
              <div className="flex gap-2">
                <select
                  value={formTeacherId}
                  onChange={(e) => {
                    const tid = e.target.value;
                    setFormTeacherId(tid);
                    const found = teachers.find((t) => t.id === tid);
                    if (found) setFormTeacherName(found.name);
                  }}
                  className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="">নির্বাচন করুন</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formTeacherName}
                  onChange={(e) => setFormTeacherName(e.target.value)}
                  placeholder="শিক্ষকের নাম"
                  className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">বিস্তারিত নির্দেশনা ও পাঠ্যসূচি</label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="শিক্ষার্থীদের জন্য করণীয় বা লেকচার নোট বিস্তারিত লিখুন..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">সংযুক্তির নাম (ঐচ্ছিক)</label>
              <input
                type="text"
                value={formAttachmentName}
                onChange={(e) => setFormAttachmentName(e.target.value)}
                placeholder="যেমন: লেকচার শিট PDF"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">PDF / Google Drive লিংক</label>
              <input
                type="text"
                value={formAttachmentUrl.startsWith('data:') ? '(লোডকৃত ফাইল সংযুক্ত)' : formAttachmentUrl}
                onChange={(e) => setFormAttachmentUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex-1 px-3 py-2 rounded-xl border border-dashed border-indigo-400 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-950">
                <Upload className="w-4 h-4" /> ফাইল আপলোড (&le;1.4MB)
                <input type="file" accept=".pdf,image/*,.doc,.docx" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
              >
                প্রকাশ করুন
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3 no-print">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="হোমওয়ার্ক, বিষয় বা শিক্ষকের নাম দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
          />
        </div>
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
        >
          <option value="all">সকল শ্রেণি</option>
          {GRADES.map((g) => (
            <option key={g.key} value={g.key}>{g.label}</option>
          ))}
        </select>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
        >
          <option value="all">সকল শাখা</option>
          {SECTIONS.map((s) => (
            <option key={s} value={s}>{s} শাখা</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer px-2">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="rounded border-slate-300"
          />
          আর্কাইভকৃতসহ দেখুন
        </label>
      </div>

      {/* Homework Cards + Submission Tracker Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={trackerHomework ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4'}>
          {filteredHomeworks.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-black text-slate-600 dark:text-slate-300">কোনো হোমওয়ার্ক পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400">উপরের &quot;নতুন হোমওয়ার্ক দিন&quot; বাটনে ক্লিক করে নতুন পাঠ্য ও অ্যাসাইনমেন্ট যুক্ত করুন।</p>
            </div>
          ) : (
            filteredHomeworks.map((hw) => {
              const targetCount = students.filter(
                (s) => s.grade === hw.grade && (hw.section === 'all' || !hw.section || s.section === hw.section)
              ).length;
              const submittedCount = hw.submittedStudentIds.length;
              const pct = targetCount > 0 ? Math.min(100, Math.round((submittedCount / targetCount) * 100)) : 0;

              return (
                <div
                  key={hw.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs space-y-3 transition ${
                    trackerHomeworkId === hw.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  } ${hw.status === 'archived' ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {gradeLabel(hw.grade)} {hw.section && hw.section !== 'all' ? `(${hw.section})` : '(সকল শাখা)'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {hw.subject}
                        </span>
                        {hw.status === 'archived' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            আর্কাইভকৃত
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">{hw.title}</h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-black">
                        <Calendar className="w-3.5 h-3.5" /> জমা: {hw.dueDate}
                      </span>
                    </div>
                  </div>

                  {hw.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {hw.description}
                    </p>
                  )}

                  {hw.attachmentUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={hw.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={hw.attachmentUrl.startsWith('data:') ? hw.attachmentName || 'lecture-sheet' : undefined}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold hover:underline"
                      >
                        <Link2 className="w-3.5 h-3.5" /> {hw.attachmentName || 'সংযুক্ত লেকচার শিট দেখুন'}
                      </a>
                    </div>
                  )}

                  {/* Submission Progress */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>শিক্ষক: {hw.teacherName}</span>
                      <span>জমা দিয়েছে: {submittedCount} / {targetCount} জন ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 no-print">
                    <button
                      type="button"
                      onClick={() => setTrackerHomeworkId(trackerHomeworkId === hw.id ? null : hw.id)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" /> জমা ট্র্যাকার
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          homeworkService.toggleArchive(hw.id);
                          loadData();
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                        title={hw.status === 'active' ? 'আর্কাইভ করুন' : 'পুনরায় সক্রিয় করুন'}
                      >
                        <Archive className="w-3.5 h-3.5" /> {hw.status === 'active' ? 'আর্কাইভ' : 'সক্রিয়'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHomework(hw)}
                        className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Submission Checklist Drawer */}
        {trackerHomework && (
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 rounded-2xl p-5 shadow-md space-y-4 sticky top-4 no-print">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  হোমওয়ার্ক জমা ট্র্যাকার ({gradeLabel(trackerHomework.grade)})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5 line-clamp-1">
                  {trackerHomework.subject}: {trackerHomework.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrackerHomeworkId(null)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={trackerSearch}
                onChange={(e) => setTrackerSearch(e.target.value)}
                placeholder="নাম বা রোল দিয়ে শিক্ষার্থী খুঁজুন..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
              {trackerStudents.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400 font-bold">
                  এই শ্রেণি/শাখায় কোনো শিক্ষার্থী তালিকাভুক্ত নেই।
                </p>
              ) : (
                trackerStudents.map((st) => {
                  const submitted = trackerHomework.submittedStudentIds.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        homeworkService.toggleStudentSubmission(trackerHomework.id, st.id);
                        loadData();
                      }}
                      className="w-full py-2.5 px-2 flex items-center justify-between gap-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {submitted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{st.name}</p>
                          <p className="text-[11px] font-bold text-slate-400">
                            রোল: {st.roll} • শাখা: {st.section}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          submitted
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {submitted ? 'জমা হয়েছে' : 'বাকি'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
