'use client';

import * as XLSX from 'xlsx';
import { DynamicClassSubject } from '@/lib/curriculumUtils';
import { isReligionSubject } from '@/lib/religionUtils';
import {
  AllSubjectsSummaryAggregate,
  ClassSectionSummaryRow,
  FailListEntry,
  GRADE_BUCKETS,
  RankedStudentResult,
  SubjectWiseReport,
} from '@/lib/resultAnalyticsEngine';
import { SchoolSettings } from '@/services/settingsService';

export type ResultReportViewKey =
  | 'single_transcript'
  | 'batch_transcript'
  | 'tabulation'
  | 'merit_list'
  | 'fail_list'
  | 'full_register'
  | 'class_summary'
  | 'subject_wise'
  | 'all_subjects_heatmap';

export interface ExportWorkbookContext {
  view: ResultReportViewKey;
  examTitle: string;
  gradeLabel: string;
  sectionLabel: string;
  settings?: Partial<SchoolSettings> | null;
  subjects: DynamicClassSubject[];
  rankedResults: RankedStudentResult[];
  failEntries: FailListEntry[];
  classSummaryRows: ClassSectionSummaryRow[];
  subjectWiseReport: SubjectWiseReport | null;
  allSubjectsSummary: AllSubjectsSummaryAggregate;
}

function resolveStudentEntry(
  res: RankedStudentResult,
  subject: DynamicClassSubject,
) {
  const direct = res.subjectMarks[subject.code];
  if (direct) return direct;
  if (
    res.optionalSubjectMark &&
    (res.optionalSubjectMark.subjectCode === subject.code ||
      subject.name.includes(res.optionalSubjectMark.subjectName) ||
      res.optionalSubjectMark.subjectName.includes(subject.name))
  ) {
    return res.optionalSubjectMark;
  }
  const isRelCol = isReligionSubject(`${subject.code} ${subject.name}`);
  return Object.values(res.subjectMarks).find(
    (m) =>
      m.subjectName === subject.name ||
      m.subjectCode === subject.code ||
      (isRelCol && isReligionSubject(`${m.subjectCode} ${m.subjectName}`)),
  );
}

/** Build structured XLSX Workbook for any SchoolPro Result Studio view (unit-testable). */
export function buildResultWorkbook(ctx: ExportWorkbookContext): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const metaRows = [
    { Field: 'Institution', Value: ctx.settings?.schoolName || 'SchoolPro Institution' },
    { Field: 'EIIN', Value: ctx.settings?.eiin || '-' },
    { Field: 'Exam', Value: ctx.examTitle },
    { Field: 'Class', Value: ctx.gradeLabel },
    { Field: 'Section / Group', Value: ctx.sectionLabel },
    { Field: 'Report View', Value: ctx.view },
    { Field: 'Exported At', Value: new Date().toISOString() },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metaRows), 'Report_Info');

  if (ctx.view === 'tabulation') {
    const rows = ctx.rankedResults.map((res) => {
      const record: Record<string, string | number> = {
        Roll: res.studentRoll,
        Name: res.studentName,
        Merit: res.isPassed ? res.meritPosition : '-',
      };
      for (const sub of ctx.subjects) {
        const entry = resolveStudentEntry(res, sub);
        record[`${sub.name} (${sub.fullMarks})`] = entry
          ? `${entry.totalMarks} (${entry.letterGrade})`
          : '-';
      }
      record['Total Obtained'] = res.totalObtainedMarks;
      record['GPA (Excl 4th)'] = res.gpaWithout4th.toFixed(2);
      record['Bonus GP'] = res.bonusGP.toFixed(2);
      record['Final GPA'] = res.isPassed ? res.gpa.toFixed(2) : '0.00';
      record['Grade'] = res.letterGrade;
      record['Failed Count'] = res.failedCount;
      record['Status'] = res.isPassed ? 'PASSED' : 'FAILED';
      return record;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Tabulation');
  } else if (ctx.view === 'merit_list' || ctx.view === 'full_register' || ctx.view === 'single_transcript' || ctx.view === 'batch_transcript') {
    const rows = ctx.rankedResults.map((res, idx) => ({
      SL: idx + 1,
      Merit_Rank: res.meritPosition,
      Roll: res.studentRoll,
      Name: res.studentName,
      Section: res.branch,
      Group: res.group,
      Total_Marks: res.totalObtainedMarks,
      Full_Marks: res.totalFullMarks,
      Percentage: `${res.obtainedPercentage ?? 0}%`,
      GPA_No_4th: res.gpaWithout4th.toFixed(2),
      Final_GPA: res.isPassed ? res.gpa.toFixed(2) : '0.00',
      Grade: res.letterGrade,
      Fail_Count: res.failedCount,
      Failed_Subjects: res.failedSubjects.join(', ') || '-',
      Status: res.isPassed ? 'PASSED' : 'FAILED',
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows),
      ctx.view === 'merit_list' ? 'Merit_List' : 'Result_Register',
    );
  } else if (ctx.view === 'fail_list') {
    const rows = ctx.failEntries.map((entry, idx) => ({
      SL: idx + 1,
      Roll: entry.result.studentRoll,
      Name: entry.result.studentName,
      Section: entry.result.branch,
      Fail_Count: entry.result.failedCount,
      Failed_Subjects_Detail: entry.failedDetails
        .map((d) => `${d.subjectName}: ${d.obtained}/${d.minPassMarks}`)
        .join(' | '),
      Total_Marks: entry.result.totalObtainedMarks,
      GPA: '0.00',
      Status: 'FAILED',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Fail_Analysis');
  } else if (ctx.view === 'class_summary') {
    const rows = ctx.classSummaryRows.map((row) => {
      const out: Record<string, string | number> = {
        Class: row.grade,
        Section: row.section,
        Total: row.totalStudents,
        Appeared: row.appearedCount,
        Pending: row.pendingCount,
        Passed: row.passedCount,
        Failed: row.failedCount,
        Pass_Rate_Pct: `${row.passRate}%`,
        Avg_Passed_GPA: row.avgPassedGpa.toFixed(2),
      };
      for (const b of GRADE_BUCKETS) {
        out[b] = row.gradeDistribution[b];
      }
      return out;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Class_Summary');
  } else if (ctx.view === 'subject_wise' && ctx.subjectWiseReport) {
    const rep = ctx.subjectWiseReport;
    const rows = rep.rows.map((r, idx) => ({
      SL: idx + 1,
      Roll: r.roll,
      Name: r.studentName,
      Section: r.section,
      Gender: r.gender || '-',
      CQ: r.cq,
      MCQ: r.mcq,
      Practical: r.practical,
      CA: r.ca,
      Total: r.totalMarks,
      Full: r.fullMarks,
      Grade: r.letterGrade,
      GP: r.gradePoint.toFixed(2),
      Status: r.status.toUpperCase(),
      Notes:
        r.failedComponents.length > 0
          ? r.failedComponents.join(', ')
          : r.deficit > 0
          ? `Deficit ${r.deficit}`
          : '-',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Subject_Wise');
  } else if (ctx.view === 'all_subjects_heatmap') {
    const rows = ctx.allSubjectsSummary.rows.map((row, idx) => {
      const out: Record<string, string | number> = {
        SL: idx + 1,
        Subject: row.subject.name,
        Code: row.subject.code,
        Category: row.subject.category || 'আবশ্যিক',
        Full_Marks: row.subject.fullMarks,
        Present: row.presentCount,
        Pending: row.pendingCount,
        Passed: row.passedCount,
        Failed: row.failedCount,
        Pass_Rate_Pct: `${row.passRate}%`,
        Avg_Marks: row.avgMarks,
        Highest: row.highestMarks,
        Lowest: row.lowestMarks,
      };
      for (const b of GRADE_BUCKETS) {
        out[b] = row.gradeDistribution[b];
      }
      return out;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'All_Subjects_Summary');
  }

  return wb;
}

export function downloadResultWorkbook(ctx: ExportWorkbookContext): void {
  const wb = buildResultWorkbook(ctx);
  const safeGrade = ctx.gradeLabel.replace(/[^a-zA-Z0-9\u0980-\u09FF_-]+/g, '_');
  const safeView = ctx.view.replace(/[^a-zA-Z0-9_-]+/g, '_');
  const dateStamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `SchoolPro_${safeView}_${safeGrade}_${dateStamp}.xlsx`);
}
