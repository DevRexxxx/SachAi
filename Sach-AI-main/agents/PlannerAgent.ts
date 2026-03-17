export class PlannerAgent {
  plan(input: { type: "video" | "image" }) {
    if (input.type === "video") {
      return [
        "extract_frames",
        "analyze_media",
        "classify_theme"
      ];
    }

    return [
      "analyze_media",
      "classify_theme"
    ];
  }
}
