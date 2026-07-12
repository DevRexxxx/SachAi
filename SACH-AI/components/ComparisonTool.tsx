import React from 'react';
import { useTranslation } from 'react-i18next';
import { AgentResult } from '../types';
import { exportComparisonToPDF } from '../services/pdfExport';
import { copyTextToClipboard, buildReportText } from '../utils/clipboardUtils';

interface ComparisonToolProps {
  analyses: AgentResult[];
  onClose: () => void;
  onToast: (message: string) => void;
}

const RISK_ORDER: Record<string, number> = { Low: 1, Medium: 2, High: 3 };

const ScoreBadge: React.FC<{ score: number; color: string }> = ({ score, color }) => (
  <div className="relative w-16 h-16 flex items-center justify-center mx-auto">
    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
      <circle
        cx="18" cy="18" r="15.9" fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={`${score} 100`}
        strokeLinecap="round"
      />
    </svg>
    <span className="text-xs font-black text-white">{score}%</span>
  </div>
);

const FieldRow: React.FC<{ label: string; v1: string; v2: string; highlight?: boolean }> = ({
  label, v1, v2, highlight,
}) => {
  const same = v1 === v2;
  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] gap-2 items-center py-2 border-b border-white/5 ${highlight && !same ? 'bg-yellow-500/5' : ''}`}>
      <span className="text-[10px] font-medium text-zinc-300 text-right pr-2">{v1}</span>
      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest min-w-[60px] text-center">{label}</span>
      <span className="text-[10px] font-medium text-zinc-300 pl-2">{v2}</span>
    </div>
  );
};

const ComparisonTool: React.FC<ComparisonToolProps> = ({ analyses, onClose, onToast }) => {
  const { t } = useTranslation();
  const [idx1, setIdx1] = React.useState(0);
  const [idx2, setIdx2] = React.useState(analyses.length >= 2 ? 1 : 0);

  if (analyses.length < 2) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center border border-white/10">
          <p className="text-sm text-zinc-400">{t('comparison.noAnalysis')}</p>
          <button onClick={onClose} className="mt-6 px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 transition-all">
            {t('comparison.close')}
          </button>
        </div>
      </div>
    );
  }

  const a1 = analyses[Math.min(idx1, analyses.length - 1)];
  const a2 = analyses[Math.min(idx2, analyses.length - 1)];

  if (!a1 || !a2) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
        <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center border border-white/10">
          <p className="text-sm text-zinc-400">{t('comparison.noAnalysis')}</p>
          <button onClick={onClose} className="mt-6 px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 transition-all">
            {t('comparison.close')}
          </button>
        </div>
      </div>
    );
  }

  const getVerdictColor = (a: AgentResult) => {
    const v = a.verdict.toUpperCase();
    const grayKeywords = ['UNCLASSIFIED', 'UNKNOWN'];
    const redKeywords = ['DEEPFAKE', 'AI', 'SYNTHETIC', 'MANIPULATED', 'COMPOSITE', 'GENERATED', 'NCII', 'ALTERED', 'DIGITAL', 'FAKE', 'FABRICATED', 'SATIRICAL', 'MANIPULATION'];
    const yellowKeywords = ['SUSPICIOUS', 'INCONSISTENT', 'ARTIFACT', 'UNCERTAIN'];
    if (grayKeywords.some(k => v.includes(k))) return 'text-slate-400';
    if (redKeywords.some(k => v.includes(k)) || a.isExplicit) return 'text-red-400';
    if (yellowKeywords.some(k => v.includes(k))) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const getScoreHex = (a: AgentResult) => {
    const v = a.verdict.toUpperCase();
    const grayKeywords = ['UNCLASSIFIED', 'UNKNOWN'];
    const redKeywords = ['DEEPFAKE', 'AI', 'SYNTHETIC', 'MANIPULATED', 'COMPOSITE', 'GENERATED', 'NCII', 'ALTERED', 'DIGITAL', 'FAKE', 'FABRICATED', 'SATIRICAL', 'MANIPULATION'];
    const yellowKeywords = ['SUSPICIOUS', 'INCONSISTENT', 'ARTIFACT', 'UNCERTAIN'];
    if (grayKeywords.some(k => v.includes(k))) return '#94a3b8';
    if (redKeywords.some(k => v.includes(k)) || a.isExplicit) return '#ef4444';
    if (yellowKeywords.some(k => v.includes(k))) return '#eab308';
    return '#10b981';
  };

  const riskDelta = (RISK_ORDER[a1.riskLevel] || 0) - (RISK_ORDER[a2.riskLevel] || 0);
  const scoreDelta = a1.integrityScore - a2.integrityScore;

  const handleExportPDF = async () => {
    await exportComparisonToPDF(a1, a2);
  };

  const handleCopyComparison = async () => {
    const text = `SACHAI – COMPARISON REPORT\n\n=== Analysis A ===\n${buildReportText(a1)}\n\n=== Analysis B ===\n${buildReportText(a2)}`;
    await copyTextToClipboard(text);
    onToast(t('counter.copySuccess'));
  };

  const buildLabel = (a: AgentResult, i: number) => `#${i + 1} — ${a.verdict} (${a.integrityScore}%)`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="glass-card rounded-3xl max-w-5xl w-full border border-white/10 overflow-hidden my-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-violet-400">{t('comparison.title')}</h2>
          <div className="flex gap-3">
            <button onClick={handleCopyComparison} className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 transition-all">
              {t('counter.copyReport')}
            </button>
            <button onClick={handleExportPDF} className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 transition-all">
              {t('counter.exportPDF')}
            </button>
            <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 transition-all">
              {t('comparison.close')}
            </button>
          </div>
        </div>

        {/* Analysis selectors */}
        {analyses.length > 2 && (
          <div className="grid grid-cols-2 gap-4 px-8 pt-6">
            <select
              value={idx1}
              onChange={e => setIdx1(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-zinc-300 focus:outline-none focus:border-violet-500/50"
            >
              {analyses.map((a, i) => (
                <option key={i} value={i} disabled={i === idx2}>{buildLabel(a, i)}</option>
              ))}
            </select>
            <select
              value={idx2}
              onChange={e => setIdx2(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-zinc-300 focus:outline-none focus:border-violet-500/50"
            >
              {analyses.map((a, i) => (
                <option key={i} value={i} disabled={i === idx1}>{buildLabel(a, i)}</option>
              ))}
            </select>
          </div>
        )}

        {/* Score ring comparison */}
        <div className="grid grid-cols-3 gap-4 px-8 py-8">
          <div className="flex flex-col items-center gap-3">
            <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">{t('comparison.analysis1')}</p>
            <ScoreBadge score={a1.integrityScore} color={getScoreHex(a1)} />
            <p className={`text-sm font-black uppercase ${getVerdictColor(a1)}`}>{a1.verdict}</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">{t('comparison.delta')}</p>
            <p className={`text-2xl font-black ${scoreDelta > 0 ? 'text-red-400' : scoreDelta < 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {scoreDelta > 0 ? '+' : ''}{scoreDelta}%
            </p>
            <p className={`text-[8px] font-black uppercase tracking-widest ${riskDelta > 0 ? 'text-red-400' : riskDelta < 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {riskDelta > 0 ? t('comparison.higher') : riskDelta < 0 ? t('comparison.lower') : t('comparison.same')}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">{t('comparison.analysis2')}</p>
            <ScoreBadge score={a2.integrityScore} color={getScoreHex(a2)} />
            <p className={`text-sm font-black uppercase ${getVerdictColor(a2)}`}>{a2.verdict}</p>
          </div>
        </div>

        {/* Field comparison table */}
        <div className="px-8 pb-8">
          <FieldRow label={t('comparison.verdict')} v1={a1.verdict} v2={a2.verdict} highlight />
          <FieldRow label={t('comparison.score')} v1={`${a1.integrityScore}%`} v2={`${a2.integrityScore}%`} />
          <FieldRow label={t('comparison.riskLevel')} v1={a1.riskLevel} v2={a2.riskLevel} highlight />
          <FieldRow label={t('comparison.anomalies')} v1={`${a1.anomalies?.length || 0}`} v2={`${a2.anomalies?.length || 0}`} />
          <FieldRow label={t('comparison.origin')} v1={a1.probableOrigin || 'Unknown'} v2={a2.probableOrigin || 'Unknown'} highlight />
          <FieldRow label={t('comparison.osintConfidence')} v1={a1.osintConfidence || 'Low'} v2={a2.osintConfidence || 'Low'} />
        </div>
      </div>
    </div>
  );
};

export default ComparisonTool;
