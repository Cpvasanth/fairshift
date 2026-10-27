// Sealed Voice: "anonymous" is fake on a five-person crew, so feedback stays sealed until
// k workers at the same site raise the same theme. Items carry no worker id and no timestamp.
export type SealedItem = { packId: string; theme: string; summaryEn: string; week: string };

const IST = 5.5 * 3_600_000;
const DAY = 86_400_000;

// ISO-8601 week of the Asia/Kolkata date, e.g. "2026-W44".
export function isoWeek(t: number): string {
  const ist = new Date(t + IST);
  const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); // Thursday decides the year
  const week = Math.ceil(((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Groups by (site, theme) over the last 4 ISO weeks; only groups with >= k items ever leave the server.
export function unlockedGroups(items: SealedItem[], now: number, k = 5) {
  const weeks = new Set([0, 1, 2, 3].map((i) => isoWeek(now - i * 7 * DAY)));
  const groups = new Map<string, SealedItem[]>();
  for (const it of items) {
    if (!weeks.has(it.week)) continue;
    const key = `${it.packId}|${it.theme}`;
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  return [...groups.values()]
    .filter((g) => g.length >= k)
    .map((g) => ({ packId: g[0].packId, theme: g[0].theme, count: g.length, summaries: g.map((i) => i.summaryEn) }));
}
