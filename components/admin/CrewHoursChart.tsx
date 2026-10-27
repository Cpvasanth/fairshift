import { ChartColumnBig } from "lucide-react";
import Card from "@/components/Card";
import { BarLegend, DayBar } from "@/components/DayBar";
import { hours, weekday } from "@/lib/format";

type Day = { date: string; minutes: number; otMinutes: number };

// Centred over its bar, but pinned to the card edge on the first and last bar so it never spills out.
function PeakLabel({ title, value, align }: { title: string; value: string; align: string }) {
  return (
    <>
      <div className={`absolute bottom-full mb-2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1 text-center text-white sm:px-3 ${align}`}>
        <div className="text-[11px] text-slate-300">{title}</div>
        <div className="text-base font-semibold leading-tight sm:text-lg">{value}</div>
      </div>
      <span className="absolute bottom-full left-1/2 mb-1 size-2 -translate-x-1/2 rotate-45 bg-slate-950" />
    </>
  );
}

export default function CrewHoursChart({ perDay, dailyHours }: { perDay: Day[]; dailyHours: number }) {
  const max = Math.max(1, ...perDay.map((d) => d.minutes));
  // Every day that ties for the most hours is highlighted; the label sits on the first of them.
  const peaks = perDay.filter((d) => d.minutes === max);
  const edge = (i: number) => (i === 0 ? "left-0" : i === perDay.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2");

  return (
    <Card id="hours" title="Crew hours this week" Icon={ChartColumnBig}>
      <ul className="sr-only">
        {perDay.map((d) => (
          <li key={d.date}>
            {weekday(d.date)} {d.date}: {hours(d.minutes)} hours, {hours(d.otMinutes)} overtime
          </li>
        ))}
      </ul>
      {/* pt-16 leaves room for the peak label above the tallest bar. */}
      <div aria-hidden="true" className="flex h-72 items-end gap-1.5 pt-16 sm:gap-3">
        {perDay.map((d, i) => (
          <DayBar key={d.date} minutes={d.minutes} otMinutes={d.otMinutes} max={max} fill={d.minutes === max ? "bg-indigo-500" : "bg-indigo-200"}>
            {d.date === peaks[0]?.date && (
              <PeakLabel title={peaks.length > 1 ? `Peak, ${peaks.length} days` : "Peak day"} value={`${hours(d.minutes)}h`} align={edge(i)} />
            )}
          </DayBar>
        ))}
      </div>
      <div aria-hidden="true" className="mt-3 flex gap-1.5 sm:gap-3">
        {perDay.map((d) => (
          <div key={d.date} className="flex-1 text-center">
            <div className="text-sm font-medium text-slate-800 sm:text-base">{weekday(d.date)}</div>
            <div className="text-xs text-slate-600">{hours(d.minutes)}h</div>
          </div>
        ))}
      </div>
      <BarLegend regular="Regular hours" overtime={`Overtime beyond ${dailyHours}h per worker`} fill="bg-indigo-200" />
    </Card>
  );
}
