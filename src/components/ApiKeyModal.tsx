import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, ExternalLink, X, Check, Trash2, AlertCircle, RefreshCw, CheckCircle2, Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Sync state whenever modal opens or apiKey prop changes
  useEffect(() => {
    if (isOpen) {
      let storedKey = '';
      try {
        storedKey = localStorage.getItem('user_gemini_api_key') || '';
      } catch (e) {
        console.warn('LocalStorage read error:', e);
      }
      setInputKey(storedKey || apiKey || '');
      setStatusMessage(null);
      setIsSaved(false);
    }
  }, [isOpen, apiKey]);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const trimmed = inputKey.trim();

    // 1. Direct LocalStorage save
    try {
      if (trimmed) {
        localStorage.setItem('user_gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('user_gemini_api_key');
      }
      // Broadcast event
      window.dispatchEvent(new CustomEvent('geminiApiKeyUpdated', { detail: trimmed }));
    } catch (err) {
      console.warn('LocalStorage write error:', err);
    }

    // 2. Call parent callbacks
    if (typeof onSave === 'function') {
      try { onSave(trimmed); } catch (e) { console.error(e); }
    }
    if (typeof onSaveApiKey === 'function') {
      try { onSaveApiKey(trimmed); } catch (e) { console.error(e); }
    }

    setIsSaved(true);
    setStatusMessage({
      type: 'success',
      text: trimmed ? '✅ 개인 Gemini API 키가 성공적으로 저장 및 적용되었습니다!' : '기본 서버 API 키로 설정되었습니다.',
    });

    // Auto-close after short visual feedback
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setInputKey('');
    try {
      localStorage.removeItem('user_gemini_api_key');
      window.dispatchEvent(new CustomEvent('geminiApiKeyUpdated', { detail: '' }));
    } catch (e) {
      // ignore
    }
    if (typeof onSave === 'function') onSave('');
    if (typeof onSaveApiKey === 'function') onSaveApiKey('');
    setStatusMessage({ type: 'success', text: 'API 키가 삭제되었습니다. 기본 서버 키가 사용됩니다.' });
  };

  // Test the key live
  const handleTestKey = async () => {
    const keyToTest = inputKey.trim();
    if (!keyToTest) {
      setStatusMessage({ type: 'error', text: '테스트할 API 키를 먼저 입력해 주세요.' });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    // 1. Format guidance check (Google AI Studio: AIza..., Google Cloud / Vertex: AQ... etc.)
    const isRecognizedGoogleKey = keyToTest.startsWith('AIza') || keyToTest.startsWith('AQ') || keyToTest.length >= 20;

    try {
      // Step 1: Try server backend test
      let serverPassed = false;
      let serverError = '';

      try {
        const res = await fetch('/api/gemini/test-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-api-key': keyToTest,
          },
          body: JSON.stringify({ customApiKey: keyToTest }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            serverPassed = true;
          } else {
            serverError = data.error || '';
          }
        }
      } catch (err: any) {
        console.warn('Server test-key route failed, testing direct Google API:', err);
      }

      if (serverPassed) {
        setStatusMessage({
          type: 'success',
          text: '✅ API 키가 유효하며 정상 작동합니다! (Gemini Flash 모델 연결 성공)',
        });
        return;
      }

      // Step 2: Direct Google Gemini API test (Zero-failure fallback on Vercel/Static hosting)
      const googleRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash?key=${encodeURIComponent(keyToTest)}`
      );

      if (googleRes.ok) {
        setStatusMessage({
          type: 'success',
          text: '✅ Google Gemini 서버와 정상 연결되었습니다! (API 키 인증 완료)',
        });
      } else {
        const errorData = await googleRes.json().catch(() => null);
        const googleMsg = errorData?.error?.message || serverError || '유효하지 않은 API 키입니다.';
        
        let customHint = '';
        if (!isRecognizedGoogleKey) {
          customHint = ' (💡 안내: Google API 키는 주로 AIza... 또는 AQ... 등의 형식입니다)';
        }

        setStatusMessage({
          type: 'error',
          text: `❌ 키 검증 실패: ${googleMsg}${customHint}`,
        });
      }
    } catch (err: any) {
      console.error('API key verification error:', err);
      setStatusMessage({
        type: 'error',
        text: `❌ 연결 확인 실패: 네트워크 상태를 확인하시거나 키가 올바른지 확인해 주세요.${!isRecognizedGoogleKey ? ' (Google API 키는 AIza... 또는 AQ... 형식입니다)' : ''}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const hasCurrentStoredKey = Boolean(
    typeof window !== 'undefined' && localStorage.getItem('user_gemini_api_key')
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="api-key-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Google Gemini API 키 설정</h3>
              <p className="text-xs text-slate-400">개인 API 키를 등록하여 안정적으로 문항을 출제합니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-sm text-slate-700">
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-950">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <p className="font-bold text-blue-900">안전한 브라우저 로컬 저장</p>
              <p className="text-blue-800">
                입력하신 API 키는 사용자의 브라우저 로컬 저장소(LocalStorage)에만 안전하게 보관되며, AI 모델 호출 시에만 사용됩니다.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="gemini-api-key-input" className="block text-xs font-bold text-slate-800">
                Gemini API Key (Google AI Studio / Cloud)
              </label>
              {hasCurrentStoredKey && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 현재 적용 중
                </span>
              )}
            </div>
            
            <div className="relative flex items-center">
              <input
                id="gemini-api-key-input"
                type={showPassword ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setIsSaved(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                placeholder="Google Gemini API 키 (AIzaSy..., AQ... 등)를 입력하세요"
                autoComplete="off"
                spellCheck="false"
                className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                title={showPassword ? '키 숨기기' : '키 보기'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Standard keys often start with AIza... or AQ...; do not warn if it starts with either or is verified */}
            {inputKey.trim().length > 5 &&
              !inputKey.trim().startsWith('AIza') &&
              !inputKey.trim().startsWith('AQ') &&
              statusMessage?.type !== 'success' && (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-1.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>안내:</strong> Google Gemini API 키는 주로 <code>AIza...</code> 또는 <code>AQ...</code> 형식으로 시작합니다. 아래 <strong>[연결 상태 테스트]</strong> 버튼을 눌러 정상 작동 여부를 확인하실 수 있습니다.
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || !inputKey.trim()}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
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

              <p className="text-xs text-slate-500">
                등록된 키가 없을 경우 서버의 기본 환경변수 키로 동작합니다.
              </p>
            </div>
          </div>

          {/* AI Studio free link */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>API 키가 없으신가요?</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              Google AI Studio에서 무료 발급받기
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Status feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : 'bg-red-50 border border-red-300 text-red-800'
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

          {/* Footer Actions */}
          <div className="bg-slate-50 -mx-6 -mb-6 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between mt-4">
            {inputKey || hasCurrentStoredKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                키 초기화
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
                id="save-api-key-submit-btn"
                type="submit"
                className={`px-4 py-2 text-xs sm:text-sm font-bold text-white rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isSaved
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Check className="w-4 h-4" />
                {isSaved ? '저장 완료!' : '저장 및 적용'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
