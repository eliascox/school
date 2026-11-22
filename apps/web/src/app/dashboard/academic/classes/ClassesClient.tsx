'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  School,
  Plus,
  Layers,
  Users,
  Building2,
  Pencil,
  Trash2,
  X,
  DoorOpen,
  Search,
  BookOpen,
  Printer,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  FileText,
  ArrowRight,
  Link2,
  ChevronsUpDown,
} from 'lucide-react';
import { studentService, Student } from '@/services/studentService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { curriculumService, SubjectCurriculumItem } from '@/services/curriculumService';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';
import { toBanglaDigits } from '@/lib/resultPortalUtils';
import { triggerProfessionalPrint } from '@/lib/printPdfUtils';
import {
  AcademicShift,
  CLASSES_STORAGE_KEY,
  ClassItem,
  ClassSubjectSummary,
  DEFAULT_CLASSES,
  SectionBranch,
  countClassStudents,
  countSectionStudents,
  getSectionBadgeLabel,
  gradeNumberToKey,
  isDemoTeacherName,
  matchesSubjectGroupFilter,
  normalizeAndMigrateClasses,
  suggestNextSectionDefaults,
} from '@/lib/classesSectionUtils';

export type { SectionBranch, ClassSubjectSummary, ClassItem };

const GRADE_TABS: Array<{ value: 'all' | number; label: string; shortLabel: string }> = [
  { value: 'all', label: 'সকল শ্রেণি', shortLabel: 'সকল' },
  { value: 6, label: '৬ষ্ঠ শ্রেণি', shortLabel: '৬ষ্ঠ' },
  { value: 7, label: '৭ম শ্রেণি', shortLabel: '৭ম' },
  { value: 8, label: '৮ম শ্রেণি', shortLabel: '৮ম' },
  { value: 9, label: '৯ম শ্রেণি (বিভাগ)', shortLabel: '৯ম' },
  { value: 10, label: '১০ম শ্রেণি (বিভাগ)', shortLabel: '১০ম' },
];

const SUBJECT_FILTER_TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'সকল বিষয়' },
  { key: 'সাধারণ', label: 'সাধারণ' },
  { key: 'বিজ্ঞান', label: 'বিজ্ঞান' },
  { key: 'মানবিক', label: 'মানবিক' },
  { key: 'ব্যবসায় শিক্ষা', label: 'ব্যবসায় শিক্ষা' },
  { key: '৪র্থ বিষয়', label: '৪র্থ বিষয়' },
];

const INPUT_CLASS =
  'w-full h-10 px-3.5 bg-slate-50/80 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-[#0B5D3B] focus:ring-2 focus:ring-emerald-600/15 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition';

const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer`;

const LABEL_CLASS = 'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5';

function formatGradeBadge(gradeNumber: number): string {
  return toBanglaDigits(gradeNumber);
}

function readInitialClassesState(): { classes: ClassItem[]; shouldPersist: boolean } {
  if (typeof window === 'undefined') {
    return { classes: DEFAULT_CLASSES, shouldPersist: false };
  }
  const liveStudents = studentService.getAllStudents();
  const saved = localStorage.getItem(CLASSES_STORAGE_KEY);
  if (!saved) {
    return { classes: DEFAULT_CLASSES, shouldPersist: true };
  }
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const result = normalizeAndMigrateClasses(parsed, {
        getLiveStudentCount: (gradeNum, secName) =>
          countSectionStudents(liveStudents, gradeNum, secName),
      });
      return { classes: result.classes, shouldPersist: result.migrated };
    }
  } catch (e) {
    console.error('Failed to parse academic classes', e);
  }
  return { classes: DEFAULT_CLASSES, shouldPersist: true };
}

export default function ClassesClient() {
  const [initialClassesState] = useState(readInitialClassesState);
  const [classes, setClasses] = useState<ClassItem[]>(initialClassesState.classes);
  const [allStudents, setAllStudents] = useState<Student[]>(() =>
    typeof window === 'undefined' ? [] : studentService.getAllStudents(),
  );
  const [curriculumItems, setCurriculumItems] = useState<SubjectCurriculumItem[]>(() =>
    typeof window === 'undefined' ? [] : curriculumService.getCurriculumList(),
  );
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(() =>
    typeof window === 'undefined' ? null : settingsService.getSettings(),
  );
  const [activeGradeFilter, setActiveGradeFilter] = useState<'all' | number>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClassIds, setExpandedClassIds] = useState<string[]>([]);

  // Modal States
  const [addClassModal, setAddClassModal] = useState(false);
  const [addBranchModal, setAddBranchModal] = useState<ClassItem | null>(null);
  const [editClassModal, setEditClassModal] = useState<ClassItem | null>(null);
  const [editBranchModal, setEditBranchModal] = useState<{
    classId: string;
    classNameBn: string;
    section: SectionBranch;
  } | null>(null);
  const [isGlobalAddSectionOpen, setIsGlobalAddSectionOpen] = useState(false);
  const [selectedAddClassId, setSelectedAddClassId] = useState<string>('cls-6');
  const [subjectPreviewClass, setSubjectPreviewClass] = useState<ClassItem | null>(null);
  const [subjectFilterGroup, setSubjectFilterGroup] = useState<string>('all');

  // Add New Class Form
  const [newClassForm, setNewClassForm] = useState({
    nameBn: '',
    gradeNumber: 6,
    classTeacher: '',
    shift: 'দিবা (Day)' as AcademicShift,
    firstSectionName: 'Section A (ক শাখা)',
    firstSectionRoom: 'রুম ১০১',
    firstSectionCapacity: 50,
  });

  // New Branch Form
  const [newBranch, setNewBranch] = useState({
    name: '',
    room: 'রুম ১০২',
    capacity: 50,
    sectionTeacher: '',
    shift: 'দিবা (Day)' as AcademicShift,
  });

  // Edit Branch Form
  const [editBranchForm, setEditBranchForm] = useState({
    name: '',
    room: '',
    capacity: 50,
    sectionTeacher: '',
    shift: 'দিবা (Day)' as AcademicShift,
  });

  // Edit Class Form
  const [editClassForm, setEditClassForm] = useState({
    nameBn: '',
    classTeacher: '',
    shift: 'দিবা (Day)' as AcademicShift,
  });

  const refreshCurriculum = useCallback(() => {
    setCurriculumItems(curriculumService.getCurriculumList());
  }, []);

  const loadAndMigrateSavedClasses = useCallback((liveStudents: Student[]) => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(CLASSES_STORAGE_KEY);
    if (!saved) {
      setClasses(DEFAULT_CLASSES);
      try {
        localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(DEFAULT_CLASSES));
      } catch {
        // Ignore storage write errors
      }
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const result = normalizeAndMigrateClasses(parsed, {
          getLiveStudentCount: (gradeNum, secName) =>
            countSectionStudents(liveStudents, gradeNum, secName),
        });
        setClasses(result.classes);
        if (result.migrated) {
          localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(result.classes));
          window.dispatchEvent(
            new CustomEvent('sms_academic_classes_changed', { detail: result.classes }),
          );
        }
      } else {
        setClasses(DEFAULT_CLASSES);
        localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(DEFAULT_CLASSES));
      }
    } catch (e) {
      console.error('Failed to parse academic classes', e);
      setClasses(DEFAULT_CLASSES);
    }
  }, []);

  // Persist safe initial migration result (if needed) and subscribe to live updates
  useEffect(() => {
    if (initialClassesState.shouldPersist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(initialClassesState.classes));
        window.dispatchEvent(
          new CustomEvent('sms_academic_classes_changed', { detail: initialClassesState.classes }),
        );
      } catch {
        // Ignore storage write errors
      }
    }

    const refreshStudents = () => {
      setAllStudents(studentService.getAllStudents());
    };

    const unsubscribeStudents = studentService.subscribe(refreshStudents);
    const unsubscribeSettings = settingsService.subscribe((next) => setSchoolSettings(next));

    const handleStorage = (e: StorageEvent) => {
      const latestStudents = studentService.getAllStudents();
      setAllStudents(latestStudents);
      refreshCurriculum();
      if (!e.key || e.key === CLASSES_STORAGE_KEY) {
        loadAndMigrateSavedClasses(latestStudents);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      window.addEventListener('curriculum_updated', refreshCurriculum);
    }

    return () => {
      unsubscribeStudents();
      unsubscribeSettings();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('curriculum_updated', refreshCurriculum);
      }
    };
  }, [initialClassesState, refreshCurriculum, loadAndMigrateSavedClasses]);

  // Close open modals on Escape key
  useEffect(() => {
    const anyModalOpen =
      addClassModal ||
      Boolean(addBranchModal) ||
      Boolean(editClassModal) ||
      Boolean(editBranchModal) ||
      isGlobalAddSectionOpen ||
      Boolean(subjectPreviewClass);
    if (!anyModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (subjectPreviewClass) setSubjectPreviewClass(null);
      else if (editBranchModal) setEditBranchModal(null);
      else if (editClassModal) setEditClassModal(null);
      else if (addBranchModal) setAddBranchModal(null);
      else if (isGlobalAddSectionOpen) setIsGlobalAddSectionOpen(false);
      else if (addClassModal) setAddClassModal(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    addClassModal,
    addBranchModal,
    editClassModal,
    editBranchModal,
    isGlobalAddSectionOpen,
    subjectPreviewClass,
  ]);

  const getSubjectsForGrade = useCallback(
    (gradeNum: number): SubjectCurriculumItem[] => {
      const gKey = gradeNumberToKey(gradeNum);
      return curriculumItems.filter((item) => item.grade === gKey);
    },
    [curriculumItems],
  );

  const saveClasses = (updated: ClassItem[]) => {
    setClasses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('sms_academic_classes_changed', { detail: updated }));
    }
  };

  const toggleClassExpanded = (classId: string) => {
    setExpandedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId],
    );
  };

  const ensureClassExpanded = (classId: string) => {
    setExpandedClassIds((prev) => (prev.includes(classId) ? prev : [...prev, classId]));
  };

  const openAddBranchForClass = (cls: ClassItem) => {
    const defaults = suggestNextSectionDefaults(cls);
    setNewBranch({
      name: '',
      room: defaults.room,
      capacity: defaults.capacity,
      sectionTeacher: '',
      shift: defaults.shift,
    });
    setAddBranchModal(cls);
  };

  const openGlobalAddSection = () => {
    const initialClass =
      (activeGradeFilter !== 'all'
        ? classes.find((c) => c.gradeNumber === activeGradeFilter)
        : classes[0]) || classes[0];
    if (initialClass) {
      setSelectedAddClassId(initialClass.id);
      const defaults = suggestNextSectionDefaults(initialClass);
      setNewBranch({
        name: '',
        room: defaults.room,
        capacity: defaults.capacity,
        sectionTeacher: '',
        shift: defaults.shift,
      });
    }
    setIsGlobalAddSectionOpen(true);
  };

  const handlePrintRegister = () => {
    triggerProfessionalPrint([
      schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান',
      'একাডেমিক শ্রেণি ও শাখা সারসংক্ষেপ রেজিস্টার',
    ]);
  };

  // Handle Add New Class
  const handleAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassForm.nameBn.trim()) {
      showToast('অনুগ্রহ করে শ্রেণির বাংলা নাম লিখুন!', 'warning');
      return;
    }

    const gNum = Number(newClassForm.gradeNumber) || 6;
    const now = Date.now();
    const newCls: ClassItem = {
      id: `cls-${gNum}-${now}`,
      code: `CLS-${gNum < 10 ? `0${gNum}` : gNum}`,
      name: `Class ${gNum}`,
      nameBn: newClassForm.nameBn.trim(),
      gradeNumber: gNum,
      shift: newClassForm.shift,
      classTeacher: newClassForm.classTeacher.trim(),
      totalStudents: 0,
      groups:
        gNum >= 9
          ? ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)']
          : ['সাধারণ (General)'],
      sections: [
        {
          id: `sec-${gNum}-${now}`,
          name: newClassForm.firstSectionName.trim() || 'Section A (ক শাখা)',
          room: newClassForm.firstSectionRoom.trim() || `রুম ${toBanglaDigits(`${gNum}01`)}`,
          capacity: Number(newClassForm.firstSectionCapacity) || 50,
          studentCount: 0,
          sectionTeacher: newClassForm.classTeacher.trim(),
          shift: newClassForm.shift,
          isCustom: true,
        },
      ],
    };

    const updated = [...classes, newCls];
    saveClasses(updated);
    setAddClassModal(false);
    ensureClassExpanded(newCls.id);
    setNewClassForm({
      nameBn: '',
      gradeNumber: 6,
      classTeacher: '',
      shift: 'দিবা (Day)',
      firstSectionName: 'Section A (ক শাখা)',
      firstSectionRoom: 'রুম ১০১',
      firstSectionCapacity: 50,
    });
    showToast(`নতুন শ্রেণি "${newCls.nameBn}" ও প্রাথমিক শাখা সফলভাবে যুক্ত হয়েছে!`, 'success');
  };

  // Handle Add New Branch Section to a Specific Class
  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBranchModal || !newBranch.name.trim()) {
      showToast('অনুগ্রহ করে শাখার নাম উল্লেখ করুন!', 'warning');
      return;
    }

    const createdSection: SectionBranch = {
      id: `sec-${addBranchModal.gradeNumber}-${Date.now()}`,
      name: newBranch.name.trim(),
      room: newBranch.room.trim() || 'রুম নির্ধারিত নয়',
      capacity: Number(newBranch.capacity) || 50,
      studentCount: 0,
      sectionTeacher: newBranch.sectionTeacher.trim() || addBranchModal.classTeacher,
      shift: newBranch.shift,
      isCustom: true,
    };

    const updatedClasses = classes.map((c) =>
      c.id === addBranchModal.id ? { ...c, sections: [...c.sections, createdSection] } : c,
    );

    saveClasses(updatedClasses);
    ensureClassExpanded(addBranchModal.id);
    setAddBranchModal(null);
    setNewBranch({
      name: '',
      room: 'রুম ১০২',
      capacity: 50,
      sectionTeacher: '',
      shift: 'দিবা (Day)',
    });
    showToast('নতুন শাখা (Section) সফলভাবে যুক্ত করা হয়েছে!', 'success');
  };

  // Open Edit Branch Section Modal
  const handleOpenEditBranch = (classId: string, classNameBn: string, section: SectionBranch) => {
    setEditBranchModal({ classId, classNameBn, section });
    setEditBranchForm({
      name: section.name,
      room: section.room || '',
      capacity: section.capacity || 50,
      sectionTeacher: isDemoTeacherName(section.sectionTeacher) ? '' : section.sectionTeacher,
      shift: section.shift || 'দিবা (Day)',
    });
  };

  // Submit Edit Branch Section Changes
  const handleEditBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranchModal || !editBranchForm.name.trim()) {
      showToast('অনুগ্রহ করে শাখার নাম উল্লেখ করুন!', 'warning');
      return;
    }

    const updatedClasses = classes.map((c) => {
      if (c.id === editBranchModal.classId) {
        const nextSections = c.sections.map((s) =>
          s.id === editBranchModal.section.id
            ? {
                ...s,
                name: editBranchForm.name.trim(),
                room: editBranchForm.room.trim() || 'রুম নির্ধারিত নয়',
                capacity: Number(editBranchForm.capacity) || 50,
                sectionTeacher: editBranchForm.sectionTeacher.trim(),
                shift: editBranchForm.shift,
                isCustom: true,
              }
            : s,
        );
        return { ...c, sections: nextSections };
      }
      return c;
    });

    saveClasses(updatedClasses);
    setEditBranchModal(null);
    showToast('শাখার তথ্য সফলভাবে হালনাগাদ করা হয়েছে!', 'success');
  };

  // Global Add Section from Sticky Top Bar
  const handleGlobalAddSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim()) {
      showToast('অনুগ্রহ করে শাখার নাম উল্লেখ করুন!', 'warning');
      return;
    }

    const targetClass = classes.find((c) => c.id === selectedAddClassId) || classes[0];
    if (!targetClass) return;

    const createdSection: SectionBranch = {
      id: `sec-${targetClass.gradeNumber}-${Date.now()}`,
      name: newBranch.name.trim(),
      room: newBranch.room.trim() || 'রুম নির্ধারিত নয়',
      capacity: Number(newBranch.capacity) || 50,
      studentCount: 0,
      sectionTeacher: newBranch.sectionTeacher.trim(),
      shift: newBranch.shift,
      isCustom: true,
    };

    const updatedClasses = classes.map((c) =>
      c.id === targetClass.id ? { ...c, sections: [...c.sections, createdSection] } : c,
    );

    saveClasses(updatedClasses);
    setIsGlobalAddSectionOpen(false);
    setNewBranch({
      name: '',
      room: 'রুম ১০২',
      capacity: 50,
      sectionTeacher: '',
      shift: 'দিবা (Day)',
    });
    ensureClassExpanded(targetClass.id);
    showToast(
      `নতুন শাখা "${createdSection.name}" (${targetClass.nameBn}) সফলভাবে যুক্ত করা হয়েছে!`,
      'success',
    );
  };

  // Handle Edit Class Info (NameBn + ClassTeacher + Shift)
  const handleEditClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClassModal) return;

    const updatedClasses = classes.map((c) =>
      c.id === editClassModal.id
        ? {
            ...c,
            nameBn: editClassForm.nameBn.trim() || c.nameBn,
            classTeacher: editClassForm.classTeacher.trim(),
            shift: editClassForm.shift,
          }
        : c,
    );

    saveClasses(updatedClasses);
    setEditClassModal(null);
    showToast('শ্রেণি ও শিক্ষক তথ্য সফলভাবে হালনাগাদ করা হয়েছে!', 'success');
  };

  // Delete Branch Section
  const handleDeleteBranch = async (cls: ClassItem, sec: SectionBranch) => {
    const liveCount = countSectionStudents(allStudents, cls.gradeNumber, sec.name);
    const extraNotice =
      liveCount > 0
        ? ` এই শাখায় বর্তমানে ${toBanglaDigits(liveCount)} জন শিক্ষার্থী রয়েছে।`
        : cls.sections.length <= 1
          ? ' এটি এই শ্রেণির একমাত্র সক্রিয় শাখা।'
          : '';

    if (
      await confirmDialog({
        title: 'শাখা মুছে ফেলা',
        message: `আপনি কি নিশ্চিত যে "${cls.nameBn} — ${sec.name}" শাখাটি মুছে ফেলতে চান?${extraNotice}`,
        confirmLabel: 'মুছে ফেলুন',
        danger: true,
      })
    ) {
      const updated = classes.map((c) =>
        c.id === cls.id ? { ...c, sections: c.sections.filter((s) => s.id !== sec.id) } : c,
      );
      saveClasses(updated);
      showToast('শাখা সফলভাবে মুছে ফেলা হয়েছে!', 'success');
    }
  };

  // Filtered List (matches class name, code, teacher, section name, room, or section teacher)
  const filteredClasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return classes.filter((c) => {
      const matchesFilter = activeGradeFilter === 'all' || c.gradeNumber === activeGradeFilter;
      if (!matchesFilter) return false;
      if (!q) return true;

      const matchesClass =
        c.nameBn.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.classTeacher.toLowerCase().includes(q);
      const matchesSection = c.sections.some(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.room.toLowerCase().includes(q) ||
          (s.sectionTeacher || '').toLowerCase().includes(q),
      );
      return matchesClass || matchesSection;
    });
  }, [classes, activeGradeFilter, searchQuery]);

  const totalClassesCount = classes.length;
  const totalSectionsCount = useMemo(
    () => classes.reduce((sum, c) => sum + c.sections.length, 0),
    [classes],
  );
  const totalSeatsCount = useMemo(
    () =>
      classes.reduce(
        (sum, c) => sum + c.sections.reduce((sSum, s) => sSum + (Number(s.capacity) || 0), 0),
        0,
      ),
    [classes],
  );
  const totalStudentsCount = allStudents.length;
  const totalAssignedSubjectsCount = curriculumItems.length;

  const allFilteredExpanded =
    filteredClasses.length > 0 && filteredClasses.every((c) => expandedClassIds.includes(c.id));

  const handleToggleExpandAll = () => {
    if (allFilteredExpanded) {
      setExpandedClassIds([]);
    } else {
      setExpandedClassIds(filteredClasses.map((c) => c.id));
    }
  };

  const previewGradeSubjects = useMemo(
    () => (subjectPreviewClass ? getSubjectsForGrade(subjectPreviewClass.gradeNumber) : []),
    [subjectPreviewClass, getSubjectsForGrade],
  );
  const filteredPreviewSubjects = useMemo(
    () =>
      previewGradeSubjects.filter((s) => matchesSubjectGroupFilter(s, subjectFilterGroup)),
    [previewGradeSubjects, subjectFilterGroup],
  );

  const selectedGlobalClass = useMemo(
    () => classes.find((c) => c.id === selectedAddClassId) || classes[0],
    [classes, selectedAddClassId],
  );
  const selectedGlobalPlaceholder = selectedGlobalClass
    ? suggestNextSectionDefaults(selectedGlobalClass).placeholderName
    : 'Section B (খ শাখা)';
  const addBranchPlaceholder = addBranchModal
    ? suggestNextSectionDefaults(addBranchModal).placeholderName
    : 'Section B (খ শাখা)';

  return (
    <div className="w-full pb-12 print:pb-0 font-sans text-slate-900 dark:text-slate-100">
      {/* Plain <style> tag for A4 Landscape Print (SWC-safe, no styled-jsx) */}
      <style>{'@media print { @page { size: A4 landscape; margin: 10mm; } }'}</style>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📌 FLUSH STICKY INSTITUTIONAL SUB-HEADER (0px GAP UNDER HEADER)   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] dark:shadow-none print:hidden">
        {/* Row 1: Grade Filter Tabs + Search + Institutional CTAs */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Compact Grade Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0">
            {GRADE_TABS.map((tab) => {
              const isActive = activeGradeFilter === tab.value;
              const badgeCount =
                tab.value === 'all'
                  ? totalSectionsCount
                  : classes
                      .filter((c) => c.gradeNumber === tab.value)
                      .reduce((sum, c) => sum + c.sections.length, 0);

              return (
                <button
                  key={String(tab.value)}
                  type="button"
                  onClick={() => setActiveGradeFilter(tab.value)}
                  className={`h-9 px-3 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0 border ${
                    isActive
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B] shadow-2xs'
                      : 'bg-transparent text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold leading-none ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {toBanglaDigits(badgeCount)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Search + Secondary Buttons + Primary Emerald CTA */}
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:ml-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="শ্রেণি, শাখা, রুম বা শিক্ষক খুঁজুন..."
                aria-label="শ্রেণি ও শাখা অনুসন্ধান"
                className="h-9 pl-8 pr-8 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 w-full sm:w-56 lg:w-64 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="অনুসন্ধান মুছুন"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAddClassModal(true)}
              className="h-9 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
              title="নতুন শ্রেণি যুক্ত করুন"
            >
              <School size={13} className="text-slate-500 dark:text-slate-400" />
              <span>+ নতুন শ্রেণি</span>
            </button>

            <button
              type="button"
              onClick={handlePrintRegister}
              className="h-9 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
              title="শ্রেণি ও শাখা রেজিস্টার প্রিন্ট বা PDF সংরক্ষণ করুন"
            >
              <Printer size={13} className="text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">প্রিন্ট</span>
            </button>

            <button
              type="button"
              onClick={openGlobalAddSection}
              className="h-9 px-3.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98] shrink-0 whitespace-nowrap"
              title="যেকোনো শ্রেণিতে নতুন শাখা যোগ করুন"
            >
              <Plus size={14} />
              <span>+ নতুন শাখা যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Row 2: Lightweight Inline Institutional Counters + Academic Shortcuts (Replaces Heavy KPI Cards) */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-950/50">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2">
            {/* Inline Stat Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <School size={12} className="text-[#0B5D3B] dark:text-emerald-400" />
                <span>শ্রেণি</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {toBanglaDigits(totalClassesCount)}টি
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <Layers size={12} className="text-[#0B5D3B] dark:text-emerald-400" />
                <span>সক্রিয় শাখা</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {toBanglaDigits(totalSectionsCount)}টি
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <Building2 size={12} className="text-slate-500 dark:text-slate-400" />
                <span>মোট আসন</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {toBanglaDigits(totalSeatsCount)}
                </span>
              </span>

              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/70 text-[#0B5D3B] dark:text-emerald-300"
                suppressHydrationWarning
              >
                <Users size={12} />
                <span>শিক্ষার্থী</span>
                <span className="font-extrabold">{toBanglaDigits(totalStudentsCount)} জন</span>
              </span>

              <Link
                href="/dashboard/academic/curriculum"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 text-slate-700 dark:text-slate-300 hover:text-[#0B5D3B] dark:hover:text-emerald-300 transition"
                title="NCTB পাঠ্যক্রম ও নম্বর বণ্টন স্টুডিও খুলুন"
              >
                <BookOpen size={12} className="text-[#0B5D3B] dark:text-emerald-400" />
                <span>পাঠ্যক্রম</span>
                <span className="font-extrabold">
                  {toBanglaDigits(totalAssignedSubjectsCount)}টি বিষয়
                </span>
              </Link>
            </div>

            {/* Right Quiet Academic Links + Expand Toggle */}
            <div className="flex flex-wrap items-center gap-1.5">
              {filteredClasses.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleExpandAll}
                  className="h-7 px-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronsUpDown size={12} className="text-slate-400" />
                  <span>{allFilteredExpanded ? 'সব শাখা বন্ধ করুন' : 'সব শাখা দেখুন'}</span>
                </button>
              )}

              <Link
                href="/dashboard/academic/curriculum"
                className="h-7 px-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 text-[11px] font-bold inline-flex items-center gap-1 transition"
              >
                <BookOpen size={12} className="text-[#0B5D3B] dark:text-emerald-400" />
                <span>বিষয় ও নম্বর বণ্টন</span>
              </Link>

              <Link
                href="/dashboard/academic/session"
                className="h-7 px-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 text-[11px] font-bold inline-flex items-center gap-1 transition"
                title="শিক্ষাবর্ষ ও সেশন ব্যবস্থাপনা"
              >
                <Calendar size={12} className="text-slate-500 dark:text-slate-400" />
                <span>সেশন</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 📋 MAIN ACADEMIC WORKSPACE                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-4 print:max-w-none print:px-0 print:pt-0">
        {/* Print-Only Institutional Letterhead */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4 text-black">
          <div>
            <h1 className="text-lg font-black text-slate-900">
              {schoolSettings?.schoolName || 'শিক্ষা প্রতিষ্ঠান'}
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              {schoolSettings?.address || ''}
              {schoolSettings?.eiin ? ` • EIIN: ${schoolSettings.eiin}` : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-black text-slate-900">
              একাডেমিক শ্রেণি ও শাখা সারসংক্ষেপ রেজিস্টার
            </div>
            <p className="text-[11px] text-slate-700 font-semibold">
              প্রিন্ট তারিখ: {new Date().toLocaleDateString('bn-BD')} • মোট শ্রেণি:{' '}
              {toBanglaDigits(totalClassesCount)}টি • শাখা: {toBanglaDigits(totalSectionsCount)}টি •
              শিক্ষার্থী: {toBanglaDigits(totalStudentsCount)} জন
            </p>
          </div>
        </div>

        {/* ─── UNIFIED MASTER CLASS & SECTION REGISTRY TABLE ──────────── */}
        <div className="bg-white dark:bg-slate-900 print:bg-white print:text-black rounded-2xl border border-slate-200/90 dark:border-slate-800 print:border-slate-900 shadow-xs print:shadow-none overflow-hidden print:overflow-visible">
          {/* Clean Table Header Bar */}
          <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/40 print:bg-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-center shrink-0 print:hidden">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white print:text-black truncate">
                  শ্রেণি ও শাখা বিন্যাস ({toBanglaDigits(filteredClasses.length)}টি শ্রেণি)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 print:text-slate-700">
                  ৬ষ্ঠ–৮ম শ্রেণিতে প্রাথমিক একক শাখা (ক) এবং ৯ম–১০ম শ্রেণিতে বিভাগভিত্তিক শাখা — প্রয়োজন অনুযায়ী নতুন শাখা যুক্ত ও সম্পাদনা করুন
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              {(activeGradeFilter !== 'all' || searchQuery.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveGradeFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  ফিল্টার মুছুন
                </button>
              )}
              <span className="hidden lg:inline text-[11px] font-medium text-slate-400 dark:text-slate-500">
                শাখা পরিচালনা করতে শাখা পিল বা &ldquo;শাখা&rdquo; বাটনে ক্লিক করুন
              </span>
            </div>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-950/70 print:bg-slate-100 text-slate-600 dark:text-slate-400 print:text-black font-extrabold border-b border-slate-200/90 dark:border-slate-800 print:border-slate-900 text-[11px]">
                  <th className="py-3 px-3.5 pl-4 w-12 text-center">শ্রেণি</th>
                  <th className="py-3 px-3.5 min-w-[155px]">নাম ও কোড</th>
                  <th className="py-3 px-3.5 min-w-[180px]">শিফট, বিভাগ ও পাঠ্যক্রম</th>
                  <th className="py-3 px-3.5 min-w-[165px]">শ্রেণি শিক্ষক</th>
                  <th className="py-3 px-3.5 min-w-[260px]">সক্রিয় শাখা (শিক্ষার্থী/আসন)</th>
                  <th className="py-3 px-3.5 min-w-[125px] text-center">মোট শিক্ষার্থী</th>
                  <th className="py-3 px-3.5 pr-4 min-w-[185px] text-right print:hidden">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/90 font-medium text-slate-800 dark:text-slate-200 print:text-black">
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-6 text-center space-y-2">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        অনুসন্ধান বা ফিল্টারের সাথে কোনো শ্রেণি বা শাখা মেলেনি
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveGradeFilter('all');
                          setSearchQuery('');
                        }}
                        className="text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        সব শ্রেণি দেখুন
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((cls) => {
                    const classStudentCount = countClassStudents(allStudents, cls.gradeNumber);
                    const isExpanded = expandedClassIds.includes(cls.id);
                    const totalCapacity = cls.sections.reduce(
                      (sum, s) => sum + (Number(s.capacity) || 0),
                      0,
                    );
                    const isHighSchool = cls.gradeNumber >= 9;
                    const hasTeacher = !isDemoTeacherName(cls.classTeacher);
                    const gradeSubjects = getSubjectsForGrade(cls.gradeNumber);
                    const subjectCount = gradeSubjects.length;
                    const occupancyPct =
                      totalCapacity > 0
                        ? Math.min(100, Math.round((classStudentCount / totalCapacity) * 100))
                        : 0;

                    return (
                      <React.Fragment key={cls.id}>
                        {/* Master Class Row */}
                        <tr
                          className={`transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/40 ${
                            isExpanded ? 'bg-emerald-50/35 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          {/* 1. শ্রেণি ব্যাজ */}
                          <td className="py-3.5 px-3.5 pl-4 text-center">
                            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 font-extrabold text-xs flex items-center justify-center mx-auto print:bg-white print:text-black print:border-slate-700">
                              {formatGradeBadge(cls.gradeNumber)}
                            </span>
                          </td>

                          {/* 2. শ্রেণি ও কোড */}
                          <td className="py-3.5 px-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 dark:text-white text-[13px]">
                                {cls.nameBn}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200/70 dark:border-slate-700/70">
                                {cls.code}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              Class {cls.gradeNumber} • {toBanglaDigits(cls.sections.length)}টি শাখা
                            </span>
                          </td>

                          {/* 3. শিফট, বিভাগ ও পাঠ্যক্রম */}
                          <td className="py-3.5 px-3.5">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200/80 dark:border-slate-700">
                                  {cls.shift}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubjectFilterGroup('all');
                                    setSubjectPreviewClass(cls);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-[#0B5D3B] dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200/80 dark:border-emerald-800/70 transition cursor-pointer print:bg-white print:text-black print:border-slate-400"
                                  title="এই শ্রেণির অ্যাসাইনকৃত বিষয় তালিকা দেখুন"
                                >
                                  <BookOpen className="w-2.5 h-2.5" />
                                  <span>{toBanglaDigits(subjectCount)}টি বিষয়</span>
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]">
                                {isHighSchool ? 'বিজ্ঞান • মানবিক • ব্যবসায় শিক্ষা' : 'সাধারণ (General)'}
                              </p>
                            </div>
                          </td>

                          {/* 4. শ্রেণি শিক্ষক */}
                          <td className="py-3.5 px-3.5">
                            {hasTeacher ? (
                              <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
                                <Users
                                  size={13}
                                  className="text-[#0B5D3B] dark:text-emerald-400 shrink-0"
                                />
                                <span className="truncate max-w-[160px]">{cls.classTeacher}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">
                                  নির্ধারিত নেই
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditClassModal(cls);
                                    setEditClassForm({
                                      nameBn: cls.nameBn,
                                      classTeacher: '',
                                      shift: cls.shift,
                                    });
                                  }}
                                  className="text-[11px] font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline cursor-pointer print:hidden"
                                >
                                  + শিক্ষক দিন
                                </button>
                              </div>
                            )}
                          </td>

                          {/* 5. সক্রিয় শাখা সারসংক্ষেপ */}
                          <td className="py-3.5 px-3.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {cls.sections.map((sec) => {
                                const secCount = countSectionStudents(
                                  allStudents,
                                  cls.gradeNumber,
                                  sec.name,
                                );
                                const isFull = sec.capacity > 0 && secCount >= sec.capacity;
                                const isNearFull =
                                  sec.capacity > 0 && !isFull && secCount / sec.capacity >= 0.85;

                                return (
                                  <button
                                    key={sec.id}
                                    type="button"
                                    onClick={() => toggleClassExpanded(cls.id)}
                                    title={`${sec.name} | ${sec.room} | শিক্ষার্থী: ${toBanglaDigits(secCount)}/${toBanglaDigits(sec.capacity)}`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50/70 dark:bg-slate-800/80 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 text-[11px] font-bold border border-slate-200/90 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition cursor-pointer print:bg-white print:border-slate-400"
                                  >
                                    <span>{sec.name}</span>
                                    <span
                                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                                        isFull
                                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                          : isNearFull
                                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                            : 'bg-white dark:bg-slate-900 text-[#0B5D3B] dark:text-emerald-400 border-slate-200/80 dark:border-slate-700'
                                      }`}
                                    >
                                      {toBanglaDigits(secCount)}/{toBanglaDigits(sec.capacity)}
                                    </span>
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => openAddBranchForClass(cls)}
                                className="px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/50 text-[#0B5D3B] dark:text-emerald-300 text-[11px] font-bold border border-dashed border-emerald-300 dark:border-emerald-700/80 transition cursor-pointer print:hidden inline-flex items-center gap-0.5"
                                title="এই শ্রেণিতে নতুন শাখা যোগ করুন"
                              >
                                <Plus size={11} />
                                <span>শাখা</span>
                              </button>
                            </div>
                          </td>

                          {/* 6. মোট শিক্ষার্থী ও আসন */}
                          <td className="py-3.5 px-3.5 text-center">
                            <span
                              className="font-extrabold text-slate-900 dark:text-white print:text-black text-xs block"
                              suppressHydrationWarning
                            >
                              {toBanglaDigits(classStudentCount)} জন
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-700 block font-medium">
                              আসন: {toBanglaDigits(totalCapacity)}
                            </span>
                            {totalCapacity > 0 && classStudentCount > 0 && (
                              <div className="w-16 h-1 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mt-1 overflow-hidden print:hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    occupancyPct >= 100
                                      ? 'bg-rose-500'
                                      : occupancyPct >= 85
                                        ? 'bg-amber-500'
                                        : 'bg-[#0B5D3B]'
                                  }`}
                                  style={{ width: `${occupancyPct}%` }}
                                />
                              </div>
                            )}
                          </td>

                          {/* 7. অ্যাকশন */}
                          <td className="py-3.5 px-3.5 pr-4 text-right print:hidden">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSubjectFilterGroup('all');
                                  setSubjectPreviewClass(cls);
                                }}
                                className="h-8 px-2.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition inline-flex items-center gap-1 cursor-pointer"
                                title="এই শ্রেণির বিষয় তালিকা ও নম্বর বণ্টন দেখুন"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                                <span className="hidden sm:inline">বিষয়সমূহ</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditClassModal(cls);
                                  setEditClassForm({
                                    nameBn: cls.nameBn,
                                    classTeacher: hasTeacher ? cls.classTeacher : '',
                                    shift: cls.shift,
                                  });
                                }}
                                className="h-8 w-8 text-slate-500 hover:text-[#0B5D3B] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center cursor-pointer"
                                title="শ্রেণি ও শিক্ষক তথ্য সম্পাদনা"
                                aria-label="শ্রেণি ও শিক্ষক তথ্য সম্পাদনা"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleClassExpanded(cls.id)}
                                className={`h-8 px-2.5 rounded-lg transition cursor-pointer border text-[11px] font-bold inline-flex items-center gap-1 ${
                                  isExpanded
                                    ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                                    : 'bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-[#0B5D3B] dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                }`}
                                title={
                                  isExpanded
                                    ? 'শাখা বিস্তারিত সংকুচিত করুন'
                                    : 'শাখা, রুম ও আসন বিস্তারিত দেখুন'
                                }
                              >
                                <span className="hidden md:inline">শাখা</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Sub-Table for Section Overview & Management */}
                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={7}
                              className="p-0 bg-slate-50/85 dark:bg-slate-950/75 border-b border-slate-200 dark:border-slate-800"
                            >
                              <div className="p-4 sm:p-5 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400" />
                                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                                      {cls.nameBn} — নিবন্ধিত শাখা ও কক্ষ বিবরণী (
                                      {toBanglaDigits(cls.sections.length)}টি শাখা)
                                    </h3>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 print:hidden">
                                    <Link
                                      href="/dashboard/academic/curriculum"
                                      className="h-8 px-3 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold inline-flex items-center gap-1.5 transition"
                                    >
                                      <BookOpen className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400" />
                                      <span>
                                        বিষয় তালিকা ({toBanglaDigits(subjectCount)}টি)
                                      </span>
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => openAddBranchForClass(cls)}
                                      className="h-8 px-3 rounded-lg bg-[#0B5D3B] hover:bg-emerald-800 text-white text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>+ নতুন শাখা যোগ করুন</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 font-extrabold border-b border-slate-200/90 dark:border-slate-800 text-[11px]">
                                        <th className="py-2.5 px-3.5">শাখার নাম</th>
                                        <th className="py-2.5 px-3.5">রুম নম্বর</th>
                                        <th className="py-2.5 px-3.5">শাখা শিক্ষক</th>
                                        <th className="py-2.5 px-3.5 text-center">শিফট</th>
                                        <th className="py-2.5 px-3.5 text-center">
                                          শিক্ষার্থী / আসন
                                        </th>
                                        <th className="py-2.5 px-3.5 text-right print:hidden">
                                          অ্যাকশন
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                                      {cls.sections.length === 0 ? (
                                        <tr>
                                          <td
                                            colSpan={6}
                                            className="py-6 px-4 text-center text-xs text-slate-500"
                                          >
                                            এই শ্রেণিতে এখনো কোনো শাখা নেই। &ldquo;+ নতুন শাখা যোগ করুন&rdquo; বাটনে ক্লিক করে শাখা যুক্ত করুন।
                                          </td>
                                        </tr>
                                      ) : (
                                        cls.sections.map((sec) => {
                                          const secStudentCount = countSectionStudents(
                                            allStudents,
                                            cls.gradeNumber,
                                            sec.name,
                                          );
                                          const secTeacherValid = !isDemoTeacherName(
                                            sec.sectionTeacher,
                                          );

                                          return (
                                            <tr
                                              key={sec.id}
                                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                              <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-2.5">
                                                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#0B5D3B] dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                                                    {getSectionBadgeLabel(sec.name)}
                                                  </div>
                                                  <span>
                                                    {['ক', 'খ', 'গ', 'A', 'B', 'C'].includes(
                                                      sec.name,
                                                    )
                                                      ? `শাখা ${sec.name}`
                                                      : sec.name}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 font-semibold">
                                                <span className="inline-flex items-center gap-1.5">
                                                  <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                                                  {sec.room}
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-3.5">
                                                {secTeacherValid ? (
                                                  <span className="font-bold text-slate-900 dark:text-white">
                                                    {sec.sectionTeacher}
                                                  </span>
                                                ) : (
                                                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                                                    নির্ধারিত নেই
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-2.5 px-3.5 text-center">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                                  {sec.shift}
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-3.5 text-center">
                                                <span className="font-extrabold text-slate-900 dark:text-white">
                                                  {toBanglaDigits(secStudentCount)}
                                                </span>
                                                <span className="text-slate-400">
                                                  {' '}
                                                  / {toBanglaDigits(sec.capacity)}
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-3.5 text-right print:hidden">
                                                <div className="flex items-center justify-end gap-1.5">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleOpenEditBranch(cls.id, cls.nameBn, sec)
                                                    }
                                                    className="h-7 px-2.5 text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 rounded-lg transition cursor-pointer border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1 font-bold text-[11px]"
                                                    title="শাখার তথ্য সম্পাদনা করুন"
                                                  >
                                                    <Pencil className="w-3 h-3" />
                                                    <span>এডিট</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteBranch(cls, sec)}
                                                    className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 inline-flex items-center justify-center"
                                                    title="শাখা মুছে ফেলুন"
                                                    aria-label="শাখা মুছে ফেলুন"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 0: ADD NEW CLASS                                        */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {addClassModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/70 flex items-center justify-center">
                  <School size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    নতুন শ্রেণি যোগ করুন
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    শ্রেণি, শিফট ও প্রাথমিক শাখা কনফিগারেশন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddClassModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddClassSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>শ্রেণির নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ৬ষ্ঠ শ্রেণি"
                    value={newClassForm.nameBn}
                    onChange={(e) => setNewClassForm({ ...newClassForm, nameBn: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>গ্রেড নম্বর *</label>
                  <select
                    value={newClassForm.gradeNumber}
                    onChange={(e) =>
                      setNewClassForm({ ...newClassForm, gradeNumber: Number(e.target.value) })
                    }
                    className={SELECT_CLASS}
                  >
                    <option value={6}>Class 6 (৬ষ্ঠ)</option>
                    <option value={7}>Class 7 (৭ম)</option>
                    <option value={8}>Class 8 (৮ম)</option>
                    <option value={9}>Class 9 (৯ম)</option>
                    <option value={10}>Class 10 (১০ম)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>শ্রেণি শিক্ষক (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="যেমন: মো. করিম হোসেন"
                    value={newClassForm.classTeacher}
                    onChange={(e) =>
                      setNewClassForm({ ...newClassForm, classTeacher: e.target.value })
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>শিফট</label>
                  <select
                    value={newClassForm.shift}
                    onChange={(e) =>
                      setNewClassForm({
                        ...newClassForm,
                        shift: e.target.value as AcademicShift,
                      })
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="প্রভাতি (Morning)">প্রভাতি (Morning)</option>
                    <option value="দিবা (Day)">দিবা (Day)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="col-span-2">
                  <label className={LABEL_CLASS}>প্রাথমিক শাখার নাম</label>
                  <input
                    type="text"
                    value={newClassForm.firstSectionName}
                    onChange={(e) =>
                      setNewClassForm({ ...newClassForm, firstSectionName: e.target.value })
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>রুম নম্বর</label>
                  <input
                    type="text"
                    value={newClassForm.firstSectionRoom}
                    onChange={(e) =>
                      setNewClassForm({ ...newClassForm, firstSectionRoom: e.target.value })
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>প্রাথমিক আসন ক্ষমতা</label>
                <input
                  type="number"
                  min={1}
                  value={newClassForm.firstSectionCapacity}
                  onChange={(e) =>
                    setNewClassForm({
                      ...newClassForm,
                      firstSectionCapacity: Number(e.target.value),
                    })
                  }
                  className={`${INPUT_CLASS} font-mono`}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddClassModal(false)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
                >
                  শ্রেণি সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: ADD BRANCH / SECTION TO SPECIFIC CLASS               */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {addBranchModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/70 flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    নতুন শাখা যোগ করুন
                  </h3>
                  <p className="text-[11px] text-[#0B5D3B] dark:text-emerald-400 font-bold">
                    {addBranchModal.nameBn} ({addBranchModal.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddBranchModal(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBranchSubmit} className="space-y-3.5">
              <div>
                <label className={LABEL_CLASS}>শাখার নাম (Section Name) *</label>
                <input
                  type="text"
                  required
                  placeholder={`যেমন: ${addBranchPlaceholder}`}
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>রুম নম্বর</label>
                  <input
                    type="text"
                    value={newBranch.room}
                    onChange={(e) => setNewBranch({ ...newBranch, room: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>আসন ক্ষমতা (Capacity)</label>
                  <input
                    type="number"
                    min={1}
                    value={newBranch.capacity}
                    onChange={(e) =>
                      setNewBranch({ ...newBranch, capacity: Number(e.target.value) })
                    }
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>শাখা শিক্ষক (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="শিক্ষকের নাম লিখুন (খালি রাখতে পারেন)"
                  value={newBranch.sectionTeacher}
                  onChange={(e) => setNewBranch({ ...newBranch, sectionTeacher: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>শিফট</label>
                <select
                  value={newBranch.shift}
                  onChange={(e) =>
                    setNewBranch({
                      ...newBranch,
                      shift: e.target.value as AcademicShift,
                    })
                  }
                  className={SELECT_CLASS}
                >
                  <option value="প্রভাতি (Morning)">প্রভাতি (Morning)</option>
                  <option value="দিবা (Day)">দিবা (Day)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddBranchModal(null)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
                >
                  শাখা যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: EDIT CLASS & TEACHER INFO                            */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {editClassModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/70 flex items-center justify-center">
                  <Pencil size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    শ্রেণি ও শিক্ষক তথ্য সম্পাদনা
                  </h3>
                  <p className="text-[11px] text-[#0B5D3B] dark:text-emerald-400 font-bold">
                    {editClassModal.nameBn} ({editClassModal.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditClassModal(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditClassSubmit} className="space-y-3.5">
              <div>
                <label className={LABEL_CLASS}>শ্রেণির নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={editClassForm.nameBn}
                  onChange={(e) => setEditClassForm({ ...editClassForm, nameBn: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>শ্রেণি শিক্ষক (Class Teacher)</label>
                <input
                  type="text"
                  placeholder="যেমন: মো. করিম হোসেন (ঐচ্ছিক - খালি রাখতে পারেন)"
                  value={editClassForm.classTeacher}
                  onChange={(e) =>
                    setEditClassForm({ ...editClassForm, classTeacher: e.target.value })
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>শিফট</label>
                <select
                  value={editClassForm.shift}
                  onChange={(e) =>
                    setEditClassForm({
                      ...editClassForm,
                      shift: e.target.value as AcademicShift,
                    })
                  }
                  className={SELECT_CLASS}
                >
                  <option value="প্রভাতি (Morning)">প্রভাতি (Morning)</option>
                  <option value="দিবা (Day)">দিবা (Day)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditClassModal(null)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: EDIT BRANCH / SECTION                                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {editBranchModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/70 flex items-center justify-center">
                  <Pencil size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    শাখার তথ্য সম্পাদনা
                  </h3>
                  <p className="text-[11px] text-[#0B5D3B] dark:text-emerald-400 font-bold">
                    {editBranchModal.classNameBn} — {editBranchModal.section.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditBranchModal(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditBranchSubmit} className="space-y-3.5">
              <div>
                <label className={LABEL_CLASS}>শাখার নাম (Section Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Section A (ক শাখা)"
                  value={editBranchForm.name}
                  onChange={(e) => setEditBranchForm({ ...editBranchForm, name: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>রুম নম্বর</label>
                  <input
                    type="text"
                    value={editBranchForm.room}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, room: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>আসন ক্ষমতা (Capacity)</label>
                  <input
                    type="number"
                    min={1}
                    value={editBranchForm.capacity}
                    onChange={(e) =>
                      setEditBranchForm({ ...editBranchForm, capacity: Number(e.target.value) })
                    }
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>শাখা শিক্ষক (Section Teacher)</label>
                <input
                  type="text"
                  placeholder="শিক্ষকের নাম লিখুন (খালি রাখতে পারেন)"
                  value={editBranchForm.sectionTeacher}
                  onChange={(e) =>
                    setEditBranchForm({ ...editBranchForm, sectionTeacher: e.target.value })
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>শিফট</label>
                <select
                  value={editBranchForm.shift}
                  onChange={(e) =>
                    setEditBranchForm({
                      ...editBranchForm,
                      shift: e.target.value as AcademicShift,
                    })
                  }
                  className={SELECT_CLASS}
                >
                  <option value="প্রভাতি (Morning)">প্রভাতি (Morning)</option>
                  <option value="দিবা (Day)">দিবা (Day)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditBranchModal(null)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
                >
                  হালনাগাদ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: GLOBAL ADD SECTION (FROM STICKY SUB-HEADER)          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {isGlobalAddSectionOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-[#0B5D3B] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/70 flex items-center justify-center">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    নতুন শাখা যোগ করুন
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    শ্রেণি নির্বাচন করে প্রয়োজনীয় নতুন শাখা যুক্ত করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGlobalAddSectionOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGlobalAddSectionSubmit} className="space-y-3.5">
              <div>
                <label className={LABEL_CLASS}>শ্রেণি নির্বাচন করুন *</label>
                <select
                  value={selectedAddClassId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedAddClassId(nextId);
                    const matched = classes.find((c) => c.id === nextId);
                    if (matched) {
                      const defaults = suggestNextSectionDefaults(matched);
                      setNewBranch((prev) => ({
                        ...prev,
                        room: defaults.room,
                        shift: defaults.shift,
                      }));
                    }
                  }}
                  className={SELECT_CLASS}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS}>শাখার নাম (Section Name) *</label>
                <input
                  type="text"
                  required
                  placeholder={`যেমন: ${selectedGlobalPlaceholder}`}
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>রুম নম্বর</label>
                  <input
                    type="text"
                    value={newBranch.room}
                    onChange={(e) => setNewBranch({ ...newBranch, room: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>আসন ক্ষমতা (Capacity)</label>
                  <input
                    type="number"
                    min={1}
                    value={newBranch.capacity}
                    onChange={(e) =>
                      setNewBranch({ ...newBranch, capacity: Number(e.target.value) })
                    }
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>শাখা শিক্ষক (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="শিক্ষকের নাম লিখুন (খালি রাখতে পারেন)"
                  value={newBranch.sectionTeacher}
                  onChange={(e) => setNewBranch({ ...newBranch, sectionTeacher: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>শিফট</label>
                <select
                  value={newBranch.shift}
                  onChange={(e) =>
                    setNewBranch({
                      ...newBranch,
                      shift: e.target.value as AcademicShift,
                    })
                  }
                  className={SELECT_CLASS}
                >
                  <option value="প্রভাতি (Morning)">প্রভাতি (Morning)</option>
                  <option value="দিবা (Day)">দিবা (Day)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGlobalAddSectionOpen(false)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
                >
                  শাখা যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODAL 5: CURRICULUM SUBJECT PREVIEW & MARKS BREAKDOWN         */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {subjectPreviewClass && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <BookOpen size={17} className="text-[#0B5D3B] dark:text-emerald-400" />
                  <span>{subjectPreviewClass.nameBn} — অ্যাসাইনকৃত বিষয় ও নম্বর বণ্টন</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  মোট অ্যাসাইনকৃত বিষয়: {toBanglaDigits(previewGradeSubjects.length)}টি • NCTB
                  পাঠ্যক্রম স্টুডিও থেকে যেকোনো সময় পরিবর্তনযোগ্য
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubjectPreviewClass(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Pills & Curriculum Studio Link */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-[11px] font-bold flex-wrap">
                {SUBJECT_FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSubjectFilterGroup(tab.key)}
                    className={`px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                      subjectFilterGroup === tab.key
                        ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <Link
                href="/dashboard/academic/curriculum"
                className="h-8 px-3.5 bg-[#0B5D3B] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition"
              >
                <BookOpen size={13} />
                <span>বিষয় ও নম্বর স্টুডিও</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Subjects Table */}
            <div className="overflow-y-auto flex-1 border border-slate-200/90 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-extrabold sticky top-0">
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px]">
                    <th className="py-2.5 px-3">কোড ও বিষয়</th>
                    <th className="py-2.5 px-2.5">বিভাগ / ধরন</th>
                    <th className="py-2.5 px-2.5 text-center">পূর্ণমান</th>
                    <th className="py-2.5 px-2.5 text-center">CQ</th>
                    <th className="py-2.5 px-2.5 text-center">MCQ</th>
                    <th className="py-2.5 px-2.5 text-center">ব্যবহারিক</th>
                    <th className="py-2.5 px-2.5 text-center">পাস নীতি ও যুগ্ম পত্র</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-medium text-slate-800 dark:text-slate-100">
                  {filteredPreviewSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                        এই ফিল্টারে কোনো বিষয় পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    filteredPreviewSubjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="py-2.5 px-3">
                          <strong className="font-extrabold text-slate-900 dark:text-white block">
                            {sub.name}
                          </strong>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            কোড: {sub.code}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                            {sub.category === '৪র্থ বিষয়' ? '৪র্থ বিষয়' : sub.group}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-extrabold">
                          {toBanglaDigits(sub.fullMarks)}
                        </td>
                        <td className="py-2.5 px-2.5 text-center">{toBanglaDigits(sub.cq)}</td>
                        <td className="py-2.5 px-2.5 text-center">{toBanglaDigits(sub.mcq)}</td>
                        <td className="py-2.5 px-2.5 text-center">
                          {toBanglaDigits(sub.practical)}
                        </td>
                        <td className="py-2.5 px-2.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                              {sub.passRuleMode === 'total' ? 'মোট পাস' : 'পৃথক পাস'} (
                              {toBanglaDigits(sub.passMarks)})
                            </span>
                            {sub.isJointPass && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70 text-[9px] font-extrabold">
                                <Link2 className="w-2.5 h-2.5" /> যুগ্ম পাস{' '}
                                {sub.combinedWithCode ? `(${sub.combinedWithCode})` : ''}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href="/dashboard/academic/marksheet"
                className="text-xs font-bold text-[#0B5D3B] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <FileText size={13} /> মার্কশিট ভিউ দেখুন
              </Link>
              <button
                type="button"
                onClick={() => setSubjectPreviewClass(null)}
                className="h-9 px-5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
