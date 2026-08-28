import React from 'react';
import { Layers, Bookmark, CheckCircle, Tag, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { GeneratedExamData } from '../types';

interface PassageAnalysisCardProps {
  examData: GeneratedExamData;
}

export const PassageAnalysisCard: React.FC<PassageAnalysisCardProps> = ({ examData }) => {
  const analysis = examData.passageAnalysis;

  if (!analysis) return null;

  // Calculate difficulty distribution
  const difficultyCounts = {
    high: 0,
    medium: 0,
    low: 0,
  };

  const domainCounts: Record<string, number> = {};

  examData.questions.forEach((q) => {
    const diff = q.difficulty || 'medium';
    if (diff in difficultyCounts) {
      difficultyCounts[diff as keyof typeof difficultyCounts]++;
    } else {
      difficultyCounts.medium++;
    }

    const domain = q.behavioralDomain || 'factual';
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });

  const difficultyData = [
    { name: '상 (고난도)', count: difficultyCounts.high, color: '#dc2626', label: '상' },
    { name: '중 (표준)', count: difficultyCounts.medium, color: '#2563eb', label: '중' },
    { name: '하 (기초)', count: difficultyCounts.low, color: '#059669', label: '하' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-600 shrink-0" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            지문 구조 및 출제 맥락 분석 (Passage Structure & Concepts)
          </h3>
        </div>
        <span className="text-xs sm:text-sm text-slate-700 font-bold px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
          난이도: {analysis.readabilityLevel || '수능 표준'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-sm">
        <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/80 space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm sm:text-base">
            <Bookmark className="w-4 h-4 text-blue-600 shrink-0" />
            <span>지문 핵심 주제 (Theme)</span>
          </div>
          <p className="text-slate-800 leading-relaxed text-sm sm:text-base">{analysis.theme}</p>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/80 space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm sm:text-base">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>문단별 논리 구조 요약 (Structure)</span>
          </div>
          <p className="text-slate-800 leading-relaxed text-sm sm:text-base">{analysis.structureSummary}</p>
        </div>
      </div>

      {/* Difficulty Distribution Chart using Recharts */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-800">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>문항 난이도 분포 (Difficulty Distribution)</span>
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-red-700">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span> 상: {difficultyCounts.high}문항
            </span>
            <span className="flex items-center gap-1 text-blue-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> 중: {difficultyCounts.medium}문항
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> 하: {difficultyCounts.low}문항
            </span>
          </div>
        </div>

        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={difficultyData} layout="vertical" margin={{ top: 5, right: 25, left: 10, bottom: 5 }}>
              <XAxis type="number" allowDecimals={false} domain={[0, 'dataMax + 1']} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12, fill: '#334155' }} />
              <Tooltip
                formatter={(val: any) => [`${val} 문항`, '출제 문항 수']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                {difficultyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {analysis.keyConcepts && analysis.keyConcepts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs sm:text-sm font-bold text-slate-600 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-slate-500" /> 핵심 개념어:
          </span>
          {analysis.keyConcepts.map((concept, idx) => (
            <span
              key={idx}
              className="text-xs sm:text-sm px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md font-bold border border-blue-200"
            >
              #{concept}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
