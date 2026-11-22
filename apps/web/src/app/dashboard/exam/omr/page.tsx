'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScanLine,
  KeyRound,
  Printer,
  BarChart3,
  ChevronDown,
  RefreshCw,
  Check,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { examService, ExamItem } from '@/services/examService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { teacherAuthService, UserSession } from '@/services/teacherAuthService';
import { teacherRBACService, SubjectAssignment } from '@/services/teacherRBACService';
import { getActiveCurriculumSubjects } from '@/lib/curriculumUtils';
import {
  OmrExamSession,
  OmrScanRecord,
  normalizeGroupToBn,
  normalizeGroupToCode,
  omrService,
} from '@/services/omrService';
import OmrScannerTab from '@/components/omr/OmrScannerTab';
import OmrAnswerKeyTab from '@/components/omr/OmrAnswerKeyTab';
import OmrSheetStudioTab from '@/components/omr/OmrSheetStudioTab';
import OmrResultsSyncTab from '@/components/omr/OmrResultsSyncTab';
import OmrVerifyModal from '@/components/omr/OmrVerifyModal';
import { showToast } from '@/components/ui/ToastProvider';

type OmrActiveTab = 'scanner' | 'key' | 'studio' | 'results';

const GRADES: Array<{ id: string; labelBn: string }> = [
  { id: '6th', labelBn: '৬ষ্ঠ শ্রেণি' },
  { id: '7th', labelBn: '৭ম শ্রেণি' },
  { id: '8th', labelBn: '৮ম শ্রেণি' },
  { id: '9th', labelBn: '৯ম শ্রেণি' },
  { id: '10th', labelBn: '১০ম শ্রেণি' },
];

const SECTIONS_6_TO_8 = ['A', 'B', 'C'];
const GROUPS_9_TO_10: Array<{ code: 'science' | 'humanities' | 'commerce'; branch: string; labelBn: string }> = [
  { code: 'science', branch: 'Science', labelBn: 'বিজ্ঞান' },
  { code: 'humanities', branch: 'Humanities', labelBn: 'মানবিক' },
  { code: 'commerce', branch: 'Commerce', labelBn: 'ব্যবসায় শিক্ষা' },
];

export default function OmrStudioAndScannerPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<SubjectAssignment[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [exams, setExams] = useState<ExamItem[]>([]);

  const [activeTab, setActiveTab] = useState<OmrActiveTab>('scanner');
  const [selectedExamTitle, setSelectedExamTitle] = useState<string>('অর্ধ-বার্ষিক পরীক্ষা ২০২৬');
  const [selectedGrade, setSelectedGrade] = useState<string>('9th');
  const [selectedBranch, setSelectedBranch] = useState<string>('Science');
  const [selectedGroup, setSelectedGroup] = useState<'science' | 'humanities' | 'commerce'>('science');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const [allSessions, setAllSessions] = useState<OmrExamSession[]>([]);
  const [activeSession, setActiveSession] = useState<OmrExamSession | null>(null);
  const [sessionScans, setSessionScans] = useState<OmrScanRecord[]>([]);
  const [inspectingScan, setInspectingScan] = useState<OmrScanRecord | null>(null);
  const [versionTick, setVersionTick] = useState(0);

  // Boot session, exams, settings & teacher RBAC
  useEffect(() => {
    setMounted(true);
    const active = teacherAuthService.getSession();
    if (!active) {
      router.replace('/login');
      return;
    }
    setUserSession(active);
    setTeacherAssignments(teacherRBACService.getSubjectAssignments());
    setSchoolSettings(settingsService.getSettings());

    const examList = examService.getActiveExams();
    setExams(examList);
    if (examList.length > 0) {
      setSelectedExamTitle(examList[0].title);
    }

    const unsubOmr = omrService.subscribe(() => setVersionTick((t) => t + 1));
    return () => unsubOmr();
  }, [router]);

  // Close context popover on outside click
  useEffect(() => {
    if (!contextMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [contextMenuOpen]);

  const isAdmin = userSession?.role === 'admin';
  const isTeacher = userSession?.role === 'teacher';
  const teacherIdentifier = userSession?.teacherId || userSession?.teacherName || '';
  const isClass9or10 = selectedGrade === '9th' || selectedGrade === '10th';

  const myAllAssignedSubjects = useMemo(() => {
    if (!isTeacher || !teacherIdentifier) return [];
    return teacherRBACService.getTeacherAssignedSubjects(teacherIdentifier);
  }, [isTeacher, teacherIdentifier, teacherAssignments]);

  const myAssignedSubjectsForGrade = useMemo(() => {
    if (!isTeacher || !teacherIdentifier) return [];
    return teacherRBACService.getTeacherAssignedSubjects(teacherIdentifier, selectedGrade);
  }, [isTeacher, teacherIdentifier, selectedGrade, teacherAssignments]);

  // Auto-switch teacher to their first assigned class if current class has no subjects
  useEffect(() => {
    if (isTeacher && myAllAssignedSubjects.length > 0 && myAssignedSubjectsForGrade.length === 0) {
      const first = myAllAssignedSubjects[0];
      if (first?.classId) {
        setSelectedGrade(first.classId);
      }
    }
  }, [isTeacher, myAllAssignedSubjects, myAssignedSubjectsForGrade.length]);

  // Keep branch aligned when toggling 6-8 vs 9-10
  useEffect(() => {
    if (isClass9or10) {
      if (!['Science', 'Humanities', 'Commerce'].includes(selectedBranch)) {
        setSelectedGroup('science');
        setSelectedBranch('Science');
      }
    } else if (!SECTIONS_6_TO_8.includes(selectedBranch)) {
      setSelectedBranch('A');
    }
  }, [isClass9or10, selectedBranch]);

  const configuredSubjects = useMemo(
    () => getActiveCurriculumSubjects(selectedGrade, isClass9or10 ? selectedGroup : 'সাধারণ'),
    [selectedGrade, isClass9or10, selectedGroup],
  );

  const availableSubjects = useMemo(() => {
    const map = new Map<string, { code: string; name: string; mcqMax: number }>();
    configuredSubjects.forEach((s) => {
      const mcqNum = Number(s.mcq) > 0 ? Number(s.mcq) : 30;
      map.set(s.name, { code: s.code || s.name, name: s.name, mcqMax: mcqNum });
    });

    if (isTeacher) {
      myAssignedSubjectsForGrade.forEach((a) => {
        if (a.subjectId && !map.has(a.subjectId)) {
          map.set(a.subjectId, { code: a.subjectId, name: a.subjectId, mcqMax: 30 });
        }
      });
    }

    const list = Array.from(map.values());
    if (isAdmin) return list;
    if (!isTeacher) return [];
    return list.filter((item) =>
      teacherRBACService.validateSubjectOwnership(teacherIdentifier, selectedGrade, item.name),
    );
  }, [configuredSubjects, isAdmin, isTeacher, teacherIdentifier, selectedGrade, myAssignedSubjectsForGrade]);

  // Keep selectedSubject valid when class/group changes
  useEffect(() => {
    if (availableSubjects.length === 0) {
      setSelectedSubject('');
      return;
    }
    if (!availableSubjects.some((s) => s.name === selectedSubject)) {
      setSelectedSubject(availableSubjects[0].name);
    }
  }, [availableSubjects, selectedSubject]);

  // Resolve active OMR session & scans whenever context or storage changes
  useEffect(() => {
    if (!mounted || !userSession || !selectedSubject) return;
    const subMeta = availableSubjects.find((s) => s.name === selectedSubject);
    const examObj = exams.find((ex) => ex.title === selectedExamTitle);
    const groupBn = normalizeGroupToBn(selectedGrade, selectedGroup, selectedBranch);

    const resolved = omrService.findOrCreateSession({
      examId: examObj?.id || selectedExamTitle,
      examTitle: selectedExamTitle,
      academicYear: String(new Date().getFullYear()),
      grade: selectedGrade,
      branch: selectedBranch,
      group: groupBn,
      subjectCode: subMeta?.code || selectedSubject,
      subjectName: selectedSubject,
      subjectMcqMax: subMeta?.mcqMax || 30,
    });

    setActiveSession(resolved);
    setAllSessions(omrService.getSessions());
    setSessionScans(omrService.getScansForSession(resolved.id));
  }, [
    mounted,
    userSession,
    selectedExamTitle,
    selectedGrade,
    selectedBranch,
    selectedGroup,
    selectedSubject,
    availableSubjects,
    exams,
    versionTick,
  ]);

  const classLabelBn = useMemo(
    () => GRADES.find((g) => g.id === selectedGrade)?.labelBn || selectedGrade,
    [selectedGrade],
  );

  const sectionOrGroupShort = isClass9or10
    ? GROUPS_9_TO_10.find((g) => g.code === selectedGroup)?.labelBn || 'বিজ্ঞান'
    : `শাখা ${selectedBranch}`;

  const matchedScannedCount = useMemo(
    () => sessionScans.filter((sc) => sc.matchStatus === 'matched').length,
    [sessionScans],
  );

  const userDisplayName =
    userSession?.teacherName || (userSession?.role === 'admin' ? 'অ্যাডমিন' : 'শিক্ষক');

  const handleSelectExistingSession = (sess: OmrExamSession) => {
    setSelectedExamTitle(sess.examTitle);
    setSelectedGrade(sess.grade);
    setSelectedBranch(sess.branch);
    const grpCode = normalizeGroupToCode(sess.grade, sess.group, sess.branch);
    if (grpCode === 'science' || grpCode === 'humanities' || grpCode === 'commerce') {
      setSelectedGroup(grpCode);
    }
    setSelectedSubject(sess.subjectName);
    setContextMenuOpen(false);
  };

  const handleQuickHeaderSync = () => {
    if (!activeSession || matchedScannedCount === 0) {
      setActiveTab('results');
      return;
    }
    try {
      const report = omrService.syncSessionMarksToMarkEntry(activeSession.id, userDisplayName);
      setVersionTick((t) => t + 1);
      showToast(
        `${report.syncedCount} জন শিক্ষার্থীর MCQ নম্বর মার্ক এন্ট্রিতে সিঙ্ক হয়েছে (CQ/Practical অক্ষত আছে)।`,
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'সিঙ্ক ব্যর্থ হয়েছে।', 'error');
    }
  };

  if (!mounted || !userSession) {
    return (
      <div className="p-8 text-center text-sm font-semibold text-slate-400">
        OMR স্টুডিও ও স্ক্যানার লোড হচ্ছে...
      </div>
    );
  }

  // Teacher RBAC block if teacher has zero assigned subjects
  if (isTeacher && myAllAssignedSubjects.length === 0) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <UserCheck className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            আপনার আইডিতে কোনো বিষয় বরাদ্দ নেই
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            OMR শিট স্ক্যান ও নম্বর সিঙ্ক করার জন্য অ্যাডমিন প্যানেল থেকে আপনার নামে সংশ্লিষ্ট শ্রেণি ও বিষয় বরাদ্দ থাকতে হবে।
          </p>
          <Link
            href="/dashboard/teacher-portal"
            className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-[#0B5D3B] text-white text-xs font-bold"
          >
            শিক্ষক ড্যাশবোর্ডে ফিরুন
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50/70 dark:bg-slate-950 print:bg-white">
      {/* ─── SINGLE-ROW FLUSH STICKY SUB-HEADER (~56px, print:hidden) ─── */}
      <div className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-2 print:hidden">
        {/* Left: 4 Clean Segmented Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'scanner', label: 'স্ক্যানার', icon: ScanLine },
              { id: 'key', label: 'উত্তরপত্র', icon: KeyRound },
              { id: 'studio', label: 'শিট স্টুডিও', icon: Printer },
              { id: 'results', label: 'ফলাফল ও সিঙ্ক', icon: BarChart3, count: sessionScans.length },
            ] as Array<{
              id: OmrActiveTab;
              label: string;
              icon: React.ComponentType<{ className?: string }>;
              count?: number;
            }>
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-9 px-3 rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition-all ${
                  active
                    ? 'bg-[#0B5D3B] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Active Class/Subject Context Popover + Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={contextMenuRef}>
            <button
              type="button"
              onClick={() => setContextMenuOpen((o) => !o)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-2 max-w-[230px] sm:max-w-[340px] transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
              <span className="truncate">
                {classLabelBn} ({sectionOrGroupShort}) · {selectedSubject || 'বিষয় বাছাই'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {contextMenuOpen && (
              <div className="absolute right-0 mt-2 w-[320px] sm:w-[360px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 space-y-3 z-50">
                <div className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  পরীক্ষা, শ্রেণি ও বিষয় নির্বাচন
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      পরীক্ষা
                    </label>
                    <select
                      value={selectedExamTitle}
                      onChange={(e) => setSelectedExamTitle(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100"
                    >
                      {exams.map((ex) => (
                        <option key={ex.id} value={ex.title}>
                          {ex.title}
                        </option>
                      ))}
                      {!exams.some((ex) => ex.title === selectedExamTitle) && (
                        <option value={selectedExamTitle}>{selectedExamTitle}</option>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        শ্রেণি
                      </label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100"
                      >
                        {GRADES.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.labelBn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {isClass9or10 ? 'বিভাগ' : 'শাখা'}
                      </label>
                      {isClass9or10 ? (
                        <select
                          value={selectedGroup}
                          onChange={(e) => {
                            const nextGrp = e.target.value as 'science' | 'humanities' | 'commerce';
                            setSelectedGroup(nextGrp);
                            const found = GROUPS_9_TO_10.find((g) => g.code === nextGrp);
                            if (found) setSelectedBranch(found.branch);
                          }}
                          className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100"
                        >
                          {GROUPS_9_TO_10.map((g) => (
                            <option key={g.code} value={g.code}>
                              {g.labelBn}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100"
                        >
                          {SECTIONS_6_TO_8.map((sec) => (
                            <option key={sec} value={sec}>
                              শাখা {sec}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      বিষয় ({availableSubjects.length}টি)
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-800 dark:text-slate-100"
                    >
                      {availableSubjects.length === 0 ? (
                        <option value="">এই শ্রেণিতে আপনার বিষয় নেই</option>
                      ) : (
                        availableSubjects.map((sub) => (
                          <option key={sub.name} value={sub.name}>
                            {sub.name} ({sub.code})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setContextMenuOpen(false)}
                  className="w-full h-9 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> নিশ্চিত করুন
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={
              activeTab === 'studio'
                ? () => window.print()
                : handleQuickHeaderSync
            }
            className="hidden sm:inline-flex h-9 px-3.5 rounded-xl bg-[#0B5D3B] hover:bg-[#094a2f] text-white text-xs font-bold items-center gap-1.5 shadow-2xs transition-colors"
          >
            {activeTab === 'studio' ? (
              <>
                <Printer className="w-3.5 h-3.5" /> শিট প্রিন্ট
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                মার্ক সিঙ্ক {matchedScannedCount > 0 ? `(${matchedScannedCount})` : ''}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── MAIN WORKSPACE BODY ─── */}
      <div className="p-3 sm:p-5 max-w-[1440px] mx-auto print:p-0 print:max-w-none">
        {!activeSession ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            উপরের সিলেক্টর থেকে একটি শ্রেণি ও বিষয় নির্বাচন করুন।
          </div>
        ) : (
          <>
            {activeTab === 'scanner' && (
              <OmrScannerTab
                session={activeSession}
                scans={sessionScans}
                scannerUserName={userDisplayName}
                onScansChanged={() => setVersionTick((t) => t + 1)}
                onInspectScan={(sc) => setInspectingScan(sc)}
                onJumpToAnswerKey={() => setActiveTab('key')}
              />
            )}

            {activeTab === 'key' && (
              <OmrAnswerKeyTab
                session={activeSession}
                onSaveAnswerKey={(setCode, answers) => {
                  omrService.updateAnswerKey(activeSession.id, setCode, answers);
                  setVersionTick((t) => t + 1);
                }}
                onUpdateScoringRules={(updates) => {
                  omrService.updateSessionConfig(activeSession.id, updates);
                  setVersionTick((t) => t + 1);
                }}
              />
            )}

            {activeTab === 'studio' && (
              <OmrSheetStudioTab
                session={activeSession}
                schoolSettings={schoolSettings}
                classLabelBn={classLabelBn}
                onUpdateConfig={(updates) => {
                  omrService.updateSessionConfig(activeSession.id, updates);
                  setVersionTick((t) => t + 1);
                }}
              />
            )}

            {activeTab === 'results' && (
              <OmrResultsSyncTab
                session={activeSession}
                allSessions={allSessions}
                scans={sessionScans}
                schoolSettings={schoolSettings}
                classLabelBn={classLabelBn}
                userName={userDisplayName}
                onSelectSession={handleSelectExistingSession}
                onInspectScan={(sc) => setInspectingScan(sc)}
                onScansChanged={() => setVersionTick((t) => t + 1)}
              />
            )}
          </>
        )}
      </div>

      {/* Tap-to-Fix Visual Verification Modal */}
      {activeSession && inspectingScan && (
        <OmrVerifyModal
          session={activeSession}
          scan={inspectingScan}
          onClose={() => setInspectingScan(null)}
          onSave={(updates) => {
            omrService.updateScanAfterVerification(inspectingScan.id, updates);
            setInspectingScan(null);
            setVersionTick((t) => t + 1);
            showToast('শিক্ষার্থীর OMR রেকর্ড সংশোধন ও সংরক্ষিত হয়েছে।', 'success');
          }}
        />
      )}
    </div>
  );
}
