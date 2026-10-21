'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Monitor, 
  FlaskConical, 
  BookOpen, 
  Trophy, 
  Compass, 
  Droplet,
  Sparkles,
  Microscope,
  Laptop,
  Users,
  Award,
  ShieldCheck,
  Heart,
  Building2,
  CheckCircle2,
  ArrowRight,
  Settings
} from 'lucide-react';
import { FacilitiesConfig, FacilityItem } from '@/services/landingPageService';

interface PublicFacilitiesSectionProps {
  facilitiesConfig?: FacilitiesConfig | null;
}

// Map icon string names to React Lucide components
function renderFacilityIcon(iconName: string, colorClass: string = 'text-indigo-600') {
  const props = { className: `w-6 h-6 sm:w-7 sm:h-7 ${colorClass} transition-transform duration-300 group-hover:scale-110`, strokeWidth: 2.2 };
  switch (iconName?.toLowerCase()) {
    case 'monitor':
    case 'computer':
      return <Monitor {...props} />;
    case 'laptop':
      return <Laptop {...props} />;
    case 'flaskconical':
    case 'flask':
    case 'science':
      return <FlaskConical {...props} />;
    case 'microscope':
      return <Microscope {...props} />;
    case 'bookopen':
    case 'library':
    case 'book':
      return <BookOpen {...props} />;
    case 'trophy':
    case 'sports':
      return <Trophy {...props} />;
    case 'compass':
    case 'scout':
      return <Compass {...props} />;
    case 'droplet':
    case 'water':
      return <Droplet {...props} />;
    case 'users':
      return <Users {...props} />;
    case 'award':
      return <Award {...props} />;
    case 'shieldcheck':
    case 'shield':
      return <ShieldCheck {...props} />;
    case 'heart':
      return <Heart {...props} />;
    default:
      return <Building2 {...props} />;
  }
}

// Preset color configurations for high-contrast, modern cards
interface ColorScheme {
  ring: string;
  bgGlow: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  hoverBorder: string;
}

const COLOR_SCHEMES: Record<string, ColorScheme> = {
  indigo: {
    ring: 'border-indigo-300/80 dark:border-indigo-700/80',
    bgGlow: 'from-indigo-500/10 via-transparent to-transparent',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    hoverBorder: 'hover:border-indigo-400 dark:hover:border-indigo-500',
  },
  emerald: {
    ring: 'border-emerald-300/80 dark:border-emerald-700/80',
    bgGlow: 'from-emerald-500/10 via-transparent to-transparent',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500',
  },
  amber: {
    ring: 'border-amber-300/80 dark:border-amber-700/80',
    bgGlow: 'from-amber-500/10 via-transparent to-transparent',
    iconBg: 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800',
    badgeText: 'text-amber-700 dark:text-amber-300',
    hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-500',
  },
  rose: {
    ring: 'border-rose-300/80 dark:border-rose-700/80',
    bgGlow: 'from-rose-500/10 via-transparent to-transparent',
    iconBg: 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800',
    badgeText: 'text-rose-700 dark:text-rose-300',
    hoverBorder: 'hover:border-rose-400 dark:hover:border-rose-500',
  },
  cyan: {
    ring: 'border-cyan-300/80 dark:border-cyan-700/80',
    bgGlow: 'from-cyan-500/10 via-transparent to-transparent',
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/70 border-cyan-200 dark:border-cyan-800',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    hoverBorder: 'hover:border-cyan-400 dark:hover:border-cyan-500',
  },
  blue: {
    ring: 'border-blue-300/80 dark:border-blue-700/80',
    bgGlow: 'from-blue-500/10 via-transparent to-transparent',
    iconBg: 'bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800',
    badgeText: 'text-blue-700 dark:text-blue-300',
    hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500',
  },
};

// 6 Default facilities in Bengali
const DEFAULT_FACILITIES: FacilityItem[] = [
  {
    id: 'fac-1',
    title: 'শেখ রাসেল ডিজিটাল ল্যাব',
    titleEn: 'Sheikh Russel Digital Lab',
    description: 'উচ্চগতির ব্রডব্যান্ড ইন্টারনেট ও আধুনিক কম্পিউটার সমৃদ্ধ ল্যাব, যেখানে শিক্ষার্থীরা আইসিটি, কোডিং ও ডিজিটাল লিটারেসি হাতে-কলমে শেখে।',
    icon: 'Monitor',
    badge: 'আইসিটি ও কম্পিউটার',
    color: 'indigo',
    visible: true,
  },
  {
    id: 'fac-2',
    title: 'আধুনিক বিজ্ঞানাগার (ল্যাব)',
    titleEn: 'Science Laboratories',
    description: 'পদার্থবিজ্ঞান, রসায়ন ও জীববিজ্ঞানের সকল প্রয়োজনীয় আধুনিক যন্ত্রপাতি ও গবেষণাসামগ্রী সমৃদ্ধ সার্বক্ষণিক ব্যবহারিক ল্যাবরেটরি।',
    icon: 'FlaskConical',
    badge: 'ব্যবহারিক বিজ্ঞান',
    color: 'emerald',
    visible: true,
  },
  {
    id: 'fac-3',
    title: 'কেন্দ্রীয় লাইব্রেরি ও পাঠকক্ষ',
    titleEn: 'Central Library & Reading Room',
    description: 'পাঠ্যপুস্তক, সৃজনশীল সাহিত্য, দেশি-বিদেশি রেফারেন্স বই, বিজ্ঞান সাময়িকী ও দৈনিক সংবাদপত্রে সমৃদ্ধ একটি শান্ত ও সুশৃঙ্খল পাঠাগার।',
    icon: 'BookOpen',
    badge: '৫,০০০+ বই সংগ্রহ',
    color: 'amber',
    visible: true,
  },
  {
    id: 'fac-4',
    title: 'প্রশস্ত খেলার মাঠ ও ক্রীড়া',
    titleEn: 'Expansive Sports Ground',
    description: 'ফুটবল, ক্রিকেট, ভলিবল ও বার্ষিক ক্রীড়া প্রতিযোগিতার জন্য উন্মুক্ত ও সবুজ ঘাসে ঘেরা সুবিশাল খেলাধুলার মাঠ।',
    icon: 'Trophy',
    badge: 'খেলাধুলা ও শরীরচর্চা',
    color: 'rose',
    visible: true,
  },
  {
    id: 'fac-5',
    title: 'স্কাউটিং ও সহশিক্ষা কার্যক্রম',
    titleEn: 'Scouting & Co-Curricular',
    description: 'বাংলাদেশ স্কাউটস ও গার্ল গাইডসের সক্রিয় ইউনিট, বিতর্ক ও বিজ্ঞান ক্লাব যা শিক্ষার্থীদের নেতৃত্বগুণ ও শৃঙ্খলাবোধ গড়ে তোলে।',
    icon: 'Compass',
    badge: 'নেতৃত্ব ও শৃঙ্খলা',
    color: 'cyan',
    visible: true,
  },
  {
    id: 'fac-6',
    title: 'বিশুদ্ধ পানি ও আধুনিক স্যানিটেশন',
    titleEn: 'Purified Water & Hygiene',
    description: 'আধুনিক ডিপ-ফিল্টারযুক্ত নিরাপদ বিশুদ্ধ খাবার পানির ব্যবস্থা এবং ছাত্র ও ছাত্রীদের জন্য সম্পূর্ণ পৃথক পরিচ্ছন্ন স্যানিটেশন ব্লক।',
    icon: 'Droplet',
    badge: 'স্বাস্থ্য ও সুরক্ষা',
    color: 'blue',
    visible: true,
  },
];

export default function PublicFacilitiesSection({ facilitiesConfig }: PublicFacilitiesSectionProps) {
  // If section is disabled by admin, return null
  if (facilitiesConfig && facilitiesConfig.enabled === false) {
    return null;
  }

  const eyebrow = facilitiesConfig?.eyebrow || 'ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ';
  const title = facilitiesConfig?.title || 'শিক্ষার্থীদের সার্বিক বিকাশে আধুনিক সুযোগ-সুবিধা';
  const subtitle = facilitiesConfig?.subtitle || 'সুপরিকল্পিত ও মনোরম ক্যাম্পাস পরিবেশ, যা শিক্ষার্থীদের সুস্থ, সৃজনশীল ও বাস্তবমুখী জ্ঞানার্জনে অনুপ্রাণিত করে।';
  
  // Use config items if defined, otherwise fallback to defaults
  const activeItems = (facilitiesConfig?.items && facilitiesConfig.items.length > 0)
    ? facilitiesConfig.items.filter((item) => item.visible !== false)
    : DEFAULT_FACILITIES;

  return (
    <section 
      id="facilities" 
      className="py-10 sm:py-14 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 relative overflow-hidden"
    >
      {/* Background Ambient Decorative Lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ===================================================================
            সেকশন হেডার: টাইটেল, ডুয়েল আন্ডারলাইন ও সাবটাইটেল
            =================================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-8 sm:mb-10">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 px-4 py-1.5 rounded-full border border-indigo-200/80 dark:border-indigo-800 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{eyebrow}</span>
          </div>

          {/* Section Main Title */}
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h2>

            {/* Institutional Dual-colored Underline */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              <span className="w-16 h-1.5 bg-[#0B5D3B] rounded-full"></span>
              <span className="w-4 h-1.5 bg-[#F4B400] rounded-full"></span>
            </div>
          </div>

          {/* Subtitle Description */}
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto pt-1 font-medium">
            {subtitle}
          </p>
        </div>

        {/* ===================================================================
            ৬টি কার্ডের আধুনিক গ্রিড (Desktop: 3 কলাম, Tablet: 2 কলাম, Mobile: 1 কলাম)
            =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {activeItems.map((fac, idx) => {
            const scheme = COLOR_SCHEMES[fac.color || 'indigo'] || COLOR_SCHEMES.indigo;
            return (
              <div
                key={fac.id || idx}
                className={`group relative bg-white dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl ${scheme.hoverBorder} hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden`}
              >
                {/* Ambient Top Glow on Hover */}
                <div className={`absolute top-0 left-0 right-0 h-28 bg-gradient-to-b ${scheme.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                <div>
                  {/* Top Bar: 3D Neo-glass Icon Container + Micro Badge */}
                  <div className="flex items-start justify-between gap-3 mb-5 relative z-10">
                    <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl ${scheme.iconBg} border flex items-center justify-center shadow-xs group-hover:shadow-md transition-all duration-300 group-hover:scale-105`}>
                      {renderFacilityIcon(fac.icon, scheme.iconColor)}
                    </div>

                    {fac.badge && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${scheme.badgeBg} ${scheme.badgeText} shadow-2xs`}>
                        <Sparkles className="w-2.5 h-2.5 opacity-70" />
                        <span>{fac.badge}</span>
                      </span>
                    )}
                  </div>

                  {/* Facility Title */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug relative z-10">
                    {fac.title}
                  </h3>

                  {/* Facility English Title (if present) */}
                  {fac.titleEn && (
                    <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 font-en mt-0.5">
                      {fac.titleEn}
                    </div>
                  )}

                  {/* Facility Detailed Description */}
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mt-2.5 font-normal relative z-10">
                    {fac.description}
                  </p>
                </div>

                {/* Bottom Card Footer with Feature Indicator */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 relative z-10">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>ক্যাম্পাসে সার্বক্ষণিক সচল</span>
                  </span>

                  <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    সুবিধা #{idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===================================================================
            নিচে দ্রুত অ্যাডমিন সেটিংস লিংক / ইনফো বার
            =================================================================== */}
        <div className="mt-10 sm:mt-12 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>সকল সুযোগ-সুবিধা বিদ্যালয় পরিচালনা পর্ষদ ও সরকার কর্তৃক অনুমোদিত।</span>
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <Link
              href="/dashboard/settings?tab=facilities"
              className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>অ্যাডমিন সেটিংস থেকে সম্পাদনা করুন</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
