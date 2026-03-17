
export interface VideoFrame {
  timestamp: number;
  dataUrl: string;
}

export interface ForensicResult {
  integrityScore: number;
  verdict: 'AUTHENTIC' | 'SUSPICIOUS' | 'DEEPFAKE';
  summary: string;
  anomalies: {
    timestamp: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High';
  }[];
  forensicInsights: string[];
}

export interface AgentResult {
  isExplicit: boolean;
  integrityScore: number;
  verdict: string;
  summary: string;
  explanation: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  anomalies: { timestamp: string; description: string; severity: string; }[];
  safetyRecommendation: string;
  forensicInsights?: string[];
  activeCountermeasure?: string;
  probableOrigin?: string;
  contentTheme?: string;
  osintConfidence?: string;
  circulationChannels?: string[];
  themeColor?: string;
  showSafeBadge?: boolean;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING_VIDEO = 'PROCESSING_VIDEO',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
