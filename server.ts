import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
  // Content Security Policy allowing required assets, Google fonts, and inline styles for preview
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-ancestors 'self' https:;"
  );
  next();
});

// Body parser middleware with large payload limit for base64 images/pdf
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// URL normalization middleware for Vercel Serverless Function rewrites
app.use((req, res, next) => {
  if (req.url.startsWith("/api/index.ts")) {
    req.url = req.url.replace(/^\/api\/index\.ts/, "") || "/";
  }
  // Strip trailing query params if formatted improperly
  if (req.url.startsWith("/api/index?")) {
    req.url = req.url.replace(/^\/api\/index\?/, "/?") || "/";
  }
  next();
});

// Lazy getter for Google GenAI client
let defaultAiClient: GoogleGenAI | null = null;

function getAI(customApiKey?: string): GoogleGenAI {
  const apiKey = (customApiKey && typeof customApiKey === "string" && customApiKey.trim().length > 0)
    ? customApiKey.trim()
    : process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "Gemini API 키가 설정되지 않았습니다. 우측 상단의 [⚙️ API 키 설정]에서 개인 Gemini API 키(AIzaSy...)를 등록해 주세요."
    );
  }

  // If custom key is provided, create a fresh client instance for this key
  if (customApiKey && customApiKey.trim().length > 0) {
    return new GoogleGenAI({
      apiKey: customApiKey.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  if (!defaultAiClient) {
    defaultAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return defaultAiClient;
}

// Helper to safely parse JSON from Gemini model output
function safeJsonParse<T = any>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      let clean = raw.trim();
      // Strip markdown code fences
      if (clean.includes("```")) {
        clean = clean.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      }
      // Find JSON object/array boundaries
      const firstCurly = clean.indexOf("{");
      const firstBracket = clean.indexOf("[");
      
      let startIdx = -1;
      let endIdx = -1;

      if (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) {
        startIdx = firstCurly;
        endIdx = clean.lastIndexOf("}");
      } else if (firstBracket !== -1) {
        startIdx = firstBracket;
        endIdx = clean.lastIndexOf("]");
      }

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        clean = clean.substring(startIdx, endIdx + 1);
      }

      return JSON.parse(clean);
    } catch (err) {
      console.error("Safe JSON parsing fallback failed:", err);
      return fallback;
    }
  }
}

// Safe API invocation with Exponential Backoff and Multi-Model Fallback
// Shields against temporary 503 UNAVAILABLE (High demand) and 429 rate limit spikes
async function generateContentWithRetry(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const primaryModel = options.preferredModel || "gemini-3.7-flash";
  const modelCandidates = [
    primaryModel,
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
  ].filter((v, i, a) => a.indexOf(v) === i); // unique

  let lastError: any = null;

  for (const model of modelCandidates) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || "").toLowerCase();
        const errStatus = String(err?.status || "").toUpperCase();
        const errCode = Number(err?.code || (typeof err?.status === "number" ? err.status : 0));
        
        // If API key is explicitly invalid, do not waste time retrying other models
        if (
          errMsg.includes("api key") ||
          errMsg.includes("api_key") ||
          errMsg.includes("unauthenticated") ||
          errMsg.includes("permission_denied") ||
          errCode === 401 ||
          errCode === 403
        ) {
          throw new Error("입력하신 Gemini API 키가 유효하지 않거나 권한이 없습니다. 상단 [API 키 설정]에서 올바른 키(AIzaSy...)를 입력해 주세요.");
        }

        const isTemporary =
          errCode === 503 ||
          errCode === 429 ||
          errCode === 500 ||
          errStatus === "UNAVAILABLE" ||
          errStatus === "RESOURCE_EXHAUSTED" ||
          errStatus.includes("503") ||
          errStatus.includes("429") ||
          errMsg.includes("high demand") ||
          errMsg.includes("unavailable") ||
          errMsg.includes("overloaded") ||
          errMsg.includes("rate limit") ||
          errMsg.includes("quota") ||
          errMsg.includes("resource_exhausted");

        console.log(`[Gemini API Retry/Fallback] Model ${model} (attempt ${attempt}) transient status:`, errMsg.slice(0, 120));

        if (isTemporary && attempt < 2) {
          // Quick wait before next try
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          // Move directly to next candidate model
          break;
        }
      }
    }
  }

  // Format friendly error messages
  const finalMsg = String(lastError?.message || "");
  if (finalMsg.toLowerCase().includes("quota") || finalMsg.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("Gemini API 호출 한도(Quota)가 초과되었습니다. 잠시 후 다시 시도하시거나 상단 [API 키 설정]에서 개인 API 키를 등록해 주세요.");
  }

  throw lastError || new Error("Gemini API 호출에 실패했습니다.");
}

// System prompt embodying Senior KICE CSAT Korean Language Arts Item Developer
const KICE_SYSTEM_PROMPT = `당신은 한국교육과정평가원(KICE) 대학수학능력시험 국어영역(독서·문학·언매·화작) 수석 출제위원이자 출제기획단 최고 권위자입니다.
제시된 지문을 학술적·논리적으로 정밀하게 분석하여 실제 수능 본시험 및 평가원 모의평가(6월·9월) 최고난도(1등급 변별용 킬러/준킬러) 기출문제와 완벽히 일치하는 고품격·고난도 문항 세트를 출제하십시오.

================================================================================
[대학수학능력시험 국어영역 최고난도 문항 출제 정밀 지침 (KICE CSAT Master Framework)]
================================================================================

1. 출제 수준 및 인지적 깊이 (수능 1등급 변별력 확보 - 절대 쉽게 출제하지 말 것):
   - 단순한 단어 찾기나 지문 문장의 단순 변형(기계적 일치)은 엄격히 배제합니다.
   - 글 전체의 거시적 논리 구조, 복합 인과 사슬(A→B→C), 숨겨진 전제 도출, 조건부 명제 검증, 상호텍스트적 비교, 새로운 가상 모델/데이터 적용 등 고차원적 사고력을 철저히 검증해야 합니다.
   - 선지를 읽었을 때 학생들이 지문의 전제와 논리적 맥락을 깊이 따져보아야만 오답과 정답을 가려낼 수 있도록 정교하게 설계하십시오.

2. [특화 문항 1] 단어/어휘 도표 및 개념 비교 매트릭스 활용 문항 (table_matrix):
   - <보기> 박스 내에 정교하고 가독성 높은 텍스트 표(ASCII / Unicode Grid Table) 또는 개념 관계도를 수능 양식 그대로 구성하십시오.
   - 예시 형태:
     * [개념 간 속성 비교 매트릭스 표]:
       ┌──────────────┬───────────────────┬───────────────────┐
       │ 구분         │ 개념 A (예: 직관) │ 개념 B (예: 사유) │
       ├──────────────┼───────────────────┼───────────────────┤
       │ 파악 매개체  │ ㉮                 │ 순수 논리적 개념  │
       │ 주요 속성    │ 감각적 매체 의존  │ ㉯                 │
       │ 실현 양상    │ 초기 자각 단계    │ ㉰                 │
       └──────────────┴───────────────────┴───────────────────┘
     * [어휘의 사전적/문맥적 의미 및 다의어/반의 관계 분석표]
     * [음운 변동 / 단어 형성 / 문법 범주 탐구 표]
   - 발문 예시: "윗글의 내용을 바탕으로 <보기>의 [탐구 활동표]를 완성하고자 한다. ㉮~㉰에 들어갈 내용으로 가장 적절한 것은?", "윗글의 어휘 ⓐ~ⓔ에 대해 <보기>의 도표를 바탕으로 탐구한 결과로 적절하지 않은 것은?"

3. [특화 문항 2] 비문학(독서) 지문과 문학 지문 연계 융합 문항 (cross_genre):
   - 비문학(인문/철학/미학/사회/과학) 지문인 경우:
     * <보기>에 지문의 핵심 미학/철학/사회학 이론과 깊이 연계되는 대표 문학 작품(현대시, 고전시가, 현대소설, 고전산문)의 시 전문이나 소설 본문 발췌문을 수록하십시오.
     * 발문: "윗글의 [핵심 이론/필자의 관점]을 바탕으로 <보기>의 [문학 작품(예: 윤동주 「자화상」 / 백석 「여승」)]을 감상한 내용으로 적절하지 않은 것은? [3점]"
   - 문학 지문인 경우:
     * <보기>에 작품의 창작 기법이나 서사 구조, 역사적·미학적 준거를 설명하는 심도 있는 비문학 비평 이론 텍스트를 수록하십시오.
     * 발문: "<보기>의 문학 비평 이론을 바탕으로 윗글의 작품을 분석한 것으로 가장 적절한 것은? [3점]"
   - 융합 복합 지문인 경우 ((가) 비문학 이론 + (나) 문학 작품):
     * 두 제재를 상호텍스트적으로 교차 분석하는 고난도 3점 연계 문항을 출제하십시오.

4. 발문(Stem)의 품격과 수능 표준성:
   - 평가원 공식 발문 양식을 100% 준수합니다:
     * [구조/전개]: "윗글의 내용 전개 방식(또는 서술상 특징)에 대한 설명으로 가장 적절한 것은?"
     * [사실/세부]: "윗글에서 알 수 있는 내용(또는 사실)으로 적절하지 않은 것은?"
     * [추론/비교]: "[A]와 [B]를 비교하여 이해한 내용으로 가장 적절한 것은?", "밑줄 친 ㉠~㉤의 문맥적 의미에 대한 이해로 적절하지 않은 것은?"
     * [적용/창의]: "윗글을 바탕으로 <보기>의 상황(또는 가상 데이터/사례)을 분석한 것으로 적절하지 않은 것은? [3점]", "<보기>의 탐구 활동에 지문의 원리를 적용한 결과로 가장 적절한 것은? [3점]"
     * [비판/평가]: "윗글의 '필자'가 <보기>의 '학자 A'에게 제기할 수 있는 비판(또는 반론)으로 가장 적절한 것은? [3점]", "<보기>의 관점에서 윗글의 핵심 주장을 평가한 내용으로 가장 적절한 것은? [3점]"
     * [도표/어휘]: "윗글을 바탕으로 <보기>의 도표를 완성할 때 ㉮~㉰에 들어갈 내용으로 가장 적절한 것은?", "문맥상 ⓐ~ⓔ와 바꾸어 쓰기에 가장 적절한 것은?"
     * [독서·문학 융합]: "윗글의 관점을 바탕으로 <보기>의 문학 작품을 감상한 내용으로 적절하지 않은 것은? [3점]"

5. 선지(Choices ①~⑤)의 정밀도 및 매력적인 오답(Distractor) 설계 원칙:
   - 모든 5지선다는 길이, 어미 톤(~ㄴ다, ~ㄹ 수 있다, ~에 해당한다), 문장 복잡도가 균형을 이루어야 합니다.
   - 정답 선지의 무결성: 정답 선지는 지문의 논리적 근거에 의해 100% 명확히 입증되어 복수정답 시비가 전혀 없어야 합니다.
   - 오답 선지(1~5번)의 매력적인 함정 설계 (평가원 5대 오답 매뉴얼 적용):
     ① [인과 전도 및 조건 왜곡]: 원인과 결과를 뒤바꾸거나, 특정 조건 하에서만 성립하는 것을 보편적 결론으로 왜곡
     ② [주체/대상/속성 교차 혼동]: 개념 A의 속성을 개념 B에 대입하거나 행위 주체와 대상을 은밀히 전도
     ③ [과도한 일반화 및 양화사 오류]: '일부'나 '가능성'을 '모든', '반드시'로 단정
     ④ [자의적 비약 및 부당한 전제]: 그럴듯한 상식이지만 지문의 전제로부터 도출될 수 없는 진술
     ⑤ [지문 논지와 정반대 진술]: 핵심 개념의 증감/방향성을 반대로 기술

6. <보 기> (Stimulus Box) 구성의 학술적 완성도:
   - 적용/비판/추론/융합 3점 문항의 <보기>는 단순 1줄 설명이 아닌, 실제 수능처럼 독립된 가상 사례, 학술적 대립 견해, 구체적 문학 텍스트, 구조화된 분석 도표를 갖춘 완성도 높은 단락으로 창작하십시오.

7. 지문 내 참조 기호 정합성:
   - 문항에서 [A], [B], ㉠~㉤, ⓐ~ⓔ 등의 기호를 참조하는 경우, 반환되는 최종 passageText 본문 내에도 해당 기호가 완벽한 위치에 자연스럽게 삽입되어 있어야 합니다.

8. 선지별 정밀 분석(optionAnalyses) 및 지문 근거(passageEvidence):
   - 정답의 명확한 문단 및 핵심 논리 근거를 명시하십시오.
   - ①번부터 ⑤번까지 각 선지가 왜 정답이고 왜 오답인지(오답의 함정 유형 명시)를 철저히 서술하십시오.
`;

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public Privacy Policy Endpoint for Edzip & Dorms crawlers
app.get("/privacy", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>개인정보 처리방침 - 국어교과 문항 출제기</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; }
    .container { background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; }
    h1 { color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; font-size: 24px; }
    h2 { color: #1e293b; margin-top: 24px; font-size: 18px; }
    p, li { font-size: 15px; }
    .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-size: 13px; font-weight: bold; }
    .box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 16px 0; color: #166534; }
  </style>
</head>
<body>
  <div class="container">
    <h1>개인정보 처리방침</h1>
    <span class="badge">에듀집(Edzip) 및 교육데이터 보안 가이드라인 준수</span>
    
    <div class="box">
      <strong>[핵심 고지: 개인정보 무수집·무저장]</strong><br>
      본 '국어교과 문항 출제기'는 교원을 위한 순수 문항 출제·편집 도구로서 학생 및 이용자의 이름, 학번, 성적, 연락처 등 일체의 개인식별정보를 수집하거나 서버 데이터베이스에 영구 저장하지 않습니다.
    </div>

    <h2>제1조 (개인정보의 처리 목적)</h2>
    <p>본 소프트웨어는 한국교육과정평가원 수능 5대 행동영역 기반의 국어영역 문항 생성 및 시험지 출력 목적으로만 작동하며, 개인정보를 수집·이용하지 않습니다.</p>

    <h2>제2조 (처리하는 데이터 항목 및 보관)</h2>
    <p>1. 출제를 위해 입력된 지문 및 설정값은 브라우저 세션 및 AI 요청 시에만 일시적으로 사용되며, 서버 DB에 저장되지 않고 즉시 파기됩니다.<br>
       2. 이용자의 시험지 편집 및 PDF 변환은 브라우저(클라이언트) 내부에서 실시간으로 처리됩니다.</p>

    <h2>제3조 (개인정보의 제3자 제공 및 위탁)</h2>
    <p>본 서비스는 이용자의 개인정보를 제3자에게 제공하지 않으며, 문항 생성을 위한 순수 텍스트 지문 데이터에 한하여 Google Cloud Run 서버를 통해 Gemini API와 암호화 통신(TLS 1.3)을 수행합니다.</p>

    <h2>제4조 (개인정보 안전성 확보 조치)</h2>
    <p>1. 통신 전 구간 암호화(HTTPS / TLS 1.3) 적용<br>
       2. API Key의 서버 측 안전 격리 (브라우저 노출 원천 차단)<br>
       3. 정기적인 dorms-check 보안 점검 및 KICE 수능 규범 준수</p>

    <h2>제5조 (개인정보 보호책임자 및 문의)</h2>
    <p>• 서비스명: 국어교과 문항 출제기 (개발: Gabriel Byeongje Jeon)<br>
       • 문의처: gabriel@senedu.kr</p>
  </div>
</body>
</html>`);
});

// Public Terms of Service Endpoint
app.get("/terms", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>이용약관 - 국어교과 문항 출제기</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; }
    .container { background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; }
    h1 { color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; font-size: 24px; }
    h2 { color: #1e293b; margin-top: 24px; font-size: 18px; }
    p, li { font-size: 15px; }
    .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 6px; font-size: 13px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>서비스 이용약관</h1>
    <span class="badge">KICE 국어과 교육과정 평가도구</span>

    <h2>제1조 (목적)</h2>
    <p>본 약관은 '국어교과 문항 출제기'(이하 "서비스")가 제공하는 교육용 국어 문항 자동 출제 및 시험지 생성 기능의 이용 조건 및 절차를 규정함을 목적으로 합니다.</p>

    <h2>제2조 (서비스의 제공 및 이용)</h2>
    <p>1. 본 서비스는 전국의 초·중·고 교원 및 교육 종사자의 수업 연구 및 평가 문항 제작을 지원하기 위해 무료로 제공됩니다.<br>
       2. 이용자는 입력한 지문 및 생성된 문항을 교육적 목적으로 자유롭게 편집, 인쇄 및 활용할 수 있습니다.</p>

    <h2>제3조 (저작권 및 책임의 한계)</h2>
    <p>1. 생성된 문항의 검토 및 최종 검증 책임은 출제 교원 본인에게 있습니다.<br>
       2. 본 서비스는 인공지능(AI) 기술을 기반으로 하므로, 실제 시험 출제 시 교육과정 부합성 및 정답의 무결성을 반드시 검토하시기 바랍니다.</p>

    <h2>제4조 (문의)</h2>
    <p>서비스와 관련된 오류 제보 및 문의는 gabriel@senedu.kr 로 연락주시기 바랍니다.</p>
  </div>
</body>
</html>`);
});

// API: Test Gemini API Key connectivity
app.post(["/api/gemini/test-key", "/gemini/test-key", "/api/test-key", "/test-key"], async (req, res) => {
  try {
    const customApiKey = (req.headers["x-gemini-api-key"] as string) || req.body?.customApiKey;
    const ai = getAI(customApiKey);

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: "ping",
    });

    if (response && response.text) {
      res.json({ success: true, model: "gemini-3.7-flash", message: "API 키가 정상적으로 인증되었습니다." });
    } else {
      res.json({ success: true, model: "gemini-3.7-flash" });
    }
  } catch (error: any) {
    console.error("API Key test error:", error);
    const errMsg = error?.message || "유효하지 않은 API 키이거나 권한이 없습니다.";
    res.status(200).json({ success: false, error: errMsg });
  }
});

// API: Extract/OCR passage from multimodal images/PDF
app.post(["/api/gemini/extract-passage", "/gemini/extract-passage", "/api/extract-passage", "/extract-passage"], async (req, res) => {
  try {
    const { images, textHint } = req.body;
    const customApiKey = (req.headers["x-gemini-api-key"] as string) || req.body?.customApiKey;
    const ai = getAI(customApiKey);

    const parts: any[] = [];
    
    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (!img || !img.base64) continue;
        const cleanBase64 = img.base64.replace(/^data:.*?;base64,/, "").trim();
        if (!cleanBase64) continue;

        parts.push({
          inlineData: {
            mimeType: img.mimeType || "image/jpeg",
            data: cleanBase64,
          },
        });
      }
    }

    const promptText = `제시된 파일(이미지/PDF)에서 국어영역 지문을 정밀하게 텍스트로 추출(OCR)하고 지문 정보를 분석해 주세요.
${textHint ? `참고 정보: ${textHint}` : ""}

반드시 아래 JSON 형식으로만 응답해 주세요:
{
  "title": "지문의 제목 또는 핵심 주제 (예: 헤겔의 미학과 절대정신)",
  "category": "독서 또는 문학 또는 화법과 작문 또는 언어와 매체",
  "subcategory": "인문/사회/과학/기술/예술/현대시/고전시가/현대소설/고전소설 등 세부 분류",
  "extractedText": "지문의 완전한 본문 텍스트 (문단 구분, (가)/(나) 구분, [A], ㉠, ⓐ 기호 등 수능 양식을 최대한 보존하여 정리)",
  "summary": "지문 핵심 요약 2~3줄"
}`;

    parts.push({ text: promptText });

    const response = await generateContentWithRetry(ai, {
      preferredModel: "gemini-3.7-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: "당신은 한국 수능 국어영역 지문 전문 디지털화 및 OCR 전문가입니다.",
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const outputText = response?.text || "{}";
    const parsed = safeJsonParse(outputText, {
      title: textHint || "수능 국어 지문",
      category: "독서",
      subcategory: "인문·철학",
      extractedText: "",
      summary: "",
    });

    // If JSON parsing yielded empty text but output has text, salvage it
    if (!parsed.extractedText && outputText && outputText.length > 30) {
      parsed.extractedText = outputText
        .replace(/```(?:json)?/gi, '')
        .replace(/```/g, '')
        .trim();
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Passage extraction error:", error);
    res.status(200).json({ 
      success: false, 
      error: error.message || "지문 OCR 추출 중 오류가 발생했습니다. 상단 [API 키 설정]에서 개인 Gemini API 키를 등록해 보시거나 다시 시도해 주세요." 
    });
  }
});

// API: Generate KICE CSAT Question Set
app.post(["/api/gemini/generate-exam", "/gemini/generate-exam", "/api/generate-exam", "/generate-exam"], async (req, res) => {
  try {
    const { passageText, images, passageCategory, questionConfigs, customInstructions } = req.body;
    const customApiKey = (req.headers["x-gemini-api-key"] as string) || req.body?.customApiKey;
    const ai = getAI(customApiKey);

    const parts: any[] = [];

    // Multimodal attachments if provided
    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (!img || !img.base64) continue;
        const cleanBase64 = img.base64.replace(/^data:.*?;base64,/, "").trim();
        if (!cleanBase64) continue;

        parts.push({
          inlineData: {
            mimeType: img.mimeType || "image/jpeg",
            data: cleanBase64,
          },
        });
      }
    }

    // Build question requirement specification
    const configDescriptions = (questionConfigs || []).map((cfg: any, index: number) => {
      const qNum = cfg.questionNumber || index + 1;
      const isDescriptive = cfg.style === "descriptive";
      const styleName = cfg.style === "multiple_choice" ? "5지선다형 (수능 표준)" : isDescriptive ? "서술형 (내신/수행평가용+채점기준표)" : "단답형";
      const domainNameMap: Record<string, string> = {
        factual: "사실적 이해 (내용 일치/불일치, 세부 사실 확인 - 단순 어구 일치가 아닌 지문 전체의 논리적 층위 파악)",
        inferential: "추론적 이해 (문맥적 의미 파악, 전제/결론 다단계 추론, 심리/태도 파악)",
        critical: "비판적 이해 (관점의 타당성, 논리적 오류 검토, 반론 제기, 작품 평가 [3점])",
        application: "적용/창의 (<보기>의 새로운 가상 사례/실험 데이터/상황 모델에 지문 원리 적용 [3점])",
        vocabulary: "어휘·어법 (문맥상 유의어/반의어, 사전적 의미, 문법 규범)",
        cross_genre: "독서·문학 융합 연계 (<보기>에 비문학 이론과 연계되는 문학 작품(시/소설) 또는 문학 비평 이론을 제시하여 상호텍스트적 심층 융합 분석 [3점])",
        table_matrix: "어휘·개념 도표 및 매트릭스 분석 (<보기>에 [개념 비교 매트릭스 표] 또는 [어휘 의미 관계도] 또는 [문법 체계표]를 ASCII 그리드 표 형태로 제시하여 빈칸 ㉮~㉰ 및 속성 진위 판별)",
      };
      const domainName = domainNameMap[cfg.behavioralDomain] || cfg.behavioralDomain || "사실적 이해";
      const isTableMatrix = cfg.behavioralDomain === "table_matrix" || cfg.specialType === "table_matrix";
      const isCrossGenre = cfg.behavioralDomain === "cross_genre" || cfg.specialType === "cross_genre";
      
      let specialReq = "";
      if (isTableMatrix) {
        specialReq = `\n  * [도표/매트릭스 필수 지침]: <보기> 내에 반드시 가독성 높은 텍스트 표(ASCII / Unicode Grid Table) 또는 개념 관계도를 포함하고, ㉮~㉰ 빈칸 완성 또는 행/열 속성 적절성을 묻는 발문과 선지를 구성하십시오.`;
      } else if (isCrossGenre) {
        specialReq = `\n  * [독서-문학 융합 연계 필수 지침]: <보기> 내에 지문과 밀접히 연계되는 구체적인 문학 작품 텍스트(시 전문 또는 소설 발췌) 혹은 비문학 미학/비평 이론 텍스트를 풍부하게 제시하고, 3점 배점의 심층 감상/분석 문항으로 출제하십시오.`;
      }

      const bogiReq = (cfg.requireBogi || isTableMatrix || isCrossGenre) ? "반드시 수준 높은 <보기> 박스 포함할 것" : "보기 불필요 (필요시 포함 가능)";
      const targetSec = cfg.targetSection ? `[출제 대상 범위: ${cfg.targetSection}]` : "[출제 대상: 지문 전체]";
      const pts = cfg.points || (cfg.difficulty === "high" || isCrossGenre ? 3 : 2);
      
      let descriptiveRubricReq = "";
      if (isDescriptive) {
        if (cfg.enableCustomRubric !== false && Array.isArray(cfg.customRubric) && cfg.customRubric.length > 0) {
          const rubricItemsStr = cfg.customRubric
            .map((r: any, rIdx: number) => `    ${rIdx + 1}) ${r.criteria} (+${r.allocatedPoints}점)`)
            .join("\n");
          descriptiveRubricReq = `\n- [서술형 출제자 지정 채점 기준표 (Rubric)]:
${rubricItemsStr}
${cfg.rubricNotes ? `    * 작성 조건 및 유의사항: ${cfg.rubricNotes}\n` : ""}    * 지침: 위 채점 기준표와 정확히 부합하는 서술형 발문(stem), 완결된 모범 답안(modelAnswer), 그리고 위 기준을 반영한 rubric 배열을 작성하십시오.`;
        } else {
          descriptiveRubricReq = `\n- [서술형 채점표 지침]: 교육과정 평가 기준에 부합하는 정량적이고 객관적인 단계별 부분점수 채점 기준표(rubric) 및 모범 답안(modelAnswer)을 반드시 포함하여 작성하십시오.`;
        }
      }

      return `[문항 ${qNum}]
- 유형: ${styleName}
- 행동 영역 (평가 목표): ${domainName}
- 배점 및 난이도: ${pts}점 (${cfg.difficulty === "high" || isCrossGenre ? "고난도 수능 1등급 변별 문항 (3점)" : cfg.difficulty === "low" ? "기본 개념 문항" : "표준 문항"})
- 보기 요구: ${bogiReq}
- 세부 지침: ${targetSec}${specialReq}${descriptiveRubricReq}`;
    }).join("\n\n");

    const promptText = `다음 제시된 국어영역 지문을 학술적·논리적으로 정밀하게 분석하여, 요청된 출제 조건에 맞춰 총 ${(questionConfigs || []).length}개의 고품질 대학수학능력시험(KICE 수능/모의평가) 1등급 변별 기출 수준 문항 세트를 출제하십시오.

[수능 국어영역 최고난도 출제 핵심 규범]
1. 난이도 극대화 및 지문 기반 정합성:
   - 기계적인 단어 찾기형 문항은 절대 금지합니다.
   - 다단계 인과 추론, 숨은 전제 파악, 조건부 명제 검증, 개념 간의 미세한 차이 및 범주 구분을 통해 수능 1등급 수준의 변별력을 확보하십시오.
2. 매력적인 5대 오답 함정(Distractor) 설계:
   - 각 선지는 단순한 오타나 말장난이 아니라, 실제 수능에서 상위권 수험생도 혼동하는 평가원 5대 함정(인과관계 전도, 주체/대상 교차 혼동, 과도한 일반화, 자의적 비약, 반대 방향성)을 치밀하게 탑재하십시오.
3. 도표/매트릭스 및 독서-문학 융합 요청 시:
   - 도표 요청 시: <보기>에 정교한 격자형 텍스트 표(ASCII Grid Table)나 구조화된 개념 체계도를 작성하십시오.
   - 독서-문학 융합 요청 시: <보기>에 지문과 연계된 문학 작품(시/소설)이나 비평 텍스트를 인용하고, 윗글의 원리를 문학 텍스트에 적용하는 3점 문항을 출제하십시오.

${passageText ? `### [제시된 지문]\n${passageText}\n` : "### [제시된 지문]: 첨부된 이미지/PDF의 내용을 완벽히 파악하여 출제할 것.\n"}

${passageCategory ? `### [지문 영역 분류]: ${passageCategory}\n` : ""}
${customInstructions ? `### [출제자 추가 요청 사항]:\n${customInstructions}\n` : ""}

### [문항별 세부 출제 스펙]:
${configDescriptions}

---
### [필수 JSON 출력 스키마]
반드시 다음 구조의 순수 JSON 객체로만 응답하십시오:
{
  "id": "exam-${Date.now()}",
  "title": "2026학년도 대학수학능력시험 대비 국어영역 기출 변형 모의평가",
  "createdAt": "${new Date().toISOString()}",
  "passageTitle": "지문 제목",
  "passageCategory": "독서 | 문학 | 화법과 작문 | 언어와 매체",
  "passageSubcategory": "인문/사회/과학/기술/예술/현대시/고전소설 등",
  "passageText": "지문 전체 텍스트 (문단 기호 (가)/(나), [A], ㉠, ⓐ 등 문항에서 참조하는 기호가 본문에 자연스럽게 반영된 최종 정제 지문)",
  "passageAnalysis": {
    "theme": "지문의 핵심 주제",
    "structureSummary": "지문의 문단별 논리적 전개 구조 요약",
    "keyConcepts": ["핵심 개념1", "핵심 개념2", "핵심 개념3"],
    "readabilityLevel": "고3 수능 표준 (상/중상/중)"
  },
  "questions": [
    {
      "id": "q-1",
      "questionNumber": 1,
      "stem": "수능 표준 발문 (예: 윗글의 내용 전개 방식에 대한 설명으로 가장 적절한 것은?)",
      "points": 2,
      "style": "multiple_choice",
      "behavioralDomain": "factual",
      "difficulty": "medium",
      "targetReference": "지문 참조 기호 (예: [A] 또는 ㉠~㉤ 또는 전체)",
      "bogiContent": "<보기> 내용 (보기가 있는 문항인 경우 작성, 도표 문항은 ASCII 그리드 표 포함, 없는 경우 null 또는 빈문자열)",
      "options": [
        "선지 ① 내용",
        "선지 ② 내용",
        "선지 ③ 내용",
        "선지 ④ 내용",
        "선지 ⑤ 내용"
      ],
      "correctAnswer": "③",
      "intention": "이 문항의 출제 의도 및 평가원 기준 평가 목표",
      "passageEvidence": "지문 내 정답 판별의 결정적 근거 문장 및 문단",
      "detailedExplanation": "문항 종합 해설",
      "optionAnalyses": [
        {
          "optionNumber": 1,
          "text": "선지 ① 내용",
          "isCorrect": false,
          "distractorTrapType": "인과관계 왜곡 (오답 함정 유형)",
          "explanation": "①이 오답인 이유 상세 해설"
        },
        {
          "optionNumber": 2,
          "text": "선지 ② 내용",
          "isCorrect": false,
          "distractorTrapType": "주체 혼동",
          "explanation": "②가 오답인 이유 상세 해설"
        },
        {
          "optionNumber": 3,
          "text": "선지 ③ 내용",
          "isCorrect": true,
          "distractorTrapType": "정답 선지",
          "explanation": "③이 정답인 이유 상세 해설 (지문 근거와 일치)"
        },
        {
          "optionNumber": 4,
          "text": "선지 ④ 내용",
          "isCorrect": false,
          "distractorTrapType": "과도한 일반화",
          "explanation": "④가 오답인 이유 상세 해설"
        },
        {
          "optionNumber": 5,
          "text": "선지 ⑤ 내용",
          "isCorrect": false,
          "distractorTrapType": "지문 내용과 정반대 서술",
          "explanation": "⑤가 오답인 이유 상세 해설"
        }
      ],
      "modelAnswer": "서술형인 경우 모범 답안 (선다형이면 null)",
      "rubric": [
        { "criteria": "서술형 채점 기준 1", "allocatedPoints": 2 },
        { "criteria": "서술형 채점 기준 2", "allocatedPoints": 1 }
      ]
    }
  ]
}`;

    parts.push({ text: promptText });

    const response = await generateContentWithRetry(ai, {
      preferredModel: "gemini-3.7-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: KICE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.25, // Academic precision & zero hallucination
      },
    });

    const outputText = response.text || "{}";
    const parsedData = safeJsonParse(outputText, null);

    if (!parsedData || !parsedData.questions) {
      throw new Error("문항 생성 결과의 JSON 형식을 파싱할 수 없습니다. 다시 시도해 주세요.");
    }

    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Exam generation error:", error);
    res.status(200).json({ success: false, error: error.message || "문항 출제 중 오류가 발생했습니다." });
  }
});

// API: Regenerate or refine a single question
app.post(["/api/gemini/regenerate-single-question", "/gemini/regenerate-single-question", "/api/regenerate-single-question", "/regenerate-single-question"], async (req, res) => {
  try {
    const { passageText, questionIndex, existingQuestion, userFeedback, questionConfig } = req.body;
    const customApiKey = (req.headers["x-gemini-api-key"] as string) || req.body?.customApiKey;
    const ai = getAI(customApiKey);

    const domain = questionConfig?.behavioralDomain || "factual";
    const isTableMatrix = domain === "table_matrix" || (userFeedback && userFeedback.includes("도표"));
    const isCrossGenre = domain === "cross_genre" || (userFeedback && (userFeedback.includes("융합") || userFeedback.includes("문학")));

    const promptText = `당신은 한국교육과정평가원 수능 국어영역 수석 출제위원입니다.
아래 지문과 기존 문항을 바탕으로, 출제자의 수정 요구사항을 반영하여 단일 문항을 수능 1등급 변별 본시험 수준의 최고 품질로 재출제하십시오.

[수능 국어영역 출제 정밀도 및 고난도 규범]
- 평가원 공식 발문 양식, 매력적인 5대 오답 설계(인과 전도, 주체/대상 혼동, 과도한 일반화, 자의적 비약, 반대 진술), 지문 내 정답 근거의 엄밀성을 철저히 확보하십시오.
- 3점 배점 또는 적용/비판 문항의 경우, 학술적 완성도가 높은 <보기> 단락을 포함하십시오.
${isTableMatrix ? "- [도표/매트릭스 문항]: <보기> 내에 깔끔한 ASCII/Unicode 격자 표(개념 비교 매트릭스, 어휘 관계도, 문법 체계표 등)를 구성하고 ㉮~㉰ 빈칸 완성 또는 속성 진위 판별 문항으로 출제하십시오." : ""}
${isCrossGenre ? "- [독서-문학 융합 연계 문항]: <보기>에 지문과 연계되는 문학 작품 텍스트(시/소설) 또는 비평 이론을 인용하고 심층 융합 감상하는 3점 문항으로 출제하십시오." : ""}

### [지문]
${passageText}

### [기존 문항]
- 발문: ${existingQuestion?.stem || ""}
- 유형: ${existingQuestion?.style || questionConfig?.style || "5지선다형"}
- 정답: ${existingQuestion?.correctAnswer || ""}
- 해설: ${existingQuestion?.detailedExplanation || ""}

### [출제자 수정 요구사항]
${userFeedback || "평가원 기출 난이도에 맞춰 선지의 매력도를 높이고 지문 근거를 더욱 정교화하여 재출제해 주세요."}

### [요청 문항 스펙]
- 문항 번호: ${questionIndex + 1}
- 유형: ${questionConfig?.style || "multiple_choice"}
- 행동 영역: ${domain}
- 난이도 및 배점: ${questionConfig?.points || (isCrossGenre || questionConfig?.difficulty === "high" ? 3 : 2)}점 (${questionConfig?.difficulty || "high"})

반드시 다음 단일 문항 JSON 객체로만 응답해 주세요:
{
  "id": "q-${Date.now()}",
  "questionNumber": ${questionIndex + 1},
  "stem": "수능 표준 발문",
  "points": ${questionConfig?.points || 2},
  "style": "${questionConfig?.style || "multiple_choice"}",
  "behavioralDomain": "${domain}",
  "difficulty": "${questionConfig?.difficulty || "high"}",
  "targetReference": "지문 참조 기호 또는 전체",
  "bogiContent": "<보 기> 내용 (도표 문항인 경우 ASCII 표 포함, 필요시)",
  "options": [
    "선지 ① 내용",
    "선지 ② 내용",
    "선지 ③ 내용",
    "선지 ④ 내용",
    "선지 ⑤ 내용"
  ],
  "correctAnswer": "②",
  "intention": "출제 의도",
  "passageEvidence": "정답 근거",
  "detailedExplanation": "종합 해설",
  "optionAnalyses": [
    { "optionNumber": 1, "text": "선지 1", "isCorrect": false, "distractorTrapType": "...", "explanation": "..." },
    { "optionNumber": 2, "text": "선지 2", "isCorrect": true, "distractorTrapType": "정답 선지", "explanation": "..." },
    { "optionNumber": 3, "text": "선지 3", "isCorrect": false, "distractorTrapType": "...", "explanation": "..." },
    { "optionNumber": 4, "text": "선지 4", "isCorrect": false, "distractorTrapType": "...", "explanation": "..." },
    { "optionNumber": 5, "text": "선지 5", "isCorrect": false, "distractorTrapType": "...", "explanation": "..." }
  ],
  "modelAnswer": "서술형인 경우 모범답안",
  "rubric": [
    { "criteria": "채점 기준", "allocatedPoints": 2 }
  ]
}
`;

    const response = await generateContentWithRetry(ai, {
      preferredModel: "gemini-3.7-flash",
      contents: promptText,
      config: {
        systemInstruction: KICE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.25,
      },
    });

    const outputText = response.text || "{}";
    const parsedQuestion = safeJsonParse(outputText, null);

    if (!parsedQuestion || !parsedQuestion.stem) {
      throw new Error("문항 재출제 결과의 JSON 형식을 파싱할 수 없습니다.");
    }

    res.json({ success: true, data: parsedQuestion });
  } catch (error: any) {
    console.error("Single question regeneration error:", error);
    res.status(200).json({ success: false, error: error.message || "문항 재출제 중 오류가 발생했습니다." });
  }
});

// Health check endpoint
app.get(["/api/health", "/health"], (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Fallback for API routes to never return HTML 404
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `요청하신 API 경로(${req.originalUrl || req.url})를 찾을 수 없습니다.`,
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express Error Handler:", err);
  if (res.headersSent) return next(err);
  res.status(200).json({
    success: false,
    error: err?.message || "서버 처리 중 오류가 발생했습니다.",
  });
});

// Vite middleware setup
async function startServer() {
  if (
    process.env.VERCEL ||
    process.env.NOW_REGION ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY ||
    process.env.VERCEL_ENV
  ) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("Vite middleware setup skipped:", viteErr);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KICE CSAT Korean Exam Generator server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

export default app;

