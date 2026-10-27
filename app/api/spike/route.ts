import { analyze, model } from "@/lib/ai";

const MAX_AUDIO = 1_000_000;

export async function POST(req: Request) {
  const form = await req.formData();
  const audio = form.get("audio");
  const text = form.get("text");
  const started = Date.now();
  try {
    let result;
    if (audio instanceof File && audio.size > 0) {
      if (audio.size > MAX_AUDIO) return Response.json({ error: "audio over 1 MB" }, { status: 413 });
      // Gemini wants the bare mime type ("audio/webm"), not "audio/webm;codecs=opus".
      const mime = audio.type.split(";")[0] || "audio/webm";
      result = await analyze({ audio: Buffer.from(await audio.arrayBuffer()), mime });
    } else if (typeof text === "string" && text.trim() && text.length <= 500) {
      result = await analyze({ text });
    } else {
      return Response.json({ error: "send audio or text (<= 500 chars)" }, { status: 400 });
    }
    return Response.json({ model, ms: Date.now() - started, result });
  } catch (e) {
    // Spike only: surface the real error so we learn what broke.
    return Response.json({ model, ms: Date.now() - started, error: String(e) }, { status: 502 });
  }
}
