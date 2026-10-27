import { dayKey, type Shift } from "./pay";

export type Flag = { level: "HIGH" | "WARN"; text: string; action: string };

const DAY = 86_400_000;

// Explainable conditions with an action, not a quit-risk score.
export function flags(shifts: Shift[], now: number): Flag[] {
  const out: Flag[] = [];
  const week = shifts.filter((s) => s.start >= now - 7 * DAY);
  const weekH = week.reduce((a, s) => a + s.minutes, 0) / 60;
  if (weekH > 60) out.push({ level: "HIGH", text: `${weekH}h in 7 days`, action: "Cap hours this week" });
  else if (weekH > 48) out.push({ level: "WARN", text: `${weekH}h in 7 days`, action: "Plan lighter shifts" });

  const sorted = [...shifts].sort((a, b) => a.start - b.start);
  const days = new Set(sorted.map((s) => dayKey(s.start)));
  let streak = 0;
  if (sorted.length) for (let t = sorted.at(-1)!.start; days.has(dayKey(t)); t -= DAY) streak++;
  if (streak >= 7) out.push({ level: "HIGH", text: `${streak} days without rest`, action: "Schedule a day off" });

  let minRest = Infinity;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start < now - 7 * DAY) continue;
    const prevEnd = sorted[i - 1].start + sorted[i - 1].minutes * 60_000;
    minRest = Math.min(minRest, (sorted[i].start - prevEnd) / 3_600_000);
  }
  if (minRest < 10) out.push({ level: "WARN", text: `Only ${minRest}h rest between shifts`, action: "Start later tomorrow" });
  return out;
}
