import { Grid3x3 } from "lucide-react";
import Card from "@/components/Card";
import type { CrewRow } from "@/lib/crew";
import { hours, weekday } from "@/lib/format";

// Colour steps by hours worked that day; every step keeps its text at 4.5:1 or better.
const steps = [
  { upTo: 0, cls: "bg-slate-100 text-slate-600", label: "" },
  { upTo: 8, cls: "bg-orange-100 text-orange-950", label: "≤ 8h" },
  { upTo: 10, cls: "bg-orange-300 text-orange-950", label: "≤ 10h" },
  { upTo: 12, cls: "bg-orange-500 text-slate-950", label: "≤ 12h" },
  { upTo: Infinity, cls: "bg-orange-700 text-white", label: "> 12h" },
];
const heat = (h: number) => (steps.find((s) => h <= s.upTo) ?? steps[steps.length - 1]).cls;

export default function ShiftHeatmap({ crew, dates, longest }: { crew: CrewRow[]; dates: string[]; longest?: CrewRow }) {
  return (
    <Card id="heat" title="Shift heatmap" Icon={Grid3x3}>
      {longest && (
        <p className="mb-5 flex flex-wrap items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight text-slate-950">{hours(longest.pay.totalMinutes)}h</span>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-red-200">
            {hours(longest.pay.otMinutes)}h overtime
          </span>
          <span className="text-sm text-slate-600">longest week: {longest.w.name}</span>
        </p>
      )}
      {/* Fixed layout: seven equal day columns that fit a 390px phone without scrolling. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] table-fixed border-separate border-spacing-0.5 text-center sm:border-spacing-1">
          <caption className="sr-only">Hours worked per worker per day, last 7 days</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[4.5rem] text-left text-xs font-medium text-slate-600 sm:w-24">
                <span className="sr-only">Worker</span>
              </th>
              {dates.map((d) => (
                <th key={d} scope="col" className="text-xs font-medium text-slate-600">
                  {weekday(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crew.map((c) => (
              <tr key={c.w.id}>
                <th scope="row" className="truncate pr-1 text-left text-sm font-semibold text-slate-900 sm:pr-2">
                  {c.w.name}
                </th>
                {dates.map((d) => {
                  const h = hours(c.pay.days.find((x) => x.date === d)?.minutes ?? 0);
                  return (
                    <td key={d} className={`h-11 rounded-md text-xs font-semibold sm:h-14 sm:rounded-lg sm:text-sm ${heat(h)}`}>
                      {h ? `${h}h` : <span aria-label="no shift">–</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-700">
        {steps.slice(1).map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-3 rounded-sm ring-1 ring-inset ring-black/20 ${s.cls}`} />
            {s.label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
