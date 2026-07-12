import { PlannerAgent } from "./PlannerAgent";
import { ExecutorAgent } from "./ExecutorAgent";
import { EvaluatorAgent } from "./EvaluatorAgent";

export async function runAgentPipeline(
  type: "video" | "image",
  inputData: any
) {
  const planner = new PlannerAgent();
  const executor = new ExecutorAgent();
  const evaluator = new EvaluatorAgent();

  const plan = planner.plan({ type });

  let data = inputData;

  for (const step of plan) {
    data = await executor.execute(step, data);
  }

  return evaluator.evaluate(data);
}
