/**
 * Client-Side Photo & Multi-Page PDF Loader for OMR Batch Scanning
 *
 * Uses HTML5 Canvas for images and the project's pre-installed `pdfjs-dist`
 * (`/pdf.worker.min.mjs`) to render every page of a scanned PDF into an
 * `RgbaImageBuffer` for the pure-TypeScript OMR Computer Vision Engine.
 */

import type { RgbaImageBuffer } from './omrVisionEngine';

export interface LoadedOmrPage {
  label: string;
  pageNumber: number;
  buffer: RgbaImageBuffer;
}

/**
 * Reads an image File (.jpg, .png, .webp) into an RgbaImageBuffer.
 */
export async function loadImageFileToRgbaBuffer(
  file: File,
  maxDim: number = 1800,
): Promise<LoadedOmrPage> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`ছবিটি লোড করা যায়নি: ${file.name}`));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const width = Math.max(16, Math.round((img.naturalWidth || 800) * scale));
    const height = Math.max(16, Math.round((img.naturalHeight || 1100) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context তৈরি করা যায়নি।');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    return {
      label: file.name,
      pageNumber: 1,
      buffer: {
        data: imgData.data,
        width: imgData.width,
        height: imgData.height,
      },
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Renders every page of a PDF file into RgbaImageBuffer items sequentially,
 * reporting progress so the UI can show live batch scan status.
 */
export async function loadPdfPagesToRgbaBuffers(
  file: File,
  onPageReady?: (page: LoadedOmrPage, index: number, total: number) => void,
  renderScale: number = 2.0,
): Promise<LoadedOmrPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');

  if (typeof window !== 'undefined') {
    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      }
    } catch {
      // Continue with fallback worker resolution
    }
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  if (pdf.numPages < 1) {
    throw new Error('পিডিএফ ফাইলে কোনো পাতা পাওয়া যায়নি।');
  }

  const pages: LoadedOmrPage[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('PDF পাতার জন্য Canvas তৈরি করা যায়নি।');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page
      .render({
        canvasContext: ctx,
        viewport,
        canvas,
      } as Parameters<typeof page.render>[0])
      .promise;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const loaded: LoadedOmrPage = {
      label: `${file.name} (পাতা ${p})`,
      pageNumber: p,
      buffer: {
        data: imgData.data,
        width: imgData.width,
        height: imgData.height,
      },
    };
    pages.push(loaded);
    if (onPageReady) {
      onPageReady(loaded, p, pdf.numPages);
    }
  }

  return pages;
}
