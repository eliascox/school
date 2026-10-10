'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  BookOpen, 
  Layers, 
  GraduationCap, 
  Users, 
  Calendar, 
  Clock, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  Eye,
  X,
  Building2,
  FileText,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Save,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { studentService, Student } from '@/services/studentService';

interface SubjectDetail {
  code: string;
  name: string;
  category?: 'আবশ্যিক' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা' | 'সাধারণ';
  teacher: string;
  fullMarks: number;
  cq?: number;          // Creative Question (সৃজনশীল)
  mcq?: number;         // MCQ (বহুনির্বাচনী)
  practical?: number;   // Practical (ব্যবহারিক)
  ca?: number;          // Continuous Assessment / Formative (ধারাবাহিক মূল্যায়ন)
  passRule: string;     // NCTB Pass Criteria
  jointPass?: boolean;  // Joint Pass (যৌথ পাস)
  jointWith?: string;   // Joint paired subject
}

interface ClassItem {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  gradeNumber: number;
  sections: Array<{ id?: string; name: string; room: string; capacity?: number; studentCount: number; sectionTeacher?: string; shift?: string }>;
  groups: string[];
  classTeacher: string;
  totalStudents: number;
  subjectsCount: number;
  status: 'Active' | 'Inactive';
  subjects: SubjectDetail[];
}

// ═══════════════════════════════════════════════════════════════
// NCTB CLASS 6, 7, 8 SHARED FOUNDATION SUBJECTS (WITH JOINT PASS)
// ═══════════════════════════════════════════════════════════════
const class6to8Subjects: SubjectDetail[] = [
  { code: 'BAN-601', name: 'বাংলা ১ম পত্র', category: 'সাধারণ', teacher: 'আবু বকর', fullMarks: 100, cq: 100, ca: 0, passRule: 'বাংলা ২য় পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', jointPass: true, jointWith: 'বাংলা ২য়' },
  { code: 'BAN-602', name: 'বাংলা ২য় পত্র', category: 'সাধারণ', teacher: 'আবু বকর', fullMarks: 50, cq: 50, ca: 0, passRule: 'বাংলা ১ম পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', jointPass: true, jointWith: 'বাংলা ১ম' },
  { code: 'ENG-601', name: 'ইংরেজি ১ম পত্র', category: 'সাধারণ', teacher: 'ফাতিমা খাতুন', fullMarks: 100, cq: 100, ca: 0, passRule: 'ইংরেজি ২য় পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', jointPass: true, jointWith: 'ইংরেজি ২য়' },
  { code: 'ENG-602', name: 'ইংরেজি ২য় পত্র', category: 'সাধারণ', teacher: 'ফাতিমা খাতুন', fullMarks: 100, cq: 70, ca: 30, passRule: 'ইংরেজি ১ম পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', jointPass: true, jointWith: 'ইংরেজি ১ম' },
  { code: 'MAT-603', name: 'গণিত (Mathematics)', category: 'সাধারণ', teacher: 'কামরুল হাসান', fullMarks: 100, cq: 70, ca: 30, passRule: 'লিখিত ও সিএ-তে আলাদা পাস (৩৩%)' },
  { code: 'SCI-604', name: 'বিজ্ঞান (Science)', category: 'সাধারণ', teacher: 'রফিকুল ইসলাম', fullMarks: 100, cq: 100, ca: 0, passRule: 'লিখিত ৩৩% নম্বর (৩৩/১০০)' },
  { code: 'ICT-605', name: 'ডিজিটাল প্রযুক্তি (Digital Tech)', category: 'সাধারণ', teacher: 'নুসরাত সুলতানা', fullMarks: 50, cq: 25, practical: 25, ca: 0, passRule: 'লিখিত ও ব্যবহারিকে পৃথকভাবে পাস' },
  { code: 'HIS-606', name: 'ইতিহাস ও সামাজিক বিজ্ঞান', category: 'সাধারণ', teacher: 'তারেক মাহমুদ', fullMarks: 100, cq: 100, ca: 0, passRule: 'লিখিত ৩৩% নম্বর (৩৩/১০০)' },
  { code: 'REL-610', name: 'ধর্ম ও নৈতিক শিক্ষা', category: 'সাধারণ', teacher: 'মাওলানা ইউনুস', fullMarks: 100, cq: 100, ca: 0, passRule: 'লিখিত ৩৩% নম্বর (৩৩/১০০)' }
];

// ═══════════════════════════════════════════════════════════════
// NCTB CLASS 9 & 10 ALL GROUPS (SCIENCE, HUMANITIES, COMMERCE)
// ═══════════════════════════════════════════════════════════════
const class9to10Subjects: SubjectDetail[] = [
  // ── আবশ্যিক বিষয় (Compulsory Subjects - Joint Pass) ──
  { code: 'BAN-101', name: 'বাংলা ১ম পত্র', category: 'আবশ্যিক', teacher: 'আবু বকর', fullMarks: 100, cq: 70, mcq: 30, passRule: 'বাংলা ২য় পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', jointPass: true, jointWith: 'বাংলা ২য়' },
  { code: 'BAN-102', name: 'বাংলা ২য় পত্র', category: 'আবশ্যিক', teacher: 'আবু বকর', fullMarks: 100, cq: 70, mcq: 30, passRule: 'বাংলা ১ম পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', jointPass: true, jointWith: 'বাংলা ১ম' },
  { code: 'ENG-107', name: 'ইংরেজি ১ম পত্র', category: 'আবশ্যিক', teacher: 'ফাতিমা খাতুন', fullMarks: 100, cq: 100, passRule: 'ইংরেজি ২য় পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', jointPass: true, jointWith: 'ইংরেজি ২য়' },
  { code: 'ENG-108', name: 'ইংরেজি ২য় পত্র', category: 'আবশ্যিক', teacher: 'ফাতিমা খাতুন', fullMarks: 100, cq: 100, passRule: 'ইংরেজি ১ম পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', jointPass: true, jointWith: 'ইংরেজি ১ম' },
  { code: 'MAT-109', name: 'সাধারণ গণিত', category: 'আবশ্যিক', teacher: 'কামরুল হাসান', fullMarks: 100, cq: 70, mcq: 30, passRule: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' },
  { code: 'ICT-154', name: 'তথ্য ও যোগাযোগ প্রযুক্তি', category: 'আবশ্যিক', teacher: 'নুসরাত সুলতানা', fullMarks: 50, mcq: 25, practical: 25, passRule: 'MCQ ৮ (পৃথক) + Practical ৮ (পৃথক)' },
  { code: 'REL-111', name: 'ইসলাম ও নৈতিক শিক্ষা', category: 'আবশ্যিক', teacher: 'মাওলানা ইউনুস', fullMarks: 100, cq: 70, mcq: 30, passRule: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' },
  { code: 'BGS-150', name: 'বাংলাদেশ ও বিশ্বপরিচয়', category: 'আবশ্যিক', teacher: 'তারেক মাহমুদ', fullMarks: 100, cq: 70, mcq: 30, passRule: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' },

  // ── বিজ্ঞান বিভাগ (Science Group) ──
  { code: 'PHY-136', name: 'পদার্থবিজ্ঞান (Physics)', category: 'বিজ্ঞান', teacher: 'রফিকুল ইসলাম', fullMarks: 100, cq: 50, mcq: 25, practical: 25, passRule: 'CQ+MCQ ২৫ (পৃথক) + Practical ৮ (পৃথক)' },
  { code: 'CHE-137', name: 'রসায়ন (Chemistry)', category: 'বিজ্ঞান', teacher: 'ড. আব্দুস সালাম', fullMarks: 100, cq: 50, mcq: 25, practical: 25, passRule: 'CQ+MCQ ২৫ (পৃথক) + Practical ৮ (পৃথক)' },
  { code: 'BIO-138', name: 'জীববিজ্ঞান (Biology)', category: 'বিজ্ঞান', teacher: 'নাসরিন আক্তার', fullMarks: 100, cq: 50, mcq: 25, practical: 25, passRule: 'CQ+MCQ ২৫ (পৃথক) + Practical ৮ (পৃথক)' },
  { code: 'HMT-126', name: 'উচ্চতর গণিত (Higher Math)', category: 'বিজ্ঞান', teacher: 'কামরুল হাসান', fullMarks: 100, cq: 50, mcq: 25, practical: 25, passRule: 'CQ+MCQ ২৫ + Practical ৮' },

  // ── মানবিক বিভাগ (Humanities Group) ──
  { code: 'HIS-153', name: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', category: 'মানবিক', teacher: 'মোজাম্মেল হক', fullMarks: 100, cq: 70, mcq: 30, passRule: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' },
  { code: 'GEO-110', name: 'ভূগোল ও পরিবেশ', category: 'মানবিক', teacher: 'নাহিদা আক্তার', fullMarks: 100, cq: 70, mcq: 30, passRule: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' },
  { code: 'CIV-112', name: 'পৌরনীতি ও নাগরিকতা', category: 'মানবিক', teacher: 'আনোয়ার হোসেন', fullMarks: 100, cq: 70, mcq: 30, passRule: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' },
  { code: 'ECO-141', name: 'অর্থনীতি (Economics)', category: 'মানবিক', teacher: 'শাহিনুর রহমান', fullMarks: 100, cq: 70, mcq: 30, passRule: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' },

  // ── ব্যবসায় শিক্ষা বিভাগ (Commerce Group) ──
  { code: 'ACC-146', name: 'হিসাববিজ্ঞান (Accounting)', category: 'ব্যবসায় শিক্ষা', teacher: 'কামাল উদ্দিন', fullMarks: 100, cq: 70, mcq: 30, passRule: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' },
  { code: 'BUS-143', name: 'ব্যবসায় উদ্যোগ (Entrepreneurship)', category: 'ব্যবসায় শিক্ষা', teacher: 'আরিফুল ইসলাম', fullMarks: 100, cq: 70, mcq: 30, passRule: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' },
  { code: 'FIN-152', name: 'ফিন্যান্স ও ব্যাংকিং (Finance)', category: 'ব্যবসায় শিক্ষা', teacher: 'মোস্তাফিজুর রহমান', fullMarks: 100, cq: 70, mcq: 30, passRule: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)' },
  { code: 'AGR-134', name: 'কৃষি শিক্ষা (Agricultural Science)', category: 'ব্যবসায় শিক্ষা', teacher: 'সালমা বেগম', fullMarks: 100, cq: 50, mcq: 25, practical: 25, passRule: 'CQ+MCQ ২৫ + Practical ৮' }
];

const initialClasses: ClassItem[] = [
  {
    id: 'c6',
    code: 'CLS-06',
    name: 'Class 6',
    nameBn: '৬ষ্ঠ শ্রেণি',
    gradeNumber: 6,
    sections: [
      { name: 'Section A', room: '101', studentCount: 0 },
      { name: 'Section B', room: '102', studentCount: 0 }
    ],
    groups: ['সাধারণ (General)'],
    classTeacher: '',
    totalStudents: 0,
    subjectsCount: class6to8Subjects.length,
    status: 'Active',
    subjects: class6to8Subjects
  },
  {
    id: 'c7',
    code: 'CLS-07',
    name: 'Class 7',
    nameBn: '৭ম শ্রেণি',
    gradeNumber: 7,
    sections: [
      { name: 'Section A', room: '103', studentCount: 0 },
      { name: 'Section B', room: '104', studentCount: 0 }
    ],
    groups: ['সাধারণ (General)'],
    classTeacher: '',
    totalStudents: 0,
    subjectsCount: class6to8Subjects.length,
    status: 'Active',
    subjects: class6to8Subjects.map(s => ({ ...s, code: s.code.replace('-6', '-7') }))
  },
  {
    id: 'c8',
    code: 'CLS-08',
    name: 'Class 8',
    nameBn: '৮ম শ্রেণি',
    gradeNumber: 8,
    sections: [
      { name: 'Section A', room: '201', studentCount: 0 },
      { name: 'Section B', room: '202', studentCount: 0 },
      { name: 'Section C', room: '203', studentCount: 0 }
    ],
    groups: ['সাধারণ (General)'],
    classTeacher: '',
    totalStudents: 0,
    subjectsCount: class6to8Subjects.length,
    status: 'Active',
    subjects: class6to8Subjects.map(s => ({ ...s, code: s.code.replace('-6', '-8') }))
  },
  {
    id: 'c9',
    code: 'CLS-09',
    name: 'Class 9',
    nameBn: '৯ম শ্রেণি',
    gradeNumber: 9,
    sections: [
      { name: 'Section A (বিজ্ঞান)', room: '301', studentCount: 0 },
      { name: 'Section B (মানবিক)', room: '302', studentCount: 0 },
      { name: 'Section C (ব্যবসায়)', room: '303', studentCount: 0 }
    ],
    groups: ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)'],
    classTeacher: '',
    totalStudents: 0,
    subjectsCount: class9to10Subjects.length,
    status: 'Active',
    subjects: class9to10Subjects
  },
  {
    id: 'c10',
    code: 'CLS-10',
    name: 'Class 10',
    nameBn: '১০ম শ্রেণি',
    gradeNumber: 10,
    sections: [
      { name: 'Section A (বিজ্ঞান)', room: '401', studentCount: 0 },
      { name: 'Section B (মানবিক)', room: '402', studentCount: 0 },
      { name: 'Section C (ব্যবসায়)', room: '403', studentCount: 0 }
    ],
    groups: ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)'],
    classTeacher: '',
    totalStudents: 0,
    subjectsCount: class9to10Subjects.length,
    status: 'Active',
    subjects: class9to10Subjects
  }
];

export default function AcademicClient() {
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [activeFilter, setActiveFilter] = useState<number | 'all'>('all');
  
  // Modals & Active State
  const [subjectModal, setSubjectModal] = useState<ClassItem | null>(null);
  const [subjectFilterCategory, setSubjectFilterCategory] = useState<string>('all');
  const [addClassModal, setAddClassModal] = useState<boolean>(false);
  const [editClassModal, setEditClassModal] = useState<ClassItem | null>(null);

  // Subject Edit State
  const [editingSubject, setEditingSubject] = useState<SubjectDetail | null>(null);
  
  // Add New Subject State
  const [addSubjectModal, setAddSubjectModal] = useState<boolean>(false);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCategory, setNewSubCategory] = useState<'আবশ্যিক' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা' | 'সাধারণ'>('সাধারণ');
  const [newSubTeacher, setNewSubTeacher] = useState('');
  const [newSubFullMarks, setNewSubFullMarks] = useState<number>(100);
  const [newSubCq, setNewSubCq] = useState<number>(70);
  const [newSubMcq, setNewSubMcq] = useState<number>(30);
  const [newSubPractical, setNewSubPractical] = useState<number>(0);
  const [newSubCa, setNewSubCa] = useState<number>(0);
  const [newSubPassRule, setNewSubPassRule] = useState('');
  const [newSubJointPass, setNewSubJointPass] = useState<boolean>(false);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newGradeNum, setNewGradeNum] = useState<number>(6);
  const [newTeacher, setNewTeacher] = useState('');

  useEffect(() => {
    const refreshStudents = () => {
      setAllStudents(studentService.getAllStudents());
    };
    refreshStudents();

    const unsubscribe = studentService.subscribe(refreshStudents);
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', refreshStudents);

      const DEMO_TEACHER_NAMES = [
        'ইমরান রেজা (সহকারী শিক্ষক)', 'মহসিন রেজা (সহকারী শিক্ষক)', 'তারেক রহমান (জ্যেষ্ঠ শিক্ষক)',
        'ড. রফিকুল ইসলাম (হেড অব সায়েন্স)', 'ড. রফিকুল ইসলাম (হেড অব সায়েন্স)',
        'আব্দুস সালাম (জ্যেষ্ঠ শিক্ষক)', 'মৌসুমী হোসেন (ভাইস প্রিন্সিপাল)', 'মোবারক হোসেন (ভাইস প্রিন্সিপাল)',
        'ইমরান রেজা', 'মহসিন রেজা', 'তারেক রহমান', 'ড. রফিকুল ইসলাম', 'আব্দুস সালাম', 'মৌসুমী হোসেন', 'মোবারক হোসেন',
        'ফাতিমা খাতুন', 'নূরুল ইসলাম', 'নুসরাত সুলতানা', 'তারেক মাহমুদ', 'কামরুল হাসান', 'ফারজানা ববি', 'বিলকিস বেগম', 'তানভির আহমেদ',
        'শ্রেণি শিক্ষক'
      ];
      const isDemoTeacher = (name?: string) => !name || DEMO_TEACHER_NAMES.includes(name.trim());

      const stored = localStorage.getItem('sms_academic_classes');
      if (stored) {
        try {
          const parsed: ClassItem[] = JSON.parse(stored);
          if (parsed && parsed.length > 0) {
            // Auto-migrate Class 6, 7, 8 to ensure Bangla 2nd and English 2nd exist & sanitize teachers
            const updated = parsed.map(cls => {
              let subjects = cls.subjects;
              if ([6, 7, 8].includes(cls.gradeNumber)) {
                const hasBan2 = (cls.subjects || []).some(s => s.name.includes('বাংলা ২য়'));
                const hasEng2 = (cls.subjects || []).some(s => s.name.includes('ইংরেজি ২য়'));
                if (!hasBan2 || !hasEng2) {
                  const initialForGrade = initialClasses.find(ic => ic.gradeNumber === cls.gradeNumber);
                  if (initialForGrade) {
                    subjects = initialForGrade.subjects;
                  }
                }
              }
              return { 
                ...cls, 
                classTeacher: isDemoTeacher(cls.classTeacher) ? '' : cls.classTeacher,
                subjects: subjects || [], 
                subjectsCount: (subjects || []).length 
              };
            });
            setClasses(updated);
            localStorage.setItem('sms_academic_classes', JSON.stringify(updated));
            return;
          }
        } catch (e) {
          console.error('Failed to parse stored academic classes', e);
        }
      }
      setClasses(initialClasses);
      localStorage.setItem('sms_academic_classes', JSON.stringify(initialClasses));
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', refreshStudents);
      }
    };
  }, []);

  const saveClassesToStorage = (updatedClasses: ClassItem[]) => {
    setClasses(updatedClasses);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_academic_classes', JSON.stringify(updatedClasses));
    }
  };

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

  const filteredClasses = activeFilter === 'all' 
    ? classes 
    : classes.filter(c => c.gradeNumber === activeFilter);

  // Summary Metrics
  const totalClasses = classes.length;
  const totalSections = classes.reduce((acc, c) => acc + c.sections.length, 0);
  const totalStudents = allStudents.length;
  const totalSubjectsCount = classes.reduce((acc, c) => acc + c.subjects.length, 0);

  // Add New Subject Logic
  const handleSaveNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectModal || !newSubName || !newSubCode) {
      alert('বিষয়ের নাম ও কোড সঠিকভাবে প্রদান করুন');
      return;
    }

    const newSub: SubjectDetail = {
      code: newSubCode.toUpperCase(),
      name: newSubName,
      category: newSubCategory,
      teacher: newSubTeacher || 'নির্ধারিত শিক্ষক',
      fullMarks: newSubFullMarks,
      cq: newSubCq,
      mcq: newSubMcq,
      practical: newSubPractical,
      ca: newSubCa,
      passRule: newSubPassRule || 'NCTB নিয়ম অনুযায়ী ৩৩% পাস',
      jointPass: newSubJointPass
    };

    const updatedModalClass = {
      ...subjectModal,
      subjects: [...subjectModal.subjects, newSub],
      subjectsCount: subjectModal.subjects.length + 1
    };

    const updatedAllClasses = classes.map(c => c.id === subjectModal.id ? updatedModalClass : c);

    saveClassesToStorage(updatedAllClasses);
    setSubjectModal(updatedModalClass);
    setAddSubjectModal(false);
    
    // Reset inputs
    setNewSubCode('');
    setNewSubName('');
    setNewSubTeacher('');
    setNewSubCq(70);
    setNewSubMcq(30);
    setNewSubPractical(0);
    setNewSubCa(0);
    setNewSubPassRule('');
    setNewSubJointPass(false);
    alert('নতুন বিষয় সফলভাবে সংযুক্ত হয়েছে!');
  };

  // Delete Subject Logic
  const handleDeleteSubject = (subCode: string) => {
    if (!subjectModal) return;
    if (confirm('আপনি কি নিশ্চিত যে এই বিষয়টি তালিকা থেকে মুছে ফেলতে চান?')) {
      const updatedSubjects = subjectModal.subjects.filter(s => s.code !== subCode);
      const updatedModalClass = {
        ...subjectModal,
        subjects: updatedSubjects,
        subjectsCount: updatedSubjects.length
      };

      const updatedAllClasses = classes.map(c => c.id === subjectModal.id ? updatedModalClass : c);
      saveClassesToStorage(updatedAllClasses);
      setSubjectModal(updatedModalClass);
    }
  };

  // Save Subject Edit Logic
  const handleSaveSubjectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectModal || !editingSubject) return;

    const updatedSubjects = subjectModal.subjects.map(s => s.code === editingSubject.code ? editingSubject : s);
    const updatedModalClass = {
      ...subjectModal,
      subjects: updatedSubjects
    };

    const updatedAllClasses = classes.map(c => c.id === subjectModal.id ? updatedModalClass : c);
    saveClassesToStorage(updatedAllClasses);
    setSubjectModal(updatedModalClass);
    setEditingSubject(null);
    alert('বিষয় সেটিংস সফলভাবে আপডেট হয়েছে!');
  };

  // Add Class Logic
  const handleAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;

    const newClass: ClassItem = {
      id: `c_${Date.now()}`,
      code: `CLS-${newGradeNum < 10 ? '0' + newGradeNum : newGradeNum}`,
      name: `Class ${newGradeNum}`,
      nameBn: newClassName,
      gradeNumber: newGradeNum,
      sections: [
        { name: 'Section A', room: `${newGradeNum}01`, studentCount: 0 }
      ],
      groups: newGradeNum >= 9 ? ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)'] : ['সাধারণ (General)'],
      classTeacher: newTeacher || '',
      totalStudents: 0,
      subjectsCount: 0,
      status: 'Active',
      subjects: []
    };

    const updated = [...classes, newClass];
    saveClassesToStorage(updated);
    setAddClassModal(false);
    setNewClassName('');
    setNewTeacher('');
    alert('নতুন শ্রেণি সফলভাবে যুক্ত করা হয়েছে!');
  };

  // Edit Class Logic
  const handleEditClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClassModal) return;

    const updated = classes.map(c => c.id === editClassModal.id ? editClassModal : c);
    saveClassesToStorage(updated);
    setEditClassModal(null);
    alert('শ্রেণি তথ্য সফলভাবে হালনাগাদ করা হয়েছে!');
  };

  // ── RESET TO NCTB DEFAULTS WITH JOINT PASS ──
  const handleResetNctbDefaults = () => {
    if (confirm('আপনি কি নিশ্চিত যে সকল শ্রেণির বিষয়গুলোকে বাংলা ও ইংরেজি যৌথ পাস সহ NCTB অফিশিয়াল ডিফল্ট মডেলে রিসেট করতে চান?')) {
      saveClassesToStorage(initialClasses);
      alert('সকল শ্রেণির যৌথ পাস (বাংলা ১ম+২য়, ইংরেজি ১ম+২য়) ও বিষয়সমূহ অফিশিয়াল NCTB মডেলে রিসেট করা হয়েছে!');
    }
  };

  return (
    <div className="w-full space-y-5 pb-12 font-sans text-slate-900">

      {/* ═══════════════════════════════════════════ */}
      {/* SUMMARY STAT RIBBON                         */}
      {/* ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900">{totalClasses}টি</p>
            <p className="text-[11px] font-bold text-slate-500">মোট শ্রেণি (Class 6 - 10)</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900">{totalSections}টি</p>
            <p className="text-[11px] font-bold text-slate-500">শাখা/সেকশন (A/B/C)</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900" suppressHydrationWarning>{totalStudents} জন</p>
            <p className="text-[11px] font-bold text-slate-500">মোট অধ্যয়নরত শিক্ষার্থী</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900">{totalSubjectsCount}টি</p>
            <p className="text-[11px] font-bold text-slate-500">মোট বিষয় বিন্যাস</p>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* TOOLBAR: CLASS FILTER TABS & QUICK ACTIONS  */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Class Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            সব শ্রেণি (All Classes)
          </button>

          {[6, 7, 8, 9, 10].map(gradeNum => (
            <button
              key={gradeNum}
              onClick={() => setActiveFilter(gradeNum)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeFilter === gradeNum
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {gradeNum === 6 ? '৬ষ্ঠ শ্রেণি' :
               gradeNum === 7 ? '৭ম শ্রেণি' :
               gradeNum === 8 ? '৮ম শ্রেণি' :
               gradeNum === 9 ? '৯ম শ্রেণি (বিভাগ)' : '১০ম শ্রেণি (বিভাগ)'}
            </button>
          ))}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Link
            href="/dashboard/academic/session"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-200/80"
          >
            <Calendar size={13} className="text-slate-600" />
            <span>সেশন ব্যবস্থাপনা</span>
          </Link>

          <button
            onClick={handleResetNctbDefaults}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition border border-amber-200 cursor-pointer"
            title="NCTB যৌথ পাস মডেল রিসেট"
          >
            <Sparkles size={13} className="text-amber-600" />
            <span>যৌথ পাস রিসেট</span>
          </button>

          <Link
            href="/dashboard/academic/marksheet"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-200/80"
          >
            <FileText size={13} className="text-slate-600" />
            <span>মার্কশিট</span>
          </Link>

          <button
            onClick={() => setAddClassModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            <span>+ নতুন শ্রেণি</span>
          </button>
        </div>

      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PROFESSIONAL DATA TABLE VIEW                */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                একাডেমিক শ্রেণি ও পাঠ্যতালিকা রেজিস্টার ({filteredClasses.length}টি শ্রেণি)
              </h3>
              <p className="text-[11px] text-slate-500">NCTB যৌথ পাস ও কারিকুলাম কাঠামোভুক্ত সকল শ্রেণি</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400">💡 কারিকুলাম ও নম্বর বিন্যাস দেখতে কারিকুলাম বাটনে ক্লিক করুন</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200 text-[11px]">
                <th className="p-3.5 pl-4 w-12 text-center">ক্রম</th>
                <th className="p-3.5 min-w-[160px]">শ্রেণির নাম ও কোড</th>
                <th className="p-3.5 min-w-[150px]">বিভাগ / গ্রুপ ও বিষয়</th>
                <th className="p-3.5 min-w-[160px]">শ্রেণি শিক্ষক</th>
                <th className="p-3.5 min-w-[200px]">সক্রিয় শাখাসমূহ</th>
                <th className="p-3.5 min-w-[120px] text-center">মোট শিক্ষার্থী</th>
                <th className="p-3.5 pr-4 min-w-[160px] text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-xs text-slate-400 font-bold">
                    কোন শ্রেণি পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => {
                  const classStudentCount = getDynamicClassStudentCount(cls.gradeNumber);
                  const hasTeacher = cls.classTeacher && cls.classTeacher.trim() !== '';

                  return (
                    <tr key={cls.id} className="hover:bg-indigo-50/30 transition-colors">
                      
                      {/* 1. ক্রম */}
                      <td className="p-3.5 pl-4 text-center">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center mx-auto shadow-2xs">
                          {cls.gradeNumber === 6 ? '৬' : cls.gradeNumber === 7 ? '৭' : cls.gradeNumber === 8 ? '৮' : cls.gradeNumber === 9 ? '৯' : '১০'}
                        </span>
                      </td>

                      {/* 2. শ্রেণির নাম ও কোড */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 text-sm">{cls.nameBn}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {cls.code}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">Class {cls.gradeNumber}</span>
                      </td>

                      {/* 3. গ্রুপ ও বিষয় সংখ্যা */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-extrabold border border-indigo-200/70">
                            {cls.subjects.length}টি বিষয়
                          </span>
                          <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[150px]">
                            {cls.groups.join(', ')}
                          </p>
                        </div>
                      </td>

                      {/* 4. শ্রেণি শিক্ষক */}
                      <td className="p-3.5">
                        {hasTeacher ? (
                          <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                            <Users size={13} className="text-indigo-600 shrink-0" />
                            <span className="truncate max-w-[140px]">{cls.classTeacher}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-normal italic text-[11px]">
                              নির্ধারিত নেই
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditClassModal(cls)}
                              className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              + শিক্ষক দিন
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 5. শাখাসমূহ */}
                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1">
                          {cls.sections.map((sec, idx) => {
                            const secCount = getDynamicSectionStudentCount(cls.gradeNumber, sec.name);
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200"
                              >
                                <span>{sec.name}</span>
                                <span className="text-[9px] font-mono px-1 bg-white rounded text-indigo-600 font-black">
                                  {secCount} জন
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* 6. মোট শিক্ষার্থী */}
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {classStudentCount} জন
                        </span>
                      </td>

                      {/* 7. অ্যাকশন */}
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href="/dashboard/academic/curriculum"
                            className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition flex items-center gap-1 shadow-2xs"
                            title="কারিকুলাম ও নম্বর বিন্যাস"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span className="hidden sm:inline">কারিকুলাম</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setSubjectModal(cls)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                            title="বিষয় তালিকা দেখুন"
                          >
                            <Eye className="w-3 h-3" />
                            <span className="hidden sm:inline">বিষয়সমূহ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditClassModal(cls)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition border border-slate-200 cursor-pointer"
                            title="শ্রেণি সম্পাদনা"
                          >
                            <Pencil className="w-3.5 h-3.5" />
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

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL 1: ADD NEW CLASS                      */}
      {/* ═══════════════════════════════════════════ */}
      {addClassModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Plus size={16} className="text-indigo-600" />
                নতুন শ্রেণি যোগ করুন
              </h3>
              <button onClick={() => setAddClassModal(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddClassSubmit} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-slate-600 mb-1">শ্রেণির নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ৬ষ্ঠ শ্রেণি"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">শ্রেণি নম্বর (Grade) *</label>
                <select
                  value={newGradeNum}
                  onChange={(e) => setNewGradeNum(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer"
                >
                  <option value={6}>Class 6 (৬ষ্ঠ)</option>
                  <option value={7}>Class 7 (৭ম)</option>
                  <option value={8}>Class 8 (৮ম)</option>
                  <option value={9}>Class 9 (৯ম)</option>
                  <option value={10}>Class 10 (১০ম)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">শ্রেণি শিক্ষক (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: মো. করিম হোসেন"
                  value={newTeacher}
                  onChange={(e) => setNewTeacher(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddClassModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL 2: EDIT CLASS & TEACHER               */}
      {/* ═══════════════════════════════════════════ */}
      {editClassModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Pencil size={16} className="text-indigo-600" />
                শ্রেণি ও শিক্ষক তথ্য সম্পাদন ({editClassModal.nameBn})
              </h3>
              <button onClick={() => setEditClassModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditClassSubmit} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-slate-600 mb-1">শ্রেণির নাম (বাংলা)</label>
                <input
                  type="text"
                  required
                  value={editClassModal.nameBn}
                  onChange={(e) => setEditClassModal({ ...editClassModal, nameBn: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">শ্রেণি শিক্ষক (Class Teacher)</label>
                <input
                  type="text"
                  placeholder="যেমন: মো. করিম হোসেন (ঐচ্ছিক)"
                  value={editClassModal.classTeacher}
                  onChange={(e) => setEditClassModal({ ...editClassModal, classTeacher: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditClassModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  হালনাগাদ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL 3: SUBJECT LIST & DETAILS             */}
      {/* ═══════════════════════════════════════════ */}
      {subjectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-600" />
                  {subjectModal.nameBn} - বিষয় তালিকা ও নম্বর বণ্টন
                </h3>
                <p className="text-[11px] text-slate-500 font-bold">মোট বিষয়: {subjectModal.subjects.length}টি</p>
              </div>
              <button onClick={() => setSubjectModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Modal action toolbar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setSubjectFilterCategory('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    subjectFilterCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  সকল বিষয়
                </button>
                {['আবশ্যিক', 'বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা', 'সাধারণ'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSubjectFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      subjectFilterCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setAddSubjectModal(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus size={13} />
                <span>+ নতুন বিষয় যোগ</span>
              </button>
            </div>

            {/* Subjects Table */}
            <div className="overflow-y-auto flex-1 border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-extrabold sticky top-0">
                  <tr className="border-b border-slate-200 text-[10px]">
                    <th className="p-2.5 pl-3">কোড ও বিষয়</th>
                    <th className="p-2.5">ক্যাটাগরি</th>
                    <th className="p-2.5 text-center">পূর্ণমান</th>
                    <th className="p-2.5 text-center">CQ</th>
                    <th className="p-2.5 text-center">MCQ</th>
                    <th className="p-2.5 text-center">ব্যবহারিক</th>
                    <th className="p-2.5 text-center">যৌথ পাস</th>
                    <th className="p-2.5 pr-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-800">
                  {subjectModal.subjects
                    .filter(s => subjectFilterCategory === 'all' || s.category === subjectFilterCategory)
                    .map((sub) => (
                      <tr key={sub.code} className="hover:bg-slate-50">
                        <td className="p-2.5 pl-3">
                          <strong className="font-extrabold text-slate-900 block">{sub.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">{sub.code}</span>
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {sub.category || 'সাধারণ'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold font-mono">{sub.fullMarks}</td>
                        <td className="p-2.5 text-center font-mono">{sub.cq ?? '-'}</td>
                        <td className="p-2.5 text-center font-mono">{sub.mcq ?? '-'}</td>
                        <td className="p-2.5 text-center font-mono">{sub.practical ?? '-'}</td>
                        <td className="p-2.5 text-center">
                          {sub.jointPass ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                              ✓ যৌথ পাস
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="p-2.5 pr-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingSubject(sub)}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                              title="সম্পাদনা"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubject(sub.code)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="মুছুন"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSubjectModal(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL 4: ADD NEW SUBJECT                    */}
      {/* ═══════════════════════════════════════════ */}
      {addSubjectModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Plus size={16} className="text-indigo-600" />
                নতুন বিষয় যুক্ত করুন
              </h3>
              <button onClick={() => setAddSubjectModal(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewSubject} className="space-y-3 text-xs font-bold">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">বিষয় কোড *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: BAN-01"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">ক্যাটাগরি</label>
                  <select
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="আবশ্যিক">আবশ্যিক</option>
                    <option value="বিজ্ঞান">বিজ্ঞান</option>
                    <option value="মানবিক">মানবিক</option>
                    <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা</option>
                    <option value="সাধারণ">সাধারণ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">বিষয়ের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বাংলা ১ম পত্র"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">পূর্ণমান</label>
                  <input
                    type="number"
                    value={newSubFullMarks}
                    onChange={(e) => setNewSubFullMarks(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">CQ</label>
                  <input
                    type="number"
                    value={newSubCq}
                    onChange={(e) => setNewSubCq(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">MCQ</label>
                  <input
                    type="number"
                    value={newSubMcq}
                    onChange={(e) => setNewSubMcq(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">ব্যবহারিক</label>
                  <input
                    type="number"
                    value={newSubPractical}
                    onChange={(e) => setNewSubPractical(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="jointPassCheck"
                  checked={newSubJointPass}
                  onChange={(e) => setNewSubJointPass(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
                <label htmlFor="jointPassCheck" className="text-slate-700 cursor-pointer">
                  যৌথ পাস প্রযোজ্য (যেমন: বাংলা ১ম+২য় / ইংরেজি ১ম+২য়)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddSubjectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL 5: EDIT SUBJECT                       */}
      {/* ═══════════════════════════════════════════ */}
      {editingSubject && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Pencil size={16} className="text-indigo-600" />
                বিষয় সম্পাদনা ({editingSubject.name})
              </h3>
              <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSubjectEdit} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-slate-600 mb-1">বিষয়ের নাম</label>
                <input
                  type="text"
                  required
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1">পূর্ণমান</label>
                  <input
                    type="number"
                    value={editingSubject.fullMarks}
                    onChange={(e) => setEditingSubject({ ...editingSubject, fullMarks: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">CQ</label>
                  <input
                    type="number"
                    value={editingSubject.cq ?? 0}
                    onChange={(e) => setEditingSubject({ ...editingSubject, cq: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">MCQ</label>
                  <input
                    type="number"
                    value={editingSubject.mcq ?? 0}
                    onChange={(e) => setEditingSubject({ ...editingSubject, mcq: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editJointPassCheck"
                  checked={editingSubject.jointPass || false}
                  onChange={(e) => setEditingSubject({ ...editingSubject, jointPass: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
                <label htmlFor="editJointPassCheck" className="text-slate-700 cursor-pointer">
                  যৌথ পাস প্রযোজ্য
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
