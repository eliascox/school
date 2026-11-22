'use client';

import React, { useMemo, useState } from 'react';
import {
  Users,
  Printer,
  CheckCircle2,
  Award,
  Search,
  Sparkles,
  Check,
  Languages,
} from 'lucide-react';
import { Student } from '@/services/studentService';
import { SchoolSettings } from '@/services/settingsService';
import {
  CertificateInput,
  CertificateRecord,
  CertificateType,
  certificateService,
} from '@/services/certificateService';
import {
  buildDefaultRefNo,
  CertificateLanguage,
  composeCertificateBody,
  getDefaultCertificateTitle,
  mapStudentToCertificateDraft,
} from '@/lib/certificateEngine';
import OfficialCertificateDoc from '@/components/OfficialCertificateDoc';
import { ALL_CERTIFICATE_TYPES } from './certificateThemes';

interface BatchCertificateStudioProps {
  students: Student[];
  initialSelectedIds?: string[];
  initialCertType?: CertificateType;
  schoolSettings: SchoolSettings;
  createdByName: string;
  onBatchSaved: (saved: CertificateRecord[]) => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export default function BatchCertificateStudio({
  students,
  initialSelectedIds = [],
  initialCertType = 'current_student',
  schoolSettings,
  createdByName,
  onBatchSaved,
  onNotify,
}: BatchCertificateStudioProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [certType, setCertType] = useState<CertificateType>(initialCertType);
  const [language, setLanguage] = useState<CertificateLanguage>(
    initialCertType === 'ssc_testimonial' ? 'en' : 'bn'
  );
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    initialCertType === 'ssc_testimonial' ? 'landscape' : 'portrait'
  );
  const [borderPreset, setBorderPreset] = useState<string>('royal_crest');
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [showPhotoBox, setShowPhotoBox] = useState<boolean>(false);
  const [showOfficeStub, setShowOfficeStub] = useState<boolean>(false);
  const purposeId = 'general';
  const [generatedRecords, setGeneratedRecords] = useState<CertificateRecord[]>([]);

  const uniqueGrades = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.grade).filter(Boolean)));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const matchGrade = gradeFilter === 'all' || s.grade === gradeFilter;
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.nameEn || '').toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q);
      return matchGrade && matchQuery;
    });
  }, [students, gradeFilter, searchQuery]);

  const selectedStudents = useMemo(
    () => students.filter((s) => selectedIds.includes(s.id)),
    [students, selectedIds]
  );

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const allChecked = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
    if (allChecked) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const previewDrafts: CertificateRecord[] = useMemo(() => {
    return selectedStudents.map((st, idx) => {
      const draft = mapStudentToCertificateDraft(st, schoolSettings);
      const isTestimonial = certType === 'ssc_testimonial' || certType === 'transfer_certificate';
      if (isTestimonial) draft.currentlyStudying = false;

      const body = composeCertificateBody({
        type: certType,
        language,
        draft,
        schoolSettings,
        selectedTraits: ['meritorious', 'regular', 'disciplined'],
        purposeId,
      });

      return {
        id: `PREVIEW-${st.roll || idx + 1}`,
        type: certType,
        title: getDefaultCertificateTitle(certType, language),
        refNo: `${buildDefaultRefNo(schoolSettings)}-${idx + 1}`,
        issueDate,
        status: 'valid',
        layoutStyle: borderPreset === 'no_border_pad' ? 'pad' : 'royal_border',
        studentId: st.id,
        studentName: draft.studentName,
        studentNameEn: draft.studentNameEn,
        fatherName: draft.fatherName,
        fatherNameEn: draft.fatherNameEn,
        motherName: draft.motherName,
        motherNameEn: draft.motherNameEn,
        roll: draft.roll,
        grade: draft.grade,
        section: draft.section,
        group: draft.group,
        session: draft.session,
        dob: draft.dob,
        gender: draft.gender,
        village: draft.village,
        postOffice: draft.postOffice,
        upazila: draft.upazila,
        district: draft.district,
        boardRoll: draft.boardRoll,
        boardReg: draft.boardReg,
        passingYear: draft.passingYear,
        gpa: draft.gpa,
        gradeLetter: draft.gradeLetter,
        isAlumni: !draft.currentlyStudying,
        customBody: body,
        language,
        orientation,
        themeColor: '#1e1b4b',
        titleVariant: 'ribbon',
        borderPreset,
        showHeader,
        showPhotoBox,
        photoUrl: draft.photoUrl,
        showOfficeStub,
        showCornerBands: borderPreset !== 'no_border_pad',
        showQrCode: true,
        cursiveNames: true,
        fontSize: certType === 'ssc_testimonial' && language === 'en' ? 17.5 : orientation === 'landscape' ? 14.5 : 15.5,
        createdDate: issueDate,
      };
    });
  }, [
    selectedStudents,
    schoolSettings,
    certType,
    language,
    issueDate,
    orientation,
    borderPreset,
    showHeader,
    showPhotoBox,
    showOfficeStub,
    purposeId,
  ]);

  const activePrintList = generatedRecords.length > 0 ? generatedRecords : previewDrafts;

  const handleSaveBatch = () => {
    if (previewDrafts.length === 0) {
      onNotify('error', 'কমপক্ষে একজন শিক্ষার্থী নির্বাচন করুন!');
      return;
    }

    const inputs: CertificateInput[] = previewDrafts.map((item) => {
      const { id: _unused, createdDate: _cdate, verificationCode: _vc, status: _st, auditTrail: _at, ...rest } = item;
      return {
        ...rest,
        createdBy: createdByName,
      };
    });

    const saved = certificateService.saveBatchCertificates(inputs);
    setGeneratedRecords(saved);
    onBatchSaved(saved);
    onNotify('success', `${saved.length}টি সনদ সফলভাবে প্রস্তুত ও রেজিস্টারে সংরক্ষিত হয়েছে!`);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="text-amber-500" size={20} />
              ব্যাচ সনদ ও প্রশংসাপত্র জেনারেটর (Bulk Certificate Engine)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              শিক্ষার্থী তালিকা থেকে নির্বাচিত শিক্ষার্থীদের জন্য স্বয়ংক্রিয় লিঙ্গ-সঠিক সর্বনাম ও পরীক্ষার GPA সহ একসাথে সনদ প্রস্তুত করুন।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={selectedStudents.length === 0}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer transition"
            >
              <CheckCircle2 size={15} />
              সবগুলো রেজিস্টারে সেভ ({selectedStudents.length})
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              disabled={activePrintList.length === 0}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer transition"
            >
              <Printer size={15} />
              ব্যাচ প্রিন্ট ({activePrintList.length} পাতা)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">সনদের ধরন</label>
            <select
              value={certType}
              onChange={(e) => {
                const nextType = e.target.value as CertificateType;
                setCertType(nextType);
                setGeneratedRecords([]);
                if (nextType === 'ssc_testimonial') {
                  setLanguage('en');
                  setOrientation('landscape');
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
            >
              {ALL_CERTIFICATE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titleBn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Languages size={12} /> ভাষা ও অরিয়েন্টেশন
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLanguage(language === 'bn' ? 'en' : 'bn');
                  setGeneratedRecords([]);
                }}
                className="px-2.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer"
              >
                {language === 'bn' ? 'বাংলা' : 'English'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait');
                  setGeneratedRecords([]);
                }}
                className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">বর্ডার ফ্রেম ও তারিখ</label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={borderPreset}
                onChange={(e) => {
                  setBorderPreset(e.target.value);
                  setGeneratedRecords([]);
                }}
                className="px-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
              >
                <option value="royal_crest">রয়্যাল বর্ডার</option>
                <option value="imperial_double">ডাবল গোল্ড</option>
                <option value="executive_clean">স্লিম ফ্রেম</option>
                <option value="no_border_pad">প্যাড মোড</option>
              </select>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="px-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">অপশন টগল</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: 'হেডার', active: showHeader, toggle: () => setShowHeader((v) => !v) },
                { label: 'ছবি বক্স', active: showPhotoBox, toggle: () => setShowPhotoBox((v) => !v) },
                { label: 'অফিস স্টাব', active: showOfficeStub, toggle: () => setShowOfficeStub((v) => !v) },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    opt.toggle();
                    setGeneratedRecords([]);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border font-bold text-[11px] cursor-pointer transition ${
                    opt.active
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-student Filter & Picker */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-56">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নাম বা রোল দিয়ে খুঁজুন..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                />
              </div>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
              >
                <option value="all">সকল শ্রেণি ({students.length})</option>
                {uniqueGrades.map((g) => (
                  <option key={g} value={g}>
                    শ্রেণি: {g}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-xs font-bold rounded-xl cursor-pointer transition"
              >
                ফিল্টারকৃত সবগুলো নির্বাচন / বাতিল ({filteredStudents.length})
              </button>
            </div>

            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Users size={14} /> নির্বাচিত: {selectedStudents.length} জন
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
            {filteredStudents.map((s) => {
              const checked = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    toggleStudent(s.id);
                    setGeneratedRecords([]);
                  }}
                  className={`p-2 rounded-xl border text-left text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                    checked
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate">{s.name}</p>
                    <p className={`text-[10px] truncate ${checked ? 'text-indigo-100' : 'text-slate-400'}`}>
                      রোল: {s.roll} | {s.grade}
                    </p>
                  </div>
                  {checked && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Preview & Print Stack */}
      {activePrintList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-2 print:hidden">
          <Sparkles className="mx-auto text-indigo-500" size={28} />
          <p className="text-sm font-black text-slate-800 dark:text-slate-100">ব্যাচ সনদ তৈরির জন্য শিক্ষার্থী নির্বাচন করুন</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            উপর থেকে এক বা একাধিক শিক্ষার্থী বাছাই করলে এখানেই সবার আলাদা প্রিন্টেবল সনদ তৈরি হয়ে যাবে।
          </p>
        </div>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {activePrintList.map((cert, index) => (
            <div
              key={`${cert.id}-${index}`}
              className="print:break-after-page print:m-0"
              style={{ pageBreakAfter: index < activePrintList.length - 1 ? 'always' : 'auto' }}
            >
              <OfficialCertificateDoc
                cert={cert}
                settings={schoolSettings}
                overrideStyle={cert.layoutStyle}
                mode={borderPreset === 'no_border_pad' && !showHeader ? 'preprinted' : 'full_pad'}
                hideHeaderActions={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
