"use client";

// Spike page (delete after the go/no-go): record Tamil -> Gemini JSON, and Tamil read-aloud.
import { useEffect, useRef, useState } from "react";

const SAY = "பிளாக் சி சாரம், மூன்றாவது மாடி, கைப்பிடி இல்லை";
const READ = "உங்கள் புகார் சரி செய்யப்பட்டது. நன்றி.";

export default function Spike() {
  const [recording, setRecording] = useState(false);
  const [mime, setMime] = useState("");
  const [out, setOut] = useState("");
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const rec = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const load = () => setVoices(speechSynthesis.getVoices());
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  async function send(body: FormData) {
    setOut("Sending…");
    const res = await fetch("/api/spike", { method: "POST", body });
    setOut(`HTTP ${res.status}\n${JSON.stringify(await res.json(), null, 2)}`);
  }

  async function toggle() {
    if (rec.current) return rec.current.stop();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const type = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
    const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => chunks.push(e.data);
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      rec.current = null;
      setRecording(false);
      const blob = new Blob(chunks, { type: r.mimeType });
      setMime(`${r.mimeType} · ${blob.size} bytes`);
      const fd = new FormData();
      fd.append("audio", blob, "clip.webm");
      send(fd);
    };
    r.start();
    rec.current = r;
    setRecording(true);
    setTimeout(() => r.state === "recording" && r.stop(), 10_000);
  }

  const ta = voices.find((v) => v.lang.toLowerCase().startsWith("ta"));

  function speak() {
    const u = new SpeechSynthesisUtterance(READ);
    u.lang = "ta-IN";
    if (ta) u.voice = ta;
    speechSynthesis.speak(u);
  }

  return (
    <main className="mx-auto max-w-xl p-4 space-y-6 text-gray-900">
      <h1 className="text-2xl font-bold">FairShift spike</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Tamil audio → Gemini</h2>
        <p>
          Say: <span lang="ta" className="font-semibold">{SAY}</span>
        </p>
        <button
          onClick={toggle}
          aria-pressed={recording}
          className="min-h-12 w-full rounded bg-blue-700 px-4 py-3 text-white"
        >
          {recording ? "Stop (auto-stops at 10s)" : "Record"}
        </button>
        {mime && <p className="text-gray-700">Recorded: {mime}</p>}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData();
            fd.append("text", text);
            send(fd);
          }}
        >
          <label className="sr-only" htmlFor="t">Or type Tamil text</label>
          <input
            id="t"
            lang="ta"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Or type / voice-type Tamil"
            className="min-h-12 flex-1 rounded border border-gray-700 px-3"
          />
          <button className="min-h-12 rounded bg-gray-900 px-4 text-white">Send</button>
        </form>
        <pre className="whitespace-pre-wrap rounded bg-gray-100 p-3 text-sm" role="status">{out}</pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Tamil read-aloud</h2>
        <p>
          Tamil voice:{" "}
          <strong>{ta ? `${ta.name} (${ta.lang})` : `none found among ${voices.length} voices`}</strong>
        </p>
        <button onClick={speak} className="min-h-12 w-full rounded bg-green-800 px-4 py-3 text-white">
          Read aloud: <span lang="ta">{READ}</span>
        </button>
        <details>
          <summary>All voices</summary>
          <ul className="text-sm">
            {voices.map((v) => (
              <li key={v.voiceURI}>
                {v.lang} · {v.name}
              </li>
            ))}
          </ul>
        </details>
      </section>
    </main>
  );
}
