import { describe, expect, it } from "vitest";
import { flags } from "../lib/fatigue";
import type { Shift } from "../lib/pay";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const now = Date.UTC(2026, 9, 27, 6, 0);
const daily = (n: number, hours: number): Shift[] =>
  Array.from({ length: n }, (_, i) => ({ start: now - (i + 1) * DAY + HOUR, minutes: hours * 60 }));
const actions = (s: Shift[]) => flags(s, now).map((f) => f.action);

describe("fatigue flags", () => {
  it("13 straight days -> schedule a day off", () => {
    expect(actions(daily(13, 8))).toContain("Schedule a day off");
  });
  it("6 straight days -> no rest-day flag", () => {
    expect(actions(daily(6, 8))).not.toContain("Schedule a day off");
  });
  it("62h in 7 days -> HIGH cap hours", () => {
    const f = flags([...daily(6, 10), { start: now - 7 * DAY + 2 * HOUR, minutes: 120 }], now);
    expect(f).toContainEqual(expect.objectContaining({ level: "HIGH", action: "Cap hours this week" }));
  });
  it("45h in 7 days -> no hours flag", () => {
    expect(flags(daily(5, 9), now)).toEqual([]);
  });
  it("9h rest between shifts -> WARN start later", () => {
    const s: Shift[] = [
      { start: now - DAY, minutes: 8 * 60 },
      { start: now - DAY + 17 * HOUR, minutes: 8 * 60 },
    ];
    expect(flags(s, now)).toContainEqual(expect.objectContaining({ level: "WARN", action: "Start later tomorrow" }));
  });
});
