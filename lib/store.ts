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
};

const seedHazards = (): Hazard[] => [
  { id: "seed-1", packId: "construction", category: "electrical", severity: "HIGH", summaryEn: "Exposed wiring near the Block A lift shaft.", transcript: "", language: "ta", needsReview: false, status: "FIXED", createdAt: Date.now() - 86_400_000 },
  { id: "seed-2", packId: "construction", category: "no PPE", severity: "MEDIUM", summaryEn: "Helmets short for the evening crew.", transcript: "", language: "ta", needsReview: false, status: "ACKNOWLEDGED", createdAt: Date.now() - 7_200_000 },
  { id: "seed-3", packId: "college", category: "slippery floor", severity: "MEDIUM", summaryEn: "Wet floor outside the chemistry lab, no sign.", transcript: "", language: "ta", needsReview: false, status: "OPEN", createdAt: Date.now() - 3_600_000 },
];

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
