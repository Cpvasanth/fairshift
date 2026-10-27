import { flags, type Flag } from "./fatigue";
import { hours } from "./format";
import { computeWeek, lastWeek, type Week } from "./pay";
import type { Pack } from "./rules";
import type { Worker } from "./seed";

export type CrewRow = { w: Worker; pay: Week; flags: Flag[] };

// One worker's last 7 days under their site's rule pack: the pay receipt and the fatigue flags.
export const workerWeek = (w: Worker, pack: Pack, now: number): CrewRow => ({
  w,
  pay: computeWeek(lastWeek(w.shifts, now), pack, w.wagePaise),
  flags: flags(w.shifts, now),
});

const sum = <T>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);

// Everything the dashboard shows for one site, computed once from the workers' own records.
export function siteWeek(all: Worker[], pack: Pack, now: number) {
  const crew = all.filter((w) => w.packId === pack.id).map((w) => workerWeek(w, pack, now));
  const dates = [...new Set(crew.flatMap((c) => c.pay.days.map((d) => d.date)))].sort();
  // Per-day crew minutes; each worker's minutes beyond the daily limit count as overtime.
  const perDay = dates.map((date) => {
    const mins = crew.map((c) => c.pay.days.find((d) => d.date === date)?.minutes ?? 0);
    return { date, minutes: sum(mins, (m) => m), otMinutes: sum(mins, (m) => Math.max(0, m - pack.dailyHours * 60)) };
  });
  return {
    crew,
    dates,
    perDay,
    otPaise: sum(crew, (c) => c.pay.otPaise),
    otMinutes: sum(crew, (c) => c.pay.otMinutes),
    flagged: crew.filter((c) => c.flags.length > 0).length,
    highFlags: sum(crew, (c) => c.flags.filter((f) => f.level === "HIGH").length),
    longest: crew.reduce<CrewRow | undefined>((a, c) => (!a || c.pay.totalMinutes > a.pay.totalMinutes ? c : a), undefined),
  };
}

// Spreadsheet-safe cell: quote commas, quotes and newlines; defuse text starting with = + - @ (formula injection).
export function csvCell(value: string | number): string {
  const s = typeof value === "string" && /^[=+\-@]/.test(value) ? `'${value}` : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const payCsv = (crew: CrewRow[], pack: Pack) =>
  [
    ["Worker", "Role", "Site", "Hours", "Overtime hours", "Rate per hour (Rs)", "Owed (Rs)"],
    ...crew.map(({ w, pay }) => [
      w.name,
      w.role,
      pack.site,
      hours(pay.totalMinutes),
      hours(pay.otMinutes),
      (pay.ratePaisePerHour / 100).toFixed(2),
      (pay.totalPaise / 100).toFixed(2),
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
