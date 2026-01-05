import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeResume = async (resumeText: string, jobDescription: string): Promise<AnalysisResult> => {
  // Use the user-specified GEMINI_API_TOKEN, falling back to API_KEY if needed for environment compatibility
  const apiKey = process.env.GEMINI_API_TOKEN || process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Act as an elite executive recruiter and semantic NLP analyst. Conduct a deep context-aware alignment check between the provided resume and the job description.
  
  CRITICAL INSTRUCTION: Do NOT perform simple keyword matching. Focus on the semantic intent, depth of experience, and the qualitative "Strategic Impact" of the candidate's history.
  
  Focus on:
  - Contextual Relevance: Does the candidate's actual impact and responsibility level match the requirements?
  - Domain Wisdom: Identify underlying competencies and seniority even if terminology differs.
  - Strategic Alignment: Pinpoint how the candidate's trajectory fits the role's growth path.
  
  Resume:
  ${resumeText}
  
  Job Description:
  ${jobDescription}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `Return a highly structured professional analysis. 
        PURGE all mentions of "keywords". Use semantic reasoning to determine the "breakdown" values.
        The ATS Score should reflect the overall qualitative fit.
        
        Output MUST be valid JSON.
        The "radarMetrics" array must contain exactly 5 subjects: "Strategic Impact", "Technical Depth", "Leadership", "Role Alignment", and "Cultural/Soft Skills".`,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2000 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: { type: Type.NUMBER },
            breakdown: {
              type: Type.OBJECT,
              properties: {
                skills: { type: Type.NUMBER },
                experience: { type: Type.NUMBER },
                strategicImpact: { type: Type.NUMBER },
                format: { type: Type.NUMBER },
                grammar: { type: Type.NUMBER }
              },
              required: ["skills", "experience", "strategicImpact", "format", "grammar"]
            },
            matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            suggestedJobRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
            radarMetrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  A: { type: Type.NUMBER },
                  fullMark: { type: Type.NUMBER }
                }
              }
            }
          },
          required: ["atsScore", "breakdown", "matchingSkills", "missingSkills", "recommendations", "summary", "suggestedJobRoles", "radarMetrics"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Analysis engine failed to produce a report.");
    }

    return JSON.parse(textOutput);
  } catch (error: any) {
    console.error("Deep Analysis Error:", error);
    if (error.message?.includes("429")) {
      throw new Error("Rate limit reached. Please wait a moment before trying again.");
    }
    throw new Error(error.message || "Failed to finalize the analysis.");
  }
};