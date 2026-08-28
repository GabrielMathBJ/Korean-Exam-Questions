import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, XCircle, Award, Clock, ArrowRight, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GeneratedExamData } from '../types';

interface InteractiveTestModeProps {
  examData: GeneratedExamData;
  onGoToExplanations: () => void;
}

export const InteractiveTestMode: React.FC<InteractiveTestModeProps> = ({
  examData,
  onGoToExplanations,
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !isSubmitted) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isSubmitted]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qIndex: number, answer: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIndex]: answer }));
  };

  const handleSubmitExam = () => {
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < examData.questions.length) {
      if (!confirm(`아직 풀지 않은 문항이 있습니다 (${answeredCount}/${examData.questions.length}문항 풀이됨). 정말 제출하시겠습니까?`)) {
        return;
      }
    }

    setIsSubmitted(true);
    setIsTimerRunning(false);

    // Calculate score and trigger confetti if good
    let totalPts = 0;
    let earnedPts = 0;
    examData.questions.forEach((q, idx) => {
      totalPts += q.points;
      const userAns = (userAnswers[idx] || '').trim();
      const correctAns = (q.correctAnswer || '').trim();
      if (userAns === correctAns || userAns === correctAns.replace(/[①②③④⑤]/, '')) {
        earnedPts += q.points;
      }
    });

    if (earnedPts / totalPts >= 0.7) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const handleResetExam = () => {
    if (confirm('시험을 초기화하고 다시 응시하시겠습니까?')) {
      setUserAnswers({});
      setIsSubmitted(false);
      setSeconds(0);
      setIsTimerRunning(true);
    }
  };

  // Calculate stats
  let totalPoints = 0;
  let userPoints = 0;
  let correctCount = 0;

  examData.questions.forEach((q, idx) => {
    totalPoints += q.points;
    const userAns = (userAnswers[idx] || '').trim();
    const correctAns = (q.correctAnswer || '').trim();
    if (userAns === correctAns || (q.style === 'multiple_choice' && userAns.includes(correctAns))) {
      userPoints += q.points;
      correctCount += 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Test Control & Timer Header */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4 sticky top-16 z-30">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 rounded-lg text-sm sm:text-base font-mono border border-slate-700">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-bold">{formatTime(seconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            disabled={isSubmitted}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition cursor-pointer"
            title={isTimerRunning ? '타이머 일시정지' : '타이머 재개'}
          >
            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleResetExam}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition cursor-pointer"
            title="시험 다시 시작"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* OMR Quick Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          <span className="text-xs sm:text-sm text-slate-400 font-medium mr-1 shrink-0">답안 현황:</span>
          {examData.questions.map((q, idx) => {
            const hasAnswer = !!userAnswers[idx];
            const isCorrect =
              isSubmitted &&
              (userAnswers[idx] === q.correctAnswer ||
                (q.style === 'multiple_choice' && (userAnswers[idx] || '').includes(q.correctAnswer)));

            return (
              <div
                key={idx}
                className={`w-8 h-8 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center transition border shrink-0 ${
                  isSubmitted
                    ? isCorrect
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-rose-600 text-white border-rose-500'
                    : hasAnswer
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isSubmitted ? (isCorrect ? 'O' : 'X') : userAnswers[idx] || idx + 1}
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        {!isSubmitted ? (
          <button
            type="button"
            onClick={handleSubmitExam}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
          >
            답안 최종 제출하기
          </button>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">총 득점</div>
              <div className="text-base sm:text-lg font-black text-amber-400">
                {userPoints} / {totalPoints}점
              </div>
            </div>
            <button
              type="button"
              onClick={onGoToExplanations}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <span>해설지 보기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Score Summary Modal/Card after Submission */}
      {isSubmitted && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-xl shadow-lg border border-blue-700/50 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-black text-xl shadow">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold">모의응시 채점 결과</h3>
                <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                  소요 시간: {formatTime(seconds)} | 총 {examData.questions.length}문항 중 {correctCount}문항 정답
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-slate-800/80 px-5 py-3.5 rounded-xl border border-blue-400/20">
              <div className="text-center">
                <div className="text-xs text-blue-300">내 점수</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300">{userPoints}점</div>
              </div>
              <div className="w-px h-10 bg-blue-700/60"></div>
              <div className="text-center">
                <div className="text-xs text-blue-300">정답률</div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {Math.round((correctCount / examData.questions.length) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split Interactive Exam Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Passage (Sticky on desktop) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 lg:sticky lg:top-36 max-h-[80vh] overflow-y-auto font-serif">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3.5">
              <span className="text-xs sm:text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md">
                [제시 지문] {examData.passageCategory} · {examData.passageSubcategory}
              </span>
              <span className="text-xs sm:text-sm text-slate-500 font-sans">1 ~ {examData.questions.length}번 공통</span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3.5">
              {examData.passageTitle}
            </h3>

            <div className="text-sm sm:text-base text-slate-900 leading-relaxed whitespace-pre-line text-justify">
              {examData.passageText}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Questions */}
        <div className="lg:col-span-6 space-y-5">
          {examData.questions.map((q, idx) => {
            const userAns = userAnswers[idx];
            const isCorrect = isSubmitted && (userAns === q.correctAnswer || (userAns || '').includes(q.correctAnswer));

            return (
              <div
                key={q.id || idx}
                className={`bg-white rounded-xl border shadow-xs p-5 sm:p-6 space-y-4 transition ${
                  isSubmitted
                    ? isCorrect
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Question Stem */}
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    <span className="text-blue-700 mr-2 font-black">[{idx + 1}]</span>
                    {q.stem}
                    {q.points === 3 && (
                      <span className="text-xs sm:text-sm text-amber-800 font-bold ml-2 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">[3점]</span>
                    )}
                  </div>

                  {isSubmitted && (
                    <div className="shrink-0">
                      {isCorrect ? (
                        <span className="flex items-center space-x-1 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>정답 (+{q.points}점)</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-xs sm:text-sm font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full">
                          <XCircle className="w-4 h-4" />
                          <span>오답 (정답: {q.correctAnswer})</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* <보 기> */}
                {q.bogiContent && (
                  <div className="border border-slate-600 bg-slate-50 p-4 rounded-sm relative text-xs sm:text-sm md:text-base text-slate-900 leading-relaxed font-serif whitespace-pre-line">
                    <div className="text-center font-bold text-xs sm:text-sm text-slate-900 border-b border-slate-300 pb-1 mb-2">
                      &lt;보 기&gt;
                    </div>
                    {q.bogiContent}
                  </div>
                )}

                {/* 5-Choice Options */}
                {q.style === 'multiple_choice' && q.options && (
                  <div className="space-y-2.5 pt-1 font-serif text-sm sm:text-base">
                    {q.options.map((opt, optIdx) => {
                      const circle = ['①', '②', '③', '④', '⑤'][optIdx] || `(${optIdx + 1})`;
                      const cleanOptText = opt.replace(/^[①②③④⑤\(\d\)]\s*/, '');
                      const isSelected = userAns === circle;
                      const isActualCorrect = isSubmitted && q.correctAnswer.includes(circle);

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectAnswer(idx, circle)}
                          className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer transition select-none ${
                            isSubmitted
                              ? isActualCorrect
                                ? 'bg-emerald-100/90 border-emerald-500 text-emerald-950 font-bold'
                                : isSelected
                                ? 'bg-rose-100/90 border-rose-400 text-rose-950 line-through'
                                : 'bg-slate-50 border-slate-200 text-slate-600 opacity-80'
                              : isSelected
                              ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-2xs ring-2 ring-blue-400'
                              : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-900'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : isActualCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {circle}
                          </span>
                          <span className="leading-snug pt-0.5">{cleanOptText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Descriptive Text Input */}
                {q.style === 'descriptive' && (
                  <div className="space-y-2.5">
                    <textarea
                      rows={3}
                      disabled={isSubmitted}
                      value={userAnswers[idx] || ''}
                      onChange={(e) => handleSelectAnswer(idx, e.target.value)}
                      placeholder="서술형 답안을 여기에 작성하세요..."
                      className="w-full text-sm sm:text-base p-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    {isSubmitted && q.modelAnswer && (
                      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs sm:text-sm space-y-1.5">
                        <span className="font-bold text-amber-950">[모범 답안]:</span>
                        <p className="text-amber-950 leading-relaxed font-serif text-sm sm:text-base">{q.modelAnswer}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Short Answer Input */}
                {q.style === 'short_answer' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      disabled={isSubmitted}
                      value={userAnswers[idx] || ''}
                      onChange={(e) => handleSelectAnswer(idx, e.target.value)}
                      placeholder="단답형 정답 입력..."
                      className="w-full text-sm sm:text-base px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
