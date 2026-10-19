import { jsPDF } from 'jspdf';

export interface PreparedPdfImage {
  dataUrl: string;
  width: number;
  height: number;
  format: 'PNG' | 'JPEG';
}

/**
 * Prepares an image for jsPDF embedding by loading it in the browser
 * and rasterizing it to a crisp PNG data URL via HTMLCanvasElement.
 * This guarantees compatibility with jsPDF whether the source is:
 * - base64 PNG / JPEG
 * - SVG file path or data URL
 * - Relative / absolute URL
 */
export async function getPdfImage(src?: string): Promise<PreparedPdfImage | null> {
  if (!src || !src.trim()) return null;

  const trimmed = src.trim();

  // If in a non-browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    if (trimmed.startsWith('data:image/png')) {
      return { dataUrl: trimmed, width: 400, height: 200, format: 'PNG' };
    }
    if (trimmed.startsWith('data:image/jpeg') || trimmed.startsWith('data:image/jpg')) {
      return { dataUrl: trimmed, width: 400, height: 200, format: 'JPEG' };
    }
    return null;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const naturalW = img.naturalWidth || img.width || 400;
          const naturalH = img.naturalHeight || img.height || 200;

          // Scale for optimal PDF clarity without excessive memory
          const maxDim = 800;
          let w = naturalW;
          let h = naturalH;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, w);
          canvas.height = Math.max(1, h);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            if (trimmed.startsWith('data:image/png')) {
              resolve({ dataUrl: trimmed, width: naturalW, height: naturalH, format: 'PNG' });
            } else if (trimmed.startsWith('data:image/jpeg')) {
              resolve({ dataUrl: trimmed, width: naturalW, height: naturalH, format: 'JPEG' });
            } else {
              resolve(null);
            }
            return;
          }

          ctx.drawImage(img, 0, 0, w, h);
          const pngDataUrl = canvas.toDataURL('image/png');
          resolve({
            dataUrl: pngDataUrl,
            width: naturalW,
            height: naturalH,
            format: 'PNG',
          });
        } catch (canvasErr) {
          console.warn('Canvas rasterization warning for PDF logo:', canvasErr);
          if (trimmed.startsWith('data:image/png')) {
            resolve({ dataUrl: trimmed, width: 400, height: 200, format: 'PNG' });
          } else if (trimmed.startsWith('data:image/jpeg')) {
            resolve({ dataUrl: trimmed, width: 400, height: 200, format: 'JPEG' });
          } else {
            resolve(null);
          }
        }
      };

      img.onerror = (err) => {
        console.warn('Failed to load image for PDF embedding:', err);
        if (trimmed.startsWith('data:image/png')) {
          resolve({ dataUrl: trimmed, width: 400, height: 200, format: 'PNG' });
        } else if (trimmed.startsWith('data:image/jpeg')) {
          resolve({ dataUrl: trimmed, width: 400, height: 200, format: 'JPEG' });
        } else {
          resolve(null);
        }
      };

      img.src = trimmed;
    } catch (e) {
      console.warn('Unexpected error preparing PDF logo:', e);
      resolve(null);
    }
  });
}

/**
 * Renders the business brand logo onto a jsPDF document, centered with
 * preserved aspect ratio, and returns the next Y coordinate.
 */
export async function renderPdfLogo(
  doc: jsPDF,
  logoSrc: string | undefined,
  pageWidth: number,
  startY: number,
  maxW = 38,
  maxH = 16
): Promise<number> {
  if (!logoSrc || !logoSrc.trim()) {
    return startY;
  }

  try {
    const prepared = await getPdfImage(logoSrc);
    if (!prepared) {
      return startY;
    }

    const aspect = prepared.width / (prepared.height || 1);
    let renderW = maxW;
    let renderH = renderW / aspect;

    if (renderH > maxH) {
      renderH = maxH;
      renderW = renderH * aspect;
    }

    const x = (pageWidth - renderW) / 2;
    doc.addImage(prepared.dataUrl, prepared.format, x, startY, renderW, renderH);

    // Return new Y coordinate after logo and a clean spacing margin
    return startY + renderH + 5;
  } catch (err) {
    console.warn('Error rendering logo in jsPDF:', err);
    return startY;
  }
}
