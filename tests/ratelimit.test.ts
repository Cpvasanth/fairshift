import { describe, expect, it } from "vitest";
import { clientKey, hit, type Window } from "../lib/ratelimit";

const MIN = 60_000;

describe("rate limit", () => {
  it("allows the limit, blocks the next one and says when to retry", () => {
    const w = new Map<string, Window>();
    for (let i = 0; i < 3; i++) expect(hit(w, "a", 3, 10 * MIN, 0).ok).toBe(true);
    expect(hit(w, "a", 3, 10 * MIN, 4 * MIN)).toEqual({ ok: false, retryAfter: 360 });
  });

  it("resets after the window", () => {
    const w = new Map<string, Window>();
    for (let i = 0; i < 4; i++) hit(w, "a", 3, 10 * MIN, 0);
    expect(hit(w, "a", 3, 10 * MIN, 10 * MIN).ok).toBe(true);
  });

  it("counts each client separately", () => {
    const w = new Map<string, Window>();
    for (let i = 0; i < 4; i++) hit(w, "a", 3, 10 * MIN, 0);
    expect(hit(w, "b", 3, 10 * MIN, 0).ok).toBe(true);
  });

  it("drops expired windows once the map grows large", () => {
    const w = new Map<string, Window>();
    for (let i = 0; i <= 5_000; i++) hit(w, `ip${i}`, 3, MIN, 0);
    hit(w, "fresh", 3, MIN, 2 * MIN);
    expect(w.size).toBe(1);
  });

  it("keys on the first forwarded address", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientKey(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientKey(new Headers())).toBe("local");
  });
});
