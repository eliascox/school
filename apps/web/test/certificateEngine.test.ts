import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildCertificateVerifyUrl,
  buildDefaultRefNo,
  cleanEntityText,
  composeCertificateBody,
  CUSTOM_DOCUMENT_PRESETS,
  DOTTED_BLANK,
  formatCertificateDate,
  mapAlumniToCertificateDraft,
  mapStudentToCertificateDraft,
  parseAddressParts,
  resolveCertificateCanvasMode,
  resolveGenderGrammar,
  sortStudentsByRoll,
  toBanglaDigits,
} from '../src/lib/certificateEngine';
import { certificateService } from '../src/services/certificateService';
import { buildRecordFromCertificate } from '../src/components/ssc-transcript/sscTranscriptUtils';
import type { Student } from '../src/services/studentService';
import type { AlumniRecord } from '../src/services/alumniService';
import {
  mergeCloudSettingsPreservingLocalPad,
  type SchoolSettings,
} from '../src/services/settingsService';

function setupMockStorage(): Record<string, string> {
  const store: Record<string, string> = {};
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
  (globalThis as unknown as { window: { localStorage: Storage; dispatchEvent: () => void } }).window = {
    localStorage: (globalThis as unknown as { localStorage: Storage }).localStorage,
    dispatchEvent: () => {},
  };
  return store;
}

const SAMPLE_SETTINGS: Partial<SchoolSettings> = {
  schoolName: 'গ্রিনভ্যালি মডেল হাই স্কুল',
  schoolNameEn: 'Greenvalley Model High School',
  address: 'ধামরাই, ঢাকা',
  addressEn: 'Dhamrai, Dhaka',
  eiin: '108452',
};

describe('certificateEngine', () => {
  beforeEach(() => {
    setupMockStorage();
  });

  it('resolves male, female, and unspecified grammar without slashes', () => {
    const male = resolveGenderGrammar('পুরুষ');
    expect(male.sonDaughterBn).toBe('পুত্র');
    expect(male.studentNounBn).toBe('ছাত্র');
    expect(male.sonDaughterEn).toBe('son of');
    expect(male.heShe).toBe('He');
    expect(male.hisHer).toBe('his');

    const female = resolveGenderGrammar('নারী');
    expect(female.sonDaughterBn).toBe('কন্যা');
    expect(female.studentNounBn).toBe('ছাত্রী');
    expect(female.sonDaughterEn).toBe('daughter of');
    expect(female.heShe).toBe('She');
    expect(female.hisHer).toBe('her');

    const neutral = resolveGenderGrammar('unspecified');
    expect(neutral.sonDaughterBn).toBe('সন্তান');
    expect(neutral.studentNounBn).toBe('শিক্ষার্থী');
    expect(neutral.sonDaughterEn).toBe('ward of');
    expect(neutral.heShe).toBe('They');
    expect(neutral.hisHer).toBe('their');
  });

  it('composes bilingual testimonial text cleanly with female pronouns and no slashes', () => {
    const draft = mapStudentToCertificateDraft(
      {
        id: 'STD-102',
        name: 'সাদিয়া আক্তার',
        nameEn: 'Sadia Akter',
        roll: '04',
        grade: '10th',
        section: 'A',
        group: 'বিজ্ঞান',
        gender: 'নারী',
        fatherName: 'Md. Karim',
        motherName: 'Salma Begum',
        session: '2024-2025',
        dob: '2009-04-12',
        permanentAddress: 'Kalampur, Dhamrai, Dhaka',
        gpa: '5.00',
        sscRoll: '145820',
        registrationNo: '1910224488',
      },
      SAMPLE_SETTINGS
    );
    draft.currentlyStudying = false;
    draft.passingYear = '2026';

    const englishBody = composeCertificateBody({
      type: 'ssc_testimonial',
      language: 'en',
      draft,
      schoolSettings: SAMPLE_SETTINGS,
      selectedTraits: ['meritorious', 'polite'],
      purposeId: 'higher_study',
    });

    expect(englishBody).toContain('daughter of **Md. Karim**');
    expect(englishBody).toContain('she was found');
    expect(englishBody).toContain('her date of birth');
    expect(englishBody).toContain('GPA 5.00');
    expect(englishBody).toContain('meritorious, polite and well-mannered');
    expect(englishBody).not.toContain('son/daughter');
    expect(englishBody).not.toContain('He/She');
    expect(englishBody).not.toContain('Boraitoli');
  });

  it('switches verbs between currently studying and passed/ex-student modes', () => {
    const baseStudent: Student = {
      id: 'STD-201',
      name: 'রাফি হাসান',
      roll: '12',
      grade: '9th',
      section: 'A',
      group: 'বিজ্ঞান',
      gender: 'পুরুষ',
      fatherName: 'আবুল হাসান',
      motherName: 'রওশন আরা',
    };

    const activeDraft = mapStudentToCertificateDraft(baseStudent, SAMPLE_SETTINGS);
    activeDraft.currentlyStudying = true;
    const activeBn = composeCertificateBody({
      type: 'current_student',
      language: 'bn',
      draft: activeDraft,
      schoolSettings: SAMPLE_SETTINGS,
      selectedTraits: ['regular'],
      purposeId: 'scholarship',
    });
    expect(activeBn).toContain('বর্তমানে অত্র বিদ্যালয়ের');
    expect(activeBn).toContain('নিয়মিত ছাত্র হিসেবে অধ্যয়নরত আছে');

    const exDraft = { ...activeDraft, currentlyStudying: false };
    const exBn = composeCertificateBody({
      type: 'current_student',
      language: 'bn',
      draft: exDraft,
      schoolSettings: SAMPLE_SETTINGS,
      selectedTraits: ['honest'],
      purposeId: 'general',
    });
    expect(exBn).toContain('নিয়মিত ছাত্র ছিল');
  });

  it('avoids hardcoded village fallbacks and uses dotted blanks when address or parents are empty', () => {
    const parsed = parseAddressParts('', {});
    expect(parsed.village).toBe('');
    expect(parsed.upazila).toBe('');
    expect(parsed.district).toBe('');

    const emptyStudent: Student = {
      id: 'STD-EMPTY',
      name: 'তানভীর',
      roll: '01',
      grade: '8th',
      section: 'A',
      group: 'সাধারণ',
    };
    const draft = mapStudentToCertificateDraft(emptyStudent, {});
    const body = composeCertificateBody({
      type: 'character_certificate',
      language: 'bn',
      draft,
      schoolSettings: {},
      selectedTraits: [],
      purposeId: 'general',
    });
    expect(body).toContain(DOTTED_BLANK);
    expect(body).not.toContain('বরইতলী');
    expect(body).not.toContain('চকরিয়া');
    expect(body).not.toContain('কক্সবাজার');
  });

  it('sanitizes HTML entities and formats Bengali/English dates and digits accurately', () => {
    expect(cleanEntityText("Cox&#039;S Bazar &amp; Co")).toBe("Cox'S Bazar & Co");
    expect(toBanglaDigits('2026-05')).toBe('২০২৬-০৫');
    expect(formatCertificateDate('2026-11-16', 'bn')).toBe('১৬ নভেম্বর ২০২৬');
    expect(formatCertificateDate('2026-11-16', 'en')).toBe('16 November 2026');
  });

  it('maps AlumniRecord and syncs latest exam GPA from resultService storage cleanly', () => {
    // Seed exam in sms_exam_setup + Class 8 marks under real markStorageUtils keys
    localStorage.setItem(
      'sms_exam_setup',
      JSON.stringify([{ id: 'EXAM-1', title: 'Annual Examination 2026', date: '2026-11-10', status: 'Published', isActive: true }])
    );
    const subjectMarksToSeed: Array<[string, Record<string, unknown>]> = [
      ['BAN-801', { studentId: 'STD-999', roll: '09', cq: 88, total: 88 }],
      ['BAN-802', { studentId: 'STD-999', roll: '09', cq: 44, total: 44 }],
      ['ENG-801', { studentId: 'STD-999', roll: '09', cq: 86, total: 86 }],
      ['ENG-802', { studentId: 'STD-999', roll: '09', cq: 45, total: 45 }],
      ['MAT-803', { studentId: 'STD-999', roll: '09', cq: 65, ca: 25, total: 90 }],
      ['SCI-804', { studentId: 'STD-999', roll: '09', cq: 85, total: 85 }],
      ['ICT-805', { studentId: 'STD-999', roll: '09', cq: 23, practical: 22, total: 45 }],
      ['BGS-806', { studentId: 'STD-999', roll: '09', cq: 84, total: 84 }],
      ['REL-111', { studentId: 'STD-999', roll: '09', cq: 87, total: 87 }],
      ['AGR-807', { studentId: 'STD-999', roll: '09', cq: 45, mcq: 22, practical: 22, total: 89 }],
    ];
    for (const [code, row] of subjectMarksToSeed) {
      localStorage.setItem(
        `sms_marks_EXAM-1_8th_A_সাধারণ_${code}`,
        JSON.stringify([row])
      );
    }

    const activeStudent: Student = {
      id: 'STD-999',
      name: 'মাহিন',
      roll: '09',
      grade: '8th',
      section: 'A',
      group: 'সাধারণ',
      religion: 'ইসলাম',
    };
    const syncedDraft = mapStudentToCertificateDraft(activeStudent, SAMPLE_SETTINGS);
    expect(syncedDraft.gpa).toBe('5.00');
    expect(syncedDraft.gradeLetter).toBe('A+');

    const alumni: AlumniRecord = {
      id: 'ALM-2024-01',
      studentId: 'STD-OLD-1',
      name: 'নুসরাত জাহান',
      fatherName: 'আব্দুল মান্নান',
      passingYear: '2024',
      batch: 'SSC 2024',
      sscRoll: '112233',
      regNo: '1810998877',
      group: 'বিজ্ঞান',
      gpa: '4.94',
      address: 'মিরপুর, ঢাকা',
      archivedAt: '2025-01-01T00:00:00Z',
    };
    const alumniDraft = mapAlumniToCertificateDraft(alumni, SAMPLE_SETTINGS);
    expect(alumniDraft.currentlyStudying).toBe(false);
    expect(alumniDraft.gender).toBe('female');
    expect(alumniDraft.gpa).toBe('4.94');
    expect(alumniDraft.boardRoll).toBe('112233');
  });

  it('interpolates smart placeholders in certificateService and preserves gender in sscTranscriptUtils', () => {
    const out = certificateService.interpolateTemplate(
      '{{student_name}} ({{son_daughter}} {{father_name}}), {{He_She}} is {{traits_line}}. {{purpose_line}}',
      {
        student_name: 'Ayesha',
        father_name: 'Tariq',
        son_daughter: 'daughter of',
        He_She: 'She',
        traits_line: 'polite',
        purpose_line: 'Issued for scholarship.',
      }
    );
    expect(out).toBe('Ayesha (daughter of Tariq), She is polite. Issued for scholarship.');

    const sscRec = buildRecordFromCertificate(
      {
        id: 'CERT-1',
        type: 'ssc_testimonial',
        refNo: 'GMH/2026/101',
        issueDate: '2026-11-16',
        studentId: 'S-1',
        studentName: 'তাসনিম আক্তার',
        fatherName: 'মোঃ জসিম',
        motherName: 'রিনা বেগম',
        gender: 'নারী',
        roll: '02',
        grade: '10th',
        section: 'A',
        group: 'বিজ্ঞান',
        session: '2024-2025',
        dob: '2009-02-02',
        createdDate: '2026-11-16',
      },
      { ...(SAMPLE_SETTINGS as SchoolSettings) }
    );
    expect(sscRec.gender).toBe('Female');
    expect(sscRec.characterRemarks).toContain('She bears');
  });

  it('builds verification URL and dynamic refNo from school settings initials', () => {
    const ref = buildDefaultRefNo(SAMPLE_SETTINGS);
    expect(ref.startsWith('GMHS/CERT/')).toBe(true);
    const prefixedRef = buildDefaultRefNo({ padRefPrefix: 'স্মারক নং: ব.উ.বি/' });
    expect(prefixedRef).not.toContain('//');
    expect(prefixedRef.startsWith('ব.উ.বি/')).toBe(true);

    const url = buildCertificateVerifyUrl(
      {
        id: 'CERT-2026-88412',
        studentNameEn: 'Sadia Akter',
        boardRoll: '145820',
        gpa: '5.00',
        passingYear: '2026',
      },
      'https://schoolpro.test'
    );
    expect(url).toContain('https://schoolpro.test/verify-certificate?');
    expect(url).toContain('id=CERT-2026-88412');
    expect(url).toContain('r=145820');
    expect(url).toContain('g=5.00');
  });

  it('omits empty optional fields cleanly in custom certificate mode without dotted blanks', () => {
    const customDraft = mapStudentToCertificateDraft(
      {
        id: 'CUSTOM-1',
        name: 'মোহাম্মদ আরিফ হোসেন',
        roll: '',
        grade: '',
        section: '',
        group: '',
      },
      {},
    );
    customDraft.grade = '';
    customDraft.roll = '';
    customDraft.group = '';
    customDraft.session = '';

    const cleanBn = composeCertificateBody({
      type: 'custom_certificate',
      language: 'bn',
      draft: customDraft,
      schoolSettings: SAMPLE_SETTINGS,
      selectedTraits: ['honest'],
      purposeId: 'general',
      omitEmptyFields: true,
    });
    expect(cleanBn).toContain('**মোহাম্মদ আরিফ হোসেন**');
    expect(cleanBn).not.toContain(DOTTED_BLANK);
    expect(CUSTOM_DOCUMENT_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it('sorts student rolls numerically across Bangla and English digits and resolves pad canvas mode', () => {
    const sorted = sortStudentsByRoll([
      { roll: '10', name: 'Ten' },
      { roll: '২', name: 'Two' },
      { roll: '1', name: 'One' },
      { roll: '০৯', name: 'Nine' },
    ]);
    expect(sorted.map((s) => s.name)).toEqual(['One', 'Two', 'Nine', 'Ten']);

    expect(resolveCertificateCanvasMode({ layoutStyle: 'pad' })).toBe('uploaded_pad');
    expect(resolveCertificateCanvasMode({ canvasMode: 'preprinted_pad' })).toBe('preprinted_pad');
    expect(resolveCertificateCanvasMode({ borderPreset: 'royal_crest', layoutStyle: 'royal_border' })).toBe(
      'digital_frame',
    );
  });

  it('saves and deletes custom templates while protecting default templates and preserving local uploaded pad during cloud merge', () => {
    const beforeCount = certificateService.getTemplates().length;
    certificateService.saveTemplate({
      id: 'tmpl_custom_noc',
      type: 'custom_certificate',
      name: 'কাস্টম NOC',
      title: 'অনাপত্তিপত্র (NOC)',
      layoutStyle: 'pad',
      bodyTemplate: 'অনাপত্তিপত্র {{student_name}}',
      isDefault: false,
      language: 'bn',
    });
    expect(certificateService.getTemplates().length).toBe(beforeCount + 1);
    // Default template must not be deleted
    certificateService.deleteTemplate('tmpl_current_student');
    expect(certificateService.getTemplates().length).toBe(beforeCount + 1);
    // Custom template deletes cleanly
    certificateService.deleteTemplate('tmpl_custom_noc');
    expect(certificateService.getTemplates().length).toBe(beforeCount);

    const merged = mergeCloudSettingsPreservingLocalPad(
      {
        schoolName: 'Local School',
        schoolLogo: '',
        address: '',
        eiin: '',
        estdYear: '1970',
        principalName: '',
        principalTitle: 'প্রধান শিক্ষক',
        classTeacherTitle: '',
        guardianTitle: '',
        showWatermark: true,
        watermarkText: '',
        watermarkOpacity: 0.03,
        phone: '',
        email: '',
        website: '',
        showClassSelection: true,
        showSectionSelection: true,
        showRollInput: true,
        uploadedPadTemplateUrl: 'data:image/jpeg;base64,LOCAL_PAD_DATA',
        uploadedPadFileName: 'my-pad.png',
        activePadMode: 'uploaded',
      },
      {
        schoolName: 'Cloud School',
        uploadedPadTemplateUrl: '',
      },
    );
    expect(merged.schoolName).toBe('Cloud School');
    expect(merged.uploadedPadTemplateUrl).toBe('data:image/jpeg;base64,LOCAL_PAD_DATA');
    expect(merged.uploadedPadFileName).toBe('my-pad.png');

    // Newer local upload must NOT be reverted by an older cloud snapshot carrying an old Pad.pdf
    const mergedNewerLocal = mergeCloudSettingsPreservingLocalPad(
      {
        ...(merged as SchoolSettings),
        uploadedPadTemplateUrl: 'data:image/jpeg;base64,NEW_LOCAL_PAD',
        uploadedPadFileName: 'new-pad.png',
        uploadedPadUpdatedAt: 2000,
      },
      {
        schoolName: 'Cloud School',
        uploadedPadTemplateUrl: 'data:image/jpeg;base64,OLD_CLOUD_PAD',
        uploadedPadFileName: 'Pad.pdf',
        uploadedPadUpdatedAt: 1000,
      },
    );
    expect(mergedNewerLocal.uploadedPadTemplateUrl).toBe('data:image/jpeg;base64,NEW_LOCAL_PAD');
    expect(mergedNewerLocal.uploadedPadFileName).toBe('new-pad.png');
  });
});
