'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Layers, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  X, 
  GraduationCap, 
  Sparkles, 
  FileCheck, 
  Printer, 
  RotateCcw, 
  Save, 
  ShieldCheck, 
  HelpCircle, 
  Check, 
  Award,
  ChevronRight,
  Info,
  Filter,
  FileText,
  Download,
  Book,
  Search,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export interface SubjectCurriculumItem {
  id: string;
  code: string;
  name: string;
  grade: '6th' | '7th' | '8th' | '9th' | '10th';
  group: 'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা' | 'মানবিক ও ব্যবসায় শিক্ষা';
  cq: number | string;        // Creative / Written Marks
  mcq: number | string;       // Multiple Choice Marks
  practical: number | string; // Practical Marks
  ca: number | string;        // Continuous Assessment / Formative
  fullMarks: number;          // Total Full Marks
  passMarks: number;          // Minimum Pass Marks (e.g. 33)
  passRules: string;          // Pass criteria description
  isJointPass?: boolean;
  jointPassInfo?: string;
  category: 'আবশ্যিক' | 'ঐচ্ছিক' | '৪র্থ বিষয়' | 'সাধারণ';
}

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

// ═══════════════════════════════════════════════════════════════
// BASE SUBJECT TEMPLATES FOR 6-8 & 9-10
// ═══════════════════════════════════════════════════════════════
const base6to8Subjects: Omit<SubjectCurriculumItem, 'id' | 'grade'>[] = [
  { code: 'BAN-601', name: 'বাংলা ১ম পত্র', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'বাংলা ২য় পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', isJointPass: true, jointPassInfo: 'বাংলা ১ম + ২য় যৌথ মোট ৫০ মার্কস', category: 'আবশ্যিক' },
  { code: 'BAN-602', name: 'বাংলা ২য় পত্র', group: 'সাধারণ', cq: 50, mcq: '-', practical: '-', ca: 0, fullMarks: 50, passMarks: 17, passRules: 'বাংলা ১ম পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', isJointPass: true, jointPassInfo: 'বাংলা ১ম + ২য় যৌথ মোট ৫০ মার্কস', category: 'আবশ্যিক' },
  { code: 'ENG-601', name: 'ইংরেজি ১ম পত্র', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'ইংরেজি ২য় পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, jointPassInfo: 'ইংরেজি ১ম + ২য় যৌথ মোট ৬৬ মার্কস', category: 'আবশ্যিক' },
  { code: 'ENG-602', name: 'ইংরেজি ২য় পত্র', group: 'সাধারণ', cq: 50, mcq: '-', practical: '-', ca: 0, fullMarks: 50, passMarks: 17, passRules: 'ইংরেজি ১ম পত্রের সাথে যৌথ পাস (মোট ৫০/১৫০)', isJointPass: true, jointPassInfo: 'ইংরেজি ১ম + ২য় যৌথ মোট ৫০ মার্কস', category: 'আবশ্যিক' },
  { code: 'MAT-603', name: 'গণিত (Mathematics)', group: 'সাধারণ', cq: 70, mcq: '-', practical: '-', ca: 30, fullMarks: 100, passMarks: 33, passRules: 'লিখিত ও সিএ-তে আলাদা পাস (৩৩% নম্বর)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'SCI-604', name: 'বিজ্ঞান (Science)', group: 'সাধারণ', cq: 100, mcq: '-', practical: 0, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'লিখিত ৩৩% নম্বর (৩৩/১০০)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'ICT-605', name: 'ডিজিটাল প্রযুক্তি (Digital Tech)', group: 'সাধারণ', cq: 25, mcq: '-', practical: 25, ca: 0, fullMarks: 50, passMarks: 17, passRules: 'লিখিত ও ব্যবহারিকে পৃথকভাবে পাস', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'HIS-606', name: 'ইতিহাস ও সামাজিক বিজ্ঞান', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'লিখিত ৩৩% নম্বর (৩৩/১০০)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'REL-610', name: 'ধর্ম ও নৈতিক শিক্ষা', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'লিখিত ৩৩% নম্বর (৩৩/১০০)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'AGR-607', name: 'কৃষি শিক্ষা (Agricultural Science)', group: 'সাধারণ', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ + Practical ৮ (৪র্থ বিষয়)', isJointPass: false, category: '৪র্থ বিষয়' }
];

const base9to10Subjects: Omit<SubjectCurriculumItem, 'id' | 'grade'>[] = [
  // ── আবশ্যিক বিষয় (Compulsory Subjects) ──
  { code: 'BAN-101', name: 'বাংলা ১ম পত্র (সাহিত্য)', group: 'সাধারণ', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'বাংলা ২য় পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, jointPassInfo: 'বাংলা ১ম + ২য় যৌথ মোট ৬৬ মার্কস', category: 'আবশ্যিক' },
  { code: 'BAN-102', name: 'বাংলা ২য় পত্র (ব্যাকরণ ও রচনা)', group: 'সাধারণ', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'বাংলা ১ম পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, jointPassInfo: 'বাংলা ১ম + ২য় যৌথ মোট ৬৬ মার্কস', category: 'আবশ্যিক' },
  { code: 'ENG-107', name: 'English 1st Paper', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'ইংরেজি ২য় পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, jointPassInfo: 'ইংরেজি ১ম + ২য় যৌথ মোট ৬৬ মার্কস', category: 'আবশ্যিক' },
  { code: 'ENG-108', name: 'English 2nd Paper', group: 'সাধারণ', cq: 100, mcq: '-', practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'ইংরেজি ১ম পত্রের সাথে যৌথ পাস (মোট ৬৬/২০০)', isJointPass: true, jointPassInfo: 'ইংরেজি ১ম + ২য় যৌথ মোট ৬৬ মার্কস', category: 'আবশ্যিক' },
  { code: 'MAT-109', name: 'সাধারণ গণিত (General Math)', group: 'সাধারণ', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস আবশ্যক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'ICT-154', name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', group: 'সাধারণ', cq: '-', mcq: 25, practical: 25, ca: 0, fullMarks: 50, passMarks: 17, passRules: 'MCQ ৮ + Practical ৮ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'REL-111', name: 'ইসলাম ও নৈতিক শিক্ষা', group: 'সাধারণ', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'BGS-150', name: 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)', group: 'বিজ্ঞান', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (বিজ্ঞান বিভাগের আবশ্যিক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'GSCI-127', name: 'সাধারণ বিজ্ঞান (General Science)', group: 'মানবিক ও ব্যবসায় শিক্ষা', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ (মানবিক ও ব্যবসায় শিক্ষার আবশ্যিক)', isJointPass: false, category: 'আবশ্যিক' },

  // ── বিজ্ঞান বিভাগ (Science Group) ──
  { code: 'PHY-136', name: 'পদার্থবিজ্ঞান (Physics)', group: 'বিজ্ঞান', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ (একত্রে) + Practical ৮ (পৃথক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'CHE-137', name: 'রসায়ন (Chemistry)', group: 'বিজ্ঞান', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ (একত্রে) + Practical ৮ (পৃথক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'BIO-138', name: 'জীববিজ্ঞান (Biology)', group: 'বিজ্ঞান', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ (একত্রে) + Practical ৮ (পৃথক)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'HMT-126', name: 'উচ্চতর গণিত (Higher Math)', group: 'বিজ্ঞান', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ (একত্রে) + Practical ৮ (পৃথক)', isJointPass: false, category: '৪র্থ বিষয়' },

  // ── মানবিক বিভাগ (Humanities Group) ──
  { code: 'HIS-153', name: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', group: 'মানবিক', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'GEO-110', name: 'ভূগোল ও পরিবেশ', group: 'মানবিক', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'CIV-112', name: 'পৌরনীতি ও নাগরিকতা', group: 'মানবিক', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'ECO-141', name: 'অর্থনীতি (Economics)', group: 'মানবিক', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'ঐচ্ছিক' },

  // ── ব্যবসায় শিক্ষা বিভাগ (Commerce Group) ──
  { code: 'ACC-146', name: 'হিসাববিজ্ঞান (Accounting)', group: 'ব্যবসায় শিক্ষা', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'BUS-143', name: 'ব্যবসায় উদ্যোগ (Business Ent.)', group: 'ব্যবসায় শিক্ষা', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'FIN-152', name: 'ফিন্যান্স ও ব্যাংকিং (Finance)', group: 'ব্যবসায় শিক্ষা', cq: 70, mcq: 30, practical: '-', ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ ২৩ + MCQ ১০ ( পৃথক পাস)', isJointPass: false, category: 'আবশ্যিক' },
  { code: 'AGR-134', name: 'কৃষি শিক্ষা (Agricultural Science)', group: 'ব্যবসায় শিক্ষা', cq: 50, mcq: 25, practical: 25, ca: 0, fullMarks: 100, passMarks: 33, passRules: 'CQ+MCQ ২৫ + Practical ৮ (৪র্থ বিষয়)', isJointPass: false, category: '৪র্থ বিষয়' }
];

const DEFAULT_CURRICULUM_DATA: SubjectCurriculumItem[] = [
  ...(['6th', '7th', '8th'] as const).flatMap(g => 
    base6to8Subjects.map(s => ({
      ...s,
      id: `curr-${g}-${s.code}`,
      grade: g,
      code: s.code.replace('-6', `-${g === '6th' ? '6' : g === '7th' ? '7' : '8'}`)
    }))
  ),
  ...(['9th', '10th'] as const).flatMap(g => 
    base9to10Subjects.map(s => ({
      ...s,
      id: `curr-${g}-${s.code}`,
      grade: g
    }))
  )
];

// OFFICIAL NCTB TEXTBOOKS CATALOG (2026 REVISED EDITIONS)
const OFFICIAL_NCTB_BOOKS: NctbBookItem[] = [
  // ─── GRADES 6, 7 & 8 BOOKS ───
  {
    id: 'book-601',
    code: 'NCTB-601',
    titleBn: 'বাংলা ১ম পত্র (চারুপাঠ / নতুন দিগন্ত)',
    titleEn: 'Bangla 1st Paper (Charupath)',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 180
  },
  {
    id: 'book-602',
    code: 'NCTB-602',
    titleBn: 'বাংলা ২য় পত্র (ব্যাকরণ ও নির্মিতি)',
    titleEn: 'Bangla Grammar & Composition',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 140
  },
  {
    id: 'book-603',
    code: 'NCTB-603',
    titleBn: 'English For Today (1st Paper)',
    titleEn: 'English For Today',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 210
  },
  {
    id: 'book-604',
    code: 'NCTB-604',
    titleBn: 'English Grammar & Composition (2nd Paper)',
    titleEn: 'English Grammar',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 195
  },
  {
    id: 'book-605',
    code: 'NCTB-605',
    titleBn: 'গণিত (Mathematics Textbook)',
    titleEn: 'Mathematics Textbook',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 230
  },
  {
    id: 'book-606',
    code: 'NCTB-606',
    titleBn: 'বিজ্ঞান (Science Laboratory & Theory)',
    titleEn: 'General Science',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 250
  },
  {
    id: 'book-607',
    code: 'NCTB-607',
    titleBn: 'ডিজিটাল প্রযুক্তি (Digital Technology)',
    titleEn: 'Digital Technology (ICT)',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 160
  },
  {
    id: 'book-608',
    code: 'NCTB-608',
    titleBn: 'ইতিহাস ও সামাজিক বিজ্ঞান',
    titleEn: 'History & Social Science',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 220
  },
  {
    id: 'book-609',
    code: 'NCTB-609',
    titleBn: 'জীবন ও জীবিকা (Life & Livelihood)',
    titleEn: 'Life & Livelihood',
    grades: ['6th', '7th', '8th'],
    group: 'সাধারণ',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 128
  },
  {
    id: 'book-610',
    code: 'NCTB-610',
    titleBn: 'ইসলাম ও নৈতিক শিক্ষা / হিন্দুধর্ম শিক্ষা',
    titleEn: 'Religious & Moral Studies',
    grades: ['6th', '7th', '8th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 168
  },
  {
    id: 'book-611',
    code: 'NCTB-611',
    titleBn: 'কৃষি শিক্ষা (Agriculture Studies)',
    titleEn: 'Agriculture Studies',
    grades: ['6th', '7th', '8th'],
    group: 'সাধারণ',
    edition: '২০২৬ সংশোধিত সংস্করণ',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 144
  },

  // ─── GRADES 9 & 10 BOOKS ───
  {
    id: 'book-901',
    code: 'NCTB-901',
    titleBn: 'বাংলা ১ম পত্র (সাহিত্যধারা)',
    titleEn: 'Bangla 1st Paper',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 260
  },
  {
    id: 'book-902',
    code: 'NCTB-902',
    titleBn: 'বাংলা ২য় পত্র (ব্যাকরণ ও রচনা)',
    titleEn: 'Bangla Grammar & Composition',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 220
  },
  {
    id: 'book-903',
    code: 'NCTB-903',
    titleBn: 'English For Today (1st Paper)',
    titleEn: 'English For Today',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 245
  },
  {
    id: 'book-904',
    code: 'NCTB-904',
    titleBn: 'English Grammar & Composition (2nd Paper)',
    titleEn: 'English Grammar',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 210
  },
  {
    id: 'book-905',
    code: 'NCTB-905',
    titleBn: 'সাধারণ গণিত (General Mathematics)',
    titleEn: 'General Mathematics',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 310
  },
  {
    id: 'book-906',
    code: 'NCTB-906',
    titleBn: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
    titleEn: 'Information & Communication Tech',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 175
  },
  {
    id: 'book-907',
    code: 'NCTB-907',
    titleBn: 'ইসলাম ও নৈতিক শিক্ষা / হিন্দুধর্ম শিক্ষা',
    titleEn: 'Islam & Moral Education',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 200
  },
  {
    id: 'book-908',
    code: 'NCTB-908',
    titleBn: 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)',
    titleEn: 'Bangladesh & Global Studies',
    grades: ['9th', '10th'],
    group: 'আবশ্যিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 240
  },
  {
    id: 'book-910',
    code: 'NCTB-910',
    titleBn: 'পদার্থবিজ্ঞান (Physics Textbook)',
    titleEn: 'Physics',
    grades: ['9th', '10th'],
    group: 'বিজ্ঞান',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 280
  },
  {
    id: 'book-911',
    code: 'NCTB-911',
    titleBn: 'রসায়ন (Chemistry Textbook)',
    titleEn: 'Chemistry',
    grades: ['9th', '10th'],
    group: 'বিজ্ঞান',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 265
  },
  {
    id: 'book-912',
    code: 'NCTB-912',
    titleBn: 'জীববিজ্ঞান (Biology Textbook)',
    titleEn: 'Biology',
    grades: ['9th', '10th'],
    group: 'বিজ্ঞান',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 250
  },
  {
    id: 'book-913',
    code: 'NCTB-913',
    titleBn: 'ভূগোল ও পরিবেশ (Geography & Environment)',
    titleEn: 'Geography & Environment',
    grades: ['9th', '10th'],
    group: 'মানবিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 205
  },
  {
    id: 'book-914',
    code: 'NCTB-914',
    titleBn: 'পৌরনীতি ও নাগরিকতা (Civics & Citizenship)',
    titleEn: 'Civics & Citizenship',
    grades: ['9th', '10th'],
    group: 'মানবিক',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 185
  },
  {
    id: 'book-915',
    code: 'NCTB-915',
    titleBn: 'হিসাববিজ্ঞান (Accounting)',
    titleEn: 'Accounting',
    grades: ['9th', '10th'],
    group: 'ব্যবসায় শিক্ষা',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 290
  },
  {
    id: 'book-916',
    code: 'NCTB-916',
    titleBn: 'ব্যবসায় উদ্যোগ (Entrepreneurship)',
    titleEn: 'Business Entrepreneurship',
    grades: ['9th', '10th'],
    group: 'ব্যবসায় শিক্ষা',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 190
  },
  {
    id: 'book-917',
    code: 'NCTB-917',
    titleBn: 'ফিন্যান্স ও ব্যাংকিং (Finance & Banking)',
    titleEn: 'Finance & Banking',
    grades: ['9th', '10th'],
    group: 'ব্যবসায় শিক্ষা',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 215
  },
  {
    id: 'book-918',
    code: 'NCTB-918',
    titleBn: 'সাধারণ বিজ্ঞান (General Science for Humanities/Commerce)',
    titleEn: 'General Science',
    grades: ['9th', '10th'],
    group: 'সাধারণ',
    edition: '২০২৬ বোর্ড অনুমোদিত',
    publisher: 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)',
    pages: 250
  }
];

export default function CurriculumClient() {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'nctb-books'>('curriculum');

  const [curriculumList, setCurriculumList] = useState<SubjectCurriculumItem[]>(DEFAULT_CURRICULUM_DATA);
  const [selectedGrade, setSelectedGrade] = useState<'6th' | '7th' | '8th' | '9th' | '10th'>('6th');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা'>('all');

  // NCTB Book Catalog Search & Filters
  const [bookGradeFilter, setBookGradeFilter] = useState<'all' | '6-8' | '9-10'>('all');
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal States - Add/Edit Subject
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectCurriculumItem | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<'6th' | '7th' | '8th' | '9th' | '10th'>('6th');
  const [group, setGroup] = useState<'সাধারণ' | 'বিজ্ঞান' | 'মানবিক' | 'ব্যবসায় শিক্ষা' | 'মানবিক ও ব্যবসায় শিক্ষা'>('সাধারণ');
  const [cq, setCq] = useState<string | number>(70);
  const [mcq, setMcq] = useState<string | number>(30);
  const [practical, setPractical] = useState<string | number>('-');
  const [ca, setCa] = useState<string | number>(0);
  const [fullMarks, setFullMarks] = useState<number>(100);
  const [passMarks, setPassMarks] = useState<number>(33);
  const [passRules, setPassRules] = useState('CQ ও MCQ তে আলাদা পাস');
  const [isJointPass, setIsJointPass] = useState(false);
  const [jointPassInfo, setJointPassInfo] = useState('');
  const [category, setCategory] = useState<'আবশ্যিক' | 'ঐচ্ছিক' | '৪র্থ বিষয়' | 'সাধারণ'>('আবশ্যিক');
  
  // Cascading Sync Checkbox (Default true for 6-8 and 9-10 sync)
  const [syncEquivalentGrades, setSyncEquivalentGrades] = useState<boolean>(true);

  const loadData = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sms_curriculum_subjects');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCurriculumList(parsed);
          }
        } catch (e) {}
      }
    }
  };

  const syncAcademicClassesStorage = (curriculumItems: SubjectCurriculumItem[]) => {
    if (typeof window === 'undefined') return;
    const storedClasses = localStorage.getItem('sms_academic_classes');
    if (!storedClasses) return;
    try {
      const parsedClasses = JSON.parse(storedClasses);
      if (Array.isArray(parsedClasses)) {
        const updatedClasses = parsedClasses.map(cls => {
          const gradeKey = cls.gradeNumber === 6 ? '6th' : cls.gradeNumber === 7 ? '7th' : cls.gradeNumber === 8 ? '8th' : cls.gradeNumber === 9 ? '9th' : '10th';
          const matchingCurriculum = curriculumItems.filter(c => c.grade === gradeKey);
          if (matchingCurriculum.length > 0) {
            const subjects = matchingCurriculum.map(c => ({
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
              jointWith: c.jointPassInfo
            }));
            return {
              ...cls,
              subjects,
              subjectsCount: subjects.length
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_curriculum_subjects', JSON.stringify(updated));
      syncAcademicClassesStorage(updated);
      window.dispatchEvent(new Event('storage'));
    }
  };

  useEffect(() => {
    loadData();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadData);
      return () => window.removeEventListener('storage', loadData);
    }
  }, []);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleResetToNctb = () => {
    if (confirm('আপনি কি NCTB ২০২৬ এর মানসম্মত পাঠ্যক্রম ও নম্বর বিভাজন ডিফল্ট রিসেট করতে চান? (৬ষ্ঠ-৮ম এবং ৯দশ-১০ম অটো-সিঙ্ক যুক্ত হবে)')) {
      saveData(DEFAULT_CURRICULUM_DATA);
      showAlert('success', 'NCTB ২০২৬ পাঠ্যক্রম ও নম্বর বিভাজন সফলভাবে রিসেট করা হয়েছে!');
    }
  };

  const handleOpenAddModal = () => {
    setEditingSubject(null);
    setCode(`SUB-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setGrade(selectedGrade);
    setGroup('সাধারণ');
    setCq(70);
    setMcq(30);
    setPractical('-');
    setCa(0);
    setFullMarks(100);
    setPassMarks(33);
    setPassRules('CQ ও MCQ তে আলাদা পাস');
    setIsJointPass(false);
    setJointPassInfo('');
    setCategory('আবশ্যিক');
    setSyncEquivalentGrades(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: SubjectCurriculumItem) => {
    setEditingSubject(item);
    setCode(item.code);
    setName(item.name);
    setGrade(item.grade);
    setGroup(item.group);
    setCq(item.cq);
    setMcq(item.mcq);
    setPractical(item.practical);
    setCa(item.ca);
    setFullMarks(item.fullMarks);
    setPassMarks(item.passMarks);
    setPassRules(item.passRules);
    setIsJointPass(!!item.isJointPass);
    setJointPassInfo(item.jointPassInfo || '');
    const isAgri = item.name.includes('কৃষি') || item.code.includes('AGR') || item.code.includes('AGE');
    setCategory(isAgri ? '৪র্থ বিষয়' : item.category);
    setSyncEquivalentGrades(true);
    setShowModal(true);
  };

  const handleDeleteSubject = (itemToDelete: SubjectCurriculumItem) => {
    const isFoundationGroup = ['6th', '7th', '8th'].includes(itemToDelete.grade);
    const targetGrades = isFoundationGroup ? ['6th', '7th', '8th'] : ['9th', '10th'];
    const targetGradeNames = isFoundationGroup ? '৬ষ্ঠ, ৭ম ও ৮ম' : '৯ম ও ১০ম';

    const confirmMsg = `আপনি কি "${itemToDelete.name}" বিষয়টিকে সমমানের সকল শ্রেণি (${targetGradeNames}) থেকে মুছে ফেলতে চান?\n\n- [OK] চাপলে ${targetGradeNames} সকল শ্রেণি থেকে মুছে যাবে।\n- [Cancel] চাপলে মুছে ফেলা বাতিল হবে।`;

    if (confirm(confirmMsg)) {
      const updated = curriculumList.filter(item => {
        const isTargetGroup = targetGrades.includes(item.grade);
        const isMatchingSubject = item.name.trim() === itemToDelete.name.trim() || item.code.trim() === itemToDelete.code.trim();
        return !(isTargetGroup && isMatchingSubject);
      });

      saveData(updated);
      showAlert('success', `"${itemToDelete.name}" বিষয়টি ${targetGradeNames} শ্রেণি থেকে সফলভাবে মুছে ফেলা হয়েছে!`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      showAlert('error', 'বিষয় কোড ও নাম আবশ্যক!');
      return;
    }

    const isFoundationGroup = ['6th', '7th', '8th'].includes(grade);
    const targetGrades: Array<'6th' | '7th' | '8th' | '9th' | '10th'> = syncEquivalentGrades 
      ? (isFoundationGroup ? ['6th', '7th', '8th'] : ['9th', '10th'])
      : [grade];

    let currentList = [...curriculumList];

    targetGrades.forEach(tg => {
      const tgCode = code.trim().toUpperCase();

      const newItem: SubjectCurriculumItem = {
        id: (editingSubject && editingSubject.grade === tg) 
          ? editingSubject.id 
          : `curr-${tg}-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        code: tgCode,
        name: name.trim(),
        grade: tg,
        group,
        cq,
        mcq,
        practical,
        ca,
        fullMarks: Number(fullMarks),
        passMarks: Number(passMarks),
        passRules: passRules.trim(),
        isJointPass,
        jointPassInfo: isJointPass ? jointPassInfo.trim() : '',
        category
      };

      if (editingSubject) {
        // Find existing subject for target grade by ID or old code or old name
        const existingIdx = currentList.findIndex(item => 
          item.grade === tg && (
            item.id === editingSubject.id ||
            item.code === editingSubject.code ||
            item.name.trim() === editingSubject.name.trim()
          )
        );

        if (existingIdx >= 0) {
          currentList[existingIdx] = { ...newItem, id: currentList[existingIdx].id };
        } else {
          currentList.push(newItem);
        }
      } else {
        // Adding new subject
        const existingIdx = currentList.findIndex(item => 
          item.grade === tg && (
            item.code === tgCode ||
            item.name.trim() === name.trim()
          )
        );

        if (existingIdx >= 0) {
          currentList[existingIdx] = { ...newItem, id: currentList[existingIdx].id };
        } else {
          currentList.push(newItem);
        }
      }
    });

    saveData(currentList);
    setShowModal(false);

    const groupText = syncEquivalentGrades 
      ? (isFoundationGroup ? '৬ষ্ঠ, ৭ম ও ৮ম সকল শ্রেণিতে' : '৯ম ও ১০ম উভয় শ্রেণিতে')
      : `${grade === '6th'?'৬ষ্ঠ':grade === '7th'?'৭ম':grade === '8th'?'৮ম':grade === '9th'?'৯ম':'১০ম'} শ্রেণিতে`;

    showAlert('success', `"${name.trim()}" বিষয়টি ${groupText} সফলভাবে আপডেট/সংযুক্ত করা হয়েছে!`);
  };

  // Filtered List for active selected tab grade
  const filteredCurriculum = curriculumList.filter(item => {
    const matchGrade = item.grade === selectedGrade;
    const matchGroup = (selectedGrade === '6th' || selectedGrade === '7th' || selectedGrade === '8th') 
      ? true 
      : (
          selectedGroup === 'all' || 
          item.group === 'সাধারণ' || 
          item.group === selectedGroup || 
          (item.group === 'মানবিক ও ব্যবসায় শিক্ষা' && (selectedGroup === 'মানবিক' || selectedGroup === 'ব্যবসায় শিক্ষা'))
        );
    return matchGrade && matchGroup;
  });

  // Filtered Books
  const filteredBooks = OFFICIAL_NCTB_BOOKS.filter(book => {
    const matchGrade = bookGradeFilter === 'all' 
      ? true 
      : bookGradeFilter === '6-8' 
        ? book.grades.some(g => ['6th', '7th', '8th'].includes(g))
        : book.grades.some(g => ['9th', '10th'].includes(g));

    const query = bookSearchQuery.toLowerCase();
    const matchSearch = book.titleBn.toLowerCase().includes(query) 
      || book.code.toLowerCase().includes(query) 
      || book.titleEn.toLowerCase().includes(query);

    return matchGrade && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* 🌟 UNIFIED SINGLE-LINE COMPACT HEADER & CONTROLS TOOLBAR */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 print:hidden">
        
        {/* Left: Grade Selector + Group/Department (when 9th/10th) + Subject Count */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          
          {/* Grade Selector Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {[
              { id: '6th', label: '৬ষ্ঠ শ্রেণি' },
              { id: '7th', label: '৭ম শ্রেণি' },
              { id: '8th', label: '৮ম শ্রেণি' },
              { id: '9th', label: '৯ম শ্রেণি' },
              { id: '10th', label: '১০ম শ্রেণি' }
            ].map(g => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGrade(g.id as any);
                  setActiveTab('curriculum');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  activeTab === 'curriculum' && selectedGrade === g.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Department Filter (Only for 9th & 10th) */}
          {activeTab === 'curriculum' && (selectedGrade === '9th' || selectedGrade === '10th') && (
            <div className="flex items-center bg-amber-50/80 p-1 rounded-xl border border-amber-200/80">
              {[
                { id: 'all', label: 'সব বিভাগ' },
                { id: 'বিজ্ঞান', label: 'বিজ্ঞান' },
                { id: 'মানবিক', label: 'মানবিক' },
                { id: 'ব্যবসায় শিক্ষা', label: 'ব্যবসায়' }
              ].map(grp => (
                <button
                  key={grp.id}
                  onClick={() => setSelectedGroup(grp.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedGroup === grp.id
                      ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-amber-100/60'
                  }`}
                >
                  {grp.label}
                </button>
              ))}
            </div>
          )}

          {/* Subject Count Pill */}
          {activeTab === 'curriculum' && (
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 font-extrabold text-[11px] rounded-lg border border-indigo-100 inline-flex items-center gap-1">
              <GraduationCap size={13} className="text-indigo-600" />
              {filteredCurriculum.length}টি বিষয়
            </span>
          )}

          {/* Quick toggle to NCTB Catalog */}
          <button
            onClick={() => setActiveTab(activeTab === 'curriculum' ? 'nctb-books' : 'curriculum')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'nctb-books'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-black'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="NCTB মূল পাঠ্যবই ক্যাটালগ"
          >
            <Book size={14} className={activeTab === 'nctb-books' ? 'text-indigo-600' : 'text-slate-500'} />
            <span>{activeTab === 'nctb-books' ? 'পাঠ্যক্রম টেবিলে ফিরুন' : 'NCTB পাঠ্যবই'}</span>
          </button>

        </div>

        {/* Right: Actions (Reset + Add Subject) */}
        <div className="flex items-center gap-2 shrink-0 self-end xl:self-center">
          <button
            onClick={handleResetToNctb}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold transition text-slate-800 cursor-pointer active:scale-95"
            title="NCTB ২০২৬ ডিফল্ট রিসেট"
          >
            <RotateCcw size={13} className="text-amber-600" />
            ডিফল্ট রিসেট
          </button>
          
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition transform active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            নতুন বিষয় যোগ
          </button>
        </div>

      </div>

      {/* ALERT FEEDBACK */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-sm ${
          alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className={alertMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'} />
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CURRICULUM & MARKS BREAKDOWN                               */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'curriculum' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">

            {/* CURRICULUM TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-800 font-black uppercase text-[11px] border-b border-slate-200">
                    <th className="p-3.5">বিষয় কোড ও নাম</th>
                    <th className="p-3.5 text-center">ক্যাটাগরি / গ্রুপ</th>
                    <th className="p-3.5 text-center">CQ (লিখিত)</th>
                    <th className="p-3.5 text-center">MCQ (নৈর্ব্যক্তিক)</th>
                    <th className="p-3.5 text-center">PRACTICAL</th>
                    <th className="p-3.5 text-center">CA (ধারাবাহিক)</th>
                    <th className="p-3.5 text-center font-black">পূর্ণমান</th>
                    <th className="p-3.5 text-center font-black text-emerald-700">পাস নম্বর</th>
                    <th className="p-3.5">পাস নিয়মাবলী & যৌথ পাস</th>
                    <th className="p-3.5 text-center">অ্যাকশন (এডিট/ডিলিট)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredCurriculum.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Code & Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-black text-[11px] rounded-lg border border-indigo-100 font-mono">
                            {sub.code}
                          </span>
                          <div>
                            <strong className="font-extrabold text-slate-900 text-sm block">{sub.name}</strong>
                             <div className="flex items-center gap-1.5 mt-0.5">
                              {sub.category === '৪র্থ বিষয়' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shadow-sm">
                                  <Award size={11} className="text-amber-700" /> ৪্থ বিষয় (অপশনাল)
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-bold">{sub.category}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Group */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                          sub.group === 'বিজ্ঞান' ? 'bg-violet-50 text-violet-700 border border-violet-200' :
                          sub.group === 'মানবিক' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          sub.group === 'ব্যবসায় শিক্ষা' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {sub.group}
                        </span>
                      </td>

                      {/* CQ */}
                      <td className="p-3.5 text-center font-black font-mono text-slate-900 text-sm">
                        {sub.cq}
                      </td>

                      {/* MCQ */}
                      <td className="p-3.5 text-center font-bold font-mono text-slate-600">
                        {sub.mcq}
                      </td>

                      {/* Practical */}
                      <td className="p-3.5 text-center">
                        {sub.practical !== '-' && Number(sub.practical) > 0 ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black font-mono text-xs rounded">
                            {sub.practical}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </td>

                      {/* CA */}
                      <td className="p-3.5 text-center">
                        {sub.ca !== '-' && Number(sub.ca) > 0 ? (
                          <span className="px-2 py-0.5 bg-violet-100 text-violet-800 font-black font-mono text-xs rounded">
                            {sub.ca}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">0</span>
                        )}
                      </td>

                      {/* Full Marks */}
                      <td className="p-3.5 text-center font-black font-mono text-slate-900 text-base">
                        {sub.fullMarks}
                      </td>

                      {/* Pass Marks */}
                      <td className="p-3.5 text-center font-black font-mono text-emerald-700 text-sm">
                        {sub.passMarks}
                      </td>

                      {/* Pass Rules */}
                      <td className="p-3.5">
                        {sub.isJointPass ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 font-black text-[10px] rounded-md border border-amber-300">
                              ★ যৌথ পাস
                            </span>
                            <p className="text-[11px] text-slate-600 font-bold">{sub.passRules}</p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-700 font-bold">{sub.passRules}</p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(sub)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 transition rounded-lg hover:bg-indigo-50 border border-slate-200"
                            title="এডিট ও সিঙ্ক"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(sub)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 border border-slate-200"
                            title="মুছে ফেলুন (সকল সমমানের শ্রেণিতে সিঙ্ক সহ)"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: OFFICIAL NCTB TEXTBOOKS CATALOG                            */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'nctb-books' && (
        <div className="space-y-6">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <span className="text-[11px] font-black text-slate-400 uppercase mr-1">শ্রেণি ফিল্টার:</span>
              <button
                onClick={() => setBookGradeFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  bookGradeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                সব বই (All Books)
              </button>

              <button
                onClick={() => setBookGradeFilter('6-8')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  bookGradeFilter === '6-8'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ৬ষ্ঠ - ৮ম শ্রেণি
              </button>

              <button
                onClick={() => setBookGradeFilter('9-10')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  bookGradeFilter === '9-10'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ৯ম - ১০ম শ্রেণি
              </button>
            </div>

            {/* Search Box */}
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 w-full sm:w-72">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="বইয়ের নাম বা কোড দিয়ে খুঁজুন..."
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-900 font-bold"
              />
            </div>

          </div>

          {/* BOOKS CATALOG GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 font-black flex items-center justify-center shrink-0">
                        <Book size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-indigo-600 font-mono block">{book.code}</span>
                        <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{book.titleBn}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs pt-3 font-medium text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">ইংরেজি শিরোনাম:</span>
                      <span className="text-slate-800 font-semibold">{book.titleEn}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">প্রযোজ্য শ্রেণি:</span>
                      <div className="flex gap-1">
                        {book.grades.map(g => (
                          <span key={g} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] rounded-md">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">সংস্করণ & পৃষ্ঠা:</span>
                      <span className="text-slate-800 font-bold">{book.edition} ({book.pages} পৃষ্ঠা)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">প্রকাশক:</span>
                      <span className="text-slate-700 font-semibold text-[11px]">{book.publisher}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] rounded-full border border-emerald-100">
                    বোর্ড অনুমোদিত টেক্সটবুক
                  </span>

                  <button
                    onClick={() => alert(`NCTB অফিশিয়াল ডিজিটাল কপি প্রিভিউ: ${book.titleBn}`)}
                    className="flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                  >
                    ডিজিটাল বুক নম্বর <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ADD / EDIT SUBJECT                                         */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Pencil className="text-indigo-600" size={18} />
                {editingSubject ? 'বিষয় সেটিংস ও পাস নিয়মাবলী সম্পাদনা' : 'নতুন বিষয় সংযুক্তকরণ'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* AUTOMATIC CASCADING SYNC BANNER */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="syncEquiv"
                  checked={syncEquivalentGrades}
                  onChange={(e) => setSyncEquivalentGrades(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="syncEquiv" className="text-xs font-black text-indigo-900 cursor-pointer">
                  {['6th', '7th', '8th'].includes(grade)
                    ? '⚡ ৬ষ্ঠ, ৭ম ও ৮ম শ্রেণির বিষয় তালিকায় স্বয়ংক্রিয় সিঙ্ক করুন'
                    : '⚡ ৯দশ ও ১০ম উভয় শ্রেণির বিষয় তালিকায় স্বয়ংক্রিয় সিঙ্ক করুন'}
                </label>
              </div>
              <RefreshCw size={14} className="text-indigo-600 animate-spin-slow" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">বিষয় কোড *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">বিষয়ের নাম *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">প্রাথমিক শ্রেণি</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold"
                  >
                    <option value="6th">৬ষ্ঠ শ্রেণি (সিঙ্ক: ৬, ৭, ৮)</option>
                    <option value="7th">৭ম শ্রেণি (সিঙ্ক: ৬, ৭, ৮)</option>
                    <option value="8th">৮ম শ্রেণি (সিঙ্ক: ৬, ৭, ৮)</option>
                    <option value="9th">৯ম শ্রেণি (সিঙ্ক: ৯, ১০)</option>
                    <option value="10th">১০ম শ্রেণি (সিঙ্ক: ৯, ১০)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">গ্রুপ / বিভাগ</label>
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold"
                  >
                    <option value="সাধারণ">সাধারণ (সকলের আবশ্যিক)</option>
                    <option value="বিজ্ঞান">বিজ্ঞান (Science Group)</option>
                    <option value="মানবিক">মানবিক (Humanities Group)</option>
                    <option value="ব্যবসায় শিক্ষা">ব্যবসায় শিক্ষা (Commerce)</option>
                    <option value="মানবিক ও ব্যবসায় শিক্ষা">মানবিক ও ব্যবসায় শিক্ষা (যেমন: সাধারণ বিজ্ঞান)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-indigo-600 uppercase mb-1">বিষয় টাইপ / ক্যাটাগরি *</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setCategory(val);
                      if (val === '৪র্থ বিষয়') {
                        setPassRules('৪র্থ বিষয়: ২.০০ পয়েন্টের অতিরিক্ত পয়েন্ট মূল GPA-তে যোগ হবে (ফেল কার্যকর নয়)');
                      }
                    }}
                    className="w-full px-3 py-2 border border-indigo-200 bg-indigo-50/60 rounded-xl outline-none text-indigo-950 font-black"
                  >
                    <option value="আবশ্যিক">আবশ্যিক (Compulsory)</option>
                    <option value="ঐচ্ছিক">ঐচ্ছিক (Elective Group)</option>
                    <option value="৪র্থ বিষয়">৪র্থ বিষয় (4th/Optional)</option>
                    <option value="সাধারণ">সাধারণ (General)</option>
                  </select>
                </div>
              </div>

              {/* 4TH SUBJECT NCTB RULE CARD */}
              {category === '৪র্থ বিষয়' && (
                <div className="p-3.5 bg-violet-50 border border-violet-200 rounded-2xl space-y-1.5 text-xs text-violet-950">
                  <div className="flex items-center gap-2 font-black text-violet-900">
                    <Award size={16} className="text-violet-700" />
                    <span>⚡ ৪্থ বিষয় (Optional 4th Subject) বোর্ড রেজাল্ট রুলস:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] font-semibold text-violet-800 pl-1">
                    <li>অর্জিত গ্রেড পয়েন্টের <strong>২.০০ পয়েন্টের অতিরিক্ত (GP - 2.00)</strong> মূল মোট GPA এ যোগ হবে।</li>
                    <li>৪র্থ বিষয়ে অকৃতকার্য (F) হলেও তা মূল ফলাফলে ফেল হিসেবে গণ্য হবে না।</li>
                  </ul>
                </div>
              )}

              {/* MARKS BREAKDOWN GRID */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">নম্বর বিন্যাস (Marks Distribution)</span>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500">CQ (লিখিত)</label>
                    <input
                      type="text"
                      value={cq}
                      onChange={(e) => setCq(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-center font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500">MCQ (নৈর্ব্যক্তিক)</label>
                    <input
                      type="text"
                      value={mcq}
                      onChange={(e) => setMcq(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-center font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500">Practical</label>
                    <input
                      type="text"
                      value={practical}
                      onChange={(e) => setPractical(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-center font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500">CA (ধারাবাহিক)</label>
                    <input
                      type="text"
                      value={ca}
                      onChange={(e) => setCa(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-center font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">পূর্ণমান (Full Marks)</label>
                    <input
                      type="number"
                      value={fullMarks}
                      onChange={(e) => setFullMarks(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-black text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500">সর্বনিম্ন পাস নম্বর</label>
                    <input
                      type="number"
                      value={passMarks}
                      onChange={(e) => setPassMarks(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-black text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* PASS RULES & JOINT PASS */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">পাস নিয়মনীতি বিবরণ</label>
                <input
                  type="text"
                  value={passRules}
                  onChange={(e) => setPassRules(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-slate-900 font-bold"
                />
              </div>

              {/* 4TH SUBJECT CHECKBOX */}
              <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-2xl border border-violet-200">
                <input
                  type="checkbox"
                  id="fourthSubjectChk"
                  checked={category === '৪র্থ বিষয়'}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setCategory(isChecked ? '৪র্থ বিষয়' : 'আবশ্যিক');
                    if (isChecked) {
                      setPassRules('৪র্থ বিষয়: ২.০০ পয়েন্টের অতিরিক্ত পয়েন্ট মূল GPA-তে যোগ হবে (ফেল কার্যকর নয়)');
                    }
                  }}
                  className="w-4 h-4 text-violet-600 rounded cursor-pointer"
                />
                <label htmlFor="fourthSubjectChk" className="text-xs font-black text-violet-950 cursor-pointer flex items-center gap-1.5">
                  <Award size={15} className="text-violet-600 shrink-0" />
                  <span>৪র্থ বিষয় হলে টিক চিহ্ন দিন (সিস্টেম এটাকে ৪র্থ বিষয় হিসেবে গণনা করবে)</span>
                </label>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <input
                  type="checkbox"
                  id="jointPassChk"
                  checked={isJointPass}
                  onChange={(e) => setIsJointPass(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="jointPassChk" className="text-xs font-bold text-amber-900 cursor-pointer">
                  যৌথ পাস (Joint Pass - যেমন: বাংলা ১ম+২য়, ইংরেজি ১ম+২য়)
                </label>
              </div>

              {isJointPass && (
                <div>
                  <label className="block text-[10px] font-extrabold text-amber-800 uppercase mb-1">যৌথ পাসের তথ্য</label>
                  <input
                    type="text"
                    placeholder="যেমন: বাংলা ১ম ও ২য় মিলে মোট ৫০/১৫০ পাস"
                    value={jointPassInfo}
                    onChange={(e) => setJointPassInfo(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl outline-none text-amber-950 font-bold"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={14} /> সংরক্ষণ ও সিঙ্ক করুন
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
