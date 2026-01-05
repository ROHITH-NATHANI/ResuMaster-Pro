export interface ScoreBreakdown {
  skills: number;           // 45%
  experience: number;       // 30%
  strategicImpact: number;  // 15%
  format: number;           // 5%
  grammar: number;          // 5%
}

export interface InterviewQuestion {
  question: string;
  focus: string;
  suggestedAngle: string;
}

export interface RoadmapStep {
  phase: string;
  action: string;
  impact: string;
}

export interface AnalysisResult {
  atsScore: number;
  breakdown: ScoreBreakdown;
  matchingSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  summary: string;
  refinedSummary: string;
  suggestedJobRoles: string[];
  coverLetter: string;
  interviewPrep: InterviewQuestion[];
  careerRoadmap: RoadmapStep[];
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