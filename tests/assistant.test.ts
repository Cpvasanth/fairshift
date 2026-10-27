import { describe, expect, it } from "vitest";
import { adminPriorities, workerAdvice, type Person } from "../lib/assistant";
import { flags, type Flag } from "../lib/fatigue";
import { computeWeek, type Shift } from "../lib/pay";
import { packs } from "../lib/rules";
import type { Hazard } from "../lib/store";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const now = Date.UTC(2026, 9, 27, 6, 0);
const site = packs.construction;
const daily = (n: number, h: number): Shift[] =>
  Array.from({ length: n }, (_, i) => ({ start: now - (i + 1) * DAY + HOUR, minutes: h * 60 }));
const advise = (s: Shift[]) => workerAdvice(computeWeek(s.filter((x) => x.start >= now - 7 * DAY), site, 70_000), flags(s, now), site);

describe("worker assistant", () => {
  it("13 straight 10h days: ask for a day off first, then hours, then check overtime pay", () => {
    const a = advise(daily(13, 10));
    expect(a.map((x) => [x.id, x.urgency])).toEqual([
      ["streak", "act"],
      ["hours", "act"],
      ["overtime", "check"],
    ]);
    expect(a[0].en).toContain("13 days in a row");
  });
  it("a normal week: nothing to do", () => {
    expect(advise(daily(5, 8)).map((x) => x.id)).toEqual(["ok"]);
  });
  it("long days but rested: only check the overtime pay, with the amount", () => {
    const a = advise(daily(3, 12));
    expect(a.map((x) => x.id)).toEqual(["overtime"]);
    expect(a[0].en).toContain("Rs 2,100.00");
  });
  it("every step has Tamil text and the rule behind it", () => {
    for (const x of advise(daily(13, 10))) {
      expect(x.ta).toMatch(/[஀-௿]/);
      expect(x.why.length).toBeGreaterThan(0);
    }
  });
});

const hazard = (id: string, severity: Hazard["severity"], ageH: number, extra: Partial<Hazard> = {}): Hazard => ({
  id,
  packId: "construction",
  category: "electrical",
  severity,
  summaryEn: "",
  transcript: "",
  language: "en",
  needsReview: false,
  status: "OPEN",
  createdAt: now - ageH * HOUR,
  ...extra,
});
const flag = (level: Flag["level"]): Flag => ({ kind: level === "HIGH" ? "streak" : "rest", level, value: 1, text: "t", action: "Do it" });
const people: Person[] = [
  { id: "m", name: "Murugan", flags: [flag("WARN")] },
  { id: "s", name: "Selvi", flags: [flag("HIGH")] },
];
const ids = (hs: Hazard[], limit = 10) =>
  adminPriorities(hs, people, [{ packId: "construction", theme: "drinking water", count: 5, summaries: [] }], now, limit).map((p) => p.id);

describe("admin priorities", () => {
  it("safety first: HIGH hazard, unreadable report, exhausted worker, MEDIUM hazard, sealed theme, warning", () => {
    expect(ids([hazard("med", "MEDIUM", 1), hazard("high", "HIGH", 1), hazard("review", "MEDIUM", 1, { needsReview: true })])).toEqual([
      "hazard-high",
      "hazard-review",
      "flag-s-streak",
      "hazard-med",
      "sealed-drinking water",
      "flag-m-rest",
    ]);
  });
  it("fixed hazards drop off; the oldest open HIGH hazard comes first", () => {
    const hs = [hazard("new", "HIGH", 1), hazard("old", "HIGH", 5), hazard("done", "HIGH", 9, { status: "FIXED" })];
    expect(ids(hs, 2)).toEqual(["hazard-old", "hazard-new"]);
  });
  it("says why, in plain words", () => {
    const [first] = adminPriorities([hazard("h", "HIGH", 2, { status: "ACKNOWLEDGED" })], [], [], now);
    expect(first).toMatchObject({ urgency: "act", title: "Fix: electrical", why: "HIGH hazard, reported 2h 0m ago", href: "#hazards" });
  });
});
