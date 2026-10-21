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
import PublicFooter from '@/components/public/PublicFooter';

export default function PublicSchoolHomePage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    setMounted(true);

    const loadData = () => {
      // 1. School Settings
      const currentSettings = settingsService.getSettings();
      setSettings(currentSettings);

      // 2. Landing Page Config
      const currentConfig = landingPageService.getPublishedConfig();
      setLandingConfig(currentConfig);

      // 3. Published Notices
      const allNotices = noticeService.getNotices();
      setNotices(allNotices);

      // 4. Teachers & Staff (privacy-safe public fields)
      const allTeachers = teacherAuthService.getAllTeachers();
      setTeachers(allTeachers);

      // 5. Aggregated Student count
      const allStudents = studentService.getAllStudents();
      setTotalStudents(allStudents.length);
    };

    loadData();

    // Re-sync on service updates
    const unsubSettings = settingsService.subscribe((s) => setSettings(s));
    const unsubLanding = landingPageService.subscribePublished((cfg) => setLandingConfig(cfg));
    const unsubNotices = noticeService.subscribe(() => setNotices(noticeService.getNotices()));
    const unsubStudents = studentService.subscribe(() => setTotalStudents(studentService.getAllStudents().length));

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
        return (
          <PublicStats
            key="stats"
            totalStudents={totalStudents}
            totalTeachers={teachers.length}
            estdYear={settings?.estdYear}
            statsConfig={landingConfig.stats}
          />
        );
      case 'services':
        return <PublicServicesSection key="services" />;
      case 'headmaster_message':
        return <PublicHeadmasterMessage key="headmaster_message" settings={settings} />;
      case 'about':
        return <PublicAbout key="about" settings={settings} />;
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
        return <PublicAcademicSection key="academic" />;
      case 'teachers':
        return <PublicTeachersSection key="teachers" teachers={teachers} />;
      case 'committee':
        return <PublicCommitteeSection key="committee" />;
      case 'achievers':
        return <PublicBestStudentsSection key="achievers" achieversConfig={landingConfig.achievers} />;
      case 'facilities':
        return <PublicFacilitiesSection key="facilities" />;
      case 'gallery':
        return <PublicGallerySection key="gallery" />;
      case 'blog':
        return <PublicBlogSection key="blog" blogConfig={landingConfig.blog} />;
      case 'contact':
        return <PublicContactSection key="contact" settings={settings} />;
      default:
        return null;
    }
  };

  // Sort sections by order and filter enabled ones
  const activeSections = [...landingConfig.sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Top Contact & Information Bar */}
      {landingConfig.header.showTopbar && <PublicTopBar settings={settings} />}

      {/* 2. Main Navigation Bar with Mobile Drawer */}
      <PublicNavbar settings={settings} headerConfig={landingConfig.header} />

      {/* 3. Live Notice Ticker */}
      {landingConfig.header.showNoticeTicker && (
        <PublicNoticeTicker notices={notices} onSelectNotice={(n) => setSelectedNotice(n)} />
      )}

      <main className="flex-1">
        {/* 4. Hero Section with Call to Actions */}
        {landingConfig.hero.enabled && (
          <PublicHero settings={settings} heroConfig={landingConfig.hero} />
        )}

        {/* 5. Dynamically Ordered & Enabled Sections */}
        {activeSections.map((sec) => renderSection(sec.key))}
      </main>

      {/* 15. Institutional Footer */}
      <PublicFooter settings={settings} footerConfig={landingConfig.footer} />
    </div>
  );
}
