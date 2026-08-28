import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Copy, Check, ChevronDown, ChevronUp, BookOpen, Target, Sparkles, HelpCircle, Download, Image as ImageIcon, Loader2, Printer } from 'lucide-react';
import { GeneratedExamData } from '../types';
import { copyToClipboard } from '../utils/formatters';
import { exportElementToPdf, exportElementToImage, printElementDirectly } from '../utils/exportUtils';

interface AnswerExplanationViewProps {
  examData: GeneratedExamData;
}

export const AnswerExplanationView: React.FC<AnswerExplanationViewProps> = ({ examData }) => {
  const [copied, setCopied] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingImg, setIsExportingImg] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const domainBadgeMap: Record<string, { label: string; bg: string; text: string }> = {
    factual: { label: '사실적 이해', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    inferential: { label: '추론적 이해', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    critical: { label: '비판적 이해', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
    application: { label: '적용/창의', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    vocabulary: { label: '어휘·어법', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' },
  };

  const getSafeTitle = () => {
    return (examData.passageTitle || '수능국어_해설지').replace(/[^\w\s가-힣]/g, '_');
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('explanation-container');
    if (!element) return;

    try {
      setIsExportingPdf(true);
      setStatusMessage('해설지 PDF 변환 중...');
      const filename = `[수능국어_${examData.passageCategory}]_${getSafeTitle()}_정답해설지.pdf`;
      const ok = await exportElementToPdf(element, filename, (msg) => setStatusMessage(msg));
      if (ok) {
        setStatusMessage('해설지 PDF 다운로드가 완료되었습니다!');
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage('PDF 생성에 실패했습니다.');
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
    const element = document.getElementById('explanation-container');
    if (!element) return;

    try {
      setIsExportingImg(true);
      setStatusMessage('해설지 고화질 이미지(PNG) 생성 중...');
      const filename = `[수능국어_${examData.passageCategory}]_${getSafeTitle()}_정답해설지.png`;
      const ok = await exportElementToImage(element, filename, (msg) => setStatusMessage(msg));
      if (ok) {
        setStatusMessage('해설지 이미지 저장이 완료되었습니다!');
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
    const element = document.getElementById('explanation-container');
    if (!element) {
      window.print();
      return;
    }
    printElementDirectly(element, `2026학년도 수능 국어영역 해설 - ${examData.passageTitle || '해설지'}`);
  };

  const handleCopyAllExplanations = async () => {
    let text = `[ ${examData.passageTitle || '수능 국어'} - 정답 및 심층 해설지 ]\n\n`;

    examData.questions.forEach((q, idx) => {
      text += `[문항 ${idx + 1}] 정답: ${q.correctAnswer} (${q.points}점)\n`;
      text += `■ 발문: ${q.stem}\n`;
      text += `■ 행동영역: ${domainBadgeMap[q.behavioralDomain]?.label || q.behavioralDomain}\n`;
      text += `■ 출제의도: ${q.intention}\n`;
      text += `■ 지문근거: ${q.passageEvidence}\n`;
      text += `■ 해설:\n${q.detailedExplanation}\n\n`;

      if (q.optionAnalyses && q.optionAnalyses.length > 0) {
        text += `■ 선지별 분석:\n`;
        q.optionAnalyses.forEach((oa) => {
          const circle = ['①', '②', '③', '④', '⑤'][oa.optionNumber - 1] || `(${oa.optionNumber})`;
          text += `  ${circle} ${oa.isCorrect ? '[정답]' : `[오답 - ${oa.distractorTrapType || '오답'}]`} ${oa.explanation}\n`;
        });
        text += `\n`;
      }

      if (q.style === 'descriptive') {
        if (q.modelAnswer) text += `■ 모범 답안: ${q.modelAnswer}\n`;
        if (q.rubric && q.rubric.length > 0) {
          text += `■ 채점 기준표:\n`;
          q.rubric.forEach((r) => {
            text += `  - ${r.criteria} (${r.allocatedPoints}점)\n`;
          });
        }
        text += `\n`;
      }

      text += `----------------------------------------------------\n\n`;
    });

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div id="explanation-container" className="space-y-6">
      {/* Header Summary & Quick Answer Table */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>정답 및 평가원 기준 심층 해설 (Answer & Commentary)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              정답 판별 근거, 오답 함정(Distractor Trap) 유형 분석 및 서술형 채점기준표
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* PDF Export */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPdf || isExportingImg}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isExportingPdf ? 'PDF 생성 중...' : '해설지 PDF'}</span>
            </button>

            {/* Image Export */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isExportingPdf || isExportingImg}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isExportingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              <span>{isExportingImg ? '이미지 생성 중...' : '사진(PNG)'}</span>
            </button>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄</span>
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopyAllExplanations}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs sm:text-sm font-bold border border-slate-300 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사 완료!' : '해설지 복사'}</span>
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

        {/* Quick Answer Key Grid */}
        <div>
          <div className="text-xs sm:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
            빠른 정답표 (Quick Answer Key)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {examData.questions.map((q, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center flex flex-col items-center justify-center space-y-1 hover:bg-blue-50/70 hover:border-blue-300 transition cursor-pointer"
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
              >
                <span className="text-xs sm:text-sm text-slate-600 font-semibold">문항 {idx + 1}</span>
                <span className="text-lg sm:text-xl font-black text-blue-700">
                  {q.correctAnswer}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {q.points}점 · {domainBadgeMap[q.behavioralDomain]?.label || q.behavioralDomain}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Item by item detailed breakdown cards */}
      <div className="space-y-5">
        {examData.questions.map((q, idx) => {
          const domainInfo = domainBadgeMap[q.behavioralDomain] || {
            label: q.behavioralDomain,
            bg: 'bg-slate-50 border-slate-200',
            text: 'text-slate-700',
          };

          return (
            <div
              key={q.id || idx}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition"
            >
              {/* Question Header Card */}
              <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-md border bg-emerald-100 text-emerald-900 border-emerald-300">
                      정답: {q.correctAnswer}
                    </span>
                    <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-md border bg-blue-100 text-blue-900 border-blue-300">
                      배점: {q.points}점
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-semibold px-2.5 py-0.5 rounded-md border ${domainInfo.bg} ${domainInfo.text}`}
                    >
                      {domainInfo.label}
                    </span>
                  </div>

                  <span className="text-xs sm:text-sm text-slate-600 font-medium">
                    난이도: {q.difficulty === 'high' ? '고난도(킬러/준킬러)' : q.difficulty === 'low' ? '기초' : '표준'}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {idx + 1}. {q.stem}
                </h3>
              </div>

              {/* Body Details */}
              <div className="p-4 sm:p-6 space-y-5">
                {/* 1. Intention & Passage Evidence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-slate-800">
                      <Target className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>출제 의도 및 평가원 기준</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{q.intention}</p>
                  </div>

                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-blue-900">
                      <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>지문 내 직접 근거 (Passage Evidence)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-blue-950 leading-relaxed font-serif">
                      "{q.passageEvidence}"
                    </p>
                  </div>
                </div>

                {/* 2. Comprehensive Explanation */}
                <div className="space-y-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                    종합 해설
                  </h4>
                  <p className="text-sm sm:text-base text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-line font-serif">
                    {q.detailedExplanation}
                  </p>
                </div>

                {/* 3. Option-by-Option Distractor Trap Analysis (5지선다) */}
                {q.style === 'multiple_choice' && q.optionAnalyses && q.optionAnalyses.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>선지별 오답 함정 분석 (Distractor Trap Analysis)</span>
                    </h4>

                    <div className="space-y-2.5">
                      {q.optionAnalyses.map((oa) => {
                        const circle = ['①', '②', '③', '④', '⑤'][oa.optionNumber - 1] || `(${oa.optionNumber})`;
                        const isCorrect = oa.isCorrect;

                        return (
                          <div
                            key={oa.optionNumber}
                            className={`p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm leading-relaxed transition ${
                              isCorrect
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          >
                            <div className="flex items-start space-x-2.5">
                              <span className="font-black text-base sm:text-lg shrink-0">{circle}</span>
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  {isCorrect ? (
                                    <span className="bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-md font-bold">
                                      [정답 선지]
                                    </span>
                                  ) : (
                                    <span className="bg-red-100 text-red-800 border border-red-200 text-xs px-2.5 py-0.5 rounded-md font-bold">
                                      {oa.distractorTrapType ? `[오답 함정: ${oa.distractorTrapType}]` : '[오답 선지]'}
                                    </span>
                                  )}
                                  <span className="text-slate-700 font-serif line-clamp-1 italic font-medium">
                                    "{oa.text}"
                                  </span>
                                </div>
                                <p className="text-slate-800 pt-0.5 text-xs sm:text-sm">{oa.explanation}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Descriptive model answer and rubric */}
                {q.style === 'descriptive' && (
                  <div className="space-y-3.5 pt-2">
                    {q.modelAnswer && (
                      <div className="bg-amber-50/80 border border-amber-300 p-4 rounded-xl space-y-1.5">
                        <div className="text-xs sm:text-sm font-bold text-amber-950">[서술형 모범 답안]</div>
                        <p className="text-sm sm:text-base text-amber-950 leading-relaxed font-serif">
                          {q.modelAnswer}
                        </p>
                      </div>
                    )}

                    {q.rubric && q.rubric.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs sm:text-sm font-bold text-slate-800">단계별 부분 점수 채점 기준표 (Rubric)</div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs sm:text-sm">
                          <table className="w-full text-left">
                            <thead className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                              <tr>
                                <th className="p-3">평가 요소 및 채점 기준</th>
                                <th className="p-3 w-28 text-center">배점</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-900">
                              {q.rubric.map((r, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50">
                                  <td className="p-3 font-medium">{r.criteria}</td>
                                  <td className="p-3 text-center font-bold text-blue-700">
                                    +{r.allocatedPoints}점
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
