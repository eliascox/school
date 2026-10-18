'use client';

import React, { useState, useEffect } from 'react';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { noticeService, Notice } from '@/services/noticeService';
import { teacherAuthService, TeacherAccount } from '@/services/teacherAuthService';
import { studentService } from '@/services/studentService';

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
import PublicFacilitiesSection from '@/components/public/PublicFacilitiesSection';
import PublicGallerySection from '@/components/public/PublicGallerySection';
import PublicContactSection from '@/components/public/PublicContactSection';
import PublicFooter from '@/components/public/PublicFooter';

export default function PublicSchoolHomePage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
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

      // 2. Published Notices
      const allNotices = noticeService.getNotices();
      setNotices(allNotices);

      // 3. Teachers & Staff (privacy-safe public fields)
      const allTeachers = teacherAuthService.getAllTeachers();
      setTeachers(allTeachers);

      // 4. Aggregated Student count
      const allStudents = studentService.getAllStudents();
      setTotalStudents(allStudents.length);
    };

    loadData();

    // Re-sync on service updates
    const unsubSettings = settingsService.subscribe((s) => setSettings(s));
    const unsubNotices = noticeService.subscribe(() => setNotices(noticeService.getNotices()));
    const unsubStudents = studentService.subscribe(() => setTotalStudents(studentService.getAllStudents().length));

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', loadData);
    }

    return () => {
      unsubSettings();
      unsubNotices();
      unsubStudents();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', loadData);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Top Contact & Information Bar */}
      <PublicTopBar settings={settings} />

      {/* 2. Main Navigation Bar with Mobile Drawer */}
      <PublicNavbar settings={settings} />

      {/* 3. Live Notice Ticker */}
      <PublicNoticeTicker notices={notices} onSelectNotice={(n) => setSelectedNotice(n)} />

      <main className="flex-1">
        {/* 4. Hero Section with Call to Actions */}
        <PublicHero settings={settings} />

        {/* 5. Live Verified Statistics Counter */}
        <PublicStats
          totalStudents={totalStudents}
          totalTeachers={teachers.length}
          estdYear={settings?.estdYear}
        />

        {/* 6. Quick Online Services Grid (Admission, Result, Certificate, Portals) */}
        <PublicServicesSection />

        {/* 7. Headmaster's Welcome Message */}
        <PublicHeadmasterMessage settings={settings} />

        {/* 8. About School: History, Mission, Vision, and Values */}
        <PublicAbout settings={settings} />

        {/* 9. Dynamic Notice Board with Category Filter */}
        <PublicNoticesSection
          notices={notices}
          selectedNotice={selectedNotice}
          onSelectNotice={(n) => setSelectedNotice(n)}
        />

        {/* 10. Academic Curriculum & Streams (Class 6-10, Science, Arts, Commerce) */}
        <PublicAcademicSection />

        {/* 11. Teachers & Staff Directory (Privacy-Safe Public Profile) */}
        <PublicTeachersSection teachers={teachers} />

        {/* 12. Campus Facilities (ICT Lab, Science Lab, Library, Playground) */}
        <PublicFacilitiesSection />

        {/* 13. Photo Gallery */}
        <PublicGallerySection />

        {/* 14. Contact Information & Message Form */}
        <PublicContactSection settings={settings} />
      </main>

      {/* 15. Institutional Footer */}
      <PublicFooter settings={settings} />
    </div>
  );
}
