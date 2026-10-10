'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Edit3, 
  Save, 
  CheckCircle2, 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  Printer, 
  Sparkles, 
  Award, 
  School,
  X,
  Building2,
  Calendar,
  AlertCircle,
  UserX,
  ArrowRight,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { studentService } from '@/services/studentService';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { teacherRBACService, SubjectAssignment } from '@/services/teacherRBACService';
import { auditTrailService } from '@/services/auditTrailService';
import { syncQueueService } from '@/services/syncQueueService';
import {
  getStudentReligion,
  getSubjectReligion,
  filterStudentsBySubjectReligion,
  ReligionType,
} from '@/lib/religionUtils';
import { getAllSubjectAliases } from '@/lib/markStorageUtils';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';

interface StudentMarkRow {
  id: string;
  roll: string;
  name: string;
  religion: ReligionType;
  written: number; // CQ
  mcq: number;     // MCQ
  practical: number; // Practical / CA
  total: number;
}

// Helper to load dynamic subjects directly from Curriculum & Academic Control Panel
const getDynamicConfiguredSubjects = (grade: string, group: string) => {
  return getActiveCurriculumSubjects(grade, group);
};

// Dynamic Marks Config Helper reading directly from configured class subject properties
// ✅ ধর্ম সংক্রান্ত সকল লজিক এখন কেন্দ্রীয় religionUtils থেকে আসে
// checkIsHinduStudent → isHinduStudent (from @/lib/religionUtils)
// getStudentReligion, getSubjectReligion, filterStudentsBySubjectReligion
const getSubjectMarksConfig = (subjectName: string, classSubjectsList: any[] = []) => {
  const found = classSubjectsList.find(s => s.name === subjectName || s.code === subjectName);
  if (found) {
    return {
      hasMcq: Boolean(found.mcq && found.mcq > 0),
      mcqMax: found.mcq || 0,
      hasPractical: Boolean((found.practical && found.practical > 0) || (found.ca && found.ca > 0)),
      practicalMax: found.practical || found.ca || 0,
      writtenMax: found.cq !== undefined ? found.cq : 70
    };
  }

  // Fallback defaults if not found in list
  if (subjectName.includes('বাংলা ১ম')) return { hasMcq: true, mcqMax: 30, hasPractical: false, practicalMax: 0, writtenMax: 70 };
  if (subjectName.includes('বাংলা ২য়')) return { hasMcq: true, mcqMax: 30, hasPractical: false, practicalMax: 0, writtenMax: 70 };
  if (subjectName.includes('ইংরেজি ১ম')) return { hasMcq: false, mcqMax: 0, hasPractical: false, practicalMax: 0, writtenMax: 100 };
  if (subjectName.includes('ইংরেজি ২য়')) return { hasMcq: false, mcqMax: 0, hasPractical: false, practicalMax: 0, writtenMax: 50 };
  if (subjectName.includes('ডিজিটাল') || subjectName.includes('ICT')) return { hasMcq: false, mcqMax: 0, hasPractical: true, practicalMax: 25, writtenMax: 25 };
  
  if (subjectName.includes('পদার্থ') || subjectName.includes('রসায়ন') || subjectName.includes('জীববিজ্ঞান') || subjectName.includes('উচ্চতর')) {
    return { hasMcq: true, mcqMax: 25, hasPractical: true, practicalMax: 25, writtenMax: 50 };
  }

  return { hasMcq: true, mcqMax: 30, hasPractical: false, practicalMax: 0, writtenMax: 70 };
};

const checkIsHinduStudent = (s: any): boolean => {
  const rel = (s.religion || s.religionBn || '').toString().toLowerCase();
  if (rel.includes('hindu') || rel.includes('হিন্দু') || rel.includes('sanatan') || rel.includes('সনাতন') || rel.includes('হিন্')) {
    return true;
  }
  const fullText = `${s.name || ''} ${s.fatherName || ''} ${s.guardian || ''} ${s.motherName || ''}`;
  const hinduKeywords = [
    'সেন', 'দাস', 'সরকার', 'বনিক', 'বণিক', 'বিশ্বাস', 'দত্ত', 'দে', 'রায়', 'রায়', 
    'পাল', 'চক্রবর্তী', 'শীল', 'বর্মণ', 'মহাজন', 'মন্ডল', 'মণ্ডল', 'ভট্টাচার্য', 
    'অধিকারী', 'নাথ', 'হালদার', 'ঘোষ', 'মজুমদার', 'দেবনাথ', 'সুতোর', 'সাহা', 
    'অংকন', 'প্রিয়াঙ্কা', 'জয়দেব', 'বিপ্লব', 'সুচরিতা', 'রানী', 'প্রদীপ', 'সুমন'
  ];
  return hinduKeywords.some(kw => fullText.includes(kw));
};

export default function ProfessionalMarkEntryPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedExam, setSelectedExam] = useState('অর্ধ-বার্ষিক পরীক্ষা ২০২৬');
  const [selectedGrade, setSelectedGrade] = useState('6th');
  const [selectedBranch, setSelectedBranch] = useState('A');
  const [selectedGroup, setSelectedGroup] = useState<'science' | 'humanities' | 'commerce'>('science');
  const [selectedSubject, setSelectedSubject] = useState('বাংলা ১ম পত্র');
  
  const [marks, setMarks] = useState<StudentMarkRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [printMarksheetModal, setPrintMarksheetModal] = useState(false);

  // Teacher RBAC Session & Assignments State
  const [session, setSession] = useState<UserSession | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<SubjectAssignment[]>([]);

  useEffect(() => {
    setMounted(true);
    const activeSession = teacherAuthService.getSession();
    setSession(activeSession || { role: 'admin' });
    const assignments = teacherRBACService.getSubjectAssignments();
    setTeacherAssignments(assignments);

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const g = urlParams.get('grade');
      const b = urlParams.get('branch');
      const s = urlParams.get('subject');
      if (g) setSelectedGrade(g);
      if (b) setSelectedBranch(b);
      if (s) setSelectedSubject(decodeURIComponent(s));
    }
  }, []);

  // Dynamically compute subjects configured for this grade and group from Academic Control Panel (/dashboard/academic)
  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';

  const handleGroupBranchChange = (val: string) => {
    if (isClass9or10) {
      if (val === 'science' || val === 'Science' || val === 'বিজ্ঞান') {
        setSelectedGroup('science');
        setSelectedBranch('Science');
      } else if (val === 'humanities' || val === 'Humanities' || val === 'মানবিক') {
        setSelectedGroup('humanities');
        setSelectedBranch('Humanities');
      } else if (val === 'commerce' || val === 'Commerce' || val === 'ব্যবসায় শিক্ষা') {
        setSelectedGroup('commerce');
        setSelectedBranch('Commerce');
      }
    } else {
      setSelectedBranch(val);
    }
  };

  useEffect(() => {
    if (selectedGrade === '9th' || selectedGrade === '10th') {
      if (selectedBranch === 'A' || selectedBranch === 'B' || selectedBranch === 'C') {
        setSelectedGroup('science');
        setSelectedBranch('Science');
      }
    } else {
      if (['Science', 'Humanities', 'Commerce', 'বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা'].includes(selectedBranch)) {
        setSelectedBranch('A');
      }
    }
  }, [selectedGrade]);

  const configuredSubjectsList = getDynamicConfiguredSubjects(selectedGrade, selectedGroup);
  const allSubjectNames = configuredSubjectsList.map(s => s.name);

  // ─── RBAC: শিক্ষক লগইন হলে শুধু assigned বিষয় দেখাবে ───
  const isTeacherRole = session?.role === 'teacher';
  const teacherIdentifier = session?.teacherId || session?.teacherName || '';

  // শিক্ষকের এই শ্রেণিতে assigned বিষয়গুলো
  const myAssignedSubjectsForGrade = useMemo(() => {
    if (!isTeacherRole || !teacherIdentifier) return [];
    return teacherRBACService.getTeacherAssignedSubjects(teacherIdentifier, selectedGrade);
  }, [isTeacherRole, teacherIdentifier, selectedGrade, teacherAssignments]);

  // শিক্ষকের পুরো স্কুলে যেকোনো শ্রেণিতে assigned বিষয়গুলো
  const myAllAssignedSubjects = useMemo(() => {
    if (!isTeacherRole || !teacherIdentifier) return [];
    return teacherRBACService.getTeacherAssignedSubjects(teacherIdentifier);
  }, [isTeacherRole, teacherIdentifier, teacherAssignments]);

  // শিক্ষকের শ্রেণি শিক্ষক অ্যাসাইনমেন্ট
  const myClassTeacherAssignments = useMemo(() => {
    if (!isTeacherRole || !teacherIdentifier) return [];
    return teacherRBACService.getTeacherClassTeacherAssignments(teacherIdentifier);
  }, [isTeacherRole, teacherIdentifier]);

  const isClassTeacherOnly = isTeacherRole && myAllAssignedSubjects.length === 0 && myClassTeacherAssignments.length > 0;
  const isTeacherWithNoSubjects = isTeacherRole && myAllAssignedSubjects.length === 0;

  // Admin → সব বিষয়; Teacher → শুধু এই শ্রেণিতে assigned বিষয়
  const availableSubjects = useMemo(() => {
    const subjectPool = new Set<string>();

    configuredSubjectsList.forEach(sub => {
      if (sub.name.includes('ধর্ম') || sub.code === 'REL-111' || sub.code.startsWith('REL-')) {
        // Expand religion so teachers can select their specific religion subject
        subjectPool.add('ইসলাম ও নৈতিক শিক্ষা');
        subjectPool.add('হিন্দুধর্ম ও নৈতিক শিক্ষা');
        subjectPool.add(sub.name);
      } else {
        subjectPool.add(sub.name);
      }
    });

    if (isTeacherRole) {
      myAssignedSubjectsForGrade.forEach(a => {
        if (a.subjectId) subjectPool.add(a.subjectId);
      });
    }

    const allCandidateSubjects = Array.from(subjectPool);

    if (!isTeacherRole) return allCandidateSubjects;

    return allCandidateSubjects.filter(name =>
      teacherRBACService.validateSubjectOwnership(teacherIdentifier, selectedGrade, name)
    );
  }, [isTeacherRole, teacherIdentifier, selectedGrade, configuredSubjectsList, myAssignedSubjectsForGrade]);

  // শিক্ষক যদি অন্য শ্রেণিতে assigned থাকেন, কিন্তু বর্তমান নির্বাচিত শ্রেণিতে কোনো বিষয় না থাকে
  const hasNoSubjectsInSelectedGrade = isTeacherRole && myAllAssignedSubjects.length > 0 && availableSubjects.length === 0;

  // শিক্ষকের প্রথম অ্যাসাইন করা শ্রেণিতে অটো-সুইচ
  useEffect(() => {
    if (isTeacherRole && myAllAssignedSubjects.length > 0 && myAssignedSubjectsForGrade.length === 0) {
      const firstValid = myAllAssignedSubjects[0];
      if (firstValid?.classId) {
        setSelectedGrade(firstValid.classId);
      }
    }
  }, [isTeacherRole, myAllAssignedSubjects, myAssignedSubjectsForGrade.length]);

  useEffect(() => {
    if (!mounted) return;

    // Reset subject if current selectedSubject is not present in current filtered list
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }

    const config = getSubjectMarksConfig(selectedSubject, configuredSubjectsList);

    // 1. Load students from Central studentService (no hardcoded/demo fallback)
    const isClass9or10Local = selectedGrade === '9th' || selectedGrade === '10th';
    const targetGroupBn = isClass9or10Local ? (selectedGroup === 'science' ? 'বিজ্ঞান' : selectedGroup === 'humanities' ? 'মানবিক' : 'ব্যবসায় শিক্ষা') : 'সাধারণ';

    let rawStudents = studentService.getStudentsByFilter(selectedGrade, selectedBranch, targetGroupBn);

    // ✅ ধর্মীয় বিষয় ফিল্টার: কেন্দ্রীয় religionUtils ব্যবহার করে
    // ইসলাম বিষয় → শুধু মুসলিম শিক্ষার্থী
    // হিন্দু বিষয় → শুধু হিন্দু শিক্ষার্থী
    // অন্যান্য বিষয় → সকল শিক্ষার্থী
    rawStudents = filterStudentsBySubjectReligion(rawStudents, selectedSubject);

    const directoryList: StudentMarkRow[] = rawStudents.map(s => ({
      id: s.id,
      roll: s.roll,
      name: s.name,
      religion: getStudentReligion(s),
      written: 0,
      mcq: 0,
      practical: 0,
      total: 0
    }));

    // 2. Load saved marks from LocalStorage and merge with directory student list
    const key = `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_${selectedGroup}_${selectedSubject}`;
    const saved = localStorage.getItem(key);
    let savedMap: Record<string, StudentMarkRow> = {};

    if (saved) {
      try {
        const parsedSaved: StudentMarkRow[] = JSON.parse(saved);
        parsedSaved.forEach(st => {
          savedMap[st.roll] = st;
          savedMap[st.id] = st;
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Recalculate marks and totals cleanly according to current subject's config
    const normalized = directoryList.map(st => {
      const savedSt = savedMap[st.roll] || savedMap[st.id];
      const rawWritten = savedSt ? savedSt.written : st.written;
      const rawMcq = savedSt ? savedSt.mcq : st.mcq;
      const rawPractical = savedSt ? savedSt.practical : st.practical;

      const written = Math.min(config.writtenMax, Math.max(0, rawWritten || 0));
      const mcq = config.hasMcq ? Math.min(config.mcqMax, Math.max(0, rawMcq || 0)) : 0;
      const practical = config.hasPractical ? Math.min(config.practicalMax, Math.max(0, rawPractical || 0)) : 0;
      const total = written + mcq + practical;

      return {
        ...st,
        written,
        mcq,
        practical,
        total
      };
    });

    setMarks(normalized);
  }, [selectedExam, selectedGrade, selectedBranch, selectedGroup, selectedSubject]);

  // Instant Change Handler & Auto Save
  const handleMarkChange = (id: string, field: 'written' | 'mcq' | 'practical', value: number) => {
    // RBAC: Verify teacher owns this subject before writing marks
    if (isTeacherRole && !teacherRBACService.validateSubjectOwnership(teacherIdentifier, selectedGrade, selectedSubject)) {
      alert('আপনার এই শ্রেণিতে এই বিষয়ের নম্বর পরিবর্তন করার অনুমতি নেই!');
      return;
    }

    const config = getSubjectMarksConfig(selectedSubject, configuredSubjectsList);

    const updated = marks.map(st => {
      if (st.id === id) {
        const rawWritten = field === 'written' ? value : st.written;
        const rawMcq = field === 'mcq' ? value : st.mcq;
        const rawPractical = field === 'practical' ? value : st.practical;

        const written = Math.min(config.writtenMax, Math.max(0, isNaN(rawWritten) ? 0 : rawWritten));
        const mcq = config.hasMcq ? Math.min(config.mcqMax, Math.max(0, isNaN(rawMcq) ? 0 : rawMcq)) : 0;
        const practical = config.hasPractical ? Math.min(config.practicalMax, Math.max(0, isNaN(rawPractical) ? 0 : rawPractical)) : 0;

        const total = written + mcq + practical;

        return {
          ...st,
          written,
          mcq,
          practical,
          total
        };
      }
      return st;
    });

    setMarks(updated);

    // Save to LocalStorage across all key variations & aliases
    const currSubObj = configuredSubjectsList.find(s => s.name === selectedSubject || s.code === selectedSubject);
    const subCode = currSubObj?.code || selectedSubject;
    const subName = currSubObj?.name || selectedSubject;

    const aliases = getAllSubjectAliases(selectedSubject);
    const allIdentifiers = Array.from(new Set([
      selectedSubject,
      subCode,
      subName,
      ...aliases.names,
      ...aliases.codes
    ]));

    const targetGroupBn = isClass9or10 ? (selectedGroup === 'science' ? 'বিজ্ঞান' : selectedGroup === 'humanities' ? 'মানবিক' : 'ব্যবসায় শিক্ষা') : 'সাধারণ';
    const groupsToSave = isClass9or10 ? [selectedGroup, targetGroupBn, ''] : ['সাধারণ', ''];

    const jsonVal = JSON.stringify(updated);
    for (const gp of groupsToSave) {
      for (const ident of allIdentifiers) {
        if (!ident) continue;
        localStorage.setItem(`sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_${gp}_${ident}`, jsonVal);
      }
    }

    // Track last save time for Teacher Portal display
    const _now = new Date();
    const _timeStr = `${_now.toLocaleDateString('bn-BD')} ${_now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}`;
    localStorage.setItem('sms_last_mark_save', _timeStr);

    auditTrailService.addLog({
      action: 'UPDATE_EXAM_MARKS',
      category: 'MARKS',
      details: `শ্রেণি ${selectedGrade} (${selectedBranch}) এর বিষয় '${selectedSubject}' এর নম্বর আপডেট করা হয়েছে`,
      performedBy: session?.teacherName || (session?.role === 'admin' ? 'অ্যাডমিন' : 'শিক্ষক'),
      status: 'SUCCESS'
    });

    const markEntityId = `${selectedExam}-${selectedGrade}-${selectedBranch}-${selectedSubject}`;
    syncQueueService.enqueue('exam_mark', markEntityId, 'UPDATE', {
      examId: selectedExam,
      grade: selectedGrade,
      branch: selectedBranch,
      group: selectedGroup,
      subject: selectedSubject,
      marksCount: updated.length,
      marks: updated
    }).catch(() => {});

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2000);
  };

  // ✅ সার্চ ফিল্টার — religion filter ইতিমধ্যে student load-এ হয়ে গেছে
  const filteredMarks = marks.filter(st =>
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.roll.includes(searchQuery)
  );

  const gradeNameBn = selectedGrade === '6th' ? '৬ষ্ঠ শ্রেণি' : selectedGrade === '7th' ? '৭ম শ্রেণি' : selectedGrade === '8th' ? '৮ম শ্রেণি' : selectedGrade === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি';

  const marksConfig = getSubjectMarksConfig(selectedSubject, configuredSubjectsList);

  if (!mounted) {
    return <div className="p-8 text-center text-slate-400 font-bold">মার্ক এন্ট্রি পেজ লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-0">
      
      {/* ⚠️ CLASS TEACHER ONLY BLOCK (যদি কোনো বিষয় বরাদ্দ না থাকে) */}
      {isClassTeacherOnly && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-8 text-center space-y-4 print:hidden shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-inner">
            <UserCheck size={32} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-black text-slate-900 text-lg">আপনি শুধুমাত্র শ্রেণি শিক্ষক (Class Teacher)</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              আপনার আইডিতে পরীক্ষার কোনো বিষয়ের দায়িত্ব প্রদান করা হয়নি। শ্রেণি শিক্ষক হিসেবে আপনি শিক্ষার্থীদের <strong>দৈনিক হাজিরা</strong> গ্রহণ করতে পারেন।
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard/academic/attendance"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-md transition transform active:scale-95"
            >
              <UserCheck size={16} /> শ্রেণি হাজিরা ডাকতে যান →
            </Link>
            <Link
              href="/dashboard/teacher"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
            >
              শিক্ষক প্রোফাইল
            </Link>
          </div>
        </div>
      )}

      {/* ⚠️ TEACHER HAS NO SUBJECTS IN THIS GRADE (অন্য শ্রেণিতে বরাদ্দ আছে) */}
      {hasNoSubjectsInSelectedGrade && (
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 text-center space-y-3 print:hidden">
          <div className="flex items-center justify-center gap-2 text-blue-900 font-black text-sm">
            <AlertCircle size={18} className="text-blue-600" />
            <span>{gradeNameBn}-এ আপনার কোনো বিষয় বরাদ্দ নেই</span>
          </div>
          <p className="text-xs text-blue-700 font-medium max-w-lg mx-auto">
            আপনার বরাদ্দকৃত বিষয়সমূহে নম্বর এন্ট্রি করতে নিচের শ্রেণি নির্বাচন করুন:
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            {myAllAssignedSubjects.map((sa: SubjectAssignment) => {
              const gLabel = sa.classId === '6th' ? '৬ষ্ঠ' : sa.classId === '7th' ? '৭ম' : sa.classId === '8th' ? '৮ম' : sa.classId === '9th' ? '৯ম' : '১০ম';
              return (
                <button
                  key={sa.id}
                  type="button"
                  onClick={() => {
                    setSelectedGrade(sa.classId);
                    setSelectedSubject(sa.subjectId);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-black text-[10px]">{gLabel} শ্রেণি</span>
                  <span>{sa.subjectId}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TOP ACTIONS (Clean & Compact) */}
      {!isClassTeacherOnly && !hasNoSubjectsInSelectedGrade && (
        <div className="flex justify-end print:hidden">
          <button
            onClick={() => setPrintMarksheetModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs transition transform active:scale-95 cursor-pointer"
          >
            <Printer size={15} />
            বিষয়ভিত্তিক ফলাফল প্রিন্ট
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* FILTER & CONTROL PANEL                      */}
      {/* ═══════════════════════════════════════════ */}
      {!isClassTeacherOnly && (
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-bold">
          
          {/* Exam Selector */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">১. পরীক্ষা (Examination)</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 text-slate-900 font-bold cursor-pointer"
            >
              <option value="অর্ধ-বার্ষিক পরীক্ষা ২০২৬">অর্ধ-বার্ষিক পরীক্ষা ২০২৬</option>
              <option value="বার্ষিক পরীক্ষা ২০২৬">বার্ষিক পরীক্ষা ২০২৬</option>
              <option value="এসএসসি প্রাক-নির্বাচনী ২০২৬">এসএসসি প্রাক-নির্বাচনী ২০২৬</option>
              <option value="১ম টিউটোরিয়াল পরীক্ষা ২০২৬">১ম টিউটোরিয়াল পরীক্ষা ২০২৬</option>
            </select>
          </div>

          {/* Class Selector */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">২. শ্রেণি (Class)</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 text-slate-900 font-bold cursor-pointer"
            >
              <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
              <option value="7th">৭ম শ্রেণি (Class 7)</option>
              <option value="8th">৮ম শ্রেণি (Class 8)</option>
              <option value="9th">৯ম শ্রেণি (Class 9)</option>
              <option value="10th">১০ম শ্রেণি (Class 10)</option>
            </select>
          </div>

          {/* Single Section or Group Selector */}
          <div>
            <label className="block text-[10px] font-extrabold text-indigo-700 uppercase mb-1">
              {isClass9or10 ? '৩. বিভাগ / গ্রুপ (Department / Group)' : '৩. শাখা / সেকশন (Section)'}
            </label>
            <select
              value={isClass9or10 ? selectedGroup : selectedBranch}
              onChange={(e) => handleGroupBranchChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-indigo-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 text-slate-950 font-extrabold cursor-pointer shadow-xs"
            >
              {isClass9or10 ? (
                <>
                  <option value="science">🧪 বিজ্ঞান বিভাগ (Science Group)</option>
                  <option value="humanities">📚 মানবিক বিভাগ (Humanities Group)</option>
                  <option value="commerce">💼 ব্যবসায় শিক্ষা বিভাগ (Commerce Group)</option>
                </>
              ) : (
                <>
                  <option value="A">Section A (ক শাখা)</option>
                  <option value="B">Section B (খ শাখা)</option>
                  <option value="C">Section C (গ শাখা)</option>
                </>
              )}
            </select>
          </div>

          {/* Subject Selector (Strict RBAC filtering for Teachers) */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase mb-1 flex items-center justify-between">
              <span className="text-slate-500">৪. বিষয় নির্বাচন (Subject)</span>
              {isTeacherRole && (
                <span className="text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded text-[9px] font-black">
                  🔒 শুধু আপনার বিষয় ({availableSubjects.length}টি)
                </span>
              )}
            </label>
            {availableSubjects.length === 0 ? (
              <div className="w-full px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-bold text-xs flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>কোনো বিষয় বরাদ্দ নেই</span>
              </div>
            ) : (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2.5 bg-indigo-50 border border-indigo-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 text-indigo-950 font-black cursor-pointer"
              >
                {availableSubjects.map((sub: string, idx: number) => (
                  <option key={idx} value={sub}>{sub}</option>
                ))}
              </select>
            )}
          </div>

        </div>
      </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MARK ENTRY SHEET TABLE                      */}
      {/* ═══════════════════════════════════════════ */}
      {!isClassTeacherOnly && !hasNoSubjectsInSelectedGrade && availableSubjects.length > 0 && (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4 p-5 print:hidden">
        
        {/* Table Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={18} />
                {gradeNameBn} ({selectedBranch} {isClass9or10 ? 'বিভাগ' : 'শাখা'}) - <span className="text-indigo-600">{selectedSubject}</span>
              </h3>
              {isClass9or10 && (
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black border border-indigo-200">
                  গ্রুপ ভিত্তিক এন্ট্রি
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">পরীক্ষা: {selectedExam}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="রোল বা নাম খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-800 font-medium w-28 sm:w-36"
              />
            </div>
          </div>
        </div>

        {/* 9-10 Common Subject Information Notice */}
        {isClass9or10 && (
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[11px] font-medium text-blue-900 flex items-center justify-between gap-2">
            <span>
              ℹ️ <strong>গ্রুপ ভিত্তিক এন্ট্রি নির্দেশিকা:</strong> আপনি বর্তমানে <strong>{selectedBranch} বিভাগ</strong>-এর শিক্ষার্থীদের নম্বর এন্ট্রি করছেন। অন্য বিভাগের শিক্ষার্থীদের নম্বর এন্ট্রি করতে উপরের ৩নং অপশন থেকে বিভাগ পরিবর্তন করুন।
            </span>
            <span className="px-2.5 py-1 bg-blue-200/80 text-blue-950 rounded-xl font-bold text-[10px] shrink-0 font-mono">
              শিক্ষার্থী: {marks.length} জন
            </span>
          </div>
        )}

        {/* Subject Religion Filter Indicator Banner */}
        {(selectedSubject.toLowerCase().includes('হিন্দু') || selectedSubject.toLowerCase().includes('hindu')) && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl text-xs font-bold flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="text-base">🕉️</span>
              <span><strong>ধর্মীয় বিষয় ফিল্টার:</strong> &quot;{selectedSubject}&quot; বিষয় নির্বাচিত থাকায় কেবল হিন্দু শিক্ষার্থীদের নামের তালিকা প্রদর্শিত হচ্ছে।</span>
            </span>
            <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-full font-mono text-[11px] shrink-0 font-black">
              মোট: {marks.length} জন
            </span>
          </div>
        )}

        {(selectedSubject.toLowerCase().includes('ইসলাম') || selectedSubject.toLowerCase().includes('islam')) && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl text-xs font-bold flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="text-base">☪️</span>
              <span><strong>ধর্মীয় বিষয় ফিল্টার:</strong> &quot;{selectedSubject}&quot; বিষয় নির্বাচিত থাকায় কেবল মুসলিম শিক্ষার্থীদের নামের তালিকা প্রদর্শিত হচ্ছে।</span>
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-full font-mono text-[11px] shrink-0 font-black">
              মোট: {marks.length} জন
            </span>
          </div>
        )}

        {/* Entry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-100/80 text-slate-900 font-black uppercase text-[11px] border-b border-slate-200">
                <th className="p-3 text-center w-16">রোল</th>
                <th className="p-3">শিক্ষার্থীর নাম</th>
                <th className="p-3 w-36 text-center">সিকিউ / লিখিত (CQ max {marksConfig.writtenMax})</th>
                <th className="p-3 w-36 text-center">
                  {marksConfig.hasMcq ? `এমসিকিউ (MCQ max ${marksConfig.mcqMax})` : 'এমসিকিউ (বন্ধ)'}
                </th>
                <th className="p-3 w-36 text-center">
                  {marksConfig.hasPractical ? `ব্যবহারিক (max ${marksConfig.practicalMax})` : 'ব্যবহারিক (বন্ধ)'}
                </th>
                <th className="p-3 w-28 text-center">মোট নম্বর</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMarks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <UserX className="w-8 h-8 text-indigo-300" />
                      </div>
                      <p className="text-slate-700 font-bold text-sm">এই শ্রেণি ও শাখায় কোনো শিক্ষার্থী নেই</p>
                      <p className="text-slate-400 text-xs max-w-xs">শিক্ষার্থী এন্ট্রি করুন বা CSV আপলোড করুন। তারপর এখানে মার্ক এন্ট্রি করতে পারবেন।</p>
                      <Link
                        href="/dashboard/students"
                        className="mt-1 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                      >
                        শিক্ষার্থী তালিকায় যান <ArrowRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMarks.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 text-center font-black font-mono text-slate-900">{st.roll}</td>
                    <td className="p-3 font-extrabold text-slate-900">
                      {st.name}
                      <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        st.religion === 'Hindu'
                          ? 'bg-amber-100 text-amber-700'
                          : st.religion === 'Christian'
                          ? 'bg-blue-100 text-blue-700'
                          : st.religion === 'Buddhist'
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {st.religion === 'Hindu' ? '🕉️ হিন্দু' : st.religion === 'Christian' ? '✝️ খ্রিস্টান' : st.religion === 'Buddhist' ? '☸️ বৌদ্ধ' : '☪️ মুসলিম'}
                      </span>
                    </td>
                    
                    {/* Written CQ */}
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={marksConfig.writtenMax}
                        value={st.written}
                        onWheel={(e) => e.currentTarget.blur()}
                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                        onChange={(e) => handleMarkChange(st.id, 'written', Number(e.target.value))}
                        className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white text-xs font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>

                    {/* MCQ (Disabled if subject settings has no MCQ) */}
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={marksConfig.mcqMax}
                        disabled={!marksConfig.hasMcq}
                        value={marksConfig.hasMcq ? st.mcq : 0}
                        onWheel={(e) => e.currentTarget.blur()}
                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                        onChange={(e) => handleMarkChange(st.id, 'mcq', Number(e.target.value))}
                        className={`w-24 px-2 py-1.5 border rounded-xl text-center font-bold text-xs font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          marksConfig.hasMcq
                            ? 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:bg-white'
                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                      />
                    </td>

                    {/* Practical / CA (Disabled if subject settings has no Practical) */}
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={marksConfig.practicalMax}
                        disabled={!marksConfig.hasPractical}
                        value={marksConfig.hasPractical ? st.practical : 0}
                        onWheel={(e) => e.currentTarget.blur()}
                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                        onChange={(e) => handleMarkChange(st.id, 'practical', Number(e.target.value))}
                        className={`w-24 px-2 py-1.5 border rounded-xl text-center font-bold text-xs font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          marksConfig.hasPractical
                            ? 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:bg-white'
                            : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                      />
                    </td>

                    {/* Total */}
                    <td className="p-3 text-center font-black font-mono text-indigo-700 text-sm">
                      {st.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Live Auto-save bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <p className="text-slate-500 font-medium">
            তালিকাভুক্ত মোট শিক্ষার্থী: <strong className="text-slate-900 font-bold">{filteredMarks.length} জন</strong>
          </p>

          <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200/80 font-extrabold">
            <CheckCircle2 size={16} className="text-emerald-600 animate-pulse" />
            <span>লাইভ অটো-সেভ সক্রিয় (ইন্সট্যান্ট সেভ হচ্ছে)</span>
          </div>
        </div>

      </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* 🖨️ MODAL: PRINTABLE SUBJECT MARKSHEET REPORT                       */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {printMarksheetModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:w-full print:rounded-none">
            
            {/* Top Bar */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 p-4 rounded-t-3xl text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-3">
                <Printer className="text-amber-300" size={18} />
                <div>
                  <h3 className="font-extrabold text-sm">বিষয়ভিত্তিক ফলাফল শিট প্রিন্ট প্রিভিউ</h3>
                  <p className="text-[11px] text-indigo-200 font-medium">{gradeNameBn} ({selectedBranch} {selectedGrade === '9th' || selectedGrade === '10th' ? 'গ্রুপ' : 'শাখা'}) - {selectedSubject}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  <Printer size={15} /> প্রিন্ট করুন
                </button>
                <button onClick={() => setPrintMarksheetModal(false)} className="p-1.5 text-white/70 hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Paper Sheet */}
            <div className="p-8 sm:p-10 font-serif text-slate-950 space-y-6 print:p-0 print:m-0">
              <div className="text-center border-b-2 border-slate-950 pb-4 space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-950">বরইতলী উচ্চ বিদ্যালয়</h1>
                <p className="text-xs font-bold text-slate-800">চকরিয়া, কক্সবাজার | EIIN: ১০৮২৩৪</p>
                <div className="pt-1">
                  <span className="inline-block px-5 py-1 bg-slate-950 text-white font-black text-xs rounded-full uppercase">
                    বিষয়ভিত্তিক পরীক্ষা নম্বরপত্র - {selectedExam}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 pt-2">
                  <span>শ্রেণি: {gradeNameBn} ({selectedBranch} {selectedGrade === '9th' || selectedGrade === '10th' ? 'গ্রুপ' : 'শাখা'})</span>
                  <span>বিষয়: {selectedSubject}</span>
                  <span>মোট পরীক্ষার্থী: {marks.length} জন</span>
                </div>
              </div>

              <div className="overflow-hidden border border-slate-950 rounded-lg">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-200 text-slate-950 font-black uppercase text-[11px] border-b border-slate-950">
                      <th className="p-2.5 text-center border-r border-slate-950 w-14">রোল</th>
                      <th className="p-2.5 border-r border-slate-950">শিক্ষার্থীর নাম</th>
                      <th className="p-2.5 text-center border-r border-slate-950 w-24">সিকিউ (70)</th>
                      <th className="p-2.5 text-center border-r border-slate-950 w-24">এমসিকিউ (30)</th>
                      <th className="p-2.5 text-center border-r border-slate-950 w-24">ব্যবহারিক (25)</th>
                      <th className="p-2.5 text-center w-24">মোট নম্বর</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-950 font-medium">
                    {filteredMarks.map((st) => (
                      <tr key={st.id} className="border-b border-slate-950">
                        <td className="p-2.5 text-center font-black font-mono border-r border-slate-950">{st.roll}</td>
                        <td className="p-2.5 font-bold border-r border-slate-950">
                          {st.name} ({st.religion === 'Muslim' ? 'মুসলিম' : 'হিন্দু'})
                        </td>
                        <td className="p-2.5 text-center font-mono border-r border-slate-950">{st.written}</td>
                        <td className="p-2.5 text-center font-mono border-r border-slate-950">{st.mcq}</td>
                        <td className="p-2.5 text-center font-mono border-r border-slate-950">{st.practical}</td>
                        <td className="p-2.5 text-center font-black font-mono">{st.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-14 flex justify-between items-end text-center text-xs font-bold">
                <div>
                  <div className="w-40 border-b border-slate-950 mx-auto"></div>
                  <p>বিষয় শিক্ষক (Subject Teacher)</p>
                </div>
                <div>
                  <div className="w-40 border-b border-slate-950 mx-auto"></div>
                  <p className="font-black">প্রধান শিক্ষক</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}