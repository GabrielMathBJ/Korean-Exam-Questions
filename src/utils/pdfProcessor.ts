import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker using official CDN matching installed version
if (typeof window !== 'undefined' && 'GlobalWorkerOptions' in pdfjsLib) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('Failed to set pdfjs worker from CDN', err);
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
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
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
    
    // 1. Extract text content
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

    // 2. Render to canvas for visual preview and high-res image OCR
    let imageBase64 = '';
    let viewportWidth = 800;
    let viewportHeight = 1100;

    try {
      // Scale 1.5 gives clear readability for OCR while keeping payload moderate
      const viewport = page.getViewport({ scale: 1.5 });
      viewportWidth = viewport.width;
      viewportHeight = viewport.height;

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const context = canvas.getContext('2d', { willReadFrequently: true });

      if (context) {
        // Fill white background before rendering
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Note: pdfjs v4/v6 RenderParameters includes canvas & canvasContext
        const renderContext = {
          canvasContext: context,
          viewport,
          canvas,
        };
        await page.render(renderContext).promise;
        imageBase64 = canvas.toDataURL('image/jpeg', 0.85);
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
