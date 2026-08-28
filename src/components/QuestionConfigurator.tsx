import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  CheckCircle,
  Sparkles,
  BookOpen,
  HelpCircle,
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Target,
} from 'lucide-react';
import { QuestionConfig, QuestionStyle, BehavioralDomain, RubricItem } from '../types';

export type PresetType =
  | 'reading_standard'
  | 'literature_standard'
  | 'killer_focus'
  | 'cross_genre_integrated'
  | 'vocabulary_matrix'
  | 'school_exam'
  | 'comprehensive'
  | 'custom';

interface QuestionConfiguratorProps {
  questionConfigs: QuestionConfig[];
  setQuestionConfigs: React.Dispatch<React.SetStateAction<QuestionConfig[]>>;
  customInstructions: string;
  setCustomInstructions: (inst: string) => void;
  passageCategory: string;
}

// Function to generate tailored KICE CSAT specifications for ANY given question count (1 to 6)
export function generateConfigsForPresetAndCount(
  presetType: PresetType,
  targetCount: number,
  category: string = '독서'
): QuestionConfig[] {
  const count = Math.min(Math.max(1, targetCount), 6);
  const configs: QuestionConfig[] = [];
  const isLiterature = category.includes('문학');

  for (let i = 0; i < count; i++) {
    const qNum = i + 1;
    const baseId = `cfg-${Date.now()}-${qNum}`;

    if (presetType === 'cross_genre_integrated') {
      // 독서-문학 융합 연계 세트 (비문학 이론 ↔ 문학 작품 상호텍스트 분석)
      if (qNum === 1) {
        configs.push({
          id: baseId,
          questionNumber: 1,
          style: 'multiple_choice',
          behavioralDomain: 'factual',
          difficulty: 'medium',
          points: 2,
          requireBogi: false,
          targetSection: '지문의 핵심 이론 및 미학적·철학적 전개 방식 파악',
        });
      } else if (qNum === 2) {
        configs.push({
          id: baseId,
          questionNumber: 2,
          style: 'multiple_choice',
          behavioralDomain: 'inferential',
          difficulty: 'high',
          points: 2,
          requireBogi: false,
          targetSection: '핵심 개념([A] 또는 ㉠~㉤)의 다단계 인과 사슬 및 함축 의미 추론',
        });
      } else if (qNum === 3) {
        configs.push({
          id: baseId,
          questionNumber: 3,
          style: 'multiple_choice',
          behavioralDomain: 'cross_genre',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '<보 기>에 제시된 문학 작품(시/소설)을 윗글의 핵심 이론 관점에서 심층 감상 [3점]',
          specialType: 'cross_genre',
        });
      } else if (qNum === 4) {
        configs.push({
          id: baseId,
          questionNumber: 4,
          style: 'multiple_choice',
          behavioralDomain: 'critical',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '<보 기>의 문학 비평 이론을 바탕으로 윗글의 논지를 비판적으로 평가 [3점]',
        });
      } else if (qNum === 5) {
        configs.push({
          id: baseId,
          questionNumber: 5,
          style: 'multiple_choice',
          behavioralDomain: 'table_matrix',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '<보 기>의 [비문학 개념 vs 문학 형상화 비교 매트릭스 표] 빈칸 완성 [3점]',
          specialType: 'table_matrix',
        });
      } else {
        configs.push({
          id: baseId,
          questionNumber: 6,
          style: 'multiple_choice',
          behavioralDomain: 'cross_genre',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '두 제재 간 상호텍스트적 심층 융합 분석 [3점]',
          specialType: 'cross_genre',
        });
      }
    } else if (presetType === 'vocabulary_matrix') {
      // 단어/어휘 도표 및 개념 비교 매트릭스 특화 세트
      if (qNum === 1) {
        configs.push({
          id: baseId,
          questionNumber: 1,
          style: 'multiple_choice',
          behavioralDomain: 'factual',
          difficulty: 'medium',
          points: 2,
          requireBogi: false,
          targetSection: '지문의 핵심 사실 확인 및 개념 정의 이해',
        });
      } else if (qNum === 2) {
        configs.push({
          id: baseId,
          questionNumber: 2,
          style: 'multiple_choice',
          behavioralDomain: 'table_matrix',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '<보 기>의 [개념 간 속성 비교 매트릭스 도표] 빈칸 ㉮~㉰ 완성 [3점]',
          specialType: 'table_matrix',
        });
      } else if (qNum === 3) {
        configs.push({
          id: baseId,
          questionNumber: 3,
          style: 'multiple_choice',
          behavioralDomain: 'table_matrix',
          difficulty: 'medium',
          points: 2,
          requireBogi: true,
          targetSection: '<보 기>의 [어휘 의미 관계도 및 사전적 다의어 분석표] 탐구',
          specialType: 'table_matrix',
        });
      } else if (qNum === 4) {
        configs.push({
          id: baseId,
          questionNumber: 4,
          style: 'multiple_choice',
          behavioralDomain: 'application',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '<보 기>의 새로운 데이터/상황 모델에 지문 원리 적용 [3점]',
        });
      } else if (qNum === 5) {
        configs.push({
          id: baseId,
          questionNumber: 5,
          style: 'multiple_choice',
          behavioralDomain: 'vocabulary',
          difficulty: 'medium',
          points: 2,
          requireBogi: false,
          targetSection: '문맥상 ⓐ~ⓔ의 유의어/반의어 및 문법적 범주 판별',
        });
      } else {
        configs.push({
          id: baseId,
          questionNumber: 6,
          style: 'multiple_choice',
          behavioralDomain: 'table_matrix',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '<보 기>의 복합 문법 체계표 및 조건 분석 [3점]',
          specialType: 'table_matrix',
        });
      }
    } else if (presetType === 'reading_standard' || (presetType === 'custom' && !isLiterature)) {
      if (qNum === 1) {
        configs.push({
          id: baseId,
          questionNumber: 1,
          style: 'multiple_choice',
          behavioralDomain: 'factual',
          difficulty: 'medium',
          points: 2,
          requireBogi: false,
          targetSection: '전체 지문 (글의 내용 전개 방식 및 세부 논리 구조 확인)',
        });
      } else if (qNum === 2) {
        configs.push({
          id: baseId,
          questionNumber: 2,
          style: 'multiple_choice',
          behavioralDomain: 'inferential',
          difficulty: 'high',
          points: 2,
          requireBogi: false,
          targetSection: '핵심 개념([A] 또는 ㉠~㉤)의 다단계 인과관계 및 전제 추론',
        });
      } else if (qNum === 3) {
        configs.push({
          id: baseId,
          questionNumber: 3,
          style: 'multiple_choice',
          behavioralDomain: 'application',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '<보 기>를 활용한 구체적 상황/새로운 가상 사례 및 데이터 심화 적용 [3점]',
        });
      } else if (qNum === 4) {
        if (count === 4) {
          configs.push({
            id: baseId,
            questionNumber: 4,
            style: 'multiple_choice',
            behavioralDomain: 'vocabulary',
            difficulty: 'low',
            points: 2,
            requireBogi: false,
            targetSection: '문맥상 ⓐ~ⓔ의 유의어 또는 사전적 의미 및 어법',
          });
        } else {
          configs.push({
            id: baseId,
            questionNumber: 4,
            style: 'multiple_choice',
            behavioralDomain: 'critical',
            difficulty: 'high',
            points: 3,
            requireBogi: true,
            targetSection: '글쓴이의 관점에서 <보기>의 상반된 학설/주장 비판 및 평가 [3점]',
          });
        }
      } else if (qNum === 5) {
        configs.push({
          id: baseId,
          questionNumber: 5,
          style: 'multiple_choice',
          behavioralDomain: 'vocabulary',
          difficulty: 'low',
          points: 2,
          requireBogi: false,
          targetSection: '문맥상 ⓐ~ⓔ와 가장 가까운 의미로 쓰인 것 (어휘·어법)',
        });
      } else {
        configs.push({
          id: baseId,
          questionNumber: 6,
          style: 'multiple_choice',
          behavioralDomain: 'critical',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '지문의 숨겨진 전제 및 논리적 타당성 종합 검증 [3점]',
        });
      }
    } else if (presetType === 'literature_standard' || (presetType === 'custom' && isLiterature)) {
      if (qNum === 1) {
        configs.push({
          id: baseId,
          questionNumber: 1,
          style: 'multiple_choice',
          behavioralDomain: 'factual',
          difficulty: 'medium',
          points: 2,
          requireBogi: false,
          targetSection: '작품의 표현상/서술상 특징 및 시상 전개 방식',
        });
      } else if (qNum === 2) {
        configs.push({
          id: baseId,
          questionNumber: 2,
          style: 'multiple_choice',
          behavioralDomain: 'inferential',
          difficulty: 'medium',
          points: 2,
          requireBogi: false,
          targetSection: '시어/구절 ㉠~㉤의 문맥적 함축 의미 및 인물의 심리·태도 추론',
        });
      } else if (qNum === 3) {
        configs.push({
          id: baseId,
          questionNumber: 3,
          style: 'multiple_choice',
          behavioralDomain: 'critical',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '<보 기> 외적 준거(비평문/창작 배경)를 바탕으로 한 종합적 감상 [3점]',
        });
      } else if (qNum === 4) {
        configs.push({
          id: baseId,
          questionNumber: 4,
          style: 'multiple_choice',
          behavioralDomain: 'application',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '[A]와 [B]의 공간적 배경 대비 및 화자/등장인물 간의 갈등 양상 비교',
        });
      } else if (qNum === 5) {
        configs.push({
          id: baseId,
          questionNumber: 5,
          style: 'multiple_choice',
          behavioralDomain: 'vocabulary',
          difficulty: 'low',
          points: 2,
          requireBogi: false,
          targetSection: '문맥적 어휘의 의미 관계 및 관용적 표현',
        });
      } else {
        configs.push({
          id: baseId,
          questionNumber: 6,
          style: 'multiple_choice',
          behavioralDomain: 'cross_genre',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '다른 갈래 및 비문학 비평과의 심층 융합 비교 감상 [3점]',
          specialType: 'cross_genre',
        });
      }
    } else if (presetType === 'killer_focus') {
      // 수능 1등급 킬러 변별력 집중 세트 (3점 위주)
      if (qNum === 1) {
        configs.push({
          id: baseId,
          questionNumber: 1,
          style: 'multiple_choice',
          behavioralDomain: 'critical',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '지문의 핵심 전제와 논리적 오류를 비판적으로 검토 [3점]',
        });
      } else if (qNum === 2) {
        configs.push({
          id: baseId,
          questionNumber: 2,
          style: 'multiple_choice',
          behavioralDomain: 'application',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '<보기>의 복합 가상 데이터/실험 결과 및 신유형 상황 모델에의 심화 적용 [3점]',
        });
      } else if (qNum === 3) {
        configs.push({
          id: baseId,
          questionNumber: 3,
          style: 'multiple_choice',
          behavioralDomain: 'cross_genre',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '<보기> 문학/인문 텍스트 연계 심층 융합 추론 [3점]',
          specialType: 'cross_genre',
        });
      } else {
        configs.push({
          id: baseId,
          questionNumber: qNum,
          style: 'multiple_choice',
          behavioralDomain: qNum % 2 === 0 ? 'table_matrix' : 'critical',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: `고난도 변별력 심화 탐구 <보기> 연계 문항 [${qNum}번, 3점]`,
        });
      }
    } else if (presetType === 'school_exam') {
      // 내신 / 서술형 혼합 세트 (선다형 + 서술형 + 채점기준표)
      if (qNum === count) {
        configs.push({
          id: baseId,
          questionNumber: qNum,
          style: 'descriptive',
          behavioralDomain: 'inferential',
          difficulty: 'high',
          points: 5,
          requireBogi: false,
          targetSection: '지문의 핵심 주장 2가지 및 개념 원리 조건부 서술형 (채점표 포함)',
          enableCustomRubric: true,
          customRubric: [
            { criteria: '지문에서 제시된 핵심 논지 및 개념 2가지를 명확히 제시함', allocatedPoints: 3 },
            { criteria: '주장의 타당한 논리적 근거를 지문 문맥에 부합하게 설명함', allocatedPoints: 1 },
            { criteria: '조건(어절 수 준수, 완결된 문장 어미)을 정확히 지켜 서술함', allocatedPoints: 1 },
          ],
          rubricNotes: '문장 종결 어미 (~다) 필수, 맞춤법 및 비문 발생 시 감점',
        });
      } else if (qNum === 1) {
        configs.push({
          id: baseId,
          questionNumber: 1,
          style: 'multiple_choice',
          behavioralDomain: 'factual',
          difficulty: 'medium',
          points: 2,
          requireBogi: false,
          targetSection: '지문의 세부 사실 및 내용 일치/불일치',
        });
      } else if (qNum === 2) {
        configs.push({
          id: baseId,
          questionNumber: 2,
          style: 'multiple_choice',
          behavioralDomain: 'table_matrix',
          difficulty: 'high',
          points: 3,
          requireBogi: true,
          targetSection: '<보기>의 개념 도표/체계표 빈칸 완성 [3점]',
          specialType: 'table_matrix',
        });
      } else if (qNum === 3) {
        configs.push({
          id: baseId,
          questionNumber: 3,
          style: 'multiple_choice',
          behavioralDomain: 'inferential',
          difficulty: 'medium',
          points: 2,
          requireBogi: false,
          targetSection: '밑줄 친 ㉠~㉤의 문맥적 의미 및 글쓴이의 의도 추론',
        });
      } else {
        configs.push({
          id: baseId,
          questionNumber: qNum,
          style: 'multiple_choice',
          behavioralDomain: 'vocabulary',
          difficulty: 'low',
          points: 2,
          requireBogi: false,
          targetSection: '지문 속 핵심 한자어 및 문맥적 어휘 이해',
        });
      }
    } else if (presetType === 'comprehensive') {
      // 수능 모의평가 풀세트 균형 배분
      const domains: BehavioralDomain[] = ['factual', 'inferential', 'table_matrix', 'cross_genre', 'critical', 'vocabulary'];
      const pointsList = [2, 2, 3, 3, 3, 2];
      const bogiList = [false, false, true, true, true, false];
      const targets = [
        '내용 전개 방식 및 핵심 사실 확인',
        '핵심 개념 [A]에 대한 심층 추론',
        '<보기> 개념 비교 매트릭스 도표 분석 [3점]',
        '<보기> 비문학-문학 융합 연계 심층 감상 [3점]',
        '글쓴이의 관점에서 <보기> 비판 및 평가 [3점]',
        '문맥상 ⓐ~ⓔ의 사전적/문맥적 의미 (어휘)',
      ];
      configs.push({
        id: baseId,
        questionNumber: qNum,
        style: 'multiple_choice',
        behavioralDomain: domains[i % domains.length],
        difficulty: pointsList[i % pointsList.length] >= 3 ? 'high' : 'medium',
        points: pointsList[i % pointsList.length],
        requireBogi: bogiList[i % bogiList.length],
        targetSection: targets[i % targets.length],
      });
    }
  }

  return configs;
}

export const QuestionConfigurator: React.FC<QuestionConfiguratorProps> = ({
  questionConfigs,
  setQuestionConfigs,
  customInstructions,
  setCustomInstructions,
  passageCategory,
}) => {
  const [activePreset, setActivePreset] = useState<PresetType>('reading_standard');
  const count = questionConfigs.length;

  // Whenever user clicks a preset, apply the preset tailored for the CURRENT count
  const handleSelectPreset = (preset: PresetType) => {
    setActivePreset(preset);
    const newConfigs = generateConfigsForPresetAndCount(preset, count, passageCategory);
    setQuestionConfigs(newConfigs);
  };

  // When user changes the count (1 ~ 6), apply the CURRENT preset tailored for the NEW count
  const handleCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 6) return;
    const newConfigs = generateConfigsForPresetAndCount(activePreset, newCount, passageCategory);
    setQuestionConfigs(newConfigs);
  };

  const updateConfig = (index: number, updates: Partial<QuestionConfig>) => {
    // If user manually updates an item, mark as custom or maintain state
    setQuestionConfigs((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const next = { ...item, ...updates };

        // If switching to descriptive and no custom rubric initialized, supply template
        if (updates.style === 'descriptive' && !next.customRubric) {
          next.customRubric = [
            { criteria: '지문의 핵심 논지 및 핵심 개념 2가지를 정확히 서술함', allocatedPoints: 2 },
            { criteria: '조건에 맞는 완결된 문장 구조로 서술함', allocatedPoints: 1 },
          ];
          next.enableCustomRubric = true;
          next.points = 3;
        }

        return next;
      })
    );
  };

  // Rubric helpers for descriptive questions
  const handleAddRubricItem = (cfgIndex: number) => {
    const current = questionConfigs[cfgIndex];
    const existing = current.customRubric || [];
    const newRubric: RubricItem[] = [
      ...existing,
      { criteria: `평가 요소 ${existing.length + 1} 서술`, allocatedPoints: 1 },
    ];
    const totalPoints = newRubric.reduce((sum, r) => sum + r.allocatedPoints, 0);
    updateConfig(cfgIndex, {
      customRubric: newRubric,
      enableCustomRubric: true,
      points: totalPoints > 0 ? totalPoints : current.points,
    });
  };

  const handleUpdateRubricItem = (
    cfgIndex: number,
    itemIndex: number,
    updates: Partial<RubricItem>
  ) => {
    const current = questionConfigs[cfgIndex];
    const existing = current.customRubric || [];
    const newRubric = existing.map((r, i) => (i === itemIndex ? { ...r, ...updates } : r));
    const totalPoints = newRubric.reduce((sum, r) => sum + (Number(r.allocatedPoints) || 0), 0);
    updateConfig(cfgIndex, {
      customRubric: newRubric,
      points: totalPoints > 0 ? totalPoints : current.points,
    });
  };

  const handleRemoveRubricItem = (cfgIndex: number, itemIndex: number) => {
    const current = questionConfigs[cfgIndex];
    const existing = current.customRubric || [];
    if (existing.length <= 1) {
      alert('최소 1개의 채점 기준 항목이 필요합니다.');
      return;
    }
    const newRubric = existing.filter((_, i) => i !== itemIndex);
    const totalPoints = newRubric.reduce((sum, r) => sum + (Number(r.allocatedPoints) || 0), 0);
    updateConfig(cfgIndex, {
      customRubric: newRubric,
      points: totalPoints > 0 ? totalPoints : current.points,
    });
  };

  // Preset information dictionary
  const PRESET_INFOS: Array<{
    type: PresetType;
    icon: string;
    title: string;
    description: string;
    badge: string;
  }> = [
    {
      type: 'reading_standard',
      icon: '🎯',
      title: '수능 독서(비문학) 표준형',
      description: '전개방식 → 인과추론 → <보기>적용 → 비판/어휘',
      badge: '평가원 표준',
    },
    {
      type: 'literature_standard',
      icon: '📚',
      title: '수능 문학(시·소설) 표준형',
      description: '서술·표현특징 → 시어·인물추론 → <보기>외적준거 감상',
      badge: '문학 표준',
    },
    {
      type: 'killer_focus',
      icon: '⚡',
      title: '수능 1등급 킬러형',
      description: '3점 배점 집중, 반론 비판 및 가상 데이터 심화 적용',
      badge: '고난도 3점',
    },
    {
      type: 'cross_genre_integrated',
      icon: '🔗',
      title: '독서·문학 융합 연계형',
      description: '비문학 이론 ↔ <보기> 문학 작품(시/소설) 심층 융합 분석',
      badge: '수능 신유형',
    },
    {
      type: 'vocabulary_matrix',
      icon: '📊',
      title: '어휘·개념 도표 매트릭스형',
      description: '<보기> 개념 비교 매트릭스 표 및 어휘 관계도 탐구',
      badge: '도표 특화',
    },
    {
      type: 'school_exam',
      icon: '📝',
      title: '학교 내신 / 서술형 혼합형',
      description: '선다형 + 서술형 논술 문항 (채점기준표 자동 생성)',
      badge: '서술형 포함',
    },
    {
      type: 'comprehensive',
      icon: '🌟',
      title: '수능 5대 영역 종합형',
      description: '사실·추론·도표·융합·비판·어휘 5대 행동영역 완벽 배분',
      badge: '전영역 균형',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              2. 문항 출제 스펙 및 문항 수 세팅 (Item Configuration)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              문항 수를 선택하면 수능 국어 5대 행동영역(사실, 추론, 비판, 적용, 어휘·어법)에 맞게 최적의 출제 스펙이 자동으로 재구성됩니다.
            </p>
          </div>
        </div>

        {/* Question Count Selector Buttons */}
        <div className="flex items-center space-x-2 bg-white px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs">
          <span className="text-sm font-bold text-slate-800">문항 수:</span>
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleCountChange(num)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-sm sm:text-base font-bold transition flex items-center justify-center cursor-pointer ${
                  count === num
                    ? 'bg-blue-600 text-white shadow-xs scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
                title={`${num}문항으로 변경 및 출제 스펙 자동 최적화`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Preset Packages - Adaptive to the selected question count */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>출제 스펙 프리셋 선택 (현재 {count}문항 맞춤 적용)</span>
            </label>
            <span className="text-xs sm:text-sm text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              현재: {count}문항 세트 구성 중
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESET_INFOS.map((p) => {
              const isSelected = activePreset === p.type;
              return (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => handleSelectPreset(p.type)}
                  className={`p-3.5 text-left rounded-xl text-sm transition border relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{p.icon}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.badge}
                      </span>
                    </div>
                    <div className={`font-bold text-sm sm:text-base ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                      {p.title}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug">
                      {p.description}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs sm:text-sm font-semibold">
                    <span className={isSelected ? 'text-blue-700 font-bold' : 'text-slate-500'}>
                      {count}문항 즉시 적용
                    </span>
                    <span className={isSelected ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                      {isSelected ? '✓ 적용됨' : '선택 →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Add Custom Question Type Toolbar */}
        <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>특화 문항 빠른 추가 (최대 6문항):</span>
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={questionConfigs.length >= 6}
                onClick={() => {
                  if (questionConfigs.length >= 6) return;
                  const newNum = questionConfigs.length + 1;
                  setQuestionConfigs([
                    ...questionConfigs,
                    {
                      id: `cfg-${Date.now()}-${newNum}`,
                      questionNumber: newNum,
                      style: 'multiple_choice',
                      behavioralDomain: 'table_matrix',
                      difficulty: 'high',
                      points: 3,
                      requireBogi: true,
                      targetSection: '<보 기>의 [개념 간 속성 비교 매트릭스 도표] 빈칸 ㉮~㉰ 분석 [3점]',
                      specialType: 'table_matrix',
                    },
                  ]);
                }}
                className="text-xs sm:text-sm font-bold px-3 py-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-emerald-900 border border-slate-300 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                + 📊 어휘·개념 도표 문항
              </button>

              <button
                type="button"
                disabled={questionConfigs.length >= 6}
                onClick={() => {
                  if (questionConfigs.length >= 6) return;
                  const newNum = questionConfigs.length + 1;
                  setQuestionConfigs([
                    ...questionConfigs,
                    {
                      id: `cfg-${Date.now()}-${newNum}`,
                      questionNumber: newNum,
                      style: 'multiple_choice',
                      behavioralDomain: 'cross_genre',
                      difficulty: 'high',
                      points: 3,
                      requireBogi: true,
                      targetSection: '<보 기>의 문학 작품(시/소설)을 윗글의 핵심 이론으로 심층 감상 [3점]',
                      specialType: 'cross_genre',
                    },
                  ]);
                }}
                className="text-xs sm:text-sm font-bold px-3 py-1.5 bg-white hover:bg-purple-50 hover:text-purple-800 hover:border-purple-300 text-purple-900 border border-slate-300 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                + 🔗 독서-문학 융합 연계 문항
              </button>

              <button
                type="button"
                disabled={questionConfigs.length >= 6}
                onClick={() => {
                  if (questionConfigs.length >= 6) return;
                  const newNum = questionConfigs.length + 1;
                  setQuestionConfigs([
                    ...questionConfigs,
                    {
                      id: `cfg-${Date.now()}-${newNum}`,
                      questionNumber: newNum,
                      style: 'multiple_choice',
                      behavioralDomain: 'critical',
                      difficulty: 'high',
                      points: 3,
                      requireBogi: true,
                      targetSection: '글쓴이의 관점에서 <보기>의 상반된 학설/주장 비판 및 평가 [3점]',
                    },
                  ]);
                }}
                className="text-xs sm:text-sm font-bold px-3 py-1.5 bg-white hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-amber-900 border border-slate-300 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                + ⚡ 1등급 킬러 3점 문항
              </button>
            </div>
          </div>
        </div>

        {/* Item-by-item Cards */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider">
              문항별 출제 스펙 상세 설정 ({questionConfigs.length}문항)
            </label>
            <div className="flex items-center space-x-3 text-xs sm:text-sm">
              <span className="text-slate-600">
                총 배점: <strong className="text-slate-900 font-bold text-sm sm:text-base">{questionConfigs.reduce((acc, c) => acc + (c.points || 0), 0)}</strong>점
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-blue-700 font-bold">
                3점 고난도: {questionConfigs.filter((c) => (c.points || 0) >= 3).length}문항
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {questionConfigs.map((cfg, idx) => {
              const isDescriptive = cfg.style === 'descriptive';
              const rubricList = cfg.customRubric || [
                { criteria: '지문의 핵심 개념 및 논지 서술', allocatedPoints: 2 },
                { criteria: '조건에 맞는 정확한 표현', allocatedPoints: 1 },
              ];
              const rubricSum = rubricList.reduce((sum, r) => sum + (Number(r.allocatedPoints) || 0), 0);

              const domainLabel =
                cfg.behavioralDomain === 'factual'
                  ? '사실적 이해'
                  : cfg.behavioralDomain === 'inferential'
                  ? '추론적 이해'
                  : cfg.behavioralDomain === 'application'
                  ? '적용/창의'
                  : cfg.behavioralDomain === 'critical'
                  ? '비판적 이해'
                  : cfg.behavioralDomain === 'cross_genre'
                  ? '독서·문학 융합'
                  : cfg.behavioralDomain === 'table_matrix'
                  ? '어휘·개념 도표'
                  : '어휘·어법';

              return (
                <div
                  key={cfg.id || idx}
                  className={`border rounded-xl p-4 sm:p-5 transition shadow-2xs space-y-3.5 ${
                    isDescriptive
                      ? 'bg-amber-50/30 border-amber-200 hover:border-amber-400'
                      : cfg.behavioralDomain === 'cross_genre'
                      ? 'bg-purple-50/30 border-purple-200 hover:border-purple-400'
                      : cfg.behavioralDomain === 'table_matrix'
                      ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-400'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span
                        className={`w-7 h-7 rounded-full text-white font-bold text-sm flex items-center justify-center ${
                          isDescriptive
                            ? 'bg-amber-600'
                            : cfg.behavioralDomain === 'cross_genre'
                            ? 'bg-purple-600'
                            : cfg.behavioralDomain === 'table_matrix'
                            ? 'bg-emerald-600'
                            : 'bg-blue-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-base sm:text-lg text-slate-900">
                        [ {idx + 1}번 문항 ]
                      </span>
                      {isDescriptive ? (
                        <span className="text-xs sm:text-sm font-semibold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded border border-amber-300">
                          서술형 문항
                        </span>
                      ) : (
                        <span
                          className={`text-xs sm:text-sm font-medium px-2.5 py-0.5 rounded ${
                            cfg.behavioralDomain === 'cross_genre'
                              ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300'
                              : cfg.behavioralDomain === 'table_matrix'
                              ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                              : 'bg-slate-200/80 text-slate-800'
                          }`}
                        >
                          {domainLabel}
                        </span>
                      )}
                      {cfg.requireBogi && (
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200">
                          &lt;보기&gt; 연계
                        </span>
                      )}
                      {cfg.points >= 3 && (
                        <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                          3점 고변별력
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Points selector */}
                      <div className="flex items-center space-x-1 text-xs sm:text-sm">
                        <span className="text-slate-600 font-bold">배점:</span>
                        {[2, 3, 4, 5].map((pt) => (
                          <button
                            key={pt}
                            type="button"
                            onClick={() => updateConfig(idx, { points: pt, difficulty: pt >= 3 ? 'high' : 'medium' })}
                            className={`px-2.5 py-1 rounded font-bold transition cursor-pointer ${
                              cfg.points === pt
                                ? pt >= 3
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'bg-slate-800 text-white'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {pt}점
                          </button>
                        ))}
                      </div>

                      {questionConfigs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setQuestionConfigs(questionConfigs.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                          title="문항 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Style */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        문제 유형 (Format)
                      </label>
                      <select
                        value={cfg.style || 'multiple_choice'}
                        onChange={(e) => updateConfig(idx, { style: e.target.value as QuestionStyle })}
                        className="w-full text-sm sm:text-base px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                      >
                        <option value="multiple_choice">5지선다형 (수능 표준)</option>
                        <option value="descriptive">서술형 (내신/수행평가+채점표)</option>
                        <option value="short_answer">단답형</option>
                      </select>
                    </div>

                    {/* Behavioral Domain */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        수능 행동 영역 (평가 목표)
                      </label>
                      <select
                        value={cfg.behavioralDomain || 'factual'}
                        onChange={(e) => {
                          const domain = e.target.value as BehavioralDomain;
                          const updates: Partial<QuestionConfig> = { behavioralDomain: domain };
                          if (domain === 'table_matrix') {
                            updates.requireBogi = true;
                            updates.specialType = 'table_matrix';
                            if (!cfg.targetSection || cfg.targetSection.includes('전체')) {
                              updates.targetSection = '<보기> 개념 비교 매트릭스 도표 빈칸 완성 [3점]';
                            }
                          } else if (domain === 'cross_genre') {
                            updates.requireBogi = true;
                            updates.points = 3;
                            updates.difficulty = 'high';
                            updates.specialType = 'cross_genre';
                            if (!cfg.targetSection || cfg.targetSection.includes('전체')) {
                              updates.targetSection = '<보기> 문학 작품을 윗글의 이론으로 심층 감상 [3점]';
                            }
                          }
                          updateConfig(idx, updates);
                        }}
                        className="w-full text-sm sm:text-base px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                      >
                        <option value="factual">사실적 이해 (내용 전개 방식 / 세부 정보 일치)</option>
                        <option value="inferential">추론적 이해 (문맥적 의미 / [A]와 [B] 비교 추론)</option>
                        <option value="application">적용/창의 (&lt;보기&gt; 구체적 상황 / 가상 사례 적용)</option>
                        <option value="critical">비판적 이해 (글쓴이 관점 비판 / 논리적 타당성 [3점])</option>
                        <option value="cross_genre">독서·문학 융합 연계 (비문학 이론 ↔ 문학 작품 심층 감상 [3점])</option>
                        <option value="table_matrix">어휘·개념 도표 및 매트릭스 분석 (도표/체계표/관계도)</option>
                        <option value="vocabulary">어휘·어법 (문맥상 ⓐ~ⓔ 유의어 / 사전적 의미 / 어법)</option>
                      </select>
                    </div>

                    {/* Target Scope & Bogi */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                        출제 범위 & &lt;보 기&gt; 여부
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={cfg.targetSection || ''}
                          onChange={(e) => updateConfig(idx, { targetSection: e.target.value })}
                          placeholder="예: 전체 지문, [A], ㉠~㉤"
                          className="flex-1 text-sm sm:text-base px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-slate-900"
                        />
                        <label className="flex items-center space-x-1.5 text-sm text-slate-800 cursor-pointer select-none whitespace-nowrap bg-white px-2.5 py-2 border border-slate-300 rounded-lg">
                          <input
                            type="checkbox"
                            checked={cfg.requireBogi}
                            onChange={(e) => updateConfig(idx, { requireBogi: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-bold text-blue-900">&lt;보기&gt;</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTIVE RUBRIC SECTION (서술형 선택 시 활성화되는 채점 기준표 입력창) */}
                  {isDescriptive && (
                    <div className="mt-3.5 p-4 bg-white border border-amber-300 rounded-xl space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-amber-600" />
                          <span className="text-sm font-bold text-slate-900">
                            서술형 채점 기준표 (Rubric) 설정
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-2 text-xs sm:text-sm text-amber-950 cursor-pointer font-bold select-none">
                            <input
                              type="checkbox"
                              checked={cfg.enableCustomRubric !== false}
                              onChange={(e) => updateConfig(idx, { enableCustomRubric: e.target.checked })}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>채점 기준 직접 작성 및 지정</span>
                          </label>
                        </div>
                      </div>

                      {cfg.enableCustomRubric !== false ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
                            <span>
                              평가 요소별 기준과 배점을 직접 입력하세요. (합계: <strong className="text-amber-800 font-bold">{rubricSum}점</strong> / 문항 배점: {cfg.points}점)
                            </span>
                            {rubricSum !== cfg.points && (
                              <button
                                type="button"
                                onClick={() => updateConfig(idx, { points: rubricSum })}
                                className="text-blue-600 hover:text-blue-800 font-bold underline text-xs sm:text-sm cursor-pointer"
                              >
                                문항 배점을 채점표 합계({rubricSum}점)와 동기화
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            {rubricList.map((rubricItem, rIdx) => (
                              <div
                                key={rIdx}
                                className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                              >
                                <span className="text-sm font-bold text-slate-600 w-6 text-center">
                                  {rIdx + 1}.
                                </span>
                                <input
                                  type="text"
                                  value={rubricItem?.criteria || ''}
                                  onChange={(e) =>
                                    handleUpdateRubricItem(idx, rIdx, { criteria: e.target.value })
                                  }
                                  placeholder="예: 지문에 제시된 핵심 개념 2가지 정확히 서술"
                                  className="flex-1 text-sm sm:text-base px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-amber-500 text-slate-900"
                                />
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-xs sm:text-sm text-slate-600 font-medium">배점:</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={rubricItem?.allocatedPoints ?? 1}
                                    onChange={(e) =>
                                      handleUpdateRubricItem(idx, rIdx, {
                                        allocatedPoints: Math.max(1, Number(e.target.value) || 1),
                                      })
                                    }
                                    className="w-16 text-sm font-bold text-center px-2 py-2 border border-slate-300 rounded-md bg-white text-blue-700"
                                  />
                                  <span className="text-sm text-slate-700 font-medium">점</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRubricItem(idx, rIdx)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                  title="기준 삭제"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddRubricItem(idx)}
                              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>채점 기준 항목 추가</span>
                            </button>

                            <div className="flex-1 max-w-sm">
                              <input
                                type="text"
                                value={cfg.rubricNotes || ''}
                                onChange={(e) => updateConfig(idx, { rubricNotes: e.target.value })}
                                placeholder="추가 조건 (예: 50자 이내, 필수 어휘 포함, 완결된 문장 등)"
                                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-md bg-white placeholder:text-slate-400 text-slate-900"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg text-xs sm:text-sm text-amber-950 border border-amber-200">
                          <span className="text-slate-700">
                            💡 AI가 지문과 발문에 최적화된 서술형 모범 답안 및 단계별 채점 기준표를 자동으로 생성합니다.
                          </span>
                          <button
                            type="button"
                            onClick={() => updateConfig(idx, { enableCustomRubric: true })}
                            className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-900 font-bold transition text-xs sm:text-sm cursor-pointer"
                          >
                            직접 작성하기
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom prompt notes & High Rigor Quick Chips */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="block text-sm font-bold text-slate-800">
              출제위원 특별 요청사항 (선택)
            </label>
            <span className="text-xs sm:text-sm text-blue-700 font-semibold">
              💡 아래 수능 특화 정밀 출제 옵션을 클릭하여 바로 적용할 수 있습니다.
            </span>
          </div>
          <input
            type="text"
            value={customInstructions || ''}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="예: EBS 수능특강 연계 문항 스타일로 출제해줘 / 2번 문항의 오답 선지에 매력적인 함정을 강화해줘 등"
            className="w-full text-sm sm:text-base px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-slate-400 text-slate-900"
          />

          {/* Quick CSAT Rigor Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              '🔥 고난도 변별력 극대화 (수능 1등급 킬러급)',
              '🎯 평가원식 5대 오답 함정(인과 전도, 주체 혼동) 정교화',
              '📊 <보기>에 가상 실험/데이터/상반된 학설 연계',
              '🧠 미시적 인과관계 및 숨겨진 전제 추론 강화',
              '✨ 수능 본시험 스타일의 정제된 발문 및 선지 길이 균형',
            ].map((chipText) => (
              <button
                key={chipText}
                type="button"
                onClick={() => {
                  if (!customInstructions) {
                    setCustomInstructions(chipText);
                  } else if (!customInstructions.includes(chipText)) {
                    setCustomInstructions(`${customInstructions} / ${chipText}`);
                  }
                }}
                className="text-xs sm:text-sm px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-800 rounded-full border border-slate-300 transition font-medium cursor-pointer"
              >
                + {chipText}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


