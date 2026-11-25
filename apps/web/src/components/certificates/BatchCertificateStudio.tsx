'use client';

import React, { useMemo, useState } from 'react';
import {
  Users,
  Printer,
  CheckCircle2,
  Search,
  Sparkles,
  Check,
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
  sortStudentsByRoll,
} from '@/lib/certificateEngine';
import OfficialCertificateDoc from '@/components/OfficialCertificateDoc';
import { ALL_CERTIFICATE_TYPES } from './certificateThemes';

interface BatchCertificateStudioProps {
  students: Student[];
  initialSelectedIds?: string[];
  initialCertType?: CertificateType;
  schoolSettings: SchoolSettings;
  padCanvasMode: 'uploaded_pad' | 'preprinted_pad';
  createdByName: string;
  onBatchSaved: (saved: CertificateRecord[]) => void;
  onOpenPadSettings?: () => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
}

export default function BatchCertificateStudio({
  students,
  initialSelectedIds = [],
  initialCertType = 'current_student',
  schoolSettings,
  padCanvasMode,
  createdByName,
  onBatchSaved,
  onOpenPadSettings,
  onNotify,
}: BatchCertificateStudioProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [certType, setCertType] = useState<CertificateType>(initialCertType);
  const [language, setLanguage] = useState<CertificateLanguage>('bn');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [showPhotoBox, setShowPhotoBox] = useState<boolean>(false);
  const [generatedRecords, setGeneratedRecords] = useState<CertificateRecord[]>([]);

  const uniqueGrades = useMemo(
    () => Array.from(new Set(students.map((s) => s.grade).filter(Boolean))),
    [students],
  );
  const uniqueSections = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .filter((s) => gradeFilter === 'all' || s.grade === gradeFilter)
            .map((s) => s.section || s.branch || '')
            .filter(Boolean),
        ),
      ),
    [students, gradeFilter],
  );

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = students.filter((s) => {
      const matchGrade = gradeFilter === 'all' || s.grade === gradeFilter;
      const studentSection = s.section || s.branch || '';
      const matchSection = sectionFilter === 'all' || studentSection === sectionFilter;
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.nameEn || '').toLowerCase().includes(q) ||
        s.roll.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q);
      return matchGrade && matchSection && matchQuery;
    });
    return sortStudentsByRoll(matched);
  }, [students, gradeFilter, sectionFilter, searchQuery]);

  const selectedStudents = useMemo(
    () => sortStudentsByRoll(students.filter((s) => selectedIds.includes(s.id))),
    [students, selectedIds],
  );

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const allChecked =
      filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));
    if (allChecked) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const previewDrafts: CertificateRecord[] = useMemo(() => {
    const baseRef = buildDefaultRefNo(schoolSettings);
    return selectedStudents.map((st, idx) => {
      const draft = mapStudentToCertificateDraft(st, schoolSettings);
      if (certType === 'ssc_testimonial' || certType === 'transfer_certificate') {
        draft.currentlyStudying = false;
      }

      const body = composeCertificateBody({
        type: certType,
        language,
        draft,
        schoolSettings,
        selectedTraits: ['meritorious', 'regular', 'disciplined'],
        purposeId: 'general',
      });

      return {
        id: `PREVIEW-${st.roll || idx + 1}`,
        type: certType,
        title: getDefaultCertificateTitle(certType, language),
        refNo: `${baseRef}-${idx + 1}`,
        issueDate,
        status: 'valid',
        canvasMode: padCanvasMode,
        layoutStyle: 'pad',
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
        orientation: 'portrait',
        titleVariant: 'boxed',
        borderPreset: 'no_border_pad',
        showHeader: false,
        showPhotoBox,
        photoUrl: draft.photoUrl,
        showOfficeStub: false,
        showCornerBands: false,
        showQrCode,
        cursiveNames: true,
        fontSize: schoolSettings.padFontSize || 14.5,
        createdDate: issueDate,
      };
    });
  }, [
    selectedStudents,
    schoolSettings,
    certType,
    language,
    issueDate,
    padCanvasMode,
    showPhotoBox,
    showQrCode,
  ]);

  const activePrintList = generatedRecords.length > 0 ? generatedRecords : previewDrafts;

  const handleSaveBatch = () => {
    if (previewDrafts.length === 0) {
      onNotify('error', 'কমপক্ষে একজন শিক্ষার্থী নির্বাচন করুন!');
      return;
    }

    const inputs: CertificateInput[] = previewDrafts.map((item) => {
      const {
        id: _unused,
        createdDate: _cdate,
        verificationCode: _vc,
        status: _st,
        auditTrail: _at,
        ...rest
      } = item;
      return {
        ...rest,
        createdBy: createdByName,
      };
    });

    const saved = certificateService.saveBatchCertificates(inputs);
    setGeneratedRecords(saved);
    onBatchSaved(saved);
    onNotify('success', `${saved.length}টি সনদ রেজিস্টারে সংরক্ষিত হয়েছে!`);
  };

  return (
    <div className="space-y-5">
      {/* Compact Batch Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={certType}
              onChange={(e) => {
                setCertType(e.target.value as CertificateType);
                setGeneratedRecords([]);
              }}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
            >
              {ALL_CERTIFICATE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titleBn}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-[11px]">
              {[
                { id: 'bn' as const, label: 'বাংলা' },
                { id: 'en' as const, label: 'English' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setLanguage(l.id);
                    setGeneratedRecords([]);
                  }}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    language === l.id ? 'bg-indigo-600 text-white' : 'text-slate-500'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
            />

            <label className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 cursor-pointer px-2">
              <input
                type="checkbox"
                checked={showQrCode}
                onChange={(e) => {
                  setShowQrCode(e.target.checked);
                  setGeneratedRecords([]);
                }}
                className="rounded text-indigo-600 cursor-pointer"
              />
              QR
            </label>
            <label className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 cursor-pointer px-1">
              <input
                type="checkbox"
                checked={showPhotoBox}
                onChange={(e) => {
                  setShowPhotoBox(e.target.checked);
                  setGeneratedRecords([]);
                }}
                className="rounded text-indigo-600 cursor-pointer"
              />
              ছবি
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={selectedStudents.length === 0}
              className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
            >
              <CheckCircle2 size={14} /> সেভ ({selectedStudents.length})
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              disabled={activePrintList.length === 0}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
            >
              <Printer size={14} /> ব্যাচ প্রিন্ট ({activePrintList.length})
            </button>
          </div>
        </div>

        {/* Multi-student Filter & Picker */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-52">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নাম বা রোল..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                />
              </div>
              <select
                value={gradeFilter}
                onChange={(e) => {
                  setGradeFilter(e.target.value);
                  setSectionFilter('all');
                }}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
              >
                <option value="all">সকল শ্রেণি ({students.length})</option>
                {uniqueGrades.map((g) => (
                  <option key={g} value={g}>
                    শ্রেণি: {g}
                  </option>
                ))}
              </select>
              {uniqueSections.length > 0 && (
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                >
                  <option value="all">সকল শাখা</option>
                  {uniqueSections.map((sec) => (
                    <option key={sec} value={sec}>
                      শাখা: {sec}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-xs font-bold rounded-xl cursor-pointer transition"
              >
                সব নির্বাচন / বাতিল ({filteredStudents.length})
              </button>
            </div>

            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Users size={14} /> নির্বাচিত: {selectedStudents.length} জন
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
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
                      ? 'bg-indigo-600 text-white border-indigo-600'
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center space-y-1.5 print:hidden">
          <Sparkles className="mx-auto text-indigo-500" size={24} />
          <p className="text-xs font-black text-slate-800 dark:text-slate-100">
            ব্যাচ প্রিন্টের জন্য উপর থেকে শিক্ষার্থী বাছাই করুন
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            নির্বাচিত সবার সনদ আপনার আপলোডকৃত A4 প্যাডে একসাথে প্রস্তুত হয়ে যাবে।
          </p>
        </div>
      ) : (
        <div className="space-y-6 print:space-y-0">
          {activePrintList.map((cert, index) => (
            <div key={`${cert.id}-${index}`} className="certificate-batch-page">
              <OfficialCertificateDoc
                cert={cert}
                settings={schoolSettings}
                canvasMode={padCanvasMode}
                onOpenSettings={onOpenPadSettings}
                hideHeaderActions={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
