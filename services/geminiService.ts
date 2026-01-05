
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeResume = async (resumeText: string, jobDescription: string): Promise<AnalysisResult> => {
  // Always initialize with fresh instance to use latest API Key from environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `Act as an elite executive recruiter and NLP analyst. Conduct a deep semantic alignment check between the provided resume and the job description.
  
  Focus on:
  - Contextual Relevance: Does the candidate's past impact match the JD's requirements?
  - Transferable Wisdom: Identify underlying competencies even if the terminology differs.
  - Strategic Gaps: Pinpoint missing high-level responsibilities.
  
  Resume:
  ${resumeText}
  
  Job Description:
  ${jobDescription}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Upgraded to Pro for complex reasoning and deep analysis
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `Return a highly structured professional analysis. 
        Avoid generic keyword counting; prioritize semantic meaning.
        The ATS Score should reflect the overall strategic fit.
        
        Output MUST be valid JSON.
        The "radarMetrics" array must contain exactly 5 subjects: "Strategic Impact", "Technical Depth", "Leadership", "Role Alignment", and "Cultural/Soft Skills".`,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2000 }, // Added thinking budget for Pro model to improve analysis depth
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: { type: Type.NUMBER },
            breakdown: {
              type: Type.OBJECT,
              properties: {
                skills: { type: Type.NUMBER },
                keywords: { type: Type.NUMBER },
                experience: { type: Type.NUMBER },
                format: { type: Type.NUMBER },
                grammar: { type: Type.NUMBER }
              },
              required: ["skills", "keywords", "experience", "format", "grammar"]
            },
            matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywordAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING },
                  relevance: { type: Type.NUMBER }
                }
              }
            },
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
          required: ["atsScore", "breakdown", "matchingSkills", "missingSkills", "recommendations", "keywordAnalysis", "summary", "suggestedJobRoles", "radarMetrics"]
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
