export interface SectionBranch {
  id: string;
  name: string;
  room: string;
  capacity: number;
  studentCount: number;
  sectionTeacher: string;
  shift: 'প্রভাতি (Morning)' | 'দিবা (Day)' | 'Morning' | 'Day';
}

export interface ClassItem {
  id: string;
  code: string;
  name: string;
  nameBn: string;
  gradeNumber: number;
  shift: 'প্রভাতি (Morning)' | 'দিবা (Day)' | 'Morning' | 'Day';
  classTeacher: string;
  totalStudents: number;
  sections: SectionBranch[];
  groups: string[];
}

const STORAGE_KEY = 'sms_academic_classes';

export const DEFAULT_CLASSES: ClassItem[] = [
  {
    id: 'cls-6',
    code: 'CLS-06',
    name: 'Class 6',
    nameBn: '৬ষ্ঠ শ্রেণি',
    gradeNumber: 6,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['সাধারণ (General)'],
    sections: [
      { id: 'sec-6a', name: 'Section A (ক শাখা)', room: 'রুম ১০১', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-6b', name: 'Section B (খ শাখা)', room: 'রুম ১০২', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' }
    ]
  },
  {
    id: 'cls-7',
    code: 'CLS-07',
    name: 'Class 7',
    nameBn: '৭ম শ্রেণি',
    gradeNumber: 7,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['সাধারণ (General)'],
    sections: [
      { id: 'sec-7a', name: 'Section A (ক শাখা)', room: 'রুম ১০৩', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-7b', name: 'Section B (খ শাখা)', room: 'রুম ১০৪', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' }
    ]
  },
  {
    id: 'cls-8',
    code: 'CLS-08',
    name: 'Class 8',
    nameBn: '৮ম শ্রেণি',
    gradeNumber: 8,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['সাধারণ (General)'],
    sections: [
      { id: 'sec-8a', name: 'Section A (ক শাখা)', room: 'রুম ২০১', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-8b', name: 'Section B (খ শাখা)', room: 'রুম ২০২', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-8c', name: 'Section C (গ শাখা)', room: 'রুম ২০৩', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' }
    ]
  },
  {
    id: 'cls-9',
    code: 'CLS-09',
    name: 'Class 9',
    nameBn: '৯ম শ্রেণি',
    gradeNumber: 9,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)'],
    sections: [
      { id: 'sec-9a', name: 'Section A (বিজ্ঞান)', room: 'রুম ৩০১', capacity: 60, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-9b', name: 'Section B (মানবিক)', room: 'রুম ৩০২', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-9c', name: 'Section C (ব্যবসায়)', room: 'রুম ৩০৩', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' }
    ]
  },
  {
    id: 'cls-10',
    code: 'CLS-10',
    name: 'Class 10',
    nameBn: '১০ম শ্রেণি',
    gradeNumber: 10,
    shift: 'দিবা (Day)',
    classTeacher: '',
    totalStudents: 0,
    groups: ['বিজ্ঞান (Science)', 'মানবিক (Humanities)', 'ব্যবসায় শিক্ষা (Commerce)'],
    sections: [
      { id: 'sec-10a', name: 'Section A (বিজ্ঞান)', room: 'রুম ৪০১', capacity: 60, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-10b', name: 'Section B (মানবিক)', room: 'রুম ৪০২', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' },
      { id: 'sec-10c', name: 'Section C (ব্যবসায়)', room: 'রুম ৪০৩', capacity: 50, studentCount: 0, sectionTeacher: '', shift: 'দিবা (Day)' }
    ]
  }
];

class ClassSectionService {
  private listeners: Array<(classes: ClassItem[]) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.notifyListeners();
        }
      });
    }
  }

  public getClasses(): ClassItem[] {
    if (typeof window === 'undefined') return DEFAULT_CLASSES;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLASSES));
        return DEFAULT_CLASSES;
      }
      const parsed: ClassItem[] = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CLASSES;
    } catch (err) {
      console.error('Failed to load academic classes', err);
      return DEFAULT_CLASSES;
    }
  }

  public getClassByGrade(grade: string | number): ClassItem | undefined {
    const classes = this.getClasses();
    const gradeNum = typeof grade === 'number' ? grade : parseInt(String(grade).replace(/\D/g, ''), 10);
    return classes.find(c => c.gradeNumber === gradeNum || c.id === `cls-${gradeNum}`);
  }

  public getSectionsForGrade(grade: string | number): SectionBranch[] {
    const foundClass = this.getClassByGrade(grade);
    return foundClass?.sections || [];
  }

  public addSection(
    classId: string,
    sectionData: {
      name: string;
      room?: string;
      capacity?: number;
      sectionTeacher?: string;
      shift?: any;
    }
  ): SectionBranch {
    const classes = this.getClasses();
    let created: SectionBranch | null = null;

    const updated = classes.map(c => {
      if (c.id === classId || c.gradeNumber === Number(classId.replace(/\D/g, ''))) {
        created = {
          id: `sec-${c.gradeNumber}-${Date.now()}`,
          name: sectionData.name.trim(),
          room: sectionData.room?.trim() || 'Room 101',
          capacity: Number(sectionData.capacity) || 50,
          studentCount: 0,
          sectionTeacher: sectionData.sectionTeacher?.trim() || '',
          shift: sectionData.shift || 'দিবা (Day)'
        };
        return {
          ...c,
          sections: [...c.sections, created]
        };
      }
      return c;
    });

    if (created) {
      this.saveClasses(updated);
      return created;
    }
    throw new Error('Class not found');
  }

  public updateSection(
    classId: string,
    sectionId: string,
    updates: Partial<SectionBranch>
  ): boolean {
    const classes = this.getClasses();
    let updatedAny = false;

    const updated = classes.map(c => {
      if (c.id === classId || c.sections.some(s => s.id === sectionId)) {
        const nextSections = c.sections.map(s => {
          if (s.id === sectionId) {
            updatedAny = true;
            return { ...s, ...updates };
          }
          return s;
        });
        return { ...c, sections: nextSections };
      }
      return c;
    });

    if (updatedAny) {
      this.saveClasses(updated);
      return true;
    }
    return false;
  }

  public deleteSection(classId: string, sectionId: string): boolean {
    const classes = this.getClasses();
    let deleted = false;

    const updated = classes.map(c => {
      if (c.id === classId || c.sections.some(s => s.id === sectionId)) {
        const nextSections = c.sections.filter(s => s.id !== sectionId);
        if (nextSections.length !== c.sections.length) {
          deleted = true;
        }
        return { ...c, sections: nextSections };
      }
      return c;
    });

    if (deleted) {
      this.saveClasses(updated);
      return true;
    }
    return false;
  }

  public updateClass(classId: string, updates: Partial<ClassItem>): boolean {
    const classes = this.getClasses();
    let updatedAny = false;

    const updated = classes.map(c => {
      if (c.id === classId) {
        updatedAny = true;
        return { ...c, ...updates };
      }
      return c;
    });

    if (updatedAny) {
      this.saveClasses(updated);
      return true;
    }
    return false;
  }

  public subscribe(listener: (classes: ClassItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private saveClasses(classes: ClassItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
      this.notifyListeners();
      window.dispatchEvent(new CustomEvent('sms_academic_classes_changed', { detail: classes }));
    } catch (err) {
      console.error('Failed to save academic classes', err);
    }
  }

  private notifyListeners(): void {
    const classes = this.getClasses();
    this.listeners.forEach(l => l(classes));
  }
}

export const classSectionService = new ClassSectionService();
