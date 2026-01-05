
export interface ScoreBreakdown {
  skills: number;       // 40%
  keywords: number;     // 25%
  experience: number;   // 20%
  format: number;       // 10%
  grammar: number;      // 5%
}

export interface AnalysisResult {
  atsScore: number;
  breakdown: ScoreBreakdown;
  matchingSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  keywordAnalysis: {
    keyword: string;
    relevance: number; // 0-100
  }[];
  summary: string;
  suggestedJobRoles: string[];
  radarMetrics: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
}

export interface AppState {
  resumeText: string;
  rawResumeText: string;
  jobDescription: string;
  isAnalyzing: boolean;
  analysisStep: string;
  result: AnalysisResult | null;
  error: string | null;
}
