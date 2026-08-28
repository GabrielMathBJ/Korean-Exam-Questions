import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, ExternalLink, X, Check, Trash2, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = inputKey.trim();
    onSaveApiKey(trimmed);
    setShowSavedMsg(true);
    setTimeout(() => {
      setShowSavedMsg(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setInputKey('');
    onSaveApiKey('');
    setShowSavedMsg(true);
    setTimeout(() => {
      setShowSavedMsg(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="api-key-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scaleIn"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Google Gemini API 키 설정</h3>
              <p className="text-xs text-slate-400">개인 API 키를 등록하여 안정적으로 문항을 출제합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm text-slate-700">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-blue-950">안전한 브라우저 로컬 저장</p>
              <p className="text-blue-800">
                입력하신 API 키는 사용자의 브라우저 로컬 저장소(LocalStorage)에만 안전하게 보관되며, AI 모델 호출 시에만 사용됩니다.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Gemini API Key (AIzaSy...)
            </label>
            <div className="relative">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy... 형식의 API 키를 입력하세요"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 text-slate-900"
              />
            </div>
            {apiKey ? (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <Check className="w-3.5 h-3.5" /> 현재 개인 API 키가 등록되어 사용 중입니다.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                등록된 키가 없을 경우 서버의 기본 환경변수 키로 동작합니다.
              </p>
            )}
          </div>

          {/* Guide link */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>API 키가 없으신가요?</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Google AI Studio에서 무료 발급받기
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {showSavedMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              API 키 설정이 저장되었습니다.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          {apiKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              키 삭제 (기본값 복원)
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              저장 및 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
