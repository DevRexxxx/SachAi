import { AgentResult } from '../types';
import { buildReportText } from '../utils/clipboardUtils';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
  }
}

export const exportToPDF = async (analysis: AgentResult, fileName = 'SachAI_Forensic_Report.pdf'): Promise<void> => {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const verdictColor = getVerdictColor(analysis.verdict, analysis.isExplicit);

  // ── Header bar ──
  doc.setFillColor(...verdictColor);
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SACHAI – NEURAL FORENSICS UNIT', margin, 12);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 12, { align: 'right' });

  y = 28;

  // ── Title ──
  doc.setTextColor(20, 20, 30);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FORENSIC & OSINT REPORT', margin, y);
  y += 10;

  // ── Verdict banner ──
  const [r, g, b] = verdictColor;
  doc.setFillColor(r, g, b, 0.1);
  doc.setDrawColor(...verdictColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'FD');
  doc.setTextColor(...verdictColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(analysis.verdict, margin + 6, y + 8);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Integrity Score: ${analysis.integrityScore}%  |  Risk: ${analysis.riskLevel}`, margin + 6, y + 17);
  y += 30;

  // ── Score bar ──
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 120);
  doc.text('SachAi-Score', margin, y);
  y += 4;
  doc.setFillColor(230, 230, 240);
  doc.rect(margin, y, contentWidth, 5, 'F');
  doc.setFillColor(...verdictColor);
  doc.rect(margin, y, (contentWidth * analysis.integrityScore) / 100, 5, 'F');
  y += 12;

  // ── Technical Summary ──
  y = addSection(doc, 'TECHNICAL SUMMARY', analysis.explanation, margin, y, contentWidth, verdictColor);

  // ── Anomalies ──
  if (analysis.anomalies?.length) {
    checkPageBreak(doc, y, pageHeight, margin);
    y = addSectionTitle(doc, 'DETECTED ANOMALIES', margin, y, verdictColor);
    analysis.anomalies.forEach((a, i) => {
      const sevColor: [number, number, number] = a.severity === 'High' ? [239, 68, 68] : [234, 179, 8];
      doc.setFillColor(...sevColor);
      doc.rect(margin, y, 2.5, 8, 'F');
      doc.setTextColor(20, 20, 30);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      const lines = doc.splitTextToSize(`${i + 1}. ${a.description}`, contentWidth - 8);
      doc.text(lines, margin + 6, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 140);
      doc.text(`Severity: ${a.severity}  |  Frame Offset: ${a.timestamp}s`, margin + 6, y + 5 + lines.length * 4);
      y += 10 + lines.length * 4;
      if (y > pageHeight - 30) { doc.addPage(); y = margin; }
    });
    y += 4;
  }

  // ── OSINT ──
  checkPageBreak(doc, y, pageHeight, margin);
  y = addSectionTitle(doc, 'OSINT & CIRCULATION INTELLIGENCE', margin, y, verdictColor);
  const osintData = [
    ['Probable Origin', analysis.probableOrigin || 'Unknown'],
    ['Content Theme', analysis.contentTheme || 'Unclassified'],
    ['OSINT Confidence', analysis.osintConfidence || 'Low'],
    ['Circulation Channels', analysis.circulationChannels?.join(', ') || 'Undetermined'],
  ];
  osintData.forEach(([label, value]) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 120);
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 30);
    const lines = doc.splitTextToSize(value, contentWidth - 45);
    doc.text(lines, margin + 42, y);
    y += 6 + (lines.length - 1) * 4;
  });
  y += 4;

  // ── Safety Recommendation ──
  checkPageBreak(doc, y, pageHeight, margin);
  y = addSection(doc, 'SAFETY RECOMMENDATION', analysis.safetyRecommendation, margin, y, contentWidth, verdictColor);

  // ── Footer on every page ──
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(240, 240, 245);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('SachAI – Neural Forensics Unit  |  sachAI by ALT F4', margin, pageHeight - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  doc.save(fileName);
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getVerdictColor(verdict: string, isExplicit: boolean): [number, number, number] {
  const v = verdict.toUpperCase();
  const redKeywords = ['DEEPFAKE', 'AI', 'SYNTHETIC', 'MANIPULATED', 'COMPOSITE', 'GENERATED', 'NCII', 'ALTERED', 'DIGITAL', 'FAKE', 'FABRICATED', 'SATIRICAL', 'MANIPULATION'];
  const yellowKeywords = ['SUSPICIOUS', 'INCONSISTENT', 'ARTIFACT', 'UNCERTAIN'];
  if (redKeywords.some(k => v.includes(k)) || isExplicit) return [220, 38, 38];
  if (yellowKeywords.some(k => v.includes(k))) return [202, 138, 4];
  return [5, 150, 105];
}

function addSectionTitle(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  title: string,
  x: number,
  y: number,
  color: [number, number, number]
): number {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...color);
  doc.text(title, x, y);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(x, y + 1.5, x + 170, y + 1.5);
  return y + 8;
}

function addSection(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  title: string,
  body: string,
  x: number,
  y: number,
  width: number,
  color: [number, number, number]
): number {
  y = addSectionTitle(doc, title, x, y, color);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 50);
  const lines = doc.splitTextToSize(body, width);
  doc.text(lines, x, y);
  return y + lines.length * 5 + 6;
}

function checkPageBreak(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  y: number,
  pageHeight: number,
  margin: number
): number {
  if (y > pageHeight - 40) { doc.addPage(); return margin; }
  return y;
}

export const exportComparisonToPDF = async (
  a1: AgentResult,
  a2: AgentResult,
  fileName = 'SachAI_Comparison_Report.pdf'
): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const colW = (pageWidth - margin * 3) / 2;

  // Header
  doc.setFillColor(30, 30, 50);
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SACHAI – COMPARISON FORENSIC REPORT', margin, 11);
  doc.setFontSize(7);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 11, { align: 'right' });

  let y = 24;

  const renderAnalysisColumn = (a: AgentResult, xStart: number, label: string) => {
    const color = getVerdictColor(a.verdict, a.isExplicit);
    doc.setFillColor(...color);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.rect(xStart, y, colW, 12, 'F');
    doc.text(label, xStart + 4, y + 5);
    doc.setFontSize(8);
    doc.text(a.verdict, xStart + 4, y + 10);

    let cy = y + 18;
    const rows: [string, string][] = [
      ['Score', `${a.integrityScore}%`],
      ['Risk Level', a.riskLevel],
      ['Origin', a.probableOrigin || 'Unknown'],
      ['Theme', a.contentTheme || 'N/A'],
      ['OSINT Conf.', a.osintConfidence || 'Low'],
      ['Anomalies', `${a.anomalies?.length || 0} detected`],
    ];
    rows.forEach(([k, v]) => {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 120);
      doc.text(k + ':', xStart + 2, cy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 30);
      doc.text(v, xStart + 35, cy);
      cy += 7;
    });
  };

  renderAnalysisColumn(a1, margin, 'Analysis A');
  renderAnalysisColumn(a2, margin * 2 + colW, 'Analysis B');

  // Delta column separator
  const midX = margin + colW + margin / 2;
  doc.setDrawColor(200, 200, 220);
  doc.setLineWidth(0.3);
  doc.line(midX, y, midX, pageHeight - 20);

  // Delta indicator
  const delta = a1.integrityScore - a2.integrityScore;
  const deltaColor: [number, number, number] = delta > 0 ? [220, 38, 38] : delta < 0 ? [5, 150, 105] : [100, 100, 120];
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...deltaColor);
  doc.text(`Score Δ: ${delta > 0 ? '+' : ''}${delta}`, midX - 10, y + 18, { align: 'center' });

  // Footer
  doc.setFillColor(240, 240, 245);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('SachAI – Neural Forensics Unit', margin, pageHeight - 4);
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 4, { align: 'right' });

  doc.save(fileName);
};

export { buildReportText };
