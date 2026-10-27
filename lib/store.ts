import type { Severity } from "./rules";
import { isoWeek, type SealedItem } from "./sealed";

export type Status = "OPEN" | "ACKNOWLEDGED" | "FIXED";
// No reporter field on purpose: the worker keeps the random id as their receipt.
export type Hazard = {
  id: string;
  packId: string;
  category: string;
  severity: Severity;
  summaryEn: string;
  transcript: string;
  language: string;
  needsReview: boolean;
  status: Status;
  createdAt: number;
  ackAt?: number;
  fixedAt?: number;
};

const H = 3_600_000;
const seedHazards = (): Hazard[] => {
  const t = Date.now();
  const base = { transcript: "", language: "ta", needsReview: false };
  return [
    { ...base, id: "seed-1", packId: "construction", category: "electrical", severity: "HIGH", summaryEn: "Exposed wiring near the Block A lift shaft.", status: "FIXED", createdAt: t - 26 * H, ackAt: t - 25.8 * H, fixedAt: t - 24.5 * H },
    { ...base, id: "seed-2", packId: "construction", category: "no PPE", severity: "MEDIUM", summaryEn: "Helmets short for the evening crew.", status: "ACKNOWLEDGED", createdAt: t - 2 * H, ackAt: t - 1.5 * H },
    { ...base, id: "seed-4", packId: "construction", category: "heat stress", severity: "MEDIUM", summaryEn: "No shade or water break for the afternoon slab pour.", status: "FIXED", createdAt: t - 50 * H, ackAt: t - 49.7 * H, fixedAt: t - 48.9 * H },
    { ...base, id: "seed-3", packId: "college", category: "slippery floor", severity: "MEDIUM", summaryEn: "Wet floor outside the chemistry lab, no sign.", status: "OPEN", createdAt: t - 1 * H },
    { ...base, id: "seed-5", packId: "college", category: "fire exit blocked", severity: "HIGH", summaryEn: "Hostel block B fire exit chained shut at night.", status: "FIXED", createdAt: t - 30 * H, ackAt: t - 29.9 * H, fixedAt: t - 28 * H },
  ];
};

// Demo: 4 sealed "drinking water" reports at the construction site (a 5th unlocks the group), 2 "toilets" that
// stay sealed, and an already unlocked "shift length" group on campus.
const seedVoices = (): SealedItem[] => {
  const week = isoWeek(Date.now());
  const v = (packId: string, theme: string, summaryEn: string): SealedItem => ({ packId, theme, summaryEn, week });
  return [
    v("construction", "drinking water", "Drinking water runs out before the afternoon shift."),
    v("construction", "drinking water", "The water can on the third floor is empty most days."),
    v("construction", "drinking water", "No clean drinking water near Block C."),
    v("construction", "drinking water", "Workers buy their own water because the site supply is short."),
    v("construction", "toilets", "Toilets are not cleaned for days."),
    v("construction", "toilets", "Only one toilet for the whole crew."),
    ...["Night shifts run past 12 hours without relief.", "No relief guard during long night shifts.",
      "Shifts are extended at the last minute.", "Twelve-hour shifts six days a week.",
      "Double shifts when a guard is absent."].map((s) => v("college", "shift length", s)),
  ];
};

// ponytail: in-memory store, only consistent while one warm Vercel instance serves /api/hazards
// (all reads and writes go through that single route). Move to Supabase/Upstash when it must survive cold starts.
const g = globalThis as unknown as { __fairshift?: { hazards: Hazard[]; voices: SealedItem[]; version: number } };
export const store = (g.__fairshift ??= { hazards: seedHazards(), voices: seedVoices(), version: 1 });
