'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Image as ImageIcon,
  Scissors,
  ShieldCheck,
  User,
} from 'lucide-react';
import type { SchoolSettings } from '@/services/settingsService';
import {
  type AdmitCardDesignOptions,
  type AdmitCardLayoutId,
  type AdmitCardStudent,
  type AdmitDocLang,
  type AdmitScheduleEntry,
  buildAdmitQrPayload,
  formatAdmitDigits,
  formatAdmitExamTitle,
  formatAdmitGradeLabel,
  formatAdmitReligion,
  formatAdmitSectionOrGroup,
  getAdmitDocLabels,
  getAdmitInstitutionHeader,
} from '@/lib/admitCardStudioUtils';

function AdmitQRCode({ text, sizePx }: { text: string; sizePx: number }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(text, {
      margin: 1,
      width: 180,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [text]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: sizePx, height: sizePx }}
        className="bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-[7px] text-slate-400 font-bold"
      >
        QR
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="QR"
      style={{ width: sizePx, height: sizePx }}
      className="object-contain select-none rounded-[2px]"
    />
  );
}

interface SingleAdmitCardProps {
  student: AdmitCardStudent;
  settings: SchoolSettings;
  selectedExam: string;
  docLang: AdmitDocLang;
  layoutId: AdmitCardLayoutId;
  design: AdmitCardDesignOptions;
  schedule: AdmitScheduleEntry[];
  photoMap: Record<string, string>;
  draggingStudentId: string | null;
  onDragStudentChange: (id: string | null) => void;
  onUploadPhoto: (studentId: string, file: File) => void;
}

function SingleAdmitCard({
  student,
  settings,
  selectedExam,
  docLang,
  layoutId,
  design,
  schedule,
  photoMap,
  draggingStudentId,
  onDragStudentChange,
  onUploadPhoto,
}: SingleAdmitCardProps) {
  const header = getAdmitInstitutionHeader(settings, docLang);
  const labels = getAdmitDocLabels(docLang);
  const examTitle = formatAdmitExamTitle(selectedExam, docLang);
  const gradeLabel = formatAdmitGradeLabel(student.gradeKey, docLang);
  const secGroupLabel = formatAdmitSectionOrGroup(
    student.gradeKey,
    student.section,
    student.groupBn,
    docLang,
  );
  const displayName = docLang === 'en' ? student.nameEn || student.name : student.name;
  const rollText = formatAdmitDigits(student.roll, docLang);
  const regText = formatAdmitDigits(student.regNo, docLang);
  const sessionText = formatAdmitDigits(design.sessionYear || '2026', docLang);
  const religionText = formatAdmitReligion(student.religion, docLang);

  const isCompact4 = layoutId === 'compact_four_per_a4';
  const isFullA4 = layoutId === 'single_full_a4';
  const isTwoCol = layoutId === 'two_col_grid';
  const showRoutineTable =
    design.showRoutine && !isCompact4 && schedule.length > 0;

  const gradeNorm = student.gradeKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  const photoSrc =
    student.photoUrl ||
    photoMap[student.id] ||
    (student.roll ? photoMap[`${gradeNorm}_${student.roll}`] : '') ||
    (student.roll ? photoMap[student.roll] : '') ||
    '';

  const qrText = buildAdmitQrPayload({
    student,
    schoolName: header.schoolName,
    examTitle,
    sessionYear: design.sessionYear || '2026',
    lang: docLang,
  });

  const brandColor = design.inkSaver ? '#000000' : '#006a4e';
  const badgeBg = design.inkSaver
    ? '#111827'
    : 'linear-gradient(135deg, #0f5132 0%, #198754 100%)';
  const accentText = design.inkSaver ? '#000000' : '#1e1b4b';
  const labelBg = design.inkSaver ? '#ffffff' : '#f8fafc';

  const qrSize = isCompact4 ? 46 : isFullA4 ? 76 : isTwoCol ? 58 : 66;
  const photoW = isCompact4 ? 52 : isFullA4 ? 86 : isTwoCol ? 64 : 74;
  const photoH = isCompact4 ? 62 : isFullA4 ? 102 : isTwoCol ? 76 : 86;

  return (
    <div
      className={`admit-card-unit bg-white text-slate-950 relative overflow-hidden flex flex-col justify-between transition-shadow ${
        draggingStudentId === student.id ? 'ring-4 ring-indigo-500' : ''
      }`}
      style={{
        border: design.showBorder ? '2px solid #0f172a' : '1px solid #cbd5e1',
        borderRadius: design.showBorder ? '6px' : '2px',
        height: '100%',
        boxSizing: 'border-box',
      }}
      onDragOver={(e) => {
        if (student.isSample) return;
        e.preventDefault();
        onDragStudentChange(student.id);
      }}
      onDragLeave={() => onDragStudentChange(null)}
      onDrop={(e) => {
        if (student.isSample) return;
        e.preventDefault();
        onDragStudentChange(null);
        const file = e.dataTransfer.files?.[0];
        if (file) onUploadPhoto(student.id, file);
      }}
    >
      {/* Ornamental Corner Brackets */}
      {design.showBorder && (
        <>
          <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-slate-900 pointer-events-none z-20" />
          <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-slate-900 pointer-events-none z-20" />
          <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-slate-900 pointer-events-none z-20" />
          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-slate-900 pointer-events-none z-20" />
        </>
      )}

      {/* Institutional Watermark */}
      {design.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.schoolLogo || '/logo.png'}
            alt=""
            className={`${isCompact4 ? 'w-28 h-28' : isFullA4 ? 'w-64 h-64' : 'w-44 h-44'} object-contain grayscale`}
          />
        </div>
      )}

      {/* Inner Frame */}
      <div
        className="relative z-10 flex flex-col h-full justify-between"
        style={{
          border: design.showBorder ? '1px solid #94a3b8' : 'none',
          margin: design.showBorder ? '3px' : '0px',
          background: 'transparent',
        }}
      >
        {/* ── 1. TOP INSTITUTIONAL LETTERHEAD (<div>, NEVER <header>) ── */}
        <div
          className={`border-b border-slate-800 ${
            isCompact4 ? 'px-2 py-1.5' : isFullA4 ? 'px-5 py-3.5' : 'px-3 py-2'
          }`}
          style={{ background: design.inkSaver ? '#ffffff' : 'linear-gradient(180deg,#f8fafc,#ffffff)' }}
        >
          <div className="flex items-center justify-between gap-2">
            {/* LEFT: QR Box */}
            {design.showQr ? (
              <div className="shrink-0 flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded">
                {!isCompact4 && (
                  <div className="w-full text-center pb-0.5 mb-0.5 border-b border-slate-200 flex items-center justify-center gap-0.5">
                    <ShieldCheck size={8} className={design.inkSaver ? 'text-black' : 'text-indigo-700'} />
                    <span className="text-[6.5px] font-black text-slate-900 tracking-tight">
                      {labels.qrLabel}
                    </span>
                  </div>
                )}
                <AdmitQRCode text={qrText} sizePx={qrSize} />
              </div>
            ) : (
              <div className="w-2 shrink-0" />
            )}

            {/* CENTER: School Crest + Name + Address + Admit Badge + Exam Name */}
            <div className="flex-1 min-w-0 text-center flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.schoolLogo || '/logo.png'}
                  alt="School Logo"
                  className={`${
                    isCompact4 ? 'w-8 h-8' : isFullA4 ? 'w-14 h-14' : 'w-11 h-11'
                  } object-contain shrink-0 ${design.inkSaver ? 'grayscale' : ''}`}
                />
                <div className="min-w-0 text-center">
                  <div
                    className={`${
                      isCompact4
                        ? 'text-[13px]'
                        : isFullA4
                        ? 'text-[24px]'
                        : isTwoCol
                        ? 'text-[16px]'
                        : 'text-[19px]'
                    } font-black tracking-tight leading-tight`}
                    style={{ color: brandColor, fontFamily: 'serif' }}
                  >
                    {header.schoolName}
                  </div>
                  {header.address && (
                    <div
                      className={`${
                        isCompact4 ? 'text-[7.5px]' : isFullA4 ? 'text-[11px]' : 'text-[9.5px]'
                      } font-bold text-slate-900 leading-tight mt-0.5`}
                    >
                      {header.address}
                    </div>
                  )}
                  {header.metaLine && (
                    <div
                      className={`${
                        isCompact4 ? 'text-[7px]' : isFullA4 ? 'text-[10px]' : 'text-[8.5px]'
                      } font-bold text-slate-800 leading-tight`}
                    >
                      {header.metaLine}
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex flex-wrap items-center justify-center gap-1.5 ${isCompact4 ? 'mt-1' : 'mt-1.5'}`}>
                <span
                  className={`inline-flex items-center font-black text-white tracking-widest ${
                    isCompact4 ? 'px-2.5 py-0.5 text-[8px]' : isFullA4 ? 'px-6 py-1 text-[12px]' : 'px-4 py-0.5 text-[10px]'
                  }`}
                  style={{
                    background: badgeBg,
                    borderRadius: '999px',
                    border: '1px solid #0f172a',
                  }}
                >
                  {labels.badgeTitle}
                </span>
                <span
                  className={`inline-block font-black text-black bg-white rounded border border-slate-900 ${
                    isCompact4 ? 'px-2 py-0.5 text-[8.5px]' : isFullA4 ? 'px-4 py-1 text-[13px]' : 'px-3 py-0.5 text-[11px]'
                  }`}
                >
                  {examTitle}
                </span>
              </div>
            </div>

            {/* RIGHT: Passport Photo Box (Interactive Click + Drag & Drop) */}
            <div className="shrink-0 flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded">
              {!isCompact4 && (
                <div className="w-full text-center pb-0.5 mb-0.5 border-b border-slate-200 flex items-center justify-center gap-0.5">
                  <User size={8} className={design.inkSaver ? 'text-black' : 'text-indigo-700'} />
                  <span className="text-[6.5px] font-black text-slate-800 tracking-tight">
                    {labels.photoLabel}
                  </span>
                </div>
              )}
              <label
                className={`relative group flex flex-col items-center justify-center overflow-hidden ${
                  student.isSample ? 'cursor-default' : 'cursor-pointer'
                }`}
                style={{
                  width: photoW,
                  height: photoH,
                  border: photoSrc ? '1.5px solid #0f172a' : '1.5px dashed #94a3b8',
                  background: photoSrc ? 'transparent' : '#f8fafc',
                  borderRadius: '2px',
                }}
              >
                {photoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoSrc} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="p-1 text-center space-y-0.5">
                    <ImageIcon className={`${isCompact4 ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-slate-400 mx-auto`} />
                    <span className="text-[6.5px] font-bold text-slate-500 block leading-tight">
                      {labels.uploadPhotoHint}
                    </span>
                  </div>
                )}
                {!student.isSample && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUploadPhoto(student.id, file);
                      }}
                      className="hidden"
                    />
                    <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[8px] font-bold print:hidden">
                      {labels.changePhotoHint}
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* ── 2. STUDENT DETAILS TABLE ── */}
        <div className={isCompact4 ? 'px-2 pt-1.5 pb-1' : isFullA4 ? 'px-5 pt-3.5 pb-2' : 'px-3 pt-2 pb-1'}>
          <table
            className={`w-full border border-slate-900 ${
              isCompact4 ? 'text-[8.5px]' : isFullA4 ? 'text-[12.5px]' : isTwoCol ? 'text-[10px]' : 'text-[11px]'
            }`}
            style={{ borderCollapse: 'collapse' }}
          >
            <tbody>
              <tr className="border-b border-slate-900">
                <td
                  className="font-bold text-slate-900 border-r border-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '6px 10px' : '3px 7px', width: '26%', background: labelBg }}
                >
                  {labels.studentName}
                </td>
                <td
                  colSpan={3}
                  className={`font-black ${isCompact4 ? 'text-[9.5px]' : isFullA4 ? 'text-[15px]' : 'text-[12.5px]'}`}
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '6px 10px' : '3px 7px', color: accentText }}
                >
                  {displayName}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td
                  className="font-bold text-slate-900 border-r border-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px', background: labelBg }}
                >
                  {labels.fatherName}
                </td>
                <td
                  colSpan={isCompact4 ? 3 : 1}
                  className="font-bold text-slate-900 border-r border-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px' }}
                >
                  {student.fatherName}
                </td>
                {!isCompact4 && (
                  <>
                    <td
                      className="font-bold text-slate-900 border-r border-slate-900"
                      style={{ padding: isFullA4 ? '5px 10px' : '2.5px 7px', width: '21%', background: labelBg }}
                    >
                      {labels.motherName}
                    </td>
                    <td
                      className="font-bold text-slate-900"
                      style={{ padding: isFullA4 ? '5px 10px' : '2.5px 7px', width: '27%' }}
                    >
                      {student.motherName}
                    </td>
                  </>
                )}
              </tr>
              <tr className="border-b border-slate-900">
                <td
                  className="font-bold text-slate-900 border-r border-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px', background: labelBg }}
                >
                  {labels.classLabel}
                </td>
                <td
                  className="font-black text-slate-950 border-r border-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px' }}
                >
                  {gradeLabel}
                </td>
                <td
                  className="font-bold text-slate-900 border-r border-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px', width: '21%', background: labelBg }}
                >
                  {labels.sectionOrGroup}
                </td>
                <td
                  className="font-black text-slate-950"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px' }}
                >
                  {secGroupLabel}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td
                  className="font-bold text-slate-900 border-r border-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px', background: labelBg }}
                >
                  {labels.rollNo}
                </td>
                <td
                  className={`font-mono font-black border-r border-slate-900 ${
                    isCompact4 ? 'text-[10.5px]' : isFullA4 ? 'text-[16px]' : 'text-[13px]'
                  }`}
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px', color: brandColor }}
                >
                  {rollText}
                </td>
                <td
                  className="font-bold text-slate-900 border-r border-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px', background: labelBg }}
                >
                  {labels.regNo}
                </td>
                <td
                  className="font-mono font-bold text-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px' }}
                >
                  {regText}
                </td>
              </tr>
              <tr>
                <td
                  className="font-bold text-slate-900 border-r border-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px', background: labelBg }}
                >
                  {labels.religion}
                </td>
                <td
                  className="font-bold text-slate-900 border-r border-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px' }}
                >
                  {religionText}
                </td>
                <td
                  className="font-bold text-slate-900 border-r border-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px', background: labelBg }}
                >
                  {labels.session}
                </td>
                <td
                  className="font-mono font-bold text-slate-900"
                  style={{ padding: isCompact4 ? '2px 5px' : isFullA4 ? '5px 10px' : '2.5px 7px' }}
                >
                  {sessionText}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── 3. OPTIONAL EXAM ROUTINE SCHEDULE TABLE ── */}
        {showRoutineTable && (
          <div className={isFullA4 ? 'px-5 py-2 flex-1' : 'px-3 py-1'}>
            <div
              className={`font-black text-slate-950 tracking-wide mb-1 ${
                isFullA4 ? 'text-[11px]' : 'text-[8.5px]'
              }`}
            >
              {labels.routineHeading}
            </div>
            <table
              className={`w-full border border-slate-900 ${
                isFullA4 ? 'text-[11px]' : 'text-[8px]'
              }`}
              style={{ borderCollapse: 'collapse' }}
            >
              <thead>
                <tr
                  className="border-b border-slate-900 font-black text-slate-950"
                  style={{ background: design.inkSaver ? '#f3f4f6' : '#f1f5f9' }}
                >
                  <th className="border-r border-slate-900 px-1.5 py-0.5 text-center w-20">{labels.colDate}</th>
                  <th className="border-r border-slate-900 px-1.5 py-0.5 text-center w-12">{labels.colCode}</th>
                  <th className="border-r border-slate-900 px-1.5 py-0.5 text-left">{labels.colSubject}</th>
                  <th className="px-1.5 py-0.5 text-center w-24">{labels.colTime}</th>
                </tr>
              </thead>
              <tbody>
                {(isFullA4 ? schedule : schedule.slice(0, 6)).map((row) => (
                  <tr key={row.id} className="border-b border-slate-800 last:border-b-0">
                    <td className="border-r border-slate-900 px-1.5 py-0.5 text-center font-mono font-bold">
                      {formatAdmitDigits(row.examDate, docLang)}
                    </td>
                    <td className="border-r border-slate-900 px-1.5 py-0.5 text-center font-mono font-bold">
                      {formatAdmitDigits(row.subjectCode, docLang)}
                    </td>
                    <td className="border-r border-slate-900 px-1.5 py-0.5 font-bold">
                      {docLang === 'en' ? row.subjectNameEn : row.subjectNameBn}
                    </td>
                    <td className="px-1.5 py-0.5 text-center font-mono font-semibold">
                      {formatAdmitDigits(row.examTime, docLang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 4. OPTIONAL INSTRUCTIONS STRIP (Strict Single-Language) ── */}
        {design.showInstructions && !isCompact4 && (
          <div
            className={`border-t border-slate-800 ${
              isFullA4 ? 'px-5 py-2.5 text-[10.5px]' : 'px-3 py-1.5 text-[8px]'
            } text-slate-900 font-semibold`}
            style={{ background: design.inkSaver ? '#ffffff' : '#f8fafc' }}
          >
            <div className={`font-black text-slate-950 mb-0.5 ${isFullA4 ? 'text-[11px]' : 'text-[8px]'}`}>
              {labels.instructionsHeading}:
            </div>
            <div className={`grid ${isFullA4 ? 'grid-cols-1 gap-y-1' : 'grid-cols-2 gap-x-3 gap-y-0.5'} leading-snug`}>
              {labels.instructions.map((line, i) => (
                <span key={i}>{line}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. OFFICIAL SIGNATURE FOOTER (Strict Single-Language, Atomic) ── */}
        <div
          className={`flex items-end justify-between text-center border-t border-slate-800 bg-white mt-auto ${
            isCompact4 ? 'px-3 pt-4 pb-1.5' : isFullA4 ? 'px-10 pt-14 pb-4' : 'px-5 pt-6 pb-2'
          }`}
        >
          <div>
            <div
              className="mx-auto border-b border-dashed border-slate-700"
              style={{ width: isCompact4 ? '68px' : isFullA4 ? '130px' : '95px' }}
            />
            <p className={`${isCompact4 ? 'text-[7px]' : isFullA4 ? 'text-[11px]' : 'text-[8.5px]'} font-bold text-slate-900 mt-1`}>
              {labels.sigExaminee}
            </p>
          </div>
          {!isCompact4 && (
            <div>
              <div
                className="mx-auto border-b border-dashed border-slate-700"
                style={{ width: isFullA4 ? '130px' : '100px' }}
              />
              <p className={`${isFullA4 ? 'text-[11px]' : 'text-[8.5px]'} font-bold text-slate-900 mt-1`}>
                {header.classTeacherTitle}
              </p>
            </div>
          )}
          <div>
            <div
              className="mx-auto border-b border-dashed border-slate-700"
              style={{ width: isCompact4 ? '76px' : isFullA4 ? '145px' : '110px' }}
            />
            <p className={`${isCompact4 ? 'text-[7.5px]' : isFullA4 ? 'text-[11.5px]' : 'text-[9px]'} font-black text-slate-950 mt-1`}>
              {header.principalTitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface AdmitCardSheetCanvasProps {
  pages: AdmitCardStudent[][];
  viewAllPages: boolean;
  currentPage: number;
  settings: SchoolSettings;
  selectedExam: string;
  docLang: AdmitDocLang;
  layoutId: AdmitCardLayoutId;
  design: AdmitCardDesignOptions;
  schedule: AdmitScheduleEntry[];
  photoMap: Record<string, string>;
  draggingStudentId: string | null;
  onDragStudentChange: (id: string | null) => void;
  onUploadPhoto: (studentId: string, file: File) => void;
}

export function AdmitCardSheetCanvas({
  pages,
  viewAllPages,
  currentPage,
  settings,
  selectedExam,
  docLang,
  layoutId,
  design,
  schedule,
  photoMap,
  draggingStudentId,
  onDragStudentChange,
  onUploadPhoto,
}: AdmitCardSheetCanvasProps) {
  const labels = getAdmitDocLabels(docLang);
  const isLandscape = layoutId === 'two_col_grid';
  const isCompact4 = layoutId === 'compact_four_per_a4';
  const isFullA4 = layoutId === 'single_full_a4';

  return (
    <div className="space-y-6 print:space-y-0">
      {pages.map((pageCards, pageIdx) => {
        const pageNum = pageIdx + 1;
        const isLastPage = pageIdx === pages.length - 1;
        const hiddenOnScreen = !viewAllPages && currentPage !== pageNum;

        return (
          <div
            key={`admit-sheet-${pageNum}`}
            style={hiddenOnScreen ? { display: 'none' } : undefined}
            className={`admit-a4-sheet mx-auto bg-white shadow-md dark:shadow-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl print:shadow-none print:border-0 print:rounded-none ${
              !isLastPage ? 'admit-page-break' : ''
            } ${
              isLandscape
                ? 'w-full max-w-[1060px] p-4 sm:p-5 print:w-[297mm] print:h-[209mm] print:p-[6mm]'
                : 'w-full max-w-[780px] p-4 sm:p-5 print:w-[210mm] print:h-[296mm] print:p-[6mm]'
            }`}
          >
            {/* 1 PER A4 (Full Page Board-Style) */}
            {isFullA4 && (
              <div className="min-h-[820px] print:h-full">
                {pageCards[0] && (
                  <SingleAdmitCard
                    student={pageCards[0]}
                    settings={settings}
                    selectedExam={selectedExam}
                    docLang={docLang}
                    layoutId={layoutId}
                    design={design}
                    schedule={schedule}
                    photoMap={photoMap}
                    draggingStudentId={draggingStudentId}
                    onDragStudentChange={onDragStudentChange}
                    onUploadPhoto={onUploadPhoto}
                  />
                )}
              </div>
            )}

            {/* 2 PER A4 PORTRAIT (A5 x 2 Stacked) */}
            {layoutId === 'a5_two_per_a4' && (
              <div className="flex flex-col justify-between gap-4 print:gap-0 print:h-full">
                {pageCards.map((st, cardIdx) => (
                  <React.Fragment key={st.id}>
                    <div className="print:h-[138mm]">
                      <SingleAdmitCard
                        student={st}
                        settings={settings}
                        selectedExam={selectedExam}
                        docLang={docLang}
                        layoutId={layoutId}
                        design={design}
                        schedule={schedule}
                        photoMap={photoMap}
                        draggingStudentId={draggingStudentId}
                        onDragStudentChange={onDragStudentChange}
                        onUploadPhoto={onUploadPhoto}
                      />
                    </div>
                    {cardIdx === 0 && pageCards.length > 1 && design.showCutGuide && (
                      <div className="flex items-center justify-center gap-2 py-0.5 print:py-1">
                        <div className="flex-1 border-b border-dashed border-slate-400" />
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[8.5px] font-bold border border-slate-300">
                          <Scissors size={9} /> {labels.cutGuideText}
                        </span>
                        <div className="flex-1 border-b border-dashed border-slate-400" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* 4 PER A4 PORTRAIT (2x2 Eco Compact Grid) */}
            {isCompact4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 print:gap-3 print:h-full">
                {pageCards.map((st) => (
                  <div
                    key={st.id}
                    className={`min-h-[300px] print:h-[139mm] ${
                      design.showCutGuide ? 'p-0.5 border border-dashed border-slate-300 rounded-md' : ''
                    }`}
                  >
                    <SingleAdmitCard
                      student={st}
                      settings={settings}
                      selectedExam={selectedExam}
                      docLang={docLang}
                      layoutId={layoutId}
                      design={design}
                      schedule={schedule}
                      photoMap={photoMap}
                      draggingStudentId={draggingStudentId}
                      onDragStudentChange={onDragStudentChange}
                      onUploadPhoto={onUploadPhoto}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 2-COLUMN A4 LANDSCAPE SIDE-BY-SIDE */}
            {isLandscape && (
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-4 print:h-full">
                {pageCards.map((st, idx) => (
                  <div
                    key={st.id}
                    className={`min-h-[500px] print:h-full ${
                      design.showCutGuide && idx === 0
                        ? 'md:border-r md:border-dashed md:border-slate-400 md:pr-4 print:border-r print:border-dashed print:border-slate-500 print:pr-4'
                        : ''
                    }`}
                  >
                    <SingleAdmitCard
                      student={st}
                      settings={settings}
                      selectedExam={selectedExam}
                      docLang={docLang}
                      layoutId={layoutId}
                      design={design}
                      schedule={schedule}
                      photoMap={photoMap}
                      draggingStudentId={draggingStudentId}
                      onDragStudentChange={onDragStudentChange}
                      onUploadPhoto={onUploadPhoto}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
