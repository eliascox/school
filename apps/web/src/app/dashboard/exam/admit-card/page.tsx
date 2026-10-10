'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Printer,
  Search,
  BookOpen,
  Users,
  CheckCircle2,
  Upload,
  Sparkles,
  ShieldCheck,
  QrCode,
  School,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  UserCheck,
  User,
  Image as ImageIcon,
  Edit3,
  Layers,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { studentService, Student } from '@/services/studentService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { getStudentReligion, ReligionType } from '@/lib/religionUtils';
import { compressImage } from '@/lib/imageUtils';

interface AdmitCardStudent {
  id: string;
  roll: string;
  name: string;
  fatherName: string;
  motherName: string;
  regNo: string;
  grade: string;
  sectionOrGroup: string;
  religion: ReligionType;
  photoUrl?: string;
}

// Real Scannable ISO QR Code Component
function RealQRCode({ text }: { text: string }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(text, {
      margin: 1,
      width: 200,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => console.error('QR Gen Error:', err));

    return () => {
      isMounted = false;
    };
  }, [text]);

  if (!dataUrl) {
    return (
      <div className="w-[74px] h-[74px] bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-[8px] text-slate-400 font-bold">
        QR লোড...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Verification QR Code"
      className="w-[74px] h-[74px] object-contain select-none rounded-[2px]"
    />
  );
}

export default function ProfessionalAdmitCardPage() {
  const [mounted, setMounted] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(settingsService.getSettings());
  const [selectedExam, setSelectedExam] = useState('অর্ধ-বার্ষিক পরীক্ষা ২০২৬');
  const [selectedGrade, setSelectedGrade] = useState('6th');
  const [selectedBranch, setSelectedBranch] = useState('A');
  const [selectedGroup, setSelectedGroup] = useState<'science' | 'humanities' | 'commerce'>('science');
  const [searchQuery, setSearchQuery] = useState('');

  // Drag & Drop Photo State (studentId -> base64)
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({});
  const [draggingStudentId, setDraggingStudentId] = useState<string | null>(null);

  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';

  useEffect(() => {
    setMounted(true);
    setSchoolSettings(settingsService.getSettings());

    const syncPhotosFromStorage = () => {
      if (typeof window === 'undefined') return;

      const map: Record<string, string> = {};

      // 1. Sync from studentService (Master Student Directory)
      const allSt = studentService.getAllStudents();
      allSt.forEach((s) => {
        if (s.photo) {
          map[s.id] = s.photo;
          if (s.roll) {
            map[s.roll] = s.photo;
            const g = (s.grade || s.gradeBn || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (g) map[`${g}_${s.roll}`] = s.photo;
          }
        }
      });

      // 2. Sync from admit-card specific photo cache
      const savedPhotos = localStorage.getItem('sms_student_photos');
      if (savedPhotos) {
        try {
          const parsed = JSON.parse(savedPhotos);
          Object.assign(map, parsed);

          // If any photo exists in savedPhotos but missing on the student in studentService, sync it back
          let hasStudentUpdates = false;
          const updatedStudents = allSt.map((s) => {
            const g = (s.grade || s.gradeBn || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const foundPhoto = s.photo || parsed[s.id] || (s.roll ? parsed[`${g}_${s.roll}`] : undefined) || (s.roll ? parsed[s.roll] : undefined);
            if (foundPhoto && foundPhoto !== s.photo) {
              hasStudentUpdates = true;
              return { ...s, photo: foundPhoto };
            }
            return s;
          });
          if (hasStudentUpdates) {
            localStorage.setItem('sms_students', JSON.stringify(updatedStudents));
          }
        } catch (e) {}
      }

      setPhotoMap(map);
    };

    syncPhotosFromStorage();
    window.addEventListener('storage', syncPhotosFromStorage);
    return () => window.removeEventListener('storage', syncPhotosFromStorage);
  }, []);

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

  // Load students from central studentService with photo resolution
  const loadedStudents: AdmitCardStudent[] = useMemo(() => {
    const targetGroupBn = isClass9or10
      ? selectedGroup === 'science'
        ? 'বিজ্ঞান'
        : selectedGroup === 'humanities'
        ? 'মানবিক'
        : 'ব্যবসায় শিক্ষা'
      : 'সাধারণ';

    const raw = studentService.getStudentsByFilter(selectedGrade, selectedBranch, targetGroupBn);
    const gradeBn = selectedGrade === '6th' ? '৬ষ্ঠ শ্রেণি' : selectedGrade === '7th' ? '৭ম শ্রেণি' : selectedGrade === '8th' ? '৮ম শ্রেণি' : selectedGrade === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি';
    const groupLabel = isClass9or10
      ? selectedGroup === 'science' ? 'বিজ্ঞান বিভাগ' : selectedGroup === 'humanities' ? 'মানবিক বিভাগ' : 'ব্যবসায় শিক্ষা বিভাগ'
      : `শাখা ${selectedBranch}`;

    if (raw.length === 0) {
      return []; // No students found — show empty state, never inject demo data
    }

    return raw.map((st) => {
      const gradeKey = (st.grade || st.gradeBn || selectedGrade || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const resolvedPhoto =
        st.photo ||
        (st as any).photoUrl ||
        photoMap[st.id] ||
        (st.roll ? photoMap[`${gradeKey}_${st.roll}`] : '') ||
        (st.roll ? photoMap[st.roll] : '') ||
        '';

      return {
        id: st.id,
        roll: st.roll || '00',
        name: st.name || 'শিক্ষार्थियों নাম',
        fatherName: st.fatherName || 'পিতার নাম',
        motherName: st.motherName || 'মাতার নাম',
        regNo: (st as any).regNo || `2026-${st.roll}`,
        grade: gradeBn,
        sectionOrGroup: groupLabel,
        religion: getStudentReligion(st),
        photoUrl: resolvedPhoto
      };
    });
  }, [selectedGrade, selectedBranch, selectedGroup, isClass9or10, photoMap]);

  const filteredStudents = loadedStudents.filter((st) =>
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) || st.roll.includes(searchQuery)
  );

  // Photo Upload Handler (Drag & Drop or File Selector) - Bidirectionally Linked with Student Directory
  const handlePhotoUpload = async (studentId: string, file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    try {
      // 1. Compress to crisp, lightweight passport dimensions (~25KB)
      const compressed = await compressImage(file, 300, 360, 0.85);
      if (!compressed) return;

      // 2. Permanently link with student in studentService (Master SMS Directory)
      studentService.saveStudentPhoto(studentId, compressed);
      const allSt = studentService.getAllStudents();
      const targetStudent = allSt.find((s) => s.id === studentId || s.roll === studentId);
      if (targetStudent) {
        studentService.updateStudent({ ...targetStudent, photo: compressed });
      }

      // 3. Update local state and sms_student_photos cache
      setPhotoMap((prev) => {
        const updated = { ...prev, [studentId]: compressed };
        if (targetStudent) {
          if (targetStudent.id) updated[targetStudent.id] = compressed;
          if (targetStudent.roll) {
            updated[targetStudent.roll] = compressed;
            const g = (targetStudent.grade || targetStudent.gradeBn || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (g) updated[`${g}_${targetStudent.roll}`] = compressed;
          }
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('sms_student_photos', JSON.stringify(updated));
          window.dispatchEvent(new Event('storage'));
        }
        return updated;
      });
    } catch (err) {
      console.error('Error uploading/linking student photo:', err);
    }
  };

  const handlePrintAll = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!mounted) {
    return <div className="p-8 text-center text-slate-400 font-bold">প্রবেশপত্র জেনারেটর লোড হচ্ছে...</div>;
  }

  // Chunk array into pairs of 2 for A4 Page Layout (2 cards per page in print)
  const studentPairs: AdmitCardStudent[][] = [];
  for (let i = 0; i < filteredStudents.length; i += 2) {
    studentPairs.push(filteredStudents.slice(i, i + 2));
  }

  return (
    <div className="space-y-6 pb-12 print:p-0 print:m-0 print:space-y-0 font-sans text-slate-900">

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* UNIFIED SINGLE-LINE CONTROLS BAR (PRINT: HIDDEN)            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5">
          
          {/* Filters: Exam, Class, Section/Group, Search */}
          <div className="flex flex-wrap items-center gap-2 flex-1 w-full lg:w-auto">
            
            {/* ১. পরীক্ষা */}
            <div className="flex-1 sm:flex-initial min-w-[170px]">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 text-xs text-slate-900 font-bold cursor-pointer transition"
              >
                <option value="অর্ধ-বার্ষিক পরীক্ষা ২০২৬">📋 অর্ধ-বার্ষিক পরীক্ষা ২০২৬</option>
                <option value="বার্ষিক পরীক্ষা ২০২৬">📋 বার্ষিক পরীক্ষা ২০২৬</option>
                <option value="এসএসসি প্রাক-নির্বাচনী পরীক্ষা ২০২৬">📋 প্রাক-নির্বাচনী ২০২৬</option>
                <option value="এসএসসি নির্বাচনী (টেস্ট) পরীক্ষা ২০২৬">📋 নির্বাচনী (টেস্ট) ২০২৬</option>
              </select>
            </div>

            {/* ২. শ্রেণি */}
            <div className="flex-1 sm:flex-initial min-w-[130px]">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 text-xs text-slate-900 font-bold cursor-pointer transition"
              >
                <option value="6th">🎓 ৬ষ্ঠ শ্রেণি (Class 6)</option>
                <option value="7th">🎓 ৭ম শ্রেণি (Class 7)</option>
                <option value="8th">🎓 ৮ম শ্রেণি (Class 8)</option>
                <option value="9th">🎓 ৯ম শ্রেণি (Class 9)</option>
                <option value="10th">🎓 ১০ম শ্রেণি (Class 10)</option>
              </select>
            </div>

            {/* ৩. শাখা / বিভাগ */}
            <div className="flex-1 sm:flex-initial min-w-[150px]">
              <select
                value={isClass9or10 ? selectedGroup : selectedBranch}
                onChange={(e) => handleGroupBranchChange(e.target.value)}
                className="w-full px-3 py-2 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 text-xs text-indigo-950 font-bold cursor-pointer transition"
              >
                {isClass9or10 ? (
                  <>
                    <option value="science">🧪 বিজ্ঞান (Science)</option>
                    <option value="humanities">📚 মানবিক (Humanities)</option>
                    <option value="commerce">💼 ব্যবসায় শিক্ষা (Commerce)</option>
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

            {/* ৪. সার্চ বক্স */}
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="রোল বা নাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 text-xs text-slate-800 font-medium placeholder:text-slate-400 transition"
              />
            </div>

          </div>

          {/* Action: Student Count + Print Button */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <span className="hidden xl:inline-flex items-center px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200/60">
              মোট: {filteredStudents.length} জন
            </span>
            <button
              onClick={handlePrintAll}
              disabled={filteredStudents.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-xs transition transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Printer size={15} /> প্রবেশপত্র প্রিন্ট করুন (A4)
            </button>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ADMIT CARDS PRINT AREA (A4 PAGE CONTAINING 2 ADMIT CARDS PER SHEET) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-6 print:space-y-0">
        {studentPairs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 print:hidden">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-bold">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
          </div>
        ) : (
          studentPairs.map((pair, pairIdx) => (
            <div
              key={pairIdx}
              className="space-y-6 print:space-y-0 print:h-[296mm] print:break-after-page print:flex print:flex-col print:justify-between print:p-0 print:m-0 print:box-border print:overflow-hidden print:gap-0"
            >
              {pair.map((st, cardIdx) => {
                const gradeKey = (st.grade || selectedGrade || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const photoSrc =
                  st.photoUrl ||
                  photoMap[st.id] ||
                  (st.roll ? photoMap[`${gradeKey}_${st.roll}`] : '') ||
                  (st.roll ? photoMap[st.roll] : '') ||
                  (st as any).photo ||
                  '';

                return (
                  <div
                    key={st.id}
                    className="relative flex flex-col justify-start items-center w-full print:h-[148mm] print:justify-center print:box-border print:p-0 print:m-0"
                  >
                    <div
                      className={`bg-white relative overflow-hidden max-w-[680px] w-full print:shadow-none print:rounded-none print:h-[126mm] print:box-border ${
                        draggingStudentId === st.id ? 'ring-4 ring-indigo-500 bg-indigo-50/30' : 'shadow-md'
                      }`}
                      style={{
                        border: '2.5px solid #0f172a',
                        borderRadius: '8px',
                        background: '#ffffff'
                      }}
                      onDragOver={(e) => { e.preventDefault(); setDraggingStudentId(st.id); }}
                      onDragLeave={() => setDraggingStudentId(null)}
                      onDrop={(e) => { e.preventDefault(); setDraggingStudentId(null); const file = e.dataTransfer.files?.[0]; if (file) handlePhotoUpload(st.id, file); }}
                    >
                      {/* ELEGANT CORNER ORNAMENT BRACKETS */}
                      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-slate-900 pointer-events-none z-20"></div>
                      <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-slate-900 pointer-events-none z-20"></div>
                      <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-slate-900 pointer-events-none z-20"></div>
                      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-slate-900 pointer-events-none z-20"></div>

                      {/* WATERMARK */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.055] select-none z-0">
                        <img
                          src={schoolSettings.schoolLogo || '/logo.png'}
                          alt="School Watermark"
                          className="w-48 h-48 object-contain filter grayscale"
                        />
                      </div>

                      {/* INNER BORDER */}
                      <div
                        className="relative z-10 flex flex-col h-full bg-white justify-start admit-card-card-content"
                        style={{ border: '1px solid #cbd5e1', margin: '3px' }}
                      >

                        {/* ══════════════════════════════════════════════════════════════════════════════ */}
                        {/* ── 1. TOP HEADER: [LEFT: QR BOX] | [CENTER: LOGO + BRANDING + BADGES] | [RIGHT: PHOTO BOX] ── */}
                        {/* ══════════════════════════════════════════════════════════════════════════════ */}
                        <div className="border-b border-slate-300 bg-gradient-to-b from-slate-50/95 via-white to-slate-50/60 px-3 py-1">
                          <div className="flex items-center justify-between gap-2.5">

                            {/* ◀◀ LEFT: REAL SCANNABLE QR CODE & VERIFICATION BOX ◀◀ */}
                            <div
                              className="w-[88px] shrink-0 flex flex-col items-center justify-center p-1 bg-white border border-slate-200 rounded-md shadow-2xs"
                            >
                              <div className="w-full text-center pb-0.5 border-b border-slate-100 mb-0.5 flex items-center justify-center gap-1">
                                <ShieldCheck size={9} className="text-indigo-600" />
                                <span className="text-[7.5px] font-black text-slate-950 uppercase tracking-tighter">ভেরিফিকেশন QR</span>
                              </div>
                              <RealQRCode
                                text={`বরইতলী উচ্চ বিদ্যালয় - প্রবেশপত্র
নাম: ${st.name}
রোল: ${st.roll}
শ্রেণি: ${st.grade}
শাখা/গ্রুপ: ${st.sectionOrGroup}
রেজিস্ট্রেশন নং: ${st.regNo}
পরীক্ষা: ${selectedExam}
শিক্ষাবর্ষ: ২০২৬
স্ট্যাটাস: ভেরিফাইড পরীক্ষার্থী ✅`}
                              />
                            </div>

                            {/* ◀◀ CENTER: SCHOOL LOGO (LEFT OF NAME) + NAME + ADDRESS + ADMIT CARD BADGE + EXAM NAME (BELOW) ◀◀ */}
                            <div className="flex-1 text-center px-1 flex flex-col items-center justify-center">
                              
                              {/* Logo + School Details (3 Lines) */}
                              <div className="flex items-center justify-center gap-2.5">
                                {/* Logo on the left of school name - No border, large size */}
                                <img
                                  src={schoolSettings.schoolLogo || '/logo.png'}
                                  alt="School Logo"
                                  className="w-[52px] h-[52px] object-contain shrink-0"
                                />

                                {/* 3 Lines: 1. School Name, 2. Address, 3. EIIN & Established Year */}
                                <div className="text-center flex flex-col items-center">
                                  {/* Line 1: School Name */}
                                  <h2
                                    className="text-[22px] sm:text-[24px] font-[950] tracking-tight leading-tight"
                                    style={{ color: '#006a4e', fontFamily: 'serif' }}
                                  >
                                    {schoolSettings.schoolName || 'বরইতলী উচ্চ বিদ্যালয়'}
                                  </h2>

                                  {/* Line 2: Address */}
                                  <p className="text-[10px] text-slate-950 font-bold tracking-wide leading-tight mt-0.5 text-center">
                                    {schoolSettings.address || 'বরইতলী, চকরিয়া, কক্সবাজার।'}
                                  </p>

                                  {/* Line 3: EIIN & Established */}
                                  <p className="text-[9px] text-slate-950 font-bold tracking-wide leading-tight mt-0.5 text-center">
                                    EIIN: <span className="font-mono font-black text-slate-950">{schoolSettings.eiin || '106184'}</span> , স্থাপিত: <span className="font-bold text-slate-950">{schoolSettings.estdYear || '1969'}</span> খ্রি .
                                  </p>
                                </div>
                              </div>

                              {/* Centered Admit Card Badge */}
                              <div className="mt-1">
                                <div
                                  className="inline-flex items-center px-5 py-0.5 font-black text-[11px] tracking-[0.16em] text-white uppercase shadow-xs"
                                  style={{
                                    background: 'linear-gradient(135deg, #0f5132 0%, #198754 100%)',
                                    borderRadius: '20px',
                                    border: '1px solid #14532d'
                                  }}
                                >
                                  <span className="text-white">প্রবেশপত্র</span>
                                </div>
                              </div>

                              {/* Exam Name Banner below Admit Card badge (100% Solid Black, Bold & Sharp - No blur) */}
                              <div className="mt-1">
                                <div
                                  className="inline-block px-4 py-0.5 font-black text-[13px] rounded-md tracking-wide select-none"
                                  style={{
                                    color: '#000000',
                                    fontWeight: 900,
                                    border: '1.5px solid #000000',
                                    backgroundColor: '#ffffff',
                                    opacity: 1,
                                    fontFamily: "'Hind Siliguri', 'Noto Serif Bengali', sans-serif",
                                    WebkitFontSmoothing: 'antialiased',
                                    textRendering: 'geometricPrecision',
                                    lineHeight: '1.3',
                                  }}
                                >
                                  {selectedExam}
                                </div>
                              </div>

                            </div>

                            {/* ▶▶ RIGHT: STUDENT PASSPORT PHOTO BOX ▶▶ */}
                            <div className="w-[88px] shrink-0 flex flex-col items-center justify-center p-1 bg-white border border-slate-200 rounded-md shadow-2xs">
                              <div className="w-full text-center pb-0.5 border-b border-slate-100 mb-0.5 flex items-center justify-center gap-1">
                                <User size={9} className="text-indigo-600" />
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">পরীক্ষার্থীর ছবি</span>
                              </div>

                              <label
                                className="relative group cursor-pointer shrink-0 flex flex-col items-center justify-center overflow-hidden"
                                style={{
                                  width: '80px',
                                  height: '92px',
                                  border: photoSrc ? '1.5px solid #0f172a' : '1.5px dashed #94a3b8',
                                  background: photoSrc ? 'transparent' : '#f8fafc',
                                  borderRadius: '3px'
                                }}
                              >
                                {photoSrc ? (
                                  <img src={photoSrc} alt={st.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="p-1 text-center space-y-0.5">
                                    <ImageIcon className="w-5 h-5 text-slate-400 mx-auto" />
                                    <span className="text-[7px] font-bold text-slate-500 block leading-tight">
                                      পাসপোর্ট ছবি<br />আপলোড
                                    </span>
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handlePhotoUpload(st.id, file);
                                  }}
                                  className="hidden"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[8px] font-bold print:hidden">
                                  ছবি পরিবর্তন
                                </div>
                              </label>
                            </div>

                          </div>
                        </div>

                        {/* ══════════════════════════════════════════════════════════════════════════════ */}
                        {/* ── 2. MAIN BODY: FULL-WIDTH STRUCTURED STUDENT DETAILS TABLE (TIGHT & COMPACT) ── */}
                        {/* ══════════════════════════════════════════════════════════════════════════════ */}
                        <div className="px-2.5 pt-1.5 pb-0.5">
                          <table className="w-full text-[11px] border border-slate-300 shadow-2xs" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                              {/* Row 1: Student Name */}
                              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                <td
                                  className="font-bold text-slate-700 align-middle border-r border-slate-300"
                                  style={{ padding: '3px 8px', width: '26%', background: '#f8fafc' }}
                                >
                                  পরীক্ষার্থীর নাম
                                </td>
                                <td
                                  colSpan={3}
                                  className="align-middle font-black text-[13px] text-indigo-950"
                                  style={{ padding: '3px 8px', background: '#ffffff' }}
                                >
                                  {st.name}
                                </td>
                              </tr>

                              {/* Row 2: Father's Name */}
                              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                <td
                                  className="font-bold text-slate-700 align-middle border-r border-slate-300"
                                  style={{ padding: '2.5px 8px', width: '26%', background: '#f8fafc' }}
                                >
                                  পিতার নাম
                                </td>
                                <td
                                  colSpan={3}
                                  className="align-middle font-bold text-slate-800 text-[11px]"
                                  style={{ padding: '2.5px 8px', background: '#ffffff' }}
                                >
                                  {st.fatherName}
                                </td>
                              </tr>

                              {/* Row 3: Mother's Name */}
                              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                <td
                                  className="font-bold text-slate-700 align-middle border-r border-slate-300"
                                  style={{ padding: '2.5px 8px', width: '26%', background: '#f8fafc' }}
                                >
                                  মাতার নাম
                                </td>
                                <td
                                  colSpan={3}
                                  className="align-middle font-bold text-slate-800 text-[11px]"
                                  style={{ padding: '2.5px 8px', background: '#ffffff' }}
                                >
                                  {st.motherName}
                                </td>
                              </tr>

                              {/* Row 4: Class & Section/Group */}
                              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                <td
                                  className="font-bold text-slate-700 align-middle border-r border-slate-300"
                                  style={{ padding: '2.5px 8px', width: '26%', background: '#f8fafc' }}
                                >
                                  শ্রেণি
                                </td>
                                <td
                                  className="align-middle font-bold text-slate-900 border-r border-slate-300"
                                  style={{ padding: '2.5px 8px', width: '26%', background: '#ffffff' }}
                                >
                                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-900 font-extrabold">{st.grade}</span>
                                </td>
                                <td
                                  className="font-bold text-slate-700 align-middle border-r border-slate-300"
                                  style={{ padding: '2.5px 8px', width: '22%', background: '#f8fafc' }}
                                >
                                  শাখা / বিভাগ
                                </td>
                                <td
                                  className="align-middle font-black text-indigo-900 text-[11px]"
                                  style={{ padding: '2.5px 8px', width: '26%', background: '#ffffff' }}
                                >
                                  {st.sectionOrGroup}
                                </td>
                              </tr>

                              {/* Row 5: Roll & Registration No. */}
                              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                <td
                                  className="font-bold text-slate-700 align-middle border-r border-slate-300"
                                  style={{ padding: '2.5px 8px', width: '26%', background: '#f8fafc' }}
                                >
                                  রোল নম্বর
                                </td>
                                <td
                                  className="align-middle font-mono font-black text-indigo-700 text-[13px] border-r border-slate-300"
                                  style={{ padding: '2.5px 8px', width: '26%', background: '#ffffff' }}
                                >
                                  {st.roll}
                                </td>
                                <td
                                  className="font-bold text-slate-700 align-middle border-r border-slate-300"
                                  style={{ padding: '2.5px 8px', width: '22%', background: '#f8fafc' }}
                                >
                                  রেজিস্ট্রেশন নং
                                </td>
                                <td
                                  className="align-middle font-mono font-bold text-slate-800 text-[11px]"
                                  style={{ padding: '2.5px 8px', width: '26%', background: '#ffffff' }}
                                >
                                  {st.regNo}
                                </td>
                              </tr>

                              {/* Row 6: Religion & Session */}
                              <tr>
                                <td
                                  className="font-bold text-slate-700 align-middle border-r border-slate-300"
                                  style={{ padding: '2.5px 8px', width: '26%', background: '#f8fafc' }}
                                >
                                  ধর্ম
                                </td>
                                <td
                                  className="align-middle font-semibold text-slate-800 text-[11px] border-r border-slate-300"
                                  style={{ padding: '2.5px 8px', width: '26%', background: '#ffffff' }}
                                >
                                  {st.religion === 'Muslim' ? 'ইসলাম' : st.religion === 'Hindu' ? 'হিন্দু' : st.religion}
                                </td>
                                <td
                                  className="font-bold text-slate-700 align-middle border-r border-slate-300"
                                  style={{ padding: '2.5px 8px', width: '22%', background: '#f8fafc' }}
                                >
                                  শিক্ষাবর্ষ
                                </td>
                                <td
                                  className="align-middle font-mono font-bold text-slate-800 text-[11px]"
                                  style={{ padding: '2.5px 8px', width: '26%', background: '#ffffff' }}
                                >
                                  ২০২৬
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* ── 3. EXAM INSTRUCTIONS (MODERN & STRUCTURED - TIGHT ATTACHMENT) ── */}
                        <div
                          className="text-[8.5px] text-slate-700 font-semibold border-t border-slate-300 px-3 py-1 bg-slate-50/70 mt-1.5"
                        >
                          <p
                            className="font-black text-[8px] text-slate-900 uppercase tracking-wider mb-0.5 border-b border-slate-200 pb-0.5 flex items-center gap-1"
                          >
                            <span className="text-amber-600">⚠</span> পরীক্ষার্থীদের জন্য আবশ্যকীয় নির্দেশাবলী (INSTRUCTIONS FOR EXAMINEES):
                          </p>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[8px] leading-tight">
                            <span>১. পরীক্ষা শুরুর ১৫ মিনিট পূর্বে অবশ্যই নির্ধারিত আসনে বসতে হবে।</span>
                            <span>২. মূল প্রবেশপত্র ছাড়া কোনোভাবেই পরীক্ষায় অংশগ্রহণ করা যাবে না।</span>
                            <span>৩. পরীক্ষা কক্ষে মোবাইল ফোন বা ডিজিটাল ডিভাইস আনা সম্পূর্ণ নিষিদ্ধ।</span>
                            <span>৪. উত্তরপত্রে রোল ও রেজিস্ট্রেশন নম্বর নির্ভুলভাবে পূরণ করতে হবে।</span>
                          </div>
                        </div>

                        {/* ── 4. OFFICIAL SIGNATURES BLOCK (PUSHED TO BOTTOM) ── */}
                        <div
                          className="flex items-end justify-between text-center border-t border-slate-300 px-6 pt-2 pb-1 bg-white mt-auto"
                        >
                          {/* Examinee Signature */}
                          <div className="space-y-0.5">
                            <div style={{ width: '95px', borderBottom: '1px dashed #64748b', margin: '0 auto' }}></div>
                            <p className="text-[8.5px] font-bold text-slate-700">পরীক্ষার্থীর স্বাক্ষর</p>
                            <p className="text-[7px] font-medium text-slate-400">{"Examinee's Signature"}</p>
                          </div>

                          {/* Class Teacher Signature */}
                          <div className="space-y-0.5">
                            <div style={{ width: '100px', borderBottom: '1px dashed #64748b', margin: '0 auto' }}></div>
                            <p className="text-[8.5px] font-bold text-slate-700">{schoolSettings.classTeacherTitle || 'শ্রেণি শিক্ষকের স্বাক্ষর'}</p>
                            <p className="text-[7px] font-medium text-slate-400">{"Class Teacher's Signature"}</p>
                          </div>

                          {/* Head Teacher Signature & Seal */}
                          <div className="space-y-0.5">
                            <div style={{ width: '115px', borderBottom: '1px dashed #64748b', margin: '0 auto' }}></div>
                            <p className="text-[8.5px] font-black text-slate-950">{schoolSettings.principalTitle || 'প্রধান শিক্ষক ও সীল'}</p>
                            <p className="text-[7px] font-medium text-slate-400">{"Head Teacher's Signature & Seal"}</p>
                          </div>
                        </div>

                      </div>{/* end inner border */}
                    </div>

                    {/* ✂️ DEDICATED CUT SEPARATION LINE EXACTLY AT THE BOTTOM BOUNDARY OF FIRST HALF ✂️ */}
                    {cardIdx === 0 && pair.length > 1 && (
                      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center translate-y-1/2 z-30 print:flex">
                        <div className="flex-1 border-b-2 border-dashed border-slate-300"></div>
                        <span className="px-3 py-0.5 bg-slate-100 text-slate-500 font-bold text-[8.5px] rounded-full border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                          ✂️ কাটার স্থান (CUT ALONG THIS LINE)
                        </span>
                        <div className="flex-1 border-b-2 border-dashed border-slate-300"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 0mm !important;
          }
          html, body {
            margin: 0mm !important;
            padding: 0mm !important;
            height: 297mm !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        /* Force high contrast black color only for general grey/muted text classes */
        .admit-card-card-content .text-slate-400,
        .admit-card-card-content .text-slate-500,
        .admit-card-card-content .text-slate-600,
        .admit-card-card-content .text-slate-700,
        .admit-card-card-content .text-slate-800,
        .admit-card-card-content .text-slate-900,
        .admit-card-card-content .text-slate-950,
        .admit-card-card-content td {
          color: #000000 !important;
        }
        /* Force all line borders inside the admit card to be dark solid black */
        .admit-card-card-content,
        .admit-card-card-content *,
        .admit-card-card-content table,
        .admit-card-card-content td {
          border-color: #0f172a !important;
        }
      `}</style>
    </div>
  );
}
