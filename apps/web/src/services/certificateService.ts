// ─── CENTRALIZED CERTIFICATE & DOCUMENT MANAGEMENT SERVICE ──────────────────
'use client';

export type CertificateType =
  | 'ssc_testimonial'         // প্রশংসাপত্র / এসএসসি প্রশংসাপত্র (Testimonial)
  | 'character_certificate'   // চারিত্রিক সনদ পত্র (Character Certificate)
  | 'transfer_certificate'    // ছাড়পত্র / টিসি (Transfer Certificate - TC)
  | 'current_student'         // অধ্যয়নরত প্রত্যয়ন পত্র (Study / Bonafide Certificate)
  | 'appreciation'            // কৃতিত্ব / প্রশংসা সনদ (Appreciation Certificate)
  | 'merit_certificate'       // মেধা সনদ পত্র (Merit Certificate)
  | 'student_verification'    // শিক্ষার্থী যাচাইকরণ সনদ (Student Verification Certificate)
  | 'participation'           // সহশিক্ষা / অংশগ্রহণ সনদ (Participation Certificate)
  | 'activity_certificate'    // সহশিক্ষা ও কার্যক্রম সনদ (Activity / Experience Certificate)
  | 'custom_certificate';     // অন্যান্য কাস্টম সনদ পত্র (Custom Certificate)

export type CertificateStatus = 'valid' | 'cancelled';
export type CertificateLayoutStyle = 'pad' | 'royal_border' | 'modern_clean';

export interface CertificateAuditEntry {
  action: 'CREATED' | 'EDITED' | 'PRINTED' | 'REGENERATED' | 'CANCELLED';
  timestamp: string;
  performedBy: string;
  note?: string;
}

export interface CertificateRecord {
  id: string; // Unique Certificate No e.g. CERT-2026-8942
  verificationCode?: string; // Verification ID for QR & Public verification
  type: CertificateType;
  title?: string;
  refNo: string;
  issueDate: string;
  status?: CertificateStatus;
  layoutStyle?: CertificateLayoutStyle;

  // Student Primary Info (Synchronized from studentService)
  studentId: string;
  studentName: string;
  studentNameEn?: string;
  fatherName: string;
  fatherNameEn?: string;
  motherName: string;
  motherNameEn?: string;
  guardian?: string;
  admissionNo?: string;
  roll: string;
  grade: string;
  section: string;
  group: string; // বিজ্ঞান | মানবিক | ব্যবসায় শিক্ষা | সাধারণ
  session: string; // e.g. 2024-2025 or 2026
  dob: string;
  gender?: string;
  religion?: string;
  bloodGroup?: string;
  birthRegNo?: string;

  // Address
  village?: string;
  postOffice?: string;
  upazila?: string;
  district?: string;
  address?: string;

  // Academic / Exam Specifics
  boardRoll?: string;
  boardReg?: string;
  passingYear?: string;
  gpa?: string;
  isAlumni?: boolean;

  // Content & Customization
  achievementTitle?: string; // e.g. "আন্তঃবিদ্যালয় ফুটবল চ্যাম্পিয়নশিপে সেরা খেলোয়াড়" or "বার্ষিক পরীক্ষায় ১ম স্থান"
  characterRemarks?: string;
  customBody?: string;
  templateId?: string;

  // Signatures & School Pad
  padType?: 'digital_server' | 'manual_printed' | 'blank_pad';
  principalTitle?: string;
  authorizedPersonTitle?: string;

  // Cancellation Information
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;

  // Audit Log & Tracking
  createdBy?: string;
  createdDate: string;
  updatedDate?: string;
  auditTrail?: CertificateAuditEntry[];
}

export type CertificateInput = Omit<
  CertificateRecord,
  'id' | 'createdDate' | 'verificationCode' | 'status' | 'auditTrail'
> & {
  id?: string;
  verificationCode?: string;
  status?: CertificateStatus;
  auditTrail?: CertificateAuditEntry[];
  createdBy?: string;
};

export interface CertificateTemplate {
  id: string;
  type: CertificateType;
  name: string;
  title: string;
  layoutStyle: CertificateLayoutStyle;
  bodyTemplate: string;
  isDefault: boolean;
  language: 'bn' | 'en';
}

const STORAGE_KEY = 'sms_certificates_history';
const TEMPLATES_STORAGE_KEY = 'sms_certificate_templates';
const TEMPLATES_VERSION_KEY = 'sms_templates_version';
const CURRENT_TEMPLATES_VERSION = 'v6_bold_title_3in_margin';

// ─── DEFAULT TEMPLATES WITH DYNAMIC VARIABLES ──────────────────────────────
export const DEFAULT_CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'tmpl_current_student',
    type: 'current_student',
    name: 'অধ্যয়নরত প্রত্যয়ন পত্র (ডিফল্ট)',
    title: 'অধ্যয়নরত প্রত্যয়ন পত্র',
    layoutStyle: 'pad',
    language: 'bn',
    isDefault: true,
    bodyTemplate: `এই মর্মে **অধ্যয়নরত প্রত্যয়ন পত্র** প্রদান করা যাচ্ছে যে, {{student_name}}, পিতা: {{father_name}}, মাতা: {{mother_name}}, গ্রাম: {{village}}, ডাকঘর: {{post_office}}, উপজেলা: {{upazila}}, জেলা: {{district}}। সে এই বিদ্যালয়ের {{class}} শ্রেণির {{group}} বিভাগের একজন নিয়মিত ও শান্ত স্বভাবের শিক্ষার্থী হিসেবে বর্তমানে অধ্যয়নরত আছে। তার শ্রেণি রোল নম্বর: {{roll_no}} এবং ভর্তিবহি মতে জন্ম তারিখ: {{date_of_birth}} খ্রি.।

এই বিদ্যালয়ে অধ্যয়নকালে তার নৈতিক চরিত্র, সামাজিক শৃঙ্খলাবোধ ও আচার-ব্যবহার অত্যন্ত প্রশংসনীয়। আমার জানামতে সে কোন প্রকার রাষ্ট্রবিরোধী বা শৃঙ্খলাপরিপন্থী কর্মকাণ্ডে জড়িত নয়।

আমি তার জীবনের সর্বাঙ্গীন মঙ্গল, সুস্বাস্থ্য ও উত্তরোত্তর সমৃদ্ধি কামনা করি।`
  },
  {
    id: 'tmpl_character_certificate',
    type: 'character_certificate',
    name: 'চারিত্রিক সনদ পত্র (ডিফল্ট)',
    title: 'চারিত্রিক সনদ পত্র',
    layoutStyle: 'pad',
    language: 'bn',
    isDefault: true,
    bodyTemplate: `এই মর্মে **চারিত্রিক সনদ পত্র** প্রদান করা যাচ্ছে যে, {{student_name}}, পিতা: {{father_name}}, মাতা: {{mother_name}}, গ্রাম: {{village}}, ডাকঘর: {{post_office}}, উপজেলা: {{upazila}}, জেলা: {{district}}, জন্ম তারিখ: {{date_of_birth}} খ্রি.। সে এই বিদ্যালয়ের {{class}} শ্রেণির একজন নিয়মিত শিক্ষার্থী ছিল/আছে (রোল: {{roll_no}}, সেশন: {{session}})।

এই বিদ্যালয়ে অধ্যয়নকালে তার নৈতিক চরিত্র, আচার-আচরণ ও স্বভাব অত্যন্ত উত্তম ও সন্তোষজনক ছিল। আমার জানামতে সে কোনো রাষ্ট্র, সমাজ বা বিদ্যালয় শৃঙ্খলাপরিপন্থী কাজে কখনোই জড়িত ছিল না।

আমি তার জীবনের সার্বিক সাফল্য ও উজ্জ্বল ভবিষ্যৎ কামনা করি।`
  },
  {
    id: 'tmpl_ssc_testimonial',
    type: 'ssc_testimonial',
    name: 'এসএসসি প্রশংসাপত্র (Testimonial - English)',
    title: 'TESTIMONIAL',
    layoutStyle: 'royal_border',
    language: 'en',
    isDefault: true,
    bodyTemplate: `This is to certify that **{{student_name}}**, son/daughter of Mr. {{father_name}} and Mrs. {{mother_name}}, Village: {{village}}, Post Office: {{post_office}}, Upazilla: {{upazila}}, District: {{district}}, was a bona fide student of {{school_name}}.

He/She bore Roll No. {{board_roll}}, Registration No. {{board_reg}}, Session {{session}}, Group {{group}}. He/She has duly passed the Secondary School Certificate (S.S.C.) Examination held in {{passing_year}} and secured GPA {{gpa}} out of 5.00 under the Board of Intermediate and Secondary Education, Chattogram.

During the period of study in this institution, his/her moral character and conduct were found to be excellent. There is no adverse record against him/her regarding state security or institutional discipline.

We wish him/her every success in all future academic and personal endeavors.`
  },
  {
    id: 'tmpl_transfer_certificate',
    type: 'transfer_certificate',
    name: 'ছাড়পত্র / টিসি (Transfer Certificate)',
    title: 'ছাড়পত্র / টিসি (Transfer Certificate)',
    layoutStyle: 'pad',
    language: 'bn',
    isDefault: true,
    bodyTemplate: `এই মর্মে **ছাড়পত্র (TC)** প্রদান করা যাচ্ছে যে, {{student_name}}, পিতা: {{father_name}}, মাতা: {{mother_name}}, গ্রাম: {{village}}, ডাকঘর: {{post_office}}, উপজেলা: {{upazila}}, জেলা: {{district}}। সে এই বিদ্যালয়ের {{class}} শ্রেণির {{group}} বিভাগের একজন নিয়মিত শিক্ষার্থী ছিল। তার শ্রেণি রোল নম্বর: {{roll_no}}, সেশন: {{session}} এবং ভর্তিবহি অনুসারে তার জন্ম তারিখ: {{date_of_birth}} খ্রি.।

এই বিদ্যালয়ে অধ্যয়নকালে তার সমস্ত বকেয়া ও পাওনাদি পরিশোধিত হয়েছে। তার স্বভাব-চরিত্র সন্তোষজনক ছিল। অভিভাবকের আবেদনের প্রেক্ষিতে এবং প্রাতিষ্ঠানিক নিয়ম মেনে তাকে এই বিদ্যালয় থেকে এই ছাড়পত্র প্রদান করা হলো।

আমরা তার ভবিষ্যৎ জীবনের সর্বাঙ্গীন মঙ্গল ও সাফল্য কামনা করি।`
  },
  {
    id: 'tmpl_appreciation',
    type: 'appreciation',
    name: 'কৃতিত্ব ও প্রশংসা সনদ (Appreciation Certificate)',
    title: 'কৃতিত্ব ও প্রশংসা সনদ (Certificate of Appreciation)',
    layoutStyle: 'royal_border',
    language: 'bn',
    isDefault: true,
    bodyTemplate: `এই বিদ্যালয় অত্যন্ত আনন্দের সাথে প্রত্যয়ন করছে যে, শিক্ষার্থী {{student_name}} (আইডি: {{student_id}}, শ্রেণি: {{class}}, রোল: {{roll_no}}), পিতা: {{father_name}}, মাতা: {{mother_name}}, গ্রাম: {{village}}, ডাকঘর: {{post_office}}, উপজেলা: {{upazila}}, জেলা: {{district}} তার অসামান্য মেধা, নিষ্ঠা ও কৃতিত্বপূর্ণ অবদানের স্বীকৃতিস্বরূপ এই **কৃতিত্ব ও প্রশংসা সনদ** লাভ করল।

বিশেষ অবদান / ক্ষেত্র: {{achievement}}।

তার এই গৌরবোজ্জ্বল অর্জন ও অধ্যবসায় ভবিষ্যৎ প্রজন্মের জন্য এক অনন্য অনুপ্রেরণা হয়ে থাকবে।`
  },
  {
    id: 'tmpl_merit_certificate',
    type: 'merit_certificate',
    name: 'মেধা সনদ পত্র (Certificate of Merit)',
    title: 'মেধা সনদ পত্র (Certificate of Merit)',
    layoutStyle: 'royal_border',
    language: 'bn',
    isDefault: true,
    bodyTemplate: `শিক্ষার্থী {{student_name}}, পিতা: {{father_name}}, মাতা: {{mother_name}}, গ্রাম: {{village}}, ডাকঘর: {{post_office}}, উপজেলা: {{upazila}}, জেলা: {{district}}, শ্রেণি: {{class}}, রোল: {{roll_no}}, শাখা: {{section}}-কে তার অসাধারণ মেধা, পরীক্ষায় সর্বোত্তম ফলাফল ও একনিষ্ঠ জ্ঞানচর্চার স্বীকৃতিস্বরূপ এই **মেধা সনদ পত্র** প্রদান করা হলো।

শিক্ষাবর্ষ: {{session}} | অর্জিত জিপিএ: {{gpa}} | বিশেষ কৃতিত্ব: {{achievement}}।

আমরা তার মেধার উত্তরোত্তর স্ফূরণ ও সমৃদ্ধ ভবিষ্যৎ কামনা করি।`
  },
  {
    id: 'tmpl_participation',
    type: 'participation',
    name: 'অংশগ্রহণ সনদ (Participation Certificate)',
    title: 'অংশগ্রহণ সনদ পত্র (Certificate of Participation)',
    layoutStyle: 'royal_border',
    language: 'bn',
    isDefault: true,
    bodyTemplate: `এই মর্মে **অংশগ্রহণ সনদ পত্র** প্রদান করা যাচ্ছে যে, {{student_name}}, পিতা: {{father_name}}, মাতা: {{mother_name}}, গ্রাম: {{village}}, ডাকঘর: {{post_office}}, উপজেলা: {{upazila}}, জেলা: {{district}} (শ্রেণি: {{class}}, রোল: {{roll_no}}) এই বিদ্যালয় আয়োজিত বিশেষ সহশিক্ষা কার্যক্রম / প্রতিযোগিতায় অত্যন্ত সক্রিয়ভাবে ও দক্ষতার সাথে অংশগ্রহণ করেছে।

আয়োজন / কার্যক্রম: {{achievement}}।

তার এই ক্রীড়াসুলভ মনোভাব ও উদ্দীপনা প্রশংসনীয়।`
  },
  {
    id: 'tmpl_student_verification',
    type: 'student_verification',
    name: 'শিক্ষার্থী যাচাইকরণ সনদ (Student Verification Certificate)',
    title: 'শিক্ষার্থী পরিচয় ও তথ্য যাচাইকরণ প্রত্যয়ন',
    layoutStyle: 'pad',
    language: 'bn',
    isDefault: true,
    bodyTemplate: `সংশ্লিষ্ট সকলের অবগতির জন্য এই মর্মে **শিক্ষার্থী তথ্য যাচাইকরণ প্রত্যয়ন** করা যাচ্ছে যে, শিক্ষার্থী {{student_name}}, পিতা: {{father_name}}, মাতা: {{mother_name}}, গ্রাম: {{village}}, ডাকঘর: {{post_office}}, উপজেলা: {{upazila}}, জেলা: {{district}}, জন্ম তারিখ: {{date_of_birth}}, ডিজিটাল জন্ম নিবন্ধন নং: {{birth_reg_no}} এই বিদ্যালয়ের অফিশিয়াল রেজিস্ট্রিভুক্ত শিক্ষার্থী।

তার আইডি নং: {{student_id}}, শ্রেণি: {{class}}, শাখা: {{section}}, সেশন: {{session}}। তার প্রদত্ত যাবতীয় তথ্য এই বিদ্যালয়ের মূল রেকর্ডের সাথে পুঙ্খানুপুঙ্খভাবে যাচাই করে সম্পূর্ণ সঠিক ও নির্ভুল পাওয়া গেছে।`
  },
  {
    id: 'tmpl_activity_certificate',
    type: 'activity_certificate',
    name: 'সহশিক্ষা ও অভিজ্ঞতা সনদ (Experience & Activity)',
    title: 'সহশিক্ষা কার্যক্রম ও অভিজ্ঞতা সনদ',
    layoutStyle: 'pad',
    language: 'bn',
    isDefault: true,
    bodyTemplate: `এই মর্মে **সহশিক্ষা ও অভিজ্ঞতা সনদ** প্রদান করা যাচ্ছে যে, {{student_name}}, পিতা: {{father_name}}, মাতা: {{mother_name}}, গ্রাম: {{village}}, ডাকঘর: {{post_office}}, উপজেলা: {{upazila}}, জেলা: {{district}} (শ্রেণি: {{class}}, সেশন: {{session}}) এই বিদ্যালয়ের স্কাউট/গার্ল গাইড/বিজ্ঞান ক্লাব/বিতর্ক ক্লাবে উল্লেখযোগ্য দায়িত্ব পালন ও অভিজ্ঞতা অর্জন করেছে।

বিশেষ ভূমিকা ও দায়িত্ব: {{achievement}}।

তার নেতৃত্বগুণ, দলগত চেতনা ও শৃঙ্খলার মান ছিল অত্যন্ত প্রশংসনীয়।`
  },
  {
    id: 'tmpl_custom_certificate',
    type: 'custom_certificate',
    name: 'বিশেষ কাস্টম প্রত্যয়ন পত্র',
    title: 'বিশেষ প্রত্যয়ন পত্র',
    layoutStyle: 'pad',
    language: 'bn',
    isDefault: true,
    bodyTemplate: `এই মর্মে **বিশেষ প্রত্যয়ন পত্র** প্রদান করা যাচ্ছে যে, {{student_name}}, পিতা: {{father_name}}, মাতা: {{mother_name}}, গ্রাম: {{village}}, ডাকঘর: {{post_office}}, উপজেলা: {{upazila}}, জেলা: {{district}}, শ্রেণি: {{class}}, রোল: {{roll_no}} এই বিদ্যালয়ের একজন শিক্ষার্থী।

{{remarks}}

তার উত্তরোত্তর মঙ্গল ও শুভকামনা করি।`
  }
];

class CertificateService {
  // ─── CERTIFICATES CRUD ─────────────────────────────────────────────────────

  getCertificates(): CertificateRecord[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing certificates from storage:', e);
      }
    }
    return [];
  }

  getCertificateById(idOrCode: string): CertificateRecord | null {
    const list = this.getCertificates();
    const query = (idOrCode || '').trim().toLowerCase();
    if (!query) return null;

    return (
      list.find(
        (c) =>
          c.id?.toLowerCase() === query ||
          c.verificationCode?.toLowerCase() === query ||
          c.refNo?.toLowerCase() === query
      ) || null
    );
  }

  getCertificatesByStudentId(studentId: string): CertificateRecord[] {
    const list = this.getCertificates();
    return list.filter((c) => c.studentId === studentId);
  }

  saveCertificate(record: CertificateInput): CertificateRecord {
    const list = this.getCertificates();
    const isEdit = Boolean(record.id && list.some((c) => c.id === record.id));

    const curYear = new Date().getFullYear();
    const rand5 = Math.floor(10000 + Math.random() * 90000);
    const certId = record.id || `CERT-${curYear}-${rand5}`;
    const vCode = record.verificationCode || `VER-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const existing = isEdit ? list.find((c) => c.id === record.id) : null;

    const initialAudit: CertificateAuditEntry = {
      action: isEdit ? 'EDITED' : 'CREATED',
      timestamp: new Date().toLocaleString('bn-BD'),
      performedBy: record.createdBy || 'প্রধান শিক্ষক / অ্যাডমিন',
      note: isEdit ? 'সনদপত্রের তথ্য হালনাগাদ করা হয়েছে' : 'নতুন প্রত্যয়ন প্রস্তুত করা হয়েছে'
    };

    const newRecord: CertificateRecord = {
      ...record,
      id: certId,
      verificationCode: vCode,
      status: record.status || existing?.status || 'valid',
      layoutStyle: record.layoutStyle || existing?.layoutStyle || 'pad',
      createdDate: existing?.createdDate || new Date().toLocaleString('bn-BD'),
      updatedDate: isEdit ? new Date().toLocaleString('bn-BD') : undefined,
      auditTrail: existing ? [initialAudit, ...(existing.auditTrail || [])] : [initialAudit]
    };

    let updated: CertificateRecord[];
    if (isEdit) {
      updated = list.map((c) => (c.id === record.id ? newRecord : c));
    } else {
      updated = [newRecord, ...list];
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }

    return newRecord;
  }

  saveBatchCertificates(records: CertificateInput[]): CertificateRecord[] {
    const list = this.getCertificates();
    const curYear = new Date().getFullYear();

    const createdList: CertificateRecord[] = records.map((r, i) => {
      const rand5 = Math.floor(10000 + Math.random() * 90000) + i;
      const certId = r.id || `CERT-${curYear}-${rand5}`;
      const vCode = `VER-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      return {
        ...r,
        id: certId,
        verificationCode: vCode,
        status: 'valid' as CertificateStatus,
        layoutStyle: r.layoutStyle || 'pad',
        createdDate: new Date().toLocaleString('bn-BD'),
        auditTrail: [
          {
            action: 'CREATED',
            timestamp: new Date().toLocaleString('bn-BD'),
            performedBy: r.createdBy || 'প্রধান শিক্ষক / অ্যাডমিন',
            note: 'বাল্ক ব্যাচ জেনারেশনের মাধ্যমে তৈরি'
          }
        ]
      };
    });

    const updated = [...createdList, ...list];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }

    return createdList;
  }

  cancelCertificate(id: string, reason: string, cancelledBy: string = 'অ্যাডমিন'): boolean {
    const list = this.getCertificates();
    const cert = list.find((c) => c.id === id);
    if (!cert) return false;

    const cancelAudit: CertificateAuditEntry = {
      action: 'CANCELLED',
      timestamp: new Date().toLocaleString('bn-BD'),
      performedBy: cancelledBy,
      note: `সনদটি বাতিল করা হয়েছে। কারণ: ${reason || 'প্রযোজ্য নয়'}`
    };

    const updatedRecord: CertificateRecord = {
      ...cert,
      status: 'cancelled',
      cancelledAt: new Date().toLocaleString('bn-BD'),
      cancelledBy,
      cancellationReason: reason || 'বাতিলকরণের কারণ উল্লেখ করা হয়নি',
      auditTrail: [cancelAudit, ...(cert.auditTrail || [])]
    };

    const updatedList = list.map((c) => (c.id === id ? updatedRecord : c));
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new Event('storage'));
    }

    return true;
  }

  logPrintAction(id: string, performedBy: string = 'অ্যাডমিন') {
    const list = this.getCertificates();
    const cert = list.find((c) => c.id === id);
    if (!cert) return;

    const printAudit: CertificateAuditEntry = {
      action: 'PRINTED',
      timestamp: new Date().toLocaleString('bn-BD'),
      performedBy,
      note: 'অফিশিয়াল কপি প্রিন্ট অথবা PDF ডাউনলোড করা হয়েছে'
    };

    const updatedRecord: CertificateRecord = {
      ...cert,
      auditTrail: [printAudit, ...(cert.auditTrail || [])]
    };

    const updatedList = list.map((c) => (c.id === id ? updatedRecord : c));
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    }
  }

  deleteCertificate(id: string): void {
    const list = this.getCertificates().filter((c) => c.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
  }

  // ─── TEMPLATES CRUD & VARIABLE INTERPOLATION ───────────────────────────────

  getTemplates(): CertificateTemplate[] {
    if (typeof window === 'undefined') return DEFAULT_CERTIFICATE_TEMPLATES;

    // Auto-migrate cached templates to modern Cholito Bangla standard
    const currentVersion = localStorage.getItem(TEMPLATES_VERSION_KEY);
    if (currentVersion !== CURRENT_TEMPLATES_VERSION) {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_CERTIFICATE_TEMPLATES));
      localStorage.setItem(TEMPLATES_VERSION_KEY, CURRENT_TEMPLATES_VERSION);
      return DEFAULT_CERTIFICATE_TEMPLATES;
    }

    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing certificate templates:', e);
      }
    }
    return DEFAULT_CERTIFICATE_TEMPLATES;
  }

  saveTemplate(template: CertificateTemplate): CertificateTemplate[] {
    const current = this.getTemplates();
    const index = current.findIndex((t) => t.id === template.id);

    let updated: CertificateTemplate[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = template;
    } else {
      updated = [template, ...current];
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  }

  resetTemplates(): CertificateTemplate[] {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(DEFAULT_CERTIFICATE_TEMPLATES));
    }
    return DEFAULT_CERTIFICATE_TEMPLATES;
  }

  getTemplateForType(type: CertificateType): CertificateTemplate {
    const templates = this.getTemplates();
    const found = templates.find((t) => t.type === type && t.isDefault) || templates.find((t) => t.type === type);
    if (found) return found;
    return (
      DEFAULT_CERTIFICATE_TEMPLATES.find((t) => t.type === type) ||
      DEFAULT_CERTIFICATE_TEMPLATES[0]
    );
  }

  /**
   * Interpolate dynamic variables inside templates
   * Replaces:
   * {{student_name}}, {{student_id}}, {{admission_no}}, {{roll_no}},
   * {{class}}, {{section}}, {{session}}, {{father_name}}, {{mother_name}},
   * {{date_of_birth}}, {{issue_date}}, {{certificate_no}}, {{school_name}},
   * {{address}}, {{village}}, {{post_office}}, {{upazila}}, {{district}},
   * {{group}}, {{board_roll}}, {{board_reg}}, {{gpa}}, {{passing_year}},
   * {{achievement}}, {{remarks}}, {{birth_reg_no}}
   */
  interpolateTemplate(
    templateStr: string,
    vars: {
      student_name?: string;
      student_id?: string;
      admission_no?: string;
      roll_no?: string;
      class?: string;
      section?: string;
      session?: string;
      father_name?: string;
      mother_name?: string;
      date_of_birth?: string;
      issue_date?: string;
      certificate_no?: string;
      school_name?: string;
      address?: string;
      village?: string;
      post_office?: string;
      upazila?: string;
      district?: string;
      group?: string;
      board_roll?: string;
      board_reg?: string;
      gpa?: string;
      passing_year?: string;
      achievement?: string;
      remarks?: string;
      birth_reg_no?: string;
    }
  ): string {
    if (!templateStr) return '';

    let res = templateStr;
    const mapping: Record<string, string> = {
      '{{student_name}}': vars.student_name || '—',
      '{{student_id}}': vars.student_id || '—',
      '{{admission_no}}': vars.admission_no || vars.student_id || '—',
      '{{roll_no}}': vars.roll_no || '—',
      '{{class}}': vars.class || '—',
      '{{section}}': vars.section || 'A',
      '{{session}}': vars.session || '২০২৬',
      '{{father_name}}': vars.father_name || '—',
      '{{mother_name}}': vars.mother_name || '—',
      '{{date_of_birth}}': vars.date_of_birth || '—',
      '{{issue_date}}': vars.issue_date || new Date().toLocaleDateString('bn-BD'),
      '{{certificate_no}}': vars.certificate_no || '—',
      '{{school_name}}': vars.school_name || 'বরইতলী উচ্চ বিদ্যালয়',
      '{{address}}': vars.address || [vars.village, vars.post_office, vars.upazila, vars.district].filter(Boolean).join(', ') || 'বরইতলী, চকরিয়া, কক্সবাজার',
      '{{student_address}}': [vars.village, vars.post_office, vars.upazila, vars.district].filter(Boolean).join(', ') || vars.address || 'বরইতলী, চকরিয়া, কক্সবাজার',
      '{{village}}': vars.village || 'বরইতলী',
      '{{post_office}}': vars.post_office || 'বরইতলী',
      '{{upazila}}': vars.upazila || 'চকরিয়া',
      '{{district}}': vars.district || 'কক্সবাজার',
      '{{group}}': vars.group || 'সাধারণ',
      '{{board_roll}}': vars.board_roll || '—',
      '{{board_reg}}': vars.board_reg || '—',
      '{{gpa}}': vars.gpa || '5.00',
      '{{passing_year}}': vars.passing_year || '২০২৬',
      '{{achievement}}': vars.achievement || 'বিশেষ কৃতিত্ব ও অবদানের জন্য',
      '{{remarks}}': vars.remarks || '',
      '{{birth_reg_no}}': vars.birth_reg_no || '—'
    };

    for (const [key, value] of Object.entries(mapping)) {
      res = res.split(key).join(value);
    }

    return res;
  }
}

export const certificateService = new CertificateService();
