// Fixed-window rate limit kept in memory: exact while one warm instance serves the route (see lib/store.ts).
// Keys live only for their window, are never logged or persisted, and are the one place a client address is held.
export type Window = { count: number; resetAt: number };

export function hit(windows: Map<string, Window>, key: string, limit: number, windowMs: number, now: number) {
  const w = windows.get(key);
  if (!w || now >= w.resetAt) {
    if (windows.size > 5_000) for (const [k, v] of windows) if (now >= v.resetAt) windows.delete(k);
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  w.count++;
  return w.count <= limit ? { ok: true, retryAfter: 0 } : { ok: false, retryAfter: Math.ceil((w.resetAt - now) / 1000) };
}

// Vercel's edge sets x-forwarded-for itself, so its first entry is the real client address there.
export const clientKey = (headers: Headers) =>
  headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "local";
