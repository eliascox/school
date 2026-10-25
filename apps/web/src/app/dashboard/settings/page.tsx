'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  School,
  FileText,
  Sliders,
  Image as ImageIcon,
  UserCheck,
  Phone,
  Mail,
  Globe,
  Sparkles,
  Info,
  RefreshCw,
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  Trash2,
  Shield,
  Settings,
  Palette,
  BookOpen,
  Database,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  HardDrive,
  Cpu,
  Zap,
  LayoutGrid,
  Printer,
  GraduationCap,
  CalendarDays,
  AlertTriangle,
  Copy,
  Check,
  Award,
  UserPlus,
  X,
  Sun,
  Moon,
  Clock,
  MessageSquare,
  Send,
  ExternalLink,
  Smartphone,
  Radio,
  Key,
  Search,
  Pencil,
  Plus,
  ArrowUp,
  ArrowDown,
  Monitor,
  FlaskConical,
  Trophy,
  Compass,
  Droplet,
  Microscope,
  Laptop
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { teacherAuthService } from '@/services/teacherAuthService';
import { settingsService, SchoolSettings, DEFAULT_PAD_MARGINS, PadHeaderStyle, PadMargins, CommitteeMember, DEFAULT_COMMITTEE_MEMBERS } from '@/services/settingsService';
import { landingPageService, FacilitiesConfig, FacilityItem } from '@/services/landingPageService';
import SchoolPadWrapper from '@/components/SchoolPadWrapper';
import { studentService } from '@/services/studentService';
import { languageService, AppLanguage } from '@/services/languageService';
import { themeService, AppTheme } from '@/services/themeService';
import { backupService, BackupValidationResult } from '@/services/backupService';
import DisasterRecoveryPanel from '@/components/DisasterRecoveryPanel';
import { smsService, SMSGatewayConfig, SMSProviderType } from '@/services/smsService';
import { financeService } from '@/services/financeService';
import { ledgerService } from '@/services/ledgerService';
import { SecurityDeleteModal } from '@/components/SecurityDeleteModal';
import { SystemPurgeReport } from '@/services/systemResetService';
import { processPadUpload } from '@/lib/padPdfRenderer';

// ─── TAB CONFIG ───────────────────────────────────────────────
type SettingsTab = 'identity' | 'committee' | 'facilities' | 'pad' | 'security' | 'appearance' | 'academic' | 'sms' | 'data' | 'system';

interface TabConfig {
  id: SettingsTab;
  label: string;
  labelBn: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const TABS: TabConfig[] = [
  { id: 'identity', label: 'Identity', labelBn: 'প্রতিষ্ঠান', icon: <School className="w-4 h-4" />, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { id: 'committee', label: 'Managing Committee', labelBn: 'ম্যানেজিং কমিটি', icon: <Users className="w-4 h-4" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { id: 'facilities', label: 'Campus Facilities', labelBn: 'ক্যাম্পাস সুবিধাসমূহ', icon: <Building2 className="w-4 h-4" />, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  { id: 'pad', label: 'School Pad', labelBn: 'স্কুল প্যাড', icon: <Printer className="w-4 h-4" />, color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
  { id: 'security', label: 'Security', labelBn: 'নিরাপত্তা', icon: <Shield className="w-4 h-4" />, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  { id: 'appearance', label: 'Appearance', labelBn: 'ডিজাইন', icon: <Palette className="w-4 h-4" />, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'academic', label: 'Academic', labelBn: 'একাডেমিক', icon: <GraduationCap className="w-4 h-4" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { id: 'sms', label: 'SMS Gateway', labelBn: 'এসএমএস গেটওয়ে', icon: <MessageSquare className="w-4 h-4" />, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'data', label: 'Data & Backup', labelBn: 'ডাটা ও ব্যাকআপ', icon: <Database className="w-4 h-4" />, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { id: 'system', label: 'System', labelBn: 'সিস্টেম', icon: <Cpu className="w-4 h-4" />, color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
];

// ─── INPUT COMPONENT ──────────────────────────────────────────
function FormInput({ label, value, onChange, placeholder, required, type = 'text', hint, icon, mono }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  required?: boolean; type?: string; hint?: string; icon?: React.ReactNode; mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 
          focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all
          placeholder:text-slate-400 placeholder:font-normal ${mono ? 'font-mono tracking-wide' : ''}`}
      />
      {hint && <p className="text-[10.5px] text-slate-500 leading-snug">{hint}</p>}
    </div>
  );
}

// ─── SECTION CARD WRAPPER ─────────────────────────────────────
function SettingsCard({ title, subtitle, icon, iconBg, iconColor, children, borderColor, badge }: {
  title: string; subtitle: string; icon: React.ReactNode;
  iconBg: string; iconColor: string; children: React.ReactNode;
  borderColor?: string; badge?: React.ReactNode;
}) {
  return (
    <div className={`bg-white p-5 sm:p-6 rounded-2xl border ${borderColor || 'border-slate-200'} shadow-sm space-y-5 transition-all hover:shadow-md`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${iconBg} border border-opacity-20 ${iconColor} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">{title}</h2>
            <p className="text-[11px] text-slate-500 leading-snug">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ██ MAIN SETTINGS PAGE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');
  const [formData, setFormData] = useState<SchoolSettings>(settingsService.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [parsedStudentsList, setParsedStudentsList] = useState<any[]>([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [showPasswordAdmin, setShowPasswordAdmin] = useState(false);
  const [padPreviewMode, setPadPreviewMode] = useState<'full_pad' | 'preprinted' | 'blank_pad'>('full_pad');
  const [copied, setCopied] = useState(false);
  const [showSecurityDeleteModal, setShowSecurityDeleteModal] = useState(false);

  // Admin Credentials
  const [adminPhoneInput, setAdminPhoneInput] = useState('admin');
  const [adminPassInput, setAdminPassInput] = useState('admin123');

  // ─── TEACHER CREDENTIALS & PASSWORD MANAGEMENT (ADMIN ONLY) ────────
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [teacherPasswords, setTeacherPasswords] = useState<Record<string, string>>({});
  const [showTeacherPasswords, setShowTeacherPasswords] = useState<Record<string, boolean>>({});
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherSavedAlert, setTeacherSavedAlert] = useState<string | null>(null);

  const loadTeachers = useCallback(() => {
    if (typeof window !== 'undefined') {
      const all = teacherAuthService.getAllTeachers();
      setTeachersList(all);
      const passMap: Record<string, string> = {};
      all.forEach((t: any) => {
        passMap[t.id] = t.password || t.passwordHash || '123456';
      });
      setTeacherPasswords(passMap);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers, activeTab]);

  const handleSaveTeacherPassword = (tId: string, tName: string) => {
    const newPass = teacherPasswords[tId]?.trim();
    if (!newPass) return;
    teacherAuthService.setTeacherPassword(tId, newPass);
    setTeacherSavedAlert(`শিক্ষক "${tName}"-এর পাসওয়ার্ড সফলভাবে সংরক্ষণ করা হয়েছে!`);
    setTimeout(() => setTeacherSavedAlert(null), 3000);
  };

  // Academic Config
  const [currentSession, setCurrentSession] = useState('২০২৬');
  const [examNames, setExamNames] = useState(['অর্ধ-বার্ষিক পরীক্ষা', 'বার্ষিক পরীক্ষা']);
  const [currentLang, setCurrentLang] = useState<AppLanguage>('bn');

  // 📦 Database Backup & Restore State
  const [backupStats, setBackupStats] = useState<any>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupAlert, setBackupAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [restoreValidation, setRestoreValidation] = useState<BackupValidationResult | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  // 📱 SMS Gateway Config & Testing State
  const [smsConfig, setSmsConfig] = useState<SMSGatewayConfig>(smsService.getConfig());
  const [showSmsApiKey, setShowSmsApiKey] = useState(false);
  const [smsSaveAlert, setSmsSaveAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testSmsMobile, setTestSmsMobile] = useState('');
  const [testSmsMessage, setTestSmsMessage] = useState('বরইতলী উচ্চ বিদ্যালয়: এসএমএস গেটওয়ে সফলভাবে যুক্ত হয়েছে।');
  const [testSmsMode, setTestSmsMode] = useState<'text' | 'otp'>('text');
  const [isSendingSmsTest, setIsSendingSmsTest] = useState(false);
  const [smsTestResult, setSmsTestResult] = useState<{ success: boolean; message: string; response?: string } | null>(null);

  // ─── MANAGING COMMITTEE STATE & ACTIONS ───────────────────────
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [committeeAlert, setCommitteeAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [committeeSearchQuery, setCommitteeSearchQuery] = useState('');
  const [committeeForm, setCommitteeForm] = useState<Partial<CommitteeMember>>({
    name: '',
    role: 'সভাপতি',
    tenure: '২০২৪ – ২০২৬ খ্রিঃ (৩ বছর)',
    joiningDate: '০১ জানুয়ারি ২০২৪',
    phone: '',
    email: '',
    photo: '',
    badgeColor: 'bg-emerald-100 text-[#0B5D3B] border-emerald-300',
    bio: '',
    facebook: '',
    linkedin: ''
  });

  const getRoleBadgeColor = (role: string) => {
    if (role.includes('সভাপতি') && !role.includes('সহ')) return 'bg-emerald-100 text-[#0B5D3B] border-emerald-300';
    if (role.includes('সহ-সভাপতি')) return 'bg-sky-100 text-sky-800 border-sky-300';
    if (role.includes('ক্যাশিয়ার') || role.includes('অর্থ')) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (role.includes('সেক্রেটারী') || role.includes('সচিব') || role.includes('প্রধান শিক্ষক')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (role.includes('অভিভাবক')) return 'bg-teal-100 text-teal-800 border-teal-300';
    if (role.includes('শিক্ষক')) return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    if (role.includes('প্রতিষ্ঠাতা') || role.includes('দাতা')) return 'bg-rose-100 text-rose-800 border-rose-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  const currentCommitteeMembers: CommitteeMember[] = (formData.committeeMembers && formData.committeeMembers.length > 0)
    ? formData.committeeMembers
    : DEFAULT_COMMITTEE_MEMBERS;

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setCommitteeForm({
      name: '',
      role: 'সদস্য',
      tenure: '২০২৪ – ২০২৬ খ্রিঃ (৩ বছর)',
      joiningDate: '০১ জানুয়ারি ২০২৪',
      phone: '',
      email: '',
      photo: '',
      badgeColor: 'bg-emerald-100 text-[#0B5D3B] border-emerald-300',
      bio: '',
      facebook: '',
      linkedin: ''
    });
    setIsCommitteeModalOpen(true);
  };

  const handleOpenEditMember = (member: CommitteeMember) => {
    setEditingMember(member);
    setCommitteeForm({ ...member });
    setIsCommitteeModalOpen(true);
  };

  const handleMemberPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('ছবির আকার সর্বোচ্চ ২ মেগাবাইট (2MB) হতে পারবে।');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCommitteeForm((prev) => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCommitteeMember = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!committeeForm.name?.trim()) {
      alert('অনুগ্রহ করে সদস্যের নাম পূরণ করুন!');
      return;
    }
    if (!committeeForm.role?.trim()) {
      alert('অনুগ্রহ করে সদস্যের পদবি পূরণ করুন!');
      return;
    }

    const members = [...currentCommitteeMembers];
    const role = committeeForm.role.trim();
    const badgeColor = committeeForm.badgeColor || getRoleBadgeColor(role);

    if (editingMember) {
      const idx = members.findIndex(m => m.id === editingMember.id);
      if (idx !== -1) {
        members[idx] = {
          ...editingMember,
          ...committeeForm,
          name: committeeForm.name.trim(),
          role,
          badgeColor
        } as CommitteeMember;
      }
    } else {
      const newMember: CommitteeMember = {
        id: `CM-${Date.now()}`,
        name: committeeForm.name.trim(),
        role,
        tenure: committeeForm.tenure?.trim() || '২০২৪ – ২০২৬ খ্রিঃ (৩ বছর)',
        joiningDate: committeeForm.joiningDate?.trim() || '০১ জানুয়ারি ২০২৪',
        phone: committeeForm.phone?.trim() || '',
        email: committeeForm.email?.trim() || '',
        photo: committeeForm.photo || '',
        badgeColor,
        bio: committeeForm.bio?.trim() || '',
        facebook: committeeForm.facebook?.trim() || '',
        linkedin: committeeForm.linkedin?.trim() || '',
        order: members.length + 1
      };
      members.push(newMember);
    }

    settingsService.updateSettings({ committeeMembers: members });
    setFormData(prev => ({ ...prev, committeeMembers: members }));
    setIsCommitteeModalOpen(false);
    setCommitteeAlert({
      type: 'success',
      message: editingMember ? 'কমিটি সদস্যের তথ্য সফলভাবে হালনাগাদ ও ওয়েবসাইটে সিঙ্ক হয়েছে!' : 'নতুন সদস্য সফলভাবে যুক্ত ও ওয়েবসাইটে সিঙ্ক হয়েছে!'
    });
    setTimeout(() => setCommitteeAlert(null), 4000);
  };

  const handleDeleteMember = (memberId: string) => {
    const member = currentCommitteeMembers.find(m => m.id === memberId);
    if (!member) return;
    if (window.confirm(`আপনি কি নিশ্চিত যে "${member.name}" (${member.role})-কে কমিটি তালিকা থেকে মুছে ফেলতে চান?`)) {
      const updated = currentCommitteeMembers.filter(m => m.id !== memberId);
      settingsService.updateSettings({ committeeMembers: updated });
      setFormData(prev => ({ ...prev, committeeMembers: updated }));
      setCommitteeAlert({
        type: 'success',
        message: 'সদস্যকে সফলভাবে কমিটি তালিকা থেকে মুছে ফেলা হয়েছে।'
      });
      setTimeout(() => setCommitteeAlert(null), 3000);
    }
  };

  const handleMoveMember = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentCommitteeMembers.length) return;
    const members = [...currentCommitteeMembers];
    const temp = members[index];
    members[index] = members[targetIndex];
    members[targetIndex] = temp;
    settingsService.updateSettings({ committeeMembers: members });
    setFormData(prev => ({ ...prev, committeeMembers: members }));
  };

  const handleResetCommittee = () => {
    if (window.confirm('আপনি কি ডিফল্ট ৪ সদস্যের ম্যানেজিং কমিটি তথ্য পুনরুদ্ধার করতে চান? এতে বর্তমান কাস্টম কমিটির তথ্য মুছে যাবে।')) {
      settingsService.updateSettings({ committeeMembers: DEFAULT_COMMITTEE_MEMBERS });
      setFormData(prev => ({ ...prev, committeeMembers: DEFAULT_COMMITTEE_MEMBERS }));
      setCommitteeAlert({
        type: 'success',
        message: 'ম্যানেজিং কমিটির তথ্য সফলভাবে ডিফল্ট মানে রিসেট করা হয়েছে।'
      });
      setTimeout(() => setCommitteeAlert(null), 4000);
    }
  };

  // ─── CAMPUS FACILITIES (সুবিধাসমূহ) STATE & ACTIONS ─────────────
  const [facilitiesConfig, setFacilitiesConfig] = useState<FacilitiesConfig>(() => {
    return landingPageService.getFacilitiesConfig();
  });
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityItem | null>(null);
  const [facilityAlert, setFacilityAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('');
  const [facilityForm, setFacilityForm] = useState<Partial<FacilityItem>>({
    title: '',
    titleEn: '',
    description: '',
    icon: 'Monitor',
    badge: '',
    color: 'indigo',
    visible: true,
  });

  // Re-sync facilities when landing page updates
  useEffect(() => {
    const unsub = landingPageService.subscribePublished((cfg) => {
      if (cfg.facilities) {
        setFacilitiesConfig(cfg.facilities);
      }
    });
    return () => unsub();
  }, []);

  const handleOpenAddFacility = () => {
    setEditingFacility(null);
    setFacilityForm({
      title: '',
      titleEn: '',
      description: '',
      icon: 'Monitor',
      badge: '',
      color: 'indigo',
      visible: true,
    });
    setIsFacilityModalOpen(true);
  };

  const handleOpenEditFacility = (item: FacilityItem) => {
    setEditingFacility(item);
    setFacilityForm({ ...item });
    setIsFacilityModalOpen(true);
  };

  const handleSaveFacilityItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!facilityForm.title?.trim()) {
      alert('অনুগ্রহ করে সুবিধার বাংলা শিরোনাম লিখুন!');
      return;
    }
    if (!facilityForm.description?.trim()) {
      alert('অনুগ্রহ করে সুবিধার সংক্ষিপ্ত বিবরণী লিখুন!');
      return;
    }

    const currentItems = facilitiesConfig.items || [];
    let updatedItems: FacilityItem[];

    if (editingFacility) {
      updatedItems = currentItems.map((item) =>
        item.id === editingFacility.id
          ? {
              ...item,
              title: facilityForm.title!.trim(),
              titleEn: facilityForm.titleEn?.trim() || '',
              description: facilityForm.description!.trim(),
              icon: facilityForm.icon || 'Building2',
              badge: facilityForm.badge?.trim() || '',
              color: facilityForm.color || 'indigo',
              visible: facilityForm.visible !== false,
            }
          : item
      );
    } else {
      const newFacility: FacilityItem = {
        id: `fac-${Date.now()}`,
        title: facilityForm.title!.trim(),
        titleEn: facilityForm.titleEn?.trim() || '',
        description: facilityForm.description!.trim(),
        icon: facilityForm.icon || 'Building2',
        badge: facilityForm.badge?.trim() || '',
        color: facilityForm.color || 'indigo',
        visible: facilityForm.visible !== false,
      };
      updatedItems = [...currentItems, newFacility];
    }

    const newConfig: FacilitiesConfig = {
      ...facilitiesConfig,
      items: updatedItems,
    };

    setFacilitiesConfig(newConfig);
    landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
    setIsFacilityModalOpen(false);
    setFacilityAlert({
      type: 'success',
      message: editingFacility
        ? 'সুবিধার তথ্য সফলভাবে হালনাগাদ ও ওয়েবসাইটে লাইভ করা হয়েছে!'
        : 'নতুন সুবিধা সফলভাবে যুক্ত ও ওয়েবসাইটে লাইভ করা হয়েছে!',
    });
    setTimeout(() => setFacilityAlert(null), 4000);
  };

  const handleDeleteFacility = (facilityId: string) => {
    const facility = facilitiesConfig.items.find((f) => f.id === facilityId);
    if (!facility) return;
    if (window.confirm(`আপনি কি নিশ্চিত যে "${facility.title}" সুবিধাটি মুছে ফেলতে চান?`)) {
      const updatedItems = facilitiesConfig.items.filter((f) => f.id !== facilityId);
      const newConfig: FacilitiesConfig = {
        ...facilitiesConfig,
        items: updatedItems,
      };
      setFacilitiesConfig(newConfig);
      landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
      setFacilityAlert({
        type: 'success',
        message: 'সুবিধাটি সফলভাবে মুছে ফেলা হয়েছে এবং ওয়েবসাইটে আপডেট হয়েছে।',
      });
      setTimeout(() => setFacilityAlert(null), 3000);
    }
  };

  const handleToggleFacilityVisibility = (facilityId: string) => {
    const updatedItems = facilitiesConfig.items.map((f) =>
      f.id === facilityId ? { ...f, visible: !f.visible } : f
    );
    const newConfig: FacilitiesConfig = {
      ...facilitiesConfig,
      items: updatedItems,
    };
    setFacilitiesConfig(newConfig);
    landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
  };

  const handleMoveFacility = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= facilitiesConfig.items.length) return;
    const items = [...facilitiesConfig.items];
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    const newConfig: FacilitiesConfig = {
      ...facilitiesConfig,
      items,
    };
    setFacilitiesConfig(newConfig);
    landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
  };

  const handleToggleFacilitySection = () => {
    const newConfig: FacilitiesConfig = {
      ...facilitiesConfig,
      enabled: !facilitiesConfig.enabled,
    };
    setFacilitiesConfig(newConfig);
    landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
    setFacilityAlert({
      type: 'success',
      message: newConfig.enabled
        ? 'ক্যাম্পাস সুবিধাসমূহ সেকশন মূল ওয়েবসাইটে সক্রিয় করা হয়েছে।'
        : 'ক্যাম্পাস সুবিধাসমূহ সেকশন মূল ওয়েবসাইটে নিষ্ক্রিয় (লুকায়িত) করা হয়েছে।',
    });
    setTimeout(() => setFacilityAlert(null), 3500);
  };

  const handleSaveFacilityHeader = (eyebrow: string, title: string, subtitle: string) => {
    const newConfig: FacilitiesConfig = {
      ...facilitiesConfig,
      eyebrow,
      title,
      subtitle,
    };
    setFacilitiesConfig(newConfig);
    landingPageService.updateFacilities(newConfig, 'প্রধান শিক্ষক / অ্যাডমিন', true);
    setFacilityAlert({
      type: 'success',
      message: 'সেকশনের শিরোনাম ও বিবরণী সফলভাবে সংরক্ষিত ও লাইভ হয়েছে!',
    });
    setTimeout(() => setFacilityAlert(null), 3500);
  };

  const handleResetFacilities = () => {
    if (window.confirm('আপনি কি ক্যাম্পাস সুবিধাসমূহ ডিফল্ট ৬টি সুবিধার তালিকায় পুনরুদ্ধার করতে চান? এতে বর্তমান কাস্টমাইজেশন মুছে যাবে।')) {
      const defaultCfg = landingPageService.getFacilitiesConfig();
      setFacilitiesConfig(defaultCfg);
      landingPageService.updateFacilities(defaultCfg, 'প্রধান শিক্ষক / অ্যাডমিন', true);
      setFacilityAlert({
        type: 'success',
        message: 'ক্যাম্পাস সুবিধাসমূহ সফলভাবে ডিফল্ট মানে রিসেট করা হয়েছে।',
      });
      setTimeout(() => setFacilityAlert(null), 4000);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as SettingsTab;
      if (tab && TABS.some(t => t.id === tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  useEffect(() => {
    const currSession = teacherAuthService.getSession();
    setSession(currSession);
    if (currSession && currSession.role !== 'admin') {
      router.replace('/dashboard/teacher-portal');
    }
  }, [router]);

  useEffect(() => {
    setCurrentLang(languageService.getLanguage());
    const unsubLang = languageService.subscribe((l) => setCurrentLang(l));
    return () => unsubLang();
  }, []);

  const handleGlobalLanguageChange = (l: AppLanguage) => {
    setCurrentLang(l);
    languageService.setLanguage(l);
    settingsService.updateSettings({ language: l });
  };

  // ─── DATABASE BACKUP & RESTORE HOOKS (Top-Level to satisfy React Rules of Hooks) ───
  const refreshBackupStats = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        setBackupStats(backupService.getDatabaseStats());
      } catch (e) {
        console.error('Failed to get database stats:', e);
      }
    }
  }, []);

  useEffect(() => {
    refreshBackupStats();
  }, [refreshBackupStats, activeTab]);

  useEffect(() => {
    setMounted(true);
    const unsub = settingsService.subscribe((s) => setFormData(s));

    if (typeof window !== 'undefined') {
      const storedPhone = localStorage.getItem('sms_admin_phone');
      if (storedPhone) setAdminPhoneInput(storedPhone);

      const storedPass = localStorage.getItem('sms_admin_password');
      if (storedPass) {
        if (storedPass.startsWith('pbkdf2:')) {
          setAdminPassInput('');
        } else {
          setAdminPassInput(storedPass);
        }
      }

      const stored = localStorage.getItem('sms_uploaded_students');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setParsedStudentsList(parsed);
        } catch (e) {
          console.error(e);
        }
      }

      // 🛡️ Dedicated academic session key to avoid overwriting auth login session
      const storedAcademic = localStorage.getItem('sms_academic_session');
      if (storedAcademic) {
        setCurrentSession(storedAcademic);
      } else {
        const legacy = localStorage.getItem('sms_current_session');
        if (legacy && !legacy.startsWith('{')) {
          setCurrentSession(legacy);
        }
      }

      const storedExams = localStorage.getItem('sms_exam_names');
      if (storedExams) {
        try {
          const parsed = JSON.parse(storedExams);
          if (Array.isArray(parsed)) setExamNames(parsed);
        } catch (e) {}
      }

      const currentSmsConfig = smsService.getConfig();
      setSmsConfig(currentSmsConfig);
    }

    return () => unsub();
  }, []);

  // ─── LOADING STATE ─────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Settings className="w-7 h-7 text-white animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <p className="text-sm font-bold text-slate-500 animate-pulse">সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  // 🛑 RBAC Access Guard
  if (session && session.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">অনুমতি নেই</h2>
        <p className="text-sm text-slate-500">শুধুমাত্র প্রধান প্রশাসক এই পাতায় প্রবেশ করতে পারবেন।</p>
        <Link href="/dashboard/teacher-portal" className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs">
          শিক্ষক ড্যাশবোর্ডে ফিরুন
        </Link>
      </div>
    );
  }

  // ─── HANDLERS ──────────────────────────────────────────────
  const handleChange = (field: keyof SchoolSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ─── SMS GATEWAY HANDLERS ───
  const handleSaveSmsConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      smsService.saveConfig(smsConfig);
      setSmsSaveAlert({
        type: 'success',
        message: 'এসএমএস গেটওয়ে কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!'
      });
      setTimeout(() => setSmsSaveAlert(null), 5000);
    } catch (err: any) {
      setSmsSaveAlert({
        type: 'error',
        message: `সংরক্ষণে ত্রুটি: ${err?.message || 'অজানা ত্রুটি'}`
      });
    }
  };

  const handleSendTestSms = async () => {
    const cleanDigits = testSmsMobile.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 11) {
      setSmsTestResult({
        success: false,
        message: 'অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 018XXXXXXXX)।'
      });
      return;
    }

    setIsSendingSmsTest(true);
    setSmsTestResult(null);

    try {
      if (testSmsMode === 'otp') {
        const res = await smsService.sendTestOTP(cleanDigits, smsConfig);
        setSmsTestResult({
          success: res.success,
          message: res.message,
          response: res.gatewayResponse
        });
      } else {
        const res = await smsService.sendTestSMS(cleanDigits, testSmsMessage, smsConfig);
        setSmsTestResult({
          success: res.success,
          message: res.message,
          response: res.gatewayResponse
        });
      }
    } catch (err: any) {
      setSmsTestResult({
        success: false,
        message: `ব্যর্থতা: ${err?.message || 'গেটওয়ে সংযোগ ত্রুটি'}`
      });
    } finally {
      setIsSendingSmsTest(false);
    }
  };

  const handlePadFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await processPadUpload(file);
        if (result.dataUrl) {
          handleChange('uploadedPadTemplateUrl', result.dataUrl);
          handleChange('uploadedPadType', result.padType);
          handleChange('uploadedPadFileName', result.fileName);
          handleChange('uploadedPadFileSize', result.fileSize);
          handleChange('activePadMode', 'uploaded');
        } else if (result.error) {
          alert(result.error);
        }
      } catch (err: any) {
        console.error('Failed to process pad file', err);
        alert('প্যাড ফাইল প্রসেস করতে ব্যর্থ হয়েছে: ' + err.message);
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleChange('schoolLogo', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    settingsService.updateSettings(formData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_admin_phone', adminPhoneInput.trim());
      if (adminPassInput.trim() && !adminPassInput.trim().startsWith('pbkdf2:')) {
        await teacherAuthService.setAdminPassword(adminPassInput.trim(), adminPhoneInput.trim());
      }
      localStorage.setItem('sms_academic_session', currentSession);
      localStorage.setItem('sms_exam_names', JSON.stringify(examNames));
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleResetDefaults = () => {
    if (confirm('আপনি কি নিশ্চিত যে সকল সেটিংস ডিফল্ট মানে রিসেট করতে চান?')) {
      const defaults: SchoolSettings = {
        schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
        schoolLogo: '',
        address: 'পেকুয়া, কক্সবাজার।',
        eiin: '104231',
        estdYear: '1968',
        principalName: 'মোহাম্মদ রফিকুল ইসলাম',
        principalTitle: 'প্রধান শিক্ষক',
        classTeacherTitle: 'শ্রেণি শিক্ষকের স্বাক্ষর',
        guardianTitle: 'অভিভাবকের স্বাক্ষর',
        showWatermark: true,
        watermarkText: 'বরইতলী উচ্চ বিদ্যালয়',
        watermarkOpacity: 0.03,
        phone: '01819-000000',
        email: 'boroitoli.high.school@gmail.com',
        website: 'www.boroitolihs.edu.bd',
        showClassSelection: true,
        showSectionSelection: true,
        showRollInput: true,
      };
      settingsService.updateSettings(defaults);
      setFormData(defaults);
      setAdminPhoneInput('admin');
      setAdminPassInput('admin123');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  // CSV DOWNLOAD
  const downloadSampleCSV = () => {
    const sampleCsvContent = `Roll,Name,Class,Section,Group,FatherName,MotherName,Session,OptionalSubject,Religion
01,তাহমিদ চৌধুরী,8th,A,সাধারণ,নুরুল ইসলাম চৌধুরী,আমেনা বেগম,২০২৬,কৃষি শিক্ষা,ইসলাম
02,আফরিন জাহান,8th,A,সাধারণ,আনোয়ার হোসেন,জাহানারা পারভীন,২০২৬,গার্হস্থ্য বিজ্ঞান,ইসলাম
03,অনিন্দ্য পাল,9th,A,বিজ্ঞান,সুনীল কুমার পাল,সুচিত্রা সেন,২০২৬,উচ্চতর গণিত,হিন্দু
04,শ্রাবন্তী দাস,9th,A,বিজ্ঞান,সুধীর চন্দ্র দাস,রেহানা বেগম,২০২৬,কৃষি শিক্ষা,হিন্দু
05,তানভীর হাসান,9th,A,ব্যবসায় শিক্ষা,কামরুল আহসান,শাহিনুর বেগম,২০২৬,কম্পিউটার শিক্ষা,ইসলাম`;

    const blob = new Blob(["\uFEFF" + sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_upload_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV UPLOAD & PARSE
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        alert('সিএসভি ফাইলে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি!');
        return;
      }

      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));

      const relColIdx = headers.findIndex(h => h.includes('religion') || h.includes('ধর্ম'));
      const rollColIdx = headers.findIndex(h => h.includes('roll') || h.includes('রোল'));
      const nameColIdx = headers.findIndex(h => h.includes('name') || h.includes('নাম'));
      const classColIdx = headers.findIndex(h => h.includes('class') || h.includes('grade') || h.includes('শ্রেণি'));
      const secColIdx = headers.findIndex(h => h.includes('section') || h.includes('branch') || h.includes('শাখা'));
      const groupColIdx = headers.findIndex(h => h.includes('group') || h.includes('বিভাগ') || h.includes('গ্রুপ'));

      const parsedStudents: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 2) {
          const rollVal = (rollColIdx !== -1 ? cols[rollColIdx] : cols[0]) || String(i).padStart(2, '0');
          const nameVal = (nameColIdx !== -1 ? cols[nameColIdx] : cols[1]) || `শিক্ষার্থী ${i}`;
          const gradeVal = (classColIdx !== -1 ? cols[classColIdx] : cols[2]) || '8th';
          const gradeBn = gradeVal === '6th' ? '৬ষ্ঠ শ্রেণি' : gradeVal === '7th' ? '৭ম শ্রেণি' : gradeVal === '8th' ? '৮ম শ্রেণি' : gradeVal === '9th' ? '৯ম শ্রেণি' : '১০ম শ্রেণি';

          // Religion extraction & normalization
          let religionRaw = relColIdx !== -1 ? cols[relColIdx] : (cols[9] || 'ইসলাম');
          let religionVal = 'ইসলাম';
          const relLower = (religionRaw || '').toLowerCase();
          if (relLower.includes('hindu') || relLower.includes('হিন্দু') || relLower.includes('sanatan') || relLower.includes('সনাতন')) {
            religionVal = 'হিন্দু';
          } else if (relLower.includes('christian') || relLower.includes('খ্রিস্টান')) {
            religionVal = 'খ্রিস্টান';
          } else if (relLower.includes('buddhist') || relLower.includes('বৌদ্ধ')) {
            religionVal = 'বৌদ্ধ';
          } else if (relLower.includes('islam') || relLower.includes('ইসলাম') || relLower.includes('muslim') || relLower.includes('মুসলিম')) {
            religionVal = 'ইসলাম';
          } else {
            religionVal = religionRaw || 'ইসলাম';
          }

          parsedStudents.push({
            id: `STD-${gradeVal}-${cols[3] || 'A'}-${rollVal}`,
            roll: rollVal,
            name: nameVal,
            grade: gradeVal,
            gradeBn,
            section: (secColIdx !== -1 ? cols[secColIdx] : cols[3]) || 'A',
            group: (groupColIdx !== -1 ? cols[groupColIdx] : cols[4]) || 'সাধারণ',
            fatherName: cols[5] || 'পিতার নাম',
            motherName: cols[6] || 'মাতার নাম',
            session: cols[7] || '২০২৬',
            optionalSubject: cols[8] || 'কৃষি শিক্ষা',
            religion: religionVal
          });
        }
      }

      setParsedStudentsList(parsedStudents);
      setImportSuccessMsg(`সিএসভি ফাইল পার্স সম্পন্ন! মোট ${parsedStudents.length} জন শিক্ষার্থী পাওয়া গেছে (ধর্ম কলাম সহ)। নিচে সংরক্ষণ বাটনে ক্লিক করুন।`);
    };
    reader.readAsText(file);
  };

  const handleSaveUploadedStudents = () => {
    if (parsedStudentsList.length === 0) return;
    studentService.saveBulkStudents(parsedStudentsList);
    setImportSuccessMsg(`সফলভাবে ${parsedStudentsList.length} জন শিক্ষার্থী ডাইনামিক ডেটাবেজে সংরক্ষিত হয়েছে!`);
    setTimeout(() => setImportSuccessMsg(''), 5000);
  };

  const handleClearDemoData = () => {
    setShowSecurityDeleteModal(true);
  };

  const handleSecurityPurgeSuccess = (report: SystemPurgeReport) => {
    setParsedStudentsList([]);
    setImportSuccessMsg(`সকল স্তরের ডেমো ডাটা সফলভাবে মুছে সম্পূর্ণ ফ্রেশ ডেটাবেস প্রস্তুত করা হয়েছে! (কমেন্ট: "${report.comment}")`);
    setTimeout(() => setImportSuccessMsg(''), 7000);
  };

  const handleCopyEIIN = () => {
    navigator.clipboard.writeText(formData.eiin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const handleDownloadFullBackup = () => {
    setIsBackingUp(true);
    try {
      const userName = session?.teacherName || (session?.role === 'admin' ? 'প্রধান শিক্ষক' : 'অ্যাডমিন');
      const res = backupService.downloadBackupFile(userName);
      if (res.success) {
        setBackupAlert({
          type: 'success',
          message: `সম্পূর্ণ ডেটাবেস JSON ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে! ফাইল: ${res.filename} (${res.sizeKb} KB)`
        });
        refreshBackupStats();
      } else {
        setBackupAlert({
          type: 'error',
          message: 'ব্যাকআপ তৈরিতে সমস্যা হয়েছে। ব্রাউজারের অনুমতি পরীক্ষা করুন।'
        });
      }
    } catch (e: any) {
      setBackupAlert({
        type: 'error',
        message: `ব্যাকআপ ত্রুটি: ${e?.message || 'অজানা সমস্যা'}`
      });
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setBackupAlert(null), 8000);
    }
  };

  const handleJSONFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = backupService.validateBackupFile(content);
      setRestoreValidation(validation);
      if (validation.valid) {
        setRestoreConfirmOpen(true);
      } else {
        setBackupAlert({
          type: 'error',
          message: validation.message
        });
      }
    };
    reader.onerror = () => {
      setBackupAlert({
        type: 'error',
        message: 'ফাইলটি পড়তে সমস্যা হয়েছে।'
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteRestore = () => {
    if (!restoreValidation || !restoreValidation.data) return;

    setIsRestoring(true);
    try {
      const userName = session?.teacherName || (session?.role === 'admin' ? 'প্রধান শিক্ষক' : 'অ্যাডমিন');
      const result = backupService.restoreDatabase(restoreValidation.data, userName);
      if (result.success) {
        setBackupAlert({
          type: 'success',
          message: result.message
        });
        setRestoreConfirmOpen(false);
        setRestoreValidation(null);
        setSelectedFileName('');
        refreshBackupStats();
        setFormData(settingsService.getSettings());
        setTimeout(() => {
          window.location.reload();
        }, 1800);
      } else {
        setBackupAlert({
          type: 'error',
          message: result.message
        });
      }
    } catch (e: any) {
      setBackupAlert({
        type: 'error',
        message: `রিস্টোর ত্রুটি: ${e?.message || 'অজানা ত্রুটি'}`
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // ─── DATA EXPORT ───────────────────────────────────────────
  const handleExportAllData = () => {
    if (typeof window === 'undefined') return;
    const exportData = {
      settings: formData,
      students: studentService.getAllStudents(),
      adminPhone: adminPhoneInput,
      exportDate: new Date().toISOString(),
      version: '2.0.0'
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `school_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── STUDENT COUNT ─────────────────────────────────────────
  const totalStudents = typeof window !== 'undefined' ? studentService.getAllStudents().length : 0;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ██ RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="w-full space-y-6 font-sans">

      {/* ═══════ HEADER BANNER ═══════ */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden print:hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-4 right-4 opacity-[0.04]">
            <Settings className="w-48 h-48" />
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold border border-indigo-500/30 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> সিস্টেম সেটিংস ও কনফিগারেশন
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              প্রতিষ্ঠানের পরিচিতি ও সেটিংস
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
              এখান থেকে প্রতিষ্ঠানের সকল তথ্য, নিরাপত্তা, ডিজাইন, একাডেমিক কনফিগারেশন ও ডাটা ম্যানেজমেন্ট নিয়ন্ত্রণ করুন।
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-bold rounded-xl border border-white/10 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> রিসেট
            </button>
            <button
              onClick={() => handleSubmit()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-500/40"
            >
              <Save className="w-3.5 h-3.5" /> পরিবর্তন সংরক্ষণ
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ SUCCESS NOTIFICATION ═══════ */}
      {savedSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl shadow-sm text-xs font-bold animate-fade-in print:hidden">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <span className="font-black">সফলভাবে সংরক্ষিত!</span>
            <span className="font-medium text-emerald-700 ml-1">মার্কশিট ও প্রিন্ট পেজে নতুন তথ্যসমূহ হালনাগাদ করা হয়েছে।</span>
          </div>
          <button onClick={() => setSavedSuccess(false)} className="ml-auto p-1 hover:bg-emerald-100 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5 text-emerald-500" />
          </button>
        </div>
      )}

      {/* ═══════ TAB NAVIGATION ═══════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 overflow-x-auto print:hidden">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? `${tab.bgColor} ${tab.color} ${tab.borderColor} border shadow-sm`
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              <span>{tab.labelBn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ MAIN CONTENT SECTION ═══════ */}
      {activeTab === 'pad' ? (
        <div className="space-y-6 w-full print:space-y-0 print:m-0 print:p-0">
            {/* Top Information Banner */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl shadow-sm border border-indigo-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
              <div className="space-y-1">
                <h3 className="text-base font-black flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-400" />
                  অফিশিয়াল স্কুল প্যাড ম্যানেজমেন্ট
                </h3>
                <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                  আপনার প্রতিষ্ঠানের প্রেস-প্রিন্টেড বা ডিজিটাল প্যাড (PDF / ইমেজ) এখানে আপলোড করুন। নোটিশ, ছাড়পত্র, প্রশংসাপত্র, প্রত্যয়ন ও ফলাফল বিবরণী স্বয়ংক্রিয়ভাবে এই প্যাডের ভেতর নির্ধারিত মার্জিনে প্রিন্ট হবে।
                </p>
              </div>
              <div className="shrink-0">
                {formData.uploadedPadTemplateUrl ? (
                  <span className="px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    কাস্টম প্যাড সক্রিয়
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    ছাপা প্যাড মোড
                  </span>
                )}
              </div>
            </div>

            {/* Main Full-Width Grid: Upload & Margins on Left (5 Cols), Live A4 Letterhead on Right (7 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full print:block print:p-0 print:m-0">
              
              {/* ─── LEFT COLUMN: PAD UPLOAD & MARGINS (5 Cols) ─── */}
              <div className="lg:col-span-5 space-y-5 print:hidden">
                
                {/* 1. PDF / IMAGE PAD UPLOAD CARD */}
                <SettingsCard
                  title="১. অফিশিয়াল প্যাড আপলোড (PDF বা ছবি)"
                  subtitle="আপনার প্রতিষ্ঠানের তৈরি করা A4 সাইজের PDF, PNG বা JPG লেটারহেড আপলোড করুন"
                  icon={<Upload className="w-5 h-5" />}
                  iconBg="bg-indigo-50" iconColor="text-indigo-600"
                >
                  <div className="space-y-4">
                    
                    {formData.uploadedPadTemplateUrl ? (
                      /* If Pad is already Uploaded: Active Pad Card with Actions */
                      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-black text-emerald-950">কাস্টম প্যাড লোড হয়েছে</span>
                          </div>
                          <span className="px-2 py-0.5 bg-white text-emerald-800 text-[10px] font-black rounded-md border border-emerald-300 uppercase">
                            {formData.uploadedPadType === 'pdf' ? 'PDF ফাইল' : 'ইমেজ ফাইল'}
                          </span>
                        </div>

                        {/* Thumbnail / Status View */}
                        <div className="h-28 bg-white rounded-xl border border-emerald-200 overflow-hidden flex items-center justify-center p-2 shadow-inner relative group">
                          {formData.uploadedPadTemplateUrl ? (
                            <img src={formData.uploadedPadTemplateUrl} alt="Pad Thumbnail" className="h-full object-contain" />
                          ) : (
                            <div className="flex flex-col items-center text-slate-600 space-y-1">
                              <FileText className="w-8 h-8 text-indigo-600" />
                              <span className="text-[11px] font-bold text-slate-800">কোন প্যাড সংযুক্ত নেই</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <label className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95">
                            <Upload size={14} />
                            নতুন প্যাড রিপ্লেস করুন
                            <input
                              type="file"
                              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                              onChange={handlePadFileUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleChange('uploadedPadTemplateUrl', '')}
                            className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            title="প্যাড মুছে ডিফল্ট করুন"
                          >
                            <Trash2 size={14} />
                            মুছুন
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* If No Pad is Uploaded: Clean Dropzone */
                      <div className="space-y-3">
                        <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/70 p-6 rounded-2xl text-center transition-all cursor-pointer block relative group">
                          <input
                            type="file"
                            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                            onChange={handlePadFileUpload}
                            className="hidden"
                          />
                          <div className="space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                              <Upload size={22} />
                            </div>
                            <h4 className="text-sm font-black text-slate-900">
                              প্যাড ফাইল নির্বাচন করুন
                            </h4>
                            <p className="text-xs text-slate-500">
                              PDF, PNG, JPG বা WebP ফরম্যাট সমর্থিত
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                  </div>
                </SettingsCard>

                {/* 2. MARGINS CONTROL CARD */}
                <SettingsCard
                  title="২. মার্জিন ও লেখার অবস্থান নিয়ন্ত্রণ (ইঞ্চি)"
                  subtitle="প্যাডের হেডারের নিচে যেখানে নোটিশ বা প্রত্যয়নের লেখা শুরু হবে তা নির্ধারণ করুন"
                  icon={<Sliders className="w-5 h-5" />}
                  iconBg="bg-sky-50" iconColor="text-sky-600"
                >
                  <div className="space-y-4">
                    
                    {/* Top Margin */}
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                        <span>উপরে মার্জিন</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.2"
                            max="4.0"
                            step="0.1"
                            value={formData.padMargins?.top ?? 0.5}
                            onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), top: parseFloat(e.target.value) || 0.5 })}
                            className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-black text-indigo-700 text-right text-xs"
                          />
                          <span className="text-slate-600 font-mono text-xs">&quot;</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="4.0"
                        step="0.1"
                        value={formData.padMargins?.top ?? 0.5}
                        onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), top: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-500">প্যাডের মনোগ্রাম বা হেডারের নিচে যেখানে লেখা শুরু হবে (ডিফল্ট ০.৫ ইঞ্চি)।</p>
                    </div>

                    {/* Left Margin */}
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                        <span>বামে মার্জিন</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.2"
                            max="2.5"
                            step="0.1"
                            value={formData.padMargins?.left ?? 0.5}
                            onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), left: parseFloat(e.target.value) || 0.5 })}
                            className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-black text-indigo-700 text-right text-xs"
                          />
                          <span className="text-slate-600 font-mono text-xs">&quot;</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="2.5"
                        step="0.1"
                        value={formData.padMargins?.left ?? 0.5}
                        onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), left: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <p className="text-[10px] text-slate-500">বামে মার্জিন (ডিফল্ট ০.৫ ইঞ্চি)।</p>
                    </div>

                    {/* Right Margin */}
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                        <span>ডানে মার্জিন</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.2"
                            max="2.0"
                            step="0.1"
                            value={formData.padMargins?.right ?? 0.5}
                            onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), right: parseFloat(e.target.value) || 0.5 })}
                            className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-black text-indigo-700 text-right text-xs"
                          />
                          <span className="text-slate-600 font-mono text-xs">&quot;</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="2.0"
                        step="0.1"
                        value={formData.padMargins?.right ?? 0.5}
                        onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), right: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Bottom Margin */}
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                        <span>নিচে মার্জিন</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.2"
                            max="2.0"
                            step="0.1"
                            value={formData.padMargins?.bottom ?? 0.5}
                            onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), bottom: parseFloat(e.target.value) || 0.5 })}
                            className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-black text-indigo-700 text-right text-xs"
                          />
                          <span className="text-slate-600 font-mono text-xs">&quot;</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="2.0"
                        step="0.1"
                        value={formData.padMargins?.bottom ?? 0.5}
                        onChange={(e) => handleChange('padMargins', { ...(formData.padMargins || DEFAULT_PAD_MARGINS), bottom: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Presets */}
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-extrabold text-slate-600 block">কুইক মার্জিন প্রিসেট:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleChange('padMargins', { top: 3.0, left: 0.8, right: 0.8, bottom: 1.0 })}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-[11px] font-bold transition text-left cursor-pointer"
                        >
                          ★ প্রাতিষ্ঠানিক প্যাড (Top: ৩.০&quot;, Left/Right: ০.৮&quot;)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange('padMargins', { top: 2.0, left: 0.8, right: 0.8, bottom: 1.0 })}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-[11px] font-bold transition text-left cursor-pointer"
                        >
                          ★ ছোট হেডার প্যাড (Top: ২.০&quot;)
                        </button>
                      </div>
                    </div>

                  </div>
                </SettingsCard>

                {/* 3. INTEGRATED MODULES LIST */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2.5">
                  <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    যেসব নথিতে এই প্যাড স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <Link href="/dashboard/notices" className="p-2 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl transition flex items-center gap-1.5">
                      📄 নোটিশ বোর্ড
                    </Link>
                    <Link href="/dashboard/certificates" className="p-2 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl transition flex items-center gap-1.5">
                      📜 ছাড়পত্র / টিসি
                    </Link>
                    <Link href="/dashboard/certificates" className="p-2 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl transition flex items-center gap-1.5">
                      🎓 প্রশংসাপত্র ও প্রত্যয়ন
                    </Link>
                    <Link href="/dashboard/certificates" className="p-2 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl transition flex items-center gap-1.5">
                      🛡️ চারিত্রিক সনদ
                    </Link>
                    <Link href="/dashboard/students?tab=summary" className="p-2 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl transition flex items-center gap-1.5">
                      📊 শিক্ষার্থী পরিসংখ্যান
                    </Link>
                    <Link href="/dashboard/exam/rank-result" className="p-2 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl transition flex items-center gap-1.5">
                      🏆 মেধা তালিকা ও র্যাঙ্ক
                    </Link>
                  </div>
                </div>

              </div>

              {/* ─── RIGHT COLUMN: LIVE REAL-TIME A4 PAD PREVIEW (7 Cols) ─── */}
              <div className="lg:col-span-7 space-y-3 print:space-y-0 print:p-0 print:m-0 print:w-full print:block">
                
                {/* Preview Toolbar */}
                <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-sky-400">লাইভ প্যাড প্রিভিউ</span>
                    
                    <div className="flex items-center bg-slate-800 p-0.5 rounded-xl text-xs font-bold border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPadPreviewMode('full_pad')}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          padPreviewMode === 'full_pad' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                        title="আপলোড করা প্যাড ব্যাকগ্রাউন্ড দৃশ্যমান থাকবে"
                      >
                        ডিজিটাল প্যাড
                      </button>
                      <button
                        type="button"
                        onClick={() => setPadPreviewMode('preprinted')}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                          padPreviewMode === 'preprinted' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                        title="প্রেসের ছাপানো কাগজের জন্য ব্যাকগ্রাউন্ড হাইড হবে"
                      >
                        প্রি-প্রিন্টেড প্যাড
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Printer size={15} /> টেস্ট প্রিন্ট করুন
                  </button>
                </div>

                {/* Live A4 Interactive Sheet */}
                <div className="bg-slate-200/80 p-4 sm:p-6 rounded-3xl border border-slate-300 overflow-x-auto flex justify-center shadow-inner print:bg-transparent print:p-0 print:m-0 print:border-none print:shadow-none print:w-full print:block">
                  <SchoolPadWrapper
                    settings={formData}
                    mode={padPreviewMode}
                    title="প্রাতিষ্ঠানিক নোটিশ / প্রত্যয়ন নমুনা"
                    refNo="স্মারক নং: ব.উ.বি/২০২৬/০০১"
                    hideHeaderActions={true}
                    signatures={[
                      {
                        title: formData.principalName || 'মোহাম্মদ রফিকুল ইসলাম',
                        designation: formData.principalTitle || 'প্রধান শিক্ষক',
                        institution: formData.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
                        address: formData.address || 'বরইতলী, চকরিয়া, কক্সবাজার।',
                        rightAligned: true
                      }
                    ]}
                  >
                    <div className="space-y-3 text-xs leading-relaxed text-slate-800 font-medium">
                      <p>
                        এতদ্বারা বরইতলী উচ্চ বিদ্যালয়ের সকল শিক্ষক-শিক্ষিকা, অভিভাবক ও সংশ্লিষ্ট সকলের অবগতির জন্য জানানো যাচ্ছে যে, অত্র বিদ্যালয়ের আপলোডকৃত অফিশিয়াল স্কুল প্যাড ম্যানেজমেন্ট সিস্টেমটি সক্রিয় রয়েছে।
                      </p>
                      <p>
                        বিদ্যালয়ের প্রাতিষ্ঠানিক সকল নোটিশ, শিক্ষার্থীদের চারিত্রিক সনদপত্র, ছাড়পত্র, প্রশংসাপত্র, অধ্যয়নরত প্রত্যয়ন পত্র, শ্রেণিভিত্তিক পরিসংখ্যান রিপোর্ট এবং পরীক্ষার ফলাফল বিবরণী অত্র নির্ধারিত মার্জিন ও প্যাডে মুদ্রিত হবে।
                      </p>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono">
                        ★ বর্তমান মার্জিন: উপরে <strong>{formData.padMargins?.top ?? 0.5}&quot;</strong> | বামে <strong>{formData.padMargins?.left ?? 0.5}&quot;</strong> | ডানে <strong>{formData.padMargins?.right ?? 0.5}&quot;</strong> | নিচে <strong>{formData.padMargins?.bottom ?? 0.5}&quot;</strong>
                      </div>
                    </div>
                  </SchoolPadWrapper>
                </div>

              </div>

            </div>

          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
            <div className="xl:col-span-8 2xl:col-span-9 space-y-6">

          {/* ━━━ TAB: IDENTITY ━━━ */}
          {activeTab === 'identity' && (
            <>
              {/* School Identity Card */}
              <SettingsCard
                title="প্রতিষ্ঠানের মূল তথ্য"
                subtitle="প্রতিষ্ঠানের নাম, ইআইআইএন, ঠিকানা ও স্থাপিত সাল"
                icon={<School className="w-5 h-5" />}
                iconBg="bg-indigo-50" iconColor="text-indigo-600"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FormInput label="প্রতিষ্ঠানের নাম" value={formData.schoolName} onChange={(v) => handleChange('schoolName', v)} placeholder="যেমন: বরইতলী উচ্চ বিদ্যালয়" required />
                  </div>
                  <FormInput label="ইআইআইএন" value={formData.eiin} onChange={(v) => handleChange('eiin', v)} placeholder="যেমন: 106184" required mono />
                  <FormInput label="স্থাপিত সাল" value={formData.estdYear} onChange={(v) => handleChange('estdYear', v)} placeholder="যেমন: 1969" required mono />
                  <div className="sm:col-span-2">
                    <FormInput label="প্রতিষ্ঠানের ঠিকানা" value={formData.address} onChange={(v) => handleChange('address', v)} placeholder="যেমন: চকরিয়া, কক্সবাজার" required />
                  </div>
                </div>
              </SettingsCard>

              {/* Authority & Signatures */}
              <SettingsCard
                title="কর্তৃপক্ষ ও ফুটার স্বাক্ষর"
                subtitle="প্রধান শিক্ষকের নাম ও নম্বরপত্রের ফুটার স্বাক্ষর সেট করুন"
                icon={<UserCheck className="w-5 h-5" />}
                iconBg="bg-purple-50" iconColor="text-purple-600"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="প্রধান শিক্ষকের নাম" value={formData.principalName} onChange={(v) => handleChange('principalName', v)} placeholder="যেমন: মোহাম্মদ রফিকুল ইসলাম" />
                  <FormInput label="প্রধান শিক্ষকের পদবী" value={formData.principalTitle} onChange={(v) => handleChange('principalTitle', v)} placeholder="যেমন: প্রধান শিক্ষক" required />
                  <FormInput label="শ্রেণি শিক্ষক লেবেল" value={formData.classTeacherTitle} onChange={(v) => handleChange('classTeacherTitle', v)} placeholder="যেমন: শ্রেণি শিক্ষকের স্বাক্ষর" />
                  <FormInput label="অভিভাবক লেবেল" value={formData.guardianTitle} onChange={(v) => handleChange('guardianTitle', v)} placeholder="যেমন: অভিভাবকের স্বাক্ষর" />
                </div>
              </SettingsCard>

              {/* Contact Information */}
              <SettingsCard
                title="যোগাযোগের তথ্য"
                subtitle="ফোন, ইমেইল ও ওয়েবসাইট"
                icon={<Phone className="w-5 h-5" />}
                iconBg="bg-emerald-50" iconColor="text-emerald-600"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormInput label="মোবাইল/ফোন নম্বর" value={formData.phone} onChange={(v) => handleChange('phone', v)} placeholder="যেমন: 01819-000000" icon={<Phone className="w-3.5 h-3.5" />} mono />
                  <FormInput label="অফিশিয়াল ইমেইল" value={formData.email} onChange={(v) => handleChange('email', v)} placeholder="যেমন: school@gmail.com" type="email" icon={<Mail className="w-3.5 h-3.5" />} />
                  <FormInput label="ওয়েবসাইট URL" value={formData.website} onChange={(v) => handleChange('website', v)} placeholder="যেমন: www.school.edu.bd" icon={<Globe className="w-3.5 h-3.5" />} />
                </div>
              </SettingsCard>
            </>
          )}

          {/* ━━━ TAB: COMMITTEE ━━━ */}
          {activeTab === 'committee' && (
            <>
              {/* Header Card & Actions */}
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-700/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>ম্যানেজিং কমিটি ও পরিচালনা পর্ষদ</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      বিদ্যালয় পরিচালনা কমিটির সদস্য ব্যবস্থাপনা
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                      কমিটির সদস্যদের নাম, পদবি, মেয়াদকাল, ছবি ও যোগাযোগের তথ্য হালনাগাদ করুন। এখানে সংরক্ষিত তথ্য মূল ওয়েবসাইটের <strong>"পরিচালনা পর্ষদ"</strong> সেকশনে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenAddMember}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>নতুন সদস্য যোগ করুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetCommittee}
                      title="ডিফল্ট ৪ সদস্যের কমিটি রিস্টোর করুন"
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="hidden sm:inline">ডিফল্ট রিস্টোর</span>
                    </button>

                    <Link
                      href="/#committee"
                      target="_blank"
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                      <span className="hidden sm:inline">ওয়েবসাইটে দেখুন</span>
                    </Link>
                  </div>
                </div>

                {/* Auto Sync Banner */}
                <div className="mt-5 pt-4 border-t border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>অটো-সিঙ্ক সক্রিয়:</strong> কোনো পরিবর্তন সেভ করার সাথে সাথে ওয়েবসাইটের হোমপেজে (#committee) লাইভ প্রতিফলিত হবে।</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-700/50">
                    <span>মোট সদস্য:</span>
                    <span className="font-bold text-amber-300">{currentCommitteeMembers.length} জন</span>
                  </div>
                </div>
              </div>

              {/* Committee Alert Banner */}
              {committeeAlert && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border transition-all ${
                  committeeAlert.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{committeeAlert.message}</span>
                  <button onClick={() => setCommitteeAlert(null)} className="ml-auto p-1 hover:bg-emerald-100 rounded-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Search & Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={committeeSearchQuery}
                    onChange={(e) => setCommitteeSearchQuery(e.target.value)}
                    placeholder="সদস্যের নাম, পদবি বা ফোন নম্বর দিয়ে খুঁজুন..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                  {committeeSearchQuery && (
                    <button
                      onClick={() => setCommitteeSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-500 flex items-center justify-between sm:justify-end gap-2 shrink-0">
                  <span>প্রদর্শিত সদস্য:</span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-mono">
                    {currentCommitteeMembers.filter(m => 
                      !committeeSearchQuery || 
                      m.name.toLowerCase().includes(committeeSearchQuery.toLowerCase()) ||
                      m.role.toLowerCase().includes(committeeSearchQuery.toLowerCase()) ||
                      (m.phone && m.phone.includes(committeeSearchQuery))
                    ).length} জন
                  </span>
                </div>
              </div>

              {/* Committee Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCommitteeMembers
                  .filter(m => 
                    !committeeSearchQuery || 
                    m.name.toLowerCase().includes(committeeSearchQuery.toLowerCase()) ||
                    m.role.toLowerCase().includes(committeeSearchQuery.toLowerCase()) ||
                    (m.phone && m.phone.includes(committeeSearchQuery))
                  )
                  .map((member, idx) => (
                    <div
                      key={member.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className="space-y-4">
                        {/* Member Header */}
                        <div className="flex items-start gap-4">
                          <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-600/30 bg-emerald-50 flex items-center justify-center shadow-xs">
                              {member.photo ? (
                                <img
                                  src={member.photo}
                                  alt={member.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=500&auto=format&fit=crop';
                                  }}
                                />
                              ) : (
                                <span className="text-xl font-black text-emerald-800">
                                  {member.name ? member.name.charAt(0) : 'ক'}
                                </span>
                              )}
                            </div>
                            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs">
                              {idx + 1}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${member.badgeColor || getRoleBadgeColor(member.role)}`}>
                                {member.role}
                              </span>
                            </div>
                            <h3 className="text-base font-black text-slate-900 truncate" title={member.name}>
                              {member.name}
                            </h3>
                            {member.tenure && (
                              <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                                <CalendarDays className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{member.tenure}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Contact details */}
                        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-600 border border-slate-100">
                          {member.phone ? (
                            <div className="flex items-center gap-2 truncate">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-mono font-medium">{member.phone}</span>
                            </div>
                          ) : (
                            <div className="text-slate-400 text-[11px] italic">ফোন নম্বর যুক্ত করা হয়নি</div>
                          )}
                          {member.email && (
                            <div className="flex items-center gap-2 truncate">
                              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="font-mono text-[11px] text-slate-500 truncate">{member.email}</span>
                            </div>
                          )}
                          {member.joiningDate && (
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>যোগদান: {member.joiningDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Bio / Quote snippet */}
                        {member.bio && (
                          <p className="text-xs text-slate-600 italic line-clamp-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
                            "{member.bio}"
                          </p>
                        )}
                      </div>

                      {/* Card Action Toolbar */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {/* Order controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveMember(idx, 'up')}
                            disabled={idx === 0}
                            title="উপরে স্থানান্তর করুন"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-slate-600"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveMember(idx, 'down')}
                            disabled={idx === currentCommitteeMembers.length - 1}
                            title="নিচে স্থানান্তর করুন"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-slate-600"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Edit and Delete */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditMember(member)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold transition-all border border-slate-200"
                          >
                            <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                            <span>সম্পাদনা</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold transition-all border border-slate-200"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>মুছুন</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Empty state */}
              {currentCommitteeMembers.length === 0 && (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">বর্তমানে কোনো সদস্য নেই</h3>
                    <p className="text-xs text-slate-500">ম্যানেজিং কমিটিতে নতুন সদস্য যোগ করতে নিচের বাটনে চাপ দিন।</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenAddMember}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> সদস্য যোগ করুন
                    </button>
                    <button
                      type="button"
                      onClick={handleResetCommittee}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> ডিফল্ট কমিটি লোড করুন
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ━━━ TAB: FACILITIES ━━━ */}
          {activeTab === 'facilities' && (
            <>
              {/* Header Banner & Quick Actions */}
              <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-teal-700/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      ক্যাম্পাস সুযোগ-সুবিধা ব্যবস্থাপনা
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
                      আইসিটি ডিজিটাল ল্যাব, বিজ্ঞানাগার, লাইব্রেরি, খেলার মাঠ, স্কাউটিং ও স্যানিটেশনের মতো সুবিধাসমূহ নিয়ন্ত্রণ করুন। এখানে সংরক্ষিত তথ্য মূল ওয়েবসাইটের <strong>&quot;ক্যাম্পাস সুবিধাসমূহ&quot;</strong> সেকশনে তাৎক্ষণিক প্রদর্শিত হবে।
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenAddFacility}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>নতুন সুবিধা যোগ করুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetFacilities}
                      title="ডিফল্ট ৬টি ক্যাম্পাস সুবিধা রিস্টোর করুন"
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-teal-300" />
                      <span className="hidden sm:inline">ডিফল্ট রিস্টোর</span>
                    </button>

                    <Link
                      href="/#facilities"
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs border border-teal-600/30 transition-all"
                    >
                      <span>ওয়েবসাইটে দেখুন</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Alert Feedback Toast */}
              {facilityAlert && (
                <div
                  className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-200 border ${
                    facilityAlert.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {facilityAlert.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{facilityAlert.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFacilityAlert(null)}
                    className="p-1 hover:bg-black/5 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Section Header Configuration Card */}
              <SettingsCard
                title="সেকশনের শিরোনাম ও প্রদর্শন নিয়ন্ত্রণ"
                subtitle="মূল ওয়েবসাইটে এই সেকশনটির শিরোনাম, উপ-শিরোনাম ও দৃশ্যমানতা নিয়ন্ত্রণ করুন"
                icon={<Sliders className="w-5 h-5" />}
                iconBg="bg-teal-50"
                iconColor="text-teal-600"
              >
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-sm font-bold text-slate-800">হোমপেজে সেকশন প্রদর্শন</div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        সুইচটি বন্ধ রাখলে মূল পাবলিক ওয়েবসাইটে এই সম্পূর্ণ সেকশনটি লুকায়িত থাকবে।
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleFacilitySection}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        facilitiesConfig.enabled ? 'bg-teal-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          facilitiesConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        আইব্রো ট্যাগ
                      </label>
                      <input
                        type="text"
                        value={facilitiesConfig.eyebrow || ''}
                        onChange={(e) =>
                          setFacilitiesConfig((prev) => ({ ...prev, eyebrow: e.target.value }))
                        }
                        placeholder="যেমন: ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        সেকশনের প্রধান শিরোনাম
                      </label>
                      <input
                        type="text"
                        value={facilitiesConfig.title || ''}
                        onChange={(e) =>
                          setFacilitiesConfig((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="যেমন: শিক্ষার্থীদের সার্বিক বিকাশে আধুনিক সুযোগ-সুবিধা"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        সেকশনের সাবটাইটেল / বিবরণী
                      </label>
                      <textarea
                        rows={2}
                        value={facilitiesConfig.subtitle || ''}
                        onChange={(e) =>
                          setFacilitiesConfig((prev) => ({ ...prev, subtitle: e.target.value }))
                        }
                        placeholder="সুপরিকল্পিত ও মনোরম ক্যাম্পাস পরিবেশ..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveFacilityHeader(
                          facilitiesConfig.eyebrow || '',
                          facilitiesConfig.title || '',
                          facilitiesConfig.subtitle || ''
                        )
                      }
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>সেকশন হেডার সংরক্ষণ করুন</span>
                    </button>
                  </div>
                </div>
              </SettingsCard>

              {/* Facilities List & Search Header */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm">
                    {facilitiesConfig.items?.length || 0}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">সুবিধাসমূহের তালিকা ও ক্রম</h3>
                    <p className="text-[11px] text-slate-500">
                      সক্রিয়: {facilitiesConfig.items?.filter((f) => f.visible !== false).length || 0}টি | নিষ্ক্রিয়: {facilitiesConfig.items?.filter((f) => f.visible === false).length || 0}টি
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={facilitySearchQuery}
                      onChange={(e) => setFacilitySearchQuery(e.target.value)}
                      placeholder="সুবিধা খুঁজুন..."
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-teal-500 transition w-44"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddFacility}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>যোগ করুন</span>
                  </button>
                </div>
              </div>

              {/* Facilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(facilitiesConfig.items || [])
                  .filter((f) =>
                    facilitySearchQuery
                      ? f.title.toLowerCase().includes(facilitySearchQuery.toLowerCase()) ||
                        (f.titleEn && f.titleEn.toLowerCase().includes(facilitySearchQuery.toLowerCase())) ||
                        f.description.toLowerCase().includes(facilitySearchQuery.toLowerCase())
                      : true
                  )
                  .map((fac, idx) => (
                    <div
                      key={fac.id || idx}
                      className={`p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                        fac.visible !== false
                          ? 'bg-white border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-md'
                          : 'bg-slate-50/80 border-slate-200 opacity-60'
                      }`}
                    >
                      <div>
                        {/* Top bar with Icon, Badge & Action Buttons */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-lg shrink-0">
                              {fac.icon === 'Monitor' ? <Monitor className="w-5 h-5 text-indigo-600" /> :
                               fac.icon === 'FlaskConical' ? <FlaskConical className="w-5 h-5 text-emerald-600" /> :
                               fac.icon === 'BookOpen' ? <BookOpen className="w-5 h-5 text-amber-600" /> :
                               fac.icon === 'Trophy' ? <Trophy className="w-5 h-5 text-rose-600" /> :
                               fac.icon === 'Compass' ? <Compass className="w-5 h-5 text-cyan-600" /> :
                               fac.icon === 'Droplet' ? <Droplet className="w-5 h-5 text-blue-600" /> :
                               fac.icon === 'Microscope' ? <Microscope className="w-5 h-5 text-emerald-600" /> :
                               fac.icon === 'Laptop' ? <Laptop className="w-5 h-5 text-indigo-600" /> :
                               fac.icon === 'Users' ? <Users className="w-5 h-5 text-cyan-600" /> :
                               fac.icon === 'Award' ? <Award className="w-5 h-5 text-amber-600" /> :
                               fac.icon === 'ShieldCheck' ? <Shield className="w-5 h-5 text-emerald-600" /> :
                               <Building2 className="w-5 h-5 text-teal-600" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                  {fac.title}
                                </h4>
                                {fac.visible === false && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px] font-bold">
                                    লুকায়িত
                                  </span>
                                )}
                              </div>
                              {fac.titleEn && (
                                <p className="text-[11px] text-slate-400 font-en font-medium">
                                  {fac.titleEn}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick Action Icons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveFacility(idx, 'up')}
                              disabled={idx === 0}
                              title="উপরে নিন"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveFacility(idx, 'down')}
                              disabled={idx === (facilitiesConfig.items?.length || 0) - 1}
                              title="নিচে নিন"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleFacilityVisibility(fac.id)}
                              title={fac.visible !== false ? 'হাইড করুন' : 'দৃশ্যমান করুন'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
                            >
                              {fac.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditFacility(fac)}
                              title="সম্পাদনা করুন"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFacility(fac.id)}
                              title="মুছে ফেলুন"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {fac.description}
                        </p>
                      </div>

                      {/* Card Bottom Meta */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono">ID: {fac.id}</span>
                        {fac.badge && (
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 font-bold">
                            {fac.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* ━━━ TAB: SECURITY ━━━ */}
          {activeTab === 'security' && (
            <>
            <SettingsCard
              title="অ্যাডমিন লগইন সিকিউরিটি"
              subtitle="প্রধান শিক্ষক / অ্যাডমিন লগইনের জন্য ইউজার আইডি ও পাসওয়ার্ড সেট করুন"
              icon={<Shield className="w-5 h-5" />}
              iconBg="bg-rose-50" iconColor="text-rose-600"
              borderColor="border-rose-200"
            >
              {/* Security Warning */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-amber-900">নিরাপত্তা সতর্কতা:</span>
                  <span className="text-amber-800 ml-1">ডিফল্ট পাসওয়ার্ড পরিবর্তন করুন। শক্তিশালী পাসওয়ার্ড (৮+ অক্ষর, সংখ্যা ও চিহ্ন মিশ্রিত) ব্যবহার করুন।</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Admin User ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    অ্যাডমিন ইউজার আইডি / ফোন
                  </label>
                  <input
                    type="text"
                    value={adminPhoneInput}
                    onChange={(e) => setAdminPhoneInput(e.target.value)}
                    placeholder="যেমন: admin অথবা 01700000000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>

                {/* Admin Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    অ্যাডমিন পাসওয়ার্ড
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordAdmin ? 'text' : 'password'}
                      value={adminPassInput}
                      onChange={(e) => setAdminPassInput(e.target.value)}
                      placeholder="পাসওয়ার্ড সেট করুন"
                      className="w-full px-4 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordAdmin(!showPasswordAdmin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPasswordAdmin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  <Shield className="w-3.5 h-3.5" /> পাসওয়ার্ড শক্তি:
                  <span className={`font-black ${
                    adminPassInput.length >= 12 ? 'text-emerald-600' :
                    adminPassInput.length >= 8 ? 'text-amber-600' :
                    'text-rose-600'
                  }`}>
                    {adminPassInput.length >= 12 ? '🟢 খুবই শক্তিশালী' :
                     adminPassInput.length >= 8 ? '🟡 মাঝারি' :
                     '🔴 দুর্বল'}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      adminPassInput.length >= 12 ? 'bg-emerald-500 w-full' :
                      adminPassInput.length >= 8 ? 'bg-amber-500 w-2/3' :
                      adminPassInput.length >= 4 ? 'bg-rose-400 w-1/3' :
                      'bg-rose-300 w-[10%]'
                    }`}
                  />
                </div>
              </div>

              {/* Current Credentials Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="text-[11px] font-black text-slate-600 uppercase tracking-wider">বর্তমান লগইন তথ্য</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[10px] font-bold">ইউজার আইডি</span>
                    <span className="font-mono font-black text-slate-900">{adminPhoneInput || 'admin'}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[10px] font-bold">পাসওয়ার্ড</span>
                    <span className="font-mono font-black text-slate-900">{showPasswordAdmin ? adminPassInput : '••••••••'}</span>
                  </div>
                </div>
              </div>
            </SettingsCard>

            {/* ━━━ TEACHER PASSWORDS & USER ID MANAGEMENT ━━━ */}
            <SettingsCard
              title="শিক্ষকদের ইউজার আইডি ও পাসওয়ার্ড ব্যবস্থাপনা"
              subtitle="শিক্ষকের ইউজার আইডি হবে তার ফোন নম্বর এবং এডমিন এখান থেকে পাসওয়ার্ড সেট ও নিয়ন্ত্রণ করবেন"
              icon={<Key className="w-5 h-5" />}
              iconBg="bg-indigo-50" iconColor="text-indigo-600"
              borderColor="border-indigo-200"
            >
              {/* Information Banner */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs">
                <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-black text-indigo-950 text-sm">শিক্ষক লগইন ও পাসওয়ার্ড নিয়মাবলী:</span>
                  <p className="text-indigo-900 leading-relaxed font-medium">
                    প্রতিটি শিক্ষকের <strong>ইউজার আইডি হলো তার ১১ ডিজিটের মোবাইল নম্বর</strong>। প্রধান শিক্ষক বা অ্যাডমিন হিসেবে আপনি এখান থেকে যেকোনো শিক্ষকের পাসওয়ার্ড সরাসরি দেখতে ও নতুন পাসওয়ার্ড সেট করতে পারেন। শিক্ষক পাসওয়ার্ড ভুলে গেলে লগইন পেজ থেকে <strong>OTP-এর মাধ্যমে নিজেই রিসেট</strong> করতে পারবেন।
                  </p>
                </div>
              </div>

              {/* Alert Message */}
              {teacherSavedAlert && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{teacherSavedAlert}</span>
                </div>
              )}

              {/* Search & Stats Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    মোট শিক্ষক: <strong className="font-mono text-indigo-600 text-sm">{teachersList.length}</strong> জন
                  </span>
                  <Link
                    href="/dashboard/teacher"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 ml-2"
                  >
                    <span>শিক্ষক ব্যবস্থাপনা পেজে যান</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="নাম বা ফোন নম্বর খুঁজুন..."
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Teachers Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
                      <th className="p-3">শিক্ষকের নাম ও পদবি</th>
                      <th className="p-3">লগইন ইউজার আইডি (ফোন)</th>
                      <th className="p-3">অ্যাডমিন নির্ধারিত পাসওয়ার্ড</th>
                      <th className="p-3 text-right">একশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                    {teachersList
                      .filter((t: any) =>
                        !teacherSearchQuery ||
                        t.name?.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
                        (t.phone && t.phone.includes(teacherSearchQuery)) ||
                        (t.mobile && t.mobile.includes(teacherSearchQuery))
                      )
                      .map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3">
                            <div className="font-black text-slate-900 text-sm">{t.name}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{t.designation} • {t.subject}</div>
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-700">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Smartphone size={14} className="text-indigo-500" />
                              <span>{t.phone || t.mobile || '—'}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">লগইন ইউজার আইডি</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 max-w-xs">
                              <div className="relative flex-1">
                                <input
                                  type={showTeacherPasswords[t.id] ? 'text' : 'password'}
                                  value={teacherPasswords[t.id] ?? (t.password || '123456')}
                                  onChange={(e) =>
                                    setTeacherPasswords({ ...teacherPasswords, [t.id]: e.target.value })
                                  }
                                  placeholder="পাসওয়ার্ড লিখুন"
                                  className="w-full px-3 py-1.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowTeacherPasswords({
                                      ...showTeacherPasswords,
                                      [t.id]: !showTeacherPasswords[t.id]
                                    })
                                  }
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                  {showTeacherPasswords[t.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleSaveTeacherPassword(t.id, t.name)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ml-auto active:scale-95"
                            >
                              <Save size={13} /> পাসওয়ার্ড সেট করুন
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </SettingsCard>
            </>
          )}

          {/* ━━━ TAB: APPEARANCE ━━━ */}
          {activeTab === 'appearance' && (
            <>
              {/* Theme Mode Selector (Light / Night Mode) */}
              <SettingsCard
                title="ওয়েবসাইট থিম মোড (Light & Night Mode)"
                subtitle="সম্পূর্ণ ওয়েব অ্যাপ্লিকেশন লাইট বা নাইট মোডে পরিবর্তন করুন"
                icon={<Sun className="w-5 h-5" />}
                iconBg="bg-indigo-50" iconColor="text-indigo-600"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Light Mode Option */}
                  <div
                    onClick={() => {
                      themeService.setTheme('light');
                      handleChange('theme', 'light');
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      (formData.theme === 'light' || (!formData.theme && themeService.getTheme() === 'light'))
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-amber-500">
                        <Sun className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">☀️ লাইট মোড</h4>
                        <p className="text-[11px] text-slate-500 font-medium">উজ্জ্বল ও পরিষ্কার অফিস কালার থিম</p>
                      </div>
                    </div>
                    {(formData.theme === 'light' || (!formData.theme && themeService.getTheme() === 'light')) && (
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Dark / Night Mode Option */}
                  <div
                    onClick={() => {
                      themeService.setTheme('dark');
                      handleChange('theme', 'dark');
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      (formData.theme === 'dark' || themeService.getTheme() === 'dark')
                        ? 'border-indigo-600 bg-slate-900 text-white shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-center text-indigo-400">
                        <Moon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-black ${(formData.theme === 'dark' || themeService.getTheme() === 'dark') ? 'text-white' : 'text-slate-900'}`}>
                          🌙 নাইট মোড
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">চোখের আরামদায়ক আধুনিক ডার্ক মোড</p>
                      </div>
                    </div>
                    {(formData.theme === 'dark' || themeService.getTheme() === 'dark') && (
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              </SettingsCard>

              {/* Logo Upload */}
              <SettingsCard
                title="লোগো আপলোড"
                subtitle="মার্কশিটের লোগো ও ব্র্যান্ড আইডেন্টিটি সেট করুন"
                icon={<ImageIcon className="w-5 h-5" />}
                iconBg="bg-amber-50" iconColor="text-amber-600"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  {/* Logo Preview */}
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-slate-200 flex flex-col items-center justify-center text-slate-950 shrink-0 overflow-hidden shadow-inner">
                    {formData.schoolLogo ? (
                      <img src={formData.schoolLogo} alt="School Logo" className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <>
                        <span className="text-amber-500 text-sm font-bold">★</span>
                        <span className="text-[10px] font-black tracking-tighter">BHS</span>
                        <span className="text-[8px] font-bold text-slate-600">{formData.estdYear}</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-500 leading-snug">
                      PNG/JPG ফরম্যাট, সর্বোচ্চ 2MB সাইজ। খালি রাখলে ক্রাস্ট লোগো দেখাবে।
                    </p>
                    {formData.schoolLogo && (
                      <button
                        type="button"
                        onClick={() => handleChange('schoolLogo', '')}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> লোগো মুছে ফেলুন
                      </button>
                    )}
                  </div>
                </div>
              </SettingsCard>

              {/* Watermark Settings */}
              <SettingsCard
                title="জলছাপ / ওয়াটারমার্ক সেটিং"
                subtitle="মার্কশিটের পেছনে হালকা ওয়াটারমার্ক কাস্টমাইজ করুন"
                icon={<Palette className="w-5 h-5" />}
                iconBg="bg-amber-50" iconColor="text-amber-600"
              >
                {/* Watermark Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">ব্যাকগ্রাউন্ড জলছাপ</span>
                    <span className="text-[11px] text-slate-500">প্রিন্ট নম্বরপত্রে হালকা ওয়াটারমার্ক দেখাবে</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showWatermark}
                      onChange={(e) => handleChange('showWatermark', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Watermark Opacity Slider */}
                {formData.showWatermark && (
                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">জলছাপের দৃশ্যমানতা / ঘনত্ব:</span>
                      <span className="text-indigo-600 font-mono font-black text-sm">{Math.round(formData.watermarkOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.15"
                      step="0.01"
                      value={formData.watermarkOpacity}
                      onChange={(e) => handleChange('watermarkOpacity', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>১% (একদম হালকা)</span>
                      <span className="text-indigo-500 font-bold">ডিফল্ট ৩%</span>
                      <span>১৫% (গাঢ়)</span>
                    </div>
                  </div>
                )}

                {/* Print Layout Options */}
                <div className="space-y-3">
                  <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5 text-slate-400" /> প্রিন্ট লেআউট অপশন
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'শ্রেণি সিলেক্টর দেখাবে', field: 'showClassSelection' as keyof SchoolSettings },
                      { label: 'শাখা সিলেক্টর দেখাবে', field: 'showSectionSelection' as keyof SchoolSettings },
                      { label: 'রোল ইনপুট দেখাবে', field: 'showRollInput' as keyof SchoolSettings },
                    ].map(opt => (
                      <label key={opt.field} className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData[opt.field] as boolean}
                          onChange={(e) => handleChange(opt.field, e.target.checked)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </SettingsCard>
            </>
          )}

          {/* ━━━ TAB: ACADEMIC ━━━ */}
          {activeTab === 'academic' && (
            <>
              <SettingsCard
                title="একাডেমিক সেশন ও পরীক্ষা কনফিগারেশন"
                subtitle="বর্তমান শিক্ষা বর্ষ, পরীক্ষার ধরন ও একাডেমিক সেটিংস"
                icon={<CalendarDays className="w-5 h-5" />}
                iconBg="bg-emerald-50" iconColor="text-emerald-600"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="বর্তমান সেশন / শিক্ষা বর্ষ" value={currentSession} onChange={setCurrentSession} placeholder="যেমন: ২০২৬" mono icon={<CalendarDays className="w-3.5 h-3.5" />} />
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" /> শ্রেণি পরিসর
                    </label>
                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                      ৬ষ্ঠ — ১০ম শ্রেণি (Class 6th – 10th)
                    </div>
                    <p className="text-[10.5px] text-slate-500">মাধ্যমিক স্তরের সকল শ্রেণি সাপোর্টেড</p>
                  </div>
                </div>

                {/* Exam Names Configuration */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> পরীক্ষার নামসমূহ
                  </div>
                  <div className="space-y-2">
                    {(Array.isArray(examNames) ? examNames : []).map((name, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            const updated = [...examNames];
                            updated[idx] = e.target.value;
                            setExamNames(updated);
                          }}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        />
                        {examNames.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setExamNames(examNames.filter((_, i) => i !== idx))}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setExamNames([...examNames, ''])}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 mt-1 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" /> নতুন পরীক্ষা যোগ করুন
                    </button>
                  </div>
                </div>

                {/* Grading System Info */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="text-[11px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> গ্রেডিং সিস্টেম (NCTB)
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 text-[10px] font-bold">
                    {[
                      { grade: 'A+', range: '৮০-১০০', gpa: '৫.০০', color: 'bg-emerald-600' },
                      { grade: 'A', range: '৭০-৭৯', gpa: '৪.০০', color: 'bg-blue-600' },
                      { grade: 'A-', range: '৬০-৬৯', gpa: '৩.৫০', color: 'bg-indigo-600' },
                      { grade: 'B', range: '৫০-৫৯', gpa: '৩.০০', color: 'bg-amber-600' },
                      { grade: 'F', range: '০-৩২', gpa: '০.০০', color: 'bg-rose-600' },
                    ].map(g => (
                      <div key={g.grade} className="text-center p-2 bg-white rounded-lg border border-emerald-100">
                        <div className={`inline-block px-2 py-0.5 ${g.color} text-white rounded-md text-[9px] font-black mb-1`}>{g.grade}</div>
                        <div className="text-slate-600">{g.range}</div>
                        <div className="text-emerald-700 font-mono">{g.gpa}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </SettingsCard>

              {/* 🟢 ONLINE ADMISSION FORM PORTAL TOGGLE */}
              <SettingsCard
                title={currentLang === 'en' ? 'Online Admission Form Control' : 'অনলাইন ভর্তি আবেদন পোর্টাল নিয়ন্ত্রণ'}
                subtitle={currentLang === 'en' ? 'Turn online admission form ON or OFF for public applicants' : 'সর্বসাধারণ ও অভিভাবকদের জন্য অনলাইন ভর্তি আবেদন ফরম চালু বা বন্ধ রাখুন'}
                icon={<UserPlus className="w-5 h-5" />}
                iconBg="bg-amber-50" iconColor="text-amber-600"
                badge={
                  <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                    formData.onlineAdmissionEnabled !== false
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${formData.onlineAdmissionEnabled !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                    {formData.onlineAdmissionEnabled !== false 
                      ? (currentLang === 'en' ? 'Portal Active (ON)' : 'পোর্টাল চালু')
                      : (currentLang === 'en' ? 'Portal Closed (OFF)' : 'পোর্টাল বন্ধ')}
                  </span>
                }
              >
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">
                        {currentLang === 'en' ? 'Public Online Admission Form Status' : 'অনলাইন ভর্তি ফরম স্ট্যাটাস'}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5 max-w-xl leading-relaxed">
                        {formData.onlineAdmissionEnabled !== false
                          ? (currentLang === 'en'
                              ? 'Online admission is OPEN. Applicants can submit admission forms directly at /admission.'
                              : 'অনলাইন ভর্তি আবেদন বর্তমানে চালু আছে। যেকোনো অভিভাবক বা শিক্ষার্থী সরাসরি অনলাইনে ভর্তি ফরম পূরণ করতে পারবেন।')
                          : (currentLang === 'en'
                              ? 'Online admission is CLOSED. Visiting /admission will show a closed notice with school contact info.'
                              : 'অনলাইন ভর্তি আবেদন বর্তমানে বন্ধ রয়েছে। /admission পেজে গেলে আবেদন স্থগিতের নোটিশ প্রদর্শিত হবে।')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...formData, onlineAdmissionEnabled: formData.onlineAdmissionEnabled === false ? true : false };
                          setFormData(updated);
                          settingsService.updateSettings({ onlineAdmissionEnabled: updated.onlineAdmissionEnabled });
                        }}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                          formData.onlineAdmissionEnabled !== false ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
                            formData.onlineAdmissionEnabled !== false ? 'translate-x-8' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">
                      {currentLang === 'en' ? 'Public Form URL:' : 'পাবলিক ফরম লিংক:'}{' '}
                      <Link href="/admission" target="_blank" className="text-indigo-600 font-mono font-bold hover:underline">
                        /admission ↗
                      </Link>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {formData.onlineAdmissionEnabled !== false ? '✅ নতুন আবেদন গ্রহণ চলছে' : '⛔ আবেদন গ্রহণ বন্ধ'}
                    </span>
                  </div>
                </div>
              </SettingsCard>
            </>
          )}

          {/* ━━━ TAB: SMS GATEWAY ━━━ */}
          {activeTab === 'sms' && (
            <>
              {/* SMS Config Save Alert */}
              {smsSaveAlert && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-sm animate-in fade-in ${
                  smsSaveAlert.type === 'success'
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 text-rose-950 border-rose-300 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {smsSaveAlert.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{smsSaveAlert.message}</span>
                  </div>
                  <button onClick={() => setSmsSaveAlert(null)} className="text-slate-400 hover:text-slate-700 font-black cursor-pointer ml-4">✕</button>
                </div>
              )}

              {/* Main SMS Gateway Configuration */}
              <SettingsCard
                title="এসএমএস গেটওয়ে কনফিগারেশন"
                subtitle="bulksmsdhaka.net ও অন্যান্য গেটওয়ে ব্যবহার করে স্বয়ংক্রিয় নোটিশ, বকেয়া ফি এবং ওটিপি পাঠান"
                icon={<MessageSquare className="w-5 h-5" />}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                badge={
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-black">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>
                      {smsConfig.provider === 'bulksmsdhaka'
                        ? 'Bulk SMS Dhaka (সক্রিয়)'
                        : smsConfig.provider === 'bulksmsbd'
                        ? 'BulkSMSBD'
                        : smsConfig.provider === 'greenweb'
                        ? 'Greenweb BD'
                        : smsConfig.provider === 'custom_api'
                        ? 'কাস্টম API'
                        : 'টেস্টিং মোড'}
                    </span>
                  </div>
                }
              >
                {/* Gateway Provider Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    গেটওয়ে প্রোভাইডার নির্বাচন করুন
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'bulksmsdhaka' as SMSProviderType,
                        name: 'Bulk SMS Dhaka',
                        domain: 'bulksmsdhaka.net',
                        tag: 'প্রস্তাবিত ও ডিফল্ট',
                        recommended: true
                      },
                      {
                        id: 'bulksmsbd' as SMSProviderType,
                        name: 'BulkSMSBD',
                        domain: 'bulksmsbd.net',
                        tag: 'বিকল্প গেটওয়ে',
                        recommended: false
                      },
                      {
                        id: 'demo_mode' as SMSProviderType,
                        name: 'টেস্টিং সিমুলেশন',
                        domain: 'ব্যালেন্স কাটা হবে না',
                        tag: 'টেস্টিং মোড',
                        recommended: false
                      }
                    ].map((p) => {
                      const isSelected = smsConfig.provider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const updated: SMSGatewayConfig = { ...smsConfig, provider: p.id };
                            if (p.id === 'bulksmsdhaka' && smsConfig.savedGateways?.bulksmsdhaka) {
                              updated.apiKey = smsConfig.savedGateways.bulksmsdhaka.apiKey;
                              updated.senderId = smsConfig.savedGateways.bulksmsdhaka.senderId || '1234';
                            } else if (p.id === 'bulksmsbd' && smsConfig.savedGateways?.bulksmsbd) {
                              updated.apiKey = smsConfig.savedGateways.bulksmsbd.apiKey;
                              updated.senderId = smsConfig.savedGateways.bulksmsbd.senderId || '8809617613435';
                            }
                            setSmsConfig(updated);
                          }}
                          className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-100'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">{p.name}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                          </div>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">{p.domain}</p>
                          <span className={`inline-block mt-2 px-2 py-0.5 rounded-md text-[9px] font-bold ${
                            p.recommended ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {p.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Fields for Active Gateway */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* API Key Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          এপিআই কি <span className="text-rose-500">*</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSmsApiKey(!showSmsApiKey)}
                          className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                        >
                          {showSmsApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {showSmsApiKey ? 'লুকান' : 'দেখুন'}
                        </button>
                      </label>
                      <input
                        type={showSmsApiKey ? 'text' : 'password'}
                        value={smsConfig.apiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSmsConfig((prev) => ({
                            ...prev,
                            apiKey: val,
                            savedGateways: {
                              ...prev.savedGateways,
                              [prev.provider]: {
                                ...(prev.savedGateways?.[prev.provider] || { senderId: prev.senderId }),
                                apiKey: val
                              }
                            }
                          }));
                        }}
                        placeholder="আপনার bulksmsdhaka.net একাউন্টের API Key দিন"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                      <p className="text-[10.5px] text-slate-500">
                        {smsConfig.provider === 'bulksmsdhaka'
                          ? 'bulksmsdhaka.net ড্যাশবোর্ডের API Settings থেকে প্রাপ্ত API Key'
                          : 'এসএমএস গেটওয়ে থেকে প্রাপ্ত Secret / API Key'}
                      </p>
                    </div>

                    {/* Caller ID / Sender ID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        কলার আইডি / সেন্ডার আইডি <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={smsConfig.senderId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSmsConfig((prev) => ({
                            ...prev,
                            senderId: val,
                            savedGateways: {
                              ...prev.savedGateways,
                              [prev.provider]: {
                                ...(prev.savedGateways?.[prev.provider] || { apiKey: prev.apiKey }),
                                senderId: val
                              }
                            }
                          }));
                        }}
                        placeholder="যেমন: 1234 (নন-মাস্কিং) অথবা BoraitoliHS (মাস্কিং)"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                      <p className="text-[10.5px] text-slate-500">
                        নন-মাস্কিং এর ক্ষেত্রে <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-bold">1234</code> এবং মাস্কিং এর ক্ষেত্রে অনুমোদিত ব্র্যান্ড নাম দিন।
                      </p>
                    </div>

                    {/* Brand Name for OTP */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        ওটিপি ব্র্যান্ডের নাম
                      </label>
                      <input
                        type="text"
                        value={smsConfig.brandName || ''}
                        onChange={(e) => setSmsConfig((prev) => ({ ...prev, brandName: e.target.value }))}
                        placeholder="যেমন: Boraitoli High School"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                      <p className="text-[10.5px] text-slate-500">
                        ওটিপি বার্তা তৈরির সময় <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-bold">Your {'{Brand Name}'} OTP is XXXX</code> ফরম্যাটে যাবে।
                      </p>
                    </div>

                    {/* Balance */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        বর্তমান ব্যালেন্স / ক্রেডিট
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={smsConfig.balance}
                          onChange={(e) => setSmsConfig((prev) => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                        <span className="absolute right-3.5 top-2.5 text-[11px] font-bold text-slate-400">টাকা / ক্রেডিট</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500">
                        প্রতিটি সফল এসএমএস প্রেরণে এই ব্যালেন্স থেকে স্বয়ংক্রিয়ভাবে ক্রেডিট সমন্বয় হয়।
                      </p>
                    </div>
                  </div>

                  {/* Save Button Bar */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500">
                      সংরক্ষণ করলে ড্যাশবোর্ডের সকল এসএমএস মডিউলে এই গেটওয়ে কার্যকর হবে।
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveSmsConfig}
                      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      এসএমএস গেটওয়ে সংরক্ষণ করুন
                    </button>
                  </div>
                </div>
              </SettingsCard>

              {/* API Documentation Reference Box (from User's exact prompt) */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 rounded-2xl border border-slate-700 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                  <div className="flex items-center gap-2 text-sky-400 font-black text-xs sm:text-sm">
                    <FileText className="w-4 h-4" />
                    bulksmsdhaka.net এপিআই স্পেসিফিকেশন ও ব্যবহারের নির্দেশিকা
                  </div>
                  <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-[10px] font-bold font-mono">
                    API v1.0
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Send Text SMS Specification */}
                  <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> 1. Send SMS API (সাধারণ বার্তা)
                    </div>
                    <p className="text-[11px] text-slate-300">GET / POST মেথডে যেকোনো বার্তা পাঠাতে এই URL ব্যবহার হয়:</p>
                    <div className="p-2.5 bg-black/40 rounded-lg font-mono text-[10.5px] text-emerald-300 break-all border border-emerald-500/20 select-all">
                      https://bulksmsdhaka.net/api/sendtext?apikey=xxxxxx&amp;callerID=1234&amp;number=019XXXXXXXX&amp;message=abcd
                    </div>
                  </div>

                  {/* Send OTP Specification */}
                  <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
                    <div className="font-bold text-sky-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> 2. Send OTP API (ওটিপি বার্তা)
                    </div>
                    <p className="text-[11px] text-slate-300">ওটিপি কোড পাঠানোর জন্য নির্দিষ্ট URL ও ফরম্যাট:</p>
                    <div className="p-2.5 bg-black/40 rounded-lg font-mono text-[10.5px] text-sky-300 break-all border border-sky-500/20 select-all">
                      https://bulksmsdhaka.net/api/otpsend?apikey=xxxxxx&amp;callerID=1234&amp;number=019XXXXXXXX&amp;message=OTP
                    </div>
                  </div>
                </div>

                {/* Important Rules Alert */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-200 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300 font-bold block mb-0.5">⚠️ ওটিপি সতর্কবার্তা ও শর্ত:</strong>
                    OTP পাঠানোর জন্য অবশ্যই <span className="font-mono bg-amber-400/20 px-1 py-0.2 rounded font-bold text-amber-100">Your {'{Brand/Company Name}'} OTP is XXXX</span> ফরম্যাট মেনে পাঠাতে হবে।
                    নোট: OTP টির এসএমএস কনটেন্ট অবশ্যই <strong>৭০ ক্যারেক্টারের মধ্যে</strong> থাকতে হবে, অন্যথায় OTP সেন্ড হবে না এবং একাউন্ট থেকে ব্যালেন্স কেটে নেওয়া হতে পারে।
                  </div>
                </div>

                {/* Parameters Reference Table */}
                <div className="overflow-x-auto pt-1">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 font-bold">
                        <th className="py-1.5 px-2">Parameter Name</th>
                        <th className="py-1.5 px-2">Meaning / Value</th>
                        <th className="py-1.5 px-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium text-slate-300">
                      <tr>
                        <td className="py-1.5 px-2 font-mono text-blue-300">apikey</td>
                        <td className="py-1.5 px-2">API Key</td>
                        <td className="py-1.5 px-2 text-slate-400">আপনার bulksmsdhaka.net একাউন্টের API Key</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-mono text-blue-300">callerID</td>
                        <td className="py-1.5 px-2">Caller ID</td>
                        <td className="py-1.5 px-2 text-slate-400">নন-মাস্কিং 1234 এবং মাস্কিং এর জন্য অনুমোদিত Brand Name</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-mono text-blue-300">number</td>
                        <td className="py-1.5 px-2">Recipient Number</td>
                        <td className="py-1.5 px-2 text-slate-400">যেমন: 017XXXXXXXX, 018XXXXXXXX, 019XXXXXXXX...</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-mono text-blue-300">message</td>
                        <td className="py-1.5 px-2">SMS body</td>
                        <td className="py-1.5 px-2 text-slate-400">এসএমএস বার্তা (সিস্টেম কর্তৃক স্বয়ংক্রিয় URL Encoding সম্পন্ন হয়)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive Live Test Console */}
              <SettingsCard
                title="লাইভ টেস্ট কনসোল"
                subtitle="আপনার গেটওয়ে সক্রিয় কিনা এবং বার্তা পৌঁছাচ্ছে কিনা তা এখনই যাচাই করুন"
                icon={<Radio className="w-5 h-5" />}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
              >
                <div className="space-y-4">
                  {/* Mode Selector */}
                  <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setTestSmsMode('text')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        testSmsMode === 'text'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      সাধারণ টেক্সট এসএমএস টেস্ট
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestSmsMode('otp')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        testSmsMode === 'otp'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ওটিপি টেস্ট
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mobile Number Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        টেস্ট মোবাইল নম্বর <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={testSmsMobile}
                        onChange={(e) => setTestSmsMobile(e.target.value)}
                        placeholder="যেমন: 018XXXXXXXX"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                      />
                      <p className="text-[10.5px] text-slate-500">যে মোবাইল নম্বরে টেস্ট এসএমএস পাঠাতে চান</p>
                    </div>

                    {/* Mode Specific Preview / Input */}
                    {testSmsMode === 'text' ? (
                      <div className="space-y-1.5 sm:col-span-2">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-bold text-slate-700">টেস্ট বার্তা</label>
                          <span className="text-[10.5px] font-mono text-slate-500">
                            {testSmsMessage.length} অক্ষর | {smsService.calculateSMSCredit(testSmsMessage).smsParts} ক্রেডিট
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={testSmsMessage}
                          onChange={(e) => setTestSmsMessage(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">স্বয়ংক্রিয় ওটিপি ফরম্যাট প্রিভিউ</label>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 space-y-1">
                          <div className="text-emerald-700 font-bold">
                            Your {smsConfig.brandName || 'Boraitoli HS'} OTP is [৪-ডিজিট কোড]
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                            <span>মোট দৈর্ঘ্য: ~{24 + (smsConfig.brandName || 'Boraitoli HS').length} ক্যারেক্টার</span>
                            <span className="text-emerald-600 font-bold">✅ ৭০ ক্যারেক্টারের মধ্যে নিরাপদ</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Send Test Action & Feedback */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <button
                      type="button"
                      disabled={isSendingSmsTest}
                      onClick={handleSendTestSms}
                      className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer ${
                        isSendingSmsTest ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSendingSmsTest ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          পাঠানো হচ্ছে...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          {testSmsMode === 'otp' ? 'টেস্ট OTP পাঠান' : 'টেস্ট এসএমএস পাঠান'}
                        </>
                      )}
                    </button>

                    <Link
                      href="/dashboard/sms"
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      এসএমএস ব্রডকাস্ট প্যানেল খুলুন
                    </Link>
                  </div>

                  {/* Test Result Display */}
                  {smsTestResult && (
                    <div className={`p-4 rounded-xl text-xs space-y-1.5 border animate-in fade-in ${
                      smsTestResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}>
                      <div className="font-bold flex items-center gap-2">
                        {smsTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        )}
                        <span>{smsTestResult.message}</span>
                      </div>
                      {smsTestResult.response && (
                        <div className="text-[11px] font-mono bg-black/5 p-2 rounded-lg break-all text-slate-700">
                          <strong>গেটওয়ে রেসপন্স:</strong> {smsTestResult.response}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SettingsCard>
            </>
          )}

          {/* ━━━ TAB: DATA ━━━ */}
          {activeTab === 'data' && (
            <>
              {/* Backup / Restore Notification */}
              {backupAlert && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-sm animate-in fade-in ${
                  backupAlert.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200' 
                    : 'bg-rose-50 text-rose-950 border-rose-300 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {backupAlert.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{backupAlert.message}</span>
                  </div>
                  <button onClick={() => setBackupAlert(null)} className="text-slate-400 hover:text-slate-700 font-black cursor-pointer ml-4">✕</button>
                </div>
              )}

              {/* 🛡️ Native Disaster Recovery & Encrypted Backup Engine */}
              <DisasterRecoveryPanel />

              {/* Bulk Student Upload */}
              <SettingsCard
                title="বাল্ক শিক্ষার্থী আপলোড"
                subtitle="সিএসভি ফাইলে শিক্ষার্থীদের তথ্য একত্রে ইম্পোর্ট করুন"
                icon={<Users className="w-5 h-5" />}
                iconBg="bg-purple-50" iconColor="text-purple-600"
                badge={
                  <button
                    type="button"
                    onClick={downloadSampleCSV}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-bold transition-all shadow-sm shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-700" /> নমুনা CSV
                  </button>
                }
              >
                {/* Dropzone */}
                <div className="p-6 border-2 border-dashed border-purple-200 bg-purple-50/30 rounded-2xl text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <div>
                    <label className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-all">
                      ফাইল নির্বাচন করুন (.CSV)
                      <input
                        type="file"
                        accept=".csv, .txt, .xlsx"
                        onChange={handleCSVUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] font-medium text-slate-500 mt-2">
                      উপরে নমুনা CSV ফাইল ডাউনলোড করে নির্দেশিত কলাম অনুযায়ী তথ্য আপলোড করুন
                    </p>
                  </div>
                </div>

                {/* Import Success Message */}
                {importSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{importSuccessMsg}</span>
                    <button onClick={() => setImportSuccessMsg('')} className="ml-auto p-1 hover:bg-emerald-100 rounded-lg"><X className="w-3 h-3" /></button>
                  </div>
                )}

                {/* Parsed Students Preview */}
                {parsedStudentsList.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                        প্রাপ্ত শিক্ষার্থী: <span className="text-purple-700 font-black">{parsedStudentsList.length} জন</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveUploadedStudents}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" /> সংরক্ষণ
                      </button>
                    </div>

                    <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl text-[11px]">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-800 font-bold sticky top-0">
                          <tr>
                            <th className="p-2 border-b">রোল</th>
                            <th className="p-2 border-b">নাম</th>
                            <th className="p-2 border-b">শ্রেণি</th>
                            <th className="p-2 border-b">শাখা</th>
                            <th className="p-2 border-b">বিভাগ</th>
                            <th className="p-2 border-b">ঐচ্ছিক</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {(Array.isArray(parsedStudentsList) ? parsedStudentsList : []).map((st, i) => (
                            <tr key={i} className="hover:bg-purple-50/50">
                              <td className="p-2 font-mono font-bold">{st.roll}</td>
                              <td className="p-2 font-bold text-slate-900">{st.name}</td>
                              <td className="p-2">{st.grade}</td>
                              <td className="p-2">{st.section}</td>
                              <td className="p-2">{st.group}</td>
                              <td className="p-2 text-purple-900 font-bold">{st.optionalSubject}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </SettingsCard>

              {/* Database Clean Reset Management */}
              <SettingsCard
                title="ডেটাবেস রিসেট ও ফ্রেশ স্টার্ট"
                subtitle="সমস্ত রেকর্ড মুছে প্রতিষ্ঠানকে সম্পূর্ণ ফ্রেশ ও খালি অবস্থায় শুরু করুন"
                icon={<Trash2 className="w-5 h-5" />}
                iconBg="bg-rose-50 dark:bg-rose-950/50" iconColor="text-rose-600 dark:text-rose-400"
                borderColor="border-rose-200 dark:border-rose-800"
              >
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  সিস্টেমটিকে সম্পূর্ণ ফ্রেশ অবস্থায় শুরু করতে এবং নতুনভাবে প্রতিষ্ঠানের আসল তথ্য ইনপুট দেওয়ার জন্য নিচের বাটনটি ব্যবহার করুন।
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearDemoData}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> সমস্ত ডেটা মুছে ফ্রেশ স্টার্ট করুন
                  </button>
                </div>
              </SettingsCard>

              {/* 🌟 CARD 1: COMPLETE DATABASE JSON BACKUP */}
              <SettingsCard
                title="সম্পূর্ণ ডেটাবেস JSON ব্যাকআপ"
                subtitle="প্রতিষ্ঠানের সকল শিক্ষার্থী, শিক্ষক, ফলাফল, উপস্থিতি, হিসাব ও সেটিংস এক ক্লিকে অফলাইনে সুরক্ষিত রাখুন"
                icon={<Database className="w-5 h-5" />}
                iconBg="bg-indigo-50 dark:bg-indigo-950/70" iconColor="text-indigo-600 dark:text-indigo-400"
                borderColor="border-indigo-200 dark:border-indigo-800"
                badge={
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[11px] font-black flex items-center gap-1 shadow-2xs">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" /> ১০০% সুরক্ষিত JSON ফরম্যাট
                  </span>
                }
              >
                {/* Live Database Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10.5px] text-slate-500 font-bold block">মোট শিক্ষার্থী</span>
                    <strong className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">
                      {backupStats ? backupStats.studentsCount : 0} জন
                    </strong>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10.5px] text-slate-500 font-bold block">শিক্ষক ও স্টাফ</span>
                    <strong className="text-sm font-black text-indigo-700 dark:text-indigo-300 font-mono">
                      {backupStats ? backupStats.teachersCount : 0} জন
                    </strong>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10.5px] text-slate-500 font-bold block">নম্বর এন্ট্রি</span>
                    <strong className="text-sm font-black text-emerald-700 dark:text-emerald-300 font-mono">
                      {backupStats ? backupStats.markEntriesCount : 0} টি
                    </strong>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10.5px] text-slate-500 font-bold block">হাজিরা দিন</span>
                    <strong className="text-sm font-black text-teal-700 dark:text-teal-300 font-mono">
                      {backupStats ? backupStats.attendanceDaysCount : 0} দিন
                    </strong>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10.5px] text-slate-500 font-bold block">নোটিশ</span>
                    <strong className="text-sm font-black text-rose-700 dark:text-rose-300 font-mono">
                      {backupStats ? backupStats.noticesCount : 0} টি
                    </strong>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                    <span className="text-[10.5px] text-slate-500 font-bold block">ডেটাবেস সাইজ</span>
                    <strong className="text-sm font-black text-purple-700 dark:text-purple-300 font-mono">
                      {backupStats ? `${backupStats.totalSizeKb} KB` : '...'}
                    </strong>
                  </div>
                </div>

                {/* Primary Action Box */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-md border border-indigo-700/60">
                  <div className="space-y-1.5 max-w-xl">
                    <h4 className="text-base font-black flex items-center gap-2">
                      <Download className="w-5 h-5 text-sky-400" />
                      এক ক্লিকে সম্পূর্ণ ডেটাবেস JSON ফাইল ডাউনলোড
                    </h4>
                    <p className="text-xs text-indigo-200 leading-relaxed font-normal">
                      প্রতিষ্ঠানের সকল সাধারণ তথ্য, ছাত্র-ছাত্রী তালিকা, ২০২৬ শিক্ষাবর্ষের বিষয়ভিত্তিক ফলাফল ও মার্কশিট, দৈনিক হাজিরা, শিক্ষক বণ্টন ও নোটিশসমূহ একটি একক JSON ফাইলে ডাউনলোড হবে।
                    </p>
                    {backupStats?.lastBackup && (
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-300 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>সর্বশেষ ব্যাকআপ: {backupStats.lastBackup.dateBangla} ({backupStats.lastBackup.sizeKb} KB)</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadFullBackup}
                    disabled={isBackingUp}
                    className="w-full md:w-auto px-6 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Download className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                    <span>{isBackingUp ? 'ব্যাকআপ তৈরি হচ্ছে...' : 'সম্পূর্ণ ডেটাবেস JSON ডাউনলোড'}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>গুরুত্বপূর্ণ সুরক্ষা পরামর্শ:</strong> নতুন পরীক্ষা শুরু, বার্ষিক ফলাফল প্রস্তুত কিংবা ব্রাউজার হিস্ট্রি বা উইন্ডোজ সেটআপ দেওয়ার পূর্বে অবশ্যই এই JSON ব্যাকআপ ফাইলটি ডাউনলোড করে একটি নিরাপদ পেনড্রাইভ বা গুগল ড্রাইভে সংরক্ষণ করুন।
                  </div>
                </div>
              </SettingsCard>

              {/* 🌟 CARD 2: RESTORE DATABASE FROM JSON BACKUP */}
              <SettingsCard
                title="JSON ব্যাকআপ থেকে ডেটাবেস রিস্টোর"
                subtitle="পূর্বে ডাউনলোড করা যেকোনো JSON ব্যাকআপ ফাইল নির্বাচন করে সমস্ত ডেটা নিমিষে ফিরিয়ে আনুন"
                icon={<RefreshCw className="w-5 h-5" />}
                iconBg="bg-teal-50 dark:bg-teal-950/70" iconColor="text-teal-600 dark:text-teal-400"
                borderColor="border-teal-200 dark:border-teal-800"
              >
                <div className="p-6 border-2 border-dashed border-teal-300/80 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20 rounded-2xl text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-lg cursor-pointer transition-all active:scale-95">
                      <Upload className="w-4 h-4" /> JSON ব্যাকআপ ফাইল নির্বাচন করুন
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleJSONFileSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2">
                      শুধুমাত্র .json ফরম্যাটের বৈধ ব্যাকআপ ফাইল নির্বাচন করুন
                    </p>
                  </div>
                </div>

                {/* Confirmation & Inspection Box */}
                {restoreConfirmOpen && restoreValidation && restoreValidation.preview && (
                  <div className="p-5 bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl space-y-4 shadow-xl animate-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
                          ব্যাকআপ ফাইল বিশ্লেষণ সম্পন্ন — রিস্টোর অনুমোদন দিন
                        </h4>
                      </div>
                      <button 
                        type="button"
                        onClick={() => { setRestoreConfirmOpen(false); setRestoreValidation(null); }}
                        className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-slate-400 font-bold block text-[10px]">প্রতিষ্ঠানের নাম</span>
                        <strong className="text-slate-900 dark:text-slate-100 block truncate">{restoreValidation.preview.schoolName}</strong>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-slate-400 font-bold block text-[10px]">ব্যাকআপের সময়</span>
                        <strong className="text-slate-900 dark:text-slate-100 block text-[11px]">{restoreValidation.preview.exportDateBangla}</strong>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-slate-400 font-bold block text-[10px]">অন্তর্ভুক্ত শিক্ষার্থী</span>
                        <strong className="text-indigo-600 dark:text-indigo-400 block font-mono">{restoreValidation.preview.studentsCount} জন</strong>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-slate-400 font-bold block text-[10px]">ডেটা টেবিল কি</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 block font-mono">{restoreValidation.preview.totalKeys} টি কি</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        <strong>সতর্কতা:</strong> রিস্টোর নিশ্চিত করলে বর্তমান ব্রাউজারের সকল তথ্য এই ব্যাকআপ ফাইলের তথ্য দ্বারা সফলভাবে হালনাগাদ হবে।
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => { setRestoreConfirmOpen(false); setRestoreValidation(null); }}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        বাতিল করুন
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteRestore}
                        disabled={isRestoring}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isRestoring ? 'রিস্টোর সম্পন্ন হচ্ছে...' : 'নিশ্চিত করুন ও সম্পূর্ণ রিস্টোর করুন'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </SettingsCard>
            </>
          )}

          {/* ━━━ TAB: SYSTEM ━━━ */}
          {activeTab === 'system' && (
            <>
              {/* Language & Translation Control Card */}
              <SettingsCard
                title={currentLang === 'en' ? 'Language & Translation Control' : 'ভাষা ও আন্তর্জাতিকীকরণ নিয়ন্ত্রণ'}
                subtitle={currentLang === 'en' ? 'Set the default system language for dashboard, forms and reports' : 'সম্পূর্ণ সাইটের ডিফল্ট ভাষা নির্ধারণ ও পরিবর্তন করুন'}
                icon={<Globe className="w-5 h-5" />}
                iconBg="bg-indigo-50" iconColor="text-indigo-600"
              >
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-black text-slate-800 block">
                        {currentLang === 'en' ? 'Active System Language' : 'সক্রিয় সিস্টেম ভাষা'}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {currentLang === 'en' 
                          ? 'Controls navigation menu, headers, form labels, and dashboard summaries' 
                          : 'মেন্যু, হেডার, ফিল্ড লেবেল ও রিপোর্টসমূহ নির্বাচিত ভাষায় প্রদর্শিত হবে'}
                      </p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-300 shadow-sm shrink-0">
                      <button
                        type="button"
                        onClick={() => handleGlobalLanguageChange('bn')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          currentLang === 'bn'
                            ? 'bg-indigo-600 text-white shadow-md font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🇧🇩 বাংলা
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGlobalLanguageChange('en')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          currentLang === 'en'
                            ? 'bg-indigo-600 text-white shadow-md font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🇬🇧 English
                      </button>
                    </div>
                  </div>
                </div>
              </SettingsCard>

            <SettingsCard
              title={currentLang === 'en' ? 'System Information & Diagnostics' : 'সিস্টেম তথ্য ও স্ট্যাটাস'}
              subtitle={currentLang === 'en' ? 'Software version, statistics & diagnostics' : 'সফটওয়্যার সংস্করণ, পরিসংখ্যান ও ডায়াগনোস্টিকস'}
              icon={<Cpu className="w-5 h-5" />}
              iconBg="bg-sky-50" iconColor="text-sky-600"
            >
              {/* System Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'সফটওয়্যার সংস্করণ', value: 'v2.0.0', icon: <Zap className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'মোট শিক্ষার্থী', value: `${totalStudents} জন`, icon: <Users className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'ডাটা স্টোরেজ', value: 'LocalStorage', icon: <HardDrive className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'ফ্রেমওয়ার্ক', value: 'Next.js 16', icon: <Cpu className="w-4 h-4" />, color: 'text-sky-600', bg: 'bg-sky-50' },
                ].map((stat, idx) => (
                  <div key={idx} className={`p-4 ${stat.bg} rounded-xl border border-opacity-30 space-y-2`}>
                    <div className={`${stat.color}`}>{stat.icon}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
                    <div className="text-sm font-black text-slate-900">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Feature List */}
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> সিস্টেম মডিউলসমূহ
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'ড্যাশবোর্ড', 'শিক্ষার্থী তালিকা', 'ভর্তি ফর্ম', 'পরীক্ষা ও নম্বর',
                    'ফিনান্স ও ফি', 'নোটিশ বোর্ড', 'উপবৃত্তি', 'শিক্ষক প্যানেল',
                    'একাডেমিক', 'সেটিংস', 'মোবাইল অ্যাপ', 'এইচআর'
                  ].map((mod, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {mod}
                    </div>
                  ))}
                </div>
              </div>

              {/* EIIN Copy Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-[11px] font-black text-slate-600 uppercase tracking-wider">প্রতিষ্ঠানের সংক্ষিপ্ত তথ্য</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block">প্রতিষ্ঠান</span>
                    <span className="font-black text-slate-900 text-sm">{formData.schoolName}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block">EIIN</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 text-sm">{formData.eiin}</span>
                      <button onClick={handleCopyEIIN} className="p-1 hover:bg-slate-100 rounded-md transition-colors">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block">স্থাপিত</span>
                    <span className="font-mono font-black text-slate-900 text-sm">{formData.estdYear} খ্রি.</span>
                  </div>
                </div>
              </div>

              {/* Developer Credits */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl space-y-1">
                <div className="text-[11px] font-black text-indigo-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> ডেভেলপমেন্ট ও টেকনোলজি
                </div>
                <p className="text-[10.5px] text-indigo-700 leading-relaxed">
                  স্কুল ম্যানেজমেন্ট সিস্টেম v2.0 — Next.js 16, React 19, Tailwind CSS ও LocalStorage ভিত্তিক।
                  সকল মডিউল সম্পূর্ণ বাংলায় ডিজাইন করা হয়েছে এবং প্রিন্টের জন্য অপ্টিমাইজড।
                </p>
              </div>
            </SettingsCard>
            </>
          )}

        </div>

        {/* ─── RIGHT SIDEBAR: LIVE PREVIEW (For Other Tabs) ─── */}
        <div className="xl:col-span-4 2xl:col-span-3 space-y-6">
          <div className="sticky top-6 space-y-4">

            {/* Live Marksheet Preview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                  <Printer className="w-3.5 h-3.5" /> লাইভ মার্কশিট প্রিভিউ
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-bold border border-emerald-100 animate-pulse">
                  ● LIVE
                </span>
              </div>

              {/* Preview Container */}
              <div className="bg-white p-4 border border-slate-300 rounded-none relative overflow-hidden font-sans text-slate-950">
                {/* Watermark */}
                {formData.showWatermark && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                    style={{ opacity: formData.watermarkOpacity * 2.5 }}
                  >
                    {formData.schoolLogo ? (
                      <img src={formData.schoolLogo} alt="Watermark" className="w-[140px] h-[140px] object-contain grayscale" />
                    ) : (
                      <div className="w-[120px] h-[120px] flex flex-col items-center justify-center text-slate-950">
                        <span className="text-amber-500 text-2xl font-bold">★</span>
                        <span className="text-xl font-black tracking-tighter">BHS</span>
                        <span className="text-[10px] font-bold text-slate-700">{formData.estdYear}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Header */}
                <div className="relative z-10 space-y-1 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-9 h-9 flex flex-col items-center justify-center text-slate-950 overflow-hidden shrink-0">
                      {formData.schoolLogo ? (
                        <img src={formData.schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-8 h-8 rounded-full border border-slate-950 flex flex-col items-center justify-center">
                          <span className="text-amber-500 text-[7px] font-bold">★</span>
                          <span className="text-[6px] font-black tracking-tighter text-slate-950">BHS</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-[13px] font-black text-slate-950 leading-tight">
                      {formData.schoolName || 'প্রতিষ্ঠানের নাম'}
                    </h3>
                  </div>

                  <p className="text-[9px] font-bold text-slate-800">{formData.address || 'প্রতিষ্ঠানের ঠিকানা'}</p>
                  <p className="text-[8px] font-bold text-slate-700 font-mono">
                    স্থাপিত: {formData.estdYear || '1969'} খ্রি. । EIIN: {formData.eiin || '106184'}
                  </p>

                  <div className="w-full border-b border-slate-950 my-1"></div>

                  <div className="text-center space-y-0.5 pt-0.5">
                    <div className="text-[9px] font-black uppercase text-slate-950">একাডেমিক ট্রান্সক্রিপ্ট / নম্বরপত্র</div>
                    <span className="inline-block px-3 py-0.5 bg-slate-950 text-white font-black text-[8px] uppercase tracking-wider">
                      {(Array.isArray(examNames) && examNames[0]) || 'অর্ধ-বার্ষিক পরীক্ষা'} {currentSession}
                    </span>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="pt-6 flex justify-between text-[8px] font-bold border-t border-slate-300 mt-4 relative z-10">
                  <div>
                    <div className="w-14 border-b border-slate-950 mb-0.5"></div>
                    <span>{formData.classTeacherTitle}</span>
                  </div>
                  <div className="text-right">
                    <div className="w-14 border-b border-slate-950 mb-0.5 ml-auto"></div>
                    <span className="font-black">{formData.principalTitle}</span>
                    {formData.principalName && (
                      <div className="text-[7px] font-normal text-slate-600">({formData.principalName})</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Auto Sync Info */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] font-medium text-indigo-900/90 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-900 text-[10px]">
                  <Info className="w-3.5 h-3.5 text-indigo-600" /> অটোমেটিক সিঙ্ক:
                </div>
                <p className="leading-relaxed">
                  সংরক্ষিত তথ্য মার্কশিট, ট্যাবুলেশন ও অন্যান্য প্রিন্ট মডিউলে রিয়েল-টাইমে আপডেট হয়।
                </p>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> সেটিংস সংরক্ষণ করুন
              </button>
            </div>

            {/* Quick Stats Mini Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-4 rounded-2xl border border-slate-800 text-white space-y-3">
              <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> দ্রুত পরিসংখ্যান
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">মোট শিক্ষার্থী</span>
                  <span className="font-black text-white">{totalStudents}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">EIIN</span>
                  <span className="font-mono font-black text-indigo-300">{formData.eiin}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">সেশন</span>
                  <span className="font-black text-emerald-400">{currentSession}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">ওয়াটারমার্ক</span>
                  <span className={`font-black ${formData.showWatermark ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formData.showWatermark ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      )}

      {/* ─── COMMITTEE MEMBER ADD/EDIT MODAL ─── */}
      {isCommitteeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsCommitteeModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {editingMember ? 'কমিটির সদস্য তথ্য সম্পাদনা' : 'নতুন কমিটির সদস্য যোগ'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-snug">
                    সদস্যের তথ্য পূরণ করে সংরক্ষণ করুন, সরাসরি মূল ওয়েবসাইটে আপডেট হবে
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCommitteeModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveCommitteeMember} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    সদস্যের নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={committeeForm.name || ''}
                    onChange={(e) => setCommitteeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="যেমন: আলহাজ্ব মোস্তফা কামাল"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>পদবি / দায়িত্ব <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-emerald-600 font-normal">নিচের তালিকা থেকে নির্বাচন করুন বা টাইপ করুন</span>
                  </label>
                  
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {[
                      'সভাপতি',
                      'সহ-সভাপতি',
                      'ক্যাশিয়ার (অর্থ সম্পাদক)',
                      'সেক্রেটারী (সদস্য সচিব)',
                      'অভিভাবক সদস্য',
                      'শিক্ষক প্রতিনিধি',
                      'প্রতিষ্ঠাতা সদস্য',
                      'বিদ্যোৎসাহী সদস্য',
                      'দাতা সদস্য'
                    ].map((presetRole) => (
                      <button
                        key={presetRole}
                        type="button"
                        onClick={() => {
                          setCommitteeForm(prev => ({
                            ...prev,
                            role: presetRole,
                            badgeColor: getRoleBadgeColor(presetRole)
                          }));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          committeeForm.role === presetRole
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        {presetRole}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={committeeForm.role || ''}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setCommitteeForm(prev => ({
                        ...prev,
                        role: newRole,
                        badgeColor: getRoleBadgeColor(newRole)
                      }));
                    }}
                    placeholder="যেমন: সভাপতি"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">মেয়াদকাল</label>
                  <input
                    type="text"
                    value={committeeForm.tenure || ''}
                    onChange={(e) => setCommitteeForm(prev => ({ ...prev, tenure: e.target.value }))}
                    placeholder="যেমন: ২০২৪ – ২০২৬ খ্রিঃ (৩ বছর)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">যোগদানের তারিখ</label>
                  <input
                    type="text"
                    value={committeeForm.joiningDate || ''}
                    onChange={(e) => setCommitteeForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                    placeholder="যেমন: ০১ জানুয়ারি ২০২৪"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={committeeForm.phone || ''}
                    onChange={(e) => setCommitteeForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="যেমন: +880 1712-345678"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">ইমেইল এড্রেস</label>
                  <input
                    type="email"
                    value={committeeForm.email || ''}
                    onChange={(e) => setCommitteeForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="যেমন: member@school.edu.bd"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Photo Upload & URL */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>সদস্যের ছবি</span>
                  <span className="text-[10px] text-slate-500">কম্পিউটার/মোবাইল থেকে আপলোড করুন বা লিংক দিন</span>
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-white flex items-center justify-center shrink-0 shadow-xs">
                    {committeeForm.photo ? (
                      <img
                        src={committeeForm.photo}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=500&auto=format&fit=crop';
                        }}
                      />
                    ) : (
                      <Users className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>ছবি আপলোড করুন</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMemberPhotoUpload}
                          className="hidden"
                        />
                      </label>
                      {committeeForm.photo && (
                        <button
                          type="button"
                          onClick={() => setCommitteeForm(prev => ({ ...prev, photo: '' }))}
                          className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all"
                        >
                          ছবি মুছুন
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={committeeForm.photo || ''}
                      onChange={(e) => setCommitteeForm(prev => ({ ...prev, photo: e.target.value }))}
                      placeholder="অথবা সরাসরি ছবির ওয়েব লিংক পেস্ট করুন"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bio Statement */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">সংক্ষিপ্ত পরিচিতি ও বক্তব্য (Bio / Statement)</label>
                <textarea
                  rows={3}
                  value={committeeForm.bio || ''}
                  onChange={(e) => setCommitteeForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="বিদ্যালয়ের উন্নয়ন ও মানসম্মত শিক্ষা সম্প্রসারণে উনার ভূমিকা বা বক্তব্য..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCommitteeModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingMember ? 'তথ্য হালনাগাদ করুন' : 'সদস্য সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── FACILITY ADD/EDIT MODAL ─── */}
      {isFacilityModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsFacilityModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 via-emerald-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {editingFacility ? 'ক্যাম্পাস সুবিধা সম্পাদনা' : 'নতুন ক্যাম্পাস সুবিধা যোগ'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-snug">
                    সুবিধার শিরোনাম, বিবরণী, আইকন ও কালার থিম নির্ধারণ করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFacilityModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveFacilityItem} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    সুবিধার বাংলা শিরোনাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={facilityForm.title || ''}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="যেমন: শেখ রাসেল ডিজিটাল ল্যাব"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ইংরেজি নাম
                  </label>
                  <input
                    type="text"
                    value={facilityForm.titleEn || ''}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, titleEn: e.target.value }))}
                    placeholder="যেমন: Sheikh Russel Digital Lab"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition font-en"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    হাইলাইট ব্যাজ / ট্যাগ
                  </label>
                  <input
                    type="text"
                    value={facilityForm.badge || ''}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="যেমন: আইসিটি ও কোডিং"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    আইকন প্রতীক
                  </label>
                  <select
                    value={facilityForm.icon || 'Monitor'}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition cursor-pointer"
                  >
                    <option value="Monitor">🖥️ কম্পিউটার / ডিজিটাল ল্যাব</option>
                    <option value="FlaskConical">🧪 বিজ্ঞানাগার / ল্যাবরেটরি</option>
                    <option value="BookOpen">📖 লাইব্রেরি / পাঠাগার</option>
                    <option value="Trophy">🏆 খেলার মাঠ / ক্রীড়া ট্রফি</option>
                    <option value="Compass">🧭 স্কাউটিং / সহশিক্ষা</option>
                    <option value="Droplet">💧 বিশুদ্ধ পানি ও স্যানিটেশন</option>
                    <option value="Microscope">🔬 মাইক্রোস্কোপ / জীববিজ্ঞান</option>
                    <option value="Laptop">💻 ল্যাপটপ ও আইসিটি</option>
                    <option value="Users">👥 ক্লাব ও সংগঠন</option>
                    <option value="Award">🏅 পুরস্কার ও মেধা অন্বেষণ</option>
                    <option value="ShieldCheck">🛡️ নিরাপত্তা ও সুরক্ষা</option>
                    <option value="Building2">🏫 ক্যাম্পাস ভবন ও অবকাঠামো</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    কালার থিম
                  </label>
                  <select
                    value={facilityForm.color || 'indigo'}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition cursor-pointer"
                  >
                    <option value="indigo">ইন্ডিগো ব্লু</option>
                    <option value="emerald">পান্না সবুজ</option>
                    <option value="amber">সোনালি হলুদ</option>
                    <option value="rose">গোলাপি লাল</option>
                    <option value="cyan">সায়ান নীল</option>
                    <option value="blue">গাঢ় নীল</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    বিস্তারিত বিবরণী <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={facilityForm.description || ''}
                    onChange={(e) => setFacilityForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="সুবিধাটির প্রধান বৈশিষ্ট্য ও সুযোগ-সুবিধা সম্পর্কে ২-৩ লাইনে লিখুন..."
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={facilityForm.visible !== false}
                      onChange={(e) => setFacilityForm((prev) => ({ ...prev, visible: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      এই সুবিধাটি মূল পাবলিক ওয়েবসাইটে সক্রিয় ও দৃশ্যমান রাখুন
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFacilityModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingFacility ? 'তথ্য হালনাগাদ করুন' : 'সুবিধা সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Delete Modal */}
      <SecurityDeleteModal
        isOpen={showSecurityDeleteModal}
        onClose={() => setShowSecurityDeleteModal(false)}
        onSuccess={handleSecurityPurgeSuccess}
        performedBy={session?.teacherName || (session?.role === 'admin' ? 'প্রধান শিক্ষক' : 'অ্যাডমিন')}
      />
    </div>
  );
}
