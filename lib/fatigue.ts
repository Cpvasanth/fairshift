import { dayKey, type Shift } from "./pay";

// kind + value are the machine-readable facts (the assistant decides from them); text + action are for people.
export type Flag = { kind: "hours" | "streak" | "rest"; level: "HIGH" | "WARN"; value: number; text: string; action: string };

const DAY = 86_400_000;

// Explainable conditions with an action, not a quit-risk score.
export function flags(shifts: Shift[], now: number): Flag[] {
  const out: Flag[] = [];
  const week = shifts.filter((s) => s.start >= now - 7 * DAY);
  const weekH = +(week.reduce((a, s) => a + s.minutes, 0) / 60).toFixed(1);
  if (weekH > 60) out.push({ kind: "hours", level: "HIGH", value: weekH, text: `${weekH}h in 7 days`, action: "Cap hours this week" });
  else if (weekH > 48) out.push({ kind: "hours", level: "WARN", value: weekH, text: `${weekH}h in 7 days`, action: "Plan lighter shifts" });

  const sorted = [...shifts].sort((a, b) => a.start - b.start);
  const days = new Set(sorted.map((s) => dayKey(s.start)));
  const last = sorted.at(-1);
  let streak = 0;
  if (last) for (let t = last.start; days.has(dayKey(t)); t -= DAY) streak++;
  if (streak >= 7) out.push({ kind: "streak", level: "HIGH", value: streak, text: `${streak} days without rest`, action: "Schedule a day off" });

  let minRest = Infinity;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start < now - 7 * DAY) continue;
    const prevEnd = sorted[i - 1].start + sorted[i - 1].minutes * 60_000;
    minRest = Math.min(minRest, (sorted[i].start - prevEnd) / 3_600_000);
  }
  if (minRest < 10) {
    const rest = +minRest.toFixed(1);
    out.push({ kind: "rest", level: "WARN", value: rest, text: `Only ${rest}h rest between shifts`, action: "Start later tomorrow" });
  }
  return out;
}
