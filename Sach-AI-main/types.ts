
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

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING_VIDEO = 'PROCESSING_VIDEO',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
