import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './services/i18n';
import VideoProcessor from './components/VideoProcessor';
import LanguageSwitcher from './components/LanguageSwitcher';
import ComparisonTool from './components/ComparisonTool';
import { analyzeVideoIntegrity } from './services/geminiService';
import { exportToPDF } from './services/pdfExport';
import { copyReportToClipboard } from './utils/clipboardUtils';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { VideoFrame, AppStatus, AgentResult } from './types';

// --- ENHANCED NEURAL BLINK & FORENSIC STYLES ---
const scannerStyles = `
  :root {
    --bg-idle: #020204;
    --violet-glow: #6d28d9;
    --glass: rgba(139, 92, 246, 0.03);
    --border: rgba(139, 92, 246, 0.15);
  }

  body {
    margin: 0;
    font-family: "Inter", system-ui, -apple-system, sans-serif;
    background-color: var(--bg-idle);
    color: #ffffff;
    overflow-x: hidden;
  }

  @keyframes logo-neural-pulse {
    0%, 100% { opacity: 1; filter: brightness(1); text-shadow: 0 0 0px rgba(139, 92, 246, 0); }
    45% { opacity: 0.9; filter: brightness(1.2); text-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }
    50% { opacity: 0.5; filter: brightness(2.8) contrast(1.3); text-shadow: 3px 0 12px rgba(255, 255, 255, 0.9), -3px 0 18px rgba(109, 40, 217, 1); }
    55% { opacity: 0.9; filter: brightness(1.2); text-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }
  }

  .logo-animate { animation: logo-neural-pulse 4s infinite cubic-bezier(0.4, 0, 0.2, 1); }
  .theme-transition { transition: background 1.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 1s ease; }

  @keyframes radar-sweep { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }

  .loader-ring {
    position: absolute;
    border: 2px solid currentColor;
    border-radius: 50%;
    animation: pulse-ring 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  /* Dynamic Themes */
  .theme-idle { background: radial-gradient(circle at 50% -20%, #2e1065 0%, #020204 60%); }
  
  .theme-red { 
    background: radial-gradient(circle at 50% 0%, #450a0a 0%, #020204 80%) !important; 
    --glass: rgba(255, 0, 0, 0.04); --border: rgba(255, 0, 0, 0.3);
  }
  .theme-yellow { 
    background: radial-gradient(circle at 50% 0%, #422006 0%, #020204 80%) !important; 
    --glass: rgba(255, 255, 0, 0.04); --border: rgba(255, 255, 0, 0.3);
  }
  .theme-green { 
    background: radial-gradient(circle at 50% 0%, #064e3b 0%, #020204 80%) !important; 
    --glass: rgba(0, 255, 0, 0.04); --border: rgba(0, 255, 0, 0.3);
  }

  .glass-card {
    background: var(--glass);
    backdrop-filter: blur(40px);
    border: 1px solid var(--border);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .ambient-orb {
    position: absolute; width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    filter: blur(80px); animation: pulse-orb 10s infinite alternate;
    pointer-events: none; z-index: 1;
  }

  @keyframes scan-line { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }
  .scanning-overlay::after {
    content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: #ffffff; box-shadow: 0 0 20px #ffffff;
    animation: scan-line 3s linear infinite;
  }

  .custom-scroll::-webkit-scrollbar { width: 4px; }
  .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

  .map-glow {
    background: radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
    position: relative; border-radius: 2rem; overflow: hidden;
  }
  .pulse-node {
    position: absolute; width: 6px; height: 6px; background: #6d28d9; border-radius: 50%;
    box-shadow: 0 0 10px #6d28d9; animation: pulse-node-scale 2s infinite;
  }
  @keyframes pulse-node-scale { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(3.5); opacity: 0; } }

  .canvas-container {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.7;
  }
`;

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isLanding, setIsLanding] = useState(true);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [analysis, setAnalysis] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- NEW FEATURE STATE ---
  const [analysisHistory, setAnalysisHistory] = useState<AgentResult[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const uploadTriggerRef = useRef<(() => void) | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- COMPREHENSIVE THEME LOGIC ---
  const theme = useMemo(() => {
    if (!analysis) return { class: 'theme-idle', border: 'border-violet-500/20', text: 'text-white', scanner: 'text-violet-400' };
    
    const verdictStr = analysis.verdict.toUpperCase();
    
    const redKeywords = ['DEEPFAKE', 'AI', 'SYNTHETIC', 'MANIPULATED', 'COMPOSITE', 'GENERATED', 'NCII', 'ALTERED','DIGITAL', 'FAKE', 'FABRICATED', 'SATIRICAL', 'MANIPULATION'];
    const isRed = redKeywords.some(keyword => verdictStr.includes(keyword)) || analysis.isExplicit;

    const yellowKeywords = ['SUSPICIOUS', 'INCONSISTENT', 'ARTIFACT', 'UNCERTAIN'];
    const isYellow = yellowKeywords.some(keyword => verdictStr.includes(keyword));

    if (isRed) return { 
      class: 'theme-red', 
      border: 'border-red-500/50', 
      text: 'text-red-500', 
      scanner: 'text-red-600' 
    };
    
    if (isYellow) return { 
      class: 'theme-yellow', 
      border: 'border-yellow-500/30', 
      text: 'text-yellow-500', 
      scanner: 'text-yellow-500' 
    };
    
    return { 
      class: 'theme-green', 
      border: 'border-emerald-500/30', 
      text: 'text-emerald-500', 
      scanner: 'text-emerald-400' 
    };
  }, [analysis]);

  const scannerColor = useMemo(() => {
    if (progress < 40) return 'text-violet-400';
    if (progress < 80) return 'text-yellow-500';
    return 'text-red-500';
  }, [progress]);

  const handleClearUpload = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setFrames([]); setAnalysis(null); setProgress(0); setError(null); setStatus(AppStatus.IDLE);
  }, []);

  // ── Toast helper ──
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── PDF export ──
  const handleExportPDF = useCallback(async () => {
    if (!analysis) return;
    await exportToPDF(analysis);
  }, [analysis]);

  // ── Copy report to clipboard ──
  const handleCopyReport = useCallback(async () => {
    if (!analysis) return;
    try {
      await copyReportToClipboard(analysis);
      showToast(t('counter.copySuccess'));
    } catch {
      showToast('Failed to copy to clipboard.');
    }
  }, [analysis, showToast, t]);

  // ── Download text report ──
  const handleDownloadReport = useCallback(() => {
    if (!analysis) return;
    const report = `
  SACHAI – FORENSIC & OSINT REPORT
  ================================

  FINAL VERDICT
  -------------
  ${analysis.verdict}

  INTEGRITY SCORE
  ---------------
  ${analysis.integrityScore}%

  RISK LEVEL
  ----------
  ${analysis.riskLevel}

  TECHNICAL SUMMARY
  -----------------
  ${analysis.explanation}

  DETECTED ANOMALIES
  ------------------
  ${analysis.anomalies?.map(
    (a, i) => `${i + 1}. ${a.description} (Severity: ${a.severity}, Time: ${a.timestamp}s)`
  ).join("\n") || "None detected"}

  OSINT & CIRCULATION INTELLIGENCE
  --------------------------------
  Probable Origin   : ${analysis.probableOrigin || "Unknown"}
  Content Theme    : ${analysis.contentTheme || "Unclassified"}
  OSINT Confidence : ${analysis.osintConfidence || "Low"}

  Likely Circulation Channels:
  ${analysis.circulationChannels?.join(", ") || "Undetermined"}

  SAFETY RECOMMENDATION
  ---------------------
  ${analysis.safetyRecommendation}

  Generated by SachAI – Neural Forensics Unit
  `;
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "SachAI_Forensic_Report.txt";
    link.click();
    URL.revokeObjectURL(url);
  }, [analysis]);

  const handleFramesExtracted = useCallback(async (extractedFrames: VideoFrame[]) => {
    setFrames(extractedFrames); setStatus(AppStatus.ANALYZING);
    let sim = 0;
    intervalRef.current = setInterval(() => {
      sim += 1; if (sim <= 98) setProgress(sim);
    }, 80);

    try {
      const result = await analyzeVideoIntegrity(extractedFrames, i18n.language);
      if (intervalRef.current) clearInterval(intervalRef.current);
      const agentResult = result as AgentResult;
      setProgress(100); setAnalysis(agentResult); setStatus(AppStatus.COMPLETED);
      setAnalysisHistory(prev => [...prev, agentResult]);
    } catch (err: any) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setError(err?.message || t('errors.scannerFailure')); setStatus(AppStatus.ERROR);
    }
  }, [t]);

  // ── Keyboard shortcuts ──
  useKeyboardShortcuts({
    onUpload: () => { if (status === AppStatus.IDLE) uploadTriggerRef.current?.(); },
    onDownload: handleDownloadReport,
    onCopy: handleCopyReport,
    onCopyComparison: () => setShowComparison(true),
    onClear: handleClearUpload,
    onHelp: () => setShowShortcutsHelp(prev => !prev),
  });

  // --- UPGRADED GLOBAL SWIRLING LOGIC (Single Thick Line) ---
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let w: number, h: number;
    
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      offset += 0.003;

      ctx.beginPath();
      // Single Thick Ribbon
      ctx.lineWidth = 18;
      
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'rgba(109, 40, 217, 0)');
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.5)'); 
      gradient.addColorStop(1, 'rgba(109, 40, 217, 0)');
      
      ctx.strokeStyle = gradient;
      ctx.shadowBlur = 40;
      ctx.shadowColor = 'rgba(109, 40, 217, 0.6)';
      ctx.lineCap = 'round';

      ctx.moveTo(-100, h / 2);

      for (let x = 0; x < w + 100; x += 5) {
        const y = h / 2 + 
                  Math.sin(x * 0.0012 + offset) * 180 + 
                  Math.cos(x * 0.0008 - offset * 0.8) * 100;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className={`min-h-screen ${isLanding ? 'theme-idle' : theme.class} transition-colors duration-1000 flex flex-col relative theme-transition`}>
      <style>{scannerStyles}</style>
      
      {/* PERSISTENT AMBIENT BACKGROUND */}
      <canvas ref={canvasRef} className="canvas-container" />
      
      <div className="grain" />
      
      {isLanding ? (
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
          <div className="ambient-orb" />
          <div className="relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-1000 max-w-4xl">
            <div className="inline-block px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 mb-4 backdrop-blur-md">
               <span className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.4em]">{t('app.tagline')}</span>
            </div>
            
            <div className="relative">
              <h1 className="logo-animate text-8xl md:text-[12rem] font-black tracking-tighter  leading-none bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent">सचAI</h1>
            </div>

            <div className="space-y-2">
              <p className="text-xs md:text-sm font-bold text-violet-300/40 uppercase tracking-[0.8em]">{t('app.subtitle')}</p>
              <div className="flex flex-col gap-1 items-center">
                <p className="text-[10px] font-medium text-zinc-500 tracking-[0.2em] uppercase">{t('app.unit')}</p>
                <p className="text-[9px] font-black text-red-500/50 tracking-[0.3em] uppercase animate-pulse">{t('app.protection')}</p>
              </div>
            </div>

            <div className="pt-12">
              <button onClick={() => setIsLanding(false)} className="group relative px-16 py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] active:scale-95">
                <div className="absolute inset-0 bg-violet-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative group-hover:text-white transition-colors duration-300">{t('app.startVerification')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <nav className="glass-card border-b border-white/5 px-6 py-4 sticky top-0 z-50">
            <div className="max-w-[1800px] mx-auto flex flex-wrap justify-between items-center gap-4">
              <div className="cursor-pointer flex items-baseline gap-3" onClick={() => setIsLanding(true)}>
                <span className="logo-animate text-2xl font-black  tracking-tighter uppercase bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">सचAI</span>
                <span className="hidden sm:inline text-[10px] opacity-40 font-mono tracking-widest uppercase">Node_{status}</span>
              </div>

              {analysis && (
                <div className="flex-1 hidden xl:flex items-center justify-center gap-10 px-8 py-2 bg-white/[0.03] rounded-full border border-white/10">
                  <div className="flex flex-col"><span className="text-[7px] font-black opacity-30 uppercase tracking-[0.3em]">{t('nav.origin')}</span><span className="text-[10px] font-bold text-violet-400">{analysis.probableOrigin || 'Scanning...'}</span></div>
                  <div className="w-[1px] h-4 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black opacity-30 uppercase tracking-[0.3em]">{t('nav.confidence')}</span>
                    <span className={`text-[10px] font-black uppercase ${theme.text}`}>{analysis.osintConfidence || 'Pending'}</span>
                  </div>
                  <div className="w-[1px] h-4 bg-white/10" />
                  <div className="flex flex-col"><span className="text-[7px] font-black opacity-30 uppercase tracking-[0.3em]">{t('nav.theme')}</span><span className="text-[10px] font-bold text-white/80">{analysis.contentTheme || 'General'}</span></div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <button
                  onClick={() => setShowShortcutsHelp(true)}
                  title="Keyboard Shortcuts (Ctrl+?)"
                  className="px-3 py-1.5 bg-white/5 rounded border border-white/10 text-[9px] font-bold text-zinc-400 hover:text-violet-400 hover:border-violet-500/30 transition-all"
                >
                  ⌨️
                </button>
                <div className="px-4 py-1.5 bg-white/5 rounded border border-white/10 text-[9px] font-bold uppercase tracking-widest text-violet-400">{t('app.systemActive')}</div>
              </div>
            </div>
          </nav>

          <main className="flex-grow max-w-[1800px] mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
            <div className="lg:col-span-4 space-y-6">
              <div className={`glass-card p-6 rounded-3xl border ${theme.border}`}>
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-6">{t('evidence.title')}</h3>
                {status === AppStatus.IDLE ? (
                  <VideoProcessor onFramesExtracted={handleFramesExtracted} onProcessingUpdate={setProgress} onError={setError} />
                ) : (
                  <div className="space-y-6">
                    <div className={`aspect-video rounded-xl overflow-hidden border border-white/10 relative bg-black/40 ${status === AppStatus.ANALYZING ? 'scanning-overlay' : ''}`}>
                      <img src={frames[0]?.dataUrl} className="w-full h-full object-contain" alt="Evidence" />
                    </div>
                    <button onClick={handleClearUpload} className="w-full py-3 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-lg hover:bg-white/5 transition-all text-zinc-400 hover:text-white">{t('evidence.clearUpload')}</button>
                  </div>
                )}
              </div>
              {analysis && (
                <div className={`glass-card p-6 rounded-3xl border ${theme.border} space-y-6 animate-in slide-in-from-left-4`}>
                  <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-violet-400"><span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" /> {t('counter.title')}</h4>
                  <p className="text-sm font-medium leading-relaxed opacity-80 italic">{analysis.activeCountermeasure || analysis.safetyRecommendation}</p>
                  <div className="space-y-3 pt-2">
                    {analysis.isExplicit && (
                      <a href="https://stopncii.org" target="_blank" rel="noopener noreferrer" className="group relative flex items-center justify-center w-full p-4 bg-white text-black rounded-2xl transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden">
                        <span className="relative text-[11px] font-black uppercase tracking-[0.2em]">{t('counter.takedown')}</span>
                      </a>
                    )}
                    {(analysis.isExplicit || theme.class === 'theme-red') && (
                      <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full p-4 border border-red-500/40 text-red-500 rounded-2xl transition-all hover:bg-red-500/10 hover:border-red-500 active:scale-[0.98] group">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t('counter.fileReport')}</span>
                      </a>
                    )}
                  </div>
                  
                  {/* Download Text Report */}
                  <button
                    onClick={handleDownloadReport}
                    className={`group relative w-full py-3 px-6 flex items-center justify-center gap-3 
                      bg-transparent border ${theme.border} rounded-xl overflow-hidden 
                      transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] 
                      active:scale-[0.98]`}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300" />
                    <svg className={`w-4 h-4 ${theme.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-200 group-hover:text-white transition-colors">{t('counter.downloadReport')}</span>
                  </button>
                  {/* Export PDF */}
                  <button
                    onClick={handleExportPDF}
                    className={`group relative w-full py-3 px-6 flex items-center justify-center gap-3 
                      bg-transparent border ${theme.border} rounded-xl overflow-hidden 
                      transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] 
                      active:scale-[0.98]`}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300" />
                    <svg className={`w-4 h-4 ${theme.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-200 group-hover:text-white transition-colors">{t('counter.exportPDF')}</span>
                  </button>
                  {/* Copy to Clipboard */}
                  <button
                    onClick={handleCopyReport}
                    className={`group relative w-full py-3 px-6 flex items-center justify-center gap-3 
                      bg-transparent border ${theme.border} rounded-xl overflow-hidden 
                      transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] 
                      active:scale-[0.98]`}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300" />
                    <svg className={`w-4 h-4 ${theme.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-200 group-hover:text-white transition-colors">{t('counter.copyReport')}</span>
                  </button>
                  {/* Compare Analyses */}
                  {analysisHistory.length >= 2 && (
                    <button
                      onClick={() => setShowComparison(true)}
                      className="group relative w-full py-3 px-6 flex items-center justify-center gap-3 
                        bg-transparent border border-violet-500/30 rounded-xl overflow-hidden 
                        transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] 
                        active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-violet-500 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-300" />
                      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                      </svg>
                      <span className="text-[11px] font-black uppercase tracking-[0.25em] text-violet-300 group-hover:text-violet-200 transition-colors">{t('counter.compare')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-8">
              <div className={`glass-card rounded-[2.5rem] p-6 md:p-12 min-h-[600px] flex flex-col border border-white/5 relative overflow-hidden theme-transition`}>
                {status === AppStatus.ANALYZING ? (
                  <div className="flex-grow flex flex-col items-center justify-center space-y-12 py-20 relative z-10">
                    <div className={`relative w-48 h-48 flex items-center justify-center transition-colors duration-1000 ${scannerColor}`}>
                      <div className="loader-ring w-full h-full opacity-20" /><div className="loader-ring w-3/4 h-3/4 opacity-40" />
                      <div className="absolute w-full h-full border border-current opacity-10 rounded-full" />
                      <div className="absolute w-full h-full border-t-2 border-current rounded-full" style={{ animation: 'radar-sweep 2s linear infinite' }} />
                      <div className="flex flex-col items-center justify-center">
                        <div className="font-mono text-[10px] animate-pulse tracking-[0.3em] mb-1">SCANNING</div>
                        <div className="font-mono text-xl font-black">{progress}%</div>
                      </div>
                    </div>
                    <div className="text-center space-y-6">
                       <div className={`text-2xl font-black tracking-[0.6em] uppercase transition-colors duration-1000 ${scannerColor}`}>{t('analysis.scanning')}</div>
                    </div>
                  </div>
                ) : analysis ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                      <div><p className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-2">{t('analysis.finalVerdict')}</p><h2 className={`text-5xl md:text-8xl font-black italic uppercase leading-none tracking-tighter transition-colors duration-1000 ${theme.text}`}>{analysis.verdict}</h2></div>
                      <div className="md:text-right"><p className={`text-6xl md:text-8xl font-black tracking-tighter leading-none transition-colors duration-1000 ${theme.text}`}>{analysis.integrityScore}%</p><p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-2">{t('analysis.sachaiScore')}</p></div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 border-t border-white/5 pt-10">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-widest">{t('analysis.technicalSummary')}</h4>
                        <p className="text-lg md:text-xl font-light leading-relaxed opacity-90 text-zinc-200">{analysis.explanation}</p>
                        <div className="pt-10 space-y-6">
                          <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-widest">{t('analysis.circulationIntel')}</h4>
                          <div className="map-glow h-64 w-full border border-white/5 flex items-center justify-center relative bg-black/40">
                            <div className="pulse-node top-1/4 left-1/3" /><div className="pulse-node top-2/3 left-1/2" /><div className="pulse-node top-1/3 left-3/4" /><div className="pulse-node top-1/2 left-1/4" />
                            <span className="text-[9px] font-mono opacity-20 uppercase tracking-[1em] text-center px-4">{t('analysis.scanningNet')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-widest">{t('analysis.detectedAnomalies')}</h4>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-4 custom-scroll">
                          {analysis.anomalies?.map((a, i) => (
                            <div key={i} className="p-5 glass-card rounded-2xl flex gap-5 items-center border border-white/5 hover:bg-white/[0.04] transition-all group">
                              <div className={`w-1 h-10 rounded-full transition-all group-hover:h-12 ${a.severity === 'High' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'}`} />
                              <div className="flex-grow"><p className="text-sm font-bold opacity-90 text-white">{a.description}</p><p className="text-[9px] font-mono opacity-30 uppercase tracking-[0.2em] mt-1">{t('analysis.frameOffset')}: {a.timestamp}s</p></div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-8 space-y-6">
                          <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-widest">{t('analysis.osintTitle')}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-card p-6 rounded-2xl border border-white/5 text-center">
                              <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-4">{t('analysis.probableOrigin')}</p>
                              <p className="text-xs font-medium text-zinc-200">{analysis.probableOrigin || t('analysis.forensicPending')}</p>
                            </div>
                            <div className="glass-card p-6 rounded-2xl border border-white/5 text-center">
                              <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-4">{t('analysis.contentTheme')}</p>
                              <p className="text-xs font-bold text-white">{analysis.contentTheme || t('analysis.syntheticMedia')}</p>
                            </div>
                            <div className="glass-card p-6 rounded-2xl border border-white/5 text-center">
                              <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-4">{t('analysis.osintConfidence')}</p>
                              <p className={`text-lg font-black transition-colors duration-1000 ${theme.text}`}>{analysis.osintConfidence || 'Low'}</p>
                            </div>
                          </div>
                          <div className="glass-card p-6 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-4">{t('analysis.circulationChannels')}</p>
                            <div className="flex flex-wrap gap-3">
                              {(analysis.circulationChannels && analysis.circulationChannels.length > 0 ? analysis.circulationChannels : ['Telegram', 'X/Twitter', 'Instagram', 'Reddit']).map((ch, i) => (
                                <span key={i} className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-all">{ch}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center opacity-10 select-none">
                    <h2 className="logo-animate text-7xl md:text-[10rem] font-black italic tracking-tighter uppercase mb-4">सचAI</h2>
                  </div>
                )}
              </div>
            </div>
          </main>

          <footer className="p-8 mt-auto border-t border-white/5 relative z-10">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[9px] font-black opacity-30 tracking-[0.5em] uppercase gap-4">
              <div>{t('footer.credit')}</div>
            </div>
          </footer>
        </>
      )}
      {/* ── Comparison Tool Modal ── */}
      {showComparison && (
        <ComparisonTool
          analyses={analysisHistory}
          onClose={() => setShowComparison(false)}
          onToast={showToast}
        />
      )}

      {/* ── Keyboard Shortcuts Help Modal ── */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-violet-400">{t('shortcuts.title')}</h2>
              <button onClick={() => setShowShortcutsHelp(false)} className="text-zinc-500 hover:text-white transition-colors text-lg leading-none">✕</button>
            </div>
            {[
              { keys: 'Ctrl+U', desc: t('shortcuts.upload') },
              { keys: 'Ctrl+D', desc: t('shortcuts.download') },
              { keys: 'Ctrl+C', desc: t('shortcuts.copy') },
              { keys: 'Ctrl+Shift+C', desc: t('shortcuts.copyComparison') },
              { keys: 'Esc', desc: t('shortcuts.clear') },
              { keys: 'Ctrl+?', desc: t('shortcuts.help') },
            ].map(({ keys, desc }) => (
              <div key={keys} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-[10px] font-medium text-zinc-400">{desc}</span>
                <kbd className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black font-mono text-violet-300">{keys}</kbd>
              </div>
            ))}
            <button onClick={() => setShowShortcutsHelp(false)} className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 transition-all mt-2">
              {t('shortcuts.close')}
            </button>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 bg-zinc-900 border border-violet-500/30 rounded-full shadow-2xl text-[11px] font-black uppercase tracking-widest text-violet-300 animate-in slide-in-from-bottom-4 duration-300">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
