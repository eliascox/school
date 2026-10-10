'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Edit3,
  Save,
  CheckCircle2,
  Search,
  BookOpen,
  Users,
  Printer,
  Sparkles,
  Award,
  Download,
  Upload,
  FileSpreadsheet,
  ArrowRight,
  UserX,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  FileText,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { studentService, Student } from '@/services/studentService';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { teacherRBACService, SubjectAssignment } from '@/services/teacherRBACService';
import {
  getStudentReligion,
  getReligionSubjectKeys,
  getSubjectReligion,
  ReligionType
} from '@/lib/religionUtils';
import { getAllSubjectAliases } from '@/lib/markStorageUtils';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';

interface SubjectConfig {
  code: string;
  name: string;
  fullMarks: number;
  cq?: number;
  mcq?: number;
  practical?: number;
  ca?: number;
  category?: string;
}

interface SubjectMarkBreakdown {
  cq: number;
  mcq: number;
  practical: number;
  total: number;
}

interface StudentBulkRow {
  id: string;
  roll: string;
  name: string;
  religion: ReligionType;
  group: string;
  // subjectCode -> total mark
  marks: Record<string, number>;
  // subjectCode -> CQ, MCQ, Practical breakdown
  subjectBreakdown: Record<string, SubjectMarkBreakdown>;
  totalObtained: number;
  totalFull: number;
  gpa: number;
  grade: string;
  hasFailed: boolean;
}

// Dynamic Subjects Helper linked to Curriculum
const getDynamicConfiguredSubjects = (grade: string, group: string): SubjectConfig[] => {
  return getActiveCurriculumSubjects(grade, group);
};

// Calculate Grade Point & Letter
const calculateGP = (obtained: number, full: number) => {
  const pct = full > 0 ? (obtained / full) * 100 : 0;
  if (pct >= 80) return { grade: 'A+', point: 5.0 };
  if (pct >= 70) return { grade: 'A', point: 4.0 };
  if (pct >= 60) return { grade: 'A-', point: 3.5 };
  if (pct >= 50) return { grade: 'B', point: 3.0 };
  if (pct >= 40) return { grade: 'C', point: 2.0 };
  if (pct >= 33) return { grade: 'D', point: 1.0 };
  return { grade: 'F', point: 0.0 };
};

export default function BulkMarkEntryPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedExam, setSelectedExam] = useState('অর্ধ-বার্ষিক পরীক্ষা ২০২৬');
  const [selectedGrade, setSelectedGrade] = useState('6th');
  const [selectedBranch, setSelectedBranch] = useState('A');
  const [selectedGroup, setSelectedGroup] = useState<'science' | 'humanities' | 'commerce'>('science');
  const [entryMode, setEntryMode] = useState<'breakdown' | 'total'>('breakdown');

  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<SubjectAssignment[]>([]);

  const [studentRows, setStudentRows] = useState<StudentBulkRow[]>([]);

  useEffect(() => {
    setMounted(true);
    const s = teacherAuthService.getSession();
    setSession(s || { role: 'admin' });
    setTeacherAssignments(teacherRBACService.getSubjectAssignments());
  }, []);

  const isTeacherRole = session?.role === 'teacher';
  const teacherIdentifier = session?.teacherId || session?.teacherName || '';

  const canEditSubject = useCallback((subName: string): boolean => {
    if (!isTeacherRole || !teacherIdentifier) return true;
    return teacherRBACService.validateSubjectOwnership(teacherIdentifier, selectedGrade, subName);
  }, [isTeacherRole, teacherIdentifier, selectedGrade, teacherAssignments]);

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

  const subjects = useMemo(
    () => getDynamicConfiguredSubjects(selectedGrade, selectedGroup),
    [selectedGrade, selectedGroup]
  );

  // Load students & saved marks across all subjects
  useEffect(() => {
    if (!mounted) return;

    const targetGroupBn = isClass9or10
      ? selectedGroup === 'science'
        ? 'বিজ্ঞান'
        : selectedGroup === 'humanities'
        ? 'মানবিক'
        : 'ব্যবসায় শিক্ষা'
      : 'সাধারণ';

    const rawStudents = studentService.getStudentsByFilter(selectedGrade, selectedBranch, targetGroupBn);

    // Build rows with detailed breakdown & total marks per subject loaded from localStorage
    const rows: StudentBulkRow[] = rawStudents.map((st) => {
      const rel = getStudentReligion(st);
      const marksMap: Record<string, number> = {};
      const breakdownMap: Record<string, SubjectMarkBreakdown> = {};

      let totalObt = 0;
      let totalFullMarks = 0;
      let totalPoints = 0;
      let subjectCount = 0;
      let failed = false;

      subjects.forEach((sub) => {
        let val = 0;
        let cq = 0;
        let mcq = 0;
        let practical = 0;
        const subFull = sub.fullMarks || 100;

        // Determine correct storage key for religion and optional subjects
        let targetCodes = [sub.code];
        let targetNames = [sub.name];

        if (sub.code === 'REL-111' || sub.name.includes('ধর্ম')) {
          const relKeys = getReligionSubjectKeys(rel);
          targetCodes = relKeys.codes;
          targetNames = relKeys.names;
        }

        // Search localStorage for existing saved mark & component breakdowns
        for (const code of targetCodes) {
          for (const name of targetNames) {
            const possibleKeys = [
              `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_${targetGroupBn}_${code}`,
              `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_${targetGroupBn}_${name}`,
              `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_${selectedGroup}_${code}`,
              `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_${selectedGroup}_${name}`,
              `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_সাধারণ_${code}`,
              `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_সাধারণ_${name}`
            ];

            for (const k of possibleKeys) {
              const savedJson = localStorage.getItem(k);
              if (savedJson) {
                try {
                  const arr = JSON.parse(savedJson);
                  const found = Array.isArray(arr) ? arr.find((s: any) => s.roll === st.roll || s.id === st.id) : null;
                  if (found) {
                    cq = Number(found.written || 0);
                    mcq = Number(found.mcq || 0);
                    practical = Number(found.practical || 0);
                    val = Number(found.total !== undefined ? found.total : cq + mcq + practical);
                    break;
                  }
                } catch (e) {}
              }
            }
            if (val > 0 || cq > 0 || mcq > 0 || practical > 0) break;
          }
          if (val > 0 || cq > 0 || mcq > 0 || practical > 0) break;
        }

        marksMap[sub.code] = val;
        breakdownMap[sub.code] = { cq, mcq, practical, total: val };

        totalObt += val;
        totalFullMarks += subFull;

        const gp = calculateGP(val, subFull);
        if (gp.grade === 'F') failed = true;
        totalPoints += gp.point;
        subjectCount++;
      });

      const gpa = failed || subjectCount === 0 ? 0.0 : Number((totalPoints / subjectCount).toFixed(2));
      const overallGrade = failed ? 'F' : gpa >= 5.0 ? 'A+' : gpa >= 4.0 ? 'A' : gpa >= 3.5 ? 'A-' : gpa >= 3.0 ? 'B' : gpa >= 2.0 ? 'C' : 'D';

      return {
        id: st.id,
        roll: st.roll,
        name: st.name,
        religion: rel,
        group: targetGroupBn,
        marks: marksMap,
        subjectBreakdown: breakdownMap,
        totalObtained: totalObt,
        totalFull: totalFullMarks,
        gpa,
        grade: overallGrade,
        hasFailed: failed
      };
    });

    setStudentRows(rows);
  }, [mounted, selectedExam, selectedGrade, selectedBranch, selectedGroup, subjects]);

  // Handle single cell total mark update
  const handleCellMarkChange = (studentId: string, subCode: string, subFullMarks: number, value: number) => {
    const clamped = Math.min(subFullMarks, Math.max(0, isNaN(value) ? 0 : value));

    const updatedRows = studentRows.map((row) => {
      if (row.id !== studentId) return row;

      const newMarks = { ...row.marks, [subCode]: clamped };
      const currentBd = row.subjectBreakdown?.[subCode] || { cq: 0, mcq: 0, practical: 0, total: 0 };
      const newBreakdown = {
        ...row.subjectBreakdown,
        [subCode]: { ...currentBd, cq: clamped, mcq: 0, practical: 0, total: clamped }
      };

      let totalObt = 0;
      let totalFullMarks = 0;
      let totalPoints = 0;
      let subjectCount = 0;
      let failed = false;

      subjects.forEach((sub) => {
        const val = newMarks[sub.code] || 0;
        const subFull = sub.fullMarks || 100;

        totalObt += val;
        totalFullMarks += subFull;

        const gp = calculateGP(val, subFull);
        if (gp.grade === 'F') failed = true;
        totalPoints += gp.point;
        subjectCount++;
      });

      const gpa = failed || subjectCount === 0 ? 0.0 : Number((totalPoints / subjectCount).toFixed(2));
      const overallGrade = failed ? 'F' : gpa >= 5.0 ? 'A+' : gpa >= 4.0 ? 'A' : gpa >= 3.5 ? 'A-' : gpa >= 3.0 ? 'B' : gpa >= 2.0 ? 'C' : 'D';

      return {
        ...row,
        marks: newMarks,
        subjectBreakdown: newBreakdown,
        totalObtained: totalObt,
        totalFull: totalFullMarks,
        gpa,
        grade: overallGrade,
        hasFailed: failed
      };
    });

    setStudentRows(updatedRows);
    saveSingleSubjectToStorage(subCode, updatedRows);
  };

  // Handle breakdown component mark change (CQ / MCQ / Practical)
  const handleBreakdownCellMarkChange = (
    studentId: string,
    subCode: string,
    subFullMarks: number,
    type: 'cq' | 'mcq' | 'practical',
    value: number
  ) => {
    const clamped = Math.min(subFullMarks, Math.max(0, isNaN(value) ? 0 : value));

    const updatedRows = studentRows.map((row) => {
      if (row.id !== studentId) return row;

      const currentBd = row.subjectBreakdown?.[subCode] || { cq: 0, mcq: 0, practical: 0, total: row.marks[subCode] || 0 };
      const newBd = { ...currentBd, [type]: clamped };
      newBd.total = (newBd.cq || 0) + (newBd.mcq || 0) + (newBd.practical || 0);

      const newMarks = { ...row.marks, [subCode]: newBd.total };
      const newBreakdown = { ...row.subjectBreakdown, [subCode]: newBd };

      let totalObt = 0;
      let totalFullMarks = 0;
      let totalPoints = 0;
      let subjectCount = 0;
      let failed = false;

      subjects.forEach((sub) => {
        const val = newMarks[sub.code] || 0;
        const subFull = sub.fullMarks || 100;

        totalObt += val;
        totalFullMarks += subFull;

        const gp = calculateGP(val, subFull);
        if (gp.grade === 'F') failed = true;
        totalPoints += gp.point;
        subjectCount++;
      });

      const gpa = failed || subjectCount === 0 ? 0.0 : Number((totalPoints / subjectCount).toFixed(2));
      const overallGrade = failed ? 'F' : gpa >= 5.0 ? 'A+' : gpa >= 4.0 ? 'A' : gpa >= 3.5 ? 'A-' : gpa >= 3.0 ? 'B' : gpa >= 2.0 ? 'C' : 'D';

      return {
        ...row,
        marks: newMarks,
        subjectBreakdown: newBreakdown,
        totalObtained: totalObt,
        totalFull: totalFullMarks,
        gpa,
        grade: overallGrade,
        hasFailed: failed
      };
    });

    setStudentRows(updatedRows);
    saveSingleSubjectToStorage(subCode, updatedRows);
  };

  // Save changes to localStorage for a subject so Mark Entry & Tabulation stay perfectly synced
  const saveSingleSubjectToStorage = (subCode: string, currentRows: StudentBulkRow[]) => {
    const subObj = subjects.find(s => s.code === subCode);
    if (!subObj) return;

    const subName = subObj.name;
    const isRel = subCode === 'REL-111' || subName.includes('ধর্ম');

    const buildMarkItem = (r: StudentBulkRow) => {
      const bd = r.subjectBreakdown?.[subCode] || { cq: r.marks[subCode] || 0, mcq: 0, practical: 0, total: r.marks[subCode] || 0 };
      const tot = bd.total || r.marks[subCode] || 0;
      return {
        id: r.id,
        roll: r.roll,
        name: r.name,
        religion: r.religion,
        written: bd.cq || 0,
        mcq: bd.mcq || 0,
        practical: bd.practical || 0,
        total: tot
      };
    };

    if (isRel) {
      const muslimStudents = currentRows.filter(r => r.religion === 'Muslim').map(buildMarkItem);
      const hinduStudents = currentRows.filter(r => r.religion === 'Hindu').map(buildMarkItem);

      const islamKeys = [
        `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_${selectedGroup}_ইসলাম ও নৈতিক শিক্ষা`,
        `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_সাধারণ_ইসলাম ও নৈতিক শিক্ষা`,
        `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_${selectedGroup}_REL-111`,
        `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_সাধারণ_REL-111`
      ];
      const hinduKeys = [
        `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_${selectedGroup}_হিন্দুধর্ম ও নৈতিক শিক্ষা`,
        `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_সাধারণ_হিন্দুধর্ম ও নৈতিক শিক্ষা`,
        `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_${selectedGroup}_REL-112`,
        `sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_সাধারণ_REL-112`
      ];

      const islamJson = JSON.stringify(muslimStudents);
      const hinduJson = JSON.stringify(hinduStudents);

      islamKeys.forEach(k => localStorage.setItem(k, islamJson));
      hinduKeys.forEach(k => localStorage.setItem(k, hinduJson));
    } else {
      const markArray = currentRows.map(buildMarkItem);
      const jsonVal = JSON.stringify(markArray);

      const aliases = getAllSubjectAliases(subName || subCode);
      const allIdentifiers = Array.from(new Set([
        subCode,
        subName,
        ...aliases.names,
        ...aliases.codes
      ]));

      const targetGroupBn = isClass9or10 ? (selectedGroup === 'science' ? 'বিজ্ঞান' : selectedGroup === 'humanities' ? 'মানবিক' : 'ব্যবসায় শিক্ষা') : 'সাধারণ';
      const groupsToSave = isClass9or10 ? [selectedGroup, targetGroupBn, ''] : ['সাধারণ', ''];

      for (const gp of groupsToSave) {
        for (const ident of allIdentifiers) {
          if (!ident) continue;
          localStorage.setItem(`sms_marks_${selectedExam}_${selectedGrade}_${selectedBranch}_${gp}_${ident}`, jsonVal);
        }
      }
    }
  };

  // Bulk Save All Subjects
  const handleSaveAll = () => {
    subjects.forEach((sub) => {
      if (canEditSubject(sub.name)) {
        saveSingleSubjectToStorage(sub.code, studentRows);
      }
    });
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Download Sample CSV / Excel Template
  const handleDownloadCsvTemplate = (type: 'breakdown' | 'total' = 'breakdown') => {
    let headerCols: string[] = ['Roll', 'Name', 'Religion'];

    if (type === 'breakdown') {
      subjects.forEach(s => {
        const hasMcq = Boolean(s.mcq && s.mcq > 0);
        const hasPr = !!s.practical;
        headerCols.push(`${s.name} (CQ)`);
        if (hasMcq) headerCols.push(`${s.name} (MCQ)`);
        if (hasPr) headerCols.push(`${s.name} (Practical)`);
      });
    } else {
      subjects.forEach(s => headerCols.push(`${s.name} (Total)`));
    }

    const header = headerCols.map(c => `"${c}"`).join(',');

    const body = studentRows.map(r => {
      const rowCols: string[] = [`"${r.roll}"`, `"${r.name}"`, `"${r.religion}"`];
      if (type === 'breakdown') {
        subjects.forEach(s => {
          const bd = r.subjectBreakdown?.[s.code] || { cq: 0, mcq: 0, practical: 0, total: r.marks[s.code] || 0 };
          const hasMcq = Boolean(s.mcq && s.mcq > 0);
          const hasPr = !!s.practical;
          rowCols.push(String(bd.cq || 0));
          if (hasMcq) rowCols.push(String(bd.mcq || 0));
          if (hasPr) rowCols.push(String(bd.practical || 0));
        });
      } else {
        subjects.forEach(s => {
          rowCols.push(String(r.marks[s.code] || 0));
        });
      }
      return rowCols.join(',');
    }).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(header + '\n' + body);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Bulk_Marks_${selectedGrade}_${selectedBranch}_${selectedGroup}_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload & Parse CSV / Excel File
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) return;

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const updatedRows = [...studentRows];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.replace(/"/g, '').trim());
        const roll = parts[0];
        const rowIdx = updatedRows.findIndex(r => r.roll === roll);

        if (rowIdx !== -1) {
          const row = updatedRows[rowIdx];
          const newMarks = { ...row.marks };
          const newBreakdown = { ...row.subjectBreakdown };

          subjects.forEach(sub => {
            let cqVal = 0;
            let mcqVal = 0;
            let prVal = 0;
            let totalVal = 0;
            let foundInHeader = false;

            headers.forEach((h, hIdx) => {
              const val = Number(parts[hIdx]) || 0;
              if (h.includes(sub.name) || h.includes(sub.code)) {
                foundInHeader = true;
                if (h.includes('(CQ)') || h.includes('_CQ') || h.includes('CQ') || h.includes('লিখিত')) {
                  cqVal = val;
                } else if (h.includes('(MCQ)') || h.includes('_MCQ') || h.includes('MCQ') || h.includes('এমসিকিউ')) {
                  mcqVal = val;
                } else if (h.includes('(Practical)') || h.includes('_Pr') || h.includes('Practical') || h.includes('ব্যবহারিক')) {
                  prVal = val;
                } else if (h.includes('(Total)') || h.includes('Total') || h.includes('মোট')) {
                  totalVal = val;
                } else {
                  totalVal = val;
                }
              }
            });

            if (foundInHeader) {
              const calculatedTotal = (cqVal || mcqVal || prVal) ? (cqVal + mcqVal + prVal) : totalVal;
              newMarks[sub.code] = calculatedTotal;
              newBreakdown[sub.code] = {
                cq: cqVal || (totalVal ? totalVal : 0),
                mcq: mcqVal,
                practical: prVal,
                total: calculatedTotal
              };
            }
          });

          let totalObt = 0;
          let totalFullMarks = 0;
          let totalPoints = 0;
          let subjectCount = 0;
          let failed = false;

          subjects.forEach(sub => {
            const val = newMarks[sub.code] || 0;
            const subFull = sub.fullMarks || 100;
            totalObt += val;
            totalFullMarks += subFull;
            const gp = calculateGP(val, subFull);
            if (gp.grade === 'F') failed = true;
            totalPoints += gp.point;
            subjectCount++;
          });

          const gpa = failed || subjectCount === 0 ? 0.0 : Number((totalPoints / subjectCount).toFixed(2));
          const overallGrade = failed ? 'F' : gpa >= 5.0 ? 'A+' : gpa >= 4.0 ? 'A' : gpa >= 3.5 ? 'A-' : gpa >= 3.0 ? 'B' : gpa >= 2.0 ? 'C' : 'D';

          updatedRows[rowIdx] = {
            ...row,
            marks: newMarks,
            subjectBreakdown: newBreakdown,
            totalObtained: totalObt,
            totalFull: totalFullMarks,
            gpa,
            grade: overallGrade,
            hasFailed: failed
          };
        }
      }

      setStudentRows(updatedRows);
      subjects.forEach((sub) => {
        saveSingleSubjectToStorage(sub.code, updatedRows);
      });
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    };

    reader.readAsText(file, 'UTF-8');
  };

  const filteredRows = studentRows.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.roll.includes(searchQuery)
  );

  const gradeNameBn = selectedGrade === '6th' ? '৬ষ্ঠ শ্রেণি' : selectedGrade === '7th' ? '৭ম শ্রেণি' : selectedGrade === '8th' ? '৮ম শ্রেণি' : selectedGrade === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি';

  if (!mounted) {
    return <div className="p-8 text-center text-slate-400 font-bold">বাল্ক মার্ক এন্ট্রি লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-0">

      {/* 🔗 DIRECT MODULE NAVIGATION LINKS BAR */}
      <div className="flex items-center justify-between gap-2 p-2 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black overflow-x-auto print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/exam/mark-entry"
            className="px-3.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
          >
            <Edit3 size={14} /> বিষয়ভিত্তিক নম্বর এন্ট্রি (CQ/MCQ/Pr) ↗
          </Link>
          <span className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl flex items-center gap-1.5 shadow-sm">
            <FileSpreadsheet size={14} /> 📊 বাল্ক ফলাফল এন্ট্রি (Spreadsheet Matrix)
          </span>
          <Link
            href="/dashboard/exam/tabulation"
            className="px-3.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
          >
            <FileText size={14} /> টেবুলেশন শীট ↗
          </Link>
          <Link
            href="/dashboard/exam/rank-result"
            className="px-3.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
          >
            <Award size={14} /> মেধা তালিকা ↗
          </Link>
        </div>
      </div>

      {/* TOP ACTIONS (Clean & Compact) */}
      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <button
          onClick={() => handleDownloadCsvTemplate('breakdown')}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs border border-slate-200 transition cursor-pointer"
          title="CQ, MCQ & Pr সহ বিস্তারিত নমুনা ফাইল ডাউনলোড"
        >
          <Download size={14} /> CQ/MCQ/Pr CSV
        </button>

        <button
          onClick={() => handleDownloadCsvTemplate('total')}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs border border-slate-200 transition cursor-pointer"
          title="সাধারণ মোট নম্বর নমুনা ফাইল ডাউনলোড"
        >
          <Download size={14} /> মোট নম্বর CSV
        </button>

        <label className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs cursor-pointer transition">
          <Upload size={14} /> CSV আপলোড
          <input type="file" accept=".csv" onChange={handleCsvFileUpload} className="hidden" />
        </label>

        <button
          onClick={handleSaveAll}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs transition transform active:scale-95 cursor-pointer"
        >
          <Save size={14} /> সেভ করুন
        </button>
      </div>

      {/* FILTER & SELECTOR CONTROLS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">১. পরীক্ষা (Exam)</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 text-slate-900 font-bold cursor-pointer"
            >
              <option value="অর্ধ-বার্ষিক পরীক্ষা ২০২৬">অর্ধ-বার্ষিক পরীক্ষা ২০২৬</option>
              <option value="বার্ষিক পরীক্ষা ২০২৬">বার্ষিক পরীক্ষা ২০২৬</option>
              <option value="এসএসসি প্রাক-নির্বাচনী ২০২৬">এসএসসি প্রাক-নির্বাচনী ২০২৬</option>
            </select>
          </div>

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

          <div>
            <label className="block text-[10px] font-extrabold text-indigo-700 uppercase mb-1">
              {isClass9or10 ? '৩. বিভাগ / গ্রুপ (Department / Group)' : '৩. শাখা (Section)'}
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

        </div>
      </div>

      {/* SPREADSHEET MATRIX TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 print:hidden">

        {/* Table Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="text-indigo-600" size={18} />
              {gradeNameBn} ({selectedBranch}) — <span className="text-indigo-600">বাল্ক এন্ট্রি ম্যাট্রিক্স</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">মোট বিষয়: {subjects.length}টি | পরীক্ষা: {selectedExam}</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Mode Switcher Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setEntryMode('breakdown')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 ${
                  entryMode === 'breakdown'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers size={14} /> 📝 CQ, MCQ & Practical আলাদা ঘর
              </button>
              <button
                onClick={() => setEntryMode('total')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 ${
                  entryMode === 'total'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal size={14} /> 📊 মোট নম্বর এন্ট্রি
              </button>
            </div>

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

        {/* Matrix Table */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
          <table className="w-full text-left text-xs border-collapse font-sans min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900 text-white font-black uppercase text-[10px]">
                <th className="p-3 text-center w-14 sticky left-0 bg-slate-900 z-20">রোল</th>
                <th className="p-3 w-48 sticky left-14 bg-slate-900 z-20">শিক্ষার্থীর নাম</th>
                {subjects.map((sub) => {
                  const subRel = getSubjectReligion(sub.name);
                  const hasMcq = Boolean(sub.mcq && sub.mcq > 0);
                  const hasPr = !!sub.practical;
                  const colSpan = entryMode === 'breakdown' ? (1 + (hasMcq ? 1 : 0) + (hasPr ? 1 : 0) + 1) : 1;

                  const isAllowed = canEditSubject(sub.name);

                  return (
                    <th key={sub.code} colSpan={colSpan} className={`p-2 text-center border-l border-slate-800 ${isAllowed ? 'bg-slate-900' : 'bg-slate-950/90 opacity-70'}`}>
                      <div className="flex items-center justify-center gap-1">
                        <div className="truncate max-w-[160px] font-black text-white">{sub.name}</div>
                        {!isAllowed && <span className="text-[10px]" title="এই বিষয়টি আপনার বরাদ্দকৃত নয় (লকড)">🔒</span>}
                      </div>
                      <div className="text-[9px] font-mono text-indigo-300 font-normal">
                        {subRel === 'Muslim' ? '☪️ ইসলাম' : subRel === 'Hindu' ? '🕉️ হিন্দু' : `max ${sub.fullMarks || 100}`}
                      </div>

                      {entryMode === 'breakdown' && (
                        <div className="flex items-center justify-around gap-1 mt-1 text-[8px] font-mono uppercase bg-slate-800 py-1 px-1 rounded text-amber-300">
                          <span className="w-10 text-center font-bold">CQ</span>
                          {hasMcq && <span className="w-10 text-center font-bold">MCQ</span>}
                          {hasPr && <span className="w-10 text-center font-bold">Pr</span>}
                          <span className="w-10 text-center font-bold text-emerald-300">মোট</span>
                        </div>
                      )}
                    </th>
                  );
                })}
                <th className="p-3 text-center border-l border-slate-800 w-20 bg-slate-800">মোট নম্বর</th>
                <th className="p-3 text-center w-16 bg-slate-800">GPA</th>
                <th className="p-3 text-center w-16 bg-slate-800">গ্রেড</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={subjects.length * 4 + 5} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <UserX className="w-8 h-8 text-indigo-300" />
                      </div>
                      <p className="text-slate-700 font-bold text-sm">এই শ্রেণি ও শাখায় কোনো শিক্ষার্থী নেই</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    {/* Roll - Sticky */}
                    <td className="p-2.5 text-center font-black font-mono text-slate-900 bg-white sticky left-0 z-10 border-r border-slate-100">
                      {row.roll}
                    </td>

                    {/* Student Name & Religion Badge - Sticky */}
                    <td className="p-2.5 font-extrabold text-slate-900 bg-white sticky left-14 z-10 border-r border-slate-100">
                      <div className="truncate max-w-[180px]">{row.name}</div>
                      <span className={`inline-block mt-0.5 text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
                        row.religion === 'Hindu'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {row.religion === 'Hindu' ? '🕉️ হিন্দু' : '☪️ মুসলিম'}
                      </span>
                    </td>

                    {/* Subject Input Cells */}
                    {subjects.map((sub) => {
                      const bd = row.subjectBreakdown?.[sub.code] || { cq: row.marks[sub.code] || 0, mcq: 0, practical: 0, total: row.marks[sub.code] || 0 };
                      const hasMcq = Boolean(sub.mcq && sub.mcq > 0);
                      const hasPr = !!sub.practical;
                      const subFull = sub.fullMarks || 100;
                      const isAllowed = canEditSubject(sub.name);

                      if (entryMode === 'breakdown') {
                        return (
                          <React.Fragment key={sub.code}>
                            {/* CQ Input */}
                            <td className={`p-1 text-center border-l border-slate-200 ${isAllowed ? 'bg-slate-50/40' : 'bg-slate-100/80 opacity-60'}`}>
                              <input
                                type="number"
                                min={0}
                                max={sub.cq || 70}
                                disabled={!isAllowed}
                                value={bd.cq || 0}
                                onWheel={(e) => e.currentTarget.blur()}
                                onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                onChange={(e) => handleBreakdownCellMarkChange(row.id, sub.code, subFull, 'cq', Number(e.target.value))}
                                className={`w-10 px-1 py-1 border rounded-lg text-center font-bold text-xs font-mono outline-none ${
                                  isAllowed ? 'border-slate-200 bg-white focus:ring-2 focus:ring-indigo-300' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                                title={isAllowed ? `CQ max ${sub.cq || 70}` : 'এই বিষয়টি আপনার বরাদ্দকৃত নয় (লকড)'}
                              />
                            </td>

                            {/* MCQ Input */}
                            {hasMcq && (
                              <td className={`p-1 text-center ${isAllowed ? 'bg-slate-50/40' : 'bg-slate-100/80 opacity-60'}`}>
                                <input
                                  type="number"
                                  min={0}
                                  max={sub.mcq || 30}
                                  disabled={!isAllowed}
                                  value={bd.mcq || 0}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                  onChange={(e) => handleBreakdownCellMarkChange(row.id, sub.code, subFull, 'mcq', Number(e.target.value))}
                                  className={`w-10 px-1 py-1 border rounded-lg text-center font-bold text-xs font-mono outline-none ${
                                    isAllowed ? 'border-slate-200 bg-white focus:ring-2 focus:ring-amber-300' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                  }`}
                                  title={isAllowed ? `MCQ max ${sub.mcq || 30}` : 'এই বিষয়টি আপনার বরাদ্দকৃত নয় (লকড)'}
                                />
                              </td>
                            )}

                            {/* Practical Input */}
                            {hasPr && (
                              <td className={`p-1 text-center ${isAllowed ? 'bg-slate-50/40' : 'bg-slate-100/80 opacity-60'}`}>
                                <input
                                  type="number"
                                  min={0}
                                  max={sub.practical || 25}
                                  disabled={!isAllowed}
                                  value={bd.practical || 0}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                  onChange={(e) => handleBreakdownCellMarkChange(row.id, sub.code, subFull, 'practical', Number(e.target.value))}
                                  className={`w-10 px-1 py-1 border rounded-lg text-center font-bold text-xs font-mono outline-none ${
                                    isAllowed ? 'border-slate-200 bg-white focus:ring-2 focus:ring-emerald-300' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                  }`}
                                  title={isAllowed ? `Practical max ${sub.practical || 25}` : 'এই বিষয়টি আপনার বরাদ্দকৃত নয় (লকড)'}
                                />
                              </td>
                            )}

                            {/* Calculated Total Cell */}
                            <td className="p-1 text-center font-black font-mono text-indigo-700 text-xs bg-indigo-50/60 border-r border-slate-200 w-10">
                              {bd.total}
                            </td>
                          </React.Fragment>
                        );
                      } else {
                        // Total Only Input
                        return (
                          <td key={sub.code} className={`p-2 text-center border-l border-slate-100 ${isAllowed ? '' : 'bg-slate-100/80 opacity-60'}`}>
                            <input
                              type="number"
                              min={0}
                              max={subFull}
                              disabled={!isAllowed}
                              value={row.marks[sub.code] || 0}
                              onWheel={(e) => e.currentTarget.blur()}
                              onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                              onChange={(e) => handleCellMarkChange(row.id, sub.code, subFull, Number(e.target.value))}
                              className={`w-20 px-1.5 py-1.5 border rounded-xl text-center font-bold text-xs font-mono outline-none transition ${
                                !isAllowed
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : (row.marks[sub.code] || 0) === 0
                                  ? 'bg-slate-50 border-slate-200 text-slate-400 focus:ring-2 focus:ring-indigo-300'
                                  : (row.marks[sub.code] || 0) < subFull * 0.33
                                  ? 'bg-rose-50 border-rose-300 text-rose-700 focus:ring-2 focus:ring-indigo-300'
                                  : 'bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-300'
                              }`}
                              title={isAllowed ? undefined : 'এই বিষয়টি আপনার বরাদ্দকৃত নয় (লকড)'}
                            />
                          </td>
                        );
                      }
                    })}

                    {/* Total Obtained */}
                    <td className="p-2.5 text-center font-black font-mono text-indigo-700 text-xs border-l border-slate-100 bg-indigo-50/40">
                      {row.totalObtained}
                    </td>

                    {/* GPA */}
                    <td className={`p-2.5 text-center font-black font-mono text-xs ${
                      row.hasFailed ? 'text-rose-600 bg-rose-50/50' : 'text-emerald-700 bg-emerald-50/50'
                    }`}>
                      {row.gpa.toFixed(2)}
                    </td>

                    {/* Grade */}
                    <td className="p-2.5 text-center font-black">
                      <span className={`px-2 py-0.5 rounded-lg text-xs ${
                        row.hasFailed ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {row.grade}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <p className="text-slate-500 font-medium">
            💡 টিপস: বিষয়ভিত্তিক বিস্তারিত CQ, MCQ ও Practical নম্বরের জন্য <Link href="/dashboard/exam/mark-entry" className="text-indigo-600 font-bold underline">বিষয়ভিত্তিক মার্ক এন্ট্রি পেজ ↗</Link> এ ব্যবহার করতে পারেন।
          </p>

          <button
            onClick={handleSaveAll}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <Save size={16} /> সকল নম্বর সংরক্ষণ করুন (Save All)
          </button>
        </div>

      </div>

    </div>
  );
}
