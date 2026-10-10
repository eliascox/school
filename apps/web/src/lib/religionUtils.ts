/**
 * ================================================================
 * RELIGION UTILITY — Central Religion Detection & Subject Logic
 * ================================================================
 * এই ফাইলে ধর্ম সংক্রান্ত সকল লজিক কেন্দ্রীভূত করা হয়েছে।
 *
 * নিয়ম:
 *  - মুসলিম শিক্ষার্থী → বিষয়: "ইসলাম ও নৈতিক শিক্ষা"
 *  - হিন্দু শিক্ষার্থী  → বিষয়: "হিন্দুধর্ম ও নৈতিক শিক্ষা"
 *  - নম্বর এন্ট্রিতে শুধু নিজ ধর্মের শিক্ষার্থী দেখাবে
 *  - টেবুলেশনে একটি "ধর্ম" কলামে সকল ধর্মের নম্বর বসবে
 * ================================================================
 */

/** একজন শিক্ষার্থী হিন্দু কিনা নির্ধারণ করে */
export function isHinduStudent(student: {
  religion?: string;
  religionBn?: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  guardian?: string;
  [key: string]: any;
}): boolean {
  // ১. সরাসরি religion field চেক
  const rel = (student.religion || student.religionBn || '').toString().toLowerCase().trim();

  if (
    rel.includes('hindu') ||
    rel.includes('হিন্দু') ||
    rel.includes('sanatan') ||
    rel.includes('সনাতন') ||
    rel.includes('hinduism')
  ) {
    return true;
  }

  // যদি স্পষ্টভাবে মুসলিম হয়, তাহলে হিন্দু নয়
  if (
    rel.includes('islam') ||
    rel.includes('ইসলাম') ||
    rel.includes('muslim') ||
    rel.includes('মুসলিম')
  ) {
    return false;
  }

  // ২. নাম থেকে অনুমান (শুধু তখনই যখন religion field খালি)
  if (!rel) {
    const fullText = [
      student.name || '',
      student.fatherName || '',
      student.motherName || '',
      student.guardian || '',
    ]
      .join(' ')
      .toLowerCase();

    const hinduSurnames = [
      'সেন', 'দাস', 'সরকার', 'বনিক', 'বণিক', 'বিশ্বাস', 'দত্ত', 'দে', 'রায়',
      'পাল', 'চক্রবর্তী', 'শীল', 'বর্মণ', 'মহাজন', 'মন্ডল', 'মণ্ডল', 'ভট্টাচার্য',
      'অধিকারী', 'নাথ', 'হালদার', 'ঘোষ', 'মজুমদার', 'দেবনাথ', 'সাহা',
      'জয়দেব', 'প্রদীপ', 'রানী', 'সুচরিতা', 'বিপ্লব', 'শর্মা', 'বর্মা', 'গুপ্ত',
      'ত্রিপুরা', 'মারমা', 'চাকমা', 'তঞ্চঙ্গ্যা',
    ];

    return hinduSurnames.some((kw) => fullText.includes(kw));
  }

  return false;
}

/** একজন শিক্ষার্থীর ধর্ম রিটার্ন করে */
export type ReligionType = 'Muslim' | 'Hindu' | 'Christian' | 'Buddhist' | 'Other';

export function getStudentReligion(student: any): ReligionType {
  const rel = (student.religion || student.religionBn || '').toString().toLowerCase().trim();

  if (rel.includes('christian') || rel.includes('খ্রিস্টান')) return 'Christian';
  if (rel.includes('buddhist') || rel.includes('বৌদ্ধ')) return 'Buddhist';
  if (isHinduStudent(student)) return 'Hindu';
  return 'Muslim'; // default
}

/** একটি বিষয় ধর্মভিত্তিক কিনা এবং কোন ধর্মের সেটি চেক করে */
export type SubjectReligionType = 'Muslim' | 'Hindu' | 'Christian' | 'Buddhist' | null;

export function getSubjectReligion(subjectName: string): SubjectReligionType {
  const lower = subjectName.toLowerCase();
  if (
    lower.includes('ইসলাম') ||
    lower.includes('islam') ||
    lower.includes('মুসলিম')
  ) return 'Muslim';

  if (
    lower.includes('হিন্দু') ||
    lower.includes('hindu') ||
    lower.includes('সনাতন')
  ) return 'Hindu';

  if (lower.includes('খ্রিস্টান') || lower.includes('christian')) return 'Christian';
  if (lower.includes('বৌদ্ধ') || lower.includes('buddhist')) return 'Buddhist';

  return null; // ধর্মনিরপেক্ষ বিষয়
}

/**
 * একটি বিষয়ের জন্য কোন শিক্ষার্থী দেখাবে সেটি ফিল্টার করে।
 * - ইসলাম বিষয় → শুধু মুসলিম
 * - হিন্দু বিষয় → শুধু হিন্দু
 * - অন্যান্য → সবাই
 */
export function filterStudentsBySubjectReligion<T extends Record<string, any>>(
  students: T[],
  subjectName: string
): T[] {
  const subRel = getSubjectReligion(subjectName);
  if (!subRel) return students; // ধর্মনিরপেক্ষ বিষয় — সবাইকে দেখাও

  return students.filter((s) => {
    const studentRel = getStudentReligion(s);
    return studentRel === subRel;
  });
}

/**
 * টেবুলেশনে ধর্মবিষয়ক নম্বর লোড করার জন্য সঠিক subject name/code খোঁজে।
 * শিক্ষার্থীর ধর্ম অনুযায়ী সঠিক বিষয়ের নম্বর খোঁজে।
 */
export function getReligionSubjectKeys(studentReligion: ReligionType): {
  codes: string[];
  names: string[];
} {
  const commonCodes = ['REL-111', 'REL-112', 'REL-113'];

  if (studentReligion === 'Hindu') {
    return {
      codes: commonCodes,
      names: [
        'হিন্দুধর্ম ও নৈতিক শিক্ষা',
        'হিন্দু ধর্ম',
        'হিন্দুধর্ম',
        'সনাতন ধর্ম',
        'ধর্ম',
      ],
    };
  }

  if (studentReligion === 'Christian') {
    return {
      codes: commonCodes,
      names: ['খ্রিস্টান ধর্ম', 'খ্রিস্টান ধর্ম ও নৈতিক শিক্ষা', 'ধর্ম'],
    };
  }

  if (studentReligion === 'Buddhist') {
    return {
      codes: commonCodes,
      names: ['বৌদ্ধ ধর্ম', 'বৌদ্ধধর্ম ও নৈতিক শিক্ষা', 'ধর্ম'],
    };
  }

  // Muslim (default)
  return {
    codes: commonCodes,
    names: [
      'ইসলাম ও নৈতিক শিক্ষা',
      'ইসলাম শিক্ষা',
      'ইসলামিক শিক্ষা',
      'ধর্ম',
    ],
  };
}

/** বিষয়ের নামে বা কোডে ধর্মীয় বিষয় কিনা তা নিখুঁতভাবে চেক করে */
export function isReligionSubject(subjectName: string): boolean {
  if (!subjectName) return false;
  const lower = subjectName.toLowerCase();
  if (
    lower.includes('ধর্ম') ||
    lower.includes('rel') ||
    lower.includes('ইসলাম') ||
    lower.includes('islam') ||
    lower.includes('মুসলিম') ||
    lower.includes('হিন্দু') ||
    lower.includes('hindu') ||
    lower.includes('সনাতন') ||
    lower.includes('খ্রিস্টান') ||
    lower.includes('christian') ||
    lower.includes('বৌদ্ধ') ||
    lower.includes('buddhist')
  ) {
    return true;
  }
  return getSubjectReligion(subjectName) !== null;
}
