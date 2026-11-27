'use client';

import React, { useId } from 'react';
import { Lock } from 'lucide-react';

export const AURORA_INPUT_CLASS =
  'w-full pl-10 pr-4 py-3 rounded-xl bg-[#F5F7FF] border border-indigo-200/80 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-violet-500/12 transition-all';

export const AURORA_INPUT_PR10_CLASS =
  'w-full pl-10 pr-11 py-3 rounded-xl bg-[#F5F7FF] border border-indigo-200/80 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#7C3AED] focus:outline-none focus:ring-4 focus:ring-violet-500/12 transition-all';

export const AURORA_PRIMARY_BTN_CLASS =
  'w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4B6BFF] via-[#8B5CF6] to-[#D946EF] hover:brightness-105 active:scale-[0.99] text-white font-bold text-sm shadow-[0_12px_28px_-6px_rgba(124,58,237,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed';

export const AURORA_EMERALD_BTN_CLASS =
  'w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0284C7] via-[#059669] to-[#0D9488] hover:brightness-105 active:scale-[0.99] text-white font-bold text-sm shadow-[0_12px_26px_-6px_rgba(5,150,105,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed';

/**
 * Pure vector pastel-luminous silk aurora waves floating gracefully along the bottom of a crisp white card.
 */
export function AuroraWaveArtwork({ className = '' }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const gradA = `aurora-lt-a-${uid}`;
  const gradB = `aurora-lt-b-${uid}`;
  const gradC = `aurora-lt-c-${uid}`;
  const strokeA = `aurora-lt-sa-${uid}`;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-32 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <div className="absolute -bottom-10 left-1/5 w-44 h-24 rounded-full bg-[#6366F1]/18 blur-2xl" />
      <div className="absolute -bottom-10 right-1/5 w-48 h-24 rounded-full bg-[#E879F9]/22 blur-2xl" />

      <svg viewBox="0 0 420 130" preserveAspectRatio="none" className="w-full h-full block">
        <defs>
          <linearGradient id={gradA} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.16" />
            <stop offset="48%" stopColor="#8B5CF6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.24" />
          </linearGradient>
          <linearGradient id={gradB} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.24" />
            <stop offset="52%" stopColor="#9333EA" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#F0ABFC" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id={gradC} x1="15%" y1="0%" x2="95%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#C084FC" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#F472B6" stopOpacity="0.32" />
          </linearGradient>
          <linearGradient id={strokeA} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
            <stop offset="45%" stopColor="#A855F7" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        <path
          d="M0,96 C75,54 148,110 228,76 C298,46 356,34 420,54 L420,130 L0,130 Z"
          fill={`url(#${gradA})`}
        />
        <path
          d="M0,108 C64,66 130,50 198,82 C264,114 338,72 420,90 L420,130 L0,130 Z"
          fill={`url(#${gradB})`}
        />
        <path
          d="M0,118 C88,92 156,70 236,98 C308,122 368,88 420,74 L420,130 L0,130 Z"
          fill={`url(#${gradC})`}
        />
        <path
          d="M0,108 C64,66 130,50 198,82 C264,114 338,72 420,90"
          fill="none"
          stroke={`url(#${strokeA})`}
          strokeWidth="1.4"
        />
      </svg>
    </div>
  );
}

interface AuroraEmblemTileProps {
  schoolLogo?: string;
  schoolName: string;
  logoFailed?: boolean;
  onLogoError?: () => void;
  badgeContent?: React.ReactNode;
  badgeTitle?: string;
}

/**
 * Crisp elevated white frosted-glass emblem square with soft indigo-violet halo.
 */
export function AuroraEmblemTile({
  schoolLogo,
  schoolName,
  logoFailed,
  onLogoError,
  badgeContent,
  badgeTitle,
}: AuroraEmblemTileProps) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className="pointer-events-none absolute -inset-2.5 rounded-3xl bg-gradient-to-tr from-[#4F6BFF]/25 via-[#8B5CF6]/25 to-[#E84CF5]/20 blur-lg"
        aria-hidden="true"
      />
      <div className="relative w-[68px] h-[68px] rounded-[20px] bg-white border border-indigo-200/90 shadow-[0_12px_28px_-6px_rgba(99,102,241,0.28)] flex items-center justify-center p-2.5 overflow-hidden">
        {schoolLogo && !logoFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={schoolLogo}
            alt={schoolName}
            onError={onLogoError}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#4F6BFF] via-[#8B5CF6] to-[#D946EF] flex items-center justify-center text-white shadow-inner">
            <Lock className="w-7 h-7" strokeWidth={2.2} />
          </div>
        )}
      </div>
      {badgeContent && (
        <span
          title={badgeTitle}
          className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#4F6BFF] to-[#D946EF] text-[11px] text-white shadow-md border-2 border-white"
        >
          {badgeContent}
        </span>
      )}
    </div>
  );
}

interface AuroraLoginCardProps {
  children: React.ReactNode;
  variant?: 'card' | 'mobile-full';
  className?: string;
}

/**
 * Shared Crisp White Pearl Aurora Login Container with subtle indigo border & bottom pastel silk waves.
 */
export function AuroraLoginCard({
  children,
  variant = 'card',
  className = '',
}: AuroraLoginCardProps) {
  const isMobileFull = variant === 'mobile-full';

  return (
    <div
      className={`relative overflow-hidden text-slate-900 ${
        isMobileFull
          ? 'flex-1 flex flex-col min-h-full'
          : 'rounded-[28px] border border-indigo-200/80 shadow-[0_24px_64px_-16px_rgba(79,70,229,0.16),0_4px_16px_-2px_rgba(15,23,42,0.05)]'
      } ${className}`}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 68%, #F8F5FF 100%)',
      }}
    >
      {/* Subtle top-center luminous pearl sheen */}
      <div
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full bg-gradient-to-r from-[#6366F1]/12 via-[#A855F7]/12 to-[#EC4899]/10 blur-2xl"
        aria-hidden="true"
      />

      {/* Foreground interactive content */}
      <div className={`relative z-10 ${isMobileFull ? 'flex-1 flex flex-col' : ''}`}>
        {children}
      </div>

      {/* Bottom pastel-luminous silk aurora waves */}
      <AuroraWaveArtwork />
    </div>
  );
}
