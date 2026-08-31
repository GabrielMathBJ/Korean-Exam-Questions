import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker using ESM URL
if (typeof window !== 'undefined') {
  try {
    const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  } catch (err) {
    console.warn('Failed to set local pdfjs worker URL, using CDN fallback:', err);
    try {
      const version = pdfjsLib.version || '6.2.108';
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    } catch {}
  }
}

export interface PdfPageResult {
  pageNumber: number;
  text: string;
  imageBase64: string; // JPEG data URL
  previewUrl: string;
  width: number;
  height: number;
}

export interface ProcessedPdf {
  fileName: string;
  totalPages: number;
  fullExtractedText: string;
  hasTextLayer: boolean;
  pages: PdfPageResult[];
}

/**
 * Parses a PDF file: extracts text content and renders each page to JPEG image for preview and OCR.
 */
export async function processPdfFile(
  file: File,
  onProgress?: (current: number, total: number, status: string) => void
): Promise<ProcessedPdf> {
  const arrayBuffer = await file.arrayBuffer();
  const v = pdfjsLib.version || '6.2.108';
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${v}/cmaps/`,
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages: PdfPageResult[] = [];
  const textChunks: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, totalPages, `PDF ${pageNum}/${totalPages} 페이지 분석 및 렌더링 중...`);
    }

    const page = await pdf.getPage(pageNum);
    
    // 1. Extract digital text content if embedded
    let pageText = '';
    try {
      const textContent = await page.getTextContent();
      const strings = textContent.items
        .map((item: any) => (item.str ? item.str : ''))
        .filter((s: string) => s.trim().length > 0);
      pageText = strings.join(' ').trim();
    } catch (err) {
      console.warn(`Failed to extract text from page ${pageNum}`, err);
    }

    if (pageText) {
      textChunks.push(pageText);
    }

    // 2. Render to canvas for visual preview and high-clarity OCR
    let imageBase64 = '';
    let viewportWidth = 800;
    let viewportHeight = 1100;

    try {
      // Calculate scale to limit max dimension to 1400px for optimal speed and payload size
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const maxDim = Math.max(unscaledViewport.width, unscaledViewport.height);
      const targetScale = maxDim > 0 ? Math.min(1.5, 1400 / maxDim) : 1.2;
      
      const viewport = page.getViewport({ scale: targetScale });
      viewportWidth = Math.round(viewport.width);
      viewportHeight = Math.round(viewport.height);

      const canvas = document.createElement('canvas');
      canvas.width = viewportWidth;
      canvas.height = viewportHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });

      if (context) {
        // Fill clean white background before rendering
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: context,
          viewport,
        };
        await (page.render(renderContext as any).promise);
        // Export as lightweight compressed JPEG (quality 0.80)
        imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch (renderErr) {
      console.warn(`Failed to render canvas for page ${pageNum}`, renderErr);
    }

    pages.push({
      pageNumber: pageNum,
      text: pageText,
      imageBase64,
      previewUrl: imageBase64,
      width: viewportWidth,
      height: viewportHeight,
    });
  }

  const fullExtractedText = textChunks.join('\n\n');
  const hasTextLayer = fullExtractedText.trim().length > 50;

  return {
    fileName: file.name,
    totalPages,
    fullExtractedText,
    hasTextLayer,
    pages,
  };
}
