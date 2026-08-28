import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  BookOpen,
  Trash2,
  Check,
  RefreshCw,
  Eye,
  X,
  FileCheck,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ZoomIn,
} from 'lucide-react';
import { SAMPLE_PASSAGES } from '../data/samplePassages';
import { SamplePassage } from '../types';
import { processPdfFile, ProcessedPdf } from '../utils/pdfProcessor';
import { optimizeImageBase64, safeFetchJson } from '../utils/imageOptimizer';
import { performBrowserOcr } from '../utils/browserOcr';

interface PassageUploaderProps {
  passageText: string;
  setPassageText: (text: string) => void;
  passageCategory: string;
  setPassageCategory: (cat: string) => void;
  passageSubcategory: string;
  setPassageSubcategory: (subcat: string) => void;
  passageTitle: string;
  setPassageTitle: (title: string) => void;
  uploadedImages: Array<{ mimeType: string; base64: string; previewUrl: string; name: string }>;
  setUploadedImages: React.Dispatch<
    React.SetStateAction<Array<{ mimeType: string; base64: string; previewUrl: string; name: string }>>
  >;
  onApplySample: (sample: SamplePassage) => void;
  onOpenApiKeyModal?: () => void;
  hasCustomApiKey?: boolean;
}

export const PassageUploader: React.FC<PassageUploaderProps> = ({
  passageText,
  setPassageText,
  passageCategory,
  setPassageCategory,
  passageSubcategory,
  setPassageSubcategory,
  passageTitle,
  setPassageTitle,
  uploadedImages,
  setUploadedImages,
  onApplySample,
  onOpenApiKeyModal,
  hasCustomApiKey,
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'text' | 'file' | 'sample'>('text');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number; status: string } | null>(null);
  const [lastProcessedPdf, setLastProcessedPdf] = useState<ProcessedPdf | null>(null);
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);
  const [ocrStatusMessage, setOcrStatusMessage] = useState<string>('');
  const [extractError, setExtractError] = useState<string | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop & selection (PDF and Images)
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setExtractError(null);

    const newUploadedItems: Array<{ mimeType: string; base64: string; previewUrl: string; name: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');

      if (!isPdf && !isImage) {
        alert(`${file.name}은(는) 지원되지 않는 형식입니다. PDF 문서 또는 이미지(PNG/JPG) 파일을 업로드해 주세요.`);
        continue;
      }

      if (isPdf) {
        setIsProcessingPdf(true);
        setPdfProgress({ current: 0, total: 1, status: `${file.name} 로드 중...` });

        try {
          const pdfResult = await processPdfFile(file, (curr, total, status) => {
            setPdfProgress({ current: curr, total, status });
          });

          setLastProcessedPdf(pdfResult);

          // Convert each rendered page to high-quality image items
          for (const page of pdfResult.pages) {
            newUploadedItems.push({
              name: `${file.name} (p.${page.pageNumber})`,
              mimeType: 'image/jpeg',
              base64: page.imageBase64,
              previewUrl: page.previewUrl,
            });
          }

          // If the PDF had rich embedded text and the current passage is empty or default, auto-fill it
          if (pdfResult.hasTextLayer && pdfResult.fullExtractedText) {
            if (!passageText || passageText.length < 50) {
              setPassageText(pdfResult.fullExtractedText);
            }
            if (!passageTitle || passageTitle === '헤겔의 미학과 절대정신' || passageTitle === '수능 국어 지문') {
              const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
              setPassageTitle(cleanTitle);
            }
          }
        } catch (pdfErr: any) {
          console.error('PDF parsing error:', pdfErr);
          setExtractError(`PDF 파일 처리 중 오류가 발생했습니다: ${pdfErr.message || '문서를 읽을 수 없습니다.'}`);
        } finally {
          setIsProcessingPdf(false);
          setPdfProgress(null);
        }
      } else {
        // Normal image file with auto-optimization to prevent payload blowup
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);

        try {
          const rawBase64 = await base64Promise;
          // Downscale and compress image for fast OCR
          const optimizedBase64 = await optimizeImageBase64(rawBase64, 1600, 2200, 0.82);
          
          newUploadedItems.push({
            name: file.name,
            mimeType: 'image/jpeg',
            base64: optimizedBase64,
            previewUrl: optimizedBase64,
          });
        } catch (imgErr) {
          console.error('Image load error:', imgErr);
        }
      }
    }

    if (newUploadedItems.length > 0) {
      setUploadedImages((prev) => [...prev, ...newUploadedItems]);
      setActiveInputMode('file');
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // OCR Passage extraction via Gemini AI with Browser OCR Failover
  const handleExtractTextWithOCR = async () => {
    if (uploadedImages.length === 0) {
      alert('추출할 이미지 또는 PDF 파일을 먼저 업로드해 주세요.');
      return;
    }

    setIsExtractingOcr(true);
    setExtractError(null);
    setOcrStatusMessage('AI 모델로 지문 텍스트 분석 중...');

    try {
      // Send max 6 pages per OCR batch to prevent body-size overflow and timeouts
      const targetImages = uploadedImages.slice(0, 6);
      
      const payload = {
        images: targetImages.map((img) => ({ mimeType: img.mimeType, base64: img.base64 })),
        textHint: [
          passageTitle || (lastProcessedPdf ? lastProcessedPdf.fileName : ''),
          lastProcessedPdf?.hasTextLayer ? lastProcessedPdf.fullExtractedText.slice(0, 1000) : '',
        ].filter(Boolean).join(' | '),
      };

      const result = await safeFetchJson<{
        title?: string;
        category?: string;
        subcategory?: string;
        extractedText?: string;
      }>('/api/gemini/extract-passage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (result.success && result.data && result.data.extractedText && result.data.extractedText.trim().length > 10) {
        if (result.data.title && (!passageTitle || passageTitle === '헤겔의 미학과 절대정신' || passageTitle === '수능 국어 지문')) {
          setPassageTitle(result.data.title);
        }
        if (result.data.category) setPassageCategory(result.data.category);
        if (result.data.subcategory) setPassageSubcategory(result.data.subcategory);
        setPassageText(result.data.extractedText);
        setActiveInputMode('text');
        return;
      }

      // Step 2 Fallback: Check if PDF text layer exists
      if (lastProcessedPdf?.hasTextLayer && lastProcessedPdf.fullExtractedText.trim().length > 30) {
        setPassageText(lastProcessedPdf.fullExtractedText);
        if (!passageTitle || passageTitle === '헤겔의 미학과 절대정신' || passageTitle === '수능 국어 지문') {
          setPassageTitle(lastProcessedPdf.fileName.replace(/\.pdf$/i, ''));
        }
        setActiveInputMode('text');
        return;
      }

      // Step 3 Fallback: Run high-accuracy in-browser OCR directly on the images
      setOcrStatusMessage('로컬 브라우저 OCR 엔진으로 텍스트 정밀 추출 중...');
      const ocrResults: string[] = [];

      for (let i = 0; i < targetImages.length; i++) {
        setOcrStatusMessage(`로컬 OCR 분석 중 (${i + 1}/${targetImages.length} 페이지)...`);
        const text = await performBrowserOcr(targetImages[i].base64);
        if (text && text.trim().length > 0) {
          ocrResults.push(text.trim());
        }
      }

      const combinedText = ocrResults.join('\n\n');
      if (combinedText.length > 20) {
        setPassageText(combinedText);
        if (!passageTitle || passageTitle === '헤겔의 미학과 절대정신' || passageTitle === '수능 국어 지문') {
          const defaultName = targetImages[0]?.name?.replace(/\.[^/.]+$/, '') || '추출된 국어 지문';
          setPassageTitle(defaultName);
        }
        setActiveInputMode('text');
      } else {
        setExtractError(result.error || '이미지에서 텍스트를 추출하지 못했습니다. 상단 [API 키 설정]에서 개인 API 키를 등록하거나 지문을 직접 입력해 주세요.');
      }
    } catch (err: any) {
      console.warn('OCR error, attempting direct browser OCR:', err);
      try {
        const targetImages = uploadedImages.slice(0, 4);
        setOcrStatusMessage('로컬 브라우저 OCR 엔진으로 전환하여 추출 중...');
        const ocrResults: string[] = [];
        for (const img of targetImages) {
          const t = await performBrowserOcr(img.base64);
          if (t) ocrResults.push(t);
        }
        const text = ocrResults.join('\n\n');
        if (text.length > 20) {
          setPassageText(text);
          setActiveInputMode('text');
        } else {
          setExtractError(err.message || '텍스트 추출 중 오류가 발생했습니다.');
        }
      } catch (browserErr: any) {
        setExtractError(browserErr.message || '네트워크 오류가 발생했습니다.');
      }
    } finally {
      setIsExtractingOcr(false);
      setOcrStatusMessage('');
    }
  };

  // Insert formatting symbol at cursor
  const insertSymbol = (sym: string) => {
    setPassageText(passageText + (passageText ? ' ' : '') + sym);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header tabs */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            1. 평가 대상 지문 입력 (Passage Input)
          </h2>
        </div>

        {/* Input Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-lg text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveInputMode('text')}
            className={`px-3 sm:px-4 py-2 rounded-md transition-all ${
              activeInputMode === 'text'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            직접 입력 / 편집
          </button>
          <button
            type="button"
            onClick={() => setActiveInputMode('file')}
            className={`px-3 sm:px-4 py-2 rounded-md transition-all flex items-center gap-1.5 ${
              activeInputMode === 'file'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            PDF / 이미지
            {uploadedImages.length > 0 && (
              <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                {uploadedImages.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveInputMode('sample')}
            className={`px-3 sm:px-4 py-2 rounded-md transition-all flex items-center gap-1.5 ${
              activeInputMode === 'sample'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-500" />
            평가원 기출 샘플
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Basic metadata row: Title and Genre Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              지문 제목 / 주제명
            </label>
            <input
              type="text"
              value={passageTitle}
              onChange={(e) => setPassageTitle(e.target.value)}
              placeholder="예: 지문의 제목 또는 핵심 제재 입력 (예: 변증법과 미학 체계, 국제 통화 금융 메커니즘 등)"
              className="w-full text-base px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              지문 영역 분류
            </label>
            <select
              value={`${passageCategory}|${passageSubcategory}`}
              onChange={(e) => {
                const [cat, subcat] = e.target.value.split('|');
                setPassageCategory(cat);
                setPassageSubcategory(subcat);
              }}
              className="w-full text-base px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <optgroup label="독서 (비문학)">
                <option value="독서|인문·철학">독서 - 인문·철학</option>
                <option value="독서|사회·경제">독서 - 사회·경제</option>
                <option value="독서|사회·법률">독서 - 사회·법률</option>
                <option value="독서|과학">독서 - 과학</option>
                <option value="독서|기술">독서 - 기술</option>
                <option value="독서|예술">독서 - 예술</option>
                <option value="독서|주제통합·융합">독서 - 주제통합/융합</option>
              </optgroup>
              <optgroup label="문학">
                <option value="문학|현대시">문학 - 현대시</option>
                <option value="문학|고전시가">문학 - 고전시가</option>
                <option value="문학|현대소설">문학 - 현대소설</option>
                <option value="문학|고전소설">문학 - 고전소설</option>
                <option value="문학|극·수필">문학 - 극·수필</option>
                <option value="문학|갈래복합">문학 - 갈래복합</option>
              </optgroup>
              <optgroup label="선택과목">
                <option value="화법과 작문|화법">화법과 작문 - 화법</option>
                <option value="화법과 작문|작문">화법과 작문 - 작문</option>
                <option value="언어와 매체|언어(문법)">언어와 매체 - 언어(문법)</option>
                <option value="언어와 매체|매체">언어와 매체 - 매체</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* View 1: Text Editor */}
        {activeInputMode === 'text' && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800">기호 빠른 삽입:</span>
              <div className="flex flex-wrap gap-1.5">
                {['(가)', '(나)', '(다)', '[A]', '[B]', '㉠', '㉡', '㉢', '㉣', '㉤', 'ⓐ', 'ⓑ', 'ⓒ', 'ⓓ', 'ⓔ'].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => insertSymbol(sym)}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-300 rounded-md text-sm font-medium transition cursor-pointer"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={12}
              value={passageText}
              onChange={(e) => setPassageText(e.target.value)}
              placeholder="국어영역 평가 지문 내용을 여기에 붙여넣거나 직접 작성하세요.&#10;&#10;예:&#10;(가) 정립-반정립-종합. 변증법의 논리적 구조를 일컫는 말이다...&#10;&#10;(나) 그러나 헤겔의 체계는 예술의 독자적 가치를..."
              className="w-full text-base sm:text-lg leading-relaxed p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans text-slate-900 bg-white shadow-inner placeholder:text-slate-400"
            />

            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 px-1">
              <span>
                글자 수: <strong className="text-slate-900 text-sm sm:text-base">{passageText.length.toLocaleString()}</strong>자 | 공백 제외 약 {passageText.replace(/\s+/g, '').length.toLocaleString()}자
              </span>
              {passageText.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPassageText('')}
                  className="text-red-600 hover:text-red-800 font-bold cursor-pointer"
                >
                  지문 비우기
                </button>
              )}
            </div>
          </div>
        )}

        {/* View 2: File Upload (PDF / Image) */}
        {activeInputMode === 'file' && (
          <div className="space-y-4">
            {/* Upload Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-slate-900">
                  클릭하여 PDF 기출 문서 또는 지문 이미지를 첨부하세요
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  드래그 앤 드롭 지원 · PDF 자동 텍스트 추출 및 페이지별 고해상도 렌더링 지원
                </p>
              </div>
            </div>

            {/* PDF Processing Indicator */}
            {isProcessingPdf && pdfProgress && (
              <div className="p-4 sm:p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-sm font-bold text-blue-900">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                    <span>{pdfProgress.status}</span>
                  </div>
                  <span>
                    {pdfProgress.current} / {pdfProgress.total} 페이지
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 transition-all duration-300"
                    style={{
                      width: `${Math.round((pdfProgress.current / Math.max(1, pdfProgress.total)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Text Layer Detected Card */}
            {lastProcessedPdf && lastProcessedPdf.hasTextLayer && (
              <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-emerald-950">
                      PDF 내 디지털 지문 텍스트 감지 완료 ({lastProcessedPdf.fullExtractedText.length.toLocaleString()}자, {lastProcessedPdf.totalPages}페이지)
                    </h4>
                    <p className="text-xs sm:text-sm text-emerald-800">
                      PDF 원본 텍스트가 지문 편집기에 자동으로 연동되었습니다. 필요 시 추가 수정할 수 있습니다.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPassageText(lastProcessedPdf.fullExtractedText);
                    setActiveInputMode('text');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>지문 편집기로 이동</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Uploaded Files list & OCR extraction */}
            {uploadedImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    첨부된 지문 페이지 / 이미지 ({uploadedImages.length}장)
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleExtractTextWithOCR}
                      disabled={isExtractingOcr}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {isExtractingOcr ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{ocrStatusMessage || 'AI 지문 텍스트 추출 중...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-indigo-200" />
                          <span>AI 정밀 OCR 텍스트 추출</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImages([]);
                        setLastProcessedPdf(null);
                      }}
                      className="px-3 py-2 text-sm text-slate-500 hover:text-red-600 font-medium cursor-pointer"
                    >
                      전체 삭제
                    </button>
                  </div>
                </div>

                {isExtractingOcr && (
                  <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-900 flex items-center gap-2 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                    <span>{ocrStatusMessage || '이미지 분석 및 한국어 수능 지문 텍스트를 디지털 변환 중입니다...'}</span>
                  </div>
                )}

                {extractError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                      <span>{extractError}</span>
                    </div>
                    {onOpenApiKeyModal && (
                      <button
                        type="button"
                        onClick={onOpenApiKeyModal}
                        className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition shadow-2xs cursor-pointer"
                      >
                        🔑 개인 API 키 입력하기
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group bg-slate-100 border border-slate-200 hover:border-blue-400 rounded-lg overflow-hidden p-1.5 flex flex-col items-center transition shadow-2xs"
                    >
                      <div
                        className="w-full h-32 bg-white rounded overflow-hidden cursor-pointer relative"
                        onClick={() => setPreviewModalImg({ url: img.previewUrl || img.base64, title: img.name })}
                      >
                        <img
                          src={img.previewUrl || img.base64}
                          alt={img.name}
                          className="w-full h-full object-contain hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <ZoomIn className="w-5 h-5" />
                        </div>
                      </div>

                      <p className="text-xs font-medium text-slate-800 truncate w-full mt-1.5 text-center px-1">
                        {img.name}
                      </p>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow"
                        title="페이지 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* View 3: Sample Passages */}
        {activeInputMode === 'sample' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              한국교육과정평가원 수능 및 모의평가 대표 기출 명지문을 선택하여 즉시 문제를 생성해 보세요.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {SAMPLE_PASSAGES.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => {
                    onApplySample(sample);
                    setActiveInputMode('text');
                  }}
                  className="border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl p-4 cursor-pointer transition space-y-2.5 group bg-white shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md group-hover:bg-blue-100 group-hover:text-blue-700 transition">
                      {sample.category} · {sample.subcategory}
                    </span>
                    <span className="text-xs text-slate-400">
                      {sample.source.replace('한국교육과정평가원 ', '')}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition">
                    {sample.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {sample.text.replace(/\n+/g, ' ')}
                  </p>
                  <div className="pt-1 flex items-center justify-between text-xs sm:text-sm text-blue-600 font-bold">
                    <span>추천 문항 세트 ({sample.recommendedQuestionConfigs.length}문항)</span>
                    <span className="group-hover:translate-x-1 transition-transform">불러오기 →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image / Page Zoom Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 truncate">
                {previewModalImg.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100 flex-1">
              <img
                src={previewModalImg.url}
                alt={previewModalImg.title}
                className="max-h-[75vh] object-contain shadow-md rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
