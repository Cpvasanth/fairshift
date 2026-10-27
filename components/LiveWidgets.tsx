"use client";

import { Bell, Check, CircleDot, Eye, Lock, LockOpen, Radio, Timer, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { Severity } from "@/lib/rules";
import type { Hazard, Status } from "@/lib/store";
import Kpi from "./Kpi";
import { useLive } from "./live";
import { SeverityBadge } from "./StatusBadge";

export const ago = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ${m % 60}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
};

const open = (hs: Hazard[]) => hs.filter((h) => h.status !== "FIXED");

export function OpenHazardsKpi() {
  const { hazards, now } = useLive();
  const o = open(hazards);
  const high = o.filter((h) => h.severity === "HIGH").length;
  return (
    <Kpi
      label="Open hazards"
      caption="Reported by workers, not yet fixed"
      value={now === null ? "…" : String(o.length)}
      note={high ? `${high} HIGH` : "0 HIGH"}
      tone={high ? "red" : "green"}
      Icon={TriangleAlert}
    />
  );
}

export function FixTimeKpi() {
  const { hazards } = useLive();
  const fixed = hazards.filter((h) => h.fixedAt);
  const avg = fixed.length ? fixed.reduce((a, h) => a + (h.fixedAt! - h.createdAt), 0) / fixed.length : null;
  return (
    <Kpi
      label="Time to fix"
      caption="Average, report to fixed"
      value={avg === null ? "–" : ago(avg)}
      note={`${fixed.length} fixed`}
      tone="indigo"
      Icon={Timer}
    />
  );
}

export function BellLink() {
  const { hazards } = useLive();
  const n = open(hazards).length;
  return (
    <a
      href="#hazards"
      className="relative flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50"
    >
      <Bell aria-hidden="true" className="size-5 text-slate-800" />
      <span className="sr-only">{n} open hazards</span>
      {n > 0 && (
        <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-red-700 px-1.5 text-xs font-bold text-white">
          {n}
        </span>
      )}
    </a>
  );
}

export function LiveStamp() {
  const { now } = useLive();
  return (
    <span className="flex items-center gap-1.5 text-sm text-slate-600">
      <Radio aria-hidden="true" className="size-4 text-emerald-700 motion-safe:animate-pulse" />
      Live{now !== null && ` · ${new Date(now).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`}
    </span>
  );
}

// Semicircle gauge: share of this site's hazards that are fixed.
export function ResolutionGauge() {
  const { hazards } = useLive();
  const fixed = hazards.filter((h) => h.status === "FIXED").length;
  const pct = hazards.length ? Math.round((fixed / hazards.length) * 1000) / 10 : 0;
  return (
    <div>
      <svg viewBox="0 0 220 120" className="mx-auto w-full max-w-72" role="img" aria-label={`${pct}% of hazards fixed`}>
        <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="#e2e8f0" strokeWidth="34" pathLength={100} />
        <path
          d="M 20 110 A 90 90 0 0 1 200 110"
          fill="none"
          stroke="#047857"
          strokeWidth="34"
          pathLength={100}
          strokeDasharray={`${pct} 100`}
        />
        <text x="110" y="100" textAnchor="middle" className="fill-slate-950 text-[28px] font-semibold">
          {pct}%
        </text>
      </svg>
      <p className="mt-2 text-center text-sm text-slate-600">
        {fixed} of {hazards.length} hazards fixed
      </p>
      <ul className="mt-4 flex justify-center gap-6 text-sm font-semibold text-slate-800">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-sm bg-emerald-700" />
          Fixed
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-sm bg-slate-200 ring-1 ring-slate-400" />
          Open or seen
        </li>
      </ul>
    </div>
  );
}

const statusText: Record<Status, { label: string; cls: string; Icon: typeof Eye }> = {
  OPEN: { label: "Open", cls: "text-red-800", Icon: CircleDot },
  ACKNOWLEDGED: { label: "Seen", cls: "text-indigo-800", Icon: Eye },
  FIXED: { label: "Fixed", cls: "text-emerald-800", Icon: Check },
};
const order: Record<Status, number> = { OPEN: 0, ACKNOWLEDGED: 1, FIXED: 2 };
const sevOrder: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function HazardTable() {
  const { hazards, now, setStatus } = useLive();
  const [status, setFilter] = useState<"ALL" | Status>("ALL");
  const [severity, setSeverity] = useState<"ALL" | Severity>("ALL");
  const rows = hazards
    .filter((h) => (status === "ALL" || h.status === status) && (severity === "ALL" || h.severity === severity))
    .sort((a, b) => order[a.status] - order[b.status] || sevOrder[a.severity] - sevOrder[b.severity] || b.createdAt - a.createdAt);
  const select = "min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="f-status">
          Filter by status
        </label>
        <select id="f-status" className={select} value={status} onChange={(e) => setFilter(e.target.value as typeof status)}>
          <option value="ALL">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="ACKNOWLEDGED">Seen</option>
          <option value="FIXED">Fixed</option>
        </select>
        <label className="sr-only" htmlFor="f-sev">
          Filter by severity
        </label>
        <select id="f-sev" className={select} value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
          <option value="ALL">All severities</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
        <span className="ml-auto">
          <LiveStamp />
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="bg-slate-50 text-sm text-slate-700">
              <th scope="col" className="rounded-l-lg px-3 py-3 font-semibold">Hazard</th>
              <th scope="col" className="px-3 font-semibold">Severity</th>
              <th scope="col" className="px-3 font-semibold">Status</th>
              <th scope="col" className="px-3 font-semibold">Reported</th>
              <th scope="col" className="px-3 font-semibold">Time to fix</th>
              <th scope="col" className="rounded-r-lg px-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-600">
                  No hazards match these filters.
                </td>
              </tr>
            )}
            {rows.map((h) => {
              const s = statusText[h.status];
              const fresh = now !== null && h.status === "OPEN" && now - h.createdAt < 10 * 60_000;
              return (
                <tr key={h.id} className={`border-b border-slate-100 align-top ${fresh ? "bg-red-50" : ""}`}>
                  <td className="max-w-md px-3 py-4">
                    <div className="flex items-center gap-2 font-semibold capitalize text-slate-900">
                      {h.category}
                      {fresh && <span className="rounded-full bg-red-700 px-2 text-xs font-bold uppercase text-white">New</span>}
                      {h.needsReview && <span className="rounded-full border border-slate-700 px-2 text-xs normal-case">Needs review</span>}
                    </div>
                    <p className="text-sm text-slate-700">{h.summaryEn}</p>
                    {h.transcript && (
                      <p className="mt-1 text-sm text-slate-600">
                        <span className="sr-only">Original words: </span>
                        <span lang={h.language === "ta" ? "ta" : undefined}>“{h.transcript}”</span>
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <SeverityBadge severity={h.severity} />
                  </td>
                  <td className={`px-3 py-4 font-semibold ${s.cls}`}>
                    <span className="flex items-center gap-1.5">
                      <s.Icon aria-hidden="true" className="size-4" />
                      {s.label}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-slate-700">{now === null ? "" : `${ago(now - h.createdAt)} ago`}</td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-900">{h.fixedAt ? ago(h.fixedAt - h.createdAt) : "–"}</td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      {h.status === "OPEN" && (
                        <button
                          onClick={() => setStatus(h.id, "ACKNOWLEDGED")}
                          className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          Acknowledge
                        </button>
                      )}
                      {h.status !== "FIXED" && (
                        <button
                          onClick={() => setStatus(h.id, "FIXED")}
                          className="min-h-10 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                          Mark fixed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// The server only ever returns groups that reached 5, so a single report can never be seen or traced.
export function SealedList() {
  const { groups } = useLive();
  if (groups.length === 0)
    return (
      <p className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-slate-700">
        <Lock aria-hidden="true" className="size-5" />
        No theme has reached 5 workers yet. Everything stays sealed.
      </p>
    );
  return (
    <ul className="space-y-3">
      {groups.map((g) => (
        <li key={g.theme} className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <p className="flex items-center gap-2 font-semibold capitalize text-violet-950">
            <LockOpen aria-hidden="true" className="size-5" />
            {g.theme}
            <span className="ml-auto rounded-full bg-violet-800 px-2.5 py-0.5 text-xs font-semibold normal-case text-white">
              {g.count} workers
            </span>
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
            {g.summaries.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
