"use client";

import { useEffect, useRef, useState } from "react";
import type { Severity } from "@/lib/rules";
import type { Status } from "@/lib/store";
import { speak } from "./SpeakButton";
import { SeverityBadge, StatusBadge } from "./StatusBadge";

type Report = { id: string; status: Status; category: string; severity: Severity };

// The worker's phone keeps the random receipt ids; the server never learns who reported.
const KEY = "fairshift.reports";
const said: Record<Status, string> = {
  OPEN: "உங்கள் புகார் பதிவானது.",
  ACKNOWLEDGED: "உங்கள் புகாரை மேலாளர் பார்த்தார்.",
  FIXED: "உங்கள் புகார் சரி செய்யப்பட்டது. நன்றி.",
};

const loadIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};

export default function HazardReporter({ packId }: { packId: string }) {
  const [ids, setIds] = useState<string[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  const seen = useRef<Record<string, Status>>({});

  useEffect(() => {
    const t = setTimeout(() => setIds(loadIds()), 0);
    return () => clearTimeout(t);
  }, []);

  // Poll my receipts every 4s while the page is visible; read status changes aloud.
  useEffect(() => {
    if (!ids.length) return;
    let live = true;
    const tick = async () => {
      if (document.hidden) return;
      const res = await fetch(`/api/hazards?ids=${ids.join(",")}`).catch(() => null);
      if (!res?.ok || !live) return;
      const list: Report[] = await res.json();
      for (const r of list) {
        if (seen.current[r.id] && seen.current[r.id] !== r.status) {
          speak(said[r.status]);
          setMsg(`Update: ${said[r.status]}`);
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
    setBusy(true);
    setMsg("Sending… · அனுப்புகிறது…");
    try {
      const res = await fetch("/api/hazards", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const next = [data.id, ...ids].slice(0, 20);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      seen.current[data.id] = "OPEN";
      setIds(next);
      setText("");
      setMsg(`Reported: ${data.category}, ${data.severity}. · ${said.OPEN}`);
      speak(said.OPEN);
    } catch {
      setMsg("Could not send. Please try again. · அனுப்ப முடியவில்லை.");
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
      setMsg("Microphone blocked. Please type instead. · தட்டச்சு செய்யவும்.");
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

  return (
    <section aria-labelledby="report-h" className="space-y-3 rounded-xl border-2 border-gray-300 p-4">
      <h2 id="report-h" className="text-xl font-bold">
        <span lang="ta">ஆபத்தை தெரிவிக்க</span> · Report danger
      </h2>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={recording}
        className={`min-h-28 w-full rounded-xl px-4 py-4 text-xl font-bold text-white disabled:opacity-60 ${recording ? "bg-red-800" : "bg-blue-800"}`}
      >
        <span aria-hidden="true">{recording ? "■ " : "🎤 "}</span>
        {recording ? `Stop and send · ${seconds}s / 60s` : "Tap to speak · பேச தட்டவும்"}
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
        <label htmlFor="report-text" className="sr-only">
          Or type what is wrong
        </label>
        <input
          id="report-text"
          lang="ta"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or type · அல்லது தட்டச்சு"
          className="min-h-12 flex-1 rounded-lg border-2 border-gray-700 px-3"
        />
        <button disabled={busy || !text.trim()} className="min-h-12 rounded-lg bg-gray-900 px-4 font-semibold text-white disabled:opacity-60">
          Send
        </button>
      </form>
      <p role="status" className="min-h-6 font-medium">
        {msg}
      </p>
      {reports.length > 0 && (
        <div>
          <h3 className="font-bold">
            <span lang="ta">என் புகார்கள்</span> · My reports
          </h3>
          <ul className="mt-2 space-y-2">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-100 p-3">
                <SeverityBadge severity={r.severity} />
                <span className="font-semibold">{r.category}</span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
