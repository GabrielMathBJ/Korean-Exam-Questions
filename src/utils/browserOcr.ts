import { createWorker } from 'tesseract.js';

/**
 * Client-side browser OCR using Tesseract.js (Korean + English)
 * Used as a zero-failure fallback if the AI backend API is unreachable or rate-limited.
 */
export async function performBrowserOcr(
  imageBase64: string,
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  try {
    if (onProgress) onProgress(10, '로컬 OCR 엔진 초기화 중...');

    const worker = await createWorker('kor+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.min(95, Math.round(15 + m.progress * 80));
          onProgress(pct, `로컬 텍스트 인식 중 (${Math.round(m.progress * 100)}%)...`);
        }
      },
    });

    if (onProgress) onProgress(30, '지문 텍스트 분석 중...');

    const ret = await worker.recognize(imageBase64);
    await worker.terminate();

    const rawText = ret.data.text || '';
    
    // Post-process OCR text: clean up extra spaces and normalize Korean quotes/symbols
    const cleanedText = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n\n');

    if (onProgress) onProgress(100, '완료');
    return cleanedText;
  } catch (err) {
    console.warn('Browser OCR failed:', err);
    return '';
  }
}
