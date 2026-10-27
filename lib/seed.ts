import type { Shift } from "./pay";

// Fictional demo data. Shifts are placed relative to boot time so "the last 7 days" always has data.
export type Worker = { id: string; name: string; role: string; packId: string; wagePaise: number; shifts: Shift[] };

const DAY = 86_400_000;
const HOUR = 3_600_000;
const now = Date.now();
const run = (daysBack: number[], hours: number, offsetH = 1): Shift[] =>
  daysBack.map((d) => ({ start: now - d * DAY + offsetH * HOUR, minutes: hours * 60 }));
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const workers: Record<string, Worker> = {
  murugan: {
    id: "murugan", name: "Murugan", role: "Mason", packId: "construction",
    wagePaise: 70_000, // Rs 700/day
    shifts: run(range(1, 13), 10), // 13 straight 10h days
  },
  selvi: {
    id: "selvi", name: "Selvi", role: "Helper", packId: "construction",
    wagePaise: 55_000,
    shifts: [...run([1, 3, 4], 8), { start: now - 2 * DAY + 9 * HOUR, minutes: 8 * 60 }], // 8h rest before yesterday
  },
  ravi: {
    id: "ravi", name: "Ravi", role: "Security guard", packId: "college",
    wagePaise: 1_500_000, // Rs 15,000/month
    shifts: run([...range(1, 6), ...range(8, 13)], 12), // 12h nights, 6 a week
  },
  lakshmi: {
    id: "lakshmi", name: "Lakshmi", role: "Housekeeping", packId: "college",
    wagePaise: 1_200_000,
    shifts: run(range(1, 5), 8),
  },
};

export { now as seededAt };
