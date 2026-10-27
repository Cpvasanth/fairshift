import { Check, CircleDot, Eye, TriangleAlert } from "lucide-react";
import type { Hazard, Status } from "@/lib/store";
import { SeverityBadge } from "./StatusBadge";

const steps: { status: Status; label: string; Icon: typeof Eye }[] = [
  { status: "OPEN", label: "Reported", Icon: CircleDot },
  { status: "ACKNOWLEDGED", label: "Seen", Icon: Eye },
  { status: "FIXED", label: "Fixed", Icon: Check },
];
const order: Record<Status, number> = { OPEN: 0, ACKNOWLEDGED: 1, FIXED: 2 };
const sevOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const edge = { HIGH: "border-l-red-600", MEDIUM: "border-l-amber-500", LOW: "border-l-emerald-600" };

export const ago = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ${m % 60}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
};

// Unresolved first, then by severity, then newest.
const sortHazards = (a: Hazard, b: Hazard) =>
  order[a.status] - order[b.status] || sevOrder[a.severity] - sevOrder[b.severity] || b.createdAt - a.createdAt;

export default function HazardBoard({
  hazards,
  now,
  onStatus,
}: {
  hazards: Hazard[];
  now: number;
  onStatus: (id: string, status: Status) => void;
}) {
  if (hazards.length === 0)
    return <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">No hazards reported.</p>;
  return (
    <ul aria-live="polite" className="space-y-3">
      {[...hazards].sort(sortHazards).map((h) => {
        const fresh = h.status === "OPEN" && now - h.createdAt < 10 * 60_000;
        return (
          <li
            key={h.id}
            className={`rounded-2xl border border-l-8 bg-white p-4 shadow-sm ${edge[h.severity]} ${h.status === "FIXED" ? "border-slate-200 opacity-80" : "border-slate-300"} ${fresh ? "ring-2 ring-red-600 ring-offset-2" : ""}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={h.severity} />
              <h3 className="flex items-center gap-1.5 text-lg font-bold capitalize text-slate-900">
                <TriangleAlert aria-hidden="true" className="size-5 text-slate-700" />
                {h.category}
              </h3>
              {fresh && <span className="rounded-full bg-red-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">New</span>}
              {h.needsReview && (
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs font-semibold">Needs review</span>
              )}
              <span className="ml-auto text-sm text-slate-600">{ago(now - h.createdAt)} ago</span>
            </div>
            <p className="mt-2 text-slate-900">{h.summaryEn}</p>
            {h.transcript && (
              <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
                <span className="sr-only">Original words: </span>
                <span lang={h.language === "ta" ? "ta" : undefined}>“{h.transcript}”</span>
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ol className="flex items-center text-sm" aria-label="Progress">
                {steps.map((s, i) => {
                  const done = order[h.status] >= i;
                  return (
                    <li key={s.status} className="flex items-center" aria-current={h.status === s.status ? "step" : undefined}>
                      {i > 0 && <span aria-hidden="true" className={`mx-1 h-0.5 w-5 ${done ? "bg-emerald-700" : "bg-slate-300"}`} />}
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${done ? "bg-emerald-50 text-emerald-800" : "text-slate-600"}`}
                      >
                        <s.Icon aria-hidden="true" className="size-4" />
                        {s.label}
                        <span className="sr-only">{done ? " (done)" : " (pending)"}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              {h.fixedAt && <span className="text-sm text-slate-600">fixed in {ago(h.fixedAt - h.createdAt)}</span>}
              <div className="ml-auto flex gap-2">
                {h.status === "OPEN" && (
                  <button
                    onClick={() => onStatus(h.id, "ACKNOWLEDGED")}
                    className="min-h-11 rounded-lg bg-indigo-700 px-4 font-semibold text-white hover:bg-indigo-800"
                  >
                    Acknowledge
                  </button>
                )}
                {h.status !== "FIXED" && (
                  <button
                    onClick={() => onStatus(h.id, "FIXED")}
                    className="min-h-11 rounded-lg bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800"
                  >
                    Mark fixed
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
