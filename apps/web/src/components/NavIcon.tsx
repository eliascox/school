'use client';

import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  CalendarCheck2,
  Users,
  UserCheck,
  UserPlus,
  FileSpreadsheet,
  TrendingUp,
  GraduationCap,
  Send,
  Smartphone,
  BookOpenCheck,
  Grid3X3,
  BookOpen,
  Calendar,
  Award,
  SlidersHorizontal,
  Edit3,
  Layers,
  FileBarChart,
  ClipboardList,
  Search,
  Printer,
  CreditCard,
  BadgeCheck,
  FileCheck,
  FileBadge,
  Receipt,
  Banknote,
  Landmark,
  RotateCcw,
  MessageSquareDot,
  Bell,
  Library,
  Bus,
  Globe,
  Sliders,
  Settings,
  ExternalLink,
  FileText,
  ScanLine,
} from 'lucide-react';
import type { NavIconKey } from '@/config/navigationConfig';

export function NavIcon({
  name,
  className = 'w-4 h-4',
}: {
  name: NavIconKey;
  className?: string;
}) {
  switch (name) {
    case 'dashboard':
      return <LayoutDashboard className={className} />;
    case 'analytics':
      return <BarChart3 className={className} />;
    case 'wallet':
      return <Wallet className={className} />;
    case 'attendance':
      return <CalendarCheck2 className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'userCheck':
      return <UserCheck className={className} />;
    case 'userPlus':
      return <UserPlus className={className} />;
    case 'fileSpreadsheet':
      return <FileSpreadsheet className={className} />;
    case 'trendingUp':
      return <TrendingUp className={className} />;
    case 'graduationCap':
      return <GraduationCap className={className} />;
    case 'send':
      return <Send className={className} />;
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'bookOpenCheck':
      return <BookOpenCheck className={className} />;
    case 'grid':
      return <Grid3X3 className={className} />;
    case 'bookOpen':
      return <BookOpen className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'slidersHorizontal':
      return <SlidersHorizontal className={className} />;
    case 'edit':
      return <Edit3 className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'fileBarChart':
      return <FileBarChart className={className} />;
    case 'clipboardList':
      return <ClipboardList className={className} />;
    case 'barChart':
      return <BarChart3 className={className} />;
    case 'search':
      return <Search className={className} />;
    case 'printer':
      return <Printer className={className} />;
    case 'creditCard':
      return <CreditCard className={className} />;
    case 'badgeCheck':
      return <BadgeCheck className={className} />;
    case 'fileCheck':
      return <FileCheck className={className} />;
    case 'fileBadge':
      return <FileBadge className={className} />;
    case 'receipt':
      return <Receipt className={className} />;
    case 'banknote':
      return <Banknote className={className} />;
    case 'landmark':
      return <Landmark className={className} />;
    case 'rotateCcw':
      return <RotateCcw className={className} />;
    case 'messageSquare':
      return <MessageSquareDot className={className} />;
    case 'bell':
      return <Bell className={className} />;
    case 'library':
      return <Library className={className} />;
    case 'bus':
      return <Bus className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'sliders':
      return <Sliders className={className} />;
    case 'settings':
      return <Settings className={className} />;
    case 'externalLink':
      return <ExternalLink className={className} />;
    case 'fileText':
      return <FileText className={className} />;
    case 'scanLine':
      return <ScanLine className={className} />;
    default:
      return <LayoutDashboard className={className} />;
  }
}
