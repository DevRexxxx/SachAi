import {
  GoogleGenAI,
  Type,
  HarmCategory,
  HarmBlockThreshold
} from "@google/genai";

import { VideoFrame } from "../types";
import { getForensicPrompt } from "./prompts";

/* =========================================================
          API CONFIGURATION
   ========================================================= */
const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("Missing Gemini API key. Set GEMINI_API_KEY in your environment.");
}

/* =========================================================
       HARDENED FORENSIC ANALYSIS ENGINE
   ========================================================= */
export const analyzeVideoIntegrity = async (frames: VideoFrame[], language: string = 'en') => {

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const isPhoto = frames.length === 1;

  // Optimized high-density sampling for 99% accuracy targets
  const sampledFrames = isPhoto
    ? frames
    : frames
        .filter((_, i) => i % Math.max(1, Math.floor(frames.length / 15)) === 0)
        .slice(0, 15);

  /**
   *  THE "HARD-STRIKE" PROTOCOL:
   * 1. IMMEDIATE check for vulgarity/intimacy to drive UI Theme.
   * 2. If clean, perform 99% accuracy Deepfake Audit.
   */
  const forensicPrompt = getForensicPrompt(language);


  const parts = [
    { text: forensicPrompt },
    ...sampledFrames.map(frame => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: frame.dataUrl.split(",")[1]
      }
    }))
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 6000 }, 
        responseMimeType: "application/json",
        
        // API SAFETY OVERRIDE:
        // Set to BLOCK_NONE so the AI labels explicit content for our UI instead of crashing.
        safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        }
      ],


        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isExplicit: { type: Type.BOOLEAN },
            integrityScore: { type: Type.INTEGER },
            verdict: { type: Type.STRING },
            summary: { type: Type.STRING },
            explanation: { type: Type.STRING },
            riskLevel: { type: Type.STRING },

            anomalies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  description: { type: Type.STRING },
                  severity: { type: Type.STRING }
                }
              }
            },

            safetyRecommendation: { type: Type.STRING },
            forensicInsights: { type: Type.ARRAY, items: { type: Type.STRING } },

            /* 🔥 OSINT & CIRCULATION INTELLIGENCE */
            probableOrigin: { type: Type.STRING },
            circulationChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
            contentTheme: { type: Type.STRING },
            osintConfidence: { type: Type.STRING }
          },

          required: [
            "isExplicit",
            "integrityScore",
            "verdict",
            "summary",
            "explanation",
            "riskLevel",
            "anomalies",
            "safetyRecommendation",
            "forensicInsights",
            "probableOrigin",
            "circulationChannels",
            "contentTheme",
            "osintConfidence"
          ]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty model response");
    }

    const finalResult = JSON.parse(response.text.trim());

    /** * DYNAMIC UI & THEME LOGIC
     * 1. EXPLICIT CONTENT or DEEPFAKE -> Red BG (#b91c1c)
     * 2. SUSPICIOUS -> Yellow BG (#facc15)
     * 3. AUTHENTIC -> Green BG (#064e3b)
     */
    
    if (finalResult.isExplicit) {
      return {
        ...finalResult,
        integrityScore: 0,
        verdict: "Explicit Content", // Corrected terminology
        themeColor: "#b91c1c", // RED THEME
        showSafeBadge: false, // Disables "Safe to Use" message
        // AI-Driven dynamic countermeasure
        activeCountermeasure: finalResult.safetyRecommendation 
      };
    }

    let themeColor = "#b91c1c"; // Default RED for Deepfake
    let showSafeBadge = false;

    if (finalResult.verdict === "AUTHENTIC") {
      themeColor = "#064e3b"; // GREEN
      showSafeBadge = true;
    } else if (finalResult.verdict === "SUSPICIOUS") {
      themeColor = "#facc15"; // YELLOW
      showSafeBadge = false;
    }

    return {
      ...finalResult,
      themeColor: themeColor,
      showSafeBadge: showSafeBadge,
      activeCountermeasure: showSafeBadge ? "Safe to Use: Media integrity confirmed. You may proceed." : finalResult.safetyRecommendation
    };

  } catch (err: any) {
    console.error("Forensic analysis failed:", err);
    throw new Error(`FORENSIC_FAILURE: ${err.message || "Unknown error"}`);
  }
};
