export interface ScoreBreakdown {
  skills: number;           // 45%
  experience: number;       // 30%
  strategicImpact: number;  // 15%
  format: number;           // 5%
  grammar: number;          // 5%
}

export interface AnalysisResult {
  atsScore: number;
  breakdown: ScoreBreakdown;
  matchingSkills: string[];
  missingSkills: string[];
  recommendations: string[];
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