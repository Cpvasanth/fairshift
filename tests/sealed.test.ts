import { describe, expect, it } from "vitest";
import { isoWeek, unlockedGroups, type SealedItem } from "../lib/sealed";

const now = Date.UTC(2026, 9, 27, 6, 0); // Tue 27 Oct 2026
const week = isoWeek(now);
const items = (n: number, over: Partial<SealedItem> = {}): SealedItem[] =>
  Array.from({ length: n }, () => ({ packId: "construction", theme: "drinking water", summaryEn: "No water.", week, ...over }));

describe("isoWeek", () => {
  it("27 Oct 2026 is week 44", () => expect(week).toBe("2026-W44"));
  it("1 Jan 2027 still belongs to 2026-W53", () => expect(isoWeek(Date.UTC(2027, 0, 1, 6))).toBe("2026-W53"));
  it("uses the India date: Sunday 23:30 IST is still the old week", () =>
    expect(isoWeek(Date.UTC(2026, 10, 1, 18, 0))).toBe("2026-W44"));
});

describe("unlockedGroups", () => {
  it("4 reports stay sealed", () => expect(unlockedGroups(items(4), now)).toEqual([]));
  it("5 reports unlock as one group", () =>
    expect(unlockedGroups(items(5), now)).toEqual([
      { packId: "construction", theme: "drinking water", count: 5, summaries: Array(5).fill("No water.") },
    ]));
  it("other sites and other themes never combine", () => {
    const mixed = [...items(3), ...items(2, { packId: "college" }), ...items(2, { theme: "toilets" })];
    expect(unlockedGroups(mixed, now)).toEqual([]);
  });
  it("reports older than 4 weeks do not count", () => {
    const old = items(1, { week: isoWeek(now - 5 * 7 * 86_400_000) });
    expect(unlockedGroups([...items(4), ...old], now)).toEqual([]);
  });
});
