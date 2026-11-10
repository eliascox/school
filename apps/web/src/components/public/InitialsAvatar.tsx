'use client';

import React, { useEffect, useState } from 'react';

/**
 * Known demo/stock portrait IDs that were previously used as placeholder faces.
 * Real institutional pages should never show unrelated stock faces, so these are
 * treated as "no photo" and replaced with a clean initials avatar.
 */
const STOCK_PORTRAIT_IDS = [
  '1507003211169',
  '1472099645785',
  '1544717305',
  '1534528741775',
  '1573496359142',
  '1560250097',
  '1580894732454',
  '1500648767791',
  '1535713875002',
];

export function isStockPortrait(url?: string | null): boolean {
  if (!url) return false;
  return url.includes('images.unsplash.com') && STOCK_PORTRAIT_IDS.some((id) => url.includes(id));
}

/** Returns a usable photo URL, or '' when missing / a stock placeholder. */
export function resolvePortrait(url?: string | null): string {
  if (!url || !url.trim() || isStockPortrait(url)) return '';
  return url;
}

const HONORIFICS = /^(জনাব|জনাবা|বেগম|মোসাম্মৎ|মোছাঃ|মোঃ|মো\.|মোহাম্মদ|মুহাম্মদ|আলহাজ্ব|আলহাজ|ইঞ্জিঃ|ডাঃ|ড\.|প্রফেসর|অধ্যাপক|Md\.?|Mohammad|Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Engr\.?|Prof\.?)\s+/i;

export function getInitial(name?: string): string {
  let n = (name || '').trim();
  for (let i = 0; i < 3; i++) {
    const stripped = n.replace(HONORIFICS, '').trim();
    if (stripped === n) break;
    n = stripped;
  }
  return Array.from(n)[0] || '•';
}

interface InitialsAvatarProps {
  src?: string | null;
  name: string;
  /** Sizing, rounding and border classes for the outer container */
  className?: string;
  /** Font size classes for the initial letter */
  textClassName?: string;
  /** Extra classes for the <img> (e.g. object-top, hover scale) */
  imgClassName?: string;
}

/**
 * Professional avatar: shows the real photo when available, otherwise an elegant
 * brand-colored monogram — never a random stock face.
 */
export default function InitialsAvatar({
  src,
  name,
  className = '',
  textClassName = 'text-2xl',
  imgClassName = '',
}: InitialsAvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const photo = resolvePortrait(src);
  const showPhoto = !!photo && !failed;

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0B5D3B] via-emerald-700 to-teal-700 ${className}`}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover ${imgClassName}`}
        />
      ) : (
        <>
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.22),transparent_60%)] pointer-events-none" />
          <span
            role="img"
            aria-label={name}
            className={`relative font-black text-white select-none leading-none drop-shadow-sm ${textClassName}`}
          >
            {getInitial(name)}
          </span>
        </>
      )}
    </div>
  );
}
