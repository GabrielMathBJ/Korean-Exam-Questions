/**
 * Utility for resizing and compressing images before sending them to OCR / Gemini API.
 * Reduces payload from tens of megabytes down to a few hundred kilobytes,
 * preventing network timeouts, proxy payload limits (413), and JSON parse errors.
 */
export async function optimizeImageBase64(
  dataUrl: string,
  maxWidth = 1600,
  maxHeight = 2200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    // If not a data url or too short, return as is
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return resolve(dataUrl);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Check if resizing is needed
      if (width > maxWidth || height > maxHeight) {
        if (width / maxWidth > height / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(dataUrl);
      }

      // White background for JPEG conversion
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const optimized = canvas.toDataURL('image/jpeg', quality);
        resolve(optimized);
      } catch (err) {
        console.warn('Image optimization canvas export failed, fallback to original', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      console.warn('Failed to load image for optimization, fallback to original');
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Robust fetch helper that guards against HTML error pages (e.g., 413, 502, 504)
 * and provides clear error messages instead of JSON parse failures.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const rawText = await response.text();
      let errorSummary = '서버에서 예상치 못한 응답을 반환했습니다.';
      
      if (response.status === 413) {
        errorSummary = '업로드된 파일 용량이 너무 큽니다. 파일 크기를 줄이거나 페이지 수를 줄여주세요.';
      } else if (response.status === 504 || response.status === 502) {
        errorSummary = 'AI 처리 시간이 초과되었습니다. 지문 분량을 줄이거나 다시 시도해 주세요.';
      } else if (rawText) {
        // Strip HTML tags if any
        const cleanText = rawText.replace(/<[^>]*>?/gm, '').trim().slice(0, 150);
        if (cleanText) {
          errorSummary = `서버 오류 (${response.status}): ${cleanText}`;
        }
      }

      return {
        success: false,
        error: errorSummary,
      };
    }

    const json = await response.json();
    return json;
  } catch (err: any) {
    console.error('Fetch error:', err);
    return {
      success: false,
      error: err.message || '네트워크 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }
}
