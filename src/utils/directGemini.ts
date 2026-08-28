/**
 * Direct Client-Side Google Gemini REST API Fallback
 * Used when backend serverless functions time out, 404, or fail on external hosting (Vercel/Static).
 */

import { GeneratedExamData, QuestionConfig } from '../types';

export async function generateExamDirect(params: {
  apiKey: string;
  passageText: string;
  passageCategory?: string;
  questionConfigs: QuestionConfig[];
  customInstructions?: string;
}): Promise<GeneratedExamData> {
  const { apiKey, passageText, passageCategory, questionConfigs, customInstructions } = params;

  const configDescriptions = (questionConfigs || []).map((cfg, index) => {
    const qNum = cfg.questionNumber || index + 1;
    const isDescriptive = cfg.style === 'descriptive';
    const styleName = cfg.style === 'multiple_choice' ? '5지선다형 (수능 표준)' : isDescriptive ? '서술형 (내신/수행평가용)' : '단답형';
    const domainNameMap: Record<string, string> = {
      factual: '사실적 이해 (내용 일치/불일치, 세부 사실 확인)',
      inferential: '추론적 이해 (문맥적 의미, 다단계 인과 추론)',
      critical: '비판적 이해 (관점의 타당성, 반론 제기, 작품 평가 [3점])',
      application: '적용/창의 (<보기>의 새로운 가상 사례/상황 모델에 지문 원리 적용 [3점])',
      vocabulary: '어휘·어법 (문맥상 의미, 사전적 의미, 문법 규범)',
      cross_genre: '독서·문학 융합 연계 (<보기>에 문학 작품(시/소설) 제시하여 심층 융합 감상 [3점])',
      table_matrix: '어휘·개념 도표 매트릭스 (<보기>에 ASCII 그리드 표 제시하여 빈칸 ㉮~㉰ 및 속성 판별)',
    };
    const domainName = domainNameMap[cfg.behavioralDomain] || cfg.behavioralDomain || '사실적 이해';
    const isTableMatrix = cfg.behavioralDomain === 'table_matrix' || cfg.specialType === 'table_matrix';
    const isCrossGenre = cfg.behavioralDomain === 'cross_genre' || cfg.specialType === 'cross_genre';

    let specialReq = '';
    if (isTableMatrix) {
      specialReq = '\n  * [도표/매트릭스 지침]: <보기> 내에 가독성 높은 ASCII 격자 표를 포함하십시오.';
    } else if (isCrossGenre) {
      specialReq = '\n  * [융합 지침]: <보기> 내에 지문과 연계된 문학 작품(시/소설)을 수록하십시오.';
    }

    const bogiReq = (cfg.requireBogi || isTableMatrix || isCrossGenre) ? '반드시 <보기> 박스 포함' : '보기 선택';
    const targetSec = cfg.targetSection ? `[출제 범위: ${cfg.targetSection}]` : '[출제 범위: 전체]';
    const pts = cfg.points || (cfg.difficulty === 'high' || isCrossGenre ? 3 : 2);

    return `[문항 ${qNum}]
- 유형: ${styleName}
- 행동 영역: ${domainName}
- 배점: ${pts}점
- 보기: ${bogiReq}
- 세부: ${targetSec}${specialReq}`;
  }).join('\n\n');

  const prompt = `당신은 한국교육과정평가원(KICE) 수능 국어영역 수석 출제위원입니다.
제시된 지문을 바탕으로 다음 출제 스펙에 맞춰 총 ${questionConfigs.length}개의 고품질 수능 기출 스타일 문항 세트를 출제하십시오.

[지문]
${passageText}

${passageCategory ? `[분류]: ${passageCategory}` : ''}
${customInstructions ? `[요청사항]: ${customInstructions}` : ''}

[문항별 출제 스펙]
${configDescriptions}

반드시 다음 JSON 형식으로만 응답해 주세요:
{
  "id": "exam-${Date.now()}",
  "title": "2026학년도 대학수학능력시험 대비 국어영역 기출 변형 모의평가",
  "createdAt": "${new Date().toISOString()}",
  "passageTitle": "지문 제목",
  "passageCategory": "독서",
  "passageSubcategory": "인문·철학",
  "passageText": "정제된 지문 전문",
  "passageAnalysis": {
    "theme": "지문 핵심 주제",
    "structureSummary": "문단별 전개 요약",
    "keyConcepts": ["개념1", "개념2"],
    "readabilityLevel": "고3 수능 표준"
  },
  "questions": [
    {
      "id": "q-1",
      "questionNumber": 1,
      "stem": "수능 표준 발문",
      "points": 2,
      "style": "multiple_choice",
      "behavioralDomain": "factual",
      "difficulty": "medium",
      "targetReference": "전체",
      "bogiContent": "<보 기> 내용 (없으면 빈문자열)",
      "options": ["① 선지1", "② 선지2", "③ 선지3", "④ 선지4", "⑤ 선지5"],
      "correctAnswer": "③",
      "intention": "출제 의도",
      "passageEvidence": "정답 근거",
      "detailedExplanation": "종합 해설",
      "optionAnalyses": [
        { "optionNumber": 1, "text": "선지 1", "isCorrect": false, "distractorTrapType": "인과 전도", "explanation": "오답 이유" },
        { "optionNumber": 2, "text": "선지 2", "isCorrect": false, "distractorTrapType": "주체 혼동", "explanation": "오답 이유" },
        { "optionNumber": 3, "text": "선지 3", "isCorrect": true, "distractorTrapType": "정답", "explanation": "정답 이유" },
        { "optionNumber": 4, "text": "선지 4", "isCorrect": false, "distractorTrapType": "과도한 일반화", "explanation": "오답 이유" },
        { "optionNumber": 5, "text": "선지 5", "isCorrect": false, "distractorTrapType": "반대 진술", "explanation": "오답 이유" }
      ]
    }
  ]
}`;

  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.25,
            },
          }),
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('AI 모델 응답 텍스트가 비어있습니다.');

      const cleanJson = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('문항 생성 데이터 형식이 올바르지 않습니다.');
      }
      return parsed as GeneratedExamData;
    } catch (err: any) {
      lastError = err;
      console.warn(`Direct model ${model} failed, trying next:`, err);
    }
  }

  throw lastError || new Error('직접 Google API를 통한 문항 생성에 실패했습니다.');
}
