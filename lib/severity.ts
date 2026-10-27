import type { Pack, Severity } from "./rules";

const rank: Record<Severity, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

// Gemini can raise a hazard's severity but never lower it below the rule pack's floor.
export function finalSeverity(ai: Severity, category: string, pack: Pack): Severity {
  const floor = pack.severityFloor[category];
  return floor && rank[floor] > rank[ai] ? floor : ai;
}
