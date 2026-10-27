import { describe, expect, it } from "vitest";
import { csvCell, payCsv, siteWeek } from "../lib/crew";
import { packs } from "../lib/rules";
import type { Worker } from "../lib/seed";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const now = Date.UTC(2026, 9, 27, 6, 0);
const worker = (id: string, packId: string, days: number[], h: number): Worker => ({
  id,
  name: id,
  role: "Mason",
  packId,
  wagePaise: 80_000,
  shifts: days.map((d) => ({ start: now - d * DAY + HOUR, minutes: h * 60 })),
});

describe("siteWeek", () => {
  const all = [worker("a", "construction", [1, 2], 10), worker("b", "construction", [1], 8), worker("c", "college", [1], 12)];
  const site = siteWeek(all, packs.construction, now);

  it("keeps only this site's crew", () => expect(site.crew.map((c) => c.w.id)).toEqual(["a", "b"]));
  it("adds up each day, counting only minutes beyond 8h per worker as overtime", () =>
    expect(site.perDay.map((d) => [d.minutes / 60, d.otMinutes / 60])).toEqual([
      [10, 2],
      [18, 2],
    ]));
  it("totals overtime pay and finds the longest week", () => {
    expect(site.otMinutes).toBe(4 * 60);
    expect(site.otPaise).toBe(80_000); // 4h x 2 x Rs 100/h
    expect(site.longest?.w.id).toBe("a");
  });
});

describe("pay CSV", () => {
  it("quotes commas and quotes, and defuses spreadsheet formulas", () => {
    expect(csvCell('Block "C", 3rd floor')).toBe('"Block ""C"", 3rd floor"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell(12.5)).toBe("12.5");
  });
  it("writes one row per worker under a header", () => {
    const rows = payCsv(siteWeek([worker("a", "construction", [1], 10)], packs.construction, now).crew, packs.construction).split("\n");
    expect(rows[0]).toBe("Worker,Role,Site,Hours,Overtime hours,Rate per hour (Rs),Owed (Rs)");
    expect(rows[1]).toBe("a,Mason,Velachery Tower,10,2,100.00,1200.00");
  });
});
