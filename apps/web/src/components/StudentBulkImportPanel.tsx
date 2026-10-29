'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Search, 
  Filter, 
  Users, 
  Shield, 
  RefreshCw, 
  Eye, 
  Info, 
  Check, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  UserCheck,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Languages
} from 'lucide-react';
import { studentService, Student } from '@/services/studentService';
import { auditTrailService } from '@/services/auditTrailService';

// ─── 0. DIGIT CONVERTERS (Bilingual Engine) ─────────────────────────────────
export const bnToEnDigits = (str: string | number = ''): string => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str ?? '').replace(/[০-৯]/g, (d) => String(bn.indexOf(d)));
};

export const enToBnDigits = (str: string | number = ''): string => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str ?? '').replace(/[0-9]/g, (d) => bn[parseInt(d, 10)]);
};

// ─── 1. BENGALI SAMPLE DATA (Pure Bengali Headers & Data) ───────────────────
export const SAMPLE_STUDENTS_BN = [
  {
    'রোল': '০১',
    'শিক্ষার্থীর নাম': 'তাহমিদ ইসলাম চৌধুরী',
    'শ্রেণি': '৬ষ্ঠ',
    'শাখা': 'ক',
    'বিভাগ': 'সাধারণ',
    'শিক্ষাবর্ষ': '২০২৬',
    'লিঙ্গ': 'পুরুষ',
    'জন্ম তারিখ': '১৫/০৩/২০১৩',
    'জন্ম নিবন্ধন নম্বর': '২০১৩১৫৯২৬১২৩৪৫৬০১',
    'রক্তের গ্রুপ': 'B+',
    'ধর্ম': 'ইসলাম',
    'অভিভাবকের মোবাইল': '০১৮১২৩৪৫৬০১',
    'পিতার নাম': 'নুরুল ইসলাম চৌধুরী',
    'পিতার এনআইডি': '১৯৮০১৫৯২৬১২৩৪৫৬০১',
    'মাতার নাম': 'আমেনা বেগম',
    'মাতার এনআইডি': '১৯৮৪১৫৯২৬১২৩৪৫৬০১',
    'আইনগত অভিভাবক': 'নুরুল ইসলাম চৌধুরী',
    'বর্তমান ঠিকানা': 'গ্রাম: দক্ষিণ বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    'স্থায়ী ঠিকানা': 'গ্রাম: দক্ষিণ বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    '৪র্থ বিষয়': 'কৃষি শিক্ষা',
    'উপবৃত্তি প্রাপ্ত': 'হ্যাঁ',
    'উপবৃত্তি ক্যাটাগরি': 'সাধারণ উপবৃত্তি',
    'মন্তব্য': 'নিয়মিত ও মনোযোগী শিক্ষার্থী'
  },
  {
    'রোল': '০২',
    'শিক্ষার্থীর নাম': 'আফরিন জাহান সুমাইয়া',
    'শ্রেণি': '৬ষ্ঠ',
    'শাখা': 'ক',
    'বিভাগ': 'সাধারণ',
    'শিক্ষাবর্ষ': '২০২৬',
    'লিঙ্গ': 'মহিলা',
    'জন্ম তারিখ': '২২/০৭/২০১৩',
    'জন্ম নিবন্ধন নম্বর': '২০১৩১৫৯২৬১২৩৪৫৬০২',
    'রক্তের গ্রুপ': 'O+',
    'ধর্ম': 'ইসলাম',
    'অভিভাবকের মোবাইল': '০১৮১২৩৪৫৬০২',
    'পিতার নাম': 'আনোয়ার হোসেন',
    'পিতার এনআইডি': '১৯৭৯১৫৯২৬১২৩৪৫৬০২',
    'মাতার নাম': 'জাহানারা পারভীন',
    'মাতার এনআইডি': '১৯৮৩১৫৯২৬১২৩৪৫৬০২',
    'আইনগত অভিভাবক': 'আনোয়ার হোসেন',
    'বর্তমান ঠিকানা': 'গ্রাম: মধ্য বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    'স্থায়ী ঠিকানা': 'গ্রাম: মধ্য বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    '৪র্থ বিষয়': 'গার্হস্থ্য বিজ্ঞান',
    'উপবৃত্তি প্রাপ্ত': 'হ্যাঁ',
    'উপবৃত্তি ক্যাটাগরি': 'মেধাভিত্তিক উপবৃত্তি',
    'মন্তব্য': 'ক্লাস ক্যাপ্টেন'
  },
  {
    'রোল': '০১',
    'শিক্ষার্থীর নাম': 'অনিন্দ্য পাল দ্বীপ',
    'শ্রেণি': '৭ম',
    'শাখা': 'ক',
    'বিভাগ': 'সাধারণ',
    'শিক্ষাবর্ষ': '২০২৬',
    'লিঙ্গ': 'পুরুষ',
    'জন্ম তারিখ': '১০/০৫/২০১২',
    'জন্ম নিবন্ধন নম্বর': '২০১২১৫৯২৬১২৩৪৫৬০৩',
    'রক্তের গ্রুপ': 'A+',
    'ধর্ম': 'হিন্দু',
    'অভিভাবকের মোবাইল': '০১৭১২৩৪৫৬০৩',
    'পিতার নাম': 'সুনীল কুমার পাল',
    'পিতার এনআইডি': '১৯৭৮১৫৯২৬১২৩৪৫৬০৩',
    'মাতার নাম': 'সুচিত্রা সেন পাল',
    'মাতার এনআইডি': '১৯৮২১৫৯২৬১২৩৪৫৬০৩',
    'আইনগত অভিভাবক': 'সুনীল কুমার পাল',
    'বর্তমান ঠিকানা': 'গ্রাম: শান্তিবাজার, ডাকঘর: হারবাং, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    'স্থায়ী ঠিকানা': 'গ্রাম: শান্তিবাজার, ডাকঘর: হারবাং, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    '৪র্থ বিষয়': 'কৃষি শিক্ষা',
    'উপবৃত্তি প্রাপ্ত': 'না',
    'উপবৃত্তি ক্যাটাগরি': '',
    'মন্তব্য': 'বিজ্ঞান মেলায় ১ম স্থান'
  },
  {
    'রোল': '০১',
    'শিক্ষার্থীর নাম': 'মাহমুদুল হাসান সিফাত',
    'শ্রেণি': '৮ম',
    'শাখা': 'ক',
    'বিভাগ': 'সাধারণ',
    'শিক্ষাবর্ষ': '২০২৬',
    'লিঙ্গ': 'পুরুষ',
    'জন্ম তারিখ': '০৫/১১/২০১১',
    'জন্ম নিবন্ধন নম্বর': '২০১১১৫৯২৬১২৩৪৫৬০৪',
    'রক্তের গ্রুপ': 'AB+',
    'ধর্ম': 'ইসলাম',
    'অভিভাবকের মোবাইল': '০১৯১২৩৪৫৬০৪',
    'পিতার নাম': 'মোবারক আলী',
    'পিতার এনআইডি': '১৯৭৭১৫৯২৬১২৩৪৫৬০৪',
    'মাতার নাম': 'রোকেয়া বেগম',
    'মাতার এনআইডি': '১৯৮১১৫৯২৬১২৩৪৫৬০৪',
    'আইনগত অভিভাবক': 'মোবারক আলী',
    'বর্তমান ঠিকানা': 'গ্রাম: বানিয়ারছড়া, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    'স্থায়ী ঠিকানা': 'গ্রাম: বানিয়ারছড়া, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    '৪র্থ বিষয়': 'কৃষি শিক্ষা',
    'উপবৃত্তি প্রাপ্ত': 'হ্যাঁ',
    'উপবৃত্তি ক্যাটাগরি': 'সাধারণ উপবৃত্তি',
    'মন্তব্য': 'বিতর্ক ক্লাবের সদস্য'
  },
  {
    'রোল': '০১',
    'শিক্ষার্থীর নাম': 'সাদিয়া বিনতে সুলতান',
    'শ্রেণি': '৯ম',
    'শাখা': 'ক',
    'বিভাগ': 'বিজ্ঞান',
    'শিক্ষাবর্ষ': '২০২৬',
    'লিঙ্গ': 'মহিলা',
    'জন্ম তারিখ': '১৮/০৯/২০১০',
    'জন্ম নিবন্ধন নম্বর': '২০১০১৫৯২৬১২৩৪৫৬০৫',
    'রক্তের গ্রুপ': 'O+',
    'ধর্ম': 'ইসলাম',
    'অভিভাবকের মোবাইল': '০১৮১২৩৪৫৬০৫',
    'পিতার নাম': 'সুলতান মাহমুদ',
    'পিতার এনআইডি': '১৯৭৬১৫৯২৬১২৩৪৫৬০৫',
    'মাতার নাম': 'নাছিমা আক্তার',
    'মাতার এনআইডি': '১৯৮০১৫৯২৬১২৩৪৫৬০৫',
    'আইনগত অভিভাবক': 'সুলতান মাহমুদ',
    'বর্তমান ঠিকানা': 'গ্রাম: পূর্ব বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    'স্থায়ী ঠিকানা': 'গ্রাম: পূর্ব বরইতলী, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    '৪র্থ বিষয়': 'উচ্চতর গণিত',
    'উপবৃত্তি প্রাপ্ত': 'হ্যাঁ',
    'উপবৃত্তি ক্যাটাগরি': 'মেধাভিত্তিক উপবৃত্তি',
    'মন্তব্য': 'গণিত অলিম্পিয়াড অংশগ্রহণকারী'
  },
  {
    'রোল': '০২',
    'শিক্ষার্থীর নাম': 'তানভীর আহমেদ রিফাত',
    'শ্রেণি': '৯ম',
    'শাখা': 'খ',
    'বিভাগ': 'ব্যবসায় শিক্ষা',
    'শিক্ষাবর্ষ': '২০২৬',
    'লিঙ্গ': 'পুরুষ',
    'জন্ম তারিখ': '২৫/০১/২০১০',
    'জন্ম নিবন্ধন নম্বর': '২০১০১৫৯২৬১২৩৪৫৬০৬',
    'রক্তের গ্রুপ': 'A+',
    'ধর্ম': 'ইসলাম',
    'অভিভাবকের মোবাইল': '০১৮১২৩৪৫৬০৬',
    'পিতার নাম': 'কামরুল আহসান',
    'পিতার এনআইডি': '১৯৭৫১৫৯২৬১২৩৪৫৬০৬',
    'মাতার নাম': 'শাহিনুর বেগম',
    'মাতার এনআইডি': '১৯৭৯১৫৯২৬১২৩৪৫৬০৬',
    'আইনগত অভিভাবক': 'কামরুল আহসান',
    'বর্তমান ঠিকানা': 'গ্রাম: কলেজ রোড, ডাকঘর: চকরিয়া, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    'স্থায়ী ঠিকানা': 'গ্রাম: কলেজ রোড, ডাকঘর: চকরিয়া, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    '৪র্থ বিষয়': 'কম্পিউটার শিক্ষা',
    'উপবৃত্তি প্রাপ্ত': 'না',
    'উপবৃত্তি ক্যাটাগরি': '',
    'মন্তব্য': ''
  },
  {
    'রোল': '০১',
    'শিক্ষার্থীর নাম': 'শ্রাবন্তী দাশ তিথি',
    'শ্রেণি': '১০ম',
    'শাখা': 'ক',
    'বিভাগ': 'বিজ্ঞান',
    'শিক্ষাবর্ষ': '২০২৬',
    'লিঙ্গ': 'মহিলা',
    'জন্ম তারিখ': '১৪/০৮/২০০৯',
    'জন্ম নিবন্ধন নম্বর': '২০০৯১৫৯২৬১২৩৪৫৬০৭',
    'রক্তের গ্রুপ': 'B+',
    'ধর্ম': 'হিন্দু',
    'অভিভাবকের মোবাইল': '০১৭১২৩৪৫৬০৭',
    'পিতার নাম': 'সুধীর চন্দ্র দাশ',
    'পিতার এনআইডি': '১৯৭৪১৫৯২৬১২৩৪৫৬০৭',
    'মাতার নাম': 'সন্ধ্যা রানী দাশ',
    'মাতার এনআইডি': '১৯৭৮১৫৯২৬১২৩৪৫৬০৭',
    'আইনগত অভিভাবক': 'সুধীর চন্দ্র দাশ',
    'বর্তমান ঠিকানা': 'গ্রাম: মাস্টারপাড়া, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    'স্থায়ী ঠিকানা': 'গ্রাম: মাস্টারপাড়া, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    '৪র্থ বিষয়': 'উচ্চতর গণিত',
    'উপবৃত্তি প্রাপ্ত': 'হ্যাঁ',
    'উপবৃত্তি ক্যাটাগরি': 'মেধাভিত্তিক উপবৃত্তি',
    'মন্তব্য': 'এসএসসি পরীক্ষার্থী ২০২৬'
  },
  {
    'রোল': '০২',
    'শিক্ষার্থীর নাম': 'ফারহানা আক্তার মিলি',
    'শ্রেণি': '১০ম',
    'শাখা': 'খ',
    'বিভাগ': 'মানবিক',
    'শিক্ষাবর্ষ': '২০২৬',
    'লিঙ্গ': 'মহিলা',
    'জন্ম তারিখ': '০৩/১২/২০০৯',
    'জন্ম নিবন্ধন নম্বর': '২০০৯১৫৯২৬১২৩৪৫৬০৮',
    'রক্তের গ্রুপ': 'AB-',
    'ধর্ম': 'ইসলাম',
    'অভিভাবকের মোবাইল': '০১৮১২৩৪৫৬০৮',
    'পিতার নাম': 'মফিজুর রহমান',
    'পিতার এনআইডি': '১৯৭৩১৫৯২৬১২৩৪৫৬০৮',
    'মাতার নাম': 'হাসিনা বেগম',
    'মাতার এনআইডি': '১৯৭৭১৫৯২৬১২৩৪৫৬০৮',
    'আইনগত অভিভাবক': 'মফিজুর রহমান',
    'বর্তমান ঠিকানা': 'গ্রাম: গোয়াবাগান, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    'স্থায়ী ঠিকানা': 'গ্রাম: গোয়াবাগান, ডাকঘর: বরইতলী, উপজেলা: চকরিয়া, জেলা: কক্সবাজার',
    '৪র্থ বিষয়': 'কৃষি শিক্ষা',
    'উপবৃত্তি প্রাপ্ত': 'হ্যাঁ',
    'উপবৃত্তি ক্যাটাগরি': 'সাধারণ উপবৃত্তি',
    'মন্তব্য': 'সাংস্কৃতিক প্রতিযোগিতায় পুরস্কৃত'
  }
];

// ─── 2. ENGLISH SAMPLE DATA (Pure English Headers & Data) ───────────────────
export const SAMPLE_STUDENTS_EN = [
  {
    Roll: '01',
    Name: 'Tahmid Islam Chowdhury',
    Class: '6th',
    Section: 'A',
    Group: 'General',
    Session: '2026',
    Gender: 'Male',
    DOB: '2013-03-15',
    BirthRegNo: '20131592612345601',
    BloodGroup: 'B+',
    Religion: 'Islam',
    Mobile: '01812345601',
    FatherName: 'Nurul Islam Chowdhury',
    FatherNID: '19801592612345601',
    MotherName: 'Amena Begum',
    MotherNID: '19841592612345601',
    Guardian: 'Nurul Islam Chowdhury',
    CurrentAddress: 'South Baraitali, Chakaria, Coxs Bazar',
    PermanentAddress: 'South Baraitali, Chakaria, Coxs Bazar',
    OptionalSubject: 'Agriculture',
    IsStipend: 'Yes',
    StipendCategory: 'General Stipend',
    Remarks: 'Regular Student'
  },
  {
    Roll: '02',
    Name: 'Afrin Jahan Sumaiya',
    Class: '6th',
    Section: 'A',
    Group: 'General',
    Session: '2026',
    Gender: 'Female',
    DOB: '2013-07-22',
    BirthRegNo: '20131592612345602',
    BloodGroup: 'O+',
    Religion: 'Islam',
    Mobile: '01812345602',
    FatherName: 'Anwar Hossain',
    FatherNID: '19791592612345602',
    MotherName: 'Jahanara Parvin',
    MotherNID: '19831592612345602',
    Guardian: 'Anwar Hossain',
    CurrentAddress: 'Middle Baraitali, Chakaria, Coxs Bazar',
    PermanentAddress: 'Middle Baraitali, Chakaria, Coxs Bazar',
    OptionalSubject: 'Home Science',
    IsStipend: 'Yes',
    StipendCategory: 'Merit Stipend',
    Remarks: 'Class Captain'
  },
  {
    Roll: '01',
    Name: 'Anindya Paul Dip',
    Class: '7th',
    Section: 'A',
    Group: 'General',
    Session: '2026',
    Gender: 'Male',
    DOB: '2012-05-10',
    BirthRegNo: '20121592612345603',
    BloodGroup: 'A+',
    Religion: 'Hindu',
    Mobile: '01712345603',
    FatherName: 'Sunil Kumar Paul',
    FatherNID: '19781592612345603',
    MotherName: 'Suchitra Sen Paul',
    MotherNID: '19821592612345603',
    Guardian: 'Sunil Kumar Paul',
    CurrentAddress: 'Shantibazar, Harbang, Chakaria, Coxs Bazar',
    PermanentAddress: 'Shantibazar, Harbang, Chakaria, Coxs Bazar',
    OptionalSubject: 'Agriculture',
    IsStipend: 'No',
    StipendCategory: '',
    Remarks: 'Science Fair 1st Prize'
  },
  {
    Roll: '01',
    Name: 'Mahmudul Hasan Sifat',
    Class: '8th',
    Section: 'A',
    Group: 'General',
    Session: '2026',
    Gender: 'Male',
    DOB: '2011-11-05',
    BirthRegNo: '20111592612345604',
    BloodGroup: 'AB+',
    Religion: 'Islam',
    Mobile: '01912345604',
    FatherName: 'Mobarak Ali',
    FatherNID: '19771592612345604',
    MotherName: 'Rokeya Begum',
    MotherNID: '19811592612345604',
    Guardian: 'Mobarak Ali',
    CurrentAddress: 'Baniarchara, Baraitali, Chakaria, Coxs Bazar',
    PermanentAddress: 'Baniarchara, Baraitali, Chakaria, Coxs Bazar',
    OptionalSubject: 'Agriculture',
    IsStipend: 'Yes',
    StipendCategory: 'General Stipend',
    Remarks: 'Debate Club Member'
  },
  {
    Roll: '01',
    Name: 'Sadia Binte Sultan',
    Class: '9th',
    Section: 'A',
    Group: 'Science',
    Session: '2026',
    Gender: 'Female',
    DOB: '2010-09-18',
    BirthRegNo: '20101592612345605',
    BloodGroup: 'O+',
    Religion: 'Islam',
    Mobile: '01812345605',
    FatherName: 'Sultan Mahmud',
    FatherNID: '19761592612345605',
    MotherName: 'Nasima Akhter',
    MotherNID: '19801592612345605',
    Guardian: 'Sultan Mahmud',
    CurrentAddress: 'East Baraitali, Chakaria, Coxs Bazar',
    PermanentAddress: 'East Baraitali, Chakaria, Coxs Bazar',
    OptionalSubject: 'Higher Math',
    IsStipend: 'Yes',
    StipendCategory: 'Merit Stipend',
    Remarks: 'Math Olympiad'
  },
  {
    Roll: '02',
    Name: 'Tanvir Ahmed Rifat',
    Class: '9th',
    Section: 'B',
    Group: 'Business Studies',
    Session: '2026',
    Gender: 'Male',
    DOB: '2010-01-25',
    BirthRegNo: '20101592612345606',
    BloodGroup: 'A+',
    Religion: 'Islam',
    Mobile: '01812345606',
    FatherName: 'Kamrul Ahsan',
    FatherNID: '19751592612345606',
    MotherName: 'Shahinur Begum',
    MotherNID: '19791592612345606',
    Guardian: 'Kamrul Ahsan',
    CurrentAddress: 'College Road, Chakaria, Coxs Bazar',
    PermanentAddress: 'College Road, Chakaria, Coxs Bazar',
    OptionalSubject: 'Computer',
    IsStipend: 'No',
    StipendCategory: '',
    Remarks: ''
  },
  {
    Roll: '01',
    Name: 'Srabanti Das Tithi',
    Class: '10th',
    Section: 'A',
    Group: 'Science',
    Session: '2026',
    Gender: 'Female',
    DOB: '2009-08-14',
    BirthRegNo: '20091592612345607',
    BloodGroup: 'B+',
    Religion: 'Hindu',
    Mobile: '01712345607',
    FatherName: 'Sudhir Chandra Das',
    FatherNID: '19741592612345607',
    MotherName: 'Sandhya Rani Das',
    MotherNID: '19781592612345607',
    Guardian: 'Sudhir Chandra Das',
    CurrentAddress: 'Masterpara, Baraitali, Chakaria, Coxs Bazar',
    PermanentAddress: 'Masterpara, Baraitali, Chakaria, Coxs Bazar',
    OptionalSubject: 'Higher Math',
    IsStipend: 'Yes',
    StipendCategory: 'Merit Stipend',
    Remarks: 'SSC Candidate 2026'
  },
  {
    Roll: '02',
    Name: 'Farhana Akhter Mili',
    Class: '10th',
    Section: 'B',
    Group: 'Humanities',
    Session: '2026',
    Gender: 'Female',
    DOB: '2009-12-03',
    BirthRegNo: '20091592612345608',
    BloodGroup: 'AB-',
    Religion: 'Islam',
    Mobile: '01812345608',
    FatherName: 'Mofizur Rahman',
    FatherNID: '19731592612345608',
    MotherName: 'Hasina Begum',
    MotherNID: '19771592612345608',
    Guardian: 'Mofizur Rahman',
    CurrentAddress: 'Goabagan, Baraitali, Chakaria, Coxs Bazar',
    PermanentAddress: 'Goabagan, Baraitali, Chakaria, Coxs Bazar',
    OptionalSubject: 'Agriculture',
    IsStipend: 'Yes',
    StipendCategory: 'General Stipend',
    Remarks: 'Cultural Prize Winner'
  }
];

// ─── 3. FIELD SPECIFICATION GUIDE ──────────────────────────────────────────
export const FIELD_GUIDE_ROWS = [
  { field: 'Roll', bnName: 'রোল নম্বর', required: 'আবশ্যক', sampleEn: '01', sampleBn: '০১', desc: 'ইংরেজি (01, 02) বা বাংলা (০১, ০২) যেকোনো সংখ্যা' },
  { field: 'Name', bnName: 'শিক্ষার্থীর নাম', required: 'আবশ্যক', sampleEn: 'Tahmid Islam', sampleBn: 'তাহমিদ ইসলাম', desc: 'ইংরেজি বা বাংলা পূর্ণাঙ্গ নাম' },
  { field: 'Class', bnName: 'শ্রেণি', required: 'আবশ্যক', sampleEn: '8th / Class 8', sampleBn: '৮ম / অষ্টম', desc: '6th, 7th, 8th, 9th, 10th বা ৬ষ্ঠ, ৭ম, ৮ম, ৯ম, ১০ম' },
  { field: 'Section', bnName: 'শাখা', required: 'ঐচ্ছিক', sampleEn: 'A / B / C', sampleBn: 'ক / খ / পদ্মা', desc: 'A, B, C বা ক, খ, গ, পদ্মা, মেঘনা (ডিফল্ট: A)' },
  { field: 'Group', bnName: 'বিভাগ / গ্রুপ', required: 'ঐচ্ছিক', sampleEn: 'Science / Arts', sampleBn: 'বিজ্ঞান / মানবিক', desc: 'সাধারণ (General), বিজ্ঞান (Science), মানবিক (Humanities), ব্যবসায় শিক্ষা (Commerce)' },
  { field: 'Session', bnName: 'শিক্ষাবর্ষ', required: 'ঐচ্ছিক', sampleEn: '2026', sampleBn: '২০২৬', desc: 'শিক্ষাবর্ষ বছর (2026 বা ২০২৬)' },
  { field: 'Gender', bnName: 'লিঙ্গ', required: 'ঐচ্ছিক', sampleEn: 'Male / Female', sampleBn: 'পুরুষ / মহিলা', desc: 'পুরুষ / মহিলা / অন্যান্য বা Male / Female / Boy / Girl' },
  { field: 'DOB', bnName: 'জন্ম তারিখ', required: 'ঐচ্ছিক', sampleEn: '2011-04-12', sampleBn: '১২/০৪/২০১১', desc: 'YYYY-MM-DD অথবা DD/MM/YYYY (বাংলা বা ইংরেজি সংখ্যায়)' },
  { field: 'BirthRegNo', bnName: 'জন্ম নিবন্ধন (BRN)', required: 'ঐচ্ছিক', sampleEn: '20111592612345601', sampleBn: '২০১১১৫৯২৬১২৩৪৫৬০১', desc: '১৭ ডিজিটের অনলাইন জন্ম নিবন্ধন নম্বর' },
  { field: 'BloodGroup', bnName: 'রক্তের গ্রুপ', required: 'ঐচ্ছিক', sampleEn: 'B+ / O+', sampleBn: 'বি+ / ও+', desc: 'A+, B+, O+, AB+, A-, B-, O-, AB- (বা এ+, বি+, ও+)' },
  { field: 'Religion', bnName: 'ধর্ম', required: 'ঐচ্ছিক', sampleEn: 'Islam / Hindu', sampleBn: 'ইসলাম / হিন্দু', desc: 'ইসলাম (Islam), হিন্দু (Hindu), বৌদ্ধ (Buddhist), খ্রিস্টান (Christian)' },
  { field: 'Mobile', bnName: 'অভিভাবকের মোবাইল', required: 'প্রস্তাবিত', sampleEn: '01812345601', sampleBn: '০১৮১২৩৪৫৬০১', desc: '১১ ডিজিটের মোবাইল নম্বর (বাংলা বা ইংরেজিতে)' },
  { field: 'FatherName', bnName: 'পিতার নাম', required: 'ঐচ্ছিক', sampleEn: 'Nurul Islam', sampleBn: 'নুরুল ইসলাম', desc: 'পিতার পূর্ণাঙ্গ নাম (ইংরেজি বা বাংলায়)' },
  { field: 'FatherNID', bnName: 'পিতার এনআইডি', required: 'ঐচ্ছিক', sampleEn: '19801592612345601', sampleBn: '১৯৮০১৫৯২৬১২৩৪৫৬০১', desc: 'পিতার জাতীয় পরিচয়পত্র নম্বর' },
  { field: 'MotherName', bnName: 'মাতার নাম', required: 'ঐচ্ছিক', sampleEn: 'Amena Begum', sampleBn: 'আমেনা বেগম', desc: 'মাতার পূর্ণাঙ্গ নাম (ইংরেজি বা বাংলায়)' },
  { field: 'MotherNID', bnName: 'মাতার এনআইডি', required: 'ঐচ্ছিক', sampleEn: '19841592612345601', sampleBn: '১৯৮৪১৫৯২৬১২৩৪৫৬০১', desc: 'মাতার জাতীয় পরিচয়পত্র নম্বর' },
  { field: 'Guardian', bnName: 'আইনগত অভিভাবক', required: 'ঐচ্ছিক', sampleEn: 'Nurul Islam', sampleBn: 'নুরুল ইসলাম', desc: 'আইনগত অভিভাবকের নাম (ইংরেজি বা বাংলায়)' },
  { field: 'CurrentAddress', bnName: 'বর্তমান ঠিকানা', required: 'ঐচ্ছিক', sampleEn: 'Baraitali, Chakaria', sampleBn: 'বরইতলী, চকরিয়া', desc: 'বর্তমান যোগাযোগের পূর্ণাঙ্গ ঠিকানা' },
  { field: 'PermanentAddress', bnName: 'স্থায়ী ঠিকানা', required: 'ঐচ্ছিক', sampleEn: 'Baraitali, Chakaria', sampleBn: 'বরইতলী, চকরিয়া', desc: 'স্থায়ী বাসস্থানের পূর্ণাঙ্গ ঠিকানা' },
  { field: 'OptionalSubject', bnName: '৪র্থ / ঐচ্ছিক বিষয়', required: 'ঐচ্ছিক', sampleEn: 'Higher Math / Agri', sampleBn: 'উচ্চতর গণিত / কৃষি', desc: 'উচ্চতর গণিত, কৃষি শিক্ষা, গার্হস্থ্য বিজ্ঞান ইত্যাদি' },
  { field: 'IsStipend', bnName: 'উপবৃত্তি সুবিধাভোগী', required: 'ঐচ্ছিক', sampleEn: 'Yes / No', sampleBn: 'হ্যাঁ / না', desc: 'হ্যাঁ / না অথবা Yes / No / 1 / 0' },
  { field: 'StipendCategory', bnName: 'উপবৃত্তি ক্যাটাগরি', required: 'ঐচ্ছিক', sampleEn: 'General / Merit', sampleBn: 'সাধারণ / মেধাভিত্তিক', desc: 'সাধারণ উপবৃত্তি, মেধাভিত্তিক উপবৃত্তি ইত্যাদি' },
  { field: 'Remarks', bnName: 'মন্তব্য', required: 'ঐচ্ছিক', sampleEn: 'Regular', sampleBn: 'নিয়মিত শিক্ষার্থী', desc: 'বিশেষ কোনো অর্জন, নোট বা মন্তব্য' }
];

interface StudentBulkImportPanelProps {
  onSuccess?: (count: number) => void;
  compactMode?: boolean;
}

export default function StudentBulkImportPanel({ onSuccess, compactMode = false }: StudentBulkImportPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [selectedSaveMode, setSelectedSaveMode] = useState<'merge' | 'replace'>('merge');
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [searchPreview, setSearchPreview] = useState('');
  const [gradePreviewFilter, setGradePreviewFilter] = useState('all');
  const [showGuide, setShowGuide] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats of current DB
  const [currentDbStats, setCurrentDbStats] = useState({ total: 0, byGrade: {} as Record<string, number> });

  const loadDbStats = () => {
    if (typeof window !== 'undefined') {
      const all = studentService.getAllStudents();
      const byGrade: Record<string, number> = {};
      all.forEach((s) => {
        const g = s.grade || s.gradeBn || 'অন্যান্য';
        byGrade[g] = (byGrade[g] || 0) + 1;
      });
      setCurrentDbStats({ total: all.length, byGrade });
    }
  };

  useEffect(() => {
    loadDbStats();
  }, []);

  // ─── DOWNLOAD EXCEL (BENGALI OR ENGLISH FORMAT) ──────────────────────────
  const downloadExcelTemplate = (lang: 'bn' | 'en') => {
    try {
      const data = lang === 'bn' ? SAMPLE_STUDENTS_BN : SAMPLE_STUDENTS_EN;
      const wsStudents = XLSX.utils.json_to_sheet(data);

      wsStudents['!cols'] = [
        { wch: 10 }, // Roll
        { wch: 28 }, // Name
        { wch: 12 }, // Class
        { wch: 10 }, // Section
        { wch: 18 }, // Group
        { wch: 14 }, // Session
        { wch: 12 }, // Gender
        { wch: 16 }, // DOB
        { wch: 24 }, // BirthRegNo
        { wch: 14 }, // BloodGroup
        { wch: 14 }, // Religion
        { wch: 18 }, // Mobile
        { wch: 26 }, // FatherName
        { wch: 22 }, // FatherNID
        { wch: 24 }, // MotherName
        { wch: 22 }, // MotherNID
        { wch: 26 }, // Guardian
        { wch: 38 }, // CurrentAddress
        { wch: 38 }, // PermanentAddress
        { wch: 20 }, // OptionalSubject
        { wch: 16 }, // IsStipend
        { wch: 22 }, // StipendCategory
        { wch: 28 }, // Remarks
      ];

      const wsGuide = XLSX.utils.json_to_sheet(
        FIELD_GUIDE_ROWS.map((g) => ({
          'কলাম (English)': g.field,
          'বাংলা শিরোনাম (Bengali)': g.bnName,
          'স্ট্যাটাস (Status)': g.required,
          'নমুনা মান (বাংলা)': g.sampleBn,
          'নমুনা মান (English)': g.sampleEn,
          'নিয়মাবলী (Instructions)': g.desc
        }))
      );
      wsGuide['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 55 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsStudents, lang === 'bn' ? 'শিক্ষার্থী_তালিকা' : 'Students');
      XLSX.utils.book_append_sheet(wb, wsGuide, 'Field_Guide');

      const fileName = lang === 'bn' 
        ? `Student_Bulk_Import_Template_Bengali_২০২৬.xlsx`
        : `Student_Bulk_Import_Template_English_2026.xlsx`;

      XLSX.writeFile(wb, fileName);
      setAlertInfo({
        type: 'success',
        message: `${lang === 'bn' ? 'বাংলা' : 'ইংরেজি'} কলাম সম্বলিত এক্সেল টেমপ্লেট সফলভাবে ডাউনলোড হয়েছে! তথ্য পূরণ করে নিচে আপলোড করুন।`
      });
    } catch (e: any) {
      console.error(e);
      setAlertInfo({ type: 'error', message: 'এক্সেল তৈরি ব্যর্থ: ' + (e.message || '') });
    }
  };

  // ─── DOWNLOAD CSV (BENGALI OR ENGLISH FORMAT) ────────────────────────────
  const downloadCsvTemplate = (lang: 'bn' | 'en') => {
    try {
      const data = lang === 'bn' ? SAMPLE_STUDENTS_BN : SAMPLE_STUDENTS_EN;
      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((h) => `"${(row as any)[h] || ''}"`).join(','));
      const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = lang === 'bn'
        ? `Student_Bulk_Import_Template_Bengali_২০২৬.csv`
        : `Student_Bulk_Import_Template_English_2026.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setAlertInfo({
        type: 'success',
        message: `${lang === 'bn' ? 'বাংলা' : 'ইংরেজি'} কলাম সম্বলিত CSV টেমপ্লেট সফলভাবে ডাউনলোড হয়েছে!`
      });
    } catch (e: any) {
      console.error(e);
      setAlertInfo({ type: 'error', message: 'CSV তৈরি ব্যর্থ: ' + (e.message || '') });
    }
  };

  // ─── 4. INTELLIGENT BILINGUAL COLUMN HEADER MAPPER ────────────────────────
  const normalizeKey = (key: string): string => {
    const k = key.toLowerCase().trim().replace(/[\s_\-.]+/g, '');
    if (k.includes('roll') || k.includes('রোল') || k.includes('ক্রমিক')) return 'roll';
    if (k.includes('studentname') || k.includes('name') || k.includes('নাম') || k.includes('শিক্ষার্থী')) return 'name';
    if (k.includes('grade') || k.includes('class') || k.includes('শ্রেণি') || k.includes('শ্রেণী')) return 'grade';
    if (k.includes('section') || k.includes('branch') || k.includes('শাখা') || k.includes('সেকশন')) return 'section';
    if (k.includes('group') || k.includes('বিভাগ') || k.includes('গ্রুপ') || k.includes('stream')) return 'group';
    if (k.includes('session') || k.includes('year') || k.includes('শিক্ষাবর্ষ') || k.includes('বছর')) return 'session';
    if (k.includes('gender') || k.includes('sex') || k.includes('লিঙ্গ') || k.includes('ছাত্রছাত্রী')) return 'gender';
    if (k.includes('dob') || k.includes('birthdate') || k.includes('জন্মতারিখ') || k.includes('তারিখ')) return 'dob';
    if (k.includes('birthreg') || k.includes('brn') || k.includes('জন্মনিবন্ধন') || k.includes('সনদ')) return 'birthRegNo';
    if (k.includes('blood') || k.includes('রক্ত')) return 'bloodGroup';
    if (k.includes('religion') || k.includes('ধর্ম')) return 'religion';
    if (k.includes('mobile') || k.includes('phone') || k.includes('মোবাইল') || k.includes('ফোন')) return 'mobile';
    if (k.includes('fathernid') || k.includes('পিতারএনআইডি') || k.includes('পিতারজাতীয়')) return 'fatherNid';
    if (k.includes('father') || k.includes('পিতা') || k.includes('বাবারনাম')) return 'fatherName';
    if (k.includes('mothernid') || k.includes('মাতারএনআইডি') || k.includes('মাতারজাতীয়')) return 'motherNid';
    if (k.includes('mother') || k.includes('মাতা') || k.includes('মায়েরনাম')) return 'motherName';
    if (k.includes('guardian') || k.includes('অভিভাবক')) return 'guardian';
    if (k.includes('permanentaddress') || k.includes('স্থায়ীঠিকানা') || k.includes('স্থায়িঠিকানা')) return 'permanentAddress';
    if (k.includes('currentaddress') || k.includes('address') || k.includes('ঠিকানা') || k.includes('বর্তমানঠিকানা')) return 'currentAddress';
    if (k.includes('optional') || k.includes('ঐচ্ছিক') || k.includes('৪র্থ') || k.includes('চতুর্থ')) return 'optionalSubject';
    if (k.includes('isstipend') || k.includes('stipendstatus') || k.includes('উপবৃত্তিপ্রাপ্ত') || k.includes('উপবৃত্তি')) return 'isStipend';
    if (k.includes('stipendcat') || k.includes('উপবৃত্তিক্যাটাগরি') || k.includes('উপবৃত্তিধরন')) return 'stipendCategory';
    if (k.includes('remark') || k.includes('note') || k.includes('মন্তব্য') || k.includes('বিশেষ')) return 'remarks';
    return k;
  };

  // ─── 5. ROBUST BILINGUAL VALUE NORMALIZER ──────────────────────────────────
  const normalizeStudentRow = (rawRow: Record<string, any>, idx: number): Student => {
    const row: Record<string, string> = {};
    Object.keys(rawRow).forEach((k) => {
      const val = rawRow[k];
      const normKey = normalizeKey(k);
      row[normKey] = val !== null && val !== undefined ? String(val).trim() : '';
    });

    // 1. Roll: accepts '০১', '০২' (Bengali) OR '01', '1' (English)
    const rawRoll = row['roll'] || String(idx + 1);
    const rollDigits = bnToEnDigits(rawRoll).replace(/[^0-9]/g, '');
    const rollVal = rollDigits ? rollDigits.padStart(2, '0') : String(idx + 1).padStart(2, '0');

    // 2. Name: accepts English or Bengali name
    const nameVal = row['name'] || `শিক্ষার্থী ${idx + 1}`;

    // 3. Class / Grade: accepts '6th', 'Class 6', '৬ষ্ঠ', 'ষষ্ঠ', '6', '৬' etc.
    const rawGrade = (row['grade'] || '6th').toLowerCase();
    const gradeClean = bnToEnDigits(rawGrade);
    let gradeVal = '6th';
    let gradeBn = '৬ষ্ঠ শ্রেণি';

    if (gradeClean.includes('7') || rawGrade.includes('৭') || rawGrade.includes('seven') || rawGrade.includes('সপ্তম')) {
      gradeVal = '7th';
      gradeBn = '৭ম শ্রেণি';
    } else if (gradeClean.includes('8') || rawGrade.includes('৮') || rawGrade.includes('eight') || rawGrade.includes('অষ্টম')) {
      gradeVal = '8th';
      gradeBn = '৮ম শ্রেণি';
    } else if (gradeClean.includes('9') || rawGrade.includes('৯') || rawGrade.includes('nine') || rawGrade.includes('নবম')) {
      gradeVal = '9th';
      gradeBn = '৯ম শ্রেণি';
    } else if (gradeClean.includes('10') || rawGrade.includes('১০') || rawGrade.includes('ten') || rawGrade.includes('দশম')) {
      gradeVal = '10th';
      gradeBn = '১০ম শ্রেণি';
    } else {
      gradeVal = '6th';
      gradeBn = '৬ষ্ঠ শ্রেণি';
    }

    // 4. Section: accepts 'A', 'B', 'C', 'D' OR 'ক', 'খ', 'গ', 'ঘ', 'পদ্মা', 'মেঘনা', 'যমুনা'
    let rawSec = (row['section'] || 'A').toUpperCase().trim();
    if (rawSec === 'ক' || rawSec.includes('পদ্মা') || rawSec.includes('PADMA')) rawSec = 'A';
    else if (rawSec === 'খ' || rawSec.includes('মেঘনা') || rawSec.includes('MEGHNA')) rawSec = 'B';
    else if (rawSec === 'গ' || rawSec.includes('যমুনা') || rawSec.includes('JAMUNA')) rawSec = 'C';
    else if (rawSec === 'ঘ' || rawSec.includes('কর্ণফুলী') || rawSec.includes('KARNAFULI')) rawSec = 'D';
    else if (!['A', 'B', 'C', 'D'].includes(rawSec)) rawSec = rawSec.slice(0, 1) || 'A';

    // 5. Group: accepts 'Science' / 'বিজ্ঞান', 'Humanities' / 'মানবিক', 'Commerce' / 'ব্যবসায় শিক্ষা', 'General' / 'সাধারণ'
    let rawGroup = (row['group'] || '').trim();
    let groupVal = ['9th', '10th'].includes(gradeVal) ? 'বিজ্ঞান' : 'সাধারণ';
    const gLower = rawGroup.toLowerCase();

    if (rawGroup.includes('বিজ্ঞান') || gLower.includes('science')) {
      groupVal = 'বিজ্ঞান';
    } else if (rawGroup.includes('মানবিক') || gLower.includes('humanities') || gLower.includes('arts')) {
      groupVal = 'মানবিক';
    } else if (rawGroup.includes('ব্যবসায়') || gLower.includes('commerce') || gLower.includes('business')) {
      groupVal = 'ব্যবসায় শিক্ষা';
    } else if (rawGroup.includes('সাধারণ') || gLower.includes('general')) {
      groupVal = 'সাধারণ';
    } else if (!['9th', '10th'].includes(gradeVal)) {
      groupVal = 'সাধারণ';
    }

    // 6. Gender: accepts 'পুরুষ', 'মহিলা', 'ছেলে', 'মেয়ে', 'ছাত্র', 'ছাত্রী', 'Male', 'Female', 'Boy', 'Girl'
    let rawGender = (row['gender'] || 'পুরুষ').toLowerCase().trim();
    let genderVal = 'পুরুষ';
    if (rawGender.includes('মহিলা') || rawGender.includes('মেয়ে') || rawGender.includes('ছাত্রী') || rawGender.includes('female') || rawGender === 'f' || rawGender.includes('girl')) {
      genderVal = 'মহিলা';
    } else if (rawGender.includes('অন্যান্য') || rawGender.includes('other')) {
      genderVal = 'অন্যান্য';
    }

    // 7. Religion: accepts 'ইসলাম', 'হিন্দু', 'বৌদ্ধ', 'খ্রিস্টান', 'Islam', 'Muslim', 'Hindu', 'Buddhist', 'Christian'
    let rawRel = (row['religion'] || 'ইসলাম').toLowerCase().trim();
    let religionVal = 'ইসলাম';
    if (rawRel.includes('হিন্দু') || rawRel.includes('সনাতন') || rawRel.includes('hindu')) {
      religionVal = 'হিন্দু';
    } else if (rawRel.includes('বৌদ্ধ') || rawRel.includes('buddhist')) {
      religionVal = 'বৌদ্ধ';
    } else if (rawRel.includes('খ্রিস্টান') || rawRel.includes('christian')) {
      religionVal = 'খ্রিস্টান';
    }

    // 8. Blood Group: accepts 'A+', 'B+', 'O+', 'AB+' OR 'এ+', 'বি+', 'ও+', 'এবি+'
    let rawBg = (row['bloodGroup'] || '').toUpperCase().trim();
    rawBg = rawBg.replace(/এবি/g, 'AB').replace(/এ/g, 'A').replace(/বি/g, 'B').replace(/ও/g, 'O').replace(/পজিটিভ/g, '+').replace(/নেগেটিভ/g, '-');
    let bloodGroupVal = '';
    if (rawBg.includes('A+') || rawBg.includes('AB+') || rawBg.includes('B+') || rawBg.includes('O+') ||
        rawBg.includes('A-') || rawBg.includes('AB-') || rawBg.includes('B-') || rawBg.includes('O-')) {
      bloodGroupVal = rawBg;
    }

    // 9. Stipend: accepts 'হ্যাঁ', 'না', 'Yes', 'No', 'True', 'False', '1', '0'
    let rawStipend = (row['isStipend'] || '').toLowerCase().trim();
    const isStipendVal = rawStipend === 'হ্যাঁ' || rawStipend === 'yes' || rawStipend === 'true' || rawStipend === '1' || rawStipend === 'প্রাপ্ত' || rawStipend === 'উপবৃত্তি';

    // 10. Mobile Number: converts Bengali digits to English digits
    let rawMobile = bnToEnDigits(row['mobile'] || '').replace(/[^0-9]/g, '');
    if (rawMobile.startsWith('880')) rawMobile = rawMobile.slice(2);
    if (rawMobile.length > 11) rawMobile = rawMobile.slice(-11);

    // 11. Birth Reg No & NIDs: convert Bengali digits to English digits
    const brnVal = bnToEnDigits(row['birthRegNo'] || '').replace(/[^0-9]/g, '');
    const fatherNidVal = bnToEnDigits(row['fatherNid'] || '').replace(/[^0-9]/g, '');
    const motherNidVal = bnToEnDigits(row['motherNid'] || '').replace(/[^0-9]/g, '');

    // 12. DOB: converts Bengali date digits to standard format
    const rawDob = bnToEnDigits(row['dob'] || '').trim();

    // 13. Session: converts to Bengali session
    const rawSession = row['session'] ? enToBnDigits(bnToEnDigits(row['session'])) : '২০২৬';

    // 14. Optional Subject: accepts English or Bengali
    let optSub = row['optionalSubject'] || '';
    const optLower = optSub.toLowerCase();
    if (optLower.includes('higher math') || optSub.includes('উচ্চতর গণিত')) optSub = 'উচ্চতর গণিত';
    else if (optLower.includes('agri') || optSub.includes('কৃষি')) optSub = 'কৃষি শিক্ষা';
    else if (optLower.includes('home science') || optSub.includes('গার্হস্থ্য')) optSub = 'গার্হস্থ্য বিজ্ঞান';
    else if (optLower.includes('computer') || optSub.includes('কম্পিউটার')) optSub = 'কম্পিউটার শিক্ষা';
    else if (!optSub) optSub = ['9th', '10th'].includes(gradeVal) ? 'উচ্চতর গণিত' : 'কৃষি শিক্ষা';

    const fatherVal = row['fatherName'] || row['guardian'] || '';
    const motherVal = row['motherName'] || '';
    const guardianVal = row['guardian'] || fatherVal || '';

    return {
      id: `STD-${gradeVal}-${rawSec}-${rollVal}`,
      roll: rollVal,
      name: nameVal,
      grade: gradeVal,
      gradeBn,
      section: rawSec,
      branch: rawSec,
      group: groupVal,
      session: rawSession,
      gender: genderVal,
      dob: rawDob,
      birthRegNo: brnVal,
      bloodGroup: bloodGroupVal,
      religion: religionVal,
      mobile: rawMobile,
      fatherName: fatherVal,
      fatherNid: fatherNidVal,
      motherName: motherVal,
      motherNid: motherNidVal,
      guardian: guardianVal,
      currentAddress: row['currentAddress'] || '',
      permanentAddress: row['permanentAddress'] || row['currentAddress'] || '',
      optionalSubject: optSub,
      isStipend: isStipendVal,
      stipendCategory: isStipendVal ? (row['stipendCategory'] || 'সাধারণ উপবৃত্তি') : '',
      stipendStatus: isStipendVal ? 'Active' : undefined,
      remarks: row['remarks'] || ''
    };
  };

  // ─── 6. FILE UPLOAD & PARSER (XLSX / XLS / CSV) ──────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);
    setAlertInfo(null);

    try {
      let rawJsonRows: any[] = [];

      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        // Find students sheet: 'শিক্ষার্থী_তালিকা', 'Students', or first sheet
        let sheetName = workbook.SheetNames[0];
        if (workbook.SheetNames.includes('শিক্ষার্থী_তালিকা')) sheetName = 'শিক্ষার্থী_তালিকা';
        else if (workbook.SheetNames.includes('Students')) sheetName = 'Students';

        const worksheet = workbook.Sheets[sheetName];
        rawJsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      } else {
        // CSV or TXT
        const text = await selectedFile.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const firstSheet = workbook.SheetNames[0];
        rawJsonRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
      }

      if (!rawJsonRows || rawJsonRows.length === 0) {
        throw new Error('ফাইলে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি!');
      }

      const validRows = rawJsonRows.filter((r) =>
        Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim().length > 0)
      );

      const parsed = validRows.map((row, idx) => normalizeStudentRow(row, idx));

      setParsedStudents(parsed);
      setAlertInfo({
        type: 'success',
        message: `ফাইল সফলভাবে পার্স হয়েছে! মোট ${parsed.length} জন শিক্ষার্থীর তথ্য পাওয়া গেছে (ইংরেজি ও বাংলা উভয়েই সমর্থিত)। নিচের প্রিভিউ যাচাই করে "ডাটাবেজে সংরক্ষণ করুন" বাটনে ক্লিক করুন।`
      });
    } catch (err: any) {
      console.error(err);
      setParsedStudents([]);
      setAlertInfo({
        type: 'error',
        message: 'ফাইল পার্স করতে ব্যর্থ: ' + (err.message || 'অনুগ্রহ করে সঠিক এক্সেল বা সিএসভি ফরম্যাট আপলোড করুন।')
      });
    } finally {
      setParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ─── 7. DUPLICATE ROLL DETECTION ─────────────────────────────────────────
  const duplicatesMap = useMemo(() => {
    const map = new Map<string, number>();
    parsedStudents.forEach((st) => {
      const key = `${st.grade}_${st.section}_${st.roll.replace(/^0+/, '')}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [parsedStudents]);

  // ─── 8. FILTERED PREVIEW STUDENTS ────────────────────────────────────────
  const filteredPreview = useMemo(() => {
    return parsedStudents.filter((st) => {
      const matchGrade = gradePreviewFilter === 'all' || st.grade === gradePreviewFilter;
      const q = searchPreview.toLowerCase();
      const matchSearch =
        !q ||
        st.name.toLowerCase().includes(q) ||
        st.roll.includes(q) ||
        (st.mobile && st.mobile.includes(q)) ||
        (st.fatherName && st.fatherName.toLowerCase().includes(q)) ||
        (st.birthRegNo && st.birthRegNo.includes(q));
      return matchGrade && matchSearch;
    });
  }, [parsedStudents, gradePreviewFilter, searchPreview]);

  // ─── 9. SAVE PARSED STUDENTS TO SYSTEM DATABASE ─────────────────────────
  const handleSaveToDatabase = () => {
    if (parsedStudents.length === 0) return;

    if (selectedSaveMode === 'replace') {
      const confirmed = window.confirm(
        `সতর্কতা: আপনি "সম্পূর্ণ প্রতিস্থাপন (Replace All)" নির্বাচন করেছেন!\nবিদ্যমান ${currentDbStats.total} জন শিক্ষার্থীর রেকর্ড মুছে নতুন ${parsedStudents.length} জন শিক্ষার্থী প্রতিস্থাপন করা হবে।\nআপনি কি নিশ্চিত?`
      );
      if (!confirmed) return;
    }

    try {
      studentService.saveBulkStudents(parsedStudents, selectedSaveMode === 'replace');

      auditTrailService.addLog({
        action: selectedSaveMode === 'replace' ? 'BULK_IMPORT_REPLACE' : 'BULK_IMPORT_MERGE',
        category: 'STUDENT',
        details: `বাল্ক এক্সেল/সিএসভি থেকে ${parsedStudents.length} জন শিক্ষার্থীর সম্পূর্ণ তথ্য ডাটাবেজে সংরক্ষণ করা হয়েছে (${selectedSaveMode === 'replace' ? 'সম্পূর্ণ প্রতিস্থাপন' : 'মার্জ ও আপডেট'})`,
        performedBy: 'অ্যাডমিন / প্রধান শিক্ষক',
        status: 'SUCCESS'
      });

      setAlertInfo({
        type: 'success',
        message: `অভিনন্দন! সফলভাবে ${parsedStudents.length} জন শিক্ষার্থীর সম্পূর্ণ তথ্য কেন্দ্রীয় ডাটাবেজে সংরক্ষিত ও হালনাগাদ হয়েছে!`
      });

      loadDbStats();
      if (onSuccess) {
        onSuccess(parsedStudents.length);
      }
    } catch (err: any) {
      console.error(err);
      setAlertInfo({
        type: 'error',
        message: 'ডাটাবেজে সংরক্ষণে সমস্যা হয়েছে: ' + (err.message || 'অজানা ত্রুটি')
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* 🌟 1. BANNER & STATS CARD */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold tracking-wide text-violet-100 border border-white/20">
              <Languages className="w-3.5 h-3.5 text-amber-300" />
              <span>বাংলা ও ইংরেজি উভয় ভাষায় ইনপুট সমর্থিত (Bilingual Engine)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              বাল্ক শিক্ষার্থী তথ্য আপলোড (ইংরেজি বা বাংলায়)
            </h2>
            <p className="text-xs sm:text-sm text-violet-100/90 max-w-2xl leading-relaxed">
              আপনি এক্সেলে সম্পূর্ণ <strong>বাংলায়</strong> (রোল, নাম, শ্রেণি, শাখা, মোবাইল...) অথবা সম্পূর্ণ <strong>ইংরেজিতে</strong> (Roll, Name, Class, Section, Mobile...) বা মিশ্রভাবে শিক্ষার্থীদের সকল তথ্য বাল্ক ইনপুট ও আপলোড করতে পারবেন।
            </p>
          </div>

          {/* Quick Counter */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 text-center min-w-[140px] shrink-0">
            <span className="text-[11px] font-bold text-violet-200 block">বর্তমান শিক্ষার্থী সংখ্যা</span>
            <span className="text-2xl font-black text-white font-mono">{currentDbStats.total} জন</span>
            <span className="text-[10px] text-emerald-300 font-semibold block mt-0.5">দ্বিভাষিক সিস্টেম সক্রিয়</span>
          </div>
        </div>
      </div>

      {/* 🌟 2. DOWNLOAD TEMPLATES (BILINGUAL OPTIONS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-violet-600" />
              ধাপ ১: পছন্দের ভাষায় নমুনা ফরম্যাট ডাউনলোড করুন
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              বাংলা বা ইংরেজি যেকোনো একটি ফরম্যাট ডাউনলোড করে শিক্ষার্থীদের তথ্য পূরণ করুন
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
          >
            <Info className="w-4 h-4 text-violet-600" />
            <span>ফিল্ড নির্দেশিকা {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
          </button>
        </div>

        {/* 2 Language Cards (Bengali & English) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bengali Format Card */}
          <div className="p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-md">বাংলা ফরম্যাট</span>
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">খাঁটি বাংলা হেডার ও ডাটা</span>
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">প্রস্তাবিত</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              কলামসমূহ: <span className="font-semibold text-slate-800 dark:text-slate-200">রোল, শিক্ষার্থীর নাম, শ্রেণি, শাখা, বিভাগ, মোবাইল, জন্ম নিবন্ধন...</span>
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadExcelTemplate('bn')}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> বাংলা Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => downloadCsvTemplate('bn')}
                className="py-2 px-3 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* English Format Card */}
          <div className="p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-md">English Format</span>
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Standard English Headers</span>
              </div>
              <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">Global</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Columns: <span className="font-semibold text-slate-800 dark:text-slate-200">Roll, Name, Class, Section, Group, Mobile, BirthRegNo...</span>
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadExcelTemplate('en')}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> English Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => downloadCsvTemplate('en')}
                className="py-2 px-3 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Field Reference Table */}
        {showGuide && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-violet-600" />
                সম্পূর্ণ কলাম ও ফিল্ড নির্দেশিকা (মোট {FIELD_GUIDE_ROWS.length} টি কলাম)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                ইংরেজি বা বাংলা যেকোনো কলাম হেডার ও মান স্বয়ংক্রিয়ভাবে শনাক্ত হবে
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold sticky top-0">
                  <tr>
                    <th className="p-2 border-b">কলামের নাম (English)</th>
                    <th className="p-2 border-b">বাংলা শিরোনাম</th>
                    <th className="p-2 border-b">আবশ্যিকতা</th>
                    <th className="p-2 border-b">নমুনা মান (বাংলা)</th>
                    <th className="p-2 border-b">নমুনা মান (English)</th>
                    <th className="p-2 border-b">নিয়মাবলী</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  {FIELD_GUIDE_ROWS.map((g, i) => (
                    <tr key={i} className="hover:bg-violet-50/40 dark:hover:bg-slate-800">
                      <td className="p-2 font-mono font-bold text-violet-700 dark:text-violet-400">{g.field}</td>
                      <td className="p-2 font-bold">{g.bnName}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.required === 'আবশ্যক'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {g.required}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-emerald-700 dark:text-emerald-400 font-bold">{g.sampleBn}</td>
                      <td className="p-2 font-mono text-indigo-700 dark:text-indigo-400 font-bold">{g.sampleEn}</td>
                      <td className="p-2 text-[11px] text-slate-500 dark:text-slate-400">{g.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 🌟 3. UPLOAD DROPZONE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-violet-600" />
            ধাপ ২: পূরণকৃত ফাইল আপলোড ও প্রিভিউ যাচাই করুন
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            সাপোর্টেড ফরম্যাট: .xlsx, .xls, .csv, .txt (ফাইলে বাংলা বা ইংরেজি যেকোনো ভাষায় লেখা গ্রহণযোগ্য)
          </p>
        </div>

        {/* Dropzone Container */}
        <div className="p-8 border-2 border-dashed border-violet-300 dark:border-violet-800/80 bg-violet-50/30 dark:bg-violet-950/20 rounded-2xl text-center space-y-3 transition-all hover:bg-violet-50/60">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
            {parsing ? <RefreshCw className="w-8 h-8 animate-spin" /> : <FileSpreadsheet className="w-8 h-8" />}
          </div>

          <div>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer transition-all active:scale-95">
              <Upload className="w-4 h-4" />
              <span>{file ? `ফাইল পরিবর্তন করুন (${file.name})` : 'ফাইল নির্বাচন করুন (.xlsx / .csv)'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2">
              কম্পিউটার থেকে ড্রাগ করে এখানে ছেড়ে দিন অথবা ব্রাউজ করুন
            </p>
          </div>
        </div>

        {/* Notifications */}
        {alertInfo && (
          <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-xs animate-in fade-in ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
              : alertInfo.type === 'warning'
              ? 'bg-amber-50 text-amber-950 border-amber-300 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200'
              : 'bg-rose-50 text-rose-950 border-rose-300 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {alertInfo.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : alertInfo.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{alertInfo.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertInfo(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 🌟 4. PARSED STUDENTS PREVIEW & BULK SAVE ACTION */}
      {parsedStudents.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ধাপ ৩: প্রাপ্ত শিক্ষার্থীদের প্রিভিউ ও ডেটাবেজে সংরক্ষণ
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                মোট প্রাপ্ত: <span className="text-violet-700 dark:text-violet-400 font-black font-mono">{parsedStudents.length} জন</span> শিক্ষার্থী।
                নিচে ফিল্টার ও সার্চ করে তথ্য দেখে নিন।
              </p>
            </div>

            {/* Save Mode Selector & Action Button */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedSaveMode('merge')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedSaveMode === 'merge'
                      ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="বিদ্যমান শিক্ষার্থীদের সাথে নতুন শিক্ষার্থী যুক্ত করবে এবং একই রোল/শ্রেণি হলে আপডেট করবে"
                >
                  মার্জ ও আপডেট (Merge)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSaveMode('replace')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedSaveMode === 'replace'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="পূর্ববর্তী সমস্ত শিক্ষার্থী মুছে নতুন তালিকা দিয়ে সম্পূর্ণ প্রতিস্থাপন করবে"
                >
                  সম্পূর্ণ প্রতিস্থাপন (Replace)
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveToDatabase}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>ডাটাবেজে সংরক্ষণ করুন ({parsedStudents.length})</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchPreview}
                  onChange={(e) => setSearchPreview(e.target.value)}
                  placeholder="নাম, রোল, মোবাইল বা এনআইডি দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <select
                value={gradePreviewFilter}
                onChange={(e) => setGradePreviewFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">সকল শ্রেণি (All Classes)</option>
                <option value="6th">৬ষ্ঠ শ্রেণি (6th)</option>
                <option value="7th">৭ম শ্রেণি (7th)</option>
                <option value="8th">৮ম শ্রেণি (8th)</option>
                <option value="9th">৯ম শ্রেণি (9th)</option>
                <option value="10th">১০ম শ্রেণি (10th)</option>
              </select>
            </div>

            <span className="text-[11px] font-bold text-slate-500 text-right">
              প্রদর্শিত: {filteredPreview.length} / {parsedStudents.length} জন
            </span>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-2.5 border-b w-14 text-center">রোল</th>
                  <th className="p-2.5 border-b">শিক্ষার্থীর নাম</th>
                  <th className="p-2.5 border-b">শ্রেণি ও শাখা</th>
                  <th className="p-2.5 border-b">বিভাগ</th>
                  <th className="p-2.5 border-b">পিতা / অভিভাবক</th>
                  <th className="p-2.5 border-b">মোবাইল নম্বর</th>
                  <th className="p-2.5 border-b">ধর্ম / লিঙ্গ</th>
                  <th className="p-2.5 border-b">জন্ম নিবন্ধন (BRN)</th>
                  <th className="p-2.5 border-b text-center">উপবৃত্তি</th>
                  <th className="p-2.5 border-b text-center">পূর্ণাঙ্গ তথ্য</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                {filteredPreview.map((st, i) => {
                  const dupKey = `${st.grade}_${st.section}_${st.roll.replace(/^0+/, '')}`;
                  const isDup = (duplicatesMap.get(dupKey) || 0) > 1;

                  return (
                    <tr key={i} className="hover:bg-violet-50/30 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 text-center font-mono font-bold">
                        {isDup ? (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-black" title="একই শ্রেণি ও শাখায় ডুপ্লিকেট রোল">
                            {st.roll} ⚠️
                          </span>
                        ) : (
                          <span className="text-violet-700 dark:text-violet-400">{st.roll}</span>
                        )}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                        {st.name}
                      </td>
                      <td className="p-2.5">
                        <span className="font-semibold">{st.gradeBn || st.grade}</span>{' '}
                        <span className="text-slate-500 font-bold">({st.section})</span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        {st.group || 'সাধারণ'}
                      </td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300">
                        {st.fatherName || st.guardian || '-'}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                        {st.mobile || '-'}
                      </td>
                      <td className="p-2.5 text-[11px]">
                        <span>{st.religion}</span> • <span className="text-slate-500">{st.gender}</span>
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {st.birthRegNo || '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        {st.isStipend ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            উপবৃত্তি
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentDetail(st)}
                          className="p-1 hover:bg-violet-100 dark:hover:bg-slate-700 text-violet-700 dark:text-violet-400 rounded-lg transition"
                          title="সম্পূর্ণ বিস্তারিত প্রোফাইল দেখুন"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredPreview.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-400 font-bold">
                      কোনো শিক্ষার্থী পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🌟 5. DETAIL MODAL (Displays ALL 20+ fields of any student) */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-600" />
                  {selectedStudentDetail.name} (রোল: {selectedStudentDetail.roll})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedStudentDetail.gradeBn || selectedStudentDetail.grade} | শাখা: {selectedStudentDetail.section} | বিভাগ: {selectedStudentDetail.group}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Complete Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">ব্যক্তিগত ও জন্ম সংক্রান্ত</span>
                <p><strong>জন্ম তারিখ:</strong> {selectedStudentDetail.dob || 'দেওয়া হয়নি'}</p>
                <p><strong>জন্ম নিবন্ধন (BRN):</strong> {selectedStudentDetail.birthRegNo || 'দেওয়া হয়নি'}</p>
                <p><strong>লিঙ্গ:</strong> {selectedStudentDetail.gender}</p>
                <p><strong>ধর্ম:</strong> {selectedStudentDetail.religion}</p>
                <p><strong>রক্তের গ্রুপ:</strong> {selectedStudentDetail.bloodGroup || 'দেওয়া হয়নি'}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">পিতা ও মাতার বিবরণ</span>
                <p><strong>পিতার নাম:</strong> {selectedStudentDetail.fatherName || 'দেওয়া হয়নি'}</p>
                <p><strong>পিতার এনআইডি:</strong> {selectedStudentDetail.fatherNid || 'দেওয়া হয়নি'}</p>
                <p><strong>মাতার নাম:</strong> {selectedStudentDetail.motherName || 'দেওয়া হয়নি'}</p>
                <p><strong>মাতার এনআইডি:</strong> {selectedStudentDetail.motherNid || 'দেওয়া হয়নি'}</p>
                <p><strong>আইনগত অভিভাবক:</strong> {selectedStudentDetail.guardian || 'দেওয়া হয়নি'}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 sm:col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">যোগাযোগ ও ঠিকানা</span>
                <p><strong>অভিভাবকের মোবাইল:</strong> <span className="font-mono font-bold text-violet-600">{selectedStudentDetail.mobile || 'দেওয়া হয়নি'}</span></p>
                <p><strong>বর্তমান ঠিকানা:</strong> {selectedStudentDetail.currentAddress || 'দেওয়া হয়নি'}</p>
                <p><strong>স্থায়ী ঠিকানা:</strong> {selectedStudentDetail.permanentAddress || 'দেওয়া হয়নি'}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 sm:col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">একাডেমিক ও উপবৃত্তি তথ্য</span>
                <p><strong>শিক্ষাবর্ষ:</strong> {selectedStudentDetail.session || '২০২৬'}</p>
                <p><strong>৪র্থ / ঐচ্ছিক বিষয়:</strong> {selectedStudentDetail.optionalSubject || 'দেওয়া হয়নি'}</p>
                <p><strong>উপবৃত্তি সুবিধাভোগী:</strong> {selectedStudentDetail.isStipend ? `হ্যাঁ (${selectedStudentDetail.stipendCategory || 'সাধারণ উপবৃত্তি'})` : 'না'}</p>
                {selectedStudentDetail.remarks && <p><strong>মন্তব্য:</strong> {selectedStudentDetail.remarks}</p>}
              </div>
            </div>

            <div className="text-right pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
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
