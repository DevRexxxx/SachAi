import { VideoFrame, AgentResult } from "../types";

/* =========================================================
       HARDENED FORENSIC ANALYSIS ENGINE (LOCAL ML MODEL)
   ========================================================= */
export const analyzeVideoIntegrity = async (frames: VideoFrame[], language: string = 'en'): Promise<AgentResult> => {
  try {
    const response = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ frames, language })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Local model error: ${response.status} - ${errText}`);
    }

    const finalResult = await response.json();

    /** * DYNAMIC UI & THEME LOGIC
     * 1. EXPLICIT CONTENT or DEEPFAKE -> Red BG (#b91c1c)
     * 2. SUSPICIOUS -> Yellow BG (#facc15)
     * 3. AUTHENTIC -> Green BG (#064e3b)
     */
    
    if (finalResult.isExplicit) {
      return {
        ...finalResult,
        integrityScore: 0,
        verdict: "Explicit Content",
        themeColor: "#b91c1c", // RED THEME
        showSafeBadge: false,
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
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new Error("Connection refused: The local Python ML backend is not running on port 5000. Please start it using 'python app.py'.");
    }
    throw new Error(`FORENSIC_FAILURE: ${err.message}`);
  }
};
