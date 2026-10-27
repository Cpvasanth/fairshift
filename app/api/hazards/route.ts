import { z } from "zod";
import { analyze } from "@/lib/ai";
import { packs } from "@/lib/rules";
import { finalSeverity } from "@/lib/severity";
import { store, type Hazard } from "@/lib/store";

// Every hazard read and write lives in this one route so they share one in-memory store (see lib/store.ts).

const MAX_AUDIO = 1_000_000;
const MAX_TEXT = 500;

export async function POST(req: Request) {
  const form = await req.formData();
  const pack = packs[String(form.get("packId"))];
  if (!pack) return Response.json({ error: "unknown site" }, { status: 400 });
  const audio = form.get("audio");
  const text = form.get("text");
  let input;
  if (audio instanceof File && audio.size > 0) {
    if (audio.size > MAX_AUDIO) return Response.json({ error: "audio over 1 MB" }, { status: 413 });
    // Gemini wants the bare mime type ("audio/webm"), not "audio/webm;codecs=opus". Audio is never stored.
    input = { audio: Buffer.from(await audio.arrayBuffer()), mime: audio.type.split(";")[0] || "audio/webm" };
  } else if (typeof text === "string" && text.trim() && text.length <= MAX_TEXT) {
    input = { text: text.trim() };
  } else {
    return Response.json({ error: `send audio or text (<= ${MAX_TEXT} chars)` }, { status: 400 });
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
  return Response.json({ id: hazard.id, category: hazard.category, severity: hazard.severity, summaryEn: hazard.summaryEn });
}

// Worker: ?ids=a,b -> status of their own receipts only. Admin board: ?v=<version> -> 204 when unchanged.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const ids = params.get("ids");
  if (ids !== null) {
    const wanted = new Set(ids.split(",").slice(0, 50));
    return Response.json(
      store.hazards.filter((h) => wanted.has(h.id)).map(({ id, status, category, severity }) => ({ id, status, category, severity })),
    );
  }
  if (params.get("v") === String(store.version)) return new Response(null, { status: 204 });
  return Response.json({ version: store.version, hazards: store.hazards });
}

const patchBody = z.object({ id: z.string().max(64), status: z.enum(["OPEN", "ACKNOWLEDGED", "FIXED"]) });

export async function PATCH(req: Request) {
  const body = patchBody.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "bad request" }, { status: 400 });
  const hazard = store.hazards.find((h) => h.id === body.data.id);
  if (!hazard) return Response.json({ error: "not found" }, { status: 404 });
  hazard.status = body.data.status;
  store.version++;
  return Response.json({ id: hazard.id, status: hazard.status });
}
