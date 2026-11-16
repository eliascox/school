'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutTemplate,
  Eye,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  landingPageService,
  LandingPageConfig,
  SectionItem,
  HeroSlide,
  AchieverStudent,
  MediaItem,
  VersionSnapshot,
  DEFAULT_LANDING_CONFIG,
  GalleryMediaItem,
} from '@/services/landingPageService';
import { studentService, Student } from '@/services/studentService';
import { settingsService } from '@/services/settingsService';
import { compressImage } from '@/lib/imageUtils';
import { confirmDialog } from '@/components/ui/ToastProvider';
import {
  ActiveTab,
  LANDING_ADMIN_TABS,
} from '@/components/landing-admin/landingAdminShared';
import {
  LandingOverviewTab,
  LandingSectionsTab,
} from '@/components/landing-admin/OverviewAndSectionsTabs';
import {
  LandingHeaderTab,
  LandingHeroTab,
} from '@/components/landing-admin/HeaderAndHeroTabs';
import {
  LandingAboutTab,
  LandingFeaturesTab,
  LandingStatsTab,
  LandingAcademicTab,
} from '@/components/landing-admin/AboutFeaturesStatsTabs';
import {
  LandingAchieversTab,
  LandingGalleryTab,
} from '@/components/landing-admin/AchieversAndGalleryTabs';
import {
  LandingBlogTab,
  LandingFaqTab,
  LandingMediaTab,
} from '@/components/landing-admin/ContentAndMediaTabs';
import {
  LandingThemeTab,
  LandingFooterTab,
  LandingSeoTab,
  LandingHistoryTab,
  LandingAdminModals,
} from '@/components/landing-admin/DesignFooterHistoryTabs';

export default function LandingPageManagementDashboard() {
  const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [publishSummary, setPublishSummary] = useState<string>('ওয়েবসাইট আপডেট ও কনটেন্ট প্রকাশ');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Media Library state
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>('all');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Versions & Live Students
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Load data on mount + sync optional ?tab= parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab') as ActiveTab | null;
      if (tabParam && LANDING_ADMIN_TABS.some((t) => t.id === tabParam)) {
        setActiveTab(tabParam);
      }
    }

    const draft = landingPageService.getDraftConfig();
    setConfig(draft);
    setHasChanges(landingPageService.hasDraftChanges());
    setMediaList(landingPageService.getMediaList());
    setVersions(landingPageService.getVersions());

    try {
      const stds = studentService.getAllStudents();
      setLiveStudents(stds);
    } catch (e) {
      console.error('Failed to load students for landing page:', e);
    }

    const unsubDraft = landingPageService.subscribeDraft((newDraft) => {
      setConfig(newDraft);
      setHasChanges(landingPageService.hasDraftChanges());
    });

    return () => {
      unsubDraft();
    };
  }, []);

  // Auto-healing background asset optimizer for oversized legacy base64 images
  useEffect(() => {
    let isCancelled = false;
    const optimizeExistingHeavyAssets = async () => {
      try {
        let draftChanged = false;
        const currentDraft = landingPageService.getDraftConfig();
        const updatedHero = { ...currentDraft.hero };

        if (updatedHero.slides && updatedHero.slides.length > 0) {
          const optimizedSlides = await Promise.all(
            updatedHero.slides.map(async (slide) => {
              if (slide.imageUrl && slide.imageUrl.startsWith('data:image/') && slide.imageUrl.length > 70000) {
                try {
                  const smaller = await compressImage(slide.imageUrl, 1000, 560, 0.65);
                  if (smaller && smaller.length < slide.imageUrl.length) {
                    draftChanged = true;
                    return { ...slide, imageUrl: smaller };
                  }
                } catch {}
              }
              return slide;
            })
          );
          updatedHero.slides = optimizedSlides;
        }

        if (updatedHero.bgImage && updatedHero.bgImage.startsWith('data:image/') && updatedHero.bgImage.length > 70000) {
          try {
            const smaller = await compressImage(updatedHero.bgImage, 1000, 560, 0.65);
            if (smaller && smaller.length < updatedHero.bgImage.length) {
              draftChanged = true;
              updatedHero.bgImage = smaller;
            }
          } catch {}
        }

        const currentMedia = landingPageService.getMediaList();
        let mediaChanged = false;
        const optimizedMedia = await Promise.all(
          currentMedia.map(async (m) => {
            if (m.url && m.url.startsWith('data:image/') && m.url.length > 70000) {
              try {
                const smaller = await compressImage(m.url, 1000, 560, 0.65);
                if (smaller && smaller.length < m.url.length) {
                  mediaChanged = true;
                  return { ...m, url: smaller, size: Math.round(smaller.length * 0.75) };
                }
              } catch {}
            }
            return m;
          })
        );

        if (isCancelled) return;

        if (mediaChanged) {
          try {
            localStorage.setItem('sms_landing_media', JSON.stringify(optimizedMedia));
            setMediaList(optimizedMedia);
          } catch {}
        }

        if (draftChanged) {
          const updatedConfig = { ...currentDraft, hero: updatedHero };
          landingPageService.saveDraftConfig(updatedConfig, 'সিস্টেম অপ্টিমাইজার');
          setConfig(updatedConfig);
        }
      } catch (err) {
        console.warn('Auto-optimizer non-critical notice:', err);
      }
    };

    const timer = setTimeout(optimizeExistingHeavyAssets, 600);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleUpdateConfig = (newConfig: LandingPageConfig) => {
    setConfig(newConfig);
    const ok = landingPageService.saveDraftConfig(newConfig, 'অ্যাডমিন');
    if (!ok) {
      console.warn('Storage notice: safe storage cleanup triggered.');
    }
    setHasChanges(true);
  };

  const handleSaveDraft = () => {
    try {
      const success = landingPageService.saveDraftConfig(config, 'অ্যাডমিন');
      if (success) {
        setHasChanges(landingPageService.hasDraftChanges());
        showToast('খসড়া সফলভাবে সংরক্ষণ করা হয়েছে', 'success');
      } else {
        showToast(
          'খসড়া সংরক্ষণে ত্রুটি দেখা দিয়েছে, ব্রাউজারের স্টোরেজ খালি করার চেষ্টা করা হয়েছে। পুনরায় চেষ্টা করুন।',
          'error'
        );
      }
    } catch (err) {
      console.error('Save draft error:', err);
      showToast('খসড়া সংরক্ষণে সমস্যা হয়েছে: ' + (err instanceof Error ? err.message : ''), 'error');
    }
  };

  const handlePublishLive = () => {
    setIsPublishing(true);
    try {
      const success = landingPageService.publish('অ্যাডমিন', publishSummary || 'ওয়েবসাইট কনটেন্ট আপডেট', config);
      if (success) {
        setShowPublishModal(false);
        setHasChanges(false);
        setVersions(landingPageService.getVersions());

        try {
          setLiveStudents(studentService.getAllStudents());
        } catch (e) {
          console.error('Failed to load students for landing page:', e);
        }
        showToast('🎉 সফলভাবে মূল ওয়েবসাইটে লাইভ প্রকাশ করা হয়েছে!', 'success');
      } else {
        showToast('প্রকাশ করতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন', 'error');
      }
    } catch (err) {
      console.error('Publish error:', err);
      showToast(
        'প্রকাশ করতে সমস্যা হয়েছে: ' + (err instanceof Error ? err.message : 'পুনরায় চেষ্টা করুন'),
        'error'
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (
      await confirmDialog({
        title: 'খসড়া বাতিল করুন',
        message: 'আপনি কি নিশ্চিত যে অপ্রকাশিত খসড়া পরিবর্তন বাতিল করে পূর্বের প্রকাশিত অবস্থায় ফিরে যেতে চান?',
        confirmLabel: 'বাতিল করুন',
        danger: true,
      })
    ) {
      landingPageService.discardDraft();
      setConfig(landingPageService.getPublishedConfig());
      setHasChanges(false);
      showToast('অপ্রকাশিত খসড়া বাতিল করা হয়েছে', 'info');
    }
  };

  const handleRestoreVersion = async (ver: VersionSnapshot) => {
    if (
      await confirmDialog({
        title: 'সংস্করণ রিস্টোর',
        message: `আপনি কি সংস্করণ ${ver.version} (${ver.summary}) রিস্টোর করতে চান? এটি আপনার বর্তমান খসড়া প্রতিস্থাপন করবে।`,
        confirmLabel: 'রিস্টোর করুন',
        danger: true,
      })
    ) {
      const ok = landingPageService.restoreVersion(ver.id, 'অ্যাডমিন');
      if (ok) {
        setConfig(landingPageService.getDraftConfig());
        setHasChanges(true);
        showToast(
          `সংস্করণ ${ver.version} সফলভাবে রিস্টোর হয়েছে। পরিবর্তনটি খসড়ায় সংরক্ষিত আছে, লাইভ করতে প্রকাশ করুন।`,
          'success'
        );
      }
    }
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });

    const updatedConfig = { ...config, sections: newSections };
    setConfig(updatedConfig);
    landingPageService.saveDraftConfig(updatedConfig, 'অ্যাডমিন');
    landingPageService.publish('অ্যাডমিন', 'সেকশনের ক্রম পরিবর্তন ও লাইভ প্রকাশ', updatedConfig);
    setHasChanges(false);
    setVersions(landingPageService.getVersions());
    showToast('সেকশনের ক্রম সফলভাবে পরিবর্তন ও লাইভ ওয়েবসাইটে আপডেট করা হয়েছে', 'success');
  };

  const handleToggleSection = (sectionId: string, current: boolean) => {
    const targetSec = config.sections.find((s) => s.id === sectionId);
    const secName = targetSec?.nameBn || 'সেকশন';
    const newEnabled = !current;
    const newSections = config.sections.map((s) => (s.id === sectionId ? { ...s, enabled: newEnabled } : s));

    const rawSecKey = targetSec?.key;
    const secKey = rawSecKey === 'mobile_app' ? 'mobileApp' : rawSecKey;
    const rawRecord = { ...config } as unknown as Record<string, unknown>;
    if (secKey && rawRecord[secKey] && typeof rawRecord[secKey] === 'object') {
      const subObj = rawRecord[secKey] as { enabled?: boolean };
      if (typeof subObj.enabled === 'boolean') {
        rawRecord[secKey] = { ...subObj, enabled: newEnabled };
      }
    }

    const updatedConfig: LandingPageConfig = {
      ...(rawRecord as unknown as LandingPageConfig),
      sections: newSections,
    };

    setConfig(updatedConfig);
    landingPageService.saveDraftConfig(updatedConfig, 'অ্যাডমিন');
    landingPageService.publish(
      'অ্যাডমিন',
      `"${secName}" ${newEnabled ? 'দৃশ্যমান' : 'লুকানো'} করা হয়েছে`,
      updatedConfig
    );
    setHasChanges(false);
    setVersions(landingPageService.getVersions());
    showToast(`"${secName}" সফলভাবে ${newEnabled ? 'দৃশ্যমান' : 'লুকানো'} হয়েছে এবং ল্যান্ডিং পেইজে লাইভ আপডেট হয়েছে!`, 'success');
  };

  const handleDuplicateSection = (sec: SectionItem) => {
    landingPageService.duplicateSection(sec.id, 'অ্যাডমিন');
    const updated = landingPageService.getDraftConfig();
    landingPageService.publish('অ্যাডমিন', `"${sec.nameBn}" ডুপ্লিকেট করা হয়েছে`, updated);
    setConfig(updated);
    setHasChanges(false);
    setVersions(landingPageService.getVersions());
    showToast(`"${sec.nameBn}" ডুপ্লিকেট করা হয়েছে এবং লাইভ আপডেট হয়েছে`, 'success');
  };

  const handleDeleteSection = async (sec: SectionItem) => {
    if (
      await confirmDialog({
        title: 'সেকশন মুছে ফেলুন',
        message: `আপনি কি "${sec.nameBn}" সেকশনটি মুছে ফেলতে চান?`,
        confirmLabel: 'মুছে ফেলুন',
        danger: true,
      })
    ) {
      landingPageService.deleteSection(sec.id, 'অ্যাডমিন');
      const updated = landingPageService.getDraftConfig();
      landingPageService.publish('অ্যাডমিন', `"${sec.nameBn}" সেকশন মুছে ফেলা হয়েছে`, updated);
      setConfig(updated);
      setHasChanges(false);
      setVersions(landingPageService.getVersions());
      showToast('সেকশন মুছে ফেলা হয়েছে এবং লাইভ আপডেট হয়েছে', 'info');
    }
  };

  const processImageFile = async (
    file: File,
    targetCategory?: string
  ): Promise<{ dataUrl: string; width: number; height: number; size: number }> => {
    if (file.type === 'image/svg+xml') {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result as string, width: 100, height: 100, size: file.size });
        reader.onerror = () => resolve({ dataUrl: '', width: 0, height: 0, size: 0 });
        reader.readAsDataURL(file);
      });
    }
    const maxWidth = targetCategory === 'logo' ? 300 : targetCategory === 'student' ? 360 : 1000;
    const maxHeight = targetCategory === 'logo' ? 300 : targetCategory === 'student' ? 450 : 560;
    const quality = targetCategory === 'logo' ? 0.8 : targetCategory === 'student' ? 0.75 : 0.65;

    const compressed = await compressImage(file, maxWidth, maxHeight, quality);
    return {
      dataUrl: compressed,
      width: maxWidth,
      height: maxHeight,
      size: Math.round(compressed.length * 0.75),
    };
  };

  const handleFilesBatch = async (fileList: FileList | File[], overrideCat?: string) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      showToast('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP, SVG) নির্বাচন করুন।', 'error');
      return;
    }

    setIsUploading(true);
    const targetCat = (overrideCat ||
      (mediaCategoryFilter === 'all'
        ? activeTab === 'header'
          ? 'logo'
          : 'banner'
        : mediaCategoryFilter)) as MediaItem['category'];

    try {
      let currentCfg = { ...config };
      let updatedAny = false;

      for (const file of files) {
        const { dataUrl, size } = await processImageFile(file, targetCat);
        if (!dataUrl) continue;

        landingPageService.addMediaItem({
          name: file.name,
          url: dataUrl,
          size: size || file.size,
          type: file.type,
          altText: file.name.replace(/\.[^/.]+$/, ''),
          category: targetCat,
        });

        if (targetCat === 'logo') {
          currentCfg = {
            ...currentCfg,
            header: { ...currentCfg.header, logoUrl: dataUrl, showLogo: true },
            seo: { ...currentCfg.seo, favicon: dataUrl },
          };
          updatedAny = true;
          try {
            settingsService.updateSettings({ schoolLogo: dataUrl });
          } catch (e) {
            console.error(e);
          }
        } else if (targetCat === 'gallery') {
          const currentGal = currentCfg.gallery || DEFAULT_LANDING_CONFIG.gallery!;
          const newGalItem: GalleryMediaItem = {
            id: `gal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: 'image',
            title: file.name.replace(/\.[^/.]+$/, ''),
            category: 'ক্যাম্পাস',
            thumbnail: dataUrl,
            date: new Date().toLocaleDateString('bn-BD'),
            caption: file.name.replace(/\.[^/.]+$/, ''),
            visible: true,
          };
          currentCfg = {
            ...currentCfg,
            gallery: {
              ...currentGal,
              items: [newGalItem, ...(currentGal.items || [])],
            },
          };
          updatedAny = true;
        }
      }

      setMediaList(landingPageService.getMediaList());
      if (updatedAny) {
        handleUpdateConfig(currentCfg);
      }

      const catBnMap: Record<string, string> = {
        logo: 'লোগো',
        banner: 'ব্যানার',
        student: 'শিক্ষার্থী',
        gallery: 'গ্যালারি',
        other: 'অন্যান্য',
      };
      const catBn = catBnMap[targetCat] || targetCat;

      if (files.length === 1) {
        showToast(`🎉 "${files[0].name}" সফলভাবে ${catBn} হিসেবে আপলোড হয়েছে!`, 'success');
      } else {
        showToast(`🎉 সফলভাবে ${files.length} টি ছবি ${catBn} ক্যাটাগরিতে আপলোড হয়েছে!`, 'success');
      }
    } catch (err) {
      console.error('File upload error:', err);
      showToast('ছবি আপলোডে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  const handleSetAsSchoolLogo = (item: MediaItem) => {
    const updatedCfg: LandingPageConfig = {
      ...config,
      header: { ...config.header, logoUrl: item.url, showLogo: true },
      seo: { ...config.seo, favicon: item.url },
    };
    handleUpdateConfig(updatedCfg);
    if (item.category !== 'logo') {
      landingPageService.updateMediaItem(item.id, { category: 'logo' });
      setMediaList(landingPageService.getMediaList());
    }
    try {
      settingsService.updateSettings({ schoolLogo: item.url });
    } catch (err) {
      console.error('Failed to update school settings logo:', err);
    }
    showToast(`"${item.name}" সফলভাবে প্রধান স্কুল লোগো হিসেবে সেট করা হয়েছে!`, 'success');
  };

  const handleSetAsHeroBanner = (item: MediaItem) => {
    handleUpdateConfig({
      ...config,
      hero: { ...config.hero, bgType: 'image', bgImage: item.url },
    });
    if (item.category !== 'banner') {
      landingPageService.updateMediaItem(item.id, { category: 'banner' });
      setMediaList(landingPageService.getMediaList());
    }
    showToast(`"${item.name}" হোমপেজ ব্যাকগ্রাউন্ড ব্যানার হিসেবে সেট করা হয়েছে!`, 'success');
  };

  const handleAddToHeroSlider = (item: MediaItem) => {
    const currentSlides = config.hero.slides || [];
    if (currentSlides.some((s) => s.imageUrl === item.url)) {
      showToast('এই ছবিটি ইতিমধ্যে স্লাইডারে যুক্ত রয়েছে!', 'info');
      return;
    }

    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      title: config.hero.title || config.header.schoolName,
      subtitle: config.hero.subtitle || 'জ্ঞান, প্রজ্ঞা ও মূল্যবোধের অনন্য বিদ্যাপীঠ',
      imageUrl: item.url,
      ctaText: 'ভর্তি আবেদন',
      ctaLink: '/admission',
    };
    const isDefaultDemoCollection =
      currentSlides.length > 0 &&
      currentSlides[0]?.id === 'slide-1' &&
      currentSlides[0]?.imageUrl === '/school-campus.jpg';
    const slidesList = isDefaultDemoCollection ? [newSlide] : [...currentSlides, newSlide];

    handleUpdateConfig({
      ...config,
      hero: { ...config.hero, enableSlider: true, slides: slidesList },
    });
    if (item.category !== 'banner') {
      landingPageService.updateMediaItem(item.id, { category: 'banner' });
      setMediaList(landingPageService.getMediaList());
    }
    showToast(`"${item.name}" স্লাইডারে সফলভাবে যুক্ত হয়েছে!`, 'success');
  };

  const handleRemoveFromHeroSlider = (imageUrl: string) => {
    const updatedSlides = (config.hero.slides || []).filter((s) => s.imageUrl !== imageUrl);
    handleUpdateConfig({
      ...config,
      hero: { ...config.hero, slides: updatedSlides },
    });
    showToast('স্লাইডার থেকে ছবিটি বাদ দেওয়া হয়েছে', 'info');
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => res('');
      r.readAsDataURL(file);
    });

  const handleAddHeroSlide = async (fileOrUrl: File | string, title?: string, subtitle?: string) => {
    try {
      let imageUrl: string;
      let mediaName = title || 'ব্যানার স্লাইডার ছবি';
      let mediaSize = 120000;

      if (typeof fileOrUrl === 'string') {
        imageUrl = fileOrUrl;
      } else {
        showToast('ছবি প্রসেসিং ও অপটিমাইজেশন হচ্ছে...', 'info');
        const compressedUrl = await compressImage(fileOrUrl, 1000, 560, 0.65);
        imageUrl = compressedUrl || (await readFileAsDataUrl(fileOrUrl));
        if (!imageUrl) {
          showToast('ছবি পড়তে সমস্যা হয়েছে। অন্য ছবি চেষ্টা করুন।', 'error');
          return;
        }
        mediaName = fileOrUrl.name || mediaName;
        mediaSize = Math.round(imageUrl.length * 0.75);
      }

      const newSlide: HeroSlide = {
        id: `slide-${Date.now()}`,
        title: title || config.hero.title || config.header.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
        subtitle: subtitle || config.hero.subtitle || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ',
        imageUrl,
        ctaText: 'ভর্তি আবেদন',
        ctaLink: '/admission',
      };
      const currentSlides = config.hero.slides || [];
      const isDefaultDemoCollection =
        currentSlides.length > 0 &&
        currentSlides[0]?.id === 'slide-1' &&
        currentSlides[0]?.imageUrl === '/school-campus.jpg';

      handleUpdateConfig({
        ...config,
        hero: {
          ...config.hero,
          enableSlider: true,
          slides: isDefaultDemoCollection ? [newSlide] : [...currentSlides, newSlide],
        },
      });
      try {
        landingPageService.addMediaItem({
          name: mediaName,
          category: 'banner',
          url: imageUrl,
          size: mediaSize,
          type: 'image/jpeg',
          altText: title || mediaName,
        });
        setMediaList(landingPageService.getMediaList());
      } catch {}

      showToast(
        typeof fileOrUrl === 'string'
          ? 'নতুন ব্যানার স্লাইড সফলভাবে যুক্ত হয়েছে!'
          : `"${fileOrUrl.name}" স্লাইডারে সফলভাবে যুক্ত হয়েছে!`,
        'success'
      );
    } catch (err) {
      console.error('Error adding hero slide:', err);
      showToast(
        'ছবি যুক্ত করতে সমস্যা হয়েছে: ' + (err instanceof Error ? err.message : 'পুনরায় চেষ্টা করুন'),
        'error'
      );
    }
  };

  const handleDeleteHeroSlide = (slideId: string) => {
    const updatedSlides = (config.hero.slides || []).filter((s) => s.id !== slideId);
    handleUpdateConfig({
      ...config,
      hero: { ...config.hero, slides: updatedSlides },
    });
    showToast('স্লাইডটি মুছে ফেলা হয়েছে!', 'info');
  };

  const handleMoveHeroSlide = (index: number, direction: 'up' | 'down') => {
    const slides = [...(config.hero.slides || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const temp = slides[index];
    slides[index] = slides[targetIndex];
    slides[targetIndex] = temp;
    handleUpdateConfig({
      ...config,
      hero: { ...config.hero, slides },
    });
    showToast('স্লাইডারের ক্রম পরিবর্তন করা হয়েছে!', 'info');
  };

  const handleReplaceHeroSlideImage = async (slideId: string, file: File) => {
    try {
      showToast('ছবি পরিবর্তন ও অপটিমাইজেশন হচ্ছে...', 'info');
      const compressedUrl = await compressImage(file, 1000, 560, 0.65);
      const finalUrl = compressedUrl || (await readFileAsDataUrl(file));
      if (!finalUrl) {
        showToast('ছবি পড়তে সমস্যা হয়েছে। অন্য ছবি চেষ্টা করুন।', 'error');
        return;
      }

      const updatedSlides = (config.hero.slides || []).map((s) =>
        s.id === slideId ? { ...s, imageUrl: finalUrl } : s
      );
      handleUpdateConfig({
        ...config,
        hero: { ...config.hero, slides: updatedSlides },
      });
      try {
        landingPageService.addMediaItem({
          name: file.name,
          category: 'banner',
          url: finalUrl,
          size: Math.round(finalUrl.length * 0.75),
          type: 'image/jpeg',
          altText: 'আপডেট করা ব্যানার ছবি',
        });
        setMediaList(landingPageService.getMediaList());
      } catch {}
      showToast('স্লাইডের ছবি সফলভাবে পরিবর্তন করা হয়েছে!', 'success');
    } catch (err) {
      console.error('Error replacing hero slide image:', err);
      showToast(
        'ছবি পরিবর্তনে সমস্যা হয়েছে: ' + (err instanceof Error ? err.message : 'পুনরায় চেষ্টা করুন'),
        'error'
      );
    }
  };

  const handleClearDemoHeroSlides = async () => {
    if (
      await confirmDialog({
        title: 'ডেমো স্লাইড মুছুন',
        message: 'আপনি কি সমস্ত ডেমো স্টক স্লাইড মুছে ফেলতে চান? এরপর শুধুমাত্র আপনার আপলোড করা আসল ছবিগুলো স্লাইডারে থাকবে।',
        confirmLabel: 'মুছে ফেলুন',
        danger: true,
      })
    ) {
      handleUpdateConfig({
        ...config,
        hero: { ...config.hero, slides: [] },
      });
      showToast('সকল ডেমো স্লাইড মুছে ফেলা হয়েছে! এখন আপনার নতুন ছবি যোগ করুন।', 'info');
    }
  };

  const handleAddToGallery = (item: MediaItem) => {
    const currentGal = config.gallery || DEFAULT_LANDING_CONFIG.gallery!;
    if ((currentGal.items || []).some((g) => g.thumbnail === item.url)) {
      showToast('ছবিটি ইতিমধ্যেই গ্যালারিতে যুক্ত আছে', 'info');
      return;
    }
    const newGalItem: GalleryMediaItem = {
      id: `gal-${Date.now()}`,
      type: 'image',
      title: item.altText || item.name.replace(/\.[^/.]+$/, ''),
      category: 'ক্যাম্পাস',
      thumbnail: item.url,
      date: new Date().toLocaleDateString('bn-BD'),
      caption: item.altText || item.name.replace(/\.[^/.]+$/, ''),
      visible: true,
    };
    handleUpdateConfig({
      ...config,
      gallery: { ...currentGal, items: [newGalItem, ...(currentGal.items || [])] },
    });
    if (item.category !== 'gallery') {
      landingPageService.updateMediaItem(item.id, { category: 'gallery' });
      setMediaList(landingPageService.getMediaList());
    }
    showToast(`"${item.name}" সফলভাবে গ্যালারিতে যুক্ত করা হয়েছে!`, 'success');
  };

  const handleAddToAchievers = (item: MediaItem) => {
    const currentAch = config.achievers || DEFAULT_LANDING_CONFIG.achievers;
    const newStudent: AchieverStudent = {
      id: `ach-${Date.now()}`,
      name: item.altText || 'কৃতি শিক্ষার্থী',
      class: '১০ম শ্রেণি',
      roll: '০১',
      year: '২০২৪',
      gpa: '৫.০০',
      photo: item.url,
      awardBadge: 'ট্যালেন্টপুল বৃত্তি',
      visible: true,
    };
    handleUpdateConfig({
      ...config,
      achievers: { ...currentAch, students: [newStudent, ...(currentAch.students || [])] },
    });
    if (item.category !== 'student') {
      landingPageService.updateMediaItem(item.id, { category: 'student' });
      setMediaList(landingPageService.getMediaList());
    }
    showToast(`"${item.name}" সেরা শিক্ষার্থী তালিকায় যুক্ত হয়েছে!`, 'success');
  };

  const handleChangeCategory = (item: MediaItem, newCategory: MediaItem['category']) => {
    landingPageService.updateMediaItem(item.id, { category: newCategory });
    setMediaList(landingPageService.getMediaList());
    showToast(`ক্যাটাগরি "${newCategory}" তে পরিবর্তন করা হয়েছে`, 'info');
  };

  return (
    <div className="space-y-6 pb-20 text-slate-800 dark:text-slate-100">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold transition-all transform animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-indigo-600 text-white border-indigo-500'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hidden File Inputs for Global Access */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) handleFilesBatch(e.target.files);
        }}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = '';
        }}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={logoFileInputRef}
        onChange={(e) => {
          if (e.target.files) handleFilesBatch(e.target.files, 'logo');
        }}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = '';
        }}
        accept="image/*"
        className="hidden"
      />

      {/* TOP ACTION & HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  ল্যান্ডিং পেইজ ম্যানেজমেন্ট সিস্টেম
                </h1>
                {hasChanges ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    অপ্রকাশিত খসড়া পরিবর্তন রয়েছে
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    সব পরিবর্তন লাইভ (V{config.version})
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                কোনো কোডিং ছাড়াই বিদ্যালয়ের মূল ওয়েবসাইট ও ল্যান্ডিং পেইজের প্রতিটি অংশ সম্পূর্ণ পরিবর্তন ও নিয়ন্ত্রণ করুন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold transition"
              title="নতুন ব্যবহারকারী নির্দেশিকা ও সহায়তা"
            >
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>সহায়িকা</span>
            </button>

            <button
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs sm:text-sm font-bold transition shadow-xs"
              title="ওয়েবসাইটের লাইভ প্রিভিউ দেখুন"
            >
              <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>লাইভ প্রিভিউ</span>
            </button>

            {hasChanges && (
              <button
                onClick={handleDiscardDraft}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs sm:text-sm font-bold transition"
                title="অপ্রকাশিত পরিবর্তন বাতিল করুন"
              >
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <span>বাতিল</span>
              </button>
            )}

            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-bold transition shadow-xs"
              title="খসড়া সংরক্ষণ করুন"
            >
              <Save className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>খসড়া সেভ</span>
            </button>

            <button
              onClick={() => setShowPublishModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 text-xs sm:text-sm font-black transition shadow-md shadow-emerald-600/30"
              title="মূল ওয়েবসাইটে লাইভ প্রকাশ করুন"
            >
              <Sparkles className="w-4 h-4 text-yellow-200" />
              <span>লাইভ প্রকাশ করুন</span>
            </button>
          </div>
        </div>

        {/* MODULE TABS */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 min-w-max">
            {LANDING_ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.renderIcon()}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <LandingOverviewTab
          config={config}
          liveStudents={liveStudents}
          mediaList={mediaList}
          versions={versions}
          setActiveTab={setActiveTab}
          handleToggleSection={handleToggleSection}
          onOpenImportModal={() => setShowImportModal(true)}
        />
      )}

      {activeTab === 'sections' && (
        <LandingSectionsTab
          config={config}
          handleMoveSection={handleMoveSection}
          handleDuplicateSection={handleDuplicateSection}
          handleToggleSection={handleToggleSection}
          handleDeleteSection={handleDeleteSection}
          showToast={showToast}
        />
      )}

      {activeTab === 'header' && (
        <LandingHeaderTab
          config={config}
          handleUpdateConfig={handleUpdateConfig}
          logoFileInputRef={logoFileInputRef}
          setMediaCategoryFilter={setMediaCategoryFilter}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'hero' && (
        <LandingHeroTab
          config={config}
          handleUpdateConfig={handleUpdateConfig}
          handleAddHeroSlide={handleAddHeroSlide}
          handleDeleteHeroSlide={handleDeleteHeroSlide}
          handleMoveHeroSlide={handleMoveHeroSlide}
          handleReplaceHeroSlideImage={handleReplaceHeroSlideImage}
          handleClearDemoHeroSlides={handleClearDemoHeroSlides}
        />
      )}

      {activeTab === 'about' && (
        <LandingAboutTab
          config={config}
          handleUpdateConfig={handleUpdateConfig}
          showToast={showToast}
          setMediaCategoryFilter={setMediaCategoryFilter}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'features' && (
        <LandingFeaturesTab config={config} handleUpdateConfig={handleUpdateConfig} />
      )}

      {activeTab === 'stats' && (
        <LandingStatsTab config={config} handleUpdateConfig={handleUpdateConfig} />
      )}

      {activeTab === 'academic' && (
        <LandingAcademicTab config={config} handleUpdateConfig={handleUpdateConfig} />
      )}

      {activeTab === 'achievers' && (
        <LandingAchieversTab
          config={config}
          handleUpdateConfig={handleUpdateConfig}
          showToast={showToast}
          liveStudents={liveStudents}
          showImportModal={showImportModal}
          setShowImportModal={setShowImportModal}
        />
      )}

      {activeTab === 'gallery' && (
        <LandingGalleryTab config={config} handleUpdateConfig={handleUpdateConfig} showToast={showToast} />
      )}

      {activeTab === 'blog' && (
        <LandingBlogTab
          config={config}
          handleUpdateConfig={handleUpdateConfig}
          showToast={showToast}
          setMediaCategoryFilter={setMediaCategoryFilter}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'faq' && <LandingFaqTab config={config} handleUpdateConfig={handleUpdateConfig} />}

      {activeTab === 'media' && (
        <LandingMediaTab
          config={config}
          mediaList={mediaList}
          setMediaList={setMediaList}
          mediaCategoryFilter={mediaCategoryFilter}
          setMediaCategoryFilter={setMediaCategoryFilter}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          logoFileInputRef={logoFileInputRef}
          handleFilesBatch={handleFilesBatch}
          handleSetAsSchoolLogo={handleSetAsSchoolLogo}
          handleSetAsHeroBanner={handleSetAsHeroBanner}
          handleAddToHeroSlider={handleAddToHeroSlider}
          handleRemoveFromHeroSlider={handleRemoveFromHeroSlider}
          handleAddToGallery={handleAddToGallery}
          handleAddToAchievers={handleAddToAchievers}
          handleChangeCategory={handleChangeCategory}
          showToast={showToast}
        />
      )}

      {activeTab === 'theme' && <LandingThemeTab config={config} handleUpdateConfig={handleUpdateConfig} />}

      {activeTab === 'footer' && <LandingFooterTab config={config} handleUpdateConfig={handleUpdateConfig} />}

      {activeTab === 'seo' && <LandingSeoTab config={config} handleUpdateConfig={handleUpdateConfig} />}

      {activeTab === 'history' && (
        <LandingHistoryTab versions={versions} handleRestoreVersion={handleRestoreVersion} />
      )}

      <LandingAdminModals
        showPublishModal={showPublishModal}
        setShowPublishModal={setShowPublishModal}
        publishSummary={publishSummary}
        setPublishSummary={setPublishSummary}
        handlePublishLive={handlePublishLive}
        isPublishing={isPublishing}
        showPreviewModal={showPreviewModal}
        setShowPreviewModal={setShowPreviewModal}
        showHelpModal={showHelpModal}
        setShowHelpModal={setShowHelpModal}
      />
    </div>
  );
}
