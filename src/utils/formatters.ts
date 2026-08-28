import { GeneratedExamData, GeneratedQuestion } from '../types';

export function formatExamForHWP(examData: GeneratedExamData): string {
  let output = `==========================================================\n`;
  output += `  2026학년도 대학수학능력시험 대비 국어영역 기출 변형 모의평가\n`;
  output += `==========================================================\n\n`;
  output += `[ ${examData.passageCategory || '국어영역'} | ${examData.passageSubcategory || '지문'} ] ${examData.passageTitle || '제시 지문'}\n\n`;
  output += `[1 ~ ${examData.questions.length}] 다음 글을 읽고 물음에 답하시오.\n`;
  output += `----------------------------------------------------------\n`;
  output += `${examData.passageText}\n`;
  output += `----------------------------------------------------------\n\n`;

  examData.questions.forEach((q, idx) => {
    output += `${idx + 1}. ${q.stem} [${q.points}점]\n`;

    if (q.bogiContent) {
      output += `\n<보 기>\n${q.bogiContent}\n\n`;
    }

    if (q.style === 'multiple_choice' && q.options && q.options.length > 0) {
      q.options.forEach((opt, optIdx) => {
        const numCircle = ['①', '②', '③', '④', '⑤'][optIdx] || `(${optIdx + 1})`;
        // Check if option already starts with circle
        const cleanText = opt.replace(/^[①②③④⑤\(\d\)]\s*/, '');
        output += `${numCircle} ${cleanText}\n`;
      });
    } else if (q.style === 'descriptive') {
      output += `[답란]: ___________________________________________________\n`;
    } else if (q.style === 'short_answer') {
      output += `[답]: ___________________\n`;
    }

    output += `\n`;
  });

  output += `\n==========================================================\n`;
  output += `  [ 정답 및 해설 ]\n`;
  output += `==========================================================\n\n`;

  examData.questions.forEach((q, idx) => {
    output += `[문항 ${idx + 1}] 정답: ${q.correctAnswer} (${q.points}점)\n`;
    output += `■ 출제 의도: ${q.intention}\n`;
    output += `■ 정답 근거: ${q.passageEvidence}\n`;
    output += `■ 해설:\n${q.detailedExplanation}\n`;

    if (q.optionAnalyses && q.optionAnalyses.length > 0) {
      output += `■ 선지별 분석:\n`;
      q.optionAnalyses.forEach(oa => {
        const circle = ['①', '②', '③', '④', '⑤'][oa.optionNumber - 1] || `(${oa.optionNumber})`;
        output += `  ${circle} ${oa.isCorrect ? '[정답]' : `[오답 - ${oa.distractorTrapType || '오답'}]`} ${oa.explanation}\n`;
      });
    }

    if (q.style === 'descriptive') {
      if (q.modelAnswer) {
        output += `■ 모범 답안: ${q.modelAnswer}\n`;
      }
      if (q.rubric && q.rubric.length > 0) {
        output += `■ 채점 기준표:\n`;
        q.rubric.forEach(r => {
          output += `  - ${r.criteria} (${r.allocatedPoints}점)\n`;
        });
      }
    }

    output += `\n----------------------------------------------------------\n\n`;
  });

  return output;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve(success);
  } catch {
    return Promise.resolve(false);
  }
}
