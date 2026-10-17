import { auditTrailService } from './auditTrailService';

export interface ExamItem {
  id: string;
  title: string;
  date: string;
  status: string;
  totalStudents?: number;
  isActive: boolean;
  isPublished?: boolean; // Controls whether public online result lookup is enabled
  publishedAt?: string;
}

const STORAGE_KEY = 'sms_exam_setup';

const DEFAULT_EXAMS: ExamItem[] = [
  {
    id: 'ex-annual-2026',
    title: 'Annual Examination 2026',
    date: '15 November 2026 - 05 December 2026',
    status: 'Upcoming',
    isActive: true,
    isPublished: false
  },
  {
    id: 'ex-half-yearly-2026',
    title: 'Half-Yearly Examination 2026',
    date: '15 May 2026 - 25 May 2026',
    status: 'Completed',
    isActive: true,
    isPublished: false
  },
  {
    id: 'ex-terminal-1-2026',
    title: '1st Terminal Examination 2026',
    date: '10 March 2026 - 20 March 2026',
    status: 'Completed',
    isActive: true,
    isPublished: false
  }
];

class ExamService {
  private listeners: Array<(exams: ExamItem[]) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.notifyListeners();
        }
      });
    }
  }

  public getExams(): ExamItem[] {
    if (typeof window === 'undefined') return DEFAULT_EXAMS;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXAMS));
        return DEFAULT_EXAMS;
      }
      const parsed: ExamItem[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(ex => ({
          ...ex,
          isPublished: Boolean(ex.isPublished)
        }));
      }
      return DEFAULT_EXAMS;
    } catch (err) {
      console.error('Failed to load exams from localStorage', err);
      return DEFAULT_EXAMS;
    }
  }

  public getActiveExams(): ExamItem[] {
    return this.getExams().filter(ex => ex.isActive !== false);
  }

  public getExamById(id: string): ExamItem | undefined {
    return this.getExams().find(e => e.id === id);
  }

  public addExam(examData: {
    title: string;
    date?: string;
    status?: string;
    totalStudents?: number;
    isActive?: boolean;
    isPublished?: boolean;
  }): ExamItem {
    const exams = this.getExams();
    const newExam: ExamItem = {
      id: `ex-${Date.now()}`,
      title: examData.title.trim(),
      date: examData.date?.trim() || 'Schedule TBD',
      status: examData.status?.trim() || 'Active',
      totalStudents: examData.totalStudents ?? 0,
      isActive: examData.isActive !== undefined ? examData.isActive : true,
      isPublished: Boolean(examData.isPublished)
    };

    const updated = [newExam, ...exams];
    this.saveExams(updated);
    return newExam;
  }

  public updateExam(id: string, updates: Partial<ExamItem>): ExamItem | null {
    const exams = this.getExams();
    let updatedExam: ExamItem | null = null;
    const updated = exams.map(ex => {
      if (ex.id === id) {
        updatedExam = { ...ex, ...updates };
        return updatedExam;
      }
      return ex;
    });

    if (updatedExam) {
      this.saveExams(updated);
    }
    return updatedExam;
  }

  public toggleExamActive(id: string): boolean {
    const exams = this.getExams();
    let newState = false;
    const updated = exams.map(ex => {
      if (ex.id === id) {
        newState = !ex.isActive;
        return { ...ex, isActive: newState };
      }
      return ex;
    });

    this.saveExams(updated);
    return newState;
  }

  /**
   * Check if results for a given exam are published.
   * Exam can be identified by ID or title (Bengali/English).
   */
  public isExamResultPublished(examTitleOrId: string): boolean {
    if (!examTitleOrId) return false;
    const clean = examTitleOrId.trim().toLowerCase();
    const formatted = this.formatExamNameForDisplay(examTitleOrId).trim().toLowerCase();
    const exams = this.getExams();
    const target = exams.find(e => 
      e.id.toLowerCase() === clean ||
      e.title.toLowerCase() === clean ||
      this.formatExamNameForDisplay(e.title).toLowerCase() === clean ||
      this.formatExamNameForDisplay(e.title).toLowerCase() === formatted ||
      e.title.toLowerCase() === formatted
    );
    return Boolean(target?.isPublished);
  }

  /**
   * Toggle publication status for an exam
   */
  public toggleResultPublished(id: string): boolean {
    const exams = this.getExams();
    let newState = false;
    let targetTitle = '';
    const updated = exams.map(ex => {
      if (ex.id === id) {
        newState = !Boolean(ex.isPublished);
        targetTitle = ex.title;
        return { 
          ...ex, 
          isPublished: newState,
          publishedAt: newState ? new Date().toISOString() : undefined
        };
      }
      return ex;
    });

    this.saveExams(updated);

    try {
      auditTrailService.addLog({
        action: newState ? 'EXAM_RESULT_PUBLISHED' : 'EXAM_RESULT_UNPUBLISHED',
        category: 'EXAMINATION',
        details: `"${targetTitle}" পরীক্ষার ফলাফল ${newState ? 'অনলাইনে পাবলিশ (উন্মুক্ত)' : 'অপ্রকাশিত (বন্ধ)'} করা হয়েছে।`,
        performedBy: 'প্রধান শিক্ষক / অ্যাডমিন',
        status: 'SUCCESS'
      });
    } catch (e) {
      console.warn('Audit log failed', e);
    }

    return newState;
  }

  /**
   * Explicitly set publication status for an exam
   */
  public setResultPublished(id: string, isPublished: boolean): void {
    const exams = this.getExams();
    let targetTitle = '';
    const updated = exams.map(ex => {
      if (ex.id === id) {
        targetTitle = ex.title;
        return { 
          ...ex, 
          isPublished,
          publishedAt: isPublished ? (ex.publishedAt || new Date().toISOString()) : undefined
        };
      }
      return ex;
    });

    this.saveExams(updated);

    try {
      auditTrailService.addLog({
        action: isPublished ? 'EXAM_RESULT_PUBLISHED' : 'EXAM_RESULT_UNPUBLISHED',
        category: 'EXAMINATION',
        details: `"${targetTitle}" পরীক্ষার ফলাফল ${isPublished ? 'অনলাইনে পাবলিশ' : 'অপ্রকাশিত'} সেট করা হয়েছে।`,
        performedBy: 'প্রধান শিক্ষক / অ্যাডমিন',
        status: 'SUCCESS'
      });
    } catch (e) {
      console.warn('Audit log failed', e);
    }
  }

  public deleteExam(id: string): boolean {
    const exams = this.getExams();
    const filtered = exams.filter(ex => ex.id !== id);
    if (filtered.length !== exams.length) {
      this.saveExams(filtered);
      return true;
    }
    return false;
  }

  public subscribe(listener: (exams: ExamItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private saveExams(exams: ExamItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
      this.notifyListeners();
      // Dispatch custom window event for same-tab reactive syncing
      window.dispatchEvent(new CustomEvent('sms_exam_setup_changed', { detail: exams }));
    } catch (err) {
      console.error('Failed to save exams', err);
    }
  }

  private notifyListeners(): void {
    const exams = this.getExams();
    this.listeners.forEach(l => l(exams));
  }

  /**
   * Helper to normalize exam titles for English UI
   */
  public formatExamNameForDisplay(rawTitle: string): string {
    if (!rawTitle) return 'Annual Examination 2026';
    let t = rawTitle.trim();
    // If it has both Bengali and English like "অর্ধ-বার্ষিক পরীক্ষা ২০২৬ (Half Yearly Exam)", extract English
    const engMatch = t.match(/\(([^)]+)\)/);
    if (engMatch && engMatch[1]) {
      const inside = engMatch[1].trim();
      if (/^[a-zA-Z0-9\s-]+$/.test(inside)) {
        return inside.includes('2026') ? inside : `${inside} 2026`;
      }
    }

    // Standard translation dictionary
    if (t.includes('বার্ষিক') || t.toLowerCase().includes('annual')) return 'Annual Examination 2026';
    if (t.includes('অর্ধ-বার্ষিক') || t.includes('অর্ধবার্ষিক') || t.toLowerCase().includes('half')) return 'Half-Yearly Examination 2026';
    if (t.includes('১ম সাময়িক') || t.includes('১ম সাময়িক') || t.toLowerCase().includes('1st terminal')) return '1st Terminal Examination 2026';
    if (t.includes('২য় সাময়িক') || t.includes('২য় সাময়িক') || t.toLowerCase().includes('2nd terminal')) return '2nd Terminal Examination 2026';
    if (t.includes('মডেল টেস্ট') || t.toLowerCase().includes('model test')) return 'Model Test Examination 2026';
    if (t.includes('নির্বাচনী') || t.toLowerCase().includes('test exam')) return 'Test Examination 2026';
    if (t.includes('প্রাক-নির্বাচনী') || t.toLowerCase().includes('pre-selection')) return 'SSC Pre-Selection Examination 2026';

    return t;
  }
}

export const examService = new ExamService();
