/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🖼️ IMAGE UTILS: CLIENT-SIDE AUTO-CROP & COMPRESSION FOR STUDENT PHOTOS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 1. Auto-Crops: Automatically crops photos to standard institutional passport
 *    dimensions (300x360 px, 5:6 aspect ratio).
 * 2. Smart Face/Upper-Body Centering: For human portraits, centers horizontally
 *    and biases 15% from the top so head, hair and shoulders are preserved
 *    without cutting off faces or showing excess body/background.
 * 3. Lightweight Resizing & Compression: Compresses multi-megabyte camera photos
 *    down to crisp ~15KB - 30KB JPEG images to avoid localStorage/cloud quota limits
 *    and make student lists, ID cards, and admission forms load instantly.
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  autoCrop?: boolean;
  cropBias?: 'top' | 'center';
}

export const compressImage = (
  fileOrDataUrl: File | string,
  maxWidth = 300,
  maxHeight = 360,
  quality = 0.85,
  autoCrop = false
): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
    }

    const processSrc = (src: string) => {
      if (!src) return resolve('');
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const origW = img.width;
        const origH = img.height;

        if (origW === 0 || origH === 0) {
          return resolve(src);
        }

        let canvasWidth = maxWidth;
        let canvasHeight = maxHeight;
        let cropX = 0;
        let cropY = 0;
        let cropW = origW;
        let cropH = origH;

        if (autoCrop) {
          // ─── 🌟 SMART AUTO-CROP FOR STUDENT PASSPORT PHOTOS ───
          const targetAspect = maxWidth / maxHeight;
          const origAspect = origW / origH;

          if (origAspect > targetAspect) {
            // Photo is wider than target (e.g. landscape or square)
            // Keep full height, crop sides symmetrically around center
            cropH = origH;
            cropW = Math.max(1, Math.round(cropH * targetAspect));
            cropX = Math.max(0, Math.round((origW - cropW) / 2));
            cropY = 0;
          } else if (origAspect < targetAspect) {
            // Photo is taller than target (e.g. phone portrait or full body)
            // Keep full width, crop vertically with smart face-headroom bias
            cropW = origW;
            cropH = Math.max(1, Math.round(cropW / targetAspect));
            const surplusY = Math.max(0, origH - cropH);
            // 15% headroom bias keeps hair and face in upper 1/3 of passport photo
            cropY = Math.min(surplusY, Math.round(surplusY * 0.15));
            cropX = 0;
          } else {
            // Already exact aspect ratio
            cropX = 0;
            cropY = 0;
            cropW = origW;
            cropH = origH;
          }

          canvasWidth = maxWidth;
          canvasHeight = maxHeight;
        } else {
          // Standard proportional downscale without cropping
          let w = origW;
          let h = origH;
          if (w > maxWidth || h > maxHeight) {
            const ratio = Math.min(maxWidth / w, maxHeight / h);
            w = Math.max(1, Math.round(w * ratio));
            h = Math.max(1, Math.round(h * ratio));
          }
          canvasWidth = w;
          canvasHeight = h;
          cropX = 0;
          cropY = 0;
          cropW = origW;
          cropH = origH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(src);
        }

        // Clean white background for transparent PNGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // High quality bicubic resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw cropped/scaled image onto destination canvas
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvasWidth, canvasHeight);

        try {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          resolve(src);
        }
      };

      img.onerror = () => {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      };

      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      processSrc(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result as string;
        if (res) {
          processSrc(res);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};

/**
 * 🌟 AUTO-CROP AND COMPRESS STUDENT PHOTO (300 x 360 px, Passport standard)
 * Automatically crops any photo to passport aspect ratio with smart face headroom,
 * resizes to 300x360 px, and compresses down to ~15KB-30KB.
 */
export const autoCropAndCompressStudentPhoto = (
  fileOrDataUrl: File | string,
  targetWidth = 300,
  targetHeight = 360,
  quality = 0.85
): Promise<string> => {
  return compressImage(fileOrDataUrl, targetWidth, targetHeight, quality, true);
};
