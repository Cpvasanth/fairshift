"use client";

import { useEffect, useRef, useState } from "react";
import type { Hazard, Status } from "@/lib/store";
import { SeverityBadge, StatusBadge } from "./StatusBadge";

const time = (t: number) => new Date(t).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

export default function HazardBoard({ packId }: { packId: string }) {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const version = useRef("");

  // Poll every 4s; the server answers 204 when nothing changed. Pauses while the tab is hidden.
  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      const res = await fetch(`/api/hazards?v=${version.current}`).catch(() => null);
      if (res?.status !== 200) return;
      const data = await res.json();
      version.current = String(data.version);
      setHazards(data.hazards);
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, []);

  async function setStatus(id: string, status: Status) {
    setHazards((hs) => hs.map((h) => (h.id === id ? { ...h, status } : h)));
    await fetch("/api/hazards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => null);
  }

  const list = hazards.filter((h) => h.packId === packId);
  return (
    <ul aria-live="polite" className="space-y-3">
      {list.length === 0 && <li className="text-gray-700">No hazards reported.</li>}
      {list.map((h) => (
        <li key={h.id} className={`rounded-xl border-2 p-4 ${h.status === "FIXED" ? "border-gray-300" : "border-gray-700"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={h.severity} />
            <span className="text-lg font-bold capitalize">{h.category}</span>
            <StatusBadge status={h.status} />
            {h.needsReview && <span className="rounded border border-gray-700 px-2 text-sm">Needs review</span>}
            <span className="ml-auto text-sm text-gray-700">{time(h.createdAt)}</span>
          </div>
          <p className="mt-2">{h.summaryEn}</p>
          {h.transcript && (
            <p className="mt-1 text-gray-700">
              Original: <span lang={h.language === "ta" ? "ta" : undefined}>{h.transcript}</span>
            </p>
          )}
          <div className="mt-3 flex gap-2">
            {h.status === "OPEN" && (
              <button onClick={() => setStatus(h.id, "ACKNOWLEDGED")} className="min-h-12 rounded-lg bg-blue-800 px-4 font-semibold text-white">
                Acknowledge
              </button>
            )}
            {h.status !== "FIXED" && (
              <button onClick={() => setStatus(h.id, "FIXED")} className="min-h-12 rounded-lg bg-green-800 px-4 font-semibold text-white">
                Mark fixed
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
