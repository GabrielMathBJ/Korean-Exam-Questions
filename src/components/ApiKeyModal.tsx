import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, ExternalLink, X, Check, Trash2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
  onSave?: (key: string) => void;
  onSaveApiKey?: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey = '',
  onSave,
  onSaveApiKey,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Sync state when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') || '' : '';
      setInputKey(stored || apiKey || '');
      setStatusMessage(null);
    }
  }, [isOpen, apiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = inputKey.trim();
    
    // Save to localStorage directly
    try {
      if (trimmed) {
        localStorage.setItem('user_gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('user_gemini_api_key');
      }
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }

    // Call callbacks
    if (typeof onSave === 'function') onSave(trimmed);
    if (typeof onSaveApiKey === 'function') onSaveApiKey(trimmed);

    setStatusMessage({
      type: 'success',
      text: trimmed ? '개인 Gemini API 키가 성공적으로 저장 및 적용되었습니다!' : '기본 서버 API 키로 복원되었습니다.',
    });

    // Auto-close after brief confirmation
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setInputKey('');
    try {
      localStorage.removeItem('user_gemini_api_key');
    } catch (e) {
      // ignore
    }
    if (typeof onSave === 'function') onSave('');
    if (typeof onSaveApiKey === 'function') onSaveApiKey('');
    setStatusMessage({ type: 'success', text: 'API 키가 삭제되었습니다. 기본 서버 키가 사용됩니다.' });
  };

  // Test the key connection live
  const handleTestKey = async () => {
    const keyToTest = inputKey.trim();
    if (!keyToTest) {
      setStatusMessage({ type: 'error', text: '테스트할 API 키를 먼저 입력해 주세요.' });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/gemini/test-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': keyToTest,
        },
        body: JSON.stringify({ customApiKey: keyToTest }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: '✅ API 키가 유효하며 정상 작동합니다! (모델: ' + (data.model || 'Gemini 2.5 Flash') + ')',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: '❌ 키 검증 실패: ' + (data.error || '유효하지 않은 API 키입니다.'),
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: '❌ 연결 테스트 오류: ' + (err.message || '서버 응답을 확인하지 못했습니다.'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const hasCurrentStoredKey = Boolean(typeof window !== 'undefined' && localStorage.getItem('user_gemini_api_key'));

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
              <p className="text-xs text-slate-400">개인 API 키를 등록하여 안정적으로 OCR 및 문항을 생성합니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm text-slate-700">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-blue-950">안전한 브라우저 로컬 저장</p>
              <p className="text-blue-800">
                입력하신 API 키는 브라우저 로컬 저장소(LocalStorage)에만 안전하게 보관되며, AI 모델 호출 시에만 전송됩니다.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Gemini API Key (AIzaSy...)
              </label>
              {hasCurrentStoredKey && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 사용 중
                </span>
              )}
            </div>
            
            <div className="relative">
              <input
                id="gemini-api-key-input"
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy... 형식의 API 키를 입력하세요"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || !inputKey.trim()}
                className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    키 검증 중...
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5 text-slate-600" />
                    연결 상태 테스트
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400">
                미입력 시 기본 서버 키가 자동 사용됩니다.
              </p>
            </div>
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

          {/* Status Message feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          {inputKey || hasCurrentStoredKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              키 초기화 (기본값)
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
