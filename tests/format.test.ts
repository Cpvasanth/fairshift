import { describe, expect, it } from "vitest";
import { ago, hours, inr, rupees, weekday } from "../lib/format";

describe("display helpers", () => {
  it("formats receipts in rupees and paise, grouped the Indian way", () => {
    expect(rupees(80_505_049)).toBe("Rs 8,05,050.49");
  });
  it("rounds headline rupees", () => {
    expect(inr(80_505_049)).toBe("₹8,05,050");
  });
  it("shows hours to one decimal", () => {
    expect(hours(605)).toBe(10.1);
  });
  it("names the weekday of a day key", () => {
    expect(weekday("2026-10-27")).toBe("Tue");
  });
  it("shortens elapsed time", () => {
    expect([ago(20_000), ago(12 * 60_000), ago(185 * 60_000), ago(52 * 3_600_000)]).toEqual(["just now", "12m", "3h 5m", "2d 4h"]);
  });
});
