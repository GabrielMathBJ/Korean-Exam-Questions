import React from 'react';
import { BookOpen, FileText, CheckCircle2, Award, Edit3, Sparkles, Printer, Key, Settings } from 'lucide-react';

interface NavbarProps {
  activeTab: 'generator' | 'paper' | 'explanation' | 'editor';
  setActiveTab: (tab: 'generator' | 'paper' | 'explanation' | 'editor') => void;
  hasGeneratedExam: boolean;
  onQuickPrint?: () => void;
  questionCount: number;
  hasCustomApiKey?: boolean;
  onOpenApiKeyModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasGeneratedExam,
  onQuickPrint,
  questionCount,
  hasCustomApiKey = false,
  onOpenApiKeyModal,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-inner border border-blue-400/30 shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  국어교과 문항 출제기
                </h1>
                <span className="bg-blue-500/20 text-blue-300 text-xs sm:text-sm px-2 py-0.5 rounded font-medium border border-blue-400/30">
                  KICE 표준
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded font-medium border border-emerald-400/30 hidden lg:inline-block">
                  Dev: Gabriel Byeongje Jeon
                </span>
              </div>
              <p className="text-[13px] text-slate-400 hidden sm:block leading-snug">
                한국교육과정평가원 수능 국어 5대 행동영역 평가 프레임워크 탑재<br />
                Dev by Gabriel Byeongje Jeon
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1">
            <button
              id="tab-generator-btn"
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 whitespace-nowrap ${
                activeTab === 'generator'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span>문항 출제</span>
            </button>

            <button
              id="tab-paper-btn"
              onClick={() => setActiveTab('paper')}
              disabled={!hasGeneratedExam}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 whitespace-nowrap ${
                !hasGeneratedExam
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : activeTab === 'paper'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>출제 문항지</span>
              {hasGeneratedExam && (
                <span className="ml-1 bg-blue-400/20 text-blue-200 text-[11px] px-1.5 py-0.5 rounded-full font-bold">
                  {questionCount}
                </span>
              )}
            </button>

            <button
              id="tab-explanation-btn"
              onClick={() => setActiveTab('explanation')}
              disabled={!hasGeneratedExam}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 whitespace-nowrap ${
                !hasGeneratedExam
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : activeTab === 'explanation'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>정답 및 심층해설</span>
            </button>

            <button
              id="tab-editor-btn"
              onClick={() => setActiveTab('editor')}
              disabled={!hasGeneratedExam}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors shrink-0 whitespace-nowrap ${
                !hasGeneratedExam
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : activeTab === 'editor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              <span>출제위원 편집실</span>
            </button>
          </nav>

          {/* Action on right */}
          <div className="flex items-center space-x-2">
            {onOpenApiKeyModal && (
              <button
                id="api-key-config-btn"
                type="button"
                onClick={onOpenApiKeyModal}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition border ${
                  hasCustomApiKey
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="개인 Gemini API 키 설정"
              >
                <Key className={`w-3.5 h-3.5 ${hasCustomApiKey ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">API 키 설정</span>
                <span className="sm:hidden">API 키</span>
                {hasCustomApiKey && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            )}

            {hasGeneratedExam && (
              <button
                onClick={onQuickPrint}
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs sm:text-sm font-medium transition"
                title="수능 시험지 양식 인쇄 및 PDF 저장"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>시험지 인쇄</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
