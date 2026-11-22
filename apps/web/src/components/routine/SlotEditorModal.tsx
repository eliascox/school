'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  DoorOpen,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import {
  RoutineConflict,
  RoutineDayKey,
  RoutinePeriod,
  RoutineSlot,
  routineService,
} from '@/services/routineService';
import type { SubjectAssignment, TeacherRecord } from '@/services/teacherRBACService';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import {
  branchToGroup,
  ClassOption,
  filterTeacherCandidates,
  formatClassIdBn,
  isTeacherAssignedForContext,
  toBanglaDigits,
} from './routineHelpers';

export interface EditingSlotContext {
  classOption: ClassOption;
  day: RoutineDayKey;
  dayBn: string;
  periodNo: number;
  existing?: RoutineSlot;
}

interface SlotEditorModalProps {
  editingSlot: EditingSlotContext | null;
  periods: RoutinePeriod[];
  routines: RoutineSlot[];
  teachers: TeacherRecord[];
  subjectAssignments: SubjectAssignment[];
  classOptions: ClassOption[];
  onClose: () => void;
  onSave: (slot: RoutineSlot) => void;
  onDelete: (slotId: string) => void;
}

export default function SlotEditorModal({
  editingSlot,
  periods,
  routines,
  teachers,
  subjectAssignments,
  classOptions,
  onClose,
  onSave,
  onDelete,
}: SlotEditorModalProps) {
  const [formSubject, setFormSubject] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formRoomNo, setFormRoomNo] = useState('');

  // Teacher filter controls
  const [teacherSearch, setTeacherSearch] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [assignedOnly, setAssignedOnly] = useState(false);

  const curriculumSubjects = useMemo(() => {
    if (!editingSlot) return [];
    return getActiveCurriculumSubjects(
      editingSlot.classOption.grade,
      branchToGroup(editingSlot.classOption.branch)
    );
  }, [editingSlot]);

  useEffect(() => {
    if (!editingSlot) return;
    setFormSubject(editingSlot.existing?.subject || curriculumSubjects[0]?.name || '');
    setFormTeacherId(editingSlot.existing?.teacherId || '');
    setFormRoomNo(editingSlot.existing?.roomNo || editingSlot.classOption.defaultRoom || '১০১');
    setTeacherSearch('');
    setFreeOnly(false);
    setAssignedOnly(false);
  }, [editingSlot, curriculumSubjects]);

  useEffect(() => {
    if (!editingSlot) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingSlot, onClose]);

  const teacherAvailability = useMemo(() => {
    if (!editingSlot) return [];
    return routineService.getTeacherAvailabilityForSlot(editingSlot.day, editingSlot.periodNo, {
      excludeSlotId: editingSlot.existing?.id,
      excludeClassId: editingSlot.classOption.classId,
      routines,
      teachers,
      subjectAssignments,
    });
  }, [editingSlot, routines, teachers, subjectAssignments]);

  const filteredCandidates = useMemo(
    () =>
      filterTeacherCandidates(teacherAvailability, {
        query: teacherSearch,
        freeOnly,
        assignedOnly,
        targetGrade: editingSlot?.classOption.grade,
        targetSubject: formSubject,
      }),
    [teacherAvailability, teacherSearch, freeOnly, assignedOnly, editingSlot, formSubject]
  );

  const freeTeachersCount = useMemo(
    () => teacherAvailability.filter((c) => c.isFree).length,
    [teacherAvailability]
  );

  const assignedTeachersCount = useMemo(
    () =>
      teacherAvailability.filter((c) =>
        isTeacherAssignedForContext(c, editingSlot?.classOption.grade, formSubject)
      ).length,
    [teacherAvailability, editingSlot, formSubject]
  );

  const selectedTeacherObj = useMemo(
    () => teachers.find((t) => t.id === formTeacherId) || null,
    [teachers, formTeacherId]
  );

  const liveConflicts: RoutineConflict[] = useMemo(() => {
    if (!editingSlot || !selectedTeacherObj) return [];
    const candidate: RoutineSlot = {
      id:
        editingSlot.existing?.id ||
        `ROT-${editingSlot.classOption.classId}-${editingSlot.day}-P${editingSlot.periodNo}`,
      classId: editingSlot.classOption.classId,
      grade: editingSlot.classOption.grade,
      branch: editingSlot.classOption.branch,
      day: editingSlot.day,
      dayBn: editingSlot.dayBn,
      periodNo: editingSlot.periodNo,
      subject: formSubject.trim() || 'বিষয়',
      teacherId: selectedTeacherObj.id,
      teacherName: selectedTeacherObj.name,
      roomNo: formRoomNo.trim() || '১০১',
    };
    return routineService.detectAllConflicts(candidate, routines);
  }, [editingSlot, selectedTeacherObj, formSubject, formRoomNo, routines]);

  const teacherConflict = liveConflicts.find((c) => c.type === 'teacher') || null;
  const roomConflict = liveConflicts.find((c) => c.type === 'room') || null;

  if (!editingSlot) return null;

  const periodMeta = periods.find((p) => p.periodNo === editingSlot.periodNo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !selectedTeacherObj || liveConflicts.length > 0) return;

    const slot: RoutineSlot = {
      id:
        editingSlot.existing?.id ||
        `ROT-${editingSlot.classOption.classId}-${editingSlot.day}-P${editingSlot.periodNo}`,
      classId: editingSlot.classOption.classId,
      grade: editingSlot.classOption.grade,
      branch: editingSlot.classOption.branch,
      day: editingSlot.day,
      dayBn: editingSlot.dayBn,
      periodNo: editingSlot.periodNo,
      subject: formSubject.trim(),
      teacherId: selectedTeacherObj.id,
      teacherName: selectedTeacherObj.name,
      roomNo: formRoomNo.trim() || editingSlot.classOption.defaultRoom || '১০১',
    };

    onSave(slot);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              পিরিয়ড নির্ধারণ ও সম্পাদনা
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              {editingSlot.classOption.label} • {editingSlot.dayBn} •{' '}
              {periodMeta
                ? `${periodMeta.periodName} (${periodMeta.startTime} – ${periodMeta.endTime})`
                : `পিরিয়ড ${toBanglaDigits(editingSlot.periodNo)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X size={16} />
          </button>
        </div>

        {/* Real-time Conflict Alerts (Explicit Class, Branch & Subject) */}
        {teacherConflict && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-700 dark:text-rose-300">
              <AlertTriangle size={15} className="shrink-0" />
              <span>শিক্ষক ডাবল-বুকিং কনফ্লিক্ট!</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed">
              <strong>{selectedTeacherObj?.name}</strong> এই একই সময়ে ({editingSlot.dayBn} •{' '}
              {periodMeta?.periodName || `পিরিয়ড ${toBanglaDigits(editingSlot.periodNo)}`}) ইতোমধ্যেই{' '}
              <strong>
                {formatClassIdBn(teacherConflict.conflictingSlot.classId, classOptions)}
              </strong>{' '}
              ক্লাসে <strong>&ldquo;{teacherConflict.conflictingSlot.subject}&rdquo;</strong> (রুম:{' '}
              {teacherConflict.conflictingSlot.roomNo}) নির্ধারিত আছেন। অনুগ্রহ করে অন্য ফ্রি শিক্ষক নির্বাচন করুন।
            </p>
          </div>
        )}

        {roomConflict && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800 dark:text-amber-300">
              <AlertTriangle size={15} className="shrink-0" />
              <span>কক্ষ নম্বর কনফ্লিক্ট!</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed">
              কক্ষ <strong>{formRoomNo}</strong> এই একই সময়ে{' '}
              <strong>
                {formatClassIdBn(roomConflict.conflictingSlot.classId, classOptions)}
              </strong>{' '}
              ({roomConflict.conflictingSlot.subject}) ক্লাসের জন্য ব্যবহৃত হচ্ছে। অন্য কক্ষ নম্বর দিন।
            </p>
          </div>
        )}

        {/* Subject & Room Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              বিষয় (Subject) *
            </label>
            <div className="relative">
              <BookOpen
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                list="routine-slot-subjects"
                required
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="যেমন: বাংলা ১ম পত্র, গণিত বা ইংরেজি"
                className="w-full h-10 pl-8 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
              />
              <datalist id="routine-slot-subjects">
                {curriculumSubjects.map((sub) => (
                  <option key={sub.code} value={sub.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              কক্ষ নম্বর (Room) *
            </label>
            <div className="relative">
              <DoorOpen
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                required
                value={formRoomNo}
                onChange={(e) => setFormRoomNo(e.target.value)}
                placeholder="যেমন: ১০১"
                className="w-full h-10 pl-8 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
              />
            </div>
          </div>
        </div>

        {/* Quick Subject Chips */}
        {curriculumSubjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {curriculumSubjects.slice(0, 8).map((sub) => {
              const active = formSubject.trim() === sub.name;
              return (
                <button
                  key={sub.code}
                  type="button"
                  onClick={() => setFormSubject(sub.name)}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border transition cursor-pointer ${
                    active
                      ? 'bg-[#0B5D3B] text-white border-[#0B5D3B]'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Teacher Filter & Conflict-Aware Picker */}
        <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <UserCheck size={14} className="text-[#0B5D3B] dark:text-emerald-400" />
              নির্ধারিত শিক্ষক বাছাই *
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFreeOnly((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                  freeOnly
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                শুধু এই পিরিয়ডে ফ্রি ({toBanglaDigits(freeTeachersCount)})
              </button>
              <button
                type="button"
                onClick={() => setAssignedOnly((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                  assignedOnly
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                বিষয়ভিত্তিক শিক্ষক ({toBanglaDigits(assignedTeachersCount)})
              </button>
            </div>
          </div>

          {/* Search Teachers */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              placeholder="শিক্ষকের নাম, পদবী, ফোন বা বিষয় দিয়ে খুঁজুন..."
              className="w-full h-9 pl-8 pr-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#0B5D3B] transition"
            />
            {teacherSearch && (
              <button
                type="button"
                onClick={() => setTeacherSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="সার্চ মুছুন"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Teacher Candidate List */}
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {filteredCandidates.length === 0 ? (
              <div className="p-6 text-center text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/70 dark:border-slate-800">
                {teachers.length === 0
                  ? 'কোনো সক্রিয় শিক্ষক পাওয়া যায়নি। আগে শিক্ষক তালিকা থেকে শিক্ষক যোগ করুন।'
                  : 'এই ফিল্টারে কোনো শিক্ষক পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন।'}
              </div>
            ) : (
              filteredCandidates.map((item) => {
                const isSelected = formTeacherId === item.teacher.id;
                const isMatchedSub = isTeacherAssignedForContext(
                  item,
                  editingSlot.classOption.grade,
                  formSubject
                );

                return (
                  <button
                    key={item.teacher.id}
                    type="button"
                    onClick={() => setFormTeacherId(item.teacher.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? item.isFree
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-[#0B5D3B] dark:border-emerald-600 ring-1 ring-[#0B5D3B]/20'
                          : 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-400 dark:border-rose-700 ring-1 ring-rose-500/20'
                        : 'bg-white dark:bg-slate-950/50 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {item.teacher.name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          ({item.teacher.designation})
                        </span>
                        {isMatchedSub && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-[#0B5D3B] dark:text-emerald-300 text-[9.5px] font-extrabold">
                            নির্ধারিত বিষয়
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-slate-500 dark:text-slate-400">
                        <span>
                          এই বারে: {toBanglaDigits(item.dayLoad)} • সপ্তাহে:{' '}
                          {toBanglaDigits(item.weeklyLoad)} পিরিয়ড
                        </span>
                      </div>
                      {!item.isFree && item.conflictingSlot && (
                        <p className="text-[10.5px] font-bold text-rose-700 dark:text-rose-300">
                          সংঘর্ষ: {formatClassIdBn(item.conflictingSlot.classId, classOptions)} •{' '}
                          {item.conflictingSlot.subject} (রুম: {item.conflictingSlot.roomNo})
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {item.isFree ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#0B5D3B] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-bold">
                          <CheckCircle2 size={10} /> ফ্রি
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 text-[10px] font-bold">
                          <AlertTriangle size={10} /> ব্যস্ত
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          {editingSlot.existing ? (
            <button
              type="button"
              onClick={() => onDelete(editingSlot.existing!.id)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Trash2 size={13} /> স্লট মুছুন
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={!formSubject.trim() || !selectedTeacherObj || liveConflicts.length > 0}
              className="px-5 py-2 rounded-xl bg-[#0B5D3B] hover:bg-emerald-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold cursor-pointer transition"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
