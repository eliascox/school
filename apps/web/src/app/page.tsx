'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { noticeService, Notice } from '@/services/noticeService';
import { teacherAuthService, TeacherAccount } from '@/services/teacherAuthService';
import { studentService, Student } from '@/services/studentService';
import {
  landingPageService,
  LandingPageConfig,
  DEFAULT_LANDING_CONFIG,
} from '@/services/landingPageService';
import { firebaseSyncService, LandingPageCloudData } from '@/services/firebaseSyncService';
import {
  PublicNoticeViewItem,
  resolvePublicNotices,
} from '@/lib/publicLandingUtils';

// Public Landing Page Components
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicNoticeTicker from '@/components/public/PublicNoticeTicker';
import PublicHero from '@/components/public/PublicHero';
import PublicStats from '@/components/public/PublicStats';
import PublicHeadmasterMessage from '@/components/public/PublicHeadmasterMessage';
import PublicAbout from '@/components/public/PublicAbout';
import PublicServicesSection from '@/components/public/PublicServicesSection';
import PublicNoticesSection from '@/components/public/PublicNoticesSection';
import PublicAcademicSection from '@/components/public/PublicAcademicSection';
import PublicTeachersSection from '@/components/public/PublicTeachersSection';
import PublicCommitteeSection from '@/components/public/PublicCommitteeSection';
import PublicBestStudentsSection from '@/components/public/PublicBestStudentsSection';
import PublicFacilitiesSection from '@/components/public/PublicFacilitiesSection';
import PublicGallerySection from '@/components/public/PublicGallerySection';
import PublicBlogSection from '@/components/public/PublicBlogSection';
import PublicContactSection from '@/components/public/PublicContactSection';
import PublicFaqSection from '@/components/public/PublicFaqSection';
import PublicMobileAppSection from '@/components/public/PublicMobileAppSection';
import PublicFooter from '@/components/public/PublicFooter';
import {
  ScrollRevealSection,
  LandingScrollFeatures,
  RevealVariant,
} from '@/components/public/ScrollRevealSection';

const SECTION_REVEAL_VARIANTS: Record<string, RevealVariant> = {
  stats: 'fade-scale',
  services: 'fade-up',
  headmaster_message: 'fade-up',
  about: 'fade-up',
  notices: 'fade-up',
  academic: 'fade-scale',
  teachers: 'fade-up',
  committee: 'fade-scale',
  achievers: 'fade-up',
  facilities: 'fade-up',
  gallery: 'fade-scale',
  blog: 'fade-up',
  contact: 'fade-up',
  faq: 'fade-up',
  mobile_app: 'fade-scale',
};

export default function PublicSchoolHomePage() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [selectedNotice, setSelectedNotice] = useState<PublicNoticeViewItem | null>(null);

  useEffect(() => {
    const loadData = () => {
      const currentSettings = settingsService.getSettings();
      setSettings(currentSettings);

      landingPageService.syncWithSchoolSettings(currentSettings);
      const currentConfig = landingPageService.getPublishedConfig();
      setLandingConfig(currentConfig);

      const allNotices = noticeService.getNotices();
      setNotices(allNotices);

      const allTeachers = teacherAuthService.getAllTeachers();
      setTeachers(allTeachers);

      const allStudents = studentService.getAllStudents();
      setStudents(allStudents);
      setTotalStudents(allStudents.length);
    };

    loadData();

    const applyCloudData = (cloudData: LandingPageCloudData) => {
      if (cloudData.settings) {
        setSettings((prev) => ({ ...(prev || {}), ...cloudData.settings } as SchoolSettings));
      }
      if (cloudData.landingConfig) {
        setLandingConfig(cloudData.landingConfig);
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('sms_landing_published', JSON.stringify(cloudData.landingConfig));
          }
        } catch {}
      }
      if (cloudData.notices && cloudData.notices.length > 0) {
        setNotices(cloudData.notices);
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('sms_notices', JSON.stringify(cloudData.notices));
          }
        } catch {}
      }
      if (cloudData.teachers && cloudData.teachers.length > 0) {
        setTeachers(cloudData.teachers);
      }
      if (typeof cloudData.totalStudents === 'number' && cloudData.totalStudents > 0) {
        setTotalStudents(cloudData.totalStudents);
      }
    };

    firebaseSyncService
      .fetchLandingPageCloudData()
      .then((cloudData) => applyCloudData(cloudData))
      .catch((err) => {
        console.warn('[LandingPage] Cloud sync fetch fallback to local:', err);
      });

    const unsubCloud = firebaseSyncService.subscribeLandingPageCloud((cloudUpdate) => {
      applyCloudData(cloudUpdate);
    });

    const unsubSettings = settingsService.subscribe((s) => setSettings(s));
    const unsubLanding = landingPageService.subscribePublished((cfg) => setLandingConfig(cfg));
    const unsubNotices = noticeService.subscribe(() => setNotices(noticeService.getNotices()));
    const unsubStudents = studentService.subscribe(() => {
      const allStudents = studentService.getAllStudents();
      setStudents(allStudents);
      setTotalStudents(allStudents.length);
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadData);
    }

    return () => {
      unsubCloud();
      unsubSettings();
      unsubLanding();
      unsubNotices();
      unsubStudents();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', loadData);
      }
    };
  }, []);

  // Unified notices list shared between Notice Ticker & Notice Board
  const resolvedPublicNotices = useMemo(() => resolvePublicNotices(notices), [notices]);
  const resolvedSchoolName =
    settings?.schoolName?.trim() || landingConfig.header.schoolName || 'বরইতলী উচ্চ বিদ্যালয়';

  const renderSection = (secKey: string) => {
    switch (secKey) {
      case 'stats':
        if (landingConfig.stats && landingConfig.stats.enabled === false) return null;
        return (
          <PublicStats
            key="stats"
            totalStudents={totalStudents}
            totalTeachers={teachers.length}
            estdYear={settings?.estdYear}
            statsConfig={landingConfig.stats}
            students={students}
            schoolName={resolvedSchoolName}
            settings={settings}
            schoolCode={landingConfig.footer?.schoolCode}
          />
        );
      case 'services':
        if (landingConfig.services && landingConfig.services.enabled === false) return null;
        return <PublicServicesSection key="services" servicesConfig={landingConfig.services} />;
      case 'headmaster_message':
        return (
          <PublicHeadmasterMessage
            key="headmaster_message"
            settings={settings}
            aboutConfig={landingConfig.about}
          />
        );
      case 'about':
        if (landingConfig.about && landingConfig.about.enabled === false) return null;
        return <PublicAbout key="about" settings={settings} aboutConfig={landingConfig.about} />;
      case 'notices':
        return (
          <PublicNoticesSection
            key="notices"
            notices={resolvedPublicNotices}
            selectedNotice={selectedNotice}
            onSelectNotice={(n) => setSelectedNotice(n)}
            schoolName={resolvedSchoolName}
          />
        );
      case 'academic':
        return <PublicAcademicSection key="academic" academicConfig={landingConfig.academic} />;
      case 'teachers':
        return <PublicTeachersSection key="teachers" teachers={teachers} />;
      case 'committee':
        return (
          <PublicCommitteeSection
            key="committee"
            committeeMembers={settings?.committeeMembers}
          />
        );
      case 'achievers':
        return (
          <PublicBestStudentsSection
            key="achievers"
            achieversConfig={landingConfig.achievers}
            students={students}
          />
        );
      case 'facilities':
        return (
          <PublicFacilitiesSection
            key="facilities"
            facilitiesConfig={landingConfig.facilities}
          />
        );
      case 'gallery':
        return <PublicGallerySection key="gallery" galleryConfig={landingConfig.gallery} />;
      case 'blog':
        return <PublicBlogSection key="blog" blogConfig={landingConfig.blog} />;
      case 'contact':
        return (
          <PublicContactSection
            key="contact"
            settings={settings}
            contactConfig={landingConfig.contact}
            footerConfig={landingConfig.footer}
          />
        );
      case 'faq':
        return <PublicFaqSection key="faq" faqConfig={landingConfig.faq} />;
      case 'mobile_app':
        if (landingConfig.mobileApp && landingConfig.mobileApp.enabled === false) return null;
        return (
          <PublicMobileAppSection
            key="mobile_app"
            appConfig={landingConfig.mobileApp}
            settings={settings}
          />
        );
      default:
        return null;
    }
  };

  const activeSections = (landingConfig.sections || [])
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="landing-smooth-root min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-[#0B5D3B] selection:text-white relative overflow-x-clip">
      <LandingScrollFeatures />

      <PublicNavbar
        settings={settings}
        headerConfig={landingConfig.header}
        isOverHero={landingConfig.hero.enabled}
      />

      <main className="flex-1">
        {landingConfig.hero.enabled && (
          <PublicHero settings={settings} heroConfig={landingConfig.hero} />
        )}

        {landingConfig.header.showNoticeTicker !== false && resolvedPublicNotices.length > 0 && (
          <PublicNoticeTicker
            notices={resolvedPublicNotices}
            onSelectNotice={(n) => setSelectedNotice(n)}
          />
        )}

        {activeSections.map((sec) => {
          const content = renderSection(sec.key);
          if (!content) return null;
          return (
            <ScrollRevealSection
              key={sec.key}
              sectionKey={sec.key}
              variant={SECTION_REVEAL_VARIANTS[sec.key] || 'fade-up'}
            >
              {content}
            </ScrollRevealSection>
          );
        })}

        {!activeSections.some((s) => s.key === 'mobile_app') &&
          landingConfig.mobileApp?.enabled !== false && (
            <ScrollRevealSection sectionKey="mobile_app_fallback" variant="fade-scale">
              <PublicMobileAppSection
                appConfig={landingConfig.mobileApp}
                settings={settings}
              />
            </ScrollRevealSection>
          )}
      </main>

      <PublicFooter
        settings={settings}
        footerConfig={landingConfig.footer}
        contactConfig={landingConfig.contact}
        lastUpdatedAt={
          landingConfig.lastUpdatedAt || (settings as { updatedAt?: unknown } | null)?.updatedAt
        }
      />
    </div>
  );
}
