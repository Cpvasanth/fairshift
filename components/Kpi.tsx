import type { TriangleAlert } from "lucide-react";

export type Tone = "red" | "green" | "amber" | "indigo" | "slate";

const chip: Record<Tone, string> = {
  red: "bg-red-50 text-red-800 ring-red-200",
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-50 text-amber-900 ring-amber-200",
  indigo: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

// One key figure inside the welcome card; works in server and client components.
export default function Kpi({
  label,
  caption,
  value,
  note,
  tone,
  Icon,
}: {
  label: string;
  caption: string;
  value: string;
  note: string;
  tone: Tone;
  Icon: typeof TriangleAlert;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 py-4 sm:px-6 sm:first:pl-0 lg:py-1">
      <dt className="flex items-start gap-3">
        <span className="flex-1">
          <span className="block text-base font-semibold text-slate-900">{label}</span>
          <span className="block text-sm text-slate-600">{caption}</span>
        </span>
        <Icon aria-hidden="true" className="size-6 shrink-0 text-slate-500" strokeWidth={1.5} />
      </dt>
      <dd className="flex flex-wrap items-center gap-2">
        <span className="text-4xl font-semibold tracking-tight text-slate-950 xl:text-5xl">{value}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${chip[tone]}`}>{note}</span>
      </dd>
    </div>
  );
}
