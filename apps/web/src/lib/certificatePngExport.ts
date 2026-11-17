/**
 * Zero-dependency DOM-to-PNG exporter for certificate sheets.
 * Inlines computed styles and normalizes modern Tailwind v4 oklch() / lab() colors
 * into canvas-safe rgba/hex strings before rendering SVG <foreignObject> at 2x DPI.
 */

let colorCanvasCtx: CanvasRenderingContext2D | null = null;

function normalizeCssColor(rawValue: string): string {
  if (!rawValue || (!rawValue.includes('oklch') && !rawValue.includes('oklab') && !rawValue.includes('lab(') && !rawValue.includes('color-mix'))) {
    return rawValue;
  }
  try {
    if (!colorCanvasCtx && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      colorCanvasCtx = c.getContext('2d');
    }
    if (!colorCanvasCtx) return rawValue;
    colorCanvasCtx.fillStyle = '#000000';
    colorCanvasCtx.fillStyle = rawValue;
    return colorCanvasCtx.fillStyle;
  } catch {
    return rawValue;
  }
}

const STYLE_PROPS_TO_INLINE = [
  'box-sizing',
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'margin',
  'padding',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-radius',
  'background-color',
  'background-image',
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-indent',
  'text-decoration',
  'text-transform',
  'white-space',
  'word-break',
  'flex',
  'flex-direction',
  'flex-wrap',
  'align-items',
  'justify-content',
  'gap',
  'grid-template-columns',
  'opacity',
  'overflow',
  'object-fit',
  'z-index',
  'transform',
  'box-shadow',
];

function inlineElementStyles(src: Element, dst: Element) {
  if (src instanceof HTMLElement && dst instanceof HTMLElement) {
    const computed = window.getComputedStyle(src);
    for (const prop of STYLE_PROPS_TO_INLINE) {
      const val = computed.getPropertyValue(prop);
      if (val) {
        dst.style.setProperty(prop, normalizeCssColor(val));
      }
    }
    dst.removeAttribute('contenteditable');
  }
  const srcChildren = src.children;
  const dstChildren = dst.children;
  for (let i = 0; i < srcChildren.length; i++) {
    if (dstChildren[i]) {
      inlineElementStyles(srcChildren[i], dstChildren[i]);
    }
  }
}

async function resolveImagesToDataUrls(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src') || '';
      if (!src || src.startsWith('data:')) return;
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (dataUrl) img.setAttribute('src', dataUrl);
      } catch {
        // Keep original image URL if fetch fails
      }
    })
  );
}

/**
 * Capture target DOM node as a 2x HiDPI PNG file download.
 */
export async function exportElementToPng(
  element: HTMLElement,
  fileName: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const rect = element.getBoundingClientRect();
    const width = Math.max(Math.round(element.scrollWidth || rect.width), 700);
    const height = Math.max(Math.round(element.scrollHeight || rect.height), 500);

    const clone = element.cloneNode(true) as HTMLElement;
    inlineElementStyles(element, clone);
    await resolveImagesToDataUrls(clone);

    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.width = `${width}px`;
    clone.style.height = `${height}px`;
    clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

    const serializedHtml = new XMLSerializer().serializeToString(clone);
    const svgMarkup = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <foreignObject x="0" y="0" width="100%" height="100%">
          ${serializedHtml}
        </foreignObject>
      </svg>
    `.trim();

    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = (err) => reject(err);
        image.src = svgUrl;
      });

      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { ok: false, error: 'Canvas context unavailable' };

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);

      const pngUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
      link.href = pngUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { ok: true };
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'PNG export failed',
    };
  }
}
