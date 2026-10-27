import { Download, Smartphone, Users } from "lucide-react";
import Link from "next/link";
import Card from "@/components/Card";
import { LevelBadge } from "@/components/StatusBadge";
import type { CrewRow } from "@/lib/crew";
import { hours, rupees } from "@/lib/format";

export type CsvFile = { href: string; name: string };

export function ExportLink({ csv, label }: { csv: CsvFile; label: string }) {
  return (
    <a
      href={csv.href}
      download={csv.name}
      className="flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
    >
      {label}
      <Download aria-hidden="true" className="size-4" />
    </a>
  );
}

// Priority columns: phones keep Worker (the name links to the receipt) and Owed; hours and flags fold under the name.
export default function CrewPayTable({ crew, csv }: { crew: CrewRow[]; csv: CsvFile }) {
  return (
    <Card id="crew" title="Crew & pay this week" Icon={Users} aside={<ExportLink csv={csv} label="Export CSV" />}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-sm text-slate-700">
              <th scope="col" className="rounded-l-lg px-3 py-3 font-semibold">Worker</th>
              <th scope="col" className="hidden px-3 font-semibold md:table-cell">Hours</th>
              <th scope="col" className="hidden px-3 font-semibold md:table-cell">Overtime</th>
              <th scope="col" className="hidden px-3 font-semibold lg:table-cell">Rate</th>
              <th scope="col" className="px-3 text-right font-semibold max-sm:rounded-r-lg">Owed</th>
              <th scope="col" className="hidden px-3 font-semibold md:table-cell">Flags</th>
              <th scope="col" className="hidden rounded-r-lg px-3 font-semibold sm:table-cell">
                <span className="sr-only">Worker app</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {crew.map(({ w, pay, flags }) => {
              const chips = flags.length ? (
                flags.map((f) => <LevelBadge key={f.kind} level={f.level} label={f.text} />)
              ) : (
                <span className="text-sm text-emerald-800">OK</span>
              );
              return (
                <tr key={w.id} className="border-b border-slate-100">
                  <td className="px-3 py-4">
                    <Link href={`/w/${w.id}`} className="font-semibold text-slate-950 underline-offset-2 hover:underline">
                      {w.name}
                    </Link>
                    <div className="text-sm text-slate-600">{w.role}</div>
                    <div className="mt-1 text-sm text-slate-800 md:hidden">
                      {hours(pay.totalMinutes)}h · {hours(pay.otMinutes)}h overtime
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 md:hidden">{chips}</div>
                  </td>
                  <td className="hidden px-3 text-slate-900 md:table-cell">{hours(pay.totalMinutes)}h</td>
                  <td className="hidden px-3 font-semibold text-slate-900 md:table-cell">{hours(pay.otMinutes)}h</td>
                  <td className="hidden px-3 text-sm whitespace-nowrap text-slate-700 lg:table-cell">{rupees(pay.ratePaisePerHour)}/h</td>
                  <td className="px-3 text-right font-semibold whitespace-nowrap text-slate-950">{rupees(pay.totalPaise)}</td>
                  <td className="hidden px-3 md:table-cell">
                    <div className="flex flex-wrap gap-1">{chips}</div>
                  </td>
                  <td className="hidden px-3 text-right sm:table-cell">
                    <Link
                      href={`/w/${w.id}`}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      <Smartphone aria-hidden="true" className="size-4" />
                      Receipt<span className="sr-only"> for {w.name}</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
