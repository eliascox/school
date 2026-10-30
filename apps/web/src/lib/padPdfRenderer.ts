/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📜 PAD PDF RENDERER: CLIENT-SIDE PDF/IMAGE CONVERTER FOR SCHOOL LETTERHEAD PADS
 * ═══════════════════════════════════════════════════════════════════════════════
 * Converts user-uploaded PDF letterhead pads (Page 1) directly into high-res
 * rasterized image data URLs in the browser via pdfjs-dist.
 * Ensures 100% crisp, fail-safe background rendering across all browsers and
 * physical A4 printouts without reliance on browser PDF object plugins.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface ProcessedPadResult {
  dataUrl: string;
  padType: 'pdf' | 'image';
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
  error?: string;
}

export async function processPadUpload(file: File): Promise<ProcessedPadResult> {
  // 🛡️ SECURITY CHECK 1: File size limit (max 8MB) to prevent memory & storage exhaustion
  const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      dataUrl: '',
      padType: 'image',
      fileName: file.name,
      fileSize: file.size,
      error: 'নিরাপত্তা সতর্কতা: প্যাড ফাইলের আকার সর্বোচ্চ ৮MB হতে পারবে।',
    };
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (!isPdf) {
    // 🛡️ SECURITY CHECK 2: Restrict image types (no SVGs, no executables)
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const safeExtensions = ['png', 'jpg', 'jpeg', 'webp'];
    if (!safeExtensions.includes(ext) || file.type.includes('svg')) {
      return {
        dataUrl: '',
        padType: 'image',
        fileName: file.name,
        fileSize: file.size,
        error: 'নিরাপত্তা সতর্কতা: শুধুমাত্র বৈধ PDF, PNG, JPG বা WebP ফাইল গ্রহণযোগ্য।',
      };
    }

    // ─── PROCESS IMAGE (PNG / JPG / WEBP) ──────────────────────────────────
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawUrl = reader.result as string;
        if (typeof window === 'undefined') {
          return resolve({
            dataUrl: rawUrl,
            padType: 'image',
            fileName: file.name,
            fileSize: file.size,
          });
        }

        // Optimize and verify dimensions
        const img = new Image();
        img.onload = () => {
          let targetWidth = img.width;
          let targetHeight = img.height;

          // Max bounds to stay within localStorage limits while maintaining high DPI
          const MAX_WIDTH = 1600;
          if (targetWidth > MAX_WIDTH) {
            const ratio = MAX_WIDTH / targetWidth;
            targetWidth = MAX_WIDTH;
            targetHeight = Math.round(targetHeight * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            return resolve({
              dataUrl: rawUrl,
              padType: 'image',
              fileName: file.name,
              fileSize: file.size,
              width: img.width,
              height: img.height,
            });
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          try {
            const optimized = canvas.toDataURL('image/jpeg', 0.92);
            resolve({
              dataUrl: optimized,
              padType: 'image',
              fileName: file.name,
              fileSize: file.size,
              width: targetWidth,
              height: targetHeight,
            });
          } catch {
            resolve({
              dataUrl: rawUrl,
              padType: 'image',
              fileName: file.name,
              fileSize: file.size,
              width: img.width,
              height: img.height,
            });
          }
        };

        img.onerror = () => {
          // 🛡️ SECURITY FIX: Never return raw unverified dataUrl on image load failure!
          resolve({
            dataUrl: '',
            padType: 'image',
            fileName: file.name,
            fileSize: file.size,
            error: 'নিরাপত্তা সতর্কতা: ফাইলটি বৈধ ইমেজ নয় বা ক্ষতিগ্রস্ত। এটি কোনো ক্ষতিকর স্ক্রিপ্ট বা ফাইল হতে পারে।',
          });
        };

        img.src = rawUrl;
      };

      reader.onerror = () => {
        resolve({
          dataUrl: '',
          padType: 'image',
          fileName: file.name,
          fileSize: file.size,
          error: 'ছবিটি পড়তে সমস্যা হয়েছে। অনুগ্রহ করে অন্য ছবি নির্বাচন করুন।',
        });
      };

      reader.readAsDataURL(file);
    });
  }

  // ─── PROCESS PDF VIA PDFJS-DIST ──────────────────────────────────────────
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Client-side dynamic import of pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');

    // Configure worker
    if (typeof window !== 'undefined') {
      try {
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }
      } catch (e) {
        console.warn('Could not set pdf workerSrc, continuing...', e);
      }
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    if (pdf.numPages < 1) {
      throw new Error('পিডিএফ ফাইলে কোনো পাতা খুঁজে পাওয়া যায়নি।');
    }

    // Render Page 1
    const page = await pdf.getPage(1);

    // Standard A4 is 595.28 x 841.89 points
    // Scale 2.0 generates ~1190 x 1684 px, perfect sharp A4 print without bloat
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas render context তৈরি করা যায়নি।');
    }

    // White base in case PDF has transparent elements
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext: any = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    };

    await page.render(renderContext).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    return {
      dataUrl,
      padType: 'pdf',
      fileName: file.name,
      fileSize: file.size,
      width: viewport.width,
      height: viewport.height,
    };
  } catch (err: any) {
    console.error('PDF conversion error:', err);
    return {
      dataUrl: '',
      padType: 'pdf',
      fileName: file.name,
      fileSize: file.size,
      error:
        err?.message ||
        'পিডিএফটি কনভার্ট করতে ব্যর্থ হয়েছে। অনুগ্রহ করে নিশ্চিত করুন যে এটি একটি বৈধ ও আনলক করা পিডিএফ।',
    };
  }
}
