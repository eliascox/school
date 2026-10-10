'use client';

import React, { useState, useEffect } from 'react';
import { 
  School, 
  Plus, 
  Layers, 
  Users, 
  Building2, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  X, 
  GraduationCap, 
  DoorOpen, 
  Clock, 
  UserCheck,
  ShieldCheck,
  Search,
  BookOpen,
  Sparkles,
  FileCheck,
  Filter,
  Printer,
  ChevronDown,
  ChevronUp,
  Award,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { studentService } from '@/services/studentService';

interface SectionBranch {
  id: string;
  name: string;
  room: string;
  capacity: number;
  studentCount: number;
  sectionTeacher: string;
  shift: 'প্রভাতি (Morning)' | 'দিবা (Day)';
}

interface ClassItem {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  gradeNumber: number;
  shift: 'প্রভাতি (Morning)' | 'দিবা (Day)';
  classTeacher: string;
  totalStudents: number;
  sections: SectionBranch[];
  groups: string[];
}

const DEMO_TEACHER_NAMES = [
  'ইমরান রেজা (সহকারী শিক্ষক)', 'মহসিন রেজা (সহকারী শিক্ষক)', 'তারেক রহমান (জ্যেষ্ঠ শিক্ষক)',
  'ড. রফিকুল ইসলাম (হেড অব সায়েন্স)', 'ড. রফিকুল ইসলাম (হেড অব সায়েন্স)',
  'আব্দুস সালাম (জ্যেষ্ঠ শিক্ষক)', 'মৌসুমী হোসেন (ভাইস প্রিন্সিপাল)', 'মোবারক হোসেন (ভাইস প্রিন্সিপাল)',
  'ইমরান রেজা', 'মহসিন রেজা', 'তারেক রহমান', 'ড. রফিকুল ইসলাম', 'আব্দুস সালাম', 'মৌসুমী হোসেন', 'মোবারক হোসেন',
  'ফাতিমা খাতুন', 'নূরুল ইসলাম', 'নুসরাত সুলতানা', 'তারেক মাহমুদ', 'কামরুল হাসান', 'ফারজানা ববি', 'বিলকিস বেগম', 'তানভির আহমেদ',
  'শ্রেণি শিক্ষক'
];

const DEFAULT_CLASSES: ClassItem[] = [
  {
    id: 'cls-6',
    code: 'CLS-06',
    name: 'Class 6',
    nameBn: '৬ষ্ঠ শ্রেণি',
    gradeNumber: 6,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['সাধারণ (General)'],
    sections: [
      { id: 'sec-6a', name: 'Section A (ক শাখা)', room: 'রুম ১০১', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-6b', name: 'Section B (খ শাখা)', room: 'রুম ১০২', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' }
    ]
  },
  {
    id: 'cls-7',
    code: 'CLS-07',
    name: 'Class 7',
    nameBn: '৭ম শ্রেণি',
    gradeNumber: 7,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['সাধারণ (General)'],
    sections: [
      { id: 'sec-7a', name: 'Section A (ক শাখা)', room: 'রুম ১০৩', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-7b', name: 'Section B (খ শাখা)', room: 'রুম ১০৪', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' }
    ]
  },
  {
    id: 'cls-8',
    code: 'CLS-08',
    name: 'Class 8',
    nameBn: '৮ম শ্রেণি',
    gradeNumber: 8,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['সাধারণ (General)'],
    sections: [
      { id: 'sec-8a', name: 'Section A (ক শাখা)', room: 'রুম ২০১', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-8b', name: 'Section B (খ শাখা)', room: 'রুম ২০২', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-8c', name: 'Section C (গ শাখা)', room: 'রুম ২০৩', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' }
    ]
  },
  {
    id: 'cls-9',
    code: 'CLS-09',
    name: 'Class 9',
    nameBn: '৯ম শ্রেণি',
    gradeNumber: 9,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)'],
    sections: [
      { id: 'sec-9a', name: 'Section A (বিজ্ঞান)', room: 'রুম ৩০১', capacity: 60, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-9b', name: 'Section B (মানবিক)', room: 'রুম ৩০২', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-9c', name: 'Section C (ব্যবসায়)', room: 'রুম ৩০৩', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' }
    ]
  },
  {
    id: 'cls-10',
    code: 'CLS-10',
    name: 'Class 10',
    nameBn: '১০ম শ্রেণি',
    gradeNumber: 10,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)'],
    sections: [
      { id: 'sec-10a', name: 'Section A (বিজ্ঞান)', room: 'রুম ৪০১', capacity: 60, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-10b', name: 'Section B (মানবিক)', room: 'রুম ৪০২', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-10c', name: 'Section C (ব্যবসায়)', room: 'রুম ৪০৩', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' }
    ]
  }
];

export default function ClassesClient() {
  const [classes, setClasses] = useState<ClassItem[]>(DEFAULT_CLASSES);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [activeGradeFilter, setActiveGradeFilter] = useState<'all' | number>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClassId, setExpandedClassId] = useState<string | null>('cls-6');
  
  // Modals state
  const [addBranchModal, setAddBranchModal] = useState<ClassItem | null>(null);
  const [editClassModal, setEditClassModal] = useState<ClassItem | null>(null);
  const [editBranchModal, setEditBranchModal] = useState<{ classId: string; classNameBn: string; section: SectionBranch } | null>(null);
  const [isGlobalAddSectionOpen, setIsGlobalAddSectionOpen] = useState(false);
  const [selectedAddClassId, setSelectedAddClassId] = useState<string>('cls-6');
  
  // New Branch Form
  const [newBranch, setNewBranch] = useState({
    name: '',
    room: 'রুম ১০৫',
    capacity: 50,
    sectionTeacher: '',
    shift: 'দিবা (Day)' as 'প্রভাতি (Morning)' | 'দিবা (Day)'
  });

  // Edit Branch Form
  const [editBranchForm, setEditBranchForm] = useState({
    name: '',
    room: '',
    capacity: 50,
    sectionTeacher: '',
    shift: 'দিবা (Day)' as 'প্রভাতি (Morning)' | 'দিবা (Day)'
  });

  // Edit Class Form
  const [editClassForm, setEditClassForm] = useState({
    classTeacher: '',
    shift: 'দিবা (Day)' as 'প্রভাতি (Morning)' | 'দিবা (Day)'
  });

  // Load from LocalStorage & Subscribe to Student Updates
  useEffect(() => {
    const refreshStudents = () => {
      setAllStudents(studentService.getAllStudents());
    };
    refreshStudents();
    const unsubscribe = studentService.subscribe(refreshStudents);

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', refreshStudents);

      const isDemoTeacher = (name?: string) => !name || DEMO_TEACHER_NAMES.includes(name.trim());

      const saved = localStorage.getItem('sms_academic_classes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const formatted = parsed.map((cls: any) => ({
              ...cls,
              shift: cls.shift || 'দিবা (Day)',
              classTeacher: isDemoTeacher(cls.classTeacher) ? '' : cls.classTeacher,
              sections: (cls.sections || []).map((sec: any, idx: number) => ({
                id: sec.id || `sec-${cls.gradeNumber}-${idx}`,
                name: sec.name || `Section ${String.fromCharCode(65 + idx)}`,
                room: sec.room || `রুম ${cls.gradeNumber}0${idx+1}`,
                capacity: sec.capacity || 50,
                studentCount: sec.studentCount || 0,
                sectionTeacher: isDemoTeacher(sec.sectionTeacher) ? '' : sec.sectionTeacher,
                shift: sec.shift || cls.shift || 'দিবা (Day)'
              }))
            }));
            setClasses(formatted);
          }
        } catch (e) {
          console.error('Failed to parse classes', e);
        }
      }
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', refreshStudents);
      }
    };
  }, []);

  const getDynamicClassStudentCount = (gradeNum: number): number => {
    const gKey = gradeNum === 6 ? '6th' : gradeNum === 7 ? '7th' : gradeNum === 8 ? '8th' : gradeNum === 9 ? '9th' : '10th';
    return studentService.getStudentsByFilter(gKey).length;
  };

  const getDynamicSectionStudentCount = (gradeNum: number, sectionName: string): number => {
    const gKey = gradeNum === 6 ? '6th' : gradeNum === 7 ? '7th' : gradeNum === 8 ? '8th' : gradeNum === 9 ? '9th' : '10th';
    const gradeStudents = studentService.getStudentsByFilter(gKey);
    const nameLower = sectionName.toLowerCase();

    return gradeStudents.filter(st => {
      const stGroup = (st.group || '').toLowerCase();
      const stSec = (st.section || st.branch || '').toLowerCase();

      if (gradeNum === 9 || gradeNum === 10) {
        if (nameLower.includes('বিজ্ঞান') || nameLower.includes('science')) {
          return stGroup.includes('বিজ্ঞান') || stGroup.includes('science') || (!stGroup && (stSec.includes('a') || stSec.includes('বিজ্ঞান')));
        }
        if (nameLower.includes('মানবিক') || nameLower.includes('humanities')) {
          return stGroup.includes('মানবিক') || stGroup.includes('humanities') || (!stGroup && (stSec.includes('b') || stSec.includes('মানবিক')));
        }
        if (nameLower.includes('ব্যবসায়') || nameLower.includes('commerce')) {
          return stGroup.includes('ব্যবসায়') || stGroup.includes('commerce') || (!stGroup && (stSec.includes('c') || stSec.includes('ব্যবসায়')));
        }
      }

      if (nameLower.includes('a') || nameLower.includes('ক')) {
        return stSec === 'a' || stSec.includes('a') || stSec.includes('ক') || !stSec;
      }
      if (nameLower.includes('b') || nameLower.includes('খ')) {
        return stSec === 'b' || stSec.includes('b') || stSec.includes('খ');
      }
      if (nameLower.includes('c') || nameLower.includes('গ')) {
        return stSec === 'c' || stSec.includes('c') || stSec.includes('গ');
      }

      return true;
    }).length;
  };

  const saveClasses = (updated: ClassItem[]) => {
    setClasses(updated);
    localStorage.setItem('sms_academic_classes', JSON.stringify(updated));
  };

  // Handle Add New Branch Section to a Class
  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBranchModal || !newBranch.name.trim()) {
      alert('অনুগ্রহ করে শাখার নাম উল্লেখ করুন!');
      return;
    }

    const createdSection: SectionBranch = {
      id: `sec-${addBranchModal.gradeNumber}-${Date.now()}`,
      name: newBranch.name,
      room: newBranch.room,
      capacity: Number(newBranch.capacity),
      studentCount: 0,
      sectionTeacher: newBranch.sectionTeacher || addBranchModal.classTeacher,
      shift: newBranch.shift
    };

    const updatedClasses = classes.map(c => {
      if (c.id === addBranchModal.id) {
        return {
          ...c,
          sections: [...c.sections, createdSection]
        };
      }
      return c;
    });

    saveClasses(updatedClasses);
    setAddBranchModal(null);
    setNewBranch({ name: '', room: 'রুম ১০৫', capacity: 50, sectionTeacher: '', shift: 'প্রভাতি (Morning)' });
    alert('নতুন শাখা (Section) সফলভাবে যুক্ত করা হয়েছে!');
  };

  // Open Edit Branch Section Modal
  const handleOpenEditBranch = (classId: string, classNameBn: string, section: SectionBranch) => {
    setEditBranchModal({ classId, classNameBn, section });
    setEditBranchForm({
      name: section.name,
      room: section.room || '',
      capacity: section.capacity || 50,
      sectionTeacher: section.sectionTeacher || '',
      shift: section.shift || 'দিবা (Day)'
    });
  };

  // Submit Edit Branch Section Changes
  const handleEditBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranchModal || !editBranchForm.name.trim()) {
      alert('অনুগ্রহ করে শাখার নাম উল্লেখ করুন!');
      return;
    }

    const updatedClasses = classes.map(c => {
      if (c.id === editBranchModal.classId) {
        const nextSections = c.sections.map(s => {
          if (s.id === editBranchModal.section.id) {
            return {
              ...s,
              name: editBranchForm.name.trim(),
              room: editBranchForm.room.trim() || 'রুম নির্ধারিত নয়',
              capacity: Number(editBranchForm.capacity) || 50,
              sectionTeacher: editBranchForm.sectionTeacher.trim(),
              shift: editBranchForm.shift
            };
          }
          return s;
        });
        return { ...c, sections: nextSections };
      }
      return c;
    });

    saveClasses(updatedClasses);
    setEditBranchModal(null);
    alert('শাখা তথ্য সফলভাবে হালনাগাদ করা হয়েছে!');
  };

  // Global Add Section from Top Toolbar
  const handleGlobalAddSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim()) {
      alert('অনুগ্রহ করে শাখার নাম উল্লেখ করুন!');
      return;
    }

    const targetClass = classes.find(c => c.id === selectedAddClassId) || classes[0];
    const createdSection: SectionBranch = {
      id: `sec-${targetClass.gradeNumber}-${Date.now()}`,
      name: newBranch.name.trim(),
      room: newBranch.room.trim() || 'রুম নির্ধারিত নয়',
      capacity: Number(newBranch.capacity) || 50,
      studentCount: 0,
      sectionTeacher: newBranch.sectionTeacher.trim(),
      shift: newBranch.shift
    };

    const updatedClasses = classes.map(c => {
      if (c.id === targetClass.id) {
        return {
          ...c,
          sections: [...c.sections, createdSection]
        };
      }
      return c;
    });

    saveClasses(updatedClasses);
    setIsGlobalAddSectionOpen(false);
    setNewBranch({ name: '', room: 'রুম ১০৫', capacity: 50, sectionTeacher: '', shift: 'দিবা (Day)' });
    setExpandedClassId(targetClass.id);
    alert(`নতুন শাখা "${createdSection.name}" (${targetClass.nameBn}) সফলভাবে তৈরি করা হয়েছে!`);
  };

  // Handle Edit Class Info
  const handleEditClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClassModal) return;

    const updatedClasses = classes.map(c => {
      if (c.id === editClassModal.id) {
        return {
          ...c,
          classTeacher: editClassForm.classTeacher,
          shift: editClassForm.shift
        };
      }
      return c;
    });

    saveClasses(updatedClasses);
    setEditClassModal(null);
    alert('শ্রেণি তথ্য সফলভাবে হালনাগাদ করা হয়েছে!');
  };

  // Delete Branch Section
  const handleDeleteBranch = (classId: string, sectionId: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই শাখাটি মুছে ফেলতে চান?')) {
      const updated = classes.map(c => {
        if (c.id === classId) {
          return {
            ...c,
            sections: c.sections.filter(s => s.id !== sectionId)
          };
        }
        return c;
      });
      saveClasses(updated);
      alert('শাখা সফলভাবে মুছে ফেলা হয়েছে!');
    }
  };

  // Filtered List
  const filteredClasses = classes.filter(c => {
    const matchesFilter = activeGradeFilter === 'all' || c.gradeNumber === activeGradeFilter;
    const matchesSearch = c.nameBn.includes(searchQuery) || c.classTeacher.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalClassesCount = classes.length;
  const totalSectionsCount = classes.reduce((sum, c) => sum + c.sections.length, 0);
  const totalStudentsCount = allStudents.length;

  return (
    <div className="w-full space-y-5 pb-12">
      {/* ─── 4 SUMMARY KPI METRICS (Directly at top) ───────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">মোট শ্রেণি (Classes)</p>
            <h4 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">{totalClassesCount}টি</h4>
            <p className="text-[10px] text-slate-400">৬ষ্ঠ - ১০ম শ্রেণি</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
            <School className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">মোট শাখা (Sections)</p>
            <h4 className="text-xl font-black text-violet-600 dark:text-violet-400 mt-0.5 font-mono">{totalSectionsCount}টি</h4>
            <p className="text-[10px] text-slate-400">ক, খ, গ ও বিভাগ শাখা</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">মোট শিক্ষার্থী</p>
            <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">{totalStudentsCount} জন</h4>
            <p className="text-[10px] text-slate-400">অধ্যয়নরত ছাত্র-ছাত্রী</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">বিষয় কাঠামো</p>
            <h4 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono">৬৯টি</h4>
            <p className="text-[10px] text-slate-400">যৌথ পাস ও গ্রেডিং বিন্যাস</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── FILTER, SEARCH & ACTIONS TOOLBAR ROW ───────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Left: Class Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveGradeFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeGradeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            সব শ্রেণি (All)
          </button>

          {[6, 7, 8, 9, 10].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => setActiveGradeFilter(num)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                activeGradeFilter === num
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {num === 6 ? '৬ষ্ঠ শ্রেণি' : num === 7 ? '৭ম শ্রেণি' : num === 8 ? '৮ম শ্রেণি' : num === 9 ? '৯ম শ্রেণি' : '১০ম শ্রেণি'}
            </button>
          ))}
        </div>

        {/* Right: Search Input + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 sm:w-64 sm:flex-none">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="শ্রেণি, শাখা বা শিক্ষকের নাম খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-slate-900 dark:text-white font-medium"
            />
          </div>

          {/* Quick Create Section Button */}
          <button
            type="button"
            onClick={() => {
              setNewBranch({ name: '', room: 'রুম ১০৫', capacity: 50, sectionTeacher: '', shift: 'দিবা (Day)' });
              setIsGlobalAddSectionOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
            title="যেকোনো শ্রেণির জন্য সরাসরি নতুন শাখা তৈরি করুন"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন শাখা তৈরি</span>
          </button>

          <Link
            href="/dashboard/academic/curriculum"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4" />
            <span>কারিকুলাম ও নম্বর বণ্টন ➔</span>
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট তালিকা</span>
          </button>
        </div>
      </div>

      {/* ─── PROFESSIONAL DATA TABLE VIEW ─────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {/* Table Title Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                একাডেমিক শ্রেণি ও শাখা রেজিস্টার তালিকা ({filteredClasses.length}টি শ্রেণি)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">প্রতিটি শ্রেণির শাখা, শিক্ষক, শিফট ও আসন বিন্যাস</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400">💡 সারিতে ক্লিক করে শাখা বিস্তারিত দেখুন</span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <th className="p-3.5 pl-4 w-12 text-center">ক্রম</th>
                <th className="p-3.5 min-w-[160px]">শ্রেণির নাম ও কোড</th>
                <th className="p-3.5 min-w-[140px]">শিফট ও গ্রুপ</th>
                <th className="p-3.5 min-w-[170px]">শ্রেণি শিক্ষক (Class Teacher)</th>
                <th className="p-3.5 min-w-[220px]">সক্রিয় শাখাসমূহ (আসন)</th>
                <th className="p-3.5 min-w-[130px] text-center">মোট শিক্ষার্থী</th>
                <th className="p-3.5 pr-4 min-w-[160px] text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-xs text-slate-400 font-bold">
                    কোন শ্রেণি বা শাখা পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => {
                  const classStudentCount = getDynamicClassStudentCount(cls.gradeNumber);
                  const isExpanded = expandedClassId === cls.id;
                  const totalCapacity = cls.sections.reduce((sum, s) => sum + s.capacity, 0);
                  const isHighSchool = cls.gradeNumber >= 9;
                  const hasTeacher = cls.classTeacher && cls.classTeacher.trim() !== '' && !DEMO_TEACHER_NAMES.includes(cls.classTeacher.trim());

                  return (
                    <React.Fragment key={cls.id}>
                      {/* Master Class Table Row */}
                      <tr className={`transition-colors hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 ${isExpanded ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''}`}>
                        
                        {/* 1. ক্রম */}
                        <td className="p-3.5 pl-4 text-center">
                          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center mx-auto shadow-2xs">
                            {cls.gradeNumber === 6 ? '৬' : cls.gradeNumber === 7 ? '৭' : cls.gradeNumber === 8 ? '৮' : cls.gradeNumber === 9 ? '৯' : '১০'}
                          </span>
                        </td>

                        {/* 2. শ্রেণি ও কোড */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm">{cls.nameBn}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {cls.code}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Class {cls.gradeNumber}</span>
                        </td>

                        {/* 3. শিফট ও গ্রুপ */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold border border-indigo-200/70 dark:border-indigo-800">
                              {cls.shift}
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[140px]">
                              {isHighSchool ? 'বিজ্ঞান, মানবিক, ব্যবসায়' : 'সাধারণ (General)'}
                            </p>
                          </div>
                        </td>

                        {/* 4. শ্রেণি শিক্ষক */}
                        <td className="p-3.5">
                          {hasTeacher ? (
                            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
                              <Users size={13} className="text-indigo-600 shrink-0" />
                              <span className="truncate max-w-[150px]">{cls.classTeacher}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 dark:text-slate-500 font-normal italic text-[11px]">
                                নির্ধারিত নেই
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditClassModal(cls);
                                  setEditClassForm({
                                    classTeacher: '',
                                    shift: cls.shift
                                  });
                                }}
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                + শিক্ষক যুক্ত করুন
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 5. সক্রিয় শাখাসমূহ */}
                        <td className="p-3.5">
                          <div className="flex flex-wrap items-center gap-1">
                            {cls.sections.map(sec => {
                              const secCount = getDynamicSectionStudentCount(cls.gradeNumber, sec.name);
                              return (
                                <span
                                  key={sec.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700"
                                >
                                  <span>{sec.name}</span>
                                  <span className="text-[9px] font-mono px-1 bg-white dark:bg-slate-900 rounded text-indigo-600 dark:text-indigo-400 font-black">
                                    {secCount}/{sec.capacity}
                                  </span>
                                </span>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => setAddBranchModal(cls)}
                              className="px-1.5 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                              title="নতুন শাখা যোগ করুন"
                            >
                              + শাখা
                            </button>
                          </div>
                        </td>

                        {/* 6. মোট শিক্ষার্থী */}
                        <td className="p-3.5 text-center">
                          <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                            {classStudentCount} জন
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal font-mono">
                            আসন: {totalCapacity}
                          </span>
                        </td>

                        {/* 7. অ্যাকশন */}
                        <td className="p-3.5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href="/dashboard/academic/curriculum"
                              className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1 shadow-2xs"
                              title="কারিকুলাম ও নম্বর কাঠামো"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span className="hidden sm:inline">কারিকুলাম</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                setEditClassModal(cls);
                                setEditClassForm({
                                  classTeacher: hasTeacher ? cls.classTeacher : '',
                                  shift: cls.shift
                                });
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="শ্রেণি ও শিক্ষক তথ্য সম্পাদনা"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                              className={`p-1.5 rounded-lg transition cursor-pointer border ${
                                isExpanded
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                              title={isExpanded ? 'শাখা বিস্তারিত সংকুচিত করুন' : 'শাখা বিস্তারিত দেখুন'}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Sub-Table for Sections */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
                            <div className="p-4 sm:p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                  <span>{cls.nameBn} — নিবন্ধিত সকল শাখার পূর্ণাঙ্গ বিবরণী ({cls.sections.length}টি শাখা)</span>
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => setAddBranchModal(cls)}
                                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" /> নতুন শাখা যোগ করুন
                                </button>
                              </div>

                              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-slate-100/90 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                                      <th className="p-3">শাখার নাম</th>
                                      <th className="p-3">রুম নম্বর</th>
                                      <th className="p-3">শাখা শিক্ষক (Section Teacher)</th>
                                      <th className="p-3 text-center">শিফট</th>
                                      <th className="p-3 text-center">শিক্ষার্থী / আসন ক্ষমতা</th>
                                      <th className="p-3 text-right">অ্যাকশন</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                                    {cls.sections.map((sec) => {
                                      const secStudentCount = getDynamicSectionStudentCount(cls.gradeNumber, sec.name);
                                      const secTeacherValid = sec.sectionTeacher && sec.sectionTeacher.trim() !== '' && !DEMO_TEACHER_NAMES.includes(sec.sectionTeacher.trim());

                                      return (
                                        <tr key={sec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                          <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-black text-xs flex items-center justify-center">
                                              {sec.name.includes('A') || sec.name.includes('ক') ? 'ক' : sec.name.includes('B') || sec.name.includes('খ') ? 'খ' : 'গ'}
                                            </div>
                                            <span>{sec.name}</span>
                                          </td>
                                          <td className="p-3 text-slate-600 dark:text-slate-300 font-mono font-semibold">
                                            {sec.room}
                                          </td>
                                          <td className="p-3">
                                            {secTeacherValid ? (
                                              <span className="font-bold text-slate-900 dark:text-white">{sec.sectionTeacher}</span>
                                            ) : (
                                              <span className="text-slate-400 font-normal italic">নির্ধারিত নেই</span>
                                            )}
                                          </td>
                                          <td className="p-3 text-center">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                              {sec.shift}
                                            </span>
                                          </td>
                                          <td className="p-3 text-center">
                                            <span className="font-bold font-mono text-slate-900 dark:text-white">
                                              {secStudentCount}
                                            </span>
                                            <span className="text-slate-400 font-mono"> / {sec.capacity}</span>
                                          </td>
                                          <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => handleOpenEditBranch(cls.id, cls.nameBn, sec)}
                                                className="px-2.5 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 font-bold text-[11px] shadow-2xs active:scale-95"
                                                title="শাখার তথ্য সম্পাদনা করুন"
                                              >
                                                <Pencil className="w-3 h-3" />
                                                <span>এডিট</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteBranch(cls.id, sec.id)}
                                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all cursor-pointer border border-rose-200 dark:border-rose-900/60"
                                                title="শাখা মুছে ফেলুন"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
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

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ➕ MODAL 1: ADD BRANCH / SECTION                               */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {addBranchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">নতুন শাখা (Section) যোগ করুন</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{addBranchModal.nameBn} ({addBranchModal.code})</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setAddBranchModal(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBranchSubmit} className="space-y-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শাখার নাম (Section Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Section D (ঘ শাখা)"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রুম নম্বর
                  </label>
                  <input
                    type="text"
                    value={newBranch.room}
                    onChange={(e) => setNewBranch({ ...newBranch, room: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    আসন ক্ষমতা (Capacity)
                  </label>
                  <input
                    type="number"
                    value={newBranch.capacity}
                    onChange={(e) => setNewBranch({ ...newBranch, capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শাখা শিক্ষক (Section Teacher)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ড. রফিকুল ইসলাম"
                  value={newBranch.sectionTeacher}
                  onChange={(e) => setNewBranch({ ...newBranch, sectionTeacher: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শিফট
                </label>
                <select
                  value={newBranch.shift}
                  onChange={(e) => setNewBranch({ ...newBranch, shift: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer"
                >
                  <option value="প্রভাতি (Morning)">প্রভাতি (Morning)</option>
                  <option value="দিবা (Day)">দিবা (Day)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddBranchModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md cursor-pointer transition-all"
                >
                  শাখা তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ✏️ MODAL 2: EDIT CLASS & TEACHER INFO                          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {editClassModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">শ্রেণি ও শিক্ষক তথ্য সম্পাদনা</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{editClassModal.nameBn}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditClassModal(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditClassSubmit} className="space-y-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শ্রেণি শিক্ষক (Class Teacher)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মো. করিম হোসেন (ঐচ্ছিক - খালি রাখতে পারেন)"
                  value={editClassForm.classTeacher}
                  onChange={(e) => setEditClassForm({ ...editClassForm, classTeacher: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শিফট
                </label>
                <select
                  value={editClassForm.shift}
                  onChange={(e) => setEditClassForm({ ...editClassForm, shift: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer"
                >
                  <option value="প্রভাতি (Morning)">প্রভাতি (Morning)</option>
                  <option value="দিবা (Day)">দিবা (Day)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditClassModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md cursor-pointer transition-all"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ✏️ MODAL 3: EDIT BRANCH / SECTION                            */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {editBranchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">শাখা তথ্য সম্পাদনা করুন (Edit Section)</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{editBranchModal.classNameBn} — {editBranchModal.section.name}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditBranchModal(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditBranchSubmit} className="space-y-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শাখার নাম (Section Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ক শাখা (Section A)"
                  value={editBranchForm.name}
                  onChange={(e) => setEditBranchForm({ ...editBranchForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রুম নম্বর
                  </label>
                  <input
                    type="text"
                    value={editBranchForm.room}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, room: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    আসন ক্ষমতা (Capacity)
                  </label>
                  <input
                    type="number"
                    value={editBranchForm.capacity}
                    onChange={(e) => setEditBranchForm({ ...editBranchForm, capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শাখা শিক্ষক (Section Teacher)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ড. রফিকুল ইসলাম"
                  value={editBranchForm.sectionTeacher}
                  onChange={(e) => setEditBranchForm({ ...editBranchForm, sectionTeacher: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শিফট
                </label>
                <select
                  value={editBranchForm.shift}
                  onChange={(e) => setEditBranchForm({ ...editBranchForm, shift: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer"
                >
                  <option value="প্রভাতি (Morning)">প্রভাতি (Morning)</option>
                  <option value="দিবা (Day)">দিবা (Day)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditBranchModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md cursor-pointer transition-all"
                >
                  শাখা তথ্য হালনাগাদ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ➕ MODAL 4: GLOBAL ADD SECTION (FROM TOP TOOLBAR)             */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {isGlobalAddSectionOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">নতুন শাখা তৈরি করুন (Create Section)</h3>
                  <p className="text-xs text-slate-500 font-medium">শ্রেণি নির্বাচন করে নতুন শাখা বা সেকশন যোগ করুন</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsGlobalAddSectionOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGlobalAddSectionSubmit} className="space-y-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শ্রেণি নির্বাচন করুন (Select Class) *
                </label>
                <select
                  value={selectedAddClassId}
                  onChange={(e) => setSelectedAddClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শাখার নাম (Section Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ক শাখা (Section A) বা বিজ্ঞান শাখা"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    রুম নম্বর
                  </label>
                  <input
                    type="text"
                    value={newBranch.room}
                    onChange={(e) => setNewBranch({ ...newBranch, room: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    আসন ক্ষমতা (Capacity)
                  </label>
                  <input
                    type="number"
                    value={newBranch.capacity}
                    onChange={(e) => setNewBranch({ ...newBranch, capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শাখা শিক্ষক (Section Teacher)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ড. রফিকুল ইসলাম"
                  value={newBranch.sectionTeacher}
                  onChange={(e) => setNewBranch({ ...newBranch, sectionTeacher: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  শিফট
                </label>
                <select
                  value={newBranch.shift}
                  onChange={(e) => setNewBranch({ ...newBranch, shift: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer"
                >
                  <option value="প্রভাতি (Morning)">প্রভাতি (Morning)</option>
                  <option value="দিবা (Day)">দিবা (Day)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGlobalAddSectionOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md cursor-pointer transition-all"
                >
                  শাখা তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
