import type { ReactNode } from "react";

// Overtime is striped as well as coloured, so it never relies on colour alone.
export const stripes = "repeating-linear-gradient(45deg, transparent 0 5px, rgba(0,0,0,.25) 5px 8px)";

// One day's bar inside a flex row: regular time solid, overtime striped on top. Purely visual: every chart that
// uses it also lists the same numbers for screen readers. `children` is an optional label pinned above the bar.
export function DayBar({
  minutes,
  otMinutes,
  max,
  fill = "bg-indigo-500",
  children,
}: {
  minutes: number;
  otMinutes: number;
  max: number;
  fill?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative flex-1" style={{ height: `${(minutes / max) * 100}%` }}>
      {children}
      <div className="flex h-full flex-col overflow-hidden rounded-lg sm:rounded-xl">
        <div className="bg-amber-400" style={{ height: `${minutes ? (otMinutes / minutes) * 100 : 0}%`, backgroundImage: stripes }} />
        <div className={`flex-1 ${fill}`} />
      </div>
    </div>
  );
}

export function BarLegend({ regular, overtime, fill = "bg-indigo-500" }: { regular: string; overtime: string; fill?: string }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-700">
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className={`size-3 rounded-sm ${fill}`} />
        {regular}
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="size-3 rounded-sm bg-amber-400" style={{ backgroundImage: stripes }} />
        {overtime}
      </li>
    </ul>
  );
}
