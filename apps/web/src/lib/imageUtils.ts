/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🖼️ IMAGE UTILS: CLIENT-SIDE COMPRESSION & RESIZING FOR STUDENT PHOTOS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Resizes large camera/gallery photos down to crisp, lightweight passport dimensions.
 * Compresses megabyte-heavy images to ~15KB-35KB, preventing localStorage quota limits
 * and ensuring instant rendering across admission forms, ID cards, and student lists.
 */

export const compressImage = (
  fileOrDataUrl: File | string,
  maxWidth = 360,
  maxHeight = 450,
  quality = 0.82
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
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(src);
        }

        // Fill with white background (useful for transparent PNGs)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

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
