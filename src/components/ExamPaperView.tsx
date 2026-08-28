import React, { useState } from 'react';
import { Printer, Copy, Check, Download, FileText, Share2, Play, Award, Sparkles, BookOpen, Image as ImageIcon, Loader2 } from 'lucide-react';
import { GeneratedExamData } from '../types';
import { formatExamForHWP, copyToClipboard } from '../utils/formatters';
import { exportElementToPdf, exportElementToImage, printElementDirectly } from '../utils/exportUtils';

interface ExamPaperViewProps {
  examData: GeneratedExamData;
  onViewExplanation: () => void;
  onOpenEditor: () => void;
}

export const ExamPaperView: React.FC<ExamPaperViewProps> = ({
  examData,
  onViewExplanation,
  onOpenEditor,
}) => {
  const [copiedHwp, setCopiedHwp] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingImg, setIsExportingImg] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCopyHwp = async () => {
    const text = formatExamForHWP(examData);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedHwp(true);
      setTimeout(() => setCopiedHwp(false), 2000);
    }
  };

  const getSafeTitle = () => {
    return (examData.passageTitle || '수능국어_모의시험지').replace(/[^\w\s가-힣]/g, '_');
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('csat-exam-paper');
    if (!element) return;

    try {
      setIsExportingPdf(true);
      setStatusMessage('시험지 PDF 변환 중...');
      const filename = `[수능국어_${examData.passageCategory}]_${getSafeTitle()}_시험지.pdf`;
      const ok = await exportElementToPdf(element, filename, (msg) => setStatusMessage(msg));
      if (ok) {
        setStatusMessage('PDF 다운로드가 완료되었습니다!');
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage('PDF 생성에 실패했습니다. 다시 시도해 주세요.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setStatusMessage('PDF 생성 중 오류가 발생했습니다.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById('csat-exam-paper');
    if (!element) return;

    try {
      setIsExportingImg(true);
      setStatusMessage('시험지 고화질 이미지(PNG) 생성 중...');
      const filename = `[수능국어_${examData.passageCategory}]_${getSafeTitle()}_시험지.png`;
      const ok = await exportElementToImage(element, filename, (msg) => setStatusMessage(msg));
      if (ok) {
        setStatusMessage('이미지 다운로드가 완료되었습니다!');
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage('이미지 저장에 실패했습니다.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setStatusMessage('이미지 생성 중 오류가 발생했습니다.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsExportingImg(false);
    }
  };

  const handlePrint = () => {
    const element = document.getElementById('csat-exam-paper');
    if (!element) {
      window.print();
      return;
    }
    printElementDirectly(element, `2026학년도 수능 국어영역 - ${examData.passageTitle || '시험지'}`);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(examData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `수능국어_모의문항_${getSafeTitle()}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const questionRangeText = `[1 ~ ${examData.questions.length}] 다음 글을 읽고 물음에 답하시오.`;

  return (
    <div className="space-y-6">
      {/* Top action bar - Hidden during print */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm sm:text-base font-bold text-slate-900">
              수능 국어영역 기출 양식 시험지 뷰어
            </span>
            <span className="text-xs sm:text-sm text-slate-600 font-medium">
              ({examData.passageCategory} · {examData.questions.length}문항)
            </span>
          </div>

          <button
            type="button"
            onClick={onViewExplanation}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>정답 및 심층해설 보기</span>
          </button>
        </div>

        {/* Action button toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPdf || isExportingImg}
              className="flex items-center space-x-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              title="보여지는 시험지 그대로 PDF 문서로 다운로드"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? 'PDF 생성 중...' : '시험지 PDF 다운로드'}</span>
            </button>

            {/* PNG Image Download Button */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isExportingPdf || isExportingImg}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              title="보여지는 시험지 그대로 고화질 사진(PNG) 파일로 다운로드"
            >
              {isExportingImg ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              <span>{isExportingImg ? '이미지 생성 중...' : '사진(PNG) 다운로드'}</span>
            </button>

            {/* Print / Paper Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer"
              title="브라우저 인쇄 창 호출"
            >
              <Printer className="w-4 h-4" />
              <span>시험지 인쇄</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* HWP Copy */}
            <button
              type="button"
              onClick={handleCopyHwp}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs sm:text-sm font-bold border border-slate-300 transition cursor-pointer"
            >
              {copiedHwp ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedHwp ? '한글/워드 복사 완료!' : '한글(HWP) 복사'}</span>
            </button>

            {/* JSON Export */}
            <button
              type="button"
              onClick={handleDownloadJSON}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs sm:text-sm font-bold border border-slate-300 transition cursor-pointer"
              title="문항 데이터 JSON 저장"
            >
              <Download className="w-4 h-4" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Status notification banner */}
        {statusMessage && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{statusMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs text-blue-500 hover:text-blue-800 font-bold"
            >
              닫기
            </button>
          </div>
        )}
      </div>

      {/* Actual CSAT Exam Paper (Printable / Capturable) */}
      <div
        id="csat-exam-paper"
        className="bg-white border-2 border-slate-800 shadow-lg rounded-sm p-6 sm:p-10 max-w-5xl mx-auto text-slate-900 font-serif leading-relaxed"
        style={{ fontFamily: "'Nanum Myeongjo', 'Batang', 'Times New Roman', serif" }}
      >
        {/* CSAT Official Header */}
        <div className="border-b-2 border-slate-900 pb-3.5 mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700 mb-1.5">
            <span>2026학년도 대학수학능력시험 모의평가 문제지</span>
            <span className="font-bold border border-slate-800 px-2.5 py-0.5">홀수형</span>
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-slate-900">
              제 1 교시 <span className="text-2xl sm:text-3xl md:text-4xl ml-3">국어 영역</span>
            </div>

            {/* Student ID / Name boxes */}
            <div className="flex items-center space-x-3 text-xs sm:text-sm">
              <div className="flex items-center border border-slate-800 px-2.5 py-1">
                <span className="font-bold mr-2">성명</span>
                <div className="w-24 sm:w-32 h-4 border-b border-dotted border-slate-400"></div>
              </div>
              <div className="flex items-center border border-slate-800 px-2.5 py-1">
                <span className="font-bold mr-2">수험 번호</span>
                <div className="w-20 sm:w-28 h-4 border-b border-dotted border-slate-400"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column CSAT Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          {/* Vertical Divider in middle for CSAT 2-column aesthetic */}
          <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-slate-300 -ml-px"></div>

          {/* Left Column: Passage */}
          <div className="space-y-4 pr-0 md:pr-4">
            {/* Passage Range Header */}
            <div className="text-sm sm:text-base font-bold text-slate-900 bg-slate-100 px-3.5 py-2 border-l-4 border-slate-900">
              {questionRangeText}
            </div>

            {/* Passage title (Subtle) */}
            <div className="text-xs sm:text-sm text-slate-600 font-sans italic">
              [제시 지문] {examData.passageTitle} ({examData.passageCategory} · {examData.passageSubcategory})
            </div>

            {/* Passage Text Body */}
            <div className="text-sm sm:text-base leading-relaxed text-justify whitespace-pre-line border border-slate-200 bg-slate-50/50 p-4 sm:p-5 rounded-sm">
              {examData.passageText}
            </div>
          </div>

          {/* Right Column: Questions */}
          <div className="space-y-8 pl-0 md:pl-4">
            {examData.questions.map((q, idx) => (
              <div key={q.id || idx} className="space-y-3.5 pb-6 border-b border-slate-200 last:border-b-0">
                {/* Question Stem */}
                <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug flex items-start">
                  <span className="inline-block mr-2 text-base sm:text-lg font-black shrink-0">
                    {idx + 1}.
                  </span>
                  <span>
                    {q.stem}
                    {q.points === 3 && (
                      <span className="text-xs sm:text-sm font-bold text-slate-800 ml-2 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">[3점]</span>
                    )}
                  </span>
                </div>

                {/* <보 기> Box if available */}
                {q.bogiContent && (
                  <div className="border border-slate-700 bg-white p-4 my-3 rounded-xs relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-3 text-xs sm:text-sm font-bold tracking-widest text-slate-900 border border-slate-700 rounded-xs">
                      &lt;보 기&gt;
                    </div>
                    <div className="text-xs sm:text-sm md:text-base text-slate-900 leading-relaxed text-justify whitespace-pre-line pt-1 font-serif">
                      {q.bogiContent}
                    </div>
                  </div>
                )}

                {/* Multiple Choice Options (5지선다) */}
                {q.style === 'multiple_choice' && q.options && (
                  <div className="space-y-2 pt-1 text-sm sm:text-base text-slate-900">
                    {q.options.map((opt, optIdx) => {
                      const circle = ['①', '②', '③', '④', '⑤'][optIdx] || `(${optIdx + 1})`;
                      const cleanOptText = opt.replace(/^[①②③④⑤\(\d\)]\s*/, '');
                      return (
                        <div
                          key={optIdx}
                          className="flex items-start space-x-2 leading-relaxed hover:bg-slate-50 p-1.5 rounded transition"
                        >
                          <span className="font-bold select-none text-slate-900 shrink-0 text-sm sm:text-base">
                            {circle}
                          </span>
                          <span className="text-justify">{cleanOptText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Descriptive / Short answer placeholder */}
                {q.style === 'descriptive' && (
                  <div className="pt-2">
                    <div className="border border-slate-400 bg-slate-50/50 p-3.5 rounded-xs text-xs sm:text-sm text-slate-600 font-sans min-h-[100px] flex flex-col justify-between">
                      <span className="font-bold">[서술형 답안 작성란]</span>
                      <span className="text-right text-xs text-slate-500">
                        (조건에 맞춰 완성된 문장으로 서술할 것)
                      </span>
                    </div>
                  </div>
                )}

                {q.style === 'short_answer' && (
                  <div className="pt-2 flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-800">[답]:</span>
                    <div className="flex-1 border-b border-slate-600 h-6"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Paper Footer */}
        <div className="border-t-2 border-slate-900 mt-10 pt-2.5 flex items-center justify-between text-xs sm:text-sm text-slate-600">
          <span>한국교육과정평가원 수능 국어영역 기출 분석 문항</span>
          <span className="font-bold">1 / 1 페이지</span>
        </div>
      </div>
    </div>
  );
};
