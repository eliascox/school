'use client';

import React from 'react';
import {
  LayoutTemplate,
  Globe,
  Sparkles,
  School,
  Building2,
  Award,
  BookOpen,
  GraduationCap,
  Camera,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Palette,
  Mail,
  Share2,
  History,
  Layers,
} from 'lucide-react';
import { LandingPageConfig } from '@/services/landingPageService';

export type ActiveTab =
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

export type ShowToastFn = (text: string, type?: 'success' | 'error' | 'info') => void;

export interface BaseLandingTabProps {
  config: LandingPageConfig;
  handleUpdateConfig: (newConfig: LandingPageConfig) => void;
}

export interface LandingTabItem {
  id: ActiveTab;
  label: string;
  renderIcon: () => React.ReactNode;
}

export const LANDING_ADMIN_TABS: LandingTabItem[] = [
  { id: 'overview', label: 'ওভারভিউ', renderIcon: () => <Layers className="w-4 h-4" /> },
  { id: 'sections', label: 'সেকশন ম্যানেজার', renderIcon: () => <LayoutTemplate className="w-4 h-4" /> },
  { id: 'header', label: 'হেডার ও নেভিগেশন', renderIcon: () => <Globe className="w-4 h-4" /> },
  { id: 'hero', label: 'হিরো ও ব্যানার', renderIcon: () => <Sparkles className="w-4 h-4" /> },
  { id: 'about', label: 'পরিচিতি ও বাণী', renderIcon: () => <School className="w-4 h-4" /> },
  { id: 'features', label: 'ফিচার ও সুবিধাসমূহ', renderIcon: () => <Building2 className="w-4 h-4" /> },
  { id: 'stats', label: 'পরিসংখ্যান', renderIcon: () => <Award className="w-4 h-4" /> },
  { id: 'academic', label: 'একাডেমিক ও শাখা', renderIcon: () => <BookOpen className="w-4 h-4" /> },
  { id: 'achievers', label: 'সেরা ছাত্র/ছাত্রী', renderIcon: () => <GraduationCap className="w-4 h-4" /> },
  { id: 'gallery', label: 'গ্যালারি ছবি ও ভিডিও', renderIcon: () => <Camera className="w-4 h-4" /> },
  { id: 'blog', label: 'সংবাদ ও ব্লগ', renderIcon: () => <FileText className="w-4 h-4" /> },
  { id: 'faq', label: 'সাধারণ প্রশ্নোত্তর', renderIcon: () => <HelpCircle className="w-4 h-4" /> },
  { id: 'media', label: 'ছবি ও মিডিয়া', renderIcon: () => <ImageIcon className="w-4 h-4" /> },
  { id: 'theme', label: 'রং, ফন্ট ও থিম', renderIcon: () => <Palette className="w-4 h-4" /> },
  { id: 'footer', label: 'যোগাযোগ ও ফুটার', renderIcon: () => <Mail className="w-4 h-4" /> },
  { id: 'seo', label: 'SEO ও সোশ্যাল', renderIcon: () => <Share2 className="w-4 h-4" /> },
  { id: 'history', label: 'সংস্করণ ইতিহাস', renderIcon: () => <History className="w-4 h-4" /> },
];
