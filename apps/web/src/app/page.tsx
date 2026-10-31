'use client';

import React, { useState, useEffect } from 'react';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { noticeService, Notice } from '@/services/noticeService';
import { teacherAuthService, TeacherAccount } from '@/services/teacherAuthService';
import { studentService } from '@/services/studentService';
import { landingPageService, LandingPageConfig, DEFAULT_LANDING_CONFIG } from '@/services/landingPageService';

// Public Landing Page Components
import PublicTopBar from '@/components/public/PublicTopBar';
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
import { ScrollRevealSection, LandingScrollFeatures, RevealVariant } from '@/components/public/ScrollRevealSection';

const SECTION_REVEAL_VARIANTS: Record<string, RevealVariant> = {
  stats: 'fade-scale',
  services: 'fade-up',
  headmaster_message: 'slide-right',
  about: 'slide-left',
  notices: 'fade-up',
  academic: 'fade-scale',
  teachers: 'fade-up',
  committee: 'fade-scale',
  achievers: 'blur-up',
  facilities: 'fade-up',
  gallery: 'fade-scale',
  blog: 'fade-up',
  contact: 'slide-right',
  faq: 'fade-up',
  mobile_app: 'fade-scale',
};

export default function PublicSchoolHomePage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return settingsService.getSettings();
      } catch (e) {}
    }
    return null;
  });
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        return landingPageService.getPublishedConfig();
      } catch (e) {}
    }
    return DEFAULT_LANDING_CONFIG;
  });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    setMounted(true);

    const loadData = () => {
      // 1. School Settings
      const currentSettings = settingsService.getSettings();
      setSettings(currentSettings);

      // 2. Auto-sync Landing Page Config with School Settings
      landingPageService.syncWithSchoolSettings(currentSettings);
      const currentConfig = landingPageService.getPublishedConfig();
      setLandingConfig(currentConfig);

      // 3. Published Notices
      const allNotices = noticeService.getNotices();
      setNotices(allNotices);

      // 4. Teachers & Staff (privacy-safe public fields)
      const allTeachers = teacherAuthService.getAllTeachers();
      setTeachers(allTeachers);

      // 5. Aggregated Student count & List
      const allStudents = studentService.getAllStudents();
      setStudents(allStudents);
      setTotalStudents(allStudents.length);
    };

    loadData();

    // Re-sync on service updates
    const unsubSettings = settingsService.subscribe((s) => {
      setSettings(s);
      landingPageService.syncWithSchoolSettings(s);
    });
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
      unsubSettings();
      unsubLanding();
      unsubNotices();
      unsubStudents();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', loadData);
      }
    };
  }, []);

  // Section Renderer Function mapped by key
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
            schoolName={settings?.schoolName || landingConfig.header.schoolName}
          />
        );
      case 'services':
        if (landingConfig.services && landingConfig.services.enabled === false) return null;
        return <PublicServicesSection key="services" servicesConfig={landingConfig.services} />;
      case 'headmaster_message':
        return <PublicHeadmasterMessage key="headmaster_message" settings={settings} aboutConfig={landingConfig.about} />;
      case 'about':
        if (landingConfig.about && landingConfig.about.enabled === false) return null;
        return <PublicAbout key="about" settings={settings} aboutConfig={landingConfig.about} />;
      case 'notices':
        return (
          <PublicNoticesSection
            key="notices"
            notices={notices}
            selectedNotice={selectedNotice}
            onSelectNotice={(n) => setSelectedNotice(n)}
          />
        );
      case 'academic':
        return <PublicAcademicSection key="academic" academicConfig={landingConfig.academic} />;
      case 'teachers':
        return <PublicTeachersSection key="teachers" teachers={teachers} />;
      case 'committee':
        return <PublicCommitteeSection key="committee" committeeMembers={settings?.committeeMembers} />;
      case 'achievers':
        return <PublicBestStudentsSection key="achievers" achieversConfig={landingConfig.achievers} students={students} />;
      case 'facilities':
        return <PublicFacilitiesSection key="facilities" facilitiesConfig={landingConfig.facilities} />;
      case 'gallery':
        return <PublicGallerySection key="gallery" galleryConfig={landingConfig.gallery} />;
      case 'blog':
        return <PublicBlogSection key="blog" blogConfig={landingConfig.blog} />;
      case 'contact':
        return <PublicContactSection key="contact" settings={settings} />;
      case 'faq':
        return <PublicFaqSection key="faq" faqConfig={landingConfig.faq} />;
      case 'mobile_app':
        if (landingConfig.mobileApp && landingConfig.mobileApp.enabled === false) return null;
        return <PublicMobileAppSection key="mobile_app" appConfig={landingConfig.mobileApp} settings={settings} />;
      default:
        return null;
    }
  };

  // Sort sections by order and filter enabled ones
  const activeSections = (landingConfig.sections || [])
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="landing-smooth-root min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      {/* 0. Smooth Scroll Progress Bar & Floating Back-to-Top Orb */}
      <LandingScrollFeatures />

      {/* 1. Main Navigation Bar with Glass Effect directly over Hero Image */}
      <PublicNavbar 
        settings={settings} 
        headerConfig={landingConfig.header} 
        isOverHero={landingConfig.hero.enabled} 
      />

      <main className="flex-1">
        {/* 2. Hero Section with Campus Photo starting at top: 0 behind Floating Navbar */}
        {landingConfig.hero.enabled && (
          <PublicHero settings={settings} heroConfig={landingConfig.hero} />
        )}

        {/* 3. Live Notice Ticker below Hero Section */}
        {landingConfig.header.showNoticeTicker && notices.length > 0 && (
          <PublicNoticeTicker notices={notices} onSelectNotice={(n) => setSelectedNotice(n)} />
        )}

        {/* 4. Dynamically Ordered & Enabled Sections with Smooth Scroll Reveal & Staggered Cards */}
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

        {/* 5. Mobile App Download Section Fallback (if not already included in activeSections) */}
        {!activeSections.some((s) => s.key === 'mobile_app') && landingConfig.mobileApp?.enabled !== false && (
          <ScrollRevealSection sectionKey="mobile_app_fallback" variant="fade-scale">
            <PublicMobileAppSection appConfig={landingConfig.mobileApp} settings={settings} />
          </ScrollRevealSection>
        )}
      </main>

      {/* Institutional Footer */}
      <ScrollRevealSection sectionKey="footer" variant="fade-up">
        <PublicFooter settings={settings} footerConfig={landingConfig.footer} />
      </ScrollRevealSection>
    </div>
  );
}
