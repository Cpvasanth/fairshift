import { z } from "zod";
import { analyze, analyzeVoice, type Input } from "@/lib/ai";
import type { Board, Filed, Receipt, SealedFiled } from "@/lib/api";
import { clientKey, hit, type Window } from "@/lib/ratelimit";
import { packs } from "@/lib/rules";
import { isoWeek, unlockedGroups } from "@/lib/sealed";
import { finalSeverity } from "@/lib/severity";
import { store, type Hazard } from "@/lib/store";

// Every hazard and Sealed Voice read and write lives in this one route so they share one in-memory store
// (see lib/store.ts). POST kind=voice files sealed feedback; everything else is a hazard.

const MAX_AUDIO = 1_000_000;
const MAX_TEXT = 500;
// Every report costs a Gemini call on a free-tier quota, so one client may file at most 8 per 10 minutes.
const REPORTS_PER_WINDOW = 8;
const WINDOW_MS = 10 * 60_000;
const windows = new Map<string, Window>();

// Multipart fields besides the audio file. Own keys only, so "constructor" or "__proto__" is never a site.
const reportFields = z.object({
  packId: z.string().refine((id) => Object.hasOwn(packs, id)),
  kind: z.enum(["hazard", "voice"]),
  text: z.string().trim().max(MAX_TEXT).optional(),
});
const bad = (error: string, status = 400) => Response.json({ error }, { status });

export async function POST(req: Request) {
  const limit = hit(windows, clientKey(req.headers), REPORTS_PER_WINDOW, WINDOW_MS, Date.now());
  if (!limit.ok)
    return Response.json({ error: "too many reports" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  const form = await req.formData().catch(() => null);
  if (!form) return bad("expected multipart form data");
  const fields = reportFields.safeParse({
    packId: form.get("packId"),
    kind: form.get("kind") ?? "hazard",
    text: form.get("text") ?? undefined,
  });
  if (!fields.success) return bad(`unknown site, or text over ${MAX_TEXT} chars`);
  const { kind, text } = fields.data;
  const pack = packs[fields.data.packId];
  const audio = form.get("audio");
  let input: Input;
  if (audio instanceof File && audio.size > 0) {
    if (audio.size > MAX_AUDIO) return bad("audio over 1 MB", 413);
    // Gemini wants the bare mime type ("audio/webm"), not "audio/webm;codecs=opus". Audio is never stored.
    input = { audio: Buffer.from(await audio.arrayBuffer()), mime: audio.type.split(";")[0] || "audio/webm" };
  } else if (text) {
    input = { text };
  } else {
    return bad("send audio or text");
  }
  if (kind === "voice") {
    // Site, theme, English summary and ISO week only: no worker id, no timestamp.
    const { theme, summaryEn } = await analyzeVoice(input, pack);
    store.voices.push({ packId: pack.id, theme, summaryEn, week: isoWeek(Date.now()) });
    store.version++;
    return Response.json({ theme } satisfies SealedFiled);
  }
  const a = await analyze(input, pack);
  const hazard: Hazard = {
    id: crypto.randomUUID(),
    packId: pack.id,
    category: a.category,
    severity: finalSeverity(a.severity, a.category, pack),
    summaryEn: a.summaryEn,
    transcript: a.transcript,
    language: a.language,
    needsReview: a.needsReview,
    status: "OPEN",
    createdAt: Date.now(),
  };
  store.hazards.unshift(hazard);
  store.version++;
  return Response.json({ id: hazard.id, category: hazard.category, severity: hazard.severity, summaryEn: hazard.summaryEn } satisfies Filed);
}

// Worker: ?ids=a,b -> status of their own receipts only. Admin board: ?v=<version> -> 204 when unchanged.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  // Sealed Voice: only groups that reached 5 ever leave the server.
  if (params.has("sealed")) return Response.json(unlockedGroups(store.voices, Date.now()));
  const ids = params.get("ids");
  if (ids !== null) {
    const wanted = new Set(ids.split(",").slice(0, 50));
    return Response.json(
      store.hazards.filter((h) => wanted.has(h.id)).map(({ id, status, category, severity }): Receipt => ({ id, status, category, severity })),
    );
  }
  if (params.get("v") === String(store.version)) return new Response(null, { status: 204 });
  return Response.json({ version: store.version, hazards: store.hazards } satisfies Board);
}

const patchBody = z.object({ id: z.string().max(64), status: z.enum(["OPEN", "ACKNOWLEDGED", "FIXED"]) });

export async function PATCH(req: Request) {
  const body = patchBody.safeParse(await req.json().catch(() => null));
  if (!body.success) return bad("bad request");
  const hazard = store.hazards.find((h) => h.id === body.data.id);
  if (!hazard) return bad("not found", 404);
  hazard.status = body.data.status;
  const now = Date.now();
  if (hazard.status !== "OPEN") hazard.ackAt ??= now;
  if (hazard.status === "FIXED") hazard.fixedAt ??= now;
  store.version++;
  return Response.json({ id: hazard.id, status: hazard.status });
}
