export type QuestionStyle = 'multiple_choice' | 'descriptive' | 'short_answer';

export type BehavioralDomain = 
  | 'factual'       // 사실적 이해 (내용 일치/불일치, 세부 정보)
  | 'inferential'   // 추론적 이해 (문맥, 전제, 심리/태도)
  | 'critical'      // 비판적 이해 (관점 평가, 타당성, 반론 제기)
  | 'application'   // 적용/창의 (<보기> 적용, 구체적 가상 사례)
  | 'vocabulary'    // 어휘·어법 (문맥적 의미, 사전적 의미, 어법)
  | 'cross_genre'   // 독서·문학 융합 연계 (비문학 이론 ↔ 문학 작품 심층 분석)
  | 'table_matrix'; // 어휘·개념 도표 및 매트릭스 분석 (도표, 어휘 관계도, 개념 비교표)

export type PassageCategory = 'reading' | 'literature' | 'speech_writing' | 'language_media';

export type ReadingSubcategory = 'humanities' | 'society' | 'science' | 'technology' | 'arts' | 'integrated';
export type LiteratureSubcategory = 'modern_poetry' | 'classical_poetry' | 'modern_novel' | 'classical_novel' | 'play_essay' | 'composite';

export interface QuestionConfig {
  id: string;
  questionNumber: number;
  style: QuestionStyle;
  behavioralDomain: BehavioralDomain;
  difficulty: 'high' | 'medium' | 'low';
  points: 2 | 3 | number;
  requireBogi: boolean;
  targetSection?: string; // e.g. "전체 지문", "[A]", "㉠~㉤", "ⓐ~ⓔ", "독서-문학 연계 <보기>", "어휘/개념 비교 도표"
  specialType?: 'standard' | 'table_matrix' | 'cross_genre' | 'killer_logic';
  // For descriptive custom rubric
  enableCustomRubric?: boolean;
  customRubric?: RubricItem[];
  rubricNotes?: string; // 작성 조건 및 유의사항 (예: "30자 내외, 필수 키워드 포함")
}

export interface OptionAnalysis {
  optionNumber: number;
  text: string;
  isCorrect: boolean;
  explanation: string;
  distractorTrapType?: string; // e.g. "인과관계 왜곡", "지문 내용 반대", "과도한 일반화"
}

export interface RubricItem {
  criteria: string;
  allocatedPoints: number;
}

export interface GeneratedQuestion {
  id: string;
  questionNumber: number;
  stem: string; // 발문 (e.g. 윗글에 대한 이해로 가장 적절한 것은?)
  points: number;
  style: QuestionStyle;
  behavioralDomain: BehavioralDomain;
  difficulty: 'high' | 'medium' | 'low';
  targetReference?: string; // e.g. [A], ㉠
  bogiContent?: string; // <보 기> 내용 (있을 경우)
  options?: string[]; // 5지선다 선지 목록 (① ~ ⑤)
  correctAnswer: string; // "①" ~ "⑤" or 단답형/서술형 정답
  intention: string; // 출제 의도 및 평가 목표
  passageEvidence: string; // 지문 내 정답의 직접적 근거
  detailedExplanation: string; // 종합 해설
  optionAnalyses?: OptionAnalysis[]; // 선지별 분석
  // For descriptive questions:
  modelAnswer?: string;
  rubric?: RubricItem[];
}

export interface GeneratedExamData {
  id: string;
  title: string;
  createdAt: string;
  passageTitle: string;
  passageCategory: string;
  passageSubcategory: string;
  passageText: string;
  passageAnalysis: {
    theme: string;
    structureSummary: string;
    keyConcepts: string[];
    readabilityLevel: string;
  };
  questions: GeneratedQuestion[];
}

export interface SamplePassage {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  source: string;
  text: string;
  recommendedQuestionConfigs: QuestionConfig[];
}
