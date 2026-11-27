'use client';

import React, { useId } from 'react';
import { Lock } from 'lucide-react';

export const AURORA_INPUT_CLASS =
  'w-full pl-10 pr-4 py-3 rounded-xl bg-[#0B122B]/85 border border-[#7C8CFF]/25 text-sm font-medium text-white placeholder:text-slate-400/75 focus:bg-[#0F183A] focus:border-[#C084FC]/80 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/25 transition-all';

export const AURORA_INPUT_PR10_CLASS =
  'w-full pl-10 pr-11 py-3 rounded-xl bg-[#0B122B]/85 border border-[#7C8CFF]/25 text-sm font-medium text-white placeholder:text-slate-400/75 focus:bg-[#0F183A] focus:border-[#C084FC]/80 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/25 transition-all';

export const AURORA_PRIMARY_BTN_CLASS =
  'w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4B6BFF] via-[#8F5BFF] to-[#E64DF7] hover:brightness-110 active:scale-[0.99] text-white font-bold text-sm shadow-[0_12px_32px_-6px_rgba(168,85,247,0.62)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed';

export const AURORA_EMERALD_BTN_CLASS =
  'w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0EA5E9] via-[#10B981] to-[#14B8A6] hover:brightness-110 active:scale-[0.99] text-white font-bold text-sm shadow-[0_12px_30px_-6px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed';

/**
 * Pure vector luminous silk aurora waves floating along the bottom edge of the login card.
 * Zero external image bytes, crisp on Retina/4K displays.
 */
export function AuroraWaveArtwork({ className = '' }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const gradA = `aurora-a-${uid}`;
  const gradB = `aurora-b-${uid}`;
  const gradC = `aurora-c-${uid}`;
  const strokeA = `aurora-sa-${uid}`;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-36 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* Ambient soft neon bloom behind waves */}
      <div className="absolute -bottom-10 left-1/4 w-48 h-28 rounded-full bg-[#4F6BFF]/35 blur-3xl" />
      <div className="absolute -bottom-12 right-1/6 w-52 h-28 rounded-full bg-[#D946EF]/35 blur-3xl" />

      <svg
        viewBox="0 0 420 140"
        preserveAspectRatio="none"
        className="w-full h-full block"
      >
        <defs>
          <linearGradient id={gradA} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
            <stop offset="45%" stopColor="#8B5CF6" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.48" />
          </linearGradient>
          <linearGradient id={gradB} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#9333EA" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#E879F9" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id={gradC} x1="15%" y1="0%" x2="95%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.32" />
            <stop offset="55%" stopColor="#C084FC" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#F472B6" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={strokeA} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.2" />
            <stop offset="35%" stopColor="#C084FC" stopOpacity="0.95" />
            <stop offset="72%" stopColor="#F0ABFC" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* Back deep silk wave */}
        <path
          d="M0,104 C75,58 148,118 228,82 C298,50 356,34 420,56 L420,140 L0,140 Z"
          fill={`url(#${gradA})`}
        />

        {/* Mid glowing translucent ribbon */}
        <path
          d="M0,118 C64,72 130,52 198,86 C264,120 338,76 420,96 L420,140 L0,140 Z"
          fill={`url(#${gradB})`}
        />

        {/* Front luminous accent crest */}
        <path
          d="M0,126 C88,100 156,74 236,104 C308,130 368,94 420,78 L420,140 L0,140 Z"
          fill={`url(#${gradC})`}
        />

        {/* Crisp glowing neon rim lines */}
        <path
          d="M0,118 C64,72 130,52 198,86 C264,120 338,76 420,96"
          fill="none"
          stroke={`url(#${strokeA})`}
          strokeWidth="1.6"
        />
        <path
          d="M0,104 C75,58 148,118 228,82 C298,50 356,34 420,56"
          fill="none"
          stroke={`url(#${strokeA})`}
          strokeWidth="1.1"
          opacity="0.7"
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
 * Centered glowing translucent indigo-violet glass square tile (matching the reference emblem).
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
      {/* Radial ambient halo behind the glass square */}
      <div
        className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-tr from-[#4F6BFF]/45 via-[#8B5CF6]/45 to-[#E84CF5]/35 blur-xl opacity-85"
        aria-hidden="true"
      />
      <div className="relative w-[68px] h-[68px] rounded-[20px] bg-gradient-to-b from-[#2A3E99]/80 via-[#1B2464]/85 to-[#121642]/95 border border-[#7EA0FF]/45 shadow-[0_12px_30px_-4px_rgba(99,102,241,0.55),inset_0_1px_1px_rgba(255,255,255,0.28)] flex items-center justify-center p-2.5 overflow-hidden">
        {schoolLogo && !logoFailed ? (
          <div className="w-full h-full rounded-xl bg-white/95 p-1 flex items-center justify-center shadow-inner overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={schoolLogo}
              alt={schoolName}
              onError={onLogoError}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <Lock
            className="w-8 h-8 text-[#B794FF] drop-shadow-[0_0_12px_rgba(167,139,250,0.85)]"
            strokeWidth={2.2}
          />
        )}
      </div>
      {badgeContent && (
        <span
          title={badgeTitle}
          className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#4F6BFF] to-[#D946EF] text-[11px] text-white shadow-md border-2 border-[#0B0F29]"
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
 * Shared Cosmic Midnight Indigo Login Container with glowing violet border & bottom Aurora SVG waves.
 */
export function AuroraLoginCard({
  children,
  variant = 'card',
  className = '',
}: AuroraLoginCardProps) {
  const isMobileFull = variant === 'mobile-full';

  return (
    <div
      className={`relative overflow-hidden text-white ${
        isMobileFull
          ? 'flex-1 flex flex-col min-h-full'
          : 'rounded-[28px] border border-[#8B7BFF]/40 shadow-[0_28px_80px_-14px_rgba(79,70,229,0.48),inset_0_1px_0_0_rgba(196,181,253,0.28)]'
      } ${className}`}
      style={{
        background:
          'linear-gradient(180deg, #1E1D6B 0%, #101338 28%, #070B1E 70%, #1B0E44 100%)',
      }}
    >
      {/* Subtle top-center ambient illumination */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-48 rounded-full bg-[#6366F1]/28 blur-3xl"
        aria-hidden="true"
      />

      {/* Foreground interactive content */}
      <div className={`relative z-10 ${isMobileFull ? 'flex-1 flex flex-col' : ''}`}>
        {children}
      </div>

      {/* Bottom luminous aurora waves */}
      <AuroraWaveArtwork />
    </div>
  );
}
