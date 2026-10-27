import { describe, expect, it } from "vitest";
import { computeWeek, inr, weekday, type Shift } from "../lib/pay";
import { packs } from "../lib/rules";

const DAY = 86_400_000;
const base = Date.UTC(2026, 9, 19, 2, 30); // Mon 19 Oct 2026, 08:00 IST
const days = (n: number, hours: number): Shift[] =>
  Array.from({ length: n }, (_, i) => ({ start: base + i * DAY, minutes: hours * 60 }));
const site = packs.construction;
const campus = packs.college;

describe("computeWeek", () => {
  it("5 x 8h has no overtime", () => {
    expect(computeWeek(days(5, 8), site, 70_000).otMinutes).toBe(0);
  });
  it("6 x 10h gives 12h overtime (daily rule)", () => {
    expect(computeWeek(days(6, 10), site, 70_000).otMinutes).toBe(12 * 60);
  });
  it("7 x 8h gives 8h overtime (weekly rule)", () => {
    expect(computeWeek(days(7, 8), site, 70_000).otMinutes).toBe(8 * 60);
  });
  it("guard on 6 x 12h nights gets 24h overtime", () => {
    const r = computeWeek(days(6, 12), campus, 1_500_000);
    expect(r.otMinutes).toBe(24 * 60);
    expect(r.regularMinutes).toBe(48 * 60);
  });
  it("daily wage: Rs 700/day -> Rs 87.50/h, 2x for overtime", () => {
    const r = computeWeek(days(1, 10), site, 70_000);
    expect(r.ratePaisePerHour).toBe(8_750);
    expect(r.regularPaise).toBe(70_000);
    expect(r.otPaise).toBe(35_000);
    expect(r.totalPaise).toBe(105_000);
  });
  it("monthly wage uses 26 days x 8h and rounds to whole paise", () => {
    const r = computeWeek(days(1, 8), campus, 1_500_000);
    expect(r.ratePaisePerHour).toBe(7_212);
    expect(r.regularPaise).toBe(57_692); // 15,000 / 26 = 576.923...
    expect(Number.isInteger(r.totalPaise)).toBe(true);
  });
  it("a 12h shift is worth two 8h days of pay", () => {
    const twelve = computeWeek(days(1, 12), campus, 1_500_000).totalPaise;
    const eight = computeWeek(days(1, 8), campus, 1_500_000).totalPaise;
    expect(twelve).toBe(eight * 2);
  });
  it("a night shift counts to the date it started", () => {
    const night = { start: Date.UTC(2026, 9, 19, 14, 30), minutes: 12 * 60 }; // 20:00 IST
    expect(computeWeek([night], campus, 1_500_000).days).toEqual([{ date: "2026-10-19", minutes: 720 }]);
  });
});

describe("display helpers", () => {
  it("rounds headline rupees and groups them the Indian way", () => {
    expect(inr(80_505_049)).toBe("₹8,05,050");
  });
  it("names the weekday of a day key", () => {
    expect(weekday("2026-10-27")).toBe("Tue");
  });
});
