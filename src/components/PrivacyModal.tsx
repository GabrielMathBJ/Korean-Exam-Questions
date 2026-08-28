import React from 'react';
import { ShieldCheck, X, Lock, CheckCircle, FileText, Database, UserCheck, AlertTriangle } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                개인정보 처리방침 및 데이터 보호 안내
              </h2>
              <p className="text-xs text-slate-500">
                에듀집(Edzip) 및 교육데이터 보안 가이드라인 준수
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700 leading-relaxed">
          
          {/* Key Summary Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-emerald-900 text-sm">
                개인정보 무수집·무저장 안내
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800">
                본 프로그램은 교원 및 교육 종사자를 위한 순수 문항 출제·편집 도구로, <strong>학생 및 사용자의 이름, 학번, 답안, 성적, 연락처 등 일체의 개인식별정보를 수집하거나 서버 데이터베이스에 영구 저장하지 않습니다.</strong>
              </p>
            </div>
          </div>

          {/* Section 1: 처리하는 데이터 범위 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              1. 데이터 처리 및 보관 방식
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs sm:text-sm bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <li><strong>지문 및 문항 데이터</strong>: 출제 및 시험지 인쇄를 위해 입력된 국어 지문과 설정값은 브라우저 세션 및 AI 요청 시에만 일시적으로 처리되며 별도의 회원 DB에 저장되지 않습니다.</li>
              <li><strong>로컬 브라우저 처리</strong>: 편집 중인 문항, 시험지 미리보기 및 PDF 변환은 이용자의 브라우저 내에서 안전하게 실시간 처리됩니다.</li>
            </ul>
          </div>

          {/* Section 2: AI 모델 API 연동 안내 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              2. AI API 통신 보안
            </h4>
            <p className="text-xs sm:text-sm text-slate-600">
              문항 생성 요청 시 입력된 지문 텍스트는 암호화된 전송 구간(HTTPS / TLS 1.3)을 통해 Google Cloud Run 서버 프록시를 거쳐 Gemini API로 전송되며, API 키는 서버 내부에 안전하게 격리되어 외부에 일체 노출되지 않습니다.
            </p>
          </div>

          {/* Section 3: 이용자 권리 및 책임자 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              3. 개인정보 보호 문의 및 안내
            </h4>
            <div className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
              <p>• <strong>개발 및 서비스</strong>: Gabriel Byeongje Jeon (국어교과 문항 출제기)</p>
              <p>• <strong>문의 이메일</strong>: gabriel@senedu.kr</p>
              <p>• <strong>목적</strong>: 한국교육과정평가원 수능 5대 행동영역 기반 문항 연구 및 수업 자료 지원</p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            KICE 국어과 교육과정 평가도구
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
