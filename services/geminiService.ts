import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeResume = async (resumeText: string, jobDescription: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Act as an elite executive recruiter and semantic NLP analyst. 
  Conduct a deep context-aware alignment check between the provided resume and the job description.
  
  CRITICAL INSTRUCTION: Generate a comprehensive "Career Intelligence Package".
  
  1. ANALYZE: Qualitative match score (ATS Index) based on semantic intent, not just keyword frequency.
  2. REFINE: Rewrite the candidate's professional summary to be 300% more impactful for THIS specific role.
  3. ARCHITECT: Write a high-conversion, strategic Cover Letter (approx 250 words) that bridges the gaps found in the resume.
  4. PREPARE: Generate 3 high-stakes interview questions the candidate is likely to face, focusing on their "growth opportunities" or gaps.
  5. MAP: Create a 3-step Career Roadmap for the next 90 days.
  
  Resume:
  ${resumeText}
  
  Job Description:
  ${jobDescription}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `Return a highly structured professional analysis in JSON format.
        PURGE all mentions of the word "keywords". Focus on high-level semantic reasoning.
        
        The "radarMetrics" MUST have 5 subjects: "Impact", "Tech Depth", "Leadership", "Alignment", "Soft Skills".`,
        responseMimeType: "application/json",
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
            refinedSummary: { type: Type.STRING },
            coverLetter: { type: Type.STRING },
            suggestedJobRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
            interviewPrep: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  suggestedAngle: { type: Type.STRING }
                }
              }
            },
            careerRoadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  action: { type: Type.STRING },
                  impact: { type: Type.STRING }
                }
              }
            },
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
          required: ["atsScore", "breakdown", "matchingSkills", "missingSkills", "recommendations", "summary", "refinedSummary", "coverLetter", "suggestedJobRoles", "interviewPrep", "careerRoadmap", "radarMetrics"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) throw new Error("Intelligence engine failed to synthesize report.");

    return JSON.parse(textOutput);
  } catch (error: any) {
    console.error("Analysis Pipeline Exception:", error);
    throw new Error(error.message || "Failed to finalize the analysis report.");
  }
};

/**
 * Refines a specific piece of content (like a cover letter or summary) based on user instructions.
 */
export const refineContent = async (originalContent: string, instruction: string, context: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Refine the following content based on these instructions: "${instruction}".
  Keep the context of the job description in mind.
  
  Context (Job Description):
  ${context}
  
  Content to Edit:
  ${originalContent}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a professional editor. Return ONLY the edited text without any preamble or conversational filler."
      }
    });
    return response.text || originalContent;
  } catch (error) {
    console.error("Refinement error:", error);
    return originalContent;
  }
};

/**
 * Uses Google Search grounding to find news or cultural info about the target company.
 */
export const getMarketIntel = async (jobDescription: string): Promise<{ text: string, links: { uri: string, title: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Based on this job description, identify the company (if mentioned) and find recent news, company culture insights, or recent strategic moves that would help a candidate prepare for an interview.
  
  JD Snippet:
  ${jobDescription.substring(0, 1000)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "No specific market intel found.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = chunks
      .filter(c => c.web)
      .map(c => ({ uri: c.web!.uri, title: c.web!.title }));

    return { text, links };
  } catch (error) {
    console.error("Market Intel error:", error);
    return { text: "Search grounding failed. Focus on general company research.", links: [] };
  }
};
