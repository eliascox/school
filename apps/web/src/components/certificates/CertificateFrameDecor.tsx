'use client';

import React from 'react';
import {
  BorderPresetMeta,
  CertificateColorTheme,
} from './certificateThemes';

interface CertificateFrameDecorProps {
  preset: BorderPresetMeta;
  theme: CertificateColorTheme;
  customBorderUrl?: string;
  showCornerBands?: boolean;
  watermarkUrl?: string;
  showWatermark?: boolean;
  watermarkOpacity?: number;
}

/**
 * Renders decorative frames, SVG filigree corners, corner ribbon bands, and institutional watermark
 * using explicit hex colors so print and PNG export stay deterministic.
 */
export default function CertificateFrameDecor({
  preset,
  theme,
  customBorderUrl,
  showCornerBands = true,
  watermarkUrl,
  showWatermark = true,
  watermarkOpacity = 0.055,
}: CertificateFrameDecorProps) {
  const showOrnamental =
    preset.id !== 'no_border_pad' && preset.id !== 'custom_png';

  return (
    <>
      {/* 1. Corner Accent Bands */}
      {showCornerBands && (
        <>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '88px',
              height: '88px',
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary} 48%, transparent 50%)`,
              pointerEvents: 'none',
              zIndex: 4,
              opacity: 0.9,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '104px',
              height: '104px',
              background: `linear-gradient(135deg, transparent 49%, ${theme.secondary} 50%, ${theme.secondary} 54%, transparent 56%)`,
              pointerEvents: 'none',
              zIndex: 4,
              opacity: 0.85,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '88px',
              height: '88px',
              background: `linear-gradient(315deg, ${theme.primary} 0%, ${theme.primary} 48%, transparent 50%)`,
              pointerEvents: 'none',
              zIndex: 4,
              opacity: 0.9,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '104px',
              height: '104px',
              background: `linear-gradient(315deg, transparent 49%, ${theme.secondary} 50%, ${theme.secondary} 54%, transparent 56%)`,
              pointerEvents: 'none',
              zIndex: 4,
              opacity: 0.85,
            }}
          />
        </>
      )}

      {/* 2. Institutional Logo Watermark */}
      {showWatermark && watermarkUrl && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <img
            src={watermarkUrl}
            alt=""
            style={{
              width: '240px',
              height: '240px',
              objectFit: 'contain',
              opacity: watermarkOpacity,
              filter: 'grayscale(100%) contrast(1.1)',
            }}
          />
        </div>
      )}

      {/* 3. Custom Uploaded PNG Frame Overlay */}
      {preset.id === 'custom_png' && customBorderUrl && (
        <img
          src={customBorderUrl}
          alt="Custom Border"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            pointerEvents: 'none',
            zIndex: 12,
          }}
        />
      )}

      {/* 4. Built-in Ornamental CSS + SVG Corner Borders */}
      {showOrnamental && (
        <>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: '10px',
              borderWidth: `${preset.outerWidth}px`,
              borderStyle: preset.outerStyle,
              borderColor: theme.primary,
              pointerEvents: 'none',
              zIndex: 8,
            }}
          />
          {preset.innerWidth > 0 && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '19px',
                borderWidth: `${preset.innerWidth}px`,
                borderStyle: preset.innerStyle,
                borderColor: theme.secondary,
                pointerEvents: 'none',
                zIndex: 8,
              }}
            />
          )}

          {preset.cornerOrnament !== 'none' && (
            <>
              {[
                { top: '12px', left: '12px', rot: '0deg' },
                { top: '12px', right: '12px', rot: '90deg' },
                { bottom: '12px', right: '12px', rot: '180deg' },
                { bottom: '12px', left: '12px', rot: '270deg' },
              ].map((pos, idx) => (
                <svg
                  key={idx}
                  viewBox="0 0 40 40"
                  width="32"
                  height="32"
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    ...pos,
                    transform: `rotate(${pos.rot})`,
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  {preset.cornerOrnament === 'crest' && (
                    <path
                      d="M2,2 L26,2 M2,2 L2,26 M6,6 L18,6 L14,10 L10,14 L6,18 Z"
                      fill="none"
                      stroke={theme.secondary}
                      strokeWidth="2.2"
                    />
                  )}
                  {preset.cornerOrnament === 'diamond' && (
                    <polygon
                      points="8,2 14,8 8,14 2,8"
                      fill={theme.secondary}
                      stroke={theme.primary}
                      strokeWidth="1.2"
                    />
                  )}
                  {preset.cornerOrnament === 'bracket' && (
                    <path
                      d="M2,18 L2,2 L18,2 M7,14 L7,7 L14,7"
                      fill="none"
                      stroke={theme.primary}
                      strokeWidth="2"
                    />
                  )}
                  {preset.cornerOrnament === 'floral' && (
                    <path
                      d="M2,2 C14,2 22,10 22,22 C10,22 2,14 2,2 Z M7,7 L16,16"
                      fill="none"
                      stroke={theme.secondary}
                      strokeWidth="1.8"
                    />
                  )}
                </svg>
              ))}
            </>
          )}
        </>
      )}
    </>
  );
}
