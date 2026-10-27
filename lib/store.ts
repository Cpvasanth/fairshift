import type { Severity } from "./rules";

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

// ponytail: in-memory store, only consistent while one warm Vercel instance serves /api/hazards
// (all reads and writes go through that single route). Move to Supabase/Upstash when it must survive cold starts.
const g = globalThis as unknown as { __fairshift?: { hazards: Hazard[]; version: number } };
export const store = (g.__fairshift ??= { hazards: seedHazards(), version: 1 });
