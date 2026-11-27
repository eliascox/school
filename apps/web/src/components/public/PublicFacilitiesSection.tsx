'use client';

import React from 'react';
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
} from 'lucide-react';
import { FacilitiesConfig, FacilityItem } from '@/services/landingPageService';
import { toBanglaDigits } from '@/lib/resultPortalUtils';

interface PublicFacilitiesSectionProps {
  facilitiesConfig?: FacilitiesConfig | null;
}

function renderFacilityIcon(iconName: string, colorClass = 'text-[#0B5D3B]') {
  const props = {
    className: `w-6 h-6 ${colorClass} transition-transform duration-300 group-hover:scale-110`,
    strokeWidth: 2.1,
  };
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

const COLOR_SCHEMES: Record<
  string,
  { iconBg: string; iconColor: string; badge: string; hoverBorder: string }
> = {
  indigo: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
    hoverBorder: 'hover:border-indigo-400/70',
  },
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-[#0B5D3B] dark:text-emerald-400',
    badge: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-[#0B5D3B] dark:text-emerald-300',
    hoverBorder: 'hover:border-emerald-400/70',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    hoverBorder: 'hover:border-amber-400/70',
  },
  rose: {
    iconBg: 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
    hoverBorder: 'hover:border-rose-400/70',
  },
  cyan: {
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/70 border-cyan-200 dark:border-cyan-800',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    badge: 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300',
    hoverBorder: 'hover:border-cyan-400/70',
  },
  blue: {
    iconBg: 'bg-sky-50 dark:bg-sky-950/70 border-sky-200 dark:border-sky-800',
    iconColor: 'text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-50 dark:bg-sky-950/80 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300',
    hoverBorder: 'hover:border-sky-400/70',
  },
};

const DEFAULT_FACILITIES: FacilityItem[] = [
  {
    id: 'fac-1',
    title: 'শেখ রাসেল ডিজিটাল ল্যাব',
    titleEn: 'Sheikh Russel Digital Lab',
    description:
      'উচ্চগতির ইন্টারনেট ও আধুনিক কম্পিউটার সমৃদ্ধ ল্যাব, যেখানে শিক্ষার্থীরা আইসিটি, কোডিং ও ডিজিটাল দক্ষতা হাতে-কলমে শেখে।',
    icon: 'Monitor',
    badge: 'আইসিটি ও কম্পিউটার',
    color: 'indigo',
    visible: true,
  },
  {
    id: 'fac-2',
    title: 'আধুনিক বিজ্ঞানাগার (ল্যাব)',
    titleEn: 'Science Laboratories',
    description:
      'পদার্থবিজ্ঞান, রসায়ন ও জীববিজ্ঞানের সকল প্রয়োজনীয় আধুনিক যন্ত্রপাতি সমৃদ্ধ সার্বক্ষণিক ব্যবহারিক ল্যাবরেটরি।',
    icon: 'FlaskConical',
    badge: 'ব্যবহারিক বিজ্ঞান',
    color: 'emerald',
    visible: true,
  },
  {
    id: 'fac-3',
    title: 'কেন্দ্রীয় লাইব্রেরি ও পাঠকক্ষ',
    titleEn: 'Central Library & Reading Room',
    description:
      'পাঠ্যপুস্তক, সৃজনশীল সাহিত্য, রেফারেন্স বই, বিজ্ঞান সাময়িকী ও দৈনিক সংবাদপত্রে সমৃদ্ধ শান্ত ও সুশৃঙ্খল পাঠাগার।',
    icon: 'BookOpen',
    badge: '৫,০০০+ বই সংগ্রহ',
    color: 'amber',
    visible: true,
  },
  {
    id: 'fac-4',
    title: 'প্রশস্ত খেলার মাঠ ও ক্রীড়া',
    titleEn: 'Expansive Sports Ground',
    description:
      'ফুটবল, ক্রিকেট, ভলিবল ও বার্ষিক ক্রীড়া প্রতিযোগিতার জন্য উন্মুক্ত ও সবুজ ঘাসে ঘেরা সুবিশাল খেলার মাঠ।',
    icon: 'Trophy',
    badge: 'খেলাধুলা ও শরীরচর্চা',
    color: 'rose',
    visible: true,
  },
  {
    id: 'fac-5',
    title: 'স্কাউটিং ও সহশিক্ষা কার্যক্রম',
    titleEn: 'Scouting & Co-Curricular',
    description:
      'বাংলাদেশ স্কাউটস ও গার্ল গাইডস ইউনিট, বিতর্ক ও বিজ্ঞান ক্লাব যা শিক্ষার্থীদের নেতৃত্বগুণ ও শৃঙ্খলাবোধ গড়ে তোলে।',
    icon: 'Compass',
    badge: 'নেতৃত্ব ও শৃঙ্খলা',
    color: 'cyan',
    visible: true,
  },
  {
    id: 'fac-6',
    title: 'বিশুদ্ধ পানি ও আধুনিক স্যানিটেশন',
    titleEn: 'Purified Water & Hygiene',
    description:
      'আধুনিক ডিপ-ফিল্টারযুক্ত নিরাপদ বিশুদ্ধ খাবার পানির ব্যবস্থা এবং ছাত্র-ছাত্রীদের জন্য পৃথক পরিচ্ছন্ন স্যানিটেশন ব্লক।',
    icon: 'Droplet',
    badge: 'স্বাস্থ্য ও সুরক্ষা',
    color: 'blue',
    visible: true,
  },
];

export default function PublicFacilitiesSection({ facilitiesConfig }: PublicFacilitiesSectionProps) {
  if (facilitiesConfig && facilitiesConfig.enabled === false) {
    return null;
  }

  const eyebrow = facilitiesConfig?.eyebrow || 'ক্যাম্পাস অবকাঠামো ও সুবিধাসমূহ';
  const title = facilitiesConfig?.title || 'শিক্ষার্থীদের সার্বিক বিকাশে আধুনিক সুযোগ-সুবিধা';
  const subtitle =
    facilitiesConfig?.subtitle ||
    'সুপরিকল্পিত ও মনোরম ক্যাম্পাস পরিবেশ, যা শিক্ষার্থীদের সুস্থ, সৃজনশীল ও বাস্তবমুখী জ্ঞানার্জনে অনুপ্রাণিত করে।';

  const activeItems =
    facilitiesConfig?.items && facilitiesConfig.items.length > 0
      ? facilitiesConfig.items.filter((item) => item.visible !== false)
      : DEFAULT_FACILITIES;

  return (
    <section
      id="facilities"
      className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-9 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-[#0B5D3B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#F4B400]" />
            <span>{eyebrow}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h2>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-14 h-1.5 bg-[#0B5D3B] rounded-full" />
            <span className="w-3.5 h-1.5 bg-[#F4B400] rounded-full" />
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto pt-1">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {activeItems.map((fac, idx) => {
            const scheme = COLOR_SCHEMES[fac.color || 'emerald'] || COLOR_SCHEMES.emerald;
            return (
              <div
                key={fac.id || idx}
                className={`group relative bg-[#F8FAFC] dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800/90 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xl ${scheme.hoverBorder} hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${scheme.iconBg} border flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform`}
                    >
                      {renderFacilityIcon(fac.icon, scheme.iconColor)}
                    </div>

                    {fac.badge && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${scheme.badge}`}
                      >
                        <span>{fac.badge}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-[#0B5D3B] dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {fac.title}
                  </h3>

                  {fac.titleEn && (
                    <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 font-en mt-0.5">
                      {fac.titleEn}
                    </div>
                  )}

                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mt-2.5">
                    {fac.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 text-[#0B5D3B] dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>ক্যাম্পাসে সার্বক্ষণিক সচল</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    সুবিধা #{toBanglaDigits(idx + 1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Institutional Assurance Pill */}
        <div className="mt-9 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#0B5D3B] dark:text-emerald-400 shrink-0" />
              <span>সকল আধুনিক সুবিধা বিদ্যালয় পরিচালনা পর্ষদ ও শিক্ষা বোর্ড অনুমোদিত।</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
