import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for test environment
const store: Record<string, string> = {};

(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as any).window = {
  ...globalThis,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

import { studentService, Student } from '@/services/studentService';
import {
  normalizeHeaderKey,
  detectAcademicGroup,
  normalizeStudentRow,
  generateGroupWiseRolls,
  validateBulkImportBatch,
  executeBulkImport,
} from '@/services/studentBulkImportEngine';

describe('Student Bulk Import & Group-wise Roll Generation Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes all user-specified English column headers accurately without key collisions', () => {
    expect(normalizeHeaderKey('Student Name')).toBe('name');
    expect(normalizeHeaderKey("Student's Name")).toBe('name');
    expect(normalizeHeaderKey('Class')).toBe('grade');
    expect(normalizeHeaderKey('Section')).toBe('section');
    expect(normalizeHeaderKey('Group')).toBe('group');
    expect(normalizeHeaderKey('Gender')).toBe('gender');
    expect(normalizeHeaderKey('Date of Birth')).toBe('dob');
    expect(normalizeHeaderKey("Father's Name")).toBe('fatherName');
    expect(normalizeHeaderKey("Mother's Name")).toBe('motherName');
    expect(normalizeHeaderKey('Contact Number')).toBe('mobile');
    expect(normalizeHeaderKey('Address')).toBe('currentAddress');
    expect(normalizeHeaderKey('Previous Roll')).toBe('prevRoll');
    expect(normalizeHeaderKey('Roll')).toBe('roll');
    // Critical: Blood Group must NEVER collide with Academic Group
    expect(normalizeHeaderKey('Blood Group')).toBe('bloodGroup');
    expect(normalizeHeaderKey('Blood')).toBe('bloodGroup');
    expect(normalizeHeaderKey('রক্তের গ্রুপ')).toBe('bloodGroup');
    expect(normalizeHeaderKey('Group')).toBe('group');
    expect(normalizeHeaderKey('বিভাগ')).toBe('group');
    expect(normalizeHeaderKey('গ্রুপ')).toBe('group');
  });

  it('correctly categorizes all academic group variations for Class 9', () => {
    // Science variants
    expect(detectAcademicGroup('Science', '9th').group).toBe('বিজ্ঞান');
    expect(detectAcademicGroup('science', '9th').group).toBe('বিজ্ঞান');
    expect(detectAcademicGroup('বিজ্ঞান', '9th').group).toBe('বিজ্ঞান');
    expect(detectAcademicGroup('Sci', '9th').group).toBe('বিজ্ঞান');
    expect(detectAcademicGroup('সায়েন্স', '9th').group).toBe('বিজ্ঞান');

    // Humanities / Arts variants
    expect(detectAcademicGroup('Humanities', '9th').group).toBe('মানবিক');
    expect(detectAcademicGroup('Arts', '9th').group).toBe('মানবিক');
    expect(detectAcademicGroup('Humanities (Arts)', '9th').group).toBe('মানবিক');
    expect(detectAcademicGroup('মানবিক', '9th').group).toBe('মানবিক');
    expect(detectAcademicGroup('হিউম্যানিটিজ', '9th').group).toBe('মানবিক');

    // Business Studies / Commerce variants
    expect(detectAcademicGroup('Business Studies', '9th').group).toBe('ব্যবসায় শিক্ষা');
    expect(detectAcademicGroup('Commerce', '9th').group).toBe('ব্যবসায় শিক্ষা');
    expect(detectAcademicGroup('Business', '9th').group).toBe('ব্যবসায় শিক্ষা');
    expect(detectAcademicGroup('ব্যবসায় শিক্ষা', '9th').group).toBe('ব্যবসায় শিক্ষা');
    expect(detectAcademicGroup('ব্যবসা', '9th').group).toBe('ব্যবসায় শিক্ষা');
    expect(detectAcademicGroup('ব্যবসা শিক্ষা', '9th').group).toBe('ব্যবসায় শিক্ষা');
    expect(detectAcademicGroup('বাণিজ্য', '9th').group).toBe('ব্যবসায় শিক্ষা');
    expect(detectAcademicGroup('কমার্স', '9th').group).toBe('ব্যবসায় শিক্ষা');
  });

  it('processes 90 Class 9 students (Science: 35, Humanities: 30, Business Studies: 25) with unordered rolls and generates independent sequential rolls 1..N', () => {
    // Generate 90 raw mock excel rows with completely random / duplicate / missing roll numbers
    const rawRows: Record<string, any>[] = [];

    // 35 Science students with names in mixed order and unordered rolls
    const scienceNames = [
      'Zubair Ahmed', 'Anisur Rahman', 'Bilal Hossain', 'Cynthia Akter', 'Dalim Mia',
      'Elias Hossain', 'Farhana Yasmin', 'Golam Rabbani', 'Habibullah', 'Imran Khan',
      'Jahangir Alam', 'Kamrul Hasan', 'Lutfur Rahman', 'Mahmudul Huq', 'Naimur Rahman',
      'Omar Faruk', 'Parvez Mosharraf', 'Quddus Molla', 'Rashedul Islam', 'Saiful Islam',
      'Tanvir Ahmed', 'Uddin Ahmed', 'Victoria Roy', 'Wahidul Alam', 'Xavier Gomes',
      'Yasin Arafat', 'Zahir Raihan', 'Abul Kashem', 'Babul Mia', 'Chandan Das',
      'Delwar Hossain', 'Enamul Haque', 'Firoz Ahmed', 'Gias Uddin', 'Humayun Kabir'
    ];
    scienceNames.forEach((name, i) => {
      rawRows.push({
        'Student Name': name,
        'Class': 'Class 9',
        'Section': 'A',
        'Group': 'Science',
        'Gender': i % 2 === 0 ? 'Male' : 'Female',
        'Date of Birth': '2010-05-15',
        "Father's Name": `Father of ${name}`,
        "Mother's Name": `Mother of ${name}`,
        'Contact Number': `018123456${String(i).padStart(2, '0')}`,
        'Address': 'Baraitali, Chakaria, Coxs Bazar',
        'Previous Roll': String(99 - i), // unordered rolls
      });
    });

    // 30 Humanities students
    const humanitiesNames = [
      'Zara Khan', 'Ayesha Siddika', 'Beauty Akter', 'Chameli Begum', 'Dolly Akhter',
      'Eva Rahman', 'Fatema Tuz Zohra', 'Gita Rani', 'Halima Khatun', 'Israt Jahan',
      'Jannatul Ferdous', 'Kulsum Bibi', 'Lipika Barua', 'Mousumi Sen', 'Nasreen Sultana',
      'Orpa Das', 'Popy Rani', 'Quader Hossain', 'Ruma Akter', 'Salma Begum',
      'Taslima Nasreen', 'Umme Habiba', 'Vera Rozario', 'Wajiha Noor', 'Xinia Sen',
      'Yasmin Sultana', 'Zinat Ara', 'Aklima Begum', 'Barnali Dey', 'Champa Rani'
    ];
    humanitiesNames.forEach((name, i) => {
      rawRows.push({
        'Student Name': name,
        'Class': '9th',
        'Section': 'A',
        'Group': 'Humanities (Arts)',
        'Gender': 'Female',
        'Date of Birth': '2010-06-20',
        "Father's Name": `Father of ${name}`,
        "Mother's Name": `Mother of ${name}`,
        'Contact Number': `017123456${String(i).padStart(2, '0')}`,
        'Address': 'Chakaria, Coxs Bazar',
        'Previous Roll': String(i + 1), // might duplicate rolls from science
      });
    });

    // 25 Business Studies students
    const businessNames = [
      'Ziaur Rahman', 'Ashfaqul Alam', 'Bashir Ahmed', 'Chandan Sen', 'Dipu Chandra',
      'Ershad Ali', 'Faisal Mahmud', 'Ganesh Chandra', 'Harun Ur Rashid', 'Iqbal Bahar',
      'Jashim Uddin', 'Kawsar Ahmed', 'Liakat Ali', 'Monirul Islam', 'Nurul Absar',
      'Opu Roy', 'Palash Kanti', 'Qamrul Islam', 'Rafiqul Islam', 'Shahadat Hossain',
      'Tareq Aziz', 'Uzzal Kanti', 'Vidyut Paul', 'Wasim Akram', 'Zakaria Mia'
    ];
    businessNames.forEach((name, i) => {
      rawRows.push({
        'Student Name': name,
        'Class': '9',
        'Section': 'A',
        'Group': 'Business Studies',
        'Gender': 'Male',
        'Date of Birth': '2010-08-10',
        "Father's Name": `Father of ${name}`,
        "Mother's Name": `Mother of ${name}`,
        'Contact Number': `019123456${String(i).padStart(2, '0')}`,
        'Address': 'Harbang, Chakaria',
        'Previous Roll': String((i % 5) + 1), // intentionally heavy duplicates
      });
    });

    expect(rawRows.length).toBe(90);

    // 1. Normalize rows
    const normalizedStudents: Student[] = rawRows.map((r, idx) => normalizeStudentRow(r, idx));
    expect(normalizedStudents.length).toBe(90);

    // Verify Father and Mother names are separate from Student Name
    expect(normalizedStudents[0].name).toBe('Zubair Ahmed');
    expect(normalizedStudents[0].fatherName).toBe('Father of Zubair Ahmed');
    expect(normalizedStudents[0].motherName).toBe('Mother of Zubair Ahmed');

    // 2. Run Group-wise Roll Generation Engine (sequential 1..N with keepUploadedRoll: false)
    const rollResult = generateGroupWiseRolls(normalizedStudents, 'name_asc', '9th', false);

    // Group Statistics Verification
    expect(rollResult.groupStats.total).toBe(90);
    expect(rollResult.groupStats.science).toBe(35);
    expect(rollResult.groupStats.humanities).toBe(30);
    expect(rollResult.groupStats.business).toBe(25);

    // Separate groups
    const sciStudents = rollResult.students.filter(s => s.group === 'বিজ্ঞান');
    const humStudents = rollResult.students.filter(s => s.group === 'মানবিক');
    const busStudents = rollResult.students.filter(s => s.group === 'ব্যবসায় শিক্ষা');

    expect(sciStudents.length).toBe(35);
    expect(humStudents.length).toBe(30);
    expect(busStudents.length).toBe(25);

    // 3. Independent Sequential Rolls:
    // Science: 1 to 35
    expect(sciStudents[0].roll).toBe('01');
    expect(sciStudents[34].roll).toBe('35');
    // Verify Science rolls are strictly 1..35 with no gaps or duplicates
    const sciRolls = sciStudents.map(s => parseInt(s.roll, 10));
    expect(sciRolls).toEqual(Array.from({ length: 35 }, (_, i) => i + 1));

    // Humanities: 1 to 30
    expect(humStudents[0].roll).toBe('01');
    expect(humStudents[29].roll).toBe('30');
    const humRolls = humStudents.map(s => parseInt(s.roll, 10));
    expect(humRolls).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));

    // Business Studies: 1 to 25
    expect(busStudents[0].roll).toBe('01');
    expect(busStudents[24].roll).toBe('25');
    const busRolls = busStudents.map(s => parseInt(s.roll, 10));
    expect(busRolls).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));

    // 4. Verify Alphabetical Sorting within groups (A-Z)
    // In Science, 'Abul Kashem' should come before 'Zubair Ahmed'
    expect(sciStudents[0].name).toBe('Abul Kashem');
    expect(sciStudents[sciStudents.length - 1].name).toBe('Zubair Ahmed');

    // In Humanities, 'Aklima Begum' should be first
    expect(humStudents[0].name).toBe('Aklima Begum');

    // In Business Studies, 'Ashfaqul Alam' should be first
    expect(busStudents[0].name).toBe('Ashfaqul Alam');

    // 5. Unique Student IDs (Group code prevents collision on roll 01)
    const sciRoll1 = sciStudents.find(s => s.roll === '01')!;
    const humRoll1 = humStudents.find(s => s.roll === '01')!;
    const busRoll1 = busStudents.find(s => s.roll === '01')!;

    expect(sciRoll1.id).toBe('STD-9th-SCI-A-01');
    expect(humRoll1.id).toBe('STD-9th-HUM-A-01');
    expect(busRoll1.id).toBe('STD-9th-BUS-A-01');
    expect(new Set([sciRoll1.id, humRoll1.id, busRoll1.id]).size).toBe(3);

    // 6. Validation Report
    const validation = validateBulkImportBatch(rollResult.students);
    expect(validation.isValid).toBe(true);
    expect(validation.canProceed).toBe(true);
    expect(validation.errorCount).toBe(0);

    // 7. Atomic Database Execution
    const execResult = executeBulkImport(rollResult.students, {
      mode: 'replace',
      sortStrategy: 'name_asc',
      targetGrade: '9th'
    });

    expect(execResult.success).toBe(true);
    expect(execResult.importedCount).toBe(90);

    // Check database storage
    const allSaved = studentService.getAllStudents();
    expect(allSaved.length).toBe(90);

    const savedSci = allSaved.filter(s => s.group === 'বিজ্ঞান');
    const savedHum = allSaved.filter(s => s.group === 'মানবিক');
    const savedBus = allSaved.filter(s => s.group === 'ব্যবসায় শিক্ষা');

    expect(savedSci.length).toBe(35);
    expect(savedHum.length).toBe(30);
    expect(savedBus.length).toBe(25);
  });

  it('detects invalid rows and missing names during validation', () => {
    const invalidStudents: Student[] = [
      {
        id: 'STD-1',
        roll: '01',
        name: '', // missing name!
        grade: '9th',
        section: 'A',
        group: 'বিজ্ঞান',
      },
      {
        id: 'STD-2',
        roll: '02',
        name: 'সাদিয়া বেগম',
        grade: '', // missing grade!
        section: 'A',
        group: 'বিজ্ঞান',
      }
    ];

    const report = validateBulkImportBatch(invalidStudents);
    expect(report.isValid).toBe(false);
    expect(report.canProceed).toBe(false);
    expect(report.errorCount).toBe(2);
  });

  it('preserves uploaded student roll numbers as-is while sorting alphabetically (A-Z) by name [User Requirement]', () => {
    // 3 students with custom uploaded rolls in mixed order:
    // Student 1: "Zahid Hasan", roll 15
    // Student 2: "Anisur Rahman", roll 04
    // Student 3: "Kabir Hossain", roll 28
    const rawRows = [
      {
        'Student Name': 'Zahid Hasan',
        'Class': '9th',
        'Group': 'Science',
        'Roll': '15',
        "Father's Name": 'Father 1',
        "Mother's Name": 'Mother 1',
      },
      {
        'Student Name': 'Anisur Rahman',
        'Class': '9th',
        'Group': 'Science',
        'Roll': '04',
        "Father's Name": 'Father 2',
        "Mother's Name": 'Mother 2',
      },
      {
        'Student Name': 'Kabir Hossain',
        'Class': '9th',
        'Group': 'Science',
        'Roll': '28',
        "Father's Name": 'Father 3',
        "Mother's Name": 'Mother 3',
      },
    ];

    const normalized = rawRows.map((r, i) => normalizeStudentRow(r, i));

    // Run with default keepUploadedRoll = true and strategy = 'name_asc' (A-Z)
    const result = generateGroupWiseRolls(normalized, 'name_asc', '9th', true);

    // Should be sorted alphabetically (A-Z):
    // 1st: Anisur Rahman (keeps roll 04)
    // 2nd: Kabir Hossain (keeps roll 28)
    // 3rd: Zahid Hasan (keeps roll 15)
    expect(result.students.map((s) => s.name)).toEqual([
      'Anisur Rahman',
      'Kabir Hossain',
      'Zahid Hasan',
    ]);

    // Rolls are PRESERVED as uploaded, NOT reassigned to 01, 02, 03
    expect(result.students.map((s) => s.roll)).toEqual(['04', '28', '15']);

    // Unique IDs reflect preserved rolls
    expect(result.students[0].id).toBe('STD-9th-SCI-A-04');
    expect(result.students[1].id).toBe('STD-9th-SCI-A-28');
    expect(result.students[2].id).toBe('STD-9th-SCI-A-15');

    // Roll ranges capture min and max correctly
    expect(result.rollRanges['বিজ্ঞান'].startRoll).toBe('04');
    expect(result.rollRanges['বিজ্ঞান'].endRoll).toBe('28');
  });

  it('correctly keeps all 3 groups (Science, Humanities, Business Studies) intact even when Blood Group / রক্তের গ্রুপ column is present', () => {
    // Exact sample structure with Blood Group / রক্তের গ্রুপ
    const rawEnglishRows = [
      {
        'Student Name': 'Sadia Binte Sultan',
        'Class': '9th',
        'Group': 'Science',
        'Blood Group': 'O+',
        'Gender': 'Female',
        'Roll': '01'
      },
      {
        'Student Name': 'Farhana Akhter Mili',
        'Class': '9th',
        'Group': 'Humanities',
        'Blood Group': 'AB-',
        'Gender': 'Female',
        'Roll': '02'
      },
      {
        'Student Name': 'Tanvir Ahmed Rifat',
        'Class': '9th',
        'Group': 'Business Studies',
        'Blood Group': 'A+',
        'Gender': 'Male',
        'Roll': '03'
      }
    ];

    const parsedEn = rawEnglishRows.map((r, i) => normalizeStudentRow(r, i));
    expect(parsedEn[0].group).toBe('বিজ্ঞান');
    expect(parsedEn[0].bloodGroup).toBe('O+');

    expect(parsedEn[1].group).toBe('মানবিক');
    expect(parsedEn[1].bloodGroup).toBe('AB-');

    expect(parsedEn[2].group).toBe('ব্যবসায় শিক্ষা');
    expect(parsedEn[2].bloodGroup).toBe('A+');

    const resultEn = generateGroupWiseRolls(parsedEn, 'name_asc', '9th', true);
    expect(resultEn.groupStats.science).toBe(1);
    expect(resultEn.groupStats.humanities).toBe(1);
    expect(resultEn.groupStats.business).toBe(1);

    // Exact Bengali sample structure
    const rawBengaliRows = [
      {
        'শিক্ষার্থীর নাম': 'সাদিয়া সুলতানা',
        'শ্রেণি': '৯ম',
        'বিভাগ': 'বিজ্ঞান',
        'রক্তের গ্রুপ': 'O+',
        'রোল': '০১'
      },
      {
        'শিক্ষার্থীর নাম': 'ফারহানা আক্তার',
        'শ্রেণি': '৯ম',
        'বিভাগ': 'মানবিক',
        'রক্তের গ্রুপ': 'AB-',
        'রোল': '০২'
      },
      {
        'শিক্ষার্থীর নাম': 'তানভীর আহমেদ',
        'শ্রেণি': '৯ম',
        'বিভাগ': 'ব্যবসায় শিক্ষা',
        'রক্তের গ্রুপ': 'A+',
        'রোল': '০৩'
      }
    ];

    const parsedBn = rawBengaliRows.map((r, i) => normalizeStudentRow(r, i));
    expect(parsedBn[0].group).toBe('বিজ্ঞান');
    expect(parsedBn[0].bloodGroup).toBe('O+');

    expect(parsedBn[1].group).toBe('মানবিক');
    expect(parsedBn[1].bloodGroup).toBe('AB-');

    expect(parsedBn[2].group).toBe('ব্যবসায় শিক্ষা');
    expect(parsedBn[2].bloodGroup).toBe('A+');

    const resultBn = generateGroupWiseRolls(parsedBn, 'name_asc', '9th', true);
    expect(resultBn.groupStats.science).toBe(1);
    expect(resultBn.groupStats.humanities).toBe(1);
    expect(resultBn.groupStats.business).toBe(1);
  });
});
