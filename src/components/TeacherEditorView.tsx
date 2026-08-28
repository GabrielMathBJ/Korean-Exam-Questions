import React, { useState } from 'react';
import { Edit3, Sparkles, RefreshCw, Plus, Trash2, Check, Save, AlertCircle, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';
import { GeneratedExamData, GeneratedQuestion, QuestionConfig, QuestionStyle, BehavioralDomain } from '../types';

interface TeacherEditorViewProps {
  examData: GeneratedExamData;
  setExamData: React.Dispatch<React.SetStateAction<GeneratedExamData | null>>;
}

export const TeacherEditorView: React.FC<TeacherEditorViewProps> = ({
  examData,
  setExamData,
}) => {
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [regenModalIndex, setRegenModalIndex] = useState<number | null>(null);
  const [regenFeedback, setRegenFeedback] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Quick edit helper
  const handleUpdateQuestion = (index: number, updates: Partial<GeneratedQuestion>) => {
    setExamData((prev) => {
      if (!prev) return prev;
      const updatedQuestions = [...prev.questions];
      updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
      return { ...prev, questions: updatedQuestions };
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    setExamData((prev) => {
      if (!prev) return prev;
      const updatedQuestions = [...prev.questions];
      const targetQ = updatedQuestions[qIndex];
      if (targetQ.options) {
        const newOptions = [...targetQ.options];
        newOptions[optIndex] = text;
        updatedQuestions[qIndex] = { ...targetQ, options: newOptions };
      }
      return { ...prev, questions: updatedQuestions };
    });
  };

  const handleDeleteQuestion = (index: number) => {
    if (examData.questions.length <= 1) {
      alert('최소 1개의 문항은 유지되어야 합니다.');
      return;
    }
    if (confirm(`${index + 1}번 문항을 삭제하시겠습니까?`)) {
      setExamData((prev) => {
        if (!prev) return prev;
        const filtered = prev.questions.filter((_, i) => i !== index);
        // renumber
        const renumbered = filtered.map((q, i) => ({ ...q, questionNumber: i + 1 }));
        return { ...prev, questions: renumbered };
      });
    }
  };

  // AI Single Question Regeneration
  const handleRegenerateSingleQuestion = async () => {
    if (regenModalIndex === null) return;
    setIsRegenerating(true);
    setRegenError(null);

    const targetQ = examData.questions[regenModalIndex];

    try {
      const response = await fetch('/api/gemini/regenerate-single-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageText: examData.passageText,
          questionIndex: regenModalIndex,
          existingQuestion: targetQ,
          userFeedback: regenFeedback,
          questionConfig: {
            style: targetQ.style,
            behavioralDomain: targetQ.behavioralDomain,
            difficulty: targetQ.difficulty,
            points: targetQ.points,
          },
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        const newQ: GeneratedQuestion = {
          ...result.data,
          id: `q-${Date.now()}`,
          questionNumber: regenModalIndex + 1,
        };

        setExamData((prev) => {
          if (!prev) return prev;
          const updated = [...prev.questions];
          updated[regenModalIndex] = newQ;
          return { ...prev, questions: updated };
        });

        setRegenModalIndex(null);
        setRegenFeedback('');
      } else {
        setRegenError(result.error || '문항 재출제에 실패했습니다.');
      }
    } catch (err: any) {
      setRegenError(err.message || '네트워크 통신 오류가 발생했습니다.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600 shrink-0" />
            <span>출제위원 스튜디오 & 문항 편집실 (Item Editor)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            발문, 선지, &lt;보 기&gt;, 정답 및 해설을 직접 수정하거나 개별 문항을 AI로 즉시 재출제합니다.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {saveSuccessMsg && (
            <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              저장되었습니다!
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setSaveSuccessMsg(true);
              setTimeout(() => setSaveSuccessMsg(false), 2000);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>수정사항 저장</span>
          </button>
        </div>
      </div>

      {/* Item List */}
      <div className="space-y-6">
        {examData.questions.map((q, idx) => {
          const isEditing = editingQuestionIndex === idx;

          return (
            <div
              key={q.id || idx}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition"
            >
              {/* Question card bar */}
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold text-sm flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-base sm:text-lg text-slate-900">[문항 {idx + 1}]</span>
                  <span className="text-xs sm:text-sm px-2.5 py-0.5 bg-slate-200 text-slate-800 rounded font-bold">
                    {q.points}점
                  </span>
                  <span className="text-xs sm:text-sm px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded font-semibold">
                    {q.behavioralDomain}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRegenModalIndex(idx);
                      setRegenFeedback('');
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>이 문항만 AI 재출제</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingQuestionIndex(isEditing ? null : idx)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer"
                  >
                    {isEditing ? '접기' : '상세 편집'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                    title="문항 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Stem */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                    발문 (Question Stem)
                  </label>
                  <input
                    type="text"
                    value={q.stem || ''}
                    onChange={(e) => handleUpdateQuestion(idx, { stem: e.target.value })}
                    className="w-full text-sm sm:text-base font-semibold text-slate-900 px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                {/* Bogi Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs sm:text-sm font-bold text-slate-800">&lt;보 기&gt; 내용</label>
                    <span className="text-xs text-slate-500">비워두면 보기가 표시되지 않습니다</span>
                  </div>
                  <textarea
                    rows={3}
                    value={q.bogiContent || ''}
                    onChange={(e) => handleUpdateQuestion(idx, { bogiContent: e.target.value })}
                    placeholder="<보 기> 박스에 들어갈 텍스트 (시각자료, 학술 비평, 새로운 상황 등)"
                    className="w-full text-sm sm:text-base p-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-serif"
                  />
                </div>

                {/* Multiple choice options */}
                {q.style === 'multiple_choice' && q.options && (
                  <div className="space-y-2.5">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
                      5지선다 선지 (Choices ① ~ ⑤)
                    </label>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const circle = ['①', '②', '③', '④', '⑤'][optIdx] || `(${optIdx + 1})`;
                        return (
                          <div key={optIdx} className="flex items-center space-x-2.5">
                            <span className="w-7 font-bold text-base sm:text-lg text-slate-900 text-center shrink-0">
                              {circle}
                            </span>
                            <input
                              type="text"
                              value={(opt || '').replace(/^[①②③④⑤\(\d\)]\s*/, '')}
                              onChange={(e) => handleUpdateOption(idx, optIdx, `${circle} ${e.target.value}`)}
                              className="flex-1 text-sm sm:text-base px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-serif text-slate-900"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Descriptive Model Answer and Rubric Editor */}
                {q.style === 'descriptive' && (
                  <div className="space-y-3.5 pt-2 border-t border-amber-200 bg-amber-50/40 p-4 rounded-xl border">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-amber-950 mb-1">
                        서술형 모범 답안 (Model Answer)
                      </label>
                      <textarea
                        rows={2}
                        value={q.modelAnswer || ''}
                        onChange={(e) => handleUpdateQuestion(idx, { modelAnswer: e.target.value })}
                        placeholder="채점의 기준이 되는 서술형 모범 답안 문장"
                        className="w-full text-sm sm:text-base p-3 border border-amber-300 rounded-lg bg-white font-serif focus:ring-2 focus:ring-amber-500 text-slate-900"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-bold text-amber-950">
                          단계별 부분점수 채점 기준표 (Rubric)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const existing = q.rubric || [];
                            const newRubric = [...existing, { criteria: '평가 요소 서술', allocatedPoints: 1 }];
                            handleUpdateQuestion(idx, { rubric: newRubric });
                          }}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-md text-xs sm:text-sm font-bold transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>채점 기준 추가</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(q.rubric || []).map((rubricItem, rIdx) => (
                          <div key={rIdx} className="flex items-center space-x-2 bg-white p-2.5 rounded-lg border border-amber-200">
                            <span className="text-sm font-bold text-amber-900 w-6 text-center">{rIdx + 1}.</span>
                            <input
                              type="text"
                              value={rubricItem?.criteria || ''}
                              onChange={(e) => {
                                const newRubric = (q.rubric || []).map((r, i) =>
                                  i === rIdx ? { ...r, criteria: e.target.value } : r
                                );
                                handleUpdateQuestion(idx, { rubric: newRubric });
                              }}
                              placeholder="평가 요소 및 채점 기준 내용"
                              className="flex-1 text-sm sm:text-base px-3 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900"
                            />
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={rubricItem?.allocatedPoints ?? 1}
                                onChange={(e) => {
                                  const newRubric = (q.rubric || []).map((r, i) =>
                                    i === rIdx ? { ...r, allocatedPoints: Math.max(1, Number(e.target.value) || 1) } : r
                                  );
                                  handleUpdateQuestion(idx, { rubric: newRubric });
                                }}
                                className="w-16 text-sm font-bold text-center px-2 py-1.5 border border-slate-300 rounded-md text-blue-700"
                              />
                              <span className="text-sm text-slate-700">점</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newRubric = (q.rubric || []).filter((_, i) => i !== rIdx);
                                handleUpdateQuestion(idx, { rubric: newRubric });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Correct Answer & Points Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                      정답 (Correct Answer)
                    </label>
                    <input
                      type="text"
                      value={q.correctAnswer ?? ''}
                      onChange={(e) => handleUpdateQuestion(idx, { correctAnswer: e.target.value })}
                      className="w-full text-sm sm:text-base font-bold text-emerald-800 px-3.5 py-2 border border-emerald-300 rounded-lg bg-emerald-50/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">배점</label>
                    <select
                      value={q.points ?? 2}
                      onChange={(e) => handleUpdateQuestion(idx, { points: Number(e.target.value) as 2 | 3 })}
                      className="w-full text-sm sm:text-base px-3.5 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      <option value={2}>2점 (표준)</option>
                      <option value={3}>3점 (고난도)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                      행동 영역
                    </label>
                    <select
                      value={q.behavioralDomain || 'factual'}
                      onChange={(e) =>
                        handleUpdateQuestion(idx, { behavioralDomain: e.target.value as BehavioralDomain })
                      }
                      className="w-full text-sm sm:text-base px-3.5 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      <option value="factual">사실적 이해</option>
                      <option value="inferential">추론적 이해</option>
                      <option value="critical">비판적 이해</option>
                      <option value="application">적용/창의</option>
                      <option value="vocabulary">어휘·어법</option>
                    </select>
                  </div>
                </div>

                {/* Explanations & Evidence */}
                {isEditing && (
                  <div className="space-y-3.5 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                        출제 의도
                      </label>
                      <input
                        type="text"
                        value={q.intention || ''}
                        onChange={(e) => handleUpdateQuestion(idx, { intention: e.target.value })}
                        className="w-full text-sm sm:text-base px-3.5 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                        지문 내 직접 정답 근거
                      </label>
                      <textarea
                        rows={2}
                        value={q.passageEvidence || ''}
                        onChange={(e) => handleUpdateQuestion(idx, { passageEvidence: e.target.value })}
                        className="w-full text-sm sm:text-base p-3 border border-slate-300 rounded-lg bg-white font-serif"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
                        종합 해설
                      </label>
                      <textarea
                        rows={4}
                        value={q.detailedExplanation || ''}
                        onChange={(e) => handleUpdateQuestion(idx, { detailedExplanation: e.target.value })}
                        className="w-full text-sm sm:text-base p-3 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Single Question Regeneration Modal */}
      {regenModalIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                [문항 {regenModalIndex + 1}] AI 맞춤형 재출제
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              출제위원으로서 수정하고 싶은 조건이나 요구사항을 입력해 주세요. Gemini AI가 평가원 출제 원칙에 맞게 정밀하게 다시 출제합니다.
            </p>

            {regenError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm font-medium">
                {regenError}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                출제자 수정 요구 피드백
              </label>
              <textarea
                rows={4}
                value={regenFeedback}
                onChange={(e) => setRegenFeedback(e.target.value)}
                placeholder="예:&#10;- 선지 3번이 정답이 되도록 하고 오답 선지에 '주체 혼동' 함정을 넣어줘&#10;- 3점짜리 <보기> 적용형 고난도 킬러 문제로 바꿔줘&#10;- 발문을 부정형('적절하지 않은 것은?')으로 바꿔줘"
                className="w-full text-sm sm:text-base p-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRegenModalIndex(null)}
                disabled={isRegenerating}
                className="px-4 py-2 text-xs sm:text-sm text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
              >
                취소
              </button>

              <button
                type="button"
                onClick={handleRegenerateSingleQuestion}
                disabled={isRegenerating}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI 평가위원 재출제 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>문항 재생성하기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
