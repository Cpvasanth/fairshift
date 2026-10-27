"use client";

import { Lock, LockKeyhole, Mic, Square, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Filed, Receipt, SealedFiled } from "@/lib/api";
import type { Status } from "@/lib/store";
import Card from "./Card";
import { speak } from "./SpeakButton";
import { SeverityBadge, StatusBadge } from "./StatusBadge";

// Every message is English plus Tamil; the Tamil half is rendered with lang="ta" so it is pronounced correctly.
type Msg = { en: string; ta?: string };

// The worker's phone keeps the random receipt ids; the server never learns who reported.
const KEY = "fairshift.reports";
const said: Record<Status, string> = {
  OPEN: "உங்கள் புகார் பதிவானது.",
  ACKNOWLEDGED: "உங்கள் புகாரை மேலாளர் பார்த்தார்.",
  FIXED: "உங்கள் புகார் சரி செய்யப்பட்டது. நன்றி.",
};

const SEALED_TA = "உங்கள் கருத்து மூடி வைக்கப்பட்டது. ஐந்து பேர் ஒரே விஷயத்தைச் சொன்னால் மட்டுமே திறக்கப்படும்.";

const copy = {
  hazard: { ta: "ஆபத்தை தெரிவிக்க", en: "Report danger", Icon: TriangleAlert },
  voice: { ta: "மனம் திறந்து பேசுங்கள்", en: "Speak up (sealed)", Icon: LockKeyhole },
};

const loadIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};

// kind="voice" reuses the recorder for Sealed Voice: no receipt ids, no status polling.
export default function HazardReporter({ packId, kind = "hazard" }: { packId: string; kind?: "hazard" | "voice" }) {
  const [ids, setIds] = useState<string[]>([]);
  const [reports, setReports] = useState<Receipt[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<Msg | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const seen = useRef<Record<string, Status>>({});

  useEffect(() => {
    if (kind !== "hazard") return;
    const t = setTimeout(() => setIds(loadIds()), 0);
    return () => clearTimeout(t);
  }, [kind]);

  // Poll my receipts every 4s while the page is visible; read status changes aloud.
  useEffect(() => {
    if (!ids.length) return;
    let live = true;
    const tick = async () => {
      if (document.hidden) return;
      const res = await fetch(`/api/hazards?ids=${ids.join(",")}`).catch(() => null);
      if (!res?.ok || !live) return;
      const list: Receipt[] = await res.json();
      for (const r of list) {
        if (seen.current[r.id] && seen.current[r.id] !== r.status) {
          speak(said[r.status]);
          setMsg({ en: "Update", ta: said[r.status] });
        }
        seen.current[r.id] = r.status;
      }
      setReports(list);
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [ids]);

  async function submit(body: FormData) {
    body.append("packId", packId);
    body.append("kind", kind);
    setBusy(true);
    setMsg({ en: "Sending…", ta: "அனுப்புகிறது…" });
    try {
      const res = await fetch("/api/hazards", { method: "POST", body });
      if (res.status === 429) {
        setMsg({ en: "Too many reports from this phone. Please wait a few minutes.", ta: "சில நிமிடங்கள் கழித்து முயற்சிக்கவும்." });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (kind === "voice") {
        setText("");
        const { theme }: SealedFiled = await res.json();
        setMsg({ en: `Sealed under "${theme}". It opens only when 5 workers here raise the same issue.`, ta: SEALED_TA });
        speak(SEALED_TA);
        return;
      }
      const filed: Filed = await res.json();
      const next = [filed.id, ...ids].slice(0, 20);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      seen.current[filed.id] = "OPEN";
      setIds(next);
      setText("");
      setMsg({ en: `Reported: ${filed.category}, ${filed.severity}.`, ta: said.OPEN });
      speak(said.OPEN);
    } catch {
      setMsg({ en: "Could not send. Please try again.", ta: "அனுப்ப முடியவில்லை." });
    } finally {
      setBusy(false);
    }
  }

  async function toggle() {
    if (rec.current) return rec.current.stop();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMsg({ en: "Microphone blocked. Please type instead.", ta: "தட்டச்சு செய்யவும்." });
      return;
    }
    const type = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
    const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    const started = Date.now();
    const timer = setInterval(() => {
      const s = Math.round((Date.now() - started) / 1000);
      setSeconds(s);
      if (s >= 60 && r.state === "recording") r.stop(); // 60s auto-stop
    }, 500);
    r.ondataavailable = (e) => chunks.push(e.data);
    r.onstop = () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      rec.current = null;
      setRecording(false);
      setSeconds(0);
      const fd = new FormData();
      fd.append("audio", new Blob(chunks, { type: r.mimeType }), "report.webm");
      submit(fd);
    };
    r.start();
    rec.current = r;
    setRecording(true);
  }

  const { ta, en, Icon } = copy[kind];
  return (
    <Card id={kind} Icon={Icon} title={<><span lang="ta">{ta}</span> · {en}</>}>
      <div className="space-y-4">
        {kind === "voice" && (
          <p className="flex gap-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-950">
            <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Water, toilets, wages, how you are treated. Sealed until 5 workers here raise the same issue; your words are
            never shown.
          </p>
        )}
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-pressed={recording}
          className={`flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl px-4 py-4 text-lg font-semibold text-white disabled:opacity-60 ${recording ? "bg-red-700" : "bg-slate-950 hover:bg-slate-800"}`}
        >
          {recording ? <Square aria-hidden="true" className="size-7 fill-current" /> : <Mic aria-hidden="true" className="size-7" />}
          {recording ? (
            <span>Stop and send · {seconds}s / 60s</span>
          ) : (
            <span>
              Tap to speak · <span lang="ta">பேச தட்டவும்</span>
            </span>
          )}
        </button>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData();
            fd.append("text", text);
            submit(fd);
          }}
        >
          <label htmlFor={`${kind}-text`} className="sr-only">
            Or type what is wrong
          </label>
          <input
            id={`${kind}-text`}
            lang="ta"
            value={text}
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
            placeholder="Or type · அல்லது தட்டச்சு"
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-500 bg-white px-3 text-slate-900 placeholder:text-slate-600"
          />
          <button
            disabled={busy || !text.trim()}
            className="min-h-12 rounded-xl bg-slate-950 px-5 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Send
          </button>
        </form>
        <p role="status" className={`font-medium text-slate-900 ${msg ? "rounded-xl bg-slate-50 p-3" : ""}`}>
          {msg && (
            <>
              {msg.en}
              {msg.ta && (
                <>
                  {" · "}
                  <span lang="ta">{msg.ta}</span>
                </>
              )}
            </>
          )}
        </p>
        {reports.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-950">
              <span lang="ta">என் புகார்கள்</span> · My reports
            </h3>
            <ul className="mt-2 space-y-2">
              {reports.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
                  <SeverityBadge severity={r.severity} />
                  <span className="font-semibold capitalize text-slate-900">{r.category}</span>
                  <span className="ml-auto">
                    <StatusBadge status={r.status} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
