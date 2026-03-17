export class EvaluatorAgent {
  evaluate(output: any) {
    return {
      safe: true,
      confidence: "medium",
      result: output
    };
  }
}
