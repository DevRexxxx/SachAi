import {
  GoogleGenAI,
  Type,
  HarmCategory,
  HarmBlockThreshold
} from "@google/genai";

import { VideoFrame } from "../types";

/* =========================================================
          API CONFIGURATION
   ========================================================= */
const API_KEY = "AIzaSyDRTUshTMRBdblYnjxa7WTHBNqgy0kp1yE";

/* =========================================================
       HARDENED FORENSIC ANALYSIS ENGINE
   ========================================================= */
export const analyzeVideoIntegrity = async (frames: VideoFrame[]) => {

  if (!API_KEY) {
    throw new Error("Missing API key.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY 
  });

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
const forensicPrompt = `
[STEP 1: VULGARITY HARD-CHECK]
Scan all frames for:
- Anatomical exposure (nudity)
- Intimate physical contact (hugging, kissing)
- Sexualized behavior or gestures

If detected:
- Set "isExplicit" = true
- Set "verdict" = "Explicit Content"
- Set "integrityScore" = 0
- Generate a stern legal + ethical warning about consent, privacy, and misuse

CRITICAL RULES:
- NEVER state "Safe to Use" when isExplicit is true
- NEVER suspend analysis messaging

--------------------------------------------------

[STEP 2: ADVANCED FORENSIC DEEPFAKE AUDIT – 99% PRECISION]
Only if isExplicit = false, perform a multi-layer forensic scan:

A. IDENTITY & FACE CONSISTENCY
- Detect face swapping
- Facial landmark drift across frames
- Identity mismatch between frames

B. EYE & BLINK FORENSICS
- Abnormal blink frequency
- Asymmetrical blinking
- Iris reflection mismatch

C. LIP-SYNC & MOUTH PHYSICS (video)
- Mouth shape vs jaw motion inconsistency
- Melting or blurred teeth/lips
- Unrealistic phoneme transitions

D. SKIN & GAN ARTIFACTS
- Over-smoothed or plastic skin
- Checkerboard GAN patterns
- Unreal pore distribution

E. LIGHTING & SHADOW PHYSICS
- Inconsistent light direction
- Face vs background shadow mismatch
- Impossible highlights or reflections

F. TEMPORAL & GEOMETRIC STABILITY
- Sub-pixel jitter
- Warping in background lines
- Temporal morphing artifacts

G. CAMERA & OPTICAL VALIDATION
- Impossible depth of field
- Motion blur inconsistency
- Rolling shutter anomalies

--------------------------------------------------

[STEP 3: OSINT & CIRCULATION INTELLIGENCE (INFERENCE-BASED)]
Using ONLY visual evidence (no live internet access), infer:

- Where this media is MOST LIKELY circulated
- What TYPE of content it represents

Analyze:
- Aspect ratio
- Compression quality
- Watermarks
- Text overlays
- Framing & camera perspective
- Visual language

Infer:
- probableOrigin (short description)
- circulationChannels (platform types)
- contentTheme (primary category)
- osintConfidence (Low | Medium | High)

Use probabilistic language like "Likely", "Possibly", "High probability".
NEVER claim confirmed sources or specific websites.

--------------------------------------------------

[SCORING & VERDICT RULES]
- AUTHENTIC: integrityScore 90–100
- SUSPICIOUS: integrityScore 41–89
- DEEPFAKE: integrityScore 0–40

The integrityScore MUST be justified in explanation.

--------------------------------------------------

[OUTPUT REQUIREMENTS – STRICT]
Return ONLY valid JSON matching the provided schema.
DO NOT include markdown.
DO NOT include extra text.
Ensure all required fields are present.

If media is DEEPFAKE or SUSPICIOUS:
- Include realistic misuse risks
- Include harm mitigation advice

Accuracy and forensic rigor are critical.
`;


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
