'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  LayoutTemplate,
  Globe,
  Eye,
  Save,
  RotateCcw,
  Upload,
  Trash2,
  Plus,
  MoveUp,
  MoveDown,
  Copy,
  Check,
  AlertCircle,
  Palette,
  FileText,
  HelpCircle,
  Smartphone,
  Tablet,
  Monitor,
  History,
  ShieldCheck,
  Sparkles,
  Search,
  Bell,
  Users,
  Award,
  BookOpen,
  School,
  GraduationCap,
  Building2,
  Image as ImageIcon,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Layers,
  Settings,
  X,
  Share2,
  Camera,
  Video,
  Play,
  EyeOff,
  Trophy,
  Star,
  Filter,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import {
  landingPageService,
  LandingPageConfig,
  SectionItem,
  NavMenuItem,
  HeroSlide,
  ClassStatItem,
  ServiceCard,
  AchieverStudent,
  BlogPostItem,
  FAQItem,
  FacilityItem,
  AcademicConfig,
  DEFAULT_ACADEMIC_CONFIG,
  FooterColumnLink,
  MediaItem,
  VersionSnapshot,
  AuditLogEntry,
  DEFAULT_LANDING_CONFIG,
  GalleryConfig,
  GalleryMediaItem,
  DEFAULT_GALLERY_CONFIG
} from '@/services/landingPageService';
import { teacherAuthService } from '@/services/teacherAuthService';
import { studentService, Student } from '@/services/studentService';
import { settingsService } from '@/services/settingsService';

type ActiveTab =
  | 'overview'
  | 'sections'
  | 'header'
  | 'hero'
  | 'about'
  | 'features'
  | 'stats'
  | 'academic'
  | 'achievers'
  | 'gallery'
  | 'blog'
  | 'faq'
  | 'media'
  | 'theme'
  | 'footer'
  | 'seo'
  | 'history';

export default function LandingPageManagementDashboard() {
  const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_CONFIG);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [publishSummary, setPublishSummary] = useState<string>('ওয়েবসাইট আপডেট ও কনটেন্ট প্রকাশ');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Media Library state
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>('all');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Hero Slide Management State
  const [slideUrlInput, setSlideUrlInput] = useState<string>('');
  const [replacingSlideId, setReplacingSlideId] = useState<string | null>(null);
  const heroSlideFileInputRef = useRef<HTMLInputElement>(null);
  const replaceSlideFileInputRef = useRef<HTMLInputElement>(null);

  // Versions state
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Section Manager template picker
  const [showAddSectionModal, setShowAddSectionModal] = useState<boolean>(false);

  // Live Student & Achiever state
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importSearch, setImportSearch] = useState<string>('');
  const [importClassFilter, setImportClassFilter] = useState<string>('all');
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState<string>('all');

  // Load data on mount
  useEffect(() => {
    const draft = landingPageService.getDraftConfig();
    setConfig(draft);
    setHasChanges(landingPageService.hasDraftChanges());
    setMediaList(landingPageService.getMediaList());
    setVersions(landingPageService.getVersions());
    setAuditLogs(landingPageService.getAuditLogs());

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

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Helper to update draft state & service
  const handleUpdateConfig = (newConfig: LandingPageConfig) => {
    setConfig(newConfig);
    landingPageService.saveDraftConfig(newConfig, 'অ্যাডমিন');
    setHasChanges(true);
  };

  // Save Draft Action
  const handleSaveDraft = () => {
    const success = landingPageService.saveDraftConfig(config, 'অ্যাডমিন');
    if (success) {
      setHasChanges(landingPageService.hasDraftChanges());
      showToast('খসড়া সফলভাবে সংরক্ষণ করা হয়েছে', 'success');
    } else {
      showToast('খসড়া সংরক্ষণে ত্রুটি দেখা দিয়েছে', 'error');
    }
  };

  // Publish to Live Action
  const handlePublishLive = () => {
    setIsPublishing(true);
    try {
      const success = landingPageService.publish('অ্যাডমিন', publishSummary || 'ওয়েবসাইট কনটেন্ট আপডেট');
      if (success) {
        setShowPublishModal(false);
        setHasChanges(false);
        setVersions(landingPageService.getVersions());
        setAuditLogs(landingPageService.getAuditLogs());

    try {
      const stds = studentService.getAllStudents();
      setLiveStudents(stds);
    } catch (e) {
      console.error('Failed to load students for landing page:', e);
    }
        showToast('🎉 সফলভাবে মূল ওয়েবসাইটে লাইভ প্রকাশ করা হয়েছে!', 'success');
      } else {
        showToast('প্রকাশ করতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন', 'error');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // Discard Draft Action
  const handleDiscardDraft = () => {
    if (confirm('আপনি কি নিশ্চিত যে অপ্রকাশিত খসড়া পরিবর্তন বাতিল করে পূর্বের প্রকাশিত অবস্থায় ফিরে যেতে চান?')) {
      landingPageService.discardDraft();
      const published = landingPageService.getPublishedConfig();
      setConfig(published);
      setHasChanges(false);
      showToast('অপ্রকাশিত খসড়া বাতিল করা হয়েছে', 'info');
    }
  };

  // Restore Version Action
  const handleRestoreVersion = (ver: VersionSnapshot) => {
    if (confirm(`আপনি কি সংস্করণ ${ver.version} (${ver.summary}) রিস্টোর করতে চান? এটি আপনার বর্তমান খসড়া প্রতিস্থাপন করবে।`)) {
      const ok = landingPageService.restoreVersion(ver.id, 'অ্যাডমিন');
      if (ok) {
        setConfig(landingPageService.getDraftConfig());
        setHasChanges(true);
        showToast(`সংস্করণ ${ver.version} সফলভাবে রিস্টোর হয়েছে। পরিবর্তনটি খসড়ায় সংরক্ষিত আছে, লাইভ করতে প্রকাশ করুন।`, 'success');
      }
    }
  };

  // Section Reordering
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // update orders
    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });

    handleUpdateConfig({ ...config, sections: newSections });
    showToast('সেকশনের ক্রম পরিবর্তন করা হয়েছে', 'info');
  };

  // Section Toggle Visibility
  const handleToggleSection = (sectionId: string, current: boolean) => {
    const newSections = config.sections.map(s => (s.id === sectionId ? { ...s, enabled: !current } : s));
    handleUpdateConfig({ ...config, sections: newSections });
    showToast(`সেকশন ${!current ? 'দৃশ্যমান' : 'লুকানো'} করা হয়েছে`, 'info');
  };

  // Duplicate Section
  const handleDuplicateSection = (sec: SectionItem) => {
    landingPageService.duplicateSection(sec.id, 'অ্যাডমিন');
    const updated = landingPageService.getDraftConfig();
    setConfig(updated);
    setHasChanges(true);
    showToast(`"${sec.nameBn}" ডুপ্লিকেট করা হয়েছে`, 'success');
  };

  // Delete Section
  const handleDeleteSection = (sec: SectionItem) => {
    if (confirm(`আপনি কি "${sec.nameBn}" সেকশনটি মুছে ফেলতে চান?`)) {
      landingPageService.deleteSection(sec.id, 'অ্যাডমিন');
      const updated = landingPageService.getDraftConfig();
      setConfig(updated);
      setHasChanges(true);
      showToast(`সেকশন মুছে ফেলা হয়েছে`, 'info');
    }
  };

  // Helper to resize/compress images for lightning-fast performance & safe storage
  const processImageFile = (file: File): Promise<{ dataUrl: string; width: number; height: number; size: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawResult = reader.result as string;
        if (file.type === 'image/svg+xml') {
          resolve({ dataUrl: rawResult, width: 100, height: 100, size: file.size });
          return;
        }
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: rawResult, width: img.width, height: img.height, size: file.size });
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(format, 0.85);
          resolve({ dataUrl, width: w, height: h, size: Math.round((dataUrl.length * 3) / 4) });
        };
        img.onerror = () => {
          resolve({ dataUrl: rawResult, width: 0, height: 0, size: file.size });
        };
        img.src = rawResult;
      };
      reader.onerror = () => {
        resolve({ dataUrl: '', width: 0, height: 0, size: 0 });
      };
      reader.readAsDataURL(file);
    });
  };

  // Unified batch file upload handler
  const handleFilesBatch = async (fileList: FileList | File[], overrideCat?: string) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) {
      alert('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP, SVG) নির্বাচন করুন।');
      return;
    }

    setIsUploading(true);
    const targetCat = (overrideCat || (mediaCategoryFilter === 'all' ? (activeTab === 'header' ? 'logo' : 'banner') : mediaCategoryFilter)) as any;

    try {
      let currentCfg = { ...config };
      let updatedAny = false;

      for (const file of files) {
        const { dataUrl, size } = await processImageFile(file);
        if (!dataUrl) continue;

        landingPageService.addMediaItem({
          name: file.name,
          url: dataUrl,
          size: size || file.size,
          type: file.type,
          altText: file.name.replace(/\.[^/.]+$/, ''),
          category: targetCat,
        });

        // Category specific integrations:
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

  // Set an existing MediaItem as School Logo
  const handleSetAsSchoolLogo = (item: MediaItem) => {
    const updatedCfg: LandingPageConfig = {
      ...config,
      header: {
        ...config.header,
        logoUrl: item.url,
        showLogo: true,
      },
      seo: {
        ...config.seo,
        favicon: item.url,
      },
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

  // Set as Hero Background Banner
  const handleSetAsHeroBanner = (item: MediaItem) => {
    const updatedCfg: LandingPageConfig = {
      ...config,
      hero: {
        ...config.hero,
        bgType: 'image',
        bgImage: item.url,
      },
    };
    handleUpdateConfig(updatedCfg);
    if (item.category !== 'banner') {
      landingPageService.updateMediaItem(item.id, { category: 'banner' });
      setMediaList(landingPageService.getMediaList());
    }
    showToast(`"${item.name}" হোমপেজ ব্যাকগ্রাউন্ড ব্যানার হিসেবে সেট করা হয়েছে!`, 'success');
  };

  // Add to Hero Slider
  const handleAddToHeroSlider = (item: MediaItem) => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      title: config.hero.title || config.header.schoolName,
      subtitle: config.hero.subtitle || 'জ্ঞানে ও আলোয় আলোকিত ভবিষ্যৎ',
      imageUrl: item.url,
      ctaText: 'ভর্তি তথ্য',
      ctaLink: '/admission',
    };
    const currentSlides = config.hero.slides || [];
    const updatedCfg: LandingPageConfig = {
      ...config,
      hero: {
        ...config.hero,
        enableSlider: true,
        slides: [...currentSlides, newSlide],
      },
    };
    handleUpdateConfig(updatedCfg);
    if (item.category !== 'banner') {
      landingPageService.updateMediaItem(item.id, { category: 'banner' });
      setMediaList(landingPageService.getMediaList());
    }
    showToast(`"${item.name}" হিরো স্লাইডারে যুক্ত করা হয়েছে!`, 'success');
  };

  // Dedicated Slide Management Handlers
  const handleAddHeroSlide = (fileOrUrl: File | string, title?: string, subtitle?: string) => {
    if (typeof fileOrUrl === 'string') {
      const newSlide: HeroSlide = {
        id: `slide-${Date.now()}`,
        title: title || config.hero.title || config.header.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
        subtitle: subtitle || config.hero.subtitle || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ',
        imageUrl: fileOrUrl,
        ctaText: 'ভর্তি আবেদন',
        ctaLink: '/admission',
      };
      const updated = {
        ...config,
        hero: {
          ...config.hero,
          enableSlider: true,
          slides: [...(config.hero.slides || []), newSlide],
        },
      };
      handleUpdateConfig(updated);
      landingPageService.addMediaItem({
        name: title || 'ব্যানার স্লাইডার ছবি',
        category: 'banner',
        url: fileOrUrl,
        size: 1200000,
        type: 'image/jpeg',
        altText: title || 'ব্যানার ছবি',
      });
      setMediaList(landingPageService.getMediaList());
      showToast('নতুন ব্যানার স্লাইড সফলভাবে যুক্ত হয়েছে!', 'success');
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (dataUrl) {
          const newSlide: HeroSlide = {
            id: `slide-${Date.now()}`,
            title: title || config.hero.title || config.header.schoolName || 'বরইতলী উচ্চ বিদ্যালয়',
            subtitle: subtitle || config.hero.subtitle || 'গুণগত শিক্ষা ও সুনাগরিক গড়ার আদর্শ বিদ্যাপীঠ',
            imageUrl: dataUrl,
            ctaText: 'ভর্তি আবেদন',
            ctaLink: '/admission',
          };
          const updated = {
            ...config,
            hero: {
              ...config.hero,
              enableSlider: true,
              slides: [...(config.hero.slides || []), newSlide],
            },
          };
          handleUpdateConfig(updated);
          landingPageService.addMediaItem({
            name: fileOrUrl.name || 'ব্যানার স্লাইডার ছবি',
            category: 'banner',
            url: dataUrl,
            size: fileOrUrl.size || 1200000,
            type: fileOrUrl.type || 'image/jpeg',
            altText: title || fileOrUrl.name,
          });
          setMediaList(landingPageService.getMediaList());
          showToast(`"${fileOrUrl.name}" স্লাইডারে সফলভাবে যুক্ত হয়েছে!`, 'success');
        }
      };
      reader.readAsDataURL(fileOrUrl);
    }
  };

  const handleDeleteHeroSlide = (slideId: string) => {
    const updatedSlides = (config.hero.slides || []).filter((s) => s.id !== slideId);
    const updated = {
      ...config,
      hero: {
        ...config.hero,
        slides: updatedSlides,
      },
    };
    handleUpdateConfig(updated);
    showToast('স্লাইডটি মুছে ফেলা হয়েছে!', 'info');
  };

  const handleMoveHeroSlide = (index: number, direction: 'up' | 'down') => {
    const slides = [...(config.hero.slides || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const temp = slides[index];
    slides[index] = slides[targetIndex];
    slides[targetIndex] = temp;
    const updated = {
      ...config,
      hero: {
        ...config.hero,
        slides,
      },
    };
    handleUpdateConfig(updated);
    showToast('স্লাইডারের ক্রম পরিবর্তন করা হয়েছে!', 'info');
  };

  const handleReplaceHeroSlideImage = (slideId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (dataUrl) {
        const updatedSlides = (config.hero.slides || []).map((s) =>
          s.id === slideId ? { ...s, imageUrl: dataUrl } : s
        );
        const updated = {
          ...config,
          hero: {
            ...config.hero,
            slides: updatedSlides,
          },
        };
        handleUpdateConfig(updated);
        landingPageService.addMediaItem({
          name: file.name,
          category: 'banner',
          url: dataUrl,
          size: file.size || 1200000,
          type: file.type || 'image/jpeg',
          altText: 'আপডেট করা ব্যানার ছবি',
        });
        setMediaList(landingPageService.getMediaList());
        showToast('স্লাইডের ছবি সফলভাবে পরিবর্তন করা হয়েছে!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearDemoHeroSlides = () => {
    if (confirm('আপনি কি সমস্ত ডেমো স্টক স্লাইড মুছে ফেলতে চান? এরপর শুধুমাত্র আপনার আপলোড করা আসল ছবিগুলো স্লাইডারে থাকবে।')) {
      const updated = {
        ...config,
        hero: {
          ...config.hero,
          slides: [],
        },
      };
      handleUpdateConfig(updated);
      showToast('সকল ডেমো স্লাইড মুছে ফেলা হয়েছে! এখন আপনার নতুন ছবি যোগ করুন।', 'info');
    }
  };

  // Add to Gallery
  const handleAddToGallery = (item: MediaItem) => {
    const currentGal = config.gallery || DEFAULT_LANDING_CONFIG.gallery!;
    const exists = (currentGal.items || []).some(g => g.thumbnail === item.url);
    if (exists) {
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
    const updatedCfg: LandingPageConfig = {
      ...config,
      gallery: {
        ...currentGal,
        items: [newGalItem, ...(currentGal.items || [])],
      },
    };
    handleUpdateConfig(updatedCfg);
    if (item.category !== 'gallery') {
      landingPageService.updateMediaItem(item.id, { category: 'gallery' });
      setMediaList(landingPageService.getMediaList());
    }
    showToast(`"${item.name}" সফলভাবে গ্যালারিতে যুক্ত করা হয়েছে!`, 'success');
  };

  // Add to Achiever Students
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
    const updatedCfg: LandingPageConfig = {
      ...config,
      achievers: {
        ...currentAch,
        students: [newStudent, ...(currentAch.students || [])],
      },
    };
    handleUpdateConfig(updatedCfg);
    if (item.category !== 'student') {
      landingPageService.updateMediaItem(item.id, { category: 'student' });
      setMediaList(landingPageService.getMediaList());
    }
    showToast(`"${item.name}" সেরা শিক্ষার্থী তালিকায় যুক্ত হয়েছে!`, 'success');
  };

  // Change category of media item
  const handleChangeCategory = (item: MediaItem, newCategory: any) => {
    landingPageService.updateMediaItem(item.id, { category: newCategory });
    setMediaList(landingPageService.getMediaList());
    showToast(`ক্যাটাগরি "${newCategory}" তে পরিবর্তন করা হয়েছে`, 'info');
  };

  return (
    <div className="space-y-6 pb-20 text-slate-800 dark:text-slate-100">
      {/* ─── TOAST NOTIFICATION ─── */}
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
          {toastMessage.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
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

      {/* ─── TOP ACTION & HEADER BAR ─── */}
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

          {/* Quick Action Buttons */}
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

        {/* ─── 13 MODULE TABS ─── */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              { id: 'overview', label: 'ওভারভিউ', icon: <Layers className="w-4 h-4" /> },
              { id: 'sections', label: 'সেকশন ম্যানেজার', icon: <LayoutTemplate className="w-4 h-4" /> },
              { id: 'header', label: 'হেডার ও নেভিগেশন', icon: <Globe className="w-4 h-4" /> },
              { id: 'hero', label: 'হিরো ও ব্যানার', icon: <Sparkles className="w-4 h-4" /> },
              { id: 'about', label: 'পরিচিতি ও বাণী', icon: <School className="w-4 h-4" /> },
              { id: 'features', label: 'ফিচার ও সুবিধাসমূহ', icon: <Building2 className="w-4 h-4" /> },
              { id: 'stats', label: 'পরিসংখ্যান', icon: <Award className="w-4 h-4" /> },
              { id: 'academic', label: 'একাডেমিক ও শাখা', icon: <BookOpen className="w-4 h-4" /> },
              { id: 'achievers', label: 'সেরা ছাত্র/ছাত্রী', icon: <GraduationCap className="w-4 h-4" /> },
              { id: 'gallery', label: 'গ্যালারি ছবি ও ভিডিও', icon: <Camera className="w-4 h-4" /> },
              { id: 'blog', label: 'সংবাদ ও ব্লগ', icon: <FileText className="w-4 h-4" /> },
              { id: 'faq', label: 'সাধারণ প্রশ্নোত্তর', icon: <HelpCircle className="w-4 h-4" /> },
              { id: 'media', label: 'ছবি ও মিডিয়া', icon: <ImageIcon className="w-4 h-4" /> },
              { id: 'theme', label: 'রং, ফন্ট ও থিম', icon: <Palette className="w-4 h-4" /> },
              { id: 'footer', label: 'যোগাযোগ ও ফুটার', icon: <Mail className="w-4 h-4" /> },
              { id: 'seo', label: 'SEO ও সোশ্যাল', icon: <Share2 className="w-4 h-4" /> },
              { id: 'history', label: 'সংস্করণ ইতিহাস', icon: <History className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 1: OVERVIEW (ওভারভিউ)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Management Hub */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>সহজ কুইক এক্সেস কন্ট্রোল প্যানেল</span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  শিক্ষার্থী, গ্যালারি ও সেরা শিক্ষার্থী দ্রুত পরিচালনা
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  এক ক্লিকেই শিক্ষার্থী ডাটাবেজ আপডেট, গ্যালারির ছবি পরিবর্তন কিংবা সেরা কৃতি শিক্ষার্থীদের তথ্য পরিমার্জন করুন।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Student Database */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                      <Users className="w-5 h-5" />
                    </span>
                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      লাইভ ডাটাবেজ
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">শিক্ষার্থী ডাটাবেজ</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    মোট শিক্ষার্থী: {liveStudents.length > 0 ? `${liveStudents.length} জন` : 'ডাটা প্রস্তুত'}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2">
                  <Link
                    href="/dashboard/students"
                    className="flex-1 text-center py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                  >
                    শিক্ষার্থী তালিকা
                  </Link>
                  <Link
                    href="/dashboard/admission"
                    className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                    title="অনলাইন ভর্তি"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* 2. Photo Gallery */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                      <Camera className="w-5 h-5" />
                    </span>
                    <span className="text-[11px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                      {config.gallery?.items?.length || 3} টি আইটেম
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">ফটো ও ভিডিও গ্যালারি</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    ক্যাম্পাস লাইফ, ল্যাব ও ক্রীড়া ছবি
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10">
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <span>গ্যালারি পরিবর্তন করুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3. Achievers */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                      <GraduationCap className="w-5 h-5" />
                    </span>
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                      {config.achievers.students.length} জন কৃতি
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">সেরা ছাত্র/ছাত্রী</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    বোর্ড ও মেধা অন্বেষণে শীর্ষস্থান
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('achievers')}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
                  >
                    কৃতি তালিকা এডিট
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('achievers');
                      setShowImportModal(true);
                    }}
                    className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                    title="ডাটাবেজ থেকে শীর্ষ শিক্ষার্থী ইমপোর্ট"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4. Headmaster & President Message */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                      <School className="w-5 h-5" />
                    </span>
                    <span className="text-[11px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                      বাণী ও পরিচিতি
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">প্রধান শিক্ষক ও সভাপতি</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    ছবি, পদবি ও দিকনির্দেশনামূলক বাণী
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10">
                  <button
                    onClick={() => setActiveTab('about')}
                    className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <span>বাণী ও পরিচিতি এডিট</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">লাইভ স্ট্যাটাস</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">সংস্করণ {config.version}</span>
                <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">সর্বশেষ আপডেট: {new Date(config.lastUpdatedAt).toLocaleDateString('bn-BD')}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">সক্রিয় সেকশন</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {config.sections.filter(s => s.enabled).length} / {config.sections.length}
                </span>
                <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                  <Layers className="w-6 h-6" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">ল্যান্ডিং পেজে দৃশ্যমান রয়েছে</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">মিডিয়া ফাইলসমূহ</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{mediaList.length} টি ফাইল</span>
                <span className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                  <ImageIcon className="w-6 h-6" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">লোগো, ব্যানার ও ফটো গ্যালারি</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">প্রকাশের ইতিহাস</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{versions.length} টি স্ন্যাপশট</span>
                <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <History className="w-6 h-6" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">যেকোনো সময় আগের সংস্করণে ফেরা যাবে</p>
            </div>
          </div>

          {/* Quick Shortcuts & Section Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">সেকশনসমূহের বর্তমান স্ট্যাটাস</h3>
                <button
                  onClick={() => setActiveTab('sections')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  সেকশন ম্যানেজার খুলুন <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {config.sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{sec.nameBn}</span>
                        <span className="text-xs text-slate-400 block">{sec.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          sec.enabled
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {sec.enabled ? 'দৃশ্যমান' : 'লুকানো'}
                      </span>
                      <button
                        onClick={() => handleToggleSection(sec.id, sec.enabled)}
                        className="text-xs font-bold px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 transition"
                      >
                        {sec.enabled ? 'হাইড করুন' : 'শো করুন'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Guide */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-indigo-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-white/10 text-yellow-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-base">সহজ ৩-ধাপে পরিবর্তন</h3>
                </div>
                <ul className="text-xs space-y-2.5 text-indigo-100 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">১</span>
                    <span>যেকোনো ট্যাবে গিয়ে টেক্সট, ছবি বা ডিজাইন পরিবর্তন করুন।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">২</span>
                    <span><strong>"লাইভ প্রিভিউ"</strong> বাটনে ক্লিক করে মোবাইল বা কম্পিউটারে কেমন দেখাবে তা পরীক্ষা করুন।</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">৩</span>
                    <span>সব ঠিক থাকলে <strong>"প্রকাশ করুন"</strong> বাটনে ক্লিক করলেই এক ক্লিকে মূল ওয়েবসাইট আপডেট হয়ে যাবে!</span>
                  </li>
                </ul>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-indigo-200">লাইভ ওয়েবসাইট সরাসরি দেখুন:</span>
                  <Link
                    href="/"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-indigo-900 font-extrabold text-xs hover:bg-indigo-50 transition"
                  >
                    <span>ভিজিট সাইট</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Institution Summary Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">প্রতিষ্ঠান পরিচিতি সংক্ষেপ</h4>
                <div className="text-sm">
                  <p className="font-extrabold text-slate-900 dark:text-white">{config.header.schoolName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{config.header.topbarAddress}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>EIIN:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{config.footer.eiin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>স্কুল কোড:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{config.footer.schoolCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ফোন:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{config.header.topbarPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 2: SECTION MANAGER (সেকশন ম্যানেজার)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">সেকশন ম্যানেজার ও ক্রম পরিবর্তন</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  ল্যান্ডিং পেজের সেকশনগুলোকে ড্র্যাগ/আপ-ডাউন করে সাজান, প্রদর্শন বা গোপন করুন এবং নতুন সেকশন যোগ করুন।
                </p>
              </div>
              <button
                onClick={() => setShowAddSectionModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন সেকশন যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.sections.map((sec, index) => (
                <div
                  key={sec.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    sec.enabled
                      ? 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Order Badge */}
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200 dark:border-slate-700">
                      {sec.order}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {sec.nameBn}
                        </span>
                        {sec.type === 'custom' && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            কাস্টম
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{sec.description}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition text-slate-600 dark:text-slate-300"
                      title="উপরে নিন"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveSection(index, 'down')}
                      disabled={index === config.sections.length - 1}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition text-slate-600 dark:text-slate-300"
                      title="নিচে নিন"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicateSection(sec)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
                      title="ডুপ্লিকেট করুন"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Show/Hide Toggle */}
                    <button
                      onClick={() => handleToggleSection(sec.id, sec.enabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
                        sec.enabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {sec.enabled ? 'দৃশ্যমান' : 'লুকানো'}
                    </button>

                    {/* Delete for custom or hide */}
                    <button
                      onClick={() => handleDeleteSection(sec)}
                      className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 transition"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 3: HEADER & NAVIGATION (হেডার ও নেভিগেশন)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'header' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">হেডার ও ব্র্যান্ডিং সেটিংস</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* School Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  বিদ্যালয়ের পূর্ণ নাম (বাংলা)
                </label>
                <input
                  type="text"
                  value={config.header.schoolName}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      header: { ...config.header, schoolName: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="যেমন: বরইতলী উচ্চ বিদ্যালয়"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">এটি হেডারের লোগোর পাশে এবং ব্রাউজার ট্যাবে প্রদর্শিত হবে।</span>
              </div>

              {/* Slogan */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  বিদ্যালয়ের মূল বাণী বা স্লোগান
                </label>
                <input
                  type="text"
                  value={config.header.schoolSlogan}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      header: { ...config.header, schoolSlogan: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="যেমন: জ্ঞানে ও আলোয় আলোকিত ভবিষ্যৎ"
                />
              </div>

              {/* School Logo Section with Live Preview & Direct Upload */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    বিদ্যালয়ের অফিসিয়াল লোগো
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={config.header.showLogo}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          header: { ...config.header, showLogo: e.target.checked },
                        })
                      }
                      className="w-3.5 h-3.5 text-indigo-600 rounded"
                    />
                    <span>হেডারে লোগো দেখান</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Logo Preview Box */}
                  <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm flex items-center justify-center shrink-0 group">
                    {config.header.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={config.header.logoUrl}
                        alt="School Logo"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <School className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  {/* Actions & URL Input */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>ডিভাইস থেকে লোগো আপলোড করুন</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaCategoryFilter('logo');
                          setActiveTab('media');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>মিডিয়া লাইব্রেরি থেকে বাছুন</span>
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={config.header.logoUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateConfig({
                            ...config,
                            header: { ...config.header, logoUrl: val },
                            seo: { ...config.seo, favicon: val || config.seo?.favicon },
                          });
                          try {
                            settingsService.updateSettings({ schoolLogo: val });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="অথবা লোগোর সরাসরি URL পেস্ট করুন (/logo.png বা ডাটা URL)"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      * এই লোগোটি স্বয়ংক্রিয়ভাবে ওয়েবসাইটের হেডার, ব্রাউজার ফেভিকন এবং সকল রিপোর্ট ও প্রত্যয়নপত্রে ব্যবহৃত হবে।
                    </p>
                  </div>
                </div>
              </div>

              {/* Sticky Navbar & Notice Ticker Toggle */}
              <div className="flex flex-col justify-center space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.header.sticky}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, sticky: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">স্টিকি হেডার (স্ক্রল করলেও উপরে আটকে থাকবে)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.header.showNoticeTicker}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, showNoticeTicker: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">টপ নোটিশ স্ক্রলার (জরুরি ঘোষণা বার) প্রদর্শন করুন</span>
                </label>
              </div>
            </div>

            {/* Topbar Contact Info */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">টপ কন্টাক্ট বার ইনফরমেশন</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">হেল্পলাইন ফোন নম্বর</label>
                  <input
                    type="text"
                    value={config.header.topbarPhone}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, topbarPhone: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">অফিসিয়াল ইমেইল</label>
                  <input
                    type="text"
                    value={config.header.topbarEmail}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, topbarEmail: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">সংক্ষিপ্ত ঠিকানা</label>
                  <input
                    type="text"
                    value={config.header.topbarAddress}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        header: { ...config.header, topbarAddress: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Navigation Menu Links Editor */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">নেভিগেশন মেনু আইটেমসমূহ</h3>
                  <p className="text-xs text-slate-500">মেনুর লেখা, লিংক ও বাটনের ধরন পরিবর্তন করুন।</p>
                </div>
                <button
                  onClick={() => {
                    const newLink: NavMenuItem = {
                      id: `nav-${Date.now()}`,
                      label: 'নতুন মেনু',
                      href: '#',
                      visible: true,
                      order: config.header.navLinks.length + 1,
                    };
                    handleUpdateConfig({
                      ...config,
                      header: {
                        ...config.header,
                        navLinks: [...config.header.navLinks, newLink],
                      },
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>মেনু যোগ করুন</span>
                </button>
              </div>

              <div className="space-y-2">
                {config.header.navLinks.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => {
                        const updated = [...config.header.navLinks];
                        updated[idx].label = e.target.value;
                        handleUpdateConfig({ ...config, header: { ...config.header, navLinks: updated } });
                      }}
                      className="w-full sm:w-40 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                      placeholder="মেনু নাম"
                    />

                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => {
                        const updated = [...config.header.navLinks];
                        updated[idx].href = e.target.value;
                        handleUpdateConfig({ ...config, header: { ...config.header, navLinks: updated } });
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none"
                      placeholder="লিংক বা #id"
                    />

                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={item.isButton || false}
                        onChange={(e) => {
                          const updated = [...config.header.navLinks];
                          updated[idx].isButton = e.target.checked;
                          handleUpdateConfig({ ...config, header: { ...config.header, navLinks: updated } });
                        }}
                      />
                      <span>বাটন স্টাইল</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={item.visible}
                        onChange={(e) => {
                          const updated = [...config.header.navLinks];
                          updated[idx].visible = e.target.checked;
                          handleUpdateConfig({ ...config, header: { ...config.header, navLinks: updated } });
                        }}
                      />
                      <span>দৃশ্যমান</span>
                    </label>

                    <button
                      onClick={() => {
                        const updated = config.header.navLinks.filter((_, i) => i !== idx);
                        handleUpdateConfig({ ...config, header: { ...config.header, navLinks: updated } });
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 4: HERO & BANNERS (হিরো ও ব্যানার)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">হিরো সেকশন ও প্রধান ব্যানার</h2>
                <p className="text-xs text-slate-500">হোমপেজের মূল আকর্ষণীয় অংশ, হেডলাইন, ব্যানার ছবি ও অ্যাকশন বাটন।</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.hero.enabled}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      hero: { ...config.hero, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-black">হিরো সেকশন সক্রিয় রাখুন</span>
              </label>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
             * 1. CAMPUS BANNER & TRANSITION SLIDES (হোমপেজ ব্যানার ও স্লাইডার ছবি)
             * ══════════════════════════════════════════════════════════════════ */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      হোমপেজ ব্যানার ও ট্রানজিশন স্লাইডার ছবিসমূহ
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                      {(config.hero.slides || []).length} টি স্লাইড সক্রিয়
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    হোমপেজের মূল ব্যানারে যে ছবিগুলো স্বয়ংক্রিয়ভাবে ট্রানজিশন (পরিবর্তন) হয় সেগুলো এখান থেকে সহজে আপলোড, পরিবর্তন, সাজানো বা মুছে ফেলা যাবে।
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => heroSlideFileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন ব্যানার ছবি যোগ করুন</span>
                  </button>
                  <input
                    type="file"
                    ref={heroSlideFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleAddHeroSlide(file);
                        e.target.value = '';
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={replaceSlideFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && replacingSlideId) {
                        handleReplaceHeroSlideImage(replacingSlideId, file);
                        setReplacingSlideId(null);
                        e.target.value = '';
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Slider Settings Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.hero.enableSlider !== false}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        hero: { ...config.hero, enableSlider: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>স্বয়ংক্রিয় স্লাইডার চালু রাখুন</span>
                </label>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>ছবির ওপর ডার্ক ওভারলে:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">
                      {config.hero.bgOverlayOpacity ?? 45}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="80"
                    step="5"
                    value={config.hero.bgOverlayOpacity ?? 45}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        hero: { ...config.hero, bgOverlayOpacity: parseInt(e.target.value) || 45 },
                      })
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleClearDemoHeroSlides}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>সকল ডেমো স্টক স্লাইড মুছে ফেলুন</span>
                  </button>
                </div>
              </div>

              {/* URL or Library Quick Add Option */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={slideUrlInput}
                  onChange={(e) => setSlideUrlInput(e.target.value)}
                  placeholder="অথবা সরাসরি কোনো ছবির অনলাইন লিঙ্ক পেস্ট করুন..."
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium outline-none focus:border-indigo-500 w-full"
                />
                <button
                  type="button"
                  disabled={!slideUrlInput.trim()}
                  onClick={() => {
                    if (slideUrlInput.trim()) {
                      handleAddHeroSlide(slideUrlInput.trim());
                      setSlideUrlInput('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 transition cursor-pointer shrink-0 w-full sm:w-auto"
                >
                  লিঙ্ক থেকে স্লাইড যোগ করুন
                </button>
              </div>

              {/* Active Slides Cards Grid */}
              <div className="space-y-3">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                  বর্তমান স্লাইড তালিকা (ট্রানজিশনের ক্রম অনুযায়ী প্রদর্শিত হবে):
                </span>

                {(!config.hero.slides || config.hero.slides.length === 0) ? (
                  <div className="p-8 text-center rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3">
                    <ImageIcon className="w-10 h-10 text-indigo-400 mx-auto" />
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">এখনো কোনো কাস্টম স্লাইড যোগ করা হয়নি</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">আপনার প্রতিষ্ঠানের ক্যাম্পাস, ভবন, অ্যাসেম্বলি বা অনুষ্ঠানের ছবি আপলোড করতে ওপরের &quot;নতুন ব্যানার ছবি যোগ করুন&quot; বাটনে ক্লিক করুন।</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {config.hero.slides.map((slide, idx) => (
                      <div
                        key={slide.id || idx}
                        className="group relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                      >
                        {/* Slide Preview Image */}
                        <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                          <img
                            src={slide.imageUrl}
                            alt={slide.title || `Slide ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-black border border-white/20">
                            স্লাইড #{idx + 1}
                          </div>
                          <div className="absolute bottom-2 right-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setReplacingSlideId(slide.id);
                                replaceSlideFileInputRef.current?.click();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 backdrop-blur-md text-white text-[10.5px] font-bold border border-white/20 flex items-center gap-1 transition cursor-pointer"
                              title="ছবি পরিবর্তন করুন"
                            >
                              <Camera className="w-3 h-3 text-amber-400" />
                              <span>ছবি পরিবর্তন</span>
                            </button>
                          </div>
                        </div>

                        {/* Slide Details */}
                        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={slide.title || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = (config.hero.slides || []).map((s, i) =>
                                  i === idx ? { ...s, title: val } : s
                                );
                                handleUpdateConfig({
                                  ...config,
                                  hero: { ...config.hero, slides: updated },
                                });
                              }}
                              placeholder="স্লাইড শিরোনাম"
                              className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-900 focus:bg-white outline-none"
                            />
                            <input
                              type="text"
                              value={slide.subtitle || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = (config.hero.slides || []).map((s, i) =>
                                  i === idx ? { ...s, subtitle: val } : s
                                );
                                handleUpdateConfig({
                                  ...config,
                                  hero: { ...config.hero, slides: updated },
                                });
                              }}
                              placeholder="উপশিরোনাম / বিবরণী..."
                              className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium bg-slate-50 dark:bg-slate-900 focus:bg-white outline-none"
                            />
                          </div>

                          {/* Reorder and Delete Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveHeroSlide(idx, 'up')}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer text-slate-600 dark:text-slate-300"
                                title="আগে নিন"
                              >
                                <MoveUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === config.hero.slides.length - 1}
                                onClick={() => handleMoveHeroSlide(idx, 'down')}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer text-slate-600 dark:text-slate-300"
                                title="পরে নিন"
                              >
                                <MoveDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteHeroSlide(slide.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition"
                              title="স্লাইড মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Badge Text */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  শীর্ষ ব্যাজ বা স্ট্যাটাস টেক্সট
                </label>
                <input
                  type="text"
                  value={config.hero.badgeText}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      hero: { ...config.hero, badgeText: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="যেমন: 🏛️ ঐতিহ্যের ৫৫ বছর | স্থাপিত ১৯৬৯"
                />
              </div>

              {/* Main Title */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রধান শিরোনাম
                </label>
                <input
                  type="text"
                  value={config.hero.title}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      hero: { ...config.hero, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="যেমন: বরইতলী উচ্চ বিদ্যালয়"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  উপ-শিরোনাম বা অবস্থান
                </label>
                <input
                  type="text"
                  value={config.hero.subtitle}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      hero: { ...config.hero, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="যেমন: 📍 Baritali, Chakaria, Cox's Bazar."
                />
              </div>

              {/* Background Type */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  হিরো ব্যাকগ্রাউন্ডের ধরন
                </label>
                <select
                  value={config.hero.bgType}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      hero: { ...config.hero, bgType: e.target.value as any },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="gradient">আধুনিক ডার্ক গ্রেডিয়েন্ট</option>
                  <option value="image">ক্যাম্পাস ব্যাকগ্রাউন্ড ছবি</option>
                  <option value="solid">এক রঙের ব্যাকগ্রাউন্ড</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                সংক্ষিপ্ত বিবরণ
              </label>
              <textarea
                rows={3}
                value={config.hero.description}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    hero: { ...config.hero, description: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="বিদ্যালয়ের বৈশিষ্ট্য ও মিশন সম্পর্কিত ২-৩ লাইনের বিবরণ"
              />
            </div>

            {/* CTA Buttons */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">অ্যাকশন বাটনসমূহ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Primary CTA */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">প্রধান বাটন</span>
                    <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.hero.primaryCta.visible}
                        onChange={(e) =>
                          handleUpdateConfig({
                            ...config,
                            hero: {
                              ...config.hero,
                              primaryCta: { ...config.hero.primaryCta, visible: e.target.checked },
                            },
                          })
                        }
                      />
                      <span>সক্রিয়</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">বাটনের লেখা</label>
                    <input
                      type="text"
                      value={config.hero.primaryCta.text}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          hero: {
                            ...config.hero,
                            primaryCta: { ...config.hero.primaryCta, text: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">টার্গেট লিংক</label>
                    <input
                      type="text"
                      value={config.hero.primaryCta.href}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          hero: {
                            ...config.hero,
                            primaryCta: { ...config.hero.primaryCta, href: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Secondary CTA */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">দ্বিতীয় বাটন</span>
                    <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.hero.secondaryCta.visible}
                        onChange={(e) =>
                          handleUpdateConfig({
                            ...config,
                            hero: {
                              ...config.hero,
                              secondaryCta: { ...config.hero.secondaryCta, visible: e.target.checked },
                            },
                          })
                        }
                      />
                      <span>সক্রিয়</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">বাটনের লেখা</label>
                    <input
                      type="text"
                      value={config.hero.secondaryCta.text}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          hero: {
                            ...config.hero,
                            secondaryCta: { ...config.hero.secondaryCta, text: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">টার্গেট লিংক</label>
                    <input
                      type="text"
                      value={config.hero.secondaryCta.href}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          hero: {
                            ...config.hero,
                            secondaryCta: { ...config.hero.secondaryCta, href: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 5: ABOUT & LEADERSHIP (পরিচিতি ও বাণী)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">প্রতিষ্ঠান পরিচিতি ও দিকনির্দেশনামূলক বাণী</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  পরিচিতি সেকশনের শিরোনাম
                </label>
                <input
                  type="text"
                  value={config.about.title}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      about: { ...config.about, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রতিষ্ঠা সাল ও ইতিহাস সারসংক্ষেপ
                </label>
                <input
                  type="text"
                  value={config.about.foundingYear}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      about: { ...config.about, foundingYear: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                প্রতিষ্ঠানের সংক্ষিপ্ত ইতিহাস
              </label>
              <textarea
                rows={4}
                value={config.about.historyText}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    about: { ...config.about, historyText: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
              />
            </div>

            {/* President's Speech */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">সভাপতি (ম্যানেজিং কমিটি) মহোদয়ের বাণী</h3>
              </div>

              {/* President Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">সভাপতির ছবি</label>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border-2 border-amber-400">
                    <img
                      src={config.about.president?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop'}
                      alt="President"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>ডিভাইস থেকে ছবি আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              const currentPres = config.about.president || {
                                name: 'আলহাজ্ব মোস্তফা কামাল',
                                title: 'সভাপতি, ম্যানেজিং কমিটি',
                                photo: '',
                                message: '',
                                visible: true,
                              };
                              handleUpdateConfig({
                                ...config,
                                about: {
                                  ...config.about,
                                  president: { ...currentPres, photo: re.target?.result as string },
                                },
                              });
                              showToast('সভাপতির ছবি আপলোড হয়েছে', 'success');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="অথবা অনলাইন ছবির লিঙ্ক"
                      value={config.about.president?.photo || ''}
                      onChange={(e) => {
                        const currentPres = config.about.president || {
                          name: 'আলহাজ্ব মোস্তফা কামাল',
                          title: 'সভাপতি, ম্যানেজিং কমিটি',
                          photo: '',
                          message: '',
                          visible: true,
                        };
                        handleUpdateConfig({
                          ...config,
                          about: {
                            ...config.about,
                            president: { ...currentPres, photo: e.target.value },
                          },
                        });
                      }}
                      className="w-full px-3 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">সভাপতির নাম</label>
                  <input
                    type="text"
                    value={config.about.president?.name || 'আলহাজ্ব মোস্তফা কামাল'}
                    onChange={(e) => {
                      const currentPres = config.about.president || {
                        name: 'আলহাজ্ব মোস্তফা কামাল',
                        title: 'সভাপতি, ম্যানেজিং কমিটি',
                        photo: '',
                        message: '',
                        visible: true,
                      };
                      handleUpdateConfig({
                        ...config,
                        about: {
                          ...config.about,
                          president: { ...currentPres, name: e.target.value },
                        },
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">পদবি</label>
                  <input
                    type="text"
                    value={config.about.president?.title || 'সভাপতি, ম্যানেজিং কমিটি'}
                    onChange={(e) => {
                      const currentPres = config.about.president || {
                        name: 'আলহাজ্ব মোস্তফা কামাল',
                        title: 'সভাপতি, ম্যানেজিং কমিটি',
                        photo: '',
                        message: '',
                        visible: true,
                      };
                      handleUpdateConfig({
                        ...config,
                        about: {
                          ...config.about,
                          president: { ...currentPres, title: e.target.value },
                        },
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">সভাপতির দিকনির্দেশনামূলক বাণী</label>
                <textarea
                  rows={3}
                  value={config.about.president?.message || ''}
                  placeholder="শিক্ষার আলো ছড়িয়ে দিতে এবং মানবিক গুণাবলিসম্পন্ন ভবিষ্যৎ প্রজন্ম গড়ে তুলতে বরইতলী উচ্চ বিদ্যালয় বদ্ধপরিকর..."
                  onChange={(e) => {
                    const currentPres = config.about.president || {
                      name: 'আলহাজ্ব মোস্তফা কামাল',
                      title: 'সভাপতি, ম্যানেজিং কমিটি',
                      photo: '',
                      message: '',
                      visible: true,
                    };
                    handleUpdateConfig({
                      ...config,
                      about: {
                        ...config.about,
                        president: { ...currentPres, message: e.target.value },
                      },
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
                />
              </div>
            </div>

            {/* Principal's Speech */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">প্রধান শিক্ষকের বাণী</h3>
                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.about.headmaster.visible}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        about: {
                          ...config.about,
                          headmaster: { ...config.about.headmaster, visible: e.target.checked },
                        },
                      })
                    }
                  />
                  <span>প্রদর্শন করুন</span>
                </label>
              </div>

              {/* Headmaster Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">প্রধান শিক্ষকের ছবি</label>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border-2 border-teal-500">
                    <img
                      src={config.about.headmaster.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop'}
                      alt="Headmaster"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 hover:bg-teal-100 text-xs font-bold cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>ডিভাইস থেকে ছবি আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (re) => {
                              handleUpdateConfig({
                                ...config,
                                about: {
                                  ...config.about,
                                  headmaster: { ...config.about.headmaster, photo: re.target?.result as string },
                                },
                              });
                              showToast('প্রধান শিক্ষকের ছবি আপলোড হয়েছে', 'success');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="অথবা অনলাইন ছবির লিঙ্ক"
                      value={config.about.headmaster.photo || ''}
                      onChange={(e) =>
                        handleUpdateConfig({
                          ...config,
                          about: {
                            ...config.about,
                            headmaster: { ...config.about.headmaster, photo: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">প্রধান শিক্ষকের নাম</label>
                  <input
                    type="text"
                    value={config.about.headmaster.name}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        about: {
                          ...config.about,
                          headmaster: { ...config.about.headmaster, name: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">পদবি</label>
                  <input
                    type="text"
                    value={config.about.headmaster.title}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        about: {
                          ...config.about,
                          headmaster: { ...config.about.headmaster, title: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">দিকনির্দেশনামূলক বাণী</label>
                <textarea
                  rows={4}
                  value={config.about.headmaster.message}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      about: {
                        ...config.about,
                        headmaster: { ...config.about.headmaster, message: e.target.value },
                      },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 6: FEATURES & SERVICES (ফিচার ও সেবা)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">অনলাইন সেবা কার্ডসমূহ</h2>
                <p className="text-xs text-slate-500">শিক্ষার্থী ও অভিভাবকদের দ্রুত সেবা প্রদান সংক্রান্ত পোর্টাল কার্ড।</p>
              </div>
              <button
                onClick={() => {
                  const newCard: ServiceCard = {
                    id: `srv-${Date.now()}`,
                    title: 'নতুন অনলাইন সেবা',
                    description: 'এই সেবার সংক্ষিপ্ত বিবরণ এখানে লিখুন।',
                    icon: 'FileText',
                    link: '#',
                    badge: 'নতুন',
                    badgeColor: 'blue',
                    visible: true,
                  };
                  handleUpdateConfig({
                    ...config,
                    services: {
                      ...config.services,
                      cards: [...config.services.cards, newCard],
                    },
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>সেবা কার্ড যোগ করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.services.cards.map((card, idx) => (
                <div
                  key={card.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={card.visible}
                          onChange={(e) => {
                            const updated = [...config.services.cards];
                            updated[idx].visible = e.target.checked;
                            handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                          }}
                        />
                        <span>সক্রিয়</span>
                      </label>
                      <button
                        onClick={() => {
                          const updated = config.services.cards.filter((_, i) => i !== idx);
                          handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">সেবার শিরোনাম</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => {
                        const updated = [...config.services.cards];
                        updated[idx].title = e.target.value;
                        handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">বিবরণ</label>
                    <textarea
                      rows={2}
                      value={card.description}
                      onChange={(e) => {
                        const updated = [...config.services.cards];
                        updated[idx].description = e.target.value;
                        handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ওয়েব লিংক</label>
                      <input
                        type="text"
                        value={card.link}
                        onChange={(e) => {
                          const updated = [...config.services.cards];
                          updated[idx].link = e.target.value;
                          handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                        }}
                        className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ব্যাজ টেক্সট</label>
                      <input
                        type="text"
                        value={card.badge || ''}
                        onChange={(e) => {
                          const updated = [...config.services.cards];
                          updated[idx].badge = e.target.value;
                          handleUpdateConfig({ ...config, services: { ...config.services, cards: updated } });
                        }}
                        className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campus Facilities Management Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold mb-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  ক্যাম্পাস সুবিধাসমূহ সেটিংস
                </h2>
                <p className="text-xs text-slate-500">
                  আইসিটি ল্যাব, বিজ্ঞানাগার, লাইব্রেরি, খেলার মাঠ ও স্যানিটেশন সংক্রান্ত তথ্যাদি সম্পাদনা করুন।
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.facilities?.enabled !== false}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        facilities: {
                          ...config.facilities,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">সেকশন চালু রাখুন</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const newFacility: FacilityItem = {
                      id: `fac-${Date.now()}`,
                      title: 'নতুন ক্যাম্পাস সুবিধা',
                      titleEn: 'New Campus Facility',
                      description: 'এই সুবিধার সংক্ষিপ্ত বর্ণনা এখানে লিখুন।',
                      icon: 'Monitor',
                      badge: 'নতুন সুবিধা',
                      color: 'indigo',
                      visible: true,
                    };
                    const currentItems = config.facilities?.items || [];
                    handleUpdateConfig({
                      ...config,
                      facilities: {
                        ...config.facilities,
                        items: [...currentItems, newFacility],
                      },
                    });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>সুবিধা যোগ করুন</span>
                </button>
              </div>
            </div>

            {/* Section Header Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  আইব্রো ট্যাগ
                </label>
                <input
                  type="text"
                  value={config.facilities?.eyebrow || ''}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      facilities: {
                        ...config.facilities,
                        eyebrow: e.target.value,
                      },
                    })
                  }
                  placeholder="যেমন: ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  সেকশন শিরোনাম
                </label>
                <input
                  type="text"
                  value={config.facilities?.title || ''}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      facilities: {
                        ...config.facilities,
                        title: e.target.value,
                      },
                    })
                  }
                  placeholder="যেমন: শিক্ষার্থীদের সার্বিক বিকাশে আধুনিক সুযোগ-সুবিধা"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  উপ-শিরোনাম / বিবরণী
                </label>
                <input
                  type="text"
                  value={config.facilities?.subtitle || ''}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      facilities: {
                        ...config.facilities,
                        subtitle: e.target.value,
                      },
                    })
                  }
                  placeholder="সুপরিকল্পিত ও মনোরম ক্যাম্পাস পরিবেশ..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>

            {/* Facility Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(config.facilities?.items || []).map((fac, fIdx) => (
                <div
                  key={fac.id || fIdx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center">
                      {fIdx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fac.visible !== false}
                          onChange={(e) => {
                            const updated = [...(config.facilities?.items || [])];
                            updated[fIdx].visible = e.target.checked;
                            handleUpdateConfig({
                              ...config,
                              facilities: { ...config.facilities, items: updated },
                            });
                          }}
                        />
                        <span>সক্রিয়</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (config.facilities?.items || []).filter((_, i) => i !== fIdx);
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">বাংলা নাম</label>
                      <input
                        type="text"
                        value={fac.title}
                        onChange={(e) => {
                          const updated = [...(config.facilities?.items || [])];
                          updated[fIdx].title = e.target.value;
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ইংরেজি নাম</label>
                      <input
                        type="text"
                        value={fac.titleEn || ''}
                        onChange={(e) => {
                          const updated = [...(config.facilities?.items || [])];
                          updated[fIdx].titleEn = e.target.value;
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium font-en"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">বিবরণ</label>
                    <textarea
                      rows={2}
                      value={fac.description}
                      onChange={(e) => {
                        const updated = [...(config.facilities?.items || [])];
                        updated[fIdx].description = e.target.value;
                        handleUpdateConfig({
                          ...config,
                          facilities: { ...config.facilities, items: updated },
                        });
                      }}
                      className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">আইকন</label>
                      <select
                        value={fac.icon || 'Monitor'}
                        onChange={(e) => {
                          const updated = [...(config.facilities?.items || [])];
                          updated[fIdx].icon = e.target.value;
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold"
                      >
                        <option value="Monitor">Monitor (ল্যাব)</option>
                        <option value="FlaskConical">Flask (বিজ্ঞানাগার)</option>
                        <option value="BookOpen">Book (লাইব্রেরি)</option>
                        <option value="Trophy">Trophy (মাঠ)</option>
                        <option value="Compass">Compass (স্কাউট)</option>
                        <option value="Droplet">Droplet (পানি)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">কালার</label>
                      <select
                        value={fac.color || 'indigo'}
                        onChange={(e) => {
                          const updated = [...(config.facilities?.items || [])];
                          updated[fIdx].color = e.target.value;
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold"
                      >
                        <option value="indigo">Indigo</option>
                        <option value="emerald">Emerald</option>
                        <option value="amber">Amber</option>
                        <option value="rose">Rose</option>
                        <option value="cyan">Cyan</option>
                        <option value="blue">Blue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">ব্যাজ</label>
                      <input
                        type="text"
                        value={fac.badge || ''}
                        onChange={(e) => {
                          const updated = [...(config.facilities?.items || [])];
                          updated[fIdx].badge = e.target.value;
                          handleUpdateConfig({
                            ...config,
                            facilities: { ...config.facilities, items: updated },
                          });
                        }}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 7: STATISTICS (পরিসংখ্যান)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">ছাত্র/ছাত্রীদের পরিসংখ্যান ও কাউন্টার সেটিংস</h2>
                <p className="text-xs text-slate-500">শ্রেণিভিত্তিক ছাত্র-ছাত্রীদের সংখ্যা ও লাইভ কাউন্টার অ্যানিমেশন পরিবর্তন করুন।</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.stats.animatedCounter}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      stats: { ...config.stats, animatedCounter: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-black">কাউন্টার অ্যানিমেশন (০ থেকে কাউন্ট হওয়া)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  সেকশন শিরোনাম
                </label>
                <input
                  type="text"
                  value={config.stats.title}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      stats: { ...config.stats, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  placeholder="যেমন: পরিসংখ্যানে বরইতলী উচ্চ বিদ্যালয়"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  উপ-শিরোনাম / বিবরণ
                </label>
                <input
                  type="text"
                  value={config.stats.subtitle || ''}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      stats: { ...config.stats, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
                  placeholder="ঐতিহ্যবাহী বিদ্যাপীঠের গৌরবময় অগ্রযাত্রার খতিয়ান"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  মোট শিক্ষক ও কর্মচারী সংখ্যা
                </label>
                <input
                  type="number"
                  value={config.stats.totalTeachersOverride || 25}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      stats: { ...config.stats, totalTeachersOverride: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  placeholder="যেমন: ২৫"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  গড় পাসের হার
                </label>
                <input
                  type="text"
                  value={config.stats.passingRate}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      stats: { ...config.stats, passingRate: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  placeholder="যেমন: ১০০% বা ৯৮.৫%"
                />
              </div>
            </div>

            {/* Class-wise Counters Grid */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">শ্রেণিভিত্তিক শিক্ষার্থী সংখ্যা</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {config.stats.classStats.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-center"
                  >
                    <input
                      type="text"
                      value={item.className}
                      onChange={(e) => {
                        const updated = [...config.stats.classStats];
                        updated[idx].className = e.target.value;
                        handleUpdateConfig({ ...config, stats: { ...config.stats, classStats: updated } });
                      }}
                      className="w-full text-center px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black"
                    />
                    <div>
                      <span className="text-[10px] text-slate-400 block">ছাত্র/ছাত্রী সংখ্যা</span>
                      <input
                        type="number"
                        value={item.count}
                        onChange={(e) => {
                          const updated = [...config.stats.classStats];
                          updated[idx].count = parseInt(e.target.value) || 0;
                          handleUpdateConfig({ ...config, stats: { ...config.stats, classStats: updated } });
                        }}
                        className="w-full text-center px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-lg font-black text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB: ACADEMIC PROGRAMS & STREAMS (একাডেমিক কার্যক্রম ও শাখা বিভাগ)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">একাডেমিক কার্যক্রম ও শাখা বিভাগ সেটিংস</h2>
                <p className="text-xs text-slate-500">৬ষ্ঠ-১০ম শ্রেণিভিত্তিক শিক্ষা কার্যক্রম এবং বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা শাখার বিবরণ পরিবর্তন করুন।</p>
              </div>
            </div>

            {/* General Academic Headers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  টপ পিল ব্যাজ
                </label>
                <input
                  type="text"
                  value={config.academic?.eyebrow || DEFAULT_ACADEMIC_CONFIG.eyebrow}
                  onChange={(e) => {
                    const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                    handleUpdateConfig({
                      ...config,
                      academic: { ...current, eyebrow: e.target.value },
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  placeholder="একাডেমিক কার্যক্রম ও পাঠ্যক্রম"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  সেকশন শিরোনাম
                </label>
                <input
                  type="text"
                  value={config.academic?.title || DEFAULT_ACADEMIC_CONFIG.title}
                  onChange={(e) => {
                    const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                    handleUpdateConfig({
                      ...config,
                      academic: { ...current, title: e.target.value },
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                  placeholder="শ্রেণিভিত্তিক শিক্ষা কার্যক্রম ও শাখা বিভাগ"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  উপ-শিরোনাম / বিবরণ
                </label>
                <input
                  type="text"
                  value={config.academic?.subtitle || DEFAULT_ACADEMIC_CONFIG.subtitle}
                  onChange={(e) => {
                    const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                    handleUpdateConfig({
                      ...config,
                      academic: { ...current, subtitle: e.target.value },
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
                  placeholder="এনসিটিবি ও চট্টগ্রাম শিক্ষা বোর্ড অনুমোদিত..."
                />
              </div>
            </div>

            {/* Academic Programs (3 Levels) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">শ্রেণিভিত্তিক শিক্ষা স্তর (৩টি পর্যায়)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(config.academic?.programs || DEFAULT_ACADEMIC_CONFIG.programs).map((prog, pIdx) => (
                  <div key={prog.id || pIdx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">শ্রেণির স্তর নাম</span>
                      <input
                        type="text"
                        value={prog.grade}
                        onChange={(e) => {
                          const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                          const updated = [...current.programs];
                          updated[pIdx] = { ...updated[pIdx], grade: e.target.value };
                          handleUpdateConfig({ ...config, academic: { ...current, programs: updated } });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">মূল লক্ষ্য / ফোকাস</span>
                      <textarea
                        rows={2}
                        value={prog.focus}
                        onChange={(e) => {
                          const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                          const updated = [...current.programs];
                          updated[pIdx] = { ...updated[pIdx], focus: e.target.value };
                          handleUpdateConfig({ ...config, academic: { ...current, programs: updated } });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specialized Streams (Science, Humanities, Business) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">৯ম ও ১০ম শ্রেণির ৩টি শাখা বিভাগ</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(config.academic?.streams || DEFAULT_ACADEMIC_CONFIG.streams).map((stream, sIdx) => (
                  <div key={stream.id || sIdx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">বিভাগের নাম</span>
                      <input
                        type="text"
                        value={stream.name}
                        onChange={(e) => {
                          const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                          const updated = [...current.streams];
                          updated[sIdx] = { ...updated[sIdx], name: e.target.value };
                          handleUpdateConfig({ ...config, academic: { ...current, streams: updated } });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">পাঠ্য বিষয়সমূহ</span>
                      <input
                        type="text"
                        value={stream.subjects}
                        onChange={(e) => {
                          const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                          const updated = [...current.streams];
                          updated[sIdx] = { ...updated[sIdx], subjects: e.target.value };
                          handleUpdateConfig({ ...config, academic: { ...current, streams: updated } });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">বিবরণ</span>
                      <textarea
                        rows={3}
                        value={stream.desc}
                        onChange={(e) => {
                          const current = config.academic || DEFAULT_ACADEMIC_CONFIG;
                          const updated = [...current.streams];
                          updated[sIdx] = { ...updated[sIdx], desc: e.target.value };
                          handleUpdateConfig({ ...config, academic: { ...current, streams: updated } });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

            {/* ─────────────────────────────────────────────────────────────────
       * TAB 8: BEST STUDENTS / ACHIEVERS (সেরা ছাত্র/ছাত্রী)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'achievers' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">সেরা ছাত্র/ছাত্রী (কৃতী শিক্ষার্থী) ব্যবস্থাপনা</h2>
                  <p className="text-xs text-slate-500">বোর্ড পরীক্ষা ও মেধা অন্বেষণে শীর্ষস্থান অর্জনকারী শিক্ষার্থীদের তালিকা ও ছবি পরিবর্তন করুন।</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm shadow-emerald-600/20"
                >
                  <Upload className="w-4 h-4" />
                  <span>ডাটাবেজ থেকে শীর্ষ শিক্ষার্থী আনুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newStudent: AchieverStudent = {
                      id: `ach-${Date.now()}`,
                      name: 'নতুন কৃতি শিক্ষার্থী',
                      class: '১০ম শ্রেণি',
                      roll: '০১',
                      year: '২০২৬',
                      gpa: '৫.০০',
                      photo: '',
                      awardBadge: '🏆 গোল্ডেন জিপিএ-৫',
                      visible: true,
                    };
                    handleUpdateConfig({
                      ...config,
                      achievers: {
                        ...config.achievers,
                        students: [...config.achievers.students, newStudent],
                      },
                    });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>ম্যানুয়ালি যোগ করুন</span>
                </button>
              </div>
            </div>

            {/* Section Settings Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">সেকশন শিরোনাম</label>
                <input
                  type="text"
                  value={config.achievers.title}
                  onChange={(e) => handleUpdateConfig({ ...config, achievers: { ...config.achievers, title: e.target.value } })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">সাবটাইটেল / বিবরণ</label>
                <input
                  type="text"
                  value={config.achievers.subtitle}
                  onChange={(e) => handleUpdateConfig({ ...config, achievers: { ...config.achievers, subtitle: e.target.value } })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                />
              </div>
            </div>

            {/* Achiever Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {config.achievers.students.map((st, idx) => (
                <div
                  key={st.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 space-y-3.5 relative ${
                    st.visible !== false 
                      ? 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700' 
                      : 'bg-slate-100/60 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>#{idx + 1} কৃতী</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Toggle Visibility */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...config.achievers.students];
                          updated[idx] = { ...updated[idx], visible: st.visible === false ? true : false };
                          handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                        }}
                        className={`p-1.5 rounded-lg transition ${
                          st.visible !== false ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                        title={st.visible !== false ? 'দৃশ্যমান (ক্লিক করে লুকান)' : 'লুকানো (ক্লিক করে দৃশ্যমান করুন)'}
                      >
                        {st.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Move Order */}
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...config.achievers.students];
                            const temp = updated[idx];
                            updated[idx] = updated[idx - 1];
                            updated[idx - 1] = temp;
                            handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                          title="বামে স্থানান্তর"
                        >
                          <MoveUp className="w-3.5 h-3.5 -rotate-90" />
                        </button>
                      )}
                      {idx < config.achievers.students.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...config.achievers.students];
                            const temp = updated[idx];
                            updated[idx] = updated[idx + 1];
                            updated[idx + 1] = temp;
                            handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                          title="ডানে স্থানান্তর"
                        >
                          <MoveDown className="w-3.5 h-3.5 -rotate-90" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`আপনি কি "${st.name}" এর তথ্য মুছে ফেলতে চান?`)) {
                            const updated = config.achievers.students.filter((_, i) => i !== idx);
                            handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                            showToast('শিক্ষার্থী তালিকা থেকে বাদ দেওয়া হয়েছে', 'info');
                          }
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Student Photo with Direct Upload */}
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border-2 border-amber-400">
                      {st.photo ? (
                        <img src={st.photo} alt={st.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                          {st.name ? st.name.slice(0, 1) : 'ছবি'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-[11px] font-bold cursor-pointer transition w-full justify-center">
                        <Upload className="w-3 h-3" />
                        <span>ছবি আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (re) => {
                                const updated = [...config.achievers.students];
                                updated[idx] = { ...updated[idx], photo: re.target?.result as string };
                                handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                                showToast(`${st.name} এর ছবি আপলোড হয়েছে`, 'success');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="অনলাইন ছবির লিঙ্ক"
                        value={st.photo || ''}
                        onChange={(e) => {
                          const updated = [...config.achievers.students];
                          updated[idx] = { ...updated[idx], photo: e.target.value };
                          handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                        }}
                        className="w-full px-2 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 truncate"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">শিক্ষার্থীর নাম</label>
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => {
                        const updated = [...config.achievers.students];
                        updated[idx].name = e.target.value;
                        handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                      }}
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">শ্রেণি</label>
                      <input
                        type="text"
                        value={st.class}
                        onChange={(e) => {
                          const updated = [...config.achievers.students];
                          updated[idx].class = e.target.value;
                          handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">রোল নং</label>
                      <input
                        type="text"
                        value={st.roll}
                        onChange={(e) => {
                          const updated = [...config.achievers.students];
                          updated[idx].roll = e.target.value;
                          handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">শিক্ষাবর্ষ / সাল</label>
                      <input
                        type="text"
                        value={st.year}
                        onChange={(e) => {
                          const updated = [...config.achievers.students];
                          updated[idx].year = e.target.value;
                          handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">জিপিএ / ফলাফল</label>
                      <input
                        type="text"
                        value={st.gpa || ''}
                        placeholder="৫.০০"
                        onChange={(e) => {
                          const updated = [...config.achievers.students];
                          updated[idx].gpa = e.target.value;
                          handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ট্রফি / সম্মাননা ব্যাজ</label>
                    <input
                      type="text"
                      value={st.awardBadge}
                      onChange={(e) => {
                        const updated = [...config.achievers.students];
                        updated[idx].awardBadge = e.target.value;
                        handleUpdateConfig({ ...config, achievers: { ...config.achievers, students: updated } });
                      }}
                      className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-amber-600 dark:text-amber-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB: PHOTO & VIDEO GALLERY (ফটো ও ভিডিও গ্যালারি)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                  <Camera className="w-6 h-6 text-purple-600" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">ফটো ও ভিডিও গ্যালারি পরিচালনা</h2>
                  <p className="text-xs text-slate-500">বিদ্যালয়ের স্মৃতিময় মুহূর্ত, শ্রেণিকক্ষ, বিজ্ঞান মেলা ও ক্রীড়া প্রতিযোগিতার ছবি সহজে আপলোড করুন।</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentGallery = config.gallery || DEFAULT_GALLERY_CONFIG;
                  const newItem: GalleryMediaItem = {
                    id: `gal-${Date.now()}`,
                    type: 'image',
                    title: 'নতুন গ্যালারি আইটেম',
                    category: 'ক্যাম্পাস',
                    thumbnail: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
                    date: '২০২৬',
                    caption: 'এই ছবির বিবরণ বা ক্যাপশন এখানে লিখুন...',
                    visible: true,
                  };
                  handleUpdateConfig({
                    ...config,
                    gallery: {
                      ...currentGallery,
                      items: [...currentGallery.items, newItem],
                    },
                  });
                  showToast('নতুন গ্যালারি আইটেম যোগ করা হয়েছে', 'success');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-sm shadow-purple-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ছবি/ভিডিও যোগ করুন</span>
              </button>
            </div>

            {/* Section Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">সেকশন শিরোনাম</label>
                <input
                  type="text"
                  value={config.gallery?.title || 'ছবি এবং ভিডিও গ্যালারী'}
                  onChange={(e) => {
                    const currentGallery = config.gallery || DEFAULT_GALLERY_CONFIG;
                    handleUpdateConfig({ ...config, gallery: { ...currentGallery, title: e.target.value } });
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">আইব্রো ট্যাগ (Eyebrow)</label>
                <input
                  type="text"
                  value={config.gallery?.eyebrow || 'ক্যাম্পাস লাইফ ও স্মৃতি'}
                  onChange={(e) => {
                    const currentGallery = config.gallery || DEFAULT_GALLERY_CONFIG;
                    handleUpdateConfig({ ...config, gallery: { ...currentGallery, eyebrow: e.target.value } });
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">সাবটাইটেল / বিবরণ</label>
                <input
                  type="text"
                  value={config.gallery?.subtitle || 'বিদ্যালয়ের প্রাণবন্ত পাঠদান, ক্রীড়া ও সাংস্কৃতিক উৎসব এবং বিজ্ঞান প্রদর্শনীর স্মরণীয় মুহূর্তসমূহ।'}
                  onChange={(e) => {
                    const currentGallery = config.gallery || DEFAULT_GALLERY_CONFIG;
                    handleUpdateConfig({ ...config, gallery: { ...currentGallery, subtitle: e.target.value } });
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['all', 'অ্যাকাডেমিক', 'ভিডিও হাইলাইটস', 'বিজ্ঞান ও প্রযুক্তি', 'ক্রীড়া ও সংস্কৃতি', 'ক্যাম্পাস'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGalleryCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    galleryCategoryFilter === cat
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'সকল মিডিয়া' : cat}
                </button>
              ))}
            </div>

            {/* Gallery Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(config.gallery?.items || DEFAULT_GALLERY_CONFIG.items)
                .filter(item => galleryCategoryFilter === 'all' || item.category === galleryCategoryFilter)
                .map((item, idx) => {
                  const currentItems = config.gallery?.items || DEFAULT_GALLERY_CONFIG.items;
                  const realIndex = currentItems.findIndex(i => i.id === item.id);
                  const isVideo = item.type === 'video';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 relative ${
                        item.visible !== false
                          ? 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-100/60 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-75'
                      }`}
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 flex items-center gap-1">
                          {isVideo ? <Video className="w-3 h-3 text-rose-500" /> : <ImageIcon className="w-3 h-3 text-emerald-500" />}
                          <span>{isVideo ? 'ভিডিও' : 'ছবি'} • #{idx + 1}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Toggle Visibility */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...currentItems];
                              updated[realIndex] = { ...updated[realIndex], visible: item.visible === false ? true : false };
                              const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                              handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                            }}
                            className={`p-1.5 rounded-lg transition ${
                              item.visible !== false ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60' : 'text-slate-400 hover:bg-slate-200'
                            }`}
                            title={item.visible !== false ? 'দৃশ্যমান (ক্লিক করে লুকান)' : 'লুকানো (ক্লিক করে প্রদর্শন করুন)'}
                          >
                            {item.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          {/* Move Up */}
                          {realIndex > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...currentItems];
                                const temp = updated[realIndex];
                                updated[realIndex] = updated[realIndex - 1];
                                updated[realIndex - 1] = temp;
                                const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                                handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                              title="আগে নিন"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Move Down */}
                          {realIndex < currentItems.length - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...currentItems];
                                const temp = updated[realIndex];
                                updated[realIndex] = updated[realIndex + 1];
                                updated[realIndex + 1] = temp;
                                const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                                handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                              title="পরে নিন"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`আপনি কি "${item.title}" মুছে ফেলতে চান?`)) {
                                const updated = currentItems.filter(i => i.id !== item.id);
                                const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                                handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                                showToast('গ্যালারি আইটেম মুছে ফেলা হয়েছে', 'info');
                              }
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Image Thumbnail Preview & Direct Upload */}
                      <div className="space-y-2">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 group">
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                          {isVideo && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="p-2 rounded-full bg-rose-600 text-white shadow-lg">
                                <Play className="w-4 h-4 fill-white ml-0.5" />
                              </span>
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                            <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[11px] font-bold cursor-pointer transition backdrop-blur-md">
                              <Upload className="w-3 h-3 text-purple-400" />
                              <span>ছবি আপলোড</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (re) => {
                                      const updated = [...currentItems];
                                      updated[realIndex] = { ...updated[realIndex], thumbnail: re.target?.result as string };
                                      const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                                      handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                                      showToast('গ্যালারির থাম্বনেইল ছবি আপলোড হয়েছে', 'success');
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <input
                          type="text"
                          placeholder="অনলাইন ছবি লিঙ্ক (URL)"
                          value={item.thumbnail}
                          onChange={(e) => {
                            const updated = [...currentItems];
                            updated[realIndex] = { ...updated[realIndex], thumbnail: e.target.value };
                            const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                            handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                          }}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                        />
                      </div>

                      {/* Type and Video URL */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">মিডিয়া টাইপ</label>
                          <select
                            value={item.type}
                            onChange={(e) => {
                              const updated = [...currentItems];
                              updated[realIndex] = { ...updated[realIndex], type: e.target.value as 'image' | 'video' };
                              const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                              handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          >
                            <option value="image">📷 ছবি</option>
                            <option value="video">🎥 ভিডিও</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ক্যাটাগরি</label>
                          <input
                            type="text"
                            value={item.category}
                            placeholder="অ্যাকাডেমিক / বিজ্ঞান"
                            onChange={(e) => {
                              const updated = [...currentItems];
                              updated[realIndex] = { ...updated[realIndex], category: e.target.value };
                              const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                              handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                      </div>

                      {isVideo && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ভিডিও এম্বেড লিংক</label>
                          <input
                            type="text"
                            placeholder="https://www.youtube.com/embed/..."
                            value={item.videoUrl || ''}
                            onChange={(e) => {
                              const updated = [...currentItems];
                              updated[realIndex] = { ...updated[realIndex], videoUrl: e.target.value };
                              const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                              handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                            }}
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-rose-600 font-mono"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-0.5">শিরোনাম</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...currentItems];
                            updated[realIndex] = { ...updated[realIndex], title: e.target.value };
                            const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                            handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                          }}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">তারিখ</label>
                          <input
                            type="text"
                            value={item.date}
                            placeholder="১২ অক্টোবর ২০২৬"
                            onChange={(e) => {
                              const updated = [...currentItems];
                              updated[realIndex] = { ...updated[realIndex], date: e.target.value };
                              const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                              handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] font-bold text-slate-500 mb-0.5">ক্যাপশন / বিবরণ</label>
                          <input
                            type="text"
                            value={item.caption}
                            onChange={(e) => {
                              const updated = [...currentItems];
                              updated[realIndex] = { ...updated[realIndex], caption: e.target.value };
                              const curGal = config.gallery || DEFAULT_GALLERY_CONFIG;
                              handleUpdateConfig({ ...config, gallery: { ...curGal, items: updated } });
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

{/* ─────────────────────────────────────────────────────────────────
       * TAB 9: BLOG & NEWS (সংবাদ ও ব্লগ)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'blog' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">সংবাদ ও ব্লগ পোস্টসমূহ</h2>
                <p className="text-xs text-slate-500">ছবি, পোস্টকারী (Admin), তারিখ, বাংলা শিরোনাম ও সারাংশ সংবলিত পোস্টসমূহ।</p>
              </div>
              <button
                onClick={() => {
                  const newPost: BlogPostItem = {
                    id: `post-${Date.now()}`,
                    title: 'নতুন সংবাদ প্রতিবেদন শিরোনাম',
                    date: '২১ অক্টোবর ২০২৬',
                    author: 'Admin',
                    summary: 'সংবাদের সারসংক্ষেপ এখানে লিখুন...',
                    imageUrl: '/school-campus.jpg',
                    link: '#',
                    visible: true,
                  };
                  handleUpdateConfig({
                    ...config,
                    blog: {
                      ...config.blog,
                      posts: [...config.blog.posts, newPost],
                    },
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>পোস্ট যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-4">
              {config.blog.posts.map((post, idx) => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">পোস্ট #{idx + 1}</span>
                    <button
                      onClick={() => {
                        const updated = config.blog.posts.filter((_, i) => i !== idx);
                        handleUpdateConfig({ ...config, blog: { ...config.blog, posts: updated } });
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">বাংলা শিরোনাম</label>
                      <input
                        type="text"
                        value={post.title}
                        onChange={(e) => {
                          const updated = [...config.blog.posts];
                          updated[idx].title = e.target.value;
                          handleUpdateConfig({ ...config, blog: { ...config.blog, posts: updated } });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-0.5">প্রকাশের তারিখ</label>
                      <input
                        type="text"
                        value={post.date}
                        onChange={(e) => {
                          const updated = [...config.blog.posts];
                          updated[idx].date = e.target.value;
                          handleUpdateConfig({ ...config, blog: { ...config.blog, posts: updated } });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-0.5">সংক্ষিপ্ত সারাংশ (২-৩ লাইন)</label>
                    <textarea
                      rows={2}
                      value={post.summary}
                      onChange={(e) => {
                        const updated = [...config.blog.posts];
                        updated[idx].summary = e.target.value;
                        handleUpdateConfig({ ...config, blog: { ...config.blog, posts: updated } });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 10: FAQ (প্রশ্নোত্তর)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">সাধারণ প্রশ্নোত্তর (FAQ)</h2>
                <p className="text-xs text-slate-500">ভর্তি, ফি ও স্কুল সম্পর্কিত সচরাচর জিজ্ঞাসিত প্রশ্ন ও উত্তর।</p>
              </div>
              <button
                onClick={() => {
                  const newFaq: FAQItem = {
                    id: `faq-${Date.now()}`,
                    question: 'নতুন প্রশ্ন লিখুন?',
                    answer: 'প্রশ্নের উত্তর এখানে লিখুন।',
                    visible: true,
                  };
                  handleUpdateConfig({
                    ...config,
                    faq: {
                      ...config.faq,
                      items: [...config.faq.items, newFaq],
                    },
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>প্রশ্ন যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.faq.items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">প্রশ্ন #{idx + 1}</span>
                    <button
                      onClick={() => {
                        const updated = config.faq.items.filter((_, i) => i !== idx);
                        handleUpdateConfig({ ...config, faq: { ...config.faq, items: updated } });
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => {
                        const updated = [...config.faq.items];
                        updated[idx].question = e.target.value;
                        handleUpdateConfig({ ...config, faq: { ...config.faq, items: updated } });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      placeholder="প্রশ্ন"
                    />
                  </div>
                  <div>
                    <textarea
                      rows={2}
                      value={item.answer}
                      onChange={(e) => {
                        const updated = [...config.faq.items];
                        updated[idx].answer = e.target.value;
                        handleUpdateConfig({ ...config, faq: { ...config.faq, items: updated } });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                      placeholder="উত্তর"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 11: MEDIA LIBRARY (ছবি ও মিডিয়া লাইব্রেরি)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">ছবি ও মিডিয়া লাইব্রেরি</h2>
                <p className="text-xs text-slate-500">ওয়েবসাইটের লোগো, ব্যানার ও বিভিন্ন সেকশনের ছবি আপলোড ও পরিচালনা করুন।</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>
                    {mediaCategoryFilter === 'banner'
                      ? 'নতুন ব্যানার আপলোড করুন'
                      : mediaCategoryFilter === 'gallery'
                      ? 'গ্যালারি ছবি আপলোড করুন'
                      : mediaCategoryFilter === 'student'
                      ? 'শিক্ষার্থীর ছবি আপলোড করুন'
                      : mediaCategoryFilter === 'logo'
                      ? 'লোগো আপলোড করুন'
                      : 'নতুন ছবি আপলোড করুন'}
                  </span>
                </button>
              </div>
            </div>

            {/* Dynamic Category Context Banner */}
            {mediaCategoryFilter === 'logo' && (
              <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 dark:from-slate-850 dark:via-indigo-950/40 dark:to-slate-850 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-700 p-1 shadow-md flex items-center justify-center shrink-0">
                    {config.header.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={config.header.logoUrl}
                        alt="Current Logo"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <School className="w-7 h-7 text-indigo-500" />
                    )}
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow" title="সক্রিয় লোগো">
                      ✓
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        বিদ্যালয়ের সক্রিয় লোগো
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        লাইভ সংযুক্ত
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      এই লোগোটি পাবলিক ওয়েবসাইটের হেডার, ব্রাউজার ফেভিকন এবং সকল একাডেমিক নথিতে প্রদর্শিত হয়।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>ডিভাইস থেকে নতুন লোগো দিন</span>
                  </button>
                </div>
              </div>
            )}

            {mediaCategoryFilter === 'banner' && (
              <div className="bg-gradient-to-r from-amber-50 via-indigo-50 to-sky-50 dark:from-slate-850 dark:via-amber-950/20 dark:to-slate-850 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-14 rounded-xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700 p-0.5 shadow-md overflow-hidden shrink-0">
                    {config.hero.bgImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={config.hero.bgImage}
                        alt="Hero Banner"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-100 dark:bg-amber-950 text-amber-600">
                        <LayoutTemplate className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        🖼️ হোমপেজ ব্যানার ও স্লাইডার ছবি
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        {config.hero.slides?.length || 0} টি স্লাইড সক্রিয়
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      এখানে ছবি আপলোড করে এক ক্লিকে মূল হোমপেজ ব্যাকগ্রাউন্ড ব্যানার অথবা স্লাইডারে যুক্ত করতে পারবেন।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>নতুন ব্যানার আপলোড করুন</span>
                  </button>
                </div>
              </div>
            )}

            {mediaCategoryFilter === 'gallery' && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-slate-850 dark:via-emerald-950/20 dark:to-slate-850 border border-emerald-200/80 dark:border-emerald-900/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        📸 ক্যাম্পাস ফটো গ্যালারি
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        {config.gallery?.items?.length || 0} টি ছবি ওয়েবসাইটে লাইভ
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      এখানে যেকোনো ছবি আপলোড করলে তা স্বয়ংক্রিয়ভাবে মূল ওয়েবসাইটের গ্যালারি সেকশনে দৃশ্যমান হবে।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>গ্যালারির ছবি আপলোড করুন</span>
                  </button>
                </div>
              </div>
            )}

            {mediaCategoryFilter === 'student' && (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-850 dark:via-blue-950/20 dark:to-slate-850 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        🎓 শিক্ষার্থী ও কৃতি ছাত্র/ছাত্রীদের ছবি
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                        {config.achievers?.students?.length || 0} জন সেরা শিক্ষার্থী
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      শিক্ষার্থীদের ছবি আপলোড করে এক ক্লিকে &quot;সেরা ছাত্র/ছাত্রী&quot; তালিকায় যুক্ত করুন।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>শিক্ষার্থীর ছবি আপলোড করুন</span>
                  </button>
                </div>
              </div>
            )}

            {/* Filter by category with counts */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'সকল ছবি', icon: Layers },
                { key: 'logo', label: 'লোগো', icon: Award },
                { key: 'banner', label: 'ব্যানার', icon: LayoutTemplate },
                { key: 'student', label: 'শিক্ষার্থী', icon: GraduationCap },
                { key: 'gallery', label: 'গ্যালারি', icon: Camera },
                { key: 'other', label: 'অন্যান্য', icon: ImageIcon },
              ].map((c) => {
                const count = c.key === 'all' ? mediaList.length : mediaList.filter(m => m.category === c.key).length;
                const IconComponent = c.icon;
                const isActive = mediaCategoryFilter === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setMediaCategoryFilter(c.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{c.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Media Content Area */}
            {(() => {
              const filteredMedia = mediaList.filter(m => mediaCategoryFilter === 'all' || m.category === mediaCategoryFilter);

              if (filteredMedia.length === 0) {
                return (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files) handleFilesBatch(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 scale-[1.01]'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-400 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition shadow-inner">
                      {isUploading ? (
                        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Upload className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                        {mediaCategoryFilter === 'banner'
                          ? 'ব্যানার ক্যাটাগরিতে কোনো ছবি নেই — এখনই আপলোড করুন'
                          : mediaCategoryFilter === 'gallery'
                          ? 'গ্যালারি ক্যাটাগরিতে কোনো ছবি নেই — এখনই ছবি যোগ করুন'
                          : mediaCategoryFilter === 'student'
                          ? 'শিক্ষার্থী ক্যাটাগরিতে কোনো ছবি নেই — ছবি আপলোড করুন'
                          : mediaCategoryFilter === 'logo'
                          ? 'লোগো ক্যাটাগরিতে কোনো ছবি নেই — লোগো আপলোড করুন'
                          : 'এই ক্যাটাগরিতে কোনো ছবি নেই — এখনই ছবি আপলোড করুন'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        কম্পিউটার বা মোবাইল থেকে ছবি ড্র্যাগ করে এনে এখানে ছেড়ে দিন অথবা ব্রাউজ করুন।
                        (একাধিক ছবি একসাথে নির্বাচন করতে পারবেন)
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer pointer-events-none"
                    >
                      <Upload className="w-4 h-4" />
                      <span>ছবি নির্বাচন করুন</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {/* First Card: Quick Add More */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 bg-indigo-50/40 dark:bg-slate-800/40 hover:bg-indigo-50/80 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[200px]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition mb-2">
                      <Plus className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">আরও ছবি যোগ করুন</p>
                    <span className="text-[10px] text-slate-500 mt-0.5">ড্র্যাগ বা ক্লিক করুন</span>
                  </div>

                  {filteredMedia.map((item) => {
                    const isCurrentLogo = item.url === config.header.logoUrl;
                    const isHeroBg = item.url === config.hero.bgImage;
                    const isInGallery = (config.gallery?.items || []).some(g => g.thumbnail === item.url);

                    return (
                      <div
                        key={item.id}
                        className={`group relative rounded-2xl border transition overflow-hidden bg-slate-50 dark:bg-slate-800 p-2 space-y-2 flex flex-col justify-between ${
                          isCurrentLogo
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                            : isHeroBg
                            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="w-full aspect-square rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.url}
                              alt={item.altText}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isCurrentLogo && (
                              <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                <span>প্রধান লোগো</span>
                              </div>
                            )}
                            {isHeroBg && (
                              <div className="absolute top-1.5 right-1.5 bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                <span>ব্যানার ব্যাকগ্রাউন্ড</span>
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-medium px-1.5 py-0.5 rounded capitalize">
                              {item.category}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                            <span className="text-[10px] text-slate-400 block">{(item.size / 1024).toFixed(0)} KB</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                          {/* Contextual Action */}
                          {isCurrentLogo ? (
                            <div className="w-full py-1 text-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>সক্রিয় লোগো</span>
                            </div>
                          ) : item.category === 'logo' || mediaCategoryFilter === 'logo' ? (
                            <button
                              type="button"
                              onClick={() => handleSetAsSchoolLogo(item)}
                              className="w-full py-1 text-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <Award className="w-3 h-3" />
                              <span>লোগো হিসেবে সেট করুন</span>
                            </button>
                          ) : null}

                          {/* Banner Actions */}
                          {(item.category === 'banner' || mediaCategoryFilter === 'banner') && (
                            <div className="space-y-1">
                              {!isHeroBg && (
                                <button
                                  type="button"
                                  onClick={() => handleSetAsHeroBanner(item)}
                                  className="w-full py-1 text-center rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <LayoutTemplate className="w-3 h-3" />
                                  <span>হোমপেজ ব্যানার করুন</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleAddToHeroSlider(item)}
                                className="w-full py-1 text-center rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                              >
                                <Play className="w-3 h-3" />
                                <span>স্লাইডারে যোগ করুন</span>
                              </button>
                            </div>
                          )}

                          {/* Gallery Action */}
                          {(item.category === 'gallery' || mediaCategoryFilter === 'gallery') && (
                            isInGallery ? (
                              <div className="w-full py-1 text-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>গ্যালারিতে লাইভ</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToGallery(item)}
                                className="w-full py-1 text-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                              >
                                <Camera className="w-3 h-3" />
                                <span>গ্যালারিতে যুক্ত করুন</span>
                              </button>
                            )
                          )}

                          {/* Student Action */}
                          {(item.category === 'student' || mediaCategoryFilter === 'student') && (
                            <button
                              type="button"
                              onClick={() => handleAddToAchievers(item)}
                              className="w-full py-1 text-center rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <GraduationCap className="w-3 h-3" />
                              <span>সেরা ছাত্র/ছাত্রী করুন</span>
                            </button>
                          )}

                          {/* Category changer & copy & delete */}
                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                            <select
                              value={item.category}
                              onChange={(e) => handleChangeCategory(item, e.target.value)}
                              className="text-[9px] bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 text-slate-700 dark:text-slate-300 cursor-pointer"
                              title="ক্যাটাগরি পরিবর্তন করুন"
                            >
                              <option value="logo">লোগো</option>
                              <option value="banner">ব্যানার</option>
                              <option value="student">শিক্ষার্থী</option>
                              <option value="gallery">গ্যালারি</option>
                              <option value="other">অন্যান্য</option>
                            </select>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.url);
                                  showToast('ছবির লিংক কপি করা হয়েছে', 'info');
                                }}
                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                title="URL কপি"
                              >
                                URL
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`আপনি কি "${item.name}" মুছে ফেলতে চান?`)) {
                                    landingPageService.deleteMediaItem(item.id);
                                    setMediaList(landingPageService.getMediaList());
                                    showToast('ছবি মুছে ফেলা হয়েছে', 'info');
                                  }
                                }}
                                className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                                title="মুছুন"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 12: THEME & TOKENS (রং, ফন্ট ও থিম)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">রং, ফন্ট ও ভিজ্যুয়াল ডিজাইন টোকেন</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Color */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রধান ব্র্যান্ড কালার
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.theme.primaryColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, primaryColor: e.target.value },
                      })
                    }
                    className="w-12 h-10 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme.primaryColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, primaryColor: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono outline-none"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  সেকেন্ডারি কালার
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.theme.secondaryColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, secondaryColor: e.target.value },
                      })
                    }
                    className="w-12 h-10 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme.secondaryColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, secondaryColor: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono outline-none"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  অ্যাকসেন্ট হাইলাইট কালার
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.theme.accentColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, accentColor: e.target.value },
                      })
                    }
                    className="w-12 h-10 p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme.accentColor}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, accentColor: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              {/* Font Family */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  বাংলা ফন্ট ফ্যামিলি
                </label>
                <select
                  value={config.theme.fontFamily}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      theme: { ...config.theme, fontFamily: e.target.value as any },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                >
                  <option value="SolaimanLipi">SolaimanLipi (ডিফল্ট ক্লাসিক বাংলা)</option>
                  <option value="Hind Siliguri">Hind Siliguri (আধুনিক ও পরিচ্ছন্ন)</option>
                  <option value="Noto Sans Bengali">Noto Sans Bengali (Google Standard)</option>
                  <option value="Inter">Inter (ইন্টারন্যাশনাল)</option>
                </select>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  কার্ড ও বাটনের বর্ডার রেডিয়াস (গোলত্ব)
                </label>
                <select
                  value={config.theme.borderRadius}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      theme: { ...config.theme, borderRadius: e.target.value as any },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                >
                  <option value="none">সোজা কোণা (Sharp 0px)</option>
                  <option value="md">মাঝারি গোল (Medium 8px)</option>
                  <option value="lg">সুন্দর গোল (Large 12px)</option>
                  <option value="xl">অতিরিক্ত গোল (Extra Rounded 16px)</option>
                  <option value="full">সম্পূর্ণ পিল বা ক্যাপসুল</option>
                </select>
              </div>

              {/* Dark Mode */}
              <div className="flex flex-col justify-center">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  ডার্ক মোড সমর্থন
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.theme.darkMode}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        theme: { ...config.theme, darkMode: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm font-bold">ব্যবহারকারী চাইলে ডার্ক মোড অন করতে পারবে</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 13: CONTACT & FOOTER (যোগাযোগ ও ফুটার)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'footer' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">৪-কলাম প্রাতিষ্ঠানিক ফুটার ও যোগাযোগ সেটিংস</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  বিদ্যালয়ের সম্পূর্ণ ডাক ঠিকানা
                </label>
                <textarea
                  rows={2}
                  value={config.footer.address}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, address: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
                />
              </div>

              {/* Copyright Text */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  কপিরাইট বার টেক্সট
                </label>
                <input
                  type="text"
                  value={config.footer.copyrightText}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, copyrightText: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                />
              </div>
            </div>

            {/* Phones & Emails */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ফোন নম্বর ১</label>
                <input
                  type="text"
                  value={config.footer.phone1}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, phone1: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ফোন নম্বর ২</label>
                <input
                  type="text"
                  value={config.footer.phone2}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, phone2: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ইমেইল ১</label>
                <input
                  type="text"
                  value={config.footer.email1}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, email1: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ইমেইল ২</label>
                <input
                  type="text"
                  value={config.footer.email2}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ...config,
                      footer: { ...config.footer, email2: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>

            {/* Column 4: Institutional Codes & Social Links */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">কলাম ৪: প্রাতিষ্ঠানিক কোড ও সোশ্যাল আইকন</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">EIIN নম্বর</label>
                  <input
                    type="text"
                    value={config.footer.eiin}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        footer: { ...config.footer, eiin: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">স্কুল কোড</label>
                  <input
                    type="text"
                    value={config.footer.schoolCode}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        footer: { ...config.footer, schoolCode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ফেসবুক পেজ লিংক</label>
                  <input
                    type="text"
                    value={config.footer.socialLinks.facebook}
                    onChange={(e) =>
                      handleUpdateConfig({
                        ...config,
                        footer: {
                          ...config.footer,
                          socialLinks: { ...config.footer.socialLinks, facebook: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 14: SEO & SOCIAL SHARING (SEO ও সোশ্যাল মিডিয়া)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">সার্চ ইঞ্জিন অপটিমাইজেশন ও সোশ্যাল শেয়ার</h2>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                মেটা টাইটেল
              </label>
              <input
                type="text"
                value={config.seo.metaTitle}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    seo: { ...config.seo, metaTitle: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                মেটা ডেসক্রিপশন
              </label>
              <textarea
                rows={3}
                value={config.seo.metaDescription}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    seo: { ...config.seo, metaDescription: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                কীওয়ার্ডসমূহ (Keywords, কমা দিয়ে আলাদা করুন)
              </label>
              <input
                type="text"
                value={config.seo.metaKeywords}
                onChange={(e) =>
                  handleUpdateConfig({
                    ...config,
                    seo: { ...config.seo, metaKeywords: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
       * TAB 15: VERSION HISTORY & RESTORE (সংস্করণ ইতিহাস ও রিস্টোর)
       * ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">পূর্ববর্তী সংস্করণ ও অডিট ইতিহাস</h2>
            <p className="text-xs text-slate-500">যেকোনো ভুল সংশোধনের জন্য পূর্বের প্রকাশিত সংস্করণে এক ক্লিকে ফিরে যান।</p>

            <div className="space-y-3">
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-sm shrink-0">
                      V{ver.version}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">{ver.summary}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>প্রকাশক: {ver.author}</span>
                        <span>•</span>
                        <span>{new Date(ver.timestamp).toLocaleString('bn-BD')}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestoreVersion(ver)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-xs font-black transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>এই সংস্করণ রিস্টোর করুন</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── PUBLISH MODAL ─── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">লাইভ প্রকাশ নিশ্চিতকরণ</h3>
              </div>
              <button onClick={() => setShowPublishModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              আপনার খসড়ায় করা সমস্ত পরিবর্তন <strong>লাইভ হোমপেজে</strong> প্রকাশিত হবে এবং একটি নতুন ভার্সন স্ন্যাপশট তৈরি হবে।
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">পরিবর্তনের সংক্ষিপ্ত বিবরণ (নোট)</label>
              <input
                type="text"
                value={publishSummary}
                onChange={(e) => setPublishSummary(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold outline-none"
                placeholder="যেমন: ভর্তি নোটিশ ও হিরো টাইটেল আপডেট"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                বাতিল
              </button>
              <button
                onClick={handlePublishLive}
                disabled={isPublishing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-md shadow-emerald-600/30 flex items-center gap-2"
              >
                {isPublishing ? 'প্রকাশ হচ্ছে...' : 'হ্যাঁ, লাইভ প্রকাশ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIVE PREVIEW MODAL ─── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-sm animate-in fade-in">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white shrink-0">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-indigo-400" />
              <span className="font-extrabold text-sm">লাইভ ইন্টারেক্টিভ প্রিভিউ</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                খসড়া ভিউ
              </span>
            </div>

            {/* Viewport switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setPreviewViewport('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  previewViewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>ডেস্কটপ (1280px)</span>
              </button>
              <button
                onClick={() => setPreviewViewport('tablet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  previewViewport === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>ট্যাবলেট (768px)</span>
              </button>
              <button
                onClick={() => setPreviewViewport('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  previewViewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>মোবাইল (375px)</span>
              </button>
            </div>

            <button
              onClick={() => setShowPreviewModal(false)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview Container */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
            <div
              className={`h-full bg-white dark:bg-slate-950 rounded-2xl shadow-2xl overflow-y-auto transition-all duration-300 border border-slate-700 ${
                previewViewport === 'desktop'
                  ? 'w-full max-w-[1280px]'
                  : previewViewport === 'tablet'
                  ? 'w-[768px]'
                  : 'w-[375px]'
              }`}
            >
              <iframe
                src="/"
                title="Live Preview"
                className="w-full h-full min-h-[800px] border-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── HELP & GUIDED TOUR MODAL ─── */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">নতুন ব্যবহারকারী নির্দেশিকা</h3>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong>১. সেকশন সাজানো:</strong> “সেকশন ম্যানেজার” ট্যাবে গিয়ে যেকোনো সেকশন উপরে বা নিচে সরাতে পারেন অথবা বন্ধ/চালু করতে পারেন।
              </p>
              <p>
                <strong>২. ছবি আপলোড:</strong> “ছবি ও মিডিয়া” ট্যাবে গিয়ে যেকোনো ব্যানার বা ছবি আপলোড করুন এবং স্বয়ংক্রিয় URL কপি করে নিন।
              </p>
              <p>
                <strong>৩. খসড়া ও প্রকাশ:</strong> আপনি যখনই কোনো পরিবর্তন করবেন, তা নিরাপদ খসড়ায় সংরক্ষিত থাকবে। “লাইভ প্রিভিউ” দেখে সন্তুষ্ট হলে “প্রকাশ করুন” বাটনে চাপুন।
              </p>
              <p>
                <strong>৪. আগের অবস্থায় ফিরে যাওয়া:</strong> কোনো ভুল হলে “সংস্করণ ইতিহাস” থেকে পূর্বের যেকোনো তারিখের সংস্করণ এক ক্লিকে রিস্টোর করা যায়।
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-700 transition"
              >
                বুঝেছি, ধন্যবাদ!
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────
       * MODAL: IMPORT ACHIEVER FROM LIVE STUDENTS DATABASE
       * ───────────────────────────────────────────────────────────────── */}
      {showImportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 sm:p-7 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                  <Upload className="w-5 h-5 text-emerald-600" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    শিক্ষার্থী ডাটাবেজ থেকে শীর্ষ শিক্ষার্থী ইমপোর্ট
                  </h3>
                  <p className="text-xs text-slate-500">
                    স্কুলের মূল ডাটাবেজ থেকে মেধাবী শিক্ষার্থী নির্বাচন করে সরাসরি এক ক্লিকে যুক্ত করুন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100 dark:border-slate-800">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="নাম, রোল বা আইডি দিয়ে খুঁজুন..."
                  value={importSearch}
                  onChange={(e) => setImportSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <select
                  value={importClassFilter}
                  onChange={(e) => setImportClassFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                >
                  <option value="all">সকল শ্রেণি</option>
                  <option value="Class 10">১০ম শ্রেণি</option>
                  <option value="Class 9">৯ম শ্রেণি</option>
                  <option value="Class 8">৮ম শ্রেণি</option>
                  <option value="Class 7">৭ম শ্রেণি</option>
                  <option value="Class 6">৬ষ্ঠ শ্রেণি</option>
                </select>
              </div>
            </div>

            {/* Students List */}
            <div className="overflow-y-auto py-4 space-y-2 flex-1">
              {liveStudents
                .filter(st => {
                  const matchSearch = !importSearch || st.name.toLowerCase().includes(importSearch.toLowerCase()) || st.roll.includes(importSearch) || st.id.toLowerCase().includes(importSearch.toLowerCase());
                  const matchClass = importClassFilter === 'all' || st.grade === importClassFilter;
                  return matchSearch && matchClass;
                })
                .slice(0, 30)
                .map((st) => {
                  const alreadyAdded = config.achievers.students.some(a => a.name === st.name || a.id === `ach-${st.id}`);
                  return (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600 flex-shrink-0">
                          {st.photo ? (
                            <img src={st.photo} alt={st.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-500">
                              {st.name.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">{st.name}</h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              রোল: {st.roll}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {st.gradeBn || `${st.grade} শ্রেণি`} • {st.section || 'শাখা ক'} • {st.session || '২০২৬'} • GPA: {st.gpa || '৫.০০'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => {
                          const newAchiever: AchieverStudent = {
                            id: `ach-${st.id}-${Date.now()}`,
                            name: st.name,
                            class: st.gradeBn || `${st.grade} শ্রেণি`,
                            roll: st.roll,
                            year: st.session || '২০২৬',
                            gpa: st.gpa || '৫.০০',
                            photo: st.photo || '',
                            awardBadge: st.gpa === '5.00' ? '🏆 গোল্ডেন জিপিএ-৫' : `⭐ মেধা স্থান #${st.roll}`,
                            visible: true,
                          };
                          handleUpdateConfig({
                            ...config,
                            achievers: {
                              ...config.achievers,
                              students: [...config.achievers.students, newAchiever],
                            },
                          });
                          showToast(`${st.name} সফলভাবে কৃতী তালিকায় যুক্ত হয়েছে!`, 'success');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          alreadyAdded
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        {alreadyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>যুক্ত আছে</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>যুক্ত করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>মোট শিক্ষার্থী: {liveStudents.length} জন</span>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 transition"
              >
                সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

