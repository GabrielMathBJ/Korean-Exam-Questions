import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle, CheckCircle2, BookOpen, Layers, ArrowRight, ShieldCheck, Key } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { PassageUploader } from './components/PassageUploader';
import { QuestionConfigurator } from './components/QuestionConfigurator';
import { ExamPaperView } from './components/ExamPaperView';
import { AnswerExplanationView } from './components/AnswerExplanationView';
import { TeacherEditorView } from './components/TeacherEditorView';
import { PassageAnalysisCard } from './components/PassageAnalysisCard';
import { PrivacyModal } from './components/PrivacyModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SAMPLE_PASSAGES } from './data/samplePassages';
import { GeneratedExamData, QuestionConfig, SamplePassage } from './types';
import { safeFetchJson } from './utils/imageOptimizer';

// Default initial question configs
const DEFAULT_CONFIGS: QuestionConfig[] = [
  {
    id: 'cfg-1',
    questionNumber: 1,
    style: 'multiple_choice',
    behavioralDomain: 'factual',
    difficulty: 'medium',
    points: 2,
    requireBogi: false,
    targetSection: '전체 지문',
  },
  {
    id: 'cfg-2',
    questionNumber: 2,
    style: 'multiple_choice',
    behavioralDomain: 'inferential',
    difficulty: 'medium',
    points: 2,
    requireBogi: false,
    targetSection: '핵심 개념 및 맥락 추론',
  },
  {
    id: 'cfg-3',
    questionNumber: 3,
    style: 'multiple_choice',
    behavioralDomain: 'application',
    difficulty: 'high',
    points: 3,
    requireBogi: true,
    targetSection: '<보기>를 통한 구체적 상황 적용',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'paper' | 'explanation' | 'editor'>('generator');

  // Input states
  const [passageTitle, setPassageTitle] = useState('헤겔의 미학과 절대정신');
  const [passageCategory, setPassageCategory] = useState('독서');
  const [passageSubcategory, setPassageSubcategory] = useState('인문·철학');
  const [passageText, setPassageText] = useState(SAMPLE_PASSAGES[0].text);
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ mimeType: string; base64: string; previewUrl: string; name: string }>
  >([]);
  const [questionConfigs, setQuestionConfigs] = useState<QuestionConfig[]>(SAMPLE_PASSAGES[0].recommendedQuestionConfigs || DEFAULT_CONFIGS);
  const [customInstructions, setCustomInstructions] = useState('');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Generated exam state
  const [examData, setExamData] = useState<GeneratedExamData | null>(null);
  
  // Privacy Policy modal state
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // API Key modal state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState<string>('');

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('user_gemini_api_key');
      if (savedKey) setCustomApiKey(savedKey);
    } catch {
      // ignore
    }
  }, []);

  // Apply a sample passage
  const handleApplySample = (sample: SamplePassage) => {
    setPassageTitle(sample.title);
    setPassageCategory(sample.category);
    setPassageSubcategory(sample.subcategory);
    setPassageText(sample.text);
    if (sample.recommendedQuestionConfigs) {
      setQuestionConfigs(sample.recommendedQuestionConfigs);
    }
  };

  // Main Generation Request
  const handleGenerateExam = async () => {
    if (!passageText.trim() && uploadedImages.length === 0) {
      alert('지문 내용을 입력하거나 PDF/이미지 파일을 업로드해 주세요.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await safeFetchJson<GeneratedExamData>('/api/gemini/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageText,
          images: uploadedImages.map((img) => ({ mimeType: img.mimeType, base64: img.base64 })),
          passageCategory: `${passageCategory} - ${passageSubcategory}`,
          questionConfigs,
          customInstructions,
        }),
      });

      if (response.success && response.data) {
        setExamData(response.data);
        setActiveTab('paper'); // Jump to CSAT exam paper
      } else {
        setGenerationError(response.error || '문항 생성 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      setGenerationError(err.message || '네트워크 통신 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasGeneratedExam={!!examData}
        questionCount={examData?.questions?.length || 0}
        hasCustomApiKey={!!customApiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onQuickPrint={() => {
          setActiveTab('paper');
          setTimeout(() => window.print(), 300);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Tab 1: Generator Workspace */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            {/* Top banner */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600 shrink-0" />
                  <span>KICE 수능 국어영역 기출 문항 자동 출제 스튜디오</span>
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  지문(PDF/이미지/텍스트)을 입력하고 문항 수 및 수능 5대 행동영역(사실, 추론, 비판, 적용, 어휘·어법)을 지정하면 평가원 스타일의 시험지를 출제합니다.
                </p>
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm text-slate-500 font-bold mr-1">기출 예시:</span>
                {SAMPLE_PASSAGES.slice(0, 3).map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleApplySample(sample)}
                    className="text-xs sm:text-sm px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg text-slate-700 font-medium transition"
                  >
                    {sample.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1: Passage Ingestion */}
            <PassageUploader
              passageText={passageText}
              setPassageText={setPassageText}
              passageCategory={passageCategory}
              setPassageCategory={setPassageCategory}
              passageSubcategory={passageSubcategory}
              setPassageSubcategory={setPassageSubcategory}
              passageTitle={passageTitle}
              setPassageTitle={setPassageTitle}
              uploadedImages={uploadedImages}
              setUploadedImages={setUploadedImages}
              onApplySample={handleApplySample}
              onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
              hasCustomApiKey={!!customApiKey}
            />

            {/* Step 2: Question Item Configurator */}
            <QuestionConfigurator
              questionConfigs={questionConfigs}
              setQuestionConfigs={setQuestionConfigs}
              customInstructions={customInstructions}
              setCustomInstructions={setCustomInstructions}
              passageCategory={passageCategory}
            />

            {/* Error Notification */}
            {generationError && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-900 text-sm sm:text-base">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-base">출제 생성 실패 안내</div>
                    <div className="leading-relaxed">{generationError}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition shadow-2xs cursor-pointer"
                >
                  🔑 개인 API 키 설정하기
                </button>
              </div>
            )}

            {/* Trigger Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 text-white p-5 sm:p-6 rounded-xl shadow-lg border border-slate-800">
              <div className="space-y-1">
                <div className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
                  <span>수능 국어영역 기출 스타일 문항 일괄 생성</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-300">
                  설정된 총 {questionConfigs.length}문항 (총 {questionConfigs.reduce((a, c) => a + c.points, 0)}점) / KICE 고속 추론 파이프라인
                </div>
              </div>

              <button
                type="button"
                id="generate-exam-btn"
                onClick={handleGenerateExam}
                disabled={isGenerating}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-base sm:text-lg shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
                    <span>평가원 출제위원이 문항을 검토·출제 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 shrink-0" />
                    <span>🚀 수능 기출 스타일 문제 출제 시작</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: CSAT Exam Paper View */}
        {activeTab === 'paper' && examData && (
          <div className="space-y-6">
            <PassageAnalysisCard examData={examData} />
            <ExamPaperView
              examData={examData}
              onViewExplanation={() => setActiveTab('explanation')}
              onOpenEditor={() => setActiveTab('editor')}
            />
          </div>
        )}

        {/* Tab 3: Detailed Answer Key & Distractor Commentary */}
        {activeTab === 'explanation' && examData && (
          <div className="space-y-6">
            <PassageAnalysisCard examData={examData} />
            <AnswerExplanationView examData={examData} />
          </div>
        )}

        {/* Tab 4: Teacher / Evaluator Editor Studio */}
        {activeTab === 'editor' && examData && (
          <div className="space-y-6">
            <TeacherEditorView
              examData={examData}
              setExamData={setExamData}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center space-y-2">
        <p className="font-semibold text-slate-300">
          한국교육과정평가원(KICE) 대학수학능력시험 국어영역 출제 기준 프레임워크
        </p>
        <p className="text-slate-500">
          사실적 이해 · 추론적 이해 · 비판적 이해 · 적용/창의 · 어휘·어법 5대 행동영역 기반 문항 자동화 엔진
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <button
            onClick={() => setIsPrivacyModalOpen(true)}
            className="inline-flex items-center space-x-1.5 hover:text-blue-400 hover:underline transition cursor-pointer py-1 px-1.5 rounded"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>개인정보 처리방침 안내(팝업)</span>
          </button>
          <span>•</span>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 hover:underline transition"
          >
            개인정보처리방침 전문(새창)
          </a>
          <span>•</span>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 hover:underline transition"
          >
            이용약관
          </a>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        apiKey={customApiKey}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaveApiKey={(key) => setCustomApiKey(key)}
        onSave={(key) => setCustomApiKey(key)}
      />
    </div>
  );
}
